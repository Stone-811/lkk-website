<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useHead({
  title: '登入｜練健康後台',
})

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!email.value || !password.value) return

  error.value = ''
  isLoading.value = true

  try {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || '登入失敗'
      return
    }

    router.push('/admin')
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

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="admin@l-kk.tw"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange/50 focus:border-orange outline-none transition-colors"
            required
            autocomplete="email"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            密碼
          </label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange/50 focus:border-orange outline-none transition-colors"
            required
            autocomplete="current-password"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-orange text-white font-bold py-3 rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <template v-if="isLoading">
            <span class="inline-flex items-center gap-2">
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              登入中...
            </span>
          </template>
          <template v-else>
            登入
          </template>
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
