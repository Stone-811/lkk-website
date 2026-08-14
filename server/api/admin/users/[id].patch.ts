// 更新後台使用者（姓名／角色／權限／啟用狀態／重設密碼）。僅 admin。
import { ASSIGNABLE_PAGE_PATHS } from '~/utils/adminAccess'
const ALLOWED_ROLES = ['admin', 'editor', 'store_staff', 'sales', 'custom']

export default defineEventHandler(async (event) => {
  const { requireRole, validatePasswordStrength } = await import('~/server/utils/auth')
  const actor = await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少使用者 ID' })
  }

  const body = await readBody(event)
  const updates: Record<string, any> = { updatedAt: new Date() }

  if (typeof body?.name === 'string' && body.name.trim()) {
    updates.name = body.name.trim()
  }
  if (typeof body?.role === 'string') {
    if (!ALLOWED_ROLES.includes(body.role)) {
      throw createError({ statusCode: 400, statusMessage: '角色不正確' })
    }
    updates.role = body.role
  }
  if (Array.isArray(body?.permissions)) {
    updates.permissions = body.permissions.filter((p: string) => ASSIGNABLE_PAGE_PATHS.includes(p))
  }
  // 改為非自訂角色時清空權限清單，避免殘留誤判
  if (updates.role && updates.role !== 'custom') {
    updates.permissions = []
  }
  if (typeof body?.isActive === 'boolean') {
    updates.isActive = body.isActive
  }
  if (body?.password) {
    const pwErr = validatePasswordStrength(body.password)
    if (pwErr) {
      throw createError({ statusCode: 400, statusMessage: pwErr })
    }
    const bcrypt = (await import('bcryptjs')).default
    updates.passwordHash = await bcrypt.hash(String(body.password), 10)
  }

  // 防呆：管理員不能停用或降級自己（避免把自己鎖在外面）
  if (id === actor.id) {
    if (updates.isActive === false) {
      throw createError({ statusCode: 400, statusMessage: '不能停用自己的帳號' })
    }
    if (updates.role && updates.role !== 'admin') {
      throw createError({ statusCode: 400, statusMessage: '不能降級自己的角色' })
    }
  }

  const { getDb } = await import('~/server/utils/firebase')
  const db = await getDb()
  const ref = db.collection('users').doc(id)
  const snap = await ref.get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, statusMessage: '使用者不存在' })
  }

  await ref.update(updates)
  return { success: true }
})
