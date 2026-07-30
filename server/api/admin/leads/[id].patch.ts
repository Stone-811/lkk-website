export default defineEventHandler(async (event) => {
  try {
    // Dynamic imports
    const { getSession } = await import('~/server/utils/auth');
    const { getDb, getTimestamp } = await import('~/server/utils/firebase');

    // Check authentication
    const session = await getSession(event);
    if (!session) {
      setResponseStatus(event, 401);
      return { success: false, error: '未登入' };
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
      setResponseStatus(event, 400);
      return { success: false, error: '請提供名單 ID' };
    }

    const body = await readBody(event);
    const db = await getDb();
    const Timestamp = await getTimestamp();

    const leadRef = db.collection('leads').doc(id);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      setResponseStatus(event, 404);
      return { success: false, error: '名單不存在' };
    }

    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    // Only allow updating status and internalNote
    if (body.status !== undefined) {
      const validStatuses = ['new', 'contacted', 'scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        setResponseStatus(event, 400);
        return { success: false, error: '無效的狀態' };
      }
      updateData.status = body.status;
    }

    if (body.internalNote !== undefined) {
      updateData.internalNote = body.internalNote;
    }

    await leadRef.update(updateData);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating lead:', error);
    setResponseStatus(event, 500);
    return { success: false, error: '更新名單失敗' };
  }
});
