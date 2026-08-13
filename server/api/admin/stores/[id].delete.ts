import { getDb } from '~/server/utils/firebase';
import { getSession } from '~/server/utils/auth';
import { hasPagePermission } from '~/utils/adminAccess';

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入',
    });
  }

  // 系統管理員或有「分店管理」權限的自訂帳號可刪除分店
  if (session.role !== 'admin' && !hasPagePermission(session, '/admin/stores')) {
    throw createError({
      statusCode: 403,
      statusMessage: '權限不足',
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '請提供分店 ID',
    });
  }

  try {
    const db = await getDb();
    const storeRef = db.collection('stores').doc(id);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: '分店不存在',
      });
    }

    // Check if there are coaches linked to this store
    const coachesSnapshot = await db
      .collection('coaches')
      .where('storeId', '==', id)
      .limit(1)
      .get();

    if (!coachesSnapshot.empty) {
      throw createError({
        statusCode: 400,
        statusMessage: '無法刪除：此分店下仍有教練',
      });
    }

    await storeRef.delete();

    return {
      success: true,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error deleting store:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '刪除分店失敗',
    });
  }
});
