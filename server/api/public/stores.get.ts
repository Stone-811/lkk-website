import { getDb, StoreDoc, docsToArray } from '~/server/utils/firebase';
import { fallbackStores, fallbackCoaches } from '~/server/utils/fallback-data';

function getFallbackStoresWithCounts() {
  return fallbackStores.map((store) => ({
    ...store,
    googleMapUrl: null,
    businessHours: null,
    transportation: null,
    heroImage: null,
    galleryImages: [],
    coachCount: fallbackCoaches[store.slug]?.length || 0,
  }));
}

export default defineEventHandler(async () => {
  try {
    console.log('[Public Stores GET] Connecting to Firestore...');
    const db = await getDb();
    console.log('[Public Stores GET] Firestore connected, querying active stores...');

    // Get active stores ordered by sortOrder
    const storesSnapshot = await db
      .collection('stores')
      .where('isActive', '==', true)
      .orderBy('sortOrder', 'asc')
      .get();

    console.log(`[Public Stores GET] Found ${storesSnapshot.size} active stores in Firestore`);
    const stores = docsToArray<StoreDoc>(storesSnapshot);

    // If no stores in Firestore, use fallback
    if (stores.length === 0) {
      console.log('[Public Stores GET] No stores in Firestore, using fallback data');
      return {
        success: true,
        data: getFallbackStoresWithCounts(),
        _debug: {
          source: 'fallback',
          reason: 'no_stores_in_firestore',
        },
      };
    }

    // Get coach counts for each store
    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const coachesSnapshot = await db
          .collection('coaches')
          .where('storeId', '==', store.id)
          .where('isActive', '==', true)
          .count()
          .get();

        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          city: store.city,
          district: store.district,
          address: store.address,
          phone: store.phone,
          googleMapUrl: store.googleMapUrl,
          businessHours: store.businessHours,
          transportation: store.transportation,
          heroImage: store.images?.[0] || null,
          galleryImages: store.images || [],
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
    console.error('[Public Stores GET] Error:', error.message);
    console.error('[Public Stores GET] Full error:', error);
    // Use fallback on error (for public API, we want to show something)
    return {
      success: true,
      data: getFallbackStoresWithCounts(),
      _debug: {
        source: 'fallback',
        reason: 'error',
        error: error.message,
      },
    };
  }
});
