<script setup lang="ts">
/**
 * ⚠️ bottom-24（96px）是刻意的，不要改回 md:bottom-8。
 *    GTM 容器裡的漸強實驗室聊天按鈕固定在 right:24 / bottom:24、尺寸 56px、
 *    z-index 3000，佔掉距底部 24–80px 這一段，而且它在 shadow DOM 裡、
 *    我們的 CSS 動不到。2026-09-25 實測：BackToTop 原本在 32–80px，
 *    與它幾乎完全重疊。
 *    目前的堆疊由下而上是：Messenger(24–80) → 返回頂端(96–144) → LINE(160–208)。
 */
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)

function checkScroll() {
  isVisible.value = window.scrollY > 400
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
  checkScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition name="fade">
    <button
      v-show="isVisible"
      @click="scrollToTop"
      class="fixed bottom-24 right-4 md:right-6 z-40 w-12 h-12 bg-navy hover:bg-navy-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-xl"
      aria-label="回到頂部"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
