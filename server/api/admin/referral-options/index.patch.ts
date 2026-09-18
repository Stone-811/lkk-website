import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'

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
const FIELDS = ['social', 'event'] as const
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
  const list: { label: string; active: boolean }[] = Array.isArray(raw[field]) ? [...raw[field]] : []

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
    // 全部停用會讓前台退回程式裡的預設清單，反而更混亂，所以擋下
    if (!list.some((o) => o.active)) {
      throw createError({ statusCode: 400, message: '至少要保留一個啟用中的選項' })
    }
  } else {
    throw createError({ statusCode: 400, message: '未知的動作' })
  }

  const Timestamp = await getTimestamp()
  await ref.set({ [field]: list, updatedAt: Timestamp.now() }, { merge: true })
  return { success: true, data: list }
})
