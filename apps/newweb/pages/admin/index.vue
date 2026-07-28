<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { getStatusLabel, getStatusClass, getLeadTypeLabel, getLeadTypeClass } = useLeadStatus()
const { formatDateTime } = useFormatDate()

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '儀表板｜練健康後台',
})

interface DashboardStats {
  thisMonthLeads: number
  pendingLeads: number
  thisMonthBookings: number
  thisMonthCooperations: number
  thisMonthFranchises: number
  storeCount: number
  coachCount: number
  totalLeads: number
}

interface RecentLead {
  id: string
  name: string
  phone: string
  type: 'booking' | 'franchise' | 'cooperation'
  storeId?: string
  storeName: string
  status: string
  createdAt: string
}

const isLoading = ref(true)
const error = ref('')
const stats = ref<DashboardStats>({
  thisMonthLeads: 0,
  pendingLeads: 0,
  thisMonthBookings: 0,
  thisMonthCooperations: 0,
  thisMonthFranchises: 0,
  storeCount: 0,
  coachCount: 0,
  totalLeads: 0,
})
const recentLeads = ref<RecentLead[]>([])

async function fetchDashboard() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ success: boolean; data: { stats: DashboardStats; recentLeads: RecentLead[] } }>('/api/admin/dashboard')
    if (response.success) {
      stats.value = response.data.stats
      recentLeads.value = response.data.recentLeads
    }
  } catch (e: any) {
    error.value = e.data?.message || '載入失敗'
    console.error('Error fetching dashboard:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDashboard)

// Stats cards computed from real data
const statCards = computed(() => [
  { label: '本月新名單', value: stats.value.thisMonthLeads.toString(), href: '/admin/leads' },
  { label: '待處理名單', value: stats.value.pendingLeads.toString(), href: '/admin/leads?status=new' },
  { label: '本月預約體驗', value: stats.value.thisMonthBookings.toString(), href: '/admin/leads?type=booking' },
  { label: '本月合作洽詢', value: stats.value.thisMonthCooperations.toString(), href: '/admin/cooperation' },
])

// Secondary stats
const secondaryStats = computed(() => [
  { label: '分店數', value: stats.value.storeCount.toString(), href: '/admin/stores' },
  { label: '教練數', value: stats.value.coachCount.toString(), href: '/admin/coaches' },
  { label: '本月加盟洽詢', value: stats.value.thisMonthFranchises.toString(), href: '/admin/leads?type=franchise' },
  { label: '總名單數', value: stats.value.totalLeads.toString(), href: '/admin/leads' },
])


// Quick actions
const quickActions = [
  {
    name: '新增分店',
    desc: '建立新的分店資料',
    href: '/admin/stores/new',
    iconBg: 'bg-navy-700/10',
    iconColor: 'text-navy-700',
    icon: 'plus',
  },
  {
    name: '新增教練',
    desc: '建立新的教練資料',
    href: '/admin/coaches',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: 'user-plus',
  },
  {
    name: '匯出名單',
    desc: '下載 CSV 報表',
    href: '/admin/leads',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: 'download',
  },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">儀表板</h1>
      <p class="text-gray-500 mt-1">歡迎回來，以下是今日摘要</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <template v-else>
      <!-- Primary Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="stat in statCards"
          :key="stat.label"
          :to="stat.href"
          class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <p class="text-sm text-gray-500">{{ stat.label }}</p>
          <div class="flex items-end justify-between mt-2">
            <p class="text-3xl font-bold text-gray-900">{{ stat.value }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- Secondary Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NuxtLink
          v-for="stat in secondaryStats"
          :key="stat.label"
          :to="stat.href"
          class="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <p class="text-xs text-gray-500">{{ stat.label }}</p>
          <p class="text-xl font-bold text-gray-700 mt-1">{{ stat.value }}</p>
        </NuxtLink>
      </div>

      <!-- Recent Leads -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">最新名單</h2>
          <NuxtLink
            to="/admin/leads"
            class="text-sm text-navy-700 hover:text-navy-800 font-medium"
          >
            查看全部 →
          </NuxtLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">姓名</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">電話</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">類型</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">分店</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">建立時間</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-if="recentLeads.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                  尚無名單資料
                </td>
              </tr>
              <tr v-for="lead in recentLeads" :key="lead.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-medium text-gray-900">{{ lead.name }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ lead.phone }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[getLeadTypeClass(lead.type), 'text-xs font-medium px-2.5 py-1 rounded-full']">
                    {{ getLeadTypeLabel(lead.type) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ lead.storeName }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[getStatusClass(lead.status), 'text-xs font-medium px-2.5 py-1 rounded-full']">
                    {{ getStatusLabel(lead.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{{ formatDateTime(lead.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.name"
          :to="action.href"
          class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div :class="[action.iconBg, 'w-12 h-12 rounded-lg flex items-center justify-center']">
            <!-- Plus Icon -->
            <svg v-if="action.icon === 'plus'" :class="[action.iconColor, 'w-6 h-6']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <!-- User Plus Icon -->
            <svg v-else-if="action.icon === 'user-plus'" :class="[action.iconColor, 'w-6 h-6']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <!-- Download Icon -->
            <svg v-else-if="action.icon === 'download'" :class="[action.iconColor, 'w-6 h-6']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ action.name }}</p>
            <p class="text-sm text-gray-500">{{ action.desc }}</p>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
