// 「不限年齡免費」合作方名冊。
//
// 原理：/booking?v=freetrial&co=<代號>
//   ?v=freetrial  → bookingVariants 的 freetrial，決定「行為」（不限年齡免費）
//   ?co=<代號>    → 這份名冊，決定「是誰」（公司名、到期日）
//
// 為什麼要拆成兩層：這些合作方之間真正不同的只有公司名與期間，行為完全一樣。
// 所以不需要每一家各開一個變體（那會讓 bookingVariants 無限長），只要加一行名冊。
//
// 🔴 co 帶的是「代號」不是公司名。查不到就當沒帶，不會把原字串寫進資料。
//    若直接讓網址上的字進 payload.company，任何人都能偽造合作方名稱 ——
//    那串字會進通知信主旨的【】、進名單、進後台「公司」篩選的選項清單，
//    而且事後清不掉（leads 的 PATCH 只放行 status / internalNote）。
//
// 🔴 company 一旦發出去就不要改字面。已經收到的名單救不回來，理由同上。

export interface FreeTrialPartner {
  /** 公司名。進 payload.company、通知信主旨的【】、後台「公司」篩選。發出去後不要改。 */
  company: string
  /**
   * 到期日（含當日），格式 YYYY-MM-DD，**台北時間**。
   * 過期後這一筆就不再套用 → 連結自動退回一般表單，不需要再部署一次。
   *
   * ⚠️ 刻意「只擋到期、不擋開始」：合作方上線前通常會要求先看頁面，
   *    擋開始日會讓他們看到一般表單的價格（50歲以上免費／未滿50歲 $500）而誤會。
   *    開始日寫在 note 裡備查即可 —— 連結什麼時候發出去是人決定的。
   */
  endDate: string
  /** 備查用：合作期間、窗口、合約依據。不會顯示在任何畫面上。 */
  note?: string
}

export const freeTrialPartners: Record<string, FreeTrialPartner> = {
  // 民國 115/11/1 – 116/10/31
  taiwanlife: {
    company: '台灣人壽',
    endDate: '2027-10-31',
    note: '2026-11-01 起生效至 2027-10-31 屆滿（民國 115/11/1 – 116/10/31）。'
      + ' 到期前要主動通知對方停止投放 —— 期滿後舊連結會退回一般表單，'
      + ' 被承諾免費的人會看到「未滿50歲 $500」。',
  },
}

/**
 * 今天的日期（台北時間），YYYY-MM-DD。
 *
 * 🔴 不可以直接用 new Date() 的 UTC 日期比。Cloud Run 跑 UTC、台灣是 +8，
 *    10/31 台北時間晚上八點就已經是 UTC 的 11/1 —— 活動會提早八小時失效。
 *    en-CA 的格式剛好就是 YYYY-MM-DD，可以直接字串比大小。
 */
export function taipeiToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(now)
}

/** 依 ?co= 取合作方（陣列／未知／已過期都回 null）。 */
export function getFreeTrialPartner(
  code?: string | string[] | null,
  today: string = taipeiToday(),
): FreeTrialPartner | null {
  const k = Array.isArray(code) ? code[0] : code
  if (!k) return null
  const partner = freeTrialPartners[k]
  if (!partner) return null
  return partner.endDate >= today ? partner : null
}
