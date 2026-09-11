import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'

export default defineEventHandler(async (event) => {
  try {
    // ⚠️ 權限與 POST/PATCH 一致（admin / editor / 有勾選本頁的自訂帳號）。
    //    講師那組的 delete 只放行 admin，與同組的 POST/PATCH 不一致，這裡刻意不照抄。
    const session = await getSession(event)
    if (
      !session ||
      (!['admin', 'editor'].includes(session.role) && !hasPagePermission(session, '/admin/campaigns'))
    ) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing campaign ID' })

    const db = await getDb()
    const ref = db.collection('campaigns').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw createError({ statusCode: 404, message: 'Campaign not found' })

    await ref.delete()
    return { success: true, message: 'Campaign deleted' }
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete campaign',
    })
  }
})
