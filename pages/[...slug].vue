<script setup lang="ts">
// 文章頁。內容即時取自舊站 WordPress，用本站版型呈現。
//
// 路由是根目錄的萬用捕捉：Nuxt 的靜態路由永遠優先，所以 /booking、/about
// 這些本站頁面不會進來，只有沒人認領的網址才落到這裡。
// 查不到就丟 404，由本站自己的錯誤頁接手 —— 這是 headless 相對於反向代理
// 的關鍵差別：代理會把所有未匹配路徑無條件丟給 WordPress，等於交出 404 的控制權。
const route = useRoute()
const slug = computed(() => {
  const p = route.params.slug
  // 🔴 空片段一定要濾掉。萬用捕捉路由遇到結尾斜線時會多給一個空字串
  //    （/spine/ → ['spine', '']），直接 join 會得到 'spine/'，
  //    被下面的多層路徑判斷誤殺成 404。
  //    而舊站的文章網址全部帶結尾斜線，卡片連結也是，等於整批進不去。
  const parts = (Array.isArray(p) ? p : [p]).filter((x) => x !== '' && x != null)
  return parts.map(String).join('/')
})

// 多層路徑不是文章（本站沒有這種網址），直接 404，不要浪費一次上游查詢
if (slug.value.includes('/') || !slug.value) {
  throw createError({ statusCode: 404, statusMessage: '找不到頁面', fatal: true })
}

const { data, error } = await useFetch(
  () => `/api/public/article/${encodeURIComponent(slug.value)}`
)

if (error.value || !data.value?.data) {
  // ⚠️ 上游失敗時 API 回的是 503 而不是 404，這裡照實反映，
  //    不要把暫時性故障說成「頁面不存在」——那會讓 Google 把文章移出索引。
  const status = (error.value as any)?.statusCode === 503 ? 503 : 404
  throw createError({
    statusCode: status,
    statusMessage: status === 503 ? '文章暫時讀取不到' : '找不到這篇文章',
    fatal: true,
  })
}

const post = computed(() => data.value!.data)
const { formatDate } = useFormatDate()
/**
 * 🔴 文章的 canonical 指向「文章正本所在的網域」，切轉前是舊站 l-kk.tw。
 *
 * 文章由本站渲染、網址列也只看得到本站，但內容仍存放在舊站 WordPress，
 * 而舊站目前仍在線上且被 Google 收錄（2026-09-20 實測：index, follow
 * ＋ 自我 canonical ＋ 已提交 sitemap）。canonical 若指向自己，等於兩個
 * 正式網域搶同一批內容的正本，而排名全在舊站那邊。
 *
 * 由 NUXT_PUBLIC_ARTICLE_CANONICAL_ORIGIN 控制，預設是舊站（見 nuxt.config.ts
 * 那段說明：少設環境變數的後果必須落在安全的一邊）。切轉當天改成本站網域。
 *
 * ⚠️ og:url 一起改，不要只改 canonical。layout 會用 siteUrl 設一個 og:url，
 *    這裡覆蓋掉——否則 Facebook／LINE 會把分享歸戶到本站，
 *    跟 canonical 宣告的正本不一致，等於自己給出兩個互相矛盾的答案。
 */
const { siteUrl, articleCanonicalOrigin } = useRuntimeConfig().public
const canonicalOrigin = computed(() => articleCanonicalOrigin || siteUrl)

/**
 * ⚠️ 用 post.slug（WordPress 回的），不要用路由參數的 slug。
 *    vue-router 會把網址參數解碼，中文文章拿到的是「帕金森氏症運動處方」，
 *    而舊站自己宣告的 canonical 是百分號編碼的小寫形式
 *    （%e5%b8%95%e9%87%91…）。兩種形式雖然都解得開、規範上也等價，
 *    但既然目標頁面自己就宣告了一種寫法，就用一模一樣的那一種，
 *    不要留下「應該等價」的空間。2026-09-20 比對過兩邊字串確認一致。
 */
const canonical = computed(() => `${canonicalOrigin.value}/${post.value.slug}/`)

useHead({
  title: `${post.value.title}｜練健康`,
  link: [{ rel: 'canonical', href: canonical }],
  meta: [
    { name: 'description', content: post.value.description },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: post.value.title },
    { property: 'og:description', content: post.value.description },
    { property: 'og:url', content: canonical },
    { property: 'article:published_time', content: post.value.date },
    { property: 'article:modified_time', content: post.value.modified },
  ],
})

// 結構化資料：讓搜尋結果能顯示文章的發布與更新時間
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.value.title,
        description: post.value.description,
        datePublished: post.value.date,
        dateModified: post.value.modified,
        mainEntityOfPage: canonical.value,
        publisher: { '@type': 'Organization', name: '練健康 LKK Wellness Center' },
      }),
    },
  ],
})
</script>

<template>
  <div class="bg-cream min-h-screen">
    <article class="max-w-3xl mx-auto px-6 lg:px-8 py-10 lg:py-16">
      <NuxtLink
        to="/knowledge-center"
        class="inline-block text-sm text-ink/55 hover:text-orange transition-colors mb-6"
      >
        ← 回到知識科普
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
 * 內嵌影片與外部嵌入（iframe）。實測 667 篇有 143 篇含可見嵌入、共 236 個 iframe。
 *
 * 🔴 WordPress 把原始尺寸寫死在 iframe 的 width/height 屬性上，
 *    其中 159 個是 width="1290"，遠寬於內容欄。不處理的話整頁會被撐寬——
 *    2026-09-19 實測 1024px 視窗量到 docW=1450，頁面可以左右捲。
 *    這跟表格是同一類問題（元素自己比容器寬），但當初只想到表格，
 *    iframe 漏掉了，全量驗證腳本也沒查這一層。
 *
 * 分兩段處理，依實測的尺寸分布：
 *   151 個  figure.wp-embed-aspect-16-9  1290×726  → 高度跟著寬度走
 *     2 個  figure.is-type-video（沒有 16-9 class）→ 同上
 *    83 個  其他嵌入（600×338 的外站預覽卡為主，另有 1290×968、1290×1000）
 *           → 只收寬度、保留原本高度。硬套 16:9 會把那兩個高版面的壓扁。
 *
 * ⚠️ 有些文章「整篇就是一支影片」（實測 4 篇，去標籤後文字長度是 0），
 *    媒體報導那一類尤其多。影片沒渲染出來 = 整頁空白，不是小問題。
 */
.article-body :deep(.wp-block-embed) {
  margin: 1.8em 0;
}
.article-body :deep(.wp-block-embed__wrapper) {
  max-width: 100%;
}
.article-body :deep(iframe) {
  width: 100%;
  max-width: 100%;
  border: 0;
  display: block;
}
.article-body :deep(.wp-embed-aspect-16-9 iframe),
.article-body :deep(.is-type-video iframe) {
  height: auto;
  aspect-ratio: 16 / 9;
}

/*
 * 表格。實測 200 篇有 117 個，是文章裡最需要處理的元素。
 *
 * 四個實測事實決定了下面的寫法：
 *   117/117 都有 has-fixed-layout —— 但 WordPress 的 CSS 沒載入，
 *           這個 class 在本站毫無作用，欄寬要自己指定
 *   只有 114/117 被 <figure> 包著 —— 所以捲動容器由伺服器端自己補（wrapTables）
 *   只有 82/117 有真正的 <th> —— 其餘 35 個用 <td><strong> 假裝標頭
 *   欄數 2 到 13 —— 寬表一定要能橫捲
 */
.article-body :deep(.table-scroll) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.8em 0;
}
.article-body :deep(figure.wp-block-table) {
  margin: 0;
}
.article-body :deep(table) {
  /* 🔴 絕對不要寫 width: max-content —— 那會讓表格本身長到內容寬度，
     overflow-x 永遠不觸發，表格直接把整頁撐寬（375px 視窗量到 792px）。 */
  width: 100%;
  /* 窄螢幕時讓容器橫捲，而不是把每欄擠成一行一兩個字 */
  min-width: 30rem;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.9375rem;
  background: #fff;
  border-radius: 0.5rem;
  overflow: hidden;
}
.article-body :deep(th),
.article-body :deep(td) {
  border: 1px solid #e3dccf;
  padding: 0.6em 0.9em;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
/* 標頭：真正的 <th>，以及那 35 個用 <td><strong> 假裝標頭的第一列 */
.article-body :deep(th),
.article-body :deep(table tr:first-child td:has(> strong:only-child)) {
  background: #F5EFE4;
  font-weight: 900;
  color: #1a3545;
}
.article-body :deep(table tr:first-child td:has(> strong:only-child) strong) {
  font-weight: 900;
}

/*
 * 文章內嵌（延伸閱讀）。WordPress 產生的是 blockquote.wp-embedded-content，
 * 原本要由 wp-embed.js 換成卡片，本站沒載入那支腳本，所以直接把它做成卡片。
 * 不套一般引言的樣式 —— 那會讓「延伸閱讀」看起來像引述別人的話。
 */
.article-body :deep(blockquote.wp-embedded-content) {
  border: 1px solid #e3dccf;
  border-left: 4px solid #FB720A;
  background: #fff;
  border-radius: 0.5rem;
  padding: 1em 1.2em;
  margin: 1.8em 0;
  color: inherit;
}
.article-body :deep(blockquote.wp-embedded-content)::before {
  content: '延伸閱讀';
  display: block;
  font-size: 0.75rem;
  font-weight: 900;
  color: #FB720A;
  letter-spacing: 0.08em;
  margin-bottom: 0.35em;
}
.article-body :deep(blockquote.wp-embedded-content a) {
  font-weight: 700;
  text-decoration: none;
  color: #1a3545;
}
.article-body :deep(blockquote.wp-embedded-content a:hover) {
  color: #FB720A;
  text-decoration: underline;
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
