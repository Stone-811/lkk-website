<script setup lang="ts">
const steps = [
  {
    step: 1,
    title: '填寫預約表單',
    description: '姓名、電話、選擇分店\n30 秒完成',
  },
  {
    step: 2,
    title: '教練主動聯繫',
    description: '1 個工作天內\n電話或 LINE 聯絡',
  },
  {
    step: 3,
    title: '身體評估檢測',
    description: '肌力、活動度、平衡\n全面了解你的狀況',
  },
  {
    step: 4,
    title: '客製課表訓練',
    description: '物理治療師背景教練\n設計專屬課程',
  },
]
</script>

<template>
  <section class="bg-navy-800 py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <!-- Section header -->
      <div class="flex items-center gap-2 text-sm font-bold text-orange/85 tracking-widest uppercase mb-2">
        <span class="w-5 h-0.5 bg-orange/85" />
        預約流程
      </div>
      <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-10">
        四步驟，<span class="text-orange">開始改變</span>
      </h2>

      <!-- Steps grid -->
      <div class="relative">
        <!-- Connector line -->
        <div class="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-orange/30" />

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="item in steps"
            :key="item.step"
            class="relative text-center"
          >
            <!-- Step number -->
            <div class="relative z-10 w-14 h-14 rounded-full bg-orange text-white font-serif text-xl font-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange/25">
              {{ item.step }}
            </div>

            <h3 class="font-serif text-lg font-bold text-white mb-2">
              {{ item.title }}
            </h3>
            <p class="text-sm text-white/50 leading-relaxed whitespace-pre-line">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center mt-12">
        <NuxtLink
          to="/booking"
          class="inline-flex items-center gap-2 bg-orange text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-all hover:-translate-y-0.5"
        >
          立即預約 &rarr;
        </NuxtLink>
        <p class="text-white/45 text-sm mt-4">
          <strong class="text-orange">50歲以上免費</strong>・一般首次體驗 $500・無隱藏費用
        </p>
      </div>
    </div>
  </section>
</template>
