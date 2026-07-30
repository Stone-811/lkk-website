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

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    envCheck: {},
    collections: {},
    errors: [],
  };

  // Check environment variables
  results.envCheck = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✓ Set' : '✗ Missing',
  };

  try {
    const db = await getDb();
    results.dbConnection = '✓ Connected';

    // Test stores collection
    try {
      const storesSnapshot = await db.collection('stores').get();
      results.collections.stores = {
        count: storesSnapshot.size,
        docs: storesSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name,
          isActive: doc.data().isActive,
          sortOrder: doc.data().sortOrder,
        })),
      };
    } catch (e: any) {
      results.errors.push({ collection: 'stores', error: e.message });
    }

    // Test coaches collection
    try {
      const coachesSnapshot = await db.collection('coaches').get();
      results.collections.coaches = {
        count: coachesSnapshot.size,
        docs: coachesSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name,
          isActive: doc.data().isActive,
        })),
      };
    } catch (e: any) {
      results.errors.push({ collection: 'coaches', error: e.message });
    }

    // Test lecturers collection
    try {
      const lecturersSnapshot = await db.collection('lecturers').get();
      results.collections.lecturers = {
        count: lecturersSnapshot.size,
        docs: lecturersSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name,
          type: doc.data().type,
          isActive: doc.data().isActive,
        })),
      };
    } catch (e: any) {
      results.errors.push({ collection: 'lecturers', error: e.message });
    }

  } catch (e: any) {
    results.dbConnection = '✗ Failed';
    results.dbError = e.message;
  }

  return results;
});
