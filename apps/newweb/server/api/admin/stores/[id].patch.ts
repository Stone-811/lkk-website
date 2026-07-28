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
      statusMessage: '請提供分店 ID',
    });
  }

  const body = await readBody(event);

  try {
    const db = await getDb();
    const Timestamp = await getTimestamp();

    const storeRef = db.collection('stores').doc(id);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: '分店不存在',
      });
    }

    // If slug is being changed, check for uniqueness
    if (body.slug && body.slug !== storeDoc.data()?.slug) {
      const existingSnapshot = await db
        .collection('stores')
        .where('slug', '==', body.slug)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        throw createError({
          statusCode: 400,
          statusMessage: '該網址代碼已存在',
        });
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    // Only update provided fields
    const allowedFields = [
      'name', 'slug', 'phone', 'address', 'city', 'district',
      'googleMapUrl', 'businessHours', 'transportation', 'images',
      'sortOrder', 'isActive'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await storeRef.update(updateData);

    return {
      success: true,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error updating store:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '更新分店失敗',
    });
  }
});
