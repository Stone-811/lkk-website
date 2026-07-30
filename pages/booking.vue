<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

useHead({
  title: '預約體驗 | 練健康',
  meta: [
    { name: 'description', content: '預約練健康首次體驗課程。50 歲以上完全免費，一般首次體驗 $500。由專業教練帶領，安全有效。' }
  ]
})

const stores = ref([
  { id: 'nanjing', name: '南京店', address: '台北市中山區南京東路三段 29 號 B1', phone: '(02) 2507-4196' },
  { id: 'songjiang', name: '松江店', address: '台北市中山區松江路 122 號 B1', phone: '(02) 2537-1055' },
  { id: 'ximending', name: '西門店', address: '台北市中正區寶慶路 39 號', phone: '(02) 2370-3245' },
  { id: 'xindian', name: '七張店', address: '新北市新店區北新路二段 252 號 B1-2', phone: '(02) 8914-6428' },
])

// FAQ 分類資料
const faqCategories = [
  {
    title: '個人相關',
    faqs: [
      { id: 'p1', q: '什麼樣的年紀適合來練健康訓練？', a: '練健康 70% 的學員都是中高齡族群，我們的教練都有經過專業培訓。但訓練不分年齡，我們也有20~30歲的學員，大家一起練健康！' },
      { id: 'p2', q: '我從來沒運動過，可以來嗎？', a: '沒有運動習慣的人反而容易進步。教練會從最基礎的動作教起，不會有比較或評判。有任何的訓練目標（增肌、術後肌力恢復或是改善腰痠背痛等等），都可以在體驗課中告訴教練喔！' },
      { id: 'p3', q: '有慢性病或有重大傷病可以訓練嗎？', a: '可以。我們有完整的篩檢評估流程，會詳細提供您訓練或轉介的建議。請在備註欄詳細描述，方便教練更了解您的狀況。' },
    ],
  },
  {
    title: '課程相關',
    faqs: [
      { id: 'c1', q: '體驗完之後一定要買課嗎？', a: '我們不強迫推銷。體驗課的目的是讓雙方了解彼此，教練會說明適合的選項，歡迎您考慮衡量後再決定。' },
      { id: 'c2', q: '上體驗課需要準備什麼？', a: '穿著舒適、好活動的服裝前來即可。' },
      { id: 'c3', q: '可以預約明天嗎？', a: '請至少提前 2–3 天預約，讓教練有時間為您安排合適的檢測與備課，量身打造合適的課表。' },
    ],
  },
  {
    title: '費用相關',
    faqs: [
      { id: 'f1', q: '體驗課費用？', a: '50歲以上免費體驗；未滿50歲酌收 $500 檢測與體驗費用。若為一對二且皆未滿50歲，兩位皆需收取 $500。' },
      { id: 'f2', q: '體驗課如何付款？', a: '體驗結束後至櫃台臨櫃繳費即可。' },
      { id: 'f3', q: '正式課程的費用？', a: '從 $600/堂的團體課，到 $2,460/堂的私人教練課程都有。體驗課中教練會了解您的狀況並給予客製化建議，購課越多優惠越多。' },
    ],
  },
]

// FAQ 折疊狀態
const openFaqId = ref<string | null>(null)
const toggleFaq = (id: string) => {
  openFaqId.value = openFaqId.value === id ? null : id
}

const cases = [
  { name: '林阿嬤', info: '70歲・膝關節退化', quote: '以前膝蓋痛到走不了路，現在可以自己爬山、帶孫子去公園。' },
  { name: '王先生', info: '62歲・腦中風後', quote: '以為這輩子就這樣了，沒想到可以自己走路去買東西。' },
  { name: '陳小姐', info: '55歲・乳癌術後', quote: '醫生說我的恢復狀況比預期好很多。' },
]

const steps = [
  { title: '填寫預約表單', desc: '約 1~2 分鐘完成，提供必要資訊' },
  { title: '教練主動電話聯繫', desc: '2~3天內，我們會打電話給您安排時間' },
  { title: '到店體驗課（60–75 分鐘）', desc: '身體評估 + 基礎動作訓練 + 教練諮詢', badges: ['50歲以上 免費', '一般首次 $500'] },
  { title: '客製化訓練建議', desc: '教練提供最適合您的訓練規劃' },
]

const whatYouGet = [
  '身體素質・活動度・肌力 全面檢測',
  '核心啟動與基礎重訓教學',
  '客製化訓練動作指導',
  '訓練目標評估與規劃建議',
]

// 方便聯繫時段選項（多選）
const contactTimeOptions = [
  '平日10:00-17:00',
  '平日18:00-21:00',
  '假日10:00-17:00',
  '假日18:00-21:00',
  '不限',
  '其他',
]

// 從哪裡得知選項（多選）
const sourceOptions = [
  '練健康官網',
  '練健康FB',
  '練健康IG',
  '練健康YT',
  '練健康官方LINE',
  '練健康THREADS',
  '傳單',
  '其他',
]

// 與學員關係選項
const relationshipOptions = [
  '配偶',
  '子女',
  '父母',
  '兄弟姊妹',
  '朋友',
  '其他',
]

// 運動目的選項（可複選）
const exerciseGoalOptions = [
  '增加肌力與活動力',
  '慢性病控制',
  '降低跌倒風險',
  '體態管理',
  '傷後復健',
  '增加運動表現',
  '減少疼痛',
]

// Form state
const formData = reactive({
  // 學員資料
  name: '',
  phone: '',
  gender: '',
  birthDate: '',
  email: '',
  line: '',
  // 填寫者資料
  filledBySelf: '本人填寫',
  relationship: '',
  bookerName: '',
  contactPhone: '',
  // 健康狀況
  hasMedicalCondition: '',
  medicalConditionNote: '',
  // 預約資訊
  storeId: '',
  preferredTimes: [] as string[],
  preferredTimeOther: '',
  sources: [] as string[],
  sourceOther: '',
  exerciseGoals: [] as string[],
  exerciseGoalOther: '',
  paymentMethod: '',
  message: '',
  agreeToTerms: false,
})

const isSubmitting = ref(false)
const isSuccess = ref(false)
const errors = ref<Record<string, string>>({})

// Fetch stores from API
onMounted(async () => {
  try {
    const res = await fetch('/api/public/stores')
    if (res.ok) {
      const data = await res.json()
      if (data.data && data.data.length > 0) {
        stores.value = data.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          address: `${s.city || ''}${s.district || ''}${s.address || ''}`,
          phone: s.phone || '',
        }))
      }
    }
  } catch (error) {
    console.error('Failed to fetch stores:', error)
  }
})

// Calculate age from birthdate
const userAge = computed(() => {
  if (!formData.birthDate) return null
  const birthDate = new Date(formData.birthDate)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
})

const isFreeEligible = computed(() => userAge.value !== null && userAge.value >= 50)

// 選中的分店（下拉選單下方顯示地址/電話）
const selectedStore = computed(() => stores.value.find(s => s.id === formData.storeId) || null)

// Watch birthDate changes to auto-clear invalid payment method
watch(() => formData.birthDate, () => {
  // If user is under 50 and had selected "50歲以上免費", clear the selection
  if (!isFreeEligible.value && formData.paymentMethod === '50歲以上免費') {
    formData.paymentMethod = ''
  }
})

// Toggle preferred time selection
const togglePreferredTime = (time: string) => {
  const index = formData.preferredTimes.indexOf(time)
  if (index === -1) {
    formData.preferredTimes.push(time)
  } else {
    formData.preferredTimes.splice(index, 1)
  }
}

// Toggle source selection
const toggleSource = (source: string) => {
  const index = formData.sources.indexOf(source)
  if (index === -1) {
    formData.sources.push(source)
  } else {
    formData.sources.splice(index, 1)
  }
}

// Toggle exercise goal selection
const toggleExerciseGoal = (goal: string) => {
  const index = formData.exerciseGoals.indexOf(goal)
  if (index === -1) {
    formData.exerciseGoals.push(goal)
  } else {
    formData.exerciseGoals.splice(index, 1)
  }
}

const validateForm = () => {
  const newErrors: Record<string, string> = {}

  // 學員基本資料驗證
  if (!formData.name.trim()) newErrors.name = '請輸入學員姓名'
  if (!formData.phone.trim()) newErrors.phone = '請輸入手機號碼'
  if (formData.phone && !/^09\d{8}$/.test(formData.phone)) newErrors.phone = '請輸入有效的手機號碼'
  if (!formData.gender) newErrors.gender = '請選擇性別'
  if (!formData.birthDate) newErrors.birthDate = '請選擇出生年月日'
  if (!formData.email.trim()) {
    newErrors.email = '請輸入 Email'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = '請輸入有效的 Email'
  }

  // 填寫者資料驗證
  if (formData.filledBySelf === '親友代填') {
    if (!formData.relationship) newErrors.relationship = '請選擇與學員的關係'
    if (!formData.bookerName.trim()) newErrors.bookerName = '請輸入預約者姓名'
    if (!formData.contactPhone.trim()) newErrors.contactPhone = '請輸入方便聯繫的電話'
    if (formData.contactPhone && !/^09\d{8}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = '請輸入有效的手機號碼'
    }
  }

  // 健康狀況驗證
  if (!formData.hasMedicalCondition) newErrors.hasMedicalCondition = '請選擇健康狀況'

  // 預約資訊驗證
  if (!formData.storeId) newErrors.storeId = '請選擇分店'
  if (formData.preferredTimes.length === 0) newErrors.preferredTimes = '請至少選擇一個時段'
  if (!formData.paymentMethod) newErrors.paymentMethod = '請選擇付款方式'
  if (!formData.agreeToTerms) newErrors.agreeToTerms = '請勾選同意事項'

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    // 滾動到第一個錯誤欄位
    const firstErrorKey = Object.keys(errors.value)[0]
    if (firstErrorKey) {
      const element = document.querySelector(`[name="${firstErrorKey}"]`) ||
                     document.getElementById(firstErrorKey)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  isSubmitting.value = true

  try {
    // 組合來源
    let finalSources = [...formData.sources]
    if (formData.sources.includes('其他') && formData.sourceOther.trim()) {
      finalSources = finalSources.filter(s => s !== '其他')
      finalSources.push(`其他: ${formData.sourceOther}`)
    }

    // 組合運動目的
    let finalExerciseGoals = [...formData.exerciseGoals]
    if (formData.exerciseGoals.includes('其他') && formData.exerciseGoalOther.trim()) {
      finalExerciseGoals = finalExerciseGoals.filter(g => g !== '其他')
      finalExerciseGoals.push(`其他: ${formData.exerciseGoalOther}`)
    }

    // 組合聯繫時段
    let finalPreferredTimes = [...formData.preferredTimes]
    if (formData.preferredTimes.includes('其他') && formData.preferredTimeOther.trim()) {
      finalPreferredTimes = finalPreferredTimes.filter(t => t !== '其他')
      finalPreferredTimes.push(`其他: ${formData.preferredTimeOther}`)
    }

    const response = await fetch('/api/leads/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 學員資料
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        birthDate: formData.birthDate,
        line: formData.line || null,
        // 填寫者資料
        filledBySelf: formData.filledBySelf === '本人填寫',
        relationship: formData.filledBySelf === '親友代填' ? formData.relationship : null,
        bookerName: formData.filledBySelf === '親友代填' ? formData.bookerName : null,
        contactPhone: formData.filledBySelf === '親友代填' ? formData.contactPhone : formData.phone,
        // 健康狀況
        hasMedicalCondition: formData.hasMedicalCondition === '是',
        medicalConditionNote: formData.hasMedicalCondition === '是' ? formData.medicalConditionNote : null,
        // 預約資訊
        storeId: formData.storeId,
        preferredTime: finalPreferredTimes,
        sources: finalSources,
        exerciseGoals: finalExerciseGoals,
        paymentMethod: formData.paymentMethod,
        message: formData.message,
        sourcePage: '/booking',
        utm: useUtm().getUtm(),
      }),
    })

    if (response.ok) {
      isSuccess.value = true
    } else {
      alert('送出失敗，請稍後再試')
    }
  } catch (error) {
    alert('網路錯誤，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream-100">
    <!-- Hero -->
    <section class="relative bg-navy-700 pt-16 overflow-hidden">
      <!-- Background effects -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(251,114,10,0.10)_0%,transparent_55%),radial-gradient(circle_at_5%_75%,rgba(58,106,133,0.3)_0%,transparent_45%)]" />
      </div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-2xl mx-auto text-center py-16 lg:py-20">
          <!-- Hero content -->
          <div>
            <!-- Free badge -->
            <div class="inline-flex items-center gap-2 bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              50歲以下，體驗課$500元
            </div>

            <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 sm:mb-4">
              50 歲以上<br />
              <span class="text-orange">體驗課完全免費</span>
            </h1>

            <p class="text-white/60 text-base sm:text-lg font-light leading-relaxed mb-5 sm:mb-6 max-w-lg mx-auto">
              不論年齡、運動經驗、身體狀況——體驗課的目的是讓我們了解您，而不是評判您。由醫療相關、運動科學等專業背景教練帶領，安全有效。
            </p>

            <!-- What you get -->
            <div class="inline-flex flex-col items-start space-y-2 mb-6 text-left">
              <div v-for="item in whatYouGet" :key="item" class="flex items-start gap-3 text-white/70 text-sm">
                <div class="w-5 h-5 rounded-full bg-orange/20 border border-orange/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-orange text-xs">&#10003;</span>
                </div>
                {{ item }}
              </div>
            </div>

            <div class="mb-4">
              <a href="#form" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
                立即填寫預約 &rarr;
              </a>
            </div>

            <div class="flex items-center justify-center gap-2 text-xs sm:text-sm text-white/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong class="text-orange-300">50歲以上免費</strong>・一般首次 $500・無隱藏費用・不強迫買課</span>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Form Section -->
    <div class="py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
          <!-- Left - Form -->
          <div id="form">
            <!-- Success State -->
            <div v-if="isSuccess" class="max-w-lg mx-auto text-center py-16">
              <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold mb-4 text-navy-700 font-serif">預約成功！</h2>
              <p class="text-ink-600 mb-2">我們將於 2~3 天內主動與您聯繫確認體驗課時間，並寄送 Email 通知您。</p>
              <p class="text-navy-700 font-medium mb-8">為了更快為您服務，請加入官方 LINE 並私訊您的姓名。</p>

              <!-- LINE CTA -->
              <a
                href="https://line.me/R/ti/p/%40201fzruh"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#06C755] text-white font-bold px-8 py-4 rounded-xl shadow-md hover:bg-[#05b64f] transition-colors"
              >
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.176 14.393 24 12.458 24 10.304M7.29 13.211H4.906a.634.634 0 0 1-.632-.633V7.803a.634.634 0 0 1 1.265 0v4.143H7.29a.634.634 0 0 1 0 1.265m2.474-.633a.633.633 0 0 1-1.265 0V7.803a.634.634 0 0 1 1.265 0zm5.703 0a.633.633 0 0 1-.633.633.63.63 0 0 1-.512-.26l-2.444-3.325v2.952a.633.633 0 0 1-1.265 0V7.803a.633.633 0 0 1 .633-.632c.199 0 .385.093.507.256l2.454 3.339V7.803a.634.634 0 0 1 1.265 0v4.775zm4.024-2.952a.634.634 0 0 1 0 1.265h-1.755v1.128h1.755a.633.633 0 0 1 0 1.265h-2.388a.634.634 0 0 1-.633-.633V7.803a.634.634 0 0 1 .633-.632h2.388a.634.634 0 0 1 0 1.265h-1.755v1.128h1.755z"/>
                </svg>
                點此加入官方 LINE，並私訊姓名
              </a>

              <div class="mt-6">
                <NuxtLink to="/" class="text-ink-500 hover:text-navy-700 text-sm underline underline-offset-2">
                  返回首頁
                </NuxtLink>
              </div>
            </div>

            <!-- Form -->
            <div v-else class="max-w-2xl mx-auto">
              <div class="text-center mb-6 sm:mb-8">
                <h1 class="text-2xl sm:text-3xl font-bold mb-2 text-navy-700 font-serif">預約體驗課</h1>
                <p class="text-ink-600 text-sm sm:text-base">填寫後我們會主動聯繫您安排時間</p>
              </div>

              <div class="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
                <!-- Section 1: 學員基本資料 -->
                <div class="space-y-5">
                  <h2 class="text-xl font-bold text-navy-700 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-orange text-white text-sm flex items-center justify-center">1</span>
                    學員基本資料
                  </h2>

                  <!-- Row 1: 學員姓名 | 學員手機 -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        學員姓名 <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.name"
                        type="text"
                        name="name"
                        :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.name ? 'border-red-500' : 'border-cream-200']"
                        placeholder="要來上課的人"
                      />
                      <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        學員手機 <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.phone"
                        type="tel"
                        name="phone"
                        :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.phone ? 'border-red-500' : 'border-cream-200']"
                        placeholder="0912345678"
                      />
                      <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
                    </div>
                  </div>

                  <!-- Row 2: 性別 | 出生年月日 -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        性別 <span class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="formData.gender"
                        name="gender"
                        :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange', errors.gender ? 'border-red-500' : 'border-cream-200']"
                      >
                        <option value="">請選擇</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                      <p v-if="errors.gender" class="text-red-500 text-sm mt-1">{{ errors.gender }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        出生年月日（要上課的學員） <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.birthDate"
                        type="date"
                        name="birthDate"
                        :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange', errors.birthDate ? 'border-red-500' : 'border-cream-200']"
                        max="2010-01-01"
                        min="1920-01-01"
                      />
                      <p v-if="isFreeEligible" class="text-green-600 text-sm mt-1 font-medium flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        50歲以上體驗免費
                      </p>
                      <p v-if="errors.birthDate" class="text-red-500 text-sm mt-1">{{ errors.birthDate }}</p>
                    </div>
                  </div>

                  <!-- Row 3: Email | Line -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        Email <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.email"
                        type="email"
                        name="email"
                        :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.email ? 'border-red-500' : 'border-cream-200']"
                        placeholder="your@email.com"
                      />
                      <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        Line ID <span class="text-ink-500 font-normal">（選填）</span>
                      </label>
                      <input
                        v-model="formData.line"
                        type="text"
                        name="line"
                        class="w-full px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                        placeholder="方便我們聯繫您"
                      />
                    </div>
                  </div>
                </div>

                <!-- Divider -->
                <div class="my-6 border-t border-cream-200" />

                <!-- Section 2: 填寫者資料 & 健康狀況 -->
                <div class="space-y-5">
                  <h2 class="text-xl font-bold text-navy-700 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-orange text-white text-sm flex items-center justify-center">2</span>
                    填寫者資料 & 健康狀況
                  </h2>

                  <!-- 本人填寫 / 親友代填 -->
                  <div>
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      是否為本人填寫 <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.filledBySelf"
                      class="w-full px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                    >
                      <option value="本人填寫">本人填寫</option>
                      <option value="親友代填">親友代填</option>
                    </select>
                  </div>

                  <!-- 親友代填欄位 -->
                  <div v-if="formData.filledBySelf === '親友代填'" class="bg-cream-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label class="block text-sm font-medium mb-2 text-navy-700">
                        與學員的關係 <span class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="formData.relationship"
                        name="relationship"
                        :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange', errors.relationship ? 'border-red-500' : 'border-cream-200']"
                      >
                        <option value="">請選擇</option>
                        <option v-for="r in relationshipOptions" :key="r" :value="r">{{ r }}</option>
                      </select>
                      <p v-if="errors.relationship" class="text-red-500 text-sm mt-1">{{ errors.relationship }}</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium mb-2 text-navy-700">
                          預約者姓名 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="formData.bookerName"
                          type="text"
                          name="bookerName"
                          :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.bookerName ? 'border-red-500' : 'border-cream-200']"
                          placeholder="請輸入您的姓名"
                        />
                        <p v-if="errors.bookerName" class="text-red-500 text-sm mt-1">{{ errors.bookerName }}</p>
                      </div>

                      <div>
                        <label class="block text-sm font-medium mb-2 text-navy-700">
                          方便聯繫的電話 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="formData.contactPhone"
                          type="tel"
                          name="contactPhone"
                          :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.contactPhone ? 'border-red-500' : 'border-cream-200']"
                          placeholder="0912345678"
                        />
                        <p v-if="errors.contactPhone" class="text-red-500 text-sm mt-1">{{ errors.contactPhone }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- 健康狀況 -->
                  <div class="pt-2">
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      是否有疾病，或 3 年內曾開過刀或住院？ <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.hasMedicalCondition"
                      :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.hasMedicalCondition ? 'border-red-500' : 'border-cream-200']"
                    >
                      <option value="">請選擇</option>
                      <option value="否">否</option>
                      <option value="是">是</option>
                    </select>
                    <p v-if="errors.hasMedicalCondition" class="text-red-500 text-sm mt-1">{{ errors.hasMedicalCondition }}</p>
                  </div>

                  <!-- 健康狀況備註 -->
                  <div v-if="formData.hasMedicalCondition === '是'">
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      請簡述情況 <span class="text-ink-500 font-normal">（選填）</span>
                    </label>
                    <textarea
                      v-model="formData.medicalConditionNote"
                      rows="2"
                      class="w-full px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange"
                      placeholder="身體若有任何狀況，都請稍作描述喔！若無則填寫：無"
                    />
                  </div>
                </div>

                <!-- Divider -->
                <div class="my-6 border-t border-cream-200" />

                <!-- Section 3: 預約資訊 -->
                <div class="space-y-5">
                  <h2 class="text-xl font-bold text-navy-700 flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-orange text-white text-sm flex items-center justify-center">3</span>
                    預約資訊
                  </h2>

                  <!-- 選擇分店 -->
                  <div id="storeId">
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      選擇分店 <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.storeId"
                      :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.storeId ? 'border-red-500' : 'border-cream-200']"
                    >
                      <option value="">請選擇分店</option>
                      <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
                    </select>
                    <p v-if="selectedStore" class="text-xs text-ink/60 mt-1.5">
                      {{ selectedStore.address }}<span v-if="selectedStore.phone"> ・ {{ selectedStore.phone }}</span>
                    </p>
                    <p v-if="errors.storeId" class="text-red-500 text-sm mt-2">{{ errors.storeId }}</p>
                  </div>

                  <!-- 方便聯繫時段 -->
                  <div id="preferredTimes">
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      方便聯繫時段 <span class="text-red-500">*</span>
                      <span class="text-ink-500 font-normal ml-1">（可複選）</span>
                    </label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        v-for="time in contactTimeOptions"
                        :key="time"
                        type="button"
                        :class="[
                          'p-2.5 rounded-lg border text-sm text-left transition-all flex items-center justify-start gap-2',
                          formData.preferredTimes.includes(time)
                            ? 'border-orange bg-orange/10 text-orange'
                            : 'border-cream-200 hover:border-orange/50'
                        ]"
                        @click="togglePreferredTime(time)"
                      >
                        <div
                          :class="[
                            'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                            formData.preferredTimes.includes(time)
                              ? 'border-orange bg-orange'
                              : 'border-ink-300'
                          ]"
                        >
                          <svg v-if="formData.preferredTimes.includes(time)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {{ time }}
                      </button>
                    </div>
                    <input
                      v-if="formData.preferredTimes.includes('其他')"
                      v-model="formData.preferredTimeOther"
                      type="text"
                      class="w-full mt-2 px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange"
                      placeholder="請說明其他方便時段"
                    />
                    <p v-if="errors.preferredTimes" class="text-red-500 text-sm mt-2">{{ errors.preferredTimes }}</p>
                  </div>

                  <!-- 從哪裡得知 -->
                  <div>
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      從哪裡得知練健康？ <span class="text-ink-500 font-normal">（可複選）</span>
                    </label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        v-for="source in sourceOptions"
                        :key="source"
                        type="button"
                        :class="[
                          'p-2.5 rounded-lg border text-sm text-left transition-all flex items-center justify-start gap-2',
                          formData.sources.includes(source)
                            ? 'border-orange bg-orange/10 text-orange'
                            : 'border-cream-200 hover:border-orange/50'
                        ]"
                        @click="toggleSource(source)"
                      >
                        <div
                          :class="[
                            'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                            formData.sources.includes(source)
                              ? 'border-orange bg-orange'
                              : 'border-ink-300'
                          ]"
                        >
                          <svg v-if="formData.sources.includes(source)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {{ source }}
                      </button>
                    </div>
                    <input
                      v-if="formData.sources.includes('其他')"
                      v-model="formData.sourceOther"
                      type="text"
                      class="w-full mt-2 px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange"
                      placeholder="請說明從哪裡得知"
                    />
                  </div>

                  <!-- 運動目的 -->
                  <div>
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      訓練目的 <span class="text-ink-500 font-normal">（可複選）</span>
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="goal in exerciseGoalOptions"
                        :key="goal"
                        type="button"
                        :class="[
                          'p-2.5 rounded-lg border text-sm text-left transition-all flex items-center justify-start gap-2',
                          formData.exerciseGoals.includes(goal)
                            ? 'border-orange bg-orange/10 text-orange'
                            : 'border-cream-200 hover:border-orange/50'
                        ]"
                        @click="toggleExerciseGoal(goal)"
                      >
                        <div
                          :class="[
                            'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                            formData.exerciseGoals.includes(goal)
                              ? 'border-orange bg-orange'
                              : 'border-ink-300'
                          ]"
                        >
                          <svg v-if="formData.exerciseGoals.includes(goal)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {{ goal }}
                      </button>
                    </div>
                    <p class="text-xs text-ink/60 mt-3 leading-relaxed">
                      註：訓練無法取代醫療，所有身體疾患務必先尋求醫療人員協助。
                    </p>
                  </div>

                  <!-- 付款方式 -->
                  <div id="paymentMethod">
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      付款方式 <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.paymentMethod"
                      :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-orange', errors.paymentMethod ? 'border-red-500' : 'border-cream-200']"
                    >
                      <option value="">請選擇</option>
                      <option v-if="isFreeEligible" value="50歲以上免費">50 歲以上免費（首次體驗完全免費）</option>
                      <option value="臨櫃付款">臨櫃付款（首次體驗 $500）</option>
                    </select>
                    <p v-if="errors.paymentMethod" class="text-red-500 text-sm mt-2">{{ errors.paymentMethod }}</p>
                  </div>

                  <!-- 備註 -->
                  <div>
                    <label class="block text-sm font-medium mb-2 text-navy-700">
                      備註 <span class="text-ink-500 font-normal">（若是要一對二的體驗課程，請提供親友姓名、年齡及簡述身體狀況）</span>
                    </label>
                    <textarea
                      v-model="formData.message"
                      rows="3"
                      class="w-full px-4 py-3 border border-cream-200 rounded-lg focus:ring-2 focus:ring-orange"
                      placeholder="例如：王小明／65歲／2023年5月右膝韌帶斷裂手術，希望可以改善重心前傾、走路不穩，增加走路穩定度"
                    />
                  </div>
                </div>

                <!-- 同意事項 -->
                <div class="mt-6 p-4 bg-cream-50 rounded-lg border border-cream-200">
                  <div class="text-sm text-navy-700 font-medium mb-3">參加練健康相關課程，了解並願遵守下列事項：</div>
                  <div class="text-xs text-ink/70 space-y-2 max-h-48 overflow-y-auto pr-2">
                    <p>一、本人若有心臟病、高血壓、癲癇症、具傳染性皮膚病及足以影響運動訓練等病症，或於五年內有重大傷病開刀或住院超過3周以上之病史，將主動告知。</p>
                    <p>二、本人在課程期間除教練指導的使用範圍，不會自行使用以外之場地及各項設備器材，並遵守教練指示及場地使用規範。</p>
                    <p>三、本人了解訓練本身具有發生自己或他人事故或傷害危險，願充分負擔此一危險，並盡力防杜該危險或事故傷害之發生。</p>
                    <p>四、本人同意練健康於所有課程中進行拍照及錄影，並同意肖像權及所有權均屬於練健康。</p>
                    <p>五、置物櫃僅提供置物服務，若有貴重物品及財物將自行保管。</p>
                    <p>六、自備換洗衣物、毛巾及飲用水。</p>
                    <p>七、課程期間，需穿著輕便運動合身之服裝。</p>
                    <p>八、身上不可有金屬扣環或拉鍊或其他硬物，上課前會檢查並修剪指甲。</p>
                    <p>九、本人願遵練健康教練之所有指示，並願就課程期間所生之自身或他人健康、安全意外事件負責；倘於訓練過程本人有不符訓練常規之舉措，經教練制止後未即刻改善者，練健康得要求本人離場並取消上課權利，本人絕無異議。</p>
                  </div>
                  <label class="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      v-model="formData.agreeToTerms"
                      type="checkbox"
                      class="w-5 h-5 rounded border-cream-300 text-orange focus:ring-orange"
                    />
                    <span class="text-sm font-medium text-navy-700">我已詳閱並同意以上事項 <span class="text-red-500">*</span></span>
                  </label>
                  <p v-if="errors.agreeToTerms" class="text-red-500 text-sm mt-1">{{ errors.agreeToTerms }}</p>
                </div>

                <!-- Submit Button -->
                <div class="mt-8 pt-6 border-t border-cream-200">
                  <button
                    type="button"
                    :disabled="isSubmitting || !formData.agreeToTerms"
                    class="w-full btn btn-primary py-4 text-lg disabled:opacity-50"
                    @click="handleSubmit"
                  >
                    {{ isSubmitting ? '送出中...' : '送出預約' }}
                  </button>
                  <p class="text-xs text-ink/60 text-center mt-4 leading-relaxed">
                    送出即表示同意我們以電話或 LINE 與您聯繫安排體驗課，個人資料僅用於此目的。
                  </p>
                  <p class="text-xs text-ink/60 text-center mt-2 leading-relaxed">
                    送出後請稍候，頁面將導向加入 LINE 官方帳號，加入後即可收到最新通知；同時我們也會寄送 Email 通知您報名成功。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right - Process Steps -->
          <div class="md:sticky md:top-24 md:self-start">
            <div class="flex items-center gap-2 text-xs md:text-sm font-bold text-orange tracking-widest uppercase mb-2 md:mb-3">
              <span class="w-4 md:w-5 h-0.5 bg-orange" />
              接下來會發生什麼
            </div>
            <h2 class="font-serif text-xl md:text-2xl font-black text-navy-700 mb-4 md:mb-6">
              填完表單後<span class="text-orange">四個步驟</span>
            </h2>

            <div class="relative flex flex-col">
              <div class="absolute left-4 md:left-5 top-4 md:top-5 bottom-4 md:bottom-5 w-[1.5px] bg-gradient-to-b from-orange to-orange/20" />

              <div v-for="(step, idx) in steps" :key="step.title" class="flex gap-3 md:gap-4 items-start py-3 md:py-4 relative z-10">
                <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange text-white font-serif text-base md:text-lg font-black flex items-center justify-center flex-shrink-0 shadow-[0_0_0_3px_rgba(251,114,10,0.12)] md:shadow-[0_0_0_4px_rgba(251,114,10,0.12)]">
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm md:text-base font-semibold text-navy-700 mb-0.5">{{ step.title }}</div>
                  <div class="text-xs md:text-sm text-ink/60 leading-relaxed">{{ step.desc }}</div>
                  <div v-if="step.badges" class="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                    <span
                      v-for="(badge, bIdx) in step.badges"
                      :key="badge"
                      :class="[
                        'text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 rounded-full',
                        bIdx === 0 ? 'bg-green-500/10 text-green-600' : 'bg-navy-700/10 text-navy-700'
                      ]"
                    >
                      {{ badge }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQ Accordion -->
            <div class="mt-6 mb-6">
              <div class="flex items-center gap-2 text-[0.82rem] font-bold tracking-widest text-orange mb-2">
                <span class="w-4 h-0.5 bg-orange"></span>
                你可能在想
              </div>
              <h3 class="font-serif text-xl font-black text-navy-700 mb-4">
                先回答你<span class="text-orange">最常問的問題</span>
              </h3>
              <div class="space-y-4">
                <div v-for="category in faqCategories" :key="category.title">
                  <div class="text-sm font-bold text-navy-700/60 mb-2">{{ category.title }}</div>
                  <div class="bg-white rounded-xl border border-cream-200 overflow-hidden">
                    <div
                      v-for="(faq, idx) in category.faqs"
                      :key="faq.id"
                      :class="idx !== category.faqs.length - 1 ? 'border-b border-cream-200' : ''"
                    >
                      <button
                        type="button"
                        class="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
                        :aria-expanded="openFaqId === faq.id"
                        @click="toggleFaq(faq.id)"
                      >
                        <span class="text-[0.9rem] font-medium text-navy-700">{{ faq.q }}</span>
                        <span
                          :class="[
                            'w-5 h-5 rounded-full border border-navy-700/15 flex items-center justify-center flex-shrink-0 transition-colors text-sm',
                            openFaqId === faq.id ? 'bg-navy-700 border-navy-700 text-white' : 'text-navy-700'
                          ]"
                        >
                          {{ openFaqId === faq.id ? '−' : '+' }}
                        </span>
                      </button>
                      <div
                        :class="[
                          'overflow-hidden transition-all duration-300',
                          openFaqId === faq.id ? 'max-h-40 pb-3 px-4' : 'max-h-0'
                        ]"
                      >
                        <p class="text-[0.85rem] text-ink/60 leading-relaxed">{{ faq.a }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cases Card (cases-teaser style) -->
            <div class="bg-white rounded-[20px] p-6 shadow-sm">
              <div class="text-[0.82rem] font-bold tracking-widest uppercase text-navy-700/50 mb-4">他們也是這樣開始的</div>
              <div class="flex flex-col gap-3">
                <div v-for="c in cases" :key="c.name" class="flex gap-3 items-center">
                  <div class="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center text-orange font-bold text-sm flex-shrink-0">
                    {{ c.name.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-[0.88rem] font-semibold text-navy-800">{{ c.name }}・{{ c.info }}</div>
                    <div class="text-[0.88rem] text-ink/60 italic line-clamp-2">「{{ c.quote }}」</div>
                  </div>
                </div>
              </div>
              <a href="https://l-kk.tw/category/%e6%a1%88%e4%be%8b%e5%88%86%e4%ba%ab/" class="block text-center text-xs text-navy-700/50 hover:text-navy-700 mt-4 pt-4 border-t border-navy-700/10">
                看更多學員故事 &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 下拉選單自訂箭頭：位置往內（比原生的靠左一些） */
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232A5269' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.05rem;
  padding-right: 2.75rem;
}
</style>
