<script setup lang="ts">
const cases = [
  {
    id: 1,
    quote: '70歲開始重訓，現在可以自己爬山、帶孫子去公園玩。以前膝蓋痛到走不了路，現在根本不是問題。',
    name: '林阿嬤',
    avatar: '林',
    detail: '70歲，膝關節退化',
    badge: '訓練 8 個月',
  },
  {
    id: 2,
    quote: '中風之後以為這輩子就這樣了。練健康的教練讓我重新相信身體的可能性，現在我可以自己走路去買東西。',
    name: '王先生',
    avatar: '王',
    detail: '62歲，腦中風後復健',
    badge: '訓練 1 年',
  },
  {
    id: 3,
    quote: '癌症治療結束後體力虛弱，肌肉大量流失。在這裡重建體能，回診時醫生說我的恢復狀況比預期好很多。',
    name: '陳小姐',
    avatar: '陳',
    detail: '55歲，乳癌術後',
    badge: '訓練 6 個月',
  },
]
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <!-- Section header -->
      <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
        <span class="w-5 h-0.5 bg-orange" />
        學員見證
      </div>
      <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 mb-3">
        <span class="text-orange">真實改變</span>，不是口號
      </h2>
      <p class="text-ink/60 leading-relaxed mb-10 max-w-xl">
        每一位學員都有自己的故事，這裡是其中幾個。
      </p>

      <!-- Cases grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="item in cases"
          :key="item.id"
          class="bg-cream-100 rounded-3xl p-6 lg:p-8 border border-navy-700/15 hover:shadow-lg transition-shadow"
        >
          <!-- Quote mark -->
          <span class="font-serif text-7xl font-black text-orange/20 leading-none block mb-2">
            "
          </span>

          <!-- Quote text -->
          <p class="text-ink/60 leading-relaxed italic mb-6">
            {{ item.quote }}
          </p>

          <!-- Meta -->
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <div class="w-11 h-11 rounded-full bg-navy-700 flex items-center justify-center text-white font-bold flex-shrink-0">
              {{ item.avatar }}
            </div>

            <!-- Name & detail -->
            <div class="flex-1">
              <div class="font-bold text-navy-700">{{ item.name }}</div>
              <div class="text-xs text-ink/50">{{ item.detail }}</div>
            </div>

            <!-- Badge -->
            <span class="bg-orange/12 text-orange text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              {{ item.badge }}
            </span>
          </div>
        </article>
      </div>

      <!-- CTA -->
      <div class="text-center mt-10">
        <a
          href="https://l-kk.tw/category/%e6%a1%88%e4%be%8b%e5%88%86%e4%ba%ab/"
          class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors"
        >
          查看更多學員案例 &rarr;
        </a>
      </div>
    </div>
  </section>
</template>
