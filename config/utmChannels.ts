/**
 * utm_source 的選項清單。
 *
 * 🔴 2026-10-15 的設計修正：utm_source 與 utm_medium **是獨立的兩個維度**，
 *    任何組合都合法。同一個 source 配不同 medium 是正常且必要的：
 *      google / cpc      → Google Ads
 *      google / organic  → Google 自然搜尋
 *      google / referral → 從某個 Google 產品的連結點過來
 *    medium 該填什麼取決於「你實際做了什麼」，不取決於 source 是誰。
 *
 *    舊版把兩者綁成一組固定的「投放管道」，等於把 Google 永久鎖在 cpc，
 *    表達不出 google/organic。所以後台改成兩題各選一個。
 *
 *    這份清單裡的 `medium` 退化成「挑這個 source 時自動帶出的預設值」，
 *    使用者可以改。它不是約束。
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
  /** 顯示名稱，例如「LINE」。純粹是給人在下拉裡認的。 */
  label: string
  /** utm_source。小寫英數與 - _。 */
  source: string
  /**
   * 挑這個 source 時自動帶出的 utm_medium —— **預設值，不是約束**。
   * 使用者在表單上可以改成任何 GA4_MEDIUMS 裡的值。
   */
  medium: string
}

/**
 * 🔴 utm_medium 一律從這份清單挑，不開放自由打字。
 *
 * GA4 的「預設管道分組」是拿 medium 去比對特定字串的。填一個不在清單上的值
 *（例如 `line`、`社群`），那批流量在 GA4 會被歸到 **Unassigned**，
 * 而且**歷史資料改不回來** —— 不是改設定就能補的，是那段期間的報表永久歸錯類。
 *
 * 🔴 這份清單**不開放業主自行新增**（2026-10-15 業主決定）。
 *    utm_source 可以自由新增，因為它本來就是自由維度；medium 不行，
 *    因為清單外的值會讓那批流量在 GA4 永久歸到 Unassigned。
 *
 * ⚠️ `offline` 已於 2026-10-15 移除（業主要求）。它不是 GA4 認得的值，
 *    用它的流量一直都歸在 Unassigned。唯一在用它的是「傳單」來源，
 *    而傳單同日一併從來源清單移除。
 *    **既有活動的連結不受影響** —— 它們走 LEGACY_CHANNEL_MAP，見下。
 */
export const GA4_MEDIUMS: { value: string; label: string }[] = [
  { value: 'referral', label: 'referral — 其他網站連過來' },
  { value: 'social', label: 'social — 社群平台' },
  { value: 'email', label: 'email — 電子郵件' },
  { value: 'cpc', label: 'cpc — 付費點擊廣告' },
  { value: 'display', label: 'display — 多媒體廣告' },
  { value: 'affiliate', label: 'affiliate — 聯盟行銷' },
  { value: 'organic', label: 'organic — 自然搜尋' },
]

export const GA4_MEDIUM_VALUES = GA4_MEDIUMS.map((m) => m.value)

/**
 * 🔴 凍結的歷史對照：2026-10-15 之前「投放管道」的七組固定值。
 *
 * **只給舊活動組連結用，永遠不要改也不要刪。**
 *
 * 2026-10-15 之前的活動存的是 { channels: ['LINE','傳單'] } 這種管道名稱，
 * 連結是讀取當下即時組出來的、不是存死的。如果讓它去查「現在的來源清單」，
 * 那麼來源清單一被編輯（例如這次拿掉傳單），後台顯示的舊連結就會跟
 * **實際已經發出去、現在還在流通**的那些不一致 —— 而且是無聲的。
 * 所以舊活動一律查這份凍結的表。
 */
export const LEGACY_CHANNEL_MAP: Readonly<Record<string, UtmChannel>> = Object.freeze({
  '網站': { label: '網站', source: 'website', medium: 'referral' },
  'LINE': { label: 'LINE', source: 'line', medium: 'social' },
  'Facebook': { label: 'Facebook', source: 'facebook', medium: 'social' },
  'Instagram': { label: 'Instagram', source: 'instagram', medium: 'social' },
  'Email': { label: 'Email', source: 'email', medium: 'email' },
  '傳單': { label: '傳單', source: 'flyer', medium: 'offline' },
  'Google': { label: 'Google', source: 'google', medium: 'cpc' },
})

/**
 * 現在的 utm_source 預設選項。業主可在後台新增／停用，疊在這份上面。
 *
 * ⚠️ 「傳單」（flyer）已於 2026-10-15 依業主要求移除。
 *    它是唯一使用 offline 的來源，而 offline 不是 GA4 認得的值。
 *    移除只影響「之後新建的活動選不到它」；既有活動與已發出的連結都不受影響。
 *    若 Firestore 裡已經有存過的清單，傳單仍會出現在後台 —— 用面板的「停用」收掉。
 */
export const DEFAULT_UTM_CHANNELS: UtmChannel[] = [
  { label: '網站', source: 'website', medium: 'referral' },
  { label: 'LINE', source: 'line', medium: 'social' },
  { label: 'Facebook', source: 'facebook', medium: 'social' },
  { label: 'Instagram', source: 'instagram', medium: 'social' },
  { label: 'Email', source: 'email', medium: 'email' },
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
