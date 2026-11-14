# Hub／CRM 讀取「合作洽詢」表單 config 說明

> 對象：Hub／CRM（同一個 Firebase 專案；前端是 Firebase Hosting 靜態 SPA，後端是 Cloud Run 的 `lkkhubapi`／`lkkcrmapi`）的開發者
> 環境：**lkkdev（測試）**；正式站 lkkprod 上線後路徑相同、只換專案（lkkprod 目前還沒有這份文件，正式站發版後才會出現）
> 更新：2026-11-14

練健康官網 `/cooperation`「合作洽詢」表單裡**解讀名單需要的定義**（段落、題目、選項、存進名單的位置與存法、隱藏欄位），
已經放在 Firestore，Hub／CRM 直接讀即可。**這份 config 是唯讀的**：由官網自動維護，Hub／CRM 不要寫入。

> 2026-11-14 起，Firestore 上的 config 是官網用白名單從描述檔（官網 repo 裡的完整表單定義）挑出來的版本，只留解讀名單用得到的 key（第 3 節）。
> 提示字、錯誤訊息、必填與顯示條件、送出流程、同意事項、頁面文案、官網內部的注意事項都**不在 config 裡**；
> 其中解讀名單時還用得到的（例如某一題為什麼常是空的、伺服器檢查了什麼、哪些值沒有經過驗證），直接寫在這份說明裡，並標明「不在 config 裡」。

> 名稱：頁面、通知信、後台都叫「合作洽詢」，內部有時說「合作洽談」，指的是同一張表單。
> 程式裡的代號一律是 `cooperation`。

**先看第 0 節「怎麼用」**：照四個步驟就能把一筆名單轉成「題目：答案」顯示出來。
第 1 節以後是參考資料（文件在哪、欄位意思、config 結構、名單的存值細節與舊名單、權限、版本規則），遇到時再查。
官網這邊怎麼確保 config 正確，放在文末附錄「官網這邊怎麼確保 config 正確」，串接用不到。

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

- 這張表單沒有分店題（config 裡沒有 `optionsSource`，名單的 `storeId` 固定是 `null`），不會用到 `storeName`（傳 `(v) => v` 即可）。
- 這張表單沒有布林題，也沒有「主選項: 細項」的組合值，`labelOf` 只會用到第 2、4 步；經表單送出的名單不會命中第 1、3 步，留著無妨（只有直接呼叫 API 寫入、剛好是「選項值: 文字」的值，才會被第 3 步拆開顯示）。

例：一筆「講座及課程邀約」的名單（假資料），轉出來的其中幾列：

```
{ section: '請選擇你的洽詢項目：', question: '請選擇你的洽詢項目：', value: '<表情符號> 講座及課程邀約' } // 實際輸出開頭是一個表情符號：選項的 label 就是這樣寫
{ section: '', question: '公司 / 單位名稱', value: '範例股份有限公司' } // 第二段 title 是 null，所以 section 是空字串
{ section: '', question: '規模人數', value: '50 人' }                   // 自由文字，原樣輸出
```

- 沒填的 `lineId`（`null`）會略過，不會出現在輸出裡。只打空白的欄位（見第 5 節「存值的細節」）不是空字串，會輸出一列空白的值；不想顯示可以先 `trim()` 再判斷。
- 舊名單的舊值（例如 `講座邀約`）對不到選項，輸出原值 `講座邀約`。

### 步驟四：遇到這些情況

| 情況 | 怎麼做 |
|---|---|
| 值對不到任何選項 | 照原值顯示。多半是舊名單用的舊選項（第 5 節「舊值：洽詢項目改過名」） |
| `schemaVersion` 是沒處理過的版本 | 告警，先不要自動套用（第 7 節） |
| config 裡沒有、名單裡卻有的欄位 | 名單可能比 config 舊或新，照原值顯示、不要丟掉 |
| 想顯示隱藏欄位（來源頁、UTM 等） | 見第 3 節「隱藏欄位（`hiddenFields[]`）」（這張表單只有 `sourcePage`、`utm`），位置一樣在 `store.path`；名單裡的樣子見第 5 節（含 `utm` 的形狀）。這些值由前端送出、伺服器沒驗證（第 6 節第 3 點） |
| config 的說明文字提到 config 裡沒有的 key | 那是官網完整描述檔裡的段落，不在 Firestore 的 config 裡，不用去找；內容整理在第 6 節第 1、2 點 |
| 某題在很多名單裡是空的、想知道什麼時候必填 | 必填與顯示條件不在 config 裡，見第 3 節「必填與顯示條件（不在 config 裡）」；沒填時存什麼見第 5 節「存值的細節」 |
| config 裡有第 3 節沒列的 key | 略過，不要拿來用。官網如果退回 2026-11-14 這次改動以前的版本，文件會暫時變回完整版本，多出 `conventions`、`submit` 等 key（第 1 節「什麼時候會更新」）；上面的程式兩種版本都能讀 |

> 上面步驟一到三的程式碼已經拿官網三份給 Hub 的 config（2026-11-14 白名單版本）與假資料實際跑過，例子裡的輸出就是實際跑出來的結果。

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
> - lkkprod 目前還沒有任何 `formSchemas` 文件（正式站還沒發版），正式站發版時 `leadType` 會一起出現。
> - 官網如果退回 `leadType` 出現以前的版本（dev 的 `a6cf8c0` 或更早），舊版會把文件整份重寫成沒有 `leadType` 的樣子，直到下一次發新版才補回來。
>
> 表上也沒有（`franchise`）才是真的沒有 config，照原值顯示。`franchise` 是刻意沒有 config 的名單 `type`（列在建置檢查的「沒有 config」清單）。
>
> Hub 可以依賴的是：官網現在會寫進 `leads` 的每一種 `type` 都有 config（`franchise` 已不再寫入），每個送出端點也只寫自己那張表單的 `leadType`；2026-11-14 起由官網建置檢查擋住，之後新增的表單不會沒有 config 就上線。檢查細節見文末附錄「官網這邊怎麼確保 config 正確」。

### 文件欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `formId` | string | `cooperation` |
| `leadType` | string | `cooperation`：這張表單寫進名單（`leads`）的 `type`。從 config 頂層的 `leadType` 抄過來（`schemaJson` 裡也有） |
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
- **lkkprod 在正式站第一次發版前不存在**這份文件，讀取前一定要檢查文件存在（見第 2 節）。
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
     lkkprod 目前還沒有這些文件，正式站第一次發版時直接寫入新的形狀。官網如果退回這次改動以前的版本，文件會再變回完整版本，直到下一次發新版。

> config 是從官網維護者手寫的描述檔（`docs/form-schema/cooperation.json`，官網 repo 裡）挑出來的：同步時只留第 3 節列出的 key，其他留在官網 repo。描述檔不是從頁面自動產生的。
> 選項（value、label、順序）由建置檢查保證跟官網程式一致；
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

`JSON.parse(schemaJson)` 之後的頂層只有下面這些 key（給 Hub 的版本：官網從描述檔用白名單挑出解讀名單需要的部分）：

| key | 內容 |
|---|---|
| `formId`、`leadType`、`schemaVersion` | 同第 1 節「文件欄位」 |
| `retiredOn` | 只有下架的表單才有（第 1 節「下架的表單」）。本表單沒有 |
| `sections` | 段落陣列，順序就是畫面上的順序；每段是 `{ id, title, fields }`，`title` 是段落標題（可能是 `null`），`fields` 是這一段的題目（見下方「欄位一覽」與「讀題目與選項：用哪些 key」）。本表單分兩段，第二段的 `title` 是 `null`。 |
| `hiddenFields` | 使用者看不到、但會存進名單的值，見下方「隱藏欄位」。本表單只有 `sourcePage`、`utm` |
| `context` | 網址參數帶來的代號與設定值：現行的在 `variants`（`?v=` 網址變體）、`freeTrialPartners`（`?co=` 免費合作方），下架的代號移到 `retiredVariants`、`retiredFreeTrialPartners`；沒有的就不出現。**本表單不讀網址參數，沒有這個 key** |

### 不在 config 裡的東西

config 裡只有本節各表列出的 key。描述檔（`docs/form-schema/cooperation.json`）是官網自己用的完整表單定義，其他 key 同步到 Firestore 時刻意不放，例如：

- 頂層：`describes`、`sourceOfTruth`、`conventions`（閱讀規則與條件寫法）、`submit`（送出流程與伺服器驗證）、`consent`（同意事項）、`derived`、`record`（名單的欄位清單）、`requestBody`、`pageCopy`、`hiddenFieldsTrust`、`knownQuirks`、`crossFormDifferences`、`differencesFromBooking`（不是每張表單都有）；`context` 裡的 `description`、`params`、`variantProperties` 這類說明。
- 每一題：`placeholder`、`required`、`errors`、`validation`、`showIf` 與其他條件（`lockedBy`、`optionRules`、`valueRules`…）、`hint`、`picker`、`min`／`max`、`default`、`labelSuffixWhenOptional`、`knownIssue` 這類；段落的 `titleNote`。
- 選項：`showIf`、`note`、`detail`（第二層選單）、`messagePlaceholder` 這類；`store`：`note`、`empty`、`whenHidden`、`fallback`、`order`、`normalized`、`serverShape` 這類；`optionsSource`：`afterSelectShow`、`filter`、`order`、`note`，以及備用分店的地址電話；隱藏欄位：`capture`、`note`，以及 `store` 裡 `path` 以外的 key。

不放的原因：Hub 解讀名單用不到，而且只改這些時 `contentHash` 不會變，Hub 不會因為改了一句提示字就多存一個版本。
其中解讀名單時還用得到的，寫在這份說明裡並標明「不在 config 裡」，位置見下表。
官網退回舊版時這些 key 可能暫時出現（第 1 節「什麼時候會更新」）；**不要寫程式讀它們**。官網之後如果多放 key 進來，第 0 節的程式也不受影響；看到本節沒列的 key 略過即可。

| 資訊（描述檔裡的 key） | 現在寫在哪 |
|---|---|
| 哪些題目什麼時候必填、為什麼常常沒填（`required`） | 下方「必填與顯示條件（不在 config 裡）」 |
| 沒填時存 `null` 還是空白字串（`store.empty`） | 第 5 節「存值的細節」 |
| 名單有哪些欄位、哪些固定是 `null`（`record`） | 第 5 節開頭的表 |
| 伺服器檢查了什麼、沒檢查什麼，含隱藏欄位沒有驗證（`submit`、`hiddenFieldsTrust`） | 第 6 節第 1～3 點 |
| 現況的怪異行為：電話存原值、切換洽詢項目不清空等（`knownQuirks`） | 第 5 節「存值的細節」、第 6 節 |
| 跟預約表單的差異（`crossFormDifferences`） | 第 5 節「跟預約表單不一樣的地方」 |
| 默示同意的文字（`consent`） | 第 6 節第 10 點 |

### 欄位一覽（`sections[].fields[]`）

「必填」欄是官網畫面的規則，**不在 config 裡**（細節見下方「必填與顯示條件」），列在這裡是為了說明名單裡為什麼會是空的。

| key | 題目（`label`） | 類型（`type`） | 必填（官網規則，不在 config 裡） | 存在名單的位置（`store.path`） | 存的型別 |
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

config 裡每一題只有 `key`、`label`、`labelSuffix`（只有 `lineId`）、`type`、`store`（`path`，部分題目有 `valueType`），洽詢項目另有 `options`。
「存的型別」欄的 `null` 與自由文字說明是官網現況，config 只寫了其中一部分（見下表 `store.valueType`）。

### 必填與顯示條件（不在 config 裡）

下面是官網畫面現在的規則，只用來理解名單裡的空值與自動帶入的值。規則可能隨時改、不升版，`contentHash` 也不會變；名單也沒有記錄填表當下的規則，Hub 不要拿它驗證名單（伺服器實際擋了什麼見第 6 節）。

- `companySize`（規模人數）、`budgetRange`（預算區間）：洽詢項目是「講座及課程邀約」時必填，其他兩項時選填（畫面題目後面顯示半形 `(選填)`）。
  所以選「採訪邀約」「異業合作」的名單，這兩題常常是 `null`；反過來，這兩題有值**不代表**洽詢項目是講座（第 5 節「存值的細節」）。
- `lineId` 選填；其他題目都必填。
- **沒有任何題目會被隱藏**：所有題目一直顯示，所以不會有「因為沒顯示而沒填」的情況。

### 讀題目與選項：用哪些 key

**位置**：`schema.sections[]`（段落）→ `section.fields[]`（每一題）。

- 第一段 `id` 是 `enquiry-type`，`title` 跟題目相同（`請選擇你的洽詢項目：`）。
- 第二段 `id` 是 `contact`，**`title` 是 `null`**（畫面上沒有分區標題），要顯示段落標題的話自己處理空值。

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

- `key` 跟名單欄位名稱都一樣，但頂層或 `payload` 要看 `store.path`：頂層是 `name`、`phone`、`email`、`message`，其他在 `payload`。
- `labelSuffix`：只有 `lineId`：`(選填)`（**半形括號**，預約、團課表單是全形`（選填）`）。畫面上 `label` 與補充之間有一個空格。`companySize`、`budgetRange` 畫面上有時也顯示 `(選填)`，那是依洽詢項目切換的，不在 config 裡（見上方「必填與顯示條件」）。
- `type`：`tabs`（洽詢項目，三顆並排按鈕）、`text`、`tel`、`email`、`textarea`。
- `store.valueType`：只有 `cooperationType`、`companySize`、`budgetRange` 有寫，**而且是 `string` 後面接說明文字**（例：`string（自由文字，不是選項）`），判斷型別要用 `startsWith('string')`。`cooperationType` 經 API 直接寫入時可能是任意值，見第 6 節第 1、2 點。沒寫 `store.valueType` 的題目存的都是字串。
- 沒填時存什麼不在 config 裡：`lineId`、`companySize`、`budgetRange` 完全沒打字是 `null`，只打空白是空白字串（第 5 節「存值的細節」）。
- `options`：只有洽詢項目 `cooperationType`，三個選項都有寫 `label`，每個選項只有 `value`、`label`。`retiredOptions` 目前沒有。
- 沒有 `store.map`（沒有布林欄位）、`store.possibleValues`、`store.compose`、`store.alsoWrites`、`optionsSource`（不用讀 `stores` 或 `settings/referralOptions`）、`other`。預約、團課表單得知管道那種第二層選單本來就不在 config 裡（第 4 節），這張表單也沒有那題。

三個選項（依畫面順序）：

| `value`（名單存的字） | `label`（畫面上的字） | 備註（官網畫面行為，不在 config 裡） |
|---|---|---|
| `講座及課程邀約` | 表情符號＋空格＋`講座及課程邀約` | 預設選中；選這項時規模人數、預算區間改必填 |
| `採訪邀約` | 表情符號＋空格＋`採訪邀約` | |
| `異業合作` | 表情符號＋空格＋`異業合作` | |

- 三個 `label` 都是「一個表情符號＋半形空格＋`value`」。Hub／CRM 不想顯示表情符號的話，直接顯示 `value` 即可，意思完全相同。
- 這題是分頁按鈕，預設選中 `講座及課程邀約`，沒有「未選」狀態，經表單送出的名單一定是三個值之一（直接呼叫 API 的例外見第 6 節第 2 點）。
- 選不同洽詢項目時，「合作內容詳情」的提示字會跟著換，但提示字不存進名單、也不在 config 裡，Hub 用不到。
- 切換洽詢項目**不會清空**規模人數、預算區間、合作內容詳情（第 5 節「存值的細節」）。

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
- **Hub 可以依賴的保證**（2026-11-14 起由官網建置檢查強制）：
  - 記錄過的值（選項值）**不會從 config 消失或改字，升 `schemaVersion` 也一樣**。
    停用的選項會移到同一題的 `retiredOptions`；改字＝停用舊的＋新增新的。同一個值不會同時出現在現行與停用清單。
  - 題目或隱藏欄位刪除或改 `key`、`store.path` 或存的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變，**一定會升 `schemaVersion`**（第 7 節）。
  - 例外：題目整題被升版刪除後，config 裡就沒有這一題了，舊名單的這個值照原值顯示。
  - 題目文字、選項的 `label`**不在這道保護內**，可能隨時改、不升版（改了 `contentHash` 會變），所以 Hub 轉存時要存原始值（見第 2 節「快取與轉存」）。
    提示字、必填條件不在 config 裡，改了 Hub 也看不到（第 3 節「必填與顯示條件」是這份說明更新時的現況）。

  檢查怎麼做、記錄了哪些東西、擋不到什麼，見文末附錄「官網這邊怎麼確保 config 正確」。
- 2026-11-14 以前改過：洽詢項目在 2026-08-24，值與意思都變過，見第 5 節「舊值」。
- **2026-11-14 起停用的選項不會再從 config 消失**，而是移到同一題的 `retiredOptions`（見上面「選項」表），舊名單的值查得到意思。
  **更早消失的值不在 `retiredOptions` 裡**（第 5 節的三個舊值就不在 config 裡），所以舊名單的值仍可能兩邊都對不到，照原值顯示，不需要對照表。
  對不到的值分不出「2026-11-14 以前停用的正式選項」和「直接呼叫 API 寫進來的值」；只有在需要區分這兩種時（例如做資料品質報表），才需要 Hub／CRM 自己保存這份清單，至少包含第 5 節的三個舊值，而且不要自動對應到新值。

### 隱藏欄位（`hiddenFields[]`）

使用者看不到、但會存進名單的值。每一項可能有的 key：

| key | 說明 |
|---|---|
| `key` | 隱藏欄位的代號 |
| `value` | 值從哪裡來的**說明文字**，不是名單裡的值，不要拿它當預設值（只有 `sourcePage` 的值剛好就是頁面路徑） |
| `valueType` | 只有型別特殊時才有（例：`formVariant` 是 `string \| string[] \| null` 加說明文字） |
| `shape` | 只有物件才有（例：`utm` 物件裡每個 key 的說明） |
| `store.path` | 名單裡的位置 |

本表單有兩個：

| `key` | 名單位置 | 從哪裡來 |
|---|---|---|
| `sourcePage` | 頂層 `sourcePage` | `value` 是 `/cooperation`；前端送什麼存什麼，沒送時伺服器補 `/cooperation` |
| `utm` | `payload.utm` | cookie `lkk_utm`，沒有是 `null`；`value` 是說明文字（`cookie lkk_utm（保存 30 天），送出當下讀取`），物件的欄位見 `shape` 與第 5 節 |

以下不在 config 裡：

- 這兩個值都由前端送出、伺服器原樣存，**沒有驗證**（見第 6 節第 3 點）。名單裡實際的樣子見第 5 節。

---

## 4. 不在 config 裡、要另外讀的動態選項

**題目的動態選項：這張表單沒有。** 洽詢項目的三個選項寫死在官網程式裡，config 的 `options` 就是全部。
不用讀 `stores`（名單的 `storeId` 固定是 `null`），也不用讀 `settings/referralOptions`（沒有「從哪裡得知」這題）。
預約、團課表單的得知管道有一層業主可在後台改的第二層選單，那份選項不在 config 裡，只在預約、團課的讀取說明有描述；這張表單沒有那題，不用處理。

### 選配：把代碼轉成中文

下面兩組對照不在 config 裡，要不要做由 Hub 決定；不做就顯示原始代碼，跟官網後台現況一樣。

- **UTM 活動名稱**：`payload.utm.campaign` 可以用 `campaigns` 集合的 `utmCampaign` 欄位對到活動名稱 `name`。
  後台可以改活動代號、也可以刪除活動，所以舊名單可能對不到，對不到就顯示原始代號。官網後台的名單頁自己也只顯示代號。
  後台存的代號一律是小寫；名單裡的值是網址上的原字（只去掉前後空白、不轉小寫），比對前可以先轉小寫。
- **名單狀態 `status` 的中文**：`new` 新名單、`contacted` 已聯繫、`scheduled` 已預約、`completed` 已完成、`cancelled` 已取消。
  以官網 `composables/useLeadStatus.ts` 為準；config 裡沒有名單狀態（狀態是後台處理名單用的，不是表單的題目）。

---

## 5. 對照名單（`leads` 集合）

合作洽詢的名單在 `leads`，`type == 'cooperation'`。下表是現行版本寫入的欄位。
config 不含名單的欄位清單（完整描述檔的 `record` 沒有同步），以這張表為準；各題與隱藏欄位的位置也可以從 config 的 `store.path` 得到，但 `type`、`status`、固定是 `null` 的欄位只寫在這裡。

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

- 上表的 `payload` 是**現行版本會寫的 key**。較舊的名單可能**缺 key**（缺少與 `null` 同等處理），
  也可能**多出上表沒列的 key**（忽略，不要報錯）。例如 lkkdev 若有舊版網站時期的名單（見下方「舊值」），`payload` 沒有 `utm` 這個 key。
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
  要比對或去重複，請先去掉**所有空白字元**（含全形空白、tab、換行；伺服器驗證時就是用 JS 的 `\s` 去掉的，存的仍是原值）以及橫線再比，例如 `phone.replace(/[\s-]/g, '')`。只去半形空白的話，含全形空白的號碼會對不起來。驗證規則的市話分支也會讓 9 碼、11 碼的 `09` 開頭數字通過（例如 `091234567`、`09123456789`），手機寫成 `0912-345-678` 反而會被擋，所以名單上的電話不一定是有效號碼。
- **切換洽詢項目不會清空已填的欄位**：使用者先在「講座及課程邀約」填了規模人數、預算區間，再切到「採訪邀約」送出，名單仍會有這兩個值。
  所以 `companySize`、`budgetRange` 有值**不代表**洽詢項目是講座；要以 `payload.cooperationType` 為準。
- **規模人數、預算區間是自由文字**，不是數字也不是選項（畫面提示字是「例如：50 人、100-200 人」「例如：5 萬以下、5-10 萬、10 萬以上」，提示字不在 config 裡），要統計的話得自己解析。
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

同時串三張表單時最容易搞混的地方（config 不含跨表單的差異清單，以這張表為準）：

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
| `sourceChannel` | 得知管道以「, 」串成的字串；被變體隱藏時是空字串 `''`（詳見預約表單的讀取說明） | 固定 `null` |
| 得知管道、變體 | 有 `payload.sources`、`formVariant`、`leadSource` | **都沒有** |
| 布林欄位 | `filledBySelf`、`hasMedicalCondition` | 沒有 |
| 同意事項 | 七條＋勾選框（沒存） | 一句默示同意（沒存） |
| `store.valueType` 的寫法 | 代號（`boolean`、`string[]`） | 說明文字（`string（…）`） |
| `labelSuffix` 的括號 | 全形`（選填）` | 半形`(選填)` |

---

## 6. 注意事項

送出流程、伺服器驗證、已知的怪行為這些**不在 config 裡**（只留在官網 repo 的描述檔），跟解讀名單有關的整理在這一節。

1. **伺服器只驗證少數欄位**：公司／單位、聯絡人、電話、Email、合作內容詳情、洽詢項目必填；洽詢項目剛好是字串 `講座及課程邀約` 時，規模人數與預算區間也必填；
   電話（去掉所有空白後）要符合 `^(09\d{8}|0\d{1,2}-?\d{3,4}-?\d{4})$`；Email 要符合 `^[^\s@]+@[^\s@]+\.[^\s@]+$`。
   必填只看「是不是真值」，不去空白、**不檢查型別**。
2. **其他都不檢查**：`cooperationType` 是不是三個選項之一（任意字都會存）、`lineId`、各欄長度、`sourcePage`、`utm` 內容。
   直接呼叫官網 API 可以寫入任意值，甚至非字串（數字、陣列、物件），所以 Hub／CRM 處理名單時，**不要假設值一定在選項清單裡，也不要假設一定是字串**。
   例如：除了電話（非字串會讓伺服器出錯、寫不進去），任何真值都會通過必填並原樣存入；Email 是轉成字串後比對，所以陣列 `["a@b.co"]` 也會過、以陣列存入；
   `cooperationType` 不是字串時（例如 `["講座及課程邀約"]`）不會觸發規模人數與預算區間的必填。
3. **隱藏欄位沒有驗證**：`sourcePage`、`payload.utm` 由前端送出、伺服器原樣存，不檢查內容、型別與長度。不要當成已驗證的資料。
4. **沒有驗證碼、沒有頻率限制、沒有重複送出保護**（只有前端按鈕送出中停用）。可能出現重複名單或垃圾名單。
5. **舊名單可能有現在已不在清單裡的值**：2026-11-14 以後停用的在 `retiredOptions` 查得到，更早的（見第 5 節「舊值」）查不到。
6. **名單沒有記錄當時的 config 版本**。要判斷名單是哪一版表單填的，只能看 `createdAt`。
7. **不要寫入 `formSchemas`**：官網只在 `contentHash` 不一致時才重寫。改了其他欄位（例如 `schemaJson`）卻沒改 `contentHash`，錯的內容會一直留著，Hub／CRM 自己也會讀到錯的。
8. **config 哪些有程式保證、哪些是人工維護**：洽詢項目的選項（value、label、順序）由建置檢查保證跟官網程式一致；
   記錄過的值不會從 config 消失或改字（停用的在 `retiredOptions`），結構改動一定會升 `schemaVersion`（見第 3 節「選項的 value 與 label」）；
   給 Hub 的白名單版本跟完整描述檔的位置、型別、值、段落、題目與選項文字一樣，也由建置檢查保證。
   題目文字是人工維護，少數情況可能比線上畫面慢一步。這份說明裡寫的必填條件、伺服器規則、存值細節也是人工整理的官網現況。檢查細節見文末附錄「官網這邊怎麼確保 config 正確」。
9. **這份說明寫到的官網行為是現況，不是規格**，Hub 不要照做。
   例如官網伺服器 log 目前會印出名單 id、聯絡人姓名、公司／單位、洽詢項目，寄確認信時另外印出填表者 Email；**Hub 的 log 不記個資**（要追查時記名單的文件 id 即可）。
10. **名單是個資，只同步營運真正需要的欄位**：這張表單沒有健康欄位（不像預約與團課表單），但有聯絡人姓名、電話、Email、LINE ID 與自由文字的合作內容詳情。
    名單用途要跟填表時告知的目的一致：送出鈕下方寫的是「送出即代表你同意本網頁資訊將僅作為商務對接與回覆洽詢使用。」（這句不在 config 裡，也沒有存進名單），
    隱私權政策（`/privacy`）也寫明只在該特定目的範圍內利用、非經書面同意不用於其他用途。
    Hub 若要拿名單做超出「商務對接與回覆洽詢」的事（例如行銷、跟其他名單合併），請先跟官網方確認。

---

## 7. 版本與變更

| 變動 | `contentHash` | `schemaVersion` | Hub／CRM 要做什麼 |
|---|---|---|---|
| 改題目文字（`label`、`labelSuffix`）或段落標題、新增選項、改選項的畫面文字、改 `store.valueType` 的說明文字 | 會變（題目文字、段落標題與說明文字需官網維護者同步更新 JSON 才會變；選項有建置檢查，見文末附錄「官網這邊怎麼確保 config 正確」） | 不變 | 不必改程式；照新 config 顯示即可 |
| 只改不在 config 裡的東西：提示字、錯誤訊息、必填或顯示條件、按鈕與頁面文字、送出後的畫面與信件、同意事項、官網內部的說明（預約、團課表單另有得知管道第二層的細項與預設清單） | **不變**（文件不會重寫） | 不變 | 不必做什麼，Hub 看不到這些改動。其中影響解讀名單的（例如必填條件改了、某題常常沒填），官網會更新這份說明 |
| 官網調整放進 config 的範圍（例如 2026-11-14 加了 `leadType`、改成只放解讀名單需要的部分，見第 1 節「什麼時候會更新」） | 會變（三張表單各變一次） | 不變（每一題的位置、型別、存的值與代號由建置檢查保證不變） | 不必改程式；只讀第 3 節列出的 key，看到沒列的 key 略過 |
| 停用選項、下架網址變體或合作方 | 會變（從 `options` 移到 `retiredOptions`、從 `context.variants` 移到 `context.retiredVariants`…） | 不變 | 不必改程式；可選清單只讀 `options`，解讀舊名單時連 `retiredOptions`、`context.retired*` 一起查（第 3 節） |
| 下架整張表單 | 變一次（文件保留，內容只多了頂層 `retiredOn`；之後不再變） | 不變 | 照常用它解讀舊名單；之後不會再有這個 `type` 的新名單（第 1 節「下架的表單」） |
| 重新上架 | 變一次（`retiredOn` 拿掉） | 不變 | 不必改程式 |
| 欄位（含隱藏欄位）改名或刪除、`store.path`／`valueType` 開頭的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變、值的存法改變（例如字串改布林） | 會變 | **升版** | 官網會先通知，Hub／CRM 調整後再上線。升版也不會拿掉記錄過的值（同一個 key 之後也不會拿來存別的東西） |

> 2026-11-14 起，題目或隱藏欄位刪除或改 `key`、`store.path` 或存的型別改變、`store.alsoWrites` 少寫一個位置、`leadType` 改變卻沒升 `schemaVersion`，或記錄過的值與代號消失或改字（升了版也一樣），官網建置都會失敗；所以升版不代表舊名單的值會從 config 裡消失（Hub 可以依賴的保證見第 3 節「選項的 value 與 label」）。
> 檢查看不到的改動（例如值的格式改了，像日期改寫法；或必填條件改變，這不在 config 裡、`contentHash` 也不會變）要不要升版，仍是官網維護者**人工判斷**；上表是目前的約定，不是保證（檢查的範圍與限制見文末附錄「官網這邊怎麼確保 config 正確」）。

建議 Hub／CRM 讀取時檢查 `schemaVersion`，遇到沒處理過的版本就告警，不要直接套用。
但 `schemaVersion` 沒變不保證所有值都對得上，對不到選項的值一律照原值顯示。

---

## 8. 聯絡

config 內容有疑問、或需要新增欄位與選項，請聯繫官網維護者。

---

## 附錄：官網這邊怎麼確保 config 正確

> 這一節是官網維護者那邊的檢查，**Hub 串接用不到**：Hub 可以依賴的結論已經寫在正文（第 1 節「名單 type 對 config 文件 id」、第 3 節「選項的 value 與 label」、第 7 節）。
> 想確認某個保證的範圍、或某個改動為什麼會（或不會）升版時再查。
> 以下檢查都在官網建置時跑（`scripts/check-form-schemas.mjs`，2026-11-14 起），不符合就建置失敗，有問題的版本不會部署出去。
> 檢查的對象是官網 repo 裡的描述檔（`docs/form-schema/cooperation.json`）；下面提到的 `submit`、`detail`、`showIf`、`required`、`store.whenHidden`、
> `messagePlaceholder`、備用分店的地址電話只在描述檔裡，**不在 Hub 讀到的 config**（第 3 節「不在 config 裡的東西」）。

### 名單 `type` 與寫入名單的程式

- 名單 `type` 的型別宣告（`server/utils/leads.ts` 的 `CreateLeadInput.type`）每一個值都要有 `leadType` 相同的 config（只有 `franchise` 例外）。
- `server/` 底下每個呼叫 `createLead(` 的地方，都要直接傳物件字面值，最外層有一個寫成字面值的 `type`（例如 `createLead({ type: 'cooperation', … })`；不能用簡寫、變數或展開），而且這個值要在 `CreateLeadInput.type` 裡、有 config，那張表單也不能已下架。`createLead` 也不能換名字（匯入時改名，或指派給別的變數）。
- 每張沒下架的表單，描述檔的 `submit.endpoint`（不在給 Hub 的 config 裡）對應的檔案（本表單是 `POST /api/leads/cooperation` → `server/api/leads/cooperation.post.ts`）要存在、要呼叫 `createLead`，而且只寫這張表單的 `leadType`。
- `server/` 底下的程式檔（`.ts`、`.js` 這類），程式碼碰到 `leads` 集合（`collection('leads')`、`doc('leads/…')`，先把 `'leads'` 存成常數再用也算；讀或寫都算）就建置失敗。
  例外只有：`server/utils/leads.ts` 裡的 `createLead` 本身、後台 API（`server/api/admin/`），以及列在檢查允許清單裡的檔案（只給只讀不寫的檔案、要寫明原因；目前是空的）。`server/` 以外的檔案不在這道檢查範圍內。
- 每份 config 都要有 `leadType`，所有 config（含已下架的）的 `leadType` 不能重複。
- `docs/form-schema/` 裡的 JSON 要跟官網的同步清單一致（每份 JSON 都會挑出給 Hub 的部分同步到 Firestore，含已下架的），沒下架的 JSON 也都要有對應的選項比對。

### 跟官網程式比（現況）

- 洽詢項目（`cooperationType`）的 value、順序、label、`messagePlaceholder`（只在描述檔裡）要跟官網程式一致。這張表單沒有得知管道、網址變體與分店，其他兩張表單另外比的那些項目不適用。
- 頁面上綁定的每個輸入欄位都要是 config 的一題（不存進名單的輸入框要在檢查裡另外列出、寫明原因），所以頁面新增題目卻沒寫進 config 會建置失敗。
- 這道檢查只比現況、不跟上一版比：程式與 JSON 一起改就過得了。「記錄過的值不能消失」靠下一段的記錄比對。

### 給 Hub 的 config 沒有漏東西

Firestore 上的 config 是從描述檔（`docs/form-schema/cooperation.json`）用白名單挑出來的（`server/utils/form-schemas.ts` 的 `toHubView`）。
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
  型別（`valueType` 開頭的型別字，例如 `boolean`、`string[]`；沒寫算 `string`，所以補寫 `string` 不算改變）、順帶寫入的位置（`store.alsoWrites`；這張表單沒有）。本表單共 9 題、2 個隱藏欄位。
- 存進名單的值：選項值（`options` 加 `retiredOptions`），連同 `store.possibleValues` 的值（這張表單沒有）。
  有 `store.map` 的題目記的是對照後存進名單的值，不是選項文字（這張表單沒有；預約表單的 `filledBySelf`、`hasMedicalCondition` 才有，記的是 `true`、`false`）。
- 網址變體代號（`context.variants` 加 `context.retiredVariants`）與免費合作方代號（`context.freeTrialPartners` 加 `context.retiredFreeTrialPartners`）（這張表單沒有變體與合作方）。

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
