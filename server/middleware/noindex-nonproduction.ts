/**
 * 非正式主機一律回 X-Robots-Tag: noindex。
 *
 * 🔴 為什麼需要：文章改由本站以根目錄網址渲染之後，dev 站從 20 幾頁變成 667 頁，
 *    而且每一頁的內容都跟 l-kk.tw 上的那一篇一模一樣。dev 的 robots.txt 原本是
 *    「全部允許」，等於把 667 頁重複內容開放給 Google 收錄，跟舊站互相稀釋。
 *    2026-09-19 實測：dev 沒有任何 noindex，canonical 還指向 dev 自己的網址。
 *
 * ⚠️ 判斷方式是「白名單正式主機，其餘一律 noindex」——名單見 server/utils/site-hosts.ts。
 *    反過來寫成黑名單的話，日後多一個預覽網址就會漏掉。
 *
 * ⚠️ 正式站的 hosted.app 網址交給 redirect-canonical 轉址，這裡跳過不加標頭：
 *    在 301 回應上掛 noindex 會讓 Google 可能不追這個轉址。
 */
export default defineEventHandler((event) => {
  const host = getRequestHostname(event)
  if (PRODUCTION_HOSTS.has(host)) return
  if (host === PROD_DEFAULT_HOST) return // 由 redirect-canonical 處理
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
})
