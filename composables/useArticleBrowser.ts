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
 *
 * 🔴 防競態用「每筆狀態自己記住是哪一個請求建立的」（rid），不要用共用計數器。
 *    第一版用一個 composable 層級的 token，回應回來時比對 token ——
 *    但 loading 是「每個分頁一份」而 token 是「全域一份」，所以：
 *    在訓練知識按載入更多 → 切到醫療衛教也按載入更多 → 訓練知識那一發回來時
 *    token 已經被推進，直接 return，而它在送出前就寫下的 loading:true
 *    再也沒有人負責歸位 → 切回訓練知識，按鈕永遠是 disabled 的「載入中…」，
 *    而且瀏覽模式下連清除鈕都不會渲染，讀者只能重新整理整頁。
 *    改成比對 view[tabKey].rid：別的分頁發請求不會動到這個分頁的 rid，
 *    所以「被別的分頁搶先」不再誤判成過期；而 submit/clear 會刪掉整個 view，
 *    rid 自然對不上，過期的回應仍然會被丟棄。
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
  failed?: boolean
}

interface TabView {
  posts: ArticlePost[]
  page: number
  total: number
  hasMore: boolean
  loading: boolean
  failed: boolean
  /** 建立這筆狀態的請求序號。回應回來時對不上就代表已經過期。 */
  rid: number
}

/** 與 server/api/public/wp-articles.get.ts 的 MIN_QUERY 一致。 */
export const MIN_SEARCH_LENGTH = 2

const EMPTY: TabView = {
  posts: [], page: 1, total: 0, hasMore: false, loading: false, failed: false, rid: 0,
}

export function useArticleBrowser(initial: Ref<any>) {
  const tabs = computed<ApiGroup[]>(() => initial.value?.groups ?? [])
  /**
   * 首屏就取不到上游資料。
   * 注意要涵蓋 initial.value 整個是 null 的情況（用戶端路由切換時 API 非 2xx、
   * App Hosting 冷啟逾時、rollout 期間 502）—— 只寫 `?.ok === false` 的話
   * 會得到 undefined === false ＝ false，畫面會變成完全空白、沒有任何說明。
   */
  const initialFailed = computed(() => !initial.value || initial.value.ok === false)

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

  let counter = 0

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
      failed: Boolean(g.failed),
      rid: 0,
    }
  })

  /** 首屏連分頁清單都沒拿到，搜尋沒有可以指定的範圍。 */
  const ready = computed(() => tabs.value.length > 0)
  const searching = computed(() => submitted.value.length > 0)
  const canSubmit = computed(
    () => ready.value && input.value.trim().length >= MIN_SEARCH_LENGTH
  )
  /**
   * 首屏失敗的說明只在「這個分頁還沒有自己的結果」時顯示。
   * 不加這個條件的話，首屏逾時之後就算搜尋成功、結果也確實寫進 view，
   * 畫面仍然會停在「清單暫時讀取不到」，讀者換幾個關鍵字都看不到東西。
   */
  const showInitialError = computed(() => initialFailed.value && !view[active.value])

  async function request(tabKey: string, page: number, q: string) {
    return await $fetch<{ ok: boolean; groups: ApiGroup[] }>('/api/public/wp-articles', {
      query: { tab: tabKey, page, ...(q ? { q } : {}) },
    })
  }

  /** 載入某個分頁的第一頁（搜尋送出、或搜尋狀態下切分頁時）。 */
  async function load(tabKey: string, q: string) {
    if (!tabKey) return
    const rid = ++counter
    view[tabKey] = { ...EMPTY, loading: true, rid }
    try {
      const res = await request(tabKey, 1, q)
      if (view[tabKey]?.rid !== rid) return
      const g = res.groups?.[0]
      if (res.ok === false || !g || g.failed) {
        view[tabKey] = { ...EMPTY, failed: true, rid }
        return
      }
      view[tabKey] = {
        posts: g.posts ?? [],
        page: g.page ?? 1,
        total: g.total ?? 0,
        hasMore: Boolean(g.hasMore),
        loading: false,
        failed: false,
        rid,
      }
    } catch {
      if (view[tabKey]?.rid !== rid) return
      view[tabKey] = { ...EMPTY, failed: true, rid }
    }
  }

  async function loadMore() {
    const tabKey = active.value
    const base = current.value
    if (!tabKey || base.loading || !base.hasMore) return

    const rid = ++counter
    const posts = [...base.posts]
    view[tabKey] = { ...base, posts, loading: true, failed: false, rid }
    try {
      const res = await request(tabKey, base.page + 1, submitted.value)
      if (view[tabKey]?.rid !== rid) return
      const g = res.groups?.[0]

      // 🔴 失敗時不可以採用回應裡的數字。emptyGroup 的 total 是 0，而 `?? `
      //    只在 nullish 時才退回，0 會直接覆蓋掉正確的筆數 ——
      //    畫面會變成「找到 0 篇」底下卻排著 12 張卡片，而且「載入更多」
      //    憑空消失，讀者以為已經看完全部。保留原本的筆數與 hasMore，讓他能再按一次。
      if (res.ok === false || !g || g.failed) {
        view[tabKey] = { ...base, posts, loading: false, failed: true, rid }
        return
      }

      view[tabKey] = {
        // 上游偶爾會在翻頁之間回同一篇（新文章插隊會把後面的往後推），去重比較保險
        posts: dedupe([...posts, ...(g.posts ?? [])]),
        page: g.page ?? base.page + 1,
        total: g.total ?? base.total,
        hasMore: Boolean(g.hasMore),
        loading: false,
        failed: false,
        rid,
      }
    } catch {
      if (view[tabKey]?.rid !== rid) return
      view[tabKey] = { ...base, posts, loading: false, failed: true, rid }
    }
  }

  function submit() {
    const q = input.value.trim().replace(/\s+/g, ' ')
    if (q.length < MIN_SEARCH_LENGTH || !active.value) return

    const sameQuery = q === submitted.value
    // 同一個關鍵字：只有在上一次失敗時才重打。
    // 不開這個口的話，畫面叫讀者「請稍後再試一次」，他照做卻什麼都不會發生。
    if (sameQuery && (current.value.loading || !current.value.failed)) return

    if (!sameQuery) {
      submitted.value = q
      // 換了關鍵字，之前累積的結果全部失效
      for (const key of Object.keys(view)) delete view[key]
    }
    load(active.value, q)
  }

  function clear() {
    input.value = ''
    if (!submitted.value) return
    submitted.value = ''
    // 回到瀏覽模式：清掉覆寫層就會自動落回首屏 SSR 的結果，不必重打上游。
    // 刪掉 key 也讓所有 in-flight 回應的 rid 對不上而被丟棄。
    counter++
    for (const key of Object.keys(view)) delete view[key]
  }

  function setActive(tabKey: string) {
    if (tabKey === active.value) return
    active.value = tabKey
    // 搜尋狀態下切分頁，要在新分頁裡重搜一次；上次失敗的也重試。
    // 瀏覽模式沿用首屏資料，不必請求。
    if (submitted.value && (!view[tabKey] || view[tabKey].failed)) {
      load(tabKey, submitted.value)
    }
  }

  /**
   * SSR 時若上游整組都沒讀到，別讓這張「讀取不到」的頁面被 CDN 快取。
   * routeRules 的 '/**' 是 s-maxage=600 + stale-while-revalidate=86400，
   * 一次上游抖動會讓所有讀者與 Googlebot 在接下來十分鐘都拿到空頁。
   */
  if (import.meta.server) {
    const event = useRequestEvent()
    if (event && initialFailed.value) {
      setResponseHeader(event, 'cache-control', 'no-store')
    }
  }

  return {
    tabs,
    active,
    setActive,
    input,
    submitted,
    searching,
    canSubmit,
    ready,
    current,
    showInitialError,
    submit,
    clear,
    loadMore,
  }
}

function dedupe(posts: ArticlePost[]): ArticlePost[] {
  const seen = new Set<string>()
  return posts.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
}
