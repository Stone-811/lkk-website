import { getDb } from '~/server/utils/firebase';
import { getSession } from '~/server/utils/auth';
import { canAccessAdminPath } from '~/utils/adminAccess';

// 「最新名單」只給有名單頁權限的帳號（2026-10-16 業主決定）。
// 儀表板本身開放給所有登入者（admin-api-guard 是 ANY_AUTH），原本會把最近 10 筆
// 客戶的姓名、分店、遮罩電話回給沒有任何名單權限的帳號（例如只管教練與分店的帳號）。
// 判斷與側欄選單用同一個函式，兩邊不會走鐘；admin 與舊角色的結果不變。
const LEAD_PAGES = ['/admin/leads', '/admin/group-classes', '/admin/cooperation'];

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入',
    });
  }

  try {
    const db = await getDb();

    // 🔴 「本月」的區間必須用台北時間算，不能用 new Date(y, m, 1)。
    //    那個寫法取的是**伺服器本地時區**的月初，而 Cloud Run 跑在 UTC ——
    //    算出來是 UTC 的 10/01 00:00，換算台北時間已經是 10/01 早上八點。
    //    結果：台北時間 10/01 凌晨到早上八點之間送出的名單會被當成「上個月」而漏掉。
    //
    //    2026-10-02 業主回報「本月預約體驗顯示 10 筆，但表單有 12 筆」，
    //    差的兩筆正是 10/01 04:44 與 05:07 —— 剛好落在這個八小時的缺口裡。
    //
    //    ⚠️ 這個 bug 在開發者本機看不出來：本機時區就是 Asia/Taipei，算出來永遠是對的。
    //       只有部署到 Cloud Run 才會發作。
    //
    //    台灣自 1979 年起沒有日光節約時間，固定 UTC+8，所以用固定位移是精確的，
    //    不需要引進時區函式庫。
    const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
    const nowTaipei = new Date(Date.now() + TAIPEI_OFFSET_MS);
    const startOfMonth = new Date(
      Date.UTC(nowTaipei.getUTCFullYear(), nowTaipei.getUTCMonth(), 1) - TAIPEI_OFFSET_MS
    );
    const endOfMonth = new Date(
      Date.UTC(nowTaipei.getUTCFullYear(), nowTaipei.getUTCMonth() + 1, 1) - TAIPEI_OFFSET_MS - 1
    );

    // Fetch all leads
    const leadsSnapshot = await db.collection('leads').get();
    const allLeads = leadsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate stats
    const thisMonthLeads = allLeads.filter(lead => {
      const createdAt = lead.createdAt?.toDate?.() || new Date(lead.createdAt);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    });

    const pendingLeads = allLeads.filter(lead => lead.status === 'new');

    const thisMonthBookings = thisMonthLeads.filter(lead => lead.type === 'booking');
    // 團課報名表單寫入的是 type:'group_class'（見 server/api/leads/group-class.post.ts）
    const thisMonthGroupClasses = thisMonthLeads.filter(lead => lead.type === 'group_class');
    const thisMonthCooperations = thisMonthLeads.filter(lead => lead.type === 'cooperation');
    // 加盟洽詢 2026-10-02 起不在儀表板顯示，但統計保留 —— 名單本身還在，日後要加回來不必改這支
    const thisMonthFranchises = thisMonthLeads.filter(lead => lead.type === 'franchise');

    // Get store count
    const storesSnapshot = await db.collection('stores').where('isActive', '==', true).get();
    const storeCount = storesSnapshot.size;

    // Get coach count
    const coachesSnapshot = await db.collection('coaches').where('isActive', '==', true).get();
    const coachCount = coachesSnapshot.size;

    const canViewLeads = LEAD_PAGES.some((p) => canAccessAdminPath(session, p));

    // Get recent leads (last 10) —— 沒有名單權限就不查、不回
    const recentLeadsSnapshot = canViewLeads
      ? await db.collection('leads').orderBy('createdAt', 'desc').limit(10).get()
      : null;

    // Build store ID -> name map
    const storeMap: Record<string, string> = {};
    storesSnapshot.docs.forEach(doc => {
      storeMap[doc.id] = doc.data().name;
    });

    const recentLeads = (recentLeadsSnapshot?.docs ?? []).map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      return {
        id: doc.id,
        name: data.name,
        phone: data.phone ? data.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1-XXX-$3') : '-',
        type: data.type,
        storeId: data.storeId,
        storeName: data.storeId ? (storeMap[data.storeId] || data.storeId) : '-',
        status: data.status,
        createdAt: createdAt.toISOString(),
      };
    });

    return {
      success: true,
      data: {
        stats: {
          thisMonthLeads: thisMonthLeads.length,
          pendingLeads: pendingLeads.length,
          thisMonthBookings: thisMonthBookings.length,
          thisMonthGroupClasses: thisMonthGroupClasses.length,
          thisMonthCooperations: thisMonthCooperations.length,
          thisMonthFranchises: thisMonthFranchises.length,
          storeCount,
          coachCount,
          totalLeads: allLeads.length,
        },
        recentLeads,
        // 前端依這個決定要不要顯示「最新名單」整個區塊（false 時連標題都不出現）
        canViewLeads,
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '載入儀表板資料失敗',
    });
  }
});
