<script setup lang="ts">
useHead({
  title: '分店地點｜練健康 LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '練健康在大台北地區有 4 間分店，七張、南京、松江、西門，每間都鄰近捷運站。第一堂體驗課，50歲以上免費。'
    }
  ]
})

// 分店資料：由後台分店管理（Firestore /api/public/stores）驅動；抓不到時用 fallback，頁面永不空白。
// 註：mrt 敘述在 DB 沒有欄位，以 slug 對應由 useStoreDefaults 補上。
// 門市實景照：DB 沒有這個欄位，以 slug 對應由程式提供
const STORE_PHOTOS: Record<string, string> = {
  xindian: '/images/locations/xindian.webp',
  nanjing: '/images/locations/nanjing.webp',
  songjiang: '/images/locations/songjiang.webp',
  ximending: '/images/locations/ximending.webp',
}

const FALLBACK_STORES = [
  { id: 'xindian', photo: STORE_PHOTOS.xindian, name: '七張店', district: '新北市新店區', address: '新北市新店區北新路二段 252 號 B1-2', mrt: '鄰近捷運七張站' },
  { id: 'nanjing', photo: STORE_PHOTOS.nanjing, name: '南京店', district: '台北市中山區', address: '台北市中山區南京東路三段 29 號 B1', mrt: '鄰近捷運松江南京站' },
  { id: 'songjiang', photo: STORE_PHOTOS.songjiang, name: '松江店', district: '台北市中山區', address: '台北市中山區松江路 122 號 B1', mrt: '鄰近捷運松江南京站' },
  { id: 'ximending', photo: STORE_PHOTOS.ximending, name: '西門店', district: '台北市中正區', address: '台北市中正區寶慶路 39 號', mrt: '鄰近捷運西門站' },
]

const { getStoreDefaults } = useStoreDefaults()

// 非阻塞載入：先渲染 fallback（SSR 不卡、無白屏），抓到後台資料後即更新
const { data: storeRes } = useLazyFetch<{ data?: any[] }>('/api/public/stores', { key: 'public-stores-overview' })

const stores = computed(() => {
  const list = storeRes.value?.data
  if (!Array.isArray(list) || list.length === 0) return FALLBACK_STORES
  return list.map((s: any) => ({
    id: s.slug || s.id,
    name: s.name,
    district: `${s.city || ''}${s.district || ''}`,
    address: `${s.city || ''}${s.district || ''}${s.address || ''}`,
    mrt: toNearestMrt(getStoreDefaults(s.slug)?.description),
    photo: STORE_PHOTOS[s.slug] || '',
  }))
})

// Hero 三個賣點膠囊，樣式比照上方「全台 N 間分店」標籤
const heroTags = ['鄰近捷運站', '專業教練帶領', '中高齡及特殊族群']

const stats = [
  { num: '4', label: '間分店' },
  { num: '10,000+', label: '服務學員' },
  { num: '8 年', label: '深耕中高齡' },
]

const reasons = [
  {
    iconType: 'transit',
    title: '鄰近捷運站',
    desc: '所有分店都在捷運站步行範圍內，不管刮風下雨都能輕鬆抵達。',
  },
  {
    iconType: 'senior',
    title: '專為中高齡設計',
    desc: '70% 學員都是 50 歲以上，環境安靜、不擁擠、沒有壓力。',
  },
  {
    iconType: 'free',
    title: '第一堂體驗課 50歲以上免費',
    desc: '不是試課，是真正完整的 60 分鐘體驗課，讓我們先了解你。',
  },
]
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero Section -->
    <section class="relative bg-navy pt-16 overflow-hidden">
      <div class="absolute inset-0">
        <!--
          分店實景底圖。brightness(.4) + opacity-60 疊在 bg-navy 上是量測後選定的：
          文字區域最亮 5% 的相對亮度 L=0.077，與原本純 navy 的 0.075 幾乎相同，
          因此 Hero 上白字（8.3:1）與 orange-300（4.9:1）的對比都維持不變。
          若不壓暗、只調 opacity，白字會掉到 2.97:1、orange-300 掉到 1.76:1，
          完全看不清楚——所以 brightness 這層是必要的，不能省。

          brightness 寫成 inline style 是為了讓數值直接出現在產出的 HTML 裡、
          好驗證；Tailwind 的 [filter:brightness(0.4)] 同樣可用（實測會編譯成
          .\[filter\:brightness\(0\.4\)\]{filter:brightness(.4)}），兩種都行。
          ⚠️ 查證 Nuxt 有沒有產出某條 CSS 時，別只 grep _nuxt/*.css——critical CSS
             會被內嵌進 HTML 的 <style>，只看 .css 檔會誤判成「沒編譯」。
        -->
        <img
          src="/images/locations/overview.webp"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover opacity-60"
          style="filter: brightness(0.4)"
        />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(251,114,10,0.10)_0%,transparent_55%),radial-gradient(circle_at_5%_75%,rgba(58,106,133,0.3)_0%,transparent_45%)]" />
      </div>

      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24 text-center">
        <div class="inline-flex items-center gap-2 bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5">
          全台 {{ stores.length }} 間分店
        </div>

        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
          找到離你最近的<span class="text-orange">練健康</span>
        </h1>

        <div class="flex flex-wrap items-center justify-center gap-2 mb-8">
          <span
            v-for="tag in heroTags"
            :key="tag"
            class="inline-flex items-center bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full"
          >
            {{ tag }}
          </span>
        </div>

        <div class="flex items-center justify-center gap-2 text-sm text-white/40">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span><strong class="text-orange-300">第一堂體驗課，50歲以上免費</strong>・未滿50歲 $500・不強迫買課</span>
        </div>
      </div>
    </section>

    <!-- Stats Bar -->
    <div class="bg-white border-b border-navy/15">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-3 divide-x divide-navy/15">
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
            v-for="store in stores"
            :key="store.id"
            :to="`/locations/${store.id}`"
            class="group bg-white rounded-2xl overflow-hidden border border-navy/15 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <!-- Store image placeholder -->
            <div class="aspect-video bg-gradient-to-br from-navy to-navy/80 relative overflow-hidden">
              <img
                v-if="store.photo"
                :src="store.photo"
                :alt="`練健康${store.name} 門市環境`"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <span class="font-serif text-5xl font-black text-white/20">{{ store.name.charAt(0) }}</span>
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

              <!-- CTA -->
              <div class="flex items-center justify-end pt-4 border-t border-navy/10">
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
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-2">
            <span class="w-5 h-0.5 bg-orange-700" />
            為什麼選擇練健康
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            每一間店都是<span class="text-orange">同樣的堅持</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="reason in reasons" :key="reason.title" class="bg-white rounded-2xl p-6 border border-navy/15 shadow-sm">
            <div class="mb-4">
              <!-- Transit Icon -->
              <svg v-if="reason.iconType === 'transit'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Cases Section -->
    <section id="cases" class="bg-white py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto bg-cream rounded-2xl border border-navy/10 shadow-sm overflow-hidden">
          <div class="grid lg:grid-cols-2">
            <!-- Left: Text -->
            <div class="p-8 lg:p-10 flex flex-col justify-center">
              <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
                <span class="w-5 h-0.5 bg-orange-700" />
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
                <div class="font-serif text-3xl lg:text-4xl font-black text-orange">10,000+</div>
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
          立即預約體驗，由我們的專業教練帶領你開始第一步。
        </p>
        <NuxtLink
          to="/booking"
          class="inline-flex items-center gap-2 bg-white text-orange font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          立即預約體驗 →
        </NuxtLink>
        <div class="mt-4 text-white/60 text-sm">
          第一堂體驗課 50歲以上免費・不強迫買課
        </div>
      </div>
    </section>
  </div>
</template>
