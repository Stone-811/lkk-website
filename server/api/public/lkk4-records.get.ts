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

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const year = query.year ? parseInt(query.year as string) : null
    const name = query.name as string | undefined

    const db = await getDb()
    let recordsQuery = db.collection('lkk4_records').orderBy('finalScore', 'desc')

    // If searching by name, we need to filter after fetching
    // Firestore doesn't support contains/like queries natively
    const snapshot = await recordsQuery.get()
    let records = docsToArray<LKK4Record>(snapshot)

    // Filter by year if provided
    if (year) {
      records = records.filter(r => r.year === year)
    }

    // Filter by name if provided —— 完整姓名精確比對（不做模糊/部分比對）
    if (name && name.trim()) {
      const searchName = name.trim().toLowerCase()
      records = records.filter(r => (r.name || '').trim().toLowerCase() === searchName)
    }

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
