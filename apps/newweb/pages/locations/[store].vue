<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const storeSlug = route.params.store as string

// Fetch store data from API
const { data: storeResponse, error: storeError } = await useFetch<{
  success: boolean
  data: {
    id: string
    name: string
    slug: string
    city?: string
    district?: string
    address?: string
    phone?: string
    googleMapUrl?: string
    businessHours?: any
    transportation?: any
    heroImage?: string
    galleryImages?: string[]
    coaches: {
      id: string
      name: string
      slug?: string
      photo?: string
      roleTitle?: string
      specialties?: string[]
      certifications?: string[]
      education?: string[]
      experiences?: string[]
      description?: string
    }[]
  }
}>(`/api/public/stores/${storeSlug}`)

// Handle error
if (storeError.value || !storeResponse.value?.success) {
  throw createError({
    statusCode: 404,
    statusMessage: '找不到此分店'
  })
}

const store = computed(() => storeResponse.value?.data)
const coaches = computed(() => store.value?.coaches || [])

// 分店硬編碼資料（用於補充 API 沒有的資料，如電話格式、交通資訊等）
const storeExtraData: Record<string, any> = {
  'xindian': {
    phoneRaw: '+886289146428',
    description: '新北市新店區唯一專注中高齡與特殊族群的肌力訓練中心，由物理治療師背景教練帶領，捷運七張站步行 3 分鐘。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '新店七張站 1 號出口', desc: '出站後沿北新路方向直行，約步行 3 分鐘，大樓入口在便利商店旁，下樓梯至 B1-2。' },
      bus: { stop: '七張站', desc: '849、綠12、綠14、橘12 等路線均可抵達，下車後步行 2 分鐘。' },
      car: { desc: '沿北新路往新店方向，過七張路口後即可見到，大樓地下室入口在右側。' },
      parking: { desc: '七張捷運站旁有公共停車場（收費），或北新路沿線路邊停車格。地下室停車空間有限，請提前確認。' },
    },
    geo: { lat: 24.9682, lng: 121.5396 },
  },
  'nanjing': {
    phoneRaw: '+886225074196',
    description: '位於台北市中心南京復興商圈，捷運南京復興站步行 3 分鐘。專為中高齡及特殊族群設計的肌力訓練中心。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '南京復興站 2 號出口', desc: '出站後沿南京東路三段方向步行約 3 分鐘。' },
      bus: { stop: '南京復興站', desc: '多條公車路線可達。' },
      car: { desc: '南京東路三段，近南京復興捷運站。' },
      parking: { desc: '附近有公共停車場，或路邊停車格。' },
    },
    geo: { lat: 25.0522, lng: 121.5443 },
  },
  'songjiang': {
    phoneRaw: '+886225371055',
    description: '位於台北市松江路商圈，捷運松江南京站步行 5 分鐘。專業物理治療師教練團隊。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '松江南京站 4 號出口', desc: '出站後沿松江路方向步行約 5 分鐘。' },
      bus: { stop: '松江南京站', desc: '多條公車路線可達。' },
      car: { desc: '松江路，近松江南京捷運站。' },
      parking: { desc: '附近有公共停車場。' },
    },
    geo: { lat: 25.0531, lng: 121.5332 },
  },
  'ximending': {
    phoneRaw: '+886223703245',
    description: '位於西門町商圈，捷運西門站步行 3 分鐘。鄰近交通便利，適合各年齡層。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '西門站 6 號出口', desc: '出站後沿寶慶路方向步行約 3 分鐘。' },
      bus: { stop: '西門站', desc: '多條公車路線可達。' },
      car: { desc: '寶慶路，近西門捷運站。' },
      parking: { desc: '附近有多處公共停車場。' },
    },
    geo: { lat: 25.0423, lng: 121.5069 },
  },
}

// 合併 API 資料與本地補充資料
const extraData = computed(() => storeExtraData[storeSlug] || {})
const storeDescription = computed(() => extraData.value?.description || store.value?.name + ' 專業訓練中心')
const phoneRaw = computed(() => extraData.value?.phoneRaw || store.value?.phone?.replace(/[^0-9+]/g, '') || '')
const businessHours = computed(() => {
  if (store.value?.businessHours && typeof store.value.businessHours === 'object') {
    return store.value.businessHours
  }
  return extraData.value?.businessHours || {
    weekday: '09:00 – 21:00',
    saturday: '09:00 – 18:00',
    sunday: '公休',
    holiday: '依公告，請來電確認',
  }
})
const transport = computed(() => {
  if (store.value?.transportation && typeof store.value.transportation === 'object') {
    return store.value.transportation
  }
  return extraData.value?.transport || {
    mrt: { station: '請來電洽詢', desc: '' },
    bus: { stop: '請來電洽詢', desc: '' },
    car: { desc: '請來電洽詢' },
    parking: { desc: '請來電洽詢' },
  }
})
// 從 googleMapUrl 提取座標（支援多種 Google Maps URL 格式）
const geo = computed(() => {
  const url = store.value?.googleMapUrl
  if (url) {
    // 嘗試從 URL 中提取座標（格式: @lat,lng 或 q=lat,lng）
    const coordsMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) ||
                        url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (coordsMatch) {
      return { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) }
    }
  }
  // 備用：使用本地資料或預設值
  return extraData.value?.geo || { lat: 25.0330, lng: 121.5654 }
})

// 生成地圖嵌入 URL
const mapEmbedUrl = computed(() => {
  // 優先使用座標
  if (geo.value.lat && geo.value.lng) {
    return `https://www.google.com/maps?q=${geo.value.lat},${geo.value.lng}&z=16&output=embed`
  }
  // 備用：使用地址搜尋
  const address = `${store.value?.city || ''}${store.value?.district || ''}${store.value?.address || ''}`
  if (address) {
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`
  }
  // 最後備用
  return 'https://www.google.com/maps?q=25.0330,121.5654&z=16&output=embed'
})

// Fetch other stores for navigation
const { data: storesResponse } = await useFetch<{ success: boolean; data: any[] }>('/api/public/stores')
const otherStores = computed(() => {
  if (!storesResponse.value?.success) return []
  return storesResponse.value.data.filter((s: any) => s.slug !== storeSlug)
})

useHead({
  title: `練健康${store.value?.name}｜${store.value?.city || ''}${store.value?.district || ''}中高齡肌力訓練`,
  meta: [
    {
      name: 'description',
      content: `練健康${store.value?.name}，位於${store.value?.city || ''}${store.value?.district || ''}${store.value?.address || ''}。專業物理治療師背景教練，50歲以上首次體驗完全免費。`
    }
  ]
})

// 分店照片
const photos = computed(() => {
  const galleryImages = store.value?.galleryImages || []
  if (galleryImages.length > 0) {
    return galleryImages.slice(0, 5).map((img: string, index: number) => ({
      label: index === 0 ? '主訓練區' : `環境照片 ${index}`,
      span: index === 0,
      image: img,
    }))
  }
  // 預設照片
  return [
    { label: '主訓練區', span: true, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop&q=80' },
    { label: '一對一訓練空間', span: false, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=450&fit=crop&q=80' },
    { label: '專業器材區', span: false, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=450&fit=crop&q=80' },
    { label: '功能性訓練區', span: false, image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=450&fit=crop&q=80' },
    { label: '舒適休息區', span: false, image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&h=450&fit=crop&q=80' },
  ]
})
</script>

<template>
  <div v-if="store" class="min-h-screen bg-cream-100">
    <!-- Hero Section -->
    <section class="relative bg-navy-700 pt-16 overflow-hidden min-h-[68vh] flex items-center">
      <!-- Background effects -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(251,114,10,0.10)_0%,transparent_50%),radial-gradient(circle_at_5%_75%,rgba(42,82,105,0.5)_0%,transparent_45%)]" />
        <div
          class="absolute inset-0 opacity-[0.022]"
          :style="{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }"
        />
      </div>

      <div class="container mx-auto px-4 relative z-10 py-12 lg:py-20">
        <div class="max-w-2xl">
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-1.5 text-xs text-white/35 mb-5">
            <NuxtLink to="/" class="hover:text-white/70 transition-colors">練健康</NuxtLink>
            <span class="text-white/20">›</span>
            <NuxtLink to="/locations" class="hover:text-white/70 transition-colors">分店地點</NuxtLink>
            <span class="text-white/20">›</span>
            <span>{{ store.name }}</span>
          </nav>

          <!-- District badge -->
          <div class="inline-flex items-center gap-2 bg-orange/15 border border-orange/30 text-orange text-xs font-medium px-3 py-1 rounded-full mb-4 tracking-wide">
            <span class="w-1.5 h-1.5 bg-orange rounded-full" />
            {{ store.city }}{{ store.district }}
          </div>

          <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            練健康<span class="text-orange">{{ store.name }}</span><br />
            中高齡肌力訓練
          </h1>

          <p class="text-white/65 text-lg font-light leading-relaxed mb-8 max-w-lg">
            {{ storeDescription }}
          </p>

          <div class="flex gap-3 flex-wrap">
            <NuxtLink
              to="/booking"
              class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
            >
              立即預約體驗 →
            </NuxtLink>
            <a
              v-if="phoneRaw"
              :href="`tel:${phoneRaw}`"
              class="inline-flex items-center gap-2 bg-white/[0.08] text-white px-6 py-3 rounded-full border border-white/20 hover:bg-white/15 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 011 1.18 2 2 0 013 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
              </svg>
              直接來電
            </a>
          </div>

          <div class="flex items-center gap-2 mt-4 text-sm text-white/45">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span><strong class="text-orange">50歲以上完全免費</strong>・一般首次體驗 $500</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Access Section -->
    <section class="bg-white py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          交通指引
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-8">
          怎麼<span class="text-orange">找到我們</span>
        </h2>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          <!-- Google Maps Embed -->
          <div class="aspect-[4/3] bg-cream-100 rounded-2xl shadow-lg overflow-hidden relative">
            <iframe
              :src="mapEmbedUrl"
              width="100%"
              height="100%"
              style="border: 0"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              :title="`${store.name} 地圖`"
              class="absolute inset-0"
            />
            <a
              v-if="store.googleMapUrl"
              :href="store.googleMapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm text-navy-700 font-medium text-sm px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              在 Google Maps 開啟
            </a>
          </div>

          <!-- Transport info -->
          <div>
            <div class="space-y-3">
              <div class="flex gap-3 items-start p-4 bg-cream-100 rounded-xl border border-navy-700/15">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-green-600 text-white flex-shrink-0 mt-0.5">捷運</span>
                <div class="text-sm text-ink/70 leading-relaxed">
                  <strong class="text-navy-700">{{ transport.mrt?.station || '請來電洽詢' }}</strong><br />
                  {{ transport.mrt?.desc || '' }}
                </div>
              </div>

              <div class="flex gap-3 items-start p-4 bg-cream-100 rounded-xl border border-navy-700/15">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-orange text-white flex-shrink-0 mt-0.5">公車</span>
                <div class="text-sm text-ink/70 leading-relaxed">
                  <strong class="text-navy-700">{{ transport.bus?.stop || '請來電洽詢' }}</strong><br />
                  {{ transport.bus?.desc || '' }}
                </div>
              </div>

              <div class="flex gap-3 items-start p-4 bg-cream-100 rounded-xl border border-navy-700/15">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-navy-700 text-white flex-shrink-0 mt-0.5">開車</span>
                <div class="text-sm text-ink/70 leading-relaxed">
                  <strong class="text-navy-700">{{ store.city }}{{ store.district }}{{ store.address }}</strong><br />
                  {{ transport.car?.desc || '' }}
                </div>
              </div>

              <div class="flex gap-3 items-start p-4 bg-cream-100 rounded-xl border border-navy-700/15">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-ink/50 text-white flex-shrink-0 mt-0.5">停車</span>
                <div class="text-sm text-ink/70 leading-relaxed">
                  <strong class="text-navy-700">建議使用附近公共停車場</strong><br />
                  {{ transport.parking?.desc || '' }}
                </div>
              </div>
            </div>

            <!-- Hours table -->
            <div class="mt-6 border border-navy-700/15 rounded-xl overflow-hidden">
              <div class="grid grid-cols-2">
                <div class="px-4 py-3 text-sm font-medium text-navy-700 bg-cream-100">週一 – 週五</div>
                <div class="px-4 py-3 text-sm text-ink/70">{{ businessHours.weekday }}</div>
              </div>
              <div class="grid grid-cols-2 border-t border-navy-700/15">
                <div class="px-4 py-3 text-sm font-medium text-navy-700 bg-cream-100">週六</div>
                <div class="px-4 py-3 text-sm text-ink/70">{{ businessHours.saturday }}</div>
              </div>
              <div class="grid grid-cols-2 border-t border-navy-700/15">
                <div class="px-4 py-3 text-sm font-medium text-navy-700 bg-cream-100">週日</div>
                <div class="px-4 py-3 text-sm text-ink/70">{{ businessHours.sunday }}</div>
              </div>
              <div class="grid grid-cols-2 border-t border-navy-700/15">
                <div class="px-4 py-3 text-sm font-medium text-navy-700 bg-cream-100">國定假日</div>
                <div class="px-4 py-3 text-sm text-ink/70">{{ businessHours.holiday || '依公告，請來電確認' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Coaches Section -->
    <section v-if="coaches.length > 0" class="bg-cream-100 py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
              <span class="w-5 h-0.5 bg-orange" />
              本店教練
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">
              認識<span class="text-orange">你的教練</span>
            </h2>
            <p class="text-ink/60 leading-relaxed max-w-xl">
              每位教練都有醫療或專業運動科學背景，我們相信讓你在第一次見面前就認識教練，是降低陌生感最好的方式。
            </p>
          </div>
        </div>

        <!-- Coach Carousel -->
        <CoachCarousel :coaches="coaches" />
      </div>
    </section>

    <!-- Photos Section -->
    <section class="bg-white py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          分店環境
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">
          來之前<span class="text-orange">先看看</span>
        </h2>
        <p class="text-ink/60 leading-relaxed mb-8 max-w-xl">
          專業的訓練空間，安靜、不擁擠，沒有一般健身房的喧鬧。教練和學員的比例讓每個人都能得到充分的關注。
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            v-for="photo in photos"
            :key="photo.label"
            :class="[
              'aspect-[4/3] rounded-xl overflow-hidden relative group',
              photo.span ? 'md:col-span-2 md:aspect-video' : ''
            ]"
          >
            <img
              :src="photo.image"
              :alt="photo.label"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-navy-700/70 via-transparent to-transparent" />
            <span class="absolute bottom-4 left-4 text-sm font-medium text-white">
              {{ photo.label }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-navy-700 py-16 lg:py-20 text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
          {{ store.name }}，等你來
        </h2>
        <p class="text-white/70 mb-8">
          從捷運站走過來只要幾分鐘，第一堂 50 歲以上完全免費。
        </p>
        <NuxtLink
          to="/booking"
          class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          立即預約體驗 →
        </NuxtLink>
        <div v-if="store.phone" class="mt-4 text-white/50 text-sm">
          或直接來電：<a :href="`tel:${phoneRaw}`" class="text-white font-medium hover:text-orange transition-colors">{{ store.phone }}</a>
        </div>
      </div>
    </section>

    <!-- Other Stores Section -->
    <section v-if="otherStores.length > 0" class="bg-orange py-10 lg:py-12 text-center">
      <div class="container mx-auto px-4">
        <h3 class="font-serif text-xl lg:text-2xl font-bold text-white mb-2">
          其他分店選擇
        </h3>
        <p class="text-white/80 text-sm mb-6">
          若{{ store.name }}不方便，歡迎參考其他分店
        </p>

        <!-- Other stores grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
          <NuxtLink
            v-for="otherStore in otherStores"
            :key="otherStore.id"
            :to="`/locations/${otherStore.slug}`"
            class="group bg-white rounded-xl px-5 py-4 text-left shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-serif text-base font-bold text-navy-700 group-hover:text-orange transition-colors">
                  {{ otherStore.name }}
                </h4>
                <p class="text-xs text-ink/50">{{ otherStore.city }}{{ otherStore.district }}</p>
              </div>
              <span class="w-6 h-6 rounded-full bg-orange/10 flex items-center justify-center text-orange group-hover:bg-orange group-hover:text-white transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
