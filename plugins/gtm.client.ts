// Google 代碼管理工具（GTM）。容器編號由業主提供：GTM-5X328JSM。
//
// 🔴 只在正式網域啟用。dev / 預覽 / hosted.app 網址一律不載入——
//    GTM 容器裡裝著 GA4、Google Ads 轉換與 Facebook Pixel，
//    測試流量跑進去會污染正式報表與廣告成效。
//    （判斷方式與 server/utils/site-hosts.ts 的白名單一致，但這裡是瀏覽器端，
//      不能共用那支 server util，所以字串各寫一份。改網域時兩邊都要改。）
//
// ⚠️ 這個容器裡有什麼，不在本專案的版本控制內。2026-09-25 查證當下它會觸發：
//      GA4        G-0YKEEDEETZ、G-DKE9TGKTRX
//      Google Ads AW-18034628987（轉換 ＋ 再行銷）
//      自訂 HTML（Facebook Pixel）
//    日後網站變慢或出現非預期行為時，除了程式碼也要查 GTM 後台。
//
// ⚠️ 轉換的觸發條件是「元素顯示時觸發」，原本指向舊站 Contact Form 7 的
//    #wpcf7-f12508-p7640-o1 .wpcf7-response-output。那個元素在本站不存在，
//    所以四張表單的成功區塊都補上了 id="lead-success"，請代操改指到它。
const GTM_ID = 'GTM-5X328JSM'
const PRODUCTION_HOSTS = ['lkkwellness.com']

export default defineNuxtPlugin(() => {
  if (!PRODUCTION_HOSTS.includes(window.location.hostname)) return

  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(s)
})
