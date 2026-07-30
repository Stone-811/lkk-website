<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useHead({
  title: 'LKK4 成績管理｜練健康後台',
})

interface LKK4Record {
  id: string
  year: number
  competitionGroup: string
  teamName: string | null
  rank: number | null
  name: string
  gender: string
  bodyWeight: number | null
  firstAttempt: number | null
  firstAttemptResult: string | null
  secondAttempt: number | null
  secondAttemptResult: string | null
  thirdAttempt: number | null
  thirdAttemptResult: string | null
  finalScore: number
  ipfGlPoint: number
}

// Data state
const records = ref<LKK4Record[]>([])
const isLoading = ref(true)
const error = ref('')

// Filter state
const availableYears = ref<number[]>([])
const availableGroups = ref<string[]>([])
const selectedYear = ref<number | null>(null)
const selectedGroup = ref('')
const searchName = ref('')

// Import state
const showImportModal = ref(false)
const csvData = ref('')
const isImporting = ref(false)
const importMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Fetch records
async function fetchRecords() {
  isLoading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (selectedYear.value) params.set('year', selectedYear.value.toString())
    if (selectedGroup.value) params.set('group', selectedGroup.value)
    if (searchName.value.trim()) params.set('name', searchName.value.trim())

    const url = '/api/admin/lkk4-records' + (params.toString() ? `?${params.toString()}` : '')
    const response = await $fetch<{
      success: boolean
      data: LKK4Record[]
      total: number
      filters: { years: number[]; groups: string[] }
    }>(url)

    if (response.success) {
      records.value = response.data
      availableYears.value = response.filters.years
      availableGroups.value = response.filters.groups
    }
  } catch (e: any) {
    error.value = e.data?.message || '載入失敗'
    console.error('Error fetching LKK4 records:', e)
  } finally {
    isLoading.value = false
  }
}

// Import handlers
function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    // Remove BOM if present
    csvData.value = text.replace(/^\uFEFF/, '')
    importMessage.value = { type: 'success', text: `已載入：${file.name}` }
  }
  reader.onerror = () => {
    importMessage.value = { type: 'error', text: '檔案讀取失敗' }
  }
  reader.readAsText(file, 'UTF-8')
}

async function handleImport() {
  if (!csvData.value.trim()) {
    importMessage.value = { type: 'error', text: '請先上傳 CSV 檔案' }
    return
  }

  isImporting.value = true
  importMessage.value = null

  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/admin/lkk4-records/import', {
      method: 'POST',
      body: { csvData: csvData.value },
    })

    importMessage.value = { type: 'success', text: res.message }
    csvData.value = ''
    showImportModal.value = false
    // Refresh records
    await fetchRecords()
  } catch (error: any) {
    importMessage.value = {
      type: 'error',
      text: error.data?.message || '匯入失敗',
    }
  } finally {
    isImporting.value = false
  }
}

function closeImportModal() {
  showImportModal.value = false
  csvData.value = ''
  importMessage.value = null
}

// Preview rows for import
const previewRows = computed(() => {
  return csvData.value ? csvData.value.split('\n').slice(0, 4) : []
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchRecords()
  }, 300)
}

// Format attempt result display
function formatAttempt(weight: number | null, result: string | null): string {
  if (weight === null) return '-'
  const status = result === 'y' ? '✓' : result === 'n' ? '✗' : ''
  return `${weight}${status}`
}

onMounted(fetchRecords)
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">LKK4 成績管理</h1>
        <p class="text-gray-500 mt-1">中高齡四項體能挑戰賽成績紀錄</p>
      </div>
      <button
        @click="showImportModal = true"
        class="inline-flex items-center gap-2 bg-orange text-white font-medium px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        匯入 CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Year Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">年度</label>
          <select
            v-model="selectedYear"
            @change="fetchRecords"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option :value="null">全部年度</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <!-- Group Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">組別</label>
          <select
            v-model="selectedGroup"
            @change="fetchRecords"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">全部組別</option>
            <option v-for="group in availableGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
        </div>

        <!-- Name Search -->
        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <label class="text-sm font-medium text-gray-700">搜尋</label>
          <input
            v-model="searchName"
            @input="onSearchInput"
            type="text"
            placeholder="輸入姓名..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          />
        </div>

        <!-- Record Count -->
        <div class="text-sm text-gray-500 ml-auto">
          共 {{ records.length }} 筆紀錄
        </div>
      </div>
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
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年度</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">組別</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">隊伍</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名次</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">性別</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">體重</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">第一次</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">第二次</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">第三次</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成績</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IPF GL</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="records.length === 0">
              <td colspan="12" class="px-4 py-12 text-center text-gray-500">
                目前沒有成績紀錄
              </td>
            </tr>
            <tr v-for="record in records" :key="record.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ record.year }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ record.competitionGroup }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ record.teamName || '-' }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span v-if="record.rank" class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                  :class="{
                    'bg-yellow-100 text-yellow-800': record.rank === 1,
                    'bg-gray-100 text-gray-600': record.rank === 2,
                    'bg-orange-100 text-orange-800': record.rank === 3,
                    'bg-gray-50 text-gray-500': record.rank > 3
                  }"
                >
                  {{ record.rank }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ record.name }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ record.gender }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {{ record.bodyWeight ? `${record.bodyWeight} kg` : '-' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm"
                :class="record.firstAttemptResult === 'y' ? 'text-green-600' : record.firstAttemptResult === 'n' ? 'text-red-500' : 'text-gray-500'"
              >
                {{ formatAttempt(record.firstAttempt, record.firstAttemptResult) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm"
                :class="record.secondAttemptResult === 'y' ? 'text-green-600' : record.secondAttemptResult === 'n' ? 'text-red-500' : 'text-gray-500'"
              >
                {{ formatAttempt(record.secondAttempt, record.secondAttemptResult) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm"
                :class="record.thirdAttemptResult === 'y' ? 'text-green-600' : record.thirdAttemptResult === 'n' ? 'text-red-500' : 'text-gray-500'"
              >
                {{ formatAttempt(record.thirdAttempt, record.thirdAttemptResult) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-navy-700">
                {{ record.finalScore }} kg
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {{ record.ipfGlPoint.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Import Modal -->
    <Teleport to="body">
      <div
        v-if="showImportModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeImportModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">匯入 CSV</h2>
            <button
              @click="closeImportModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-sm text-gray-500 mb-4">
            上傳 CSV 檔案匯入成績，匯入時會自動覆蓋所有舊資料
          </p>

          <div class="space-y-4">
            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                選擇 CSV 檔案
              </label>
              <input
                type="file"
                accept=".csv"
                @change="handleFileUpload"
                class="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-navy file:text-white
                  hover:file:bg-navy-600
                  file:cursor-pointer"
              />
            </div>

            <!-- Message -->
            <div
              v-if="importMessage"
              :class="[
                'p-3 rounded-lg text-sm',
                importMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              ]"
            >
              {{ importMessage.text }}
            </div>

            <!-- Preview -->
            <div v-if="previewRows.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                資料預覽
              </label>
              <div class="bg-gray-50 rounded-lg p-3 max-h-32 overflow-auto">
                <pre class="text-xs text-gray-600 whitespace-pre-wrap">{{ previewRows.join('\n') }}</pre>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="closeImportModal"
              class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleImport"
              :disabled="isImporting || !csvData.trim()"
              class="inline-flex items-center gap-2 bg-orange text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="isImporting">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                匯入中...
              </template>
              <template v-else>
                匯入並覆蓋
              </template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
