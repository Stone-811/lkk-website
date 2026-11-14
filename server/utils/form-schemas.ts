// 三張表單的 schema（給 CRM 讀的表單定義），同步到 Firestore 的 formSchemas 集合。
//
// 正本：docs/form-schema/{booking,group-booking,cooperation}.json（跟著程式一起進版控）。
// 網站每台執行個體啟動時（發版、冷啟動、擴充），以及之後每 10 分鐘有請求時，
// 由 server/plugins/form-schema-sync.ts 呼叫 syncFormSchemas()：內容指紋跟 Firestore 上的一樣就跳過，不一樣才寫入。
// 所以 Firestore 裡的內容永遠等於「這個環境正在跑的那一版」——推 dev 寫 lkkdev、推 prod 寫 lkkprod。
//
// JSON 跟程式的選項有沒有對齊，由建置前的 scripts/check-form-schemas.mjs 檢查（不一致就建置失敗）。
//
// Firestore 文件：formSchemas/<formId>
//   formId         'booking' | 'group-booking' | 'cooperation'
//   leadType       這張表單寫進 leads 的 type（'booking' | 'group_class' | 'cooperation'），Hub 用它從名單找 config
//   schemaVersion  JSON 裡的 schemaVersion（欄位改名、存法改變這類不相容的改動才升）
//   contentHash    下面 schemaJson 的 sha256（同步用；只有白名單裡的內容變了才會變）
//   schemaJson     給 Hub 的版本（toHubView 白名單挑過）的 JSON 字串（Hub 讀了自己 JSON.parse）
//   syncedAt       寫入時間
//   revision       寫入的 Cloud Run revision（K_REVISION），查是哪一版寫的用
//   retiredOn      只有下架的表單才有：JSON 頂層的 retiredOn（'YYYY-MM-DD'）。下架的表單 JSON 留著、
//                  SOURCES 照樣列著，文件不刪（Hub 還要靠它解讀舊名單）。它也在 schemaJson 裡，所以加上它會改 contentHash
// 用字串存而不是 Firestore map：schema 裡有陣列中的陣列、條件物件等巢狀結構，
// Firestore 的 map 不收陣列裡直接放陣列，也會為每個欄位建索引；字串最單純，CRM 端也好解。
import { createHash } from 'node:crypto'
import booking from '~/docs/form-schema/booking.json'
import groupBooking from '~/docs/form-schema/group-booking.json'
import cooperation from '~/docs/form-schema/cooperation.json'

export const FORM_SCHEMA_COLLECTION = 'formSchemas'

const SOURCES: Record<string, unknown>[] = [booking, groupBooking, cooperation]

// 給 Hub 的版本：用白名單只留「解讀名單」需要的部分（2026-11-14 Stone 決定，方案 B）。
// 提示字、錯誤訊息、顯示／必填條件、送出流程、同意事項、頁面文案、官網內部的注意事項都不放：
// Hub 用不到，而且只改這些時 contentHash 不會變，Hub 存版本時不會多出沒意義的版本。
// 要多給 Hub 什麼，就在下面的白名單加 key；建置前的 scripts/check-form-schemas.mjs 會檢查
// 這個版本仍然包含每一題的位置、型別、選項值與畫面文字、代號（少了就建置失敗）。
type Obj = Record<string, any>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
/** 只留 keys 裡有的 key（值是 undefined 的不放）。 */
function pick(src: unknown, keys: string[]): Obj | undefined {
  if (!isObj(src)) return undefined
  const out: Obj = {}
  for (const k of keys) if (src[k] !== undefined) out[k] = src[k]
  return out
}
const pickList = (list: unknown, keys: string[]) => (Array.isArray(list) ? list.map((x) => pick(x, keys) ?? x) : undefined)
const pickMap = (map: unknown, keys: string[]) =>
  isObj(map) ? Object.fromEntries(Object.entries(map).map(([k, v]) => [k, pick(v, keys) ?? {}])) : undefined
const OPTION = ['value', 'label', 'price']
const VARIANT = ['company', 'leadSource', 'allAgesFree', 'extraSources']
const PARTNER = ['company', 'endDate']

function toHubView(src: Obj): Obj {
  const store = (st: unknown) => {
    const o = pick(st, ['path', 'valueType', 'map', 'possibleValues', 'compose'])
    if (o && isObj(st) && st.alsoWrites) o.alsoWrites = [].concat(st.alsoWrites).map((a) => pick(a, ['path', 'value']))
    return o
  }
  const field = (f: Obj) => {
    const o = pick(f, ['key', 'label', 'labelSuffix', 'type'])!
    o.store = store(f.store)
    if (f.options) o.options = pickList(f.options, OPTION)
    if (f.retiredOptions) o.retiredOptions = pickList(f.retiredOptions, [...OPTION, 'retiredOn', 'note'])
    if (f.other) o.other = pick(f.other, ['triggerValue', 'compose'])
    if (f.optionsSource) {
      o.optionsSource = pick(f.optionsSource, ['endpoint', 'value', 'label'])
      if (f.optionsSource.fallback) o.optionsSource.fallback = pickList(f.optionsSource.fallback, ['value', 'label'])
    }
    return o
  }
  const ctx = isObj(src.context) ? src.context : {}
  const context: Obj = {}
  for (const [k, keys] of [['variants', VARIANT], ['retiredVariants', [...VARIANT, 'retiredOn', 'note']], ['freeTrialPartners', PARTNER], ['retiredFreeTrialPartners', [...PARTNER, 'retiredOn', 'note']]] as const) {
    const m = pickMap(ctx[k], keys as unknown as string[])
    if (m) context[k] = m
  }
  return {
    ...pick(src, ['formId', 'leadType', 'schemaVersion', 'retiredOn']),
    sections: (src.sections ?? []).map((sec: Obj) => ({ ...pick(sec, ['id', 'title']), fields: (sec.fields ?? []).map(field) })),
    hiddenFields: pickList(src.hiddenFields, ['key', 'value', 'valueType', 'shape'])?.map((h, i) => ({ ...h, store: pick(src.hiddenFields[i]?.store, ['path']) })),
    ...(Object.keys(context).length ? { context } : {}),
  }
}

export function getPublishedFormSchemas() {
  return SOURCES.map((src) => {
    const schema = toHubView(src)
    const schemaJson = JSON.stringify(schema)
    return {
      formId: String(schema.formId),
      leadType: String(schema.leadType),
      ...(schema.retiredOn ? { retiredOn: String(schema.retiredOn) } : {}),
      schemaVersion: String(schema.schemaVersion),
      contentHash: createHash('sha256').update(schemaJson).digest('hex'),
      schemaJson,
    }
  })
}

/** 比對後只寫有變的；回傳每張表單的結果，給 log 用。 */
export async function syncFormSchemas() {
  const { getDb } = await import('~/server/utils/firebase')
  const { FieldValue } = await import('firebase-admin/firestore')
  const db = await getDb()
  const results: string[] = []
  for (const s of getPublishedFormSchemas()) {
    const ref = db.collection(FORM_SCHEMA_COLLECTION).doc(s.formId)
    const snap = await ref.get()
    if (snap.exists && snap.get('contentHash') === s.contentHash) {
      results.push(`${s.formId}=same`)
      continue
    }
    // set 整份覆蓋：取消下架時 retiredOn 也會跟著消失
    await ref.set({ ...s, syncedAt: FieldValue.serverTimestamp(), revision: process.env.K_REVISION || null })
    results.push(`${s.formId}=written(v${s.schemaVersion},${s.contentHash.slice(0, 8)})`)
  }
  return results
}
