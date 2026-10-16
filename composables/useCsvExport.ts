// CSV 匯出（後台名單頁共用）
// - 前置 BOM 讓 Excel 以 UTF-8 開啟、中文不亂碼
// - 每格加雙引號並跳脫內部引號（舊版 leads/cooperation 未跳脫，備註含「"」會爆欄）
// - null / undefined 輸出為空字串（舊版會印出字面 "undefined"）
// - 2026-10-16：電話保留開頭的 0、防止儲存格被 Excel 當成公式（見 toCsvCell）

/**
 * 看起來像電話：0 或 + 開頭（或 (0 開頭的區碼），後面只有數字、空白、-、括號；
 * 或是 9 碼以上的純數字（例如漏打 + 的 886912345678）。
 * 規則限定字元，值裡不可能有引號，包成 ="…" 時不會被自己的包裝打成公式。
 * ⚠️ 刻意不認 1960-05-01 這種日期：出生年月日照舊由 Excel 自己處理，畫面不變。
 */
const PHONE_LIKE = /^(?:(?:\+\d|0\d|\(0\d)[\d ()-]{4,}|\d{9,})$/

/** Excel 會把這些字元開頭的儲存格當成公式（業主只用 Excel 開，2026-10-16 確認）。 */
const FORMULA_START = /^[=+\-@\t\r]/

/**
 * 一格的輸出（不含外層引號跳脫）。
 *   - 電話：="0912345678"，Excel 當成文字顯示，開頭的 0 與 + 都保留
 *   - 剛好是 '-'（各名單頁的空值佔位）：原樣，不加撇號
 *   - 其他以 = + - @ 開頭：前面加 '，避免被當成公式執行
 *   - 其餘：原樣
 * 先 String() 再判斷：陣列、物件不能拿 v[0] 判斷首字（陣列的 v[0] 是整個元素）。
 */
export function toCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'number') return String(cell)
  const s = String(cell)
  const trimmed = s.trim()
  if (trimmed.length <= 40 && PHONE_LIKE.test(trimmed)) return `="${trimmed}"`
  if (s === '-') return s
  if (FORMULA_START.test(s)) return `'${s}`
  return s
}

/** 整份 CSV 字串（含 BOM）。抽出來是為了能在瀏覽器以外驗證輸出。 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const quote = (cell: unknown) => `"${toCsvCell(cell).replace(/"/g, '""')}"`
  // BOM 寫成跳脫字元：看不見的字面字元很容易在編輯時被吃掉，少了它 Excel 開檔中文全亂碼
  return '﻿' + [headers, ...rows].map((row) => row.map(quote).join(',')).join('\n')
}

export function useCsvExport() {
  function exportCsv(
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][],
  ) {
    const csvContent = buildCsv(headers, rows)

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return { exportCsv }
}
