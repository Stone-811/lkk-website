<script setup lang="ts">
// 團課預約後台：讀取 type=group_class 的名單（前端 /group-booking 表單送出）
import { ref, computed, onMounted } from 'vue'

const { statusLabels, statusOptions } = useLeadStatus()
const { formatDateTime } = useFormatDate()

definePageMeta({
  layout: 'admin',
})

useHead({
  title: '團課預約｜練健康後台',
})

interface GroupClassLead {
  id: string
  name: string
  phone: string
  email: string
  gender: string
  ageRange: string
  course: string
  store: string
  preferredTime: string
  experience: string
  medicalHistory: string
  source: string[]
  isFillerSelf: string
  fillerName: string
  relationship: string
  note: string
  status: string
  createdAt: string
}

const leads = ref<GroupClassLead[]>([])
const isLoading = ref(true)
const error = ref('')
const searchQuery = ref('')
const expandedId = ref<string | null>(null)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function fetchData() {
  isLoading.value = true
  error.value = ''
  try {
    const leadsRes = await $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=group_class')
    if (leadsRes.success) {
      leads.value = leadsRes.data.map((lead: any) => {
        const p = lead.payload || {}
        return {
          id: lead.id,
          name: lead.name || '',
          phone: lead.phone || '',
          email: lead.email || '',
          gender: p.gender || '',
          ageRange: p.ageRange || p.age || '',
          course: p.course || p.desiredClass || '',
          store: p.storeName || p.store || '',
          preferredTime: p.preferredTime || '',
          experience: p.experience || '',
          medicalHistory: p.medicalHistory || '',
          source: Array.isArray(p.source) ? p.source : [],
          isFillerSelf: p.isFillerSelf || '',
          fillerName: p.fillerName || '',
          relationship: p.relationship || '',
          note: p.note || lead.message || '',
          status: lead.status || 'new',
          createdAt: lead.createdAt,
        }
      })
    }
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || '載入失敗'
  } finally {
    isLoading.value = false
  }
}

const filteredLeads = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return leads.value
  return leads.value.filter(
    (l) => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q),
  )
})

async function handleStatusChange(id: string, status: string) {
  try {
    await $fetch(`/api/admin/leads/${id}`, { method: 'PATCH', body: { status } })
    const lead = leads.value.find((l) => l.id === id)
    if (lead) lead.status = status
  } catch (e) {
    alert('更新狀態失敗')
  }
}

onMounted(fetchData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">團課預約</h1>
      <p class="text-sm text-gray-500 mt-1">團體課程報名名單（來源：/group-booking）</p>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
      <div class="relative max-w-xs">
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

    <!-- Error -->
    <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{{ error }}</div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table class="w-full min-w-[820px]">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">學員</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">聯絡資訊</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">課程</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">門店</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">時間</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="filteredLeads.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-500">目前沒有團課預約資料</td>
          </tr>
          <template v-for="lead in filteredLeads" :key="lead.id">
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">{{ lead.name }}</div>
                <div class="text-xs text-gray-500 mt-0.5">
                  <span v-if="lead.gender">{{ lead.gender }}</span>
                  <span v-if="lead.ageRange"> · {{ lead.ageRange }}</span>
                  <span v-if="lead.isFillerSelf === '否'" class="ml-1 inline-block bg-amber-100 text-amber-700 px-1.5 rounded">代填</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-700">{{ lead.phone }}</div>
                <div v-if="lead.email" class="text-sm text-gray-500">{{ lead.email }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">
                {{ lead.course || '—' }}
                <div v-if="lead.preferredTime" class="text-xs text-gray-400 mt-0.5">{{ lead.preferredTime }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ lead.store || '—' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select
                  :value="lead.status"
                  @change="handleStatusChange(lead.id, ($event.target as HTMLSelectElement).value)"
                  :class="['text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer', statusLabels[lead.status]?.class || 'bg-gray-100 text-gray-600']"
                >
                  <option v-for="opt in statusOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDateTime(lead.createdAt) }}</td>
              <td class="px-4 py-4 whitespace-nowrap text-right">
                <button @click="toggleExpand(lead.id)" class="text-gray-400 hover:text-orange text-sm">
                  {{ expandedId === lead.id ? '收合 ▲' : '詳情 ▼' }}
                </button>
              </td>
            </tr>
            <tr v-if="expandedId === lead.id" class="bg-gray-50/70">
              <td colspan="7" class="px-6 py-4">
                <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div v-if="lead.isFillerSelf === '否'" class="flex gap-2">
                    <dt class="text-gray-500 flex-shrink-0">代填者／關係</dt>
                    <dd class="text-gray-800">{{ lead.fillerName }}（{{ lead.relationship }}）</dd>
                  </div>
                  <div v-if="lead.experience" class="flex gap-2">
                    <dt class="text-gray-500 flex-shrink-0">重訓經驗</dt>
                    <dd class="text-gray-800">{{ lead.experience }}</dd>
                  </div>
                  <div v-if="lead.source.length" class="flex gap-2 sm:col-span-2">
                    <dt class="text-gray-500 flex-shrink-0">得知管道</dt>
                    <dd class="text-gray-800">{{ lead.source.join('、') }}</dd>
                  </div>
                  <div v-if="lead.medicalHistory" class="flex gap-2 sm:col-span-2">
                    <dt class="text-gray-500 flex-shrink-0">疾病／舊傷史</dt>
                    <dd class="text-gray-800 whitespace-pre-wrap">{{ lead.medicalHistory }}</dd>
                  </div>
                  <div v-if="lead.note" class="flex gap-2 sm:col-span-2">
                    <dt class="text-gray-500 flex-shrink-0">備註</dt>
                    <dd class="text-gray-800 whitespace-pre-wrap">{{ lead.note }}</dd>
                  </div>
                </dl>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
