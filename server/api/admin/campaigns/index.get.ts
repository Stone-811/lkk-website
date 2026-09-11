import { getDb, docsToArray, CampaignDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  try {
    const db = await getDb()
    // 只 orderBy 單一欄位、不帶 where → 走自動單欄位索引，不必補 firestore.indexes.json
    const snapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').get()
    const campaigns = docsToArray<CampaignDoc>(snapshot)

    return { success: true, data: campaigns }
  } catch (error: any) {
    console.error('[Admin Campaigns GET] Error:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Firestore 錯誤: ${error.message}`,
    })
  }
})
