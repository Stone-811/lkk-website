<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const coachId = computed(() => route.params.id as string)
const isNew = computed(() => coachId.value === 'new')

useHead({
  title: computed(() => isNew.value ? '新增教練｜練健康後台' : '編輯教練｜練健康後台'),
})

interface StoreOption {
  value: string
  label: string
}

interface FormData {
  id: string
  name: string
  slug: string
  roleTitle: string
  storeId: string
  photo: string
  specialties: string[]
  certifications: string[]
  experiences: string[]
  education: string
  description: string
  sortOrder: number
  isActive: boolean
}

const loading = ref(!isNew.value)
const saving = ref(false)
const storeOptions = ref<StoreOption[]>([])
const allCoaches = ref<any[]>([])

const formData = ref<FormData>({
  id: '',
  name: '',
  slug: '',
  roleTitle: '',
  storeId: '',
  photo: '',
  specialties: [],
  certifications: [],
  experiences: [],
  education: '',
  description: '',
  sortOrder: 0,
  isActive: true,
})

// Temp input values for array fields
const newSpecialty = ref('')
const newCertification = ref('')
const newExperience = ref('')
const uploadingPhoto = ref(false)

onMounted(async () => {
  // Fetch stores
  try {
    const storesRes = await $fetch<{ success: boolean; data: any[] }>('/api/public/stores')
    if (storesRes.success) {
      storeOptions.value = storesRes.data.map(s => ({ value: s.id, label: s.name }))
    }
  } catch (error) {
    console.error('Failed to fetch stores:', error)
  }

  if (isNew.value) {
    // Fetch all coaches for sortOrder calculation
    try {
      const coachesRes = await $fetch<{ success: boolean; data: any[] }>('/api/admin/coaches')
      if (coachesRes.success) {
        allCoaches.value = coachesRes.data
      }
    } catch (error) {
      console.error('Failed to fetch coaches:', error)
    }
    return
  }

  // Fetch coach data for editing
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/admin/coaches/${coachId.value}`)
    if (response.success && response.data) {
      const coachData = response.data
      const edu = coachData.education
      formData.value = {
        id: coachData.id || '',
        name: coachData.name || '',
        slug: coachData.slug || '',
        roleTitle: coachData.roleTitle || '',
        storeId: coachData.storeId || '',
        photo: coachData.photo || '',
        specialties: coachData.specialties || [],
        certifications: coachData.certifications || [],
        experiences: coachData.experiences || [],
        education: Array.isArray(edu) ? edu.join(', ') : (edu || ''),
        description: coachData.description || '',
        sortOrder: coachData.sortOrder || 0,
        isActive: coachData.isActive ?? true,
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch coach:', error)
    alert('載入教練資料失敗')
    router.push('/admin/coaches')
  } finally {
    loading.value = false
  }
})

function generateSlug(name: string): string {
  const englishSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (englishSlug.length < 2) {
    return `coach-${Date.now().toString(36)}`
  }
  return englishSlug
}

function handleStoreChange(storeId: string) {
  formData.value.storeId = storeId

  if (isNew.value && storeId) {
    const storeCoaches = allCoaches.value.filter(c => c.storeId === storeId)
    if (storeCoaches.length > 0) {
      const maxSortOrder = Math.max(...storeCoaches.map(c => c.sortOrder || 0))
      formData.value.sortOrder = maxSortOrder + 1
    } else {
      formData.value.sortOrder = 1
    }
  }
}

function addToArray(field: 'specialties' | 'certifications' | 'experiences', value: string) {
  if (value.trim()) {
    formData.value[field].push(value.trim())
  }
}

function removeFromArray(field: 'specialties' | 'certifications' | 'experiences', index: number) {
  formData.value[field].splice(index, 1)
}

async function handleSubmit() {
  if (!formData.value.name || !formData.value.storeId) {
    alert('請填寫必填欄位')
    return
  }

  saving.value = true

  try {
    const slug = formData.value.slug || generateSlug(formData.value.name)
    const payload = {
      name: formData.value.name,
      slug,
      roleTitle: formData.value.roleTitle,
      storeId: formData.value.storeId,
      photo: formData.value.photo,
      specialties: formData.value.specialties,
      certifications: formData.value.certifications,
      experiences: formData.value.experiences,
      education: formData.value.education ? formData.value.education.split(',').map(s => s.trim()).filter(Boolean) : [],
      description: formData.value.description,
      sortOrder: formData.value.sortOrder,
      isActive: formData.value.isActive,
    }

    const url = isNew.value ? '/api/admin/coaches' : `/api/admin/coaches/${coachId.value}`
    const method = isNew.value ? 'POST' : 'PATCH'

    const response = await $fetch<{ success: boolean; error?: string }>(url, {
      method,
      body: payload,
    })

    if (response.success) {
      router.push('/admin/coaches')
    } else {
      alert(response.error || '儲存失敗')
    }
  } catch (error: any) {
    console.error('Save failed:', error)
    alert(error.data?.message || '儲存失敗，請稍後再試')
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
    formDataUpload.append('folder', `coaches`)
    formDataUpload.append('filename', formData.value.slug || `coach-${Date.now()}`)

    const response = await $fetch<{ success: boolean; data?: { url: string }; error?: string }>('/api/admin/upload', {
      method: 'POST',
      body: formDataUpload,
    })

    if (response.success && response.data) {
      formData.value.photo = response.data.url
    } else {
      alert(response.error || '上傳失敗')
    }
  } catch (error: any) {
    console.error('Upload error:', error)
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
      <NuxtLink to="/admin/coaches" class="text-gray-500 hover:text-gray-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">{{ isNew ? '新增教練' : '編輯教練' }}</h1>
        <p v-if="!isNew && formData.name" class="text-gray-500 text-sm mt-1">編輯「{{ formData.name }}」的資料</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">基本資訊</h2>

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
            <label class="block text-sm font-medium mb-1">職稱</label>
            <input
              type="text"
              v-model="formData.roleTitle"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="例如：資深教練、物理治療師"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              所屬分店 <span class="text-red-500">*</span>
            </label>
            <select
              :value="formData.storeId"
              @change="handleStoreChange(($event.target as HTMLSelectElement).value)"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">請選擇分店</option>
              <option v-for="opt in storeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
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

        <div>
          <label class="block text-sm font-medium mb-1">學歷</label>
          <input
            type="text"
            v-model="formData.education"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="例如：台北體育大學運動科學系"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">個人簡介</label>
          <textarea
            v-model="formData.description"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows="3"
            placeholder="簡短介紹教練的專業背景和教學理念"
          />
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
            <img v-if="formData.photo" :src="formData.photo" :alt="formData.name" class="w-full h-full object-cover object-top" />
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

      <!-- Specialties -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">專長</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(item, index) in formData.specialties"
            :key="index"
            class="inline-flex items-center gap-1 bg-navy/10 text-navy px-3 py-1 rounded-full text-sm"
          >
            {{ item }}
            <button
              type="button"
              @click="removeFromArray('specialties', index)"
              class="hover:text-red-500"
            >
              ×
            </button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="newSpecialty"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="輸入專長，例如：肌力訓練"
            @keydown.enter.prevent="addToArray('specialties', newSpecialty); newSpecialty = ''"
          />
          <button
            type="button"
            @click="addToArray('specialties', newSpecialty); newSpecialty = ''"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Certifications -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">證照</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(item, index) in formData.certifications"
            :key="index"
            class="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
          >
            {{ item }}
            <button
              type="button"
              @click="removeFromArray('certifications', index)"
              class="hover:text-red-500"
            >
              ×
            </button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="newCertification"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="輸入證照，例如：ACE-CPT"
            @keydown.enter.prevent="addToArray('certifications', newCertification); newCertification = ''"
          />
          <button
            type="button"
            @click="addToArray('certifications', newCertification); newCertification = ''"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Experiences -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-bold text-lg border-b pb-2">經歷</h2>
        <div class="space-y-2">
          <div
            v-for="(item, index) in formData.experiences"
            :key="index"
            class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded"
          >
            <span class="flex-1">{{ item }}</span>
            <button
              type="button"
              @click="removeFromArray('experiences', index)"
              class="text-red-500 hover:text-red-700"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="newExperience"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="輸入經歷，例如：5年健身教練經驗"
            @keydown.enter.prevent="addToArray('experiences', newExperience); newExperience = ''"
          />
          <button
            type="button"
            @click="addToArray('experiences', newExperience); newExperience = ''"
            class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-4">
        <NuxtLink to="/admin/coaches" class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
          取消
        </NuxtLink>
        <button
          type="submit"
          :disabled="saving"
          class="bg-orange text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {{ saving ? '儲存中...' : '儲存' }}
        </button>
      </div>
    </form>
  </div>
</template>
