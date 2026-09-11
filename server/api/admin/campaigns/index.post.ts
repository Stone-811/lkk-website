import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { normalizeCampaignCode, validateCampaignCode } from '~/utils/campaignLinks'

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
    const targetPath = String(body.targetPath || '').trim()
    const channels: string[] = Array.isArray(body.channels) ? body.channels.filter(Boolean) : []

    if (!name) throw createError({ statusCode: 400, message: '請填寫活動名稱' })
    const codeError = validateCampaignCode(utmCampaign)
    if (codeError) throw createError({ statusCode: 400, message: codeError })
    if (!targetPath.startsWith('/')) throw createError({ statusCode: 400, message: '請選擇目標頁面' })
    if (!channels.length) throw createError({ statusCode: 400, message: '請至少勾選一個投放管道' })

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
      targetPath,
      variantKey: body.variantKey ? String(body.variantKey).trim() : null,
      channels,
      utmSourceOverride: body.utmSourceOverride ? String(body.utmSourceOverride).trim() : null,
      utmContent: body.utmContent ? String(body.utmContent).trim() : null,
      partner: body.partner ? String(body.partner).trim() : null,
      note: body.note ? String(body.note).trim() : null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
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
