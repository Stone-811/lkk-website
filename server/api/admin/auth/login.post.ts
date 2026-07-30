export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, password } = body;

    console.log('[Login] Attempt for:', email);

    if (!email || !password) {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: '請輸入帳號和密碼',
      };
    }

    // Dynamic import to avoid bundling issues
    const { loginWithCredentials, createToken, setSessionCookie } = await import('~/server/utils/auth');

    console.log('[Login] Auth module loaded successfully');

    const result = await loginWithCredentials(email, password);

    console.log('[Login] Result:', { success: result.success, hasUser: !!result.user });

    if (!result.success || !result.user) {
      setResponseStatus(event, 401);
      return {
        success: false,
        error: result.error || '登入失敗',
      };
    }

    // Create JWT token
    const token = await createToken(result.user);

    console.log('[Login] Token created successfully');

    // Set session cookie
    setSessionCookie(event, token);

    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    console.error('[Login] Error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      error: '伺服器錯誤，請稍後再試',
    };
  }
});
