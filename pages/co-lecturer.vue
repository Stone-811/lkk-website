<script setup lang="ts">
import { computed } from 'vue'

useHead({
  title: '合作講師｜練健康 LKK Wellness',
  meta: [
    { name: 'description', content: '練健康合作講師網絡，匯集各領域專業人才，共同推廣中高齡健康訓練。' }
  ]
})

interface Lecturer {
  id: string
  name: string
  slug?: string
  photo?: string
  title?: string
  organization?: string
  description?: string
  specialties?: string[]
  certifications?: string[]
}

// Fetch lecturers from API
const { data: lecturersResponse, pending } = await useFetch<{
  success: boolean
  data: Lecturer[]
}>('/api/public/lecturers?type=partner')

const partnerLecturers = computed(() => lecturersResponse.value?.data || [])

// 合作優勢
const benefits = [
  {
    title: '專業知識交流',
    description: '定期舉辦專業研討會，促進跨領域知識分享與交流。',
    icon: 'book',
  },
  {
    title: '課程共同開發',
    description: '結合不同專業背景，開發更完整的訓練課程。',
    icon: 'lightbulb',
  },
  {
    title: '資源共享網絡',
    description: '建立專業人才網絡，共享資源與轉介服務。',
    icon: 'people',
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
        <nav class="flex items-center justify-center gap-1.5 text-xs text-white/35 mb-6">
          <NuxtLink to="/" class="hover:text-white/70 transition-colors">練健康</NuxtLink>
          <span class="text-white/20">›</span>
          <NuxtLink to="/team-intro" class="hover:text-white/70 transition-colors">團隊介紹</NuxtLink>
          <span class="text-white/20">›</span>
          <span>合作講師</span>
        </nav>

        <div class="inline-flex items-center bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5">
          跨領域專業合作講師
        </div>

        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
          合作<span class="text-orange">講師</span>
        </h1>

        <p class="text-white/60 text-lg font-light leading-relaxed max-w-2xl mx-auto">
          練健康與各領域專業人才合作，結合物理治療、運動科學、營養學等專業，提供全方位的健康訓練服務。
        </p>
      </div>
    </section>

    <!-- Lecturer Type Navigation -->
    <section class="border-b border-cream-200 sticky top-16 bg-cream/95 backdrop-blur-sm z-20">
      <div class="container mx-auto px-4">
        <div class="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
          <NuxtLink
            to="/lkk-lecturer"
            class="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-cream-200 text-ink hover:bg-cream-300 transition-colors"
          >
            練健康授權講師
          </NuxtLink>
          <NuxtLink
            to="/co-lecturer"
            class="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-navy text-white"
          >
            合作講師
          </NuxtLink>
          <NuxtLink
            to="/oversea-lecturer"
            class="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-cream-200 text-ink hover:bg-cream-300 transition-colors"
          >
            海外授權講師
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-24">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>

    <!-- Partners Grid -->
    <section v-else class="py-16 lg:py-24">
      <div class="container mx-auto px-4">
        <div v-if="partnerLecturers.length === 0" class="text-center py-12 text-ink/50">
          目前沒有合作講師資料
        </div>
        <template v-else>
          <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
            <span class="w-5 h-0.5 bg-orange" />
            醫療專業合作
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-8">
            練健康<span class="text-orange">合作講師</span>
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <article
            v-for="lecturer in partnerLecturers"
            :key="lecturer.id"
            class="bg-white rounded-2xl overflow-hidden shadow-lg border border-navy/10 hover:-translate-y-1 transition-transform"
          >
            <div class="aspect-square bg-gradient-to-br from-navy to-navy/80 relative">
              <img
                v-if="lecturer.photo"
                :src="lecturer.photo"
                :alt="lecturer.name"
                class="w-full h-full object-cover object-top"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <span class="font-serif text-7xl font-black text-white/20">{{ lecturer.name.charAt(0) }}</span>
              </div>
            </div>

            <div class="p-5">
              <div class="mb-3">
                <h3 class="font-serif text-xl font-bold text-navy">
                  {{ lecturer.name }}
                  <span v-if="lecturer.nickname" class="text-navy/50 font-normal ml-2">{{ lecturer.nickname }}</span>
                </h3>
                <p class="text-orange font-semibold text-sm">{{ lecturer.title }}</p>
                <p v-if="lecturer.organization" class="text-ink/50 text-xs mt-1">{{ lecturer.organization }}</p>
              </div>

              <p class="text-ink/60 text-sm leading-relaxed mb-3">{{ lecturer.description }}</p>

              <div v-if="lecturer.specialties?.length" class="flex flex-wrap gap-1.5 mb-3">
                <span
                  v-for="spec in lecturer.specialties"
                  :key="spec"
                  class="text-xs font-medium text-white bg-orange px-2.5 py-1 rounded-full"
                >
                  {{ spec }}
                </span>
              </div>

              <div v-if="lecturer.certifications?.length" class="pt-3 border-t border-navy/10">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="cert in lecturer.certifications"
                    :key="cert"
                    class="text-xs text-navy/70 bg-navy/[0.06] px-2 py-0.5 rounded"
                  >
                    {{ cert }}
                  </span>
                </div>
              </div>
            </div>
          </article>
          </div>
        </template>
      </div>
    </section>

    <!-- Collaboration Section -->
    <section class="bg-cream py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange" />
            合作優勢
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            跨領域<span class="text-orange">合作效益</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm text-center"
          >
            <div class="mb-4 flex justify-center">
              <!-- Book Icon -->
              <svg v-if="benefit.icon === 'book'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <!-- Lightbulb Icon -->
              <svg v-else-if="benefit.icon === 'lightbulb'" class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <!-- People Icon -->
              <svg v-else class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="font-bold text-navy mb-2">{{ benefit.title }}</h3>
            <p class="text-sm text-ink/60 leading-relaxed">{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-orange py-16 lg:py-20 text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
          有興趣成為合作講師？
        </h2>
        <p class="text-white/80 mb-8 max-w-md mx-auto">
          歡迎各領域專業人士加入練健康合作講師網絡，一起推廣中高齡健康訓練。
        </p>
        <NuxtLink
          to="/cooperation"
          class="inline-flex items-center gap-2 bg-white text-orange font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          洽談合作 →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
