<script setup lang="ts">
// 活動資訊。文章仍由舊站 WordPress 管理，這頁只是用本站版型呈現清單。
//
// ⚠️ 舊站的 /activity/ 沒有 hero 文案（就是一個純列表），
//    所以這裡的標題與說明是新寫的，業主可自行調整。
//
// ⚠️ 2026-09-30 移除了兩條連往 l-kk.tw/activity/ 的連結（頁尾的「瀏覽更多活動」
//    與讀取失敗時的退路）。切轉之後那個網址會 301 到 lkkwellness.com/activity/，
//    而本站沒有這個路由，實測最終回 404。
//    同一批死連結在 knowledge-center 與 cases-center 已於當天清掉，這頁是漏網的。
//    「瀏覽更多」的功能現在由下方的「載入更多」取代。
const { data, pending } = await useFetch('/api/public/wp-articles', {
  query: { group: 'activity' },
})

const {
  input, submitted, searching, canSubmit,
  current, initialFailed,
  submit, clear, loadMore,
} = useArticleBrowser(data)

// 挑的是實際搜得到的詞（2026-09-30 實測，括號內為命中篇數）
// 硬舉 14、研習 3、骨質疏鬆 3、肌少症 3、講座 2
const SUGGESTIONS = ['硬舉', '研習', '講座', '骨質疏鬆']

function onSuggest(keyword: string) {
  input.value = keyword
  submit()
}

useHead({
  title: '活動資訊｜練健康 LKK Wellness Center',
  meta: [
    {
      name: 'description',
      content:
        '練健康的講座、研習、賽事與免費體驗活動。中高齡訓練研習、六角槓體驗、骨質疏鬆醫學講座與 LKK4 賽事資訊都在這裡。',
    },
  ],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <section class="bg-navy text-cream-50">
      <div class="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-24 text-center">
        <p class="text-orange font-bold tracking-wider text-sm mb-4">
          Events &amp; Workshops ・活動資訊
        </p>
        <h1 class="font-serif text-3xl lg:text-5xl font-black leading-tight mb-6">
          講座、研習與賽事，<br class="sm:hidden" >現場見
        </h1>
        <p class="text-cream-100/80 leading-relaxed max-w-2xl mx-auto">
          中高齡訓練研習、六角槓體驗、醫學講座與 LKK4 賽事。想親自試試看、或想更深入了解訓練背後的科學，從這裡開始。
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <CommonArticleSearch
        v-model="input"
        :can-submit="canSubmit"
        :loading="current.loading"
        :active="searching"
        placeholder="輸入關鍵字，例如：硬舉、研習、講座"
        @submit="submit"
        @clear="clear"
      />

      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="bg-white rounded-2xl p-6 animate-pulse">
          <div class="h-5 bg-cream-dark rounded w-4/5 mb-3"></div>
          <div class="h-3 bg-cream-dark rounded w-full mb-2"></div>
          <div class="h-3 bg-cream-dark rounded w-2/3"></div>
        </div>
      </div>

      <CommonArticleResults
        v-else
        :posts="current.posts"
        :total="current.total"
        :has-more="current.hasMore"
        :loading="current.loading"
        :failed="current.failed"
        :initial-failed="initialFailed"
        :query="submitted"
        :suggestions="SUGGESTIONS"
        empty-label="活動"
        @load-more="loadMore"
        @suggest="onSuggest"
      />

      <div class="mt-14 pt-10 border-t border-navy/10 text-center">
        <p class="font-serif text-2xl font-black text-navy-700 mb-3">想先試試看再決定？</p>
        <p class="text-ink/70 leading-relaxed mb-6 max-w-xl mx-auto">
          不必等活動，隨時可以預約一次體能評估，由教練依你的身體狀況安排訓練。
        </p>
        <NuxtLink
          to="/booking"
          class="inline-block bg-orange hover:bg-orange-light text-white font-bold px-8 py-3.5 rounded-full transition-colors"
        >
          預約體驗
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
