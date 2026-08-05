// 登入者自助修改自己的密碼（任何角色皆可）。
// 放在 /api/admin/auth/ 底下，故不受 admin-api-guard 的角色限制；
// 但 handler 自身要求有效 session，且只能改「自己」(session.id) 的密碼。
export default defineEventHandler(async (event) => {
  const { getSession } = await import('~/server/utils/auth')
  const session = await getSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }

  const body = await readBody(event)
  const currentPassword = body?.currentPassword || ''
  const newPassword = body?.newPassword || ''

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: '請輸入目前密碼與新密碼' })
  }
  if (String(newPassword).length < 6) {
    throw createError({ statusCode: 400, statusMessage: '新密碼至少需 6 碼' })
  }
  if (newPassword === currentPassword) {
    throw createError({ statusCode: 400, statusMessage: '新密碼不可與目前密碼相同' })
  }

  const { getDb } = await import('~/server/utils/firebase')
  const db = await getDb()
  const ref = db.collection('users').doc(session.id)
  const snap = await ref.get()
  const data = snap.exists ? snap.data() || {} : null

  // 僅密碼型帳號可改（Google 登入 / 開發測試帳號沒有 passwordHash）
  if (!data || !data.passwordHash) {
    throw createError({ statusCode: 400, statusMessage: '此帳號不支援密碼修改' })
  }

  const bcrypt = (await import('bcryptjs')).default
  const ok = await bcrypt.compare(String(currentPassword), data.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 400, statusMessage: '目前密碼不正確' })
  }

  const newHash = await bcrypt.hash(String(newPassword), 10)
  await ref.update({ passwordHash: newHash, updatedAt: new Date() })

  return { success: true }
})
