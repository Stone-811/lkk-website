<script setup lang="ts">
// 名單詳情彈窗外殼：遮罩、標題列、狀態列、內部備註、頁尾按鈕。
// 中段的資料區塊由各頁以 slot 提供（欄位各表單不同）。
import type { AdminLead } from '~/composables/useAdminLeads'

defineProps<{
  lead: AdminLead | null
  title: string
  saving: boolean
}>()
const emit = defineEmits<{ close: []; saveNote: [] }>()
const note = defineModel<string>('note', { default: '' })

const { statusLabels } = useLeadStatus()
const { formatDateTime } = useFormatDate()
</script>

<template>
  <div
    v-if="lead"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900">{{ title }}</h2>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-5">
        <!-- 狀態列 -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <span :class="[statusLabels[lead.status]?.class || 'bg-gray-100 text-gray-600', 'text-sm font-medium px-3 py-1 rounded-full']">
            {{ statusLabels[lead.status]?.label || lead.status }}
          </span>
          <span class="text-sm text-gray-400">建立於 {{ formatDateTime(lead.createdAt) }}</span>
        </div>

        <!-- 各表單自己的資料區塊 -->
        <slot :lead="lead" />

        <!-- 內部備註 -->
        <section class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-500 tracking-wider uppercase">內部備註</h3>
          </div>
          <div class="p-4">
            <textarea
              v-model="note"
              rows="3"
              placeholder="新增內部備註..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
            />
          </div>
        </section>
      </div>
      <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
        <button @click="emit('close')" class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
          關閉
        </button>
        <button
          @click="emit('saveNote')"
          :disabled="saving"
          class="bg-orange text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {{ saving ? '儲存中...' : '儲存備註' }}
        </button>
      </div>
    </div>
  </div>
</template>
