/**
 * 哪些主機名算「正式對外的站」。
 *
 * 這份清單被兩個地方用到，所以放在同一支檔案裡：
 *   - server/middleware/redirect-canonical.ts  正式站的 hosted.app → 品牌網域 301
 *   - server/middleware/noindex-nonproduction.ts ＋ server/routes/robots.txt.ts
 *     非正式主機一律 noindex
 *
 * 🔴 分成兩份清單維護過一次就會漂移，而漂移的後果不對稱：
 *    漏掉一個非正式主機 → 那個主機被 Google 收錄，跟正式站互相打架；
 *    誤把正式站列為非正式 → 整個正式站 noindex，流量歸零。
 *    後者才是災難，所以判斷方式是「白名單正式主機，其餘一律 noindex」。
 */

/**
 * 正式對外的網域。只有這些主機允許被搜尋引擎收錄。
 *
 * 🔴 刻意只保留單一網域。2026-09-21 業主確認對外只使用 lkkwellness.com，
 *    www 沒有 DNS 紀錄（NXDOMAIN）也不打算加，所以不放進來。
 *
 * ⚠️ 因此：**日後新增任何對外網址都必須同時加進這份名單**——
 *    不在名單上的主機會拿到 Disallow: / ＋ noindex。
 *    漏加的症狀是「新網址上線後完全不被 Google 收錄」，而且從畫面上
 *    看不出任何異常（頁面正常顯示），只能從 robots.txt 與回應標頭發現。
 */
export const PRODUCTION_HOSTS = new Set([
  'lkkwellness.com',
])

/** 正式站 App Hosting 的預設網址，會被 301 轉到品牌網域。 */
export const PROD_DEFAULT_HOST = 'lkk-website--lkkprod.asia-east1.hosted.app'

export const CANONICAL_ORIGIN = 'https://lkkwellness.com'

/**
 * 取得這個請求真正的主機名。
 *
 * ⚠️ App Hosting 前面的 Envoy CDN 可能改寫 Host，原始網域會落在 x-forwarded-host，
 *    所以要優先看它。連接埠要去掉（本機開發是 localhost:3000）。
 */
export function getRequestHostname(event: any): string {
  const xf = (getRequestHeader(event, 'x-forwarded-host') || '').toLowerCase()
  const host = (getRequestHeader(event, 'host') || '').toLowerCase()
  return (xf || host).split(',')[0].trim().split(':')[0]
}

/** 這個請求是不是打在正式對外網域上。 */
export function isProductionHost(event: any): boolean {
  return PRODUCTION_HOSTS.has(getRequestHostname(event))
}
