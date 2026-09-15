import { WP_BASE, rewriteArticleLinks, wrapTables, toPlainText } from '~/server/utils/wordpress'

/**
 * 單篇文章 —— 依代稱（slug）向舊站 WordPress 查詢。
 *
 * 查不到就回 404，由本站自己的錯誤頁接手。這是 headless 相對於
 * 反向代理的關鍵差別：代理會把所有沒人認領的路徑無條件丟給 WordPress，
 * 等於把 404 的控制權交出去。
 *
 * ⚠️ SEO 設定（Rank Math 的自訂標題與描述）目前取不到 ——
 *    實測 rankmath/v1 只開放 ca / an / in 三個內部命名空間，
 *    沒有把文章的 meta 開放在 REST。正式導入時要在 WordPress 加一支
 *    mu-plugin 用 register_rest_field 開出來，這裡先用標題與摘要代替。
 */
export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, message: '缺少文章代稱' })

    const rows = await $fetch<any[]>(`${WP_BASE}/wp/v2/posts`, {
      query: {
        slug,
        _fields: 'slug,title,content,excerpt,date,modified',
      },
      timeout: 10000,
    })

    if (!rows?.length) {
      throw createError({ statusCode: 404, message: '找不到這篇文章' })
    }

    const post = rows[0]
    return {
      success: true,
      data: {
        slug: post.slug,
        title: toPlainText(post.title?.rendered, 200),
        html: wrapTables(rewriteArticleLinks(post.content?.rendered)),
        description: toPlainText(post.excerpt?.rendered, 140),
        date: post.date,
        modified: post.modified,
      },
    }
  },
  {
    maxAge: 600,
    swr: true,
    getKey: (event) => `knowledge:post:${getRouterParam(event, 'slug')}`,
  }
)
