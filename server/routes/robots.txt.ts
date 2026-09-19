/**
 * robots.txt 依主機名決定內容。
 *
 * 🔴 原本是 public/robots.txt 這個靜態檔，但 dev 與 prod 共用同一份原始碼，
 *    靜態檔沒辦法「只擋 dev」。改成路由之後才能依主機名給不同內容。
 *    （所以 public/robots.txt 必須刪掉，否則靜態檔可能先被回應。）
 *
 * 目前沒有 sitemap.xml，所以不寫 Sitemap 指向——指向一個 404 比不寫更糟。
 * 之後做了 sitemap 記得回來補這一行。
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  // 快取時間由 nuxt.config 的 routeRules 統一設定（/robots.txt → 300 秒）。

  if (!isProductionHost(event)) {
    return 'User-agent: *\nDisallow: /\n'
  }
  return 'User-agent: *\nAllow: /\n'
})
