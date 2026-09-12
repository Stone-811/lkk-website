import { getDb, docsToArray, CampaignDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

/** 流通中但沒有登記成活動的 utm_campaign。 */
interface UnregisteredCampaign {
  utmCampaign: string
  leadCount: number
  /** 名單裡出現過的 utm_source（例如 website、line） */
  sources: string[]
  /** 名單裡出現過的合作夥伴名稱（payload.company，例如「技嘉」） */
  companies: string[]
  /** 名單類型：booking / group-booking / cooperation / franchise */
  types: string[]
  firstSeen: string | null
  lastSeen: string | null
}

/**
 * 🔴 為什麼要回傳 unregistered：
 *    UTM 工具是 2026-09 才做的，在那之前已經有帶 ?v= 與 utm 的連結發給合作夥伴，
 *    那些連結一直在收名單，但後台的活動清單裡沒有它們，業主看不到也管不了。
 *    2026-09-12 實測正式站：campaigns 集合是空的，但名單裡有
 *    utm_campaign='abbott'（9 筆）與 'gigabyte-50plus-free-trial'（2 筆，公司=技嘉）。
 *
 *    所以這裡反過來從「真實名單」推回有哪些活動代號正在流通，
 *    扣掉已登記的，剩下的就是業主不知道自己有的連結。
 *
 * ⚠️ 這裡掃整個 leads 集合。2026-09-12 實測 prod 24 筆、dev 81 筆，
 *    而且這是後台頁面、不是公開端點，全掃的成本可以忽略。
 *    但名單是會長的——如果哪天超過數千筆，要改成
 *    「只掃最近 N 個月」或在匯入時維護彙總文件。屆時請一併調整這段註解。
 */
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

    const registered = new Set(campaigns.map((c) => c.utmCampaign).filter(Boolean))

    // 從真實名單推回流通中的活動代號
    const leadsSnap = await db.collection('leads').select('payload', 'type', 'createdAt').get()
    const acc = new Map<string, UnregisteredCampaign>()

    leadsSnap.forEach((doc: any) => {
      const d = doc.data() || {}
      const payload = d.payload || {}
      const code = String(payload?.utm?.campaign || '').trim()
      if (!code || registered.has(code)) return

      let row = acc.get(code)
      if (!row) {
        row = {
          utmCampaign: code,
          leadCount: 0,
          sources: [],
          companies: [],
          types: [],
          firstSeen: null,
          lastSeen: null,
        }
        acc.set(code, row)
      }

      row.leadCount += 1

      const src = String(payload?.utm?.source || '').trim()
      if (src && !row.sources.includes(src)) row.sources.push(src)

      const company = String(payload?.company || '').trim()
      if (company && !row.companies.includes(company)) row.companies.push(company)

      const type = String(d.type || '').trim()
      if (type && !row.types.includes(type)) row.types.push(type)

      // createdAt 是 Firestore Timestamp；toDate 不一定存在（可能是字串），兩種都擋
      const ts = d.createdAt
      const iso =
        ts && typeof ts.toDate === 'function'
          ? ts.toDate().toISOString()
          : typeof ts === 'string'
            ? ts
            : null
      if (iso) {
        if (!row.firstSeen || iso < row.firstSeen) row.firstSeen = iso
        if (!row.lastSeen || iso > row.lastSeen) row.lastSeen = iso
      }
    })

    const unregistered = Array.from(acc.values()).sort((a, b) => b.leadCount - a.leadCount)

    return { success: true, data: campaigns, unregistered }
  } catch (error: any) {
    console.error('[Admin Campaigns GET] Error:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Firestore 錯誤: ${error.message}`,
    })
  }
})
