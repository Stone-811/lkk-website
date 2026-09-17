/**
 * 舊站 WordPress（l-kk.tw）內容 API 的共用工具。
 *
 * 這是 headless 方案：文章**仍然存放在舊站的 WordPress 資料庫**，
 * 新站不保存任何文章，只是即時讀取並用自己的版型呈現。
 * 讀者的網址列自始至終只會看到本站網域 —— 下面這些請求全部發生在伺服器端。
 *
 * 文章走根目錄，與舊站網址一對一對應。
 */

export const WP_BASE = process.env.WORDPRESS_API_URL || 'https://l-kk.tw/wp-json'

/**
 * 文章在本站的網址前綴。空字串＝根目錄，與舊站網址結構完全相同
 * （l-kk.tw/spine/ ↔ 本站/spine/），未來舊站掛 301 時是一對一對應。
 */
export const ARTICLE_BASE = ''

/** 這些路徑永遠不能碰：圖片實體與後台都還在舊站。 */
const NEVER_TOUCH = /^(wp-content|wp-json|wp-admin|wp-includes|wp-login\.php)$/

/** 這些是舊站的彙整頁，本站目前沒有對應頁面，維持連往舊站。 */
const NOT_AN_ARTICLE = /^(category|tag|author|feed|comments)$/

/**
 * 本站已經佔用的第一層路由。
 *
 * 文章走根目錄之後，靜態路由永遠優先於文章，所以同名的文章網址取不到。
 * 改寫內文連結時也必須避開這些 —— 例如舊站有一篇代稱是 franchise 的文章
 * （中高齡健康訓練創業說明會），若把連結改寫成 /franchise/ 會連到本站的
 * 加盟頁，內容完全不同，比留在舊站更糟。
 *
 * ⚠️ 新增頁面時要同步更新這份清單，scripts/verify-articles.mjs 裡也有一份。
 */
const RESERVED_ROUTES = new Set([
  'about', 'booking', 'cases-center', 'co-lecturer', 'cooperation', 'franchise',
  'group-booking', 'knowledge-center', 'lkk-academy', 'lkk-lecturer', 'lkk4',
  'news', 'oversea-lecturer', 'personal-record', 'privacy', 'services', 'shop',
  'admin', 'locations', 'team-intro', 'api',
])

/**
 * 舊站「頁面」對應到本站頁面。
 *
 * 🔴 少了這張表會出大事：實測 300 篇文章的內文連結，指向 /bodytest/ 的就有 50 次，
 *    是全站被連最多的目標。它是舊站的預約頁、不是文章，若當成文章改寫成
 *    /knowledge/bodytest/ 會全部變 404 —— 而且那些是文章裡的行動呼籲連結，
 *    等於把轉換入口整批打掉。
 *
 * 內容與「舊站轉址對應表」同一份來源。兩邊要一起維護。
 */
const PAGE_MAP: Record<string, string> = {
  bodytest: '/booking',
  '臉書-預約體驗': '/booking',
  '填單感謝頁面': '/booking',
  privacypolicy: '/privacy',
  service: '/services',
  'service/group-class': '/group-booking',
  '服務內容': '/services',
  '服務內容/合作夥伴': '/cooperation',
  '一對一教練課程': '/services',
  '團體課程': '/group-booking',
  'team-intro': '/about',
  'business-philosophy': '/about',
  '聯絡我們': '/about',
  'about-us': '/about',
  '異業合作': '/cooperation',
  'lkk-training-workshop': '/cooperation',
  lkk4_2026: '/lkk4',
  '第五屆聖誕老人六角槓硬舉大賽': '/lkk4',
  '課程報名': '/lkk-academy',
  '講師介紹': '/lkk-lecturer',
  '練健康合作講師': '/co-lecturer',
  '海外講師': '/oversea-lecturer',
  'team-intro/台北南京店': '/locations/nanjing',
  'team-intro/台北西門店': '/locations/ximending',
  'team-intro/台北新店七張店': '/locations/xindian',
  'team-intro/台北松江店': '/locations/songjiang',
  '台北南京店-2': '/locations/nanjing',
  checkout: '/shop',
  shoppingcart: '/shop',
  // 本站已有的兩個彙整頁
  'category/knowledge': '/knowledge-center',
  knowledge: '/knowledge-center',
  'knowledge-center': '/knowledge-center',
  'cases-center': '/cases-center',
  '案例分享': '/cases-center',
  'category/案例分享': '/cases-center',
}

/**
 * 把內文裡指向舊網域的連結改寫成本站路徑。
 *
 * 判斷順序刻意如此：
 *   1. wp-content 等實體資源 —— 永遠不動（圖片還在 Cloudways，改掉整批破圖）
 *   2. 對照表裡的舊站頁面 —— 換成本站對應頁
 *   3. 分類／標籤等彙整頁 —— 本站還沒有，維持連往舊站
 *   4. 不認得的多層路徑 —— 保守不動，寧可連出去也不要造出 404
 *   5. 其餘單層路徑 —— 視為文章
 */
export function rewriteArticleLinks(html: string): string {
  return String(html || '').replace(
    /https:\/\/l-kk\.tw\/([^"'\s<>)]*)/g,
    (whole, rawUrl) => {
      // ⚠️ 查詢字串與錨點要先拆掉再判斷。
      //    否則 /medicine/?utm_source=x 會因為含有 "/" 被當成多層路徑而漏改
      //    （2026-09-17 全量驗證抓到）。拆掉之後原樣接回去。
      const parts = String(rawUrl).match(/^([^?#]*)([?#].*)?$/) || ['', String(rawUrl), '']
      const suffix = parts[2] || ''
      const path = parts[1].replace(/\/+$/, '')
      if (!path) return '/' + suffix

      let plain = path
      try { plain = decodeURIComponent(path) } catch { /* 編碼壞掉就用原字串比對 */ }
      const first = plain.split('/')[0]

      if (NEVER_TOUCH.test(first)) return whole

      const mapped = PAGE_MAP[plain] ?? (plain.includes('/') ? undefined : PAGE_MAP[first])
      if (mapped) return mapped + suffix

      if (NOT_AN_ARTICLE.test(first)) return whole
      if (plain.includes('/')) return whole
      // 與本站路由同名 → 改寫會連到內容不同的頁，維持指向舊站
      if (RESERVED_ROUTES.has(plain)) return whole

      return `${ARTICLE_BASE}/${path}/${suffix}`
    }
  )
}

/**
 * 移除 WordPress 文章內嵌（oEmbed）的隱藏 iframe。
 *
 * 內嵌區塊的結構是「一個可見的 blockquote 連結 ＋ 一個隱藏的 iframe」，
 * 本來由 WordPress 的 wp-embed.js 把 iframe 顯示出來取代 blockquote。
 * 本站沒有載入那支腳本，所以 iframe 永遠是隱藏的，讀者看到的是 blockquote
 * —— 而那個連結已經被 rewriteArticleLinks 正確改寫成站內網址。
 *
 * 但 iframe 還是會發請求到舊站：實測 200 篇有 84 個。留著沒有任何好處，
 * 而且舊站掛著 HandL 外掛會因此把讀者 IP 寫進 cookie。
 *
 * ⚠️ 只移除指向舊站 /embed/ 的內嵌，YouTube 等外部嵌入必須保留。
 */
export function stripWpEmbedIframes(html: string): string {
  return String(html || '').replace(
    /<iframe[^>]*\bsrc="https:\/\/l-kk\.tw\/[^"]*\/embed\/[^"]*"[^>]*><\/iframe>/g,
    ''
  )
}

/**
 * 每個表格都包一層可橫向捲動的容器。
 *
 * 實測 200 篇有 117 個表格，其中只有 114 個被 <figure> 包著 ——
 * 不能只靠 figure 當捲動容器，所以自己補一層，包到誰都一樣。
 */
export function wrapTables(html: string): string {
  return String(html || '').replace(
    /<table[\s\S]*?<\/table>/g,
    (t) => `<div class="table-scroll">${t}</div>`
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
