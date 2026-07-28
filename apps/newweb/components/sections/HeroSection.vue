<script setup lang="ts">
const heroStats = [
  {
    icon: 'dumbbell',
    num: '1,000+',
    label: '服務學員人次',
  },
  {
    icon: 'building',
    num: 'PT 背景',
    label: '物理治療師・呼吸治療師主導',
  },
  {
    icon: 'location',
    num: '4 間',
    label: '分店｜台北・新北',
  },
  {
    icon: 'badge',
    num: '6 屆',
    label: 'LKK4 中高齡年度競技賽事',
  },
]

const dataStats = [
  { num: '1%', text: ['40歲後每年流失的肌肉量', '不訓練，就是被動老化'] },
  { num: '50+', text: ['歲以上首次體驗完全免費', '零門檻開始第一堂課'] },
  { num: '90+歲', text: ['學員也能做訓練', '年齡不是限制，方法才是'] },
  { num: '專業', text: ['教育訓練團隊把關', '物理治療師主導，安全不受傷'] },
]

const pressOutlets = [
  { name: 'CNN', url: 'https://www.instagram.com/reel/DX7Zi10GO5L' },
  { name: '法新社', url: 'https://www.youtube.com/watch?v=OlwYBNzAW60' },
  { name: '路透社', url: 'https://www.reuters.com/world/asia-pacific/weightlifting-taiwan-granny-90-garners-cheers-health-benefits-gym-2024-12-21/' },
  { name: '美聯社', url: 'https://apnews.com/video/taiwanese-grandmothers-show-age-is-no-obstacle-to-good-health-and-prowess-in-the-gym-a94b31caecb5485b91a350a0895e8782' },
  { name: '天下雜誌', url: 'https://www.cw.com.tw/article/5135025' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative min-h-screen bg-navy-800 flex flex-col justify-center overflow-hidden pt-16">
      <!-- Background effects -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(251,114,10,0.12)_0%,transparent_55%),radial-gradient(circle_at_10%_80%,rgba(42,82,105,0.6)_0%,transparent_50%)]" />
        <div
          class="absolute inset-0 opacity-[0.025]"
          :style="{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }"
        />
      </div>

      <div class="container mx-auto px-4 relative z-10 py-12 lg:py-16">
        <div class="grid lg:grid-cols-[1fr_400px] gap-12 items-center">
          <!-- Left content -->
          <div class="text-center lg:text-left">
            <!-- Eyebrow -->
            <div class="inline-flex items-center bg-orange/15 border border-orange/35 text-orange text-sm font-medium px-4 py-1.5 rounded-full mb-5 tracking-wide">
              中高齡肌力訓練專家
            </div>

            <h1 class="font-serif text-4xl lg:text-6xl font-black text-white leading-tight mb-5">
              40歲後<br />
              肌肉每年<span class="text-orange">流失1%</span><br />
              我們讓你練回來
            </h1>

            <p class="text-white/65 text-lg font-light leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              教練團隊皆經系統化課程培訓考核，深耕中高齡與特殊族群訓練知識，為您量身打造安全有效的肌力訓練課程。
            </p>

            <div class="flex flex-wrap gap-3 justify-center lg:justify-start">
              <NuxtLink
                to="/booking#form"
                class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-all hover:-translate-y-0.5"
              >
                立即預約體驗課 &rarr;
              </NuxtLink>
              <a
                href="https://l-kk.tw/category/%e6%a1%88%e4%be%8b%e5%88%86%e4%ba%ab/"
                class="inline-flex items-center gap-2 bg-transparent text-white/75 px-6 py-3.5 rounded-full border border-white/20 hover:border-white/50 hover:text-white transition-colors"
              >
                看學員成果
              </a>
            </div>

            <div class="flex items-center justify-center lg:justify-start gap-2 mt-4 text-sm text-white/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong class="text-orange">50歲以上完全免費</strong>，一般首次體驗僅需 $500</span>
            </div>
          </div>

          <!-- Right - Stats Card -->
          <aside class="hidden lg:block bg-white/[0.06] backdrop-blur-md border border-white/12 rounded-3xl p-7">
            <div class="space-y-0">
              <div
                v-for="(stat, index) in heroStats"
                :key="stat.num"
                :class="['flex items-center gap-4 py-4', index < heroStats.length - 1 ? 'border-b border-white/[0.08]' : '']"
              >
                <div class="w-11 h-11 rounded-lg bg-orange/20 flex items-center justify-center flex-shrink-0">
                  <!-- Dumbbell icon -->
                  <svg v-if="stat.icon === 'dumbbell'" class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h4v12H4zM16 8h4v12h-4zM2 12h20M12 4v4" />
                  </svg>
                  <!-- Building icon -->
                  <svg v-else-if="stat.icon === 'building'" class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <!-- Location icon -->
                  <svg v-else-if="stat.icon === 'location'" class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <!-- Badge icon -->
                  <svg v-else-if="stat.icon === 'badge'" class="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <div class="font-serif text-xl font-black text-white leading-none">{{ stat.num }}</div>
                  <div class="text-xs text-white/50 mt-0.5">{{ stat.label }}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-0 right-0 flex justify-center">
        <div class="flex flex-col items-center gap-1.5 text-white/30 text-xs animate-bounce">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          往下滑
        </div>
      </div>
    </section>

    <!-- Data Strip -->
    <section class="bg-navy-800 py-8 lg:py-10">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.08] rounded-2xl overflow-hidden">
          <div
            v-for="stat in dataStats"
            :key="stat.num"
            class="bg-navy-800 p-6 lg:p-8 hover:bg-white/[0.04] transition-colors"
          >
            <div class="font-serif text-3xl lg:text-5xl font-black text-orange leading-none mb-2">
              {{ stat.num }}
            </div>
            <p class="text-white/65 text-sm leading-relaxed">
              <strong class="text-white">{{ stat.text[0] }}</strong>
              <br />
              {{ stat.text[1] }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Press Strip -->
    <section class="bg-white py-8 lg:py-10">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
          <a href="https://l-kk.tw/category/news/" class="text-ink/60 text-sm font-medium whitespace-nowrap hover:text-ink transition-colors">報導列表</a>
          <div class="flex flex-wrap items-center justify-center gap-x-8 lg:gap-x-12 gap-y-4">
            <a
              v-for="outlet in pressOutlets"
              :key="outlet.name"
              :href="outlet.url"
              class="text-ink/50 text-sm lg:text-base font-medium hover:text-ink/70 transition-colors"
            >
              {{ outlet.name }}
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
