<script setup lang="ts">
// 單篇文章。內容即時取自舊站 WordPress，用本站版型呈現。
// 查不到就丟 404，由本站自己的錯誤頁接手 —— 這是 headless 相對於反向代理的關鍵差別。
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data, error } = await useFetch(() => `/api/public/knowledge/${encodeURIComponent(slug.value)}`)

if (error.value || !data.value?.data) {
  throw createError({ statusCode: 404, statusMessage: '找不到這篇文章', fatal: true })
}

const post = computed(() => data.value!.data)
const { formatDate } = useFormatDate()

useHead({
  title: `${post.value.title}｜練健康`,
  meta: [{ name: 'description', content: post.value.description }],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <article class="max-w-3xl mx-auto px-6 lg:px-8 py-10 lg:py-16">
      <NuxtLink
        to="/knowledge"
        class="inline-block text-sm text-ink/55 hover:text-orange transition-colors mb-6"
      >
        ← 回到知識分享
      </NuxtLink>

      <h1 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 leading-tight mb-4">
        {{ post.title }}
      </h1>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/45 mb-8 pb-8 border-b border-navy/10">
        <time>發布於 {{ formatDate(post.date) }}</time>
        <time v-if="post.modified && post.modified !== post.date">
          更新於 {{ formatDate(post.modified) }}
        </time>
      </div>

      <!-- 內容來自 WordPress，已在伺服器端改寫過內部連結 -->
      <div class="article-body" v-html="post.html"></div>

      <div class="mt-14 pt-8 border-t border-navy/10">
        <p class="font-serif text-xl font-black text-navy-700 mb-3">想實際試試看？</p>
        <p class="text-ink/70 leading-relaxed mb-5">
          練健康在台北有四間分店，由專業教練依你的身體狀況安排訓練。
        </p>
        <NuxtLink
          to="/booking"
          class="inline-block bg-orange hover:bg-orange-light text-white font-bold px-7 py-3 rounded-full transition-colors"
        >
          預約體驗
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<style scoped>
/*
 * WordPress 內容的樣式。
 * 依實測 30 篇的結構撰寫：內容是乾淨的語意化 HTML，
 * 標籤集中在 p / strong / em / a / h3 / h4 / li / table，
 * class 只有 wp-block-* 與 Stackable 的 stk-*，沒有 shortcode 殘留。
 */
.article-body {
  color: #2b2b2b;
  line-height: 1.9;
  font-size: 1.0625rem;
}
.article-body :deep(p) {
  margin: 0 0 1.35em;
}
.article-body :deep(h2),
.article-body :deep(h3) {
  font-weight: 900;
  color: #1a3545;
  line-height: 1.4;
  margin: 2.2em 0 0.8em;
}
.article-body :deep(h2) { font-size: 1.5rem; }
.article-body :deep(h3) { font-size: 1.25rem; }
.article-body :deep(h4) {
  font-weight: 900;
  color: #2A5269;
  font-size: 1.0625rem;
  margin: 1.8em 0 0.6em;
}
.article-body :deep(a) {
  color: #d15f00;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.article-body :deep(a:hover) { color: #FB720A; }
.article-body :deep(strong) { font-weight: 900; color: #1a1a1a; }
.article-body :deep(ul),
.article-body :deep(ol) {
  margin: 0 0 1.35em;
  padding-left: 1.5em;
}
.article-body :deep(li) { margin-bottom: 0.5em; }
.article-body :deep(ul) { list-style: disc; }
.article-body :deep(ol) { list-style: decimal; }
.article-body :deep(figure) { margin: 2em 0; }
.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
}
.article-body :deep(figcaption) {
  font-size: 0.875rem;
  color: #6b7b83;
  text-align: center;
  margin-top: 0.6em;
}
.article-body :deep(blockquote) {
  border-left: 3px solid #FB720A;
  padding-left: 1.1em;
  margin: 1.8em 0;
  color: #4a5a62;
}

/*
 * 表格：實測 30 篇有 18 篇用到，是最需要處理的一項。
 * 用 display:block + overflow-x 讓寬表格在自己的容器內橫向捲動，
 * 頁面本體永遠不會橫向捲。
 */
.article-body :deep(table) {
  display: block;
  overflow-x: auto;
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  margin: 1.8em 0;
  font-size: 0.9375rem;
  background: #fff;
  border-radius: 0.5rem;
}
.article-body :deep(th),
.article-body :deep(td) {
  border: 1px solid #e3dccf;
  padding: 0.6em 0.9em;
  text-align: left;
  vertical-align: top;
}
.article-body :deep(th) {
  background: #F5EFE4;
  font-weight: 900;
  color: #1a3545;
  white-space: nowrap;
}

/* Stackable 的重點標示與按鈕（實測 30 篇有 42 處 highlight、54 處按鈕） */
.article-body :deep(.stk-highlight) {
  background: linear-gradient(transparent 62%, #ffd9a8 62%);
  padding: 0 0.15em;
  font-weight: 700;
}
.article-body :deep(.stk-button),
.article-body :deep(.wp-block-stackable-icon-button a) {
  display: inline-block;
  background: #2A5269;
  color: #fff !important;
  padding: 0.55em 1.3em;
  border-radius: 999px;
  text-decoration: none !important;
  font-weight: 700;
  margin: 0.3em 0.3em 0.3em 0;
}
.article-body :deep(.stk-button:hover),
.article-body :deep(.wp-block-stackable-icon-button a:hover) {
  background: #1a3545;
}
.article-body :deep(.stk--svg-wrapper svg) {
  width: 1.1em;
  height: 1.1em;
  vertical-align: -0.15em;
}
</style>
