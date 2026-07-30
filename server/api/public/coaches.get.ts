import { getDb, CoachDoc, StoreDoc, docsToArray } from '~/server/utils/firebase';
import { fallbackStores, fallbackCoaches } from '~/server/utils/fallback-data';

function getAllFallbackCoaches() {
  const allCoaches: any[] = [];
  for (const [storeSlug, coaches] of Object.entries(fallbackCoaches)) {
    const store = fallbackStores.find(s => s.slug === storeSlug);
    for (const coach of coaches) {
      allCoaches.push({
        ...coach,
        storeId: storeSlug,
        store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
      });
    }
  }
  return allCoaches;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const storeSlug = query.store as string | undefined;

  try {
    console.log('[Public Coaches GET] Connecting to Firestore...');
    const db = await getDb();
    console.log('[Public Coaches GET] Firestore connected');

    let coachesQuery = db.collection('coaches').where('isActive', '==', true);

    // If filtering by store, find store first
    let storeId: string | undefined;
    if (storeSlug) {
      console.log(`[Public Coaches GET] Looking for store with slug: ${storeSlug}`);
      const storeSnapshot = await db
        .collection('stores')
        .where('slug', '==', storeSlug)
        .limit(1)
        .get();

      if (!storeSnapshot.empty) {
        storeId = storeSnapshot.docs[0].id;
        console.log(`[Public Coaches GET] Found store with id: ${storeId}`);
        coachesQuery = coachesQuery.where('storeId', '==', storeId);
      } else {
        console.log(`[Public Coaches GET] Store not found in Firestore, using fallback`);
        // Use fallback data for this store
        const coaches = fallbackCoaches[storeSlug] || [];
        const store = fallbackStores.find(s => s.slug === storeSlug);
        return {
          success: true,
          data: coaches.map(c => ({
            ...c,
            storeId: storeSlug,
            store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
          })),
          _debug: {
            source: 'fallback',
            reason: 'store_not_found',
          },
        };
      }
    }

    const coachesSnapshot = await coachesQuery.orderBy('sortOrder', 'asc').get();
    console.log(`[Public Coaches GET] Found ${coachesSnapshot.size} coaches in Firestore`);
    const coaches = docsToArray<CoachDoc>(coachesSnapshot);

    // If no coaches in Firestore, use fallback
    if (coaches.length === 0) {
      console.log('[Public Coaches GET] No coaches in Firestore, using fallback data');
      if (storeSlug) {
        const coachesForStore = fallbackCoaches[storeSlug] || [];
        const store = fallbackStores.find(s => s.slug === storeSlug);
        return {
          success: true,
          data: coachesForStore.map(c => ({
            ...c,
            storeId: storeSlug,
            store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
          })),
          _debug: {
            source: 'fallback',
            reason: 'no_coaches_in_firestore',
          },
        };
      }
      return {
        success: true,
        data: getAllFallbackCoaches(),
        _debug: {
          source: 'fallback',
          reason: 'no_coaches_in_firestore',
        },
      };
    }

    // Get store info for each coach - batch query instead of N+1
    const storeIds = [...new Set(coaches.map(c => c.storeId).filter(Boolean))] as string[];
    const storesMap: Record<string, { id: string; name: string; slug: string }> = {};

    if (storeIds.length > 0) {
      // Firestore allows up to 10 items in 'in' query, batch if needed
      const batchSize = 10;
      for (let i = 0; i < storeIds.length; i += batchSize) {
        const batch = storeIds.slice(i, i + batchSize);
        const storesSnapshot = await db
          .collection('stores')
          .where('__name__', 'in', batch)
          .get();

        for (const doc of storesSnapshot.docs) {
          const data = doc.data() as StoreDoc;
          storesMap[doc.id] = { id: doc.id, name: data.name, slug: data.slug };
        }
      }
    }

    const coachesWithStore = coaches.map((coach) => ({
      id: coach.id,
      name: coach.name,
      slug: coach.slug,
      photo: coach.photo,
      roleTitle: coach.roleTitle,
      specialties: coach.specialties || [],
      certifications: coach.certifications || [],
      education: coach.education || [],
      experiences: coach.experiences || [],
      description: coach.description,
      storeId: coach.storeId,
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
    console.error('[Public Coaches GET] Error:', error.message);
    console.error('[Public Coaches GET] Full error:', error);
    // Use fallback on error
    if (storeSlug) {
      const coaches = fallbackCoaches[storeSlug] || [];
      const store = fallbackStores.find(s => s.slug === storeSlug);
      return {
        success: true,
        data: coaches.map(c => ({
          ...c,
          storeId: storeSlug,
          store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
        })),
        _debug: {
          source: 'fallback',
          reason: 'error',
          error: error.message,
        },
      };
    }
    return {
      success: true,
      data: getAllFallbackCoaches(),
      _debug: {
        source: 'fallback',
        reason: 'error',
        error: error.message,
      },
    };
  }
});
