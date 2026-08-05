<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useHead({
  title: '登入｜練健康後台',
})

const router = useRouter()
const nuxtApp = useNuxtApp()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const googleLoading = ref(false)
const showPasswordLogin = ref(false)

// Primary: Google sign-in (only allow-listed emails get an admin session)
async function handleGoogleLogin() {
  error.value = ''
  const auth = (nuxtApp as any).$firebaseAuth
  if (!auth) {
    error.value = 'Google 登入尚未設定，請改用密碼登入'
    showPasswordLogin.value = true
    return
  }
  googleLoading.value = true
  try {
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(auth, provider)
    const idToken = await result.user.getIdToken()

    const res = await fetch('/api/admin/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      error.value = data.error || 'Google 登入失敗'
      return
    }
    router.push('/admin')
  } catch (e: any) {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
      // user closed the popup — silent
    } else {
      console.error('Google login error:', e)
      error.value = 'Google 登入失敗，請重試'
    }
  } finally {
    googleLoading.value = false
  }
}

// Emergency backup: email + password
const handleSubmit = async () => {
  if (!email.value || !password.value) return
  error.value = ''
  isLoading.value = true
  try {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    const data = await res.json()
    if (!res.ok) {
      error.value = data.error || '登入失敗'
      return
    }
    // sales（名單專員）登入直接進客戶預約，其餘進儀表板
    router.push(data.user?.role === 'sales' ? '/admin/leads' : '/admin')
  } catch (err) {
    error.value = '網路錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/lkklogo.png" alt="練健康" class="h-12 mx-auto mb-3" />
        <h1 class="text-2xl font-bold text-navy">練健康</h1>
        <p class="text-gray-500 mt-1">後台管理系統</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
        {{ error }}
      </div>

      <!-- Google sign-in (primary) -->
      <button
        type="button"
        @click="handleGoogleLogin"
        :disabled="googleLoading"
        class="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
        </svg>
        <span>{{ googleLoading ? '登入中…' : '使用 Google 登入' }}</span>
      </button>
      <p class="text-xs text-gray-400 text-center mt-3">僅限授權的 Google 帳號可進入後台</p>

      <!-- Toggle emergency password login -->
      <div class="mt-6">
        <button
          type="button"
          @click="showPasswordLogin = !showPasswordLogin"
          class="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          {{ showPasswordLogin ? '收合密碼登入' : '使用密碼登入（緊急備援）' }}
        </button>
      </div>

      <!-- Password form (emergency backup) -->
      <form v-if="showPasswordLogin" @submit.prevent="handleSubmit" class="space-y-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="admin@l-kk.tw"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange/50 focus:border-orange outline-none transition-colors"
            autocomplete="email"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange/50 focus:border-orange outline-none transition-colors"
            autocomplete="current-password"
          />
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-orange text-white font-bold py-3 rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? '登入中...' : '密碼登入' }}
        </button>
      </form>
    </div>

    <!-- Back to Website -->
    <div class="text-center mt-6">
      <NuxtLink
        to="/"
        class="text-gray-500 hover:text-gray-700 text-sm transition-colors"
      >
        ← 返回網站首頁
      </NuxtLink>
    </div>
  </div>
</template>
