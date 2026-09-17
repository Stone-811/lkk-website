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
 * 🔴 快取鍵一定要雜湊，不可以直接用 slug。
 *    Nitro 會用 replace(/\W/g, '') 清理快取鍵，中文字全部屬於 \W，
 *    整串會被清空 —— 結果是每一篇中文網址的文章共用同一個鍵，
 *    第一個被快取的那篇會蓋住其他全部（2026-09-15 實測踩過）。
 *    英文代稱不受影響，所以只測英文、或只測單獨一篇中文都驗不出來。
 *
 * 🔴 上游失敗不可以回 404。
 *    WordPress REST 實測需 0.8–1.3 秒，並發時會逾時。若讓錯誤變成 404，
 *    對讀者是「文章不見了」，對 Google 是「此頁已移除，可以移出索引」——
 *    一次上游抖動就可能讓文章掉出搜尋結果，而且沒有任何錯誤警示。
 *    正確語意是：查無此篇才 404；上游失敗要吐上一份內容，真的沒有才 503。
 *
 * ⚠️ Rank Math 的自訂標題與描述取不到（實測 rankmath/v1 只開放 ca / an / in
 *    三個內部命名空間）。正式導入要在 WordPress 加 mu-plugin 用
 *    register_rest_field 開出來，這裡先用文章標題與摘要代替。
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

/** 上游掛掉時的退路：成功時另存一份長效副本，失敗時拿出來用。 */
const LAST_GOOD_TTL = 60 * 60 * 24 * 7

export default defineCachedEventHandler(
  async (event) => {
    const slug = readSlug(event)
    if (!slug) throw createError({ statusCode: 400, message: '缺少文章代稱' })

    const store = useStorage('cache')
    const backupKey = 'article-backup:' + createHash('sha1').update(slug).digest('hex').slice(0, 20)

    let rows: any[]
    try {
      rows = await $fetch<any[]>(`${WP_BASE}/wp/v2/posts`, {
        query: { slug, _fields: 'slug,title,content,excerpt,date,modified' },
        timeout: 12000,
      })
    } catch (error: any) {
      // 上游失敗 ≠ 文章不存在。先找上一份成功的內容。
      const backup = await store.getItem<any>(backupKey).catch(() => null)
      if (backup?.data) {
        console.warn('[Article] 上游失敗，改用上一份快取:', slug, error?.message)
        return { success: true, stale: true, data: backup.data }
      }
      console.error('[Article] 上游失敗且無備份:', slug, error?.message)
      setResponseHeader(event, 'Retry-After', '60')
      throw createError({ statusCode: 503, message: '文章暫時讀取不到，請稍後再試' })
    }

    if (!rows?.length) {
      throw createError({ statusCode: 404, message: '找不到這篇文章' })
    }

    const post = rows[0]
    const data = {
      slug: post.slug,
      title: toPlainText(post.title?.rendered, 200),
      html: wrapTables(stripWpEmbedIframes(rewriteArticleLinks(post.content?.rendered))),
      // 摘要欄位可能是空的（實測 666 篇有 4 篇沒填），退回用內文開頭，
      // 免得 meta description 整個缺席
      description:
        toPlainText(post.excerpt?.rendered, 140) || toPlainText(post.content?.rendered, 140),
      date: post.date,
      modified: post.modified,
    }
    // 存一份長效副本供上游失敗時使用（失敗不影響本次回應）
    store.setItem(backupKey, { data }, { ttl: LAST_GOOD_TTL }).catch(() => {})
    return { success: true, stale: false, data }
  },
  {
    maxAge: 600,
    swr: true,
    // 十六進位雜湊：只含 0-9a-f，不會被 Nitro 的鍵值清理動到
    getKey: (event) =>
      'article-' + createHash('sha1').update(readSlug(event)).digest('hex').slice(0, 20),
  }
)
