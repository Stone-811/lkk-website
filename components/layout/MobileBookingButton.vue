<template>
  <div
    v-if="!isHidden"
    class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent md:hidden"
  >
    <NuxtLink
      to="/booking#form"
      class="flex items-center justify-center w-full py-4 px-6 bg-orange hover:bg-orange-400 text-white font-bold text-lg rounded-full shadow-lg transition-all duration-300 active:scale-95"
    >
      <svg
        class="w-6 h-6 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      立即預約體驗
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

/**
 * 不顯示這顆浮動按鈕的頁面：
 *   /booking       —— 本身就是預約體驗頁
 *   /group-booking —— 團體課有自己的報名表，浮動按鈕會導去別的表單
 *   /lkk4          —— 賽事頁的主要行動是「報名 LKK4」，不是預約體驗
 * 用「完全相同或其子路徑」比對，避免 /lkk-academy、/lkk-lecturer 被 /lkk4 誤判，
 * 也避免舊寫法 route.path.includes('/booking') 把任何含 booking 的路徑都吃掉。
 */
const HIDDEN_PATHS = ['/booking', '/group-booking', '/lkk4']

const isHidden = computed(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  return HIDDEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
})
</script>
