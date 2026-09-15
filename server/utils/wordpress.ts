/**
 * 舊站 WordPress（l-kk.tw）內容 API 的共用工具。
 *
 * 這是 headless 方案：文章**仍然存放在舊站的 WordPress 資料庫**，
 * 新站不保存任何文章，只是即時讀取並用自己的版型呈現。
 * 讀者的網址列自始至終只會看到本站網域 —— 下面這些請求全部發生在伺服器端。
 *
 * ⚠️ 目前是 /knowledge 的示範範圍。若日後要讓文章沿用原本的根目錄網址
 *    （l-kk.tw/文章標題/ → 本站/文章標題/），改動的是路由與 ARTICLE_BASE，
 *    這一層不用動。
 */

export const WP_BASE = process.env.WORDPRESS_API_URL || 'https://l-kk.tw/wp-json'

/** 文章在本站的網址前綴。示範階段放在 /knowledge 底下，不搶既有路由。 */
export const ARTICLE_BASE = '/knowledge'

/** 舊站這些路徑不是文章，改寫連結時要跳過。 */
const NOT_AN_ARTICLE = /^(wp-content|wp-json|wp-admin|wp-includes|category|tag|author|feed|comments)$/

/**
 * 把內文裡指向舊網域的「文章」連結改成本站相對路徑。
 *
 * 🔴 wp-content 一定要排除 —— 圖片實體還在 Cloudways，
 *    連圖片網址一起改掉的話每篇有圖的文章都會破圖。
 *    分類、標籤等非文章路徑也跳過，本站目前沒有對應頁面。
 */
export function rewriteArticleLinks(html: string): string {
  return String(html || '').replace(
    /https:\/\/l-kk\.tw\/([^/"'\s?#]+)\//g,
    (whole, seg) => {
      let plain = seg
      try { plain = decodeURIComponent(seg) } catch { /* 編碼壞掉就用原字串比對 */ }
      return NOT_AN_ARTICLE.test(plain) ? whole : `${ARTICLE_BASE}/${seg}/`
    }
  )
}

/** WordPress 的 excerpt 是 HTML，卡片上只要純文字。 */
export function toPlainText(html: string, max = 100): string {
  const text = String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[&hellip;\]|\[…\]/g, '')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;|&#8216;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}

/**
 * 用分類代稱換分類 ID。
 * WordPress 的文章查詢只吃分類 ID，不吃代稱，所以要先查一次。
 * 呼叫端已經有快取包著，這裡不另外快取。
 */
export async function getCategoryId(slug: string): Promise<number | null> {
  const rows = await $fetch<any[]>(`${WP_BASE}/wp/v2/categories`, {
    query: { slug, _fields: 'id' },
    timeout: 10000,
  })
  return rows?.[0]?.id ?? null
}
