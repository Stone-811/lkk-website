// Client-side Firebase app + Auth (used for admin Google sign-in).
// Config comes from public runtime config (NUXT_PUBLIC_FIREBASE_* — these are
// public web-config values, safe to expose; they differ per project dev/prod).
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig().public
  if (!cfg.firebaseApiKey) {
    // Not configured (e.g. missing env) — provide null so the login page can degrade gracefully.
    return { provide: { firebaseAuth: null as any } }
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: cfg.firebaseApiKey,
        authDomain: cfg.firebaseAuthDomain,
        projectId: cfg.firebaseProjectId,
        appId: cfg.firebaseAppId,
      })

  return { provide: { firebaseAuth: getAuth(app) } }
})
