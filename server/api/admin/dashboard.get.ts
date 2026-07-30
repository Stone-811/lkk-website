import { getDb } from '~/server/utils/firebase';
import { getSession } from '~/server/utils/auth';

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

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
    const thisMonthCooperations = thisMonthLeads.filter(lead => lead.type === 'cooperation');
    const thisMonthFranchises = thisMonthLeads.filter(lead => lead.type === 'franchise');

    // Get store count
    const storesSnapshot = await db.collection('stores').where('isActive', '==', true).get();
    const storeCount = storesSnapshot.size;

    // Get coach count
    const coachesSnapshot = await db.collection('coaches').where('isActive', '==', true).get();
    const coachCount = coachesSnapshot.size;

    // Get recent leads (last 10)
    const recentLeadsSnapshot = await db
      .collection('leads')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    // Build store ID -> name map
    const storeMap: Record<string, string> = {};
    storesSnapshot.docs.forEach(doc => {
      storeMap[doc.id] = doc.data().name;
    });

    const recentLeads = recentLeadsSnapshot.docs.map(doc => {
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
          thisMonthCooperations: thisMonthCooperations.length,
          thisMonthFranchises: thisMonthFranchises.length,
          storeCount,
          coachCount,
          totalLeads: allLeads.length,
        },
        recentLeads,
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
