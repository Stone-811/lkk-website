export default defineEventHandler(async (event) => {
  try {
    // Dynamic imports to avoid bundling issues
    const { getSession } = await import('~/server/utils/auth');
    const { getDb, docsToArray } = await import('~/server/utils/firebase');

    // Check authentication
    const session = await getSession(event);
    if (!session) {
      setResponseStatus(event, 401);
      return { success: false, error: '未登入' };
    }

    const query = getQuery(event);
    const type = query.type as string | undefined;
    const status = query.status as string | undefined;

    const db = await getDb();

    // 🔴 type 一定要用 Firestore 的 where 篩，不能抓回來再用 JS 篩。
    //
    //    2026-10-16 的事故：原本是「抓最新 100 筆（不分 type）→ 在記憶體裡篩 type」。
    //    booking 的量遠大於其他表單（當時 198 : 5 : 3），10/06 之後新進的 booking
    //    就把最新 100 筆整個塞滿，合作洽詢最新的那筆（10/05）掉到窗外 ——
    //    /admin/cooperation 變成全空，但 Firestore 裡三筆都還在。
    //    這種壞法**不會報錯**：API 回 200、data 是 []，畫面只顯示「沒有名單」。
    //
    //    複合索引 (type ASC, createdAt DESC) 已宣告在 firestore.indexes.json，
    //    lkkdev／lkkprod 都已部署，這個查詢不需要再建索引。
    let leadsQuery = type
      ? db.collection('leads').where('type', '==', type).orderBy('createdAt', 'desc')
      : db.collection('leads').orderBy('createdAt', 'desc');

    // 篩完 type 之後才套上限。cooperation／franchise／group_class 的量體幾年內都碰不到；
    // 只有 booking 會成長，接近時下面的 warn 會先出現在 Cloud Run log 裡。
    const MAX_LEADS = 1000;
    const leadsSnapshot = await leadsQuery.limit(MAX_LEADS).get();
    let leads = docsToArray<any>(leadsSnapshot);

    if (leads.length === MAX_LEADS) {
      // 這一行是「名單又開始被截斷」的早期警訊，不要刪。改成分頁才是真正的解法。
      console.warn(`[leads] type=${type || 'all'} 已達上限 ${MAX_LEADS} 筆，較舊的名單不會回傳`);
    }

    // status 仍在記憶體裡篩：前台四個頁面都沒有在用這個參數，
    // 而 type + status + createdAt 三欄要再多一個複合索引。等真的要用再加。
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }

    // Store staff can only see leads for their store
    if (session.role === 'store_staff' && session.storeId) {
      leads = leads.filter(lead => lead.storeId === session.storeId);
    }

    return {
      success: true,
      data: leads.map(lead => ({
        ...lead,
        // Convert Timestamp to ISO string for JSON
        createdAt: lead.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: lead.updatedAt?.toDate?.()?.toISOString() || null,
      })),
    };
  } catch (error) {
    console.error('Error fetching leads:', error);
    setResponseStatus(event, 500);
    return { success: false, error: '取得名單失敗' };
  }
});
