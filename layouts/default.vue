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
 * 大小寫：vue-router 的路由比對是不分大小寫的，所以 /BOOKING、/Booking 都會
 * 開出同一頁、各自回 200。canonical 因此也要收斂它們。
 *
 * ⚠️ 但**不能**直接把網址轉小寫——分店頁的 slug 是後台自行輸入的欄位
 *    （今天四間都是小寫，未來不保證），一旦某個 slug 帶大寫，
 *    轉小寫會讓 canonical 指向一個 404 的網址，比多一個大寫變體嚴重得多。
 *
 * 正確做法是用「路由名稱 + params」重建路徑：路由定義來自檔案系統，
 * 永遠是小寫；params 則原樣保留。實測結果：
 *    /BOOKING          → /booking            靜態路徑小寫化
 *    /LOCATIONS/nanjing → /locations/nanjing  靜態段小寫、參數不動
 *    /locations/NanJing → /locations/NanJing  參數原樣保留，不會指到 404
 *
 * 再去掉結尾斜線。
 *
 * ⚠️ 這只是寫給搜尋引擎的宣告，不是轉址——/BOOKING 對訪客照樣正常開啟。
 *    刻意不做大小寫 301：後台網址帶大小寫混合的 Firestore ID
 *    （實測 SnGT0pIY7otkM5SuiCci），全站小寫化會讓後台編輯／刪除安靜失效。
 *
 * 🔴 og:url 一定要一起設，而且要用 fullPath（含 query）。
 *    Facebook 在缺 og:url 時會退回讀 canonical——若只有 canonical，
 *    把 /booking?v=nanshan 貼到 FB 會被正規化成 /booking，
 *    點進去變成一般表單，南山的專屬文案與 utm 全部掉光。
 *    有了明確的 og:url，FB 就會保留變體，canonical 照樣替 Google 做收斂。
 */
const route = useRoute()
const router = useRouter()
const { siteUrl } = useRuntimeConfig().public

// 用路由定義重建路徑，讓 /BOOKING 這類大寫變體也收斂到 /booking。
// 找不到路由名稱時（例如 404 頁）退回原始路徑，不要讓整個 head 壞掉。
const canonicalPath = computed(() => {
  if (!route.name) return route.path
  try {
    return router.resolve({ name: route.name, params: route.params }).path
  } catch {
    return route.path
  }
})

const canonicalUrl = computed(() => siteUrl + (canonicalPath.value.replace(/\/+$/, '') || '/'))
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
