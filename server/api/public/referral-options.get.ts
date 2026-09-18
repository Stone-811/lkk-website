import { getDb } from '~/server/utils/firebase'
import { DEFAULT_DYNAMIC_OPTIONS } from '~/config/referralSources'

/**
 * 「從哪裡得知練健康」裡三個下拉選單的選項（社群平台、實體活動、醫師／院所）。
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
      // 🔴 要區分「沒設定過」與「設定成空的」：
      //    欄位不存在 → 回 null，呼叫端退回預設清單
      //    欄位存在但沒有啟用中的 → 回空陣列，代表業主刻意清空，
      //      前台會把對應的主選項整個隱藏，而不是顯示空下拉
      const pick = (key: 'social' | 'event' | 'doctor'): string[] | null => {
        const list = raw[key]
        if (!Array.isArray(list)) return null
        return list
          .filter((o: any) => o && typeof o.label === 'string' && o.label.trim() && o.active !== false)
          .map((o: any) => o.label.trim())
      }

      return {
        success: true,
        data: {
          social: pick('social') ?? DEFAULT_DYNAMIC_OPTIONS.social,
          event: pick('event') ?? DEFAULT_DYNAMIC_OPTIONS.event,
          doctor: pick('doctor') ?? DEFAULT_DYNAMIC_OPTIONS.doctor,
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
