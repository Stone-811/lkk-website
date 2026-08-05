import { canAccessAdminPath } from '~/utils/adminAccess'

// 後台路由守衛（SSR + client 皆執行）。
// 用 useRequestFetch()：在 SSR 會把「當前這個請求」的 cookie 轉發到內部 session API，
// 在 client 等同 $fetch（瀏覽器自動帶 cookie）。這是可靠取得登入狀態的方式——
// 先前用 $fetch + 手動 useRequestHeaders 在 App Hosting SSR 沒正確帶 cookie，
// 導致已登入者一重新整理就被誤判未登入、踢回登入頁。
// session 存進 useState('adminUser') 供 layouts/admin.vue 共用（避免重複請求）。
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return

  const adminUser = useState<{ id: string; name: string; email: string; role: string } | null>(
    'adminUser',
    () => null,
  )

  const requestFetch = useRequestFetch()
  try {
    const res = await requestFetch<{ success: boolean; user?: any }>('/api/admin/auth/session')
    adminUser.value = res?.success ? (res.user ?? null) : null
  } catch {
    adminUser.value = null
  }

  if (!adminUser.value) {
    return navigateTo('/admin/login')
  }

  if (!canAccessAdminPath(adminUser.value.role, to.path)) {
    return navigateTo(adminUser.value.role === 'sales' ? '/admin/leads' : '/admin')
  }
})
