<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ROLE_LABELS, ASSIGNABLE_PAGES } from '~/utils/adminAccess'
import { validatePasswordStrength, PASSWORD_HINT } from '~/utils/passwordPolicy'

definePageMeta({ layout: 'admin' })
useHead({ title: '使用者管理｜練健康後台' })

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  permissions?: string[]
  isActive: boolean
  createdAt: string | null
}

const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref('')

const errMsg = (e: any, fallback: string) =>
  e?.data?.statusMessage || e?.data?.message || e?.statusMessage || fallback

// 客戶預約 / 團課 / 合作三頁 = 常見「名單專員」預設勾選
const DEFAULT_LEADS_PAGES = ['/admin/leads', '/admin/group-classes', '/admin/cooperation']

// 舊角色轉自訂時的等效頁面（避免既有帳號被降權）
function pagesForLegacyRole(role: string): string[] {
  if (role === 'sales') return [...DEFAULT_LEADS_PAGES]
  // editor / store_staff → 全部可指派頁
  return ASSIGNABLE_PAGES.map((p) => p.path)
}

function roleBadge(u: AdminUser) {
  if (u.role === 'admin') return { text: ROLE_LABELS.admin, cls: 'bg-purple-100 text-purple-700' }
  if (u.role === 'custom') return { text: `自訂（${(u.permissions || []).length} 頁）`, cls: 'bg-blue-100 text-blue-700' }
  if (u.role === 'sales') return { text: ROLE_LABELS.sales, cls: 'bg-amber-100 text-amber-700' }
  return { text: ROLE_LABELS[u.role] || u.role, cls: 'bg-gray-100 text-gray-600' }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: AdminUser[] }>('/api/admin/users')
    users.value = res.data || []
  } catch (e: any) {
    error.value = errMsg(e, '載入失敗')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// 新增
const showCreate = ref(false)
const creating = ref(false)
const createForm = reactive({
  name: '',
  email: '',
  password: '',
  accessMode: 'custom' as 'admin' | 'custom',
  permissions: [...DEFAULT_LEADS_PAGES] as string[],
})
function openCreate() {
  createForm.name = ''
  createForm.email = ''
  createForm.password = ''
  createForm.accessMode = 'custom'
  createForm.permissions = [...DEFAULT_LEADS_PAGES]
  showCreate.value = true
}
async function submitCreate() {
  if (creating.value) return
  if (!createForm.name || !createForm.email || !createForm.password) {
    alert('請填寫姓名、Email、密碼')
    return
  }
  const pwErr = validatePasswordStrength(createForm.password)
  if (pwErr) {
    alert(pwErr)
    return
  }
  if (createForm.accessMode === 'custom' && createForm.permissions.length === 0) {
    alert('請至少勾選一個頁面，或選擇「系統管理員」')
    return
  }
  creating.value = true
  try {
    const role = createForm.accessMode === 'admin' ? 'admin' : 'custom'
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role,
        permissions: role === 'custom' ? createForm.permissions : [],
      },
    })
    showCreate.value = false
    await load()
  } catch (e: any) {
    alert(errMsg(e, '建立失敗'))
  } finally {
    creating.value = false
  }
}

// 編輯
const showEdit = ref(false)
const saving = ref(false)
const editForm = reactive({
  id: '',
  name: '',
  email: '',
  accessMode: 'custom' as 'admin' | 'custom',
  permissions: [] as string[],
  isActive: true,
  password: '',
})
function openEdit(u: AdminUser) {
  editForm.id = u.id
  editForm.name = u.name
  editForm.email = u.email
  editForm.isActive = u.isActive
  editForm.password = ''
  if (u.role === 'admin') {
    editForm.accessMode = 'admin'
    editForm.permissions = []
  } else if (u.role === 'custom') {
    editForm.accessMode = 'custom'
    editForm.permissions = [...(u.permissions || [])]
  } else {
    // 舊角色：轉為自訂並預先勾選等效頁面（儲存後即成為 custom）
    editForm.accessMode = 'custom'
    editForm.permissions = u.permissions && u.permissions.length ? [...u.permissions] : pagesForLegacyRole(u.role)
  }
  showEdit.value = true
}
async function submitEdit() {
  if (saving.value) return
  if (editForm.password) {
    const pwErr = validatePasswordStrength(editForm.password)
    if (pwErr) {
      alert(pwErr)
      return
    }
  }
  if (editForm.accessMode === 'custom' && editForm.permissions.length === 0) {
    alert('請至少勾選一個頁面，或選擇「系統管理員」')
    return
  }
  saving.value = true
  try {
    const role = editForm.accessMode === 'admin' ? 'admin' : 'custom'
    const body: any = {
      name: editForm.name,
      role,
      permissions: role === 'custom' ? editForm.permissions : [],
      isActive: editForm.isActive,
    }
    if (editForm.password) body.password = editForm.password
    await $fetch(`/api/admin/users/${editForm.id}`, { method: 'PATCH', body })
    showEdit.value = false
    await load()
  } catch (e: any) {
    alert(errMsg(e, '儲存失敗'))
  } finally {
    saving.value = false
  }
}

async function toggleActive(u: AdminUser) {
  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } })
    await load()
  } catch (e: any) {
    alert(errMsg(e, '操作失敗'))
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">使用者管理</h1>
        <p class="text-sm text-gray-500 mt-1">建立與管理後台帳號、指派可存取的頁面權限</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 bg-orange text-white font-medium px-4 py-2.5 rounded-lg hover:bg-orange-500 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增帳號
      </button>
    </div>

    <!-- 權限說明 -->
    <div class="bg-blue-50 border border-blue-100 text-blue-800 text-sm px-4 py-3 rounded-lg mb-4">
      建立帳號時可選「<strong>系統管理員</strong>」（可存取全部）或「<strong>自訂權限</strong>」，自訂時勾選這個帳號能看到並編輯的左側選單頁面。「使用者管理」永遠僅系統管理員可用。
    </div>

    <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{{ error }}</div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
      </div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">姓名</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">權限</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ u.name }}</td>
            <td class="px-6 py-4 text-gray-600 break-all">{{ u.email }}</td>
            <td class="px-6 py-4">
              <span :class="['inline-flex text-xs font-medium px-2.5 py-1 rounded-full', roleBadge(u).cls]">
                {{ roleBadge(u).text }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex text-xs font-medium px-2.5 py-1 rounded-full',
                  u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                ]"
              >
                {{ u.isActive ? '啟用' : '停用' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openEdit(u)"
                  class="text-sm text-navy-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  編輯
                </button>
                <button
                  @click="toggleActive(u)"
                  :class="[
                    'text-sm px-3 py-1.5 rounded-lg border transition-colors',
                    u.isActive
                      ? 'text-red-600 border-red-200 hover:bg-red-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50',
                  ]"
                >
                  {{ u.isActive ? '停用' : '啟用' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="5" class="px-6 py-12 text-center text-gray-400">尚無使用者</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增 Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showCreate = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-4">新增帳號</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="createForm.name" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email（登入帳號）</label>
            <input v-model="createForm.email" type="email" autocomplete="off" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">密碼（{{ PASSWORD_HINT }}）</label>
            <input v-model="createForm.password" type="text" autocomplete="new-password" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">權限</label>
            <div class="space-y-1.5">
              <label class="flex items-start gap-2 cursor-pointer">
                <input v-model="createForm.accessMode" type="radio" value="admin" class="mt-1 text-orange focus:ring-orange" />
                <span class="text-sm"><span class="font-medium text-gray-900">系統管理員</span> <span class="text-gray-400 text-xs">全部頁面（含使用者管理）</span></span>
              </label>
              <label class="flex items-start gap-2 cursor-pointer">
                <input v-model="createForm.accessMode" type="radio" value="custom" class="mt-1 text-orange focus:ring-orange" />
                <span class="text-sm"><span class="font-medium text-gray-900">自訂權限</span> <span class="text-gray-400 text-xs">只開放勾選的頁面</span></span>
              </label>
            </div>
            <div v-if="createForm.accessMode === 'custom'" class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3">
              <label v-for="p in ASSIGNABLE_PAGES" :key="p.path" class="flex items-center gap-2 cursor-pointer text-sm">
                <input v-model="createForm.permissions" type="checkbox" :value="p.path" class="w-4 h-4 rounded border-gray-300 text-orange focus:ring-orange" />
                <span class="text-gray-700">{{ p.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showCreate = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
          <button @click="submitCreate" :disabled="creating" class="px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-60">
            {{ creating ? '建立中…' : '建立' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 編輯 Modal -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showEdit = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-1">編輯帳號</h2>
        <p class="text-sm text-gray-400 mb-4 break-all">{{ editForm.email }}</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="editForm.name" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">權限</label>
            <div class="space-y-1.5">
              <label class="flex items-start gap-2 cursor-pointer">
                <input v-model="editForm.accessMode" type="radio" value="admin" class="mt-1 text-orange focus:ring-orange" />
                <span class="text-sm"><span class="font-medium text-gray-900">系統管理員</span> <span class="text-gray-400 text-xs">全部頁面（含使用者管理）</span></span>
              </label>
              <label class="flex items-start gap-2 cursor-pointer">
                <input v-model="editForm.accessMode" type="radio" value="custom" class="mt-1 text-orange focus:ring-orange" />
                <span class="text-sm"><span class="font-medium text-gray-900">自訂權限</span> <span class="text-gray-400 text-xs">只開放勾選的頁面</span></span>
              </label>
            </div>
            <div v-if="editForm.accessMode === 'custom'" class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3">
              <label v-for="p in ASSIGNABLE_PAGES" :key="p.path" class="flex items-center gap-2 cursor-pointer text-sm">
                <input v-model="editForm.permissions" type="checkbox" :value="p.path" class="w-4 h-4 rounded border-gray-300 text-orange focus:ring-orange" />
                <span class="text-gray-700">{{ p.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">重設密碼（留空＝不變更；{{ PASSWORD_HINT }}）</label>
            <input v-model="editForm.password" type="text" autocomplete="new-password" placeholder="輸入新密碼以重設" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="editForm.isActive" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-orange focus:ring-orange" />
            <span class="text-sm text-gray-700">啟用此帳號</span>
          </label>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showEdit = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
          <button @click="submitEdit" :disabled="saving" class="px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-60">
            {{ saving ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
