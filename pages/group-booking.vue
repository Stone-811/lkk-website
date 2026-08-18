<script setup lang="ts">
useHead({
  title: '團體課程報名｜練健康 LKK Wellness',
  meta: [
    { name: 'description', content: '報名練健康中高齡團體課程。小班制、同儕一起練更有動力，兼顧肌力、平衡與心肺。填寫報名表，專人與你聯繫確認課程時間。' },
  ],
})

interface Errors { [k: string]: string }

const formData = reactive({
  name: '',
  phone: '',
  email: '',
  storeId: '',
  desiredClass: '',
  age: '',
  message: '',
})

const stores = ref<{ id: string; name: string }[]>([
  { id: 'nanjing', name: '南京店' },
  { id: 'songjiang', name: '松江店' },
  { id: 'ximending', name: '西門店' },
  { id: 'xindian', name: '七張店' },
])

onMounted(async () => {
  try {
    const res = await fetch('/api/public/stores')
    if (res.ok) {
      const data = await res.json()
      if (data.data && data.data.length > 0) {
        stores.value = data.data.map((s: any) => ({ id: s.id, name: s.name }))
      }
    }
  } catch (e) {
    console.error('Failed to fetch stores:', e)
  }
})

const errors = ref<Errors>({})
const submitting = ref(false)
const isSuccess = ref(false)

function validate() {
  const e: Errors = {}
  if (!formData.name.trim()) e.name = '請輸入姓名'
  if (!formData.phone.trim()) e.phone = '請輸入聯絡電話'
  else if (!/^09\d{8}$/.test(formData.phone)) e.phone = '請輸入有效的手機號碼（09 開頭共 10 碼）'
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email 格式不正確'
  if (!formData.storeId) e.storeId = '請選擇分店'
  if (!formData.desiredClass.trim()) e.desiredClass = '請填寫想上的課程或方便時段'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  try {
    const res = await fetch('/api/leads/group-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData }),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      isSuccess.value = true
      await nextTick()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      alert(data.error || '送出失敗，請稍後再試')
    }
  } catch (e) {
    alert('送出失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

const inputClass = 'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-colors'
</script>

<template>
  <div class="bg-cream min-h-screen">
    <!-- Hero -->
    <section class="relative bg-navy-700 pt-16 overflow-hidden text-white">
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(251,114,10,0.12)_0%,transparent_55%),radial-gradient(circle_at_5%_80%,rgba(58,106,133,0.35)_0%,transparent_45%)]" />
      </div>
      <div class="container mx-auto px-4 relative z-10 py-14 lg:py-20 text-center">
        <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-4">
          <span class="w-5 h-0.5 bg-orange" />
          Group Class
        </div>
        <h1 class="font-serif text-4xl lg:text-5xl font-black leading-tight mb-4">
          團體課程<span class="text-orange">報名</span>
        </h1>
        <p class="text-white/60 text-lg font-light leading-relaxed max-w-xl mx-auto">
          小班制中高齡團體課，同儕一起練更有動力，兼顧肌力、平衡與心肺。填寫報名表，專人與你聯繫確認課程時間。
        </p>
      </div>
    </section>

    <!-- Form / Success -->
    <section id="form" class="py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto">
          <!-- Success -->
          <div v-if="isSuccess" class="bg-white rounded-3xl border border-navy-700/10 shadow-sm p-8 lg:p-12 text-center">
            <div class="w-16 h-16 rounded-full bg-orange/12 flex items-center justify-center mx-auto mb-5">
              <svg class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="font-serif text-2xl font-black text-navy-700 mb-3">報名成功！</h2>
            <p class="text-ink/60 leading-relaxed mb-8">
              我們已收到你的團體課程報名，專人將盡快與你聯繫，確認課程時間與細節。
            </p>
            <div class="flex flex-wrap justify-center gap-3">
              <NuxtLink to="/services" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-full hover:bg-orange-400 transition-colors">
                回服務介紹
              </NuxtLink>
              <NuxtLink to="/" class="inline-flex items-center gap-2 border border-navy-700/15 text-navy-700 font-semibold px-6 py-3 rounded-full hover:border-navy-700 transition-colors">
                回首頁
              </NuxtLink>
            </div>
          </div>

          <!-- Form -->
          <div v-else class="bg-white rounded-3xl border border-navy-700/10 shadow-sm p-6 lg:p-10">
            <form class="space-y-5" @submit.prevent="handleSubmit">
              <div class="grid sm:grid-cols-2 gap-5">
                <!-- 姓名 -->
                <div>
                  <label class="block text-sm font-medium text-navy-700 mb-1.5">姓名 <span class="text-red-500">*</span></label>
                  <input
                    v-model="formData.name"
                    type="text"
                    :class="[inputClass, errors.name ? 'border-red-500' : 'border-cream-200']"
                  />
                  <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
                </div>
                <!-- 電話 -->
                <div>
                  <label class="block text-sm font-medium text-navy-700 mb-1.5">聯絡電話 <span class="text-red-500">*</span></label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    inputmode="numeric"
                    placeholder="09xxxxxxxx"
                    :class="[inputClass, errors.phone ? 'border-red-500' : 'border-cream-200']"
                  />
                  <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-5">
                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-navy-700 mb-1.5">Email <span class="text-ink/40 text-xs">（選填）</span></label>
                  <input
                    v-model="formData.email"
                    type="email"
                    :class="[inputClass, errors.email ? 'border-red-500' : 'border-cream-200']"
                  />
                  <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
                </div>
                <!-- 分店 -->
                <div>
                  <label class="block text-sm font-medium text-navy-700 mb-1.5">選擇分店 <span class="text-red-500">*</span></label>
                  <select
                    v-model="formData.storeId"
                    :class="[inputClass, errors.storeId ? 'border-red-500' : 'border-cream-200']"
                  >
                    <option value="">請選擇分店</option>
                    <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <p v-if="errors.storeId" class="text-red-500 text-sm mt-1">{{ errors.storeId }}</p>
                </div>
              </div>

              <!-- 想上的課程／方便時段 -->
              <div>
                <label class="block text-sm font-medium text-navy-700 mb-1.5">想上的課程／方便時段 <span class="text-red-500">*</span></label>
                <input
                  v-model="formData.desiredClass"
                  type="text"
                  placeholder="例如：銀髮肌力團體班、平日上午、週末皆可"
                  :class="[inputClass, errors.desiredClass ? 'border-red-500' : 'border-cream-200']"
                />
                <p v-if="errors.desiredClass" class="text-red-500 text-sm mt-1">{{ errors.desiredClass }}</p>
              </div>

              <!-- 年齡 -->
              <div>
                <label class="block text-sm font-medium text-navy-700 mb-1.5">年齡 <span class="text-ink/40 text-xs">（選填，方便安排合適課程）</span></label>
                <input
                  v-model="formData.age"
                  type="text"
                  inputmode="numeric"
                  placeholder="例如：65"
                  class="w-full px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
                />
              </div>

              <!-- 留言 -->
              <div>
                <label class="block text-sm font-medium text-navy-700 mb-1.5">留言 <span class="text-ink/40 text-xs">（選填）</span></label>
                <textarea
                  v-model="formData.message"
                  rows="3"
                  placeholder="想了解的問題、身體狀況、或其他需求…"
                  class="w-full px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-colors"
                />
              </div>

              <button
                type="submit"
                :disabled="submitting"
                class="w-full bg-orange text-white font-bold py-4 rounded-full shadow-lg shadow-orange/30 hover:bg-orange-400 transition-colors disabled:opacity-60"
              >
                {{ submitting ? '送出中…' : '送出報名' }}
              </button>

              <p class="text-center text-xs text-ink/40">送出即表示同意練健康與你聯繫確認課程資訊。</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
