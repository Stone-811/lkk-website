<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 營業時間資料：一~五=weekday、六=saturday、日=sunday（無資料視為公休）
const props = defineProps<{
  hours: { weekday?: string; saturday?: string; sunday?: string; [k: string]: any }
}>()

const expanded = ref(false)

// JS getDay(): 0=週日 … 6=週六
const DAY_DEFS = [
  { label: '星期日', key: 'sunday' },
  { label: '星期一', key: 'weekday' },
  { label: '星期二', key: 'weekday' },
  { label: '星期三', key: 'weekday' },
  { label: '星期四', key: 'weekday' },
  { label: '星期五', key: 'weekday' },
  { label: '星期六', key: 'saturday' },
]
// 顯示順序：週一 → 週日（Google 慣例）
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function hoursOf(dayIdx: number): string {
  const key = DAY_DEFS[dayIdx].key
  return (props.hours?.[key] as string) || '公休'
}
function parseRange(s: string): { open: number; close: number } | null {
  const m = String(s).match(/(\d{1,2}):(\d{2})\D+?(\d{1,2}):(\d{2})/)
  if (!m) return null
  return { open: +m[1] * 60 + +m[2], close: +m[3] * 60 + +m[4] }
}

// 台北時間：只在 client 端計算，避免 SSR/hydration 不一致；每分鐘更新
const nowTpe = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  const tick = () => {
    nowTpe.value = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  }
  tick()
  timer = setInterval(tick, 60000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const todayIdx = computed(() => (nowTpe.value ? nowTpe.value.getDay() : -1))
const todayHours = computed(() => (todayIdx.value >= 0 ? hoursOf(todayIdx.value) : ''))
const openNow = computed<boolean | null>(() => {
  if (!nowTpe.value) return null
  const range = parseRange(hoursOf(nowTpe.value.getDay()))
  if (!range) return false
  const mins = nowTpe.value.getHours() * 60 + nowTpe.value.getMinutes()
  return mins >= range.open && mins < range.close
})
</script>

<template>
  <div class="mt-6 border border-navy-700/15 rounded-xl overflow-hidden">
    <!-- 狀態列（點擊展開/收合）-->
    <button
      type="button"
      @click="expanded = !expanded"
      :aria-expanded="expanded"
      class="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-cream-100 transition-colors"
    >
      <svg class="w-5 h-5 text-navy-700/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke-width="2" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.5V12l3 2" />
      </svg>
      <span
        class="text-sm font-bold"
        :class="openNow === null ? 'text-navy-700' : (openNow ? 'text-green-600' : 'text-ink/50')"
      >
        {{ openNow === null ? '營業時間' : (openNow ? '營業中' : '已打烊') }}
      </span>
      <span v-if="todayHours" class="text-sm text-ink/60">· 今日 {{ todayHours }}</span>
      <svg
        class="w-4 h-4 ml-auto flex-shrink-0 text-navy-700/40 transition-transform duration-200"
        :class="expanded ? 'rotate-180' : ''"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- 展開：星期一 ~ 星期日，今天粗體標示 -->
    <div v-show="expanded" class="border-t border-navy-700/10">
      <div
        v-for="d in DISPLAY_ORDER"
        :key="d"
        class="flex items-center justify-between px-4 py-2 text-sm border-t border-navy-700/5 first:border-t-0"
        :class="d === todayIdx ? 'bg-cream-100 font-bold text-navy-700' : 'text-ink/70'"
      >
        <span>{{ DAY_DEFS[d].label }}</span>
        <span>{{ hoursOf(d) }}</span>
      </div>
    </div>
  </div>
</template>
