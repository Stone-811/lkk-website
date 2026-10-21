---
name: lkk-admin-leads
description: 後台名單（客戶預約／團課預約／合作洽詢）從寫入到看得到的整條路：名單列表 API 怎麼查、誰看得到哪些名單（帳號、Google 登入允許名單、自訂權限、首頁最新名單）、CSV 匯出的儲存格規則、通知信與確認信的 HTML 跳脫與快照比對法、UTM cookie 何時重寫。要動 server/api/admin/leads、dashboard、admin-api-guard、utils/adminAccess、composables/useCsvExport、server/utils/email.ts、composables/useUtm.ts，或被問「名單怎麼不見了」「某個帳號看得到什麼」「誰能用 Google 登入」「Excel 打開電話少了 0」「通知信會不會被塞連結」「UTM 的進站頁怎麼怪怪的」時使用。內含 2026-10-16 合作洽詢名單「消失」的完整查法，以及業主已經拍板不做的項目（不要再提）。表單頁本身看 lkk-booking-form，UTM 連結產生器看 lkk-admin-campaigns。
---

# 後台名單

名單寫進 Firestore `leads`（四支 `server/api/leads/*.post.ts` → `server/utils/leads.ts` 的 `createLead`），
後台三頁讀它：客戶預約 `/admin/leads`、團課預約 `/admin/group-classes`、合作洽詢 `/admin/cooperation`。

> 表單頁見 [[lkk-booking-form]]；UTM 連結產生器見 [[lkk-admin-campaigns]]；
> 驗證方法見 [[lkk-deploy-verify]]；權限的畫面層與 API 層總說明見 [[lkk-project-context]] 的「安全」。

---

## 🔴 2026-10-16：合作洽詢名單「消失」，其實是查詢先截斷再篩選

`server/api/admin/leads/index.get.ts` 原本是「抓最新 100 筆（不分 type）→ 用 JS 篩 type」。
booking 的量遠大於其他（當時正式站 206 筆：booking 198、group_class 5、cooperation 3），
10/06 之後的 booking 把最新 100 筆整個塞滿，合作洽詢最新那筆（10/05）掉到窗外，
`/admin/cooperation` 變成全空。**API 回 200、`data: []`，畫面只寫「沒有名單」，沒有任何錯誤。**

現在：`where('type','==',type).orderBy('createdAt','desc').limit(1000)`。
- 複合索引 `type ASC + createdAt DESC` 在 lkkdev／lkkprod 都已 READY，不用補
- 碰到 1000 筆會在 Cloud Run log 留 `[leads] type=… 已達上限`，那是改分頁的訊號
- `status` 仍在記憶體篩（四個後台頁都沒用這個參數；要用就得再加三欄索引）
- 儀表板走另一支 `dashboard.get.ts` 全量讀取，統計數字一直是對的 ——
  **「首頁有數字、點進去是空的」就是這種截斷**

### 查法（不用登入後台）

用 firebase-app-hosting-ops 的 `gapi.cjs` 對 lkkprod 跑 `:runQuery`（唯讀）：
1. 最新 100 筆的 type 分布與最舊時間 → 看要找的名單在不在窗內
2. `where type == X` 全部撈出 → 確認資料其實還在
這兩步就能區分「資料不見」和「查詢看不到」。

**統計名單內容（例：生日分布、付款方式）也用同一招，但只取需要的欄位**：
`select` 只列 `payload.birthDate`、`payload.paymentMethod`、`createdAt` 這類欄位，在本機彙總成筆數，
**不讀姓名、電話、Email，也不把個別值貼進對話**。要給業主找名單時給「送出日期」，讓他在後台自己對。
（2026-10-19 用這招查出 218 筆預約有 16 筆生日不合理，見 lkk-booking-form「出生年月日」。）
請求 log 對不出裝置：App Hosting 的 CDN 把 User-Agent 全換成 `Google`。

⚠️ **這類「先 limit 再篩」在全站還可能有**：全表讀取或固定上限的查詢，資料一長大就無聲漏資料。
看到 `.limit(` 後面接 JS `.filter(` 就要警覺。

---

## 誰看得到哪些名單

### 帳號（2026-10-16 實查 lkkprod `users`，只讀角色與勾選頁）

6 個：`admin` 2 個、`custom` 4 個，**沒有舊角色**（sales／editor／store_staff）。
- 3 個 custom 勾了名單頁，而且**三張名單頁都勾**
- 1 個 custom 只勾教練、LKK4、分店、講師、UTM，**沒有任何名單頁**

查的時候 `select` 只取 `role`、`permissions`、`isActive`，不要讀出 email 與 passwordHash。

### 兩套登入，彼此獨立

| | Google 登入 | 帳號密碼登入 |
|---|---|---|
| 程式 | `server/api/admin/auth/google.post.ts` | `login.post.ts` ＋ Firestore `users` |
| 誰能用 | **只有允許名單**：`ADMIN_ALLOWED_EMAILS`，dev／prod 都是 `lkkwellness@gmail.com,service@l-kk.tw` | `users` 裡啟用中的帳號 |
| 角色 | **一律 admin**（全部頁面） | 依 `role`／`permissions` |

允許名單之外的 Google 帳號就算 Google 驗證成功也會被擋（403「此 Google 帳號沒有後台權限」）。
**用自己的 Gmail 在 dev 測 Google 登入會被擋是正常的。** 自訂權限的同仁只能用密碼登入。

### API 層與首頁

- `admin-api-guard.ts`：`/api/admin/leads*` 對 custom 帳號是「三張名單頁任一頁」就放行，
  **不分 type**。理論上只勾合作表單的帳號打 `?type=booking` 拿得到預約個資。
  現有帳號沒有這種組合，所以業主同意**延後**（修正計畫 W6）。動手時的地雷見下方「W6」。
- 儀表板 API 是 `ANY_AUTH`。2026-10-16 起回傳 `canViewLeads`（用側欄同一個 `canAccessAdminPath`
  判斷能否進任一張名單頁），不能就**不查、不回最近 10 筆**，首頁整塊「最新名單」不顯示。
  統計數字仍給所有人（業主只要求藏名單）。
- 舊版 API 沒有 `canViewLeads` 時前端視為 true（部署交界期不會誤藏）。

### W6（延後）動手前要知道的

1. **不可照抄 settings handler 的 `role !== 'admin' && !hasPagePermission()`**：
   `hasPagePermission` 對非 custom 一律回 false，舊角色會全部進不了名單頁。只限制 custom。
2. **`?type=`（空字串）會繞過**「沒帶 type 才擋」的寫法 —— `getQuery` 回 `''`。
3. 在 try 裡 `throw createError(403)` 會被 handler 自己的 catch 吞成 500。

---

## CSV 匯出（`composables/useCsvExport.ts`）

三個呼叫端：`pages/admin/leads.vue`、`group-classes.vue`、`cooperation.vue`。業主**只用 Excel 開**（2026-10-16 確認）。

`toCsvCell` 的規則（2026-10-16 起），順序有意義：
1. null／undefined → 空字串；number → 原樣
2. **像電話**（`0`／`+`／`(0` 開頭，後面只有數字、空白、`-`、括號；或 9 碼以上純數字）
   → `="0912345678"`，Excel 當文字顯示，開頭 0 與 + 都保留
3. 剛好是 `-`（各頁的空值佔位）→ 原樣
4. 其他以 `= + - @ \t \r` 開頭 → 前面加 `'`（防公式注入）

⚠️ **刻意不認 `1960-05-01`**：出生年月日維持 Excel 原本的處理，業主看到的不變。
⚠️ 包成 `="…"` 只對規則限定字元的值做 —— 值裡不可能有引號，才不會被自己的包裝打成公式。
   **不要改成「依欄位名稱整欄包」**：`contactPhone` 沒有格式驗證，`09"&HYPERLINK(...)&"` 就能跳出字串。
⚠️ 在 Numbers 或上傳到其他工具時，電話會顯示成 `="0912…"`。
⚠️ BOM 寫成 `'\uFEFF'` 跳脫字元。**寫檔工具曾把它轉成看不見的字面字元**，
   改這行之後用位元組數確認：字面 EF BB BF 應為 0 處、`\uFEFF` 6 個 ASCII 字元應為 1 處。

`buildCsv`／`toCsvCell` 匯出成純函式，可以用 jiti 在瀏覽器外測（見 [[lkk-deploy-verify]]）。

「填寫者」欄（客戶預約、團課預約兩頁）的值是**匯出當下**用 `filledBySelf === false`／`isFillerSelf === '否'` 算的，
Firestore 沒存這個字：2026-10-21 起是「他人代填／本人填寫」（之前是「親友代填」），舊名單重新匯出也是新字，
業主以前下載的檔案不會變。詳情彈窗的「填寫者」同一個算法。

---

## 通知信與確認信（`server/utils/email.ts`）

兩個純函式：`buildLeadNotificationEmail`（管理者通知）、`buildFormConfirmationEmail`（填單人確認，2026-10-16 抽出）。
寄信函式只負責 transporter 與收件人。

### 🔴 HTML 跳脫只在「使用者的值插進 HTML 的那一刻」

`esc()`（不 export，避免被 Nitro 自動匯入撞名）用在：通知信表格的值（`notifRow`）、
活動來源橫幅、確認信的欄位值、「○○ 您好」。

**刻意不跳脫**：
- **主旨**：純文字標頭，跳脫了「A&B 公司」會變「A&amp;B 公司」
- `formConfirmationConfig` 的 greeting／message／closing：裡面刻意寫了 LINE 連結 `<a>` 與 `<br>`
- 已組好的 rows／detailsHtml
- **存進 Firestore 的值**：後台 Vue 會自己跳脫，CSV 要原文。在驗證層跳脫會變成 `&amp;` 永久存進名單

⚠️ 擋得住偽裝連結文字與 `<img>`，**擋不住純文字網址被 Gmail 自動轉成連結**。
   四張表單都沒有機器人防護，官方信箱仍可能被拿來寄確認信到任意信箱。

### 改信件之前：快照比對

沒有測試框架，信件 prod 也無法無副作用地實寄。做法是用同一組 fixture 對 git 上的版本與工作區版本各產生一次，逐字比：

1. `git show HEAD:server/utils/email.ts > email_orig.ts`；工作區版本複製成 `email_new.ts`
2. 兩份都把 `const transporter = await createTransporter()` 換成 `const transporter = (globalThis as any).__stub`
   （**要確認剛好 2 處**），stub 的 `sendMail` 只把 `{subject, html}` 存起來
3. harness 呼叫四個 `send*Confirmation` 與 `buildLeadNotificationEmail`（四種 type × 一般／含 `& < > " '` 的資料）
4. 用 repo 的 `node_modules/.bin/jiti` 跑，輸出 JSON，比對

2026-10-21 實際用過（確認信「親友代為填寫」→「他人代為填寫」）：harness 在 `scripts/email-snapshot.ts`、比對在
`scripts/email-snapshot-diff.py`。7 種通知信＋7 封確認信，結果剛好 3 處差異＝三封代填確認信，其他逐字相同。
用 `globalThis.__stub` 而不是攔 nodemailer：email.ts 複製到 scratchpad 後 `import('nodemailer')` 會找不到套件。

重構與行為改動**分兩個 commit**：先只搬程式碼、比對 0 差異，再改行為。
重構跟改動放同一個 commit 的話，「改前」快照只能從重構後產生，重構本身的錯誤沒人比得到。

⚠️ email.ts 目前只有相對路徑的動態 import，jiti 能直接載入。**日後若加 `~/config/...` 這種別名 import，
   要設 `JITI_ALIAS` 或改相對路徑**，否則 harness 跑不起來，很容易就跳過比對直接上線。

---

## UTM cookie（`composables/useUtm.ts`、`plugins/utm.client.ts`）

- cookie `lkk_utm`，30 天，前端可讀（不是機密），表單送出時寫進 `leads.payload.utm`
- 外掛在**每次換頁**（含 `router.replace`）都呼叫 `captureFrom`
- 🔴 **2026-10-16 起：utm_* 五個值都與 cookie 相同時不重寫**。
  原因：彙整頁把分類 `?tab=`、搜尋詞 `?q=` 用 replace 寫進網址時，網址仍帶著原本的 utm_*，
  於是 `landingPage` 被改成含搜尋詞的網址（「中風」「帕金森」這類健康資訊），最後跟著預約存進名單。
  順便保住真正的進站頁與第一次點廣告的時間。utm 值不同（換了廣告）照舊覆寫。
- 在正式站測 UTM 會污染 GA4（GTM 只在 lkkwellness.com 載入）。**用 dev 測**，測完刪掉測試 cookie。

---

## 2026-10-16 已處理、業主已拍板的事（不要再提）

| 項目 | 狀態 |
|---|---|
| 加盟表單 API `/api/leads/franchise` | 已刪除（停止招募）。後台合作洽詢頁仍會查 `type=franchise`（正式站 0 筆），留著無害 |
| 合作洽詢電話放寬（海外號碼、分機、`0912-345-678`） | **業主決定不做** |
| 系統設定頁防止讀取失敗時誤清通知收件人 | **業主決定不做**（正式站收件人有值） |
| 名單依類型授權（W6） | 延後，現有帳號不受影響 |
| 四支名單 API 統一驗證（W3） | 未做，高風險，要拆小步。動手前讀修正計畫的風險審查：照字面做會讓 `?co=` 合作方歸因變空白、布林欄位被轉字串、團課 `preferredTime` 是字串不是陣列 |

修正計畫與業主問卷：<https://claude.ai/artifact/JacBQpiKP69UQYxCtohGm6>（答案在該頁的 db，`ArtifactData list collection=answers`）。
