<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ROLE_OPTIONS, ROLE_LABELS } from '~/utils/adminAccess'
import { validatePasswordStrength, PASSWORD_HINT } from '~/utils/passwordPolicy'

definePageMeta({ layout: 'admin' })
useHead({ title: '使用者管理｜練健康後台' })

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string | null
}

const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref('')

const errMsg = (e: any, fallback: string) =>
  e?.data?.statusMessage || e?.data?.message || e?.statusMessage || fallback

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
const createForm = reactive({ name: '', email: '', password: '', role: 'sales' })
function openCreate() {
  createForm.name = ''
  createForm.email = ''
  createForm.password = ''
  createForm.role = 'sales'
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
  creating.value = true
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: { ...createForm } })
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
const editForm = reactive({ id: '', name: '', email: '', role: 'sales', isActive: true, password: '' })
function openEdit(u: AdminUser) {
  editForm.id = u.id
  editForm.name = u.name
  editForm.email = u.email
  editForm.role = u.role
  editForm.isActive = u.isActive
  editForm.password = ''
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
  saving.value = true
  try {
    const body: any = { name: editForm.name, role: editForm.role, isActive: editForm.isActive }
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
        <p class="text-sm text-gray-500 mt-1">建立與管理後台帳號、指派角色權限</p>
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

    <!-- 角色說明 -->
    <div class="bg-blue-50 border border-blue-100 text-blue-800 text-sm px-4 py-3 rounded-lg mb-4">
      <strong>名單專員</strong>：登入後只能看到「客戶預約」與「合作表單」兩個頁面，適合負責跟進名單的同仁。
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
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">角色</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">狀態</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ u.name }}</td>
            <td class="px-6 py-4 text-gray-600 break-all">{{ u.email }}</td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex text-xs font-medium px-2.5 py-1 rounded-full',
                  u.role === 'admin' ? 'bg-purple-100 text-purple-700'
                    : u.role === 'sales' ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600',
                ]"
              >
                {{ ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role }}
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
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select v-model="createForm.role" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange">
              <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
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
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-1">編輯帳號</h2>
        <p class="text-sm text-gray-400 mb-4 break-all">{{ editForm.email }}</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="editForm.name" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select v-model="editForm.role" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange">
              <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
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
