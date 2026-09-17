/**
 * 舊站 WordPress 的文章清單（只取標題、摘要、日期、網址）。
 *
 * 用途是把 l-kk.tw 的「知識科普」與「學員故事」兩個彙整頁，
 * 改用本站的版型呈現。文章內頁由 pages/[...slug].vue 負責，這裡只做清單
 * —— 2026-09-15 曾嘗試由本站渲染文章內文，四個缺陷全部出在那一層，
 *    列表這一層當時沒有出現任何問題。所以這支只做列表。
 *
 * 🔴 快取鍵只用 group 這個英數字串。
 *    Nitro 會用 replace(/\W/g,'') 清理快取鍵，中文會被整串清光，
 *    造成不同查詢共用同一個鍵、互相覆蓋（2026-09-15 實測踩過）。
 *
 * 🔴 上游失敗不可以讓頁面變成 404 或 500。
 *    WordPress REST 實測穩定需要 0.8–1.3 秒，並發時會逾時；
 *    若讓錯誤往上拋，讀者與 Googlebot 會收到錯誤頁。
 *    這裡改為回傳 ok:false 與空清單，由頁面顯示可讀的說明。
 */

const WP_BASE = process.env.WORDPRESS_API_URL || 'https://l-kk.tw/wp-json'

/**
 * 本站已佔用的第一層路由。與這些同名的文章代稱在本站永遠取不到
 * （靜態路由優先），所以卡片要改連舊站，否則會連到內容完全不同的頁。
 * 實測 655 篇裡只有 franchise 這一筆。
 */
const RESERVED_ROUTES = new Set([
  'about', 'booking', 'cases-center', 'co-lecturer', 'cooperation', 'franchise',
  'group-booking', 'knowledge-center', 'lkk-academy', 'lkk-lecturer', 'lkk4',
  'news', 'oversea-lecturer', 'personal-record', 'privacy', 'services', 'shop',
  'admin', 'locations', 'team-intro', 'api',
])

/** 分類代號白名單。這是公開端點，不接受任意分類，避免被當成任意查詢的跳板。 */
const TABS = {
  knowledge: [
    { key: 'sports', label: '訓練知識', id: 17 },
    { key: 'wellness', label: '醫療衛教', id: 18 },
    { key: 'elderly', label: '特殊族群', id: 11 },
    { key: 'fitness', label: '運動人文', id: 9 },
  ],
  cases: [{ key: 'cases', label: '學員故事', id: 1092 }],
} as const

const PER_TAB = 12

function toPlainText(html: string, max: number): string {
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

export default defineCachedEventHandler(
  async (event) => {
    const group = String(getQuery(event).group || 'knowledge')
    const tabs = (TABS as any)[group]
    if (!tabs) throw createError({ statusCode: 400, message: '未知的分類群組' })

    try {
      const groups = await Promise.all(
        tabs.map(async (tab: any) => {
          const rows = await $fetch<any[]>(`${WP_BASE}/wp/v2/posts`, {
            query: {
              categories: tab.id,
              per_page: PER_TAB,
              _fields: 'slug,link,title,excerpt,date',
            },
            timeout: 12000,
          })
          return {
            key: tab.key,
            label: tab.label,
            posts: (rows || []).map((p) => {
              let plain = p.slug
              try {
                plain = decodeURIComponent(p.slug)
              } catch {
                /* 編碼壞掉就用原字串比對 */
              }
              const reserved = RESERVED_ROUTES.has(plain)
              return {
                slug: p.slug,
                title: toPlainText(p.title?.rendered, 120),
                excerpt: toPlainText(p.excerpt?.rendered, 88),
                date: p.date,
                // 一般情況連本站的文章頁；與本站路由同名的只能連回舊站
                href: reserved ? p.link : `/${p.slug}/`,
                external: reserved,
              }
            }),
          }
        })
      )
      return { ok: true, groups }
    } catch (error: any) {
      console.error('[WP Articles] 取不到舊站文章清單:', error?.message)
      // 不往上拋：頁面要能正常顯示，只是清單區塊改成說明文字
      return { ok: false, groups: tabs.map((t: any) => ({ key: t.key, label: t.label, posts: [] })) }
    }
  },
  {
    maxAge: 300,
    swr: true,
    // 只用英數，避免被 Nitro 的鍵值清理動到
    getKey: (event) => `wp-articles-${String(getQuery(event).group || 'knowledge').replace(/[^a-z]/gi, '')}`,
  }
)
