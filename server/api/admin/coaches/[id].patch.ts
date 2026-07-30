import { getDb, getTimestamp } from '~/server/utils/firebase';
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

  const body = await readBody(event);

  try {
    const db = await getDb();
    const Timestamp = await getTimestamp();

    const coachRef = db.collection('coaches').doc(id);
    const coachDoc = await coachRef.get();

    if (!coachDoc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: '教練不存在',
      });
    }

    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    // Only update provided fields
    const allowedFields = [
      'name', 'slug', 'photo', 'roleTitle', 'storeId',
      'specialties', 'certifications', 'experiences', 'education',
      'description', 'sortOrder', 'isActive'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await coachRef.update(updateData);

    return {
      success: true,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error updating coach:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '更新教練失敗',
    });
  }
});
