import { getDb, docToObject, CoachDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing coach ID' })
    }

    const db = await getDb()
    const coachDoc = await db.collection('coaches').doc(id).get()
    const coach = docToObject<CoachDoc>(coachDoc)

    if (!coach) {
      throw createError({ statusCode: 404, message: '找不到此教練' })
    }

    return { success: true, data: coach }
  } catch (error: any) {
    console.error('Error fetching coach:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch coach',
    })
  }
})
