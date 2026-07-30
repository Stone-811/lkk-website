<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { statusLabels, statusOptions, leadTypeLabels, leadTypeOptions, getStatusLabel, getStatusClass, getLeadTypeLabel, getLeadTypeClass } = useLeadStatus()
const { formatDateTime } = useFormatDate()

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '合作加盟｜練健康後台',
})

interface CooperationLead {
  id: string
  leadType: 'cooperation' | 'franchise'
  name: string
  phone: string
  email: string
  organization: string
  lineId: string
  cooperationType: string
  companySize: string
  budgetRange: string
  region: string
  franchiseType: string
  status: string
  message: string
  internalNote: string
  createdAt: string
}

const leads = ref<CooperationLead[]>([])
const isLoading = ref(true)
const error = ref('')

const statusFilter = ref('')
const leadTypeFilter = ref('')
const searchQuery = ref('')
const selectedLead = ref<CooperationLead | null>(null)
const noteText = ref('')
const saving = ref(false)


// Fetch leads from API (cooperation and franchise types)
async function fetchLeads() {
  isLoading.value = true
  error.value = ''
  try {
    // Fetch both cooperation and franchise leads
    const [cooperationRes, franchiseRes] = await Promise.all([
      $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=cooperation'),
      $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=franchise'),
    ])

    const allLeads: CooperationLead[] = []

    if (cooperationRes.success) {
      cooperationRes.data.forEach((lead: any) => {
        allLeads.push({
          id: lead.id,
          leadType: 'cooperation',
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          organization: lead.payload?.organization || '-',
          lineId: lead.payload?.lineId || '-',
          cooperationType: lead.payload?.cooperationType || '-',
          companySize: lead.payload?.companySize || '',
          budgetRange: lead.payload?.budgetRange || '',
          region: '',
          franchiseType: '',
          status: lead.status,
          message: lead.message || '',
          internalNote: lead.internalNote || '',
          createdAt: lead.createdAt,
        })
      })
    }

    if (franchiseRes.success) {
      franchiseRes.data.forEach((lead: any) => {
        allLeads.push({
          id: lead.id,
          leadType: 'franchise',
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          organization: lead.payload?.organization || '-',
          lineId: '',
          cooperationType: lead.payload?.cooperationType || '加盟',
          companySize: '',
          budgetRange: '',
          region: lead.payload?.region || '-',
          franchiseType: lead.payload?.cooperationType || '-',
          status: lead.status,
          message: lead.message || '',
          internalNote: lead.internalNote || '',
          createdAt: lead.createdAt,
        })
      })
    }

    // Sort by createdAt descending
    allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    leads.value = allLeads
  } catch (e: any) {
    error.value = e.data?.message || '載入失敗'
    console.error('Error fetching leads:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLeads)

const filteredLeads = computed(() => {
  return leads.value.filter(lead => {
    if (statusFilter.value && lead.status !== statusFilter.value) return false
    if (leadTypeFilter.value && lead.leadType !== leadTypeFilter.value) return false
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.organization.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query)
      )
    }
    return true
  })
})


async function handleStatusChange(leadId: string, newStatus: string) {
  try {
    await $fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    const lead = leads.value.find(l => l.id === leadId)
    if (lead) lead.status = newStatus
  } catch (e: any) {
    alert(e.data?.message || '更新失敗')
  }
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
  const headers = ['來源', '單位', '聯絡人', '電話', 'Line ID', 'Email', '目標區域', '洽詢類型', '狀態', '留言內容', '備註', '建立時間']
  const rows = filteredLeads.value.map(lead => [
    leadTypeLabels[lead.leadType]?.label || lead.leadType,
    lead.organization,
    lead.name,
    lead.phone,
    lead.lineId,
    lead.email,
    lead.region || '',
    lead.cooperationType,
    statusLabels[lead.status]?.label || lead.status,
    lead.message,
    lead.internalNote,
    formatDateTime(lead.createdAt),
  ])

  const csvContent =
    '\uFEFF' +
    [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `cooperation_franchise_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

function openDetail(lead: CooperationLead) {
  selectedLead.value = lead
  noteText.value = lead.internalNote
}

function closeDetail() {
  selectedLead.value = null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">合作加盟</h1>
        <p class="text-gray-500 mt-1">管理合作洽詢與加盟洽詢名單</p>
      </div>
      <button
        @click="handleExport"
        class="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        匯出 CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋單位、姓名、電話、Email..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
            />
          </div>
        </div>

        <!-- Filter by lead type -->
        <select
          v-model="leadTypeFilter"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
        >
          <option v-for="opt in leadTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <!-- Filter by status -->
        <select
          v-model="statusFilter"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <!-- Results count -->
        <div class="text-sm text-gray-500">
          共 {{ filteredLeads.length }} 筆
        </div>
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
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">來源</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">單位 / 聯絡人</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">聯絡資訊</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">洽詢內容</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">時間</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="filteredLeads.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-500">目前沒有合作加盟資料</td>
          </tr>
          <tr v-for="lead in filteredLeads" :key="lead.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="[leadTypeLabels[lead.leadType]?.class || 'bg-gray-100 text-gray-700', 'text-xs font-medium px-2.5 py-1 rounded-full']">
                {{ leadTypeLabels[lead.leadType]?.label || lead.leadType }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">{{ lead.organization }}</div>
              <div class="text-sm text-gray-500">{{ lead.name }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm">{{ lead.phone }}</div>
              <div v-if="lead.email" class="text-sm text-gray-500">{{ lead.email }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-700">{{ lead.cooperationType }}</div>
              <div v-if="lead.region" class="text-xs text-gray-500">區域：{{ lead.region }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                :value="lead.status"
                @change="handleStatusChange(lead.id, ($event.target as HTMLSelectElement).value)"
                :class="['text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer', statusLabels[lead.status]?.class || 'bg-gray-100 text-gray-600']"
              >
                <option v-for="opt in statusOptions.slice(1)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDateTime(lead.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <button
                @click="openDetail(lead)"
                class="text-orange hover:text-orange-600 font-medium text-sm"
              >
                詳情
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
      <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-bold text-gray-900">
              {{ selectedLead.leadType === 'franchise' ? '加盟洽詢詳情' : '合作洽詢詳情' }}
            </h2>
            <span :class="[leadTypeLabels[selectedLead.leadType]?.class || 'bg-gray-100 text-gray-700', 'text-xs font-medium px-2.5 py-1 rounded-full']">
              {{ leadTypeLabels[selectedLead.leadType]?.label }}
            </span>
          </div>
          <button @click="closeDetail" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <p class="text-sm text-gray-500">洽詢類型</p>
              <p class="font-medium text-orange">{{ selectedLead.cooperationType }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-sm text-gray-500">公司 / 單位</p>
              <p class="font-medium">{{ selectedLead.organization }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">聯絡人</p>
              <p class="font-medium">{{ selectedLead.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">電話</p>
              <p class="font-medium">{{ selectedLead.phone }}</p>
            </div>
            <div v-if="selectedLead.lineId && selectedLead.lineId !== '-'">
              <p class="text-sm text-gray-500">Line ID</p>
              <p class="font-medium">{{ selectedLead.lineId }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="font-medium">{{ selectedLead.email || '-' }}</p>
            </div>

            <!-- Cooperation specific -->
            <div v-if="selectedLead.leadType === 'cooperation' && selectedLead.companySize">
              <p class="text-sm text-gray-500">公司規模</p>
              <p class="font-medium">{{ selectedLead.companySize }}</p>
            </div>
            <div v-if="selectedLead.leadType === 'cooperation' && selectedLead.budgetRange">
              <p class="text-sm text-gray-500">預算區間</p>
              <p class="font-medium">{{ selectedLead.budgetRange }}</p>
            </div>

            <!-- Franchise specific -->
            <div v-if="selectedLead.leadType === 'franchise' && selectedLead.region">
              <p class="text-sm text-gray-500">目標區域</p>
              <p class="font-medium">{{ selectedLead.region }}</p>
            </div>

            <div class="col-span-2">
              <p class="text-sm text-gray-500">建立時間</p>
              <p class="font-medium">{{ formatDateTime(selectedLead.createdAt) }}</p>
            </div>
          </div>
          <div v-if="selectedLead.message">
            <p class="text-sm text-gray-500">留言內容</p>
            <p class="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{{ selectedLead.message }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">內部備註</p>
            <textarea
              v-model="noteText"
              rows="3"
              placeholder="新增內部備註..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
            />
          </div>
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
