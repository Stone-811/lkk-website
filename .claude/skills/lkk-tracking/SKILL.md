---
name: lkk-tracking
description: 練健康官網的分析與廣告追蹤層（GTM、GA4、Google Ads、Facebook Pixel、Microsoft Clarity、漸強實驗室）。當被問「為什麼載入這些第三方」「轉換為什麼是 0」「右下角那顆按鈕哪來的」「GA4 要用哪一個」「UTM 有沒有生效」，或要動 plugins/gtm.client.ts、app.vue 的 noscript、表單成功區塊時使用。內含容器實際內容的實測結果、三個 GA4 編號的來歷，以及兩個只有瀏覽器看得到的地雷。
---

# 分析與廣告追蹤層

> 2026-09-25～30 實測。容器內容全部來自實際抓取 `gtm.js` 與瀏覽器觀測，不是推論。

## 架構一句話

**全站只裝一個 GTM 容器，其他追蹤器都在容器裡面。**
本站程式碼裡沒有任何 GA4／Pixel／Ads 的編號。

```
plugins/gtm.client.ts   注入 GTM-5X328JSM（只在 lkkwellness.com）
app.vue                 <body> 開頭的 noscript（伺服器端輸出）
```

⚠️ **容器內容不在本專案的版本控制內。** 網站上實際跑什麼由 GTM 後台決定，
有權限的人可以隨時加腳本上線、不需要部署、不會留在 git。
排查「網站變慢」或「多了奇怪的東西」時，除了程式碼一定要一起看 GTM。

## 容器實際載入什麼（2026-09-25 抓 gtm.js 實測）

```
GTM-5X328JSM      容器本身
G-0YKEEDEETZ      GA4（舊站也在用的那一個）
G-DKE9TGKTRX      GA4 ← 🔴 業主文件沒有、兩個網站都沒直接用，來源不明
AW-18034628987    Google Ads（轉換 ＋ 再行銷）
```

### 🔴 靜態分析看不到的兩個服務

抓 `gtm.js` 只找得到上面四個。**用瀏覽器實際載入才看得到**還有：

| 域名 | 服務 | 請求數 |
|---|---|---|
| `clarity.ms` | **Microsoft Clarity** — 錄製使用者操作、產生熱點圖 | 5 |
| `cresclab.com` | **漸強實驗室** — 右下角那顆 Messenger 按鈕 | **11** |

👉 **編譯後的 GTM 容器讀不出「自訂 HTML 標籤」裡有什麼。**
要知道容器真正會做什麼，只能用瀏覽器載入再看 `performance.getEntriesByType('resource')`。

```js
// 瀏覽器主控台：容器到底拉了誰
const third = performance.getEntriesByType('resource')
  .filter(e => !e.name.includes('lkkwellness.com'))
;[...new Set(third.map(u => new URL(u.name).hostname))]
```

實測第三方請求數從 **2 個變成 27 個**，最晚的一支在 **2,289 毫秒**才結束。
伺服器端速度不受影響（文章頁仍是 CDN 命中 0.09 秒），變慢的是瀏覽器端。

## 三個 GA4 編號的來歷

```
G-0YKEEDEETZ   舊站網頁上直接有，容器裡也有
G-DKE9TGKTRX   只藏在容器裡，業主提供的 Excel 完全沒提到
G-DSQC1NTPJ3   本站原本的獨立碼，2026-09-25 已移除
```

⚠️ 業主給的 Excel 裡**一個 GA4 編號都沒有**，只有 `GTM-5X328JSM`。
所以「只用 Excel 的 GA4」這個做法不存在——裝上容器就等於同時裝上裡面那兩個。

要只用其中一個，必須請代操**進容器停用另一個標籤**，不是我們這邊改。

📌 判斷三個編號各屬於哪個資源：GA4 後台 →「管理」→「資料串流」，
每條串流會顯示編號、網站網址與所屬資源。**兩個不同編號可能是同一資源的兩條串流
（資料本來就在一起），也可能是兩個資源（無法事後合併）。** 不查就不知道。

## 🔴 轉換為什麼是 0：選擇器指向不存在的元素

容器的轉換觸發類型是「**元素顯示時觸發**」（`gtm.elementVisibility`），選擇器是：

```
#wpcf7-f12508-p7640-o1 .wpcf7-response-output
#wpcf7-f7637-p7640-o1 > form > div.wpcf7-response-output
```

那是**舊站 Contact Form 7 的成功訊息區塊**，本站沒有這種元素。

本站四張表單送出成功後的行為：

```js
isSuccess.value = true   // 同一頁顯示成功區塊，網址完全不變
```

**沒有感謝頁、沒有網址變化**，所以任何「到達某網址＝轉換」的設定在本站都不會觸發。

### 已經備好的對接點

四張表單的成功區塊都加了固定標記：

```html
<div v-if="isSuccess" id="lead-success" data-form="booking">
```

`data-form` 的值：`booking`／`group-booking`／`cooperation`／`franchise`。

**請代操把選擇器改成 `#lead-success` 即可，觸發類型不用改。**

### 為什麼不做感謝頁

討論過但否決：**感謝頁是一個網址，任何人都能直接打開、重新整理也會再算一次**，
轉換數會比實際名單多。而「元素顯示時觸發」只有真的送出成功才會發生。

## 兩個只有瀏覽器看得到的地雷

### 1. 容器會自己改變網站外觀

漸強實驗室的標籤在右下角注入一顆 Messenger 按鈕（`right:24 / bottom:24`、
56px、**z-index 3000**、在 **shadow DOM 裡**——我們的 CSS 動不到）。

本站的浮動按鈕因此重新堆疊過：

```
160–208 px  LINE          bottom-40
 96–144 px  返回頂端       bottom-24
 24– 80 px  Messenger     第三方，動不了
```

⚠️ `components/layout/BackToTop.vue` 的 `bottom-24` 是刻意的，**不要改回 `md:bottom-8`**
（原本 32–80px，與 Messenger 幾乎完全重疊）。

⚠️ **手機上 Messenger 仍壓在「立即預約體驗」固定列（0–92px、z-50）上方**，
會蓋住 CTA 右端。只能請代操在漸強後台調位置或停用該標籤。

### 2. `useRequestURL()` 在 App Hosting 後面讀不到真正的網域

`<body>` 的 noscript 必須伺服器端輸出（它的用途就是「沒有 JavaScript」時的備援），
但第一版上 prod 之後 noscript 一個都沒有：

```
App Hosting 前面的 Envoy 會把 Host 改寫成內部主機名
真正的對外網域落在 x-forwarded-host
useRequestURL() 預設只讀 Host
```

修法是 `useRequestURL({ xForwardedHost: true })`。

🔴 **本機測試用 `Host: lkkwellness.com` 永遠測不出這個問題**——那條路徑根本沒走過
`x-forwarded-host`。測試主機名判斷時必須涵蓋五種情境：

```
Host=正式網域                      → 要輸出
Host=內部主機 + XFH=正式網域        → 要輸出  ← 最容易漏的
Host=內部主機 + XFH=dev 網址        → 不輸出
Host=dev 網址（無 XFH）             → 不輸出
XFH 帶逗號清單（多層代理）           → 要輸出
```

（`server/utils/site-hosts.ts` 早就在處理這件事，寫 `app.vue` 時沒跟上，
所以同一個坑踩了第二次。）

## UTM：自己寫的，不是外掛

業主需求寫「安裝 HandL UTM Grabber 外掛」——那是 WordPress 的做法，本站是 Nuxt 裝不了。
走的是需求裡「**或相當之自動 Cookie 帶入機制**」，程式碼在
`plugins/utm.client.ts` ＋ `composables/useUtm.ts`。

```
cookie 名稱   lkk_utm（一包 JSON）
保留          30 天（與舊站 HandL 對齊）
sameSite      lax（廣告點進來屬跨站導覽，strict 會讀不到）
涵蓋          全站每一頁，含文章頁與 404 頁（實測 22 個頁面）
```

⚠️ **只有網址帶 `utm_*` 時才寫入**，否則之後任何一次沒帶參數的瀏覽都會把歸因洗掉。
實測換三頁後來源、活動、到期日皆不變。

⚠️ 舊站的 HandL 會記錄訪客 IP（`handl_ip`），**本站刻意不記**——
IP 屬於個人資料，而它對「這筆名單從哪個廣告來」沒有幫助。

📌 四張表單都會帶 UTM；後台四個地方看得到：名單列表標籤、詳情面板、
來源／活動篩選器、CSV 匯出（source／medium／campaign／content 四欄）。

## 隱私權政策要跟著追蹤器走

`pages/privacy.vue` 的「六、Cookie 之使用」列出四家第三方：
Google、Meta、**Microsoft Clarity**（明寫會記錄點擊位置、捲動與滑鼠軌跡）、
**漸強實驗室**。

⚠️ **容器裡加了新服務就要回來補這一節。** 原本的條文只寫「本網站會放置並取用
**我們的** Cookie」，完全沒有涵蓋第三方——那是裝 GTM 之後才發現的缺口。

⚠️ 漸強實驗室那條是實測發現、業主未提及的。若日後停用該標籤，這一條要一併移除。

## 環境隔離

```
lkkwellness.com                     載入 GTM
www.lkkwellness.com                 不載入（NXDOMAIN，該網域不存在）
dev / hosted.app / localhost        不載入
```

判斷寫在 `plugins/gtm.client.ts`（瀏覽器端）與 `app.vue`（伺服器端）各一份——
**兩邊都是字串比對，改網域時兩處都要改**。不能共用 `server/utils/site-hosts.ts`，
因為那是 server util，client plugin 取不到。

## 相關

- 切轉的整體脈絡見 [[lkk-site-cutover]]
- 文章渲染層見 [[lkk-wp-articles]]
- 專案整體現況見 [[lkk-project-context]]
