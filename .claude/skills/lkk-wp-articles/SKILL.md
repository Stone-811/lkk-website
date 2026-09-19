---
name: lkk-wp-articles
description: 新站以根目錄網址渲染舊站 WordPress 文章的那一層（headless）。要動 pages/[...slug].vue、server/api/public/article、wp-articles、三個彙整頁（知識科普／學員故事／活動資訊），或被問「文章為什麼打不開／跑版／拿到別篇／dev 站會不會被 Google 收錄」時使用。內含八個實測過的地雷、全量驗證腳本的用法，以及一條比程式碼更重要的教訓：驗證沒覆蓋到的那一層，就是會壞的那一層。
---

# WordPress 文章渲染層

> 2026-09-16～19 建置並實測。內容全部來自實際量測與業主回報，不是推論。

## 架構一句話

文章**仍存放在舊站 l-kk.tw 的 WordPress 資料庫**，新站不保存任何文章，
只在伺服器端即時讀取並用自己的版型呈現。讀者的網址列全程只看到本站網域。

```
讀者 lkkwellness.com/spine/
  → Nuxt 靜態路由都沒中 → pages/[...slug].vue
  → server/api/public/article/[slug]（有快取）
  → l-kk.tw/wp-json/wp/v2/posts?slug=…
```

文章網址走**根目錄**，與舊站一對一（`l-kk.tw/spine/` ↔ `本站/spine/`），
未來舊站掛 301 不需要逐條對照表。

## 🔴 八個實測過的地雷

### 1. Nitro 的快取鍵會把中文清光

`defineCachedEventHandler` 的 `getKey` 回傳值會被 `replace(/\W/g, '')` 清理，
**中文字全部屬於 `\W`**，整串被清成空字串 → 每一篇中文網址的文章共用同一個鍵，
第一個被快取的那篇蓋住其他全部。

必須雜湊：`createHash('sha1').update(slug).digest('hex').slice(0, 20)`。

⚠️ 這個缺陷**單獨測任何一篇都會通過**，英文 slug 也完全正常。
   要兩篇以上中文文章互相比對才看得出來。

### 2. 上游用 HTTP 200 回非 JSON

密集請求時 Cloudways 會回錯誤頁或限流頁，**狀態碼仍是 200**。
`$fetch` 把 HTML 當字串回來，若直接當陣列用：

```
rows 是字串 → rows.length 為真 → rows[0] 取到字元 '<'
→ 每個欄位 undefined → 產生「成功的空白文章」→ 進快取 10 分鐘
```

比回 503 危險得多：監控不會報錯，Google 會收錄空白頁。
必須檢查 `Array.isArray(rows)` 與 `post.title?.rendered`，失敗就走退路。

### 3. 上游失敗不可以回 404

WordPress REST 實測 **0.8–1.3 秒**，併發時會逾時。
若讓錯誤變成 404，對 Google 是「此頁已移除」，一次抖動就可能讓文章掉出索引。

正確語意：**查無此篇才 404；上游失敗先吐上一份成功內容（另存 7 天長效副本），
真的沒有才回 503 並附 Retry-After**。

### 4. 內文連結不能一律改寫

實測 300 篇的內文連結：

| 目標 | 次數 | 處置 |
|---|---|---|
| `/bodytest/`（舊站預約頁） | **50** | 走 PAGE_MAP → `/booking` |
| `wp-content/`（圖片） | 3,114 | **永遠不動**，圖片實體還在 Cloudways |
| 多層路徑舊網址 | ~25 篇 | 保留連舊站（部分在舊站本來就 404） |
| 帶查詢字串 `?utm_source=` | 少數 | 要先拆掉再判斷，否則被當多層路徑漏改 |

`/bodytest/` 是全站被連最多的目標，而且是文章裡的行動呼籲——
當成文章改寫成 `/knowledge/bodytest/` 會把轉換入口整批打掉。

### 5. 表格：四個問題疊在一起

實測 200 篇有 **117 個表格**：

- **117/117** 有 `has-fixed-layout`，但 WordPress 的 CSS 沒載入，這 class 毫無作用
- 只有 114/117 被 `<figure>` 包著 → 捲動容器要自己補（`wrapTables`）
- 只有 82/117 有真正的 `<th>`，**35 個用 `<td><strong>` 假裝標頭**
- 欄數 2～13

🔴 表格的 CSS **絕對不要寫 `width: max-content`**——那會讓表格長到內容寬度，
`overflow-x` 永遠不觸發，375px 視窗實測表格寬 792px，整頁被撐開。
要 `width:100%` + `min-width`，捲動交給外層容器。

### 6. 與本站路由同名的文章打不開

實測 666 篇有 **1 筆**：「中高齡健康訓練創業說明會」代稱是 `franchise`，
而本站 `/franchise` 是加盟頁，靜態路由優先。

那篇在本站永遠取不到，已從彙整頁整篇排除。根治要在 WordPress 改代稱並補 301。

⚠️ 新增第一層路由時要同步更新三處保留清單：
`server/api/public/wp-articles.get.ts`、`server/utils/wordpress.ts`、
`scripts/verify-articles.mjs`。

### 7. 文章一上線，dev 站就變成 667 頁重複內容

文章改由根目錄渲染之後，dev 從 20 幾頁變成 **667 頁，而且每一頁都跟 l-kk.tw 上的那一篇一字不差**。
2026-09-19 實測 dev 的收錄狀態：

```
robots.txt      User-agent: *  /  Disallow:     ← 全部允許
X-Robots-Tag    無
<meta robots>   無
canonical       指向 dev 自己的 hosted.app 網址
```

也就是完全對 Google 敞開，跟正式站互相稀釋。**這跟推不推 prod 無關，是即時發生的。**

🔴 不能直接改 `public/robots.txt`——那個檔 dev 與 prod **共用同一份原始碼**，
改了會連正式站一起 noindex。正確做法是改成依主機名判斷：

| 檔案 | 作用 |
|---|---|
| `server/utils/site-hosts.ts` | 主機名白名單，單一來源 |
| `server/routes/robots.txt.ts` | 依主機回 `Allow: /` 或 `Disallow: /`（`public/robots.txt` 必須刪掉） |
| `server/middleware/noindex-nonproduction.ts` | 非正式主機補 `X-Robots-Tag: noindex, nofollow` |

⚠️ 判斷方式一定要是**白名單正式主機、其餘一律 noindex**，不能寫成黑名單——
兩個方向的後果不對稱：漏擋一個預覽網址只是重複內容，**誤擋正式站是流量歸零**。

⚠️ 正式站的 hosted.app 網址要跳過，交給 `redirect-canonical` 轉址。
在 301 回應上掛 noindex 會讓 Google 可能不追那個轉址。

⚠️ middleware 是按檔名字母序執行的，`noindex-` 排在 `redirect-` 前面。
所以跳過的判斷要寫在 noindex 那支裡，不能指望轉址先攔下來。

實測部署後 **3 分鐘內** 就換成新版——App Hosting 在 rollout 時會清 CDN，
不必擔心舊的 `robots.txt` 被 `stale-while-revalidate=86400` 卡一天。


### 8. 內嵌影片會把整頁撐寬（跟表格同一類，但當初漏了）

實測 667 篇有 **143 篇含可見嵌入、共 236 個 iframe**。WordPress 把原始尺寸
寫死在 `width`／`height` 屬性上：

```
151 個  figure.wp-embed-aspect-16-9   1290×726
  2 個  figure.is-type-video（無 16-9）1290×…
 83 個  其他嵌入                        600×338 為主，另有 1290×968、1290×1000
```

不處理的話 1024px 視窗實測 `docW=1450`，**頁面可以左右捲**；手機更嚴重。
（外站預覽卡的 600×338 在手機同樣超過內容欄的 327px。）

寫法要分兩段，不要一條規則套死：

```css
.article-body :deep(iframe) { width:100%; max-width:100%; border:0; display:block; }
/* WordPress 自己標成影片的才套 16:9 —— 高度跟著寬度走 */
.article-body :deep(.wp-embed-aspect-16-9 iframe),
.article-body :deep(.is-type-video iframe) { height:auto; aspect-ratio:16/9; }
```

🔴 **其他嵌入只收寬度、保留原高度**。硬套 16:9 會把 1290×968、1290×1000
那兩個高版面壓扁。實測結果：600×338 → 375×338、1290×1000 → 327×1000，
都沒有溢出，內容也沒被壓。

⚠️ **有 4 篇「整篇就是一支影片」**（內文去掉標籤後長度是 0），媒體報導那一類尤其多。
   嵌入沒渲染出來 = 整頁空白，而原本的 description 檢查不會報
   （它只在「有文字卻沒 description」時才報）。驗證腳本已補上這一項。


## 全量驗證：功能完成的定義

```bash
node scripts/verify-articles.mjs                      # 驗 dev
node scripts/verify-articles.mjs https://lkkwellness.com
```

逐篇斷言：回傳的是不是請求的那一篇、內容長度、殘留舊站連結、表格容器、
SEO 欄位、**帶結尾斜線的頁面回應碼**、彙整頁卡片是不是真的 `<a href>`。

⚠️ 併發刻意壓到 3。這支會對舊站正式主機發 666 個請求，
   密集執行正是誘發「200 回錯誤頁」的原因。它是驗證工具不是壓力測試。

⚠️ **小改動不要重跑全掃**。改動範圍窄的時候（例如只動 `PAGE_MAP`），
   先算出受影響的文章再針對那幾篇複驗——2026-09-19 改 9 筆對照表，
   複驗 26 篇就夠了，不必再打舊站 667 次。

### 要查「內文還連著舊站哪裡」時，不要逐篇打新站

從 WordPress 批次抓完整內文，**7 個請求**就能拿到全部 667 篇：

```bash
for p in 1 2 3 4 5 6 7; do
  curl -s "https://l-kk.tw/wp-json/wp/v2/posts?per_page=100&page=$p&_fields=slug,content" -o wp-p$p.json
done
```

⚠️ 但**離線比對改寫結果會失準**。試過把改寫規則在本機重寫一遍，算出 187 篇有殘留，
實際掃描是 26 篇——差別在於離線版沒有模擬「隱藏 iframe 已被移除」那一步，
把 `…/embed` 網址也算進去了。**批次抓內文是為了省請求，判斷仍要以實際輸出為準。**

## 🔴 最重要的一條：驗證沒覆蓋的那一層，就是會壞的那一層

同一類問題出現**五次**，每次都是「每一層單獨看都正常」：

| 驗了什麼 | 漏了什麼 | 症狀 |
|---|---|---|
| 只測英文 slug | 中文 slug | 全部中文文章拿到同一篇 |
| 只測單篇 | 互相比對 | 覆寫看不出來 |
| 只測 API | 頁面路由 | API 200 但 `/spine/` 404 |
| 只測 API 與網址 | 渲染出的連結 | 卡片變成 `<NUXTLINK>`，沒有 href、點不動 |
| 用 curl 驗導覽列 | `v-if` 控制的下拉選單 | curl 看不到 → 誤判「六個連結全不見」 |
| 驗了表格會不會撐寬 | **iframe 會不會撐寬** | 159 個 `width="1290"` 的嵌入把整頁撐寬 |

第六個最值得記：表格的問題處理得很完整（還特地寫下「絕對不要用 `width: max-content`」），
但**同一個道理沒有推廣到其他會比容器寬的元素**。全量驗證 640/667 通過，
是業主問「媒體報導點進去原本是 youtube 嗎」才翻出來的。
凡是「元素自帶尺寸」的東西——table、iframe、img、pre、svg、embed——都要一起檢查。

最後一個是 2026-09-19：導覽列下拉是 `v-if="openDropdown === 'team'"`，
**根本不會進 SSR 的 HTML**，curl 永遠驗不到。要用瀏覽器點開才算數。
凡是條件渲染、hover 才出現、或要互動才載入的東西，curl 一律無效。

最後一個特別值得記：模板裡用 `<component :is="resolveComponent('NuxtLink')">`
解析失敗時，Vue 會把名字當自訂元素**原樣輸出**，畫面完全正常但不是連結。
**不要在模板裡動態解析元件**，用 `v-if` / `v-else` 明確寫出標籤。

另外兩個是測試方法本身出錯，不是程式問題：

- `className.includes('border-orange')` 會誤判——未選中的樣式含 `hover:border-orange/50`
- **導到同一個網址（含 hash）不會重新載入**，Vue 狀態留著，驗不出初始狀態

## 快取：三層，改一層沒用

| 層 | 設定位置 | 目前值 |
|---|---|---|
| 文章 API | `defineCachedEventHandler` | 600 秒 |
| 彙整頁 API | 同上 | 300 秒 |
| **CDN（頁面層）** | `nuxt.config.ts` 的 `routeRules` | 文章 600 秒／表單 30 秒 |

補上 `Cache-Control` 之前，App Hosting 前面那層 Google CDN **永遠是 miss**
（沒有 Cache-Control 就不快取）。補上之後實測：

```
文章頁  冷 0.7–3.1 秒  →  CDN 命中 0.06 秒
首頁    冷 1.87 秒     →  CDN 命中 0.06 秒
```

CDN 命中代表請求**根本沒到 Cloud Run**，也就不會回源打 WordPress。

⚠️ 讓既有頁面開始依賴後台資料時，快取也要跟著縮短。
   踩過：兩張表單的選項改為後台可維護後忘了改，業主在後台停用再啟用，
   表單上看不到變化——`s-maxage=600` 加上 `stale-while-revalidate=86400`
   最長可拖一天。

## 建置期預抓：量過，目前關閉

`nuxt.config.ts` 留著 `prerender:routes` 鉤子，未設 `PRERENDER_ARTICLES` 就完全不作用。

2026-09-18 Cloud Build 實測：

```
基準建置        2.5 分
預抓 20 篇      3.0 分  → 每篇約 1.5 秒
外推 666 篇     約 17 分鐘，每月會超出 Cloud Build 的 2,500 分鐘免費額度
```

而 CDN 命中只要 0.06 秒，**比預抓的靜態檔還快**（靜態檔仍要經過 Cloud Run 送出）。
預抓只影響「每篇文章的第一個訪客」，效益不足以抵銷每次部署多等 17 分鐘。

日後若要預抓熱門文章（例如彙整頁上的 60 篇，建置只多約 1.5 分），設那個變數即可。

## 其他已知限制

- **Rank Math 的 SEO meta 取不到**：`rankmath/v1` 只開放 `ca`/`an`/`in` 三個內部命名空間。
  正式導入要在 WordPress 加 mu-plugin 用 `register_rest_field` 開出來，
  目前用文章標題與摘要代替。
- **4 篇沒有 meta description**：純影片嵌入的媒體報導，內文去掉標籤後是空的。
  這不是缺陷——Google 會自行產生摘要，硬塞與標題重複的字串更差。
- **圖片仍在 `l-kk.tw/wp-content/uploads/`**：666 篇只有 15% 有特色圖片，
  內文圖片也少，量太小不值得為它做遷移。

## 相關

- 切轉的整體脈絡見 [[lkk-site-cutover]]
- 部署後怎麼驗證見 [[lkk-deploy-verify]]
- 專案整體現況見 [[lkk-project-context]]
