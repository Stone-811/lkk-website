import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { normalizeCampaignCode, validateCampaignCode } from '~/utils/campaignLinks'
import { normalizeUtmSource, UTM_SOURCE_RE, GA4_MEDIUM_VALUES } from '~/config/utmChannels'

/** 只留下「這次真的有選的表單」對應的變體，避免前端多送的鍵被寫進資料庫。 */
function sanitizeVariantKeys(raw: any, targetPaths: string[]): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  for (const p of targetPaths) {
    const v = raw && typeof raw === 'object' ? raw[p] : null
    out[p] = v ? String(v).trim() : null
  }
  return out
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
    // 一檔活動可以掛多張表單（/booking 與 /group-booking），每張一條連結
    const targetPaths: string[] = Array.isArray(body.targetPaths)
      ? body.targetPaths.map((p: any) => String(p || '').trim()).filter(Boolean)
      : []
    // utm_source 與 utm_medium 是獨立的兩個維度，各選一個。
    // 🔴 不要用 source 去推 medium：同一個 source 配不同 medium 都合法
    //    （google/cpc 是廣告、google/organic 是自然搜尋），該填什麼取決於
    //    業主實際做了什麼，程式推不出來。
    const utmSource = normalizeUtmSource(body.utmSource)
    const utmMedium = String(body.utmMedium || '').trim()

    if (!name) throw createError({ statusCode: 400, message: '請填寫活動名稱' })
    const codeError = validateCampaignCode(utmCampaign)
    if (codeError) throw createError({ statusCode: 400, message: codeError })
    if (!targetPaths.length) throw createError({ statusCode: 400, message: '請至少選一張表單' })
    if (targetPaths.some((p) => !p.startsWith('/'))) {
      throw createError({ statusCode: 400, message: '表單路徑不正確' })
    }
    if (!utmSource) throw createError({ statusCode: 400, message: '請選擇 utm_source' })
    if (!UTM_SOURCE_RE.test(utmSource)) {
      throw createError({ statusCode: 400, message: 'utm_source 只能用小寫英文、數字、- 與 _' })
    }
    if (!GA4_MEDIUM_VALUES.includes(utmMedium)) {
      throw createError({ statusCode: 400, message: '請選擇 utm_medium' })
    }

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
      targetPaths,
      // 每張表單各自的變體 —— 兩張表單讀的是不同的變體設定檔，不能共用一個 key
      variantKeys: sanitizeVariantKeys(body.variantKeys, targetPaths),
      utmSource,
      utmMedium,
      utmContent: body.utmContent ? String(body.utmContent).trim() : null,
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
