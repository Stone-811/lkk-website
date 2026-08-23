<script setup lang="ts">
// 名單頁篩選列：搜尋 + 日期區間 + 宣告式下拉（LeadFilterDef[]）+ 已套用 chips + 筆數
import type { LeadFilterDef } from '~/composables/useAdminLeads'

defineProps<{
  filters: LeadFilterDef[]
  activeFilters: { key: string; label: string; value: string; clear: () => void }[]
  hasActiveFilters: boolean
  count: number
  clearAll: () => void
}>()

const search = defineModel<string>('search', { default: '' })
const dateFrom = defineModel<string>('dateFrom', { default: '' })
const dateTo = defineModel<string>('dateTo', { default: '' })
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
    <!-- 篩選欄：全部同一排（flex-wrap 空間不足時自動換行）-->
    <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
      <div>
        <label class="block text-[11px] text-gray-400 mb-0.5">搜尋</label>
        <div class="relative w-52">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
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
      <div v-for="f in filters" :key="f.key">
        <label class="block text-[11px] text-gray-400 mb-0.5">{{ f.label }}</label>
        <SearchableSelect :class="f.widthClass" v-model="f.value.value" :options="f.options.value" all-label="全部" :placeholder="f.placeholder" />
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
        <button type="button" @click="clearAll()" class="text-xs text-gray-500 hover:text-gray-800 underline decoration-dotted underline-offset-2">清除全部</button>
      </template>
      <span :class="['text-sm text-gray-500', hasActiveFilters ? 'ml-auto' : '']">共 {{ count }} 筆</span>
    </div>
  </div>
</template>
