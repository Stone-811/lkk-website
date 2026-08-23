<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Coach {
  id: string
  name: string
  roleTitle: string
  photo?: string
  description?: string
  education?: string[]
  experiences?: string[]
  certifications?: string[]
  specialties?: string[]
}

const props = defineProps<{
  coaches: Coach[]
  /** 所屬分店：帶進彈窗顯示分店名，並讓「預約體驗」CTA 自動帶分店參數 */
  store?: { name?: string; slug?: string } | null
}>()

const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

const totalItems = computed(() => props.coaches.length + 1) // +1 for "view all" card（每組）
const itemsPerPage = 3
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))
const maxDots = 7
const showPageDots = computed(() => totalPages.value > maxDots)
const activePage = computed(() => Math.floor(activeIndex.value / itemsPerPage))

// ── 自動輪播：桌機才啟用、滑鼠移上去暫停、尊重「減少動態」偏好 ──
const autoScroll = ref(false) // 啟用後會複製一組卡片做無縫循環
let rafId: number | null = null
let paused = false
const SPEED = 0.6 // px / frame（約 36px/s，順順地滑）

// 教練詳情彈窗（與 /team-intro/coaches 共用 CoachDetailModal）
const selectedCoach = ref<(Coach & { store?: { name?: string; slug?: string } | null }) | null>(null)
function openCoach(coach: Coach) {
  selectedCoach.value = { ...coach, store: props.store ?? null }
  paused = true          // 彈窗開著時停住自動輪播，關掉才繼續
}
function closeCoach() {
  selectedCoach.value = null
  paused = false
}

// Update active index on scroll（複製組會超出，用 mod 對回第一組）
const handleScroll = () => {
  const container = scrollRef.value
  if (!container) return

  const firstChild = container.firstElementChild as HTMLElement
  const itemWidth = firstChild?.clientWidth || 320
  const gap = 16 // gap-4 = 16px
  const index = Math.round(container.scrollLeft / (itemWidth + gap))
  activeIndex.value = Math.min(index % totalItems.value, totalItems.value - 1)
}

// 自動輪播每幀推進；到第一組末端無縫跳回
const step = () => {
  const el = scrollRef.value
  if (el && autoScroll.value && !paused) {
    el.scrollLeft += SPEED
    const half = el.scrollWidth / 2 // 複製了一組 → 第一組寬度 = 總寬一半
    if (half > 0 && el.scrollLeft >= half) {
      el.scrollLeft -= half
    }
  }
  rafId = requestAnimationFrame(step)
}

// Scroll to specific index
const scrollToIndex = (index: number) => {
  const container = scrollRef.value
  if (!container) return

  const firstChild = container.firstElementChild as HTMLElement
  const itemWidth = firstChild?.clientWidth || 320
  const gap = 16
  container.scrollTo({
    left: index * (itemWidth + gap),
    behavior: 'smooth',
  })
}

// For page-based navigation
const scrollToPage = (page: number) => {
  scrollToIndex(page * itemsPerPage)
}

// Calculate visible dot range
const getVisibleDotRange = () => {
  if (totalPages.value <= maxDots) {
    return { start: 0, end: totalPages.value }
  }

  const halfWindow = Math.floor(maxDots / 2)
  let start = Math.max(0, activePage.value - halfWindow)
  let end = Math.min(totalPages.value, start + maxDots)

  if (end === totalPages.value) {
    start = Math.max(0, end - maxDots)
  }

  return { start, end }
}

const dotRange = computed(() => getVisibleDotRange())

const onEnter = () => { paused = true }
const onLeave = () => { paused = false }

onMounted(() => {
  scrollRef.value?.addEventListener('scroll', handleScroll, { passive: true })

  // 只有桌機（有滑鼠、可 hover）、未開啟減少動態、且教練夠多時才自動輪播
  const canAuto =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    props.coaches.length > 3

  if (canAuto) {
    autoScroll.value = true
    rafId = requestAnimationFrame(step)
  }
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  scrollRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="relative -mx-4 px-4">
    <!-- Carousel container -->
    <div
      ref="scrollRef"
      class="flex gap-4 overflow-x-auto pb-4"
      style="scrollbar-width: none; -ms-overflow-style: none;"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <!-- 第一組 -->
      <CoachCard
        v-for="coach in coaches"
        :key="`a-${coach.id}`"
        :coach="coach"
        @select="openCoach(coach)"
      />
      <NuxtLink
        to="/team-intro/coaches"
        class="flex-shrink-0 w-[200px] sm:w-[240px] self-stretch bg-white/50 border-2 border-dashed border-navy/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-orange/50 hover:bg-orange/5 transition-colors"
      >
        <div class="w-12 h-12 rounded-full bg-orange/15 flex items-center justify-center">
          <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-navy">查看全體教練</span>
      </NuxtLink>

      <!-- 第二組（複製，供桌機無縫自動輪播；aria-hidden 避免重複朗讀）-->
      <template v-if="autoScroll">
        <CoachCard
          v-for="coach in coaches"
          :key="`b-${coach.id}`"
          :coach="coach"
          aria-hidden="true"
          @select="openCoach(coach)"
        />
        <NuxtLink
          to="/team-intro/coaches"
          aria-hidden="true"
          tabindex="-1"
          class="flex-shrink-0 w-[200px] sm:w-[240px] self-stretch bg-white/50 border-2 border-dashed border-navy/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-orange/50 hover:bg-orange/5 transition-colors"
        >
          <div class="w-12 h-12 rounded-full bg-orange/15 flex items-center justify-center">
            <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-navy">查看全體教練</span>
        </NuxtLink>
      </template>
    </div>

    <!-- 手動模式（手機/減少動態）才顯示分頁圓點；自動輪播時隱藏 -->
    <div v-if="!autoScroll" class="flex justify-center items-center gap-1.5 mt-4">
      <!-- Left ellipsis for many pages -->
      <button
        v-if="showPageDots && dotRange.start > 0"
        class="w-2 h-2 rounded-full bg-navy/20 hover:bg-navy/40 transition-all"
        aria-label="前往第一頁"
        @click="scrollToPage(0)"
      />
      <span v-if="showPageDots && dotRange.start > 1" class="text-xs text-ink/30">...</span>

      <!-- Page-based or item-based dots -->
      <template v-if="showPageDots">
        <button
          v-for="pageIdx in (dotRange.end - dotRange.start)"
          :key="dotRange.start + pageIdx - 1"
          :class="[
            'w-2 h-2 rounded-full transition-all',
            (dotRange.start + pageIdx - 1) === activePage
              ? 'bg-orange w-4'
              : 'bg-navy/20 hover:bg-navy/40'
          ]"
          :aria-label="`前往第 ${dotRange.start + pageIdx} 頁`"
          @click="scrollToPage(dotRange.start + pageIdx - 1)"
        />
      </template>
      <template v-else>
        <button
          v-for="idx in totalItems"
          :key="idx - 1"
          :class="[
            'w-2 h-2 rounded-full transition-all',
            (idx - 1) === activeIndex
              ? 'bg-orange w-4'
              : 'bg-navy/20 hover:bg-navy/40'
          ]"
          :aria-label="`前往第 ${idx} 項`"
          @click="scrollToIndex(idx - 1)"
        />
      </template>

      <!-- Right ellipsis for many pages -->
      <span v-if="showPageDots && dotRange.end < totalPages - 1" class="text-xs text-ink/30">...</span>
      <button
        v-if="showPageDots && dotRange.end < totalPages"
        class="w-2 h-2 rounded-full bg-navy/20 hover:bg-navy/40 transition-all"
        aria-label="前往最後一頁"
        @click="scrollToPage(totalPages - 1)"
      />

      <!-- Page indicator text for many coaches -->
      <span v-if="showPageDots" class="text-xs text-ink/40 ml-2">
        {{ activePage + 1 }}/{{ totalPages }}
      </span>
    </div>

    <CoachDetailModal :coach="selectedCoach" @close="closeCoach" />
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
div::-webkit-scrollbar {
  display: none;
}
</style>
