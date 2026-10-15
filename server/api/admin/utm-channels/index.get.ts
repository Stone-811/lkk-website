import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { DEFAULT_UTM_CHANNELS, type UtmChannel } from '~/config/utmChannels'

/**
 * 投放管道清單（含已停用的；產連結時只用啟用中的）。
 *
 * 文件不存在時回傳程式裡的預設值當起始內容，業主第一次進來就看得到七個管道。
 * 這與 PATCH 的種子邏輯必須一致，否則第一次「停用」會在空陣列裡找不到而報錯、
 * 第一次「新增」會把預設清單整個弄丟（referral-options 2026-09-18 踩過這個坑）。
 *
 * ⚠️ Firestore 讀不到時**不要**丟 500：後台的活動頁靠這份清單才渲染得出管道按鈕，
 *    丟 500 等於整頁不能用。退回程式裡的預設值，至少還能建活動。
 */
export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (
    !session ||
    (!['admin', 'editor'].includes(session.role) && !hasPagePermission(session, '/admin/campaigns'))
  ) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const seed = (): (UtmChannel & { active: boolean })[] =>
    DEFAULT_UTM_CHANNELS.map((c) => ({ ...c, active: true }))

  try {
    const db = await getDb()
    const doc = await db.collection('settings').doc('utmChannels').get()
    const raw: any = doc.exists ? doc.data() || {} : {}
    const list = Array.isArray(raw.channels) && raw.channels.length ? raw.channels : seed()
    return { success: true, data: list, initialized: doc.exists }
  } catch (error: any) {
    console.error('[Admin UTM Channels GET]', error?.message)
    return { success: true, data: seed(), initialized: false, degraded: true }
  }
})
