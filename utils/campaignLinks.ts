import { DEFAULT_UTM_CHANNELS, type UtmChannel } from '~/config/utmChannels'

// UTM 活動連結：純函式，前後端共用。
//
// 🔴 為什麼連結「不存進 Firestore」，每次現算：
//    dev 與 prod 的網域不同（apphosting.yaml 各自設 NUXT_PUBLIC_SITE_URL）。
//    如果把組好的完整網址存進資料庫，在 dev 後台建的活動會產出指向
//    lkk-website-dev--lkkdev.asia-east1.hosted.app 的連結；那串連結被複製出去投放後，
//    名單會全部進 lkkdev，正式站一筆都收不到，而且沒有任何錯誤訊息。
//    所以 DB 只存「參數」，網域與組裝都在讀取當下決定。

/**
 * 投放管道 → utm_source／utm_medium。
 *
 * 🔴 2026-10-15 起這份對應**不再寫死在程式碼裡** —— 業主可在後台
 *    「UTM 活動」頁自行新增管道，清單存在 Firestore `settings/utmChannels`。
 *    程式裡的預設值與型別在 config/utmChannels.ts，那份同時也是讀不到時的退路。
 *
 * 所以 buildCampaignLink 需要知道「現在有哪些管道」，由呼叫端傳進來；
 * 沒傳就退回 DEFAULT_UTM_CHANNELS，行為與 2026-10-15 之前完全相同。
 */
function resolveChannel(channels: readonly UtmChannel[], label: string): UtmChannel {
  return (
    channels.find((c) => c.label === label) ||
    DEFAULT_UTM_CHANNELS.find((c) => c.label === label) ||
    // 連預設清單都沒有（管道被停用後才編輯舊活動，或資料不一致）：
    // 退回 website/referral，與舊版相同。寧可產出一條可用但歸因偏泛的連結，
    // 也不要讓後台整頁因為一個找不到的管道而壞掉。
    { label, source: 'website', medium: 'referral' }
  )
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
  /** utm_source */
  utmSource: string
  /** utm_medium */
  utmMedium: string
  /** utm_content，用來區分同一檔活動的不同素材 */
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
  params.push(['utm_source', input.utmSource])
  params.push(['utm_medium', input.utmMedium])
  params.push(['utm_campaign', input.utmCampaign])
  if (input.utmContent && input.utmContent.trim()) {
    params.push(['utm_content', input.utmContent.trim()])
  }

  const qs = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `${base}${path}?${qs}`
}

/**
 * 一檔活動的所有連結。
 *
 * 2026-10-15 起的模型：一檔活動有**一組** utm_source／utm_medium，
 * 但可以掛**多張表單**（/booking 與 /group-booking），每張表單一條連結、
 * 各自可以有自己的變體（兩張表單的變體設定檔是不同的兩份）。
 *
 * ⚠️ 要相容舊資料。2026-10-15 之前的活動長這樣：
 *      { targetPath: '/booking', variantKey: 'nanshan', channels: ['LINE','Email'] }
 *    那是「一張表單 × N 個管道 ＝ N 條連結」。那些活動的連結已經發出去了，
 *    必須原樣組得回來，否則後台列表上的舊連結會跟實際流通的不一致。
 *    所以舊欄位的路徑保留，見 buildLegacyCampaignLinks。
 */
export interface CampaignRecord {
  /** 新模型：可掛多張表單 */
  targetPaths?: string[]
  /** 新模型：每張表單各自的變體 { '/booking': 'nanshan' } */
  variantKeys?: Record<string, string | null>
  utmSource?: string
  utmMedium?: string
  utmCampaign: string
  utmContent?: string | null
  /** 舊模型欄位，只為了相容既有資料 */
  targetPath?: string
  variantKey?: string | null
  channels?: string[]
}

export function buildCampaignLinks(
  origin: string,
  campaign: CampaignRecord,
  channelDefs: readonly UtmChannel[] = DEFAULT_UTM_CHANNELS,
): { label: string; url: string }[] {
  // 舊資料：沒有 utmSource 就代表是 2026-10-15 之前建的，走舊的「管道」路徑
  if (!campaign.utmSource) return buildLegacyCampaignLinks(origin, campaign, channelDefs)

  const paths = campaign.targetPaths?.length
    ? campaign.targetPaths
    : [campaign.targetPath || '/booking']

  return paths.map((targetPath) => ({
    label: targetPath,
    url: buildCampaignLink(origin, {
      targetPath,
      variantKey: campaign.variantKeys?.[targetPath] ?? null,
      utmCampaign: campaign.utmCampaign,
      utmSource: campaign.utmSource!,
      utmMedium: campaign.utmMedium || 'referral',
      utmContent: campaign.utmContent,
    }),
  }))
}

/** 2026-10-15 之前的活動：一張表單 × N 個管道。只為了讓舊紀錄的連結原樣組得回來。 */
function buildLegacyCampaignLinks(
  origin: string,
  campaign: CampaignRecord,
  channelDefs: readonly UtmChannel[],
): { label: string; url: string }[] {
  const targetPath = campaign.targetPath || '/booking'
  return (campaign.channels || []).map((channel) => {
    const { source, medium } = resolveChannel(channelDefs, channel)
    return {
      label: channel,
      url: buildCampaignLink(origin, {
        targetPath,
        variantKey: campaign.variantKey,
        utmCampaign: campaign.utmCampaign,
        utmSource: source,
        utmMedium: medium,
        utmContent: campaign.utmContent,
      }),
    }
  })
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
      // 顯示名稱優先序：company（絕大多數變體都有）→ adminLabel（公司由 ?co= 決定、
      // 變體本身不具名時填這個，例如 freetrial）→ 只剩代號。
      // 不要在這裡特判代號字串，否則每多一個不具名變體就要再改一次這支工具函式。
      const display = company || v.adminLabel || null
      // 特性括號只在「顯示的是公司名」時才加 —— 公司名不會說明變體在做什麼，需要補。
      // adminLabel 是專為這個下拉寫的描述（例如「不限年齡體驗表單」），本身就說明了特性，
      // 再補一次會變成「不限年齡體驗表單（不限年齡免費）」。
      const suffix = company && short ? `（${short}）` : ''
      return {
        key,
        label: display ? `${key} ─ ${display}${suffix}` : key,
        company,
        heroTitle: v.hero?.title || null,
        effects,
        leadSource: v.leadSource || null,
      }
    })
}
