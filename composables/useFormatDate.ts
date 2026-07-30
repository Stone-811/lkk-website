/**
 * Shared composable for date formatting
 * Used across admin pages for consistent date display
 */

export function useFormatDate() {
  /**
   * Format date to full datetime string (YYYY/MM/DD HH:mm)
   */
  function formatDateTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-'
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Format date to date only string (YYYY/MM/DD)
   */
  function formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-'
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  /**
   * Format date to relative time (e.g., "2 小時前", "3 天前")
   */
  function formatRelativeTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-'
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(date.getTime())) return '-'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '剛剛'
    if (diffMins < 60) return `${diffMins} 分鐘前`
    if (diffHours < 24) return `${diffHours} 小時前`
    if (diffDays < 7) return `${diffDays} 天前`
    return formatDate(date)
  }

  return {
    formatDateTime,
    formatDate,
    formatRelativeTime,
  }
}
