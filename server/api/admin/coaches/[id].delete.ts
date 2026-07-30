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

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '請提供教練 ID',
    });
  }

  try {
    const db = await getDb();
    const coachRef = db.collection('coaches').doc(id);
    const coachDoc = await coachRef.get();

    if (!coachDoc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: '教練不存在',
      });
    }

    await coachRef.delete();

    return {
      success: true,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error deleting coach:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '刪除教練失敗',
    });
  }
});
