# Hub／CRM 讀取「合作洽詢」表單 config 說明

> 對象：Hub／CRM（同一個 Firebase 專案；前端是 Firebase Hosting 靜態 SPA，後端是 Cloud Run 的 `lkkhubapi`／`lkkcrmapi`）的開發者
> 環境：**lkkdev（測試）**；正式站 lkkprod 上線後路徑相同、只換專案（lkkprod 目前還沒有這份文件，正式站發版後才會出現）
> 更新：2026-11-14

練健康官網 `/cooperation` 表單的完整定義（欄位、選項、條件、存進名單的位置），
已經放在 Firestore，Hub／CRM 直接讀即可。**這份 config 是唯讀的**：由官網自動維護，Hub／CRM 不要寫入。

> 名稱：頁面、通知信、後台都叫「合作洽詢」，內部有時說「合作洽談」，指的是同一張表單。
> 程式裡的代號一律是 `cooperation`。

---

## 1. 在哪裡

| 項目 | 值 |
|---|---|
| Firebase 專案 | `lkkdev`（正式站：`lkkprod`） |
| 資料庫 | `(default)` |
| 文件路徑 | `formSchemas/cooperation` |
| 其他表單 | `formSchemas/booking`（預約體驗）、`formSchemas/group-booking`（團體課程報名），結構相同 |

### 名單 type 對 config 文件 id

| 名單 `type` | config 文件 |
|---|---|
| `booking` | `formSchemas/booking` |
| `group_class` | `formSchemas/group-booking` |
| `cooperation` | `formSchemas/cooperation` |
| `franchise`（舊加盟表單，2026-10-16 已下架） | **沒有 config**。Hub 略過，或照原值顯示 |

> 團課的 `type` 是底線（`group_class`），文件 id 是連字號（`group-booking`），**不能拿 `lead.type` 直接組路徑**。
> 2026-11-14 起，config 文件頂層有 **`leadType`**（這張表單寫進名單的 `type`，本表單是 `cooperation`），可以用
> `db.collection('formSchemas').where('leadType', '==', lead.type)` 找到名單的 config。
> 建置檢查保證所有 config（**含已下架的**）的 `leadType` 都不重複，所以最多只會查到一份；下架的表單也查得到（見下方「下架的表單」）。
> **上面這張表還是要留在 Hub 程式裡當退路**：用 `leadType` 查不到（0 筆）時，改用這張表找文件 id 再讀一次，不要直接當成沒有 config。會查不到的情況：
> - 這次改動發到 dev 站、同步寫入以前，lkkdev 的文件還沒有 `leadType`。
> - lkkprod 目前還沒有任何 `formSchemas` 文件（正式站還沒發版），正式站發版時 `leadType` 會一起出現。
> - 官網如果退回 `leadType` 出現以前的版本（dev 的 `a6cf8c0` 或更早，也就是目前 dev 站上跑的版本），舊版會把文件整份重寫成沒有 `leadType` 的樣子，直到下一次發新版才補回來。
>
> 表上也沒有（`franchise`）才是真的沒有 config，照原值顯示。`franchise` 是刻意沒有 config 的名單 `type`（列在建置檢查的「沒有 config」清單）。
>
> 官網建置時會檢查以下幾點（2026-11-14 起），不符合就建置失敗，所以之後新增的表單不會沒有 config 就上線：
> - 名單 `type` 的型別宣告（`server/utils/leads.ts` 的 `CreateLeadInput.type`）每一個值都要有 `leadType` 相同的 config（只有 `franchise` 例外）。
> - `server/` 底下每個呼叫 `createLead(` 的地方，都要直接傳物件字面值，最外層有一個寫成字面值的 `type`（例如 `createLead({ type: 'cooperation', … })`；不能用簡寫、變數或展開，`createLead` 也不能換名字匯入），而且這個值要在 `CreateLeadInput.type` 裡、有 config，那張表單也不能已下架。
> - 每張沒下架的表單，config 的 `submit.endpoint` 對應的檔案（本表單是 `POST /api/leads/cooperation` → `server/api/leads/cooperation.post.ts`）要存在、要呼叫 `createLead`，而且只寫這張表單的 `leadType`。
> - `server/` 底下的 `.ts` 檔（`server/utils/leads.ts` 與後台 API `server/api/admin/` 除外），程式碼碰到 `leads` 集合（讀或寫）就建置失敗，除非列在檢查的允許清單裡（只給只讀不寫的檔案、要寫明原因；目前是空的）。`server/` 以外的檔案不在這道檢查範圍內。
> - `docs/form-schema/` 裡的 JSON 要跟官網的同步清單一致，沒下架的 JSON 也都要有對應的選項比對。

### 文件欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `formId` | string | `cooperation` |
| `leadType` | string | `cooperation`：這張表單寫進名單（`leads`）的 `type`。從 config 頂層的 `leadType` 抄過來（`schemaJson` 裡也有） |
| `schemaVersion` | string | 目前 `1.0`。**只有不相容的改動才升版**（欄位改名或刪除、存放位置或值的存法改變）。2026-11-14 起建置檢查會擋下「題目或隱藏欄位刪除或改 key、`store.path` 改變、`valueType` 開頭的型別改變（沒寫算 `string`）、`store.alsoWrites` 少了某個位置、`leadType` 改變」卻沒升版的改動；記錄過的值（選項值含 `retiredOptions`、`store.possibleValues`；有 `store.map` 的題目記的是對照後存的值，不是選項文字）與代號則**升版也不能拿掉**，停用要移到 `retiredOptions` 這類停用清單；升版刪掉的題目，記錄檔會連同它的值留著，同一個 key 之後再加回來也要包含這些值（見第 3 節「選項的 value 與 label」）。檢查範圍以外的改動是否升版，仍由官網維護者人工判斷（見第 7 節） |
| `contentHash` | string | 整份 config 的 sha256。內容任何變動（含新增選項、改文字）都會變 |
| `schemaJson` | string | **整份 config 的 JSON 字串**，讀了要自己 `JSON.parse` |
| `syncedAt` | timestamp | **最後一次內容變更**時寫入的時間（內容沒變就不會更新，不是心跳） |
| `revision` | string | 最後一次內容變更時，寫入的官網版本（Cloud Run revision 名稱，例：`lkk-website-dev-build-2026-11-12-001`） |
| `retiredOn` | string | **只有下架的表單才有**：下架日期（`YYYY-MM-DD`），從 config 頂層的 `retiredOn` 抄過來（`schemaJson` 裡也有）。目前三張表單都沒有這個欄位（見下方「下架的表單」） |

> 為什麼存成字串：config 有多層巢狀與陣列，Firestore 的 map 不支援某些結構，字串最單純。

### 下架的表單

表單下架時，官網只拿掉頁面與送出端點；config 的 JSON 留在官網 repo、頂層加上 `retiredOn`，官網也繼續同步這份文件，所以 **Firestore 上的文件不會刪除**：
文件多一個 `retiredOn`，其餘內容跟下架前相同（`leadType` 也還在，用 `where('leadType', …)` 照樣查得到），之後不會再有這張表單的新名單。
Hub 照樣用它解讀這張表單的舊名單，只是不該再把它當成現行表單（例如不再列在「可填的表單」）：判斷方式是文件有沒有 `retiredOn`。
- `retiredOn` 也在 `schemaJson` 裡，所以下架那一次 `contentHash`（還有 `syncedAt`／`revision`）會變一次，之後跟其他沒改的表單一樣不再寫入，不會一直出現、消失。
- 重新上架＝config 拿掉 `retiredOn`：官網寫入時整份覆蓋文件，`retiredOn` 跟著消失，`contentHash` 再變一次。

### 什麼時候會更新

官網伺服器會比對 config 與 Firestore 上的 `contentHash`，內容有變才寫入（整份覆蓋）：dev 站改了 → lkkdev 更新；正式站改了 → lkkprod 更新。

- **發版後要等第一個請求打到官網伺服器，才會比對並寫入**。官網跑在 Cloud Run，閒置時 CPU 會被限縮，
  執行個體啟動時發出的比對會停住，等有請求進來才跑完。沒有流量時（例如 dev 站沒人逛的時段）寫入會延後，
  所以「官網發版完成」不等於「這份文件已經更新」。
- 之後只要有請求、距上次比對超過 10 分鐘就再比對一次（失敗的話 1 分鐘後有請求時再試）。
  **這個再比對也要有請求才會跑**：流量少的時段，補寫（例如下面說的發版時被舊版蓋回去的文件）會比 10 分鐘更晚。
- **lkkprod 在正式站第一次發版前不存在**這份文件，讀取前一定要檢查文件存在（見第 2 節）。
- `syncedAt`／`revision` 是「最後一次內容變更」的時間與版本，**不是心跳，不代表同步仍在運作**。
  表單很久沒改時它們會停在很久以前；同步因故停擺時看起來也一模一樣，Hub 從這兩個欄位分不出來。
  要確認 Hub 讀到的是哪一版，請比對 `contentHash`（需要時跟官網維護者對前 8 碼）。
- 表單下架或重新上架（`retiredOn` 出現或消失）也是一次內容變更，照上面的流程寫入（見上方「下架的表單」）。
- 2026-11-14 加了 `leadType` 與閱讀規則（`conventions.options`，多了「停用的選項移到 `retiredOptions`」）的文字，
  三張表單的 `contentHash` 會在下一次 dev 發版時各變一次；題目與選項內容沒有變。

> config 是官網維護者手寫的描述檔（`docs/form-schema/cooperation.json`），不是從頁面自動產生的。
> 選項（value、label、順序、`messagePlaceholder`）由建置檢查保證跟官網程式一致；
> 2026-11-14 起建置檢查也會跟記錄檔（`docs/form-schema/values-ledger.json`）比對，記錄過的值與代號不能消失或改字（見第 3 節「選項的 value 與 label」）。
> 題目文字、提示字、錯誤訊息、必填條件、伺服器規則的描述是人工維護，少數情況可能比線上畫面慢一步（見第 6 節第 8 點）。

> 官網剛發版的幾分鐘內，新舊版本會短暫同時在跑，文件（連同 `revision`）可能「新 → 舊 → 新」來回一兩次，
> 最後停在新版：舊版不再接到請求後，新版下一次再比對時會寫回新版，流量少時這一步會更晚。
> 用 `onSnapshot` 監聽的話，不要假設 `contentHash` 一變就是最終版本，也不要假設它只會往前。

---

## 2. 讀取範例

### Node.js（firebase-admin）

```js
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'lkkdev' })
const db = getFirestore()

// 每次要用 config 前讀一次：contentHash 跟上次一樣就沿用已解析的 config，有變才重新 JSON.parse
let cached = null // { contentHash, schema }
async function getCooperationSchema() {
  const snap = await db.doc('formSchemas/cooperation').get()
  if (!snap.exists) {
    // 文件不存在（例：lkkprod 正式站還沒發版）→ 告警，沿用上次的 config，不要往下解析
    console.warn('formSchemas/cooperation 不存在')
    return cached?.schema ?? null
  }
  const contentHash = snap.get('contentHash')
  if (cached?.contentHash !== contentHash) {
    cached = { contentHash, schema: JSON.parse(snap.get('schemaJson')) }
  }
  return cached.schema
}

// 即時監聽：只適用常駐程序。
// Cloud Run 會閒置凍結（CPU 被限縮、縮到 0 時執行個體消失），監聽收不到更新；
// 在 Cloud Run 上請改用上面的寫法：每次使用前讀 contentHash，有變才重新 JSON.parse。
db.doc('formSchemas/cooperation').onSnapshot((s) => {
  if (!s.exists) return                                 // 告警並沿用上次的 config
  const schema = JSON.parse(s.get('schemaJson'))
  // ...
})
```

### Python（google-cloud-firestore）

```python
import json
import logging
from google.cloud import firestore

db = firestore.Client(project="lkkdev")
doc = db.document("formSchemas/cooperation").get()
if not doc.exists:
    # 文件不存在（例：lkkprod 正式站還沒發版）→ 告警，沿用上次的 config，不要往下解析
    logging.warning("formSchemas/cooperation 不存在")
else:
    schema = json.loads(doc.get("schemaJson"))
    print(doc.get("schemaVersion"), doc.get("contentHash")[:8])
```

### 快取與轉存

- **不要把 config 或選項文字打包進 SPA**（建置時寫死），也**不要用固定 TTL 快取**（例如「快取 1 小時」）：
  官網改了選項，Hub 會在不知道的情況下繼續用舊的。照上面的範例，每次使用前讀 `contentHash`，有變才重新解析。
- 把名單轉存到 Hub 自己的資料庫（Cloud SQL）時，**存原始值**（名單裡的 value，例如 `payload.cooperationType` 的值），不要只存當下轉出來的 label。
  label 會隨 config 改變，只存 label 之後就對不回原始值。

### 權限

**只能從伺服器端讀**：由 Cloud Run 的 `lkkhubapi`／`lkkcrmapi`，以服務帳號（`lkkhubapi-runtime`／`lkkapi-sa`）用 firebase-admin 或 google-cloud-firestore 讀。
Hub 前端（Firebase Hosting 上的靜態 SPA，用 Firebase Web SDK `firebase/firestore`）讀不到，一定會得到 `permission-denied`，
因為 Firestore 安全規則是全面拒絕，官網不會為此開放規則。

**Hub 不可以部署 `firestore.rules`**：安全規則一個資料庫只有一份，Hub 一部署就會蓋掉官網的全鎖。
如果寫成 `request.auth != null`，任何 Google 帳號都能讀到名單（含健康資料）：這個專案的 Firebase Auth 接受任何 Google 帳號登入，後台的允許名單是在官網伺服器裡比對，安全規則看不到。
Hub 的 `firebase.json` 不要有 `firestore` 區塊，部署一律加 `--only hosting`。

Hub／CRM 的服務帳號需要 lkkdev（測試）與 lkkprod（正式）**各自**的 Firestore 讀取權限（例如 `roles/datastore.viewer`；IAM 角色按專案授予，兩個專案要分別開通，dev 開通不代表正式站讀得到）。
讀取時丟出 `PERMISSION_DENIED` 是權限沒開；`snap.exists` 為 `false` 是文件還沒寫入（例：lkkprod 正式站還沒發版）。兩者是不同的問題，告警訊息要分開。
**目前 Hub／CRM 的服務帳號都還沒有這個權限**（`lkkhubapi-runtime`、`lkkapi-sa` 都沒有 Firestore 角色），開通方式另行討論（viewer 角色的範圍是整個資料庫，不只這份文件）。

---

## 3. config 長什麼樣子

`JSON.parse(schemaJson)` 之後的頂層：

| key | 內容 |
|---|---|
| `formId`、`leadType`、`schemaVersion` | 同上 |
| `describes` | 一句話說明 |
| `conventions` | **閱讀規則**：條件怎麼寫、`required` 的意思、選項 value 與 label 的差別，以及這張表單才有的寫法（`tabs`、`$option.…`）。`labelSuffixWhenOptional` 也寫在這裡，但三張表單都有（預約、團課在 `contactPhone`，預約另有同意事項），這張用在 `companySize`、`budgetRange`。先讀這段 |
| `sections` | 表單分兩段，每段有 `fields`（欄位定義，見下表） |
| `consent` | 沒有同意勾選框，只有按鈕下方一句默示同意文字（`implicitConsentText`）。**沒有存進名單** |
| `hiddenFields` | 使用者看不到、但會存進名單的值：只有來源頁 `sourcePage` 與 UTM |
| `context` | 頁面文案（`pageMeta`）。**這張表單不讀網址參數**：`params` 是空物件，沒有變體、合作方、名單來源（所以也不會有預約、團課表單放停用變體的 `retiredVariants`，或預約表單放停用合作方的 `retiredFreeTrialPartners`；那兩張目前也還沒有這兩個 key） |
| `derived` | 空物件（沒有衍生值） |
| `submit` | 送出 API、前端檢查順序、伺服器驗證規則、成功／失敗畫面 |
| `record` | **名單（`leads` 集合）的欄位清單**：哪些在頂層、哪些在 `payload`、哪些固定是 `null`（`constantFields`）、哪些沒存 |
| `crossFormDifferences.vsBooking` | 跟預約表單的差異清單（同時串多張表單時必讀，第 5 節有整理）。Firestore 版的 `crossFormDifferences` **只有 `vsBooking`**；`conventions.topLevelExtra` 提到的「與後台、CLAUDE.md 的差異」（`vsAdmin`、`vsClaudeMd`）同步時已移除，不要讀 |
| `knownQuirks` | 現況的怪異行為與 bug（只記錄、未修），解讀名單時會用到 |
| `hiddenFieldsTrust` | 哪些值沒有經過伺服器驗證（重要，見第 6 節） |

### 條件寫法（`conventions.condition`）

```json
{ "field": "cooperationType", "op": "eq", "value": "講座及課程邀約" }
```

- `op`：`eq`、`neq`、`in`、`notIn`、`includes`、`truthy`、`falsy`、`gte`（三張表單共用的定義）
- 這張表單實際用到的條件只有兩種：`companySize`、`budgetRange` 的 `required`（上面這個），以及送出按鈕的 `submit.disabledIf`（`$state.isSubmitting`）
- **沒有任何欄位有 `showIf`**：所有欄位一直顯示，所以也沒有 `store.whenHidden`

### 欄位一覽（`sections[].fields[]`）

| key | 題目 | 類型 | 必填 | 存在名單的位置 | 存的型別 |
|---|---|---|---|---|---|
| `cooperationType` | 請選擇你的洽詢項目： | **tabs**（三顆並排按鈕） | 必填（一定有一個被選中） | `payload.cooperationType` | string |
| `organization` | 公司 / 單位名稱 | text | 必填 | `payload.organization` | string |
| `name` | 聯絡人姓名 | text | 必填 | `name` | string |
| `phone` | 聯絡電話 | tel | 必填 | `phone` | string（原值，可能含橫線、空白，見第 5 節） |
| `email` | 電子郵件 | email | **必填** | `email` | string |
| `lineId` | Line ID | text | 選填 | `payload.lineId` | string／null |
| `companySize` | 規模人數 | text | 洽詢項目是「講座及課程邀約」時必填 | `payload.companySize` | string／null（自由文字） |
| `budgetRange` | 預算區間 | text | 洽詢項目是「講座及課程邀約」時必填 | `payload.budgetRange` | string／null（自由文字） |
| `message` | 合作內容詳情 | textarea | **必填** | `message` | string |

每個欄位的完整定義（選項、錯誤訊息、驗證規則、存法說明）在 config 裡的 `field.options`、`field.required`、`field.validation`、`field.store`。

### 讀題目與選項：用哪些 key

config 裡還有提示字（`placeholder`）、錯誤訊息（`errors`）、驗證範例（`validation[].accepts`／`rejects`）等給官網畫面與說明用的 key，串接題目用不到，略過即可。
要讀的只有下面這些。

**位置**：`schema.sections[]`（段落）→ `section.fields[]`（每一題）。

- 第一段 `id` 是 `enquiry-type`，`title` 跟題目相同（`請選擇你的洽詢項目：`）。
- 第二段 `id` 是 `contact`，**`title` 是 `null`**（畫面上沒有分區標題），要顯示段落標題的話自己處理空值。

**每一題**

| 要讀什麼 | key | 說明 |
|---|---|---|
| 欄位代號 | `key` | 這張表單的 `key` 跟名單欄位名稱都一樣，但頂層或 `payload` 要看下一列 |
| 名單裡的位置 | `store.path` | 頂層欄位直接是名稱（`name`、`phone`、`email`、`message`），其他是 `payload.<名稱>` |
| 題目 | `label` | 例：`公司 / 單位名稱`、`規模人數` |
| 題目補充 | `labelSuffix` | 只有 `lineId`：`(選填)`（**半形括號**，預約表單是全形`（選填）`）。畫面上 `label` 與補充之間有一個空格 |
| 選填時的補充 | `labelSuffixWhenOptional` | 這張表單用在 `companySize`、`budgetRange`：`required` 條件不成立時題目後面顯示 `(選填)`，成立時改顯示必填記號。值是**半形** `(選填)`，預約、團課表單同一個 key 的值是全形`（選填）` |
| 必填 | `required` | `true`／`false`，或一個條件物件（`companySize`、`budgetRange`） |
| 存的型別 | `store.valueType` | 只有 `cooperationType`、`companySize`、`budgetRange` 有寫，**而且寫的是說明文字**（例：`string（自由文字，不是選項）`），不是預約表單那種 `boolean`、`string[]` 代號。要判斷型別請用 `startsWith('string')`，不要用 `===` |
| 沒填時存什麼 | `store.empty` | `lineId`、`companySize`、`budgetRange` 都是 `null` |

這張表單**沒有** `store.map`（沒有布林欄位）、`showIf`、`store.whenHidden`、`store.possibleValues`。

**選項**：只有一種來源，也只有一題有選項。其他八題都是自由輸入。

| 來源 | key | 用在哪些題 | 怎麼讀 |
|---|---|---|---|
| 固定選項 | `options[]` | 只有洽詢項目 `cooperationType` | `value` 是名單裡存的字；`label` 是畫面上的字（三個選項都有寫 `label`）；`messagePlaceholder` 是選這項時「合作內容詳情」的提示字 |
| 已停用的選項 | `retiredOptions[]` | 同一題（`cooperationType`） | 2026-11-14 起，停用的選項從 `options` 移到這裡，格式同 `options`（`value`、可省略的 `label`），另可有 `retiredOn`（停用日）、`note`（說明）。畫面上不再出現，**只用來解讀舊名單**；列新表單的選項時不要列出。目前沒有任何停用的選項，這個 key 不存在，讀的時候當成空陣列 |
| 動態選項 | 無 | — | 沒有 `optionsSource`，不用讀 `stores` 或 `settings/referralOptions` |
| 第二層 | 無 | — | 沒有 `options[].detail`，也沒有 `other`（「其他」加說明） |

三個選項（依畫面順序）：

| `value`（名單存的字） | `label`（畫面上的字） | 備註 |
|---|---|---|
| `講座及課程邀約` | 表情符號＋空格＋`講座及課程邀約` | 預設選中；選這項時規模人數、預算區間改必填 |
| `採訪邀約` | 表情符號＋空格＋`採訪邀約` | |
| `異業合作` | 表情符號＋空格＋`異業合作` | |

- 三個 `label` 都是「一個表情符號＋半形空格＋`value`」。Hub／CRM 不想顯示表情符號的話，直接顯示 `value` 即可，意思完全相同。
- `default` 是 `講座及課程邀約`：這題是分頁按鈕，沒有「未選」狀態，經表單送出的名單一定是三個值之一。

另外兩個跟這題有關的 key：

- `message` 的 `placeholder` 是 `$option.cooperationType.messagePlaceholder`，**不是實際文字**，而是「目前選中選項的 `messagePlaceholder`」（規則在 `conventions.optionRef`）。要顯示提示字就去選項上取。
- `valueRules`：切換洽詢項目**不會清空**規模人數、預算區間、合作內容詳情（見第 5 節）。

**讀取範例（Node.js）**：列出每一題的題目、名單位置與選項

```js
const fields = schema.sections.flatMap((s) => s.fields)

for (const f of fields) {
  const question = f.label + (f.labelSuffix ? ' ' + f.labelSuffix : '')  // 題目
  const path = f.store?.path                                             // 名單位置，例：'payload.organization'
  const options = (f.options ?? []).map((o) => ({
    value: o.value,                                                      // 名單裡存的字
    label: o.label ?? o.value,                                           // 畫面上的字（含表情符號）
  }))
  const retired = (f.retiredOptions ?? []).map((o) => ({                 // 已停用：只拿來解讀舊名單
    value: o.value,
    label: o.label ?? o.value,
    retiredOn: o.retiredOn ?? null,
  }))
  const requiredWhen = typeof f.required === 'object' ? f.required : null // 條件必填
}

// 名單值 → 畫面上的字：先查 options、再查 retiredOptions，都沒有就回原值
function toLabel(field, value) {
  const hit = [...(field.options ?? []), ...(field.retiredOptions ?? [])].find((o) => o.value === value)
  return hit ? (hit.label ?? hit.value) : value
}
```

**把名單的值轉回畫面上的字**

1. 只有 `payload.cooperationType` 需要轉：拿整個值去比 `options[].value`，比到就用 `label ?? value`（或直接顯示 `value`，見上）。
2. 比不到再比同一題的 `retiredOptions[].value`（已停用的選項），比到一樣用 `label ?? value`，需要時可標示「已停用」。
3. 這張表單**沒有**「主選項: 細項」的組合值，也沒有布林，不需要用「: 」切開或反查 `store.map`。
4. 兩邊都比不到（2026-11-14 以前就消失的舊選項、直接呼叫 API 寫入的值，見第 5、6 節）：直接顯示原值，不要丟掉。
5. 其他欄位都是使用者自己打的字，原樣顯示。

### 選項的 value 與 label

- `value` 是**存進名單的字**，`label` 是畫面上的字。
- 「選項只新增或停用、不改既有 value 的字」**2026-11-14 起由建置檢查強制**：官網建置時會拿 config 跟上一版的記錄（官網 repo 裡的 `docs/form-schema/values-ledger.json`，不會同步到 Firestore）比，
  記錄過的選項值（`options` 加 `retiredOptions`）少了一個就建置失敗，**升了 `schemaVersion` 也一樣**（升版只允許改存法，不允許丟掉舊名單的值）；新增的選項也要先記錄才建置得過。
  升版刪掉整題時，記錄檔會留著那題的值，同一個 key 之後再加回來，這些值也要在。
  所以改字只能是「停用舊值＋新增新值」，舊值會留在 `retiredOptions`。題目（含隱藏欄位）被拿掉或改了 key、`store.path`、`store.valueType` 開頭的型別、`store.alsoWrites` 少了一個位置，或 `leadType` 改變，則是要升 `schemaVersion` 才放行（見第 7 節）。
  在這之前改過：洽詢項目在 2026-08-24，值與意思都變過，見第 5 節「舊值」。
- **2026-11-14 起停用的選項不會再從 config 消失**，而是移到同一題的 `retiredOptions`（見上面「選項」表），舊名單的值查得到意思。
  **更早消失的值不在 `retiredOptions` 裡**（第 5 節的三個舊值就不在 config 裡），所以舊名單的值仍可能兩邊都對不到，照原值顯示，不需要對照表。
  對不到的值分不出「2026-11-14 以前停用的正式選項」和「直接呼叫 API 寫進來的值」；只有在需要區分這兩種時（例如做資料品質報表），才需要 Hub／CRM 自己保存這份清單，至少包含第 5 節的三個舊值，而且不要自動對應到新值。

---

## 4. 不在 config 裡、要另外讀的動態選項

**題目的動態選項：這張表單沒有。** 洽詢項目的三個選項寫死在官網程式裡，config 的 `options` 就是全部。
不用讀 `stores`（名單的 `storeId` 固定是 `null`），也不用讀 `settings/referralOptions`（沒有「從哪裡得知」這題）。

### 選配：把代碼轉成中文

下面兩組對照不在 config 裡，要不要做由 Hub 決定；不做就顯示原始代碼，跟官網後台現況一樣。

- **UTM 活動名稱**：`payload.utm.campaign` 可以用 `campaigns` 集合的 `utmCampaign` 欄位對到活動名稱 `name`。
  後台可以改活動代號、也可以刪除活動，所以舊名單可能對不到，對不到就顯示原始代號。官網後台的名單頁自己也只顯示代號。
  後台存的代號一律是小寫；名單裡的值是網址上的原字（只去掉前後空白、不轉小寫），比對前可以先轉小寫。
- **名單狀態 `status` 的中文**：`new` 新名單、`contacted` 已聯繫、`scheduled` 已預約、`completed` 已完成、`cancelled` 已取消。
  以官網 `composables/useLeadStatus.ts` 為準；config 裡只有英文代碼。

---

## 5. 對照名單（`leads` 集合）

合作洽詢的名單在 `leads`，`type == 'cooperation'`。欄位位置以 config 的 `record` 為準：

| 位置 | 內容 |
|---|---|
| 頂層 `type` | `cooperation` |
| 頂層 `status` | `new`／`contacted`／`scheduled`／`completed`／`cancelled`（後台可改；中文見第 4 節「選配」） |
| 頂層 `internalNote` | 後台內部備註，建立時 `null`（後台可改） |
| 頂層 `name`、`phone`、`email`、`message` | 見欄位一覽 |
| 頂層 `storeId` | **固定 `null`** |
| 頂層 `sourceChannel` | **固定 `null`** |
| 頂層 `sourcePage` | 通常是 `/cooperation`（前端送什麼存什麼，沒送時伺服器補 `/cooperation`） |
| 頂層 `createdAt`、`updatedAt` | Firestore Timestamp |
| `payload.cooperationType`、`payload.organization` | 洽詢項目、公司／單位名稱 |
| `payload.lineId`、`payload.companySize`、`payload.budgetRange` | 完全沒打字時是 `null`；只打空白時是空白字串（見下方「存值的細節」） |
| `payload.utm` | UTM（隱藏欄位），沒有時是 `null` |

現在寫入的名單 `payload` 一定有上面六個 key（值可能是 `null`），前端送來的其他欄位伺服器不收。但舊名單不保證長這樣：

- config 的 `record.payload` 是**現行版本會寫的 key**。較舊的名單可能**缺 key**（缺少與 `null` 同等處理），
  也可能**多出 config 沒列的 key**（忽略，不要報錯）。例如 lkkdev 若有舊版網站時期的名單（見下方「舊值」），`payload` 沒有 `utm` 這個 key。
- **lkkdev 的名單多為測試資料，不具代表性**。在 lkkdev 驗收「名單都對得上 config」不代表 lkkprod 也對得上，
  上 prod 前要以 lkkprod 的實際資料驗收（由官網維護者提供只取選擇題欄位、不含姓名電話的統計，例如 `payload.cooperationType` 各值的筆數）。

`payload.utm` 的形狀（每個 key 都可能不存在）：

| key | 內容 |
|---|---|
| `source`、`medium`、`campaign`、`content`、`term` | 網址上的 `utm_*`，去前後空白、最多 200 字 |
| `referrer` | 捕捉到目前這組 utm 值時的 `document.referrer`（整個網站載入時的外部來源，不是站內上一頁） |
| `landingPage` | 捕捉到目前這組 utm 值時的完整路徑（含查詢字串與 `#`），**不一定是進站頁**，可能是站內任何一頁 |
| `capturedAt` | 捕捉到目前這組 utm 值的時間（ISO 字串），**不是送出時間** |

> `referrer`／`landingPage`／`capturedAt` 是「捕捉到目前這一組 utm 值」的那一次留下的，**不是首次接觸**。
> 之後帶著不同的 utm 值進站或在站內換頁，整組（含這三個）會被覆蓋、以最後一次為準（最後接觸）；五個 utm 值完全相同時才保留原值。

UTM 存在瀏覽器 cookie 30 天，跟預約表單共用同一顆；訪客在任何頁面帶 `utm_*` 進站都會記下來，不限 `/cooperation`。

### 存值的細節

- **電話存原值，沒有正規化**：可以是手機或市話，可能含橫線、空白、前後空白，例如同一支號碼可能存成 `02-2500-0131`、`0225000131`、` 02 2500 0131 `。
  要比對或去重複，請先去掉**所有空白字元**（含全形空白、tab、換行；伺服器驗證時就是用 JS 的 `\s` 去掉的，存的仍是原值）以及橫線再比，例如 `phone.replace(/[\s-]/g, '')`。只去半形空白的話，含全形空白的號碼會對不起來。驗證規則的市話分支也會讓 9 碼、11 碼的 `09` 開頭數字通過（`knownQuirks` 有列）。
- **切換洽詢項目不會清空已填的欄位**：使用者先在「講座及課程邀約」填了規模人數、預算區間，再切到「採訪邀約」送出，名單仍會有這兩個值。
  所以 `companySize`、`budgetRange` 有值**不代表**洽詢項目是講座；要以 `payload.cooperationType` 為準。
- **規模人數、預算區間是自由文字**，不是數字也不是選項（提示字是「例如：50 人、100-200 人」「例如：5 萬以下、5-10 萬、10 萬以上」），要統計的話得自己解析。
- **文字欄位都存原值、不去前後空白**（Email 例外：瀏覽器會先去掉前後半形空白）。
  只打空白的值，必填欄位會被前端擋下；但 `lineId`，以及洽詢項目不是講座時的 `companySize`、`budgetRange`，前端不檢查，正常經表單送出也會存成空白字串（例如 `"  "`，不是 `null`）。直接呼叫 API 則任何欄位都可能是空白字串。
  判斷「沒填」請用 `v == null || String(v).trim() === ''`，不要只用 `=== null`。
- **沒有長度上限**：任何文字欄位都可能很長。
- **同意事項沒有存**：只有一句默示同意，沒有勾選框，也沒記條文版本。
- **名單沒有記錄表單版本**。

### 舊值：洽詢項目改過名

這張表單在接上 API 之前是假送出（按送出不會寫入任何資料），兩個環境接上的時間不同。依官網的 git 記錄（台北時間，實際生效再加上發版的幾分鐘）：

| 時間 | commit | 發生什麼事 |
|---|---|---|
| 08-22 00:21 | `7a97ca2`（只上 dev） | dev 站表單接上 API，送的是舊三類 |
| 08-24 00:45 | `d34ac4f`（上 prod） | 接好 API 的表單上正式站，選項仍是舊三類 |
| 08-24 21:13 | `a19976c`（只在 dev） | dev 站改成新三類；commit 記錄寫明當時正式站的合作洽詢＋加盟名單是 0 筆，lkkdev 有 6 筆舊值測試資料（有沒有含加盟名單沒寫清楚） |
| 08-24 21:34 | `417d6d4`（上 prod） | 新三類上正式站 |

所以 `cooperationType` 送舊三類的期間：

| 環境 | 舊值期間 | 實際有沒有舊值 |
|---|---|---|
| lkkdev | 約 2026-08-22 00:21～08-24 21:13 | **確定有**（測試資料） |
| lkkprod | 約 2026-08-24 00:45～08-24 21:34 | 到 21:13 為 0 筆；之後到新版部署完成的二、三十分鐘，或部署後還開著舊頁面的人送出，才可能寫入舊值。**極可能全是新三類，但未查 Firestore 證實** |

另外，lkkdev 在 2026-07-30 換成這個專案時，有一支把舊專案所有集合整批複製過來的工具（`scripts/migrate-firestore.mjs`）；
更早的舊版網站（Next.js）合作洽詢表單可以送出，用的也是舊三類，而且 `payload` 沒有 `utm`。lkkdev 有沒有因此多出更早的舊名單，**未證實**。
lkkprod 不受影響（上表 08-24 21:13 時是 0 筆）。

舊的三個值：

| 舊值 | 說明 |
|---|---|
| `講座邀約` | 08-24 起改為現在的選項 |
| `企業健康促進邀請` | 同上 |
| `媒體採訪與異業合作` | 同上 |

08-24 那次改名不只是換字，選項的意思也重新劃分，所以**不要把舊值自動對應到新值**，原樣顯示即可。
顯示與辨認舊值的做法見第 3 節「選項的 value 與 label」。

### 同一個 `leads` 集合裡容易混淆的名單

- **`type == 'franchise'`（加盟洽詢，舊資料）**：加盟表單已於 2026-10-16 下架，但舊名單還在，而且它的 `payload` 也有 `cooperationType`（加盟合作類型，可能是 `null`）與 `organization`，key 名一樣、意思不同。
  官網後台的合作洽詢頁會把兩種名單合併顯示；Hub／CRM 查詢時請一定加 `type == 'cooperation'` 條件，不要只看有沒有 `payload.cooperationType`。

### 跟預約表單不一樣的地方

同時串三張表單時最容易搞混的地方（完整清單在 config 的 `crossFormDifferences.vsBooking`）：

| 項目 | 預約體驗（`booking`） | 合作洽詢（`cooperation`） |
|---|---|---|
| `leads.type` | `booking` | `cooperation`（跟 `formId` 相同；團課則是 `formId` `group-booking`、`type` `group_class`） |
| `name` 是誰 | 學員本人 | **聯絡窗口**，不是學員 |
| LINE | `payload.line` | **`payload.lineId`** |
| 電話 | 只收 `09` 開頭 10 碼手機 | 手機或市話，可含橫線與空白，存原值 |
| Email | 選填，可能是 `null` | **必填** |
| `message` | 備註，選填，可能是 `null` | 合作內容詳情，**必填** |
| 公司 | `payload.company`：網址變體帶入的合作公司（隱藏欄位） | `payload.organization`：填表者自己打的單位名稱。**不同 key、不同概念** |
| `storeId` | 一定有值 | 固定 `null` |
| `sourceChannel` | 得知管道以「, 」串成的字串；被變體隱藏時是空字串 `''`（config `vsBooking` 寫「為 null」是錯的，以 booking 的 config 為準） | 固定 `null` |
| 得知管道、變體 | 有 `payload.sources`、`formVariant`、`leadSource` | **都沒有** |
| 布林欄位 | `filledBySelf`、`hasMedicalCondition` | 沒有 |
| 同意事項 | 七條＋勾選框（沒存） | 一句默示同意（沒存） |
| `store.valueType` 的寫法 | 代號（`boolean`、`string[]`） | 說明文字（`string（…）`） |
| `labelSuffix`、`labelSuffixWhenOptional` 的括號 | 全形`（選填）` | 半形`(選填)` |

---

## 6. 注意事項

1. **伺服器只驗證少數欄位**：公司／單位、聯絡人、電話、Email、合作內容詳情、洽詢項目必填；洽詢項目剛好是字串 `講座及課程邀約` 時，規模人數與預算區間也必填；
   電話（去掉所有空白後）要符合 `^(09\d{8}|0\d{1,2}-?\d{3,4}-?\d{4})$`；Email 要符合 `^[^\s@]+@[^\s@]+\.[^\s@]+$`。
   必填只看「是不是真值」，不去空白、**不檢查型別**。
2. **其他都不檢查**：`cooperationType` 是不是三個選項之一（任意字都會存）、`lineId`、各欄長度、`sourcePage`、`utm` 內容。
   直接呼叫官網 API 可以寫入任意值，甚至非字串（數字、陣列、物件），所以 Hub／CRM 處理名單時，**不要假設值一定在選項清單裡，也不要假設一定是字串**（細節在 config 的 `submit.serverValidation`）。
3. **隱藏欄位沒有驗證**：`sourcePage`、`payload.utm` 由前端送出、伺服器原樣存。不要當成已驗證的資料（詳見 config 的 `hiddenFieldsTrust`）。
4. **沒有驗證碼、沒有頻率限制、沒有重複送出保護**（只有前端按鈕送出中停用）。可能出現重複名單或垃圾名單。
5. **舊名單可能有現在已不在清單裡的值**：2026-11-14 以後停用的在 `retiredOptions` 查得到，更早的（見第 5 節「舊值」）查不到。
6. **名單沒有記錄當時的 config 版本**。要判斷名單是哪一版表單填的，只能看 `createdAt`。
7. **不要寫入 `formSchemas`**：官網只在 `contentHash` 不一致時才重寫。改了其他欄位（例如 `schemaJson`）卻沒改 `contentHash`，錯的內容會一直留著，Hub／CRM 自己也會讀到錯的。
8. **官網建置前檢查的範圍**：
   - **跟官網程式比**：config 的洽詢項目選項（value、順序、label、`messagePlaceholder`）跟官網程式不一致時，官網會建置失敗，所以選項一定跟官網現況一致。
     這項只比現況、不比歷史：程式與 JSON 一起改，就過得了。
   - **跟上一版記錄比**（2026-11-14 起，記錄檔是官網 repo 裡的 `docs/form-schema/values-ledger.json`）：記錄了表單的 `leadType`、`schemaVersion`，
     以及**九題與兩個隱藏欄位**（`sourcePage`、`utm`；記錄檔裡的 key 加 `hidden:` 前綴）各自的名單位置（`store.path`）、`store.valueType` 開頭的型別（沒寫就算 `string`，所以補寫 `string` 不算改動）與 `store.alsoWrites` 的位置（這張表單沒有）；
     有選項的題目另記錄選項值（含 `retiredOptions`）；任何題目的 `store.possibleValues` 也會記，有 `store.map` 的題目記的是對照後存的值、不是選項文字，網址變體與合作方的代號也會記（這三種這張表單都沒有）。
     記錄過的值不能消失或改字，升 `schemaVersion` 也不行（停用要移到 `retiredOptions`）；升版刪掉的題目，記錄檔會連同它的值留著，同一個 key 之後再加回來也要包含這些值。
     題目（含隱藏欄位）被拿掉或改 key、改 `store.path`、改型別、`store.alsoWrites` 少了一個位置、`leadType` 改變，要升 `schemaVersion` 才放行；
     新增的題目或選項要先記錄才建置得過（見第 3 節「選項的 value 與 label」、第 7 節）。
   - **表單清單、`leadType` 與寫名單的程式**（見第 1 節）。
   - **不在記錄比對範圍**：選項的 `label`、`messagePlaceholder`、題目文字、提示字、錯誤訊息、必填條件（`required`）、`store.valueType` 開頭型別後面的說明文字
     （預約、團課表單另有顯示條件、隱藏時存什麼、得知管道第二層、變體與合作方的設定值、課程價格、備用分店也不在範圍，這張表單沒有這些）。
     其中選項的 `label`、`messagePlaceholder` 仍跟官網程式比（只比現況），所以程式與 JSON 一起改就可以改字；
     題目文字、提示字、錯誤訊息、必填條件、伺服器規則的描述也不跟程式比，是人工維護的。
   - 記錄檔放在官網 repo，維護者手改它還是繞得過去：這項檢查防的是「不小心」，不是「故意」。
9. **config 的 `submit.sideEffects`／`knownQuirks` 描述的是官網現況，不是規格**，Hub 不要照做。
   例如裡面寫官網伺服器 log 會印出名單 id、聯絡人姓名、公司／單位、洽詢項目，寄確認信時另外印出填表者 Email，那是官網目前的行為；**Hub 的 log 不記個資**（要追查時記名單的文件 id 即可）。
10. **名單是個資，只同步營運真正需要的欄位**：這張表單沒有健康欄位（不像預約與團課表單），但有聯絡人姓名、電話、Email、LINE ID 與自由文字的合作內容詳情。
    名單用途要跟填表時告知的目的一致：送出鈕下方寫的是「送出即代表你同意本網頁資訊將僅作為商務對接與回覆洽詢使用。」，
    隱私權政策（`/privacy`）也寫明只在該特定目的範圍內利用、非經書面同意不用於其他用途。
    Hub 若要拿名單做超出「商務對接與回覆洽詢」的事（例如行銷、跟其他名單合併），請先跟官網方確認。

---

## 7. 版本與變更

| 變動 | `contentHash` | `schemaVersion` | Hub／CRM 要做什麼 |
|---|---|---|---|
| 改題目文字、提示字、新增或停用選項 | 會變（題目文字、提示字、必填條件需官網維護者同步更新 JSON 才會變；選項有建置檢查，見第 1 節） | 不變 | 不必改程式；照新 config 顯示即可。停用的選項會出現在 `retiredOptions`，解讀舊名單時要一起查 |
| 欄位改名、值的存法改變（例如字串改布林） | 會變 | **升版** | 官網會先通知，Hub／CRM 調整後再上線 |
| 表單下架 | 變一次（config 加 `retiredOn`） | 不變 | 文件頂層與 config 多出 `retiredOn`；文件不刪，照樣用來解讀舊名單，之後不會再有這張表單的新名單（見第 1 節） |
| 加上 `leadType`、`retiredOptions` 的閱讀規則（2026-11-14，dev） | 下次 dev 發版後三張表單都變一次 | 不變 | 可改用 `leadType` 找 config（查不到時退回對照表，見第 1 節）、解讀值時加查 `retiredOptions`（見第 3 節）；題目與選項沒有變 |

2026-11-14 起，官網建置時會比對官網 repo 裡的上一版記錄 `docs/form-schema/values-ledger.json`（細節見第 6 節第 8 點）：
- **升版也擋**：記錄過的選項值（含 `retiredOptions`）消失或改字。升版刪掉的題目，記錄檔會連同它的值留著，同一個 key 之後再加回來，這些值也要在。
- **沒升 `schemaVersion` 就擋**：任何一題（不只有選項的題目，也包括隱藏欄位 `sourcePage`、`utm`）被拿掉或改了 key、改了 `store.path`、`store.valueType` 開頭的型別（沒寫算 `string`），或 `store.alsoWrites` 少了一個位置；`leadType` 改變。
- **沒記錄就擋**：新增的題目或選項。

其他情況要不要升版仍是官網維護者**人工判斷**：例如必填條件改變，以及升版本身是否恰當，都沒有程式檢查；上表是目前的約定（選項改不改 value 的情形見第 3 節「選項的 value 與 label」）。

建議 Hub／CRM 讀取時檢查 `schemaVersion`，遇到沒處理過的版本就告警，不要直接套用。
但 `schemaVersion` 沒變不保證所有值都對得上，對不到選項的值一律照原值顯示。

---

## 8. 聯絡

config 內容有疑問、或需要新增欄位與選項，請聯繫官網維護者。
