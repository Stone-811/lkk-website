# Hub／CRM 讀取「團體課程報名」表單 config 說明

> 對象：Hub／CRM（同一個 Firebase 專案；前端是 Firebase Hosting 靜態 SPA，後端是 Cloud Run 的 `lkkhubapi`／`lkkcrmapi`）的開發者
> 環境：**lkkdev（測試）**；正式站 lkkprod 上線後路徑相同、只換專案（lkkprod 目前還沒有這份文件，正式站發版後才會出現）
> 更新：2026-11-14

練健康官網 `/group-booking`「團體課程報名」表單的完整定義（欄位、選項、條件、存進名單的位置），
已經放在 Firestore，CRM 直接讀即可。**這份 config 是唯讀的**：由官網自動維護，CRM 不要寫入。

**先看第 0 節「怎麼用」**：照四個步驟就能把一筆名單轉成「題目：答案」顯示出來。
第 1 節以後是參考資料（文件在哪、欄位意思、config 結構、名單的存值細節與舊名單、權限、版本規則），遇到時再查。
官網這邊怎麼確保 config 正確，放在文末附錄「官網這邊怎麼確保 config 正確」，串接用不到。

> 同時串預約表單（`formSchemas/booking`）的話，請先看文末附錄「跟預約表單不一樣的地方」。
> 兩張表單很多欄位意思相同、但 key、型別或存法不同，不能共用同一段寫死欄位的解析程式（第 0 節那種完全照 config 解讀的程式可以共用）。

---

## 0. 怎麼用（Hub 串接步驟）

Hub 要做的事只有一件：**拿到一筆名單時，用 config 把它轉成「題目：答案」顯示出來**。照下面四步做就好，後面各節是細節，遇到時再查。
下面的程式完全照 config 解讀、不寫死任何欄位，所以三張表單（預約體驗、團體課程報名、合作洽詢）共用同一段；跟這張表單有關的地方寫在步驟三後面。

### 步驟一：用名單的 `type` 找 config

```js
// Hub 伺服器端（Cloud Run），firebase-admin；瀏覽器讀不到（見第 2 節「權限」）
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore()

// 查不到 leadType 時的退路（正式站還沒發版、或官網退回舊版時會用到）
const FORM_ID_BY_TYPE = { booking: 'booking', group_class: 'group-booking', cooperation: 'cooperation' }
const cache = new Map() // formId → { contentHash, schema }

async function getConfig(leadType) {
  const col = db.collection('formSchemas')
  let snap = (await col.where('leadType', '==', leadType).limit(1).get()).docs[0]
  if (!snap && FORM_ID_BY_TYPE[leadType]) {
    const d = await col.doc(FORM_ID_BY_TYPE[leadType]).get()
    if (d.exists) snap = d
  }
  if (!snap) return null // 沒有 config（例如舊的 franchise 名單）：每個欄位照原值顯示
  // 內容沒變就沿用上次解析好的；有變才重新 JSON.parse
  const hit = cache.get(snap.id)
  if (hit && hit.contentHash === snap.get('contentHash')) return hit.schema
  const schema = JSON.parse(snap.get('schemaJson'))
  cache.set(snap.id, { contentHash: snap.get('contentHash'), schema })
  return schema
}
```

- **每次用之前都讀一次文件**（上面就是這樣做）。不要把 config 存一份就一直用：官網改了選項，Hub 會不知道。
- 文件有 `retiredOn` 代表這張表單已下架，但舊名單照樣用它解讀。
- `getConfig` 回傳 `null` 有兩種情況：`franchise`（刻意沒有 config），以及文件還沒寫入（例如 lkkprod 正式站還沒發版）。後者要告警，不要當成正常、默默照原值顯示（見第 2 節「權限」）。

### 步驟二：把名單的值轉成畫面上的字

```js
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)

// 名單裡存的一個值 → 畫面上的字
function labelOf(field, value) {
  // 1. 布林題：用 store.map 反查（true → 本人填寫）
  if (field.store?.map) {
    const hit = Object.entries(field.store.map).find(([, v]) => v === value)
    if (hit) return hit[0]
  }
  // 2. 現行選項＋已停用選項
  const opts = [...(field.options ?? []), ...(field.retiredOptions ?? [])]
  const find = (v) => opts.find((o) => o.value === v)
  const exact = find(value)
  if (exact) return exact.label ?? exact.value
  // 3. 「主選項: 細項」（例：社群: IG、其他: 朋友介紹）
  if (typeof value === 'string') {
    const i = value.indexOf(': ')
    const main = i > 0 ? find(value.slice(0, i)) : null
    if (main) return `${main.label ?? main.value}：${value.slice(i + 2)}`
  }
  // 4. 都對不到（舊選項、廠商變體加的值…）：照原值顯示，不要丟掉
  return value
}
```

### 步驟三：逐題列出來

```js
// lead = 名單文件的內容（doc.data()）；storeName = 分店 id → 店名（見第 4 節）
function toRows(schema, lead, storeName) {
  const rows = []
  for (const sec of schema.sections) {
    for (const f of sec.fields) {
      const path = f.store?.path // 這題存在名單的哪裡，例：'payload.gender'
      if (!path) continue
      const raw = get(lead, path)
      if (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) continue
      let text
      if (f.optionsSource) text = storeName(raw) // 選項在 stores 集合的題目（分店）
      else if (Array.isArray(raw)) text = raw.map((v) => labelOf(f, v)).join('、')
      else text = labelOf(f, raw)
      rows.push({ section: sec.title ?? '', question: f.label, value: String(text) })
    }
  }
  return rows
}
```

`schema.sections` 的順序就是表單畫面上的順序，照著列就跟填表人看到的一樣。

**這張表單要注意的地方**：

- 分店（`store`）是寫死在 config 裡的四個固定選項，存的是「店名｜地址」整串，照一般選項處理即可，不會用到 `storeName`（傳 `(v) => v` 即可）；只要店名就讀 `payload.storeName`（第 5 節）。
- 這張表單沒有布林題（`isFillerSelf` 存的是 `是`／`否` 字串，照一般選項處理），`labelOf` 的第 1 步不會命中；得知管道的組合值（`社群: IG`）走第 3 步。

例：一筆代填的團課名單（假資料），轉出來的其中幾列：

```
{ section: '第一部分：基本資料', question: '是否為你本人親自填寫？', value: '否，我是幫他人代填' }
{ section: '', question: '與學員的關係', value: '子女' }   // 代填那一段沒有標題（title 是 null）
{ section: '第二部分：課程資訊', question: '想去哪一間分店上課？', value: '松江店｜台北市中山區松江路122號B1' }
{ section: '第三部分：其他調查', question: '你是從哪裡得知練健康團體課程資訊的呢？', value: '社群：IG' }
```

### 步驟四：遇到這些情況

| 情況 | 怎麼做 |
|---|---|
| 值對不到任何選項 | 照原值顯示。多半是舊名單用的舊選項（第 5 節「舊名單的不同形狀」） |
| `schemaVersion` 是沒處理過的版本 | 告警，先不要自動套用（第 7 節） |
| config 裡沒有、名單裡卻有的欄位 | 名單可能比 config 舊或新，照原值顯示、不要丟掉 |
| 想顯示隱藏欄位（來源頁、UTM 等） | 見第 3 節 `hiddenFields`（這張表單有 `sourcePage`、`formVariant`、`company`、`leadSource`、`utm`），位置一樣在 `store.path`；名單裡的樣子見第 5 節（`formVariant` 可能是陣列） |

> 上面步驟一到三的程式碼已經拿官網的三份 config 與假資料實際跑過，例子裡的輸出就是實際跑出來的結果。

---

## 1. 在哪裡

| 項目 | 值 |
|---|---|
| Firebase 專案 | `lkkdev`（正式站：`lkkprod`） |
| 資料庫 | `(default)` |
| 文件路徑 | `formSchemas/group-booking` |
| 其他表單 | `formSchemas/booking`（預約體驗）、`formSchemas/cooperation`（合作洽詢），結構相同 |

### 名單 type 對 config 文件 id

| 名單 `type` | config 文件 |
|---|---|
| `booking` | `formSchemas/booking` |
| `group_class` | `formSchemas/group-booking` |
| `cooperation` | `formSchemas/cooperation` |
| `franchise`（舊加盟表單，2026-10-16 已下架） | **沒有 config**。Hub 略過，或照原值顯示 |

> 團課的 `type` 是底線（`group_class`），文件 id 是連字號（`group-booking`），**不能拿 `lead.type` 直接組路徑**。
> 2026-11-14 起，config 文件頂層有 **`leadType`**（這張表單寫進名單的 `type`，本表單是 `group_class`），可以用
> `db.collection('formSchemas').where('leadType', '==', lead.type)` 找到名單的 config。
> 建置檢查保證所有 config（**含已下架的**）的 `leadType` 都不重複，所以最多只會查到一份；下架的表單也查得到（見下方「下架的表單」）。
> **上面這張表還是要留在 Hub 程式裡當退路**：用 `leadType` 查不到（0 筆）時，改用這張表找文件 id 再讀一次，不要直接當成沒有 config。會查不到的情況：
> - lkkprod 目前還沒有任何 `formSchemas` 文件（正式站還沒發版），正式站發版時 `leadType` 會一起出現。
> - 官網如果退回 `leadType` 出現以前的版本（dev 的 `a6cf8c0` 或更早），舊版會把文件整份重寫成沒有 `leadType` 的樣子，直到下一次發新版才補回來。
>
> 表上也沒有（`franchise`）才是真的沒有 config，照原值顯示。`franchise` 是刻意沒有 config 的名單 `type`（列在建置檢查的「沒有 config」清單）。
> 另外，送出 API 是 `/api/leads/group-class`（連字號、`class`），又是第三種寫法。
>
> Hub 可以依賴的是：官網現在會寫進 `leads` 的每一種 `type` 都有 config（`franchise` 已不再寫入），每個送出端點也只寫自己那張表單的 `leadType`；2026-11-14 起由官網建置檢查擋住，之後新增的表單不會沒有 config 就上線。檢查細節見文末附錄「官網這邊怎麼確保 config 正確」。

### 文件欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `formId` | string | `group-booking` |
| `leadType` | string | `group_class`：這張表單寫進名單（`leads`）的 `type`。從 config 頂層的 `leadType` 抄過來（`schemaJson` 裡也有） |
| `schemaVersion` | string | 目前 `1.0`。**只有不相容的改動才升版**（欄位改名或刪除、存放位置或值的存法改變）。記錄過的選項值與代號升版也不會從 config 消失（停用的在 `retiredOptions` 這類停用清單）。Hub 要怎麼處理見第 7 節，Hub 可以依賴什麼見第 3 節「選項的 value 與 label」 |
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
  三張表單的 `contentHash` 因此各變了一次（lkkdev 2026-11-14 已寫入；正式站發版時也會變一次）；題目與選項內容沒有變。

> config 是官網維護者手寫的描述檔（`docs/form-schema/group-booking.json`），不是從頁面自動產生的。
> 選項（value、label、順序、課程價目）、得知管道第二層的提示字與預設選項、網址變體的設定值由建置檢查保證跟官網程式一致；
> 2026-11-14 起建置檢查也會跟上一版的記錄比對，記錄過的值與代號不能消失或改字（見第 3 節「選項的 value 與 label」，檢查細節見文末附錄「官網這邊怎麼確保 config 正確」）。
> 題目文字、提示字、必填與顯示條件是人工維護，少數情況可能比線上畫面慢一步。
> `store.path` 跟送出端點（`server/api/leads/*.post.ts`）實際的存法是否一致，也是人工維護，檢查比對不到。

> 官網剛發版的幾分鐘內，新舊版本會短暫同時在跑，文件（連同 `revision`）可能「新 → 舊 → 新」來回一兩次，
> 最後停在新版：舊版不再接到請求後，新版下一次再比對時會寫回新版，流量少時這一步會更晚。
> 用 `onSnapshot` 監聽的話，不要假設 `contentHash` 一變就是最終版本，也不要假設它只會往前。

---

## 2. 讀取範例

第 0 節步驟一的 `getConfig` 就是可以直接用的寫法（三張表單共用）。下面是只讀這一份文件的最小範例，以及快取、轉存與權限的細節。

### Node.js（firebase-admin）

```js
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'lkkdev' })
const db = getFirestore()

// 每次要用 config 前讀一次：contentHash 跟上次一樣就沿用已解析的 config，有變才重新 JSON.parse
let cached = null // { contentHash, schema }
async function getGroupBookingSchema() {
  const snap = await db.doc('formSchemas/group-booking').get()
  if (!snap.exists) {
    // 文件不存在（例：lkkprod 正式站還沒發版）→ 告警，沿用上次的 config，不要往下解析
    console.warn('formSchemas/group-booking 不存在')
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
db.doc('formSchemas/group-booking').onSnapshot((s) => {
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
doc = db.document("formSchemas/group-booking").get()
if not doc.exists:
    # 文件不存在（例：lkkprod 正式站還沒發版）→ 告警，沿用上次的 config，不要往下解析
    logging.warning("formSchemas/group-booking 不存在")
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
| `formId`、`leadType`、`schemaVersion` | 同上 |
| `retiredOn` | 只有下架的表單才有，同上（目前沒有） |
| `describes` | 一句話說明（裡面的撰寫日期與「dev 與正式站相同」等字樣是寫描述檔當時的狀況，不會自動更新，不要拿來判斷版本或環境） |
| `conventions` | **閱讀規則**：條件怎麼寫、`required`／`showIf` 的意思、選項 value 與 label 的差別，以及這張表單才有的 `normalize`、`alsoWrites` 等寫法。先讀這段 |
| `submit` | 送出 API、伺服器驗證規則（`serverValidation`）、寄信（`sideEffects`）、成功／失敗畫面 |
| `context` | 網址參數 `?v=`（團課變體）、`?src=`（名單來源）會怎麼改變表單與存值。**沒有 `?co=`**。現行變體在 `context.variants`；停用的變體代號移到 `context.retiredVariants`（目前沒有這個 key） |
| `derived` | 頁面算出來、但**沒存**的值（鎖定的分店／課程、是不是舉重團班、聯絡電話是否選填） |
| `pageCopy` | 頁面標題、價格說明等展示文字，不影響欄位 |
| `sections` | 表單分四段，每段有 `fields`（欄位定義，見下表） |
| `consent` | 這張表單**沒有**同意事項勾選框，只有送出鈕下方一句隱含同意文字；沒有任何同意紀錄存進名單 |
| `hiddenFields` | 使用者看不到、但會存進名單的值（來源頁、變體、合作公司、名單來源、UTM） |
| `requestBody` | 前端實際送給 API 的 key 清單 |
| `record` | **名單（`leads` 集合）的欄位清單**：哪些在頂層、哪些在 `payload`、哪些沒存 |
| `hiddenFieldsTrust` | 哪些值沒有經過伺服器驗證（重要，見第 6 節） |
| `knownQuirks` | 已知的怪行為清單（例如年齡區間邊界重疊） |
| `differencesFromBooking` | 跟預約表單逐項比較（文末附錄是整理版） |

### 條件寫法（`conventions.condition`）

```json
{ "field": "isFillerSelf", "op": "eq", "value": "否" }
```

- `op`：`eq`、`neq`、`in`、`notIn`、`includes`（多選含某值）、`truthy`、`falsy`、`gte`
- `field` 開頭是 `$variant.` → 讀網址變體設定；`$derived.` → 衍生值；`$state.` → 畫面狀態
- 組合：`{ "all": [...] }`、`{ "any": [...] }`

### 欄位一覽（`sections[].fields[]`）

| key | 題目 | 類型 | 必填 | 存在名單的位置 | 存的型別 |
|---|---|---|---|---|---|
| `name` | 學員姓名 | text | 必填 | `name` | string |
| `gender` | 學員性別 | radio | 必填 | `payload.gender` | string |
| `ageRange` | 學員年齡區間 | radio | 必填 | `payload.ageRange` | string |
| `phone` | 手機號碼 | tel | 必填 | `phone` | string（**刪掉空白與橫線後的值**） |
| `email` | 電子郵件 | email | **必填** | `email` | string |
| `isFillerSelf` | 是否為你本人親自填寫？ | radio | 必填 | `payload.isFillerSelf` | **string（`是`／`否`，不是布林）** |
| `relationship` | 與學員的關係 | select | 代填時必填 | `payload.relationship` | string／null |
| `fillerName` | 報名者姓名 | text | 代填時必填 | `payload.fillerName` | string／null |
| `contactPhone` | 方便聯繫的電話 | tel | 代填時必填（關係是「練健康同仁」時選填） | `payload.contactPhone` | string（刪掉空白與橫線）／null |
| `course` | 想報名的課程 | radio | 必填 | `payload.course` | string |
| `store` | 想去哪一間分店上課？ | select | 必填 | `payload.store`＋`payload.storeName`（頂層 `storeId` 永遠 `null`） | string（「店名｜地址」整串） |
| `preferredTime` | 偏好的上課星期／時段 | text | 選填 | `payload.preferredTime` | **string／null（自由文字）** |
| `experience` | 過去是否有重訓經驗？ | radio | 選填 | `payload.experience` | string／null |
| `medicalHistory` | 是否有任何疾病、舊傷或開刀史？ | textarea | 必填 | `payload.medicalHistory` | string（自由文字，健康的人填「無」） |
| `source` | 你是從哪裡得知練健康團體課程資訊的呢？ | radio | 必填（變體可隱藏） | `payload.source`（**單數**） | string[]（現行表單送出時長度 1；變體隱藏時是 `[]`；**舊名單可能 0～多個**，見第 5 節） |
| `note` | 備註與其他想補充說明的細節 | textarea | 選填 | `message`＋`payload.note`（同值兩份） | string／null |

`relationship`、`fillerName`、`contactPhone` 三題在第二段（`id: "filler"`），只在 `isFillerSelf` 是 `否` 時出現。

每個欄位的完整定義（選項、錯誤訊息、顯示條件、隱藏時存什麼）在 config 裡的 `field.options`、`field.showIf`、`field.store`。

### 讀題目與選項：用哪些 key

> 用詞：下文 `store.xxx`（例：`store.path`、`store.alsoWrites`）指**欄位底下的 `store` 物件**（存放位置）；
> 指欄位本身時寫「key 為 `store` 的欄位」（分店那一題）。兩者容易混淆：分店選項在 key 為 `store` 的欄位的 `options`，
> 不是 `field.store.options`（不存在）。

config 裡還有提示字、錯誤訊息、`errorRules`、`lockedBy`、`differsFromBooking` 等給官網畫面或內部說明用的 key，串接題目用不到，略過即可。
要讀的只有下面這些。

**位置**：`schema.sections[]`（段落，`title` 是段落標題）→ `section.fields[]`（每一題）。

> 第二段（代填的三題）**`title` 是 `null`**：畫面上它是第一部分裡的一個虛線框，沒有標題。顯示段落標題前要先判斷。

**每一題**

| 要讀什麼 | key | 說明 |
|---|---|---|
| 欄位代號 | `key` | 不一定等於名單裡的欄位名（例：`note` 存在頂層 `message`），名單位置看下一列 |
| 名單裡的位置 | `store.path` | 頂層欄位直接是名稱（`name`），其他是 `payload.<名稱>` |
| 另外寫到的位置 | `store.alsoWrites` | 只有 `store`、`note` 兩題。**形狀不一樣**：`store` 是陣列（`payload.storeName`、頂層 `storeId`），`note` 是單一物件（`payload.note`）。讀的時候先判斷是不是陣列 |
| 題目 | `label` | 例：`學員年齡區間`、`想報名的課程` |
| 題目補充 | `labelSuffix` | 選填，例：`（選填）`、`（單選）`；要顯示完整題目就接在 `label` 後面 |
| 選填時的補充 | `labelSuffixWhenOptional` | 只有 `contactPhone`：關係是「練健康同仁」時題目後面加 `（選填）` |
| 存的型別 | `store.valueType` | 沒寫就是字串；`isFillerSelf`、`preferredTime`、`medicalHistory` 明寫 `string`，`source` 是 `string[]` |
| 會不會被正規化 | `store.normalized` | 只有 `phone`、`contactPhone`：存的是刪掉空白與半形橫線後的值 |
| 什麼時候才出現 | `showIf` | 條件不成立時這題不出現，名單裡存 `store.whenHidden` 的值（代填三題是 `null`，`source` 是 `[]`） |

**這張表單沒有布林欄位**，所以沒有 `store.map`（預約表單的 `filledBySelf`、`hasMedicalCondition` 才有）。

**選項**：只有兩種來源，沒有這兩種 key 的題目是自由輸入（姓名、電話、Email、時段、健康狀況、備註）。

| 來源 | key | 用在哪些題 | 怎麼讀 |
|---|---|---|---|
| 固定選項 | `options[]` | 性別、年齡區間、本人填寫、關係、課程、分店、重訓經驗、得知管道 | `value` 是名單裡存的字；`label` 是畫面上的字，**沒寫就等於 `value`**；`showIf` 是這個選項的出現條件 |
| 已停用的選項 | `retiredOptions[]` | 有選項的題目都可能有（目前沒有任何一題有這個 key） | 2026-11-14 起停用的選項從 `options` 移到這裡，形狀同 `options`（`value`、選填的 `label`），另可有 `retiredOn`（停用日）、`note`。畫面上不再出現，**只用來解讀舊名單的值**，不要列進可選清單 |
| 第二層 | `options[].detail` | 只有得知管道 `source` | `detail.type` 是 `select` 時，選項來自 `detail.optionsSource`（第 4 節），讀不到用 `detail.defaultOptions`；是 `text` 時是自由輸入 |

這張表單**沒有欄位層級的 `optionsSource`**：分店是寫死在頁面上的四個選項，不讀 `stores` 集合（預約表單的分店才讀 `stores`）。

另外幾個跟選項有關的 key：

- `options[].price`（只有 key 為 `course` 的欄位）：課程價目，例：`$2,400`。**只顯示、不存進名單**。
- `options[].showIf`（只有課程的「練健康舉重團班」）：網址變體把分店鎖在南京店以外時，這個選項不出現。目前沒有任何變體設定鎖定分店，所以三個課程都會出現。
- `optionRules`（字串陣列，文字說明、不是條件物件）：出現在兩題，內容不同。
  - key 為 `store` 的欄位（**不是** `course`）：課程與分店的連動——選了舉重團班時分店下拉只剩南京店，並自動改成南京店；之後換回其他課程，分店仍是南京店不會還原。這條規則**沒有寫在分店選項的 `showIf` 裡**，只靠讀 `options[].showIf` 看不出來。
  - key 為 `source` 的欄位：得知管道細項的規則（細項下拉沒有選項時整個主選項隱藏、換主選項時清空細項、選項的快取時間）。
- `store.possibleValues`：名單裡可能出現的所有值（兩張表單都是這個意思，包含 `options` 裡的值）。這張表單只有 `isFillerSelf` 有，值是 `是`、`否`，跟 `options` 相同；預約表單的 `paymentMethod` 除了 options 的兩個值，還多了 `活動免費` 與 `null`。
- 沒有 `other`：這張表單沒有「選其他再填說明」的複選題；得知管道的「其他」走 `detail`（見下）。

**讀取範例（Node.js）**：列出每一題的題目、名單位置與選項

```js
const fields = schema.sections.flatMap((s) => s.fields)

for (const f of fields) {
  const question = f.label + (f.labelSuffix ?? '')       // 題目
  const path = f.store?.path                             // 名單位置，例：'payload.ageRange'
  const also = [].concat(f.store?.alsoWrites ?? [])      // 物件或陣列都攤成陣列
    .map((a) => a.path)                                  // 例：['payload.storeName', 'storeId']
  const options = (f.options ?? []).map((o) => ({
    value: o.value,                                      // 名單裡存的字
    label: o.label ?? o.value,                           // 畫面上的字
    price: o.price,                                      // 只有課程有，不存
  }))
  // o.detail → 得知管道的第二層
  const retired = (f.retiredOptions ?? []).map((o) => ({ // 已停用：只拿來解讀舊名單，不列進可選清單
    value: o.value,
    label: o.label ?? o.value,
  }))
  // value → label 對照：現行選項優先，再查已停用的
  const labelOf = new Map([...retired, ...options].map((o) => [o.value, o.label]))
}
```

**把名單的值轉回畫面上的字**

1. 先拿整個值去比 `options[].value`，比不到再比同一題的 `retiredOptions[].value`（已停用的選項），比到就用那個選項的 `label ?? value`。
   要特別換字的只有兩題：`isFillerSelf` 的 `是` → `是，我是本人`、`否` → `否，我是幫他人代填`；
   `experience` 的 `有規律訓練習慣` → `規律訓練中`。其他選項的 value 就是畫面上的字。
2. 得知管道 `payload.source` 是陣列，逐個元素處理。整個值在 `options`、`retiredOptions` 都比不到時，用**第一個「: 」（冒號＋半形空格）**切開，前半段同樣依序比 `options[].value`、`retiredOptions[].value`，例：`社群: IG` → 主選項 `社群`、細項 `IG`；`其他: 朋友介紹` 同理。
3. 分店 `payload.store` 是「店名｜地址」整串（全形「｜」），直接比得到 `options[].value`；只要店名就讀 `payload.storeName`。
4. 比對要**完全相同**，不要先正規化：年齡區間 `50–65歲` 中間是 en dash（U+2013），不是半形 `-`。
5. 還是比不到（2026-11-14 以前就消失的舊選項、直接呼叫 API 寫入的值）：直接顯示原值，不要丟掉。

### 選項的 value 與 label

- `value` 是**存進名單的字**，`label` 是畫面上的字；兩者相同時只寫 `value`。
- **Hub 可以依賴的保證**（2026-11-14 起由官網建置檢查強制）：
  - 記錄過的值（選項值、`store.possibleValues`）與網址變體代號**不會從 config 消失或改字，升 `schemaVersion` 也一樣**。
    停用的選項會移到同一題的 `retiredOptions`，下架的變體移到 `context.retiredVariants`；改字＝停用舊的＋新增新的。同一個值不會同時出現在現行與停用清單。
  - 題目或隱藏欄位刪除或改 `key`、`store.path` 或存的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變，**一定會升 `schemaVersion`**（第 7 節）。
  - 例外：題目整題被升版刪除後，config 裡就沒有這一題了，舊名單的這個值照原值顯示。
  - 題目文字、選項的 `label`、提示字、顯示與必填條件、得知管道第二層的細項、課程價目**不在這道保護內**，可能隨時改、不升版，所以 Hub 轉存時要存原始值（見第 2 節「快取與轉存」）。

  檢查怎麼做、記錄了哪些東西、擋不到什麼，見文末附錄「官網這邊怎麼確保 config 正確」。
- 2026-11-14 以前沒有這個檢查，改過：分店、與學員的關係、性別在 2026-08-24，得知管道在 2026-09-20，值與存法都變過，見第 5 節「舊名單的不同形狀」。
  這些舊值**不在** `retiredOptions` 裡。
- **停用的選項**：2026-11-14 起會從 `options` 移到同一題的 `retiredOptions`，不再從 config 消失；在那之前停用的已經直接消失了，
  所以舊名單的值仍可能在 config 裡對不到，照原值顯示。

---

## 4. 不在 config 裡、要另外讀的動態選項

只有一組：「從哪裡得知」的第二層（社群平台、實體活動），由業主在後台隨時調整，config 只寫「去哪裡讀」，不複製內容。
這份設定跟預約表單**共用**，兩張表單看到的選項相同。

讀 `settings/referralOptions` 文件的 `social`、`event` 欄位，形狀是 `[{ label: string, active?: boolean }]`：

- 取 `label` 去掉前後空白後非空、且 `active !== false` 的項目
- **欄位不存在**（或不是陣列、文件不存在）→ 用 config 裡的 `defaultOptions`
- **欄位存在但全部停用** → 空陣列，官網會把「社群」或「實體活動」整個主選項隱藏

規則寫在 config 裡 key 為 `source` 的欄位的 `options[].detail.optionsSource`，預設值在同一層的 `options[].detail.defaultOptions`。

分店**不用**另外讀：選項就是 key 為 `store` 的欄位的 `options`，
即 `schema.sections.flatMap(s => s.fields).find(f => f.key === 'store').options`——四個**物件**，值在 `value`（不是四個字串，比對時要取 `.value`）。

### 選配：把代碼轉成中文

下面兩組對照不在 config 裡，要不要做由 Hub 決定；不做就顯示原始代碼，跟官網後台現況一樣。

- **UTM 活動名稱**：`payload.utm.campaign` 可以用 `campaigns` 集合的 `utmCampaign` 欄位對到活動名稱 `name`。
  後台可以改活動代號、也可以刪除活動，所以舊名單可能對不到，對不到就顯示原始代號。官網後台的名單頁自己也只顯示代號。
  後台存的代號一律是小寫；名單裡的值是網址上的原字（只去掉前後空白、不轉小寫），比對前可以先轉小寫。
- **名單狀態 `status` 的中文**：`new` 新名單、`contacted` 已聯繫、`scheduled` 已預約、`completed` 已完成、`cancelled` 已取消。
  以官網 `composables/useLeadStatus.ts` 為準；config 裡只有英文代碼。

---

## 5. 對照名單（`leads` 集合）

團體課程報名的名單在 `leads`，`type == 'group_class'`。欄位位置以 config 的 `record` 為準，常用的：

| 位置 | 內容 |
|---|---|
| 頂層 `type` | `group_class` |
| 頂層 `status` | `new`／`contacted`／`scheduled`／`completed`／`cancelled`（後台可改；中文見第 4 節「選配」） |
| 頂層 `internalNote` | 後台內部備註，建立時 `null`（後台可改） |
| 頂層 `name`、`phone`、`email` | 見欄位一覽；`phone` 是刪掉空白與橫線後的值 |
| 頂層 `message` | 備註 `note` 的原值或 `null`（`payload.note` 是同一個值） |
| 頂層 `storeId` | **永遠 `null`**（分店在 `payload.store`、`payload.storeName`） |
| 頂層 `sourceChannel` | **永遠 `null`**（得知管道只在 `payload.source`） |
| 頂層 `sourcePage` | 通常是 `/group-booking` |
| 頂層 `createdAt`、`updatedAt` | Firestore Timestamp |
| `payload.*` | 其餘欄位，見欄位一覽與 `record.payload` |
| `payload.formVariant`、`payload.company`、`payload.leadSource`、`payload.utm` | 隱藏欄位（團課變體、合作公司、名單來源、UTM） |

後台只能改 `status`、`internalNote`，每次修改會同時把 `updatedAt` 更新成修改時間（可用來做增量同步）；其他欄位寫入後不會變。
名單可能被官網方直接從資料庫刪除（例如清掉測試名單；官網沒有刪除名單的 API，刪除也不留紀錄），刪除不會更新任何欄位。
用 `updatedAt` 增量同步時，要定期全量比對 id，把 Firestore 已經不存在的名單從 Hub 刪掉或標記（名單含個資與健康資料，不要一直留著）。
後台不檢查 `internalNote` 的型別，讀的時候不要假設一定是字串。

### 存值的細節

- **得知管道**有第二層時存成「主選項: 細項」，冒號後一個半形空格，例如 `社群: IG`、`其他: 朋友介紹`。現行表單是單選，但存成長度 1 的陣列；變體把整題隱藏時存 `[]`（目前沒有變體會隱藏）。舊名單可能有 `[]`：2026-09-20 以前得知管道是選填、沒勾，或亞培／南山變體隱藏了這題（見下方「舊名單的不同形狀」與第 6 節第 4 點）；`[]` 不代表一定來自變體。讀的時候不要直接取 `source[0]`，一律當任意長度的陣列處理。
- **本人／代填**存的是字串 `是`、`否`。只有 `否` 代表代填；直接呼叫 API 可以存其他字串。
- **代填三題**（`relationship`、`fillerName`、`contactPhone`）：`isFillerSelf` 不是 `否` 時一律存 `null`，就算使用者先填過再切回本人。
- **聯絡電話 `payload.contactPhone`**：本人填寫時是 `null`；代填但沒填（關係是「練健康同仁」時允許）也是 `null`。有值就是填表者在這一題另外填的號碼（不會自動補學員手機，但填表者可能填了跟學員手機一樣的號碼）。直接呼叫 API 時，非同仁代填也可能是 `null`（見第 6 節）。
- **分店**：`payload.store` 是「店名｜地址」整串，`payload.storeName` 是「｜」前面的店名（例：`南京店`）。
  要跟預約表單的分店（`stores` 文件 id）對應，只能用店名比對。
  團課存的是 config 裡**寫死的字串**，業主在後台把 `stores` 的分店改名（或停用、刪除）時，團課名單與 config 都不會跟著變；
  但預約名單只存 `storeId`，查出來的店名會變成新名字。所以跨表單比對分店時，要自己維護一份店名對照，不能假設兩邊的店名永遠相同。
- **偏好時段 `payload.preferredTime`** 是自由文字或 `null`，不是陣列。
- **重訓經驗**存 value：畫面「規律訓練中」存成 `有規律訓練習慣`。選填，沒選是 `null`。
- **健康狀況 `payload.medicalHistory`** 是一題必填的自由文字，沒有「有／無」的布林可以篩。
- **課程價目沒有存**，只出現在確認信；要價目讀 config 的 `course.options[].price`（那是現在的價格，不是報名當時的）。
- **年齡只有區間**（`50歲以下`／`50–65歲`／`65歲以上`），沒有生日；50 歲與 65 歲各落在兩個區間，由填表者自己選。
- **`payload.formVariant`** 是網址 `?v=` 的原字；網址重複帶 `v` 時會是陣列。查不到的代號也照存。
  解讀代號時先查 `context.variants`，再查 `context.retiredVariants`（2026-11-14 起停用的變體會移到這裡；目前沒有）；
  兩邊都查不到就照原字顯示（2026-09-11 刪除的 `abbott`、`nanshan` 不在 `retiredVariants` 裡，見第 6 節第 4 點）。
- **`payload.company` 目前永遠是 `null`**：現在只有 `default` 變體，沒有任何變體設定合作公司。
- **同意事項**：這張表單沒有勾選框，也沒有存任何同意紀錄。

### 舊名單的不同形狀

表單改過幾次，舊名單的值不會跟著改。先記住兩個通則：

- config 的 `record.payload` 是**現行版本會寫的 key**。較舊的名單可能**缺 key**（缺少與 `null` 同等處理），
  也可能**多出 config 沒列的 key**（忽略，不要報錯）。
- **lkkdev 的名單多為測試資料，不具代表性**。在 lkkdev 驗收「名單都對得上 config」不代表 lkkprod 也對得上，
  上 prod 前要以 lkkprod 的實際資料驗收（由官網維護者提供只取選擇題欄位、不含姓名電話的統計）。

已知的舊形狀如下。日期是正式站（lkkprod）的上線日；dev 站通常早一兩天。

- **2026-09-20 以前的得知管道**：當時是**選填複選**，`payload.source` 可能是 `[]` 或多個元素，
  值是舊選項（`Facebook 臉書粉專`、`Instagram 視覺社群`、`YouTube 影片頻道`、`親朋好友推薦分享`、`上過體驗課／一對一課程`、`門店路過看到`），
  不在現在的 `options` 裡，也沒有「主選項: 細項」格式。一律把 `source` 當任意長度陣列處理，比不到就顯示原值；
  不要把長度大於 1 當成壞資料。
- **2026-08-19 ～ 2026-08-24 的名單**（團課報名最早上線的版本）：
  - `payload` **沒有 `contactPhone` 這個 key**（不是 `null`，是不存在）。讀取時「key 不存在」與 `null` 同等處理。
  - `relationship` 是**自由文字**（例：`女兒`、`朋友`），不在現在的選項裡。
  - `gender` 可能是 `其他`。
  - `payload.store` 可能是 `新店七張店｜…`（`storeName` 是 `新店七張店`，跟現在的 `七張店` 比不到），
    或沒有「｜」的 `不確定，請教練為我推薦`（`storeName` 是整句）。用店名對應分店時，要另外把 `新店七張店` 對到七張店；
    `不確定，請教練為我推薦` 對不到任何分店。
- **lkkdev 可能還有更早的測試名單**（2026-08-18 那版，只在 dev 跑了約 10 小時）：結構完全不同——頂層 `storeId` 有值，`payload` 只有 `desiredClass`、`age`、`utm`，
  沒有 `course`、`store`、`ageRange` 等欄位。2026-08-19 約 00:44～13:13（commit 時間）那版的 `payload` 則沒有 `formVariant`、`company`、`leadSource` 三個 key。
  這兩種形狀正式站都沒有（正式站第一版就已經有這三個 key，只缺 `contactPhone`，見上一點）；lkkdev 實際有沒有這兩段期間的名單未證實。

---

## 6. 注意事項

1. **伺服器只驗證少數規則**：`name`、`gender`、`ageRange`、`phone`、`email`、`isFillerSelf`、`course`、`store`、`medicalHistory` 有值（用原值判斷，只打空白會通過）；
   手機刪掉空白與橫線後符合 `^09\d{8}$`；Email 格式；以及 `isFillerSelf` 是 `否` 時，關係、報名者姓名要有值，電話要有值（關係是「練健康同仁」除外）。
   其他都不檢查：選項是否在清單內、舉重團班只限南京店、得知管道必填、聯絡電話格式、型別、長度。
   直接呼叫官網 API 可以寫入任意值，所以 CRM 處理名單時，**不要假設值一定在選項清單裡、也不要假設型別一定對**。
2. **聯絡電話的必填檢查用原值**：只打空白或橫線會通過伺服器，但存成 `null`。所以經 API 直接送入的名單，就算不是同仁代填，`payload.contactPhone` 也可能是 `null`。
3. **隱藏欄位沒有驗證**：`sourcePage`、`payload.company`、`payload.leadSource`、`payload.formVariant`、`payload.utm` 由前端送出、
   伺服器原樣存。不要當成已驗證的資料（詳見 config 的 `hiddenFieldsTrust`）。
4. **舊名單可能有現在已不在清單裡的值**：選項停用後，舊名單的值不會變（2026-11-14 起停用的會留在 `retiredOptions`／`context.retiredVariants`，在那之前的沒有）。例如亞培（`?v=abbott`）、南山（`?v=nanshan`）兩個團課變體 2026-09-11 已刪除。在那之前從這兩個變體送出的名單（若有）會帶 `payload.company`（`亞培`／`南山`），`payload.leadSource` 通常是 `LINE`／`網站`，但網址帶 `?src=` 時是那個值（`?src=` 優先）；而且得知管道被隱藏，`payload.source` 是 `[]`。
   2026-09-11 之後用舊連結（`?v=abbott`／`?v=nanshan`）送出的名單，`payload.formVariant` 仍是 `abbott`／`nanshan`，但 `payload.company` 是 `null`、得知管道正常填寫。
   **判斷合作公司要看 `payload.company`，不要看 `formVariant`**；也不要拿 `leadSource` 反推是哪個變體。其他舊形狀見第 5 節「舊名單的不同形狀」。
5. **名單沒有記錄當時的 config 版本**。要判斷名單是哪一版表單填的，只能看 `createdAt`。
6. **不要寫入 `formSchemas`**：官網只在 `contentHash` 不一致時才重寫（重寫時整份覆蓋）。改了其他欄位（例如 `schemaJson`）卻沒改 `contentHash`，錯的內容會一直留著，CRM 自己也會讀到錯的。
7. **config 的 `submit.sideEffects`／`knownQuirks` 描述的是官網現況，不是規格**，Hub 不要照做。
   例如裡面寫官網伺服器 log 會印出名單 id、姓名、手機、課程、分店，那是官網目前的行為；**Hub 的 log 不記個資**（要追查時記名單的文件 id 即可）。
8. **名單含健康資料**：`payload.medicalHistory`（疾病、舊傷或開刀史，自由文字）；另外備註（頂層 `message` 與 `payload.note`，同值兩份）的提示字請填表者寫「特殊身體狀況」，
   也要當成可能含健康資料處理（同步、顯示、寫 log 時比照 `medicalHistory`）。
   只同步營運真正需要的欄位。名單用途要跟填表時告知的目的一致：送出鈕下方寫的是
   「送出即表示同意我們以電話或 LINE 與你聯繫確認開課梯次，個人資料僅用於此報名目的。」
   （config 的 `consent.implicitConsentText`），官網隱私權政策也寫明只在特定目的範圍內利用。
   超出這個用途（例如行銷、會員經營、名單合併）前，先跟官網方確認。

---

## 7. 版本與變更

| 變動 | `contentHash` | `schemaVersion` | CRM 要做什麼 |
|---|---|---|---|
| 改題目文字、提示字、新增選項、改課程價目 | 會變（題目文字、提示字、必填與顯示條件需官網維護者同步更新 JSON 才會變；選項與價目有建置檢查，見文末附錄「官網這邊怎麼確保 config 正確」） | 不變 | 不必改程式；照新 config 顯示即可 |
| 停用選項或網址變體 | 會變（從 `options` 移到 `retiredOptions`、從 `context.variants` 移到 `context.retiredVariants`） | 不變 | 不必改程式；可選清單只讀 `options`，解讀舊名單時連 `retiredOptions`／`context.retiredVariants` 一起查 |
| 下架整張表單 | 變一次（文件保留，內容只多了頂層 `retiredOn`；之後不再變） | 不變 | 照常用它解讀舊名單；之後不會再有這個 `type` 的新名單 |
| 重新上架 | 變一次（`retiredOn` 拿掉） | 不變 | 不必改程式 |
| 欄位（含隱藏欄位）改名或刪除、`store.path`／`valueType` 開頭的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變、值的存法改變（例如字串改布林） | 會變 | **升版** | 官網會先通知，CRM 調整後再上線。升版也不會拿掉記錄過的值（同一個 key 之後也不會拿來存別的東西） |

> 2026-11-14 起，題目或隱藏欄位刪除或改 `key`、`store.path` 或存的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變卻沒升 `schemaVersion`，或記錄過的值與代號消失或改字（升了版也一樣），官網建置都會失敗；所以升版不代表舊名單的值會從 config 裡消失（Hub 可以依賴的保證見第 3 節「選項的 value 與 label」）。
> 檢查看不到的改動（例如值的格式改了，像日期改寫法；或必填條件改變）要不要升版，仍是官網維護者**人工判斷**；上表是目前的約定，不是保證（檢查的範圍與限制見文末附錄「官網這邊怎麼確保 config 正確」）。
> 2026-11-14 以前沒有這個檢查（分店、與學員的關係、性別在 2026-08-24，得知管道在 2026-09-20 改過；團課變體 `abbott`、`nanshan` 在 2026-09-11 刪除，見第 5、6 節），
> 那時停用的選項與變體直接從 config 消失、不在 `retiredOptions`／`context.retiredVariants` 裡，舊名單的值對不到時照原值顯示。

建議 CRM 讀取時檢查 `schemaVersion`，遇到沒處理過的版本就告警，不要直接套用。

---

## 8. 聯絡

config 內容有疑問、或需要新增欄位與選項，請聯繫官網維護者。

---

## 附錄：跟預約表單不一樣的地方

Hub 同時串三張表單時最容易出錯的地方。左邊是預約表單（`formSchemas/booking`），右邊是這張表單。

| 概念 | 預約表單 booking | 團體課程報名 group-booking |
|---|---|---|
| 名單 `type` | `booking` | `group_class` |
| 本人／代填 | `payload.filledBySelf`，**布林**（本人 `true`） | `payload.isFillerSelf`，**字串**（`是`／`否`） |
| 代填者姓名 | `payload.bookerName` | `payload.fillerName` |
| 方便聯繫的電話 | 本人或代填留空時存**學員手機**（一定有值），存原值 | 本人或留空時存 **`null`**，存刪掉空白橫線後的值 |
| 學員手機 `phone` | 存原值 | 存刪掉空白與橫線後的值 |
| Email | 選填，空的是 `null` | 必填 |
| 年齡 | `payload.birthDate`（YYYY-MM-DD） | `payload.ageRange`（區間字串），沒有生日 |
| 健康狀況 | `payload.hasMedicalCondition`（布林）＋`payload.medicalConditionNote` | `payload.medicalHistory`（一題自由文字） |
| 分店 | 頂層 `storeId`（`stores` 文件 id 或內建代號） | 頂層 `storeId` 為 `null`；`payload.store`（店名｜地址）＋`payload.storeName` |
| 偏好時段 | `payload.preferredTime`，**string[]**（複選） | `payload.preferredTime`，**string／null**（自由文字）——**同一個 key、不同型別** |
| 得知管道 | `payload.sources`（複數）＋頂層 `sourceChannel` | `payload.source`（單數），頂層 `sourceChannel` 為 `null`；選項清單與組字方式相同 |
| 備註 | 頂層 `message` | 頂層 `message`＋`payload.note`（同值兩份） |
| 只有這張才有 | — | `payload.course`、`payload.experience`、`payload.storeName` |
| 只有預約才有 | `payload.line`、`payload.paymentMethod`、`payload.exerciseGoals`、`payload.birthDate` 等 | — |
| 網址參數 | `?v=`、`?co=`、`?src=` | `?v=`、`?src=`（沒有 `?co=`） |
| config 裡的 key | 有 `store.map`、`other`、欄位層級的 `optionsSource`（分店）；`store.alsoWrites` 只有一個物件（`source`） | 沒有前三種；多了 `options[].price`、`store.normalized`；`store.alsoWrites` 有物件也有陣列 |

**相同的地方**：`name`、`gender`（同 key、同值 `男`／`女`，只是畫面一個是下拉、一個是單選）、`relationship`（同 key、同選項、同樣的「練健康同仁」規則；2026-08-24 以前的團課舊名單是自由文字，見第 5 節）、得知管道的選項清單與「主選項: 細項」組字方式、隱藏欄位的四個 key（`formVariant`、`company`、`leadSource`、`utm`）。

第 0 節那種完全照 config 解讀的程式可以三張共用；但自己寫死欄位的解析（例如依某個欄位篩選、統計）時，建議依 `type` 分開寫：先看 `type`，再決定讀 `filledBySelf` 還是 `isFillerSelf`、`sources` 還是 `source`、`preferredTime` 當陣列還是字串。

---

## 附錄：官網這邊怎麼確保 config 正確

> 這一節是官網維護者那邊的檢查，**Hub 串接用不到**：Hub 可以依賴的結論已經寫在正文（第 1 節「名單 type 對 config 文件 id」、第 3 節「選項的 value 與 label」、第 7 節）。
> 想確認某個保證的範圍、或某個改動為什麼會（或不會）升版時再查。
> 以下檢查都在官網建置時跑（`scripts/check-form-schemas.mjs`，2026-11-14 起），不符合就建置失敗，有問題的版本不會部署出去。

### 名單 `type` 與寫入名單的程式

- 名單 `type` 的型別宣告（`server/utils/leads.ts` 的 `CreateLeadInput.type`）每一個值都要有 `leadType` 相同的 config（只有 `franchise` 例外）。
- `server/` 底下每個呼叫 `createLead(` 的地方，都要直接傳物件字面值，最外層有一個寫成字面值的 `type`（例如 `createLead({ type: 'group_class', … })`；不能用簡寫、變數或展開），而且這個值要在 `CreateLeadInput.type` 裡、有 config，那張表單也不能已下架。`createLead` 也不能換名字（匯入時改名，或指派給別的變數）。
- 每張沒下架的表單，config 的 `submit.endpoint` 對應的檔案（本表單是 `POST /api/leads/group-class` → `server/api/leads/group-class.post.ts`）要存在、要呼叫 `createLead`，而且只寫這張表單的 `leadType`。
- `server/` 底下的程式檔（`.ts`、`.js` 這類），程式碼碰到 `leads` 集合（`collection('leads')`、`doc('leads/…')`，先把 `'leads'` 存成常數再用也算；讀或寫都算）就建置失敗。
  例外只有：`server/utils/leads.ts` 裡的 `createLead` 本身、後台 API（`server/api/admin/`），以及列在檢查允許清單裡的檔案（只給只讀不寫的檔案、要寫明原因；目前是空的）。`server/` 以外的檔案不在這道檢查範圍內。
- 每份 config 都要有 `leadType`，所有 config（含已下架的）的 `leadType` 不能重複。
- `docs/form-schema/` 裡的 JSON 要跟官網的同步清單一致（每份 JSON 都會同步到 Firestore，含已下架的），沒下架的 JSON 也都要有對應的選項比對。

### 跟官網程式比（現況）

- 選擇題的 value、順序、label 要跟官網程式一致；課程（`course`）連價目（`price`）也比。
- 得知管道（`source`）第二層的展開方式、提示字與預設選項（`detail.defaultOptions`）要跟官網程式一致。
- 網址變體（`context.variants`）的代號與設定值（`company`、`leadSource`、`extraSources` 等）要跟官網程式一致。
- 頁面上綁定的每個輸入欄位都要是 config 的一題（不存進名單的輸入框要在檢查裡另外列出、寫明原因），所以頁面新增題目卻沒寫進 config 會建置失敗。
- 這道檢查只比現況、不跟上一版比：程式與 JSON 一起改就過得了。「記錄過的值不能消失」靠下一段的記錄比對。

### 跟上一版的記錄比（`values-ledger.json`）

檢查會拿現在的 config 跟官網 repo 裡的記錄檔（`docs/form-schema/values-ledger.json`，**不會同步到 Firestore**）比對。

**記錄的內容**：

- 表單的 `leadType` 與 `schemaVersion`。
- 每一題（不只選擇題，姓名、電話這類自由輸入也算）與每個隱藏欄位（`hiddenFields`，記錄檔裡的 key 前面加 `hidden:`）的 `key`、存的位置（`store.path`）、
  型別（`valueType` 開頭的型別字，例如 `boolean`、`string[]`；沒寫算 `string`，所以補寫 `string` 不算改變）、順帶寫入的位置（`store.alsoWrites`；本表單是 `store` 的 `payload.storeName`、`storeId`，以及 `note` 的 `payload.note`）。本表單共 16 題、5 個隱藏欄位。
- 存進名單的值：選項值（`options` 加 `retiredOptions`），連同 `store.possibleValues` 的值（本表單是 `isFillerSelf` 的 `是`、`否`）。
  有 `store.map` 的題目記的是對照後存進名單的值，不是選項文字（這張表單沒有；預約表單的 `filledBySelf`、`hasMedicalCondition` 才有，記的是 `true`、`false`）。
- 網址變體代號（`context.variants` 加 `context.retiredVariants`）與免費合作方代號（`context.freeTrialPartners` 加 `context.retiredFreeTrialPartners`）（本表單的變體只有 `default`，沒有合作方）。

**規則**：

- **記錄過的值與代號不能消失或改字，升了 `schemaVersion` 也一樣**。停用選項要移到同一題的 `retiredOptions`，下架變體移到 `context.retiredVariants`，下架合作方移到 `context.retiredFreeTrialPartners`；
  同一個值或代號同時出現在現行與停用清單也會失敗。改字只能當成「停用舊的＋新增新的」。
- 有 `store.map` 的題目，選項文字只是畫面用，改字不必升版；存的值（`true`／`false`）不見了（例如改存字串），建置就失敗，升版也一樣。
  兩個選項的 `true`／`false` 對調時兩個值都還在，檢查擋不到。
- 題目或隱藏欄位刪除或改 `key`、改 `store.path`、改型別、`store.alsoWrites` 少了某個位置、改 `leadType`，**沒升 `schemaVersion` 建置就失敗**；升了版才放行（`store.alsoWrites` 多寫一個位置不用升版）。
  `schemaVersion` 也不能比記錄的舊。
- 升版刪掉的題目在記錄檔裡留下墓碑（記下刪除時的版本，連同它記錄過的值），之後同一個 `key` 再加回來時，照樣要包含那些值，所以同一個 `key` 不能拿來存別的。
  墓碑只在記錄檔裡，config 已經沒有這一題，所以 Hub 解讀舊名單時，這一題的值照原值顯示。
- 新增的題目、值、代號，以及表單下架或取消下架（`retiredOn`），都要先記錄進記錄檔，沒記錄建置也會失敗。
- 記錄檔裡有的表單，JSON 不能刪：下架要留著 JSON、加 `retiredOn`（Hub 還要靠它解讀舊名單）。

**跟記錄檔比時不管**：題目文字、選項的 `label` 與附帶設定（課程價目 `price`、`messagePlaceholder`）、提示字（placeholder）、錯誤訊息、顯示與必填條件（`showIf`、`required`）、
隱藏時存什麼（`store.whenHidden`）、得知管道的第二層（`detail`）、變體與合作方裡面的設定值、內建備用分店（`storeId.optionsSource.fallback`）、`store.valueType` 型別字後面的說明文字（有些項目只有某幾張表單有）。
其中選項的 `label` 與附帶設定、得知管道第二層的提示字與預設選項、變體與合作方的設定值、內建備用分店，另有上面「跟官網程式比」的檢查，但那道檢查只比現況、不看歷史。

### 檢查的限制

- 送出端點（`server/api/leads/*.post.ts`）實際把值存在名單的哪個 key、有沒有轉換，檢查比對不到：`store.path` 是官網維護者人工跟程式同步的。
- 檢查看不到的不相容改動（例如型別字沒變、但值的格式改了，像日期改寫法）要不要升版，仍是官網維護者**人工判斷**；升版本身是否恰當、升了版之後改得對不對，檢查也不管。
- 題目文字、提示字、錯誤訊息、顯示與必填條件不跟程式比，是人工維護的，少數情況可能比線上畫面慢一步。
- 記錄檔是 repo 裡的檔案，有人手動改它還是繞得過去；這道檢查防的是疏忽，不防故意。所以第 7 節的表是目前的約定，不是保證。
