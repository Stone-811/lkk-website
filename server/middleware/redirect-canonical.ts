// 正式站的預設 hosted.app 網址 → 301 永久轉到品牌網域 lkkwellness.com。
// 目的：讓對外只使用 lkkwellness.com、並避免搜尋引擎重複收錄同一站兩個網址。
//
// 安全：只比對「正式站 lkkprod 的 hosted.app 主機名」才轉——
//   - lkkwellness.com 本身不符合條件 → 放行（不會無窮轉址）
//   - dev（lkk-website-dev--lkkdev…）主機名不同 → 完全不受影響
//
// ⚠️ 這裡是「host 或 x-forwarded-host 任一命中就轉」，跟 site-hosts.ts 的
//    getRequestHostname（xfh 優先、只取一個）刻意不同 —— 這支在 prod 上
//    已經正常運作，2026-09-19 補 noindex 時不順手改它的判斷方式。
//    主機名常數共用同一份，行為維持原樣。
export default defineEventHandler((event) => {
  const host = (getRequestHeader(event, 'host') || '').toLowerCase()
  const xfHost = (getRequestHeader(event, 'x-forwarded-host') || '').toLowerCase()
  if (host === PROD_DEFAULT_HOST || xfHost === PROD_DEFAULT_HOST) {
    // event.path 已含 pathname + query string
    return sendRedirect(event, `${CANONICAL_ORIGIN}${event.path}`, 301)
  }
})
