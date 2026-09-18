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

export const REFERRAL_SOURCES: ReferralSource[] = [
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
    // ⚠️ 規格只寫「動態展開」沒有列出選項，這裡先做成文字欄位：
    //    文字能記下的資訊比未知的下拉清單多，日後要改成下拉也只需改這一處。
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

/** 值與細項組成最終要存的字串。格式沿用既有的「其他: xxx」，冒號後有一個半形空格。 */
export function composeReferral(value: string, detail: string): string {
  const d = (detail || '').trim()
  return d ? `${value}: ${d}` : value
}

/** 取某個選項的展開設定；找不到就是不展開。 */
export function getReferralExpand(value: string): ReferralExpand {
  return REFERRAL_SOURCES.find((s) => s.value === value)?.expand ?? { kind: 'none' }
}
