import type { Ref } from 'vue'

/**
 * 三個 WordPress 驅動的彙整頁共用的「瀏覽 ＋ 分頁內搜尋」狀態。
 *
 * 設計上刻意分成兩層：
 *   首屏由各頁自己的 useFetch('?group=…') 用 SSR 取得，這一層完全沒動 ——
 *   維持原本「一次拿回整組分頁、前端切換不再發請求」的行為。
 *   搜尋與「載入更多」才會發新的請求，而且一次只打「目前這個分頁」。
 *
 * 為什麼不一起搜四個分頁：舊站的併發表現不穩定（2026-09-30 實測，
 * 同樣 6 個並發量過 4 秒也量過 26 秒），而它是全站 675 篇文章的唯一資料來源。
 * 一次搜一個分頁，把並發維持在 1。
 */

export interface ArticlePost {
  slug: string
  title: string
  excerpt: string
  date: string
  href: string
  external?: boolean
}

interface ApiGroup {
  key: string
  label: string
  posts: ArticlePost[]
  total: number
  totalPages: number
  page: number
  hasMore: boolean
}

interface TabView {
  posts: ArticlePost[]
  page: number
  total: number
  hasMore: boolean
  loading: boolean
  failed: boolean
}

/** 與 server/api/public/wp-articles.get.ts 的 MIN_QUERY 一致。 */
export const MIN_SEARCH_LENGTH = 2

const EMPTY: TabView = { posts: [], page: 1, total: 0, hasMore: false, loading: false, failed: false }

export function useArticleBrowser(initial: Ref<any>) {
  const tabs = computed<ApiGroup[]>(() => initial.value?.groups ?? [])
  /** 首屏就取不到上游資料。這時整個清單區塊換成說明文字，頁面其餘部分照常。 */
  const initialFailed = computed(() => initial.value?.ok === false)

  const active = ref('')
  watchEffect(() => {
    if (tabs.value.length && !tabs.value.some((t) => t.key === active.value)) {
      active.value = tabs.value[0].key
    }
  })

  /** 輸入框的即時內容；按下送出才會寫進 submitted。 */
  const input = ref('')
  /** 已經送出、正在生效的關鍵字。空字串代表瀏覽模式。 */
  const submitted = ref('')

  /**
   * 覆寫層。只有「搜尋過」或「載入過更多」的分頁才會有值，
   * 其餘的直接沿用首屏 SSR 的結果 —— 所以清除搜尋不需要重新打一次上游。
   */
  const view = reactive<Record<string, TabView>>({})

  /** 防競態：切分頁或連續搜尋時，較早發出的回應不可以蓋掉較晚的。 */
  let token = 0

  const current = computed<TabView>(() => {
    const override = view[active.value]
    if (override) return override
    const g = tabs.value.find((t) => t.key === active.value)
    if (!g) return EMPTY
    return {
      posts: g.posts,
      page: g.page || 1,
      total: g.total,
      hasMore: g.hasMore,
      loading: false,
      failed: false,
    }
  })

  const searching = computed(() => submitted.value.length > 0)
  const canSubmit = computed(() => input.value.trim().length >= MIN_SEARCH_LENGTH)

  async function request(tabKey: string, page: number, q: string) {
    return await $fetch<{ ok: boolean; groups: ApiGroup[] }>('/api/public/wp-articles', {
      query: { tab: tabKey, page, ...(q ? { q } : {}) },
    })
  }

  /** 載入某個分頁的第一頁（搜尋送出、或搜尋狀態下切分頁時）。 */
  async function load(tabKey: string, q: string) {
    const mine = ++token
    view[tabKey] = { ...EMPTY, loading: true }
    try {
      const res = await request(tabKey, 1, q)
      if (mine !== token) return
      const g = res.groups?.[0]
      view[tabKey] = {
        posts: g?.posts ?? [],
        page: g?.page ?? 1,
        total: g?.total ?? 0,
        hasMore: Boolean(g?.hasMore),
        loading: false,
        failed: res.ok === false,
      }
    } catch {
      if (mine !== token) return
      view[tabKey] = { ...EMPTY, failed: true }
    }
  }

  async function loadMore() {
    const tabKey = active.value
    const base = current.value
    if (!tabKey || base.loading || !base.hasMore) return

    const mine = ++token
    const posts = [...base.posts]
    view[tabKey] = { ...base, posts, loading: true }
    try {
      const res = await request(tabKey, base.page + 1, submitted.value)
      if (mine !== token) return
      const g = res.groups?.[0]
      view[tabKey] = {
        // 上游偶爾會在翻頁之間回同一篇（新文章插隊會把後面的往後推），去重比較保險
        posts: dedupe([...posts, ...(g?.posts ?? [])]),
        page: g?.page ?? base.page + 1,
        total: g?.total ?? base.total,
        hasMore: Boolean(g?.hasMore),
        loading: false,
        failed: res.ok === false,
      }
    } catch {
      if (mine !== token) return
      // 載入更多失敗時保留已經看到的文章，只是停止再往下
      view[tabKey] = { ...base, posts, loading: false, hasMore: false, failed: true }
    }
  }

  function submit() {
    const q = input.value.trim().replace(/\s+/g, ' ')
    if (q.length < MIN_SEARCH_LENGTH) return
    if (q === submitted.value) return
    submitted.value = q
    // 換了關鍵字，之前累積的結果全部失效
    for (const key of Object.keys(view)) delete view[key]
    load(active.value, q)
  }

  function clear() {
    input.value = ''
    if (!submitted.value) return
    submitted.value = ''
    // 回到瀏覽模式：清掉覆寫層就會自動落回首屏 SSR 的結果，不必重打上游
    token++
    for (const key of Object.keys(view)) delete view[key]
  }

  function setActive(tabKey: string) {
    if (tabKey === active.value) return
    active.value = tabKey
    // 搜尋狀態下切分頁，要在新分頁裡重搜一次；瀏覽模式沿用首屏資料，不必請求
    if (submitted.value && !view[tabKey]) load(tabKey, submitted.value)
  }

  return {
    tabs,
    active,
    setActive,
    input,
    submitted,
    searching,
    canSubmit,
    current,
    initialFailed,
    submit,
    clear,
    loadMore,
  }
}

function dedupe(posts: ArticlePost[]): ArticlePost[] {
  const seen = new Set<string>()
  return posts.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
}
