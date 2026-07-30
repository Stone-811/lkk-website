<script setup lang="ts">
useHead({
  title: '分店地點｜練健康 LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '練健康在大台北地區有 4 間分店，新店七張、南京、松江、西門，每間都鄰近捷運站。50歲以上首次體驗完全免費。'
    }
  ]
})

// 分店資料
const stores = [
  {
    id: 'xindian',
    name: '七張店',
    district: '新北市新店區',
    address: '新北市新店區北新路二段 252 號 B1-2',
    phone: '(02) 8914-6428',
    mrt: '捷運七張站 步行3分鐘',
    features: ['一對一訓練', '寬敞空間'],
    coachCount: 10,
  },
  {
    id: 'nanjing',
    name: '南京店',
    district: '台北市中山區',
    address: '台北市中山區南京東路三段 29 號 B1',
    phone: '(02) 2507-4196',
    mrt: '捷運南京復興站 步行3分鐘',
    features: ['一對一訓練', '團體課程'],
    coachCount: 14,
  },
  {
    id: 'songjiang',
    name: '松江店',
    district: '台北市中山區',
    address: '台北市中山區松江路 122 號 B1',
    phone: '(02) 2537-1055',
    mrt: '捷運松江南京站 步行5分鐘',
    features: ['一對一訓練'],
    coachCount: 5,
  },
  {
    id: 'ximending',
    name: '西門店',
    district: '台北市中正區',
    address: '台北市中正區寶慶路 39 號',
    phone: '(02) 2370-3245',
    mrt: '捷運西門站 步行3分鐘',
    features: ['一對一訓練', '團體課程'],
    coachCount: 14,
  },
]

const stats = [
  { num: '4', label: '間分店' },
  { num: '1,000+', label: '服務學員' },
  { num: '7 年', label: '深耕中高齡' },
  { num: '100%', label: '鄰近捷運' },
]

const reasons = [
  {
    iconType: 'medical',
    title: '物理治療師背景',
    desc: '每間分店都有物理治療師或運動科學專業教練，安全是最高原則。',
  },
  {
    iconType: 'transit',
    title: '捷運三分鐘可達',
    desc: '所有分店都在捷運站步行範圍內，不管刮風下雨都能輕鬆抵達。',
  },
  {
    iconType: 'senior',
    title: '專為中高齡設計',
    desc: '70% 學員都是 50 歲以上，環境安靜、不擁擠、沒有壓力。',
  },
  {
    iconType: 'free',
    title: '50歲以上免費體驗',
    desc: '不是試課，是真正完整的 60-75 分鐘體驗課，讓我們先了解你。',
  },
]
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero Section -->
    <section class="relative bg-navy pt-16 overflow-hidden">
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(251,114,10,0.10)_0%,transparent_55%),radial-gradient(circle_at_5%_75%,rgba(58,106,133,0.3)_0%,transparent_45%)]" />
        <div
          class="absolute inset-0 opacity-[0.022]"
          :style="{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }"
        />
      </div>

      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24 text-center">
        <div class="inline-flex items-center gap-2 bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5">
          <span class="w-2 h-2 bg-orange rounded-full" />
          全台 {{ stores.length }} 間分店
        </div>

        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
          找到離你最近的<span class="text-orange">練健康</span>
        </h1>

        <p class="text-white/60 text-lg font-light leading-relaxed mb-8 max-w-xl mx-auto">
          每間分店都鄰近捷運站，由物理治療師背景教練帶領，專為中高齡及特殊族群打造的訓練環境。
        </p>

        <div class="flex items-center justify-center gap-2 text-sm text-white/40">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span><strong class="text-orange-300">50歲以上免費</strong>・一般首次 $500・不強迫買課</span>
        </div>
      </div>
    </section>

    <!-- Stats Bar -->
    <div class="bg-white border-b border-navy/15">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 divide-x divide-navy/15">
          <div v-for="stat in stats" :key="stat.label" class="py-5 text-center">
            <div class="font-serif text-2xl lg:text-3xl font-black text-navy">{{ stat.num }}</div>
            <div class="text-xs text-ink/50 mt-0.5">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stores Grid -->
    <section class="py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NuxtLink
            v-for="(store, index) in stores"
            :key="store.id"
            :to="`/locations/${store.id}`"
            class="group bg-white rounded-2xl overflow-hidden border border-navy/15 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <!-- Store image placeholder -->
            <div class="aspect-video bg-gradient-to-br from-navy to-navy/80 relative">
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="font-serif text-5xl font-black text-white/20">{{ store.name.charAt(0) }}</span>
              </div>
              <!-- Number badge -->
              <div class="absolute top-4 left-4 w-8 h-8 rounded-full bg-orange flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {{ index + 1 }}
              </div>
              <!-- District badge -->
              <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-medium text-navy px-3 py-1 rounded-full">
                {{ store.district }}
              </div>
            </div>

            <!-- Store info -->
            <div class="p-5">
              <h2 class="font-serif text-xl font-black text-navy mb-2 group-hover:text-orange transition-colors">
                {{ store.name }}
              </h2>

              <div class="space-y-2 mb-4">
                <div class="flex items-start gap-2 text-sm text-ink/60">
                  <svg class="w-4 h-4 text-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ store.address }}</span>
                </div>
                <div class="flex items-start gap-2 text-sm text-ink/60">
                  <svg class="w-4 h-4 text-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ store.mrt }}</span>
                </div>
              </div>

              <!-- Features -->
              <div class="flex flex-wrap gap-1.5 mb-4">
                <span
                  v-for="feature in store.features"
                  :key="feature"
                  class="text-xs font-medium text-navy bg-navy/[0.08] px-2.5 py-0.5 rounded-full"
                >
                  {{ feature }}
                </span>
              </div>

              <!-- Phone & CTA -->
              <div class="flex items-center justify-between pt-4 border-t border-navy/10">
                <span class="text-orange font-semibold">{{ store.phone }}</span>
                <span class="text-sm text-navy font-medium group-hover:text-orange transition-colors">
                  查看詳情 →
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Why Choose Section -->
    <section class="bg-cream py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <div class="text-center mb-10">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
            <span class="w-5 h-0.5 bg-orange" />
            為什麼選擇練健康
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            每一間店都是<span class="text-orange">同樣的堅持</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="reason in reasons" :key="reason.title" class="bg-white rounded-2xl p-6 border border-navy/15 shadow-sm">
            <div class="mb-4">
              <!-- Medical Icon -->
              <svg v-if="reason.iconType === 'medical'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <!-- Transit Icon -->
              <svg v-else-if="reason.iconType === 'transit'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-4 8V7m-4 12h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <!-- Senior Icon -->
              <svg v-else-if="reason.iconType === 'senior'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <!-- Free Icon -->
              <svg v-else-if="reason.iconType === 'free'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="font-bold text-navy mb-2">{{ reason.title }}</h3>
            <p class="text-sm text-ink/60 leading-relaxed">{{ reason.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Other Stores Section -->
    <section id="other-stores" class="bg-navy py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="text-center mb-10">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
            <span class="w-5 h-0.5 bg-orange" />
            全台分店
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-white">
            其他<span class="text-orange">分店據點</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <NuxtLink
            v-for="(store, index) in stores.filter((_, i) => i > 0)"
            :key="store.id"
            :to="`/locations/${store.id}`"
            class="group bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-orange/30 rounded-xl p-5 transition-all"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-orange font-bold flex-shrink-0">
                {{ index + 2 }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-serif text-lg font-bold text-white group-hover:text-orange transition-colors mb-1">
                  {{ store.name }}
                </h3>
                <p class="text-white/50 text-sm truncate">{{ store.address }}</p>
                <span class="inline-flex items-center gap-1 text-orange text-sm mt-2 group-hover:gap-2 transition-all">
                  查看詳情
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Cases Section -->
    <section id="cases" class="bg-white py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto bg-cream rounded-2xl border border-navy/10 shadow-sm overflow-hidden">
          <div class="grid lg:grid-cols-2">
            <!-- Left: Text -->
            <div class="p-8 lg:p-10 flex flex-col justify-center">
              <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
                <span class="w-5 h-0.5 bg-orange" />
                成果見證
              </div>
              <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-4">
                他們都在這裡<br /><span class="text-orange">找回健康</span>
              </h2>
              <p class="text-ink/60 leading-relaxed mb-6">
                從 50 歲到 90 歲，從術後復健到慢性病改善——每一位學員都是我們最驕傲的成果。
              </p>
              <a
                href="https://l-kk.tw/category/%e6%a1%88%e4%be%8b%e5%88%86%e4%ba%ab/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-orange font-semibold hover:gap-3 transition-all"
              >
                查看所有學員案例
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            <!-- Right: Stats -->
            <div class="bg-navy/[0.03] p-8 lg:p-10 flex flex-col justify-center gap-4">
              <div class="bg-white rounded-xl p-5 border border-navy/10">
                <div class="font-serif text-3xl lg:text-4xl font-black text-orange">1,000+</div>
                <div class="text-ink/60 text-sm mt-1">服務學員</div>
              </div>
              <div class="bg-white rounded-xl p-5 border border-navy/10">
                <div class="font-serif text-3xl lg:text-4xl font-black text-orange">70%</div>
                <div class="text-ink/60 text-sm mt-1">學員為 50 歲以上</div>
              </div>
              <div class="bg-white rounded-xl p-5 border border-navy/10">
                <div class="font-serif text-3xl lg:text-4xl font-black text-orange">7+ 年</div>
                <div class="text-ink/60 text-sm mt-1">深耕中高齡訓練</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-orange py-16 lg:py-20 text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
          找到離你最近的分店了嗎？
        </h2>
        <p class="text-white/80 mb-8 max-w-md mx-auto">
          立即預約免費體驗，由我們的專業教練帶領你開始第一步。
        </p>
        <NuxtLink
          to="/booking"
          class="inline-flex items-center gap-2 bg-white text-orange font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          立即預約體驗 →
        </NuxtLink>
        <div class="mt-4 text-white/60 text-sm">
          50歲以上完全免費・不強迫買課
        </div>
      </div>
    </section>
  </div>
</template>
