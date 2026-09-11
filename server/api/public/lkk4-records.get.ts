import { getDb, docsToArray } from '~/server/utils/firebase'

interface LKK4Record {
  id: string
  year: number
  competitionGroup: string
  teamName: string | null
  rank: number | null
  name: string
  gender: string
  bodyWeight: number | null
  firstAttempt: number | null
  firstAttemptResult: string | null
  secondAttempt: number | null
  secondAttemptResult: string | null
  thirdAttempt: number | null
  thirdAttemptResult: string | null
  finalScore: number
  ipfGlPoint: number
}

/**
 * 前台 /personal-record 的成績查詢。
 *
 * 🔴 原本是「整個 collection 撈回來，再在記憶體比對年度與姓名」——
 *    一次查詢＝一次全表讀取（2026-09-11 實測 656 筆，每年再加約 220 筆），
 *    而且這是公開未登入的端點，任何人重整都算一次全表讀。
 *
 * 現在分三條路徑：
 *   ① 年度＋姓名（前端唯一會送的組合）→ where('year','==').where('name','==')
 *      直接命中，通常只讀 1 筆。走既有複合索引 year ASC + name ASC
 *      （firestore.indexes.json 已宣告，兩個專案都已部署，不需要補索引）。
 *   ② ① 查不到、**且**查詢字串含大小寫可折疊字元 → 退回「只查該年度」做大小寫不敏感比對。
 *      因為 Firestore 的 '==' 區分大小寫，而舊版是 toLowerCase() 後比對。
 *      實測 656 筆中只有 'Jack Matthew Brookes' 與 'Joe' 兩筆含英文字母，
 *      其餘全是中文，toLowerCase 對中文是 no-op，所以純中文姓名查不到就是真的沒有，
 *      不必再掃一次整年度（否則每次「查無此人」都要多付約 220 筆讀取）。
 *   ③ 只有年度沒有姓名 → 只查該年度。
 *
 * ⚠️ year 改為必填。沒帶 year 就回空陣列，不再退化成全表讀取——
 *    公開端點不應該讓人用一個沒有參數的請求就掃完整張表。
 *    前端 /personal-record 本來就是年度與姓名都填了才送出，
 *    CLAUDE.md 記載的合約也是 ?year=2025&name=姓名，沒有改到任何既有呼叫端。
 *
 * ⚠️ 排序在記憶體做（finalScore 由大到小），與改動前的 orderBy 結果一致。
 *    不在查詢加 orderBy 是因為 where('year','==') + orderBy('finalScore') 會需要
 *    另一組複合索引，而現有資料量在記憶體排序毫無成本。
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const parsedYear = query.year ? parseInt(query.year as string, 10) : NaN
    const year = Number.isFinite(parsedYear) ? parsedYear : null
    const rawName = typeof query.name === 'string' ? query.name.trim() : ''

    if (year === null) {
      return { success: true, data: [], total: 0, message: '請指定查詢年度' }
    }

    const db = await getDb()
    const col = db.collection('lkk4_records')

    let records: LKK4Record[] = []

    if (rawName) {
      // ① 精確命中：年度 + 姓名
      const exact = await col.where('year', '==', year).where('name', '==', rawName).get()
      records = docsToArray<LKK4Record>(exact)

      // ② 沒命中才退回該年度掃描，補回舊版的大小寫不敏感比對。
      //    但只有在姓名「含有大小寫可折疊的字元」時才需要——
      //    純中文／數字的姓名（654/656 筆）toLowerCase 是 no-op，
      //    ① 查不到就代表真的沒有，再掃一次整年度不可能掃出別的結果。
      //    少了這個判斷，「查無此人」這種最常見的失敗查詢每次都要多付約 220 筆讀取。
      const isCaseless = rawName.toLowerCase() === rawName.toUpperCase()
      if (!records.length && !isCaseless) {
        const byYear = await col.where('year', '==', year).get()
        const target = rawName.toLowerCase()
        records = docsToArray<LKK4Record>(byYear).filter(
          (r) => (r.name || '').trim().toLowerCase() === target
        )
      }
    } else {
      // ③ 只有年度
      const byYear = await col.where('year', '==', year).get()
      records = docsToArray<LKK4Record>(byYear)
    }

    records.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))

    return {
      success: true,
      data: records,
      total: records.length,
    }
  } catch (error: any) {
    console.error('Error fetching LKK4 records:', error)
    return {
      success: true,
      data: [],
      total: 0,
    }
  }
})
