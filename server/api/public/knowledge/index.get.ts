import { WP_BASE, getCategoryId, toPlainText } from '~/server/utils/wordpress'

const CATEGORY_SLUG = 'knowledge'
const PER_PAGE = 12

/**
 * 知識分享的文章列表 —— 即時向舊站 WordPress 查詢。
 *
 * 快取刻意設得比文章內頁短：新文章要「盡快出現在清單上」，
 * 而內頁的內容很少改動。兩者需求相反，所以分成兩個端點各自設 TTL。
 * 目前 120 秒 ＝ 發文後最多兩分鐘會出現在列表。
 *
 * ⚠️ 這裡回傳的每一筆只給 slug，不給 WordPress 的 link 欄位 ——
 *    那個欄位是舊站的絕對網址，前端拿去用會把讀者送出站。
 */
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)

    const categoryId = await getCategoryId(CATEGORY_SLUG)
    if (!categoryId) {
      console.error('[Knowledge List] 找不到分類:', CATEGORY_SLUG)
      return { success: true, data: [], page: 1, totalPages: 0, total: 0 }
    }

    // 用 raw 才讀得到 X-WP-Total 標頭，分頁器需要總數
    const res = await $fetch.raw<any[]>(`${WP_BASE}/wp/v2/posts`, {
      query: {
        categories: categoryId,
        page,
        per_page: PER_PAGE,
        _fields: 'slug,title,excerpt,date',
      },
      timeout: 10000,
    })

    const total = Number(res.headers.get('x-wp-total') || 0)
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 0)

    const data = (res._data || []).map((p: any) => ({
      slug: p.slug,
      title: toPlainText(p.title?.rendered, 200),
      excerpt: toPlainText(p.excerpt?.rendered, 90),
      date: p.date,
    }))

    return { success: true, data, page, totalPages, total }
  },
  {
    maxAge: 120,
    swr: true,
    getKey: (event) => `knowledge:list:${getQuery(event).page || 1}`,
  }
)
