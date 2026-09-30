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
  '/franchise',
  '/cooperation',
  '/shop',
  '/privacy',
]
// 刻意不列：/admin/**（要登入）、/api/**、/team-intro（只是轉址到 /about）

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
      try {
        for (let page = 1; page <= 20; page++) {
          const rows: any = await $fetch(`${WP_BASE}/wp/v2/posts`, {
            query: { per_page: 100, page, _fields: 'slug,modified' },
            timeout: 20000,
          })
          if (!Array.isArray(rows) || rows.length === 0) break
          for (const p of rows) {
            if (!p?.slug || RESERVED_ROUTES.has(p.slug)) continue
            entries.push(urlEntry(`${base}/${p.slug}/`, String(p.modified || '').slice(0, 10)))
          }
          if (rows.length < 100) break
        }
      } catch {
        // 上游失敗就只出本站頁面，不要整份 sitemap 壞掉
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
