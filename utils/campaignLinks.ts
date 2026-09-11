// UTM 活動連結：純函式，前後端共用。
//
// 🔴 為什麼連結「不存進 Firestore」，每次現算：
//    dev 與 prod 的網域不同（apphosting.yaml 各自設 NUXT_PUBLIC_SITE_URL）。
//    如果把組好的完整網址存進資料庫，在 dev 後台建的活動會產出指向
//    lkk-website-dev--lkkdev.asia-east1.hosted.app 的連結；那串連結被複製出去投放後，
//    名單會全部進 lkkdev，正式站一筆都收不到，而且沒有任何錯誤訊息。
//    所以 DB 只存「參數」，網域與組裝都在讀取當下決定。

/** 投放管道 → utm_medium 的對應。medium 是 GA4 的標準維度，不讓業主自由打字。 */
export const CHANNEL_TO_MEDIUM: Record<string, string> = {
  網站: 'referral',
  LINE: 'social',
  Facebook: 'social',
  Instagram: 'social',
  Email: 'email',
  傳單: 'offline',
  Google: 'cpc',
}

/** 投放管道 → utm_source 的預設值（業主可在活動層級覆寫）。 */
export const CHANNEL_TO_SOURCE: Record<string, string> = {
  網站: 'website',
  LINE: 'line',
  Facebook: 'facebook',
  Instagram: 'instagram',
  Email: 'email',
  傳單: 'flyer',
  Google: 'google',
}

/**
 * 可投放的目標頁面。key 同時決定 ?v= 要從哪一份合作案設定取選項。
 * 業主 2026-09-11：只保留兩張會收名單的表單——其餘頁面（首頁、研習課程、
 * LKK4…）沒有表單，帶 utm 進去也產不出可歸因的名單，留著只會誤導。
 */
export const CAMPAIGN_TARGETS = [
  { value: '/booking', label: '預約體驗表單', variantSource: 'booking' as const },
  { value: '/group-booking', label: '團體課程報名', variantSource: 'groupClass' as const },
]

/**
 * 活動代號規則：小寫英數起頭，之後可含 - 與 _，總長 2–60。
 * 🔴 為什麼要強制小寫：composables/useUtm.ts 擷取 utm 參數時只做 trim 與截長，
 *    不做 lowercase 也不比對白名單。所以 `Nanshan` 與 `nanshan` 會在後台的
 *    「UTM 活動」下拉裂成兩個選項，而且救不回來——leads 的 PATCH 白名單
 *    只放行 status 與 internalNote，沒有任何 API 能回填 payload。
 */
export const CAMPAIGN_CODE_RE = /^[a-z0-9][a-z0-9_-]{1,59}$/

export function normalizeCampaignCode(raw: string): string {
  return String(raw || '').trim().toLowerCase()
}

export function validateCampaignCode(raw: string): string | null {
  const v = normalizeCampaignCode(raw)
  if (!v) return '請填寫活動代號'
  if (!CAMPAIGN_CODE_RE.test(v)) {
    return '活動代號只能用小寫英文、數字、- 與 _，長度 2–60，且需以英數開頭'
  }
  return null
}

export interface CampaignLinkInput {
  /** 目標頁面路徑，例如 /booking */
  targetPath: string
  /** 表單變體 key（只有 /booking 與 /group-booking 吃得到），空字串＝不帶 */
  variantKey?: string | null
  /** utm_campaign，已正規化的小寫代號 */
  utmCampaign: string
  /** 投放管道（中文，對應 CHANNEL_TO_*） */
  channel: string
  /** utm_content，用來區分同一管道的不同素材 */
  utmContent?: string | null
}

/**
 * 組出一條完整連結。
 * 參數順序固定（v → utm_source → utm_medium → utm_campaign → utm_content），
 * 讓同一檔活動的多條連結看起來一致、方便業主目視比對。
 */
export function buildCampaignLink(origin: string, input: CampaignLinkInput): string {
  const base = String(origin || '').replace(/\/+$/, '')
  const path = input.targetPath.startsWith('/') ? input.targetPath : `/${input.targetPath}`

  const params: [string, string][] = []
  if (input.variantKey) params.push(['v', input.variantKey])

  // utm_source 一律由投放管道決定，不開放覆寫。
  // 業主 2026-09-11：覆寫會讓所有管道的 source 變成同一個值，
  // 與「勾 N 個管道產生 N 條可區分的連結」直接衝突，留一個就好。
  const source = CHANNEL_TO_SOURCE[input.channel] || 'website'
  const medium = CHANNEL_TO_MEDIUM[input.channel] || 'referral'

  params.push(['utm_source', source])
  params.push(['utm_medium', medium])
  params.push(['utm_campaign', input.utmCampaign])
  if (input.utmContent && input.utmContent.trim()) {
    params.push(['utm_content', input.utmContent.trim()])
  }

  const qs = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `${base}${path}?${qs}`
}

/** 一檔活動勾了 N 個管道就產出 N 條連結。 */
export function buildCampaignLinks(
  origin: string,
  campaign: {
    targetPath: string
    variantKey?: string | null
    utmCampaign: string
    channels: string[]
    utmContent?: string | null
  },
): { channel: string; url: string }[] {
  return (campaign.channels || []).map((channel) => ({
    channel,
    url: buildCampaignLink(origin, {
      targetPath: campaign.targetPath,
      variantKey: campaign.variantKey,
      utmCampaign: campaign.utmCampaign,
      channel,
      utmContent: campaign.utmContent,
    }),
  }))
}

// ── 變體摘要 ───────────────────────────────────────────────────────────
// 🔴 一律從 config 現算，不要寫死清單也不要抄 docs/廠商表單網址規範.md——
//    那份文件實測已經過期（漏了 gigabyte，又把 abbott/nanshan 誤寫成
//    「隱藏得知管道」，實際上這兩個 booking 變體都沒有設 hideSources）。
//    只要有人在設定檔加新變體，後台就會自己長出來。

export interface VariantSummary {
  key: string
  /** 給下拉選單用的一行字，例如「nanshan ─ 南山（不限年齡免費）」 */
  label: string
  company: string | null
  heroTitle: string | null
  /** 這個變體實際會改變的行為，已是人看得懂的中文 */
  effects: string[]
  leadSource: string | null
}

type AnyVariant = Record<string, any>

export function summarizeVariants(
  source: Record<string, AnyVariant>,
  kind: 'booking' | 'groupClass',
): VariantSummary[] {
  return Object.entries(source)
    .filter(([key]) => key !== 'default')
    .map(([key, v]) => {
      const effects: string[] = []
      if (v.hero) effects.push('專屬 Hero 文案')
      if (kind === 'booking') {
        if (v.allAgesFree) effects.push('不限年齡免費')
        if (v.lockStoreId) effects.push(`鎖定分店：${v.lockStoreId}`)
        if (v.extraSources?.length) effects.push(`追加得知管道：${v.extraSources.join('、')}`)
      } else {
        if (v.lockStore) effects.push(`鎖定分店：${v.lockStore}`)
        if (v.lockCourse) effects.push(`鎖定課程：${v.lockCourse}`)
      }
      if (v.hideSources) effects.push('隱藏得知管道')
      if (!effects.length) effects.push('僅做歸因，表單長相不變')

      const company = v.company || null
      const short = effects.filter((e) => e !== '專屬 Hero 文案')[0]
      return {
        key,
        label: company ? `${key} ─ ${company}${short ? `（${short}）` : ''}` : key,
        company,
        heroTitle: v.hero?.title || null,
        effects,
        leadSource: v.leadSource || null,
      }
    })
}
