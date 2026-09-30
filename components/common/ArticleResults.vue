<script setup lang="ts">
import type { ArticlePost } from '~/composables/useArticleBrowser'

/**
 * 彙整頁的結果區：筆數、卡片、空結果、載入更多。
 * 三個 WordPress 驅動的彙整頁共用，各頁只負責自己的 hero 與 CTA。
 *
 * ⚠️ 量詞與名詞要成對傳。活動資訊是「14 則活動」不是「14 篇活動」。
 */
withDefaults(
  defineProps<{
    posts: ArticlePost[]
    total?: number
    hasMore?: boolean
    loading?: boolean
    /** 這一次請求沒成功。與空結果分開，文案完全不同 */
    failed?: boolean
    /** 首屏就取不到上游資料，而且這個分頁還沒有自己的結果 */
    showInitialError?: boolean
    /** 已送出的關鍵字，空字串代表瀏覽模式 */
    query?: string
    /** 搜尋範圍的名稱，例如「訓練知識」 */
    scopeLabel?: string
    /** 空結果時提供的範例關鍵字，各頁自己挑實際搜得到的 */
    suggestions?: string[]
    /** 名詞：文章 / 故事 / 活動 */
    emptyLabel?: string
    /** 量詞：篇 / 則 */
    unit?: string
  }>(),
  {
    total: 0,
    hasMore: false,
    loading: false,
    failed: false,
    showInitialError: false,
    query: '',
    scopeLabel: '',
    suggestions: () => [],
    emptyLabel: '文章',
    unit: '篇',
  }
)

const emit = defineEmits<{ (e: 'loadMore'): void; (e: 'suggest', keyword: string): void }>()
</script>

<template>
  <!-- 首屏就取不到上游資料：頁面其餘部分照常，只換掉清單區塊。
       一旦這個分頁有了自己的結果（例如搜尋成功），這塊就不再顯示 -->
  <div
    v-if="showInitialError"
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
        <div class="h-5 bg-cream-200 rounded w-4/5 mb-3"></div>
        <div class="h-3 bg-cream-200 rounded w-full mb-2"></div>
        <div class="h-3 bg-cream-200 rounded w-2/3"></div>
      </div>
    </div>

    <div
      v-else-if="failed && posts.length === 0"
      aria-live="polite"
      class="bg-white rounded-2xl p-8 text-center border border-orange/30"
    >
      <p class="font-serif text-xl font-black text-navy mb-2">這次沒有讀取成功</p>
      <p class="text-ink/70 text-sm leading-relaxed">
        內容由知識庫系統提供，剛才的連線沒有回應。再按一次「搜尋」就會重試。
      </p>
    </div>

    <!-- 搜尋有送出但沒有命中。WordPress 是整串比對，句子幾乎一定是 0 筆，
         所以這裡的重點是告訴讀者「換成短關鍵字」，而不是只說找不到 -->
    <div
      v-else-if="query && posts.length === 0"
      aria-live="polite"
      class="bg-white rounded-2xl p-8 md:p-10 text-center"
    >
      <p class="font-serif text-xl font-black text-navy mb-3">
        找不到包含「{{ query }}」的{{ emptyLabel }}
      </p>
      <p class="text-ink/70 text-sm leading-relaxed max-w-md mx-auto">
        搜尋是比對{{ emptyLabel }}的標題與內容，整句話通常找不到結果。
        試著改用較短的關鍵字。
      </p>
      <div v-if="suggestions.length" class="flex flex-wrap justify-center gap-2 mt-6">
        <button
          v-for="k in suggestions"
          :key="k"
          type="button"
          class="bg-cream hover:bg-cream-200 text-navy text-sm font-bold px-4 py-2 rounded-full transition-colors"
          @click="emit('suggest', k)"
        >
          {{ k }}
        </button>
      </div>
    </div>

    <template v-else>
      <!-- aria-live：搜尋結果是非同步換掉的，沒有這個螢幕報讀器不會知道畫面變了。
           這個站的讀者以中高齡為主，輔助工具的比例比一般網站高 -->
      <p v-if="query" aria-live="polite" class="text-sm text-ink/55 mb-6 text-center">
        <template v-if="scopeLabel">在「{{ scopeLabel }}」</template>
        找到 <strong class="text-navy font-bold">{{ total }}</strong> {{ unit }}包含「{{ query }}」的{{ emptyLabel }}
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <CommonArticleCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>

      <div v-if="hasMore" class="mt-10 text-center">
        <!-- 載入更多失敗時保留按鈕讓讀者能再按一次。
             第一版是把 hasMore 設成 false，按鈕直接消失又沒有任何訊息，
             讀者會以為已經看完全部 —— 學員故事有上百篇，這個誤會代價很大 -->
        <p v-if="failed" aria-live="polite" class="text-sm text-orange-700 mb-3">
          這次沒有載入成功，請再按一次。
        </p>
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-2 bg-white hover:bg-cream-200 disabled:opacity-60 disabled:cursor-not-allowed text-navy font-bold px-8 py-3 rounded-full border border-navy/15 transition-colors"
          @click="emit('loadMore')"
        >
          {{ loading ? '載入中…' : '載入更多' }}
        </button>
        <p class="text-xs text-ink/40 mt-3">已顯示 {{ posts.length }} / {{ total }} {{ unit }}</p>
      </div>

      <!-- 翻到底的收尾。沒有這一行的話按鈕只是無聲消失，
           讀者分不清「已經看完」與「壞掉了」 -->
      <p
        v-else-if="posts.length > 12"
        class="mt-10 text-center text-xs text-ink/40"
      >
        已顯示全部 {{ posts.length }} {{ unit }}
      </p>
    </template>
  </template>
</template>
