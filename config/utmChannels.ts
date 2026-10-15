/**
 * 投放管道：顯示名稱 ＋ utm_source ＋ utm_medium。
 *
 * 一個管道＝一組三元組。後台「UTM 活動」勾幾個管道就產生幾條連結，
 * 每條帶各自的 utm_source／utm_medium，名單與 GA4 才分得出來源。
 *
 * 這份是**預設值，同時也是退路** —— 後台設定讀不到時（Firestore 故障、
 * 文件不存在）仍然要能建活動、產連結，不能因為選項讀不到就癱瘓。
 * 業主在後台新增的管道存在 Firestore `settings/utmChannels`，疊在這份上面。
 *
 * ⚠️ 後台只開放「新增」與「停用」，不開放修改既有管道的文字。
 *    `label` 會存進名單的 leadSource（也是 `?src=` 的值），
 *    `source`／`medium` 會進 GA4 與名單的 payload.utm ——
 *    三者發出去之後改字面都救不回來（leads 的 PATCH 白名單只放行
 *    status 與 internalNote，GA4 的歷史資料更不可能回填）。
 *    停用只是不再出現在選單，不影響已經發出去的連結與已收到的名單。
 */

export interface UtmChannel {
  /** 中文顯示名稱。同時是 `?src=` 的值與後台「來源」篩選的選項。 */
  label: string
  /** utm_source。小寫英數與 - _。 */
  source: string
  /** utm_medium。只能從 GA4_MEDIUMS 挑，理由見下。 */
  medium: string
}

/**
 * 🔴 utm_medium 一律從這份清單挑，不開放自由打字。
 *
 * GA4 的「預設管道分組」是拿 medium 去比對特定字串的。填一個不在清單上的值
 *（例如 `line`、`社群`），那批流量在 GA4 會被歸到 **Unassigned**，
 * 而且**歷史資料改不回來** —— 不是改設定就能補的，是那段期間的報表永久歸錯類。
 *
 * ⚠️ `offline` 其實不是 GA4 認得的值，用它的流量同樣會進 Unassigned。
 *    之所以留著，是因為「傳單」這個既有管道一直用它，現在改掉會讓
 *    同一個管道的歷史資料裂成兩段。要調整請另外評估，不要順手改。
 */
export const GA4_MEDIUMS: { value: string; label: string }[] = [
  { value: 'referral', label: 'referral — 其他網站連過來' },
  { value: 'social', label: 'social — 社群平台' },
  { value: 'email', label: 'email — 電子郵件' },
  { value: 'cpc', label: 'cpc — 付費點擊廣告' },
  { value: 'display', label: 'display — 多媒體廣告' },
  { value: 'affiliate', label: 'affiliate — 聯盟行銷' },
  { value: 'organic', label: 'organic — 自然搜尋' },
  { value: 'offline', label: 'offline — 線下（⚠️ 非 GA4 標準，會歸到 Unassigned）' },
]

export const GA4_MEDIUM_VALUES = GA4_MEDIUMS.map((m) => m.value)

/** 預設的七個管道。與 2026-10 之前寫死的 SOURCE_CHANNELS ＋ 兩張對照表完全相同。 */
export const DEFAULT_UTM_CHANNELS: UtmChannel[] = [
  { label: '網站', source: 'website', medium: 'referral' },
  { label: 'LINE', source: 'line', medium: 'social' },
  { label: 'Facebook', source: 'facebook', medium: 'social' },
  { label: 'Instagram', source: 'instagram', medium: 'social' },
  { label: 'Email', source: 'email', medium: 'email' },
  { label: '傳單', source: 'flyer', medium: 'offline' },
  { label: 'Google', source: 'google', medium: 'cpc' },
]

/** utm_source 的格式：小寫英數起頭，之後可含 - 與 _，長度 2–40。 */
export const UTM_SOURCE_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/

export function normalizeUtmSource(raw: string): string {
  return String(raw || '').trim().toLowerCase()
}

export function validateUtmChannel(label: string, source: string, medium: string): string | null {
  if (!String(label || '').trim()) return '請填寫顯示名稱'
  const s = normalizeUtmSource(source)
  if (!s) return '請填寫 utm_source'
  if (!UTM_SOURCE_RE.test(s)) {
    return 'utm_source 只能用小寫英文、數字、- 與 _，長度 2–40，且需以英數開頭'
  }
  if (!GA4_MEDIUM_VALUES.includes(String(medium))) return '請選擇 utm_medium'
  return null
}
