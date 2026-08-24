<script setup lang="ts">
// 學員見證。
// 2026-08-24 改版：學員照片從「卡片頂端的大方框」改成「姓名左側的小圓形頭像」，
// 卡片頂端一律顯示引號符號，版面更輕、三張卡高度也更容易一致。
// photo 留空時，小圓頭像自動退回深藍底 + 姓氏首字（avatar），不會開天窗。
// 圖檔放置位置：public/images/cases/  →  路徑寫成 '/images/cases/檔名.jpg'
// 小圓頭像用 object-cover + object-top，避免正方形素材把下巴切掉。
const cases = [
  {
    id: 1,
    name: '雪莉',
    avatar: '雪',
    detail: '72歲・氣喘與心臟病',
    photo: '/images/cases/shirley.jpg',
    quote:
      '因為患有先天性氣喘與心臟病，原本以為疾病會一直影響我的生活。但在堅持重訓六年之後，我不僅重新找回健康，還能自信地站上舞台參加聖誕老人硬舉大賽！',
  },
  {
    id: 2,
    name: '黃阿公',
    avatar: '黃',
    detail: '85歲・訓練三年多',
    photo: '/images/cases/huang.jpg',
    quote:
      '年過八十，最怕的就是生病增加家人的負擔，在這裡訓練多年，教練都會針對我的狀況隨時調整教學課表，讓我不僅保持體力、照顧好自己，連我的老婆都開始在這裡運動！',
  },
  {
    id: 3,
    name: '保羅',
    avatar: '保',
    detail: '69歲・原發性顫抖症',
    photo: '/images/cases/paul.jpg',
    quote:
      '因為原發性顫抖症，當初手抖到連倒水、吃飯都有問題，在開始重訓後，不僅藥量減半，我還能硬舉到120公斤，更能輕鬆抱起孫子玩耍！',
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
          class="bg-cream-100 rounded-3xl p-6 lg:p-8 border border-navy-700/15 hover:shadow-lg transition-shadow flex flex-col"
        >
          <!-- 引號符號（照片已移到下方姓名列的小圓頭像） -->
          <span class="font-serif text-7xl font-black text-orange/20 leading-none block mb-2">
            "
          </span>

          <!-- Quote text（flex-1 讓等高卡片的姓名列對齊底部） -->
          <p class="text-ink/60 leading-relaxed italic mb-6 flex-1">
            {{ item.quote }}
          </p>

          <!-- Meta -->
          <div class="flex items-center gap-3">
            <!-- 小圓頭像：有照片就放照片，沒照片退回姓氏首字 -->
            <img
              v-if="item.photo"
              :src="item.photo"
              :alt="`${item.name}・${item.detail}`"
              loading="lazy"
              class="w-12 h-12 rounded-full object-cover object-top bg-navy-700/5 flex-shrink-0"
            />
            <div
              v-else
              class="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-white font-bold flex-shrink-0"
            >
              {{ item.avatar }}
            </div>

            <!-- Name & detail -->
            <div class="flex-1">
              <div class="font-bold text-navy-700">{{ item.name }}</div>
              <div class="text-xs text-ink/50">{{ item.detail }}</div>
            </div>
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
