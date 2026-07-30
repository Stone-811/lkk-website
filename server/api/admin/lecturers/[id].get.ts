import { getDb, docToObject, LecturerDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing lecturer ID' })
    }

    const db = await getDb()
    const lecturerDoc = await db.collection('lecturers').doc(id).get()
    const lecturer = docToObject<LecturerDoc>(lecturerDoc)

    if (!lecturer) {
      throw createError({ statusCode: 404, message: '找不到此講師' })
    }

    return { success: true, data: lecturer }
  } catch (error: any) {
    console.error('Error fetching lecturer:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch lecturer',
    })
  }
})
