// Admin login via Google (Firebase Auth).
// Verifies the Firebase ID token, checks the email against an allow-list
// (ADMIN_ALLOWED_EMAILS, default lkkwellness@gmail.com), and — only then —
// issues the app's existing admin session cookie. Any other Google account,
// even if it authenticates with Google, is rejected here.
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const idToken = body?.idToken

    if (!idToken || typeof idToken !== 'string') {
      setResponseStatus(event, 400)
      return { success: false, error: '缺少登入憑證' }
    }

    // Verify the Google/Firebase ID token with the Admin SDK
    const { getAdminAuth } = await import('~/server/utils/firebase')
    const auth = await getAdminAuth()

    let decoded: any
    try {
      decoded = await auth.verifyIdToken(idToken)
    } catch {
      setResponseStatus(event, 401)
      return { success: false, error: '登入驗證失敗，請重試' }
    }

    const email = String(decoded.email || '').toLowerCase()
    const emailVerified = decoded.email_verified === true

    // Allow-list: only these emails may access the admin
    const allowed = (process.env.ADMIN_ALLOWED_EMAILS || 'lkkwellness@gmail.com')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (!email || !emailVerified || !allowed.includes(email)) {
      console.warn('[Google Login] Rejected email:', email, 'verified:', emailVerified)
      setResponseStatus(event, 403)
      return { success: false, error: '此 Google 帳號沒有後台權限' }
    }

    // Issue the existing admin session (rest of /admin keeps working unchanged)
    const { createToken, setSessionCookie } = await import('~/server/utils/auth')
    const user = {
      id: decoded.uid,
      email,
      name: decoded.name || email,
      role: 'admin' as const,
    }
    const token = await createToken(user)
    setSessionCookie(event, token)

    return { success: true, user }
  } catch (error) {
    console.error('[Google Login] Error:', error)
    setResponseStatus(event, 500)
    return { success: false, error: '伺服器錯誤，請稍後再試' }
  }
})
