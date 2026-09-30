<script setup lang="ts">
import type { ArticlePost } from '~/composables/useArticleBrowser'

/**
 * 彙整頁的結果區：筆數、卡片、空結果、載入更多。
 * 三個 WordPress 驅動的彙整頁共用，各頁只負責自己的 hero 與 CTA。
 */
withDefaults(
  defineProps<{
    posts: ArticlePost[]
    total?: number
    hasMore?: boolean
    loading?: boolean
    failed?: boolean
    /** 首屏就取不到上游資料；與 failed 分開，文案不同 */
    initialFailed?: boolean
    /** 已送出的關鍵字，空字串代表瀏覽模式 */
    query?: string
    /** 搜尋範圍的名稱，例如「訓練知識」 */
    scopeLabel?: string
    /** 空結果時提供的範例關鍵字，各頁自己挑實際搜得到的 */
    suggestions?: string[]
    emptyLabel?: string
  }>(),
  {
    total: 0,
    hasMore: false,
    loading: false,
    failed: false,
    initialFailed: false,
    query: '',
    scopeLabel: '',
    suggestions: () => [],
    emptyLabel: '文章',
  }
)

const emit = defineEmits<{ (e: 'loadMore'): void; (e: 'suggest', keyword: string): void }>()
</script>

<template>
  <!-- 首屏就取不到上游資料：頁面其餘部分照常，只換掉清單區塊 -->
  <div
    v-if="initialFailed"
    class="bg-white rounded-2xl p-8 text-center border border-orange/30"
  >
    <p class="font-serif text-xl font-black text-navy mb-2">{{ emptyLabel }}清單暫時讀取不到</p>
    <p class="text-ink/70 text-sm leading-relaxed">
      內容由知識庫系統提供，目前連線沒有回應。
      請稍後重新整理，或從上方導覽列瀏覽其他內容。
    </p>
  </div>

  <template v-else>
    <!-- 搜尋送出後、第一批結果還沒回來 -->
    <div v-if="loading && posts.length === 0" class="grid gap-6 md:grid-cols-2">
      <div v-for="n in 4" :key="n" class="bg-white rounded-2xl p-6 animate-pulse">
        <div class="h-5 bg-cream-dark rounded w-4/5 mb-3"></div>
        <div class="h-3 bg-cream-dark rounded w-full mb-2"></div>
        <div class="h-3 bg-cream-dark rounded w-2/3"></div>
      </div>
    </div>

    <div
      v-else-if="failed && posts.length === 0"
      class="bg-white rounded-2xl p-8 text-center border border-orange/30"
    >
      <p class="font-serif text-xl font-black text-navy mb-2">這次搜尋沒有完成</p>
      <p class="text-ink/70 text-sm leading-relaxed">
        內容由知識庫系統提供，剛才的連線沒有回應。請稍後再試一次。
      </p>
    </div>

    <!-- 搜尋有送出但沒有命中。WordPress 是整串比對，句子幾乎一定是 0 筆，
         所以這裡的重點是告訴讀者「換成短關鍵字」，而不是只說找不到 -->
    <div
      v-else-if="query && posts.length === 0"
      class="bg-white rounded-2xl p-8 md:p-10 text-center"
    >
      <p class="font-serif text-xl font-black text-navy mb-3">
        找不到包含「{{ query }}」的{{ emptyLabel }}
      </p>
      <p class="text-ink/70 text-sm leading-relaxed max-w-md mx-auto">
        搜尋是比對文章的標題與內容，整句話通常找不到結果。
        試著改用較短的關鍵字。
      </p>
      <div v-if="suggestions.length" class="flex flex-wrap justify-center gap-2 mt-6">
        <button
          v-for="k in suggestions"
          :key="k"
          type="button"
          class="bg-cream hover:bg-cream-dark text-navy text-sm font-bold px-4 py-2 rounded-full transition-colors"
          @click="emit('suggest', k)"
        >
          {{ k }}
        </button>
      </div>
    </div>

    <template v-else>
      <p v-if="query" class="text-sm text-ink/55 mb-6 text-center">
        <template v-if="scopeLabel">在「{{ scopeLabel }}」</template>
        找到 <strong class="text-navy font-bold">{{ total }}</strong> 篇包含「{{ query }}」的{{ emptyLabel }}
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <CommonArticleCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>

      <div v-if="hasMore" class="mt-10 text-center">
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-2 bg-white hover:bg-cream-dark disabled:opacity-60 disabled:cursor-not-allowed text-navy font-bold px-8 py-3 rounded-full border border-navy/15 transition-colors"
          @click="emit('loadMore')"
        >
          {{ loading ? '載入中…' : '載入更多' }}
        </button>
        <p class="text-xs text-ink/40 mt-3">已顯示 {{ posts.length }} / {{ total }} 篇</p>
      </div>
    </template>
  </template>
</template>
