/**
 * 網站地圖。
 *
 * 🔴 文章要不要列進來，綁在 NUXT_PUBLIC_ARTICLE_CANONICAL_ORIGIN 上。
 *    Google 明講：不要把「canonical 指向別處」的網址放進自己的 sitemap——
 *    那等於同時說「請收錄我」和「正本在別人那」，是互相矛盾的訊號。
 *    切轉前文章的正本在舊站，所以這裡只列本站自己的頁面；
 *    切轉當天翻那一個環境變數，canonical 與 sitemap 會同時改變，不會脫鉤。
 *
 * ⚠️ 分店網址用的是 slug 不是 Firestore 文件 ID（實測 /locations/xindian 回 200、
 *    /locations/<docId> 回 404），所以要從 API 取 slug，不要拿 id 去組。
 *
 * ⚠️ 快取一小時。抓 668 篇要 7 個請求，一小時一次對舊站是可忽略的量；
 *    設太長的話，上游暫時失敗會讓不完整的 sitemap 卡很久。
 *
 * 🔴 上游失敗時要吐上一份成功的文章清單，不可以靜默退回「只有靜態頁」。
 *    2026-10-13 實測：正式站連不上舊站期間，這份 sitemap 從約 720 筆掉到 26 筆，
 *    等於對 Google 宣告 694 篇文章全部消失——而且 catch 把錯誤吃掉，
 *    沒有任何告警，是靠業主問「刪掉的文章怎麼還看得到」才翻出來的。
 *    中途失敗同樣不可以把已抓到的幾頁當成完整清單送出（理由見下方註解）。
 */
const STATIC_PATHS = [
  '/',
  '/about',
  '/services',
  '/booking',
  '/group-booking',
  '/locations',
  '/team-intro/coaches',
  '/lkk-lecturer',
  '/co-lecturer',
  '/oversea-lecturer',
  '/lkk-academy',
  '/lkk4',
  '/personal-record',
  '/knowledge-center',
  '/cases-center',
  '/activity-center',
  '/news-center',
  '/news',
  '/cooperation',
  '/privacy',
]
// 刻意不列：/admin/**（要登入）、/api/**、/team-intro（只是轉址到 /about）、
// /franchise 與 /shop（2026-10-16 下架，網址回 404，見 article/[slug].get.ts 的 RETIRED_PAGES）

/**
 * 文章清單的長效備份。與 article/[slug] 的 LAST_GOOD_TTL 同為 7 天：
 * 上游中斷七天還沒修，那就不是「抖動」而是要人處理的事了。
 *
 * ⚠️ `useStorage('cache')` 沒設驅動（nuxt.config 裡沒有 storage 設定），
 *    預設是記憶體，**備份只活在單一 Cloud Run 執行個體裡**，重新部署就歸零。
 *    所以這份備份擋得住「跑了一陣子之後上游才掛」，擋不住「部署完上游就是掛的」——
 *    那種情況仍然只會出靜態頁。要真的擋住得換成 Firestore 之類的持久層。
 *    article/[slug] 的 7 天副本有同一個限制（2026-10-13 查證）。
 */
const ARTICLES_BACKUP_KEY = 'sitemap-backup:articles'
const ARTICLES_BACKUP_TTL = 60 * 60 * 24 * 7

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function urlEntry(loc: string, lastmod?: string) {
  return lastmod
    ? `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod></url>`
    : `  <url><loc>${xmlEscape(loc)}</loc></url>`
}

export default defineCachedEventHandler(
  async (event) => {
    const { siteUrl, articleCanonicalOrigin } = useRuntimeConfig(event).public as any
    const base = String(siteUrl).replace(/\/+$/, '')
    const entries: string[] = STATIC_PATHS.map((p) => urlEntry(base + (p === '/' ? '/' : p)))

    // 分店（slug 由後台維護，不寫死）
    try {
      const res: any = await $fetch('/api/public/stores')
      for (const s of res?.data ?? []) {
        if (s?.slug) entries.push(urlEntry(`${base}/locations/${s.slug}`))
      }
    } catch {
      // 取不到就先不列，下一次快取更新會補上。寧可少幾頁，也不要送出錯誤網址。
    }

    // 文章：只有本站是正本時才列
    const ownArticles = !articleCanonicalOrigin || String(articleCanonicalOrigin) === base
    if (ownArticles) {
      const store = useStorage('cache')
      // 整份抓完才算一次成功。中途失敗不要把「已經抓到的那幾頁」送出去——
      // 那會變成一份「宣稱只有 200 篇」的 sitemap，剩下的 494 篇對 Google
      // 等同於被移除，比少一次更新嚴重。
      let posts: Array<{ slug: string; modified?: string }> | null = null
      try {
        const collected: Array<{ slug: string; modified?: string }> = []
        for (let page = 1; page <= 20; page++) {
          const rows: any = await $fetch(`${WP_BASE}/wp/v2/posts`, {
            query: { per_page: 100, page, _fields: 'slug,modified' },
            timeout: 20000,
          })
          if (!Array.isArray(rows)) throw new Error('上游回應不是陣列（可能是錯誤頁或限流頁）')
          if (rows.length === 0) break
          for (const p of rows) {
            if (p?.slug) collected.push({ slug: p.slug, modified: p.modified })
          }
          if (rows.length < 100) break
        }
        // 空清單不覆蓋備份：舊站把全部文章下架是極罕見事件，
        // 遠比「上游回了一頁空的」更不可能，寧可沿用上一份。
        if (collected.length > 0) {
          posts = collected
          store.setItem(ARTICLES_BACKUP_KEY, { posts }, { ttl: ARTICLES_BACKUP_TTL }).catch(() => {})
        }
      } catch {
        // 上游失敗不可以靜默變成「只有靜態頁」的 sitemap。
        // 那是對 Google 宣告 694 篇文章全部消失，而且會被快取一小時。
      }

      if (!posts) {
        const backup = await store.getItem<any>(ARTICLES_BACKUP_KEY).catch(() => null)
        if (Array.isArray(backup?.posts) && backup.posts.length > 0) {
          console.warn('[Sitemap] 上游失敗，改用上一份文章清單:', backup.posts.length, '篇')
          posts = backup.posts
        } else {
          console.error('[Sitemap] 上游失敗且無備份，這次只出本站靜態頁')
        }
      }

      for (const p of posts ?? []) {
        if (!p?.slug || RESERVED_ROUTES.has(p.slug)) continue
        entries.push(urlEntry(`${base}/${p.slug}/`, String(p.modified || '').slice(0, 10)))
      }
    }

    setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`
  },
  { maxAge: 60 * 60, name: 'sitemap', getKey: () => 'sitemap' }
)
