<script setup lang="ts">
// 團課預約後台（骨架）：讀取 type=group_class 的名單。
// ⚠️ 前端團課預約表單尚未建置，目前資料源為空；表單完成後送出的名單（type=group_class）會自動出現在此。
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
  storeName: string
  desiredClass: string
  message: string
  status: string
  createdAt: string
}

const leads = ref<GroupClassLead[]>([])
const stores = ref<{ id: string; name: string }[]>([])
const isLoading = ref(true)
const error = ref('')
const searchQuery = ref('')

function storeNameOf(id?: string) {
  if (!id) return ''
  return stores.value.find((s) => s.id === id)?.name || ''
}

async function fetchData() {
  isLoading.value = true
  error.value = ''
  try {
    const [leadsRes, storesRes] = await Promise.all([
      $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=group_class'),
      $fetch<{ success: boolean; data: any[] }>('/api/admin/stores').catch(() => ({ success: false, data: [] as any[] })),
    ])
    if (storesRes?.success) {
      stores.value = storesRes.data.map((s: any) => ({ id: s.id, name: s.name }))
    }
    if (leadsRes.success) {
      leads.value = leadsRes.data.map((lead: any) => ({
        id: lead.id,
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        storeName: storeNameOf(lead.storeId),
        desiredClass: lead.payload?.desiredClass || lead.payload?.classType || '',
        message: lead.message || lead.payload?.message || '',
        status: lead.status || 'new',
        createdAt: lead.createdAt,
      }))
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
      <p class="text-sm text-gray-500 mt-1">團體課程預約名單</p>
    </div>

    <!-- 骨架說明：前端表單尚未建置 -->
    <div class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>團課預約表單建置中；前端表單完成後，送出的名單（<code class="bg-amber-100 px-1 rounded">type=group_class</code>）會自動顯示在此。</span>
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
      <table class="w-full min-w-[720px]">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">姓名</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">聯絡資訊</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">想上的課程</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">分店</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">時間</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="filteredLeads.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">目前沒有團課預約資料</td>
          </tr>
          <tr v-for="lead in filteredLeads" :key="lead.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{{ lead.name }}</td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-700">{{ lead.phone }}</div>
              <div v-if="lead.email" class="text-sm text-gray-500">{{ lead.email }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">{{ lead.desiredClass || '—' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ lead.storeName || '—' }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
