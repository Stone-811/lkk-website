// 後台角色權限：前端選單過濾與路由守衛共用同一份判斷，避免兩邊走鐘。
// 伺服器端 API 的角色鎖另見 server/middleware/admin-api-guard.ts（真正的安全層）。

export type AdminRole = 'admin' | 'editor' | 'store_staff' | 'sales'

// 「名單專員」(sales) 只能存取的頁面前綴
const SALES_ALLOWED_PREFIXES = ['/admin/leads', '/admin/cooperation']

// 判斷某角色是否可存取某後台路徑
export function canAccessAdminPath(role: string | undefined, path: string): boolean {
  if (!role) return false

  // 名單專員：只有客戶預約 + 合作表單
  if (role === 'sales') {
    return SALES_ALLOWED_PREFIXES.some(
      (p) => path === p || path.startsWith(p + '/'),
    )
  }

  // 使用者管理：僅系統管理員
  if (path === '/admin/users' || path.startsWith('/admin/users/')) {
    return role === 'admin'
  }

  // 其餘角色 (admin / editor / store_staff)：維持原本的完整存取
  return true
}

// 角色顯示名稱（後台使用者管理下拉 / 標籤）
export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: '系統管理員（全部）',
  editor: '編輯（內容管理）',
  store_staff: '分店人員',
  sales: '名單專員（客戶預約＋合作表單）',
}

// 建立帳號時可選的角色（依序）
export const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'sales', label: ROLE_LABELS.sales },
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'editor', label: ROLE_LABELS.editor },
  { value: 'store_staff', label: ROLE_LABELS.store_staff },
]
