// 前端密碼強度提示/檢查（與 server/utils/auth.ts 的 validatePasswordStrength 保持一致）。
// 僅為即時提示，真正強制在後端。
export function validatePasswordStrength(pw: string): string | null {
  const s = String(pw || '')
  if (s.length < 8) return '密碼至少需 8 碼'
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) return '密碼需同時包含英文字母與數字'
  return null
}

export const PASSWORD_HINT = '至少 8 碼，須包含英文字母與數字'
