import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入',
    })
  }

  if (session.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: '權限不足',
    })
  }

  const body = await readBody(event)

  // Expect body.items to be an array of { id, sortOrder }
  if (!Array.isArray(body.items)) {
    throw createError({
      statusCode: 400,
      statusMessage: '請提供排序資料',
    })
  }

  try {
    const db = await getDb()
    const Timestamp = await getTimestamp()
    const now = Timestamp.now()

    const batch = db.batch()

    for (const item of body.items) {
      if (!item.id || typeof item.sortOrder !== 'number') continue
      const docRef = db.collection('stores').doc(item.id)
      batch.update(docRef, {
        sortOrder: item.sortOrder,
        updatedAt: now,
      })
    }

    await batch.commit()

    return {
      success: true,
      message: '排序已更新',
    }
  } catch (error: any) {
    console.error('Error reordering stores:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '更新排序失敗',
    })
  }
})
