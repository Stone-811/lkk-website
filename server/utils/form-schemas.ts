// 三張表單的 schema（給 CRM 讀的表單定義），同步到 Firestore 的 formSchemas 集合。
//
// 正本：docs/form-schema/{booking,group-booking,cooperation}.json（跟著程式一起進版控）。
// 網站每台執行個體啟動時（發版、冷啟動、擴充）由 server/plugins/form-schema-sync.ts 呼叫
// syncFormSchemas()：內容指紋跟 Firestore 上的一樣就跳過，不一樣才寫入。
// 所以 Firestore 裡的內容永遠等於「這個環境正在跑的那一版」——推 dev 寫 lkkdev、推 prod 寫 lkkprod。
//
// JSON 跟程式的選項有沒有對齊，由建置前的 scripts/check-form-schemas.mjs 檢查（不一致就建置失敗）。
//
// Firestore 文件：formSchemas/<formId>
//   formId         'booking' | 'group-booking' | 'cooperation'
//   schemaVersion  JSON 裡的 schemaVersion（欄位改名、存法改變這類不相容的改動才升）
//   contentHash    下面 schemaJson 的 sha256（同步用；任何內容變動都會變）
//   schemaJson     整份 schema 的 JSON 字串（CRM 讀了自己 JSON.parse）
//   syncedAt       寫入時間
// 用字串存而不是 Firestore map：schema 裡有陣列中的陣列、條件物件等巢狀結構，
// Firestore 的 map 不收陣列裡直接放陣列，也會為每個欄位建索引；字串最單純，CRM 端也好解。
import { createHash } from 'node:crypto'
import booking from '~/docs/form-schema/booking.json'
import groupBooking from '~/docs/form-schema/group-booking.json'
import cooperation from '~/docs/form-schema/cooperation.json'

export const FORM_SCHEMA_COLLECTION = 'formSchemas'

const SOURCES: Record<string, unknown>[] = [booking, groupBooking, cooperation]

// 只對內部有用、CRM 用不到又容易過時的段落：程式檔案路徑、跟後台畫面／CLAUDE.md 的差異。
// 其他說明（含 knownQuirks、hiddenFieldsTrust）都跟「名單資料怎麼解讀」有關，保留給 CRM。
function toPublished(src: Record<string, unknown>) {
  const doc = JSON.parse(JSON.stringify(src)) as Record<string, any>
  delete doc.sourceOfTruth
  if (doc.crossFormDifferences && typeof doc.crossFormDifferences === 'object') {
    delete doc.crossFormDifferences.vsAdmin
    delete doc.crossFormDifferences.vsClaudeMd
  }
  return doc
}

export function getPublishedFormSchemas() {
  return SOURCES.map((src) => {
    const schema = toPublished(src)
    const schemaJson = JSON.stringify(schema)
    return {
      formId: String(schema.formId),
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
    await ref.set({ ...s, syncedAt: FieldValue.serverTimestamp() })
    results.push(`${s.formId}=written(v${s.schemaVersion},${s.contentHash.slice(0, 8)})`)
  }
  return results
}
