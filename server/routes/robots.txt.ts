/**
 * robots.txt 依主機名決定內容。
 *
 * 🔴 原本是 public/robots.txt 這個靜態檔，但 dev 與 prod 共用同一份原始碼，
 *    靜態檔沒辦法「只擋 dev」。改成路由之後才能依主機名給不同內容。
 *    （所以 public/robots.txt 必須刪掉，否則靜態檔可能先被回應。）
 *
 * Sitemap 只在正式網域宣告，非正式主機不給爬蟲多一個入口。
 *
 * 🔴 非正式主機刻意「允許爬」，不要改回 Disallow: /。擋住不收錄靠的是每一頁的
 *    X-Robots-Tag: noindex（server/middleware/noindex-nonproduction.ts），
 *    而 Google 被 robots.txt 擋住就讀不到那個標頭，已經收錄的頁面永遠不會被移除。
 *    2026-09-19 兩道一起加，結果 dev 站 9/19 以前被收錄的頁面到 10-28 還搜得到，
 *    10-28 改成允許爬、只靠 noindex（Google 官方文件也是這樣要求）。
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  // 快取時間由 nuxt.config 的 routeRules 統一設定（/robots.txt → 300 秒）。

  if (!isProductionHost(event)) {
    return 'User-agent: *\nAllow: /\n'
  }
  const { siteUrl } = useRuntimeConfig(event).public as any
  const base = String(siteUrl).replace(/\/+$/, '')
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
})
