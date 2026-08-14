// 後台權限：前端選單過濾與路由守衛共用同一份判斷，避免兩邊走鐘。
// 伺服器端 API 的鎖另見 server/middleware/admin-api-guard.ts（真正的安全層）＋各 handler inline 檢查。
//
// 權限模型（2026-08）：
//   - 'admin'  系統管理員：全部頁面，永遠全權（含使用者管理），不受勾選限制。
//   - 'custom' 自訂權限：以 permissions（勾選的頁面路徑清單）為準。
//   - 舊角色 'editor'/'store_staff'/'sales'：無 permissions 欄位，沿用原本的角色 fallback，
//     既有帳號不受影響（開啟編輯並儲存後會轉為 'custom' + 明確頁面清單）。

export type AdminRole = 'admin' | 'editor' | 'store_staff' | 'sales' | 'custom'

// 「名單專員」(舊 sales 角色) 可存取的頁面前綴
const SALES_ALLOWED_PREFIXES = ['/admin/leads', '/admin/group-classes', '/admin/cooperation']

// 可指派（勾選）的後台頁面清單＝使用者管理的權限勾選項目。
// 不含「儀表板」(/admin，任何登入者可見的中性著陸頁) 與「使用者管理」(/admin/users，永遠僅系統管理員)。
export const ASSIGNABLE_PAGES: { path: string; label: string }[] = [
  { path: '/admin/leads', label: '客戶預約' },
  { path: '/admin/group-classes', label: '團課預約' },
  { path: '/admin/cooperation', label: '合作表單' },
  { path: '/admin/stores', label: '分店管理' },
  { path: '/admin/coaches', label: '教練管理' },
  { path: '/admin/lecturers', label: '講師管理' },
  { path: '/admin/lkk4-records', label: 'LKK4 成績' },
  { path: '/admin/settings', label: '系統設定' },
]

export const ASSIGNABLE_PAGE_PATHS = ASSIGNABLE_PAGES.map((p) => p.path)

type AccessUser = { role?: string | null; permissions?: string[] | null }

function matchesPage(perms: string[], path: string): boolean {
  return perms.some((p) => path === p || path.startsWith(p + '/'))
}

// 僅檢查「自訂權限帳號」的勾選清單是否含該頁（不含任何舊角色 fallback）。
// 供各 API handler inline 檢查用：admin／原角色照舊，另外放行有勾選該頁的自訂帳號。
export function hasPagePermission(user: AccessUser | null | undefined, pagePath: string): boolean {
  if (!user || user.role !== 'custom') return false
  const perms = user.permissions
  return Array.isArray(perms) && matchesPage(perms, pagePath)
}

// 判斷某使用者是否可存取某後台路徑（選單過濾＋前端路由守衛共用）。
// 可傳完整 user 物件（含 role + permissions）；亦相容舊呼叫法傳純 role 字串。
export function canAccessAdminPath(
  user: AccessUser | string | null | undefined,
  path: string,
): boolean {
  if (!user) return false
  const u: AccessUser = typeof user === 'string' ? { role: user } : user
  const role = u.role || undefined

  // 系統管理員：全部
  if (role === 'admin') return true

  // 使用者管理：永遠僅系統管理員
  if (path === '/admin/users' || path.startsWith('/admin/users/')) return false

  // 儀表板：任何登入者皆可（中性著陸頁）
  if (path === '/admin') return true

  // 自訂權限帳號：以勾選頁面為準
  if (role === 'custom') {
    return Array.isArray(u.permissions) ? matchesPage(u.permissions, path) : false
  }

  // 舊帳號 fallback（無 permissions 欄位）
  if (role === 'sales') {
    return matchesPage(SALES_ALLOWED_PREFIXES, path)
  }
  // editor / store_staff：維持原本的完整存取（使用者管理已於上方擋掉）
  return true
}

// 角色顯示名稱（後台使用者管理標籤）
export const ROLE_LABELS: Record<string, string> = {
  admin: '系統管理員（全部）',
  editor: '編輯（內容管理）',
  store_staff: '分店人員',
  sales: '名單專員（客戶預約＋團課＋合作表單）',
  custom: '自訂權限',
}

// 舊版建立帳號用的角色選項（保留匯出以相容；新版 UI 改用「系統管理員／自訂＋勾選」）
export const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'sales', label: ROLE_LABELS.sales },
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'editor', label: ROLE_LABELS.editor },
  { value: 'store_staff', label: ROLE_LABELS.store_staff },
]
