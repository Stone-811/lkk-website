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
  { num: '90歲', text: ['阿嬤也能做硬舉', '年齡不是限制，方法才是'] },
  { num: '醫療', text: ['背景教練團隊', '物理治療師主導，安全不受傷'] },
]

const pressOutlets = [
  { name: '大愛新聞', url: 'https://l-kk.tw/%e3%80%90%e5%a4%a7%e6%84%9b%e6%96%b0%e8%81%9edaainews%e3%80%91%e9%8a%80%e9%ab%ae%e6%97%8f%e4%b9%9f%e8%83%bd%e9%87%8d%e8%a8%93-%e5%bc%b7%e5%81%a5%e8%82%8c%e5%8a%9b%e4%b8%8d%e8%b7%8c%e8%b7%a4/' },
  { name: '吳淡如人生實用商學院', url: 'https://l-kk.tw/%e5%90%b3%e6%b7%a1%e5%a6%82%e4%ba%ba%e7%94%9f%e5%af%a6%e7%94%a8%e5%95%86%e5%ad%b8%e9%99%a2%ef%bc%88official%e5%ae%98%e6%96%b9%e5%94%af%e4%b8%80%e9%a0%bb%e9%81%93%ef%bc%89%f0%9f%9a%a9%e3%80%90%e5%90%b3/' },
  { name: '動思學院 MoveThink', url: 'https://l-kk.tw/%e3%80%90%e5%8b%95%e6%80%9d%e5%ad%b8%e9%99%a2-movethink%e3%80%91%e6%af%8f%e5%80%8b%e7%88%b8%e5%aa%bd%e9%83%bd%e8%a9%b2%e9%87%8d%e8%a8%93%ef%bc%81%e9%95%b7%e8%bc%a9%e4%b9%9f%e5%8f%af%e4%bb%a5%e5%be%88/' },
  { name: '高年級不打烊', url: 'https://l-kk.tw/%e3%80%90%e9%ab%98%e5%b9%b4%e7%b4%9a%e4%b8%8d%e6%89%93%e7%83%8a-x-%e7%94%a8-ai-%e9%bb%9e%e4%ba%ae%e7%ac%ac%e4%ba%8c%e4%ba%ba%e7%94%9f%e3%80%91ep146-%e9%bb%83%e5%85%83%e6%9d%b0%ef%bc%8d%e7%b7%b4/' },
  { name: '強者我朋友', url: 'https://l-kk.tw/90%e6%ad%b2%e9%98%bf%e5%ac%a4%e4%b9%9f%e8%83%bd%e7%a1%ac%e8%88%89%ef%bc%81%e8%a6%81%e6%80%8e%e9%ba%bc%e8%aa%aa%e6%9c%8d%e7%88%b8%e5%aa%bd%e5%8e%bb%e9%81%8b%e5%8b%95%ef%bc%9f%e9%87%8d%e8%a8%93%e6%9c%80/' },
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
          <span class="text-ink/60 text-sm font-medium whitespace-nowrap">曾受報導</span>
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
