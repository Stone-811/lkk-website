export default defineEventHandler(async (event) => {
  try {
    const { clearSessionCookie } = await import('~/server/utils/auth');
    clearSessionCookie(event);
    return { success: true };
  } catch (error: any) {
    console.error('[Logout] Error:', error);
    return { success: true }; // Still succeed on logout
  }
});
