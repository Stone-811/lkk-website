/**
 * 文章 → 「返回哪一個彙整頁、哪一個分類」的對照。
 *
 * 用途：文章頁（pages/[...slug].vue）的返回連結。
 * 2026-10-15 之前那條連結是寫死的 `to="/knowledge-center"` ＋「← 回到知識科普」，
 * 所以學員案例的文章按返回會跑到知識科普，知識科普的文章一律落在預設分類。
 *
 * 🔴 這裡的分類 id 與 server/api/public/wp-articles.get.ts 的 TABS 是同一組事實。
 *    兩邊都要維護。新增或調整分類時，**兩個檔案都要改**，否則症狀是
 *    「彙整頁有這個分類，但從它的文章按返回會掉到別的地方」—— 不會報錯。
 *    沒有合併成單一來源，是因為 TABS 綁著快取鍵、白名單與整組模式的語意，
 *    搬動它的風險高於這點重複。
 *
 * ⚠️ 一篇文章普遍同時掛多個分類（實測：四個知識分類加總 987、聯集只有 621）。
 *    所以要挑「最合適的一個」而不是「第一個命中的」，規則見 resolveBackTo。
 */

export interface BackTo {
  /** 連結目標，含分類 query。 */
  href: string
  /** 連結文字裡的彙整頁名稱，例如「知識科普」。 */
  label: string
}

/** 彙整頁本身。順序即判斷優先序，見 resolveBackTo。 */
const SECTIONS = [
  {
    href: '/cases-center',
    label: '學員案例',
    // 學員故事的主題分類掛在「知識分享」底下，所以一篇案例同時會有知識類的 id。
    // 把它排在知識科普之前，案例文章才不會被判成知識科普。
    anchorId: 1092,
    // 主題 id → 分類代號（與 wp-articles.get.ts 的 CASE_THEMES 同一組）
    tabs: [
      { key: 'metabolic', id: 1291 },
      { key: 'arthritis', id: 1117 },
      { key: 'parkinsons', id: 1116 },
      { key: 'cancer', id: 1118 },
      { key: 'menopause', id: 1156 },
      { key: 'sarcopenia', id: 1119 },
      { key: 'osteoporosis', id: 1157 },
      { key: 'pain', id: 1093 },
      { key: 'ligament', id: 1219 },
      { key: 'alzheimers', id: 1310 },
      { key: 'sport_specific', id: 1186 },
      { key: 'special_group', id: 11 },
    ],
  },
  {
    href: '/activity-center',
    label: '活動資訊',
    anchorId: 448,
    tabs: [],
  },
  {
    href: '/news-center',
    label: '媒體報導',
    anchorId: 14,
    tabs: [],
  },
  {
    href: '/knowledge-center',
    label: '知識科普',
    // 知識科普沒有單一的「根分類」，四個分類任一命中就算。
    anchorId: null,
    tabs: [
      { key: 'sports', id: 17 },
      { key: 'wellness', id: 18 },
      { key: 'elderly', id: 11 },
      { key: 'fitness', id: 9 },
    ],
  },
] as const

/** 取不到分類時的退路：維持 2026-10-15 之前的行為，不要讓返回連結消失。 */
export const DEFAULT_BACK_TO: BackTo = { href: '/knowledge-center', label: '知識科普' }

/**
 * 依文章自己的分類 id 推算返回目標。
 *
 * 規則：
 * 1. 依 SECTIONS 的順序找第一個「命中」的彙整頁。學員案例排最前面，因為案例文章
 *    同時掛著知識類的主題分類，排後面會被判成知識科普。
 * 2. 命中的定義：有 anchorId 就看 anchorId（例如案例一定有 1092）；
 *    沒有 anchorId（知識科普）就看它的任何一個分類 id。
 * 3. 選分類：取該彙整頁 tabs 裡第一個命中的。知識科普的順序與畫面上的分類列一致，
 *    所以「訓練知識」會優先於「運動人文」—— 這只是一個穩定且可預期的選擇，
 *    不保證等於讀者點進來時所在的那個分類（那個資訊文章本身並不知道）。
 *    讀者用瀏覽器上一頁回去時，網址裡的分類會被完整還原，那條路徑才是精確的。
 *
 * 取不到分類（例如上游中斷、走 7 天長效備份副本，那份副本裡沒有 categories 欄位）
 * 時回 DEFAULT_BACK_TO，不會讓返回連結消失或壞掉。
 */
export function resolveBackTo(categoryIds?: unknown): BackTo {
  const ids = Array.isArray(categoryIds)
    ? categoryIds.filter((n): n is number => typeof n === 'number')
    : []
  if (!ids.length) return DEFAULT_BACK_TO

  for (const section of SECTIONS) {
    const hit =
      section.anchorId !== null
        ? ids.includes(section.anchorId)
        : section.tabs.some((t) => ids.includes(t.id))
    if (!hit) continue

    const tab = section.tabs.find((t) => ids.includes(t.id))
    return {
      href: tab ? `${section.href}?tab=${tab.key}` : section.href,
      label: section.label,
    }
  }

  return DEFAULT_BACK_TO
}
