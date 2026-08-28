// Lazy load firebase-admin to avoid bundling issues in Nitro
let _firebaseAdmin: any = null;
let _app: any = null;
let _db: any = null;
let _auth: any = null;
let _storage: any = null;
let _Timestamp: any = null;

// Get firebase-admin module lazily
async function getFirebaseAdminModule() {
  if (!_firebaseAdmin) {
    _firebaseAdmin = {
      app: await import('firebase-admin/app'),
      firestore: await import('firebase-admin/firestore'),
      auth: await import('firebase-admin/auth'),
      storage: await import('firebase-admin/storage'),
    };
    _Timestamp = _firebaseAdmin.firestore.Timestamp;
  }
  return _firebaseAdmin;
}

// Resolve the Storage bucket name. Newer Firebase projects (e.g. lkkdev) use the
// `<project>.firebasestorage.app` bucket, not the legacy `<project>.appspot.com`,
// so allow an explicit override via FIREBASE_STORAGE_BUCKET.
function resolveStorageBucket(projectId?: string): string | undefined {
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    return process.env.FIREBASE_STORAGE_BUCKET;
  }
  return projectId ? `${projectId}.appspot.com` : undefined;
}

// Initialize Firebase Admin SDK (lazy initialization)
async function getFirebaseApp() {
  if (_app) return _app;

  const admin = await getFirebaseAdminModule();
  const { initializeApp, getApps, cert, applicationDefault } = admin.app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  // For local development with emulator
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    _app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-lkk-website',
    });
    return _app;
  }

  // Check if explicit service account credentials are provided
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    // Use explicit service account credentials
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: resolveStorageBucket(process.env.FIREBASE_PROJECT_ID),
    });
    return _app;
  }

  // Use Application Default Credentials (ADC)
  // This works automatically on Firebase App Hosting, Cloud Run, etc.
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;

  try {
    _app = initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket: resolveStorageBucket(projectId),
    });
  } catch (error) {
    // Fallback: initialize without explicit credential (for environments that auto-inject)
    console.warn('Failed to use applicationDefault(), falling back to basic init:', error);
    _app = initializeApp({
      projectId,
      storageBucket: resolveStorageBucket(projectId),
    });
  }

  return _app;
}

// Get Firestore instance
async function getFirestoreInstance() {
  if (_db) return _db;

  const admin = await getFirebaseAdminModule();
  const app = await getFirebaseApp();
  _db = admin.firestore.getFirestore(app);
  return _db;
}

// Get Auth instance
async function getAuthInstance() {
  if (_auth) return _auth;

  const admin = await getFirebaseAdminModule();
  const app = await getFirebaseApp();
  _auth = admin.auth.getAuth(app);
  return _auth;
}

// Get Storage instance
async function getStorageInstance() {
  if (_storage) return _storage;

  const admin = await getFirebaseAdminModule();
  const app = await getFirebaseApp();
  _storage = admin.storage.getStorage(app);
  return _storage;
}

// Proxy-based lazy db accessor (synchronous interface, async initialization)
const dbProxy = new Proxy({} as any, {
  get(_, prop) {
    // Return an async function that gets the real db and calls the method
    return async (...args: any[]) => {
      const firestore = await getFirestoreInstance();
      const method = (firestore as any)[prop];
      if (typeof method === 'function') {
        return method.apply(firestore, args);
      }
      return method;
    };
  },
});

// Export async getters for direct use
export async function getDb() {
  return getFirestoreInstance();
}

export async function getAdminAuth() {
  return getAuthInstance();
}

export async function getAdminStorage() {
  return getStorageInstance();
}

export async function getTimestamp() {
  await getFirebaseAdminModule();
  return _Timestamp;
}

// Legacy exports for compatibility (use with caution - these are proxies)
export const db = dbProxy;
export const adminAuth = new Proxy({} as any, {
  get(_, prop) {
    return async (...args: any[]) => {
      const auth = await getAuthInstance();
      const method = (auth as any)[prop];
      if (typeof method === 'function') {
        return method.apply(auth, args);
      }
      return method;
    };
  },
});
export const adminStorage = new Proxy({} as any, {
  get(_, prop) {
    return async (...args: any[]) => {
      const storage = await getStorageInstance();
      const method = (storage as any)[prop];
      if (typeof method === 'function') {
        return method.apply(storage, args);
      }
      return method;
    };
  },
});

// Timestamp proxy
export const Timestamp = new Proxy({} as any, {
  get(_, prop) {
    // For static methods like Timestamp.now()
    return async (...args: any[]) => {
      await getFirebaseAdminModule();
      const method = (_Timestamp as any)[prop];
      if (typeof method === 'function') {
        return method.apply(_Timestamp, args);
      }
      return method;
    };
  },
});

// Helper types for Firestore documents
export interface FirestoreDoc {
  id: string;
  createdAt: any;
  updatedAt: any;
}

export interface StoreDoc extends FirestoreDoc {
  name: string;
  slug: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  googleMapUrl?: string;
  businessHours?: string;
  transportation?: string;
  images: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface CoachDoc extends FirestoreDoc {
  name: string;
  slug: string;
  photo?: string;
  roleTitle?: string;
  storeId?: string;
  specialties: string[];
  certifications: string[];
  experiences: string[];
  education: string[];
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LeadDoc extends FirestoreDoc {
  type: 'booking' | 'franchise' | 'cooperation' | 'group_class';
  name: string;
  phone: string;
  email?: string;
  storeId?: string;
  sourcePage: string;
  sourceChannel?: string;
  message?: string;
  payload: Record<string, unknown>;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  internalNote?: string;
}

export interface FaqDoc extends FirestoreDoc {
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UserDoc extends FirestoreDoc {
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'store_staff';
  storeId?: string;
  isActive: boolean;
}

export interface LecturerDoc extends FirestoreDoc {
  name: string;
  slug: string;
  photo?: string;
  title?: string;
  organization?: string;
  region?: string;
  type: 'lkk' | 'partner' | 'overseas';
  description?: string;
  specialties: string[];
  certifications?: string[];
  /** 學歷背景 */
  education?: string[];
  /** 專業經歷 */
  experiences?: string[];
  /** 授課經歷 */
  courses?: string[];
  sortOrder: number;
  isActive: boolean;
}

// Helper function to convert Firestore doc to plain object
export function docToObject<T extends FirestoreDoc>(
  doc: any
): T | null {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as T;
}

// Helper function to convert Firestore docs to array
export function docsToArray<T extends FirestoreDoc>(
  snapshot: any
): T[] {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}
