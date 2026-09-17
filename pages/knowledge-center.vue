<script setup lang="ts">
// 知識科普。文案與分區沿用舊站 l-kk.tw/knowledge-center/，改用本站版型呈現。
// ⚠️ 文章本體仍在舊站，卡片連結會離開本站 —— 這是目前刻意的取捨。
const { data, pending } = await useFetch('/api/public/wp-articles', {
  query: { group: 'knowledge' },
})

const groups = computed(() => data.value?.groups ?? [])
const failed = computed(() => data.value?.ok === false)
const active = ref('sports')
const current = computed(
  () => groups.value.find((g: any) => g.key === active.value) ?? groups.value[0]
)

const { formatDate } = useFormatDate()

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
      <!-- 分區切換 -->
      <div class="flex flex-wrap justify-center gap-2 mb-10">
        <button
          v-for="g in groups"
          :key="g.key"
          type="button"
          :class="[
            'px-5 py-2.5 rounded-full text-sm font-bold transition-colors',
            g.key === active
              ? 'bg-navy text-cream-50'
              : 'bg-white text-navy hover:bg-cream-dark',
          ]"
          @click="active = g.key"
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

      <!-- 上游取不到時，頁面仍完整顯示，只換掉清單區塊 -->
      <div
        v-else-if="failed"
        class="bg-white rounded-2xl p-8 text-center border border-orange/30"
      >
        <p class="font-serif text-xl font-black text-navy mb-2">文章清單暫時讀取不到</p>
        <p class="text-ink/70 text-sm leading-relaxed">
          文章由知識庫系統提供，目前連線沒有回應。
          你可以
          <a
            href="https://l-kk.tw/knowledge-center/"
            class="text-orange font-bold underline"
            rel="noopener"
          >直接前往知識科普</a>
          瀏覽。
        </p>
      </div>

      <div v-else class="grid gap-6 md:grid-cols-2">
        <CommonArticleCard
          v-for="post in current?.posts"
          :key="post.slug"
          :post="post"
        />
      </div>

      <div class="mt-12 text-center">
        <a
          href="https://l-kk.tw/knowledge-center/"
          rel="noopener"
          class="inline-block text-sm text-ink/55 hover:text-orange transition-colors"
        >
          瀏覽更多文章 →
        </a>
      </div>
    </section>
  </div>
</template>
