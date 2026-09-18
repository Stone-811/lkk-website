import { getDb } from '~/server/utils/firebase'
import { DEFAULT_DYNAMIC_OPTIONS } from '~/config/referralSources'

/**
 * 「從哪裡得知練健康」裡兩個下拉選單的選項（社群平台、實體活動）。
 *
 * 🔴 這支永遠不能讓表單壞掉。
 *    選項讀不到時要退回程式裡的預設值，而不是回錯誤 ——
 *    Firestore 出問題不該讓人送不出預約表單。所以整段包 try/catch，
 *    任何失敗都回預設值並標記 source，方便之後排查。
 *
 * ⚠️ 只回傳「啟用中」的選項。停用的選項不再顯示給新填表的人，
 *    但既有名單裡的值不受影響（那些字串已經存進去了，也改不了）。
 */
export default defineCachedEventHandler(
  async () => {
    const fallback = {
      success: true,
      data: DEFAULT_DYNAMIC_OPTIONS,
      source: 'default' as const,
    }
    try {
      const db = await getDb()
      const doc = await db.collection('settings').doc('referralOptions').get()
      if (!doc.exists) return fallback

      const raw: any = doc.data() || {}
      const pick = (key: 'social' | 'event'): string[] | null => {
        const list = raw[key]
        if (!Array.isArray(list)) return null
        const active = list
          .filter((o: any) => o && typeof o.label === 'string' && o.label.trim() && o.active !== false)
          .map((o: any) => o.label.trim())
        return active.length ? active : null
      }

      return {
        success: true,
        data: {
          social: pick('social') ?? DEFAULT_DYNAMIC_OPTIONS.social,
          event: pick('event') ?? DEFAULT_DYNAMIC_OPTIONS.event,
        },
        source: 'firestore' as const,
      }
    } catch (error: any) {
      console.error('[Referral Options] 讀取失敗，改用預設值:', error?.message)
      return fallback
    }
  },
  {
    // 業主改完選項不必等太久；表單本身也有 CDN 快取，這裡不用太短
    maxAge: 60,
    swr: true,
    getKey: () => 'referral-options',
  }
)
