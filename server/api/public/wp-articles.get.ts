/**
 * 舊站 WordPress 的文章清單（只取標題、摘要、日期、網址）。
 *
 * 用途是把 l-kk.tw 的「知識科普」「學員故事」「活動資訊」三個彙整頁，
 * 改用本站的版型呈現。文章內頁由 pages/[...slug].vue 負責，這裡只做清單
 * —— 2026-09-15 曾嘗試由本站渲染文章內文，四個缺陷全部出在那一層，
 *    列表這一層當時沒有出現任何問題。所以這支只做列表。
 *
 * 兩種模式：
 *   ?group=knowledge   一次拿整組分頁的第一頁（首屏 SSR 用，有快取）
 *   ?tab=sports&page=2 單一分頁的第 N 頁（「載入更多」用，有快取）
 *   ?tab=sports&q=膝蓋 單一分頁內搜尋（沒有快取，理由見下）
 *
 * 🔴 快取鍵只能用英數與底線。
 *    Nitro 的 escapeKey 是 String(key).replace(/\W/g,'')，中文會被整串清光，
 *    造成不同查詢共用同一個鍵、互相覆蓋（2026-09-15 實測踩過）。
 *    連連字號都會被清掉，所以分頁鍵用 `${tab.key}_${page}` 這種形狀。
 *
 * 🔴 搜尋結果刻意不快取。
 *    Nitro 的快取底層是 unstorage 的裸 Map，沒有容量上限也沒有逐出機制
 *    （過期項目只是讀取時判定為舊，不會被刪掉），而容器只有 512MiB。
 *    關鍵字的基數無上限 ＝ 永不釋放的項目無上限。瀏覽用的鍵是有界的
 *    （6 個分頁 × 頁碼），可以放心快取；搜尋不行。
 *
 * 🔴 上游失敗不可以讓頁面變成 404 或 500。
 *    WordPress REST 實測穩定需要 0.8–1.3 秒，並發時會逾時；
 *    若讓錯誤往上拋，讀者與 Googlebot 會收到錯誤頁。
 *    這裡改為回傳 ok:false 與空清單，由頁面顯示可讀的說明。
 */

const WP_BASE = process.env.WORDPRESS_API_URL || 'https://l-kk.tw/wp-json'

/**
 * 本站已佔用的第一層路由。與這些同名的文章代稱在本站永遠取不到
 * （靜態路由優先）—— 例如「中高齡健康訓練創業說明會」的代稱是 franchise，
 * 而本站的 /franchise 是加盟頁。
 *
 * ⚠️ 這類文章從彙整頁「整篇排除」，不列出來。
 *    先前是列出來但連回舊站，業主決定不要那樣 —— 讀者在新站的列表上
 *    看到一張卡片卻被送去別的網站，體驗是斷的。
 *    要根治得在 WordPress 改那篇文章的代稱，並為舊網址補一條 301。
 *
 * 2026-09-30 全量查證：全站 675 篇裡只有 franchise 這一篇會撞到本站路由。
 */
const RESERVED_ROUTES = new Set([
  'about', 'booking', 'cases-center', 'activity-center', 'co-lecturer', 'cooperation', 'franchise',
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
  activity: [{ key: 'activity', label: '活動資訊', id: 448 }],
} as const

type Tab = { key: string; label: string; id: number }

/** 分頁代稱 → 分頁定義。搜尋與載入更多都只認這份白名單裡的 key。 */
const TAB_BY_KEY = new Map<string, Tab>()
for (const tabs of Object.values(TABS)) {
  for (const tab of tabs) TAB_BY_KEY.set(tab.key, tab)
}

const PER_PAGE = 12

/** WordPress 的 per_page 上限是 100，超過直接回 400。這裡用不到，但頁碼要夾住。 */
const MAX_PAGE = 50

/**
 * 查詢字串長度限制。
 *   下限 2：單一中文字實測命中 559/675（八成三的文章），對讀者等同沒有篩選。
 *   上限 50：過長的 q 上游的反應由長到短是 500 → 414 → 連線直接斷（沒有狀態碼），
 *            與其接住三種失敗，不如根本不要讓那種請求出去。
 */
const MIN_QUERY = 2
const MAX_QUERY = 50

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

/**
 * 正規化查詢字串。
 * 太短視為「沒有查詢」（回到瀏覽模式），太長截斷而不是拒絕 ——
 * 讀者不會故意貼 50 字進搜尋框，會這樣做的多半不是讀者。
 */
function normalizeQuery(raw: unknown): string {
  const q = String(raw ?? '').trim().replace(/\s+/g, ' ')
  if (q.length < MIN_QUERY) return ''
  // ⚠️ 用 Array.from 以「字元」為單位截斷，不要用 slice ——
  //    slice 是以 UTF-16 code unit 計，會把 emoji 的代理對切成孤兒高位字元，
  //    接著組查詢字串時會丟 URIError，讀者換幾次關鍵字都一樣失敗。
  return Array.from(q).slice(0, MAX_QUERY).join('')
}

function clampPage(raw: unknown): number {
  const n = Number.parseInt(String(raw ?? '1'), 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, MAX_PAGE)
}

/** 取不到資料時的佔位。failed 讓前端能分辨「真的沒有結果」與「這次沒讀到」。 */
function emptyGroup(tab: Tab, page: number, failed = true) {
  return { key: tab.key, label: tab.label, posts: [], total: 0, totalPages: 0, page, hasMore: false, failed }
}

/**
 * 抓單一分頁的一頁文章。
 *
 * ⚠️ orderby=relevance 只有在帶 search 時才合法，沒有 search 會回 400
 *    （rest_invalid_param）。所以這個參數必須跟著 q 一起加。
 *    而它是搜尋好不好用的分水嶺 —— 實測「訓練知識」分頁搜「膝蓋」，
 *    預設的日期排序第一筆標題根本沒有「膝蓋」，換成 relevance 之後前三筆全部命中。
 *
 * ⚠️ 不要再疊 search_columns=post_title。分類本身已經過濾過一次，
 *    再限制只比對標題會直接見底（實測「訓練知識」搜「蛋白質」：全文 20 篇 → 只搜標題 0 篇）。
 */
async function fetchTab(tab: Tab, opts: { q?: string; page?: number }) {
  const page = opts.page ?? 1
  const q = opts.q ?? ''

  const query: Record<string, string | number> = {
    categories: tab.id,
    per_page: PER_PAGE,
    page,
    // 不帶 _fields 的話同一個查詢會回 321KB，帶了是 11.8KB（實測 2026-09-30）
    _fields: 'slug,title,excerpt,date',
  }
  if (q) {
    query.search = q
    query.orderby = 'relevance'
  }

  try {
    const res = await $fetch.raw<any[]>(`${WP_BASE}/wp/v2/posts`, { query, timeout: 12000 })

    // 🔴 舊站在密集請求下會用 HTTP 200 回一頁 HTML 限流頁（本專案實測記錄過）。
    //    ofetch 依 content-type 判型，這時 _data 是字串不是陣列。
    //    當成空清單靜默放行的話：讀者看到一片空白而且沒有任何說明，
    //    而且 defineCachedFunction 會把這個「成功的空結果」快取 300 秒。
    //    所以要丟出去，讓外層走 ok:false 的說明畫面。
    if (!Array.isArray(res._data)) {
      throw createError({ statusCode: 502, message: '上游回應不是文章清單' })
    }
    const rows = res._data
    const total = Number(res.headers.get('x-wp-total') || 0)
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 0)

    return {
      key: tab.key,
      label: tab.label,
      // total 是上游的數字，還沒扣掉下面被排除的保留代稱。
      // 全站目前只有 franchise 一篇會被排掉，所以最多差 1 篇，不另外做精算
      // （要精算就得把整個結果集抓下來，成本遠高於這個誤差）。
      total,
      totalPages,
      page,
      hasMore: page < totalPages,
      posts: rows
        .filter((p) => {
          let plain = p.slug
          try {
            plain = decodeURIComponent(p.slug)
          } catch {
            /* 編碼壞掉就用原字串比對 */
          }
          // 與本站路由同名的文章在本站打不開，整篇排除不列出
          return !RESERVED_ROUTES.has(plain)
        })
        .map((p) => ({
          slug: p.slug,
          title: toPlainText(p.title?.rendered, 120),
          excerpt: toPlainText(p.excerpt?.rendered, 88),
          date: p.date,
          // slug 是百分比編碼的，原樣接上不要 decode ——
          // 本站的文章路由就是以這個形式對應舊站網址
          href: `/${p.slug}/`,
        })),
    }
  } catch (error: any) {
    // 🔴 WordPress 對超出總頁數的 page 回 HTTP 400（rest_post_invalid_page_number），
    //    不是空陣列。正常操作不會走到這裡（hasMore 為 false 時前端就不會再要），
    //    但手動改網址或競態就會，當成「沒有更多了」而不是整頁壞掉。
    if (error?.response?.status === 400) return emptyGroup(tab, page)
    throw error
  }
}

/**
 * 瀏覽模式專用的快取。鍵是「分頁代稱 _ 頁碼」——
 * 只有英數與底線，不會被 Nitro 的 escapeKey 清掉，而且基數有界。
 */
const cachedFetchTab = defineCachedFunction(
  (tab: Tab, page: number) => fetchTab(tab, { page }),
  {
    name: 'wp-articles',
    maxAge: 300,
    swr: true,
    getKey: (tab: Tab, page: number) => `${tab.key}_${page}`,
  }
)

export default defineEventHandler(async (event) => {
  const params = getQuery(event)
  const q = normalizeQuery(params.q)
  const page = clampPage(params.page)
  // ⚠️ 「有沒有帶 tab」要看參數在不在，不能看它是不是 truthy。
  //    ?tab= （空字串）若被當成沒帶，會悄悄退回整組模式、而且把 q 丟掉 ——
  //    前端拿到的是瀏覽結果，卻會標成「找到 N 篇包含 X 的文章」。
  const hasTab = params.tab !== undefined
  const tabKey = hasTab ? String(params.tab) : ''

  // 單一分頁模式（搜尋與載入更多），或整組模式（首屏）
  let tabs: readonly Tab[] | undefined
  if (hasTab) {
    const tab = TAB_BY_KEY.get(tabKey)
    tabs = tab ? [tab] : undefined
  } else {
    tabs = (TABS as Record<string, readonly Tab[]>)[String(params.group || 'knowledge')]
  }
  if (!tabs) throw createError({ statusCode: 400, message: '未知的分類' })

  // 整組模式一律是第一頁、不帶搜尋：它是首屏用的，而且一次要打 4 個分類。
  // 讓它也吃 q 或 page 等於把搜尋變成 4 個並發 —— 舊站的併發表現不穩定
  // （實測同樣 6 個並發，量過 4 秒也量過 26 秒），不值得為此冒險。
  const single = hasTab
  const effectiveQ = single ? q : ''
  const effectivePage = single ? page : 1

  // 🔴 用 allSettled 不是 all。整組模式一次打 4 個分類，若用 Promise.all，
  //    只要「運動人文」逾時就會讓另外 3 個（可能根本是快取命中、沒碰上游）
  //    的結果一起被丟掉，整個 /knowledge-center 變成「清單暫時讀取不到」。
  //    而那張失敗的 SSR 頁還會被 CDN 依 routeRules '/**' 快取 10 分鐘。
  //    改成逐個分類各自成敗，讀者至少看得到能讀到的那幾個分頁。
  const settled = await Promise.allSettled(
    tabs.map((tab) =>
      effectiveQ ? fetchTab(tab, { q: effectiveQ, page: effectivePage }) : cachedFetchTab(tab, effectivePage)
    )
  )

  const groups = settled.map((r, i) => {
    if (r.status === 'fulfilled') return { ...r.value, failed: false }
    console.error(`[WP Articles] ${tabs[i].label} 取不到舊站文章清單:`, r.reason?.message)
    return emptyGroup(tabs[i], effectivePage)
  })

  // ok 只有在「每一個分類都失敗」時才是 false —— 那才是整塊清單真的沒東西可顯示
  return {
    ok: groups.some((g) => !g.failed),
    query: effectiveQ,
    page: effectivePage,
    groups,
  }
})
