<script setup lang="ts">
const services = [
  {
    id: 'senior',
    title: '中高齡肌力訓練',
    description: '40歲後肌肉、骨質流失速度增加，透過訓練讓你找回屬於你的身體動作能力。',
    tags: ['肌少症預防', '骨質強化', '平衡訓練', '一對一教練'],
    badge: '最受歡迎',
    image: '/images/services/senior.jpg',
  },
  {
    id: 'special',
    title: '特殊族群訓練',
    description: '中風、癌症、手術後、糖尿病、骨質疏鬆族群之專業訓練介入，讓你在最安全且有效的方式下，讓身體恢復到原有水準。',
    tags: ['中風復健', '術後訓練', '慢性病管理', '專業教練把關'],
    badge: '醫療背景',
    image: '/images/services/special.png',
  },
  {
    id: 'performance',
    title: '運動表現訓練',
    description: '針對專項需求與身體檢測，找出弱點，透過數據分析與專業肌力訓練提升你的運動表現。',
    tags: ['數據化訓練', '動作分析', '運動傷害預防'],
    badge: null,
    image: '/images/services/performance.png',
  },
]
</script>

<template>
  <section class="bg-cream-100 py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <!-- Section header -->
      <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
        <span class="w-5 h-0.5 bg-orange" />
        我們的服務
      </div>
      <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 mb-3">
        找到<span class="text-orange">適合你</span>的訓練方式
      </h2>
      <p class="text-ink/60 leading-relaxed mb-10 max-w-xl">
        以運動醫學知識為核心，提供你專業客製化肌力訓練課程，<span class="whitespace-nowrap">讓你生活健康自主又活得有尊嚴。</span>
      </p>

      <!-- Services grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="service in services"
          :key="service.id"
          to="/services"
        >
          <article class="bg-white rounded-3xl overflow-hidden shadow-lg border border-navy-700/15 hover:-translate-y-1 transition-transform cursor-pointer h-full">
            <!-- Card image -->
            <div class="aspect-[4/3] relative overflow-hidden bg-navy-100">
              <img
                :src="service.image"
                :alt="service.title"
                class="w-full h-full object-contain"
              />
              <span
                v-if="service.badge"
                class="absolute top-4 left-4 bg-orange text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide"
              >
                {{ service.badge }}
              </span>
            </div>

            <!-- Card body -->
            <div class="p-6">
              <h3 class="font-serif text-xl font-bold text-navy-700 mb-2">
                {{ service.title }}
              </h3>
              <p class="text-ink/60 text-sm leading-relaxed mb-4">
                {{ service.description }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in service.tags"
                  :key="tag"
                  class="text-xs font-medium text-navy-700 bg-navy-700/[0.08] px-2.5 py-0.5 rounded-full border border-navy-700/12"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>

      <!-- CTA -->
      <div class="text-center mt-10">
        <NuxtLink
          to="/services"
          class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors"
        >
          查看完整服務方案 &rarr;
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
