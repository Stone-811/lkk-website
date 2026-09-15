import { createHash } from 'node:crypto'
import {
  WP_BASE,
  rewriteArticleLinks,
  wrapTables,
  stripWpEmbedIframes,
  toPlainText,
} from '~/server/utils/wordpress'

/**
 * 單篇文章 —— 依代稱（slug）向舊站 WordPress 查詢。
 *
 * 查不到就回 404，由本站自己的錯誤頁接手。這是 headless 相對於
 * 反向代理的關鍵差別：代理會把所有沒人認領的路徑無條件丟給 WordPress，
 * 等於把 404 的控制權交出去。
 *
 * 🔴 快取鍵一定要雜湊，不可以直接用 slug。
 *    Nitro 會用 replace(/\W/g, '') 清理快取鍵，而中文字全部屬於 \W，
 *    整串會被清空 —— 結果是每一篇中文 slug 的文章共用同一個鍵，
 *    第一個被快取的那篇會蓋住其他全部中文文章（2026-09-15 實測踩到）。
 *    英文 slug 不受影響，所以只測英文或只測單獨一篇中文都驗不出來。
 *
 * ⚠️ SEO 設定（Rank Math 的自訂標題與描述）目前取不到 ——
 *    實測 rankmath/v1 只開放 ca / an / in 三個內部命名空間，
 *    沒有把文章的 meta 開放在 REST。正式導入時要在 WordPress 加一支
 *    mu-plugin 用 register_rest_field 開出來，這裡先用標題與摘要代替。
 */

/** 網址參數可能是百分比編碼，統一解碼後再用，快取鍵與查詢才會一致。 */
function readSlug(event: any): string {
  const raw = getRouterParam(event, 'slug') || ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export default defineCachedEventHandler(
  async (event) => {
    const slug = readSlug(event)
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
        html: wrapTables(stripWpEmbedIframes(rewriteArticleLinks(post.content?.rendered))),
        description: toPlainText(post.excerpt?.rendered, 140),
        date: post.date,
        modified: post.modified,
      },
    }
  },
  {
    maxAge: 600,
    swr: true,
    // 十六進位雜湊：只含 0-9a-f，不會被 Nitro 的鍵值清理動到
    getKey: (event) =>
      'knowledge-post-' + createHash('sha1').update(readSlug(event)).digest('hex').slice(0, 20),
  }
)
