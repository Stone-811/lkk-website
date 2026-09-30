<script setup lang="ts">
// 新聞報導。文章本體仍存放在舊站 WordPress（分類「新聞報導」，共 36 篇），
// 由本站以根目錄網址渲染，卡片是站內連結。
//
// 與 /news「媒體報導」的分工：
//   /news         編輯挑選的精選版面（大圖、國際／台灣分區），資料寫死在頁面裡。
//                 其中 AFP 法新社與 CNA Insider 只有站外連結（臉書影片、YouTube），
//                 WordPress 沒有對應文章，所以那一頁不能被這一頁取代。
//   /news-center  這一頁，完整的文章彙整，可搜尋、可載入更多。
//
// 🔴 建這一頁之前，WordPress 的 36 篇新聞報導有 12 篇在新站沒有任何入口
//    （網址直接打得開，但站上沒有任何頁面連到）。2026-09-30 實測追出來的。
const { data, pending } = await useFetch('/api/public/wp-articles', {
  query: { group: 'news' },
})

const {
  input, submitted, searching, canSubmit,
  current, showInitialError,
  submit, clear, loadMore,
} = useArticleBrowser(data)

// 挑的是實際搜得到的詞（2026-09-30 實測，括號內為在此分類的命中篇數）
// 硬舉 18、教練 17、重訓 14、阿嬤 12、銀髮 11
const SUGGESTIONS = ['硬舉', '重訓', '阿嬤', '銀髮', '肌少症']

function onSuggest(keyword: string) {
  input.value = keyword
  submit()
}

useHead({
  title: '新聞報導｜練健康 LKK Wellness Center',
  meta: [
    {
      name: 'description',
      content:
        '練健康歷年媒體報導的完整紀錄。從國際通訊社到台灣電視、雜誌與 Podcast，看中高齡肌力訓練如何被看見。',
    },
  ],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <section class="bg-navy text-cream-50">
      <div class="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-24 text-center">
        <p class="text-orange font-bold tracking-wider text-sm mb-4">
          Press Archive ・新聞報導
        </p>
        <h1 class="font-serif text-3xl lg:text-5xl font-black leading-tight mb-6">
          每一次被看見，<br class="sm:hidden" >都是一次信任累積
        </h1>
        <p class="text-cream-100/80 leading-relaxed max-w-2xl mx-auto">
          從國際通訊社到台灣的電視、雜誌與 Podcast，這裡是歷年媒體報導的完整紀錄。
          可依關鍵字搜尋媒體名稱或標題。
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <CommonArticleSearch
        v-model="input"
        :can-submit="canSubmit"
        :loading="current.loading"
        :active="searching"
        placeholder="輸入關鍵字，例如：硬舉、重訓、阿嬤"
        label="搜尋新聞報導"
        @submit="submit"
        @clear="clear"
      />

      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="bg-white rounded-2xl p-6 animate-pulse">
          <div class="h-5 bg-cream-200 rounded w-4/5 mb-3"></div>
          <div class="h-3 bg-cream-200 rounded w-full mb-2"></div>
          <div class="h-3 bg-cream-200 rounded w-2/3"></div>
        </div>
      </div>

      <CommonArticleResults
        v-else
        :posts="current.posts"
        :total="current.total"
        :has-more="current.hasMore"
        :loading="current.loading"
        :failed="current.failed"
        :show-initial-error="showInitialError"
        :query="submitted"
        :suggestions="SUGGESTIONS"
        empty-label="報導"
        unit="則"
        @load-more="loadMore"
        @suggest="onSuggest"
      />

      <div class="mt-14 pt-10 border-t border-navy/10 text-center">
        <p class="font-serif text-2xl font-black text-navy-700 mb-3">歡迎媒體採訪與合作</p>
        <p class="text-ink/70 leading-relaxed mb-6 max-w-xl mx-auto">
          針對高齡肌力訓練、健康老化與跨世代運動等議題，我們樂於分享第一線經驗與真實故事。
        </p>
        <NuxtLink
          to="/cooperation"
          class="inline-block bg-orange hover:bg-orange-light text-white font-bold px-8 py-3.5 rounded-full transition-colors"
        >
          媒體採訪洽詢
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
