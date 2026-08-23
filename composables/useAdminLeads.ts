// 後台名單頁共用邏輯（客戶預約 leads.vue / 團課預約 group-classes.vue）
// 涵蓋：載入狀態、搜尋、日期區間、宣告式篩選（含已套用 chips）、排序、
// 詳情彈窗、狀態更新、內部備註儲存。
// 各頁保留：資料抓取與欄位映射（fetch）、篩選定義（filters）、表格欄位、
// 詳情彈窗內容（slot）、CSV 欄位（配 useCsvExport）。
import type { ComputedRef, Ref } from 'vue'
import { ref, computed, onMounted } from 'vue'

export interface AdminLead {
  id: string
  name: string
  phone: string
  email?: string
  storeId?: string
  storeName?: string
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
  internalNote?: string
  message?: string
  payload?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

export interface LeadFilterDef {
  key: string
  label: string
  widthClass: string
  placeholder: string
  options: ComputedRef<Array<string | { value: string; label: string }>>
  value: Ref<string>
  match: (lead: AdminLead, value: string) => boolean
  // 已套用 chip 顯示的值（預設顯示原值；狀態/分店這種 value≠label 的傳入轉換）
  chipLabel?: (value: string) => string
}

export type LeadSortColumn = 'createdAt' | 'name' | 'store' | 'status'

export function useAdminLeads(options: {
  fetch: () => Promise<AdminLead[]>
  filters: (ctx: { leads: Ref<AdminLead[]> }) => LeadFilterDef[]
}) {
  const leads = ref<AdminLead[]>([])
  const isLoading = ref(true)
  const error = ref('')

  const searchQuery = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')

  const filterDefs = options.filters({ leads })

  const sortBy = ref<LeadSortColumn>('createdAt')
  const sortDir = ref<'asc' | 'desc'>('desc')

  function toggleSort(column: LeadSortColumn) {
    if (sortBy.value === column) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = column
      sortDir.value = column === 'createdAt' ? 'desc' : 'asc'
    }
  }

  async function load() {
    isLoading.value = true
    error.value = ''
    try {
      leads.value = await options.fetch()
    } catch (e: any) {
      error.value = e.data?.message || '載入失敗'
      console.error('Error fetching leads:', e)
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)

  // 已套用的篩選（給 chip 顯示與單獨移除）
  const activeFilters = computed(() => {
    const out: { key: string; label: string; value: string; clear: () => void }[] = []
    if (searchQuery.value) out.push({ key: 'q', label: '搜尋', value: searchQuery.value, clear: () => (searchQuery.value = '') })
    for (const f of filterDefs) {
      if (f.value.value !== 'all') {
        out.push({
          key: f.key,
          label: f.label,
          value: f.chipLabel ? f.chipLabel(f.value.value) : f.value.value,
          clear: () => (f.value.value = 'all'),
        })
      }
    }
    if (dateFrom.value || dateTo.value) out.push({ key: 'date', label: '日期', value: `${dateFrom.value || '…'} ～ ${dateTo.value || '…'}`, clear: () => { dateFrom.value = ''; dateTo.value = '' } })
    return out
  })
  const hasActiveFilters = computed(() => activeFilters.value.length > 0)
  function clearAllFilters() {
    searchQuery.value = ''
    for (const f of filterDefs) f.value.value = 'all'
    dateFrom.value = ''
    dateTo.value = ''
  }

  const filteredLeads = computed(() => {
    const result = leads.value.filter((lead) => {
      for (const f of filterDefs) {
        if (f.value.value !== 'all' && !f.match(lead, f.value.value)) return false
      }
      if (dateFrom.value && new Date(lead.createdAt) < new Date(dateFrom.value + 'T00:00:00')) return false
      if (dateTo.value && new Date(lead.createdAt) > new Date(dateTo.value + 'T23:59:59.999')) return false
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        return (
          lead.name.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          (lead.email && lead.email.toLowerCase().includes(query))
        )
      }
      return true
    })

    result.sort((a, b) => {
      let comparison = 0
      if (sortBy.value === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy.value === 'store') {
        comparison = (a.storeName || '').localeCompare(b.storeName || '')
      } else if (sortBy.value === 'status') {
        comparison = a.status.localeCompare(b.status)
      } else {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        comparison = dateA - dateB
      }
      return sortDir.value === 'desc' ? -comparison : comparison
    })

    return result
  })

  // 狀態更新（表格內下拉即時 PATCH）
  async function updateStatus(lead: AdminLead, event: Event) {
    const target = event.target as HTMLSelectElement
    const newStatus = target.value
    try {
      await $fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      lead.status = newStatus as AdminLead['status']
    } catch (e: any) {
      alert(e.data?.message || '更新失敗')
    }
  }

  // 詳情彈窗 + 內部備註
  const selectedLead = ref<AdminLead | null>(null)
  const noteText = ref('')
  const saving = ref(false)

  function openDetail(lead: AdminLead) {
    selectedLead.value = lead
    noteText.value = lead.internalNote || ''
  }
  function closeDetail() {
    selectedLead.value = null
  }
  async function handleSaveNote() {
    if (!selectedLead.value) return
    saving.value = true
    try {
      await $fetch(`/api/admin/leads/${selectedLead.value.id}`, {
        method: 'PATCH',
        body: { internalNote: noteText.value },
      })
      const savedId = selectedLead.value?.id
      const lead = leads.value.find((l) => l.id === savedId)
      if (lead) lead.internalNote = noteText.value
      // 存檔期間彈窗可能已被關閉（selectedLead 變 null）——舊版此處會丟例外
      // 誤報「儲存失敗」（實際已寫入 DB），加防護後正確回報成功
      if (selectedLead.value) selectedLead.value.internalNote = noteText.value
      alert('備註已儲存')
    } catch (e: any) {
      alert(e.data?.message || '儲存失敗')
    } finally {
      saving.value = false
    }
  }

  return {
    leads, isLoading, error,
    searchQuery, dateFrom, dateTo,
    filterDefs, activeFilters, hasActiveFilters, clearAllFilters,
    sortBy, sortDir, toggleSort,
    filteredLeads,
    updateStatus,
    selectedLead, noteText, saving, openDetail, closeDetail, handleSaveNote,
  }
}

// 名單頁共用常數：?src= 規範管道清單（docs/廠商表單網址規範.md）
export const SOURCE_CHANNELS = ['網站', 'LINE', 'Facebook', 'Instagram', 'Email', '傳單', 'Google']

// 名單頁共用常數：狀態篩選選項
export const LEAD_STATUS_FILTER_OPTIONS = [
  { value: 'new', label: '新名單' },
  { value: 'contacted', label: '已聯繫' },
  { value: 'scheduled', label: '已預約' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]
