import { H3Event, getCookie, setCookie, deleteCookie, createError } from 'h3';

// Lazy load firebase to avoid initialization issues
async function getFirebaseDb() {
  const { getDb } = await import('./firebase');
  return getDb();
}

// Lazy load jose to avoid bundling issues
let SignJWT: any;
let jwtVerify: any;

async function getJose() {
  if (!SignJWT) {
    const jose = await import('jose');
    SignJWT = jose.SignJWT;
    jwtVerify = jose.jwtVerify;
  }
  return { SignJWT, jwtVerify };
}

// Lazy load bcrypt
let bcryptModule: any;

async function getBcrypt() {
  if (!bcryptModule) {
    bcryptModule = (await import('bcryptjs')).default;
  }
  return bcryptModule;
}

// Resolve the JWT signing secret.
// In production a real JWT_SECRET is mandatory — fail fast on cold start rather
// than silently signing tokens with a well-known default that anyone could forge.
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length > 0) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production. ' +
      'Set it via a Firebase secret, e.g. `firebase apphosting:secrets:set jwt-secret`.'
    );
  }

  console.warn(
    '[auth] JWT_SECRET is not set — using an insecure development-only fallback. ' +
    'Never run production without JWT_SECRET.'
  );
  return 'dev-only-insecure-secret-change-me';
}

const JWT_SECRET = new TextEncoder().encode(resolveJwtSecret());

const COOKIE_NAME = 'lkk-admin-token';

export type UserRole = 'admin' | 'editor' | 'store_staff' | 'sales' | 'custom';

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string;
  // 自訂權限帳號（role === 'custom'）可存取的後台頁面路徑清單
  permissions?: string[];
};

// Create JWT token for session
export async function createToken(user: UserSession): Promise<string> {
  const { SignJWT } = await getJose();
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { jwtVerify } = await getJose();
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.user as UserSession;
  } catch {
    return null;
  }
}

// 即時生效機制：getSession 會回查 users 文件取「當前」狀態（短快取降低 Firestore 讀取）。
// 停用帳號、或改角色/勾選權限後，最多約 30 秒（該執行實例快取到期）就會生效，
// 不必等 JWT 7 天到期，也不必重新登入。權限來源以 DB 為準、不放進 JWT。
type LiveUserState = { exists: boolean; isActive: boolean; role?: UserRole; permissions?: string[] };
const userStateCache = new Map<string, { state: LiveUserState; at: number }>();
const USER_STATE_TTL_MS = 30_000;

async function getLiveUserState(userId: string): Promise<LiveUserState> {
  const now = Date.now();
  const cached = userStateCache.get(userId);
  if (cached && now - cached.at < USER_STATE_TTL_MS) return cached.state;

  // 預設：查無文件/出錯一律「存在=false、視為啟用」→ 保留 JWT 內容、不誤踢。
  //（Google 登入 id 是 Firebase uid、dev 測試帳號 id 也無 users 文件，皆走此路徑）
  let state: LiveUserState = { exists: false, isActive: true };
  try {
    const db = await getFirebaseDb();
    const snap = await db.collection('users').doc(userId).get();
    if (snap.exists) {
      const d = snap.data() as any;
      state = {
        exists: true,
        isActive: d?.isActive !== false,
        role: d?.role,
        permissions: Array.isArray(d?.permissions) ? d.permissions : undefined,
      };
    }
  } catch {
    state = { exists: false, isActive: true };
  }
  userStateCache.set(userId, { state, at: now });
  return state;
}

// Get session from cookie (for API routes)
export async function getSession(event: H3Event): Promise<UserSession | null> {
  const token = getCookie(event, COOKIE_NAME);

  if (!token) return null;

  const session = await verifyToken(token);
  if (!session) return null;

  // 以 DB 現況覆寫 JWT 內的角色/權限，並即時反映停用狀態
  if (session.id) {
    const live = await getLiveUserState(session.id);
    if (live.exists) {
      if (!live.isActive) return null; // 帳號已停用 → 視為未登入
      if (live.role) session.role = live.role;
      session.permissions = live.permissions;
    }
  }

  return session;
}

// Set session cookie
export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear session cookie
export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME);
}

// Fallback test user for LOCAL DEVELOPMENT ONLY.
// This is never usable in production, and is disabled by default even in dev:
// it only works when NODE_ENV !== 'production' AND ALLOW_DEV_ADMIN === 'true'.
const DEV_TEST_USER = {
  email: 'admin@l-kk.tw',
  password: 'admin123',
  user: {
    id: 'dev-admin',
    email: 'admin@l-kk.tw',
    name: '開發測試管理員',
    role: 'admin' as const,
  },
};

// Whether the built-in dev admin login is permitted in this environment.
function isDevLoginAllowed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_ADMIN === 'true'
  );
}

// Login with email and password (using Firestore for user lookup)
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  // Built-in dev admin login — never active in production, and off by default in
  // dev unless ALLOW_DEV_ADMIN=true is explicitly set (see isDevLoginAllowed).
  if (
    isDevLoginAllowed() &&
    email === DEV_TEST_USER.email &&
    password === DEV_TEST_USER.password
  ) {
    console.warn('[auth] Dev admin login used via ALLOW_DEV_ADMIN — disabled in production.');
    return { success: true, user: DEV_TEST_USER.user };
  }

  try {
    // Get user from Firestore
    const db = await getFirebaseDb();
    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return { success: false, error: '帳號或密碼錯誤' };
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check password using bcrypt
    const bcrypt = await getBcrypt();
    const isValidPassword = await bcrypt.compare(password, userData.passwordHash || '');

    if (!isValidPassword) {
      return { success: false, error: '帳號或密碼錯誤' };
    }

    const user: UserSession = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      storeId: userData.storeId,
      permissions: Array.isArray(userData.permissions) ? userData.permissions : undefined,
    };

    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '登入失敗，請稍後再試' };
  }
}

// Create user in Firestore
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserSession['role'] = 'editor',
  storeId?: string,
  permissions: string[] = []
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const bcrypt = await getBcrypt();
    const passwordHash = await bcrypt.hash(password, 10);

    const db = await getFirebaseDb();
    const userRef = db.collection('users').doc();
    await userRef.set({
      email,
      name,
      passwordHash,
      role,
      storeId: storeId || null,
      // 僅自訂權限帳號有意義；其餘角色存空陣列即可（canAccessAdminPath 以角色判斷）
      permissions: role === 'custom' ? permissions : [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, userId: userRef.id };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: '建立使用者失敗' };
  }
}

// 密碼強度規則（僅在「設定/變更密碼」時檢查，不影響既有帳號登入）。
// 回傳錯誤訊息字串；通過則回傳 null。前端 utils/passwordPolicy.ts 需與此保持一致。
export function validatePasswordStrength(pw: string): string | null {
  const s = String(pw || '');
  if (s.length < 8) return '密碼至少需 8 碼';
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) return '密碼需同時包含英文字母與數字';
  return null;
}

// Require authentication middleware helper
export async function requireAuth(
  event: H3Event,
  allowedRoles?: UserSession['role'][]
): Promise<{ authorized: boolean; user?: UserSession; redirect?: string }> {
  const session = await getSession(event);

  if (!session) {
    return { authorized: false, redirect: '/admin/login' };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { authorized: false, redirect: '/admin/dashboard' };
  }

  return { authorized: true, user: session };
}

// Require a session with one of the allowedRoles, else throw 401/403.
// For use at the top of admin API handlers (defense-in-depth alongside the
// server middleware in server/middleware/admin-api-guard.ts).
export async function requireRole(
  event: H3Event,
  allowedRoles?: UserRole[]
): Promise<UserSession> {
  const session = await getSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: '未登入' });
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw createError({ statusCode: 403, statusMessage: '權限不足' });
  }
  return session;
}
