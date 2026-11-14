# Hub／CRM 讀取「團體課程報名」表單 config 說明

> 對象：Hub／CRM（同一個 Firebase 專案；前端是 Firebase Hosting 靜態 SPA，後端是 Cloud Run 的 `lkkhubapi`／`lkkcrmapi`）的開發者
> 環境：**lkkdev（測試）**；**lkkprod（正式）**，兩邊路徑相同、只換專案（兩邊 2026-11-14 都已寫入）
> 更新：2026-11-14

練健康官網 `/group-booking`「團體課程報名」表單裡**解讀名單需要的定義**（段落、題目、選項、存進名單的位置與存法、隱藏欄位、網址變體），
已經放在 Firestore，Hub／CRM 直接讀即可。**這份 config 是唯讀的**：由官網自動維護，Hub／CRM 不要寫入。

> 2026-11-14 起，Firestore 上的 config 是官網用白名單從描述檔（官網 repo 裡的完整表單定義）挑出來的版本，只留解讀名單用得到的 key（第 3 節）。
> 提示字、錯誤訊息、必填與顯示條件、送出流程、同意事項、頁面文案、官網內部的注意事項都**不在 config 裡**；
> 其中解讀名單時還用得到的（例如某一題為什麼常是空的、伺服器檢查了什麼、哪些值沒有經過驗證），直接寫在這份說明裡，並標明「不在 config 裡」。

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

// 查不到 leadType 時的退路（官網退回舊版時會用到）
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
- `getConfig` 回傳 `null` 有兩種情況：`franchise`（刻意沒有 config），以及文件還沒寫入（例如新的環境官網還沒發版）。後者要告警，不要當成正常、默默照原值顯示（見第 2 節「權限」）。

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
| 想顯示隱藏欄位（來源頁、UTM 等） | 見第 3 節「隱藏欄位（`hiddenFields[]`）」（這張表單有 `sourcePage`、`formVariant`、`company`、`leadSource`、`utm`），位置一樣在 `store.path`；名單裡的樣子見第 5 節（`formVariant` 可能是陣列）。這些值由前端送出、伺服器沒驗證（第 6 節） |
| 某題在很多名單裡是空的、想知道什麼時候必填 | 必填與顯示條件不在 config 裡，見第 3 節「必填與顯示條件（不在 config 裡）」；沒填時存什麼見第 5 節「存值的細節」 |
| config 裡有第 3 節沒列的 key | 略過，不要拿來用。官網如果退回 2026-11-14 這次改動以前的版本，文件會暫時變回完整版本，多出 `conventions`、`submit` 等 key（第 1 節「什麼時候會更新」）；上面的程式兩種版本都能讀 |

> 上面步驟一到三的程式碼已經拿官網三份給 Hub 的 config（2026-11-14 白名單版本）與假資料實際跑過，例子裡的輸出就是實際跑出來的結果。

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
| `contentHash` | string | `schemaJson` 的 sha256。**只有 config 裡的內容變了才會變**（題目文字、選項、存放位置與型別、隱藏欄位、網址變體這類第 3 節列出的 key）；只改提示字、錯誤訊息、必填或顯示條件、按鈕與頁面文字時不會變（這些不在 config 裡）。哪些改動會讓它變見第 7 節 |
| `schemaJson` | string | **給 Hub 的 config 的 JSON 字串**，讀了要自己 `JSON.parse`。內容是官網從描述檔用白名單挑出解讀名單需要的部分，形狀見第 3 節 |
| `syncedAt` | timestamp | **最後一次內容變更**時寫入的時間（內容沒變就不會更新，不是心跳） |
| `revision` | string | 最後一次內容變更時，寫入的官網版本（Cloud Run revision 名稱，例：`lkk-website-dev-build-2026-11-12-001`） |
| `retiredOn` | string | **只有下架的表單才有**：下架日期（`YYYY-MM-DD`），從 config 頂層的 `retiredOn` 抄過來（`schemaJson` 裡也有）。目前三張表單都沒有這個欄位（見下方「下架的表單」） |

> 為什麼存成字串：config 有多層巢狀與陣列，存成字串最單純，`contentHash` 也直接是這個字串的 sha256。

### 下架的表單

表單下架時，官網只拿掉頁面與送出端點；描述檔 JSON 留在官網 repo、頂層加上 `retiredOn`，官網也繼續同步這份文件，所以 **Firestore 上的文件不會刪除**：
文件多一個 `retiredOn`，其餘內容跟下架前相同（`leadType` 也還在，用 `where('leadType', …)` 照樣查得到），之後不會再有這張表單的新名單。
Hub 照樣用它解讀這張表單的舊名單，只是不該再把它當成現行表單（例如不再列在「可填的表單」）：判斷方式是文件有沒有 `retiredOn`。
- `retiredOn` 也在 `schemaJson` 裡，所以下架那一次 `contentHash`（還有 `syncedAt`／`revision`）會變一次，之後跟其他沒改的表單一樣不再寫入，不會一直出現、消失。
- 重新上架＝config 拿掉 `retiredOn`：官網寫入時整份覆蓋文件，`retiredOn` 跟著消失，`contentHash` 再變一次。

### 什麼時候會更新

官網伺服器會比對 config 與 Firestore 上的 `contentHash`，內容有變才寫入（整份覆蓋）：dev 站改了 → lkkdev 更新；正式站改了 → lkkprod 更新。
config 只放解讀名單需要的部分，所以官網只改提示字、錯誤訊息、條件、按鈕文字這類畫面上的東西時，`contentHash` 不變、文件也不會重寫；
`contentHash` 一變，就代表 Hub 讀得到的內容真的變了。

- **發版後要等第一個請求打到官網伺服器，才會比對並寫入**。官網跑在 Cloud Run，閒置時 CPU 會被限縮，
  執行個體啟動時發出的比對會停住，等有請求進來才跑完。沒有流量時（例如 dev 站沒人逛的時段）寫入會延後，
  所以「官網發版完成」不等於「這份文件已經更新」。
- 之後只要有請求、距上次比對超過 10 分鐘就再比對一次（失敗的話 1 分鐘後有請求時再試）。
  **這個再比對也要有請求才會跑**：流量少的時段，補寫（例如下面說的發版時被舊版蓋回去的文件）會比 10 分鐘更晚。
- 讀取前一定要檢查文件存在（見第 2 節）：新的環境在官網第一次發版、有人瀏覽網站以前不會有這份文件。
- `syncedAt`／`revision` 是「最後一次內容變更」的時間與版本，**不是心跳，不代表同步仍在運作**。
  表單很久沒改時它們會停在很久以前；同步因故停擺時看起來也一模一樣，Hub 從這兩個欄位分不出來。
  要確認 Hub 讀到的是哪一版，請比對 `contentHash`（需要時跟官網維護者對前 8 碼）。
- 表單下架或重新上架（`retiredOn` 出現或消失）也是一次內容變更，照上面的流程寫入（見上方「下架的表單」）。
- 2026-11-14 有兩次改動，題目與選項內容都沒有變：
  1. 加了 `leadType` 與閱讀規則的文字，三張表單的 `contentHash` 各變了一次（lkkdev 2026-11-14 已寫入）。
  2. config 改成只放解讀名單需要的部分（第 3 節）。三張表單的 `contentHash` 因為形狀改變又各變了一次（lkkdev 2026-11-14 已寫入）
     （新的前 8 碼：`booking` 是 `237bb143`、`group-booking` 是 `f55e9856`、`cooperation` 是 `e52c1b8a`）。
     改之前的完整版本多了 `describes`、`conventions`、`submit`、`record` 這類頂層 key，每一題也多了提示字、條件等 key
     （第 3 節「不在 config 裡的東西」）；預約表單得知管道 `source` 與團課備註 `note` 的 `store.alsoWrites` 在舊版是單一物件，新版一律是陣列。
     第 0 節的程式兩種版本都能讀；新版沒有的 key 不要拿來用。
     lkkprod 2026-11-14 第一次寫入時就是新的形狀。官網如果退回這次改動以前的版本，文件會再變回完整版本，直到下一次發新版。

> config 是從官網維護者手寫的描述檔（`docs/form-schema/group-booking.json`，官網 repo 裡）挑出來的：同步時只留第 3 節列出的 key，其他留在官網 repo。描述檔不是從頁面自動產生的。
> 選項（value、label、順序、課程價目）、網址變體的設定值由建置檢查保證跟官網程式一致；
> 2026-11-14 起建置檢查也會跟上一版的記錄比對，記錄過的值與代號不能消失或改字（見第 3 節「選項的 value 與 label」），
> 並確認挑出來的 config 跟描述檔的每一題位置、型別、存的值、代號、段落標題、題目與選項文字完全相同（檢查細節見文末附錄「官網這邊怎麼確保 config 正確」）。
> 題目文字與段落標題是人工維護，少數情況可能比線上畫面慢一步。
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
    // 文件不存在（例：新的環境官網還沒發版）→ 告警，沿用上次的 config，不要往下解析
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
    # 文件不存在（例：新的環境官網還沒發版）→ 告警，沿用上次的 config，不要往下解析
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
讀取時丟出 `PERMISSION_DENIED` 是權限沒開；`snap.exists` 為 `false` 是文件還沒寫入（例：新的環境官網還沒發版）。兩者是不同的問題，告警訊息要分開。
**目前 Hub／CRM 的服務帳號都還沒有這個權限**（`lkkhubapi-runtime`、`lkkapi-sa` 都沒有 Firestore 角色），開通方式另行討論（viewer 角色的範圍是整個資料庫，不只這份文件）。

---

## 3. config 長什麼樣子

`JSON.parse(schemaJson)` 之後的頂層只有下面這些 key（給 Hub 的版本：官網從描述檔用白名單挑出解讀名單需要的部分）：

| key | 內容 |
|---|---|
| `formId`、`leadType`、`schemaVersion` | 同第 1 節「文件欄位」 |
| `retiredOn` | 只有下架的表單才有（第 1 節「下架的表單」）。本表單沒有 |
| `sections` | 段落陣列，順序就是畫面上的順序；每段是 `{ id, title, fields }`，`title` 是段落標題（可能是 `null`），`fields` 是這一段的題目（見下方「欄位一覽」與「讀題目與選項：用哪些 key」）。本表單分四段，第二段（代填的三題）的 `title` 是 `null`。 |
| `hiddenFields` | 使用者看不到、但會存進名單的值，見下方「隱藏欄位」。本表單有 `sourcePage`、`formVariant`、`company`、`leadSource`、`utm` |
| `context` | 網址參數帶來的代號與設定值：現行的在 `variants`（`?v=` 網址變體）、`freeTrialPartners`（`?co=` 免費合作方），下架的代號移到 `retiredVariants`、`retiredFreeTrialPartners`；沒有的就不出現。本表單只有 `variants`，目前只有 `default`（內容是空物件）；沒有 `?co=`，所以沒有 `freeTrialPartners`。`?src=`（名單來源）沒有代號表，原字存進 `payload.leadSource` |

### 不在 config 裡的東西

config 裡只有本節各表列出的 key。描述檔（`docs/form-schema/group-booking.json`）是官網自己用的完整表單定義，其他 key 同步到 Firestore 時刻意不放，例如：

- 頂層：`describes`、`sourceOfTruth`、`conventions`（閱讀規則與條件寫法）、`submit`（送出流程與伺服器驗證）、`consent`（同意事項）、`derived`、`record`（名單的欄位清單）、`requestBody`、`pageCopy`、`hiddenFieldsTrust`、`knownQuirks`、`crossFormDifferences`、`differencesFromBooking`（不是每張表單都有）；`context` 裡的 `description`、`params`、`variantProperties` 這類說明。
- 每一題：`placeholder`、`required`、`errors`、`validation`、`showIf` 與其他條件（`lockedBy`、`optionRules`、`valueRules`…）、`hint`、`picker`、`min`／`max`、`default`、`labelSuffixWhenOptional`、`knownIssue` 這類；段落的 `titleNote`。
- 選項：`showIf`、`note`、`detail`（第二層選單）、`messagePlaceholder` 這類；`store`：`note`、`empty`、`whenHidden`、`fallback`、`order`、`normalized`、`serverShape` 這類；`optionsSource`：`afterSelectShow`、`filter`、`order`、`note`，以及備用分店的地址電話；隱藏欄位：`capture`、`note`，以及 `store` 裡 `path` 以外的 key。

不放的原因：Hub 解讀名單用不到，而且只改這些時 `contentHash` 不會變，Hub 不會因為改了一句提示字就多存一個版本。
其中解讀名單時還用得到的，寫在這份說明裡並標明「不在 config 裡」，位置見下表。
官網退回舊版時這些 key 可能暫時出現（第 1 節「什麼時候會更新」）；**不要寫程式讀它們**。官網之後如果多放 key 進來，第 0 節的程式也不受影響；看到本節沒列的 key 略過即可。

| 資訊（描述檔裡的 key） | 現在寫在哪 |
|---|---|
| 必填與顯示條件、隱藏時存什麼（`required`、`showIf`、`store.whenHidden`、`store.empty`） | 下方「必填與顯示條件（不在 config 裡）」 |
| 電話正規化（`store.normalized`） | 下方「讀題目與選項：用哪些 key」、第 5 節開頭 |
| 得知管道的第二層（`detail`）、課程與分店的連動（`optionRules`、`lockedBy`） | 下方「讀題目與選項：用哪些 key」、第 4 節 |
| 名單的欄位清單（`record`） | 第 5 節開頭 |
| 送出流程、伺服器驗證、已知的怪行為（`submit`、`knownQuirks`） | 第 6 節第 1、2、7 點 |
| 隱藏欄位沒有驗證（`hiddenFieldsTrust`）、utm 怎麼捕捉（`capture`） | 第 6 節第 3 點、下方「隱藏欄位」 |
| 同意文字（`consent`） | 第 6 節第 8 點 |
| 跟預約表單的差異（`differencesFromBooking`） | 文末附錄「跟預約表單不一樣的地方」 |

### 欄位一覽（`sections[].fields[]`）

「必填」欄是官網畫面的規則，**不在 config 裡**（細節見下方「必填與顯示條件」），列在這裡是為了說明名單裡為什麼會是空的。

| key | 題目 | 類型 | 必填（官網規則，不在 config 裡） | 存在名單的位置 | 存的型別 |
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

`relationship`、`fillerName`、`contactPhone` 三題在第二段（`id: "filler"`）。

### 必填與顯示條件（不在 config 裡）

下面是官網畫面現在的規則，只用來理解名單裡的空值與自動帶入的值。規則可能隨時改、不升版，`contentHash` 也不會變；名單也沒有記錄填表當下的規則，Hub 不要拿它驗證名單（伺服器實際擋了什麼見第 6 節）。

| 題目 | 什麼時候出現 | 沒出現時名單存什麼 |
|---|---|---|
| `relationship`、`fillerName` | `isFillerSelf` 選「否，我是幫他人代填」時（必填） | `null`（就算先填過再切回本人） |
| `contactPhone` | 同上；必填，但關係是「練健康同仁」時選填，畫面上題目後面會加 `（選填）`（config 的 `label` 只有 `方便聯繫的電話`） | `null`（代填但留空也是 `null`） |
| `source` | 一般都出現（必填）。網址變體可以設定整題隱藏，這個設定不在 config 裡，目前沒有變體這樣設定 | `[]` |
| `course` 的選項 `練健康舉重團班` | 網址變體把分店鎖在南京店以外時不出現；目前沒有任何變體鎖定分店，三個課程都會出現 | （填表人只能選其他課程） |

`preferredTime`、`experience`、`note` 選填，沒填時存 `null`（`note` 連同頂層 `message`）；其他題目都必填。

### 讀題目與選項：用哪些 key

> 用詞：下文 `store.xxx`（例：`store.path`、`store.alsoWrites`）指**欄位底下的 `store` 物件**（存放位置）；
> 指欄位本身時寫「key 為 `store` 的欄位」（分店那一題）。兩者容易混淆：分店選項在 key 為 `store` 的欄位的 `options`，
> 不是 `field.store.options`（不存在）。

**位置**：`schema.sections[]`（段落，`id`、`title` 是段落代號與標題）→ `section.fields[]`（每一題）。

> 第二段（代填的三題）**`title` 是 `null`**：畫面上它是第一部分裡的一個虛線框，沒有標題。顯示段落標題前要先判斷。

**每一題**可能有的 key（三張表單共用同一套；這一題沒有的 key 就不會出現）：

| 要讀什麼 | key | 說明 |
|---|---|---|
| 欄位代號 | `key` | 不一定等於名單裡的欄位名，名單位置一律看 `store.path` |
| 題目 | `label` | 畫面上的題目文字 |
| 題目補充 | `labelSuffix` | 例：`（選填）`、`（可複選）`；要顯示完整題目就接在 `label` 後面 |
| 題型 | `type` | 例：`text`、`tel`、`email`、`date`、`textarea`、`select`、`radio`、`checkbox-group`、`tabs` |
| 名單裡的位置 | `store.path` | 頂層欄位直接是名稱（例：`name`），其他是 `payload.<名稱>` |
| 存的型別 | `store.valueType` | 沒寫就是字串。開頭是型別字（`boolean`、`string[]`、`string`），後面可能接說明文字，判斷型別請用 `startsWith`，不要用 `===` |
| 布林對照 | `store.map` | 畫面選項 → 存的值，例：`{ "本人填寫": true, "他人代填": false }` |
| 可能出現的所有值 | `store.possibleValues` | 名單裡可能出現的**所有**值，可能有不在 `options` 裡的值 |
| 組合值的寫法 | `store.compose` | 「主選項: 細項」怎麼組成的說明文字（給人看的，不是程式規則） |
| 順帶寫入的位置 | `store.alsoWrites` | **一律是陣列**，每個元素是 `{ path, value }`：`path` 是另外寫到的位置，`value` 是說明文字或固定值 |
| 選項 | `options`、`retiredOptions`、`optionsSource`、`other` | 見下表 |

**選項**的 key（四種都沒有的題目是自由輸入）：

| 來源 | key | 怎麼讀 |
|---|---|---|
| 固定選項 | `options[]` | 每個選項是 `{ value, label?, price? }`：`value` 是名單裡存的字；`label` 是畫面上的字，**沒寫就等於 `value`**；`price` 是課程價目（只顯示、不存進名單） |
| 已停用的選項 | `retiredOptions[]` | 2026-11-14 起停用的選項從 `options` 移到這裡，格式同 `options`，另可有 `retiredOn`（停用日）、`note`。**畫面上已經不出現**，只用來解讀舊名單；列可選清單時不要列出。沒有停用的選項時沒有這個 key，當成空陣列 |
| 動態選項 | `optionsSource` | `{ endpoint, value, label, fallback }`：選項在 Firestore 的集合裡（第 4 節），`value`、`label` 是拿哪個欄位當存的值與畫面文字，`fallback[]` 是內建備用選項的 `{ value, label }` |
| 「其他」再填說明 | `other` | `{ triggerValue, compose }`：選了 `triggerValue` 可以再填說明，名單存成「`triggerValue`: 說明」；`compose` 是這個寫法的說明文字 |

**這張表單**：

- `key` 跟名單欄位名不同的：`note` 存在頂層 `message`（另外抄一份到 `payload.note`）。
- `type`：`text`、`tel`、`email`、`textarea`（自由輸入）、`radio`、`select`（有 `options`）。
- `store.valueType`：`isFillerSelf`、`preferredTime`、`medicalHistory` 明寫 `string`，`source` 是 `string[]`，其他沒寫（字串）。
- `store.possibleValues`：只有 `isFillerSelf`：`是`、`否`（跟 `options` 相同）。
- `store.compose`：只有 `source`：有細項時存「主選項: 細項」。
- `store.alsoWrites`：只有 key 為 `store`、`note` 的兩題。`store` 兩個元素：`payload.storeName`、頂層 `storeId`（`value` 是 `null`，永遠存 `null`）；`note` 一個元素：`payload.note`。
- `options`：性別、年齡區間、本人填寫、關係、課程、分店、重訓經驗、得知管道。`price` 只有課程有（例：`$2,400`），**只顯示、不存進名單**。`retiredOptions` 目前每一題都沒有。
- 沒有 `store.map`（沒有布林欄位，預約表單的 `filledBySelf`、`hasMedicalCondition` 才有）、`optionsSource`（分店是寫死在頁面上的四個選項，不讀 `stores` 集合）、`other`（得知管道的「其他」走第二層細項）。

以下幾件事跟解讀名單有關，但**不在 config 裡**（只寫在這裡）：

- **電話會被正規化**：`phone`、`contactPhone` 存的是刪掉所有空白與半形橫線後的值；其他文字欄位存原值，沒有去前後空白（`payload.storeName` 與得知管道的細項除外，那兩個有去前後空白）。
- **得知管道的第二層細項**：`社群`、`實體活動` 選了之後要再選一項（下拉，選項由業主在後台調整，見第 4 節），
  `練健康夥伴推薦`、`醫師/醫療轉介`、`其他` 選了之後要再填一段文字。細項只出現在存的值裡（`社群: IG`、`其他: 朋友介紹`），
  照第 0 節 `labelOf` 的第 3 步（或下方「把名單的值轉回畫面上的字」第 2 點）切開即可，不需要知道細項清單。
- **課程與分店的連動**：選了「練健康舉重團班」時分店下拉只剩南京店，並自動改成南京店；之後換回其他課程，分店仍是南京店不會還原。
  所以分店是南京店的名單，不一定是填表人主動選的。

**讀取範例（Node.js）**：列出每一題的題目、名單位置與選項

```js
const fields = schema.sections.flatMap((s) => s.fields)

for (const f of fields) {
  const question = f.label + (f.labelSuffix ?? '')       // 題目
  const path = f.store?.path                             // 名單位置，例：'payload.ageRange'
  const also = [].concat(f.store?.alsoWrites ?? [])      // 一律是陣列；concat 是為了也能讀 lkkdev 發版前的舊形狀（note 是單一物件）
    .map((a) => a.path)                                  // 例：['payload.storeName', 'storeId']
  const options = (f.options ?? []).map((o) => ({
    value: o.value,                                      // 名單裡存的字
    label: o.label ?? o.value,                           // 畫面上的字
    price: o.price,                                      // 只有課程有，不存
  }))
  // 得知管道的細項不在 config 裡：存的值是「主選項: 細項」，見下方
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
  - 題目文字、段落標題、選項的 `label`、課程價目、`store.compose` 與隱藏欄位這類說明文字**不在這道保護內**，可能隨時改、不升版，所以 Hub 轉存時要存原始值（見第 2 節「快取與轉存」）。
    提示字、顯示與必填條件、得知管道第二層的細項本來就不在 config 裡，官網隨時改，Hub 看不到。

  檢查怎麼做、記錄了哪些東西、擋不到什麼，見文末附錄「官網這邊怎麼確保 config 正確」。
- 2026-11-14 以前沒有這個檢查，改過：分店、與學員的關係、性別在 2026-08-24，得知管道在 2026-09-20，值與存法都變過，見第 5 節「舊名單的不同形狀」。
  這些舊值**不在** `retiredOptions` 裡。
- **停用的選項**：2026-11-14 起會從 `options` 移到同一題的 `retiredOptions`，不再從 config 消失；在那之前停用的已經直接消失了，
  所以舊名單的值仍可能在 config 裡對不到，照原值顯示。

### 隱藏欄位（`hiddenFields[]`）

使用者看不到、但會存進名單的值。每一項可能有的 key：

| key | 說明 |
|---|---|
| `key` | 隱藏欄位的代號 |
| `value` | 值從哪裡來的**說明文字**，不是名單裡的值，不要拿它當預設值（只有 `sourcePage` 的值剛好就是頁面路徑） |
| `valueType` | 只有型別特殊時才有（例：`formVariant` 是 `string \| string[] \| null` 加說明文字） |
| `shape` | 只有物件才有（例：`utm` 物件裡每個 key 的說明） |
| `store.path` | 名單裡的位置 |

本表單有五個：

| `key` | 名單位置 | 從哪裡來 |
|---|---|---|
| `sourcePage` | 頂層 `sourcePage` | 通常是 `/group-booking` |
| `formVariant` | `payload.formVariant` | 網址 `?v=` 的原字，沒帶是 `null`（網址重複帶 `v` 時是陣列，見第 5 節「存值的細節」） |
| `company` | `payload.company` | 變體的 `company`；目前只有 `default` 變體，所以是 `null` |
| `leadSource` | `payload.leadSource` | 網址 `?src=`（單一非空字串），沒有就用變體的 `leadSource` |
| `utm` | `payload.utm` | cookie `lkk_utm`（欄位見 `shape`） |

以下不在 config 裡：

- 這些值都由前端送出、伺服器原樣存，**沒有驗證**（見第 6 節第 3 點）。`sourcePage` 只有前端沒送時才由伺服器補 `/group-booking`。
- `utm` 來自 cookie `lkk_utm`（保存 30 天）：在**任何一頁**進站或站內換頁時，網址帶 `utm_*` 就記下來，不一定是在報名頁；
  帶了不同的一組就整組覆蓋（沒帶的舊 key 直接消失）。所以 `landingPage` 不一定是 `/group-booking`，`capturedAt` 是記下這組 utm 的時間、不是送出時間。

---

## 4. 不在 config 裡、要另外讀的動態選項

只有一組：「從哪裡得知」的第二層下拉（社群平台、實體活動），由業主在後台隨時調整。**config 裡沒有這一層**：連「去哪裡讀」與預設值都不在 config 裡，下面的規則只寫在這份說明。
這份設定跟預約表單**共用**，兩張表單看到的選項相同。

**解讀名單用不到這一層**：填表人選的細項已經在存的值裡（`社群: IG`），照第 0 節切開即可。業主改名或停用某個細項後，舊名單的值也不會變，照原字顯示。
只有 Hub 要列出「目前可選的細項」（例如做篩選選單）時才需要讀。

讀 `settings/referralOptions` 文件的 `social`（社群）、`event`（實體活動）欄位，形狀是 `[{ label: string, active?: boolean }]`：

- 取 `label` 去掉前後空白後非空、且 `active !== false` 的項目
- **欄位不存在**（或不是陣列、文件不存在）→ 官網用程式內建的預設值。寫這份說明時是：社群 `IG`、`FB`、`Threads`、`Line`、`YT`、`Podcast`；實體活動 `聖誕老人賽事`、`高齡博覽會`。
  預設值不在 config 裡，官網改了不會通知 Hub，也不會改 `contentHash`
- **欄位存在但全部停用** → 空陣列，官網會把「社群」或「實體活動」整個主選項隱藏

分店**不用**另外讀：選項就是 key 為 `store` 的欄位的 `options`，
即 `schema.sections.flatMap(s => s.fields).find(f => f.key === 'store').options`——四個**物件**，值在 `value`（不是四個字串，比對時要取 `.value`）。

### 選配：把代碼轉成中文

下面兩組對照不在 config 裡，要不要做由 Hub 決定；不做就顯示原始代碼，跟官網後台現況一樣。

- **UTM 活動名稱**：`payload.utm.campaign` 可以用 `campaigns` 集合的 `utmCampaign` 欄位對到活動名稱 `name`。
  後台可以改活動代號、也可以刪除活動，所以舊名單可能對不到，對不到就顯示原始代號。官網後台的名單頁自己也只顯示代號。
  後台存的代號一律是小寫；名單裡的值是網址上的原字（只去掉前後空白、不轉小寫），比對前可以先轉小寫。
- **名單狀態 `status` 的中文**：`new` 新名單、`contacted` 已聯繫、`scheduled` 已預約、`completed` 已完成、`cancelled` 已取消。
  以官網 `composables/useLeadStatus.ts` 為準；config 裡沒有名單狀態（狀態是後台處理名單用的，不是表單的題目）。

---

## 5. 對照名單（`leads` 集合）

團體課程報名的名單在 `leads`，`type == 'group_class'`。config 裡**沒有**名單的欄位清單（每一題的位置在 `store.path`），名單的完整欄位以下表為準：

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
| `payload.*` | 現行版本會寫的 key：`gender`、`ageRange`、`isFillerSelf`、`fillerName`、`relationship`、`contactPhone`、`course`、`store`、`storeName`、`preferredTime`、`experience`、`medicalHistory`、`source`、`note`、`utm`、`formVariant`、`company`、`leadSource`（意思見第 3 節欄位一覽） |
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
- **分店**：`payload.store` 是「店名｜地址」整串，`payload.storeName` 是「｜」前面的店名去掉前後空白（例：`南京店`）。
  選舉重團班時分店會自動改成南京店（第 3 節「讀題目與選項：用哪些 key」的「課程與分店的連動」），所以南京店的名單不一定是主動選的。
  要跟預約表單的分店（`stores` 文件 id）對應，只能用店名比對。
  團課存的是 config 裡**寫死的字串**，業主在後台把 `stores` 的分店改名（或停用、刪除）時，團課名單與 config 都不會跟著變；
  但預約名單只存 `storeId`，查出來的店名會變成新名字。所以跨表單比對分店時，要自己維護一份店名對照，不能假設兩邊的店名永遠相同。
- **偏好時段 `payload.preferredTime`** 是自由文字或 `null`，不是陣列。
- **重訓經驗**存 value：畫面「規律訓練中」存成 `有規律訓練習慣`。選填，沒選是 `null`。
- **健康狀況 `payload.medicalHistory`** 是一題必填的自由文字，沒有「有／無」的布林可以篩。
- **課程價目沒有存**，只出現在確認信；要價目讀 config 裡 key 為 `course` 的欄位的 `options[].price`（那是現在的價格，不是報名當時的）。
- **年齡只有區間**（`50歲以下`／`50–65歲`／`65歲以上`），沒有生日；50 歲與 65 歲各落在兩個區間，由填表者自己選。
- **`payload.formVariant`** 是網址 `?v=` 的原字；網址重複帶 `v` 時會是陣列。查不到的代號也照存。
  解讀代號時先查 `context.variants`，再查 `context.retiredVariants`（2026-11-14 起停用的變體會移到這裡；目前沒有）；
  兩邊都查不到就照原字顯示（2026-09-11 刪除的 `abbott`、`nanshan` 不在 `retiredVariants` 裡，見第 6 節第 4 點）。
- **`payload.company` 目前永遠是 `null`**：現在只有 `default` 變體，沒有任何變體設定合作公司。
- **同意事項**：這張表單沒有勾選框，也沒有存任何同意紀錄。
- **沒存的東西**（不在 config 裡）：得知管道的細項沒有另外存（併進 `source` 的字串）、課程價目、送出當下的變體設定（只存 `?v=` 原字）、IP 與裝置資訊、兩封信有沒有寄出、填表人有沒有傳 LINE 訊息。

### 舊名單的不同形狀

表單改過幾次，舊名單的值不會跟著改。先記住兩個通則：

- 上表 `payload.*` 列的是**現行版本會寫的 key**。較舊的名單可能**缺 key**（缺少與 `null` 同等處理），
  也可能**多出上表沒列的 key**（忽略，不要報錯）。
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

送出流程、伺服器驗證、已知的怪行為這些**不在 config 裡**（只留在官網 repo 的描述檔），跟解讀名單有關的整理在這一節。

1. **伺服器只驗證少數規則**：`name`、`gender`、`ageRange`、`phone`、`email`、`isFillerSelf`、`course`、`store`、`medicalHistory` 有值（用原值判斷，只打空白會通過）；
   手機刪掉空白與橫線後符合 `^09\d{8}$`；Email 格式；以及 `isFillerSelf` 是 `否` 時，關係、報名者姓名要有值，電話要有值（關係是「練健康同仁」除外）。
   其他都不檢查：選項是否在清單內、舉重團班只限南京店、得知管道必填、聯絡電話格式、型別、長度。
   直接呼叫官網 API 可以寫入任意值，所以 CRM 處理名單時，**不要假設值一定在選項清單裡、也不要假設型別一定對**。
   也沒有驗證碼、頻率限制或重複送出檢查（前端只擋送出中重按），**同一個人可能有多筆名單**，合併或去重由 Hub 決定。
2. **聯絡電話的必填檢查用原值**：只打空白或橫線會通過伺服器，但存成 `null`。所以經 API 直接送入的名單，就算不是同仁代填，`payload.contactPhone` 也可能是 `null`。
3. **隱藏欄位沒有驗證**：`sourcePage`、`payload.company`、`payload.leadSource`、`payload.formVariant`、`payload.utm` 由前端送出、
   伺服器原樣存，不要當成已驗證的資料。`sourcePage` 只有前端沒送時才由伺服器補 `/group-booking`。
4. **舊名單可能有現在已不在清單裡的值**：選項停用後，舊名單的值不會變（2026-11-14 起停用的會留在 `retiredOptions`／`context.retiredVariants`，在那之前的沒有）。例如亞培（`?v=abbott`）、南山（`?v=nanshan`）兩個團課變體 2026-09-11 已刪除。在那之前從這兩個變體送出的名單（若有）會帶 `payload.company`（`亞培`／`南山`），`payload.leadSource` 通常是 `LINE`／`網站`，但網址帶 `?src=` 時是那個值（`?src=` 優先）；而且得知管道被隱藏，`payload.source` 是 `[]`。
   2026-09-11 之後用舊連結（`?v=abbott`／`?v=nanshan`）送出的名單，`payload.formVariant` 仍是 `abbott`／`nanshan`，但 `payload.company` 是 `null`、得知管道正常填寫。
   **判斷合作公司要看 `payload.company`，不要看 `formVariant`**；也不要拿 `leadSource` 反推是哪個變體。其他舊形狀見第 5 節「舊名單的不同形狀」。
5. **名單沒有記錄當時的 config 版本**。要判斷名單是哪一版表單填的，只能看 `createdAt`。
6. **不要寫入 `formSchemas`**：官網只在 `contentHash` 不一致時才重寫（重寫時整份覆蓋）。改了其他欄位（例如 `schemaJson`）卻沒改 `contentHash`，錯的內容會一直留著，CRM 自己也會讀到錯的。
7. **官網的現況不是規格**，Hub 不要照做。例如官網伺服器 log 目前會印出名單 id、姓名、手機、課程、分店，
   那是官網的行為；**Hub 的 log 不記個資**（要追查時記名單的文件 id 即可）。
8. **名單含健康資料**：`payload.medicalHistory`（疾病、舊傷或開刀史，自由文字）；另外備註（頂層 `message` 與 `payload.note`，同值兩份）的提示字（不在 config 裡）舉的例子包含「特殊身體狀況備忘」，
   也要當成可能含健康資料處理（同步、顯示、寫 log 時比照 `medicalHistory`）。
   只同步營運真正需要的欄位。名單用途要跟填表時告知的目的一致：送出鈕下方寫的是
   「送出即表示同意我們以電話或 LINE 與你聯繫確認開課梯次，個人資料僅用於此報名目的。」
   （這句不在 config 裡），官網隱私權政策也寫明只在特定目的範圍內利用。
   超出這個用途（例如行銷、會員經營、名單合併）前，先跟官網方確認。

---

## 7. 版本與變更

| 變動 | `contentHash` | `schemaVersion` | Hub／CRM 要做什麼 |
|---|---|---|---|
| 改題目文字（`label`、`labelSuffix`）或段落標題、新增選項、改選項的畫面文字、改課程價目、改 `store.compose`／`store.alsoWrites`／隱藏欄位的說明文字 | 會變（題目文字、段落標題與說明文字需官網維護者同步更新 JSON 才會變；選項與價目有建置檢查，見文末附錄「官網這邊怎麼確保 config 正確」） | 不變 | 不必改程式；照新 config 顯示即可 |
| 只改不在 config 裡的東西：提示字、錯誤訊息、必填或顯示條件、按鈕與頁面文字、送出後的畫面與信件、同意事項、官網內部的說明（預約、團課表單另有得知管道第二層的細項與預設清單） | **不變**（文件不會重寫） | 不變 | 不必做什麼，Hub 看不到這些改動。其中影響解讀名單的（例如必填條件改了、某題常常沒填），官網會更新這份說明 |
| 官網調整放進 config 的範圍（例如 2026-11-14 加了 `leadType`、改成只放解讀名單需要的部分，見第 1 節「什麼時候會更新」） | 會變（三張表單各變一次） | 不變（每一題的位置、型別、存的值與代號由建置檢查保證不變） | 不必改程式；只讀第 3 節列出的 key，看到沒列的 key 略過 |
| 停用選項、下架網址變體或合作方 | 會變（從 `options` 移到 `retiredOptions`、從 `context.variants` 移到 `context.retiredVariants`…） | 不變 | 不必改程式；可選清單只讀 `options`，解讀舊名單時連 `retiredOptions`、`context.retired*` 一起查（第 3 節） |
| 下架整張表單 | 變一次（文件保留，內容只多了頂層 `retiredOn`；之後不再變） | 不變 | 照常用它解讀舊名單；之後不會再有這個 `type` 的新名單（第 1 節「下架的表單」） |
| 重新上架 | 變一次（`retiredOn` 拿掉） | 不變 | 不必改程式 |
| 欄位（含隱藏欄位）改名或刪除、`store.path`／`valueType` 開頭的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變、值的存法改變（例如字串改布林） | 會變 | **升版** | 官網會先通知，Hub／CRM 調整後再上線。升版也不會拿掉記錄過的值（同一個 key 之後也不會拿來存別的東西） |

> 2026-11-14 起，題目或隱藏欄位刪除或改 `key`、`store.path` 或存的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變卻沒升 `schemaVersion`，或記錄過的值與代號消失或改字（升了版也一樣），官網建置都會失敗；所以升版不代表舊名單的值會從 config 裡消失（Hub 可以依賴的保證見第 3 節「選項的 value 與 label」）。
> 檢查看不到的改動（例如值的格式改了，像日期改寫法；或必填條件改變，這不在 config 裡、`contentHash` 也不會變）要不要升版，仍是官網維護者**人工判斷**；上表是目前的約定，不是保證（檢查的範圍與限制見文末附錄「官網這邊怎麼確保 config 正確」）。
> 2026-11-14 以前沒有這個檢查（分店、與學員的關係、性別在 2026-08-24，得知管道在 2026-09-20 改過；團課變體 `abbott`、`nanshan` 在 2026-09-11 刪除，見第 5、6 節），
> 那時停用的選項與變體直接從 config 消失、不在 `retiredOptions`／`context.retiredVariants` 裡，舊名單的值對不到時照原值顯示。

建議 Hub／CRM 讀取時檢查 `schemaVersion`，遇到沒處理過的版本就告警，不要直接套用。
但 `schemaVersion` 沒變不保證所有值都對得上，對不到選項的值一律照原值顯示。

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
| config 裡的 key | 有 `store.map`、`other`、欄位層級的 `optionsSource`（分店）、`context.freeTrialPartners`；`store.alsoWrites` 只有 `source` 一題（一個元素） | 沒有前四種；多了 `options[].price`；`store.alsoWrites` 有 `store`（兩個元素）、`note`（一個元素）兩題。兩張的 `store.alsoWrites` 都一律是陣列 |

**相同的地方**：`name`、`gender`（同 key、同值 `男`／`女`，只是畫面一個是下拉、一個是單選）、`relationship`（同 key、同選項、同樣的「練健康同仁」規則；2026-08-24 以前的團課舊名單是自由文字，見第 5 節）、得知管道的選項清單與「主選項: 細項」組字方式、隱藏欄位的四個 key（`formVariant`、`company`、`leadSource`、`utm`）。

第 0 節那種完全照 config 解讀的程式可以三張共用；但自己寫死欄位的解析（例如依某個欄位篩選、統計）時，建議依 `type` 分開寫：先看 `type`，再決定讀 `filledBySelf` 還是 `isFillerSelf`、`sources` 還是 `source`、`preferredTime` 當陣列還是字串。

---

## 附錄：官網這邊怎麼確保 config 正確

> 這一節是官網維護者那邊的檢查，**Hub 串接用不到**：Hub 可以依賴的結論已經寫在正文（第 1 節「名單 type 對 config 文件 id」、第 3 節「選項的 value 與 label」、第 7 節）。
> 想確認某個保證的範圍、或某個改動為什麼會（或不會）升版時再查。
> 以下檢查都在官網建置時跑（`scripts/check-form-schemas.mjs`，2026-11-14 起），不符合就建置失敗，有問題的版本不會部署出去。
> 檢查的對象是官網 repo 裡的描述檔（`docs/form-schema/group-booking.json`）；下面提到的 `submit`、`detail`、`showIf`、`required`、`store.whenHidden`、
> `messagePlaceholder`、備用分店的地址電話只在描述檔裡，**不在 Hub 讀到的 config**（第 3 節「不在 config 裡的東西」）。

### 名單 `type` 與寫入名單的程式

- 名單 `type` 的型別宣告（`server/utils/leads.ts` 的 `CreateLeadInput.type`）每一個值都要有 `leadType` 相同的 config（只有 `franchise` 例外）。
- `server/` 底下每個呼叫 `createLead(` 的地方，都要直接傳物件字面值，最外層有一個寫成字面值的 `type`（例如 `createLead({ type: 'group_class', … })`；不能用簡寫、變數或展開），而且這個值要在 `CreateLeadInput.type` 裡、有 config，那張表單也不能已下架。`createLead` 也不能換名字（匯入時改名，或指派給別的變數）。
- 每張沒下架的表單，描述檔的 `submit.endpoint`（不在給 Hub 的 config 裡）對應的檔案（本表單是 `POST /api/leads/group-class` → `server/api/leads/group-class.post.ts`）要存在、要呼叫 `createLead`，而且只寫這張表單的 `leadType`。
- `server/` 底下的程式檔（`.ts`、`.js` 這類），程式碼碰到 `leads` 集合（`collection('leads')`、`doc('leads/…')`，先把 `'leads'` 存成常數再用也算；讀或寫都算）就建置失敗。
  例外只有：`server/utils/leads.ts` 裡的 `createLead` 本身、後台 API（`server/api/admin/`），以及列在檢查允許清單裡的檔案（只給只讀不寫的檔案、要寫明原因；目前是空的）。`server/` 以外的檔案不在這道檢查範圍內。
- 每份 config 都要有 `leadType`，所有 config（含已下架的）的 `leadType` 不能重複。
- `docs/form-schema/` 裡的 JSON 要跟官網的同步清單一致（每份 JSON 都會挑出給 Hub 的部分同步到 Firestore，含已下架的），沒下架的 JSON 也都要有對應的選項比對。

### 跟官網程式比（現況）

- 選擇題的 value、順序、label 要跟官網程式一致；課程（`course`）連價目（`price`）也比。
- 得知管道（`source`）第二層的展開方式、提示字與預設選項要跟官網程式一致（這部分只在官網 repo 的描述檔裡，不在給 Hub 的 config）。
- 網址變體（`context.variants`）的代號與設定值（`company`、`leadSource`、`extraSources` 等）要跟官網程式一致。
- 頁面上綁定的每個輸入欄位都要是 config 的一題（不存進名單的輸入框要在檢查裡另外列出、寫明原因），所以頁面新增題目卻沒寫進 config 會建置失敗。
- 這道檢查只比現況、不跟上一版比：程式與 JSON 一起改就過得了。「記錄過的值不能消失」靠下一段的記錄比對。

### 給 Hub 的 config 沒有漏東西

Firestore 上的 config 是從描述檔（`docs/form-schema/group-booking.json`）用白名單挑出來的（`server/utils/form-schemas.ts` 的 `toHubView`）。
檢查拿同步時真正會寫進 Firestore 的內容跟描述檔比：

- 每一題與每個隱藏欄位的 `key`、`store.path`、型別、`store.alsoWrites`，存進名單的值（選項值、`retiredOptions`、`store.possibleValues`、`store.map` 對照後的值），
  `leadType`、網址變體與合作方代號，都要跟描述檔一樣（跟下一段記錄檔記的是同一組東西）。
- 段落的 `id` 與 `title`，每一題的 `label` 與 `labelSuffix`，選項、停用選項與備用分店的 `value` 與 `label`，也都要跟描述檔一樣。
- 同步的表單清單要跟 `docs/form-schema/` 裡的 JSON 一樣。

白名單改壞了（例如漏了選項的 `label`）建置就失敗，Hub 不會讀到缺了這些東西的 config。
題型 `type`、課程價目 `price`、`store.compose`、`other`、`store.valueType` 型別字後面的說明文字、變體與合作方的設定值、隱藏欄位的說明文字不在這道比對裡，但白名單有列，照描述檔原樣放進 config。
白名單以外的 key（第 3 節「不在 config 裡的東西」）不檢查，因為本來就不給 Hub。

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
上面這串裡，`messagePlaceholder`、提示字、錯誤訊息、顯示與必填條件、隱藏時存什麼、得知管道的第二層、備用分店的地址電話只在官網 repo 的描述檔裡，不在給 Hub 的 config；題目文字、選項的 `label`、課程價目、變體與合作方的設定值、內建備用分店的代號與名稱則在 config 裡。

### 檢查的限制

- 送出端點（`server/api/leads/*.post.ts`）實際把值存在名單的哪個 key、有沒有轉換，檢查比對不到：`store.path` 是官網維護者人工跟程式同步的。
- 檢查看不到的不相容改動（例如型別字沒變、但值的格式改了，像日期改寫法）要不要升版，仍是官網維護者**人工判斷**；升版本身是否恰當、升了版之後改得對不對，檢查也不管。
- 題目文字與段落標題不跟程式比，是人工維護的，少數情況可能比線上畫面慢一步。
- 這份說明裡標明「不在 config 裡」的內容（必填與顯示條件、名單的欄位清單、伺服器驗證、隱藏欄位與網址參數的行為、第二層細項…）是人工整理的官網現況，檢查不會比對。
- 記錄檔是 repo 裡的檔案，有人手動改它還是繞得過去；這道檢查防的是疏忽，不防故意。所以第 7 節的表是目前的約定，不是保證。
