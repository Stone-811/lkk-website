import { getDb, StoreDoc, docsToArray } from '~/server/utils/firebase';
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
    console.log('[Admin Stores GET] Connecting to Firestore...');
    const db = await getDb();
    console.log('[Admin Stores GET] Firestore connected, querying stores...');

    const storesSnapshot = await db
      .collection('stores')
      .orderBy('sortOrder', 'asc')
      .get();

    console.log(`[Admin Stores GET] Found ${storesSnapshot.size} stores in Firestore`);
    const stores = docsToArray<StoreDoc>(storesSnapshot);

    // Get coach counts
    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const coachesSnapshot = await db
          .collection('coaches')
          .where('storeId', '==', store.id)
          .count()
          .get();

        return {
          ...store,
          coachCount: coachesSnapshot.data().count,
        };
      })
    );

    return {
      success: true,
      data: storesWithCounts,
      _debug: {
        source: 'firestore',
        count: storesWithCounts.length,
      },
    };
  } catch (error: any) {
    console.error('[Admin Stores GET] Error:', error.message);
    console.error('[Admin Stores GET] Full error:', error);

    // Return error details instead of fallback data
    throw createError({
      statusCode: 500,
      statusMessage: `Firestore 錯誤: ${error.message}`,
    });
  }
});
