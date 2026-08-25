<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useHead({
  title: '系統設定｜練健康後台',
})

interface Settings {
  contactEmail: string
  socialLinks: {
    facebook: string
    instagram: string
    youtube: string
    podcast: string
    line: string
  }
  notifications: {
    emailOnNewLead: boolean
    emailRecipients: string
  }
}

const defaultSettings: Settings = {
  contactEmail: 'lkkwellness@gmail.com',
  socialLinks: {
    facebook: 'https://www.facebook.com/LKKWellnessCenter/',
    instagram: 'https://www.instagram.com/lkk_wellness/',
    youtube: 'https://www.youtube.com/c/LKKWellness',
    podcast: 'https://podcasts.apple.com/tw/podcast/%E5%88%9D%E4%B8%80%E5%8D%81%E4%BA%94%E7%B7%B4%E5%81%A5%E5%BA%B7/id1779024584',
    line: 'https://line.me/R/ti/p/%40201fzruh',
  },
  notifications: {
    emailOnNewLead: true,
    emailRecipients: '',
  },
}

const settings = ref<Settings>({ ...defaultSettings })
const saving = ref(false)
const loading = ref(true)
const testingSend = ref(false)

// Fetch settings on mount
onMounted(async () => {
  try {
    const res = await $fetch<{ success: boolean; data: any }>('/api/admin/settings')
    if (res.success && res.data) {
      settings.value = {
        contactEmail: res.data.contactEmail || defaultSettings.contactEmail,
        socialLinks: {
          facebook: res.data.socialLinks?.facebook || defaultSettings.socialLinks.facebook,
          instagram: res.data.socialLinks?.instagram || defaultSettings.socialLinks.instagram,
          youtube: res.data.socialLinks?.youtube || defaultSettings.socialLinks.youtube,
          podcast: res.data.socialLinks?.podcast || defaultSettings.socialLinks.podcast,
          line: res.data.socialLinks?.line || defaultSettings.socialLinks.line,
        },
        notifications: res.data.notifications || defaultSettings.notifications,
      }
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  saving.value = true
  try {
    const sections = [
      {
        section: 'general',
        data: {
          contactEmail: settings.value.contactEmail,
        },
      },
      { section: 'social', data: settings.value.socialLinks },
      { section: 'notifications', data: settings.value.notifications },
    ]

    for (const { section, data } of sections) {
      await $fetch('/api/admin/settings', {
        method: 'PATCH',
        body: { section, data },
      })
    }
    alert('設定已儲存')
  } catch (error) {
    console.error('Save failed:', error)
    alert('儲存失敗')
  } finally {
    saving.value = false
  }
}

async function handleTestNotification() {
  if (!settings.value.notifications.emailRecipients.trim()) {
    alert('請先填寫通知收件人')
    return
  }

  testingSend.value = true
  try {
    const recipients = settings.value.notifications.emailRecipients
      .split(',')
      .map(e => e.trim())
      .filter(e => e)

    const res = await $fetch<{ success: boolean; error?: string }>('/api/admin/settings', {
      method: 'POST',
      body: { action: 'test-notification', recipients },
    })

    if (res.success) {
      alert('測試通知已發送，請檢查收件匣')
    } else {
      alert(res.error || '發送失敗')
    }
  } catch (error: any) {
    console.error('Test notification failed:', error)
    // 把後端真正的 SMTP 錯誤顯示出來，方便診斷（例如 535 帳密不符）
    const detail = error?.data?.message || error?.data?.statusMessage || error?.message || '未知錯誤'
    alert('發送失敗：\n' + detail + '\n\n（多半是 SMTP App Password 問題，請截圖此訊息回報）')
  } finally {
    testingSend.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">系統設定</h1>
      <p class="text-gray-500 mt-1">管理聯絡資訊、社群連結與表單通知</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-gray-500">載入中...</div>
    </div>

    <template v-else>
      <!-- 聯絡資訊 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 class="text-lg font-semibold text-gray-900">聯絡資訊</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">聯絡信箱</label>
            <input
              v-model="settings.contactEmail"
              type="email"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- 社群連結 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 class="text-lg font-semibold text-gray-900">社群連結</h2>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </span>
          </label>
          <input
            v-model="settings.socialLinks.facebook"
            type="url"
            class="w-full max-w-xl border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            placeholder="https://www.facebook.com/..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </span>
          </label>
          <input
            v-model="settings.socialLinks.instagram"
            type="url"
            class="w-full max-w-xl border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            placeholder="https://www.instagram.com/..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
            </span>
          </label>
          <input
            v-model="settings.socialLinks.youtube"
            type="url"
            class="w-full max-w-xl border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            placeholder="https://www.youtube.com/..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.636 0 8.4 3.764 8.4 8.4 0 2.807-1.38 5.29-3.498 6.81-.174-.584-.416-1.162-.732-1.716a6.799 6.799 0 002.63-5.094c0-3.754-3.046-6.8-6.8-6.8S5.2 8.246 5.2 12c0 2.027.892 3.848 2.302 5.094-.316.554-.558 1.132-.732 1.716A8.376 8.376 0 013.6 12c0-4.636 3.764-8.4 8.4-8.4z" />
              </svg>
              Podcast
            </span>
          </label>
          <input
            v-model="settings.socialLinks.podcast"
            type="url"
            class="w-full max-w-xl border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            placeholder="https://podcasts.apple.com/..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.193 0-.378-.09-.503-.234l-1.749-2.028v1.635c0 .349-.282.63-.63.63-.345 0-.627-.281-.627-.63V8.108c0-.27.174-.51.432-.596.064-.021.133-.031.199-.031.193 0 .378.09.503.234l1.749 2.028V8.108c0-.349.282-.63.63-.63.345 0 .627.281.627.63v4.771zm-5.741 0c0 .349-.282.63-.631.63-.345 0-.627-.281-.627-.63V8.108c0-.349.282-.63.63-.63.346 0 .628.281.628.63v4.771zm-2.466.63H4.917c-.345 0-.63-.281-.63-.63V8.108c0-.349.285-.63.63-.63.348 0 .63.281.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINE
            </span>
          </label>
          <input
            v-model="settings.socialLinks.line"
            type="url"
            class="w-full max-w-xl border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            placeholder="https://line.me/R/ti/p/..."
          />
        </div>
      </div>

      <!-- 通知設定 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 class="text-lg font-semibold text-gray-900">通知設定</h2>
        <!-- 功能說明 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-medium text-blue-800 mb-2">通知功能說明</h3>
          <p class="text-sm text-blue-700">
            當網站有新的表單提交（預約體驗、加盟洽詢、合作洽詢）時，系統會自動發送郵件通知。
          </p>
          <p class="text-sm text-blue-700 mt-2">
            您可以在下方設定需要收到通知的管理者信箱（如業務、客服等），讓相關同仁即時收到新名單通知。
          </p>
        </div>

        <div class="flex items-start gap-3">
          <input
            id="emailOnNewLead"
            v-model="settings.notifications.emailOnNewLead"
            type="checkbox"
            class="w-4 h-4 mt-1 text-orange rounded border-gray-300 focus:ring-orange"
          />
          <div>
            <label for="emailOnNewLead" class="font-medium text-gray-900 cursor-pointer">
              啟用新名單 Email 通知
            </label>
            <p class="text-sm text-gray-500">開啟後，新表單提交時會發送通知信</p>
          </div>
        </div>

        <div v-if="settings.notifications.emailOnNewLead" class="ml-7">
          <label class="block text-sm font-medium text-gray-700 mb-1">管理者信箱</label>
          <input
            v-model="settings.notifications.emailRecipients"
            type="text"
            class="w-full max-w-xl border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
            placeholder="lkkwellness@gmail.com, manager@gmail.com"
          />
          <p class="text-xs text-gray-500 mt-1">多個收件人請用逗號分隔。新表單通知會寄送到這些信箱。</p>
        </div>

        <div class="border-t pt-6">
          <h3 class="font-medium text-gray-900 mb-3">通知測試</h3>
          <p class="text-sm text-gray-500 mb-3">
            發送測試郵件到上方設定的管理者信箱，確認通知功能正常。請先儲存設定後再測試。
          </p>
          <button
            type="button"
            @click="handleTestNotification"
            :disabled="testingSend"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {{ testingSend ? '發送中...' : '發送測試通知' }}
          </button>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="handleSave"
          :disabled="saving"
          class="inline-flex items-center gap-2 bg-orange text-white font-medium px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <svg v-if="saving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ saving ? '儲存中...' : '儲存設定' }}
        </button>
      </div>
    </template>
  </div>
</template>
