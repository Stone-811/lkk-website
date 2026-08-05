import { canAccessAdminPath } from '~/utils/adminAccess'

// 後台路由守衛：只作用於 /admin/*（登入頁除外）。
// 1. 未登入 → 導向登入頁
// 2. 已登入但角色無權進此頁 → 導回其可用首頁（sales→客戶預約，其餘→儀表板）
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  let user: { role?: string } | null = null
  try {
    const res = await $fetch<{ success: boolean; user?: { role?: string } }>(
      '/api/admin/auth/session',
      { headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined },
    )
    user = res?.success ? res.user ?? null : null
  } catch {
    user = null
  }

  if (!user) {
    return navigateTo('/admin/login')
  }

  if (!canAccessAdminPath(user.role, to.path)) {
    return navigateTo(user.role === 'sales' ? '/admin/leads' : '/admin')
  }
})
