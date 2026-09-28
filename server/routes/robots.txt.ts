/**
 * robots.txt 依主機名決定內容。
 *
 * 🔴 原本是 public/robots.txt 這個靜態檔，但 dev 與 prod 共用同一份原始碼，
 *    靜態檔沒辦法「只擋 dev」。改成路由之後才能依主機名給不同內容。
 *    （所以 public/robots.txt 必須刪掉，否則靜態檔可能先被回應。）
 *
 * Sitemap 只在正式網域宣告。非正式主機是 Disallow: /，宣告 sitemap 沒有意義，
 * 反而是多給爬蟲一個入口。
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  // 快取時間由 nuxt.config 的 routeRules 統一設定（/robots.txt → 300 秒）。

  if (!isProductionHost(event)) {
    return 'User-agent: *\nDisallow: /\n'
  }
  const { siteUrl } = useRuntimeConfig(event).public as any
  const base = String(siteUrl).replace(/\/+$/, '')
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
})
