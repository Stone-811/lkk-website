import { getDb, getTimestamp } from '~/server/utils/firebase';
import { getSession } from '~/server/utils/auth';
import { fallbackStores, fallbackCoaches } from '~/server/utils/fallback-data';

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入',
    });
  }

  // Only admin can seed data
  if (session.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: '權限不足',
    });
  }

  const body = await readBody(event);
  const clearExisting = body?.clearExisting ?? false;

  try {
    const db = await getDb();
    const Timestamp = await getTimestamp();
    const now = Timestamp.now();

    const results = {
      stores: { created: 0, skipped: 0 },
      coaches: { created: 0, skipped: 0 },
    };

    // Map to track store slug -> Firestore doc ID
    const storeIdMap: Record<string, string> = {};

    // Clear existing data if requested
    if (clearExisting) {
      // Delete all coaches first (they reference stores)
      const coachesSnapshot = await db.collection('coaches').get();
      const coachDeleteBatch = db.batch();
      coachesSnapshot.docs.forEach((doc) => {
        coachDeleteBatch.delete(doc.ref);
      });
      await coachDeleteBatch.commit();

      // Delete all stores
      const storesSnapshot = await db.collection('stores').get();
      const storeDeleteBatch = db.batch();
      storesSnapshot.docs.forEach((doc) => {
        storeDeleteBatch.delete(doc.ref);
      });
      await storeDeleteBatch.commit();
    }

    // Seed stores
    for (let i = 0; i < fallbackStores.length; i++) {
      const store = fallbackStores[i];

      // Check if store with this slug already exists
      const existingSnapshot = await db
        .collection('stores')
        .where('slug', '==', store.slug)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        // Store exists, use existing ID
        storeIdMap[store.slug] = existingSnapshot.docs[0].id;
        results.stores.skipped++;
        continue;
      }

      // Create new store
      const storeRef = db.collection('stores').doc();
      await storeRef.set({
        name: store.name,
        slug: store.slug,
        phone: store.phone || null,
        address: store.address || null,
        city: store.city || null,
        district: store.district || null,
        googleMapUrl: null,
        businessHours: null,
        transportation: null,
        images: [],
        sortOrder: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      storeIdMap[store.slug] = storeRef.id;
      results.stores.created++;
    }

    // Seed coaches for each store
    let coachSortOrder = 1;
    for (const storeSlug of Object.keys(fallbackCoaches)) {
      const storeId = storeIdMap[storeSlug];
      const coaches = fallbackCoaches[storeSlug];

      for (const coach of coaches) {
        // Check if coach with this name and store already exists
        const existingSnapshot = await db
          .collection('coaches')
          .where('name', '==', coach.name)
          .where('storeId', '==', storeId)
          .limit(1)
          .get();

        if (!existingSnapshot.empty) {
          results.coaches.skipped++;
          continue;
        }

        // Create new coach
        const coachRef = db.collection('coaches').doc();
        await coachRef.set({
          name: coach.name,
          slug: coach.id,
          photo: coach.photo || null,
          roleTitle: coach.roleTitle || null,
          storeId: storeId,
          specialties: coach.specialties || [],
          certifications: coach.certifications || [],
          experiences: coach.experiences || [],
          education: coach.education || [],
          description: null,
          sortOrder: coachSortOrder++,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        results.coaches.created++;
      }
    }

    return {
      success: true,
      message: '資料匯入完成',
      data: results,
    };
  } catch (error: any) {
    console.error('Error seeding data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '資料匯入失敗：' + (error.message || '未知錯誤'),
    });
  }
});
