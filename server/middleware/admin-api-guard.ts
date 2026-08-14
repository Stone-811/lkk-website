// 後台 API 權限鎖（集中控管，不必逐支 handler 改）：
// - /api/admin/*（auth/ 除外）一律需登入
// - admin：全部放行
// - users / seed / debug：僅 admin
// - custom（自訂權限）：依「勾選的頁面 → 對應 API」放行，其餘 403
// - 舊角色 sales / editor / store_staff：維持原本行為（既有帳號不受影響）
//
// 各頁面對應哪些 API 見下方 requiredPagesFor()。注意兩處天生的綁定：
//   1) 客戶預約/團課/合作三頁共用 /api/admin/leads（只差 ?type=）→ 任一頁即可讀寫該 API。
//   2) /api/admin/upload 由分店/教練/講師共用；/api/admin/stores 的 GET 供名單頁讀店名。
// 這是「畫面層」的第一道；各 handler 內另有 inline 檢查（防禦縱深，見 utils/adminAccess.hasPagePermission）。

const LEADS_PAGES = ['/admin/leads', '/admin/group-classes', '/admin/cooperation']

// 回傳「擁有其中任一頁權限即可存取此 API」的頁面清單；或 'ANY_AUTH'（任何登入者）。
// 空陣列＝自訂帳號一律拒絕（未知 /api/admin/* 保守處理）。
function requiredPagesFor(path: string, method: string): string[] | 'ANY_AUTH' {
  if (path.startsWith('/api/admin/dashboard')) return 'ANY_AUTH'
  if (path.startsWith('/api/admin/leads')) return LEADS_PAGES
  if (path.startsWith('/api/admin/coaches')) return ['/admin/coaches']
  if (path.startsWith('/api/admin/lecturers')) return ['/admin/lecturers']
  if (path.startsWith('/api/admin/lkk4-records')) return ['/admin/lkk4-records']
  if (path.startsWith('/api/admin/settings')) return ['/admin/settings']
  if (path.startsWith('/api/admin/upload')) return ['/admin/stores', '/admin/coaches', '/admin/lecturers']
  if (path.startsWith('/api/admin/stores')) {
    // GET 供名單類頁面讀分店名稱；寫入僅分店管理
    return method === 'GET' ? ['/admin/stores', ...LEADS_PAGES] : ['/admin/stores']
  }
  return []
}

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  if (!path.startsWith('/api/admin/')) return
  // 登入/登出/session/google/改密碼 屬未登入即可存取或自助操作
  if (path.startsWith('/api/admin/auth/')) return

  const { getSession } = await import('~/server/utils/auth')
  const session = await getSession(event)

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }

  const role = session.role
  const method = (event.method || 'GET').toUpperCase()

  // 系統管理員：全部放行
  if (role === 'admin') return

  // 僅系統管理員：使用者管理 / 種子資料 / 除錯
  if (
    path.startsWith('/api/admin/users') ||
    path.startsWith('/api/admin/seed') ||
    path.startsWith('/api/admin/debug')
  ) {
    throw createError({ statusCode: 403, statusMessage: '權限不足' })
  }

  // 自訂權限帳號：依勾選頁面鎖 API
  if (role === 'custom') {
    const required = requiredPagesFor(path, method)
    if (required === 'ANY_AUTH') return
    const { hasPagePermission } = await import('~/utils/adminAccess')
    const ok = required.some((p) => hasPagePermission(session, p))
    if (!ok) {
      throw createError({ statusCode: 403, statusMessage: '權限不足' })
    }
    return
  }

  // 舊角色：名單專員只放行名單相關 API（含 cooperation/franchise 資料與更新）與 stores 的 GET
  if (role === 'sales') {
    const salesAllowed =
      path.startsWith('/api/admin/leads') ||
      (path.startsWith('/api/admin/stores') && method === 'GET')
    if (!salesAllowed) {
      throw createError({ statusCode: 403, statusMessage: '權限不足' })
    }
    return
  }

  // editor / store_staff：維持原本存取（users/seed/debug 已於上方擋掉）
  return
})
