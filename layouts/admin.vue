<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { canAccessAdminPath } from '~/utils/adminAccess'
import { validatePasswordStrength, PASSWORD_HINT } from '~/utils/passwordPolicy'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { name: '儀表板', path: '/admin', icon: 'dashboard' },
  { name: '客戶預約', path: '/admin/leads', icon: 'calendar', badge: true },
  { name: '團課預約', path: '/admin/group-classes', icon: 'usergroup' },
  { name: '合作表單', path: '/admin/cooperation', icon: 'briefcase' },
  { name: '分店管理', path: '/admin/stores', icon: 'store' },
  { name: '教練管理', path: '/admin/coaches', icon: 'people' },
  { name: '講師管理', path: '/admin/lecturers', icon: 'school' },
  { name: 'LKK4 成績', path: '/admin/lkk4-records', icon: 'chart' },
  { name: '系統設定', path: '/admin/settings', icon: 'settings' },
  { name: '使用者管理', path: '/admin/users', icon: 'users' },
]

// 依登入者角色過濾可見選單（與路由守衛共用 canAccessAdminPath）
const visibleMenuItems = computed(() =>
  menuItems.filter((item) => canAccessAdminPath(user.value?.role, item.path)),
)

const isSidebarOpen = ref(false)

// User session（由 middleware/admin-access.global.ts 透過 useState 提供，SSR 即填好）
// session 驗證與未登入/角色導向都在 route middleware 處理，這裡只讀取顯示。
const user = useState<{ id: string; name: string; email: string; role: string } | null>(
  'adminUser',
  () => null,
)
const isLoading = ref(false)

// Pending leads count
const pendingLeadsCount = ref(0)

// 取得待處理名單數（僅供選單 badge）
onMounted(async () => {
  try {
    const res = await $fetch<{ success: boolean; data?: any[] }>('/api/admin/leads?status=new')
    if (res?.success) {
      pendingLeadsCount.value = res.data?.length || 0
    }
  } catch (error) {
    console.error('Error fetching leads count:', error)
  }
})

// Logout function
async function logout() {
  try {
    await $fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// 自助修改密碼
const showPasswordModal = ref(false)
const pwSaving = ref(false)
const pwError = ref('')
const pwForm = reactive({ current: '', next: '', confirm: '' })

function openPasswordModal() {
  pwForm.current = ''
  pwForm.next = ''
  pwForm.confirm = ''
  pwError.value = ''
  showPasswordModal.value = true
}

async function submitPassword() {
  if (pwSaving.value) return
  pwError.value = ''
  if (!pwForm.current || !pwForm.next) {
    pwError.value = '請填寫目前密碼與新密碼'
    return
  }
  const strengthErr = validatePasswordStrength(pwForm.next)
  if (strengthErr) {
    pwError.value = strengthErr
    return
  }
  if (pwForm.next !== pwForm.confirm) {
    pwError.value = '兩次輸入的新密碼不一致'
    return
  }
  pwSaving.value = true
  try {
    await $fetch('/api/admin/auth/change-password', {
      method: 'POST',
      body: { currentPassword: pwForm.current, newPassword: pwForm.next },
    })
    showPasswordModal.value = false
    alert('密碼已更新，下次登入請使用新密碼')
  } catch (e: any) {
    pwError.value = e?.data?.statusMessage || e?.statusMessage || '更新失敗'
  } finally {
    pwSaving.value = false
  }
}

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="admin-root min-h-screen flex bg-gray-100 font-sans">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transition-transform lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-800">
        <NuxtLink to="/admin" class="text-xl font-bold text-orange">
          練健康 CMS
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-3">
          <li v-for="item in visibleMenuItems" :key="item.path">
            <NuxtLink
              :to="item.path"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive(item.path)
                  ? 'bg-orange text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              ]"
              @click="isSidebarOpen = false"
            >
              <!-- Dashboard Icon -->
              <svg v-if="item.icon === 'dashboard'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <!-- Calendar Icon -->
              <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <!-- User Group Icon (團課預約) -->
              <svg v-else-if="item.icon === 'usergroup'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <!-- Briefcase Icon -->
              <svg v-else-if="item.icon === 'briefcase'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <!-- Store Icon -->
              <svg v-else-if="item.icon === 'store'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <!-- People Icon -->
              <svg v-else-if="item.icon === 'people'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <!-- School Icon -->
              <svg v-else-if="item.icon === 'school'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <!-- Chart Icon -->
              <svg v-else-if="item.icon === 'chart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <!-- Help Icon -->
              <svg v-else-if="item.icon === 'help'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Users Icon -->
              <svg v-else-if="item.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- Settings Icon -->
              <svg v-else-if="item.icon === 'settings'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>

              <span>{{ item.name }}</span>

              <!-- Badge for pending leads -->
              <span
                v-if="item.badge && pendingLeadsCount > 0"
                class="ml-auto bg-orange text-white text-xs px-2 py-0.5 rounded-full"
              >
                {{ pendingLeadsCount }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Back to site -->
      <div class="px-3 py-2">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回官網
        </NuxtLink>
      </div>

      <!-- User Info -->
      <div class="p-4 border-t border-gray-800">
        <div v-if="user" class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange rounded-full flex items-center justify-center text-white font-medium">
            {{ user.name?.charAt(0) || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ user.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
          </div>
          <button
            @click="logout"
            class="p-2 text-gray-400 hover:text-white transition-colors"
            title="登出"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <button
          v-if="user"
          @click="openPasswordModal"
          class="mt-3 w-full flex items-center gap-2 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-gray-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          修改密碼
        </button>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="isSidebarOpen = false"
    />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col lg:pl-64">
      <!-- Top Header (Mobile) -->
      <header class="sticky top-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:hidden z-30">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="ml-4 font-bold text-orange">練健康 CMS</span>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-auto">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
        </div>
        <!-- Content -->
        <slot v-else />
      </main>
    </div>

    <!-- 修改密碼 Modal（所有登入者皆可自助修改）-->
    <div
      v-if="showPasswordModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      @click.self="showPasswordModal = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">修改密碼</h2>
        <div v-if="pwError" class="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{{ pwError }}</div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目前密碼</label>
            <input v-model="pwForm.current" type="password" autocomplete="current-password" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">新密碼（{{ PASSWORD_HINT }}）</label>
            <input v-model="pwForm.next" type="password" autocomplete="new-password" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
            <input v-model="pwForm.confirm" type="password" autocomplete="new-password" @keyup.enter="submitPassword" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showPasswordModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
          <button @click="submitPassword" :disabled="pwSaving" class="px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-60">
            {{ pwSaving ? '更新中…' : '更新密碼' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- 後台下拉選單：關掉原生箭頭、改自訂箭頭並往內縮（左移一點） -->
<style>
.admin-root select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.85rem center;
  background-size: 1.05em 1.05em;
  padding-right: 2.25rem;
}
</style>
