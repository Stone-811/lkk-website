// 正式站的預設 hosted.app 網址 → 301 永久轉到品牌網域 lkkwellness.com。
// 目的：讓對外只使用 lkkwellness.com、並避免搜尋引擎重複收錄同一站兩個網址。
//
// 安全：只比對「正式站 lkkprod 的 hosted.app 主機名」才轉——
//   - lkkwellness.com 本身不符合條件 → 放行（不會無窮轉址）
//   - dev（lkk-website-dev--lkkdev…）主機名不同 → 完全不受影響
const PROD_DEFAULT_HOST = 'lkk-website--lkkprod.asia-east1.hosted.app'
const CANONICAL_ORIGIN = 'https://lkkwellness.com'

export default defineEventHandler((event) => {
  // App Hosting 前面的 Envoy CDN 可能改寫 Host，原始網域可能落在 x-forwarded-host
  const host = (getRequestHeader(event, 'host') || '').toLowerCase()
  const xfHost = (getRequestHeader(event, 'x-forwarded-host') || '').toLowerCase()
  if (host === PROD_DEFAULT_HOST || xfHost === PROD_DEFAULT_HOST) {
    // event.path 已含 pathname + query string
    return sendRedirect(event, `${CANONICAL_ORIGIN}${event.path}`, 301)
  }
})
