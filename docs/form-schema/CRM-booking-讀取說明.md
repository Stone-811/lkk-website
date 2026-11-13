# CRM 讀取「預約體驗」表單 config 說明

> 對象：CRM（同一個 Firebase 專案）的開發者
> 環境：**lkkdev（測試）**；正式站 lkkprod 上線後路徑相同、只換專案
> 更新：2026-11-14

練健康官網 `/booking`「預約體驗」表單的完整定義（欄位、選項、條件、存進名單的位置），
已經放在 Firestore，CRM 直接讀即可。**這份 config 是唯讀的**：由官網自動維護，CRM 不要寫入。

---

## 1. 在哪裡

| 項目 | 值 |
|---|---|
| Firebase 專案 | `lkkdev`（正式站：`lkkprod`） |
| 資料庫 | `(default)` |
| 文件路徑 | `formSchemas/booking` |
| 其他表單 | `formSchemas/group-booking`（團課）、`formSchemas/cooperation`（合作洽談），結構相同 |

### 文件欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `formId` | string | `booking` |
| `schemaVersion` | string | 目前 `1.0`。**只有不相容的改動才升版**（欄位改名、值的存法改變） |
| `contentHash` | string | 整份 config 的 sha256。內容任何變動（含新增選項、改文字）都會變 |
| `schemaJson` | string | **整份 config 的 JSON 字串**，讀了要自己 `JSON.parse` |
| `syncedAt` | timestamp | 寫入時間 |
| `revision` | string | 寫入的官網版本（例：`lkk-website-dev-build-2026-11-12-001`） |

> 為什麼存成字串：config 有多層巢狀與陣列，Firestore 的 map 不支援某些結構，字串最單純。

### 什麼時候會更新

官網伺服器每次啟動時比對一次，之後只要有人逛網站、距上次超過 10 分鐘就再比對一次；內容有變才寫入。
所以這份文件會跟著該環境官網目前在跑的表單：dev 站改了 → lkkdev 更新；正式站改了 → lkkprod 更新。

> ⚠️ 官網剛發版的幾分鐘內，新舊版本會短暫同時在跑，文件可能「新 → 舊 → 新」來回一兩次，
> 最後停在新版。用 `onSnapshot` 監聽的話，不要假設 `contentHash` 一變就是最終版本，也不要假設它只會往前。

---

## 2. 讀取範例

### Node.js（firebase-admin）

```js
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'lkkdev' })
const db = getFirestore()

// 讀一次
const snap = await db.doc('formSchemas/booking').get()
const { schemaVersion, contentHash } = snap.data()
const schema = JSON.parse(snap.get('schemaJson'))

// 或即時監聽（官網更新後馬上收到）
db.doc('formSchemas/booking').onSnapshot((s) => {
  const schema = JSON.parse(s.get('schemaJson'))
  // ...
})
```

### Python（google-cloud-firestore）

```python
import json
from google.cloud import firestore

db = firestore.Client(project="lkkdev")
doc = db.document("formSchemas/booking").get()
schema = json.loads(doc.get("schemaJson"))
print(doc.get("schemaVersion"), doc.get("contentHash")[:8])
```

### 權限

CRM 的服務帳號需要 lkkdev 的 Firestore 讀取權限（例如 `roles/datastore.viewer`）。
**目前 CRM 的服務帳號都還沒有這個權限**，開通方式另行討論（這個角色的範圍是整個資料庫，不只這份文件）。

---

## 3. config 長什麼樣子

`JSON.parse(schemaJson)` 之後的頂層：

| key | 內容 |
|---|---|
| `formId`、`schemaVersion` | 同上 |
| `describes` | 一句話說明 |
| `conventions` | **閱讀規則**：條件怎麼寫、`required`／`showIf` 的意思、選項 value 與 label 的差別。先讀這段 |
| `sections` | 表單分三段，每段有 `fields`（欄位定義，見下表） |
| `consent` | 同意事項（七條、勾選框）。**勾選結果沒有存進名單** |
| `hiddenFields` | 使用者看不到、但會存進名單的值（來源頁、變體、合作公司、名單來源、UTM） |
| `context` | 網址參數 `?v=`（廠商變體）、`?co=`（免費合作方）、`?src=`（名單來源）會怎麼改變表單與存值 |
| `derived` | 頁面算出來、但**沒存**的值（年齡、是否 50 歲以上免費） |
| `submit` | 送出 API、伺服器驗證規則、成功／失敗畫面 |
| `record` | **名單（`leads` 集合）的欄位清單**：哪些在頂層、哪些在 `payload`、哪些沒存 |
| `hiddenFieldsTrust` | 哪些值沒有經過伺服器驗證（重要，見第 6 節） |

### 條件寫法（`conventions.condition`）

```json
{ "field": "filledBySelf", "op": "eq", "value": "他人代填" }
```

- `op`：`eq`、`neq`、`in`、`notIn`、`includes`（多選含某值）、`truthy`、`falsy`、`gte`
- `field` 開頭是 `$variant.` → 讀網址變體設定；`$derived.` → 衍生值；`$state.` → 畫面狀態
- 組合：`{ "all": [...] }`、`{ "any": [...] }`

### 欄位一覽（`sections[].fields[]`）

| key | 題目 | 類型 | 必填 | 存在名單的位置 | 存的型別 |
|---|---|---|---|---|---|
| `name` | 學員姓名 | text | 必填 | `name` | string |
| `phone` | 學員手機 | tel | 必填 | `phone` | string |
| `gender` | 性別 | select | 必填 | `payload.gender` | string |
| `birthDate` | 出生年月日（要上課的學員） | date | 必填 | `payload.birthDate` | string（YYYY-MM-DD） |
| `email` | Email | email | 選填 | `email` | string／null |
| `line` | Line ID | text | 選填 | `payload.line` | string／null |
| `filledBySelf` | 是否為本人填寫 | select | 必填 | `payload.filledBySelf` | **boolean** |
| `relationship` | 與學員的關係 | select | 代填時必填 | `payload.relationship` | string／null |
| `bookerName` | 預約者姓名 | text | 代填時必填 | `payload.bookerName` | string／null |
| `contactPhone` | 方便聯繫的電話 | tel | 代填時必填（關係是「練健康同仁」時選填） | `payload.contactPhone` | string（**一定有值**，見第 5 節） |
| `hasMedicalCondition` | 是否有疾病，或 3 年內曾開過刀或住院？ | select | 必填 | `payload.hasMedicalCondition` | **boolean** |
| `medicalConditionNote` | 請簡述情況 | textarea | 選填（選「是」才出現） | `payload.medicalConditionNote` | string／null |
| `storeId` | 選擇分店 | select | 必填 | `storeId` | string（分店 id） |
| `preferredTimes` | 偏好的上課時段 | checkbox-group | 必填 | `payload.preferredTime`（**少一個 s**） | string[] |
| `source` | 從哪裡得知練健康？ | radio | 必填（變體可隱藏） | `payload.sources`＋頂層 `sourceChannel` | string[]（顯示時長度 1；變體隱藏時是 `[]`） |
| `exerciseGoals` | 訓練目的 | checkbox-group | 選填 | `payload.exerciseGoals` | string[] |
| `paymentMethod` | 付款方式 | select | 必填（變體可隱藏） | `payload.paymentMethod` | string／null |
| `message` | 備註 | textarea | 選填 | `message` | string／null |

每個欄位的完整定義（選項、錯誤訊息、顯示條件、隱藏時存什麼）在 config 裡的 `field.options`、`field.showIf`、`field.store`。

### 讀題目與選項：用哪些 key

config 裡還有提示字、錯誤訊息、日期選擇器設定等給官網畫面用的 key，串接題目用不到，略過即可。
要讀的只有下面這些。

**位置**：`schema.sections[]`（段落，`title` 是段落標題）→ `section.fields[]`（每一題）。

**每一題**

| 要讀什麼 | key | 說明 |
|---|---|---|
| 欄位代號 | `key` | 不一定等於名單裡的欄位名（例：`preferredTimes` 存在 `payload.preferredTime`），名單位置看下一列 |
| 名單裡的位置 | `store.path` | 頂層欄位直接是名稱（`name`），其他是 `payload.<名稱>` |
| 題目 | `label` | 例：`性別`、`偏好的上課時段` |
| 題目補充 | `labelSuffix` | 選填，例：`（選填）`、`（可複選）`；要顯示完整題目就接在 `label` 後面 |
| 存的型別 | `store.valueType` | 沒寫就是字串；`boolean`、`string[]` 會寫出來 |
| 布林對照 | `store.map` | 只有 `filledBySelf`、`hasMedicalCondition`，例：`{ "本人填寫": true, "他人代填": false }` |
| 什麼時候才出現 | `showIf` | 條件不成立時這題不出現，名單裡存 `store.whenHidden` 的值（多半是 `null`） |

**選項**：有三種來源，沒有這三種 key 的題目是自由輸入（姓名、電話、日期、備註…）。

| 來源 | key | 用在哪些題 | 怎麼讀 |
|---|---|---|---|
| 固定選項 | `options[]` | 性別、本人填寫、關係、健康狀況、時段、得知管道、訓練目的、付款方式 | `value` 是名單裡存的字；`label` 是畫面上的字，**沒寫就等於 `value`**；`showIf` 是這個選項的出現條件 |
| 動態選項 | `optionsSource` | 只有分店 `storeId` | 讀 `stores` 集合（第 4 節）；`optionsSource.fallback[]` 是內建四間的 `{ value, label }` |
| 第二層 | `options[].detail` | 只有得知管道 `source` | `detail.type` 是 `select` 時，選項來自 `detail.optionsSource`（第 4 節），讀不到用 `detail.defaultOptions`；是 `text` 時是自由輸入 |

另外兩個跟選項有關的 key：

- `other`（時段、訓練目的）：選了 `other.triggerValue`（`其他`）可以再填說明，名單存成 `其他: <說明>`。
- `store.possibleValues`（付款方式）：名單可能出現、但**不在 `options` 裡**的值，例如 `活動免費`。

**讀取範例（Node.js）**：列出每一題的題目、名單位置與選項

```js
const fields = schema.sections.flatMap((s) => s.fields)

for (const f of fields) {
  const question = f.label + (f.labelSuffix ?? '')       // 題目
  const path = f.store?.path                             // 名單位置，例：'payload.gender'
  const options = (f.options ?? []).map((o) => ({
    value: o.value,                                      // 名單裡存的字
    label: o.label ?? o.value,                           // 畫面上的字
  }))
  // f.optionsSource → 分店，另外讀 stores
  // o.detail        → 得知管道的第二層
}
```

**把名單的值轉回畫面上的字**

1. 布林欄位：用 `store.map` 反查（`true` → `本人填寫`）。
2. 其他欄位：先拿整個值去比 `options[].value`，比到就用那個選項的 `label ?? value`。
3. 比不到時，用**第一個「: 」（冒號＋半形空格）**切開，前半段比 `options[].value`，例：`社群: IG` → 主選項 `社群`、細項 `IG`；`其他: 朋友介紹` 同理。
   時段的值本身有冒號（`平日10:00-17:00`）但沒有空格，所以步驟 2 就會比到，不會被切開。
4. 還是比不到（已停用的舊選項、直接呼叫 API 寫入的值）：直接顯示原值，不要丟掉。

### 選項的 value 與 label

- `value` 是**存進名單的字**，`label` 是畫面上的字；兩者相同時只寫 `value`。
- 例：付款方式 value `臨櫃付款`，畫面顯示「臨櫃付款（第一堂 $500）」。
- **選項只會新增或停用，不會改既有 value 的字**，所以舊名單的值可以安心對照。

### 存的不是畫面上的字：兩個布林

| 欄位 | 畫面選項 → 存的值 |
|---|---|
| `filledBySelf` | 本人填寫 → `true`、他人代填 → `false` |
| `hasMedicalCondition` | 是 → `true`、否 → `false` |

對照表在 `field.store.map`。

---

## 4. 不在 config 裡、要另外讀的動態選項

有兩組選項會由業主在後台隨時調整，config 只寫「去哪裡讀」，不複製內容。

### 分店（`storeId`）

讀 `stores` 集合：

```js
const stores = await db.collection('stores')
  .where('isActive', '==', true)
  .orderBy('sortOrder', 'asc')
  .get()
// 選項 value = 文件 id，label = name
```

- 名單的 `storeId` 通常是 `stores` 的文件 id。
- 例外：官網讀不到分店資料時，頁面會用內建的四間，`storeId` 會是 `nanjing`／`songjiang`／`ximending`／`xindian`，
  不一定對應得到 Firestore 文件。內建清單在 config 的 `storeId.optionsSource.fallback`。

### 「從哪裡得知」的第二層（社群平台、實體活動）

讀 `settings/referralOptions` 文件的 `social`、`event` 欄位，形狀是 `[{ label: string, active?: boolean }]`：

- 取 `label` 去掉前後空白後非空、且 `active !== false` 的項目
- **欄位不存在** → 用 config 裡的 `defaultOptions`
- **欄位存在但全部停用** → 空陣列，官網會把「社群」或「實體活動」整個主選項隱藏

規則寫在 config 的 `source.options[].detail.optionsSource`，預設值在同一層的 `source.options[].detail.defaultOptions`。

---

## 5. 對照名單（`leads` 集合）

預約體驗的名單在 `leads`，`type == 'booking'`。欄位位置以 config 的 `record` 為準，常用的：

| 位置 | 內容 |
|---|---|
| 頂層 `type` | `booking` |
| 頂層 `status` | `new`／`contacted`／`scheduled`／`completed`／`cancelled`（後台可改） |
| 頂層 `name`、`phone`、`email`、`storeId`、`message` | 見欄位一覽 |
| 頂層 `sourceChannel` | `payload.sources` 用「, 」串成的字串 |
| 頂層 `sourcePage` | 通常是 `/booking` |
| 頂層 `createdAt`、`updatedAt` | Firestore Timestamp |
| `payload.*` | 其餘欄位，見欄位一覽與 `record.payload` |
| `payload.formVariant`、`payload.company`、`payload.leadSource`、`payload.utm` | 隱藏欄位（廠商變體、合作公司、名單來源、UTM） |

### 存值的細節

- **得知管道**有第二層時存成「主選項: 細項」，冒號後一個半形空格，例如 `社群: IG`、`其他: 朋友介紹`。單選，但存成長度 1 的陣列；廠商變體把整題隱藏時存 `[]`，`sourceChannel` 是空字串。讀的時候不要直接取 `sources[0]`。
- **偏好時段／訓練目的**選「其他」並填說明時，存成 `其他: …`，放在陣列最後。陣列順序是使用者點選的順序。
- **付款方式**可能的值：`50歲以上免費`、`臨櫃付款`、`活動免費`（不限年齡免費的變體，整題隱藏時自動帶入），或 `null`（只會出現在不經表單、直接呼叫 API 時）。
- **聯絡電話 `payload.contactPhone` 一定有值，但不一定是另一支號碼**：本人填寫時等於學員手機 `phone`；代填但沒填（關係是「練健康同仁」時允許）也存學員手機。
  要判斷有沒有留另一支聯絡電話，看 `payload.filledBySelf === false` 且 `contactPhone !== phone`。
- **年齡沒有存**：要用 `payload.birthDate` 對 `createdAt`（台北時間）自己算。
- **同意事項的勾選結果沒有存**。
- 廠商變體（`?v=`）可能在「從哪裡得知」加額外選項（例如「南山健康守護圈」），也會出現在 `payload.sources`。清單在 `context.variants[*].extraSources`。

---

## 6. 注意事項

1. **伺服器只驗證少數欄位**：姓名、手機（`^09\d{8}$`）、分店、時段必填，以及 Email 格式。
   其他欄位（選項是否在清單內、生日範圍、付款方式…）都不檢查。直接呼叫官網 API 可以寫入任意值，
   所以 CRM 處理名單時，**不要假設值一定在選項清單裡**。
2. **隱藏欄位沒有驗證**：`payload.company`、`payload.leadSource`、`payload.formVariant`、`payload.utm` 由前端送出、
   伺服器原樣存。不要當成已驗證的資料（詳見 config 的 `hiddenFieldsTrust`）。
3. **舊名單可能有現在已不在清單裡的值**：選項停用後，舊名單的值不會變。
4. **名單沒有記錄當時的 config 版本**。要判斷名單是哪一版表單填的，只能看 `createdAt`。
5. **不要寫入 `formSchemas`**：官網只在 `contentHash` 不一致時才重寫。改了其他欄位（例如 `schemaJson`）卻沒改 `contentHash`，錯的內容會一直留著，CRM 自己也會讀到錯的。

---

## 7. 版本與變更

| 變動 | `contentHash` | `schemaVersion` | CRM 要做什麼 |
|---|---|---|---|
| 改題目文字、提示字、新增或停用選項 | 會變 | 不變 | 不必改程式；照新 config 顯示即可 |
| 欄位改名、值的存法改變（例如字串改布林） | 會變 | **升版** | 官網會先通知，CRM 調整後再上線 |

建議 CRM 讀取時檢查 `schemaVersion`，遇到沒處理過的版本就告警，不要直接套用。

---

## 8. 聯絡

config 內容有疑問、或需要新增欄位與選項，請聯繫官網維護者。
