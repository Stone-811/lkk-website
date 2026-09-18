import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { DEFAULT_DYNAMIC_OPTIONS } from '~/config/referralSources'

/**
 * 後台讀取「得知管道」的三份下拉清單（含已停用的；前台只拿啟用中的）。
 * 文件不存在時回傳程式裡的預設值當起始內容，業主第一次進來就看得到東西。
 */
export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (!session || (session.role !== 'admin' && !hasPagePermission(session, '/admin/settings'))) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const seed = (list: string[]) => list.map((label) => ({ label, active: true }))

  try {
    const db = await getDb()
    const doc = await db.collection('settings').doc('referralOptions').get()
    const raw: any = doc.exists ? doc.data() || {} : {}
    return {
      success: true,
      data: {
        social: Array.isArray(raw.social) ? raw.social : seed(DEFAULT_DYNAMIC_OPTIONS.social),
        event: Array.isArray(raw.event) ? raw.event : seed(DEFAULT_DYNAMIC_OPTIONS.event),
        doctor: Array.isArray(raw.doctor) ? raw.doctor : seed(DEFAULT_DYNAMIC_OPTIONS.doctor),
      },
      initialized: doc.exists,
    }
  } catch (error: any) {
    console.error('[Admin Referral Options GET]', error?.message)
    throw createError({ statusCode: 500, message: `Firestore 錯誤: ${error.message}` })
  }
})
