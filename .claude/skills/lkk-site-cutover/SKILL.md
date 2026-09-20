---
name: lkk-site-cutover
description: 練健康新舊站並存的實況與切轉工作。當被問「舊站什麼時候關」「文章要不要搬」「為什麼 Google 搜到的是舊站」「名單是不是漏了」，或要動 l-kk.tw、DNS、301、sitemap、GA4 歸屬時使用。內含 2026-09-12 實測數據、四階段相依順序、三個不可逆的錯誤，以及兩個不該做的方案。
---

# 新舊站切轉

> 2026-09-12 全面實測（WordPress REST API、dig、curl、TLS 握手、程式碼全文檢索）。
> **既有技術文件與實況有多處落差，一律以實測為準。**

## 一句話現況

新官網 `lkkwellness.com` 已上線營運，但舊站 `l-kk.tw` **沒有退場**——
兩個站各自活著、各自收名單、各自宣告自己是官網。

## 最容易被誤解的三件事

### 1. 舊站不是「停用中的舊版」，它天天在發文

| 項目 | 數字（2026-09-12 實測） |
|---|---|
| 文章數 | **644** 篇（`x-wp-total`） |
| 分類 | 27 個 |
| 頁面 | 36 個（35 個在 sitemap 對外） |
| 最新一篇 | **2026-09-11**（前一天） |
| sitemap | 681 個網址，**每天重新產生** |
| 新站的文章頁 | **0**，也沒有 sitemap |

主要分類：知識分享 303、醫療衛教 290、訓練知識 274、運動人文 213、特殊族群 129、案例分享 57。

⚠️ **任何「關掉舊站」的計畫如果建立在「沒人在用了」的假設上都會出事**——
內容團隊天天在用它發文。動手前必須先問清楚誰在發、誰付主機費（第 0 階段）。

### 2. 有兩條名單是漏的

**舊站 `/bodytest/`** 有一份還在運作的 Contact Form 7 表單（form id `12508`），
欄位與新站預約表單高度重疊（姓名、性別、生日、電話、Email、代填者、
運動目的、病史、分店、付款方式、得知管道、方便時段、備註），
還掛著 `utm_source`/`utm_campaign`/`utm_content` 隱藏欄位與 `handl-utm-grabber` 外掛。
另有臉書廣告專用落地頁 `/臉書-預約體驗/` 掛同一套表單，感謝頁 `/填單感謝頁面/` 也活著。

**它走 WordPress 寄信，不會進 Firestore、不會出現在 `/admin` 名單。**
花錢買的廣告名單只變成一封信，沒人收信就消失，後台統計也少算。

**dev 測試站** `lkk-website-dev--lkkdev.asia-east1.hosted.app` 對全世界開放
（robots.txt 全開、canonical 指向自己、`/booking` 回 200 且表單真的送得出去）。
名單寫進 `lkkdev` 開發資料庫，正式後台看不到、沒人收到通知，**客人卻看到「預約成功」**。

### 3. 舊文件寫的「Nitro 代理 WordPress」從未實作，而且不該做

`nuxt.config.ts` 的 `routeRules` 數量是 **0**；
實測 `lkkwellness.com/知識分享/`、`/案例分享/`、`/wp-json/` 全部回 **404**。

**不該做的理由**：它與現況方向相反——新站已經在自己的網域對外營運、
canonical 與 og:url 都指向它，事實上已經選了「舊網域併進新站」那條路。
再者代理會把 644 篇文章的流量全打進 Cloud Run（`minInstances: 0`／512 MiB），
原本由 nginx 直出的靜態頁變成每次多一跳並可能踩冷啟動；
而且要讓代理成立必須改 WordPress 的 Site Address，一改就牽動舊站所有連結與 wp-admin cookie。

👉 **建議把 CLAUDE.md 那段架構描述標記為作廢。**

## 網域與 DNS 拓撲（動任何一根手指之前先看）

| | l-kk.tw（舊） | lkkwellness.com（新） |
|---|---|---|
| NS | `ns1/ns2.cyberdns.tw` | `ruth/jerry.ns.cloudflare.com` |
| A | 128.199.222.205（Cloudways） | 35.219.200.58（Google） |
| TTL | **3600** | 300 |
| MX | **有，公司信箱靠它** | **無** |
| www | 有 A 紀錄，但**憑證不含 www** | **完全沒有紀錄（NXDOMAIN）** |
| robots | 只擋 /wp-admin/ | 全開 |
| 快取 | `s-maxage=2592000`（30 天） | 靜態圖無 Cache-Control |

### 🔴 兩個會靜默出事的點

**MX／TXT 誤刪** —— 新網域沒有 MX，公司信箱**完全依賴 l-kk.tw**。誤刪之後三件事同時發生且無錯誤訊息：
全公司信箱停收、網站所有通知信寄不出去（**但表單照樣回「預約成功」**，寄信是 fire-and-forget，
錯誤只進 `console.error`）、後台 Google 登入白名單 `service@l-kk.tw` 失效把管理者鎖在門外。

**www.l-kk.tw 的 TLS** —— A 紀錄指向舊站主機，但憑證 SAN 只有 `l-kk.tw` 不含 www，
所以 `curl https://www.l-kk.tw/` 回 **000**，連線在 TLS 握手就失敗。
**含意：TLS 失敗發生在 HTTP 之前，所以這條路徑上的 301 永遠送不出去**，
而且驗收時看到的不是狀態碼、是完全沒有回應。**先做 301 再修憑證等於白做且很難察覺。**

## 四階段與相依順序

**階段 0（現在就能做，零風險、不等決策）**
1. 關掉 dev 測試站的對外索引與表單收件 ← 唯一「放著不管會持續漏單」的項目
2. 新站補 sitemap.xml 並在 robots.txt 宣告
3. 補 www.lkkwellness.com 的 DNS（Cloudflare CNAME + Firebase 自訂網域；萬用字元憑證已涵蓋）
4. 盤清舊站營運歸屬：誰發文、誰付費、備份能不能還原、後台有哪些帳號

**決策閘（擋住階段 2 全部）** —— 644 篇文章的去向
- A 搬進新站：不建議（新站無文章資料結構，等於再做一套 CMS ＋ 644 條中文網址逐條轉址）
- B 用代理統一網址：不建議（見上）
- **C 舊站保留為內容站、只把商業頁 301 → 建議**

**階段 1（動 DNS 前，提前 1–2 天）**
5. 確認誰能登入 CyberDNS（常見卡點：只有離職員工或當初外包廠商有帳號）
6. l-kk.tw 的 TTL 3600 → 300（**降 TTL 本身要等舊 TTL 過期才生效，沒有捷徑**）
7. 建立「MX/TXT 不得更動」清單並雙方簽認
8. 修好 www.l-kk.tw 憑證（301 的載體，即使最終要淘汰舊網域也得先修）
9. 在 GSC 驗證 lkkwellness.com（目前 DNS 只有 `fah-claim`，**沒有任何 google-site-verification**；
   舊網域有三組。沒屬性就沒有「變更網址」工具，切轉期間等於盲飛）
10. 降低舊站 s-maxage 並清空快取（**不做這步，301 的驗收結果不可信**）

**階段 2（等決策閘）**
11. 產出 35 個頁面的逐頁對應表 —— **絕不可「一律導首頁」**（會被判軟 404，比現狀更糟）
12. 確認臉書廣告目前投到哪個網址
13. 廣告網址改到新站，觀察 3–5 天確認名單有進後台
14. 舊站商業頁掛 301
15. 舊站 `/bodytest/` 與臉書落地頁改轉址（**順序必須在 13 之後**）
16. 改寫新站 25 處硬連回舊站的連結
17. 在 GSC 盯軟 404 與涵蓋範圍

**階段 3（收尾，可並行）**
18. 收斂兩套 GA4／GTM（舊站 `G-0YKEEDEETZ` + `GTM-5X328JSM`／新站 `G-DSQC1NTPJ3`，
    **兩個資源無法事後合併，拖越久斷層越大**）
19. 修正 l-kk.tw 重複的 SPF、補 DMARC（**先 p=none 只收報告**，不要一開始就設拒收；
    合併 SPF 要保留全部三組 include：sendinblue／firebasemail／google，漏掉任一組該來源立刻被擋）
20. 處置舊站過期外掛與 WooCommerce 空殼
21. 確立舊站長期定位與維護責任

## 憑證：Cloudflare 那條路有時限（2026-09-17 查證）

```
lkkwellness.com 憑證   Google Trust Services，SAN 含 *.lkkwellness.com
                       到期 2026-10-29，Google 在到期前約 30 天自動續簽
_acme-challenge        不存在
```

沒有 `_acme-challenge` 紀錄，代表用的是**負載平衡器授權**：憑證機構直接連到
網域解析出的 IP 驗證。Google 文件明說 A/AAAA 必須指向負載平衡器 IP，
**配發與續簽都需要**，而且「請求路徑上的第三方 CDN 可能讓驗證失敗」。

**含意**：開 Cloudflare 橘雲代理後，對外解析到 Cloudflare 的 IP，續簽可能失敗。
而且**不會當場壞**——現有憑證仍有效，要到到期日才整站無法連線，
中間一個月一切看起來正常。

若要走 Cloudflare：先確認 App Hosting 能不能改用 DNS 驗證（補 `_acme-challenge` CNAME），
或等續簽完成後再動（那時有三個月的安全窗口）。

費用不是障礙：Origin Rules 免費方案有 10 條，一條規則的表達式可比對多個路徑，
新站約 20 個路徑一條就寫得完。

## 萬用 301 的排除清單（實測過的規則缺口）

業主提供的規則排除了 `wp-admin`、`wp-login.php`、`wp-json`、`wp-content/uploads`、
`xmlrpc.php`、`wp-cron.php`。實測**還少三類，而且會讓後台破版**：

```
/wp-includes/**          後台的 CSS/JS 都在這      實測 200
/wp-content/themes/**    佈景主題資源              實測 200
/wp-content/plugins/**   外掛資源                  實測 200
```

另外三個會被轉成壞網址（規則的 `$1` 後面固定補斜線）：

```
/robots.txt         → …/robots.txt/
/sitemap_index.xml  → …/sitemap_index.xml/    ← Google 正在讀這份
/feed/
```

還有兩個會從「正常」變成「404」：`/category/*`（27 個分類，新站沒有對應路由）、
以及 Header 現在指的兩個彙整頁。

### 🔴 萬用規則必須逐條指定的第三類：舊站「頁面」路徑

`PAGE_MAP`（`server/utils/wordpress.ts`）裡的路徑**不是文章**，新站對它們一律 404。
最要命的是 `/bodytest/`——舊站的預約頁，被內文連了 **51 次**，是全站被連最多的目標。

```
l-kk.tw/bodytest/  ──萬用 301──▶  lkkwellness.com/bodytest/  ──▶  404
                   ──應該是────▶  lkkwellness.com/booking
```

內文裡的那 51 條已由 `rewriteArticleLinks` 改寫成站內，但**外部連結與書籤打的是舊站網址**，
只有 301 規則救得了。`PAGE_MAP` 那張表就是要逐條寫進轉址設定的那份清單。

### 🔴 會被萬用規則「打斷既有 301 鏈」的 9 條（2026-09-19 實測）

舊站有一批多層路徑，靠**舊站自己的 301** 轉到根目錄文章。萬用規則會先命中，
把多層路徑原樣丟到新站，而新站對多層路徑是直接 404（`pages/[...slug].vue` 一進來就擋），
舊站那層 301 永遠輪不到：

```
l-kk.tw/lkk-medical-and-sports-science/diabetes/
   今天： ──301(舊站自己)──▶ l-kk.tw/diabetes/            200
   切轉後：──301(萬用)────▶ lkkwellness.com/lkk-medical-and-sports-science/diabetes/   404
```

九條的最終目標在新站都是 200，已補進 `PAGE_MAP`（站內改寫已生效），
**但轉址設定也要同樣補這 9 筆**，否則外部流量照樣斷。

查法（這是可重跑的，日後舊站再長出新的多層連結時照做）：

```bash
# 1. 批次抓完整內文（7 個請求，不要逐篇打）
for p in 1 2 3 4 5 6 7; do
  curl -s "https://l-kk.tw/wp-json/wp/v2/posts?per_page=100&page=$p&_fields=slug,content" -o wp-p$p.json
done
# 2. 取出所有指向 l-kk.tw 的非圖片連結，挑出多層路徑
# 3. 逐一 curl -L，看最終是 200 還是 404
```

2026-09-19 的結果：54 個目標裡 **45 個舊站本來就 404**（舊分類結構早已不存在，
是文章裡既有的死連結，維持指向舊站是對的——改寫過來只是把死連結搬家），
**9 個仍然活著**，就是上面那批。

## 舊站的 `www` 憑證：要修的是那一張，不是另外一張

`l-kk.tw` 與 `www.l-kk.tw` **共用同一張憑證**（指紋相同），
而那張的 SAN 只有 `DNS:l-kk.tw`。openssl 說得很明白：`verify error:num=62: hostname mismatch`。

```
curl https://www.l-kk.tw/       → 000（TLS 握手就失敗）
curl -k https://www.l-kk.tw/    → 301（忽略憑證後其實有轉址！）
```

**伺服器上已經設好 www → 非 www 的 301，但沒有人到得了。**
修法是在 Cloudways 重新簽發一張同時涵蓋兩個名字的憑證，
而且要在掛任何 301 之前做。

## 非正式主機必須 noindex（2026-09-19 補上）

文章改由新站以根目錄網址渲染之後，**dev 站從 20 幾頁變成 667 頁，
而且每一頁都跟 l-kk.tw 上的那一篇一字不差**。實測當時 dev 完全對 Google 敞開：
`robots.txt` 是「全部允許」、沒有 `X-Robots-Tag`、canonical 還指向 dev 自己。

這會讓搜尋引擎同時看到三份相同內容（舊站、正式站、dev），彼此稀釋。
**跟切轉排程無關，是即時發生的**，所以獨立於四階段先處理掉了。

🔴 `public/robots.txt` 是 dev 與 prod **共用的原始碼**，改它會連正式站一起擋。
做法是改成依主機名判斷的路由（`server/routes/robots.txt.ts`）＋
`server/middleware/noindex-nonproduction.ts`，清單集中在 `server/utils/site-hosts.ts`。
細節與注意事項見 [[lkk-wp-articles]] 的地雷 7。

⚠️ 正式網域上線前務必確認 `PRODUCTION_HOSTS` 已含該網域——
判斷是白名單制，**沒列到的主機一律 noindex**。這是刻意的（漏擋只是重複內容，
誤擋是流量歸零），但也代表換網域時這份清單是必改項。

```bash
# 切轉後第一件事：確認正式站沒有被自己擋掉
curl -s https://lkkwellness.com/robots.txt          # 預期 Allow: /
curl -sI https://lkkwellness.com/ | grep -i x-robots # 預期沒有這個標頭
```

## 🔴 做錯順序會無法回復的三件事

1. **在對應表完成前就把 l-kk.tw 直接改指向新站** → 644 篇文章當場全數 404，
   多年排名要很久才回得來。TTL 3600 代表回滾要等最久一小時，這一小時流量是斷的。
2. **在 CyberDNS 面板上「清乾淨重設」** → MX 與 SPF 一起消失（見上，完全無聲）。
3. **先關舊站、之後再補 301** → 權重歸零且無法回收。**轉址必須在舊站還活著時掛上去。**

## 新站硬連回舊站的連結：25 處（2026-09-19 重新量測）

⚠️ 這個數字會隨改動變動，**引用前先重跑**。曾經有 25／36／13 三個說法，
36 是把 10 個 `@l-kk.tw` 信箱誤算進去。正確算法：

```bash
grep -rnoE 'https://l-kk\.tw[^"'"'"' )]*' --include="*.vue" --include="*.ts" \
  pages components layouts error.vue server utils config | grep -v "@l-kk.tw" | wc -l
```

| 檔案 | 數量 | 性質 |
|---|---|---|
| `pages/news.vue` | 14 | 🔴 **不是外部媒體原文，是舊站文章網址**（見下） |
| `pages/knowledge-center.vue` | 2 | 「瀏覽更多」＋讀取失敗時的退路 |
| `pages/cases-center.vue` | 2 | 同上 |
| `pages/activity-center.vue` | 2 | 同上 |
| `server/utils/wordpress.ts` | 1 | **WP API base，不是使用者連結**，不要動 |
| `server/api/public/wp-articles.get.ts` | 1 | 同上 |
| `pages/locations/index.vue` | 1 | `category/案例分享` |
| `pages/booking.vue` | 1 | `category/案例分享` |
| `error.vue` | 1 | `category/knowledge` |

跟 2026-09-12 那次相比：Header 的 4 條、HeroSection 的 2 條、CasesSection 的 1 條
**已經改成站內連結**（`/knowledge-center`、`/cases-center`），三個彙整頁則新增了 6 條。

📌 最後那三條（`locations`、`booking`、`error.vue`）指向舊站的分類彙整頁，
而新站**現在已經有對應頁面**了（`/cases-center`、`/knowledge-center`）。
它們是彙整頁做出來之前留下的，可以改成站內——這是三個彙整頁那 6 條以外、
還沒處理的部分。

⚠️ **在替代目的地存在之前不要先改這些連結**——會把還能用的入口換成 404，比現況更糟。

🔴 但 `pages/news.vue` 那 14 條**不適用這條警告，要逐一查證再下結論**。
它們看起來像「各家媒體的原文連結」，實際上是 `l-kk.tw/<slug>/` 形式的**舊站文章網址**
（媒體報導在舊站是一篇一篇的文章）。10 個不重複目標 2026-09-19 實測在新站**全部 200**——
因為新站本來就以根目錄渲染全站文章。

```bash
# 判斷一條舊站連結能不能改成站內：直接打新站同一個 slug
curl -s -o /dev/null -w '%{http_code}\n' "https://lkk-website-dev--lkkdev.asia-east1.hosted.app/<slug>/"
```

⚠️ 教訓：**「外連舊站」不等於「新站沒有」**。文章改由根目錄渲染之後，
任何 `l-kk.tw/<單層 slug>/` 在新站都有對應頁。憑檔名或連結文字猜性質會猜錯
（2026-09-19 就把這 14 條誤判成外部媒體原文）。

（同頁的「查看全部報導」原本外連 `l-kk.tw/category/news/`，2026-09-19 依業主指定
改連站內的 `/activity-center`。）

## 快速查證指令

```bash
# 舊站內容量（看 x-wp-total 標頭，不要抓整包）
curl -sI "https://l-kk.tw/wp-json/wp/v2/posts?per_page=1" | grep -i x-wp-total

# 兩個網域的 DNS 拓撲
for d in l-kk.tw www.l-kk.tw lkkwellness.com www.lkkwellness.com; do
  echo "$d: $(dig +short A $d) NS=$(dig +short NS $d | head -1)"; done
dig +short MX l-kk.tw    # 有值＝公司信箱靠它，不能動

# 舊站 www 的 TLS（預期 000＝握手就失敗）
curl -s -o /dev/null -w "%{http_code}\n" --max-time 10 https://www.l-kk.tw/

# 代理到底有沒有實作（預期 404）
curl -s -o /dev/null -w "%{http_code}\n" https://lkkwellness.com/知識分享/

# 舊站表單還活著嗎（預期含 wpcf7-f12508）
curl -s https://l-kk.tw/bodytest/ | grep -o 'wpcf7-f[0-9]*' | head -1
```

## 相關

- 四階段完整清單（給業主看的版本）：2026-09-12 產出的「切轉執行清單」artifact
- 部署流程本身見 `CLAUDE.md` 與 [[lkk-project-context]]
- 環境設定漂移見 [[lkk-env-audit]]
- 部署後怎麼驗證見 [[lkk-deploy-verify]]
