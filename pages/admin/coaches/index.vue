<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useHead({
  title: '教練管理｜練健康後台',
})

interface Coach {
  id: string
  name: string
  slug?: string
  photo?: string
  roleTitle?: string
  storeId?: string
  store?: { id: string; name: string; slug: string }
  specialties?: string[]
  certifications?: string[]
  experiences?: string[]
  education?: string | string[]
  description?: string
  sortOrder?: number
  isActive: boolean
}

interface StoreOption {
  value: string
  label: string
}

// 使用 useLazyAsyncData 優化載入速度（不阻塞導航）
const { data: coachesData, pending: isLoading, error: fetchError, refresh: refreshCoaches } = await useLazyAsyncData(
  'admin-coaches',
  () => $fetch<{ success: boolean; data: Coach[] }>('/api/admin/coaches'),
  { server: false }
)

const { data: storesData } = await useLazyAsyncData(
  'admin-stores-options',
  () => $fetch<{ success: boolean; data: any[] }>('/api/public/stores'),
  { server: false }
)

const coaches = computed(() => coachesData.value?.data || [])
const storeOptions = computed<StoreOption[]>(() =>
  storesData.value?.data?.map((s: any) => ({ value: s.id, label: s.name })) || []
)
const error = computed(() => fetchError.value?.data?.message || (fetchError.value ? '載入失敗' : ''))

// Filters
const searchQuery = ref('')
const filterStore = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')
const sortBy = ref<'sortOrder' | 'name' | 'store'>('sortOrder')
const sortDir = ref<'asc' | 'desc'>('asc')

// Filtered and sorted coaches
const filteredCoaches = computed(() => {
  let result = [...coaches.value]

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.roleTitle?.toLowerCase().includes(query) ||
      c.store?.name.toLowerCase().includes(query)
    )
  }

  // Filter by store
  if (filterStore.value) {
    result = result.filter(c => c.storeId === filterStore.value)
  }

  // Filter by status
  if (filterStatus.value === 'active') {
    result = result.filter(c => c.isActive)
  } else if (filterStatus.value === 'inactive') {
    result = result.filter(c => !c.isActive)
  }

  // Sort
  result.sort((a, b) => {
    let comparison = 0
    if (sortBy.value === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'store') {
      comparison = (a.store?.name || '').localeCompare(b.store?.name || '')
    } else {
      comparison = (a.sortOrder || 0) - (b.sortOrder || 0)
    }
    return sortDir.value === 'desc' ? -comparison : comparison
  })

  return result
})

function toggleSort(column: 'sortOrder' | 'name' | 'store') {
  if (sortBy.value === column) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortDir.value = 'asc'
  }
}

// Toggle coach active status
async function toggleActive(coach: Coach) {
  try {
    await $fetch(`/api/admin/coaches/${coach.id}`, {
      method: 'PATCH',
      body: { isActive: !coach.isActive },
    })
    await refreshCoaches()
  } catch (e: any) {
    alert(e.data?.message || '更新失敗')
  }
}

// Delete coach
async function deleteCoach(coach: Coach) {
  if (!confirm(`確定要刪除「${coach.name}」嗎？`)) return
  try {
    await $fetch(`/api/admin/coaches/${coach.id}`, {
      method: 'DELETE',
    })
    await refreshCoaches()
  } catch (e: any) {
    alert(e.data?.message || '刪除失敗')
  }
}

// Move coach up/down in sort order
async function moveCoach(coach: Coach, direction: 'up' | 'down') {
  const currentIndex = coaches.value.findIndex(c => c.id === coach.id)
  if (currentIndex === -1) return

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (newIndex < 0 || newIndex >= coaches.value.length) return

  // Prepare reorder data with swapped positions
  const items = [...coaches.value]
  const temp = items[currentIndex]
  items[currentIndex] = items[newIndex]
  items[newIndex] = temp

  const reorderItems = items.map((item, index) => ({
    id: item.id,
    sortOrder: index + 1,
  }))

  try {
    await $fetch('/api/admin/coaches/reorder', {
      method: 'PATCH',
      body: { items: reorderItems },
    })
    await refreshCoaches()
  } catch (e: any) {
    alert(e.data?.message || '更新排序失敗')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">教練管理</h1>
        <p class="text-gray-500 mt-1">管理所有教練資訊與專長</p>
      </div>
      <NuxtLink
        to="/admin/coaches/new"
        class="inline-flex items-center gap-2 bg-orange text-white font-medium px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增教練
      </NuxtLink>
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
              placeholder="搜尋教練姓名、職稱..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
            />
          </div>
        </div>

        <!-- Filter by store -->
        <select
          v-model="filterStore"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
        >
          <option value="">所有分店</option>
          <option v-for="opt in storeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <!-- Filter by status -->
        <select
          v-model="filterStatus"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
        >
          <option value="all">所有狀態</option>
          <option value="active">啟用中</option>
          <option value="inactive">已停用</option>
        </select>

        <!-- Results count -->
        <div class="text-sm text-gray-500">
          共 {{ filteredCoaches.length }} 筆
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{{ error }}</div>

    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table class="w-full min-w-[720px]">
        <thead class="bg-gray-50">
          <tr>
            <th
              @click="toggleSort('sortOrder')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 w-20 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                排序
                <svg v-if="sortBy === 'sortOrder'" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </th>
            <th
              @click="toggleSort('name')"
              class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
            >
              <div class="flex items-center gap-1">
                教練
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
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">職稱</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="filteredCoaches.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              {{ coaches.length === 0 ? '尚無教練資料' : '沒有符合條件的教練' }}
            </td>
          </tr>
          <tr v-for="(coach, index) in filteredCoaches" :key="coach.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-0.5">
                <button
                  @click="moveCoach(coach, 'up')"
                  :disabled="index === 0 || sortBy !== 'sortOrder'"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="上移"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  @click="moveCoach(coach, 'down')"
                  :disabled="index === filteredCoaches.length - 1 || sortBy !== 'sortOrder'"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="下移"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <img v-if="coach.photo" :src="coach.photo" :alt="coach.name" class="w-10 h-10 rounded-full object-cover" />
                <div v-else class="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white font-bold">{{ coach.name?.charAt(0) }}</div>
                <span class="font-medium text-gray-900">{{ coach.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ coach.store?.name || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500">{{ coach.roleTitle || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <button @click="toggleActive(coach)" :class="['text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80', coach.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']">
                {{ coach.isActive ? '啟用中' : '已停用' }}
              </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink :to="`/admin/coaches/${coach.id}`" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="編輯">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </NuxtLink>
                <button @click="deleteCoach(coach)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="刪除">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
