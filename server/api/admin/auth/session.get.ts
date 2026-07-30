export default defineEventHandler(async (event) => {
  try {
    const { getSession } = await import('~/server/utils/auth');
    const session = await getSession(event);

    if (!session) {
      setResponseStatus(event, 401);
      return {
        success: false,
        error: '未登入',
      };
    }

    return {
      success: true,
      user: session,
    };
  } catch (error: any) {
    console.error('[Session] Error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      error: '伺服器錯誤',
    };
  }
});
