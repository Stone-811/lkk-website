# Hub／CRM 讀取「預約體驗」表單 config 說明

> 對象：Hub／CRM（同一個 Firebase 專案；前端是 Firebase Hosting 靜態 SPA，後端是 Cloud Run 的 `lkkhubapi`／`lkkcrmapi`）的開發者
> 環境：**lkkdev（測試）**；正式站 lkkprod 上線後路徑相同、只換專案（lkkprod 目前還沒有這份文件，正式站發版後才會出現）
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
| 其他表單 | `formSchemas/group-booking`（團體課程報名）、`formSchemas/cooperation`（合作洽詢），結構相同 |

### 名單 type 對 config 文件 id

| 名單 `type` | config 文件 |
|---|---|
| `booking` | `formSchemas/booking` |
| `group_class` | `formSchemas/group-booking` |
| `cooperation` | `formSchemas/cooperation` |
| `franchise`（舊加盟表單，2026-10-16 已下架） | **沒有 config**。Hub 略過，或照原值顯示 |

> 團課的 `type` 是底線（`group_class`），文件 id 是連字號（`group-booking`），**不能拿 `lead.type` 直接組路徑**，
> 一定要經過上面這張對照表。config 文件頂層也沒有記錄名單的 `type`。

### 文件欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `formId` | string | `booking` |
| `schemaVersion` | string | 目前 `1.0`。**只有不相容的改動才升版**（欄位改名、值的存法改變）；是否升版由官網維護者人工判斷，沒有程式檢查（見第 7 節） |
| `contentHash` | string | 整份 config 的 sha256。內容任何變動（含新增選項、改文字）都會變 |
| `schemaJson` | string | **整份 config 的 JSON 字串**，讀了要自己 `JSON.parse` |
| `syncedAt` | timestamp | **最後一次內容變更**時寫入的時間（內容沒變就不會更新，不是心跳） |
| `revision` | string | 最後一次內容變更時，寫入的官網版本（Cloud Run revision 名稱，例：`lkk-website-dev-build-2026-11-12-001`） |

> 為什麼存成字串：config 有多層巢狀與陣列，Firestore 的 map 不支援某些結構，字串最單純。

### 什麼時候會更新

官網伺服器會比對 config 與 Firestore 上的 `contentHash`，內容有變才寫入：dev 站改了 → lkkdev 更新；正式站改了 → lkkprod 更新。

- **發版後要等第一個請求打到官網伺服器，才會比對並寫入**。官網跑在 Cloud Run，閒置時 CPU 會被限縮，
  執行個體啟動時發出的比對會停住，等有請求進來才跑完。沒有流量時（例如 dev 站沒人逛的時段）寫入會延後，
  所以「官網發版完成」不等於「這份文件已經更新」。
- 之後只要有請求、距上次比對超過 10 分鐘就再比對一次（失敗的話 1 分鐘後有請求時再試）。
- **lkkprod 在正式站第一次發版前不存在**這份文件，讀取前一定要檢查文件存在（見第 2 節）。
- `syncedAt`／`revision` 是「最後一次內容變更」的時間與版本，**不是心跳，不代表同步仍在運作**。
  表單很久沒改時它們會停在很久以前；同步因故停擺時看起來也一模一樣，Hub 從這兩個欄位分不出來。
  要確認 Hub 讀到的是哪一版，請比對 `contentHash`（需要時跟官網維護者對前 8 碼）。

> config 是官網維護者手寫的描述檔（`docs/form-schema/booking.json`），不是從頁面自動產生的。
> 選項（value、label、順序）、網址變體與合作方的設定值、內建備用分店由建置檢查保證跟官網程式一致；
> 題目文字、提示字、錯誤訊息、必填與顯示條件、同意事項文字、隱藏值（例如 `活動免費`）是人工維護，少數情況可能比線上畫面慢一步。

> 官網剛發版的幾分鐘內，新舊版本會短暫同時在跑，文件可能「新 → 舊 → 新」來回一兩次，
> 最後停在新版。用 `onSnapshot` 監聽的話，不要假設 `contentHash` 一變就是最終版本，也不要假設它只會往前。

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
async function getBookingSchema() {
  const snap = await db.doc('formSchemas/booking').get()
  if (!snap.exists) {
    // 文件不存在（例：lkkprod 正式站還沒發版）→ 告警，沿用上次的 config，不要往下解析
    console.warn('formSchemas/booking 不存在')
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
db.doc('formSchemas/booking').onSnapshot((s) => {
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
doc = db.document("formSchemas/booking").get()
if not doc.exists:
    # 文件不存在（例：lkkprod 正式站還沒發版）→ 告警，沿用上次的 config，不要往下解析
    logging.warning("formSchemas/booking 不存在")
else:
    schema = json.loads(doc.get("schemaJson"))
    print(doc.get("schemaVersion"), doc.get("contentHash")[:8])
```

### 快取與轉存

- **不要把 config 或選項文字打包進 SPA**（建置時寫死），也**不要用固定 TTL 快取**（例如「快取 1 小時」）：
  官網改了選項，Hub 會在不知道的情況下繼續用舊的。照上面的範例，每次使用前讀 `contentHash`，有變才重新解析。
- 把名單轉存到 Hub 自己的資料庫（Cloud SQL）時，**存原始值**（名單裡的 value），不要只存當下轉出來的 label。
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
- `store.whenHidden`、`store.fallback` 的值如果是 `"$field.<key>"`，意思是「同一筆名單另一個欄位的值」，不是字面字串。
  例：`contactPhone` 隱藏（本人填寫）或代填但留空時，存的是學員手機 `phone` 的值，名單裡不會出現 `$field.phone` 這幾個字。

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
| `source` | 從哪裡得知練健康？ | radio | 必填（變體可隱藏） | `payload.sources`＋頂層 `sourceChannel` | string[]（現行表單送出時長度 1；變體隱藏時是 `[]`；舊名單可能 0～多個，見第 5 節） |
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
| 選填時的補充 | `labelSuffixWhenOptional` | 只有 `contactPhone`（另外同意事項 `consent` 也有）：關係是「練健康同仁」時題目後面加 `（選填）` |
| 存的型別 | `store.valueType` | 沒寫就是字串；`boolean`、`string[]` 會寫出來 |
| 布林對照 | `store.map` | 只有 `filledBySelf`、`hasMedicalCondition`，例：`{ "本人填寫": true, "他人代填": false }` |
| 什麼時候才出現 | `showIf` | 條件不成立時這題不出現，名單裡存 `store.whenHidden` 的值（多半是 `null`；`"$field.<key>"` 開頭的是另一個欄位的值，見上方「條件寫法」） |

**選項**：有三種來源，沒有這三種 key 的題目是自由輸入（姓名、電話、日期、備註…）。

| 來源 | key | 用在哪些題 | 怎麼讀 |
|---|---|---|---|
| 固定選項 | `options[]` | 性別、本人填寫、關係、健康狀況、時段、得知管道、訓練目的、付款方式 | `value` 是名單裡存的字；`label` 是畫面上的字，**沒寫就等於 `value`**；`showIf` 是這個選項的出現條件 |
| 動態選項 | `optionsSource` | 只有分店 `storeId` | 讀 `stores` 集合（第 4 節）；`optionsSource.fallback[]` 是內建四間的 `{ value, label }` |
| 第二層 | `options[].detail` | 只有得知管道 `source` | `detail.type` 是 `select` 時，選項來自 `detail.optionsSource`（第 4 節），讀不到用 `detail.defaultOptions`；是 `text` 時是自由輸入 |

另外兩個跟選項有關的 key：

- `other`（時段、訓練目的）：選了 `other.triggerValue`（`其他`）可以再填說明，名單存成 `其他: <說明>`。
- `store.possibleValues`（只有付款方式）：名單裡可能出現的**所有**值（包含 `options` 裡的值）。付款方式除了 `options` 的兩個值，還多了**不在 `options` 裡**的 `活動免費` 與 `null`。

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
4. 還是比不到（已停用的舊選項、直接呼叫 API 寫入的值、廠商變體加的得知管道）：直接顯示原值，不要丟掉。
   廠商變體的得知管道（`context.variants[*].extraSources`，例如 `南山健康守護圈`）是**現行、合法的值**，但不在 `source.options` 裡，
   照步驟 2、3 一定比不到。Hub 如果要把「比不到」標示成舊資料或異常值，先把 `source` 的值也跟 `extraSources` 比對，比到的就直接用原字當 label。

### 選項的 value 與 label

- `value` 是**存進名單的字**，`label` 是畫面上的字；兩者相同時只寫 `value`。
- 例：付款方式 value `臨櫃付款`，畫面顯示「臨櫃付款（第一堂 $500）」。
- 「選項只新增或停用、不改既有 value 的字」是**目前的約定，沒有機制強制**（建置檢查只比對 config 與官網程式是否一致，不跟上一版比）。
  2026-09-20（含）以前改過：訓練目的的值在 2026-07-31，得知管道的值與存法（複選改單選）在 lkkdev 2026-09-18、lkkprod 2026-09-20，見第 5 節「舊名單的不同形狀」。
- **停用的選項會直接從 config 消失**（選項沒有 `active` 之類的停用標記），所以舊名單的值可能在 config 裡對不到，照原值顯示。

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

讀 `stores` 集合。**當下拉選項**與**解讀名單**是兩種用途，讀法不同：

**當下拉選項**（列出目前可選的分店）：只讀啟用中的，依 `sortOrder` 排序。

```js
const stores = await db.collection('stores')
  .where('isActive', '==', true)
  .orderBy('sortOrder', 'asc')
  .get()
// 選項 value = 文件 id，label = name
```

**解讀名單**（把名單的 `storeId` 轉成店名）：讀**全部** `stores`（含 `isActive == false` 的停用分店），依序比對：

1. 先比**文件 id**：名單的 `storeId` 通常是 `stores` 的文件 id。
2. 比不到再比 **`slug`**：官網讀不到分店資料時，頁面會用內建的四間，`storeId` 會是 `nanjing`／`songjiang`／`ximending`／`xindian`。
   這四個代號就是 `stores` 文件的 `slug`（南京店、松江店、西門店、七張店；2026-11-14 查 lkkdev 與 lkkprod 都是如此），
   官網伺服器端的備用分店清單用的也是同一組代號。內建清單在 config 的 `storeId.optionsSource.fallback`。
3. 都比不到就**顯示原值**，不要丟掉。

```js
const all = await db.collection('stores').get()          // 不加 isActive 條件
const byId = new Map(), bySlug = new Map()
all.forEach((d) => {
  byId.set(d.id, d.get('name'))
  if (d.get('slug')) bySlug.set(d.get('slug'), d.get('name'))
})
const storeLabel = (storeId) => byId.get(storeId) ?? bySlug.get(storeId) ?? storeId
```

注意：

- **分店可能被後台停用、改名或刪除**。刪除時後台只檢查該分店還有沒有教練，不檢查名單；
  預約名單本身**不存店名**，所以分店被刪除後，舊名單的店名無法還原，只能顯示 `storeId` 原值。
  改名之後，舊名單查出來的也會是新店名。需要保留「當時的店名」的話，Hub 轉存名單時另外記下當下查到的店名（`storeId` 原值照樣保留）。
- **`slug` 後台也改得到**，比對 `slug` 只是退路，不保證永遠對得到。
- 後台新增分店時文件 id 是自動產生的，**lkkdev 與 lkkprod 的 id 會不同**（現有四間剛好兩邊相同），不要把 id 寫死在程式裡。

### 「從哪裡得知」的第二層（社群平台、實體活動）

讀 `settings/referralOptions` 文件的 `social`、`event` 欄位，形狀是 `[{ label: string, active?: boolean }]`：

- 取 `label` 去掉前後空白後非空、且 `active !== false` 的項目
- **欄位不存在**（或不是陣列、文件不存在）→ 用 config 裡的 `defaultOptions`
- **欄位存在但全部停用** → 空陣列，官網會把「社群」或「實體活動」整個主選項隱藏

規則寫在 config 的 `source.options[].detail.optionsSource`，預設值在同一層的 `source.options[].detail.defaultOptions`。

### 選配：把代碼轉成中文

下面兩組對照不在 config 裡，要不要做由 Hub 決定；不做就顯示原始代碼，跟官網後台現況一樣。

- **UTM 活動名稱**：`payload.utm.campaign` 可以用 `campaigns` 集合的 `utmCampaign` 欄位對到活動名稱 `name`。
  後台可以改活動代號、也可以刪除活動，所以舊名單可能對不到，對不到就顯示原始代號。官網後台的名單頁自己也只顯示代號。
  後台存的代號一律是小寫；名單裡的值是網址上的原字（只去掉前後空白、不轉小寫），比對前可以先轉小寫。
- **名單狀態 `status` 的中文**：`new` 新名單、`contacted` 已聯繫、`scheduled` 已預約、`completed` 已完成、`cancelled` 已取消。
  以官網 `composables/useLeadStatus.ts` 為準；config 裡只有英文代碼。

---

## 5. 對照名單（`leads` 集合）

預約體驗的名單在 `leads`，`type == 'booking'`。欄位位置以 config 的 `record` 為準，常用的：

| 位置 | 內容 |
|---|---|
| 頂層 `type` | `booking` |
| 頂層 `status` | `new`／`contacted`／`scheduled`／`completed`／`cancelled`（後台可改；中文見第 4 節「選配」） |
| 頂層 `internalNote` | 後台內部備註，建立時 `null`（後台可改） |
| 頂層 `name`、`phone`、`email`、`storeId`、`message` | 見欄位一覽 |
| 頂層 `sourceChannel` | `payload.sources` 用「, 」串成的字串 |
| 頂層 `sourcePage` | 通常是 `/booking` |
| 頂層 `createdAt`、`updatedAt` | Firestore Timestamp |
| `payload.*` | 其餘欄位，見欄位一覽與 `record.payload` |
| `payload.formVariant`、`payload.company`、`payload.leadSource`、`payload.utm` | 隱藏欄位（廠商變體、合作公司、名單來源、UTM）；`formVariant` 的型別見下方「存值的細節」 |

### 存值的細節

- **得知管道**有第二層時存成「主選項: 細項」，冒號後一個半形空格，例如 `社群: IG`、`其他: 朋友介紹`。現行表單是單選，但存成長度 1 的陣列；廠商變體把整題隱藏時存 `[]`，`sourceChannel` 是空字串。舊名單可能是 0～多個（見下方「舊名單的不同形狀」）。讀的時候不要直接取 `sources[0]`，一律當任意長度的陣列處理。
- **偏好時段／訓練目的**選「其他」並填說明時，存成 `其他: …`，放在陣列最後。陣列順序是使用者點選的順序。
- **付款方式**可能的值：`50歲以上免費`、`臨櫃付款`、`活動免費`（不限年齡免費的變體，整題隱藏時自動帶入），或 `null`（只會出現在不經表單、直接呼叫 API 時）。
- **聯絡電話 `payload.contactPhone` 一定有值，但不一定是另一支號碼**：本人填寫時等於學員手機 `phone`；代填但沒填（關係是「練健康同仁」時允許）也存學員手機。
  要判斷有沒有留另一支聯絡電話，看 `payload.filledBySelf === false` 且 `contactPhone !== phone`。
- **年齡沒有存**：要用 `payload.birthDate` 對 `createdAt`（台北時間）自己算。
  `birthDate` **可能是不合理的值**：伺服器不檢查範圍，2026-10-19 以前前端也沒有範圍檢查，舊名單有民國年被打成西元年（例如 `0044-…`）、
  iPhone 自動帶入當天日期、Android 停在 `2010-01-01` 直接按確定等情形。算年齡時照 config 的 `derived.age` 規則：
  超出 `1920-01-01`～`2010-01-01` 就當作沒有年齡，生日照原值顯示，不要算出年齡。要判斷是否免費，以 `payload.paymentMethod` 為準。
  （範圍含端點，剛好 `2010-01-01` 的名單擋不掉，也分不出是不是真的生日；年齡只當參考。）
- **`payload.formVariant` 是 string、string[] 或 `null`**：網址重複帶 `?v=` 時前端送的是陣列，伺服器原樣存進去。
  是陣列時，官網只用第一個元素決定變體。Hub 轉存到 Cloud SQL 時要處理陣列（例如存成 JSON，或取第一個元素比對變體，同時保留原值）。
- **同意事項的勾選結果沒有存**。
- 廠商變體（`?v=`）可能在「從哪裡得知」加額外選項（例如「南山健康守護圈」），也會出現在 `payload.sources`。清單在 `context.variants[*].extraSources`。

### 舊名單的不同形狀

表單改過幾次，舊名單的值不會跟著改。以下日期分 lkkdev 與 lkkprod 寫；lkkprod 的時間是正式站分支的 commit 時間，實際部署會再晚一點。
正式站分支是 2026-07-30 約 22:20（`cd44291`）才指向 lkkprod，照現有程式，lkkprod 不會有比這更早的形狀（除非曾從別的專案搬資料進去，未證實）。
各段期間實際有沒有名單沒有查（沒有讀 `leads`），以下都是「若有」。

**lkkdev 的日期要另外看**：dev 站在 2026-07-30 13:52（`268a647`）以前寫的是**舊專案 `lkk-website-dev`**，不是 lkkdev。
lkkdev 裡比這更早的名單（若有）是用整庫複製工具搬過去的（文件 id 與 `createdAt` 都保留原值），
所以下面 lkkdev 的日期指的是「`createdAt` 從何時起的名單才有這個 key／這種值」，不是 lkkdev 開始寫入的時間。
複製過去的名單也可能有更早、2026-07-30 以前 Next.js 舊版網站寫的預約名單（同樣是 `type == 'booking'`），形狀不在本節描述範圍內，
一樣照「缺 key／多 key」的原則處理，對不到的值照原值顯示。

- config 的 `record.payload` 是**現行版本會寫的 key**。較舊的名單可能**缺 key**（缺少與 `null` 同等處理），
  也可能**多出 config 沒列的 key**（忽略，不要報錯）。
- **lkkdev 的名單多為測試資料，不具代表性**。在 lkkdev 驗收「名單都對得上 config」不代表 lkkprod 也對得上，
  上 prod 前要以 lkkprod 的實際資料驗收（由官網維護者提供只取選擇題欄位、不含姓名電話的統計）。

**得知管道（`payload.sources`、`sourceChannel`）**：lkkdev 2026-09-18（`43976fe`）、lkkprod 2026-09-20（`9b09543`）以前是**選填、可複選**，選項是舊的一套：

`練健康官網`、`練健康FB`、`練健康IG`、`練健康YT`、`練健康官方LINE`、`練健康THREADS`、`傳單`、`其他`

- 陣列長度 **0～多個**（選填，可以一個都沒選；廠商變體隱藏整題時也是 `[]`）。`sourceChannel` 是這些值用「, 」串起來，可能是空字串。
- 選「其他」並填說明時存 `其他: <說明>`，放在陣列最後；沒填說明時存 `其他`。這兩種剛好跟現行的「其他」同字，照第 3 節的規則會比到現行選項。
- 其餘舊值都**對不到現行 `options`**（例如舊的 `練健康官網` 不等於現行的 `官網`），照原值顯示；不要把長度大於 1 當成壞資料。
  要做來源統計時，這個日期前後是兩套選項，需要自己決定怎麼歸併。
- lkkdev 在 2026-07-29（`4a8872a`）以前還有更早的一套（`Google 搜尋`、`Facebook`、`Instagram`、`LINE`、`YouTube`、`Podcast`、`朋友推薦`、`路過分店`、`醫療院所轉介`、`其他`），lkkprod 沒有。

**訓練目的（`payload.exerciseGoals`）**：2026-07-31（`67ecebf`）改過名：`慢性病管理` → `慢性病控制`、`體重管理` → `體態管理`。
在那之前的名單可能有 `慢性病管理`、`體重管理`，對不到現行 `options`，照原值顯示。
影響期間：lkkdev 2026-07-21～07-31；lkkprod 只有 2026-07-30 晚間到 07-31 上午（以 commit 時間計約半天），極短。

**偏好時段（`payload.preferredTime`）**：2026-10-27 以前這題叫「方便聯繫時段」，key 與選項值都沒變，但問的是「方便聯繫的時段」，不是「上課時段」。
lkkdev 在 2026-07-29（`4a8872a`）以前的值是另一套寫法（例：`平日白天 (10:00-17:00)`、`假日白天`），lkkprod 沒有。

**`payload` 的 key 是陸續加上的**（在開始寫入的時間以前，名單沒有這個 key）：

| key | lkkdev（以 `createdAt` 計） | lkkprod 開始寫入 |
|---|---|---|
| `exerciseGoals`、`exerciseGoalOther` | 2026-07-21 23:51（`2807a3d`） | 一開始就有 |
| `utm` | 2026-07-30 16:41（`72c1a9d`） | 一開始就有 |
| `formVariant` | 2026-08-10 11:53（`37f3401`） | 2026-08-10 約 16:55（`1360ae4`） |
| `company`、`leadSource` | 2026-08-10 16:47（`4a8e19a`） | 2026-08-10 約 16:55（`1360ae4`） |

另外 2026-08-10 有一段時間多寫了一個 **`sourceTag`**（config 沒列，已移除）：lkkdev 約 11:53～20:25（`37f3401`～`9533360`），lkkprod 約 16:55～20:42（`1360ae4`～`a3686c9`）。
這段期間的名單（若有）會有這個 key，值多半是 `null`。忽略即可。

---

## 6. 注意事項

1. **伺服器只驗證少數欄位**：姓名、手機（`^09\d{8}$`）、分店、時段必填，以及 Email 格式。
   其他欄位（選項是否在清單內、生日範圍、付款方式…）都不檢查。直接呼叫官網 API 可以寫入任意值，
   所以 CRM 處理名單時，**不要假設值一定在選項清單裡**。
2. **隱藏欄位沒有驗證**：`sourcePage`、`payload.company`、`payload.leadSource`、`payload.formVariant`、`payload.utm` 由前端送出、
   伺服器原樣存。不要當成已驗證的資料（詳見 config 的 `hiddenFieldsTrust`）。
3. **舊名單可能有現在已不在清單裡的值**：選項停用或改字後，舊名單的值不會變。具體的舊形狀見第 5 節「舊名單的不同形狀」。
4. **名單沒有記錄當時的 config 版本**。要判斷名單是哪一版表單填的，只能看 `createdAt`。
5. **不要寫入 `formSchemas`**：官網只在 `contentHash` 不一致時才重寫。改了其他欄位（例如 `schemaJson`）卻沒改 `contentHash`，錯的內容會一直留著，CRM 自己也會讀到錯的。
6. **config 的 `submit.sideEffects` 描述的是官網現況，不是規格**（預約表單的 config 沒有 `knownQuirks`），Hub 不要照做。
   例如裡面寫官網伺服器 log 會印出 name、phone、email、line、paymentMethod，那是官網目前的行為；**Hub 的 log 不記個資**（要追查時記名單的文件 id 即可）。
7. **名單含健康資料**：`payload.hasMedicalCondition`（是否有疾病，或 3 年內曾開過刀或住院）與 `payload.medicalConditionNote`（情況說明）。
   另外這兩個欄位也可能有健康資訊，不要當成一般欄位處理：
   - `message`（備註）：題目要求一對二體驗要填「親友姓名、年齡及簡述身體狀況」，頁面 FAQ 也請有慢性病或重大傷病的人寫在備註欄，
     所以常有健康資料，還可能有第三人（親友）的姓名、年齡與身體狀況。
   - `payload.exerciseGoals`（訓練目的）：選項含 `慢性病控制`、`傷後復健`、`減少疼痛`，「其他: …」的自由文字也可能描述身體狀況。

   Hub 只同步營運真正需要的欄位，不需要的不要轉存；上面這些欄位同樣只在營運需要時才同步與顯示。
   名單的用途要跟填表時告知的目的一致：預約表單送出鈕下方寫的是「送出即表示同意我們以電話或 LINE 與你聯繫安排體驗課，個人資料僅用於此目的。」
   （config 的 `consent.implicitConsentText`），官網隱私權政策也寫明只在特定目的範圍內利用。
   要拿名單做超出這個用途的事（例如行銷、會員經營、提供給其他單位）之前，先跟官網方確認。
   另外，頁面上勾選的七條同意事項是課程守則與風險告知，勾選結果也沒有存進名單，不能拿來當作其他用途的同意。

---

## 7. 版本與變更

| 變動 | `contentHash` | `schemaVersion` | CRM 要做什麼 |
|---|---|---|---|
| 改題目文字、提示字、新增或停用選項 | 會變（題目文字、提示字、必填與顯示條件需官網維護者同步更新 JSON 才會變；選項有建置檢查，見第 1 節） | 不變 | 不必改程式；照新 config 顯示即可 |
| 欄位改名、值的存法改變（例如字串改布林） | 會變 | **升版** | 官網會先通知，CRM 調整後再上線 |

建議 CRM 讀取時檢查 `schemaVersion`，遇到沒處理過的版本就告警，不要直接套用。

> `schemaVersion` 要不要升版，是官網維護者**人工判斷**的，沒有程式檢查；上表是目前的約定，不是保證。
> 2026-09-20（含）以前就有過改了 value 或存法、但當時還沒有這份 config 的情形（訓練目的 2026-07-31；得知管道 lkkdev 2026-09-18、lkkprod 2026-09-20；見第 5 節「舊名單的不同形狀」），
> 所以不要只靠 `schemaVersion` 判斷舊名單對不對得上，比不到的值一律照原值顯示（第 3 節）。

---

## 8. 聯絡

config 內容有疑問、或需要新增欄位與選項，請聯繫官網維護者。
