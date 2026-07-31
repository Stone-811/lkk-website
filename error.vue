<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    message?: string
  }
}>()

const is404 = computed(() => props.error?.statusCode === 404)

// On an error page, navigation must go through clearError to reset the error state.
const go = (path: string) => clearError({ redirect: path })

const quickLinks = [
  { name: '預約體驗', path: '/booking' },
  { name: '分店據點', path: '/locations' },
  { name: '教練團隊', path: '/team-intro/coaches' },
  { name: 'LKK4 賽事', path: '/lkk4' },
]
</script>

<template>
  <div class="min-h-screen bg-cream flex flex-col font-sans">
    <!-- Brand header（自帶，不依賴全站 layout 元件，錯誤頁更穩） -->
    <header class="bg-navy">
      <div class="container mx-auto px-4 h-16 lg:h-20 flex items-center">
        <button type="button" class="flex items-center" aria-label="回到首頁" @click="go('/')">
          <img src="/lkklogo.png" alt="練健康 LKK Wellness" class="h-8 lg:h-10 w-auto" />
        </button>
      </div>
    </header>

    <!-- 404 內容 -->
    <main class="flex-1 relative overflow-hidden flex items-center justify-center">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(251,114,10,0.09)_0%,transparent_62%)]" />
      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24 text-center">
        <div class="font-serif text-[6.5rem] lg:text-[10rem] font-black text-orange leading-none mb-2">
          {{ error?.statusCode || '錯誤' }}
        </div>
        <h1 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-4">
          {{ is404 ? '找不到這個頁面' : '發生了一點問題' }}
        </h1>
        <p class="text-ink/60 text-lg max-w-md mx-auto mb-10 leading-relaxed">
          {{ is404
            ? '抱歉，您要找的頁面可能已被移除，或網址輸入有誤。不如從這裡重新開始，一起變得更健康！'
            : '系統暫時出了點狀況，請稍後再試，或先回到首頁繼續。' }}
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <button
            type="button"
            class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
            @click="go('/')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            回到首頁
          </button>
          <a
            href="https://l-kk.tw/category/knowledge"
            class="inline-flex items-center gap-2 bg-white border border-navy/15 text-navy font-semibold px-6 py-3 rounded-full hover:border-orange/40 transition-colors"
          >
            瀏覽知識分享
          </a>
        </div>

        <!-- 快速連結 -->
        <div class="max-w-lg mx-auto">
          <div class="text-xs font-bold text-ink/40 tracking-widest uppercase mb-4">或前往</div>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              v-for="link in quickLinks"
              :key="link.path"
              type="button"
              class="bg-white rounded-full px-5 py-2 text-sm font-semibold text-navy/80 border border-navy/10 hover:border-orange/40 hover:text-navy transition-colors"
              @click="go(link.path)"
            >
              {{ link.name }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Brand footer -->
    <footer class="bg-navy text-white/55 text-sm">
      <div class="container mx-auto px-4 py-6 text-center">
        © 練健康 LKK Wellness
      </div>
    </footer>
  </div>
</template>
