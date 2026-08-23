// CSV 匯出（後台名單頁共用）
// - 前置 BOM（﻿）讓 Excel 以 UTF-8 開啟、中文不亂碼
// - 每格加雙引號並跳脫內部引號（舊版 leads/cooperation 未跳脫，備註含「"」會爆欄）
// - null / undefined 輸出為空字串（舊版會印出字面 "undefined"）
export function useCsvExport() {
  function exportCsv(
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][],
  ) {
    const esc = (cell: unknown) => `"${String(cell ?? '').replace(/"/g, '""')}"`
    const csvContent =
      '﻿' + [headers, ...rows].map((row) => row.map(esc).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return { exportCsv }
}
