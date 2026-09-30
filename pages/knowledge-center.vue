<script setup lang="ts">
// 知識科普。文案與分區沿用舊站 l-kk.tw/knowledge-center/，改用本站版型呈現。
// 文章本體仍存放在舊站 WordPress，但由本站以根目錄網址渲染，卡片是站內連結。
// ⚠️ 2026-09-30 移除了連往 l-kk.tw/knowledge-center/ 的「瀏覽更多」與讀取失敗退路 ——
//    那個頁面在舊站已被丟進垃圾桶，實測最終回 404。
//
// 首屏維持原本的行為：一次拿回四個分區的第一頁，前端切換不再發請求。
// 搜尋與「載入更多」才會發新請求，而且只打「目前這個分區」——
// 四個分區同時搜會變成 4 個並發，舊站的併發表現不穩定，不值得為此冒險。
const { data, pending } = await useFetch('/api/public/wp-articles', {
  query: { group: 'knowledge' },
})

const {
  tabs, active, setActive,
  input, submitted, searching, canSubmit,
  current, initialFailed,
  submit, clear, loadMore,
} = useArticleBrowser(data)

const activeLabel = computed(
  () => tabs.value.find((t) => t.key === active.value)?.label ?? ''
)

// 空結果時提供的範例關鍵字。挑的是實際搜得到的詞（2026-09-30 實測）
const SUGGESTIONS = ['肌少症', '深蹲', '膝蓋', '骨質疏鬆', '蛋白質']

function onSuggest(keyword: string) {
  input.value = keyword
  submit()
}

useHead({
  title: '知識科普｜練健康 LKK Wellness Center',
  meta: [
    {
      name: 'description',
      content:
        '結合運動科學與醫療專業，把正確的訓練知識轉譯成你我都能理解、能實踐的漸進式指南，陪你安全邁向健康自主的生活。',
    },
  ],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <section class="bg-navy text-cream-50">
      <div class="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-24 text-center">
        <p class="text-orange font-bold tracking-wider text-sm mb-4">
          Knowledge Encyclopedia ・知識科普
        </p>
        <h1 class="font-serif text-3xl lg:text-5xl font-black leading-tight mb-6">
          讓知識，<br class="sm:hidden" >成為安全訓練的起點
        </h1>
        <p class="text-cream-100/80 leading-relaxed max-w-2xl mx-auto">
          結合運動科學與醫療專業，把正確的訓練知識轉譯成你我都能理解、能實踐的漸進式指南，陪你安全邁向健康自主的生活。
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <CommonArticleSearch
        v-model="input"
        :can-submit="canSubmit"
        :loading="current.loading"
        :active="searching"
        @submit="submit"
        @clear="clear"
      />

      <!-- 分區切換。搜尋狀態下切分區＝在新分區裡重搜同一個關鍵字 -->
      <div class="flex flex-wrap justify-center gap-2 mb-10">
        <button
          v-for="g in tabs"
          :key="g.key"
          type="button"
          :class="[
            'px-5 py-2.5 rounded-full text-sm font-bold transition-colors',
            g.key === active
              ? 'bg-navy text-cream-50'
              : 'bg-white text-navy hover:bg-cream-dark',
          ]"
          @click="setActive(g.key)"
        >
          {{ g.label }}
        </button>
      </div>

      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <div v-for="n in 6" :key="n" class="bg-white rounded-2xl p-6 animate-pulse">
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
        :scope-label="activeLabel"
        :suggestions="SUGGESTIONS"
        @load-more="loadMore"
        @suggest="onSuggest"
      />
    </section>
  </div>
</template>
