<script setup lang="ts">
useHead({
  title: '合作洽詢｜練健康 LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '練健康與醫療單位、企業、學術機構合作，提供講座、企業健康促進、媒體採訪與異業合作服務。'
    }
  ]
})

const heroStats = [
  { title: '國衛院', desc: '學術共同研究計畫' },
  { title: '醫療級', desc: '草屯療養院等機構培訓' },
  { title: '跨國輸出', desc: '馬來西亞海外種子師資' },
  { title: '客製化', desc: '企業健促與團體動作篩檢' },
]

const methodPoints = [
  {
    num: '01',
    title: '講座邀約與專業授課',
    body: '應各大醫療體系、大專院校及社福團體之邀，分享練健康獨創的「中高齡與特殊族群訓練實務」。亦包含內容行銷與社群經營成果分享（如嘉義慈濟醫院講座），協助相關從業者提升專業及推廣技術。',
  },
  {
    num: '02',
    title: '企業健康促進邀請',
    body: '專為現代企業員工及中高齡同仁設計。結合科學化動作篩檢與數字化檢測，量身規劃內部健康講座與員工團體運動課程（如與知名品牌包大人合作），協助同仁踏出運動步伐，維持持之以恆的職場健康活力。',
  },
  {
    num: '03',
    title: '政府與醫療單位專業教育訓練',
    body: '輸出系統化教學經驗，為院內物理治療師、職能治療師及教練進行專業培訓（如草屯療養院教育訓練），將專業知識帶回單位持續造福病友。海外亦首度聯手馬來西亞 PhysioGym，將成熟的銀髮動作基礎訓練營帶向國際。',
  },
]

const pressCases = [
  { badge: '學術專案', org: '國家衛生研究院', title: '「中高齡訓練者訓練頻率與肌肉增長關係」共同研究', quote: '練健康引進專業級 InBody 770 與 Body Go 體適能檢測系統，協助學員透過數據精準掌握身體組成狀態，並透過博覽會展出為長輩進行科學化動作檢測。', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop&q=80' },
  { badge: '跨國培訓', org: '馬來西亞 PhysioGym', title: '輸出成熟「銀髮動作基礎訓練營」培訓海外在機種子師資', quote: '跨國聯手將台灣成熟的銀髮訓練系統帶向國際。透過輸出系統化教學與實戰經驗，協助馬來西亞當地教練提升專業技術，讓正確的肌力訓練觀念跨越國界。', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop&q=80' },
  { badge: '醫療教育訓練', org: '衛生福利部草屯療養院', title: '院內治療師內部培訓與病友團體訓練', quote: '合作包含團體訓練與內部教育訓練。除了親自接觸個案了解狀況外，更透過授課讓院內治療師帶回肌力訓練的專業知識，讓院內的運動訓練日後能夠持之以恆。', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop&q=80' },
  { badge: '跨界講座與運動推廣', org: '慈濟醫院教育訓練 & 包大人推廣', title: '肌力訓練課程、內容行銷分享與團體健康促進項目', quote: '應嘉義慈濟邀請開設科學化肌力課程與社群經營行銷講座；並應「包大人」邀請，為長輩量身打造團體可以進行的趣味運動課程，協助長輩順利踏出運動第一步。', image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop&q=80' },
]

const pressStats = [
  { num: '科學化', label: '慈濟醫院專屬肌力與行銷授課' },
  { num: '跨國', label: '馬來西亞PhysioGym海外教練培訓' },
  { num: '大數據', label: '攜手國衛院推動中高齡肌肉研究' },
]

const enquiryTypes = [
  { label: '🎤 講座邀約', value: '講座邀約', placeholder: '請簡述您的講座邀約需求（例如：預計日期、聽眾背景對象、期望講授的主題方向、授課形式等）…' },
  { label: '🏢 企業健康促進', value: '企業健康促進邀請', placeholder: '請簡述您的企業同仁健康促進規劃（例如：同仁年齡層背景、期望採用的形式如健康講座/科學化動作篩檢/員工重訓體驗團體課、預計人數等）…' },
  { label: '🤝 採訪與異業合作', value: '媒體採訪與異業合作', placeholder: '請詳述您的採訪需求或異業合作提案內容（例如：報導專題、產品跨界結合構想、海外教練培訓授權洽談等）…' },
]

interface FormData {
  organization: string
  name: string
  phone: string
  lineId: string
  email: string
  companySize: string
  budgetRange: string
  message: string
}

const activeType = ref(0)
const formData = ref<FormData>({
  organization: '',
  name: '',
  phone: '',
  lineId: '',
  email: '',
  companySize: '',
  budgetRange: '',
  message: '',
})
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

// 驗證 Email 格式
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 驗證電話格式（台灣手機或市話）
const isValidPhone = (phone: string) => {
  return /^(09\d{8}|0\d{1,2}-?\d{3,4}-?\d{4})$/.test(phone.replace(/\s/g, ''))
}

const handleSubmit = async () => {
  isSubmitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''

  // 前端驗證
  if (!formData.value.organization.trim()) {
    errorMessage.value = '請填寫公司/單位名稱'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }
  if (!formData.value.name.trim()) {
    errorMessage.value = '請填寫聯絡人姓名'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }
  if (!formData.value.phone.trim()) {
    errorMessage.value = '請填寫聯絡電話'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }
  if (!isValidPhone(formData.value.phone)) {
    errorMessage.value = '電話格式不正確，請輸入有效的手機或市話號碼'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }
  if (!formData.value.email.trim()) {
    errorMessage.value = '請填寫電子郵件'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }
  if (!isValidEmail(formData.value.email)) {
    errorMessage.value = '電子郵件格式不正確'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }
  if (!formData.value.message.trim()) {
    errorMessage.value = '請填寫合作內容詳情'
    isSubmitting.value = false
    submitStatus.value = 'error'
    return
  }

  // 模擬提交（實際需要接 API）
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    submitStatus.value = 'success'
    formData.value = {
      organization: '',
      name: '',
      phone: '',
      lineId: '',
      email: '',
      companySize: '',
      budgetRange: '',
      message: '',
    }
  } catch (error) {
    submitStatus.value = 'error'
    errorMessage.value = '網路錯誤，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  submitStatus.value = 'idle'
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Hero -->
    <section class="bg-navy-700 min-h-screen flex items-center pt-16 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(251,114,10,0.1)_0%,transparent_52%),radial-gradient(circle_at_5%_74%,rgba(58,106,133,0.25)_0%,transparent_45%)]" />
      <div
        class="absolute inset-0 opacity-[0.018]"
        :style="{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '55px 55px'
        }"
      />

      <div class="container mx-auto px-4 relative z-10 py-16">
        <div class="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div>
            <div class="flex items-center gap-3 text-orange text-sm font-medium tracking-widest uppercase mb-8">
              <span class="w-5 h-px bg-orange" />
              中高齡肌力訓練專家
              <span class="w-5 h-px bg-orange" />
            </div>

            <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              講座 / 採訪 / 合作洽詢
            </h1>

            <p class="text-white/65 text-lg font-light leading-relaxed max-w-xl mb-8">
              練健康以<strong class="text-white font-medium">中高齡與特殊族群健康為核心</strong>，積極推動跨領域合作。我們深耕醫療體系教育訓練、企業健康促進講座，以及前沿運動科學專案研究，期盼將正確的肌力訓練觀念推廣至海內外，共創雙贏。
            </p>

            <div class="flex gap-3 flex-wrap">
              <a href="#work" class="inline-flex items-center gap-2 bg-orange text-white font-medium px-6 py-2.5 rounded shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
                填寫洽詢表單 →
              </a>
              <a href="#press" class="inline-flex items-center gap-2 bg-transparent border border-white/20 text-white/65 font-medium px-5 py-2.5 rounded hover:border-white/40 hover:text-white transition-colors">
                查看過往實績
              </a>
            </div>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="stat in heroStats"
                :key="stat.title"
                class="bg-white/[0.07] border border-white/10 rounded p-4"
              >
                <div class="font-serif text-2xl font-bold text-white">{{ stat.title }}</div>
                <div class="text-white/50 text-sm mt-1">{{ stat.desc }}</div>
              </div>
            </div>
            <div class="bg-white/[0.05] border border-white/10 rounded p-4">
              <div class="text-white/35 text-xs font-medium tracking-widest uppercase mb-3">深度研究與指標合作單位</div>
              <div class="flex items-center gap-3 flex-wrap text-white/65 text-sm font-medium">
                <span>國家衛生研究院</span>
                <span class="text-white/20">·</span>
                <span>嘉義慈濟醫院</span>
                <span class="text-white/20">·</span>
                <span>草屯療養院</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Methodology Section -->
    <section id="method" class="py-20 bg-cream-100">
      <div class="container mx-auto px-4">
        <span class="text-orange text-sm font-medium tracking-widest uppercase block mb-4">三大核心合作範疇</span>
        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 leading-tight mb-4">
              將醫學與運動科學<br /><span class="text-orange">精準落地</span>的跨界服務
            </h2>
            <p class="text-ink/60 leading-relaxed mb-8 max-w-md">
              我們打破傳統健身房的侷限，將物理治療、呼吸治療背景的專業肌力訓練系統，輸出給更需要健康促進的組織與大企業。
            </p>

            <div class="space-y-0 divide-y divide-navy-700/15">
              <div
                v-for="point in methodPoints"
                :key="point.num"
                class="flex gap-4 py-5"
              >
                <div class="font-serif text-2xl font-bold text-navy-700/25 flex-shrink-0 w-8">{{ point.num }}</div>
                <div>
                  <h3 class="font-bold text-navy-700 mb-1">{{ point.title }}</h3>
                  <p class="text-ink/60 text-sm leading-relaxed">{{ point.body }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Panel -->
          <div class="space-y-3">
            <div class="bg-navy-700 rounded p-6 space-y-4 divide-y divide-white/10">
              <div class="pb-4">
                <div class="font-serif text-4xl font-black text-orange leading-none mb-2">中高齡研究</div>
                <p class="text-white/65 text-sm leading-relaxed">與「國家衛生研究院」深度合作，共同研究中高齡訓練者訓練頻率與肌肉增長的關係。</p>
                <span class="text-white/30 text-xs mt-2 block">學術與臨床實務接軌</span>
              </div>
              <div class="pt-4">
                <div class="font-serif text-4xl font-black text-orange leading-none mb-2">科學化篩檢</div>
                <p class="text-white/65 text-sm leading-relaxed">受邀參與高齡健康博覽會，將長輩動作篩檢結果數字化，提供精準動作改善與科學化評估。</p>
                <span class="text-white/30 text-xs mt-2 block">健康照護・快樂生活・智慧服務</span>
              </div>
            </div>

            <div class="bg-white border border-navy-700/15 rounded p-5">
              <div class="text-sm font-bold text-navy-700 mb-3">專案合作引進之頂級檢測系統：</div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in ['身體組成測量儀器 InBody 770', '智慧體適能檢測系統 Body Go', '銀髮基礎動作篩檢模組']"
                  :key="tag"
                  class="text-xs text-navy-600 bg-navy-700/10 border border-navy-700/15 px-3 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Press Cases Section -->
    <section id="press" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-12 items-end mb-10">
          <div>
            <span class="text-orange text-sm font-medium tracking-widest uppercase block mb-4">Cooperation Cases</span>
            <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 leading-tight">
              深耕台灣，<span class="text-orange">走向國際</span><br />練健康的跨領域實績
            </h2>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="stat in pressStats"
              :key="stat.label"
              class="text-center p-4 bg-cream-100 border border-navy-700/15 rounded"
            >
              <div class="font-serif text-2xl font-bold text-navy-700 leading-none">{{ stat.num }}</div>
              <div class="text-ink/50 text-xs mt-1">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <article
            v-for="c in pressCases"
            :key="c.org"
            class="border border-navy-700/15 rounded overflow-hidden bg-white hover:shadow-lg transition-shadow"
          >
            <div class="h-40 bg-navy-700 relative flex items-end overflow-hidden">
              <img
                :src="c.image"
                :alt="c.org"
                class="absolute inset-0 w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-navy-700 via-navy-700/60 to-transparent" />
              <span class="absolute top-3 left-3 text-xs font-medium bg-orange/90 text-white px-3 py-1 rounded-full tracking-wide z-10">
                {{ c.badge }}
              </span>
              <span class="relative z-10 font-serif text-xl font-bold text-white px-4 pb-3">{{ c.org }}</span>
            </div>
            <div class="p-5">
              <h3 class="font-bold text-navy-700 text-sm mb-2 leading-snug">{{ c.title }}</h3>
              <p class="text-ink/60 text-sm leading-relaxed border-l-2 border-orange pl-3">「{{ c.quote }}」</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Contact Form Section -->
    <section id="work" class="py-20 bg-cream-100">
      <div class="container mx-auto px-4">
        <div class="text-center mb-10">
          <span class="text-orange text-sm font-medium tracking-widest uppercase block mb-4">Contact Form</span>
          <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 leading-tight mb-6">
            與我們攜手，<span class="text-orange">共創雙贏的健康價值</span>
          </h2>
          <p class="text-ink/60 text-base leading-relaxed max-w-2xl mx-auto">
            不論您是需要專業授課的醫療學術單位、期望舉辦員工健康促進講座的企業品牌，或是海外地區的訓練營授權洽詢。歡迎填寫下方表單，團隊將於 3-5 個工作天內由專人主動與您聯繫。
          </p>
        </div>

        <div class="bg-white border border-navy-700/15 rounded-lg p-6 lg:p-8 shadow-sm max-w-3xl mx-auto">
          <p class="text-xs font-bold text-ink/50 tracking-wide mb-4">請選擇您的洽詢項目：</p>

          <!-- Type selector -->
          <div class="grid grid-cols-3 gap-2 mb-6">
            <button
              v-for="(type, idx) in enquiryTypes"
              :key="type.value"
              type="button"
              @click="activeType = idx"
              :class="[
                'py-3 px-4 rounded border text-center text-sm font-medium transition-colors',
                activeType === idx
                  ? 'border-navy-700 bg-navy-700/10 text-navy-700'
                  : 'border-navy-700/15 bg-cream-100 text-ink/50 hover:border-navy-700/30'
              ]"
            >
              {{ type.label }}
            </button>
          </div>

          <!-- Success state -->
          <div v-if="submitStatus === 'success'" class="text-center py-12">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="font-serif text-2xl font-bold text-navy-700 mb-2">表單已送出！</h3>
            <p class="text-ink/60 mb-6">我們將於 3-5 個工作天內與您聯繫</p>
            <button
              type="button"
              @click="resetForm"
              class="text-orange font-medium hover:underline"
            >
              填寫另一份表單
            </button>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Error message -->
            <div v-if="submitStatus === 'error'" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {{ errorMessage }}
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-ink/70 block mb-1.5">公司 / 單位名稱 <span class="text-orange">*</span></label>
                <input
                  type="text"
                  v-model="formData.organization"
                  :disabled="isSubmitting"
                  class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                  placeholder="請輸入完整的公司或單位名稱"
                />
              </div>
              <div>
                <label class="text-xs font-bold text-ink/70 block mb-1.5">聯絡人姓名 <span class="text-orange">*</span></label>
                <input
                  type="text"
                  v-model="formData.name"
                  :disabled="isSubmitting"
                  class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                  placeholder="請輸入聯絡人姓名"
                />
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-ink/70 block mb-1.5">聯絡電話 <span class="text-orange">*</span></label>
                <input
                  type="tel"
                  v-model="formData.phone"
                  :disabled="isSubmitting"
                  class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                  placeholder="請輸入您的聯絡電話"
                />
              </div>
              <div>
                <label class="text-xs font-bold text-ink/70 block mb-1.5">電子郵件 <span class="text-orange">*</span></label>
                <input
                  type="email"
                  v-model="formData.email"
                  :disabled="isSubmitting"
                  class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label class="text-xs font-bold text-ink/70 block mb-1.5">Line ID <span class="text-ink/40 font-normal">(選填)</span></label>
              <input
                type="text"
                v-model="formData.lineId"
                :disabled="isSubmitting"
                class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                placeholder="請輸入 Line ID 以利快速聯絡"
              />
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-ink/70 block mb-1.5">規模人數 <span class="text-ink/40 font-normal">(選填)</span></label>
                <input
                  type="text"
                  v-model="formData.companySize"
                  :disabled="isSubmitting"
                  class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                  placeholder="例如：50 人、100-200 人"
                />
              </div>
              <div>
                <label class="text-xs font-bold text-ink/70 block mb-1.5">預算區間 <span class="text-ink/40 font-normal">(選填)</span></label>
                <input
                  type="text"
                  v-model="formData.budgetRange"
                  :disabled="isSubmitting"
                  class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm disabled:opacity-50"
                  placeholder="例如：5 萬以下、5-10 萬、10 萬以上"
                />
              </div>
            </div>

            <div>
              <label class="text-xs font-bold text-ink/70 block mb-1.5">合作內容詳情 <span class="text-orange">*</span></label>
              <textarea
                rows="4"
                v-model="formData.message"
                :disabled="isSubmitting"
                class="w-full px-4 py-2.5 bg-cream-100 border border-navy-700/20 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 outline-none text-sm resize-none disabled:opacity-50"
                :placeholder="enquiryTypes[activeType].placeholder"
              />
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-orange text-white font-bold py-3.5 rounded shadow-lg shadow-orange/35 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? '送出中...' : '送出合作洽詢表單 →' }}
            </button>
            <p class="text-center text-xs text-ink/40">送出即代表您同意本網頁資訊將僅作為商務對接與回覆洽詢使用。</p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
