/**
 * 「從哪裡得知練健康？」的選項。
 *
 * 預約體驗與團體課程兩張表單共用同一份清單，避免兩邊各自維護而分歧。
 *
 * ⚠️ 這些字串同時是顯示標籤、也是存進 Firestore 的值
 *    （payload.sources ＋ 頂層 sourceChannel），還會直接進後台名單、
 *    CSV 匯出與兩封通知信。發出去收到名單之後就不要再改字面，
 *    否則舊名單與新名單會在匯出檔裡裂成兩種寫法，而且 leads 的 PATCH
 *    白名單只放行 status 與 internalNote，回填不了。
 *
 * 🔴 改為單選之後，存進 Firestore 的形狀刻意「維持陣列」（只是長度為 1）。
 *    後台名單列表、CSV 匯出、通知信全部是照陣列寫的，維持形狀就不必動它們，
 *    新舊名單在匯出檔裡也是同一種格式。
 */

export type ReferralExpand =
  | { kind: 'none' }
  | { kind: 'select'; options: string[]; placeholder: string }
  | { kind: 'text'; placeholder: string }

export interface ReferralSource {
  value: string
  expand: ReferralExpand
}

/**
 * 兩份「可由後台維護」的下拉清單。
 *
 * 這裡的值是預設，同時也是**退路** —— 後台設定讀不到時（Firestore 故障、
 * 文件不存在）表單必須照常運作，不能因為選項讀不到就讓人送不出表單。
 *
 * ⚠️ 後台只開放「新增」與「停用」，不開放修改既有選項的文字。
 *    理由：這些字串會直接存進名單，而名單的 PATCH 白名單只放行
 *    status 與 internalNote，改了字面就回填不了，舊名單與新名單會
 *    在 CSV 匯出裡裂成兩種寫法。新增不會破壞舊資料，停用只是不再顯示。
 */
export const DEFAULT_DYNAMIC_OPTIONS = {
  social: ['IG', 'FB', 'Threads', 'Line', 'YT', 'Podcast'],
  event: ['聖誕老人賽事', '高齡博覽會'],
  // ⚠️ doctor 這一份表單已經不用了 —— 「醫師/醫療轉介」2026-10-01 改成自行填寫。
  //    保留是因為 /api/admin/referral-options 的兩支端點還讀寫它，
  //    砍掉要連同那兩支一起動，而留著不會出現在表單上。
  //    日後若要改回下拉，把 BASE_SOURCES 那一筆的 expand 換回 select 即可。
  doctor: ['張文穎'],
}

export type DynamicOptions = Partial<Record<keyof typeof DEFAULT_DYNAMIC_OPTIONS, string[]>>

const BASE_SOURCES: ReferralSource[] = [
  { value: '官網', expand: { kind: 'none' } },
  {
    value: '社群',
    expand: {
      kind: 'select',
      options: ['IG', 'FB', 'Threads', 'Line', 'YT', 'Podcast'],
      placeholder: '請選擇平台',
    },
  },
  { value: '參觀', expand: { kind: 'none' } },
  { value: '電話詢問', expand: { kind: 'none' } },
  { value: '傳單/DM', expand: { kind: 'none' } },
  { value: '親友推薦', expand: { kind: 'none' } },
  {
    value: '練健康夥伴推薦',
    expand: { kind: 'text', placeholder: '請填寫同仁姓名' },
  },
  {
    // 2026-10-01 業主指定改為自行填寫。原本是第二層下拉，選項由 Firestore 的
    // referralOptions.doctor 維護 —— 但後台沒有對應的維護頁面（只有 API 端點），
    // 合作醫師與院所也一直在變，下拉永遠追不上。改成文字輸入後：
    //   ① 不必再維護清單 ② 下拉為空時整個選項會消失的問題也一併不存在
    value: '醫師/醫療轉介',
    expand: { kind: 'text', placeholder: '請填寫醫師或院所名稱' },
  },
  {
    value: '實體活動',
    expand: {
      kind: 'select',
      options: ['聖誕老人賽事', '高齡博覽會'],
      placeholder: '請選擇活動',
    },
  },
  { value: '其他', expand: { kind: 'text', placeholder: '請說明從哪裡得知' } },
]

/**
 * 產生最終的選項清單。
 * 傳入後台設定就用後台的；沒傳、或某一份是空的，就退回預設值。
 */
export function buildReferralSources(dynamic?: DynamicOptions): ReferralSource[] {
  // undefined ＝ 沒設定過，用預設；空陣列 ＝ 業主刻意清空，要尊重
  const pick = (k: keyof typeof DEFAULT_DYNAMIC_OPTIONS) =>
    dynamic?.[k] === undefined ? DEFAULT_DYNAMIC_OPTIONS[k] : (dynamic[k] as string[])
  // 只列還在用下拉的選項。「醫師/醫療轉介」已改為自行填寫，不在這裡
  const byValue: Record<string, keyof typeof DEFAULT_DYNAMIC_OPTIONS> = {
    社群: 'social',
    實體活動: 'event',
  }
  return BASE_SOURCES.map((s) => {
    const key = byValue[s.value]
    return key && s.expand.kind === 'select'
      ? { ...s, expand: { ...s.expand, options: pick(key) } }
      : s
  }).filter(
    // 下拉一個選項都沒有時，整個主選項不顯示 ——
    // 提供一個選不了東西的空下拉，使用者會卡在必填而送不出表單
    (s) => !(s.expand.kind === 'select' && s.expand.options.length === 0)
  )
}

/** 未接後台設定時的靜態清單（保留給不需要動態選項的地方）。 */
export const REFERRAL_SOURCES = buildReferralSources()

/** 值與細項組成最終要存的字串。格式沿用既有的「其他: xxx」，冒號後有一個半形空格。 */
export function composeReferral(value: string, detail: string): string {
  const d = (detail || '').trim()
  return d ? `${value}: ${d}` : value
}

/** 取某個選項的展開設定；找不到就是不展開。 */
export function getReferralExpand(value: string, list = REFERRAL_SOURCES): ReferralExpand {
  return list.find((s) => s.value === value)?.expand ?? { kind: 'none' }
}
