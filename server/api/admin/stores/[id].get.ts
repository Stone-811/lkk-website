import { getDb, docToObject, StoreDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing store ID' })
    }

    const db = await getDb()
    const storeDoc = await db.collection('stores').doc(id).get()
    const store = docToObject<StoreDoc>(storeDoc)

    if (!store) {
      throw createError({ statusCode: 404, message: '找不到此分店' })
    }

    return { success: true, data: store }
  } catch (error: any) {
    console.error('Error fetching store:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch store',
    })
  }
})
