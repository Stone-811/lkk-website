<script setup lang="ts">
// 可搜尋下拉：點開顯示全部選項、打字即過濾、可清除。含「全部」選項（value='all'）。
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

type Opt = string | { value: string; label: string }

const props = withDefaults(defineProps<{
  modelValue: string
  options: Opt[]
  allLabel?: string          // 「全部」選項與未選時顯示的文字
  placeholder?: string       // 聚焦打字時的提示
}>(), {
  allLabel: '全部',
  placeholder: '輸入以搜尋…',
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const norm = computed<{ value: string; label: string }[]>(() =>
  props.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
)
const allOptions = computed(() => [{ value: 'all', label: props.allLabel }, ...norm.value])

function labelOf(val: string): string {
  return allOptions.value.find((o) => o.value === val)?.label || props.allLabel
}

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')

// 未開啟時，輸入框顯示目前選中的 label（'all' → 空、由 placeholder 顯示 allLabel）
watch(
  () => props.modelValue,
  () => { if (!open.value) query.value = props.modelValue === 'all' ? '' : labelOf(props.modelValue) },
  { immediate: true },
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allOptions.value
  return allOptions.value.filter((o) => o.value === 'all' || o.label.toLowerCase().includes(q))
})

function onFocus() { open.value = true; query.value = '' }

function select(o: { value: string; label: string }) {
  emit('update:modelValue', o.value)
  query.value = o.value === 'all' ? '' : o.label
  open.value = false
}

function clear() { select({ value: 'all', label: props.allLabel }) }

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false
    query.value = props.modelValue === 'all' ? '' : labelOf(props.modelValue)
  }
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="root" class="relative">
    <input
      v-model="query"
      type="text"
      :placeholder="modelValue === 'all' ? allLabel : placeholder"
      @focus="onFocus"
      class="w-full border border-gray-300 rounded-lg pl-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
    />
    <button
      v-if="modelValue !== 'all'"
      type="button"
      @click="clear"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
      title="清除"
    >✕</button>
    <span v-else class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▾</span>

    <ul
      v-if="open"
      class="absolute z-30 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm"
    >
      <li v-if="filtered.length === 0" class="px-3 py-2 text-gray-400">無符合項目</li>
      <li
        v-for="o in filtered"
        :key="o.value"
        @mousedown.prevent="select(o)"
        :class="[
          'px-3 py-2 cursor-pointer hover:bg-orange/5',
          o.value === modelValue ? 'bg-orange/10 text-orange font-medium' : 'text-gray-700',
        ]"
      >{{ o.label }}</li>
    </ul>
  </div>
</template>
