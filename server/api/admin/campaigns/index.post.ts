import { getDb, getTimestamp } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import { normalizeCampaignCode, validateCampaignCode } from '~/utils/campaignLinks'

/** 一次最多新增幾個活動代號。純防呆，避免貼錯整份文件進來。 */
const MAX_BATCH = 20
/** Firestore 的 in 查詢一次最多幾個值。保守取 10（舊版上限），分批查。 */
const IN_CHUNK = 10

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
    const targetPath = String(body.targetPath || '').trim()
    const channels: string[] = Array.isArray(body.channels) ? body.channels.filter(Boolean) : []

    /**
     * 一次可以建多筆：同一組（目標頁／變體／管道／素材）配上多個活動代號。
     *
     * 🔴 一律在伺服器端正規化成小寫，不信任前端。理由見 utils/campaignLinks.ts：
     *    useUtm 擷取參數時不做 lowercase，大小寫不同會在後台裂成兩個活動且無法回填。
     * ⚠️ 一個代號＝一筆文件。代號是名單對照活動的 join key，不能多筆共用一個代號，
     *    也不能一筆掛多個代號 —— 兩種做法都會讓成效混在一起。
     */
    const rawCodes: unknown[] = Array.isArray(body.utmCampaigns)
      ? body.utmCampaigns
      : [body.utmCampaign]
    const codes = [...new Set(rawCodes.map((c) => normalizeCampaignCode(String(c ?? ''))).filter(Boolean))]

    if (!name) throw createError({ statusCode: 400, message: '請填寫活動名稱' })
    if (!codes.length) throw createError({ statusCode: 400, message: '請填寫活動代號' })
    if (codes.length > MAX_BATCH) {
      throw createError({ statusCode: 400, message: `一次最多新增 ${MAX_BATCH} 個活動代號` })
    }
    for (const code of codes) {
      const codeError = validateCampaignCode(code)
      if (codeError) throw createError({ statusCode: 400, message: `「${code}」${codeError}` })
    }
    if (!targetPath.startsWith('/')) throw createError({ statusCode: 400, message: '請選擇目標頁面' })
    if (!channels.length) throw createError({ statusCode: 400, message: '請至少勾選一個投放管道' })

    // 活動代號必須唯一——它是與名單對照的 join key，重複會讓兩檔活動的成效混在一起。
    // ⚠️ 先把「全部」代號都查完再決定要不要寫，不要邊查邊寫：
    //    否則第三個代號撞名時，前兩個已經進資料庫了，業主要自己回頭刪。
    //    Firestore 的 in 查詢有筆數上限，分批查。
    const taken: string[] = []
    for (let i = 0; i < codes.length; i += IN_CHUNK) {
      const chunk = codes.slice(i, i + IN_CHUNK)
      const snap = await db.collection('campaigns').where('utmCampaign', 'in', chunk).get()
      snap.forEach((d: any) => taken.push(d.data()?.utmCampaign))
    }
    if (taken.length) {
      throw createError({
        statusCode: 400,
        message: `活動代號「${taken.join('、')}」已存在`,
      })
    }

    const now = Timestamp.now()
    const multi = codes.length > 1
    const batch = db.batch()
    const created: any[] = []

    for (const utmCampaign of codes) {
      const ref = db.collection('campaigns').doc()
      // ⚠️ 逐欄位列出（不要 {...body}）：避免前端多送的欄位被靜靜寫進資料庫。
      //    但列舉時務必涵蓋所有表單欄位——講師那組 API 就是漏了欄位導致新增時被丟掉。
      const data = {
        // 多筆時名稱後面接代號，否則列表上會出現一排一模一樣的名字分不出來。
        name: multi ? `${name}（${utmCampaign}）` : name,
        utmCampaign,
        targetPath,
        variantKey: body.variantKey ? String(body.variantKey).trim() : null,
        channels,
        utmContent: body.utmContent ? String(body.utmContent).trim() : null,
        note: body.note ? String(body.note).trim() : null,
        isActive: body.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      }
      batch.set(ref, data)
      created.push({ id: ref.id, ...data })
    }

    // 一次寫完或一筆都不寫，不會留下寫到一半的狀態
    await batch.commit()
    return { success: true, count: created.length, data: multi ? created : created[0] }
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create campaign',
    })
  }
})
