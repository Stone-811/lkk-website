<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useHead({
  title: '分店管理｜練健康後台',
})

interface Store {
  id: string
  name: string
  slug: string
  city?: string
  district?: string
  phone?: string
  sortOrder?: number
  isActive: boolean
  coachCount?: number
}

// 使用 useLazyAsyncData 優化載入速度（不阻塞導航）
const { data: storesData, pending: isLoading, error: fetchError, refresh } = await useLazyAsyncData(
  'admin-stores',
  () => $fetch<{ success: boolean; data: Store[] }>('/api/admin/stores'),
  { server: false }
)

const stores = computed(() => storesData.value?.data || [])
const error = computed(() => fetchError.value?.data?.message || (fetchError.value ? '載入失敗' : ''))

async function toggleActive(store: Store) {
  try {
    await $fetch(`/api/admin/stores/${store.id}`, {
      method: 'PATCH',
      body: { isActive: !store.isActive },
    })
    await refresh()
  } catch (e: any) {
    alert(e.data?.message || '更新失敗')
  }
}

async function deleteStore(store: Store) {
  if (!confirm(`確定要刪除「${store.name}」嗎？此操作無法復原。`)) return
  try {
    await $fetch(`/api/admin/stores/${store.id}`, {
      method: 'DELETE',
    })
    await refresh()
  } catch (e: any) {
    alert(e.data?.message || '刪除失敗')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">分店管理</h1>
        <p class="text-gray-500 mt-1">管理所有分店資訊</p>
      </div>
      <NuxtLink
        to="/admin/stores/new"
        class="inline-flex items-center gap-2 bg-orange text-white font-medium px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新增分店
      </NuxtLink>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分店名稱</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地區</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">教練數</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="stores.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                目前沒有分店資料
              </td>
            </tr>
            <tr v-for="store in stores" :key="store.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ store.name }}</div>
                <div class="text-xs text-gray-400">{{ store.slug }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ store.city }} {{ store.district }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ store.phone || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ store.coachCount ?? 0 }} 位
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="toggleActive(store)"
                  :class="[
                    'text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors',
                    store.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  ]"
                >
                  {{ store.isActive ? '上架中' : '已下架' }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-3">
                  <NuxtLink
                    :to="`/admin/stores/${store.id}`"
                    class="text-navy-700 hover:text-navy-800 font-medium"
                  >
                    編輯
                  </NuxtLink>
                  <button
                    @click="deleteStore(store)"
                    class="text-red-500 hover:text-red-600 font-medium"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
