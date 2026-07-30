import { getDb, CoachDoc, StoreDoc, docsToArray } from '~/server/utils/firebase';
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
    console.log('[Admin Coaches GET] Connecting to Firestore...');
    const db = await getDb();
    console.log('[Admin Coaches GET] Firestore connected, querying coaches...');

    const coachesSnapshot = await db
      .collection('coaches')
      .orderBy('sortOrder', 'asc')
      .get();

    console.log(`[Admin Coaches GET] Found ${coachesSnapshot.size} coaches in Firestore`);
    const coaches = docsToArray<CoachDoc>(coachesSnapshot);

    // Get store info for each coach
    const storeIds = [...new Set(coaches.map(c => c.storeId).filter(Boolean))];
    const storesMap: Record<string, { id: string; name: string; slug: string }> = {};

    for (const storeId of storeIds) {
      if (storeId) {
        const storeDoc = await db.collection('stores').doc(storeId).get();
        if (storeDoc.exists) {
          const data = storeDoc.data() as StoreDoc;
          storesMap[storeId] = { id: storeDoc.id, name: data.name, slug: data.slug };
        }
      }
    }

    const coachesWithStore = coaches.map((coach) => ({
      ...coach,
      store: coach.storeId ? storesMap[coach.storeId] || null : null,
    }));

    return {
      success: true,
      data: coachesWithStore,
      _debug: {
        source: 'firestore',
        count: coachesWithStore.length,
      },
    };
  } catch (error: any) {
    console.error('[Admin Coaches GET] Error:', error.message);
    console.error('[Admin Coaches GET] Full error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: `Firestore 錯誤: ${error.message}`,
    });
  }
});
