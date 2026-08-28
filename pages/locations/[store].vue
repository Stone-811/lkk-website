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

// 分店營業時間／交通／地圖來自 composables/useStoreDefaults.ts（全站唯一來源）
const { getStoreDefaults } = useStoreDefaults()
const extraData = computed(() => getStoreDefaults(storeSlug) || {})
// Google Maps 連結：優先用程式碼裡的真連結（Firestore 部分分店存的是佔位字串）
const mapLink = computed(() => extraData.value?.googleMapUrl || store.value?.googleMapUrl || '')
const storeDescription = computed(() => toNearestMrt(extraData.value?.description) || store.value?.name + ' 專業訓練中心')
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
  // 正常 Google 地圖嵌入：優先用分店精確座標（顯示地點＋圖釘）
  if (geo.value.lat && geo.value.lng) {
    return `https://www.google.com/maps?q=${geo.value.lat},${geo.value.lng}&z=17&output=embed`
  }
  const address = `${store.value?.city || ''}${store.value?.district || ''}${store.value?.address || ''}`.trim()
  if (address) {
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=17&output=embed`
  }
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
      content: `練健康${store.value?.name}，位於${store.value?.city || ''}${store.value?.district || ''}${store.value?.address || ''}。專業物理治療師背景教練，第一堂體驗課，50歲以上免費。`
    }
  ]
})

// 分店照片。順序與後台「分店環境照片」的 env1~env6 欄位一一對應。
// 這些字串只當 alt 用（照片上的區域標籤已於 2026-08 移除），改欄位標籤時要一起改
// pages/admin/stores/[id].vue 的 imageCategories，兩邊語意才不會對不起來。
const envLabels = ['主訓練區', '功能性訓練區', '器材訓練區', '重量訓練區', '服務櫃檯', '更衣與盥洗空間']
const photos = computed(() => {
  const galleryImages = store.value?.galleryImages || []
  if (galleryImages.length > 0) {
    const list = galleryImages.slice(0, 6)
    // 第一張跨兩欄。三欄的格線裡，跨欄等於多佔一格，所以只有 (張數+1) 能被 3 整除
    // 時才不會留下殘缺的一列（5 張→6 格 ✅ 跨欄；6 張→3×2 剛好 ✅ 不跨欄）。
    const spanFirst = (list.length + 1) % 3 === 0
    return list.map((img: string, index: number) => ({
      label: envLabels[index] || `環境照片 ${index + 1}`,
      span: index === 0 && spanFirst,
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
            <span><strong class="text-orange">第一堂體驗課，50歲以上免費</strong>・未滿50歲 $500</span>
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
              class="absolute inset-0 pointer-events-none"
            />
            <!-- 整張地圖點擊 → 開啟正確的 Google 地圖連結（含左上「在 Google 地圖中開啟」區域）-->
            <a
              v-if="mapLink"
              :href="mapLink"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`在 Google 地圖開啟 ${store.name}`"
              class="absolute inset-0 group"
            >
              <span class="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm text-navy-700 font-medium text-sm px-4 py-2 rounded-full shadow-lg group-hover:bg-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                在 Google Maps 開啟
              </span>
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
            </div>

            <!-- 營業時間（Google Maps 式下拉）-->
            <StoreHours :hours="businessHours" />
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
        <CoachCarousel :coaches="coaches" :store="{ name: store.name, slug: storeSlug }" />
      </div>
    </section>

    <!-- Photos Section -->
    <section class="bg-white py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          分店環境
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-8">
          來之前<span class="text-orange">先看看</span>
        </h2>
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
              :alt="`${store.name}${photo.label}`"
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
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
          從捷運站走過來只要幾分鐘，第一堂體驗課 50歲以上免費。
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
