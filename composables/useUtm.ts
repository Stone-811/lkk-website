/**
 * 廣告來源（UTM）的捕捉與保存。
 *
 * 訪客帶著 utm_* 參數進站時記下來，之後在站內換頁、關掉分頁、隔幾天再回來，
 * 送出表單時都還帶得到，寫進 leads.payload.utm 供後台歸因。
 *
 * 🔴 用 cookie 而不是 sessionStorage。
 *    sessionStorage 只活在「一個分頁的生命週期」—— 關掉分頁就沒了，
 *    開新分頁也讀不到。實際情況是訪客今天點廣告、沒預約就離開，
 *    過幾天再回來才填表，那筆轉換會被算成「直接流量」。
 *    cookie 保留 30 天，與舊站的 HandL UTM Grabber 一致，兩邊資料可比較。
 *
 * 🔴 cookie 還有一個 sessionStorage 做不到的好處：伺服器端讀得到。
 *    表單送出時不必依賴瀏覽器 JS 有沒有順利跑起來。
 *
 * ⚠️ 刻意不記訪客 IP。舊站的 HandL 會把 IP 寫進前端可讀的 cookie 保留 30 天，
 *    IP 在個資法下屬於個人資料，這裡沒有記錄的必要，不照抄。
 *
 * ⚠️ 跨網域收不到：cookie 綁在自己的網域，l-kk.tw 寫的 cookie 本站讀不到，
 *    這是瀏覽器的結構限制。從舊站轉過來的廣告流量，UTM 只能靠網址參數傳遞，
 *    所以舊站的 301 規則必須保留查詢字串，否則這裡再怎麼存也收不到東西。
 */

export interface UtmData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  referrer?: string
  landingPage?: string
  /** 捕捉時間（ISO）。有這個才分得出「兩小時前點的廣告」和「29 天前點的」。 */
  capturedAt?: string
}

const COOKIE_KEY = 'lkk_utm'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 天，與舊站 HandL 一致
const UTM_PARAMS = ['source', 'medium', 'campaign', 'content', 'term'] as const

function utmCookie() {
  return useCookie<UtmData | null>(COOKIE_KEY, {
    maxAge: MAX_AGE,
    sameSite: 'lax', // 從廣告點進來屬跨站導覽，lax 讀得到；strict 會讀不到
    secure: true,
    path: '/',
    // 這不是機密資料，而且前端要讀，所以不設 httpOnly
  })
}

export function useUtm() {
  /**
   * 從一次導覽的查詢字串記下來源。
   * 只有在網址真的帶了 utm_* 時才寫入 —— 否則之後任何一次沒帶參數的瀏覽
   * 都會把先前的歸因洗掉。
   */
  function captureFrom(query: Record<string, any>, fullPath?: string) {
    try {
      const incoming: Record<string, string> = {}
      for (const key of UTM_PARAMS) {
        const raw = query[`utm_${key}`]
        const val = Array.isArray(raw) ? raw[0] : raw
        if (typeof val === 'string' && val.trim()) {
          incoming[key] = val.trim().slice(0, 200)
        }
      }
      if (Object.keys(incoming).length === 0) return

      utmCookie().value = {
        ...incoming,
        referrer: (import.meta.client && document.referrer) || undefined,
        landingPage: fullPath,
        capturedAt: new Date().toISOString(),
      }
    } catch {
      // 瀏覽器停用 cookie、無痕模式等情況：記不下來就算了，不要讓頁面壞掉
    }
  }

  function capture() {
    const route = useRoute()
    captureFrom(route.query as Record<string, any>, route.fullPath)
  }

  /** 讀出要附在表單上的來源資料；沒有就回 null。 */
  function getUtm(): UtmData | null {
    try {
      return utmCookie().value || null
    } catch {
      return null
    }
  }

  return { captureFrom, capture, getUtm }
}
