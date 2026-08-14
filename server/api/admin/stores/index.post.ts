import { getDb, getTimestamp } from '~/server/utils/firebase';
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

  // 系統管理員或有「分店管理」權限的自訂帳號可建立分店
  if (session.role !== 'admin' && !hasPagePermission(session, '/admin/stores')) {
    throw createError({
      statusCode: 403,
      statusMessage: '權限不足',
    });
  }

  const body = await readBody(event);

  // Validate required fields
  if (!body.name || !body.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '請填寫必要欄位',
    });
  }

  try {
    const db = await getDb();
    const Timestamp = await getTimestamp();

    // Check if slug already exists
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

    // Auto-calculate sortOrder if not provided
    let sortOrder = body.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const lastStoreSnapshot = await db
        .collection('stores')
        .orderBy('sortOrder', 'desc')
        .limit(1)
        .get();

      if (lastStoreSnapshot.empty) {
        sortOrder = 1;
      } else {
        const lastSortOrder = lastStoreSnapshot.docs[0].data().sortOrder || 0;
        sortOrder = lastSortOrder + 1;
      }
    }

    const now = Timestamp.now();
    const storeRef = db.collection('stores').doc();

    await storeRef.set({
      name: body.name,
      slug: body.slug,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      district: body.district || null,
      googleMapUrl: body.googleMapUrl || null,
      businessHours: body.businessHours || null,
      transportation: body.transportation || null,
      images: body.images || [],
      sortOrder,
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      data: { id: storeRef.id },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error creating store:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '建立分店失敗',
    });
  }
});
