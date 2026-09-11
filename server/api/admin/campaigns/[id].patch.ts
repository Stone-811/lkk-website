import { getDb, getTimestamp, docToObject, CampaignDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { normalizeCampaignCode, validateCampaignCode } from '~/utils/campaignLinks'

// 🔴 白名單：只有這些欄位能被更新。
//    講師那組的 [id].patch.ts 是 `{...body}` 沒有白名單，連 id 與 createdAt 都能被蓋掉，
//    這裡刻意不照抄。
const UPDATABLE = [
  'name',
  'utmCampaign',
  'targetPath',
  'variantKey',
  'channels',
  'utmContent',
  'note',
  'isActive',
] as const

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (
      !session ||
      (!['admin', 'editor'].includes(session.role) && !hasPagePermission(session, '/admin/campaigns'))
    ) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing campaign ID' })

    const db = await getDb()
    const Timestamp = await getTimestamp()
    const body = await readBody(event)

    const ref = db.collection('campaigns').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw createError({ statusCode: 404, message: 'Campaign not found' })

    const updateData: Record<string, unknown> = {}
    for (const key of UPDATABLE) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }

    if (updateData.utmCampaign !== undefined) {
      const code = normalizeCampaignCode(String(updateData.utmCampaign))
      const codeError = validateCampaignCode(code)
      if (codeError) throw createError({ statusCode: 400, message: codeError })

      const dup = await db.collection('campaigns').where('utmCampaign', '==', code).limit(1).get()
      if (!dup.empty && dup.docs[0].id !== id) {
        throw createError({ statusCode: 400, message: `活動代號「${code}」已存在` })
      }
      updateData.utmCampaign = code
    }

    if (updateData.channels !== undefined) {
      const ch = Array.isArray(updateData.channels) ? updateData.channels.filter(Boolean) : []
      if (!ch.length) throw createError({ statusCode: 400, message: '請至少勾選一個投放管道' })
      updateData.channels = ch
    }

    if (!Object.keys(updateData).length) {
      throw createError({ statusCode: 400, message: '沒有要更新的欄位' })
    }

    updateData.updatedAt = Timestamp.now()
    await ref.update(updateData)

    const updated = await ref.get()
    return { success: true, data: docToObject<CampaignDoc>(updated) }
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update campaign',
    })
  }
})
