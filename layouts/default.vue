<script setup lang="ts">
/**
 * canonical 與 og:url。
 *
 * 🔴 一定要寫在這裡（layout），不能寫進 nuxt.config.ts 的 app.head。
 *    寫在 app.head 是一個寫死的固定值，全站每一頁都會宣告同一個 canonical，
 *    Google 會把 /booking、/locations、/about 全部併成那一頁，這些頁會從搜尋結果消失。
 *
 * 這支 layout 只套用在前台頁面——後台 14 頁都指定了 admin / auth layout，
 * 所以後台不會產生 canonical（本來也不該被索引）。
 *
 * canonical 用 route.path（不含 query）：要收斂的正是同一頁的各種 query 變體，
 * 例如 /booking、/booking?v=nanshan、/booking?utm_source=line&utm_campaign=xxx
 * 目前全部都回 200，對搜尋引擎是三個獨立頁面。
 *
 * ⚠️ 刻意不把路徑轉小寫。/BOOKING 這種大寫路徑確實也會各自成立，
 *    但分店頁的 slug 是後台自行輸入的（今天四間都是小寫，未來不保證），
 *    一旦某個 slug 帶大寫，轉小寫的 canonical 會指到一個 404 的網址，
 *    那比「多一個大寫變體」嚴重得多。只去掉結尾斜線。
 *
 * 🔴 og:url 一定要一起設，而且要用 fullPath（含 query）。
 *    Facebook 在缺 og:url 時會退回讀 canonical——若只有 canonical，
 *    把 /booking?v=nanshan 貼到 FB 會被正規化成 /booking，
 *    點進去變成一般表單，南山的專屬文案與 utm 全部掉光。
 *    有了明確的 og:url，FB 就會保留變體，canonical 照樣替 Google 做收斂。
 */
const route = useRoute()
const { siteUrl } = useRuntimeConfig().public

const canonicalUrl = computed(() => siteUrl + (route.path.replace(/\/+$/, '') || '/'))
const ogUrl = computed(() => siteUrl + route.fullPath)

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  meta: [{ property: 'og:url', content: ogUrl }],
})
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans">
    <LayoutHeader />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutFooter />
    <LayoutMobileBookingButton />
    <LayoutLineFloatButton />
    <LayoutBackToTop />
  </div>
</template>
