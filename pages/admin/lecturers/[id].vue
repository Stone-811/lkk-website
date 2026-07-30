<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const lecturerId = computed(() => route.params.id as string)
const isNew = computed(() => lecturerId.value === 'new')

useHead({
  title: computed(() => isNew.value ? '新增講師｜練健康後台' : '編輯講師｜練健康後台'),
})

interface FormData {
  name: string
  slug: string
  photo: string
  title: string
  organization: string
  region: string
  countries: string[]
  type: 'lkk' | 'partner' | 'overseas'
  description: string
  specialties: string[]
  courses: string[]
  certifications: string[]
  sortOrder: number
  isActive: boolean
}

const loading = ref(!isNew.value)
const saving = ref(false)
const error = ref('')
const uploadingPhoto = ref(false)

const formData = ref<FormData>({
  name: '',
  slug: '',
  photo: '',
  title: '',
  organization: '',
  region: '',
  countries: [],
  type: 'lkk',
  description: '',
  specialties: [],
  courses: [],
  certifications: [],
  sortOrder: 0,
  isActive: true,
})

// Temp inputs for array fields
const specialtyInput = ref('')
const courseInput = ref('')
const certInput = ref('')
const countryInput = ref('')

onMounted(async () => {
  if (isNew.value) {
    // Get max sortOrder for new lecturer
    try {
      const response = await $fetch<{ success: boolean; data: any[] }>('/api/admin/lecturers')
      if (response.success && response.data.length > 0) {
        const maxSortOrder = Math.max(...response.data.map(l => l.sortOrder || 0))
        formData.value.sortOrder = maxSortOrder + 1
      } else {
        formData.value.sortOrder = 1
      }
    } catch (err) {
      console.error('Failed to fetch max sortOrder:', err)
    }
    return
  }

  // Fetch lecturer data for editing
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/admin/lecturers/${lecturerId.value}`)
    if (response.success && response.data) {
      const data = response.data
      formData.value = {
        name: data.name || '',
        slug: data.slug || '',
        photo: data.photo || '',
        title: data.title || '',
        organization: data.organization || '',
        region: data.region || '',
        countries: data.countries || [],
        type: data.type || 'lkk',
        description: data.description || '',
        specialties: data.specialties || [],
        courses: data.courses || [],
        certifications: data.certifications || [],
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      }
    }
  } catch (err: any) {
    error.value = '載入失敗'
    console.error('Failed to fetch lecturer:', err)
  } finally {
    loading.value = false
  }
})

function addToArray(field: 'specialties' | 'courses' | 'certifications' | 'countries', value: string) {
  if (value.trim()) {
    formData.value[field].push(value.trim())
  }
}

function removeFromArray(field: 'specialties' | 'courses' | 'certifications' | 'countries', index: number) {
  formData.value[field].splice(index, 1)
}

async function handleSubmit() {
  if (!formData.value.name || !formData.value.slug || !formData.value.type) {
    alert('請填寫必填欄位')
    return
  }

  saving.value = true
  error.value = ''

  try {
    const url = isNew.value ? '/api/admin/lecturers' : `/api/admin/lecturers/${lecturerId.value}`
    const method = isNew.value ? 'POST' : 'PATCH'

    const response = await $fetch<{ success: boolean; error?: string }>(url, {
      method,
      body: formData.value,
    })

    if (response.success) {
      router.push('/admin/lecturers')
    } else {
      error.value = response.error || '儲存失敗'
    }
  } catch (err: any) {
    error.value = err.data?.message || '儲存失敗'
    console.error('Save failed:', err)
  } finally {
    saving.value = false
  }
}

async function handlePhotoUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    alert('僅支援 JPG、PNG、WebP、GIF 格式')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('檔案大小不可超過 5MB')
    return
  }

  uploadingPhoto.value = true

  try {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('folder', `lecturers`)
    formDataUpload.append('filename', formData.value.slug || `lecturer-${Date.now()}`)

    const response = await $fetch<{ success: boolean; data?: { url: string }; error?: string }>('/api/admin/upload', {
      method: 'POST',
      body: formDataUpload,
    })

    if (response.success && response.data) {
      formData.value.photo = response.data.url
    } else {
      alert(response.error || '上傳失敗')
    }
  } catch (err: any) {
    console.error('Upload error:', err)
    alert('上傳失敗，請稍後再試')
  } finally {
    uploadingPhoto.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/admin/lecturers" class="text-gray-500 hover:text-gray-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">{{ isNew ? '新增講師' : '編輯講師' }}</h1>
        <p v-if="!isNew && formData.name" class="text-gray-500 text-sm mt-1">編輯「{{ formData.name }}」的資料</p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">基本資料</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              姓名 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="formData.name"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              網址代稱 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="formData.slug"
              @input="formData.slug = formData.slug.toLowerCase().replace(/\s+/g, '-')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="例如: wang-xiaoming"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              講師類型 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.type"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="lkk">練健康授權講師</option>
              <option value="partner">合作講師</option>
              <option value="overseas">海外授權講師</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">職稱</label>
            <input
              type="text"
              v-model="formData.title"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="例如: 首席講師"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">所屬機構</label>
            <input
              type="text"
              v-model="formData.organization"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">排序</label>
            <input
              type="number"
              v-model.number="formData.sortOrder"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              min="0"
            />
            <p class="text-xs text-gray-500 mt-1">數字越小越前面</p>
          </div>
        </div>

        <!-- Overseas specific fields -->
        <div v-if="formData.type === 'overseas'" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <label class="block text-sm font-medium mb-1">地區</label>
            <input
              type="text"
              v-model="formData.region"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="例如: 東南亞"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">授權國家</label>
            <div class="flex gap-2">
              <input
                type="text"
                v-model="countryInput"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                placeholder="輸入後按 Enter"
                @keydown.enter.prevent="addToArray('countries', countryInput); countryInput = ''"
              />
              <button
                type="button"
                @click="addToArray('countries', countryInput); countryInput = ''"
                class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                新增
              </button>
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="(c, i) in formData.countries"
                :key="i"
                class="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-sm"
              >
                {{ c }}
                <button type="button" @click="removeFromArray('countries', i)" class="hover:text-green-900">×</button>
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            v-model="formData.isActive"
            class="w-4 h-4 text-orange rounded"
          />
          <label for="isActive" class="text-sm">上架顯示</label>
        </div>
      </div>

      <!-- Photo -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">照片</h2>
        <div class="flex items-center gap-4">
          <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            <img v-if="formData.photo" :src="formData.photo" :alt="formData.name" class="w-full h-full object-cover" />
            <svg v-else class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <label :class="['cursor-pointer inline-flex items-center gap-2 bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors', uploadingPhoto && 'opacity-50 cursor-not-allowed']">
              {{ uploadingPhoto ? '上傳中...' : '上傳照片' }}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                @change="handlePhotoUpload"
                :disabled="uploadingPhoto"
              />
            </label>
            <p class="text-xs text-gray-500 mt-1">建議尺寸 400x400，JPG 或 PNG</p>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">簡介</h2>
        <textarea
          v-model="formData.description"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
          placeholder="講師簡介..."
        />
      </div>

      <!-- Specialties -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">專長領域</h2>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="specialtyInput"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="輸入專長後按 Enter"
            @keydown.enter.prevent="addToArray('specialties', specialtyInput); specialtyInput = ''"
          />
          <button
            type="button"
            @click="addToArray('specialties', specialtyInput); specialtyInput = ''"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            新增
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(s, i) in formData.specialties"
            :key="i"
            class="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
          >
            {{ s }}
            <button type="button" @click="removeFromArray('specialties', i)" class="hover:text-orange-900">×</button>
          </span>
        </div>
      </div>

      <!-- Courses -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">授課項目</h2>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="courseInput"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="輸入課程後按 Enter"
            @keydown.enter.prevent="addToArray('courses', courseInput); courseInput = ''"
          />
          <button
            type="button"
            @click="addToArray('courses', courseInput); courseInput = ''"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            新增
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(c, i) in formData.courses"
            :key="i"
            class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {{ c }}
            <button type="button" @click="removeFromArray('courses', i)" class="hover:text-blue-900">×</button>
          </span>
        </div>
      </div>

      <!-- Certifications -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">專業認證</h2>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="certInput"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="輸入認證後按 Enter"
            @keydown.enter.prevent="addToArray('certifications', certInput); certInput = ''"
          />
          <button
            type="button"
            @click="addToArray('certifications', certInput); certInput = ''"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            新增
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(c, i) in formData.certifications"
            :key="i"
            class="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
          >
            {{ c }}
            <button type="button" @click="removeFromArray('certifications', i)" class="hover:text-gray-900">×</button>
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-4">
        <NuxtLink to="/admin/lecturers" class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
          取消
        </NuxtLink>
        <button
          type="submit"
          :disabled="saving"
          class="bg-orange text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {{ saving ? '儲存中...' : isNew ? '建立講師' : '儲存變更' }}
        </button>
      </div>
    </form>
  </div>
</template>
