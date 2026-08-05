import { canAccessAdminPath } from '~/utils/adminAccess'

// 後台路由守衛（僅 client 端執行）。
// 為何只在 client：SSR 端用內部 $fetch 把 cookie 轉發到 session API，在 App Hosting 不穩，
// 會讓「已登入者重新整理」被誤判為未登入而導向登入頁（＝一刷新就被登出）。
// 改由 client 檢查（瀏覽器自動帶 cookie，穩定）；初次載入/重新整理則由
// layouts/admin.vue 的 onMounted 以同樣的 canAccessAdminPath 補上守衛。
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return

  let user: { role?: string } | null = null
  try {
    const res = await $fetch<{ success: boolean; user?: { role?: string } }>(
      '/api/admin/auth/session',
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
