<script setup lang="ts">
/**
 * 文章卡片。
 *
 * 🔴 這裡刻意用 v-if / v-else 明確寫出兩種標籤，不要用 <component :is>。
 *    先前寫成 :is="post.external ? 'a' : resolveComponent('NuxtLink')"，
 *    模板裡的 resolveComponent 沒有解析成功，Vue 把它當自訂元素原樣輸出，
 *    渲染結果是 <NUXTLINK> 這個不存在的標籤 —— 沒有 href，整批卡片點不動，
 *    而且畫面看起來完全正常（2026-09-17 業主回報才發現）。
 *
 * external 為真的情況：文章代稱與本站路由同名（實測 666 篇只有 franchise），
 * 本站取不到那篇，只能連回舊站。
 */
defineProps<{
  post: {
    slug: string
    title: string
    excerpt: string
    date: string
    href: string
    external?: boolean
  }
}>()

const { formatDate } = useFormatDate()

const CARD_CLASS =
  'group bg-white rounded-2xl p-6 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all'
</script>

<template>
  <a v-if="post.external" :href="post.href" rel="noopener" :class="CARD_CLASS">
    <h2
      class="font-serif text-lg font-black text-orange leading-snug mb-3 group-hover:text-orange-light transition-colors"
    >
      {{ post.title }}
    </h2>
    <p class="text-sm text-ink/65 leading-relaxed flex-1">{{ post.excerpt }}</p>
    <div class="mt-4 flex items-center justify-between">
      <span class="text-sm font-bold text-orange">閱讀全文 →</span>
      <time class="text-xs text-ink/40">{{ formatDate(post.date) }}</time>
    </div>
  </a>

  <NuxtLink v-else :to="post.href" :class="CARD_CLASS">
    <h2
      class="font-serif text-lg font-black text-orange leading-snug mb-3 group-hover:text-orange-light transition-colors"
    >
      {{ post.title }}
    </h2>
    <p class="text-sm text-ink/65 leading-relaxed flex-1">{{ post.excerpt }}</p>
    <div class="mt-4 flex items-center justify-between">
      <span class="text-sm font-bold text-orange">閱讀全文 →</span>
      <time class="text-xs text-ink/40">{{ formatDate(post.date) }}</time>
    </div>
  </NuxtLink>
</template>
