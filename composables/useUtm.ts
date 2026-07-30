// UTM attribution capture.
// Captures utm_* params on site entry, persists them for the visit
// (sessionStorage, so it survives navigating from a landing page to /booking),
// and exposes the stored attribution for attaching to form submissions.

export interface UtmData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  referrer?: string
  landingPage?: string
}

const STORAGE_KEY = 'lkk_utm'
const UTM_PARAMS = ['source', 'medium', 'campaign', 'content', 'term'] as const

export function useUtm() {
  // Store attribution from a given route query. Only writes when the navigation
  // actually carries utm params, so a later utm-less page view won't clobber it.
  function captureFrom(query: Record<string, any>, fullPath?: string) {
    if (!import.meta.client) return
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
      const data: UtmData = {
        ...incoming,
        referrer: (typeof document !== 'undefined' && document.referrer) || undefined,
        landingPage: fullPath,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }

  function capture() {
    const route = useRoute()
    captureFrom(route.query as Record<string, any>, route.fullPath)
  }

  // Read stored attribution to attach to a form submission (null if none).
  function getUtm(): UtmData | null {
    if (!import.meta.client) return null
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as UtmData) : null
    } catch {
      return null
    }
  }

  return { captureFrom, capture, getUtm }
}
