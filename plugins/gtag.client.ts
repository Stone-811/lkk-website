// Google Analytics 4（gtag.js）
// 只在正式網域 lkkwellness.com 啟用 —— dev / 預覽 / hosted.app 網址一律不追蹤，
// 避免測試流量污染分析數據。GA4 評估 ID 是公開碼（本來就會出現在網頁原始碼），直接寫這裡即可。
export default defineNuxtPlugin(() => {
  const host = window.location.hostname
  if (host !== 'lkkwellness.com' && host !== 'www.lkkwellness.com') return

  const GA_ID = 'G-DSQC1NTPJ3'
  const w = window as any

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  w.dataLayer = w.dataLayer || []
  w.gtag = function () { w.dataLayer.push(arguments) }
  w.gtag('js', new Date())
  w.gtag('config', GA_ID)
})
