<script setup lang="ts">
// 名單表格的可排序表頭（點擊切換排序欄位與方向）
defineProps<{
  label: string
  column: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}>()
defineEmits<{ sort: [column: string] }>()
</script>

<template>
  <th
    @click="$emit('sort', column)"
    class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-gray-100"
  >
    <div class="flex items-center gap-1">
      {{ label }}
      <svg v-if="sortBy === column" class="w-3 h-3" :class="sortDir === 'desc' ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
      </svg>
    </div>
  </th>
</template>
