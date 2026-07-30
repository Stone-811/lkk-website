import { getDb, getTimestamp, docToObject, LecturerDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session || !['admin', 'editor'].includes(session.role)) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing lecturer ID' })
    }

    const db = await getDb()
    const Timestamp = await getTimestamp()

    const body = await readBody(event)
    const lecturerRef = db.collection('lecturers').doc(id)
    const lecturerDoc = await lecturerRef.get()

    if (!lecturerDoc.exists) {
      throw createError({ statusCode: 404, message: 'Lecturer not found' })
    }

    // If slug is being changed, check for duplicates
    if (body.slug) {
      const existingSnapshot = await db
        .collection('lecturers')
        .where('slug', '==', body.slug)
        .limit(1)
        .get()

      if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== id) {
        throw createError({ statusCode: 400, message: '此網址代稱已存在' })
      }
    }

    // Validate type if provided
    if (body.type && !['lkk', 'partner', 'overseas'].includes(body.type)) {
      throw createError({ statusCode: 400, message: '無效的講師類型' })
    }

    const updateData = {
      ...body,
      updatedAt: Timestamp.now(),
    }

    await lecturerRef.update(updateData)

    const updatedDoc = await lecturerRef.get()
    const updatedLecturer = docToObject<LecturerDoc>(updatedDoc)

    return { success: true, data: updatedLecturer }
  } catch (error: any) {
    console.error('Error updating lecturer:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update lecturer',
    })
  }
})
