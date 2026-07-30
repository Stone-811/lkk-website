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
    let leadsQuery = db.collection('leads').orderBy('createdAt', 'desc');

    // Build query based on filters
    // Note: Firestore doesn't support multiple inequality filters
    // So we fetch all and filter in memory for now
    const leadsSnapshot = await leadsQuery.limit(100).get();
    let leads = docsToArray<any>(leadsSnapshot);

    // Apply filters
    if (type) {
      leads = leads.filter(lead => lead.type === type);
    }
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
