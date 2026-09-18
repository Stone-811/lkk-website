import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { DEFAULT_DYNAMIC_OPTIONS } from '~/config/referralSources'

/**
 * 更新「得知管道」的下拉清單。
 *
 * 🔴 只接受兩種動作：新增一個選項、切換啟用狀態。
 *    **刻意不提供「修改文字」**。這些字串會直接存進名單，而名單的 PATCH
 *    白名單只放行 status 與 internalNote，改了字面就回填不了 ——
 *    舊名單與新名單會在 CSV 匯出裡裂成兩種寫法，業主做統計時才會發現。
 *    新增不會破壞舊資料，停用只是不再顯示給新填表的人。
 *
 * 🔴 也不提供「刪除」。刪掉之後那個字串仍存在於既有名單裡，
 *    但後台再也查不到它曾經是個正式選項。停用能達到同樣效果又留下紀錄。
 */
const FIELDS = ['social', 'event', 'doctor'] as const
type Field = (typeof FIELDS)[number]

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (!session || (session.role !== 'admin' && !hasPagePermission(session, '/admin/settings'))) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const body = await readBody(event)
  const field = body?.field as Field
  const action = body?.action as 'add' | 'toggle'

  if (!FIELDS.includes(field)) {
    throw createError({ statusCode: 400, message: '未知的選項清單' })
  }

  const db = await getDb()
  const ref = db.collection('settings').doc('referralOptions')
  const doc = await ref.get()
  const raw: any = doc.exists ? doc.data() || {} : {}

  // 🔴 文件或欄位還不存在時，要先用程式裡的預設清單當起始內容。
  //    後台的 GET 本來就是這樣回的（所以畫面看得到預設選項），
  //    但 PATCH 若不做同樣的事，第一次按「停用」會在空陣列裡找不到那個選項而回 404，
  //    而且第一次「新增」會把預設選項全部弄丟、只留新增的那一筆。
  //    2026-09-18 業主回報「無法停用」就是踩到這個。
  const list: { label: string; active: boolean }[] =
    Array.isArray(raw[field]) && raw[field].length
      ? [...raw[field]]
      : DEFAULT_DYNAMIC_OPTIONS[field].map((label) => ({ label, active: true }))

  if (action === 'add') {
    const label = String(body?.label || '').trim()
    if (!label) throw createError({ statusCode: 400, message: '請輸入選項名稱' })
    if (label.length > 30) throw createError({ statusCode: 400, message: '選項名稱請控制在 30 字以內' })
    // 名稱重複會讓名單裡出現分不清的兩筆，直接擋下
    if (list.some((o) => o.label === label)) {
      throw createError({ statusCode: 400, message: '這個選項已經存在' })
    }
    list.push({ label, active: true })
  } else if (action === 'toggle') {
    const label = String(body?.label || '')
    const target = list.find((o) => o.label === label)
    if (!target) throw createError({ statusCode: 404, message: '找不到這個選項' })
    target.active = !target.active
    // 刻意允許「全部停用」。此時前台會把對應的主選項整個隱藏起來
    // （例如沒有任何合作醫師，就不提供「醫師/醫療轉介」這個選項），
    // 而不是顯示一個選不了東西的空下拉。
    //
    // ⚠️ 先前這裡擋下全部停用，理由是「會退回預設清單」——那是把
    //    「沒設定過」和「設定成空的」混為一談。實際後果是業主無法停用
    //    唯一那筆範例資料（張文穎），只能一直留著。已改為區分兩者。
  } else {
    throw createError({ statusCode: 400, message: '未知的動作' })
  }

  const Timestamp = await getTimestamp()
  await ref.set({ [field]: list, updatedAt: Timestamp.now() }, { merge: true })
  return { success: true, data: list }
})
