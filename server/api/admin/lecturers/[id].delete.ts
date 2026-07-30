import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session || session.role !== 'admin') {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing lecturer ID' })
    }

    const db = await getDb()
    const lecturerRef = db.collection('lecturers').doc(id)
    const lecturerDoc = await lecturerRef.get()

    if (!lecturerDoc.exists) {
      throw createError({ statusCode: 404, message: 'Lecturer not found' })
    }

    await lecturerRef.delete()

    return { success: true, message: 'Lecturer deleted' }
  } catch (error: any) {
    console.error('Error deleting lecturer:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete lecturer',
    })
  }
})
