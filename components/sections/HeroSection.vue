<script setup lang="ts">
const dataStats = [
  { num: '1%', title: '現在開始的理由', desc: '50歲後肌肉量逐年流失1%，越早開始訓練，越早為未來累積力量。' },
  { num: '50+', title: '專為中高齡設計', desc: '50歲以上免費體驗，找到真正適合你的訓練方式。' },
  { num: '90歲', title: '幾歲都能開始', desc: '年齡不是限制，找到適合的方法，每個階段都能練。' },
  { num: '專業', title: '安心有人把關', desc: '結合物理治療與專業教練團隊，讓訓練更安心、更適合你。' },
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
        <!--
          壓暗參數（opacity-60 + brightness(0.4)）與 pages/locations/index.vue 的 Hero 相同。
          ⚠️ brightness 用 inline style 而非 Tailwind 任意屬性：兩者都會編譯，但 Nuxt 會把
             critical CSS 內嵌進 HTML 的 <style>，用 class 寫法在驗證時容易誤判成沒生效。
        -->
        <img
          src="/images/home/hero.webp"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover opacity-60"
          style="filter: brightness(0.4)"
        />
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
        <div class="grid lg:grid-cols-[1fr_460px] gap-12 items-center">
          <!-- Left content -->
          <div class="text-center lg:text-left">
            <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-5">
              <span class="text-orange">健康，是練出來的。</span><br />
              現在開始，永遠不嫌晚。
            </h1>

            <p class="text-white/80 text-base lg:text-lg font-light leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              隨著年齡增長，肌力與身體機能會逐漸改變。但透過持續、適合自己的肌力訓練，我們依然可以把力量、行動力與生活的自主，一點一點練回來。現在開始，讓我們一起為未來的自己，做好準備！
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

            <div class="flex items-center justify-center lg:justify-start gap-2 mt-4 text-sm text-white/75">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong class="text-orange-300">第一堂體驗課，50歲以上免費</strong>・未滿50歲 $500</span>
            </div>
          </div>

          <!-- Right - Stats Card -->
          <aside class="hidden lg:block bg-white/[0.06] backdrop-blur-md border border-white/12 rounded-3xl p-8">
            <!-- Title -->
            <h2 class="text-center text-white font-serif text-2xl font-bold mb-6">
              用心服務 <span class="text-orange">10,000+</span> 位學員
            </h2>

            <!-- Main Stats - 2 cards -->
            <div class="grid grid-cols-2 gap-4 mb-5">
              <div class="bg-white rounded-2xl p-5 text-center">
                <div class="text-sm text-navy-700/60 font-medium mb-1.5">平均年齡</div>
                <div class="font-serif text-4xl font-black text-orange">62.9<span class="text-2xl">歲</span></div>
              </div>
              <div class="bg-white rounded-2xl p-5 text-center">
                <div class="text-sm text-navy-700/60 font-medium mb-1.5">最年長學員</div>
                <div class="font-serif text-4xl font-black text-orange">97<span class="text-2xl">歲</span></div>
              </div>
            </div>

            <!-- Secondary Stats - 3 pills -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white/90 rounded-xl px-3 py-3 text-center">
                <div class="text-xs text-navy-700/60 font-medium leading-tight mb-1">關節與骨科疾病</div>
                <div class="font-serif text-xl font-black text-orange leading-none">1,161<span class="text-sm text-navy-700/50">位</span></div>
              </div>
              <div class="bg-white/90 rounded-xl px-3 py-3 text-center">
                <div class="text-xs text-navy-700/60 font-medium leading-tight mb-1">代謝與心血管疾病</div>
                <div class="font-serif text-xl font-black text-orange leading-none">678<span class="text-sm text-navy-700/50">位</span></div>
              </div>
              <div class="bg-white/90 rounded-xl px-3 py-3 text-center">
                <div class="text-xs text-navy-700/60 font-medium leading-tight mb-1">手術後康復訓練</div>
                <div class="font-serif text-xl font-black text-orange leading-none">389<span class="text-sm text-navy-700/50">位</span></div>
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.08] rounded-2xl overflow-hidden">
          <div
            v-for="stat in dataStats"
            :key="stat.num"
            class="bg-navy-800 px-4 py-6 sm:p-6 lg:p-7 text-center hover:bg-white/[0.04] transition-colors"
          >
            <div class="leading-tight mb-2">
              <span class="font-serif text-2xl lg:text-3xl font-black text-orange align-baseline">{{ stat.num }}</span>
              <span class="text-white/25 mx-0.5 lg:mx-1 align-baseline">｜</span>
              <span class="font-bold text-white text-sm lg:text-base align-baseline">{{ stat.title }}</span>
            </div>
            <p class="text-white/65 text-xs lg:text-sm leading-relaxed">
              {{ stat.desc }}
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
