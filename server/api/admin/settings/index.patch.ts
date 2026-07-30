import { getSession } from '~/server/utils/auth'
import { getDb, getTimestamp } from '~/server/utils/firebase'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session || session.role !== 'admin') {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { section, data } = body

    if (!section || !data) {
      throw createError({ statusCode: 400, message: 'Missing section or data' })
    }

    const db = await getDb()
    const Timestamp = await getTimestamp()
    const now = Timestamp.now()
    const docRef = db.collection('settings').doc(section)

    await docRef.set(
      {
        ...data,
        updatedAt: now,
      },
      { merge: true }
    )

    return {
      success: true,
      message: '設定已更新',
    }
  } catch (error: any) {
    console.error('Error updating settings:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Failed to update settings' })
  }
})
