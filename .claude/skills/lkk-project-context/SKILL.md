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
- **prod 發佈 2026-08-20**：`/about`、`/news`、`/group-booking` 三個新頁＋團體課系統＋導覽改名（「經營團隊」→「關於練健康」、新增「媒體報導」、「異業結盟」→「合作洽談」）已上正式站，檔案級帶入 23 檔、`apphosting.yaml` 未動（複驗 `lkkprod`/`lkkwellness.com` 原值）。⚠️ **判斷「什麼還沒上 prod」一律用 `git diff --stat origin/prod origin/dev`（檔案級），別看 `git log origin/prod..origin/dev`**——prod 是檔案級帶入、commit 不同但內容可能已同步，commit log 會嚴重高估未上線的量。⚠️ **`/team-intro` 已 301 永久導向 `/about`**（`pages/team-intro/index.vue` 只剩 `navigateTo('/about',{redirectCode:301})`）；`/team-intro/coaches` 子頁不受影響。301 是不可逆的 SEO 訊號（權重併給 `/about`、Google 會逐步從索引移除舊網址），若日後要把「經營團隊」拆回獨立頁會吃虧，要保留彈性就改 `redirectCode: 302`。
- **⭐ 讀寫 lkkdev/lkkprod 的 Firestore（2026-08-22 打通）**：本機 `.env` 的 `FIREBASE_PROJECT_ID` 是 **`lkk-website-dev`＝另一個舊專案**，不是 dev 站（`lkkdev`）也不是正式站（`lkkprod`）——**用 .env 讀到的資料不代表線上**（曾因此把 fallback 店名寫成舊專案的「新店七張店」，線上其實是「七張店」）。正解：firebase-tools 已登入 tingo8320@gmail.com，把 `~/.config/configstore/firebase-tools.json` 的 `tokens.refresh_token` ＋ firebase-tools `lib/api.js` 裡的公開 clientId/clientSecret，組成 `{client_id,client_secret,refresh_token,type:'authorized_user'}` 存成 adc.json（權限 600、放 scratchpad、不進版控），再 `GOOGLE_APPLICATION_CREDENTIALS=adc.json node script.cjs`（firebase-admin 用 `applicationDefault()`）。⚠️ 取 secret 的正規表示式要抓 `envOverride("<ENV名>", "<值>")` 的**第二個**參數，抓錯會 `invalid_client`；⚠️ **腳本要放專案目錄執行**（scratchpad 無 node_modules）。firebase-tools 本體在 `~/.npm-cache-new/_npx/*/node_modules/firebase-tools`。
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

## 團體課報名系統（`/group-booking` + `/admin/group-classes`，2026-08-19 完成）

**架構刻意與客戶預約（booking）一比一對齊**——同一套變體/UTM/寄信/後台版型模式，兩邊改動要一起想。對照表：

| 面向 | 客戶預約（體驗課） | 團體課報名 |
|---|---|---|
| 前台頁 | `pages/booking.vue` | `pages/group-booking.vue` |
| API | `server/api/leads/booking.post.ts` | `server/api/leads/group-class.post.ts` |
| lead `type` | `booking` | `group_class` |
| 變體設定 | `config/bookingVariants.ts` | `config/groupClassVariants.ts` |
| 確認信 | `sendBookingConfirmation()` | `sendGroupClassConfirmation()` |
| 後台 | `pages/admin/leads.vue` | `pages/admin/group-classes.vue` |
| CSV 檔名 | `booking_leads_*.csv` | `group_class_leads_*.csv` |

### 表單內容（前台）
`/group-booking` 是完整 landing page（Hero＋trust bar＋左表單右資訊＋各店開課時段 tabs＋課程卡＋三步驟＋FAQ＋成功畫面）。三段式表單：
- **第一部分 學員資料**：姓名/性別/年齡區間(50歲以下·50–65歲·65歲以上)/手機/Email/是否本人填寫；選「否」才出現「報名者姓名＋與學員關係」。
- **第二部分 課程資訊**：課程(基礎重訓團班 $2,400／樂齡肌力體適能團班 $2,400／練健康舉重團班 $3,200，皆 4 堂一期)、門店(南京·松江·西門·新店七張＋「請教練推薦」)、偏好時段(選填)、重訓經驗(選填)、**疾病／舊傷／開刀史（必填，健康請填「無」）**。
- **第三部分 其他調查**：得知管道(可複選)、備註。
- **必填**：name/gender/ageRange/phone/**email**/isFillerSelf/course/store/medicalHistory（⚠️ **團課 Email 是必填**，booking 的 email 才是選填）。手機驗 `^09\d{8}$`。
- 成功畫面主 CTA＝加 LINE 官方帳號 **@201fzruh**（團課要靠 LINE 排梯次）。

### 資料落點（`leads/{id}`）
頂層 `type/name/phone/email/sourcePage='/group-booking'/message(=note)/status/internalNote`；`storeId` 恆 `null`（團課門店存字串不是 Firestore store id）。`payload`：
`gender, ageRange, isFillerSelf('是'|'否'), fillerName, relationship, course, store(完整字串「南京店｜台北市…」), storeName(「｜」前的店名), preferredTime, experience, medicalHistory, source[](得知管道), note, utm{}, formVariant, company, leadSource`。
⚠️ **命名與 booking 不同**，後台/信件取值要注意：得知管道 booking 叫 `sources`、團課叫 `source`；代填 booking 用 `filledBySelf: boolean`＋`bookerName`、團課用 `isFillerSelf: '是'|'否'`＋`fillerName`；健康 booking 用 `hasMedicalCondition`+`medicalConditionNote`、團課用單一 `medicalHistory` 字串。

### 寄信（`server/utils/email.ts`）
送出後**寄兩封**（皆非阻塞 `.catch`）：
1. **管理者通知信** `sendLeadNotification({type:'group_class', …})` → 收件人讀 Firestore `settings.emailRecipients`（現為 lkkwellness@gmail.com）。主旨 `【練健康】新團體課報名表單【company】- 姓名`；有 company/leadSource 時加橘色「活動來源」橫幅（與 booking 同一段共用邏輯）。**信內「分店」列標題與頁尾後台連結會依 `data.type` 切換**（團課＝「上課門店」／連 `/admin/group-classes`；其他＝「選擇分店」／`/admin/leads`）。
2. **填單人確認信** `sendGroupClassConfirmation()` → 只在有 `email` 時寄（團課 email 必填故實務上一定寄）。版型走 `sendFormConfirmation` 的 **sections 分區塊版**，與 `sendBookingConfirmation` 完全同一套：學員資料／填表人資料（僅代填時有列）／健康狀況／報名資訊。`formConfirmationConfig.group_class` 的 closing 內含 LINE @201fzruh 連結。課程價格由 API 的 `COURSE_PRICES` 常數帶入確認信（改價要同步 `group-booking.vue` 的 `courses` 與 API 常數兩處）。
⚠️ 承襲 booking 的決定：**確認信不標活動來源**（company/leadSource 只進管理者信與後台）。

### 廠商變體 / UTM（`config/groupClassVariants.ts`）
用法與 booking 一致：`/group-booking?v=<key>&src=<來源>`，**變體 key 與 bookingVariants 刻意同名**（`abbott`/`nanshan`），同檔活動可同時發兩條連結、後台用同一組公司/來源篩選對得起來。可覆蓋欄位：`hero{badge,title,titleHighlight,subtitle,checklist,ctaText}`、**`lockStore`**（填『南京店』即可，比對門店字串開頭→自動帶入並把下拉換成唯讀橘卡）、**`lockCourse`**（填完整課名→唯讀橘卡）、`hideSources`、`company`、`leadSource`。未知 `v` 自動 fallback `default`。送出時一併帶 `formVariant`(=`?v=`)、`company`、`leadSource`(`?src=` 優先於變體預設)、`utm`(`useUtm().getUtm()`，沿用全站 `plugins/utm.client.ts` sessionStorage 機制)。網址規範／`?src=` 七個固定用語見 `docs/廠商表單網址規範.md`（已含 group-booking 章節）。
⚠️ 團課變體**沒有** `allAgesFree`（團課本來就不分年齡計價），別照抄 booking 的欄位。

### 後台（`pages/admin/group-classes.vue`）
版型 1:1 比照 `/admin/leads`：匯出 CSV 按鈕、單排可搜尋下拉篩選（搜尋／日期／門店／**課程**／狀態／公司／來源／UTM 來源／UTM 活動）＋已套用 chips＋清除全部＋筆數、可排序表格（學員/門店/狀態/時間）、狀態下拉即時 PATCH、詳情彈窗（學員資料／報名資訊／填寫者資料／健康狀況／活動來源／UTM／學員備註／內部備註可存檔）。
- 門店與課程的篩選選項**從現有名單自動蒐集**（團課門店不是 Firestore `stores`，不打 `/api/admin/stores`）。
- 公司選項＝`groupClassVariants` 的 companies ∪ 名單值；來源選項＝`SOURCE_CHANNELS` 常數 ∪ 名單值。**與 leads.vue 同樣刻意不列 UTM 媒介**（勿加回）。
- 走的是共用 `/api/admin/leads?type=group_class` 與 `/api/admin/leads/{id}` PATCH，沒有專屬 API。

## 共用層／重構現況（2026-08-21 F+D+B+C+A+E 完成，動這些區塊前先讀）

- **CSV 匯出**＝`composables/useCsvExport.ts`（BOM＋引號跳脫＋null 出空字串）。leads/cooperation/group-classes 三頁共用，各頁只留欄位定義。**勿再手寫組 CSV**。
- **表單寫入**＝`server/utils/leads.ts` 的 `createLead()`。四支 `/api/leads/*.post.ts` 共用；欄位值由呼叫端先正規化好**原樣傳入**（函式內不 || null）。驗證與寄信仍在各 API。
- **管理者通知信**＝`email.ts` 的純函式 `buildLeadNotificationEmail()`＋`notifRow(label,value,{wide/top/pre/tone:'warn'|'danger'/last})`。**加新表單類型＝加欄位列定義，勿手寫 <tr> HTML**。重構時用快照法驗證（暫時 debug endpoint 吐 fixture HTML 比對逐字元，驗完刪）。
- **後台名單頁**＝`composables/useAdminLeads.ts`（載入/搜尋/日期/宣告式篩選 `LeadFilterDef`/chips/排序/彈窗/狀態/備註；含 `SOURCE_CHANNELS`、`LEAD_STATUS_FILTER_OPTIONS` 常數）＋`components/admin/` 三元件（LeadFilterBar／LeadDetailModal（body 用 slot）／SortableTh）。leads.vue（717→441）與 group-classes.vue（688→409）已遷移，各頁只留 fetch 映射、篩選定義、表格欄位、詳情 slot、CSV 欄位。⚠️ **公司篩選的選項底要傳各自的變體設定**（leads=bookingVariants、團課=groupClassVariants，兩份 key 同名、寫錯今天看不出來）。**cooperation.vue 未遷**（結構不同：雙 type 合併＋utm 提頂層＋無日期/排序，遷移＝功能升級，需業主確認後才做）。
- **前台分店基本資料**＝`composables/usePublicStores.ts`（店名/電話/地址/slug 讀 `/api/public/stores`，`server:false`＋fallback 與 Firestore 現值一致、顯示順序南京→松江→西門→七張）。Footer 與首頁 LocationsSection 已用；`pages/locations/index.vue` 本來就有自己的 API 驅動＋fallback。**booking/group-booking 表單選項刻意不用**（避開變體 lockStore 時序）；營業時間/交通仍程式碼維護。⚠️ **業主在後台改分店電話/地址現在會真的全站生效**；七張店自此顯示 Firestore 正式名「新店七張店」（原首頁/Footer 寫死「七張店」與列表頁不一致）。
- **後台 API 驗證**：可達的 401/403 只有 `admin-api-guard`（statusMessage 與 message 同值）與 auth/* 四支（回應格式勿動，登入頁/路由 middleware 依賴）。**30 支 handler 的 inline 401 在 guard 之後實際不可達**（防禦縱深，勿花力氣統一）。`requireAuth` 已刪（死碼）；角色檢查用 `requireRole`。
- **本機驗證管線**（無測試框架下的替代）：`npm run build`（⚠️ 不做型別檢查）→ `(set -a; source .env; set +a; unset SMTP_*; NODE_ENV=development ALLOW_DEV_ADMIN=true node .output/server/index.mjs)` → 後台用 dev 後門帳號（見 auth.ts DEV_TEST_USER，須 NODE_ENV≠production 且 ALLOW_DEV_ADMIN=true）→ 瀏覽器 pane 走查＋`javascript_tool` 斷言；表單類改動 curl POST 後用 service account 腳本直讀 Firestore 核對 shape、驗完刪測試文件。unset SMTP_* 可讓寄信乾淨跳過不發真信。
- ⚠️ **備註存檔競態（已修）**：存檔期間關閉彈窗，舊碼 `selectedLead.value.internalNote` NPE→誤報「儲存失敗」（實際已寫入）。useAdminLeads 已加 null 防護，勿退回。

## 教練資料現況（⚠️ 動 /team-intro/coaches 或教練資料前必看，2026-08-22 更新）

| 分店 | 人數 | 狀態 |
|---|---|---|
| 西門店 | 17 | ✅ 已用業主 CSV 更新（2026-08-22，dev＋prod） |
| 七張店 | 11 | ✅ 已用業主 CSV 更新 |
| 南京店 | 14 | ⏳ **仍為範本假資料**，9 人誤標物理治療師 |
| 松江店 | 5 | ⏳ **仍為範本假資料**，3 人誤標物理治療師 |

**原始問題**：教練資料是「照教練牆照片建檔、內容用範本填」——姓名與分店對，但證照/學歷/經歷是編的、`description` 全空、專長是自創詞彙。最嚴重的是**非物理治療師被標成「物理治療師」並列出「物理治療師證照」**（受《物理治療師法》管制＝合規問題，非資料過期）。西門＋七張的 12 人已修正；**南京、松江的 12 人仍掛在正式站上**。業主 2026-08-22 表示南京/松江 CSV 與新照片後續補上。

**業主的分店 CSV 格式**（正確資料源）：`姓名, 英文名字, 分店, 職稱, 學歷/經歷, 證照, 專長1~3`。
⚠️ 早期那份 `教練製作物所需資訊_20250826` 是**製作物追蹤表**（含個資與名片/名牌進度欄），**不可**當官網資料源。

**匯入作法（腳本，不要用後台 UI）**：憑證取得見下方部署段／[[lkk-web-deploy]]。流程＝解析 CSV→**先印出每人拆欄結果人工檢視**→產生 dry-run 變更計畫→備份→套用→dev 驗證→prod。
- **只覆寫 CSV 提供的 6 欄**（name/roleTitle/storeId/education/experiences/certifications/specialties）；`photo`/`sortOrder`/`isActive`/`description` **沿用既有值不覆寫**
- 「學歷/經歷」是同一欄要拆：`學歷：` 後連續非空行＝學歷，**遇空行後**＝經歷；有 `經歷：`／`證照與研習：` 標記則以標記為準（6 人無標記，靠空行分界）
- 職稱的 `/`（含 `/／`）正規化成 `・`；證照去掉開頭 `•` 與「證照與研習：」標題列
- ⚠️ **別用後台逐筆建**：`pages/admin/coaches/[id].vue` 的「學歷」是單行輸入、用逗號切割，CSV 含逗號的學歷會被切壞

**姓名錯字**（已於 2026-08-22 改名並保留照片）：陳詠**佑**→陳詠**侑**、鍾**緯**沛→鍾**絲**沛。松江店另有「王均**佑**→王均**祐**」待處理。

**照片**：`public/images/coaches/{nanjing,songjiang,ximending,xindian}/`（拼音檔名）。2026-08-22 新建的 4 人**尚無照片**（林稚荃/林承緯/盧立軒＝西門、陳存灝＝七張），頁面顯示姓名首字替代圖、不破版。

**`server/utils/fallback-data.ts`** 內含 43 筆與舊資料相同的假教練，Firestore 掛掉會頂替顯示＝對外露出已修正掉的錯誤職稱；四店都更新完後要一併處理。

## 慣例
- Nitro API：admin 端各檔 inline `const session = await getSession(event)`；寫入類要補角色檢查。
- 表單 → `server/api/leads/*.post.ts` → 寫 Firestore `leads` + `server/utils/email.ts` 寄信（nodemailer + Gmail SMTP，收件人讀 Firestore `settings`）。
- UTM 追蹤（已實作）：`composables/useUtm.ts` + `plugins/utm.client.ts` 進站擷取 `utm_*` 存 sessionStorage；booking/franchise 送出帶 `utm`，存進 lead `payload.utm`（`{source,medium,campaign,content,term,referrer}`）；後台 `leads.vue`（booking）與 `cooperation.vue`（franchise/cooperation）詳情+CSV 顯示；**⚠️ 2026-08-12 現況：`leads.vue` 篩選欄含 UTM 來源＋UTM 活動（可搜尋下拉），但刻意不含 UTM 媒介**（媒介對本站區隔性低：來源＋活動已足夠、媒介的跨來源彙總少用到；已從篩選移除、**勿加回**，仍存 `payload`、詳情/CSV 看得到。見下方名單欄位對照與 [[lkk-web-gotchas]] 第 16 條）。分店建議放 `utm_campaign`。cooperation 前台仍是假送出（未接 API），故其 UTM 尚未實際寫入。
- **GA4 已安裝（2026-08-11，正式站）**：`plugins/gtag.client.ts`（評估 ID `G-DSQC1NTPJ3`，公開碼 hardcode），**只在正式網域 `lkkwellness.com`/`www.` 啟用**（`window.location.hostname` gate）→ dev/預覽/hosted.app 完全不追蹤、不污染數據。**站上原本沒裝任何分析工具，這是第一次裝** → 廠商連結的 `utm_*` 現在才真的有 GA 在收（先前只存進 lead `payload.utm`）。無新增套件、不動 apphosting.yaml。⚠️ GA4 明細資料保留預設 2 個月（資料設定→資料保留可改 14 個月）；尚未加自訂轉換事件（form_submit/click_cta）。細節見 [[lkk-web-deploy]]。
- 根目錄 `npm install`（**需 `.npmrc` 的 `legacy-peer-deps=true`**，否則 npm 10.9 arborist 會崩）；build 用 `npm run build`（=`nuxt build`）。`firebase-tools` 已非依賴，CLI 用 `npx firebase-tools`。
- **改 → 發 → 驗證流程**：改在 `dev` 分支 → `npm run build` 確認過 → `git push origin dev`（觸發 lkkdev rollout，約 4–7 分鐘）→ **背景輪詢 `lkk-website-dev--lkkdev.asia-east1.hosted.app` 抓該次改動的新內容標記確認真的上線**再回報（別只看 push 成功）→ 使用者確認後才 merge `dev`→`prod` 發正式站。**驗版面/CSS 類改動**：內建瀏覽器 pane 的 screenshot 偶爾會卡在頂部或整片空白、`computer scroll` 逾時（pane hidden）；此時改用 `javascript_tool` 直接量渲染結果最可靠——`getComputedStyle`/`getBoundingClientRect`（如比對同排卡片 `img.top - btn.top`）、canvas `drawImage`+`getImageData` 掃像素（量燒進圖的橫幅位置）、或 `document.body.style.zoom='0.3'`+把 `loading=lazy` 改 `eager` 讓整頁擠進一張截圖。輪詢部署則 grep `/_nuxt/*.js` chunk 內該次改動獨有字串（如新 class `flex flex-col bg-white`）。
- **預約表單變體系統（2026-08-05，廠商 UTM 活動用）**：`/booking?v=<key>` 對應 `config/bookingVariants.ts` 的設定驅動變體——**加廠商＝在該檔加一段設定、不改 `booking.vue`**（未知 `v` 自動 fallback default）。變體可覆蓋：Hero(badge/title/titleHighlight/subtitle/checklist/ctaText)、`lockStoreId`(以 id/slug/name 命中→預選+隱藏分店選單)、`hideSources`、`allAgesFree`、`company`(公司)、`leadSource`(來源)。**`allAgesFree`**：隱藏付款方式、自動 `paymentMethod='活動免費'`、解除「未滿50歲清掉免費」年齡邏輯；**所有價格文案集中在 `pricingCopy` computed**（Hero badge/標題、底部說明、FAQ f1/f2、服務卡 `steps[2].badges` 全讀它，改價只動一處）。**來源可用網址參數 `?src=` 覆蓋**（同公司不同來源共用同一變體，如 `?v=nanshan&src=LINE`）。送出時 `formVariant`/`company`/`leadSource` 一起寫進 `leads/{id}.payload`（已實測寫入 Firestore ✅），後台 `leads.vue` 清單「來源」欄＋詳情「活動來源」區塊顯示。`?src=` 用語規範見 `docs/廠商表單網址規範.md`。meta description 維持通用（SEO 不收 `?v=` 版本）。現有變體：`abbott`(亞培/LINE)、`nanshan`(南山/網站)，皆全齡免費、不鎖店、**顯示**得知管道（`hideSources` 是能力，但這兩家不設）。**改 `booking.vue` 勿把 SSR 分店改成 client fetch 以外的問題**：分店目前是 `onMounted` client fetch（非 SSR），會兩段式載入。
- **廠商完整連結配方（2026-08-11 確立）**：`booking?v={公司代號}&src={通路}&utm_source=&utm_medium=&utm_campaign=` —— **`v`/`src` 給後台名單（公司/來源）、`utm_*` 給 GA**，兩套獨立、同一條連結可並存（各讀各的、互不干擾）。**`v=` 放英文代號**（nanshan/abbott，**不是**中文「南山」，業主/行銷常搞錯）。全部欄位皆選配（要後台分類就 `v`+`src`、要 GA 算廣告就 `utm_*`、全都要就全放）。`src` 規範 7 值＝網站/LINE/Facebook/Instagram/Email/傳單/Google。`payload.leadSource`(Facebook) 與 `payload.utm.source`(facebook) 重複是**刻意的**（前者給後台篩選、後者存底/GA），後台篩選只讀 `leadSource`、不會重複計算。現有代號：`nanshan`、`abbott`。
- **名單「來源」欄位對照（主來源約定，2026-08-05）**：一筆 lead 有多個來源相關欄位、各司其職，**勿硬合成一個**——**① 廠商活動來源（分析主依據）**：`payload.company`(公司)＋`payload.leadSource`(來源)，來自 `?v=`/`?src=`。**② GA 追蹤**：`payload.utm.{source,medium,campaign,content,term,referrer}`，來自 `?utm_*`，只給 Google Analytics（後台 UTM 欄另顯示）。**③ 使用者自填「得知管道」**：`payload.sources`(陣列)＋頂層 `sourceChannel`(=sources join)，是使用者在表單勾的，**與 ①② 不同概念、勿混用**。`payload.formVariant`＝`?v=` 值。**`sourceTag` 已於 2026-08-05 移除**（曾與 company/leadSource 重疊，退役清除）。清單「來源」欄＋詳情「活動來源」區以 chips 顯示 company+leadSource。**後台名單篩選（2026-08-12 現況）＝單排、全部可搜尋下拉（`components/SearchableSelect.vue`）＋已套用 chips＋清除全部＋筆數**：搜尋(姓名/電話/Email 關鍵字)、日期(`createdAt` 起訖)、分店、狀態、公司(`payload.company`；選項＝`bookingVariants` companies ∪ 名單值)、來源(`payload.leadSource`；選項＝常數 `SOURCE_CHANNELS`=[網站/LINE/Facebook/Instagram/Email/傳單/Google] ∪ 名單值)、UTM 來源(`payload.utm.source`)、UTM 活動(`payload.utm.campaign`)——各下拉選項皆自名單去重自動蒐集。**公司與來源各比各的欄位、不混（業主明確要求分開，勿再 union）**。**UTM 媒介刻意不列（區隔性低，勿加回）**；UTM 仍存 payload、詳情/CSV 顯示。
- **第二人稱用字（2026-08-11 現況）**：**前端網站一律「你」、後台 `/admin` 一律「您」**。曾一度全站改「您」，2026-08-11 前端反轉回「你」（125 處/18 檔，含 `privacy.vue` 隱私權政策；後台保留「您」）。**改前端頁面/section 文案勿用「您」、改後台勿用「你」。**
- **變體表單的寄信行為（`server/utils/email.ts`，2026-08-05；2026-08-12 更新判斷依據）**：**`bookingFeeLabel(birthDate,paymentMethod,company)`**：帶 `company` 的名單＝全齡免費活動 → 回 `null` → 通知信與確認信都不顯示「付款方式」那行（不變）。**⚠️ 2026-08-12：非 company 時，判斷依據由「出生年齡」改為「使用者勾選的 `paymentMethod`」為權威**（臨櫃付款→`臨櫃付款 $500`、50歲以上免費→`50 歲以上免費體驗`、活動免費→null；**沒帶 paymentMethod 才退回用年齡**）——因標準變體（非全齡免費）表單對 50+ **同時**提供『50歲以上免費』與『臨櫃付款 $500』兩選項（`booking.vue:907-908` 付款方式下拉），50+ 若選付費、信件要照勾選顯示 $500（業主決定＝**尊重勾選**，非一律免費；原年齡邏輯會把 50+ 選付費者強制標免費）。**管理者通知信 `sendLeadNotification`**：主旨加 `【company】`、標題下方橘色「活動來源：company · leadSource」橫幅（僅變體名單）。**填單人確認信 `sendFormConfirmation`**：**業主決定「不標活動」**（曾加過又撤，勿再加回）。資料流：`booking.post.ts` 把 `company`/`leadSource` 傳給這兩個寄信函式（`sendLeadNotification` 兩者都給、`sendBookingConfirmation` 只給 company 用於隱藏付款）。
- **變體/表單/寄信 技術債 checklist（2026-08-05 體檢；架構健康、無埋雷，以下皆「成長後再處理、現在勿動」）**：① **寄信無重試/告警（中優先）**——`email.ts` 是 fire-and-forget，SMTP 一失敗通知信就**靜默遺失**（只 `console.error`）；營運吃重時加「失敗補記 Firestore / 補寄」。② **`?src=` 未在程式 enforce**——自由字串、一致性只靠 `docs/廠商表單網址規範.md` 紀律；來源寫法亂了再加 normalize/白名單。③ **`booking.vue` 1088 行、變體條件累積**——再堆變體邏輯就抽 `useBookingVariant` composable。④ **`bookingFeeLabel` 吃 3 輸入偏繞** + 變體信件用 `if(company)`——「每家廠商不同信件內容」出現時，像 `pricingCopy` 那樣集中。⑤ 分店 `onMounted` client fetch（非 SSR）→ 兩段式載入。⑥ `paymentMethod='活動免費'` 是 magic string，付款型態變多再收斂。
- **LKK4 頁（`pages/lkk4.vue`）已全齡改版**：定位「全齡」非中高齡、賽事始於 2021（第六屆＝2026，勿寫 2019），詳見記憶 [[lkk-web-gotchas]]。
- **後台下拉選單自訂箭頭**（2026-08-05）：`layouts/admin.vue` 根節點掛 `.admin-root`，用**非 scoped 全域 `<style>`** 的 `.admin-root select{appearance:none;background-image:chevron;background-position:right .85rem center;padding-right:2.25rem}` 一次套所有後台 select（原生箭頭改自訂、內縮）。⚠️ layout 用 `scoped`+`:deep()` **無法穩定命中 `<slot/>` 內的頁面 select**（slotted content 屬 page scope）→ 故採「wrapper class＋全域 style」。前台單頁要改 select 箭頭則各頁自己 `<style scoped>`（如 `personal-record.vue`，用 `background-position:right 1rem center`）。
- **後台版面/表格（2026-08-12）**：後台主內容 wrapper（`layouts/admin.vue` 的 `<div class="flex-1 flex flex-col lg:pl-64">`）已加 **`min-w-0`**——因 `body` 有全域 `overflow-x:hidden`（`assets/css/main.css`），flex 項目預設 `min-width:auto` 會讓寬表格**撐破版面被裁切、無法捲動**；`min-w-0` 讓它收縮、把捲動交回卡片 `overflow-x-auto`（⚠️ **只改卡片 overflow 無效，根因在 wrapper**）。表格頁慣例：卡片 `overflow-x-auto` ＋ 表格 `min-w-[720px]`（或內層 `overflow-x-auto` div ＋ `min-w-full`）。**團課預約後台已完整**（2026-08-19，見下方「團體課報名系統」段）：`pages/admin/group-classes.vue` 讀 `type=group_class`、版型已比照 `/admin/leads`、選單在客戶預約下方（icon `usergroup`）、`sales` 可存取。**分店後台已移除營業時間/交通/Google Maps 連結欄位**（全改由程式統一維護）。詳見 [[lkk-web-gotchas]] 第 18/19 條。
- **圖片位/切圖**：業主的切圖規格表多數區塊**還沒有真 `<img>` 位**（Hero、首頁門店卡、LKK4 四項卡=SVG、媒體報導=文字、locations/index 店卡=漸層），「放圖」要先改程式；有真圖位的只有 ServicesSection「我們的服務」、`/services`、單一門店環境照（Firestore `store.images.env1~5`）、Team。比例/尺寸/object-fit 詳見 [[lkk-web-gotchas]] 第 11 條。
