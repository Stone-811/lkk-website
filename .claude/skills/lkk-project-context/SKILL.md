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
- 發 prod＝merge `dev`→`prod`（apphosting.yaml 值各分支不同；**合併後務必確認 apphosting.yaml 仍是 lkkprod/lkkwellness.com 值、沒被 dev 蓋成 lkkdev**）。部署：push 分支 → 自動 build；或 `apphosting:rollouts:create <backend> --project <proj> --git-branch <branch> --force`。工作區有非本次改動時，先 `git stash` 再切分支合併。
- **prod 現況（2026-07-31）**：已 merge dev→prod、對外 `lkkwellness.com` ＝最新版（含 LKK4 全齡改版等）；**Email 已修好**（有效 lkkwellness App Password，dev/prod 都通）；**prod Auth 尚未開 Google 登入** → 後台用緊急密碼 `lkkwellness@gmail.com`/`lkkwellness-prod`。網域/SMTP/UTM 細節見記憶 [[lkk-web-deploy]]、[[lkk-web-gotchas]]。
- **gcloud 未安裝**，一律 `npx firebase-tools`（已登入 tingo8320@gmail.com，可存取 lkkdev/lkkprod）。部署 repo（唯一真實來源）：`/Users/stone/4.柚智源/練健康/3. 形象網站翻新`。舊 `Downloads/lkk-new-web` 雙胞胎已棄用。
- 新環境 setup 血淚點：Firestore 用 `firestore:databases:create --location asia-east1`（別靠 deploy 自動建→會在 nam5）；secrets set 後**務必 `grantaccess --backend`**（否則 Misconfigured Secret）；啟用 Storage；Auth 啟用 Google provider+加該 hosted.app 授權網域。詳見記憶 [[lkk-web-deploy]]。

## 安全（動 /admin 或 server/api/admin 前必看）
- 已修補：後門帳號（改 `ALLOW_DEV_ADMIN` gate）、`JWT_SECRET` 正式站強制、登入頁明文帳密移除。
- **部署前必設 `JWT_SECRET` secret**，否則正式站啟動 crash。
- **仍待修**：多支 admin API 只驗登入不驗角色（coaches 寫入、stores [id].patch、lkk4-records import/delete、leads [id].patch 有 IDOR、debug/firestore-test）。角色檢查慣用寫法見 `server/api/admin/stores/index.post.ts`。
- 表單全無 reCAPTCHA/Turnstile。

## 常踩的地雷
1. **store 資料結構三套不一致**：後台送 `transport{}`/`images{env1..5}`，但 `stores/[id].patch.ts` allowedFields 漏了 `transport`（交通資訊儲存被丟棄）；公開 API 把 images 當陣列；型別 `StoreDoc` 是 `string[]`。
2. `pages/cooperation.vue` 表單是**假送出**（setTimeout），後端 API 已就緒沒接。
3. ✅ `pages/booking.vue` 成功畫面已加官方 LINE 按鈕（`@201fzruh`）。後台 `pages/admin/leads.vue` 詳情/CSV 已顯示完整 booking payload（含代填者/健康狀況/LINE ID）。
4. `pages/locations/index.vue` 用寫死資料，非 API。
5. WordPress 代理、reCAPTCHA 皆未實作（CLAUDE.md 有寫）。

## 慣例
- Nitro API：admin 端各檔 inline `const session = await getSession(event)`；寫入類要補角色檢查。
- 表單 → `server/api/leads/*.post.ts` → 寫 Firestore `leads` + `server/utils/email.ts` 寄信（nodemailer + Gmail SMTP，收件人讀 Firestore `settings`）。
- UTM 追蹤（已實作）：`composables/useUtm.ts` + `plugins/utm.client.ts` 進站擷取 `utm_*` 存 sessionStorage；booking/franchise 送出帶 `utm`，存進 lead `payload.utm`（`{source,medium,campaign,content,term,referrer}`）；後台 `leads.vue`（booking）與 `cooperation.vue`（franchise/cooperation）詳情+CSV 顯示。分店建議放 `utm_campaign`。cooperation 前台仍是假送出（未接 API），故其 UTM 尚未實際寫入。
- 根目錄 `npm install`（**需 `.npmrc` 的 `legacy-peer-deps=true`**，否則 npm 10.9 arborist 會崩）；build 用 `npm run build`（=`nuxt build`）。`firebase-tools` 已非依賴，CLI 用 `npx firebase-tools`。
- **改 → 發 → 驗證流程**：改在 `dev` 分支 → `npm run build` 確認過 → `git push origin dev`（觸發 lkkdev rollout，約 4–7 分鐘）→ **背景輪詢 `lkk-website-dev--lkkdev.asia-east1.hosted.app` 抓該次改動的新內容標記確認真的上線**再回報（別只看 push 成功）→ 使用者確認後才 merge `dev`→`prod` 發正式站。
- **LKK4 頁（`pages/lkk4.vue`）已全齡改版**：定位「全齡」非中高齡、賽事始於 2021（第六屆＝2026，勿寫 2019），詳見記憶 [[lkk-web-gotchas]]。
