// 後台 API 角色鎖（集中控管，不必逐支 handler 改）：
// - /api/admin/*（auth 除外）一律需登入
// - /api/admin/users*：僅 admin
// - sales（名單專員）：只放行 /api/admin/leads*（含 cooperation/franchise 資料與更新）
//   與 /api/admin/stores 的 GET（客戶預約頁需讀分店名稱），其餘一律 403
export default defineEventHandler(async (event) => {
  const path = event.path || ''

  if (!path.startsWith('/api/admin/')) return
  // 登入/登出/session/google 屬未登入即可存取
  if (path.startsWith('/api/admin/auth/')) return

  const { getSession } = await import('~/server/utils/auth')
  const session = await getSession(event)

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }

  // 使用者管理：僅系統管理員
  if (path.startsWith('/api/admin/users')) {
    if (session.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '權限不足' })
    }
    return
  }

  // 名單專員：只可存取名單相關 API
  if (session.role === 'sales') {
    const method = (event.method || 'GET').toUpperCase()
    const salesAllowed =
      path.startsWith('/api/admin/leads') ||
      (path.startsWith('/api/admin/stores') && method === 'GET')
    if (!salesAllowed) {
      throw createError({ statusCode: 403, statusMessage: '權限不足' })
    }
  }
})
