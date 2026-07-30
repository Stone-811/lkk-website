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

export default defineEventHandler(async (event) => {
  try {
    // Verify admin session
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const query = getQuery(event)
    const year = query.year ? parseInt(query.year as string) : null
    const group = query.group as string | undefined
    const name = query.name as string | undefined

    const db = await getDb()
    const snapshot = await db.collection('lkk4_records').orderBy('year', 'desc').get()
    let records = docsToArray<LKK4Record>(snapshot)

    // Get available years and groups for filters
    const yearsSet = new Set<number>()
    const groupsSet = new Set<string>()
    records.forEach(r => {
      yearsSet.add(r.year)
      if (r.competitionGroup) groupsSet.add(r.competitionGroup)
    })

    const years = Array.from(yearsSet).sort((a, b) => b - a)
    const groups = Array.from(groupsSet).sort()

    // Apply filters
    if (year) {
      records = records.filter(r => r.year === year)
    }

    if (group && group.trim()) {
      records = records.filter(r => r.competitionGroup === group)
    }

    if (name && name.trim()) {
      const searchName = name.trim().toLowerCase()
      records = records.filter(r => r.name.toLowerCase().includes(searchName))
    }

    // Sort by finalScore descending within each group
    records.sort((a, b) => b.finalScore - a.finalScore)

    return {
      success: true,
      data: records,
      total: records.length,
      filters: {
        years,
        groups,
      },
    }
  } catch (error: any) {
    console.error('Error fetching LKK4 records:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '載入失敗',
    })
  }
})
