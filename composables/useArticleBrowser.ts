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

  /**
   * 目前分類。初值取自網址的 ?tab=，所以瀏覽器上一頁回到彙整頁時會還原分類 ——
   * 2026-10-15 之前它只活在記憶體裡，從文章返回一律落在預設分類（業主回報）。
   *
   * ⚠️ ?tab= 不會改變這個頁面對 API 的請求（首屏一律是 group=xxx 整組），
   *    所以多出來的網址變體**不會增加對舊站的任何請求**，只是多幾個 CDN 快取鍵。
   *
   * ⚠️ 網址帶了不存在的分類代號時，下面的 watchEffect 會把畫面退回預設分類，
   *    但網址列仍然留著那個無效值（不另外清掉，避免與 router 形成反覆觸發）。
   */
  const route = useRoute()
  const router = useRouter()
  const active = ref(typeof route.query.tab === 'string' ? route.query.tab : '')
  watchEffect(() => {
    if (tabs.value.length && !tabs.value.some((t) => t.key === active.value)) {
      active.value = tabs.value[0].key
    }
  })

  /**
   * 把分類同步到網址。
   *
   * - 用 replace 不用 push：否則每切一次分類就多一筆歷史，讀者要按好幾次上一頁
   *   才離得開彙整頁。
   * - 預設分類不寫進網址：裸網址是站內所有入口與 Googlebot 看到的那一個，
   *   讓它維持乾淨，CDN 的命中率也集中在這一個鍵上。
   * - 只在瀏覽器端做：SSR 階段改網址沒有意義，而且會動到回應的網址。
   */
  function syncTabToUrl(tabKey: string) {
    if (import.meta.server) return
    const query: Record<string, any> = { ...router.currentRoute.value.query }
    if (tabs.value[0]?.key === tabKey) delete query.tab
    else query.tab = tabKey
    router.replace({ query }).catch(() => {
      /* 重複導航等情況不需要處理，畫面狀態已經切過去了 */
    })
  }

  /**
   * 搜尋關鍵字也寫進網址（?q=，2026-10-16 起）。
   * 業主回報：知識分享搜尋「癌症」→ 點文章 → 回上一頁，搜尋結果整個不見、回到預設列表。
   * 原因跟 2026-10-15 修好的分類一樣：狀態只活在記憶體裡，離開頁面就沒了。
   *
   * - 網址上的關鍵字一樣要正規化、一樣要滿 MIN_SEARCH_LENGTH，否則當成沒帶
   * - 首屏：SSR 與瀏覽器端都先把目前分類標成「載入中」，畫面一開始就是搜尋狀態，
   *   不會先閃一下預設列表；真正的搜尋請求只在瀏覽器端發（見檔尾）
   * - 一樣用 replace：搜尋不多一筆歷史
   */
  const initialQ = normalizeSearchQuery(route.query.q)
  /** 輸入框的即時內容；按下送出才會寫進 submitted。 */
  const input = ref(initialQ)
  /** 已經送出、正在生效的關鍵字。空字串代表瀏覽模式。 */
  const submitted = ref(initialQ)

  function syncQueryToUrl(q: string) {
    if (import.meta.server) return
    const query: Record<string, any> = { ...router.currentRoute.value.query }
    if (q) query.q = q
    else delete query.q
    router.replace({ query }).catch(() => {
      /* 重複導航等情況不需要處理 */
    })
  }

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
      syncQueryToUrl(q)
      // 換了關鍵字，之前累積的結果全部失效
      for (const key of Object.keys(view)) delete view[key]
    }
    load(active.value, q)
  }

  function clear() {
    input.value = ''
    if (!submitted.value) return
    submitted.value = ''
    syncQueryToUrl('')
    // 回到瀏覽模式：清掉覆寫層就會自動落回首屏 SSR 的結果，不必重打上游。
    // 刪掉 key 也讓所有 in-flight 回應的 rid 對不上而被丟棄。
    counter++
    for (const key of Object.keys(view)) delete view[key]
  }

  function setActive(tabKey: string) {
    if (tabKey === active.value) return
    active.value = tabKey
    syncTabToUrl(tabKey)
    // 搜尋狀態下切分頁，要在新分頁裡重搜一次；上次失敗的也重試。
    // 瀏覽模式沿用首屏資料，不必請求。
    if (submitted.value && (!view[tabKey] || view[tabKey].failed)) {
      load(tabKey, submitted.value)
    }
  }

  // 網址帶著 ?q= 進來（例如從文章按上一頁，頁面會重新掛載）：還原搜尋結果。
  // 先同步標成載入中（SSR 與瀏覽器端一致，不會 hydration 不一致），掛載後才真的發請求。
  // ready：首屏連分類清單都沒拿到時不還原，維持原本「清單暫時讀取不到」的畫面 ——
  //        否則會顯示「再按一次搜尋」，但那時搜尋鈕是停用的。
  //
  // ⚠️ 刻意不監聽同一頁的 ?q= 變化（2026-10-16 回歸審查後拿掉）。
  //    例如在搜尋結果頁點頁首的「知識科普」：元件不會重新掛載，若跟著網址清掉搜尋，
  //    分類卻還停在原處（?tab= 從來沒有監聽），畫面會落到網址表達不出來的狀態，
  //    而且「點頁首會重設」是業主沒同意過的畫面行為。改動前點頁首畫面不變，維持如此。
  if (submitted.value && active.value && ready.value) {
    view[active.value] = { ...EMPTY, loading: true, rid: ++counter }
    onMounted(() => {
      if (submitted.value && active.value && ready.value) load(active.value, submitted.value)
    })
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

/**
 * 網址上的關鍵字：與 submit() 相同的正規化；不滿最短長度就當成沒帶。
 * 陣列（?q=a&q=b）、null 也當成沒帶。pages/news.vue 也用這一支（明確 import）。
 */
export function normalizeSearchQuery(raw: unknown): string {
  const q = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
  return q.length >= MIN_SEARCH_LENGTH ? q : ''
}

function dedupe(posts: ArticlePost[]): ArticlePost[] {
  const seen = new Set<string>()
  return posts.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
}
