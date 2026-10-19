---
name: lkk-mobile-audit
description: 稽核練健康官網的行動裝置可讀性（字級、觸控目標、水平溢出、iOS 聚焦自動放大），或修正業主回饋「手機版不好讀／不好點／跑版」時使用。內含可直接貼的量測腳本、判定門檻、四種會誤報的情況、2026-09-01 全站盤點的基準值，以及 iOS 的 input[type=date] 撐破容器與修完之後空值高度塌陷這組兩段式問題（含「Chromium 重現不了，只能請業主用 iPhone 驗」這個驗證限制）。
---

# 行動裝置可讀性稽核

> 客群是**中高齡**，字級與觸控目標的權重比一般網站高很多。
> 對比量測另見 `lkk-image-swap`；品牌色與各 token 的對比表見記憶 `lkk-web-brand-colors`。

---

## 🔴 iOS 的 `input[type=date]` 會撐破容器，而且修完會換一個症狀

2026-10-15 業主用 iPhone 回報：`/booking` 的「出生年月日」整欄凸出卡片外。

### 成因是兩件事疊加，少修一個都沒用

```
1. iOS 的日期輸入框有「原生最小寬度」—— 由裡面那串日期文字決定。
   width:100%（Tailwind 的 w-full）壓不下去，px-4 的 32px 內距還要再加上去。

2. 它外層是 grid item，而 grid item 預設 min-width:auto ——
   不會縮到比內容的 min-content 還窄，於是整欄被頂出去。
```

`body` 有 `overflow-x:hidden`，所以頁面不會橫向捲動，**看起來就是框破出去但滑不動**。

### 修正（放 `assets/css/main.css` 的 `@layer base`，全域）

```css
input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
  min-width: 0;        /* 解開 grid item 的 min-width:auto */
  max-width: 100%;
}
input[type="date"]::-webkit-date-and-time-value {
  text-align: left;    /* iOS 會把日期置中，跟隔壁欄位不一致 */
  min-width: 0;        /* 跟外層一起解開，避免偽元素自己把框撐開 */
}
```

放全域而不是只改那一個欄位，是因為後台名單的篩選列也有兩個 `type="date"`。
`appearance:none` **不影響點擊開啟日期選擇器**（Chrome 實測日曆圖示仍在）。

### ⚠️ 第二段：修完之後空值時高度會塌

`appearance:none` 拿掉原生外觀後，**iOS 在「尚未選日期」時不渲染任何文字** →
內容高度 0 → 整欄只剩 `py-3` 的 24px ＋ border 2 ＝ 26px，比隔壁欄位矮一截。
有填日期時不會矮（有文字撐著），所以只在空值狀態看得到。

補在那一個欄位上（**不要放全域**）：

```
min-h-[50px]      50 = 文字 24（text-base 的 line-height）＋ py-3 上下 24 ＋ border 2
```

那是同一排其他欄位算出來的同一個數字（本機實測「姓名」「性別下拉」皆為 50px）。
不放全域是因為後台篩選列的日期欄是 `py-1.5 text-sm`，釘 50px 會把它撐高。

### 🔴 這類 iOS 專屬問題在 Chromium 重現不了

Chromium 的日期框沒有那個原生最小寬度，**根本不會重現這個 bug**。
所以本機瀏覽器只能證明「沒弄壞」，**不能證明「修好了」**。

這次來回兩次就是卡在這。做法：

1. 動手前就跟業主說清楚「這題只能你用 iPhone 驗」，不要讓他以為我驗過了
2. commit 訊息裡明寫驗證邊界
3. 本機能驗的照驗（樣式有沒有套用、與隔壁欄位是否等寬等高、有無水平溢出）

iOS 模擬器需要**完整 Xcode**（只有 command-line tools 開不起來），
要啟用得請業主自己裝 Xcode 並執行 `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`。

### iOS 日期欄的另外兩個行為（2026-10-19，讀 WebKit 原始碼）

- **空值點開會停在今天，而且立刻把今天寫進欄位**（`WKDateTimeInputControl.mm`）。
- **iPhone 的選擇器不理 `min`／`max`**（範圍寫死成 distantPast～西元 10000 年），
  頁面沒有 `<form>` 時就要自己在送出前檢查範圍。
- 預約表單的生日欄因此改成「點下去時先帶 1961-01-01、標成未確認」（手機與電腦都是），細節見 [[lkk-booking-form]]。

---

## 前置：讓瀏覽器真的變成手機尺寸

```
mcp__Claude_Browser__resize_window  preset: "mobile"   → 375×812
```

⚠️ **面板被收合時 `window.innerWidth` 會回傳 0，所有量測變成垃圾**
（`sectionW: 0`、`ratio: "0.000"`、高度是塌陷後的重排值）。
先跑 `({vw: innerWidth})` 確認拿到 375 再開始，不要拿 0 的結果下結論。
`resize_window` 的模擬**不受面板顯示與否影響**，比 `computer{action:"screenshot"}` 可靠——
截圖在面板隱藏時會逾時或回傳過期畫面。

量完**務必 `preset: "desktop"` 還原**，模擬會跨頁面持續生效。

---

## 稽核腳本（貼進 javascript_tool）

```js
const vw=innerWidth, cls=e=>(e.className?.baseVal??e.className??'').toString().slice(0,44);
// 超出視窗寬度、且沒有被 overflow 容器包住的元素
const wide=[...document.querySelectorAll('body *')].filter(e=>{
  const r=e.getBoundingClientRect(); if(r.width<=vw+1||r.height<=0) return false;
  let p=e.parentElement;
  while(p&&p!==document.body){ const o=getComputedStyle(p).overflowX;
    if(o==='auto'||o==='scroll'||o==='hidden') return false; p=p.parentElement; }
  return true;
}).map(e=>({tag:e.tagName,cls:cls(e),w:Math.round(e.getBoundingClientRect().width)}));
// 被 truncate 切掉的文字（資訊遺失，不只是美觀）
const trunc=[...document.querySelectorAll('*')].filter(e=>
  e.clientWidth>0 && e.scrollWidth>e.clientWidth+4 &&
  getComputedStyle(e).textOverflow==='ellipsis'
).map(e=>({cls:cls(e),cut:e.scrollWidth-e.clientWidth,txt:(e.textContent||'').trim().slice(0,18)}));
// 小字（只看葉節點，內容夠長才算正文）
const small=[...document.querySelectorAll('p,li,td,span,div,dd,label')].filter(e=>{
  if(e.children.length) return false;
  const t=(e.textContent||'').trim(); if(t.length<12) return false;
  return parseFloat(getComputedStyle(e).fontSize)<14;
}).map(e=>({fs:getComputedStyle(e).fontSize,txt:e.textContent.trim().slice(0,24)}));
// ★ iOS 聚焦自動放大
const inputs=[...document.querySelectorAll('input,select,textarea')]
  .map(e=>({t:e.type||e.tagName,fs:getComputedStyle(e).fontSize,cls:cls(e)}));
const zoomRisk=inputs.filter(i=>parseFloat(i.fs)<16 && !i.cls.includes('sr-only'));
// 觸控目標
const tap=[...document.querySelectorAll('a,button,summary')].filter(e=>{
  const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&r.height<40;
}).map(e=>({tag:e.tagName,h:Math.round(e.getBoundingClientRect().height),
            txt:(e.textContent||'').trim().slice(0,16)}));
({vw, overflow:document.body.scrollWidth-vw, wide, trunc,
  smallN:small.length, small:small.slice(0,5),
  iosZoomRisk:zoomRisk.length, zoomSample:zoomRisk.slice(0,3),
  tapN:tap.length, tap:tap.slice(0,6), docH:document.body.scrollHeight})
```

## 判定門檻

| 項目 | 門檻 | 說明 |
|---|---|---|
| 水平溢出 | `document.body.scrollWidth === innerWidth` | 不等於就是破版 |
| 正文字級 | **≥ 14px** | 徽章／版權可 12px，10–11px 一律不行 |
| **輸入框字級** | **≥ 16px** | 低於 16 → **iOS Safari 聚焦時自動縮放整頁** |
| 觸控目標 | 建議 44px、WCAG 下限 24px | 20px 連下限都不到 |
| 文字對比 | 4.5（小字）／3.0（≥24px 或 ≥18.66px 粗體） | |
| 圖示對比 | 3.0 | |

---

## ⚠️ 四種會誤報的情況（都真的踩過）

**1. `peer sr-only` 的隱藏 input**
自訂樣式的 radio/checkbox 會把真正的 input 藏起來（`sr-only`），字級留在 14px。
使用者點的是外層 `<label>`，**iOS 不會對它觸發縮放**。腳本已用 `!cls.includes('sr-only')` 排除。

**2. `<label>` 被當成觸控目標**
欄位標籤（「學員姓名 *」）是說明文字不是按鈕，高度 20px 很正常。
腳本的 tap 選擇器**刻意不含 `label`**；若要看真正的選項標籤，另外撈 `label:has(input)`。

**3. `overflow-x-auto` 裡的寬表格**
`min-w-[640px]` 的表格塞進 277px 容器是**刻意設計**，不是破版——
腳本的 wide 已往上追溯父層的 `overflowX` 並排除。要不要改成卡片式是設計決策，不是 bug。

**4. grep 到 CSS bundle 而不是版面標籤**
Tailwind 會把全站用到的 class 定義打包進**每一頁**的樣式表。
`grep -c 'bg-navy-800'` 會抓到 `.bg-navy-800{...}` 與 `.hover\:bg-navy-800:hover`。
**要比對版面就限定在標籤裡**：`grep -o '<section[^>]*class="[^"]*"' | grep -c 'bg-navy-800'`。

---

## ⚠️ `text-xs` 掃描抓不到自訂 rem 字級

這個 repo 有大量 `text-[0.82rem]`、`text-[0.68rem]` 這類任意值，
**只 grep `text-xs` 會漏掉一半**。兩個都要掃：

```bash
grep -n 'text-xs' 檔案
grep -n 'text-\[0\.[0-9]*rem\]' 檔案   # 換算：0.68rem=10.9px、0.78=12.5、0.86=13.8、0.95=15.2
```

`/booking` 與 `/group-booking` 都是先漏掉、實測才抓到的。

---

## 2026-09-01 全站盤點基準

掃過首頁、about、services、booking、group-booking、lkk4、lkk-academy、
locations、locations/[store]、team-intro/coaches、news。

**結構沒問題**：每頁 `scrollWidth === 375`，零水平溢出。問題全在字級與觸控。

**已修**
- Footer 分店名 12px／電話 10px → 14px，電話對比 2.90 → 5.51（影響每一頁）
- Footer 社群圖示 ×6：20×20 → 44×44（`w-11 h-11 -m-2.5`，容器補 `-ml-2.5` 保左緣）
- 研習課程 `<summary>`：20px → 44px（`py-3 -my-1`）
- 教練職稱移除 `truncate`：11 字被切成 8 字（144px 塞進 122px）
- `/booking` 14 處內文 → 14px，含健康聲明條款
- `/group-booking`：**輸入框 15.2px → 16px（iOS 縮放）**、錯誤訊息 red-500(3.76) →
  red-600(4.83) 且 12px → 14px、15 處自訂 rem 全部歸零、`ink/40|45|50` 全部改 `ink/65`
- 首頁媒體連結：高 20px → 40px、`ink/50`(3.23) → `ink/70`(6.41)

**業主 2026-09-01 決定不修**
- Footer 文字連結觸控高度 14–24px（快速連結／信箱／官方帳號／隱私權政策／四間分店）

**未處理，另議**
- `/group-booking` 27 處寫死的 `text-[#1a3545]`（應為 navy token，同 `/lkk-academy` 那次的偏移）
- 標題與價格的橘色強調字：`text-orange` 米底 2.44，連大字 3.0 都不到（業主先前緩議）
- LKK4 重量表在手機上要橫向拖七欄
- 頁面長度：LKK4 13,367px（約 16 螢幕）、教練頁 11,237px、首頁 9,313px

---

## 修法慣例

- 觸控區用 **`w-11 h-11` ＋ 負邊距**（`-m-2.5`）撐開但不推移版面，容器補等量負邊距保對齊
- 文字連結補 `py-2.5 -my-1`，並把外層的 `gap-y-4` 降成 `gap-y-1` 抵銷高度增加
- 顏色改動一律先量：`ink/40`(2.46) `ink/45`(2.81) `ink/50`(3.23) 都不合格，**`ink/65`(5.11) 是下限**
- 表單錯誤訊息**至少 `red-600`**（`red-500` 在白底只有 3.76）
- 改完用 `npm run build` 的**結束碼**判斷，推 dev 後從**原始碼複製**標記輪詢
  （錯誤訊息、下拉項這類藏在 `v-if` 後面的東西 SSR HTML 沒有，要驗就改看 client chunk
  或用瀏覽器觸發，見記憶 `lkk-web-gotchas` 第 21 條）
