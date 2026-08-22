<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getGroupClassVariant } from '~/config/groupClassVariants'
import { relationshipOptions } from '~/config/formOptions'

const route = useRoute()
// 廠商變體表單：?v=<key> 對應 config/groupClassVariants.ts（未知值自動 fallback 成 default）
const variant = computed(() => getGroupClassVariant(route.query.v))

useHead({
  title: '團體課程報名｜練健康 LKK Wellness',
  meta: [
    {
      name: 'description',
      content:
        '練健康團體課程報名：基礎重訓、樂齡肌力、舉重團班，一期4堂、隨時可續課，南京・松江・西門・七張四店開課。填表後教練 2-3 個工作天內主動聯繫確認梯次。',
    },
  ],
})

const LINE_URL = 'https://line.me/R/ti/p/%40201fzruh'

const formData = reactive({
  name: '',
  gender: '',
  ageRange: '',
  phone: '',
  email: '',
  isFillerSelf: '',
  fillerName: '',
  relationship: '',
  contactPhone: '',
  course: '',
  store: '',
  preferredTime: '',
  experience: '',
  medicalHistory: '',
  source: [] as string[],
  note: '',
})

const genders = ['男', '女']
const ageRanges = ['50歲以下', '50–65歲', '65歲以上']
const courses = [
  { value: '基礎重訓團班', price: '$2,400' },
  { value: '樂齡肌力體適能團班', price: '$2,400' },
  { value: '練健康舉重團班', price: '$3,200' },
]
const storeOptions = [
  '南京店｜台北市中山區南京東路三段29號B1',
  '松江店｜台北市中山區松江路122號B1',
  '西門店｜台北市中正區寶慶路39號',
  '七張店｜新北市新店區北新路二段252號B1-2',
]
const experiences = [
  { value: '完全新手', label: '完全新手' },
  { value: '有一些基礎', label: '有一些基礎' },
  { value: '有規律訓練習慣', label: '規律訓練中' },
]
const sourceOptions = [
  { value: 'Facebook 臉書粉專', label: 'Facebook 粉專' },
  { value: 'Instagram 視覺社群', label: 'Instagram' },
  { value: 'YouTube 影片頻道', label: 'YouTube 影片' },
  { value: '親朋好友推薦分享', label: '親友推薦' },
  { value: '上過體驗課／一對一課程', label: '上過體驗課' },
  { value: '門店路過看到', label: '路過看到門店' },
]

const heroGets = [
  '四堂學會重訓六大基礎動作',
  '教練隨堂指導，暖身收操都安排好',
  '樂齡族群也有專屬強度調整',
  '南京・松江・西門・七張 四店開課',
]
const reassure = [
  '沒有重訓基礎也能報名',
  '不須從月初開始，隨時可報名',
  '請假最晚提前一週可順延',
  '教練 2-3 個工作天內主動聯繫',
]
const courseCards = [
  {
    title: '基礎重訓團班',
    price: '$2,400',
    unit: '4堂／一期',
    desc: '四堂課循序漸進學會深蹲、硬舉、分腿蹲、胸推、肩推、划船六大基礎動作，從徒手到啞鈴、壺鈴、槓鈴都會用。教練隨堂指導與收操，課後你就能自己上健身房訓練。適合完全沒經驗、想快速脫離新手村的人。',
    tags: [{ t: '新手友善' }, { t: '4間門店皆有開班' }, { t: '課後可自主訓練' }],
  },
  {
    title: '樂齡肌力體適能團班',
    price: '$2,400',
    unit: '4堂／一期',
    desc: '課程內容與基礎重訓團班相同的動作架構，但教練會依中高齡學員的身體狀況調整強度與節奏，並加強日常生活起居相關的動作模式，目標是預防跌倒臥床，維持晚年自主生活的能力。',
    tags: [{ t: '中高齡專屬強度' }, { t: '4間門店皆有開班' }],
  },
  {
    title: '練健康舉重團班',
    price: '$3,200',
    unit: '4堂／一期',
    desc: '由具備舉重與運動防護背景的教練帶領，扎穩舉重馬步基本功，教授抓舉、挺舉相關的動作元素，讓你在平日晚間也能體驗舉重的速度與力量。適合想精進運動表現、體驗正規舉重技術的學員。',
    tags: [{ t: '教練專項指導' }, { t: '目前僅南京店開班', note: true }],
  },
]
const scheduleTabs = [
  { id: 'nanjing', label: '南京店' },
  { id: 'songjiang', label: '松江店' },
  { id: 'ximen', label: '西門店' },
  { id: 'qizhang', label: '七張店' },
]
const schedule: Record<string, { rows: { day: string; times: string; lift?: string }[] }> = {
  nanjing: {
    rows: [
      { day: '週一', times: '12:00、18:00' },
      { day: '週二', times: '20:00' },
      { day: '週三', times: '12:00、14:00', lift: '另有舉重團班 19:00、20:00' },
      { day: '週四', times: '09:30、12:00、18:00、19:00、20:00' },
      { day: '週五', times: '10:00、15:00、16:00、19:00' },
      { day: '週六', times: '11:00、13:00、14:00、16:00' },
      { day: '週日', times: '17:00' },
    ],
  },
  songjiang: {
    rows: [
      { day: '週一', times: '19:00' },
      { day: '週二', times: '19:30' },
      { day: '週三', times: '10:00' },
      { day: '週四', times: '19:00' },
      { day: '週五', times: '19:00' },
      { day: '週六', times: '11:00、13:00、15:00' },
      { day: '週日', times: '10:00' },
    ],
  },
  ximen: {
    rows: [
      { day: '週一', times: '10:00、11:00、14:00、20:00' },
      { day: '週二', times: '17:00、19:00' },
      { day: '週三', times: '13:00、19:00、20:00' },
      { day: '週四', times: '12:00、18:30' },
      { day: '週五', times: '10:00、17:00、18:00、19:00' },
      { day: '週六', times: '10:00、14:00' },
      { day: '週日', times: '15:00' },
    ],
  },
  qizhang: {
    rows: [
      { day: '週一', times: '11:00、15:00、19:00、20:00' },
      { day: '週三', times: '20:00' },
      { day: '週五', times: '19:00' },
      { day: '週日', times: '10:00' },
    ],
  },
}
const activeStore = ref('nanjing')

// 鎖定門店（?v= 變體）：以門店字串開頭比對，命中就自動帶入並隱藏下拉選單
const lockedStore = computed(() => {
  const key = variant.value.lockStore
  if (!key) return null
  return storeOptions.find((s) => s === key || s.startsWith(key)) || null
})
watch(lockedStore, (s) => { if (s) formData.store = s }, { immediate: true })

// 鎖定課程（?v= 變體）：命中就自動帶入並隱藏課程選項
const lockedCourse = computed(() => {
  const key = variant.value.lockCourse
  if (!key) return null
  return courses.find((c) => c.value === key) || null
})
watch(lockedCourse, (c) => { if (c) formData.course = c.value }, { immediate: true })

const steps = [
  { n: '1', title: '填寫報名表單', desc: '約 1~2 分鐘完成，選好課程與偏好門店即可' },
  { n: '2', title: '教練主動電話／LINE聯繫', desc: '2-3 個工作天內確認可開班的梯次日期、名額狀況與繳費方式' },
  { n: '3', title: '開始上課', desc: '一期4堂，結束後可直接續課，不用等月初重新報名' },
]
const faqs = [
  { q: '一定要先上過體驗課才能報團課嗎？', a: '不用。團體課程可以直接報名，教練會在第一堂課了解你的身體狀況再調整動作強度。' },
  { q: '完全沒運動過，可以跟上進度嗎？', a: '可以。基礎重訓團班就是為新手設計的，從最基礎的徒手動作開始，四堂循序漸進。' },
  { q: '上課時間到不了怎麼辦？', a: '最晚提前一週告知教練即可請假，課程會順延一週，不會浪費堂數。' },
  { q: '四堂上完後一定要續課嗎？', a: '不強迫。四堂結束後你可以自行決定是否續課、換課程，或改上一對一教練課。' },
]

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const isSuccess = ref(false)

function validate() {
  const e: Record<string, string> = {}
  if (!formData.name.trim()) e.name = '請填寫學員姓名'
  if (!formData.gender) e.gender = '請選擇性別'
  if (!formData.ageRange) e.ageRange = '請選擇年齡區間'
  const phone = formData.phone.replace(/[\s-]/g, '')
  if (!phone) e.phone = '請填寫手機號碼'
  else if (!/^09\d{8}$/.test(phone)) e.phone = '手機格式不正確（09 開頭共 10 碼）'
  if (!formData.email.trim()) e.email = '請填寫電子郵件'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email 格式不正確'
  if (!formData.isFillerSelf) e.isFillerSelf = '請選擇'
  if (formData.isFillerSelf === '否') {
    if (!formData.relationship) e.relationship = '請選擇與學員的關係'
    if (!formData.fillerName.trim()) e.fillerName = '請輸入報名者姓名'
    const cp = formData.contactPhone.replace(/[\s-]/g, '')
    if (!cp) e.contactPhone = '請輸入方便聯繫的電話'
    else if (!/^09\d{8}$/.test(cp)) e.contactPhone = '請輸入有效的手機號碼'
  }
  if (!formData.course) e.course = '請選擇想報名的課程'
  if (!formData.store) e.store = '請選擇門店'
  if (!formData.medicalHistory.trim()) e.medicalHistory = '請填寫（若完全健康請填「無」）'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  try {
    const res = await $fetch<{ success: boolean; error?: string }>('/api/leads/group-class', {
      method: 'POST',
      body: {
        ...formData,
        sourcePage: '/group-booking',
        // 廠商變體表單標記（?v= / ?src=），與 UTM 一併寫進名單供後台篩選
        formVariant: (route.query.v as string) || null,
        company: variant.value.company || null,
        leadSource: (typeof route.query.src === 'string' ? route.query.src : null) || variant.value.leadSource || null,
        utm: useUtm().getUtm(),
      },
    })
    if (res.success) {
      isSuccess.value = true
      await nextTick()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      alert(res.error || '送出失敗，請稍後再試')
    }
  } catch (err: any) {
    alert(err?.data?.error || '送出失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-cream border-[1.5px] border-navy-700/15 rounded-lg text-[0.95rem] text-ink transition focus:outline-none focus:border-navy-700 focus:bg-white focus:ring-2 focus:ring-navy-700/10'
</script>

<template>
  <div class="bg-cream text-ink">
    <!-- ===== SUCCESS ===== -->
    <section v-if="isSuccess" class="py-16 lg:py-24">
      <div class="max-w-xl mx-auto px-4 text-center">
        <div class="w-[76px] h-[76px] rounded-full bg-[#2d8a5e]/12 border-2 border-[#2d8a5e] flex items-center justify-center mx-auto mb-6 text-[#2d8a5e]">
          <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="font-serif text-3xl lg:text-4xl font-black text-[#1a3545] mb-3">團體課程報名已送出！</h1>
        <p class="text-ink/70 leading-relaxed mb-8">
          你的報名資料已即時同步後台系統。由於團體課程需依當期名額與人數安排梯次，<strong class="text-ink">請點擊下方按鈕加入「練健康 LINE 官方帳號」</strong>，傳送一則包含學員姓名與想上課程的訊息，教練將以最快速度為你確認開課日期！
        </p>

        <a
          :href="LINE_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2.5 w-full py-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#06C755]/30 transition mb-6"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.64 2 10.13c0 4.02 3.55 7.39 8.35 8.03.33.07.77.22.88.5.1.26.07.66.03.92l-.14.85c-.04.26-.2 1.02.89.56 1.1-.46 5.9-3.47 8.05-5.94C21.6 13.42 22 11.83 22 10.13 22 5.64 17.52 2 12 2z" /></svg>
          點擊加入練健康官方 LINE 帳號（快速排課通道）
        </a>

        <div class="bg-white rounded-2xl p-6 border border-navy-700/15 shadow-sm text-left mb-6">
          <div class="font-bold text-[#1a3545] mb-3">接下來的確認流程</div>
          <div class="space-y-2">
            <div v-for="(row, i) in ['加入官方 LINE 並傳送姓名與課程後，教練將於 2-3 個工作天內確認梯次與繳費方式', '若你未加入 LINE，我們也將於 2-3 個工作天內嘗試撥打你填寫的手機號碼聯繫', '一期4堂，請假最晚提前一週告知可順延一週']" :key="i" class="flex items-start gap-2 text-sm text-ink/70 leading-relaxed">
              <span class="text-orange flex-shrink-0">→</span><span>{{ row }}</span>
            </div>
          </div>
        </div>

        <div class="bg-[#1a3545] rounded-xl p-6 text-center">
          <div class="text-sm text-white/50 mb-1.5">有任何緊急排課變更？也可直接來電</div>
          <div class="font-serif text-2xl font-bold text-white"><a href="tel:+886225074196" class="text-orange">(02) 2507-4196</a></div>
        </div>
      </div>
    </section>

    <!-- ===== PAGE ===== -->
    <template v-else>
      <!-- HERO -->
      <section class="relative bg-[#1a3545] pt-16 overflow-hidden text-white">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(251,114,10,0.10)_0%,transparent_55%),radial-gradient(circle_at_5%_75%,rgba(58,106,133,0.3)_0%,transparent_45%)]" />
        <div class="relative z-10 max-w-3xl mx-auto px-4 text-center py-12 lg:py-20">
          <div class="inline-flex items-center bg-orange/[0.18] border border-orange/40 text-orange text-[0.78rem] font-medium px-3.5 py-1.5 rounded-full mb-5 tracking-wide">
            {{ variant.hero?.badge ?? '一期4堂 · 隨時可續課' }}
          </div>
          <h1 class="font-serif text-3xl lg:text-5xl font-black leading-tight mb-6">
            {{ variant.hero?.title ?? '自己練沒有動力嗎？' }}<br><span class="text-orange">{{ variant.hero?.titleHighlight ?? '找個班一起練' }}</span>
          </h1>
          <!-- 清單本身靠左對齊（勾勾切齊），整塊在置中版面中置中 -->
          <div class="inline-flex flex-col items-start gap-2 mb-6 text-left">
            <div v-for="g in (variant.hero?.checklist ?? heroGets)" :key="g" class="flex items-start gap-2.5 text-sm text-white/70">
              <span class="w-5 h-5 rounded-full bg-orange/20 border border-orange/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-orange">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              {{ g }}
            </div>
          </div>
          <div>
            <a href="#form" class="inline-block bg-orange hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-orange/35 transition">{{ variant.hero?.ctaText ?? '團體課報名' }}</a>
          </div>
          <div class="flex items-center justify-center gap-1.5 text-xs text-white/40 mt-3">
            <svg class="w-3.5 h-3.5 text-orange-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span><strong class="text-orange-300">4堂 $2,400 起</strong>・請假可順延一週・無須綁約長期課程</span>
          </div>
        </div>
      </section>

      <!-- REASSURE -->
      <div class="bg-white border-b border-navy-700/15 py-5">
        <div class="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <div v-for="r in reassure" :key="r" class="flex items-center gap-2 text-[0.83rem] text-ink/70">
            <svg class="w-4 h-4 text-[#2d8a5e] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            {{ r }}
          </div>
        </div>
      </div>

      <!-- MAIN -->
      <div class="py-10 lg:py-16">
        <div class="max-w-6xl mx-auto px-4 grid lg:grid-cols-[520px_1fr] gap-8 lg:gap-14 items-start">

          <!-- FORM -->
          <div id="form" class="lg:sticky lg:top-20">
            <div class="bg-white rounded-[20px] border border-navy-700/15 shadow-xl shadow-navy-700/10 overflow-hidden">
              <div class="bg-[#1a3545] px-6 py-5">
                <div class="font-serif text-lg font-bold text-white mb-1">團體課程報名</div>
                <div class="text-sm text-white/50">教練會在 2-3 個工作天內主動聯繫確認開課梯次</div>
                <div class="inline-flex items-center gap-1.5 bg-orange/20 border border-orange/35 text-orange text-xs font-semibold px-3 py-1 rounded-full mt-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                  一期4堂・隨時開放報名
                </div>
              </div>

              <div class="px-6 py-6">
                <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
                  <!-- 第一部分 -->
                  <div class="font-serif text-[1.05rem] font-bold text-navy-700 border-b-2 border-navy-700/15 pb-1">第一部分：基本資料</div>

                  <div class="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">學員姓名 <span class="text-orange">*</span></label>
                      <input v-model="formData.name" type="text" placeholder="學員姓名" :class="inputClass" />
                      <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">學員性別 <span class="text-orange">*</span></label>
                      <div class="grid grid-cols-3 gap-1.5">
                        <label v-for="g in genders" :key="g" class="block cursor-pointer">
                          <input v-model="formData.gender" type="radio" :value="g" class="peer sr-only" />
                          <span class="flex items-center justify-center px-1 py-2.5 bg-cream border-[1.5px] border-navy-700/15 rounded-[10px] text-sm text-ink/70 text-center transition peer-checked:border-orange peer-checked:bg-orange/[0.08] peer-checked:text-[#d45c04] peer-checked:font-semibold">{{ g }}</span>
                        </label>
                      </div>
                      <p v-if="errors.gender" class="text-red-500 text-xs mt-1">{{ errors.gender }}</p>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">學員年齡區間 <span class="text-orange">*</span></label>
                    <div class="grid grid-cols-3 gap-1.5">
                      <label v-for="a in ageRanges" :key="a" class="block cursor-pointer">
                        <input v-model="formData.ageRange" type="radio" :value="a" class="peer sr-only" />
                        <span class="flex items-center justify-center px-1 py-2.5 bg-cream border-[1.5px] border-navy-700/15 rounded-[10px] text-sm text-ink/70 text-center transition peer-checked:border-orange peer-checked:bg-orange/[0.08] peer-checked:text-[#d45c04] peer-checked:font-semibold">{{ a }}</span>
                      </label>
                    </div>
                    <p v-if="errors.ageRange" class="text-red-500 text-xs mt-1">{{ errors.ageRange }}</p>
                  </div>

                  <div class="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">手機號碼 <span class="text-orange">*</span></label>
                      <input v-model="formData.phone" type="tel" inputmode="tel" placeholder="0912-345-678" :class="inputClass" />
                      <p v-if="errors.phone" class="text-red-500 text-xs mt-1">{{ errors.phone }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">電子郵件 <span class="text-orange">*</span></label>
                      <input v-model="formData.email" type="email" placeholder="name@email.com" :class="inputClass" />
                      <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">是否為你本人親自填寫？ <span class="text-orange">*</span></label>
                    <div class="grid grid-cols-2 gap-1.5">
                      <label v-for="opt in [{ v: '是', l: '是，我是本人' }, { v: '否', l: '否，我是幫家人/朋友填' }]" :key="opt.v" class="block cursor-pointer">
                        <input v-model="formData.isFillerSelf" type="radio" :value="opt.v" class="peer sr-only" />
                        <span class="flex items-center justify-center px-2 py-2.5 bg-cream border-[1.5px] border-navy-700/15 rounded-[10px] text-sm text-ink/70 text-center transition peer-checked:border-orange peer-checked:bg-orange/[0.08] peer-checked:text-[#d45c04] peer-checked:font-semibold">{{ opt.l }}</span>
                      </label>
                    </div>
                    <p v-if="errors.isFillerSelf" class="text-red-500 text-xs mt-1">{{ errors.isFillerSelf }}</p>
                  </div>

                  <div v-if="formData.isFillerSelf === '否'" class="bg-navy-700/[0.04] border border-dashed border-navy-700 rounded-xl p-4 space-y-3">
                    <div>
                      <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">與學員的關係 <span class="text-orange">*</span></label>
                      <select v-model="formData.relationship" :class="inputClass">
                        <option value="">請選擇</option>
                        <option v-for="r in relationshipOptions" :key="r" :value="r">{{ r }}</option>
                      </select>
                      <p v-if="errors.relationship" class="text-red-500 text-xs mt-1">{{ errors.relationship }}</p>
                    </div>
                    <div class="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">報名者姓名 <span class="text-orange">*</span></label>
                        <input v-model="formData.fillerName" type="text" placeholder="請輸入你的姓名" :class="inputClass" />
                        <p v-if="errors.fillerName" class="text-red-500 text-xs mt-1">{{ errors.fillerName }}</p>
                      </div>
                      <div>
                        <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">方便聯繫的電話 <span class="text-orange">*</span></label>
                        <input v-model="formData.contactPhone" type="tel" placeholder="0912345678" :class="inputClass" />
                        <p v-if="errors.contactPhone" class="text-red-500 text-xs mt-1">{{ errors.contactPhone }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- 第二部分 -->
                  <div class="font-serif text-[1.05rem] font-bold text-navy-700 border-b-2 border-navy-700/15 pb-1 pt-2">第二部分：課程資訊</div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">想報名的課程 <span v-if="!lockedCourse" class="text-orange">*</span></label>
                    <div v-if="lockedCourse" class="flex items-center justify-between px-3.5 py-2.5 bg-orange/[0.08] border-[1.5px] border-orange rounded-lg text-[0.95rem] font-semibold text-[#d45c04]">
                      <span>{{ lockedCourse.value }}</span>
                      <span class="text-xs font-normal text-ink/45">{{ lockedCourse.price }}</span>
                    </div>
                    <div v-else class="grid grid-cols-3 gap-1.5">
                      <label v-for="c in courses" :key="c.value" class="block cursor-pointer">
                        <input v-model="formData.course" type="radio" :value="c.value" class="peer sr-only" />
                        <span class="flex flex-col items-center justify-center px-1 py-2.5 bg-cream border-[1.5px] border-navy-700/15 rounded-[10px] text-[0.82rem] text-ink/70 text-center leading-tight transition peer-checked:border-orange peer-checked:bg-orange/[0.08] peer-checked:text-[#d45c04] peer-checked:font-semibold">
                          {{ c.value }}<span class="text-[0.68rem] text-ink/45 font-normal mt-0.5">{{ c.price }}</span>
                        </span>
                      </label>
                    </div>
                    <p v-if="errors.course" class="text-red-500 text-xs mt-1">{{ errors.course }}</p>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">想去哪一間門店上課？ <span v-if="!lockedStore" class="text-orange">*</span></label>
                    <div v-if="lockedStore" class="px-3.5 py-2.5 bg-orange/[0.08] border-[1.5px] border-orange rounded-lg text-[0.95rem] font-semibold text-[#d45c04]">
                      {{ lockedStore }}
                    </div>
                    <select v-else v-model="formData.store" :class="inputClass">
                      <option value="" disabled>請選擇偏好的門店地點</option>
                      <option v-for="s in storeOptions" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <p v-if="errors.store" class="text-red-500 text-xs mt-1">{{ errors.store }}</p>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">偏好的上課星期／時段 <span class="text-ink/45 font-normal text-xs">（選填，可參考右側各店開課時段）</span></label>
                    <input v-model="formData.preferredTime" type="text" placeholder="例如：週四晚上、週六上午皆可" :class="inputClass" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">過去是否有重訓經驗？ <span class="text-ink/45 font-normal text-xs">（選填）</span></label>
                    <div class="grid grid-cols-3 gap-1.5">
                      <label v-for="ex in experiences" :key="ex.value" class="block cursor-pointer">
                        <input v-model="formData.experience" type="radio" :value="ex.value" class="peer sr-only" />
                        <span class="flex items-center justify-center px-1 py-2.5 bg-cream border-[1.5px] border-navy-700/15 rounded-[10px] text-sm text-ink/70 text-center transition peer-checked:border-orange peer-checked:bg-orange/[0.08] peer-checked:text-[#d45c04] peer-checked:font-semibold">{{ ex.label }}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">是否有任何疾病、舊傷或開刀史？ <span class="text-orange">*</span></label>
                    <textarea v-model="formData.medicalHistory" rows="3" placeholder="例如：高血壓、糖尿病、骨質疏鬆、膝關節退化、心臟病、曾動過何種手術...等。若完全健康，請填寫「無」。" :class="[inputClass, 'resize-y min-h-[80px]']" />
                    <p v-if="errors.medicalHistory" class="text-red-500 text-xs mt-1">{{ errors.medicalHistory }}</p>
                  </div>

                  <!-- 第三部分 -->
                  <div class="font-serif text-[1.05rem] font-bold text-navy-700 border-b-2 border-navy-700/15 pb-1 pt-2">第三部分：其他調查</div>

                  <div v-if="!variant.hideSources">
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">你是從哪裡得知練健康團體課程資訊的呢？ <span class="text-ink/45 font-normal text-xs">（可複選）</span></label>
                    <div class="grid grid-cols-2 gap-1.5">
                      <label v-for="s in sourceOptions" :key="s.value" class="flex items-center gap-1.5 px-2.5 py-2 bg-cream border-[1.5px] border-navy-700/15 rounded-lg text-sm text-ink/70 cursor-pointer transition has-[:checked]:border-navy-700 has-[:checked]:bg-navy-700/[0.07] has-[:checked]:text-[#1a3545] has-[:checked]:font-medium">
                        <input v-model="formData.source" type="checkbox" :value="s.value" class="peer sr-only" />
                        <span class="w-[15px] h-[15px] rounded border-[1.5px] border-navy-700/25 bg-white flex-shrink-0 flex items-center justify-center peer-checked:bg-navy-700 peer-checked:border-navy-700 transition">
                          <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        {{ s.label }}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[#1a3545] mb-1.5">備註與其他想補充說明的細節 <span class="text-ink/45 font-normal text-xs">（選填）</span></label>
                    <textarea v-model="formData.note" rows="2" placeholder="例如想找同伴一起上課、特定教練指定需求、或其他特殊身體狀況備忘..." :class="[inputClass, 'resize-y min-h-[60px]']" />
                  </div>

                  <button type="submit" :disabled="submitting" class="w-full py-3.5 bg-orange hover:bg-orange-400 text-white font-bold text-[1.05rem] rounded-xl shadow-lg shadow-orange/35 transition flex items-center justify-center gap-2 disabled:opacity-60">
                    {{ submitting ? '送出中…' : '送出團體課程報名' }}
                    <svg v-if="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" /></svg>
                  </button>
                  <p class="text-xs text-ink/50 text-center leading-relaxed">送出即表示同意我們以電話或 LINE 與你聯繫確認開課梯次，個人資料僅用於此報名目的。</p>
                  <div class="text-center pt-4 border-t border-navy-700/15 text-sm text-ink/70">
                    不想填表？直接來電也可以<br>
                    <a href="tel:+886225074196" class="text-navy-700 font-semibold">(02) 2507-4196</a>（南京店）
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- RIGHT -->
          <div class="space-y-12">
            <!-- 三種團班 -->
            <div>
              <div class="flex items-center gap-2 text-[0.78rem] font-bold tracking-widest uppercase text-orange mb-2"><span class="w-[18px] h-0.5 bg-orange" />課程介紹</div>
              <h2 class="font-serif text-2xl lg:text-3xl font-black text-[#1a3545] mb-5">三種團班<span class="text-orange">選一個開始</span></h2>
              <div class="space-y-3.5">
                <div v-for="cc in courseCards" :key="cc.title" class="bg-white rounded-2xl border border-navy-700/15 shadow-sm p-6">
                  <div class="flex justify-between items-start gap-4 mb-1.5">
                    <div class="font-serif text-lg font-bold text-[#1a3545]">{{ cc.title }}</div>
                    <div class="flex-shrink-0 text-right">
                      <div class="font-serif text-xl font-black text-orange">{{ cc.price }}</div>
                      <div class="text-[0.72rem] text-ink/45">{{ cc.unit }}</div>
                    </div>
                  </div>
                  <p class="text-sm text-ink/65 leading-relaxed mb-3">{{ cc.desc }}</p>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="tag in cc.tags" :key="tag.t" :class="['text-xs px-2.5 py-0.5 rounded-full border', tag.note ? 'bg-orange/[0.08] border-orange/30 text-[#d45c04]' : 'bg-cream border-navy-700/15 text-navy-700']">{{ tag.t }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 各店開課時段 -->
            <div>
              <div class="flex items-center gap-2 text-[0.78rem] font-bold tracking-widest uppercase text-orange mb-2"><span class="w-[18px] h-0.5 bg-orange" />開課時段</div>
              <h2 class="font-serif text-2xl lg:text-3xl font-black text-[#1a3545] mb-5">各店<span class="text-orange">目前開班時段</span></h2>
              <div class="bg-white rounded-2xl border border-navy-700/15 shadow-sm overflow-hidden">
                <div class="flex flex-wrap bg-cream border-b border-navy-700/15">
                  <button
                    v-for="tab in scheduleTabs"
                    :key="tab.id"
                    type="button"
                    @click="activeStore = tab.id"
                    :class="['flex-1 min-w-[50%] sm:min-w-0 px-2 py-3 text-[0.86rem] font-semibold border-b-2 transition', activeStore === tab.id ? 'text-[#d45c04] bg-white border-orange' : 'text-ink/60 border-transparent hover:text-ink']"
                  >{{ tab.label }}</button>
                </div>
                <div class="px-6 py-5">
                        <div v-for="row in schedule[activeStore].rows" :key="row.day" class="flex gap-3 py-2 text-sm border-b border-cream-200 last:border-0">
                    <div class="flex-shrink-0 w-[52px] font-bold text-navy-700">{{ row.day }}</div>
                    <div class="text-ink/70 leading-relaxed">
                      {{ row.times }}
                      <span v-if="row.lift" class="inline-block bg-navy-700/[0.08] text-navy-700 text-[0.72rem] px-2 py-0.5 rounded-lg ml-1">{{ row.lift }}</span>
                    </div>
                  </div>
                  <div class="text-xs text-ink/45 mt-4 leading-relaxed">部分班級已滿班，實際可參加班次請以門市確認為主。</div>
                </div>
              </div>
            </div>

            <!-- 三步驟 -->
            <div>
              <div class="flex items-center gap-2 text-[0.78rem] font-bold tracking-widest uppercase text-orange mb-2"><span class="w-[18px] h-0.5 bg-orange" />接下來會發生什麼</div>
              <h2 class="font-serif text-2xl lg:text-3xl font-black text-[#1a3545] mb-5">填完表單後<span class="text-orange">三個步驟</span></h2>
              <div class="relative flex flex-col">
                <div class="absolute left-[19px] top-6 bottom-6 w-[1.5px] bg-gradient-to-b from-orange to-orange/15" />
                <div v-for="st in steps" :key="st.n" class="relative z-10 flex gap-4 items-start py-4">
                  <div class="w-10 h-10 rounded-full bg-orange text-white font-serif font-black flex items-center justify-center flex-shrink-0 shadow-[0_0_0_4px_rgba(251,114,10,0.12)]">{{ st.n }}</div>
                  <div>
                    <div class="font-semibold text-[#1a3545] mb-0.5">{{ st.title }}</div>
                    <div class="text-sm text-ink/65 leading-relaxed">{{ st.desc }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQ -->
            <div>
              <div class="flex items-center gap-2 text-[0.78rem] font-bold tracking-widest uppercase text-orange mb-2"><span class="w-[18px] h-0.5 bg-orange" />你可能在想</div>
              <h2 class="font-serif text-2xl lg:text-3xl font-black text-[#1a3545] mb-5">先回答你<span class="text-orange">最常問的問題</span></h2>
              <div class="grid sm:grid-cols-2 gap-3">
                <div v-for="f in faqs" :key="f.q" class="bg-white rounded-2xl border border-navy-700/15 shadow-sm p-5">
                  <div class="flex items-start gap-1.5 font-bold text-navy-700 mb-2">
                    <span class="flex-shrink-0 w-[18px] h-[18px] rounded bg-navy-700 text-white text-[0.7rem] font-black flex items-center justify-center mt-0.5">Q</span>
                    {{ f.q }}
                  </div>
                  <div class="text-sm text-ink/65 leading-relaxed">{{ f.a }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>
