---
name: lkk-wp-articles
description: 新站以根目錄網址渲染舊站 WordPress 文章的那一層（headless），以及四個彙整頁的分頁內搜尋、載入更多、主題分頁與返回還原。要動 pages/[...slug].vue、server/api/public/article、wp-articles、sitemap.xml.ts、server/utils/article-sections.ts、四個彙整頁、pages/news.vue 的搜尋、components/common/Article*.vue、composables/useArticleBrowser.ts，或被問「文章為什麼打不開／跑版／拿到別篇／搜不到／載入更多卡住／已刪的文章還看得到／返回跑錯分頁或搜尋結果不見／文章裡的按鈕顏色不對／刪掉的頁面網址顯示什麼／sitemap 怎麼變那麼少／dev 站會不會被 Google 收錄」時使用。內含九個實測過的地雷、2026-10-13 正式站連不上舊站那次停擺的完整查法與三方對照、已刪文章在 swr 快取下持續回 200 的成因與修法（含本機假 WordPress 的驗法）、已下架頁面（franchise、shop）的兩道擋法、Stackable 按鈕與社群圖示的區分、搜尋關鍵字寫進網址與返回剛才列表的做法、sitemap 的靜默失敗模式、WP REST 搜尋的實際行為，以及一條比程式碼更重要的教訓：驗證沒覆蓋到的那一層，就是會壞的那一層。
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

另有**四個彙整頁**用同一套資料來源列出文章，各自帶分頁內搜尋與載入更多：
`/knowledge-center`、`/cases-center`、`/activity-center`、`/news-center`。
詳見下方「四個彙整頁」那一節。

## 🔴 九個實測過的地雷

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
而本站 `/franchise` 原本是加盟頁，靜態路由優先。

那篇在本站永遠取不到，已從彙整頁整篇排除。根治要在 WordPress 改代稱並補 301。

🔴 **2026-10-16 起 `/franchise` 與 `/shop` 兩頁已刪除**（業主：停止招募加盟、不賣商品，網址要顯示找不到頁面）。
頁面檔一刪，網址就掉進 `[...slug]` 來查 WordPress —— **franchise 那篇會頂上來**，內容正是加盟說明。
所以 `article/[slug].get.ts` 加了 `RETIRED_PAGES`，擋兩道：

1. **打上游之前**：`slug.toLowerCase()` 在清單裡就直接 404（WP 查代稱不分大小寫，`/Franchise` 也查得到）
2. **拿到上游回應之後**：用 **WordPress 回傳的正式代稱** `post.slug` 再擋一次，放在寫入快取與備份之前。
   WP 會把查詢代稱再正規化（小寫、`.` 變 `-`、去掉頭尾 `-`、逗號分隔多個代稱），
   `/franchise-/`、`/franchise./`、`/-franchise/`、`/x,franchise/` 躲得過第一道、仍會查到那篇

⚠️ **刪掉一個第一層頁面時，四個 `RESERVED_ROUTES` 不要跟著拿掉。** 拿掉的話 sitemap 會開始列出那篇
WP 文章、彙整頁也會冒出它的卡片，而網址實際是 404。刪頁的步驟是：
刪頁面檔 → 從 `sitemap.xml.ts` 的 `STATIC_PATHS` 移除 → 若 WP 有同代稱文章就加進 `RETIRED_PAGES`
→ 發 prod 時刪除要另外 `git rm`（見 [[lkk-deploy-verify]]）。

舊站 `l-kk.tw/franchise/` 經萬用 301 到本站 `/franchise/`，現在也是 404（業主選的結果）。
文章內指向舊站購物車／結帳（`PAGE_MAP` 的 `checkout`、`shoppingcart` → `/shop`）的連結同樣變成 404，業主同意。

⚠️ **新增第一層路由時有四個地方要登記**，少一個就會出事：

| # | 檔案 | 少了會怎樣 |
|---|---|---|
| 1 | `server/utils/wordpress.ts` 的 `RESERVED_ROUTES` | 內文連結會被改寫到同名的本站頁 |
| 2 | `server/api/public/wp-articles.get.ts` 的 `RESERVED_ROUTES` | 同名文章會出現在彙整頁卡片上，點了去別的頁 |
| 3 | `scripts/verify-articles.mjs` 的 `RESERVED_ROUTES` | 全量驗證會把那個路由誤判成壞掉的文章 |
| 4 | `server/routes/sitemap.xml.ts` 的 `STATIC_PATHS` | 新頁不會進 sitemap |

兩個容易找錯的點：
- `sitemap.xml.ts` **沒有自己那一份** `RESERVED_ROUTES`，它靠 Nitro 的自動匯入
  取用 `server/utils/wordpress.ts` 那一份。照「三處」去 grep 會以為它漏了。
- `verify-articles.mjs` 那份**多了** `_nuxt`、`sitemap.xml`、`robots.txt` 三個
  建置產物路徑，另外兩份沒有。不要當成純複製。

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
| `server/routes/robots.txt.ts` | 正式主機 `Allow: /`＋Sitemap；非正式主機也是 `Allow: /`、不宣告 sitemap（`public/robots.txt` 必須刪掉） |
| `server/middleware/noindex-nonproduction.ts` | 非正式主機補 `X-Robots-Tag: noindex, nofollow` |

🔴 **非正式主機的 robots.txt 不能是 `Disallow: /`**。9/19 曾把 Disallow 與 noindex 一起加，結果 Google
被 robots.txt 擋住、讀不到 noindex，9/19 以前已收錄的 dev 頁面到 10-28 還搜得到（Stone 回報）。
10-28 改成非正式主機也允許爬、只靠 noindex 讓 Google 自己移除；同時請 Stone 在 Search Console
驗證 dev 網址前綴（HTML 檔驗證）並用「移除」工具暫時隱藏整個前綴（6 個月），等 noindex 生效。

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

🔴 **不要檢查 iframe 的 `width` 屬性。** 2026-09-19 我加了「width > 800 就報錯」，
   隔天對正式站跑第一次就產生 **122 筆誤報、真問題 0 筆**——WordPress 一定會把
   原始尺寸寫進屬性（全站都是 1290），而修正是在 CSS 端覆蓋掉它。
   屬性永遠是 1290，不代表頁面壞了。

   **檢查要對著「會不會壞」的那一層，不是對著「原始資料長什麼樣」。**
   逐篇看 HTML 驗不出這件事，決定結果的是文章頁的 CSS。腳本改成
   `checkEmbedCss()`：抓一篇有嵌入的文章頁，確認那兩條規則在線上。
   量實際寬度仍然只能用瀏覽器：

```js
// 瀏覽器主控台（或 browser 工具）——這才是唯一能證明「沒有撐寬」的量法
const fs=[...document.querySelectorAll('.article-body iframe')]
;({ horizOverflow: document.documentElement.scrollWidth > innerWidth,
    attrWidths:[...new Set(fs.map(f=>f.getAttribute('width')))],
    renderedWidths:[...new Set(fs.map(f=>Math.round(f.getBoundingClientRect().width)))] })
// typhoon（10 個 iframe）實測：attr 全是 1290、rendered 全是 704、無溢出
```


### 9. 防競態用「共用計數器」，會讓分頁永久卡在載入中

2026-09-30 對抗式複查抓到的最嚴重一條，六個面向各自獨立發現同一個根因。

第一版 `useArticleBrowser` 用一個 composable 層級的 `token` 擋過期回應，
但 `loading` 是**每個分頁各一份**。於是：

```
在「訓練知識」按載入更多（token=1，view.sports.loading=true）
→ 不等回應就切到「醫療衛教」也按一次（token=2）
→ 訓練知識那一發回來時 mine(1) !== token(2)，直接 return
→ 它在送出前寫下的 loading:true 再也沒有人負責歸位
→ 切回訓練知識：按鈕永遠是 disabled 的「載入中…」
```

而且瀏覽模式下連清除鈕都不會渲染，讀者**只能重新整理整頁**。
搜尋狀態下的版本更慘：分頁永久停在骨架畫面，連搜尋鈕都跟著被 disable。

正解是**每筆狀態自己記住是哪一個請求建立的**（`view[tabKey].rid`）：
別的分頁發請求不會動到這個分頁的 `rid`，所以「被別的分頁搶先」不再誤判成過期；
而 `submit()`／`clear()` 會刪掉整個 `view`，過期回應的 `rid` 自然對不上，仍然被丟棄。

⚠️ 這類競態**手點幾乎測不出來**，上游要慢到足以讓人切分頁才會現形
（舊站實測 0.8–26 秒，時間窗很大）。驗證方式是把 composable 用真的 Vue
reactivity 跑模擬，手動控制回應的 resolve 順序 —— 寫完測試先拿**舊版**跑一次，
確認它真的抓得到（當時舊版 8 項失敗、新版 0 項），否則測試可能是空轉的。

## 全量驗證：功能完成的定義

```bash
node scripts/verify-articles.mjs                      # 驗 dev
node scripts/verify-articles.mjs https://lkkwellness.com
```

逐篇斷言：回傳的是不是請求的那一篇、內容長度、殘留舊站連結、表格容器、
SEO 欄位、**帶結尾斜線的頁面回應碼**、彙整頁卡片是不是真的 `<a href>`。

🔴 **它的覆蓋範圍比名字聽起來小，動手前先知道哪裡沒驗到：**

| 這支有驗 | 這支沒驗 |
|---|---|
| 文章 API 與文章頁（全量） | `/activity-center`、`/news-center` 兩個彙整頁 |
| `/knowledge-center`、`/cases-center` 兩頁的卡片 | **搜尋與載入更多整條路徑**（完全零自動驗證） |

`checkListingPages()` 的迴圈只跑知識科普與學員故事兩頁，連「卡片渲染成
`<NUXTLINK>` 字面標籤」那個歷史缺陷都不會在另外兩頁上被攔下。
腳本也從來沒打過 `/api/public/wp-articles?tab=…&q=…`。

**搜尋與載入更多目前只能手動驗，至少跑這五項**（2026-09-30 實際抓到 bug 的那幾項）：

1. `?tab=sports&q=膝蓋` 的回傳筆數與 `?tab=…&page=2` 的第二頁內容
2. 載入更多一路按到底：卡片數對、按鈕收起、收尾文字出現
3. **搜尋中切分頁，再切回來** ← 競態最容易壞的地方
4. **按載入更多之後不等回應就切分頁，再切回來** ← 同上
5. 上游失敗時：筆數不被 0 覆蓋、按鈕不會無聲消失

⚠️ 併發刻意壓到 3。這支會對舊站正式主機發 666 個請求，
   密集執行正是誘發「200 回錯誤頁」的原因。它是驗證工具不是壓力測試。

⚠️ **小改動不要重跑全掃**。改動範圍窄的時候（例如只動 `PAGE_MAP`），
   先算出受影響的文章再針對那幾篇複驗——2026-09-19 改 9 筆對照表，
   複驗 26 篇就夠了，不必再打舊站 667 次。

### 要查「內文還連著舊站哪裡」時，不要逐篇打新站

從 WordPress 批次抓完整內文，每頁 100 篇，幾個請求就能拿到全部：

```bash
# 🔴 先問頁數，不要寫死 —— 文章數一直在長（2026-09-16 約 667 篇、
#    09-30 是 675、10-02 已經 680）。寫死 7 頁在超過 700 篇那天會靜默少抓一頁，
#    而這段的用途正是「查內文還殘留哪些舊站連結」，少抓會被誤判成清乾淨了。
PAGES=$(curl -sI 'https://l-kk.tw/wp-json/wp/v2/posts?per_page=100&_fields=slug' \
        | grep -i x-wp-totalpages | tr -dc 0-9)
for p in $(seq 1 $PAGES); do
  curl -s "https://l-kk.tw/wp-json/wp/v2/posts?per_page=100&page=$p&_fields=slug,content" -o wp-p$p.json
done
```

⚠️ 本文件所有篇數都是當下量測值，**不要當成常數**。要現查就用 `x-wp-total`。

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

## 快取：五個點，每一個都要算進來

「清掉文章 API ＋ CDN 就看得到新內容」是錯的。會影響文章新鮮度、或會回源打 WordPress 的有五處：

| 快取點 | 位置 | 鍵 | 時間 |
|---|---|---|---|
| 文章 API | `server/api/public/article/[slug].get.ts` | slug 的 sha1 | 600 秒 |
| 彙整頁瀏覽 | `cachedFetchTab`（`wp-articles.get.ts`） | `分頁代稱_頁碼` | 300 秒 |
| **學員故事整批** | `cachedFetchAllCases`（同檔） | **固定 `cases_all`** | 300 秒 |
| 彙整頁搜尋 | — | **刻意不快取** | — |
| **sitemap.xml** | `server/routes/sitemap.xml.ts` | `sitemap` | 3600 秒 |
| CDN（頁面層） | `nuxt.config.ts` 的 `routeRules` | 完整網址含 query | 文章 600 秒／表單 30 秒 |

⚠️ **`sitemap.xml` 會自己打 WordPress**（最多 20 頁），不經過 wp-articles，是獨立的一條回源路徑。

⚠️ **學員故事不走 `分頁代稱_頁碼`。**所有主題分頁共用 `cases_all` 這一筆
   （整個案例分類一次抓回、主題篩選在記憶體裡做），不存在 `metabolic_1` 這種鍵。
   這也是為什麼「業主在 WordPress 幫案例補上主題分類之後，新分頁最久要等 300 秒才出現」。

⚠️ 2026-09-30 起 `wp-articles.get.ts` 不再是 `defineCachedEventHandler`。
   它改成一般的 `defineEventHandler`，內層用 `defineCachedFunction` 只快取瀏覽模式。
   原因是搜尋加進來之後，快取鍵的基數變成「關鍵字」而無上限，而 Nitro 的快取底層
   是 unstorage 的裸 Map——沒有容量上限也沒有逐出機制（過期項目只是讀取時判定為舊，
   不會被刪掉），容器只有 512MiB。瀏覽模式的鍵（`分頁代稱_頁碼`、`cases_all`）有界，可以快取。

⚠️ 快取鍵只能用英數與底線。Nitro 的 `escapeKey` 是 `String(key).replace(/\W/g,'')`，
   中文會被整串清光、連字號也會被清掉——三個不同的中文查詢會共用同一個鍵、互相覆蓋。
   只測英文永遠驗不出這個問題。

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

## 🔴 2026-10-13：正式站整個文章層停擺五天，根因是 IP 被丟包

業主回報「WordPress 刪掉的文章，新站還看得到」。查下去才發現那只是症狀，
真正的事是**正式站連不上舊站已經好幾天**。

### 怎麼查出來的：三方對照

同一個上游、同一份程式碼、同一個區域，分別從三個地方打：

| 從哪裡 | 結果 |
|---|---|
| 我的開發機 | 0.7–1.9 秒，6/6 成功（含 `per_page=100` 重查詢） |
| **dev 站**（lkkdev 的 Cloud Run） | 0.6–0.8 秒，3/3 成功 |
| **正式站**（lkkprod 的 Cloud Run） | **8/8 逾時 12 秒，`<no response>`** |

**三方對照是這類問題最快的分界線。** 只打一個地方永遠分不出「上游壞了」
還是「我們連不上」。dev 與 prod 跑同一份程式碼、同一個區域，差別只剩 egress。

🔴 **`<no response>` ＋ TimeoutError ≠ 上游很慢。**那是連線根本沒被應答，
   也就是封包被丟掉。真的資源耗盡的站不會「只對一個來源沒反應、對其他人全部秒回」。

### 再縮一層：全部來自同一個執行個體

```bash
# Cloud Run 的應用程式 log，看 labels.instanceId
filter: resource.type="cloud_run_revision" AND resource.labels.service_name="lkk-website"
        AND textPayload=~"\[Article\]|\[WP Articles\]|\[Sitemap\]"
```

⚠️ 不要只搜「上游失敗」—— 那個字串只有 `article/[slug].get.ts` 在用。
   `wp-articles.get.ts` 寫的是「取不到舊站文章清單」「取不到學員故事」，
   `sitemap.xml.ts` 寫的是「上游失敗，改用上一份文章清單」。用前綴搜才涵蓋得完。

當天 300 筆失敗**全部來自同一個 instanceId**，那個執行個體從四天前的部署活到當時。
Cloud Run 執行個體活著期間對外 IP 固定 → 一被封就是 100% 失敗。

### 緩解：強制一次 rollout 就好

```bash
npx firebase-tools apphosting:rollouts:create lkk-website --project lkkprod --git-branch prod --force
```

不改任何程式碼，只是換一個新執行個體、換一個對外 IP。**實測推完約 3 分鐘恢復，
失敗數歸零。** 但這只是換一個還沒被封的 IP，沒有解決會被封的原因。

### 🔴 會自己撐住的迴圈（這才是量暴增的原因）

```
被封 → 失敗不進快取 → 每個讀者的每次點擊都重打舊站 → 請求量暴增 → 封鎖一直被續期
```

⚠️ **這條迴圈只對「失敗會往外拋」的端點成立**：彙整頁（`cachedFetchTab` 拋錯就不寫快取，
   而且失敗的 SSR 頁被強制 `no-store`）、以及沒有備份的文章頁（503）。
   **有備份的文章頁不在此列** —— 它回的 `stale` 結果仍然會被快取 600 秒，
   回源被攤平成每 10 分鐘一次。

實測 10-12 一整天 **4,008 次失敗**（約 167 次/小時）。那個數字是**封鎖造成的**，
不是封鎖前的常態。所以「因為請求太多才被封」這個推論要小心——
log 只記失敗不記成功，健康時的回源量在這個 repo 裡量不到。

### 症狀清單（下次看到其中一項就往這邊想）

| 症狀 | 說明 |
|---|---|
| 已刪的文章還看得到 | 兩種成因，**先看 Cloud Run log 分辨**：① 停擺期間：連不上就一律吐 7 天長效備份（回應裡 `stale: true`），API 沒機會看到「被刪」的空陣列；② **平常也會**：快取過這篇的執行個體在 swr 模式下一直回舊的 200，log 會出現 `[cache] SWR handler error`。② 已於 2026-10-16 修正，見下方「已刪文章的快取清除」 |
| 隨機幾篇文章 503 | 那幾篇在這個執行個體上沒有備份 |
| 四個彙整頁空白 | `wp-articles` 的 `fetchTab`／`fetchAllCases` 全數拋錯 |
| **sitemap 從約 720 筆掉到 26 筆** | 最隱蔽的一項，見下 |

### 舊站裝了 Wordfence

外部探測（打公開路徑）確認舊站有 **Wordfence 7.11.6**，`wp-content/wflogs/` 存在。
它的封鎖紀錄在 **WordPress 後台**（Firewall → Blocking、Tools → Live Traffic），
**不需要 Cloudways 權限**。但要注意 Wordfence 擋人通常回 403/503 頁面，
與我們量到的「沒有回應」不吻合，所以伺服器層的防火牆／fail2ban 仍是更可能的那一個。

**一次就能分辨的方法**：看舊站的 access log，搜停擺期間打 `/wp-json/wp/v2/posts` 的請求。
完全沒有紀錄 → 封包在 nginx 之前就被丟 → 伺服器層；有紀錄但是 403/503 → 應用層。

---

## 已刪文章的快取清除（2026-10-16）

### 為什麼平常也會「刪了還在」

`article/[slug].get.ts` 是 `defineCachedEventHandler({ maxAge: 600, swr: true })`。
nitropack 的 `runtime/internal/cache.mjs`：快取過期後**先回舊的 entry、在背景跑 handler**；
背景那次丟出的 404 只會被記成 `console.error('[cache] SWR handler error.')`，**舊 entry 不清、mtime 不更新**，
所以下一個請求又回舊的 200、又在背景失敗一次。快取過這篇的執行個體會一直這樣，直到被回收（可以活好幾天）。

### 現在的做法：只在「上游確定回空陣列」那一條清

`forgetDeletedArticle(slug)`：
1. 先 `hasItem` 看這篇的快取與 7 天備份在不在，**都沒有就直接 404**（沒東西可清）
2. 有東西要清時，先打一次**上游健康檢查**（`/wp/v2/posts?per_page=1&_fields=id`，5 秒逾時）：
   看不到任何文章就當成上游異常，**什麼都不動**
3. 健康才 `removeItem` 快取與備份，log `[Article] 上游確認已刪除，清除快取與備份 <slug> { hadCache, hadBackup }`

🔴 **健康檢查是回歸審查補上的**：WordPress 在資料庫查詢被中途砍掉、外掛擋匿名 REST 時，也會用 HTTP 200 回 `[]`。
沒有這道檢查的話，一次上游異常就會把熱門文章的備份清掉，暫時故障變成永久 404。

🔴 **不要改成 `swr: false`**：過期就前景等上游，停擺時每篇文章都讓讀者等滿 12 秒逾時，
請求疊起來擴出沒有備份的新執行個體，回到 10-13 那種自我延續的迴圈。
也不要加 `staleMaxAge`（在 nitropack 2.13.4 它只影響 swr:false 與回應標頭，不限制伺服器吐舊值多久）。

### 快取鍵只組一次

存放鍵是 `/cache:nitro/handlers:article:article<sha1 前 20 碼>.json`，對應 cache.mjs 的
`[base, group, name, key + '.json'].join(':')`。handler 明確設 `name: 'article'`（預設是共用的 `_`）；
鍵裡**不放連字號**（`escapeKey` 會把 `\W` 全刪）。`articleCacheKey()` 由 `getKey` 與清除共用 ——
兩邊各拼一次的話，一旦對不上，`removeItem` 打到不存在的鍵**不會報錯**，等於沒修。
log 裡的 `hadCache: true` 就是鍵組對了的證據。

### 時間線與已知限制

- 刪文後：Nitro 快取最多 600 秒 → 過期後第一個請求仍回舊 200（背景清除）→ 之後 404；
  CDN 的 s-maxage 與條件式請求的 304 會再延長，**實際約 10～30 分鐘**。急件用強制 rollout 一次清掉
- **業主「把文章切回草稿慢慢改」的期間，新站會顯示找不到頁面**（業主 2026-10-16 已知悉同意）
- 低流量時段 Cloud Run 節流 CPU，背景重抓可能逾時改走備份、以 `stale:true` 寫回 —— 這種情況已刪文章仍會存活。
  上線後若 log 在非停擺期間出現「上游失敗，改用上一份快取」＋ TimeoutError，就是這條

### 本機怎麼驗（線上無法安全地「刪一篇文章」）

production build ＋ 一支幾十行的假 WordPress（`node:http`，`/__mode?slug=x&m=article|empty|error|html` 切換回應），
`WORDPRESS_API_URL=http://127.0.0.1:8787/wp-json PORT=3999 node .output/server/index.mjs`，只用 curl 打 API。
等快取過期要 600 秒，**暫時把 `maxAge` 改 3 並在那行加 `// TEMP-LOCAL-TEST`**，測完改回、
`grep -c TEMP-LOCAL-TEST` 必須是 0 才能 commit。2026-10-16 驗過的情境：
真刪除 → 清除、之後 404、上游 500 時 503（備份已清）；全站都查不到的假空陣列 → 不清、持續 200；
另一篇在上游 500／HTML 錯誤頁時 → `stale:true` 的 200（沒被誤判成刪除）；中文代稱一樣清得掉。
假 WP 要模擬代稱正規化，才測得到 `RETIRED_PAGES` 第二道。不要用 `npm run dev`（storage 掛載不同，測了不算數）。

---

## sitemap 的失敗模式：靜默塌成只有靜態頁

停擺期間 `sitemap.xml` 從約 720 筆變成 **26 筆**，等於對 Google 宣告 694 篇文章
全部消失，而且 `catch {}` 把錯誤吃掉、沒有任何告警。

2026-10-13 診斷、**2026-10-14 改成三件事**（`server/routes/sitemap.xml.ts`，commit `aabfa62`）：

1. 上游失敗 → 取用上一份成功的文章清單（7 天）
2. **中途失敗也算失敗** —— 原本抓到第 3 頁掛掉會把前 200 篇當成完整清單送出，
   那對 Google 等於宣告另外 494 篇被移除
3. 上游回空陣列不覆蓋備份

⚠️ **這個備份只活在單一執行個體裡。** `useStorage('cache')` 在這個專案
**沒有設驅動**（`nuxt.config.ts` 裡沒有 storage 設定），預設是記憶體，重新部署歸零。
所以它擋得住「跑一陣子之後上游才掛」，擋不住「部署完上游就是掛的」。
`article/[slug]` 的 7 天副本有同一個限制。

---

## 文章底部不放預約區塊（2026-10-21 業主要求刪除）

`pages/[...slug].vue` 原本在內文後面有一塊版型自帶的「想實際試試看？／練健康在台北有四間分店…／預約體驗」，
已刪除，**不要加回去**。文章頁（default layout）剩下的預約入口：
頁首「預約體驗」按鈕（`Header.vue`，lg 以上常駐；手機在漢堡選單底部）、頁首服務選單的「一對一體驗報名」、
頁尾導覽的「預約體驗」（`Footer.vue`）、手機底部固定按鈕（`MobileBookingButton`，md 以下），
以及作者在 WordPress 內文自己放的按鈕（屬於文章內容，要在 WP 後台逐篇改）。
學員案例（`/cases-center`）、活動資訊（`/activity-center`）列表頁底部那兩塊長得很像的預約區塊**沒有一起刪**——業主只點名文章頁。

## 文章內的按鈕與社群圖示（2026-10-16）

業主要求：**文字按鈕一律橘底白字，社群圖示不動**。樣式在 `pages/[...slug].vue` 的 scoped style。

### 先分清楚是哪一種

| 種類 | 外層區塊 | 數量（2026-10-16 WP 搜尋） |
|---|---|---|
| Stackable 文字按鈕 | `.wp-block-stackable-button` 裡的 `a.stk-button` | 360 篇含 `stk-button` |
| **文章底部社群圖示**（FB／IG／YouTube／LINE，無文字） | `.wp-block-stackable-icon-button` 裡的 `a` | 284 篇 |
| WordPress 內建按鈕 | `a.wp-block-button__link` | 11 篇 |

🔴 **社群圖示的 `<a>` 也帶 `stk-button` class**，只寫 `.stk-button` 會連社群圖示一起改。
要用外層區塊區分。抽樣 50 篇全部 226 個 `stk-button` 連結：文字按鈕 58 個都在
`.wp-block-stackable-button` 裡、社群圖示 168 個都在 `.wp-block-stackable-icon-button` 裡，沒有第三種，
也沒有舊版外掛的 `ugb-button`。（`wp-block-stackable-button-group` 是不同的 class token，不會誤中。）

### 為什麼原本是「深藍底＋黑字」

作者幾乎都把按鈕文字設成粗體（抽樣 9 個有 8 個包 `<strong>`），而本站 `.article-body strong` 一律 `#1a1a1a`。
按鈕本身的白字只作用在 `<a>`，子元素的 strong 自己有顏色 → 黑字。所以白字規則要寫到**子元素**（`.stk-button *`）。

### 顏色優先順序

- 作者在 WP 個別設的顏色是 Stackable 每個區塊自帶的 `<style>`：`.stk-xxxx .stk-button{background:… !important}`。
  我們的選擇器多一層 `.article-body`，兩邊都 `!important` 時由我們勝出，所以底色、字色用 `!important`
- **社群圖示畫面上一直是品牌色**（FB `#3b5998`、IG、YouTube、LINE 各自的色），不是本站規則寫的深藍 ——
  那條沒有 `!important`，被 Stackable 的品牌色蓋掉。業主說「社群圖示維持深藍」，實際意思是「維持現狀」
- Stackable 按鈕的尺寸（padding、圓角）**不加** `!important`，作者調過的大小保留
- **內建按鈕的 padding 要 `!important`**：作者用 `var(--wp--preset--spacing--80)` 這類主題變數寫在行內，
  本站沒定義，算出來是 0，字貼著橘色邊緣（`/personal-trainer-2/`）
- ⚠️ 本站**沒有載入 Stackable 的前台 CSS**，自帶 style 也沒設 `content`，所以按鈕的 `::before`／`::after` 不會產生。
  透明外框款的框線雖然寫在 `:before`，實際畫面不受影響，不必處理

### 驗證

正式站與 dev 用同一篇文章比對 computed style（`getComputedStyle` 取 background、color、padding、radius，含子元素顏色），
社群圖示四個值要完全相同。⚠️ **剛部署完 CDN 會回舊 HTML（樣式內嵌在 HTML 裡）**，
看到舊樣式先用 `?v=xxx` 繞過快取確認，不要誤判成改壞（見 [[lkk-deploy-verify]]）。

---

## 四個彙整頁：搜尋、載入更多、主題分頁

> 2026-09-30～10-02 建置。篇數為當下量測，會長。

| 頁面 | 資料來源 | 分頁 |
|---|---|---|
| `/knowledge-center` | WP 分類 17／18／11／9 | **全部（預設）**・訓練知識・醫療衛教・特殊族群・運動人文 |
| `/cases-center` | WP 分類 1092 | 全部 ＋ 主題（見下） |
| `/activity-center` | WP 分類 448 | 無 |
| `/news-center` | WP 分類 14 | 無 |

`/news`（媒體報導）**不在這一層**：它上半部是寫死在頁面裡的精選版面，
其中 AFP 與 CNA 兩則只有站外連結、WordPress 沒有對應文章，所以彙整頁取代不了它。
底部的「查看全部報導」指向 `/news-center`。
⚠️ 它的搜尋是**自己寫的純前端比對**，沒有用 `useArticleBrowser`（只 import 了 `MIN_SEARCH_LENGTH`
與 `normalizeSearchQuery`）。改共用搜尋行為時要記得它，2026-10-16 就因此漏過一次。

建 `/news-center` 之前，WP 新聞報導分類裡**有 12 篇在站上沒有任何入口** ——
網址直接打得開，但沒有任何頁面連到。這是「只看頁面不看分類」會漏掉的缺口。

### WP REST 的搜尋：先知道這些再設計

全部 2026-09-30 實測，不是文件推論。

| 行為 | 實際結果 |
|---|---|
| `categories=a,b` | **OR**（聯集），**做不出交集** |
| `search` ＋ `categories` | **AND**（交集），所以「分頁內搜尋」做得到 |
| `orderby=relevance` | **只有帶 search 時才合法**，沒 search 回 400 |
| `per_page` | 上限 100，101 直接回 400 |
| `page` 超出總頁數 | 回 **HTTP 400**（`rest_post_invalid_page_number`），**不是空陣列** |
| `search_columns=post_title` | 可用，但與分類篩選疊加會見底 |
| 中文 | 純 `LIKE '%整串%'`，**不斷詞** |

🔴 **`orderby=relevance` 是搜尋好不好用的分水嶺。**實測「訓練知識」搜「膝蓋」：

```
預設（日期排序）：具備什麼條件練增強式訓練更安全有效？   ← 標題根本沒有「膝蓋」
orderby=relevance：深蹲時膝蓋會發出咔咔聲就一定有問題嗎？
```

🔴 **不要再疊 `search_columns=post_title`。**分類已經過濾過一次，再限制只比對標題會見底：
「訓練知識」搜「蛋白質」→ 全文 20 篇、只搜標題 **0 篇**。

🔴 **中文自然語句一律 0 筆**，這是 WP 的本質不是 bug：

```
膝蓋痛怎麼辦      0 筆        深蹲   163 筆
老人家可以重訓嗎  0 筆        膝蓋   140 筆
高血壓可以運動嗎  0 筆
```

打一個詞回全站的 1/5（等於沒篩選），打一句話回 0 筆。
所以空結果頁的重點是**引導改用短關鍵字 ＋ 給可點的範例詞**，不是只說「找不到」。
範例詞要先實測有命中再放上去。

⚠️ **第 2 頁之後品質會掉**：第 1 頁標題幾乎都命中，第 2 頁只剩內文提到。
這是 relevance 的特性，代表讀者看到的前 12 筆是最好的那批。

### API 契約（`server/api/public/wp-articles.get.ts`）

```
?group=knowledge      首屏：一次回整組分頁的第一頁（SSR，有快取）
?tab=sports&page=2    載入更多：單一分頁的第 N 頁（有快取）
?tab=sports&q=膝蓋    分頁內搜尋（刻意不快取，理由見快取那節）
```

四個刻意的設計，動之前先知道為什麼：

- **整組模式一律第一頁、不吃 q。**它要同時打 4 個分類；讓它也吃 q
  等於把每次搜尋變成 4 個並發。舊站的併發表現不穩定（同樣 6 個並發，
  量過 4 秒也量過 26 秒），而它是全站文章的唯一資料來源。
- **`Promise.allSettled` 不是 `Promise.all`。**一個分類逾時不該讓另外三個
  （可能根本是快取命中、沒碰上游）一起被丟掉，而且那張失敗的 SSR 頁
  會被 CDN 依 `/**` 快取 10 分鐘。整組都失敗時才回 `ok:false`，並補 `no-store`。
- **「有沒有帶 tab」要看參數在不在，不能看 truthy。**`?tab=`（空字串）若被當成沒帶，
  會悄悄退回整組模式**而且把 q 丟掉** —— 前端拿到瀏覽結果，卻標成「找到 N 篇包含 X」。
- **上游回 200 但不是陣列要丟出去。**當成空清單靜默放行的話，讀者看到一片空白
  沒有任何說明，而且那個「成功的空結果」會被快取 300 秒。

### 知識科普的「全部」：一個請求打完聯集

`categories=17,18,11,9` 的 OR 聯集，不是打四次再合併。

🔴 **筆數不可以用四個分頁相加。** 同一篇文章普遍掛多個分類，實測：

```
聯集（上游的 x-wp-total）     621
四個分頁相加  290+340+143+214 = 987
```

上游回的已經是去重值，直接用。合併四個結果會虛報，而且「載入更多」會壞——
每個分頁有各自的 page 游標，合併後的第 2 頁沒有單一 page 參數可以表達。

⚠️ 分頁代號取 `knowledge_all` 不是 `all`：`TAB_BY_KEY` 是**跨四個群組的單一扁平 Map**，
泛用名稱會撞名。這個檔已經有一個 `cases` 同時存在於 `TABS.cases` 與 `CASE_THEMES`，
靠 handler 裡的判斷順序才不出事，不要再製造第二個。

⚠️ 代號只能用英數與底線（會進 Nitro 快取鍵，連字號與中文會被清掉）。

⚠️ 「全部」放在陣列第一位＝它就是預設分頁（`useArticleBrowser` 取 `tabs[0]`）。
順序即預設，不是另外有設定。

⚠️ 首屏並發因此從 4 變 5。沒有改成「切到才抓」是刻意的：那要動 `useArticleBrowser`
的狀態機，而那支正是本檔第 9 條踩過最嚴重競態的地方；且 `cachedFetchTab`
每分頁快取 300 秒，穩定狀態下首屏多半是快取命中。

### 返回列表：兩條路徑要分開修

業主 2026-10-15 回報兩個現象，看起來像同一件事，其實一個是「跑錯分頁」、
一個是「跑錯頁面」：

- 知識科普：從「特殊族群」的文章返回，落在「訓練知識」（＝預設分頁）
- 學員案例：從「癌症」的文章返回，落在**知識科普**（＝另一個頁面）

🔴 **第二個現象的根因只有一行。** 2026-10-15 之前 `pages/[...slug].vue` 的返回連結是
寫死的 `to="/knowledge-center"` ＋「← 回到知識科普」（`git show 9e169de^:pages/[...slug].vue`
第 107、110 行），網址與文字都寫死，它同時解釋兩個現象。

**已於 commit `9e169de` 修正**：現在讀 API 回的 `backTo`，
寫死值只留作「備份副本缺 backTo 時」的 fallback。

另外當時**完全沒有把分類寫進網址**，所以瀏覽器上一頁也還原不了分類。

分類同步網址的程式全部集中在 `composables/useArticleBrowser.ts`
（`active` 初值讀 `?tab=`，`setActive` 經 `syncTabToUrl` 用 `router.replace` 寫回），
所以 grep 四個彙整頁本身會是 0，不要據此以為沒做。

現況（2026-10-16 起）：

| 路徑 | 做法 | 能做到什麼 |
|---|---|---|
| 瀏覽器上一頁 | 分類 `?tab=` 與**搜尋關鍵字 `?q=`** 都用 `router.replace` 寫進網址，進頁時讀回 | **精確還原**分類與搜尋結果 |
| 頁面上的「← 回到」，**從彙整頁點進來** | 讀 vue-router 寫在 `history.state.back` 的上一頁完整路徑；是五個彙整頁之一就 `router.back()` | 等同瀏覽器上一頁 |
| 頁面上的「← 回到」，從 Google／外部／另一篇文章進來 | 文章 API 依文章自己的分類算出的 `backTo`（`server/utils/article-sections.ts`） | 回到**正確的彙整頁 ＋ 一個合理的分類** |

### 2026-10-16：搜尋關鍵字寫進網址、返回回到剛才的列表

業主回報：知識分享搜尋「癌症」→ 點文章 → 回上一頁，**搜尋結果整個不見**；按「← 回到知識科普」則跑到「醫療衛教」。
（學員案例的「癌症」是主題分頁，原本就還原得了；知識分享沒有癌症分類，只能用搜尋。）

`useArticleBrowser`（四個彙整頁共用）：
- 送出時 `router.replace` 寫入 `?q=`，清除時拿掉；進頁時用 `normalizeSearchQuery`（與送出相同的正規化、
  不滿 `MIN_SEARCH_LENGTH` 或是陣列就當成沒帶）讀回
- 首屏：**SSR 與瀏覽器端都先把目前分類標成載入中**，畫面一開始就是搜尋狀態、不會先閃預設列表，
  也不會 hydration 不一致；真正的搜尋請求只在 `onMounted` 發（搜尋不快取，不在 SSR 打上游）
- 首屏連分類清單都沒拿到（`ready` 為 false）時**不還原**，維持「清單暫時讀取不到」——
  否則會顯示「再按一次搜尋」，但那時搜尋鈕是停用的
- 🔴 **刻意不監聽同一頁的 `?q=` 變化**。加過又拿掉：在搜尋結果頁點頁首「知識科普」時元件不會重新掛載，
  跟著網址清掉搜尋、分類卻停在原處（`?tab=` 從來沒監聽），畫面落到網址表達不出的狀態，
  而且「點頁首會重設」是業主沒同意過的畫面行為。從文章返回時頁面會重新掛載，本來就用不到監聽

`pages/[...slug].vue` 的返回連結：
- 掛載後才判斷 `history.state.back`（SSR 拿不到 history，先渲染分類推算的連結，避免 hydration 不一致）
- 🔴 這時要用**一般 `<a>` 自己處理 click**，不能在 `NuxtLink` 上掛 `@click`：NuxtLink 自己的導航會先跑，
  `preventDefault` 來不及擋，變成先 push 列表、再 back 回文章
- 點過文章裡的頁內錨點後，瀏覽器多一筆同篇文章的歷史，`back()` 只會回到同一篇。
  偵測到 `route.hash` 或 `history.state.current` 與掛載時不同，就改 `router.push(列表網址)`
- 從 `<a>` 用 Cmd／Ctrl／中鍵開新分頁照 `href` 走
- 連結文字格式不變（「← 回到○○」），名稱對齊分類推算那份：知識科普、學員案例、活動資訊、媒體報導

⚠️ 還沒做（業主說先不做）：回到列表時**捲動位置**與「載入更多」載過的頁數不保留。
搜尋模式下結果在掛載後才回來，瀏覽器的捲動還原會先套在骨架的高度上，讀者通常落在列表前段。
要做的話，審查建議用「只在瀏覽器端、以路徑＋分類＋關鍵字為鍵」的模組層快取保存 view，命中就同步寫回、不發請求。

🔴 **學員案例必須排在知識科普之前判斷。** 案例文章的主題分類（癌症、肌少症…）
在 WordPress 裡掛在「知識分享」底下，所以一篇案例**同時帶著知識類的分類 id**。
順序反過來，所有案例文章都會被判成知識科普。

⚠️ `?tab=` **不改變這些頁面對 API 的請求**（首屏一律 `group=xxx` 整組），
所以多出來的網址變體**不會增加對舊站的任何請求**，只是多約 20 個 CDN 快取鍵。
10-13 之後這點特別值得確認再動手。

⚠️ 用 `router.replace` 不用 `push`，否則每切一次分類就多一筆歷史，
讀者要按好幾次上一頁才離得開彙整頁。預設分類不寫進網址，讓裸網址保持乾淨。

⚠️ 文章 API 的 `_fields` 為此新增了 `categories`。**2026-10-15 之前存下的
7 天長效備份副本裡沒有這個欄位**，上游中斷期間走退路的文章，返回連結會退回
預設的「知識科普」。前端有 fallback，不會出現 `to=undefined`。

### 學員故事的主題分頁：為什麼在記憶體裡做

那 12 個主題（三高／關節炎／帕金森氏症…）在 WordPress 裡掛的是**「知識分享」底下**，
不是「案例分享」底下 —— 一個分類只能有一個上層，同一個「肌少症」不可能掛兩邊。
而 `categories` 是 OR，問不出「案例分享 **且** 肌少症」。

所以這一組改成：**一次把整個案例分類抓回來（含每篇的 `categories`），在記憶體裡做交集**。
好處是筆數精確、主題 ∩ 搜尋可以疊加、翻頁不會出現筆數對不上。

⚠️ **沒有文章的主題不顯示**（`buildCaseGroups` 的 `dropEmpty`）。提供一個點了永遠是空的
分頁比不提供更糟。業主在 WordPress 幫案例補上主題分類後會自動出現，不必改程式。
2026-10-02 實測：更年期／韌帶損傷／阿茲海默症／專項化訓練四個主題是 0 篇，
查過內容後確認**不是漏標，是真的沒有那類案例**。

⚠️ `dropEmpty` 只在整組模式開。單一主題查詢回 0 筆是「這個關鍵字沒有結果」不是失敗，
`groups` 若變成空陣列，前端取 `groups[0]` 會判定成讀取失敗。

### 前端（三個共用檔）

- `composables/useArticleBrowser.ts` — 瀏覽／搜尋/載入更多的狀態機（含上面第 9 條的 rid）
- `components/common/ArticleSearch.vue` — 搜尋框
- `components/common/ArticleResults.vue` — 筆數／卡片／空結果／載入更多

三個只有瀏覽器看得到的點：

| 點 | 為什麼 |
|---|---|
| 輸入框字級必須 **16px** | iOS Safari 對 `font-size < 16px` 的輸入框，一聚焦就自動放大整頁 |
| `type="search"` 的原生清除鈕要藏掉 | 否則跟自訂的清除鈕重疊成**兩個 ×**。但不能改 `type="text"`，那樣手機鍵盤就沒有「搜尋」鍵 |
| 中文輸入法的 Enter 要擋 | 組字中的 Enter 是**選字**，沒擋的話注音使用者每選一個字就送出一次查詢。在 keydown 檢查 `isComposing`（部分瀏覽器是 `keyCode === 229`）|

⚠️ **按送出才查，不做邊打邊查。**每一次查詢都打到舊站，而它是全站文章的唯一資料來源。

## 相關

- 切轉的整體脈絡見 [[lkk-site-cutover]]
- 部署後怎麼驗證見 [[lkk-deploy-verify]]
- 專案整體現況見 [[lkk-project-context]]
