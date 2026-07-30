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

  const body = await readBody(event);

  // Validate required fields
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: '請填寫教練姓名',
    });
  }

  try {
    const db = await getDb();
    const Timestamp = await getTimestamp();

    // Auto-calculate sortOrder if not provided
    let sortOrder = body.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const lastCoachSnapshot = await db
        .collection('coaches')
        .orderBy('sortOrder', 'desc')
        .limit(1)
        .get();

      if (lastCoachSnapshot.empty) {
        sortOrder = 1;
      } else {
        const lastSortOrder = lastCoachSnapshot.docs[0].data().sortOrder || 0;
        sortOrder = lastSortOrder + 1;
      }
    }

    const now = Timestamp.now();
    const coachRef = db.collection('coaches').doc();

    // Generate slug from name if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');

    await coachRef.set({
      name: body.name,
      slug,
      photo: body.photo || null,
      roleTitle: body.roleTitle || null,
      storeId: body.storeId || null,
      specialties: body.specialties || [],
      certifications: body.certifications || [],
      experiences: body.experiences || [],
      education: body.education || [],
      description: body.description || null,
      sortOrder,
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      data: { id: coachRef.id },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error creating coach:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '建立教練失敗',
    });
  }
});
