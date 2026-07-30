<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    message?: string
  }
}>()

const is404 = computed(() => props.error?.statusCode === 404)

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-cream-100 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="font-serif text-8xl font-black text-orange mb-4">
        {{ error?.statusCode || '錯誤' }}
      </div>
      <h1 class="font-serif text-2xl font-bold text-navy-700 mb-4">
        {{ is404 ? '頁面不存在' : '發生錯誤' }}
      </h1>
      <p class="text-ink/60 mb-6">
        {{ is404 ? '抱歉，找不到您要的頁面。可能已被移除或網址輸入錯誤。' : '抱歉，發生了一些問題。請稍後再試。' }}
      </p>
      <button
        class="inline-block bg-orange text-white font-bold px-6 py-3 rounded-full hover:bg-orange/90 transition-colors"
        @click="handleError"
      >
        回到首頁
      </button>
    </div>
  </div>
</template>
