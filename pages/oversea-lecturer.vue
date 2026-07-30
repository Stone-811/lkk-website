<script setup lang="ts">
import { computed } from 'vue'

useHead({
  title: '海外授權講師｜練健康 LKK Wellness',
  meta: [
    { name: 'description', content: '練健康海外授權講師網絡，將專業中高齡訓練系統推廣至國際市場。' }
  ]
})

interface Lecturer {
  id: string
  name: string
  slug?: string
  photo?: string
  title?: string
  region?: string
  countries?: string[]
  description?: string
  specialties?: string[]
  certifications?: string[]
}

// Fetch lecturers from API
const { data: lecturersResponse, pending } = await useFetch<{
  success: boolean
  data: Lecturer[]
}>('/api/public/lecturers?type=overseas')

const overseasLecturers = computed(() => lecturersResponse.value?.data || [])

// 授權流程
const steps = [
  {
    num: '01',
    title: '申請洽談',
    description: '有興趣的專業人士可透過聯絡表單提出申請，我們會安排初步洽談。',
  },
  {
    num: '02',
    title: '資格審核',
    description: '審核申請者的專業背景、經驗與當地市場狀況。',
  },
  {
    num: '03',
    title: '培訓認證',
    description: '完成練健康核心課程培訓，取得授權講師認證。',
  },
  {
    num: '04',
    title: '正式授權',
    description: '簽署授權合約，獲得在地區內使用練健康品牌與課程的授權。',
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
          <span>海外授權講師</span>
        </nav>

        <div class="inline-flex items-center bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5">
          國際專業授權
        </div>

        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
          海外授權<span class="text-orange">講師</span>
        </h1>

        <p class="text-white/60 text-lg font-light leading-relaxed max-w-2xl mx-auto">
          練健康將專業的中高齡訓練系統推廣至海外，透過授權講師網絡，讓更多人受益於安全有效的訓練方法。
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
            class="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-cream-200 text-ink hover:bg-cream-300 transition-colors"
          >
            合作講師
          </NuxtLink>
          <NuxtLink
            to="/oversea-lecturer"
            class="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-navy text-white"
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

    <!-- Lecturers Grid -->
    <section v-else class="py-16 lg:py-24">
      <div class="container mx-auto px-4">
        <div v-if="overseasLecturers.length === 0" class="text-center py-12 text-ink/50">
          目前沒有海外授權講師資料
        </div>
        <template v-else>
          <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
            <span class="w-5 h-0.5 bg-orange" />
            授權講師
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-8">
            海外<span class="text-orange">授權講師</span>
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <article
            v-for="lecturer in overseasLecturers"
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
                <h3 class="font-serif text-xl font-bold text-navy">{{ lecturer.name }}</h3>
                <p class="text-orange font-semibold text-sm">{{ lecturer.title }}</p>
                <p v-if="lecturer.region" class="text-ink/50 text-xs mt-1">{{ lecturer.region }}</p>
              </div>

              <p v-if="lecturer.description" class="text-ink/60 text-sm leading-relaxed mb-3">{{ lecturer.description }}</p>

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

    <!-- Authorization Process -->
    <section class="bg-cream py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange" />
            授權流程
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            如何成為<span class="text-orange">授權講師</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div
            v-for="(step, idx) in steps"
            :key="step.num"
            class="relative"
          >
            <!-- Connector line -->
            <div
              v-if="idx < steps.length - 1"
              class="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-orange/20 -translate-x-1/2"
            />

            <div class="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm text-center relative">
              <div class="w-12 h-12 rounded-full bg-orange text-white font-serif font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {{ step.num }}
              </div>
              <h3 class="font-bold text-navy mb-2">{{ step.title }}</h3>
              <p class="text-sm text-ink/60 leading-relaxed">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-orange py-16 lg:py-20 text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
          想在海外推廣練健康？
        </h2>
        <p class="text-white/80 mb-8 max-w-md mx-auto">
          歡迎海外專業人士加入練健康授權講師網絡，將專業訓練帶到您的國家。
        </p>
        <NuxtLink
          to="/cooperation"
          class="inline-flex items-center gap-2 bg-white text-orange font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          申請授權 →
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
