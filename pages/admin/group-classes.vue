<script setup lang="ts">
// 團課預約後台：讀取 type=group_class 的名單（前端 /group-booking 表單送出）
// 版型／篩選／詳情彈窗／CSV 匯出 皆比照「客戶預約」pages/admin/leads.vue
import { ref, computed, onMounted } from 'vue'
import { groupClassVariants } from '~/config/groupClassVariants'

const { statusLabels } = useLeadStatus()
const { formatDateTime } = useFormatDate()

definePageMeta({
  layout: 'admin',
})

useHead({
  title: '團課預約｜練健康後台',
})

interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  storeName?: string
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
  internalNote?: string
  message?: string
  payload?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

const leads = ref<Lead[]>([])
const isLoading = ref(true)
const error = ref('')

const selectedStore = ref('all')
const selectedCourse = ref('all')
const selectedStatus = ref('all')
const selectedCompany = ref('all')
const selectedSource = ref('all')
const selectedUtmSource = ref('all')
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

async function fetchLeads() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=group_class')
    if (res.success) {
      leads.value = res.data.map((lead: any) => ({
        ...lead,
        // 表單存的是完整門店字串（「南京店｜台北市…」），舊資料只有 store
        storeName: lead.payload?.storeName || String(lead.payload?.store || '').split('｜')[0].trim() || '-',
      }))
    }
  } catch (e: any) {
    error.value = e.data?.message || '載入失敗'
    console.error('Error fetching group class leads:', e)
  } finally {
    isLoading.value = false
  }
}

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

// 「公司」篩選選項：變體設定 company ∪ 名單實際 company
const companyOptions = computed(() => {
  const set = new Set<string>()
  Object.values(groupClassVariants).forEach((v) => { if (v.company) set.add(v.company) })
  leads.value.forEach((l) => { const c = l.payload?.company; if (c) set.add(c) })
  return Array.from(set).sort()
})
// 「來源」篩選選項：?src= 規範管道清單 ∪ 名單實際 leadSource
const sourceOptions = computed(() => {
  const set = new Set<string>(SOURCE_CHANNELS)
  leads.value.forEach((l) => { const s = l.payload?.leadSource; if (s) set.add(s) })
  return Array.from(set)
})

const statusFilterOptions = [
  { value: 'new', label: '新名單' },
  { value: 'contacted', label: '已聯繫' },
  { value: 'scheduled', label: '已預約' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

// 門店／課程篩選選項：從現有名單自動蒐集
const storeFilterOptions = computed(() => {
  const set = new Set<string>()
  leads.value.forEach((l) => { if (l.storeName && l.storeName !== '-') set.add(l.storeName) })
  return Array.from(set).sort()
})
const courseFilterOptions = computed(() => {
  const set = new Set<string>()
  leads.value.forEach((l) => { const c = l.payload?.course || l.payload?.desiredClass; if (c) set.add(c) })
  return Array.from(set).sort()
})

// UTM 篩選選項：從現有名單自動蒐集（去重、排序）
function utmOptions(field: 'source' | 'medium' | 'campaign') {
  const set = new Set<string>()
  leads.value.forEach((l) => { const v = l.payload?.utm?.[field]; if (v) set.add(v) })
  return Array.from(set).sort()
}
const utmSourceOptions = computed(() => utmOptions('source'))
const utmCampaignOptions = computed(() => utmOptions('campaign'))

// 已套用的篩選（給 chip 顯示與單獨移除）
const activeFilters = computed(() => {
  const out: { key: string; label: string; value: string; clear: () => void }[] = []
  if (searchQuery.value) out.push({ key: 'q', label: '搜尋', value: searchQuery.value, clear: () => (searchQuery.value = '') })
  if (selectedStore.value !== 'all') out.push({ key: 'store', label: '門店', value: selectedStore.value, clear: () => (selectedStore.value = 'all') })
  if (selectedCourse.value !== 'all') out.push({ key: 'course', label: '課程', value: selectedCourse.value, clear: () => (selectedCourse.value = 'all') })
  if (selectedStatus.value !== 'all') out.push({ key: 'status', label: '狀態', value: statusFilterOptions.find((o) => o.value === selectedStatus.value)?.label || selectedStatus.value, clear: () => (selectedStatus.value = 'all') })
  if (selectedCompany.value !== 'all') out.push({ key: 'company', label: '公司', value: selectedCompany.value, clear: () => (selectedCompany.value = 'all') })
  if (selectedSource.value !== 'all') out.push({ key: 'source', label: '來源', value: selectedSource.value, clear: () => (selectedSource.value = 'all') })
  if (selectedUtmSource.value !== 'all') out.push({ key: 'us', label: 'UTM 來源', value: selectedUtmSource.value, clear: () => (selectedUtmSource.value = 'all') })
  if (selectedUtmCampaign.value !== 'all') out.push({ key: 'uc', label: 'UTM 活動', value: selectedUtmCampaign.value, clear: () => (selectedUtmCampaign.value = 'all') })
  if (dateFrom.value || dateTo.value) out.push({ key: 'date', label: '日期', value: `${dateFrom.value || '…'} ～ ${dateTo.value || '…'}`, clear: () => { dateFrom.value = ''; dateTo.value = '' } })
  return out
})
const hasActiveFilters = computed(() => activeFilters.value.length > 0)
function clearAllFilters() {
  searchQuery.value = ''
  selectedStore.value = 'all'
  selectedCourse.value = 'all'
  selectedStatus.value = 'all'
  selectedCompany.value = 'all'
  selectedSource.value = 'all'
  selectedUtmSource.value = 'all'
  selectedUtmCampaign.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
}

const filteredLeads = computed(() => {
  const result = leads.value.filter((lead) => {
    if (selectedStore.value !== 'all' && lead.storeName !== selectedStore.value) return false
    if (selectedCourse.value !== 'all' && (lead.payload?.course || lead.payload?.desiredClass || '') !== selectedCourse.value) return false
    if (selectedStatus.value !== 'all' && lead.status !== selectedStatus.value) return false
    if (selectedCompany.value !== 'all' && (lead.payload?.company || '') !== selectedCompany.value) return false
    if (selectedSource.value !== 'all' && (lead.payload?.leadSource || '') !== selectedSource.value) return false
    if (selectedUtmSource.value !== 'all' && (lead.payload?.utm?.source || '') !== selectedUtmSource.value) return false
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
    const lead = leads.value.find((l) => l.id === selectedLead.value?.id)
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
  const headers = ['姓名', '電話', 'Email', '性別', '年齡區間', '課程', '門店', '偏好時段', '重訓經驗', '疾病／舊傷史', '狀態', '填寫者', '代填者姓名', '與學員關係', '得知管道', '公司', '來源', '表單變體', 'UTM來源', 'UTM形式', 'UTM活動', 'UTM素材', '學員備註', '內部備註', '建立時間']
  const rows = filteredLeads.value.map((lead) => {
    const p = lead.payload || {}
    const sources = Array.isArray(p.source) ? p.source.join('、') : p.source || ''
    const isProxy = p.isFillerSelf === '否'
    return [
      lead.name,
      lead.phone,
      lead.email || '',
      p.gender || '',
      p.ageRange || p.age || '',
      p.course || p.desiredClass || '',
      lead.storeName || '',
      p.preferredTime || '',
      p.experience || '',
      p.medicalHistory || '',
      statusLabels[lead.status]?.label || lead.status,
      isProxy ? '親友代填' : '本人填寫',
      isProxy ? p.fillerName || '' : '',
      isProxy ? p.relationship || '' : '',
      sources,
      p.company || '',
      p.leadSource || '',
      p.formVariant || '',
      p.utm?.source || '',
      p.utm?.medium || '',
      p.utm?.campaign || '',
      p.utm?.content || '',
      p.note || lead.message || '',
      lead.internalNote || '',
      formatDateTime(lead.createdAt),
    ]
  })

  useCsvExport().exportCsv('group_class_leads', headers, rows)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">團課預約</h1>
        <p class="text-gray-500 mt-1">團體課程報名名單（來源：/group-booking）</p>
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
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">搜尋</label>
          <div class="relative w-52">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="姓名、電話、Email"
              class="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
            />
          </div>
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">日期</label>
          <div class="flex items-center gap-1.5">
            <input v-model="dateFrom" type="date" aria-label="起始日期" class="w-[132px] border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
            <span class="text-gray-400 text-sm">～</span>
            <input v-model="dateTo" type="date" aria-label="結束日期" class="w-[132px] border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">門店</label>
          <SearchableSelect class="w-32" v-model="selectedStore" :options="storeFilterOptions" all-label="全部" placeholder="搜尋門店…" />
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">課程</label>
          <SearchableSelect class="w-40" v-model="selectedCourse" :options="courseFilterOptions" all-label="全部" placeholder="搜尋課程…" />
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 mb-0.5">狀態</label>
          <SearchableSelect class="w-28" v-model="selectedStatus" :options="statusFilterOptions" all-label="全部" placeholder="搜尋狀態…" />
        </div>
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
          <label class="block text-[11px] text-gray-400 mb-0.5">UTM 活動</label>
          <SearchableSelect class="w-28" v-model="selectedUtmCampaign" :options="utmCampaignOptions" all-label="全部" placeholder="搜尋活動…" />
        </div>
      </div>

      <!-- 已套用的篩選 chips + 清除全部 + 筆數 -->
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
    <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table class="w-full min-w-[820px]">
        <thead class="bg-gray-50">
          <tr>
            <th
              @click="toggleSort('name')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                學員
                <svg v-if="sortBy === 'name'" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">課程</th>
            <th
              @click="toggleSort('store')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                門店
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
            <td colspan="8" class="px-6 py-12 text-center text-gray-500">尚無團課報名名單</td>
          </tr>
          <tr v-for="lead in filteredLeads" :key="lead.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900 flex items-center gap-1.5">
                {{ lead.name }}
                <span v-if="lead.payload?.isFillerSelf === '否'" class="inline-block bg-amber-100 text-amber-700 px-1.5 rounded text-[11px] font-normal">代填</span>
              </div>
              <div v-if="lead.email" class="text-sm text-gray-500">{{ lead.email }}</div>
              <div class="text-xs text-gray-400 mt-0.5">
                <span v-if="lead.payload?.gender">{{ lead.payload.gender }}</span>
                <span v-if="lead.payload?.ageRange"> · {{ lead.payload.ageRange }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">
              {{ lead.payload?.course || lead.payload?.desiredClass || '—' }}
              <div v-if="lead.payload?.preferredTime" class="text-xs text-gray-400 mt-0.5">{{ lead.payload.preferredTime }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ lead.storeName }}</td>
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
              <button @click="openDetail(lead)" class="text-orange hover:text-orange-600 font-medium text-sm">
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
          <h2 class="text-lg font-bold text-gray-900">團體課程報名詳情</h2>
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
              <div v-if="selectedLead.payload?.ageRange || selectedLead.payload?.age">
                <p class="text-xs text-gray-500 mb-0.5">年齡區間</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.ageRange || selectedLead.payload.age }}</p>
              </div>
            </div>
          </section>

          <!-- 報名資訊 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">報名資訊</h3>
            </div>
            <div class="p-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-0.5">報名課程</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload?.course || selectedLead.payload?.desiredClass || '-' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-0.5">上課門店</p>
                <p class="font-medium text-gray-900">{{ selectedLead.storeName || '-' }}</p>
              </div>
              <div v-if="selectedLead.payload?.preferredTime" class="col-span-2">
                <p class="text-xs text-gray-500 mb-0.5">偏好時段</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.preferredTime }}</p>
              </div>
              <div v-if="selectedLead.payload?.source && selectedLead.payload.source.length > 0" class="col-span-2">
                <p class="text-xs text-gray-500 mb-0.5">得知管道</p>
                <p class="font-medium text-gray-900">{{ Array.isArray(selectedLead.payload.source) ? selectedLead.payload.source.join('、') : selectedLead.payload.source }}</p>
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
                <p class="font-medium text-gray-900">{{ selectedLead.payload?.isFillerSelf === '否' ? '親友代填' : '本人填寫' }}</p>
              </div>
              <div v-if="selectedLead.payload?.isFillerSelf === '否' && selectedLead.payload?.fillerName">
                <p class="text-xs text-gray-500 mb-0.5">代填者姓名</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.fillerName }}</p>
              </div>
              <div v-if="selectedLead.payload?.isFillerSelf === '否' && selectedLead.payload?.relationship">
                <p class="text-xs text-gray-500 mb-0.5">與學員關係</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.relationship }}</p>
              </div>
            </div>
          </section>

          <!-- 健康狀況 -->
          <section class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">健康狀況</h3>
            </div>
            <div class="p-4 space-y-3">
              <div v-if="selectedLead.payload?.experience">
                <p class="text-xs text-gray-500 mb-0.5">重訓經驗</p>
                <p class="font-medium text-gray-900">{{ selectedLead.payload.experience }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-0.5">疾病／舊傷／開刀史</p>
                <p class="font-medium text-gray-900 whitespace-pre-wrap">{{ selectedLead.payload?.medicalHistory || '-' }}</p>
              </div>
            </div>
          </section>

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

          <!-- 來源追蹤 (UTM) -->
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

          <!-- 學員備註 -->
          <section v-if="selectedLead.payload?.note || selectedLead.message" class="rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">學員備註</h3>
            </div>
            <div class="p-4">
              <p class="text-gray-900 whitespace-pre-wrap">{{ selectedLead.payload?.note || selectedLead.message }}</p>
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
