<script setup lang="ts">
// 知識分享列表。
// 文章實體仍在舊站 l-kk.tw 的 WordPress，這一頁只是即時讀取後用本站版型呈現；
// 讀者的網址列全程都是本站網域。
const route = useRoute()
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data, pending, error } = await useFetch('/api/public/knowledge', {
  query: { page },
})

const posts = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 0)
const total = computed(() => data.value?.total ?? 0)

const { formatDate } = useFormatDate()

useHead({
  title: '知識分享｜練健康 LKK Wellness Center',
  meta: [
    {
      name: 'description',
      content: '中高齡肌力訓練、醫療衛教與運動科學的知識文章，由練健康教練團隊整理撰寫。',
    },
  ],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <section class="bg-navy text-cream-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
        <h1 class="font-serif text-4xl lg:text-5xl font-black leading-tight mb-4">
          知識分享
        </h1>
        <p class="text-cream-100/80 max-w-2xl leading-relaxed">
          中高齡肌力訓練、醫療衛教與運動科學。由練健康的教練團隊整理撰寫，持續更新。
        </p>
        <p v-if="total" class="mt-5 text-sm text-cream-100/60">
          共 {{ total }} 篇
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <!-- 讀取中 -->
      <div v-if="pending" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="n in 6"
          :key="n"
          class="bg-white rounded-2xl p-6 animate-pulse"
        >
          <div class="h-4 bg-cream-dark rounded w-1/3 mb-4"></div>
          <div class="h-5 bg-cream-dark rounded w-full mb-2"></div>
          <div class="h-5 bg-cream-dark rounded w-4/5 mb-4"></div>
          <div class="h-3 bg-cream-dark rounded w-full mb-2"></div>
          <div class="h-3 bg-cream-dark rounded w-2/3"></div>
        </div>
      </div>

      <!-- 讀取失敗：說清楚是哪一段出問題，不要只說「載入失敗」 -->
      <div
        v-else-if="error"
        class="bg-white rounded-2xl p-8 text-center border border-orange/30"
      >
        <p class="font-serif text-xl font-black text-navy mb-2">文章暫時讀取不到</p>
        <p class="text-ink/70 text-sm leading-relaxed">
          文章由舊站的內容系統提供，目前連線沒有回應。請稍後再試。
        </p>
      </div>

      <!-- 列表 -->
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="post in posts"
          :key="post.slug"
          :to="`/knowledge/${post.slug}/`"
          class="group bg-white rounded-2xl p-6 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <time class="text-xs text-ink/45 mb-3">{{ formatDate(post.date) }}</time>
          <h2
            class="font-serif text-lg font-black text-navy-700 leading-snug mb-3 group-hover:text-orange transition-colors"
          >
            {{ post.title }}
          </h2>
          <p class="text-sm text-ink/65 leading-relaxed flex-1">
            {{ post.excerpt }}
          </p>
          <span class="mt-4 text-sm font-bold text-orange">閱讀全文 →</span>
        </NuxtLink>
      </div>

      <!-- 分頁 -->
      <div v-if="totalPages > 1" class="mt-12 flex items-center justify-center gap-3">
        <NuxtLink
          v-if="page > 1"
          :to="{ query: { page: page - 1 } }"
          class="px-5 py-2.5 rounded-full bg-white text-navy font-bold text-sm hover:bg-navy hover:text-cream-50 transition-colors"
        >
          ← 上一頁
        </NuxtLink>
        <span class="text-sm text-ink/60 tabular-nums px-2">
          第 {{ page }} / {{ totalPages }} 頁
        </span>
        <NuxtLink
          v-if="page < totalPages"
          :to="{ query: { page: page + 1 } }"
          class="px-5 py-2.5 rounded-full bg-white text-navy font-bold text-sm hover:bg-navy hover:text-cream-50 transition-colors"
        >
          下一頁 →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
