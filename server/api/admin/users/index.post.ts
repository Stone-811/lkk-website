// 建立後台使用者。僅 admin。
import { ASSIGNABLE_PAGE_PATHS } from '~/utils/adminAccess'
const ALLOWED_ROLES = ['admin', 'editor', 'store_staff', 'sales', 'custom']

export default defineEventHandler(async (event) => {
  const { requireRole, createUser, validatePasswordStrength } = await import('~/server/utils/auth')
  await requireRole(event, ['admin'])

  const body = await readBody(event)
  const name = (body?.name || '').trim()
  const email = (body?.email || '').trim().toLowerCase()
  const password = body?.password || ''
  const role = body?.role || ''
  // 自訂權限帳號的勾選頁面（只收合法頁面路徑）
  const permissions: string[] = Array.isArray(body?.permissions)
    ? body.permissions.filter((p: string) => ASSIGNABLE_PAGE_PATHS.includes(p))
    : []

  if (!name || !email || !password || !role) {
    throw createError({ statusCode: 400, statusMessage: '請填寫姓名、Email、密碼與角色' })
  }
  if (!ALLOWED_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: '角色不正確' })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email 格式不正確' })
  }
  const pwErr = validatePasswordStrength(password)
  if (pwErr) {
    throw createError({ statusCode: 400, statusMessage: pwErr })
  }

  const { getDb } = await import('~/server/utils/firebase')
  const db = await getDb()
  const existing = await db.collection('users').where('email', '==', email).limit(1).get()
  if (!existing.empty) {
    throw createError({ statusCode: 409, statusMessage: '此 Email 已被使用' })
  }

  const result = await createUser(email, password, name, role, undefined, permissions)
  if (!result.success) {
    throw createError({ statusCode: 500, statusMessage: result.error || '建立使用者失敗' })
  }

  return { success: true, userId: result.userId }
})
