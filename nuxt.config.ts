// https://nuxt.com/docs/api/configuration/nuxt-config

// og:image 必須是絕對網址，dev / prod 各自不同；與下方 runtimeConfig.public.siteUrl 同源。
// ⚠️ fallback 原本是 'https://l-kk.tw'——那是舊的 WordPress 站（實測仍回 200）。
// 萬一環境變數沒讀到，canonical 與 og:image 會整站指向舊站，等於把新官網的
// 搜尋分數送給舊站。改成正式站網域，讓最糟情況也是安全的。
// 正常情況兩個環境都由 apphosting.yaml 提供 NUXT_PUBLIC_SITE_URL，走不到這裡。
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lkkwellness.com'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt',
  ],

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '練健康',
      short_name: '練健康',
      description: '練健康 - 專業健身訓練，中高齡體適能專家',
      // vite-plugin-pwa 的預設值是 'en'（寫死在套件裡，不是誰打錯的）。
      // manifest 現在真的被引用了，這個值就會生效，順手改對。
      lang: 'zh-Hant-TW',
      theme_color: '#2A5269',
      background_color: '#F5EFE4',
      display: 'standalone',
      // 🔴 刻意不設 orientation。原本是 'portrait'，會讓「安裝後」的 App 鎖成直向、
      //    轉橫看不了——而本站最需要轉橫的正是 LKK4 成績查詢與後台那 9 個寬表格頁
      //    （都用 overflow-x-auto 的寬表格）。2026-09-12 接上 manifest 時一併移除，
      //    不設就是跟隨裝置的旋轉設定。
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      // Don't use navigateFallback for SSR apps
      navigateFallback: null,
      // Only precache essential small files
      globPatterns: ['**/*.{js,css,woff2}'],
      // Exclude large files and HTML from precaching (SSR generates HTML)
      globIgnores: ['**/images/**', '**/node_modules/**', '**/*.html'],
      runtimeCaching: [
        {
          // Cache navigation requests with NetworkFirst strategy
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 1 day
            },
            networkTimeoutSeconds: 3,
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // 🔴 這裡刻意用 StaleWhileRevalidate，不要改回 CacheFirst。
          //    本站換照片一律是「同名覆蓋」（public/images/ 底下直接換檔，
          //    近三週就做過 7 次，belief-chart.webp 還在 5 天內換了兩次）。
          //    CacheFirst 會讓回訪者最久 30 天都看到舊照片，而且業主自己驗收
          //    時也會看到舊的，很容易誤判成「換圖失敗」。
          //    StaleWhileRevalidate：先給快取裡的舊圖（畫面一樣快），
          //    同時在背景抓新的存起來，回訪者第二次進站就會看到新照片。
          //    2026-09-12 從 CacheFirst 改過來。
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // App config
  app: {
    head: {
      title: '練健康',
      // 🔴 全站 <html> 原本是裸的，沒有 lang。繁中站缺 lang 時，瀏覽器只能拿
      //    「訪客裝置自己的語系」去挑漢字備援字型——本站沒有載入任何 webfont
      //    （字型堆疊是 Microsoft JhengHei / 微軟正黑體 / system-ui），所以在
      //    非中文語系的裝置上，骨、直、令、者、過這類字可能被渲染成日文或簡體字形。
      //    2026-09-12 實測：台灣使用者（裝置語系 zh-TW）補上前後是 0 像素差異、
      //    418 個元素 0 位移，也就是對絕大多數訪客畫面完全不變；受益的是
      //    非中文語系裝置、螢幕朗讀器（WCAG 3.1.1 A 級），以及 /news——
      //    那頁中文字元只占 52%（BBC / Reuters / AFP 等外媒名），最容易被
      //    Chrome 誤判語言而跳出翻譯提示。
      //    全站沒有任何 :lang() 樣式，所以不會有任何樣式因此改變。
      htmlAttrs: { lang: 'zh-Hant-TW' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '練健康 - 專業健身訓練' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '練健康' },

        // 社群 / LINE 分享預覽。
        // ⚠️ 這裡刻意不設 og:title 與 og:description——各頁自己用 useHead 設了
        //    title 與 description，LINE/FB 在缺 og:title 時會退回用它們；
        //    在站台層寫死反而會讓每一頁的預覽標題都變成同一句。
        //
        // 🔴 og-image-v2.png：LINE 聊天室的預覽卡是「小方形縮圖」，會把 1200x630
        //    置中裁成 1:1。舊版 og-image.png 的英文行寬到 x260-941，裁切只保留
        //    x285-915，業主 2026-09-12 實際截圖顯示成「KK WELLNESS CENTE」，
        //    頭尾字母被吃掉。v2 把整個 lockup 收進 x330-870，1:1 裁切完整保留。
        //
        // 🔴 檔名一定要換，不要覆蓋 og-image.png。LINE/FB 有兩層快取：
        //    「頁面網址→OG 中繼資料」與「圖片網址→縮圖 bytes」。實測 og-image.png
        //    的回應沒有 Cache-Control（只有 ETag），覆蓋同名檔時第二層很可能
        //    直接沿用舊 bytes，換圖等於沒換。換檔名才動得到第二層。
        //    第一層只能靠分享帶參數的網址（例如 ?v=1）或等它自己過期——
        //    LINE 沒有 Facebook Sharing Debugger 那種公開清快取工具。
        //    另外：已經送出的 LINE 訊息，預覽卡永遠不會更新。
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '練健康 LKK Wellness Center' },
        { property: 'og:image', content: `${siteUrl}/og-image-v2.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: '練健康 LKK Wellness Center' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${siteUrl}/og-image-v2.png` },
      ],
      link: [
        // ⚠️ 舊設定指向 /lkklogo.png——那是「透明底 + 白字」的 header 用 logo，
        //    在 Chrome 淺色頁籤上白字整個看不見，16px 只剩一團橘色。
        //    現在改用深藍圓底的拳頭標記（favicon.ico 內含 16/32/48 三種尺寸）。
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/png', href: '/favicon-32.png', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  // Runtime config
  runtimeConfig: {
    // Server-side only
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    // Public (client-side)
    public: {
      // fallback 同上，不要用舊 WordPress 站的網址
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lkkwellness.com',
      // Firebase client (web) config — public values, used for admin Google sign-in
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
    },
  },

  // Nitro server config for Firebase App Hosting
  /**
   * 快取標頭。
   *
   * 🔴 為什麼要加：App Hosting 前面有一層 Google CDN，但實測 cdn-cache-status
   *    永遠是 miss —— 因為回應沒有任何 Cache-Control，CDN 依規則不會快取。
   *    每一個請求都因此回到 Cloud Run，文章頁還會再回源打 WordPress。
   *    補上標頭之後，重複請求由 CDN 擋下，Cloud Run 與 Cloudways 都不用醒來。
   *
   * max-age=0  瀏覽器每次都重新驗證（使用者不會看到自己瀏覽器裡的舊版）
   * s-maxage   只有共用快取（CDN）能留，這是我們要的
   * stale-while-revalidate  過期後先回舊的、背景更新，讀者不必等
   *
   * ⚠️ 公開頁面實測沒有 Set-Cookie，所以 CDN 願意快取；
   *    若日後有頁面開始設 cookie，它就會自動不被快取（這是 CDN 的規則，不是設定）。
   */
  routeRules: {
    // 預設：文章頁走這條（根目錄萬用捕捉，無法用路徑區分）。
    // 文章內容很少改，快取久一點，這正是減少 WordPress 負載的地方。
    '/**': {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
      },
    },

    // 由後台維護的頁面：快取短一點，業主改完不必等太久才看得到。
    // ⚠️ 新增這類頁面時要記得補進來，否則預設會吃到 600 秒。
    '/': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/about': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/locations/**': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/team-intro/**': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/lkk-lecturer': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/co-lecturer': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/oversea-lecturer': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },
    '/personal-record': { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } },

    // 🔴 後台與 API 絕對不可進共用快取。
    //    後台頁面若被 CDN 快取，等於把一個人的畫面發給所有人。
    '/admin/**': { headers: { 'cache-control': 'private, no-store' } },
    '/api/**': { headers: { 'cache-control': 'private, no-store' } },
  },

  nitro: {
    preset: 'firebase-app-hosting',

    // ── 文章預抓（可行性測試中）──────────────────────────────
    // 建置時把舊站文章抓下來產生靜態頁，執行期就不必再打 WordPress。
    // 篇數由 PRERENDER_ARTICLES 控制，未設＝不預抓（維持現狀）。
    prerender: {
      crawlLinks: false,
      failOnError: false,
    },
    hooks: {
      async 'prerender:routes'(routes: Set<string>) {
        const limit = Number(process.env.PRERENDER_ARTICLES || 0)
        if (!limit) return
        const base = process.env.WORDPRESS_API_URL || 'https://l-kk.tw/wp-json'
        const perPage = Math.min(limit, 100)
        const added: string[] = []
        for (let page = 1; added.length < limit; page++) {
          // 用原生 fetch：nuxt.config 的建置期沒有 $fetch
          const url = `${base}/wp/v2/posts?per_page=${perPage}&page=${page}&_fields=slug`
          const res: any = await fetch(url, { signal: AbortSignal.timeout(30000) })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
          if (!Array.isArray(res) || res.length === 0) break
          for (const p of res) {
            if (added.length >= limit) break
            added.push(p.slug)
            routes.add(`/${p.slug}/`)
          }
          if (res.length < perPage) break
        }
        console.log(`[prerender] 加入 ${added.length} 篇文章路由`)
      },
    },

    // Externalize Node.js modules that shouldn't be bundled
    externals: {
      external: [
        'firebase-admin',
        'firebase-admin/app',
        'firebase-admin/firestore',
        'firebase-admin/auth',
        'firebase-admin/storage',
        '@google-cloud/firestore',
        'nodemailer',
      ],
    },
  },

  // Vite config for dev server
  vite: {
    optimizeDeps: {
      exclude: [
        'firebase-admin',
        '@google-cloud/firestore',
        'nodemailer',
      ],
    },
    ssr: {
      external: [
        'firebase-admin',
        'firebase-admin/app',
        'firebase-admin/firestore',
        'firebase-admin/auth',
        'firebase-admin/storage',
        '@google-cloud/firestore',
        'nodemailer',
      ],
      noExternal: [],
    },
  },

  // Build configuration
  build: {
    transpile: ['jose'],
  },
});
