---
name: lkk-project-context
description: 練健康官網 (Vue 3 + Nuxt 3) 的實際架構、部署方式、Firebase/CLI 現況與開發地雷。在此專案開發（頁面、Nitro API、/admin 後台、Firestore、部署設定）前先讀，掌握「CLAUDE.md 文件」與「程式碼實況」的落差，避免踩雷。
---

# 練健康 lkk-new-web 開發脈絡

> 這份 skill 補充（不取代）根目錄 `CLAUDE.md`。CLAUDE.md 描述的是**目標架構**，本檔記錄**程式碼實況與落差**。兩者衝突時，以實際程式碼為準。

## 專案本質
- 練健康（l-kk.tw）官網，Vue 3.5 + Nuxt 3.17（SSR，nitro `firebase-app-hosting`）。**已從 monorepo 拉平：Nuxt app 直接在 repo 根目錄**（原 `apps/newweb` 那層已移除、舊 Next.js `apps/web` 已刪）。
- **正從舊 Next.js 14 遷移到 Nuxt 3，尚未完成**。`README.md` 過時（還在講 Next.js，勿信）。
- 後台 `/admin` 用**自建 JWT + bcrypt**（cookie `lkk-admin-token`），**不是 Firebase Auth**。
- 資料在 Firestore（Admin SDK，`server/utils/firebase.ts` 延遲載入）；`stores`/`coaches`/`lkk4_records` 有 `server/utils/fallback-data.ts` 保底。
- 字型是系統微軟正黑體（非文件寫的 Noto；`@nuxtjs/google-fonts` 裝了沒啟用）。

## 部署 / Firebase / CLI（dev/prod 雙環境，皆上線）
- 同 repo `Stone-811/lkk-website`，靠「不同專案 backend + 不同分支 + 分支各自 apphosting.yaml」分離：
  - **dev**：專案 `lkkdev`／backend `lkk-website-dev`／分支 `dev`／URL `lkk-website-dev--lkkdev.asia-east1.hosted.app`
  - **prod**：專案 `lkkprod`／backend `lkk-website`／分支 `prod`／URL `lkk-website--lkkprod.asia-east1.hosted.app`／**正式對外網域 ✅ `lkkwellness.com`（2026-07-31 已上線，Cloudflare DNS「DNS only 灰雲」+ Google SSL）**
- 發 prod＝把 dev 改動帶到 `prod` 分支。**⚠️ `apphosting.yaml` 各分支值不同（dev=`lkkdev`/`l-kk.tw`、prod=`lkkprod`/`lkkwellness.com`），絕不能互蓋**。**最穩＝檔案級帶入（2026-08-11 實測）**：`git checkout -B prod origin/prod` → `git checkout origin/dev -- <只要的檔案…>`（只帶目標檔、**不含 apphosting.yaml**）→ commit 前 `git status --short` 確認 staged 沒有 apphosting.yaml、`grep FIREBASE_PROJECT_ID apphosting.yaml` 仍 `lkkprod` → commit（不加 `-a`，避免帶進工作區雜項如 CLAUDE.md）→ `git push origin prod` → 切回 `git checkout dev`。（整支 `git merge dev` 亦可，但要事後 `git diff origin/prod -- apphosting.yaml` 確認為空；檔案級更不易出錯。）部署：push 分支 → 自動 build；或 `apphosting:rollouts:create <backend> --project <proj> --git-branch <branch> --force`。
- **prod 現況（2026-07-31）**：已 merge dev→prod、對外 `lkkwellness.com` ＝最新版（含 LKK4 全齡改版等）；**Email 已修好**（有效 lkkwellness App Password，dev/prod 都通）；**prod Auth 尚未開 Google 登入** → 後台用緊急密碼 `lkkwellness@gmail.com`/`lkkwellness-prod`。網域/SMTP/UTM 細節見記憶 [[lkk-web-deploy]]、[[lkk-web-gotchas]]。
- **hosted.app 已 301 轉到 lkkwellness.com**（`server/middleware/redirect-canonical.ts`，2026-08-03）：正式站醜網址形同停用、SEO 合併。⚠️ **在 App Hosting 上「依網域判斷」要讀 `x-forwarded-host`，不是 `host`**——前面 Envoy CDN 把 `host` 改寫成內部 `…run.app`，原始請求網域落在 `x-forwarded-host`（第一版比對 host 完全沒生效就是踩這個）。middleware 只比對 prod hosted.app 的 xfHost 才轉，故 lkkwellness.com 不迴圈、dev 不受影響。App Hosting 預設 hosted.app 網址無法真正關閉，只能靠轉址。
- **gcloud 未安裝**，一律 `npx firebase-tools`（已登入 tingo8320@gmail.com，可存取 lkkdev/lkkprod）。部署 repo（唯一真實來源）：`/Users/stone/4.柚智源/練健康/3. 形象網站翻新`。舊 `Downloads/lkk-new-web` 雙胞胎已棄用。
- 新環境 setup 血淚點：Firestore 用 `firestore:databases:create --location asia-east1`（別靠 deploy 自動建→會在 nam5）；secrets set 後**務必 `grantaccess --backend`**（否則 Misconfigured Secret）；啟用 Storage；Auth 啟用 Google provider+加該 hosted.app 授權網域。詳見記憶 [[lkk-web-deploy]]。

## 安全（動 /admin 或 server/api/admin 前必看）
- 已修補：後門帳號（改 `ALLOW_DEV_ADMIN` gate）、`JWT_SECRET` 正式站強制、登入頁明文帳密移除。
- **部署前必設 `JWT_SECRET` secret**，否則正式站啟動 crash。
- **角色權限系統（2026-08-05 上線 dev/prod）**：受限角色 **`sales`（名單專員）**＝只可看客戶預約＋合作表單。三層：`utils/adminAccess.ts` `canAccessAdminPath`（選單過濾＋前端守衛共用）／`middleware/admin-access.global.ts`（路由守衛，**用 `useRequestFetch()` 取 session→存 `useState('adminUser')`**，layout 直接讀該 state；**切勿改回 `$fetch`/`onMounted useFetch`，會害重新整理被登出**，見 [[lkk-web-gotchas]] 第 12 條）／**`server/middleware/admin-api-guard.ts`（伺服器角色鎖，集中一支）**。`admin-api-guard`：`/api/admin/*`（`auth/` 除外）一律要登入；sales 只放行 `leads*`＋`stores` 的 **GET**（客戶預約頁要讀分店名，勿全鎖 stores）；`users*` 僅 admin。使用者管理頁 `/admin/users`（僅 admin，建帳號/改角色/停用/重設密碼）＋自助改密 `server/api/admin/auth/change-password.post.ts`（放 auth/ 繞角色鎖但只能改自己）＋ `layouts/admin.vue` 側邊「修改密碼」。新增角色記得改 `UserRole` union（auth.ts）＋ `canAccessAdminPath`＋`admin-api-guard` 三處。
- **仍待修**：角色鎖只擋了 sales/users → coaches/stores/lkk4-records 寫入對 editor/store_staff 仍無角色分級（IDOR/破壞性動作）。⚠️ **停用不即時**：`getSession` 只驗 JWT 不回查 DB → `isActive=false` 後既有 cookie 仍可用到 token 到期（7 天）；登入無限流。詳見記憶 [[lkk-web-security-debt]]。角色檢查慣用寫法見 `server/api/admin/stores/index.post.ts` 或新的 `requireRole(event,roles)`。
- 表單全無 reCAPTCHA/Turnstile。

## 常踩的地雷
1. **store 資料結構三套不一致**：後台送 `transport{}`/`images{env1..5}`，但 `stores/[id].patch.ts` allowedFields 漏了 `transport`（交通資訊儲存被丟棄）；公開 API 把 images 當陣列；型別 `StoreDoc` 是 `string[]`。
2. `pages/cooperation.vue` 表單是**假送出**（setTimeout），後端 API 已就緒沒接。
3. ✅ `pages/booking.vue` 成功畫面 LINE 按鈕＝**oaMessage 預填**（`line.me/R/oaMessage/@201fzruh/?<encodeURIComponent(訊息)>`，帶「我是{姓名}，我已報名練健康{分店}…」；成功畫面不清空 formData 故讀得到姓名/分店。使用者仍須自按送出、最好已加好友、手機最準）。後台 `pages/admin/leads.vue` 詳情/CSV 已顯示完整 booking payload（含代填者/健康狀況/LINE ID/UTM）。圖片位實況（多數版面無真 `<img>` 位，放圖要改程式）見 [[lkk-web-gotchas]] 第 11 條。
4. `pages/locations/index.vue` 用寫死資料，非 API。
5. WordPress 代理、reCAPTCHA 皆未實作（CLAUDE.md 有寫）。
6. **教練卡片 `<button>` 垂直置中 → 圖片下移（2026-08-11 修，已上 prod）**：`pages/team-intro/coaches.vue` 教練卡是 `<button>`（圖 `aspect-[3/4]`＋資訊區 `.p-4`）。grid 同排等高，但各教練專長標籤行數不同→`.p-4` 高度不一→**`<button>` 天生會垂直置中內容**（即使非 flex）、把矮卡多出的空間分到圖片**上方**、圖被下推（實測許雅淇比同排低 13px）。**修法：button class 加 `flex flex-col`**（內容靠上）→ 全教練圖頂端 offset 都 1px、名字橫幅同排對齊。⚠️ 凡「`<button>` 當卡片＋grid 等高拉伸」都可能中招；排查先量 `imgDiv.top - btn.top` 比對同排各卡，別先懷疑圖片本身。**教練圖現況**：全 43 張皆 **500×550**、底部「教練｜姓名」橫幅**燒進圖檔**（與卡片下方 HTML 名字重複）、部分人物構圖偏鬆大小不一。`object-cover` 對此近方形圖**只裁左右不裁上下**→**CSS `object-position` 無法上下移、也無法只靠 CSS 拉齊人物大小差異（除非放大，會連橫幅一起放大變醜）**。根治靠換照片：已請廠商提供「純人像、無橫幅、構圖統一、500×550→建議1000×1100 JPG」，規格文件 `docs/教練照片規格.md`，到時直接覆蓋 `public/images/coaches/<分店>/<檔名>` 不用改程式。

## 慣例
- Nitro API：admin 端各檔 inline `const session = await getSession(event)`；寫入類要補角色檢查。
- 表單 → `server/api/leads/*.post.ts` → 寫 Firestore `leads` + `server/utils/email.ts` 寄信（nodemailer + Gmail SMTP，收件人讀 Firestore `settings`）。
- UTM 追蹤（已實作）：`composables/useUtm.ts` + `plugins/utm.client.ts` 進站擷取 `utm_*` 存 sessionStorage；booking/franchise 送出帶 `utm`，存進 lead `payload.utm`（`{source,medium,campaign,content,term,referrer}`）；後台 `leads.vue`（booking）與 `cooperation.vue`（franchise/cooperation）詳情+CSV 顯示；**⚠️ 2026-08-11：UTM 已不再是後台名單篩選欄**（原「所有來源/所有活動」UTM 篩選移除，改用 公司/來源/日期，見下方名單欄位對照與 [[lkk-web-gotchas]] 第 16 條）；UTM 仍存 `payload`、詳情/CSV 看得到。分店建議放 `utm_campaign`。cooperation 前台仍是假送出（未接 API），故其 UTM 尚未實際寫入。
- 根目錄 `npm install`（**需 `.npmrc` 的 `legacy-peer-deps=true`**，否則 npm 10.9 arborist 會崩）；build 用 `npm run build`（=`nuxt build`）。`firebase-tools` 已非依賴，CLI 用 `npx firebase-tools`。
- **改 → 發 → 驗證流程**：改在 `dev` 分支 → `npm run build` 確認過 → `git push origin dev`（觸發 lkkdev rollout，約 4–7 分鐘）→ **背景輪詢 `lkk-website-dev--lkkdev.asia-east1.hosted.app` 抓該次改動的新內容標記確認真的上線**再回報（別只看 push 成功）→ 使用者確認後才 merge `dev`→`prod` 發正式站。**驗版面/CSS 類改動**：內建瀏覽器 pane 的 screenshot 偶爾會卡在頂部或整片空白、`computer scroll` 逾時（pane hidden）；此時改用 `javascript_tool` 直接量渲染結果最可靠——`getComputedStyle`/`getBoundingClientRect`（如比對同排卡片 `img.top - btn.top`）、canvas `drawImage`+`getImageData` 掃像素（量燒進圖的橫幅位置）、或 `document.body.style.zoom='0.3'`+把 `loading=lazy` 改 `eager` 讓整頁擠進一張截圖。輪詢部署則 grep `/_nuxt/*.js` chunk 內該次改動獨有字串（如新 class `flex flex-col bg-white`）。
- **預約表單變體系統（2026-08-05，廠商 UTM 活動用）**：`/booking?v=<key>` 對應 `config/bookingVariants.ts` 的設定驅動變體——**加廠商＝在該檔加一段設定、不改 `booking.vue`**（未知 `v` 自動 fallback default）。變體可覆蓋：Hero(badge/title/titleHighlight/subtitle/checklist/ctaText)、`lockStoreId`(以 id/slug/name 命中→預選+隱藏分店選單)、`hideSources`、`allAgesFree`、`company`(公司)、`leadSource`(來源)。**`allAgesFree`**：隱藏付款方式、自動 `paymentMethod='活動免費'`、解除「未滿50歲清掉免費」年齡邏輯；**所有價格文案集中在 `pricingCopy` computed**（Hero badge/標題、底部說明、FAQ f1/f2、服務卡 `steps[2].badges` 全讀它，改價只動一處）。**來源可用網址參數 `?src=` 覆蓋**（同公司不同來源共用同一變體，如 `?v=nanshan&src=LINE`）。送出時 `formVariant`/`company`/`leadSource` 一起寫進 `leads/{id}.payload`（已實測寫入 Firestore ✅），後台 `leads.vue` 清單「來源」欄＋詳情「活動來源」區塊顯示。`?src=` 用語規範見 `docs/廠商表單網址規範.md`。meta description 維持通用（SEO 不收 `?v=` 版本）。現有變體：`abbott`(亞培/LINE)、`nanshan`(南山/網站)，皆全齡免費、不鎖店、**顯示**得知管道（`hideSources` 是能力，但這兩家不設）。**改 `booking.vue` 勿把 SSR 分店改成 client fetch 以外的問題**：分店目前是 `onMounted` client fetch（非 SSR），會兩段式載入。
- **名單「來源」欄位對照（主來源約定，2026-08-05）**：一筆 lead 有多個來源相關欄位、各司其職，**勿硬合成一個**——**① 廠商活動來源（分析主依據）**：`payload.company`(公司)＋`payload.leadSource`(來源)，來自 `?v=`/`?src=`。**② GA 追蹤**：`payload.utm.{source,medium,campaign,content,term,referrer}`，來自 `?utm_*`，只給 Google Analytics（後台 UTM 欄另顯示）。**③ 使用者自填「得知管道」**：`payload.sources`(陣列)＋頂層 `sourceChannel`(=sources join)，是使用者在表單勾的，**與 ①② 不同概念、勿混用**。`payload.formVariant`＝`?v=` 值。**`sourceTag` 已於 2026-08-05 移除**（曾與 company/leadSource 重疊，退役清除）。清單「來源」欄＋詳情「活動來源」區以 chips 顯示 company+leadSource。**後台名單篩選（2026-08-11 重構）＝兩個獨立下拉＋日期**：『公司』(`payload.company`；選項＝`bookingVariants` companies ∪ 名單值) ＋『來源』(`payload.leadSource`；選項＝`?src=` 規範清單常數 `SOURCE_CHANNELS`=[網站/LINE/Facebook/Instagram/Email/傳單/Google] ∪ 名單值)，**兩者各自比對自己欄位、不混（業主明確要求分開，勿再 union）**；另加 `createdAt` 起訖日期篩選。**UTM 移出篩選**（仍存 payload、詳情/CSV 顯示）。
- **第二人稱用字（2026-08-11 現況）**：**前端網站一律「你」、後台 `/admin` 一律「您」**。曾一度全站改「您」，2026-08-11 前端反轉回「你」（125 處/18 檔，含 `privacy.vue` 隱私權政策；後台保留「您」）。**改前端頁面/section 文案勿用「您」、改後台勿用「你」。**
- **變體表單的寄信行為（`server/utils/email.ts`，2026-08-05）**：帶 `company` 的名單＝全齡免費活動 → **`bookingFeeLabel(birthDate,paymentMethod,company)` 有 company 就回 `null` → 通知信與確認信都不顯示「付款方式」那行**（原本純以出生年齡判斷，會把未滿 50 歲誤標成臨櫃 $500）。**管理者通知信 `sendLeadNotification`**：主旨加 `【company】`、標題下方橘色「活動來源：company · leadSource」橫幅（僅變體名單）。**填單人確認信 `sendFormConfirmation`**：**業主決定「不標活動」**（曾加過又撤，勿再加回）。資料流：`booking.post.ts` 把 `company`/`leadSource` 傳給這兩個寄信函式（`sendLeadNotification` 兩者都給、`sendBookingConfirmation` 只給 company 用於隱藏付款）。
- **變體/表單/寄信 技術債 checklist（2026-08-05 體檢；架構健康、無埋雷，以下皆「成長後再處理、現在勿動」）**：① **寄信無重試/告警（中優先）**——`email.ts` 是 fire-and-forget，SMTP 一失敗通知信就**靜默遺失**（只 `console.error`）；營運吃重時加「失敗補記 Firestore / 補寄」。② **`?src=` 未在程式 enforce**——自由字串、一致性只靠 `docs/廠商表單網址規範.md` 紀律；來源寫法亂了再加 normalize/白名單。③ **`booking.vue` 1088 行、變體條件累積**——再堆變體邏輯就抽 `useBookingVariant` composable。④ **`bookingFeeLabel` 吃 3 輸入偏繞** + 變體信件用 `if(company)`——「每家廠商不同信件內容」出現時，像 `pricingCopy` 那樣集中。⑤ 分店 `onMounted` client fetch（非 SSR）→ 兩段式載入。⑥ `paymentMethod='活動免費'` 是 magic string，付款型態變多再收斂。
- **LKK4 頁（`pages/lkk4.vue`）已全齡改版**：定位「全齡」非中高齡、賽事始於 2021（第六屆＝2026，勿寫 2019），詳見記憶 [[lkk-web-gotchas]]。
- **後台下拉選單自訂箭頭**（2026-08-05）：`layouts/admin.vue` 根節點掛 `.admin-root`，用**非 scoped 全域 `<style>`** 的 `.admin-root select{appearance:none;background-image:chevron;background-position:right .85rem center;padding-right:2.25rem}` 一次套所有後台 select（原生箭頭改自訂、內縮）。⚠️ layout 用 `scoped`+`:deep()` **無法穩定命中 `<slot/>` 內的頁面 select**（slotted content 屬 page scope）→ 故採「wrapper class＋全域 style」。前台單頁要改 select 箭頭則各頁自己 `<style scoped>`（如 `personal-record.vue`，用 `background-position:right 1rem center`）。
- **圖片位/切圖**：業主的切圖規格表多數區塊**還沒有真 `<img>` 位**（Hero、首頁門店卡、LKK4 四項卡=SVG、媒體報導=文字、locations/index 店卡=漸層），「放圖」要先改程式；有真圖位的只有 ServicesSection「我們的服務」、`/services`、單一門店環境照（Firestore `store.images.env1~5`）、Team。比例/尺寸/object-fit 詳見 [[lkk-web-gotchas]] 第 11 條。
