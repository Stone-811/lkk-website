// 後台側欄「客戶預約／團課預約／合作表單」旁的橘色數字：各自狀態為 new 的名單筆數。
//
// 2026-11-09 之前側欄是打 /api/admin/leads?status=new（沒帶 type），結果把三種表單的新名單
// 加總後掛在「客戶預約」旁（正式站當時 booking 2＋cooperation 1，顯示 3）。改成這支只回數字：
//   - 只取 type／storeId 兩欄，不把整份名單（姓名、電話…）載到瀏覽器只為了數筆數
//   - status == 'new' 是單欄位等值查詢，用 Firestore 自動索引，不需要新增複合索引
//   - 店員（store_staff 且有 storeId）照 index.get.ts 的同一條規則只算自己分店，
//     數字才會跟點進去看到的清單一致
//   - 合作表單頁同時列出舊的加盟名單（type=franchise），所以兩種一起算
// 權限：路徑在 /api/admin/leads 底下，admin-api-guard 已要求三個名單頁任一頁的權限。
export default defineEventHandler(async (event) => {
  try {
    const { getSession } = await import('~/server/utils/auth')
    const { getDb } = await import('~/server/utils/firebase')

    const session = await getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      return { success: false, error: '未登入' }
    }

    const db = await getDb()
    const snap = await db.collection('leads').where('status', '==', 'new').select('type', 'storeId').get()

    const counts = { booking: 0, group_class: 0, cooperation: 0 }
    for (const doc of snap.docs) {
      const d = doc.data()
      if (session.role === 'store_staff' && session.storeId && d.storeId !== session.storeId) continue
      if (d.type === 'booking') counts.booking++
      else if (d.type === 'group_class') counts.group_class++
      else if (d.type === 'cooperation' || d.type === 'franchise') counts.cooperation++
    }

    return { success: true, data: counts }
  } catch (error) {
    console.error('Error counting new leads:', error)
    setResponseStatus(event, 500)
    return { success: false, error: '取得新名單數失敗' }
  }
})
