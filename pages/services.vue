<script setup lang="ts">
useHead({
  title: '服務介紹 | 練健康',
  meta: [
    { name: 'description', content: '練健康提供一對一訓練、團體課程、線上課程等多元服務。50歲以上首次體驗免費，首次體驗只要 $500。' }
  ]
})

// 一對一訓練的四種課表方向
const courseDirections = [
  {
    id: 'elderly',
    title: '中高齡肌力訓練',
    description: '50歲以後肌肉每年流失 1%，透過循序漸進的重量訓練，重建肌力、改善骨密度，預防肌少症與跌倒。',
    icon: 'heart',
    tags: ['50 歲以上', '預防肌少症', '生活功能提升'],
  },
  {
    id: 'special',
    title: '特殊族群訓練',
    description: '帕金森氏症、糖尿病、癌症術後、心肺疾病等慢性病患者，由具醫療背景的教練設計安全課程，提升生活品質。',
    icon: 'shield',
    tags: ['帕金森', '糖尿病', '癌症術後', '慢性病'],
  },
  {
    id: 'rehab',
    title: '運動復健',
    description: '結合物理治療與肌力訓練，針對關節炎、慢性腰背痛、術後恢復期，以漸進式訓練重建身體功能。',
    icon: 'refresh',
    tags: ['關節炎', '腰背痛', '術後恢復', '姿勢矯正'],
  },
  {
    id: 'fitness',
    title: '一般肌力與體態',
    description: '想減重、增肌、改善體態，或剛開始運動不知道怎麼做？從正確動作模式開始，建立長期維持的訓練習慣。',
    icon: 'bolt',
    tags: ['減重減脂', '增肌塑身', '運動新手'],
  },
]

// 團體課程
const groupCourses = [
  {
    id: 'basic',
    title: '基礎重量訓練班',
    target: '適合初學者',
    description: '從零開始學習正確的重量訓練動作模式，包含深蹲、硬舉、推拉等基本動作，建立安全且有效的訓練基礎。',
    people: '小班制 3-6 人',
    duration: '每堂 60 分鐘',
    note: '一期4堂',
  },
  {
    id: 'strength',
    title: '肌力團練班',
    target: '有基礎者適合',
    description: '針對已有基礎動作能力的學員，以提升肌力和體能為目標，訓練強度較高，挑戰自我極限。',
    people: '小班制 3-6 人',
    duration: '每堂 60 分鐘',
    note: '一期4堂',
  },
  {
    id: 'senior',
    title: '樂齡體適能訓練班',
    target: '中高齡專屬',
    description: '專為 50 歲以上設計，低衝擊、安全優先，兼顧肌力、平衡感與柔軟度，讓訓練融入日常生活。',
    people: '小班制 3-6 人',
    duration: '每堂 60 分鐘',
    note: '一期4堂',
  },
]

// 線上課程特色
const onlineFeatures = [
  '由練健康教練錄製，內容同等專業',
  '可依個人進度自主安排學習節奏',
  '居家器材即可完成，不需健身房',
  '課程內容涵蓋中高齡訓練、肌力基礎、功能性動作',
]

// 比較表資料
const comparisonData = [
  { item: '個人化程度', personal: '★★★', group: '★★', online: '★' },
  { item: '教練即時指導', personal: '✓', group: '✓', online: '—' },
  { item: '小班人數', personal: '1 人（純個人）', group: '3-6 人', online: '自主學習' },
  { item: '適合特殊族群', personal: '✓ 最適合', group: '部分課程', online: '—' },
  { item: '時間彈性', personal: '依約定排課', group: '依固定時段', online: '✓ 完全彈性' },
  { item: '需要到分店', personal: '✓', group: '✓', online: '不需要' },
  // 開始方式：各自連到對應的報名入口（to 有值即渲染成連結，http 開頭自動開新分頁）
  { item: '開始方式', personal: '預約體驗課', personalTo: '/booking', group: '報名團課', groupTo: '/group-booking', online: '線上報名', onlineTo: 'https://sat.cool/course/97' },
]

// 外部連結（http 開頭）另開分頁；站內連結維持同分頁
function isExternal(to: string) {
  return /^https?:\/\//.test(to)
}

// 比較表儲存格文字樣式（★ 橘、✓ 橘粗體、— 淡出、其餘一般）
function cellClass(v: string) {
  if (v.includes('★')) return 'text-orange text-sm'
  if (v.includes('✓')) return 'text-orange font-bold text-sm'
  if (v === '—') return 'text-white/20 text-sm'
  return 'text-white/70 text-sm'
}

const tabs = [
  { id: 'personal', label: '一對一訓練' },
  { id: 'group', label: '團體課程' },
  { id: 'online', label: '線上課程' },
]

const activeTab = ref('personal')
const isSticky = ref(false)

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const offset = 120
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

onMounted(() => {
  let ticking = false

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const heroHeight = document.getElementById('hero')?.offsetHeight || 0
        const newIsSticky = window.scrollY > heroHeight - 60

        if (isSticky.value !== newIsSticky) {
          isSticky.value = newIsSticky
        }

        const sections = ['personal', 'group', 'online']
        for (const section of sections) {
          const element = document.getElementById(section)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= 150 && rect.bottom >= 150) {
              if (activeTab.value !== section) {
                activeTab.value = section
              }
              break
            }
          }
        }

        ticking = false
      })
      ticking = true
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

const personalFeatures = [
  '物理治療師或呼吸治療師背景教練指導',
  '訓練前進行身體評估，建立安全個人課表',
  '每堂課 60 分鐘，動作示範與即時糾正',
  '定期追蹤進度，課表隨狀況調整',
  '必要時提供營養與生活習慣建議',
  '彈性排課，配合你的時間',
]
</script>

<template>
  <div class="min-h-screen bg-cream-100">
    <!-- Hero -->
    <section id="hero" class="bg-gradient-to-br from-navy-700 to-navy-800 text-white py-16 md:py-24">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-3xl md:text-5xl font-bold mb-6 font-serif">
          找到最適合你的上課方式
        </h1>
        <p class="text-cream-200 text-lg md:text-xl mb-6 max-w-3xl mx-auto leading-relaxed">
          練健康提供三種上課形式，不管你是第一次接觸重訓、希望有同伴一起練，還是想在家自主訓練，都有對應的選擇。
        </p>
        <p class="text-orange text-lg md:text-xl font-semibold mb-10">
          50歲以上首次體驗免費 · 首次體驗只要 $500
        </p>

        <!-- 快速導航按鈕 -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-3xl mx-auto">
          <button
            class="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-2xl p-6 transition-all group"
            @click="scrollToSection('personal')"
          >
            <div class="text-orange mb-2">
              <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="font-bold text-lg mb-1">一對一訓練</h3>
            <p class="text-cream-300 text-sm">最熱門 · 個人化課表</p>
          </button>

          <button
            class="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-2xl p-6 transition-all group"
            @click="scrollToSection('group')"
          >
            <div class="text-orange mb-2">
              <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="font-bold text-lg mb-1">團體課程</h3>
            <p class="text-cream-300 text-sm">小班制 · 3-6 人</p>
          </button>

          <button
            class="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-2xl p-6 transition-all group"
            @click="scrollToSection('online')"
          >
            <div class="text-orange mb-2">
              <svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="font-bold text-lg mb-1">線上課程</h3>
            <p class="text-cream-300 text-sm">不受地點限制</p>
          </button>
        </div>
      </div>
    </section>

    <!-- 粘性頁籤 -->
    <nav
      :class="[
        'bg-white border-b border-navy-700/[0.14] z-40 transition-shadow',
        isSticky ? 'sticky top-0 shadow-sm' : ''
      ]"
    >
      <div class="container mx-auto px-4">
        <div class="flex justify-center h-[52px]">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'px-4 h-full font-medium transition-all border-b-[3px]',
              activeTab === tab.id
                ? 'text-[#1a3545] border-orange font-bold'
                : 'text-[#7a7a7a] border-transparent hover:text-navy-700'
            ]"
            @click="scrollToSection(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </nav>

    <!-- 一對一訓練區 -->
    <section id="personal" class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <!-- 上半部：圖片+文字說明 -->
        <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center mb-16">
          <!-- 左側圖片 -->
          <div class="lg:w-1/2">
            <div class="rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&h=675&fit=crop&q=80"
                alt="練健康一對一訓練：專業教練指導學員進行肌力訓練"
                class="w-full h-auto"
              />
            </div>
          </div>

          <!-- 右側內容 -->
          <div class="lg:w-1/2">
            <div class="flex items-center gap-3 mb-4">
              <span class="bg-orange/10 text-orange font-semibold px-3 py-1 rounded-full text-sm">最熱門</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-navy-700 font-serif mb-4">
              一對一訓練
            </h2>
            <p class="text-ink-600 text-lg mb-6 leading-relaxed">
              由專業教練全程陪伴，根據你的身體狀況、健康目標與生活習慣，量身打造個人訓練計畫。一週一次，持續進步。
            </p>
            <p class="text-orange font-semibold mb-6">
              50歲以上首次體驗免費 · 首次體驗只要 $500
            </p>

            <!-- 特色列表 -->
            <ul class="space-y-3">
              <li v-for="feature in personalFeatures" :key="feature" class="flex items-start gap-3">
                <svg class="w-6 h-6 text-orange flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-ink-700">{{ feature }}</span>
              </li>
            </ul>

            <div class="mt-8">
              <NuxtLink
                to="/booking"
                class="inline-flex items-center gap-2 bg-orange hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-full transition-colors"
              >
                預約首次體驗
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 下半部：四種課表方向（全寬度） -->
        <div class="max-w-5xl mx-auto">
          <h3 class="text-xl font-bold text-navy-700 mb-6 text-center">四種課表方向，針對不同需求</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="course in courseDirections"
              :key="course.id"
              class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-cream-200"
            >
              <div class="flex items-start gap-4">
                <div class="text-orange flex-shrink-0">
                  <!-- Heart icon -->
                  <svg v-if="course.icon === 'heart'" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <!-- Shield icon -->
                  <svg v-else-if="course.icon === 'shield'" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <!-- Refresh icon -->
                  <svg v-else-if="course.icon === 'refresh'" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <!-- Bolt icon -->
                  <svg v-else-if="course.icon === 'bolt'" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="font-bold text-navy-700 text-lg mb-2">{{ course.title }}</h4>
                  <p class="text-ink-600 text-sm mb-3">{{ course.description }}</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in course.tags"
                      :key="tag"
                      class="text-xs bg-cream-200 text-ink-600 px-2 py-1 rounded-full"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 團體課程區 -->
    <section id="group" class="py-16 md:py-24 bg-cream-200">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <div class="flex items-center justify-center gap-3 mb-4">
            <span class="bg-orange/10 text-orange font-semibold px-3 py-1 rounded-full text-sm">小班制</span>
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-navy-700 font-serif mb-4">
            團體課程
          </h2>
          <p class="text-ink-600 max-w-2xl mx-auto leading-relaxed">
            一期4堂，與志同道合的夥伴一起訓練，互相激勵。小班制（3-6 人）確保教練能顧到每個人的動作品質。
          </p>
        </div>

        <!-- 課程卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div
            v-for="course in groupCourses"
            :key="course.id"
            class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            <span class="inline-block bg-orange/10 text-orange text-sm font-medium px-3 py-1 rounded-full mb-4">
              {{ course.target }}
            </span>
            <h3 class="text-xl font-bold text-navy-700 mb-3">{{ course.title }}</h3>
            <p class="text-ink-600 mb-6 text-sm leading-relaxed">{{ course.description }}</p>
            <div class="flex flex-col gap-2 text-sm text-ink-500 pt-4 border-t border-cream-200">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {{ course.people }}
              </span>
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ course.duration }}
              </span>
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ course.note }}
              </span>
            </div>
          </div>
        </div>

        <!-- 說明框 -->
        <div class="bg-white border border-cream-300 rounded-2xl p-6 mb-10 max-w-2xl mx-auto">
          <h4 class="font-bold text-navy-700 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            購課與請假規定
          </h4>
          <p class="text-sm text-ink-600">
            請假規定：最晚提前一週與教練告知，並順延一週。購買後不須從月初開始，彈性安排上課時間。
          </p>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/group-booking"
            class="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-bold px-8 py-4 rounded-full transition-colors"
          >
            團體課程報名
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 線上課程區 -->
    <section id="online" class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row gap-12 items-center">
          <!-- 左側影片/圖片 -->
          <div class="lg:w-1/2">
            <div class="relative rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=900&h=506&fit=crop&q=80"
                alt="練健康線上課程"
                class="w-full h-auto"
              />
              <a
                href="https://sat.cool/course/97"
                target="_blank"
                rel="noopener noreferrer"
                class="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
              >
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-8 h-8 text-orange ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </a>
            </div>
          </div>

          <!-- 右側內容 -->
          <div class="lg:w-1/2">
            <div class="flex items-center gap-3 mb-4">
              <span class="bg-orange/10 text-orange font-semibold px-3 py-1 rounded-full text-sm">不受地點限制</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-navy-700 font-serif mb-4">
              線上課程
            </h2>
            <p class="text-ink-600 text-lg mb-6 leading-relaxed">
              不方便到分店，或是想在家自主訓練？線上課程讓你在任何地點、任何時間，跟著練健康的教練動起來。
            </p>
            <p class="text-orange font-semibold mb-6">
              sat.cool 線上平台
            </p>

            <!-- 三大優勢 -->
            <div class="grid gap-4 mb-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-orange" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span class="text-ink-700">隨時隨選播放</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span class="text-ink-700">在家不受地點限制</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span class="text-ink-700">教練專業課程設計</span>
              </div>
            </div>

            <!-- 課程特色 -->
            <ul class="space-y-2 mb-8">
              <li v-for="feature in onlineFeatures" :key="feature" class="flex items-center gap-2 text-ink-700 text-sm">
                <svg class="w-5 h-5 text-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ feature }}
              </li>
            </ul>

            <div class="flex flex-col sm:flex-row gap-4">
              <a
                href="https://sat.cool/course/97"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 bg-orange hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-full transition-colors"
              >
                前往線上課程平台
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <NuxtLink
                to="/booking"
                class="inline-flex items-center justify-center gap-2 border-2 border-navy-700 text-navy-700 hover:bg-navy-700 hover:text-white font-bold px-8 py-4 rounded-full transition-colors"
              >
                想嘗試一對一？
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 比較表 -->
    <section id="compare" class="py-16 md:py-24 bg-[#1a3545] text-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center font-serif mb-4">
          怎麼選？三種上課形式<span class="text-orange">快速比較</span>
        </h2>
        <p class="text-center text-cream-200 mb-12 max-w-2xl mx-auto">
          不確定適合哪一種？先來一堂體驗課，教練會評估你的狀況再建議最適合的方式。
        </p>

        <div class="overflow-x-auto">
          <div class="bg-white/5 rounded-[14px] max-w-4xl mx-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-white/[0.08]">
                  <th class="py-4 px-4 text-left text-[0.78rem] font-semibold text-white/60 tracking-wide border-b border-white/[0.08]"></th>
                  <th class="py-4 px-4 text-center text-[0.78rem] font-semibold text-white/60 tracking-wide border-b border-white/[0.08]">一對一訓練</th>
                  <th class="py-4 px-4 text-center text-[0.78rem] font-semibold text-white/60 tracking-wide border-b border-white/[0.08]">團體課程</th>
                  <th class="py-4 px-4 text-center text-[0.78rem] font-semibold text-white/60 tracking-wide border-b border-white/[0.08]">線上課程</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in comparisonData"
                  :key="row.item"
                  :class="index !== comparisonData.length - 1 ? 'border-b border-white/[0.06]' : ''"
                >
                  <td class="py-4 px-4 text-white/70 text-left text-sm">{{ row.item }}</td>
                  <td class="py-4 px-4 text-center bg-orange/[0.08]">
                    <NuxtLink
                      v-if="row.personalTo"
                      :to="row.personalTo"
                      :target="isExternal(row.personalTo) ? '_blank' : undefined"
                      :class="[cellClass(row.personal), 'underline underline-offset-4 decoration-orange/50 hover:text-orange-300 transition-colors']"
                    >{{ row.personal }}</NuxtLink>
                    <span v-else :class="cellClass(row.personal)">{{ row.personal }}</span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <NuxtLink
                      v-if="row.groupTo"
                      :to="row.groupTo"
                      :target="isExternal(row.groupTo) ? '_blank' : undefined"
                      :class="[cellClass(row.group), 'underline underline-offset-4 decoration-orange/50 hover:text-orange-300 transition-colors']"
                    >{{ row.group }}</NuxtLink>
                    <span v-else :class="cellClass(row.group)">{{ row.group }}</span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <NuxtLink
                      v-if="row.onlineTo"
                      :to="row.onlineTo"
                      :target="isExternal(row.onlineTo) ? '_blank' : undefined"
                      :class="[cellClass(row.online), 'underline underline-offset-4 decoration-orange/50 hover:text-orange-300 transition-colors']"
                    >{{ row.online }}</NuxtLink>
                    <span v-else :class="cellClass(row.online)">{{ row.online }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>

    <!-- 手機版 CTA 已在 MobileBookingButton 處理，此處移除重複 -->
    <!-- 為手機版粘性 CTA 預留空間 -->
    <div class="h-20 md:hidden" />
  </div>
</template>
