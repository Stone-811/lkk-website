<script setup lang="ts">
// 團課預約後台：讀取 type=group_class 的名單（前端 /group-booking 表單送出）
// 版型與客戶預約 leads.vue 一致；共用邏輯在 composables/useAdminLeads.ts，
// 本頁只保留：資料抓取與映射、篩選定義、表格欄位、詳情內容、CSV 欄位。
import { ref, computed } from 'vue'
import { groupClassVariants } from '~/config/groupClassVariants'
import type { AdminLead } from '~/composables/useAdminLeads'

const { statusLabels } = useLeadStatus()
const { formatDateTime } = useFormatDate()
const { exportCsv } = useCsvExport()

definePageMeta({
  layout: 'admin',
})

useHead({
  title: '團課預約｜練健康後台',
})

async function fetchLeads(): Promise<AdminLead[]> {
  const res = await $fetch<{ success: boolean; data: any[] }>('/api/admin/leads?type=group_class')
  if (!res.success) return []
  return res.data.map((lead: any) => ({
    ...lead,
    // 表單存的是完整門店字串（「南京店｜台北市…」），舊資料只有 store
    storeName: lead.payload?.storeName || String(lead.payload?.store || '').split('｜')[0].trim() || '-',
  }))
}

const {
  isLoading, error,
  searchQuery, dateFrom, dateTo,
  filterDefs, activeFilters, hasActiveFilters, clearAllFilters,
  sortBy, sortDir, toggleSort,
  filteredLeads,
  updateStatus,
  selectedLead, noteText, saving, openDetail, closeDetail, handleSaveNote,
} = useAdminLeads({
  fetch: fetchLeads,
  filters: ({ leads }) => [
    {
      key: 'store', label: '門店', widthClass: 'w-32', placeholder: '搜尋門店…',
      value: ref('all'),
      // 門店選項從現有名單自動蒐集（團課門店不是 Firestore stores）
      options: computed(() => {
        const set = new Set<string>()
        leads.value.forEach((l) => { if (l.storeName && l.storeName !== '-') set.add(l.storeName) })
        return Array.from(set).sort()
      }),
      match: (lead, v) => lead.storeName === v,
    },
    {
      key: 'course', label: '課程', widthClass: 'w-40', placeholder: '搜尋課程…',
      value: ref('all'),
      options: computed(() => {
        const set = new Set<string>()
        leads.value.forEach((l) => { const c = l.payload?.course || l.payload?.desiredClass; if (c) set.add(c) })
        return Array.from(set).sort()
      }),
      match: (lead, v) => (lead.payload?.course || lead.payload?.desiredClass || '') === v,
    },
    {
      key: 'status', label: '狀態', widthClass: 'w-28', placeholder: '搜尋狀態…',
      value: ref('all'),
      options: computed(() => LEAD_STATUS_FILTER_OPTIONS),
      match: (lead, v) => lead.status === v,
      chipLabel: (v) => LEAD_STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label || v,
    },
    {
      key: 'company', label: '公司', widthClass: 'w-24', placeholder: '搜尋公司…',
      value: ref('all'),
      // 選項＝團課變體設定 companies ∪ 名單實際 company
      options: computed(() => {
        const set = new Set<string>()
        Object.values(groupClassVariants).forEach((v) => { if (v.company) set.add(v.company) })
        leads.value.forEach((l) => { const c = l.payload?.company; if (c) set.add(c) })
        return Array.from(set).sort()
      }),
      match: (lead, v) => (lead.payload?.company || '') === v,
    },
    {
      key: 'source', label: '來源', widthClass: 'w-24', placeholder: '搜尋來源…',
      value: ref('all'),
      options: computed(() => {
        const set = new Set<string>(SOURCE_CHANNELS)
        leads.value.forEach((l) => { const s = l.payload?.leadSource; if (s) set.add(s) })
        return Array.from(set)
      }),
      match: (lead, v) => (lead.payload?.leadSource || '') === v,
    },
    {
      key: 'us', label: 'UTM 來源', widthClass: 'w-28', placeholder: '搜尋…',
      value: ref('all'),
      options: computed(() => {
        const set = new Set<string>()
        leads.value.forEach((l) => { const v = l.payload?.utm?.source; if (v) set.add(v) })
        return Array.from(set).sort()
      }),
      match: (lead, v) => (lead.payload?.utm?.source || '') === v,
    },
    {
      key: 'uc', label: 'UTM 活動', widthClass: 'w-28', placeholder: '搜尋活動…',
      value: ref('all'),
      options: computed(() => {
        const set = new Set<string>()
        leads.value.forEach((l) => { const v = l.payload?.utm?.campaign; if (v) set.add(v) })
        return Array.from(set).sort()
      }),
      match: (lead, v) => (lead.payload?.utm?.campaign || '') === v,
    },
  ],
})

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
  exportCsv('group_class_leads', headers, rows)
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
    <AdminLeadFilterBar
      v-model:search="searchQuery"
      v-model:date-from="dateFrom"
      v-model:date-to="dateTo"
      :filters="filterDefs"
      :active-filters="activeFilters"
      :has-active-filters="hasActiveFilters"
      :count="filteredLeads.length"
      :clear-all="clearAllFilters"
    />

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
            <AdminSortableTh label="學員" column="name" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">課程</th>
            <AdminSortableTh label="門店" column="store" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">電話</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">來源</th>
            <AdminSortableTh label="狀態" column="status" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="時間" column="createdAt" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
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
    <AdminLeadDetailModal
      :lead="selectedLead"
      title="團體課程報名詳情"
      :saving="saving"
      v-model:note="noteText"
      @close="closeDetail"
      @save-note="handleSaveNote"
    >
      <template #default="{ lead }">
        <!-- 學員資料 -->
        <section class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">學員資料</h3>
          </div>
          <div class="p-4 grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-gray-500 mb-0.5">姓名</p>
              <p class="font-medium text-gray-900">{{ lead.name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-0.5">電話</p>
              <p class="font-medium text-gray-900">{{ lead.phone }}</p>
            </div>
            <div v-if="lead.email">
              <p class="text-xs text-gray-500 mb-0.5">Email</p>
              <p class="font-medium text-gray-900 break-all">{{ lead.email }}</p>
            </div>
            <div v-if="lead.payload?.gender">
              <p class="text-xs text-gray-500 mb-0.5">性別</p>
              <p class="font-medium text-gray-900">{{ lead.payload.gender }}</p>
            </div>
            <div v-if="lead.payload?.ageRange || lead.payload?.age">
              <p class="text-xs text-gray-500 mb-0.5">年齡區間</p>
              <p class="font-medium text-gray-900">{{ lead.payload.ageRange || lead.payload.age }}</p>
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
              <p class="font-medium text-gray-900">{{ lead.payload?.course || lead.payload?.desiredClass || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-0.5">上課門店</p>
              <p class="font-medium text-gray-900">{{ lead.storeName || '-' }}</p>
            </div>
            <div v-if="lead.payload?.preferredTime" class="col-span-2">
              <p class="text-xs text-gray-500 mb-0.5">偏好時段</p>
              <p class="font-medium text-gray-900">{{ lead.payload.preferredTime }}</p>
            </div>
            <div v-if="lead.payload?.source && lead.payload.source.length > 0" class="col-span-2">
              <p class="text-xs text-gray-500 mb-0.5">得知管道</p>
              <p class="font-medium text-gray-900">{{ Array.isArray(lead.payload.source) ? lead.payload.source.join('、') : lead.payload.source }}</p>
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
              <p class="font-medium text-gray-900">{{ lead.payload?.isFillerSelf === '否' ? '親友代填' : '本人填寫' }}</p>
            </div>
            <div v-if="lead.payload?.isFillerSelf === '否' && lead.payload?.fillerName">
              <p class="text-xs text-gray-500 mb-0.5">代填者姓名</p>
              <p class="font-medium text-gray-900">{{ lead.payload.fillerName }}</p>
            </div>
            <div v-if="lead.payload?.isFillerSelf === '否' && lead.payload?.relationship">
              <p class="text-xs text-gray-500 mb-0.5">與學員關係</p>
              <p class="font-medium text-gray-900">{{ lead.payload.relationship }}</p>
            </div>
          </div>
        </section>

        <!-- 健康狀況 -->
        <section class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">健康狀況</h3>
          </div>
          <div class="p-4 space-y-3">
            <div v-if="lead.payload?.experience">
              <p class="text-xs text-gray-500 mb-0.5">重訓經驗</p>
              <p class="font-medium text-gray-900">{{ lead.payload.experience }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-0.5">疾病／舊傷／開刀史</p>
              <p class="font-medium text-gray-900 whitespace-pre-wrap">{{ lead.payload?.medicalHistory || '-' }}</p>
            </div>
          </div>
        </section>

        <!-- 活動來源（變體表單：公司 / 來源）-->
        <section v-if="lead.payload?.company || lead.payload?.leadSource || lead.payload?.formVariant" class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">活動來源</h3>
          </div>
          <div class="p-4">
            <div class="flex flex-wrap gap-1.5">
              <span v-if="lead.payload.company" class="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">公司：{{ lead.payload.company }}</span>
              <span v-if="lead.payload.leadSource" class="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">來源：{{ lead.payload.leadSource }}</span>
              <span v-if="lead.payload.formVariant" class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">表單：{{ lead.payload.formVariant }}</span>
            </div>
          </div>
        </section>

        <!-- 來源追蹤 (UTM) -->
        <section v-if="lead.payload?.utm && (lead.payload.utm.source || lead.payload.utm.campaign || lead.payload.utm.medium)" class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">來源追蹤 (UTM)</h3>
          </div>
          <div class="p-4">
            <div class="flex flex-wrap gap-1.5">
              <span v-if="lead.payload.utm.source" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">來源：{{ lead.payload.utm.source }}</span>
              <span v-if="lead.payload.utm.medium" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">形式：{{ lead.payload.utm.medium }}</span>
              <span v-if="lead.payload.utm.campaign" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">活動：{{ lead.payload.utm.campaign }}</span>
              <span v-if="lead.payload.utm.content" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">素材：{{ lead.payload.utm.content }}</span>
            </div>
            <p v-if="lead.payload.utm.referrer" class="text-xs text-gray-400 mt-2 truncate">referrer: {{ lead.payload.utm.referrer }}</p>
          </div>
        </section>

        <!-- 學員備註 -->
        <section v-if="lead.payload?.note || lead.message" class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">學員備註</h3>
          </div>
          <div class="p-4">
            <p class="text-gray-900 whitespace-pre-wrap">{{ lead.payload?.note || lead.message }}</p>
          </div>
        </section>
      </template>
    </AdminLeadDetailModal>
  </div>
</template>
