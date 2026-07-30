<script setup lang="ts">
interface Coach {
  id: string
  name: string
  roleTitle: string
  photo?: string
  education?: string[]
  experiences?: string[]
  certifications?: string[]
  specialties?: string[]
}

const props = defineProps<{
  coaches: Coach[]
}>()

const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

const totalItems = computed(() => props.coaches.length + 1) // +1 for "view all" card
const itemsPerPage = 3
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))
const maxDots = 7
const showPageDots = computed(() => totalPages.value > maxDots)
const activePage = computed(() => Math.floor(activeIndex.value / itemsPerPage))

// Update active index on scroll
const handleScroll = () => {
  const container = scrollRef.value
  if (!container) return

  const scrollLeft = container.scrollLeft
  const firstChild = container.firstElementChild as HTMLElement
  const itemWidth = firstChild?.clientWidth || 240
  const gap = 16 // gap-4 = 16px
  const index = Math.round(scrollLeft / (itemWidth + gap))
  activeIndex.value = Math.min(index, totalItems.value - 1)
}

// Scroll to specific index
const scrollToIndex = (index: number) => {
  const container = scrollRef.value
  if (!container) return

  const firstChild = container.firstElementChild as HTMLElement
  const itemWidth = firstChild?.clientWidth || 240
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

onMounted(() => {
  scrollRef.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  scrollRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="relative -mx-4 px-4">
    <!-- Carousel container -->
    <div
      ref="scrollRef"
      class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
      style="scrollbar-width: none; -ms-overflow-style: none;"
    >
      <CoachCard
        v-for="coach in coaches"
        :key="coach.id"
        :coach="coach"
      />

      <!-- View all coaches card -->
      <NuxtLink
        to="/team-intro/coaches"
        class="flex-shrink-0 w-[200px] sm:w-[240px] bg-white/50 border-2 border-dashed border-navy/20 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-orange/50 hover:bg-orange/5 transition-colors snap-start min-h-[300px]"
      >
        <div class="w-12 h-12 rounded-full bg-orange/15 flex items-center justify-center">
          <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-navy">查看全體教練</span>
      </NuxtLink>
    </div>

    <!-- Interactive scroll indicators -->
    <div class="flex justify-center items-center gap-1.5 mt-4">
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
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
div::-webkit-scrollbar {
  display: none;
}
</style>
