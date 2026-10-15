import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { normalizeCampaignCode, validateCampaignCode } from '~/utils/campaignLinks'
import { normalizeUtmSource, UTM_SOURCE_RE, GA4_MEDIUM_VALUES } from '~/config/utmChannels'
import { campaignLinkKey, type CampaignLink } from '~/utils/campaignLinks'

/** 一檔活動最多幾條連結。純防呆。 */
const MAX_LINKS = 40

/** 逐欄位取出，不要整包存進去 —— 前端多送的欄位不該靜靜寫進資料庫。 */
function sanitizeLinks(raw: any): CampaignLink[] {
  if (!Array.isArray(raw)) return []
  return raw.map((l: any) => ({
    targetPath: String(l?.targetPath || '').trim(),
    variantKey: l?.variantKey ? String(l.variantKey).trim() : null,
    utmSource: normalizeUtmSource(l?.utmSource),
    utmMedium: String(l?.utmMedium || '').trim(),
    utmContent: l?.utmContent ? String(l.utmContent).trim() : null,
  }))
}

function validateLinks(links: CampaignLink[]): string | null {
  if (!links.length) return '請至少新增一條連結'
  if (links.length > MAX_LINKS) return `一檔活動最多 ${MAX_LINKS} 條連結`

  const seen = new Set<string>()
  for (const l of links) {
    if (!l.targetPath.startsWith('/')) return '表單路徑不正確'
    if (!l.utmSource) return '請選擇 utm_source'
    if (!UTM_SOURCE_RE.test(l.utmSource)) {
      return `utm_source「${l.utmSource}」只能用小寫英文、數字、- 與 _`
    }
    // 🔴 medium 一定要在白名單內。清單外的值會讓那批流量在 GA4 永久歸到
    //    Unassigned，而且歷史資料改不回來。前端的下拉擋一次，這裡再擋一次。
    if (!GA4_MEDIUM_VALUES.includes(l.utmMedium)) return `utm_medium「${l.utmMedium}」不在允許清單內`

    // 完全相同的組合會產出一模一樣的網址，留著只會讓人困惑
    const k = campaignLinkKey(l)
    if (seen.has(k)) return '有重複的連結組合（表單、變體、來源、性質、素材都相同）'
    seen.add(k)
  }
  return null
}

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (
      !session ||
      (!['admin', 'editor'].includes(session.role) && !hasPagePermission(session, '/admin/campaigns'))
    ) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const db = await getDb()
    const Timestamp = await getTimestamp()
    const body = await readBody(event)

    const name = String(body.name || '').trim()
    // 🔴 一律在伺服器端正規化成小寫，不信任前端。理由見 utils/campaignLinks.ts：
    //    useUtm 擷取參數時不做 lowercase，大小寫不同會在後台裂成兩個活動且無法回填。
    const utmCampaign = normalizeCampaignCode(body.utmCampaign)
    // 一檔活動（一個代號）底下掛 N 條各自獨立的連結
    const links = sanitizeLinks(body.links)

    if (!name) throw createError({ statusCode: 400, message: '請填寫活動名稱' })
    const codeError = validateCampaignCode(utmCampaign)
    if (codeError) throw createError({ statusCode: 400, message: codeError })
    const linkError = validateLinks(links)
    if (linkError) throw createError({ statusCode: 400, message: linkError })

    // 活動代號必須唯一——它是與名單對照的 join key，重複會讓兩檔活動的成效混在一起
    const dup = await db.collection('campaigns').where('utmCampaign', '==', utmCampaign).limit(1).get()
    if (!dup.empty) {
      throw createError({ statusCode: 400, message: `活動代號「${utmCampaign}」已存在` })
    }

    const now = Timestamp.now()
    const ref = db.collection('campaigns').doc()
    // ⚠️ 逐欄位列出（不要 {...body}）：避免前端多送的欄位被靜靜寫進資料庫。
    //    但列舉時務必涵蓋所有表單欄位——講師那組 API 就是漏了欄位導致新增時被丟掉。
    const data = {
      name,
      utmCampaign,
      links,
      note: body.note ? String(body.note).trim() : null,
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    }

    await ref.set(data)
    return { success: true, data: { id: ref.id, ...data } }
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create campaign',
    })
  }
})
