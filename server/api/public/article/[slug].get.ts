import { createHash } from 'node:crypto'
import {
  WP_BASE,
  rewriteArticleLinks,
  wrapTables,
  stripWpEmbedIframes,
  toPlainText,
} from '~/server/utils/wordpress'
import { resolveBackTo } from '~/server/utils/article-sections'

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

/**
 * 已下架的本站頁面（2026-10-16 業主決定：停止招募加盟、不賣商品，兩頁刪除、網址回 404）。
 *
 * 頁面檔刪掉之後，這些網址會掉進 pages/[...slug].vue 來這裡查 WordPress。
 * WordPress 剛好有同代稱的文章時會被當成文章顯示 ——
 * franchise 就是「中高齡健康訓練創業說明會」，內容是加盟說明，跟停招矛盾。
 * 業主要的是「找不到頁面」，所以在打上游之前直接 404。
 *
 * ⚠️ 只擋這幾個網址。不要改成「RESERVED_ROUTES 全部 404」——
 *    那份清單是給 sitemap、彙整頁與內文連結改寫用的，用途不同。
 * ⚠️ 比對前轉小寫：WordPress 查代稱不分大小寫，/Franchise 也查得到那篇。
 */
const RETIRED_PAGES = new Set(['franchise', 'shop'])

/**
 * 快取鍵只在這裡組一次。getKey 與「文章已刪除時清快取」共用 ——
 * 兩邊各拼一次的話，一旦對不上，清除會靜默失效（removeItem 打到不存在的鍵不會報錯）。
 *
 * - 雜湊：中文 slug 會被 Nitro 的 escapeKey（replace(/\W/g, '')）清空，見檔頭
 * - 鍵裡不放連字號：escapeKey 也會刪掉它
 * - 存放位置對應 nitropack runtime/internal/cache.mjs 的組法：
 *   [base '/cache', group 'nitro/handlers', name, key + '.json'].join(':')
 *   name 明確指定，不要用預設的 '_'
 */
const CACHE_NAME = 'article'
function slugHash(slug: string): string {
  return createHash('sha1').update(slug).digest('hex').slice(0, 20)
}
function articleCacheKey(slug: string): string {
  return 'article' + slugHash(slug)
}
function backupKeyFor(slug: string): string {
  return 'article-backup:' + slugHash(slug)
}

/**
 * 🔴 文章在 WordPress 確定被刪除（或改成草稿）時，清掉這一篇的快取與長效備份。
 *
 * 為什麼需要：這支 handler 是 swr 模式。快取過期後，Nitro 先回舊的 200、在背景重抓；
 * 背景重抓丟出的 404 只會被記成一行「[cache] SWR handler error」，舊項目不會被清，
 * 所以曾經快取過這篇的執行個體會一直回 200，直到執行個體被回收（實測可以活好幾天）。
 * 備份也要一起清：記憶體 driver 不吃 ttl，舊備份永遠不會過期，
 * 不清的話下次上游停擺時，已刪的文章會以 stale:true 復活。
 *
 * ⚠️ 只能在「上游成功、回空陣列」時呼叫。逾時、錯誤頁、缺欄位都是上游失敗，
 *    不能碰快取與備份 —— 那正是 10-13 停擺時撐住全站文章的東西。
 * ⚠️ 不要為了這件事改 swr: false。過期就前景等上游，停擺時每篇文章都要讓讀者等滿逾時，
 *    請求疊起來會擴出沒有備份的新執行個體，回到 10-13 那種自我延續的迴圈。
 */
async function forgetDeletedArticle(slug: string, store: ReturnType<typeof useStorage>) {
  try {
    const root = useStorage()
    const cacheKey = `/cache:nitro/handlers:${CACHE_NAME}:${articleCacheKey(slug)}.json`
    const backupKey = backupKeyFor(slug)
    const hadCache = await root.hasItem(cacheKey)
    const hadBackup = await store.hasItem(backupKey)
    if (hadCache) await root.removeItem(cacheKey)
    if (hadBackup) await store.removeItem(backupKey)
    // 這一行同時用來確認鍵有沒有組對：快取過的文章被刪，第一次 404 時應該看到 hadCache: true
    if (hadCache || hadBackup) {
      console.warn('[Article] 上游確認已刪除，清除快取與備份', slug, { hadCache, hadBackup })
    }
  } catch (error: any) {
    // 清不掉也不能影響 404 回應
    console.error('[Article] 清除已刪文章的快取失敗', slug, error?.message)
  }
}

export default defineCachedEventHandler(
  async (event) => {
    const slug = readSlug(event)
    if (!slug) throw createError({ statusCode: 400, message: '缺少文章代稱' })
    if (RETIRED_PAGES.has(slug.toLowerCase())) {
      throw createError({ statusCode: 404, message: '找不到這篇文章' })
    }

    const store = useStorage('cache')
    const backupKey = backupKeyFor(slug)

    let rows: any
    try {
      rows = await $fetch<any>(`${WP_BASE}/wp/v2/posts`, {
        // categories 是給返回連結用的（見 server/utils/article-sections.ts）。
        // ⚠️ 2026-10-15 才加 —— 在此之前存下的 7 天長效備份副本裡沒有這個欄位，
        //    走退路時 resolveBackTo 會回預設值，連結不會壞但會退回「知識科普」。
        query: { slug, _fields: 'slug,title,content,excerpt,date,modified,categories' },
        timeout: 12000,
      })
      // 🔴 上游可能用 HTTP 200 回非 JSON（實測：密集請求時 Cloudways 會回
      //    錯誤頁或限流頁，狀態碼仍是 200）。若不檢查形狀，字串會被當成陣列，
      //    rows[0] 取到一個字元，每個欄位都是 undefined，結果是產生一篇
      //    「看起來成功的空白文章」並且被快取 10 分鐘。
      //    那比回 503 危險得多：監控不會報錯，Google 會收錄空白頁。
      if (!Array.isArray(rows)) {
        throw new Error('上游回應不是陣列（可能是錯誤頁或限流頁）')
      }
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
      // 走到這裡＝上游成功、回空陣列＝這篇確定不存在（失敗都在上面的 catch 處理掉了）
      await forgetDeletedArticle(slug, store)
      throw createError({ statusCode: 404, message: '找不到這篇文章' })
    }

    const post = rows[0]
    // 形狀再確認一次：缺標題或內文就不是一篇可用的文章，寧可走退路也不要
    // 產生空白頁並把它快取起來
    if (!post || typeof post !== 'object' || !post.title?.rendered) {
      const backup = await store.getItem<any>(backupKey).catch(() => null)
      if (backup?.data) {
        console.warn('[Article] 上游回應缺欄位，改用上一份快取:', slug)
        return { success: true, stale: true, data: backup.data }
      }
      setResponseHeader(event, 'Retry-After', '60')
      throw createError({ statusCode: 503, message: '文章暫時讀取不到，請稍後再試' })
    }

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
      // 返回哪一個彙整頁、哪一個分類。在伺服器端算好，前端只負責渲染 ——
      // 分類 id 的對照表留在伺服器端，不必送到瀏覽器。
      backTo: resolveBackTo(post.categories),
    }
    // 存一份長效副本供上游失敗時使用（失敗不影響本次回應）
    store.setItem(backupKey, { data }, { ttl: LAST_GOOD_TTL }).catch(() => {})
    return { success: true, stale: false, data }
  },
  {
    name: CACHE_NAME,
    maxAge: 600,
    swr: true,
    // 十六進位雜湊：只含 0-9a-f，不會被 Nitro 的鍵值清理動到
    getKey: (event) => articleCacheKey(readSlug(event)),
  }
)
