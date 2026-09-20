<script setup lang="ts">
// 學員故事。文案沿用舊站 l-kk.tw/cases-center/，改用本站版型呈現。
// ⚠️ 文章本體仍在舊站，卡片連結會離開本站 —— 這是目前刻意的取捨。
const { data, pending } = await useFetch('/api/public/wp-articles', {
  query: { group: 'cases' },
})

const posts = computed(() => data.value?.groups?.[0]?.posts ?? [])
const failed = computed(() => data.value?.ok === false)

const { formatDate } = useFormatDate()

useHead({
  title: '學員故事｜練健康 LKK Wellness Center',
  meta: [
    {
      name: 'description',
      content:
        '超過千位中高齡與特殊族群學員，在專業教練團隊的評估與陪伴下，透過量身定做的訓練課程，找回對身體的信心。',
    },
  ],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <section class="bg-navy text-cream-50">
      <div class="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-24 text-center">
        <p class="text-orange font-bold tracking-wider text-sm mb-4">
          Real Transformation ・學員故事
        </p>
        <h1 class="font-serif text-3xl lg:text-5xl font-black leading-tight mb-6">
          不是口號，<br class="sm:hidden" >是練出來的真實改變
        </h1>
        <p class="text-cream-100/80 leading-relaxed max-w-2xl mx-auto">
          超過千位中高齡與特殊族群學員，在專業教練團隊的評估與陪伴下，透過量身定做的訓練課程，找回對身體的信心。
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="bg-white rounded-2xl p-6 animate-pulse">
          <div class="h-5 bg-cream-dark rounded w-4/5 mb-3"></div>
          <div class="h-3 bg-cream-dark rounded w-full mb-2"></div>
          <div class="h-3 bg-cream-dark rounded w-2/3"></div>
        </div>
      </div>

      <div
        v-else-if="failed"
        class="bg-white rounded-2xl p-8 text-center border border-orange/30"
      >
        <p class="font-serif text-xl font-black text-navy mb-2">案例清單暫時讀取不到</p>
        <p class="text-ink/70 text-sm leading-relaxed">
          內容由知識庫系統提供，目前連線沒有回應。
          你可以
          <a
            href="https://l-kk.tw/cases-center/"
            class="text-orange font-bold underline"
            rel="noopener"
          >直接前往學員故事</a>
          瀏覽。
        </p>
      </div>

      <div v-else class="grid gap-6 md:grid-cols-2">
        <CommonArticleCard
          v-for="post in posts"
          :key="post.slug"
          :post="post"
        />
      </div>

      <div class="mt-12 text-center">
        <a
          href="https://l-kk.tw/cases-center/"
          rel="noopener"
          class="inline-block text-sm text-ink/55 hover:text-orange transition-colors"
        >
          瀏覽更多案例 →
        </a>
      </div>

      <div class="mt-14 pt-10 border-t border-navy/10 text-center">
        <p class="font-serif text-2xl font-black text-navy-700 mb-3">你的改變也可以從這裡開始</p>
        <p class="text-ink/70 leading-relaxed mb-6 max-w-xl mx-auto">
          先做一次體能評估，由教練依你的身體狀況安排訓練。台北四間分店都可預約。
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
