<script setup lang="ts">
import { computed } from 'vue'

useHead({
  title: '練健康講師｜練健康 LKK Wellness',
  meta: [
    { name: 'description', content: '練健康專業講師團隊，提供中高齡健康訓練課程與專業培訓。' }
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
  courses?: string[]
  certifications?: string[]
}

// Fetch lecturers from API
const { data: lecturersResponse, pending } = await useFetch<{
  success: boolean
  data: Lecturer[]
}>('/api/public/lecturers?type=lkk')

const lecturers = computed(() => lecturersResponse.value?.data || [])

// 培訓課程
const courses = [
  {
    title: '中高齡肌力訓練基礎班',
    duration: '16 小時',
    description: '從解剖學、生理學基礎到實務操作，建立完整的中高齡訓練知識體系。',
  },
  {
    title: '特殊族群訓練進階班',
    duration: '24 小時',
    description: '針對術後、中風、慢性病等特殊族群的訓練策略與注意事項。',
  },
  {
    title: '講師培訓認證課程',
    duration: '40 小時',
    description: '完整的講師培訓計畫，取得練健康認證講師資格。',
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
          <span>練健康講師</span>
        </nav>

        <div class="inline-flex items-center bg-orange/20 border border-orange/40 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5">
          練健康專業培訓講師
        </div>

        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
          練健康<span class="text-orange">講師</span>
        </h1>

        <p class="text-white/60 text-lg font-light leading-relaxed max-w-2xl mx-auto">
          由醫療專業背景講師組成，提供系統化的中高齡訓練課程，培養更多專業人才投入銀髮健康產業。
        </p>
      </div>
    </section>

    <!-- Lecturer Type Navigation -->
    <section class="border-b border-cream-200 sticky top-16 bg-cream/95 backdrop-blur-sm z-20">
      <div class="container mx-auto px-4">
        <div class="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
          <NuxtLink
            to="/lkk-lecturer"
            class="px-4 py-2 rounded-full whitespace-nowrap font-medium bg-navy text-white"
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

    <!-- Instructors Grid -->
    <section v-else class="py-16 lg:py-24">
      <div class="container mx-auto px-4">
        <div v-if="lecturers.length === 0" class="text-center py-12 text-ink/50">
          目前沒有講師資料
        </div>
        <div v-else>
          <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
            <span class="w-5 h-0.5 bg-orange" />
            授權講師
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-8">
            練健康<span class="text-orange">認證講師</span>
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <article
              v-for="lecturer in lecturers"
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
                </div>

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
        </div>
      </div>
    </section>

    <!-- Courses Section -->
    <section class="bg-cream py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange" />
            課程介紹
          </div>
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            專業<span class="text-orange">培訓課程</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div
            v-for="course in courses"
            :key="course.title"
            class="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm"
          >
            <div class="text-xs font-medium text-orange bg-orange/10 px-3 py-1 rounded-full inline-block mb-4">
              {{ course.duration }}
            </div>
            <h3 class="font-bold text-navy mb-2">{{ course.title }}</h3>
            <p class="text-sm text-ink/60 leading-relaxed">{{ course.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-orange py-16 lg:py-20 text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
          想了解更多課程資訊？
        </h2>
        <p class="text-white/80 mb-8 max-w-md mx-auto">
          歡迎洽詢練健康講師培訓課程，一起投入銀髮健康產業。
        </p>
        <NuxtLink
          to="/cooperation"
          class="inline-flex items-center gap-2 bg-white text-orange font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          聯絡我們 →
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
