<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { getStoreDefaults } = useStoreDefaults()

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const storeId = computed(() => route.params.id as string)
const isNew = computed(() => storeId.value === 'new')

useHead({
  title: computed(() => isNew.value ? '新增分店｜練健康後台' : '編輯分店｜練健康後台'),
})

// 分店環境照片分類定義
const imageCategories = [
  { key: 'env1', label: '主訓練區（分店頁大圖）', description: '主訓練區' },
  { key: 'env2', label: '一對一訓練空間', description: '一對一訓練空間' },
  { key: 'env3', label: '專業器材區', description: '專業器材區' },
  { key: 'env4', label: '功能性訓練區', description: '功能性訓練區' },
  { key: 'env5', label: '舒適休息區', description: '舒適休息區' },
]

interface StoreImages {
  env1: string
  env2: string
  env3: string
  env4: string
  env5: string
}

interface FormData {
  id: string
  name: string
  slug: string
  city: string
  district: string
  address: string
  phone: string
  googleMapUrl: string
  businessHours: {
    weekday: string
    saturday: string
    sunday: string
    holiday: string
  }
  images: StoreImages
  sortOrder: number
  isActive: boolean
}

const cityOptions = ['台北市', '新北市', '桃園市', '新竹市', '新竹縣', '台中市', '台南市', '高雄市']

const loading = ref(!isNew.value)
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const uploadingImages = ref<Record<string, boolean>>({})

const formData = ref<FormData>({
  id: '',
  name: '',
  slug: '',
  city: '',
  district: '',
  address: '',
  phone: '',
  googleMapUrl: '',
  businessHours: {
    weekday: '09:00 - 21:00',
    saturday: '09:00 - 18:00',
    sunday: '公休',
    holiday: '依公告，請來電確認',
  },
  images: {
    env1: '',
    env2: '',
    env3: '',
    env4: '',
    env5: '',
  },
  sortOrder: 0,
  isActive: true,
})

onMounted(async () => {
  if (isNew.value) {
    // Get max sortOrder for new store
    try {
      const response = await $fetch<{ success: boolean; data: any[] }>('/api/admin/stores')
      if (response.success && response.data.length > 0) {
        const maxSortOrder = Math.max(...response.data.map(s => s.sortOrder || 0))
        formData.value.sortOrder = maxSortOrder + 1
      } else {
        formData.value.sortOrder = 1
      }
    } catch (error) {
      console.error('Failed to fetch stores for sortOrder:', error)
    }
    return
  }

  // Fetch store data for editing
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/admin/stores/${storeId.value}`)
    if (response.success && response.data) {
      const storeData = response.data

      // Parse businessHours
      let businessHours = {
        weekday: '09:00 - 21:00',
        saturday: '09:00 - 18:00',
        sunday: '公休',
        holiday: '依公告，請來電確認',
      }
      if (storeData.businessHours) {
        if (typeof storeData.businessHours === 'string') {
          try {
            const parsed = JSON.parse(storeData.businessHours)
            businessHours = {
              weekday: parsed.weekday || businessHours.weekday,
              saturday: parsed.saturday || parsed.weekend || businessHours.saturday,
              sunday: parsed.sunday || businessHours.sunday,
              holiday: parsed.holiday || businessHours.holiday,
            }
          } catch {
            businessHours.weekday = storeData.businessHours
          }
        } else {
          businessHours = {
            weekday: storeData.businessHours.weekday || businessHours.weekday,
            saturday: storeData.businessHours.saturday || storeData.businessHours.weekend || businessHours.saturday,
            sunday: storeData.businessHours.sunday || businessHours.sunday,
            holiday: storeData.businessHours.holiday || businessHours.holiday,
          }
        }
      }

      // Parse images
      let images = { env1: '', env2: '', env3: '', env4: '', env5: '' }
      if (storeData.images) {
        if (typeof storeData.images === 'object' && !Array.isArray(storeData.images)) {
          images = { ...images, ...storeData.images }
        } else if (Array.isArray(storeData.images)) {
          const imageKeys = ['env1', 'env2', 'env3', 'env4', 'env5'] as const
          storeData.images.forEach((url: string, index: number) => {
            if (url && imageKeys[index]) {
              images[imageKeys[index]] = url
            }
          })
        }
      }

      // 取得預設資料（如果有的話）
      const defaults = getStoreDefaults(storeData.slug || '')

      // 合併預設資料（只在欄位為空時使用預設值）
      formData.value = {
        id: storeData.id || '',
        name: storeData.name || '',
        slug: storeData.slug || '',
        city: storeData.city || '',
        district: storeData.district || '',
        address: storeData.address || '',
        phone: storeData.phone || defaults?.phone || '',
        googleMapUrl: storeData.googleMapUrl || defaults?.googleMapUrl || '',
        businessHours: {
          weekday: businessHours.weekday || defaults?.businessHours?.weekday || '09:00 - 21:00',
          saturday: businessHours.saturday || defaults?.businessHours?.saturday || '09:00 - 18:00',
          sunday: businessHours.sunday || defaults?.businessHours?.sunday || '公休',
          holiday: businessHours.holiday || defaults?.businessHours?.holiday || '依公告，請來電確認',
        },
        images,
        sortOrder: storeData.sortOrder || 0,
        isActive: storeData.isActive ?? true,
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch store:', error)
    alert('載入分店資料失敗')
    router.push('/admin/stores')
  } finally {
    loading.value = false
  }
})

function generateSlug(name: string): string {
  const mapping: Record<string, string> = {
    '台北': 'taipei',
    '新北': 'newtaipei',
    '新竹': 'hsinchu',
    '台中': 'taichung',
    '台南': 'tainan',
    '高雄': 'kaohsiung',
    '南京': 'nanjing',
    '松江': 'songjiang',
    '西門': 'ximending',
    '新店': 'xindian',
    '七張': 'qizhang',
    '民生': 'minsheng',
    '店': '',
  }

  let slug = name.toLowerCase()
  Object.entries(mapping).forEach(([zh, en]) => {
    slug = slug.replace(zh, en)
  })
  return slug.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function handleNameChange(name: string) {
  formData.value.name = name
  if (isNew.value) {
    formData.value.slug = generateSlug(name)
  }
  if (errors.value.name) delete errors.value.name
}

function validateForm(): boolean {
  const newErrors: Record<string, string> = {}

  if (!formData.value.name.trim()) {
    newErrors.name = '請輸入分店名稱'
  }

  if (!formData.value.slug.trim()) {
    newErrors.slug = '請輸入網址代稱'
  } else if (!/^[a-z0-9-]+$/.test(formData.value.slug)) {
    newErrors.slug = '網址代稱僅限小寫英文、數字、連字號'
  }

  if (!formData.value.city) {
    newErrors.city = '請選擇縣市'
  }

  if (!formData.value.district.trim()) {
    newErrors.district = '請輸入區域'
  }

  if (!formData.value.address.trim()) {
    newErrors.address = '請輸入詳細地址'
  }

  if (!formData.value.phone.trim()) {
    newErrors.phone = '請輸入電話'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  saving.value = true

  try {
    const payload = {
      name: formData.value.name.trim(),
      slug: formData.value.slug.trim(),
      city: formData.value.city,
      district: formData.value.district.trim(),
      address: formData.value.address.trim(),
      phone: formData.value.phone.trim(),
      googleMapUrl: formData.value.googleMapUrl.trim(),
      images: formData.value.images,
      sortOrder: formData.value.sortOrder,
      isActive: formData.value.isActive,
    }

    const url = isNew.value ? '/api/admin/stores' : `/api/admin/stores/${storeId.value}`
    const method = isNew.value ? 'POST' : 'PATCH'

    const response = await $fetch<{ success: boolean; error?: string }>(url, {
      method,
      body: payload,
    })

    if (response.success) {
      router.push('/admin/stores')
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

async function handleImageUpload(key: string, event: Event) {
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

  uploadingImages.value[key] = true

  try {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('folder', `stores/${formData.value.slug || 'temp'}`)
    formDataUpload.append('filename', key)

    const response = await $fetch<{ success: boolean; data?: { url: string }; error?: string }>('/api/admin/upload', {
      method: 'POST',
      body: formDataUpload,
    })

    if (response.success && response.data) {
      (formData.value.images as any)[key] = response.data.url
    } else {
      alert(response.error || '上傳失敗')
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    alert('上傳失敗，請稍後再試')
  } finally {
    uploadingImages.value[key] = false
  }
}

function removeImage(key: string) {
  (formData.value.images as any)[key] = ''
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/admin/stores" class="text-gray-500 hover:text-gray-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">{{ isNew ? '新增分店' : '編輯分店' }}</h1>
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
              分店名稱 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              :value="formData.name"
              @input="handleNameChange(($event.target as HTMLInputElement).value)"
              :class="['w-full border rounded-lg px-3 py-2', errors.name ? 'border-red-500' : 'border-gray-300']"
              placeholder="例如：台北南京店"
            />
            <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              網址代稱 (Slug) <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="formData.slug"
              @input="errors.slug && delete errors.slug"
              :class="['w-full border rounded-lg px-3 py-2', errors.slug ? 'border-red-500' : 'border-gray-300']"
              placeholder="taipei-nanjing"
            />
            <p v-if="errors.slug" class="text-red-500 text-xs mt-1">{{ errors.slug }}</p>
            <p v-else class="text-xs text-gray-500 mt-1">僅限小寫英文、數字、連字號</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              縣市 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.city"
              @change="errors.city && delete errors.city"
              :class="['w-full border rounded-lg px-3 py-2', errors.city ? 'border-red-500' : 'border-gray-300']"
            >
              <option value="">請選擇</option>
              <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
            </select>
            <p v-if="errors.city" class="text-red-500 text-xs mt-1">{{ errors.city }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              區域 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="formData.district"
              @input="errors.district && delete errors.district"
              :class="['w-full border rounded-lg px-3 py-2', errors.district ? 'border-red-500' : 'border-gray-300']"
              placeholder="例如：松山區"
            />
            <p v-if="errors.district" class="text-red-500 text-xs mt-1">{{ errors.district }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            詳細地址 <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            v-model="formData.address"
            @input="errors.address && delete errors.address"
            :class="['w-full border rounded-lg px-3 py-2', errors.address ? 'border-red-500' : 'border-gray-300']"
            placeholder="例如：南京東路四段 123 號 2 樓"
          />
          <p v-if="errors.address" class="text-red-500 text-xs mt-1">{{ errors.address }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              電話 <span class="text-red-500">*</span>
            </label>
            <input
              type="tel"
              v-model="formData.phone"
              @input="errors.phone && delete errors.phone"
              :class="['w-full border rounded-lg px-3 py-2', errors.phone ? 'border-red-500' : 'border-gray-300']"
              placeholder="(02) 2712-3456"
            />
            <p v-if="errors.phone" class="text-red-500 text-xs mt-1">{{ errors.phone }}</p>
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

      <!-- 營業時間、交通資訊（含 Google Maps 連結）已改由網站程式統一維護（見 pages/locations/[store].vue、composables/useStoreDefaults.ts），後台不再顯示/編輯 -->

      <!-- Images -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 class="font-bold text-lg border-b pb-2">分店照片</h2>
          <p class="text-sm text-gray-500 mt-2">
            請依照各區域上傳對應的照片（支援 JPG、PNG、WebP、GIF，最大 5MB）
          </p>
        </div>

        <div v-for="category in imageCategories" :key="category.key" class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium">{{ category.label }}</label>
            <span class="text-xs text-gray-400">{{ category.description }}</span>
          </div>

          <!-- Image preview -->
          <div v-if="(formData.images as any)[category.key]" class="relative rounded-lg overflow-hidden border bg-gray-50 group">
            <img
              :src="(formData.images as any)[category.key]"
              :alt="`${category.label}預覽`"
              class="w-full h-48 object-cover"
            />
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label class="cursor-pointer bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                更換圖片
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="hidden"
                  @change="handleImageUpload(category.key, $event)"
                  :disabled="uploadingImages[category.key]"
                />
              </label>
              <button
                type="button"
                @click="removeImage(category.key)"
                class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                刪除
              </button>
            </div>
          </div>

          <!-- Upload area -->
          <label
            v-else
            :class="[
              'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              uploadingImages[category.key]
                ? 'border-orange bg-orange/5'
                : 'border-gray-300 hover:border-orange hover:bg-orange/5'
            ]"
          >
            <div v-if="uploadingImages[category.key]" class="flex flex-col items-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mb-2"></div>
              <span class="text-sm text-orange">上傳中...</span>
            </div>
            <div v-else class="flex flex-col items-center">
              <svg class="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-gray-500 mb-1">點擊上傳{{ category.description }}照片</span>
              <span class="text-xs text-gray-400">JPG、PNG、WebP、GIF（最大 5MB）</span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="hidden"
              @change="handleImageUpload(category.key, $event)"
              :disabled="uploadingImages[category.key]"
            />
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <span class="text-red-500">*</span> 為必填欄位
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin/stores" class="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
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
      </div>
    </form>
  </div>
</template>
