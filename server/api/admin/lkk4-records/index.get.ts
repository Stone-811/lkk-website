import { getDb, docsToArray } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

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
  createdAt?: Date
}

/**
 * 🔴 原本是「整個 collection 全表讀取，再在記憶體 filter」——
 *    即使選了年度，還是先把所有年度的完整文件撈回來。
 *    2026-09-11 實測 656 筆（2023 224／2024 225／2025 207），每年再加約 220 筆，
 *    後台每次開頁、每次改篩選都跑一次。
 *
 * 改成三件事分開拿：
 *   ① 年度清單：用「游標式跳躍」抓不重複年度——先 orderBy('year','desc').limit(1)
 *      拿最新的一年，再用 where('year','<',上一個).limit(1) 往前跳。
 *      成本 = 年度數 + 1 筆讀取（今天是 4 筆），不是整張表。
 *      ⚠️ 這裡刻意不用 .select('year') 投影掃全表：Firestore Native 是依
 *         「回傳文件數」計費，投影只省頻寬不省讀取次數，掃 656 筆就是 656 次讀取。
 *   ② 成績：只查目標年度 where('year','==',Y)。沒指定年度時預設最新年度。
 *   ③ 組別清單：直接從①②已經讀回來的該年度資料推導，額外成本 0。
 *      副作用：組別下拉只會列出「該年度實際有的組別」，選了不存在的組別不會再查出空白。
 *
 * 預設載入成本：4 + 207 ≈ 211 筆讀取（改動前 656 筆）。
 *
 * ⚠️ where('year','==',Y) 與 where('year','<',Y).orderBy('year','desc') 都只用到
 *    year 單一欄位，走自動單欄位索引，不需要在 firestore.indexes.json 補複合索引。
 * ⚠️ 排序維持改動前的 finalScore 由大到小（原碼註解寫的是 "within each group"，
 *    但實際是全域排序）——不要改成 year 排序，後台表格看的就是成績高低。
 */

/** 年度數 + 1 次讀取取得所有不重複年度（新→舊）。上限純粹是防呆，避免資料異常時無限迴圈。 */
async function listDistinctYearsDesc(col: any): Promise<number[]> {
  const years: number[] = []
  let cursor: number | null = null

  for (let i = 0; i < 60; i++) {
    let q = col.orderBy('year', 'desc').limit(1)
    if (cursor !== null) q = q.where('year', '<', cursor)
    const snap = await q.get()
    if (snap.empty) break

    const y = snap.docs[0].data().year
    if (typeof y !== 'number' || !Number.isFinite(y)) break

    years.push(y)
    cursor = y
  }

  return years
}

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const query = getQuery(event)
    const yearParam = typeof query.year === 'string' ? query.year : undefined
    const wantAll = yearParam === 'all'
    const group = typeof query.group === 'string' ? query.group : undefined
    const name = typeof query.name === 'string' ? query.name : undefined

    const db = await getDb()
    const col = db.collection('lkk4_records')

    // ① 年度清單
    const years = await listDistinctYearsDesc(col)

    // ② 決定要載哪一年
    //    parseInt 對 'abc' 會得到 NaN，而 NaN ?? x 不會 fallback（?? 只看 null/undefined），
    //    會把 NaN 丟進 where() 查詢，所以用 Number.isFinite 擋掉。
    //    完全沒帶 year＝前端首次載入，套用最新年度；帶 'all' 才是使用者主動要全部年度。
    const parsed = yearParam && !wantAll ? parseInt(yearParam, 10) : NaN
    const requested = Number.isFinite(parsed) ? parsed : null
    const targetYear = wantAll ? null : (requested ?? years[0] ?? null)

    const snapshot =
      targetYear === null ? await col.get() : await col.where('year', '==', targetYear).get()

    let records = docsToArray<LKK4Record>(snapshot)

    // ③ 組別清單：在套用組別／姓名篩選之前先取，否則下拉選單會只剩下當前篩選結果裡的組別
    const groupsSet = new Set<string>()
    records.forEach((r) => {
      if (r.competitionGroup) groupsSet.add(r.competitionGroup)
    })
    const groups = Array.from(groupsSet).sort()

    if (group && group.trim()) {
      records = records.filter((r) => r.competitionGroup === group)
    }
    if (name && name.trim()) {
      const searchName = name.trim().toLowerCase()
      records = records.filter((r) => (r.name || '').toLowerCase().includes(searchName))
    }

    // 維持改動前的排序：成績由高到低
    records.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))

    return {
      success: true,
      data: records,
      total: records.length,
      // 前端首次載入時不知道最新年度是哪一年，靠這個欄位把下拉選單對上
      appliedYear: targetYear,
      filters: { years, groups },
    }
  } catch (error: any) {
    console.error('Error fetching LKK4 records:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '載入失敗',
    })
  }
})
