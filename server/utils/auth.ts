import { H3Event, getCookie, setCookie, deleteCookie } from 'h3';

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

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'store_staff';
  storeId?: string;
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

// Get session from cookie (for API routes)
export async function getSession(event: H3Event): Promise<UserSession | null> {
  const token = getCookie(event, COOKIE_NAME);

  if (!token) return null;

  return verifyToken(token);
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
  storeId?: string
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
