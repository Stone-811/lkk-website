<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { bookingVariants } from '~/config/bookingVariants'

const { statusLabels, getStatusLabel, getStatusClass } = useLeadStatus()
const { formatDateTime } = useFormatDate()

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '客戶預約｜練健康後台',
})

interface Lead {
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

const leads = ref<Lead[]>([])
const stores = ref<{ id: string; name: string }[]>([])
const isLoading = ref(true)
const error = ref('')

const selectedStore = ref('all')
const selectedStatus = ref('all')
const selectedCompany = ref('all')
const selectedSource = ref('all')
const selectedUtmSource = ref('all')
const selectedUtmMedium = ref('all')
const selectedUtmCampaign = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const searchQuery = ref('')
const sortBy = ref<'createdAt' | 'name' | 'store' | 'status'>('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(column: 'createdAt' | 'name' | 'store' | 'status') {
  if (sortBy.value === column) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortDir.value = column === 'createdAt' ? 'desc' : 'asc'
  }
}

// Detail modal
const selectedLead = ref<Lead | null>(null)
const noteText = ref('')
const saving = ref(false)

// Fetch leads from API (only booking type)
async function fetchLeads() {
  isLoading.value = true
  error.value = ''
  try {
    const [leadsRes, storesRes] = await Promise.all([
      $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=booking'),
      $fetch<{ success: boolean; data: any[] }>('/api/admin/stores'),
    ])

    if (storesRes.success) {
      stores.value = storesRes.data.map(s => ({ id: s.id, name: s.name }))
    }

    const storeMap: Record<string, string> = {}
    stores.value.forEach(s => { storeMap[s.id] = s.name })

    if (leadsRes.success) {
      leads.value = leadsRes.data.map((lead: any) => ({
        ...lead,
        storeName: lead.storeId ? (storeMap[lead.storeId] || lead.storeId) : '-',
      }))
    }
  } catch (e: any) {
    error.value = e.data?.message || '載入失敗'
    console.error('Error fetching leads:', e)
  } finally {
    isLoading.value = false
  }
}

// Update lead status
async function updateStatus(lead: Lead, event: Event) {
  const target = event.target as HTMLSelectElement
  const newStatus = target.value
  try {
    await $fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    lead.status = newStatus as Lead['status']
  } catch (e: any) {
    alert(e.data?.message || '更新失敗')
  }
}

onMounted(fetchLeads)


// 廠商來源管道清單（?src= 規範，見 docs/廠商表單網址規範.md）
const SOURCE_CHANNELS = ['網站', 'LINE', 'Facebook', 'Instagram', 'Email', '傳單', 'Google']

// 「公司」篩選選項：變體設定 company ∪ 名單實際 company（設定當底 → 亞培/南山即使還沒有名單也一定在）
const companyOptions = computed(() => {
  const set = new Set<string>()
  Object.values(bookingVariants).forEach((v) => { if (v.company) set.add(v.company) })
  leads.value.forEach((l) => { const c = l.payload?.company; if (c) set.add(c) })
  return Array.from(set).sort()
})
// 「來源」篩選選項：?src= 規範管道清單 ∪ 名單實際 leadSource（管道用固定順序、額外的接後面）
const sourceOptions = computed(() => {
  const set = new Set<string>(SOURCE_CHANNELS)
  leads.value.forEach((l) => { const s = l.payload?.leadSource; if (s) set.add(s) })
  return Array.from(set)
})

// 狀態/分店 選項（給可搜尋下拉；狀態的值≠顯示文字）
const statusFilterOptions = [
  { value: 'new', label: '新名單' },
  { value: 'contacted', label: '已聯繫' },
  { value: 'scheduled', label: '已預約' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]
const storeFilterOptions = computed(() => stores.value.map((s) => ({ value: s.id, label: s.name })))

// UTM 篩選選項：從現有名單自動蒐集（去重、排序）
function utmOptions(field: 'source' | 'medium' | 'campaign') {
  const set = new Set<string>()
  leads.value.forEach((l) => { const v = l.payload?.utm?.[field]; if (v) set.add(v) })
  return Array.from(set).sort()
}
const utmSourceOptions = computed(() => utmOptions('source'))
const utmMediumOptions = computed(() => utmOptions('medium'))
const utmCampaignOptions = computed(() => utmOptions('campaign'))

// 已套用的篩選（給 chip 顯示與單獨移除）
const activeFilters = computed(() => {
  const out: { key: string; label: string; value: string; clear: () => void }[] = []
  if (searchQuery.value) out.push({ key: 'q', label: '搜尋', value: searchQuery.value, clear: () => (searchQuery.value = '') })
  if (selectedStore.value !== 'all') out.push({ key: 'store', label: '分店', value: storeFilterOptions.value.find((o) => o.value === selectedStore.value)?.label || selectedStore.value, clear: () => (selectedStore.value = 'all') })
  if (selectedStatus.value !== 'all') out.push({ key: 'status', label: '狀態', value: statusFilterOptions.find((o) => o.value === selectedStatus.value)?.label || selectedStatus.value, clear: () => (selectedStatus.value = 'all') })
  if (selectedCompany.value !== 'all') out.push({ key: 'company', label: '公司', value: selectedCompany.value, clear: () => (selectedCompany.value = 'all') })
  if (selectedSource.value !== 'all') out.push({ key: 'source', label: '來源', value: selectedSource.value, clear: () => (selectedSource.value = 'all') })
  if (selectedUtmSource.value !== 'all') out.push({ key: 'us', label: 'UTM 來源', value: selectedUtmSource.value, clear: () => (selectedUtmSource.value = 'all') })
  if (selectedUtmMedium.value !== 'all') out.push({ key: 'um', label: 'UTM 媒介', value: selectedUtmMedium.value, clear: () => (selectedUtmMedium.value = 'all') })
  if (selectedUtmCampaign.value !== 'all') out.push({ key: 'uc', label: 'UTM 活動', value: selectedUtmCampaign.value, clear: () => (selectedUtmCampaign.value = 'all') })
  if (dateFrom.value || dateTo.value) out.push({ key: 'date', label: '日期', value: `${dateFrom.value || '…'} ～ ${dateTo.value || '…'}`, clear: () => { dateFrom.value = ''; dateTo.value = '' } })
  return out
})
const hasActiveFilters = computed(() => activeFilters.value.length > 0)
function clearAllFilters() {
  searchQuery.value = ''
  selectedStore.value = 'all'
  selectedStatus.value = 'all'
  selectedCompany.value = 'all'
  selectedSource.value = 'all'
  selectedUtmSource.value = 'all'
  selectedUtmMedium.value = 'all'
  selectedUtmCampaign.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
}

const filteredLeads = computed(() => {
  let result = leads.value.filter(lead => {
    if (selectedStore.value !== 'all' && lead.storeId !== selectedStore.value) return false
    if (selectedStatus.value !== 'all' && lead.status !== selectedStatus.value) return false
    if (selectedCompany.value !== 'all' && (lead.payload?.company || '') !== selectedCompany.value) return false
    if (selectedSource.value !== 'all' && (lead.payload?.leadSource || '') !== selectedSource.value) return false
    if (selectedUtmSource.value !== 'all' && (lead.payload?.utm?.source || '') !== selectedUtmSource.value) return false
    if (selectedUtmMedium.value !== 'all' && (lead.payload?.utm?.medium || '') !== selectedUtmMedium.value) return false
    if (selectedUtmCampaign.value !== 'all' && (lead.payload?.utm?.campaign || '') !== selectedUtmCampaign.value) return false
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

  // Sort
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

function openDetail(lead: Lead) {
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
    const lead = leads.value.find(l => l.id === selectedLead.value?.id)
    if (lead) lead.internalNote = noteText.value
    selectedLead.value.internalNote = noteText.value
    alert('備註已儲存')
  } catch (e: any) {
    alert(e.data?.message || '儲存失敗')
  } finally {
    saving.value = false
  }
}

function handleExport() {
  const headers = ['姓名', '電話', 'Email', '分店', '狀態', '性別', '出生年月', 'LINE ID', '運動目的', '偏好時段', '付款方式', '得知管道', '填寫者', '與學員關係', '預約者姓名', '聯繫電話', '健康狀況', 'UTM來源', 'UTM形式', 'UTM活動', 'UTM素材', '備註', '建立時間']
  const rows = filteredLeads.value.map(lead => {
    // 處理運動目的
    let exerciseGoalsText = ''
    if (lead.payload?.exerciseGoals && lead.payload.exerciseGoals.length > 0) {
      exerciseGoalsText = lead.payload.exerciseGoals.join('、')
      if (lead.payload.exerciseGoalOther) {
        exerciseGoalsText += `（其他：${lead.payload.exerciseGoalOther}）`
      }
    }
    // 處理偏好時段
    const preferredTime = Array.isArray(lead.payload?.preferredTime)
      ? lead.payload.preferredTime.join('、')
      : lead.payload?.preferredTime || ''
    // 處理來源
    const sources = Array.isArray(lead.payload?.sources)
      ? lead.payload.sources.join('、')
      : lead.payload?.sources || ''

    // 填寫者 / 代填資訊
    const filledBy = lead.payload?.filledBySelf === false ? '親友代填' : '本人填寫'
    const relationship = lead.payload?.filledBySelf === false ? (lead.payload?.relationship || '') : ''
    const bookerName = lead.payload?.filledBySelf === false ? (lead.payload?.bookerName || '') : ''
    const contactPhone = lead.payload?.contactPhone || ''
    // 健康狀況
    const health = lead.payload?.hasMedicalCondition
      ? `有${lead.payload?.medicalConditionNote ? '：' + lead.payload.medicalConditionNote : ''}`
      : '無'

    return [
      lead.name,
      lead.phone,
      lead.email || '',
      lead.storeName || '',
      statusLabels[lead.status]?.label || lead.status,
      lead.payload?.gender || '',
      lead.payload?.birthDate || '',
      lead.payload?.line || '',
      exerciseGoalsText,
      preferredTime,
      lead.payload?.paymentMethod || '',
      sources,
      filledBy,
      relationship,
      bookerName,
      contactPhone,
      health,
      lead.payload?.utm?.source || '',
      lead.payload?.utm?.medium || '',
      lead.payload?.utm?.campaign || '',
      lead.payload?.utm?.content || '',
      lead.internalNote || '',
      formatDateTime(lead.createdAt),
    ]
  })

  const csvContent =
    '\uFEFF' +
    [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `booking_leads_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">客戶預約</h1>
        <p class="text-gray-500 mt-1">管理預約體驗名單</p>
      </div>
      <button
        @click="handleExport"
        class="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        匯出 CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
      <!-- 第一排：關鍵字搜尋 + 日期範圍 -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[220px]">
          <div class="relative">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋姓名、電話、Email"
              class="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
            />
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <input v-model="dateFrom" type="date" aria-label="起始日期" class="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          <span class="text-gray-400 text-sm">～</span>
          <input v-model="dateTo" type="date" aria-label="結束日期" class="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
        </div>
      </div>

      <!-- 第二排：分店/狀態 與 來源與追蹤（含 UTM）同一排 -->
      <div class="flex flex-wrap items-start gap-x-5 gap-y-3 mt-3">
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">分店</label>
          <SearchableSelect class="w-32" v-model="selectedStore" :options="storeFilterOptions" all-label="全部" placeholder="搜尋分店…" />
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">狀態</label>
          <SearchableSelect class="w-28" v-model="selectedStatus" :options="statusFilterOptions" all-label="全部" placeholder="搜尋狀態…" />
        </div>

        <div class="self-stretch w-px bg-gray-200 hidden md:block"></div>

        <div>
          <div class="flex flex-nowrap items-end gap-2">
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">公司</label>
              <SearchableSelect class="w-24" v-model="selectedCompany" :options="companyOptions" all-label="全部" placeholder="搜尋公司…" />
            </div>
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">來源</label>
              <SearchableSelect class="w-24" v-model="selectedSource" :options="sourceOptions" all-label="全部" placeholder="搜尋來源…" />
            </div>
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">UTM 來源</label>
              <SearchableSelect class="w-28" v-model="selectedUtmSource" :options="utmSourceOptions" all-label="全部" placeholder="搜尋…" />
            </div>
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">UTM 媒介</label>
              <SearchableSelect class="w-28" v-model="selectedUtmMedium" :options="utmMediumOptions" all-label="全部" placeholder="搜尋…" />
            </div>
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">UTM 活動</label>
              <SearchableSelect class="w-32" v-model="selectedUtmCampaign" :options="utmCampaignOptions" all-label="全部" placeholder="搜尋活動…" />
            </div>
          </div>
      </div>
      </div>

      <!-- 第三排：已套用的篩選 chips + 清除全部 + 筆數 -->
      <div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <template v-if="hasActiveFilters">
          <span class="text-xs text-gray-500">已套用</span>
          <span
            v-for="f in activeFilters"
            :key="f.key"
            class="inline-flex items-center gap-1 bg-orange/10 text-orange-700 rounded px-2 py-0.5 text-xs"
          >
            {{ f.label }}：{{ f.value }}
            <button type="button" @click="f.clear()" :aria-label="`移除 ${f.label} 篩選`" class="hover:text-orange-900 leading-none">✕</button>
          </span>
          <button type="button" @click="clearAllFilters" class="text-xs text-gray-500 hover:text-gray-800 underline decoration-dotted underline-offset-2">清除全部</button>
        </template>
        <span :class="['text-sm text-gray-500', hasActiveFilters ? 'ml-auto' : '']">共 {{ filteredLeads.length }} 筆</span>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <!-- Leads Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              @click="toggleSort('name')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                姓名
                <svg v-if="sortBy === 'name'" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </th>
            <th
              @click="toggleSort('store')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                分店
                <svg v-if="sortBy === 'store'" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">電話</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">來源</th>
            <th
              @click="toggleSort('status')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                狀態
                <svg v-if="sortBy === 'status'" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </th>
            <th
              @click="toggleSort('createdAt')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                時間
                <svg v-if="sortBy === 'createdAt'" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="filteredLeads.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-500">尚無預約名單</td>
          </tr>
          <tr v-for="lead in filteredLeads" :key="lead.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-medium text-gray-900">{{ lead.name }}</div>
              <div v-if="lead.email" class="text-sm text-gray-500">{{ lead.email }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ lead.storeName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ lead.phone }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <div v-if="lead.payload?.company || lead.payload?.leadSource || lead.payload?.utm?.source || lead.payload?.utm?.campaign" class="flex flex-wrap gap-1">
                <span v-if="lead.payload?.company" class="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">{{ lead.payload.company }}</span>
                <span v-if="lead.payload?.leadSource" class="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">{{ lead.payload.leadSource }}</span>
                <span v-if="lead.payload?.utm?.source" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{{ lead.payload.utm.source }}</span>
                <span v-if="lead.payload?.utm?.campaign" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{{ lead.payload.utm.campaign }}</span>
              </div>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                :value="lead.status"
                @change="updateStatus(lead, $event)"
                :class="[statusLabels[lead.status]?.class || 'bg-gray-100 text-gray-600', 'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer']"
              >
                <option value="new">新名單</option>
                <option value="contacted">已聯繫</option>
                <option value="scheduled">已預約</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
              {{ formatDateTime(lead.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <button
                @click="openDetail(lead)"
                class="text-orange hover:text-orange-600 font-medium text-sm"
              >
                查看詳情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="selectedLead"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">預約體驗詳情</h2>
          <button @click="closeDetail" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-5">
          <!-- 狀態列 -->
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <span :class="[statusLabels[selectedLead.status]?.class || 'bg-gray-100 text-gray-600', 'text-sm font-medium px-3 py-1 rounded-full']">
              {{ statusLabels[selectedLead.status]?.label || selectedLead.status }}
            </span>
            <span class="text-sm text-gray-400">建立於 {{ formatDateTime(selectedLead.createdAt) }}</span>
          </div>

          <!-- 學員資料 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">學員資料</h3>
            </div>
            <div class="p-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-0.5">姓名</p>
                <p class="font-medium text-gray-900">{{ selectedLead.name }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-0.5">電話</p>
                <p class="font-medium text-gray-900">{{ selectedLead.phone }}</p>
              </div>
              <div v-if="selectedLead.email">
                <p class="text-xs text-gray-500 mb-0.5">Email</p>
                <p class="font-medium text-gray-900 break-all">{{ selectedLead.email }}</p>
              </div>
              <div v-if="selectedLead.payload?.gender">
                <p class="text-xs text-gray-500 mb-0.5">性別</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.gender }}</p>
              </div>
              <div v-if="selectedLead.payload?.birthDate">
                <p class="text-xs text-gray-500 mb-0.5">出生年月</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.birthDate }}</p>
              </div>
              <div v-if="selectedLead.payload?.line">
                <p class="text-xs text-gray-500 mb-0.5">LINE ID</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.line }}</p>
              </div>
            </div>
          </section>

          <!-- 預約資訊 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">預約資訊</h3>
            </div>
            <div class="p-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-0.5">分店</p>
                <p class="font-medium text-gray-900">{{ selectedLead.storeName || '-' }}</p>
              </div>
              <div v-if="selectedLead.payload?.paymentMethod">
                <p class="text-xs text-gray-500 mb-0.5">付款方式</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.paymentMethod === '50歲以上免費' ? '50歲以上免費體驗' : selectedLead.payload.paymentMethod === '臨櫃付款' ? '臨櫃付款 $500' : selectedLead.payload.paymentMethod }}</p>
              </div>
              <div v-if="selectedLead.payload?.preferredTime" class="col-span-2">
                <p class="text-xs text-gray-500 mb-0.5">偏好時段</p>
                <p class="font-medium text-gray-900">{{ Array.isArray(selectedLead.payload.preferredTime) ? selectedLead.payload.preferredTime.join('、') : selectedLead.payload.preferredTime }}</p>
              </div>
              <div v-if="selectedLead.payload?.goal" class="col-span-2">
                <p class="text-xs text-gray-500 mb-0.5">運動目標</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.goal }}</p>
              </div>
              <div v-if="selectedLead.payload?.exerciseGoals && selectedLead.payload.exerciseGoals.length > 0" class="col-span-2">
                <p class="text-xs text-gray-500 mb-0.5">運動目的</p>
                <p class="font-medium text-gray-900">
                  {{ selectedLead.payload.exerciseGoals.join('、') }}
                  <span v-if="selectedLead.payload.exerciseGoalOther">（其他：{{ selectedLead.payload.exerciseGoalOther }}）</span>
                </p>
              </div>
              <div v-if="selectedLead.payload?.sources && selectedLead.payload.sources.length > 0" class="col-span-2">
                <p class="text-xs text-gray-500 mb-0.5">得知管道</p>
                <p class="font-medium text-gray-900">{{ Array.isArray(selectedLead.payload.sources) ? selectedLead.payload.sources.join('、') : selectedLead.payload.sources }}</p>
              </div>
            </div>
          </section>

          <!-- 填寫者資料 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">填寫者資料</h3>
            </div>
            <div class="p-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-0.5">填寫者</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload?.filledBySelf === false ? '親友代填' : '本人填寫' }}</p>
              </div>
              <div v-if="selectedLead.payload?.filledBySelf === false && selectedLead.payload?.relationship">
                <p class="text-xs text-gray-500 mb-0.5">與學員關係</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.relationship }}</p>
              </div>
              <div v-if="selectedLead.payload?.filledBySelf === false && selectedLead.payload?.bookerName">
                <p class="text-xs text-gray-500 mb-0.5">預約者姓名</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.bookerName }}</p>
              </div>
              <div v-if="selectedLead.payload?.contactPhone && selectedLead.payload.contactPhone !== selectedLead.phone">
                <p class="text-xs text-gray-500 mb-0.5">聯繫電話</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.contactPhone }}</p>
              </div>
            </div>
          </section>

          <!-- 健康狀況 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">健康狀況</h3>
            </div>
            <div class="p-4">
              <p class="font-medium text-gray-900">
                {{ selectedLead.payload?.hasMedicalCondition ? '有特殊健康狀況' : '無特殊健康狀況' }}
                <span v-if="selectedLead.payload?.hasMedicalCondition && selectedLead.payload?.medicalConditionNote" class="text-gray-600">
                  — {{ selectedLead.payload.medicalConditionNote }}
                </span>
              </p>
            </div>
          </section>

          <!-- 來源追蹤 (UTM) -->
          <!-- 活動來源（變體表單：公司 / 來源）-->
          <section v-if="selectedLead.payload?.company || selectedLead.payload?.leadSource || selectedLead.payload?.formVariant" class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">活動來源</h3>
            </div>
            <div class="p-4">
              <div class="flex flex-wrap gap-1.5">
                <span v-if="selectedLead.payload.company" class="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">公司：{{ selectedLead.payload.company }}</span>
                <span v-if="selectedLead.payload.leadSource" class="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">來源：{{ selectedLead.payload.leadSource }}</span>
                <span v-if="selectedLead.payload.formVariant" class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">表單：{{ selectedLead.payload.formVariant }}</span>
              </div>
            </div>
          </section>

          <section v-if="selectedLead.payload?.utm && (selectedLead.payload.utm.source || selectedLead.payload.utm.campaign || selectedLead.payload.utm.medium)" class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">來源追蹤 (UTM)</h3>
            </div>
            <div class="p-4">
              <div class="flex flex-wrap gap-1.5">
                <span v-if="selectedLead.payload.utm.source" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">來源：{{ selectedLead.payload.utm.source }}</span>
                <span v-if="selectedLead.payload.utm.medium" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">形式：{{ selectedLead.payload.utm.medium }}</span>
                <span v-if="selectedLead.payload.utm.campaign" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">活動：{{ selectedLead.payload.utm.campaign }}</span>
                <span v-if="selectedLead.payload.utm.content" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">素材：{{ selectedLead.payload.utm.content }}</span>
              </div>
              <p v-if="selectedLead.payload.utm.referrer" class="text-xs text-gray-400 mt-2 truncate">referrer: {{ selectedLead.payload.utm.referrer }}</p>
            </div>
          </section>

          <!-- 留言 -->
          <section v-if="selectedLead.message" class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">留言</h3>
            </div>
            <div class="p-4">
              <p class="text-gray-900 whitespace-pre-wrap">{{ selectedLead.message }}</p>
            </div>
          </section>

          <!-- 內部備註 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">內部備註</h3>
            </div>
            <div class="p-4">
              <textarea
                v-model="noteText"
                rows="3"
                placeholder="新增內部備註..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
              />
            </div>
          </section>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button @click="closeDetail" class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            關閉
          </button>
          <button
            @click="handleSaveNote"
            :disabled="saving"
            class="bg-orange text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {{ saving ? '儲存中...' : '儲存備註' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
