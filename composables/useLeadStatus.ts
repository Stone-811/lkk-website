/**
 * Shared composable for lead status labels and colors
 * Used across admin pages: leads.vue, cooperation.vue, index.vue (dashboard)
 */

export interface StatusConfig {
  label: string
  class: string
}

export interface LeadTypeConfig {
  label: string
  class: string
}

export function useLeadStatus() {
  const statusLabels: Record<string, StatusConfig> = {
    new: { label: '新名單', class: 'bg-blue-100 text-blue-700' },
    contacted: { label: '已聯繫', class: 'bg-yellow-100 text-yellow-700' },
    scheduled: { label: '已預約', class: 'bg-purple-100 text-purple-700' },
    completed: { label: '已完成', class: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-600' },
  }

  const leadTypeLabels: Record<string, LeadTypeConfig> = {
    booking: { label: '預約體驗', class: 'bg-blue-100 text-blue-700' },
    franchise: { label: '加盟洽詢', class: 'bg-purple-100 text-purple-700' },
    cooperation: { label: '合作洽詢', class: 'bg-green-100 text-green-700' },
  }

  const statusOptions = [
    { value: '', label: '全部狀態' },
    { value: 'new', label: '新名單' },
    { value: 'contacted', label: '已聯繫' },
    { value: 'scheduled', label: '已預約' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ]

  const leadTypeOptions = [
    { value: '', label: '全部來源' },
    { value: 'booking', label: '預約體驗' },
    { value: 'cooperation', label: '合作洽詢' },
    { value: 'franchise', label: '加盟洽詢' },
  ]

  function getStatusLabel(status: string): string {
    return statusLabels[status]?.label || status
  }

  function getStatusClass(status: string): string {
    return statusLabels[status]?.class || 'bg-gray-100 text-gray-600'
  }

  function getLeadTypeLabel(type: string): string {
    return leadTypeLabels[type]?.label || type
  }

  function getLeadTypeClass(type: string): string {
    return leadTypeLabels[type]?.class || 'bg-gray-100 text-gray-700'
  }

  return {
    statusLabels,
    leadTypeLabels,
    statusOptions,
    leadTypeOptions,
    getStatusLabel,
    getStatusClass,
    getLeadTypeLabel,
    getLeadTypeClass,
  }
}
