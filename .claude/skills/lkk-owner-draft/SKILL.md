---
name: lkk-owner-draft
description: 業主丟一份 HTML／zip 版型草稿說「照這個調整某頁」時使用。內含草稿的拆解方式（base64 圖檔取出、樣式剝離）、動手前一定要先釐清的取捨、以及三個實際踩過的坑：草稿會夾帶隱形死碼、草稿配色不能照抄、草稿會默默砍掉報名者需要的硬資訊。
---

# 業主版型草稿改版流程

2026-08-31 `/about`（來自 `lkk-wellness-full.zip`）、2026-09-01 `/lkk4`（來自 `lkk4 (1).html`）
都走過這個流程。草稿通常是 AI 生成的單檔 HTML，內嵌 base64 圖、自帶一套 CSS 變數。

---

## 第一步：拆草稿，不要直接讀

單檔 HTML 動輒 400KB 但只有幾百行 —— 幾乎都是 base64。先剝掉再讀：

```python
import io, re, base64
s = io.open(SRC, encoding='utf-8', errors='replace').read()

# 取出內嵌圖檔（這些是業主的素材，要存進 public/images/）
for i, (ext, b) in enumerate(re.findall(r'data:image/([a-z+]*);base64,([A-Za-z0-9+/=]+)', s), 1):
    open(f'ref_img{i}.{ext}', 'wb').write(base64.b64decode(b))

# 剝掉 base64 與 <style> 之後才好讀結構
s = re.sub(r'data:image/[a-z+]*;base64,[A-Za-z0-9+/=\s]+', 'DATA_URI_IMG', s)
s = re.sub(r'<style[\s\S]*?</style>', '<!--STYLE-->', s)
```

**取出來的圖一定要用 Read 看過**。`/lkk4` 那次靠這步才發現草稿用的是「有標題的完整版主視覺」，
而站上存的是「空白框版本」——兩張是不同的圖，不看就會以為只是換位置。

中文檔名的 zip 用 `lkk-image-swap` 裡的編碼解法。

看結構用：`grep -n -o '<section[^>]*>\|<h[1-3][^>]*>' 剝過的檔`
看配色用：把 `<style>` 裡的 `:root` 與各 section 的 background 抽出來。

---

## 第二步：跟現有頁面對照，先分清楚「衝突」與「取捨」

**衝突**＝草稿與站上講的是不同的事實（日期、賽制、價格）。這種不能猜，要問。
**取捨**＝草稿刪掉了站上原本有的東西。這種也要問，但方向不同。

`/lkk4` 那次看起來有個賽制衝突：草稿講「四大功能挑戰」，站上 `stations` 只有三關。
**實際上不衝突** —— 草稿自己的路線圖海報標的是 `Stage 01 / Stage 02+03 / Stage 04`，
也就是「3 關、4 個項目」，跟站上一致。**先把草稿裡的圖也讀完再判定衝突**，
不要只比對文字就下結論。

`/lkk-academy` 那次的教訓：業主說「新增一個頁面」，但那頁其實已經存在，
而且草稿的註解自己寫著「由舊課程報名頁重製」並列出刪除項。**草稿的註解要讀**。

---

## 第三步：動手前一定要問的四件事

這四題每次都適用，一次問完（`/lkk4` 那次業主的回答附在後面）：

1. **草稿刪掉的硬資訊怎麼辦**
   AI 生成的草稿走「先打動人」路線，很愛把費用、規格表、尺寸表、查詢入口整批省略。
   這些是使用者真正要查的東西。選項：全部保留移到後段／只留關鍵／照草稿拿掉。
   → `/lkk4` 業主選「全部保留，移到後段」。

2. **草稿新增的互動功能要不要做**（測驗、計算器、手風琴）
   → `/lkk4` 業主選「要做」，用 Vue 的 `ref`/`computed` 重寫，不要照抄草稿的原生 DOM 操作。

3. **草稿的視覺主題要導入到什麼程度**（票券框、特殊卡片、裝飾線）
   選項：只用在 Hero 與關鍵區塊／全頁採用／不用，只取內容架構。
   → `/lkk4` 業主選「全頁採用」，於是做成 `components/lkk4/Ticket.vue`。

4. **Hero 要不要照草稿的做法**
   草稿常把標題燒在主視覺圖裡當前景圖。這樣視覺完整但 SEO 讀不到標題。
   → 若採用，**務必補一個 `sr-only` 的 `<h1>` 與完整 alt**。

---

## ⚠️ 三個實際踩過的坑

### 1. 草稿配色不能照抄

草稿自帶一套 `:root` 變數，跟站上 token 很像但不是同一組。
`/lkk4` 草稿用 `#004B69`／`#EC6F00`／`#F5F0E4`，站上是 `#2A5269`／`#FB720A`／`#F5EFE4`。

**一律換成站上 token**（業主 `/about` 那次明確說過「配色不要，維持原本的」），
換完**重新量對比**，因為底色一變、原本合格的字色可能就不合格了。

`/lkk4` 全頁改成 navy-700 底之後實測：
白 8.37、cream 7.31、white/75 5.54、orange-300 4.96 都過，
但 **orange DEFAULT 只有 2.99**（連大字的 3.0 都差一點）→ 票券外的橘字一律改 `orange-300`。
品牌色與各 token 的完整對比表見記憶 `lkk-web-brand-colors`。

### 2. 草稿裡有隱形的死碼，照抄會一起帶進來

`/lkk4` 草稿的票券頂部有一排三角旗，`fill` 是 `#F5F0E4` —— **跟票券底色同一個顏色**。
在業主自己的草稿裡它本來就看不見。我照抄了，結果是 38px 的空白。

**心法：草稿裡任何「看起來有但說不出它在做什麼」的元素，實作後要用瀏覽器實測確認它真的看得見。**
用 `javascript_tool` 讀 computed style 比截圖可靠：

```js
const el = document.querySelector('...');
({ fill: el.getAttribute('fill'), parentBg: getComputedStyle(el.closest('.card')).backgroundColor })
```

### 3. 別憑印象挑輪詢標記

`/lkk4` 與研習課程各錯一次：一次是業主給的文案是 `Coach Development Program`
但版面 `uppercase`、原始碼寫的是 `01 · COACH DEVELOPMENT PROGRAM`；
一次是用了 `id="faculty"`，而那個 section **根本沒有 id**。兩次都是假逾時。
**標記一律從原始碼複製貼上**，細節見記憶 `lkk-web-gotchas` 第 21 條。

---

## 實作慣例

- 重複 3 次以上的視覺元件抽成 component（`components/lkk4/Ticket.vue` 用了 9 次）
- 摺角、缺角這類造型用 `clip-path` 的絕對定位 span，**不要用 CSS 漸層**
  （漸層要精算角度與尺寸，圓角一改就得重算；span 貼在 `-3px`（外框寬）永遠對齊）
- 草稿的原生 JS 一律改寫成 Vue 的 `ref`/`computed`
- 摺疊區塊用原生 `<details>`，不要自己寫 JS
- 依 CLAUDE.md：不用 Emoji，圖示一律 SVG
- 草稿裡寫死的站內連結（常見是 dev 網址）改成 `<NuxtLink to="...">`

## 收尾

1. `npm run build`，**用結束碼 `$?` 判斷**，不要 grep（grep 找到 "ERROR" 會回傳 0）
2. 推 dev，用從原始碼複製的標記輪詢
3. 用瀏覽器實測：`javascript_tool` 量對比、跑一遍互動、`resize_window` 到 mobile
   確認 `document.body.scrollWidth === window.innerWidth`（無水平溢出）
4. **自己判斷刪掉的區塊要跟業主講**，不要默默拿掉
5. 草稿帶進來的新資訊（規則、條款、日期）若站上原本沒有，**上 prod 前請業主核對**
