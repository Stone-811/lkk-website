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

## 部署 / Firebase / CLI
- ⚠️ **遷移中：`lkk-website-dev` → `lkkdev`**（維持 backend 名 newweb、後端 Firestore；lkkdev 有其他既有服務勿動）。目標 projectId=`lkkdev`、bucket=`lkkdev.firebasestorage.app`。已建 lkkdev Firestore@asia-east1 + 索引；`apphosting.yaml` 已指向 lkkdev。待做：建 lkkdev App Hosting backend newweb+連 GitHub（**root directory 填 `/`**，已拉平）、建 secrets、跑 `scripts/migrate-firestore.mjs` 搬資料。
- 部署方式：push 到 GitHub `Stone-811/lkk-website-dev` → App Hosting 自動 build（沿用同一 repo）。
- **gcloud/gsutil/bq 未安裝、無 ADC**。要操作 GCP：用 `npx firebase-tools`（node_modules 有 v15.24.0，已登入 tingo8320@gmail.com）；需要 gcloud 才另裝 Google Cloud SDK。
- **部署 repo（唯一真實來源）**：`/Users/stone/4.柚智源/練健康/3. 形象網站翻新`（git remote `Stone-811/lkk-website-dev`，branch `main`）。舊的 `/Users/stone/Downloads/lkk-new-web` 雙胞胎已棄用。

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
- 根目錄 `npm install`（**需 `.npmrc` 的 `legacy-peer-deps=true`**，否則 npm 10.9 arborist 會崩）；build 用 `npm run build`（=`nuxt build`）。`firebase-tools` 已非依賴，CLI 用 `npx firebase-tools`。
