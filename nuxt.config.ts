// https://nuxt.com/docs/api/configuration/nuxt-config
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
      theme_color: '#2A5269',
      background_color: '#F5EFE4',
      display: 'standalone',
      orientation: 'portrait',
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
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
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
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '練健康 - 專業健身訓練' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '練健康' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/lkklogo.png' },
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
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://l-kk.tw',
    },
  },

  // Nitro server config for Firebase App Hosting
  nitro: {
    preset: 'firebase-app-hosting',
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
