<script setup lang="ts">
useHead({
  title: 'LKK4 中高齡四項體能挑戰賽 | 練健康',
  meta: [
    {
      name: 'description',
      content: 'LKK4是由練健康創辦的台灣唯一專為50歲以上設計的年度中高齡競技賽事。涵蓋六角槓硬舉、功能性行走、上肢推拉與心肺耐力四項全能挑戰，用成績證明年齡不是終點。'
    }
  ]
})

const disciplines = [
  {
    id: 'deadlift',
    name: '六角槓硬舉',
    iconType: 'deadlift',
    meta: '肌力',
    description: '安全地從地上搬起重物、抱孫子、預防跌倒。',
  },
  {
    id: 'sled',
    name: '推雪橇',
    iconType: 'sled',
    meta: '爆發力',
    description: '推動沉重購物車、推開厚重大門、爬坡行走的能力。',
  },
  {
    id: 'farmer',
    name: '單側農夫走路',
    iconType: 'farmer',
    meta: '核心能力',
    description: '提菜買物、負重行走時的平衡感，是防跌的關鍵。',
  },
  {
    id: 'bike',
    name: '風扇車',
    iconType: 'bike',
    meta: '有氧能力',
    description: '提升心血管健康、爬樓梯不喘、長距離行走的能力。',
  },
]

const originStory = [
  {
    label: '2021・緣起',
    text: 'LKK 聖誕老人硬舉大賽誕生於 2021 年，起源於練健康發現許多中高齡學員自從開始訓練後，雖然有明顯的進步，卻苦於全台灣沒有可以讓他們展現成果的舞台。',
  },
  {
    label: '第一屆・逐年擴大',
    text: '第一屆賽事以極具趣味性的「聖誕老人硬舉邀請賽」出發，成功引發大眾及媒體熱烈迴響。隨後數年間，隨著中高齡訓練的風氣逐漸打開，賽事規模逐年擴大。',
  },
  {
    label: '進化至今',
    text: '演進至今年，更全面進化為涵蓋肌力、爆發力、核心能力與心肺有氧能力四大面向的 LKK4 聖誕老人功能錦標賽。',
  },
]

const highlights = [
  { num: '全齡', title: '參賽年齡資格', desc: '不限年齡都能依組別輕鬆參加' },
  { num: '5 屆', title: '活動歷史累積', desc: '已成功舉辦五屆，累計數百位夥伴一起同樂' },
  { num: '100%', title: '專業教練主導', desc: '賽制由物理治療師及運動科學專家規劃，確保安全及有效性' },
  { num: '4 個', title: '貼近生活的關卡', desc: '每一關都對應日常生活中最實用的能力' },
]

const audience = [
  '想為自己的訓練立下一個目標與里程碑',
  '家中有正在運動的長輩，想給他一個發光的舞台',
  '熱血的親友團，想揪團一起拚團體積分',
]

const mediaLogos = ['BBC 國際新聞', '志祺七七 關鍵評論', '大愛新聞專題', '吳淡如人生實用商學院', '動思學院 MoveThink']
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero -->
    <section class="relative bg-[#0e2230] py-24 lg:py-32 overflow-hidden text-center">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,114,10,0.15)_0%,transparent_60%)]" />
      <div class="container mx-auto px-4 relative z-10">
        <!-- Status pill -->
        <div class="inline-flex items-center bg-orange/15 border border-orange/30 rounded-full px-4 py-1.5 mb-6">
          <span class="text-orange text-sm font-medium">第六屆賽事・2026 年 12 月 13 日・台北世貿一館</span>
        </div>

        <h1 class="font-serif text-6xl lg:text-8xl font-black text-white tracking-tight mb-2">
          LKK<span class="text-orange">4</span>
        </h1>
        <div class="text-xl lg:text-2xl text-white/70 font-light tracking-widest mb-6">
          聖誕老人功能錦標賽🔥
        </div>
        <p class="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed font-light mb-8">
          不只是比賽，這是一場為所有年齡打造的訓練舞台！
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://www.accupass.com/event/2606231002373711869520?utm_source=google&utm_medium=Direct&utm_campaign=accu_260702a6zestso"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
            </svg>
            立即報名 LKK4
          </a>
          <NuxtLink
            to="/personal-record"
            class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/20 hover:border-white/30 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            參賽成績查詢
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Brand Story -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-10 items-center mb-14 lg:mb-16">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
              <span class="w-5 h-0.5 bg-orange" />
              賽事起源
            </div>
            <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-6 leading-tight">
              從聖誕老人硬舉大賽<br />
              到<span class="text-orange">跨領域的全能挑戰</span>
            </h2>
            <div class="space-y-4 text-ink/70 leading-relaxed">
              <p>
                <strong class="text-navy">LKK4</strong> 誕生於 2019 年，最初由「練健康」創辦。團隊發現許多學員在經過科學化肌力訓練後，展現出驚人的身體動作實力，卻苦於全台灣沒有一個能盡情發揮的體能賽事舞台。
              </p>
              <p>
                第一屆賽事以極具趣味性的「聖誕老人六角槓硬舉大賽」出發，成功引發大眾及媒體熱烈迴響。隨後數年間，隨著物理治療與呼吸治療背景的教練團隊深度介入，賽事規模逐年擴大。
              </p>
              <p>
                演進至今，LKK4 已全面進化為涵蓋<strong class="text-navy">肌力、爆發力、心肺與靈活度</strong>的跨領域四項全能挑戰。這不只是一場賽事，更是一個不分年齡、人人都能站上場證明自己的訓練舞台。
              </p>
            </div>
          </div>

          <!-- Highlights Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="item in highlights"
              :key="item.title"
              class="bg-cream rounded-2xl p-5 border border-navy/10"
            >
              <div class="font-serif text-4xl font-black text-orange leading-none mb-2">{{ item.num }}</div>
              <div class="font-bold text-navy mb-1">{{ item.title }}</div>
              <div class="text-sm text-ink/60 leading-relaxed">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 誰適合來參賽 + 練健康是誰 -->
        <div class="grid lg:grid-cols-2 gap-6">
          <!-- 誰適合來參賽 -->
          <div class="bg-cream rounded-2xl p-7 lg:p-8 border border-navy/10">
            <h3 class="font-serif text-2xl font-black text-navy mb-5">誰適合來參賽？</h3>
            <ul class="space-y-3">
              <li v-for="item in audience" :key="item" class="flex items-start gap-3">
                <svg class="w-6 h-6 text-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-ink/70 leading-relaxed">{{ item }}</span>
              </li>
            </ul>
            <p class="mt-5 text-sm text-ink/70 bg-white rounded-xl px-4 py-3 border border-navy/10">
              沒有報名參賽的朋友也歡迎來現場觀賽，給每一位選手最大的掌聲！
            </p>
          </div>

          <!-- 練健康是誰 -->
          <div class="bg-navy rounded-2xl p-7 lg:p-8 text-white">
            <h3 class="font-serif text-2xl font-black text-white mb-5">練健康是誰？</h3>
            <div class="space-y-3 text-white/70 text-sm leading-relaxed">
              <p>練健康是一個由物理治療、職能治療、運動科學、營養學、資料科學、經濟、生物力學、文學與設計背景成員所組成的團隊。</p>
              <p>我們致力於推廣銀髮族、術後及特殊健康族群的體能訓練，讓學員安全且有效率地讓身體回復水準，也專注協助專業選手改善動作模式、增強專項運動表現。</p>
              <p>現場教學之外，我們也是運動科學科普平台，轉譯正確知識、教育大眾，並分享激勵人心的中高齡與特殊族群訓練紀錄，鼓勵每一個人加入訓練的行列。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Disciplines -->
    <section class="py-16 lg:py-20 bg-cream">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          賽事宗旨
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-5 leading-tight">
          為什麼要舉辦<br class="hidden sm:block" />「<span class="text-orange">LKK4 聖誕老人功能錦標賽</span>」？
        </h2>
        <p class="text-ink/70 text-lg max-w-3xl mb-12 leading-relaxed">
          台灣已邁入超高齡社會，中高齡族群的健康與生活能力，將成為整個社會的重要議題。我們希望透過「LKK4 聖誕老人功能錦標賽」傳達一個觀念：<strong class="text-navy">體能不只是運動表現，而是支撐日常生活的重要能力。</strong>
        </p>

        <h3 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-3">
          為什麼是這 <span class="text-orange">4 個項目</span>？
        </h3>
        <p class="text-ink/60 text-base max-w-3xl mb-8 leading-relaxed">
          六角槓硬舉、推雪橇、單側農夫走路與風扇車，分別對應肌力、爆發力、核心與有氧能力——每一項都直接呼應日常生活中最實用的身體功能：
        </p>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="item in disciplines"
            :key="item.id"
            class="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm hover:-translate-y-1 transition-transform"
          >
            <div class="mb-3">
              <!-- Deadlift Icon -->
              <svg v-if="item.iconType === 'deadlift'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h4v12H4zM16 8h4v12h-4zM2 12h20M12 4v4" />
              </svg>
              <!-- Sled Push Icon -->
              <svg v-else-if="item.iconType === 'sled'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <!-- Farmer Walk Icon -->
              <svg v-else-if="item.iconType === 'farmer'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h3a2 2 0 012 2v9a2 2 0 01-2 2h-3m-6-4l3 3-3 3M7 15h6" />
              </svg>
              <!-- Fan Bike Icon -->
              <svg v-else-if="item.iconType === 'bike'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 class="font-serif text-xl font-bold text-navy mb-2">{{ item.name }}</h3>
            <span class="inline-block text-xs font-bold text-orange bg-orange/10 rounded-full px-2.5 py-0.5 mb-3">{{ item.meta }}</span>
            <p class="text-sm text-ink/60 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-ink/40 bg-black/[0.03] py-2 rounded-lg">
          ＊註：以上四項賽制為 2026 年最新修訂標準，詳細官方競賽計分規則將於正式賽前 3 個月完整公告。
        </div>
      </div>
    </section>

    <!-- Origin & Milestones -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          賽事緣起
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-10">
          賽事緣起與<span class="text-orange">里程碑</span>
        </h2>

        <div class="max-w-3xl mx-auto mb-12">
          <div
            v-for="(step, i) in originStory"
            :key="i"
            class="relative flex gap-5 pb-8 last:pb-0"
          >
            <div class="flex flex-col items-center shrink-0">
              <div class="w-4 h-4 rounded-full bg-orange ring-4 ring-orange/15" />
              <div v-if="i < originStory.length - 1" class="w-0.5 flex-1 bg-navy/10 mt-1" />
            </div>
            <div class="-mt-1">
              <div class="font-serif text-lg font-black text-navy mb-1">{{ step.label }}</div>
              <p class="text-ink/70 leading-relaxed">{{ step.text }}</p>
            </div>
          </div>
        </div>

        <!-- Media Strip -->
        <div class="bg-cream rounded-2xl p-6 border border-navy/10">
          <div class="text-xs font-bold text-ink/40 tracking-widest uppercase text-center mb-4">
            曾受各大主流媒體及知識節目專題報導
          </div>
          <div class="flex flex-wrap justify-center items-center gap-6">
            <span
              v-for="logo in mediaLogos"
              :key="logo"
              class="font-serif text-base font-bold text-navy/60"
            >
              {{ logo }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Commercial CTA -->
    <section class="py-16 lg:py-20 bg-gradient-to-br from-[#1a3545] to-[#0e2230] text-white">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          商業與公關洽詢
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
          攜手 LKK4，共同開創<span class="text-orange">銀髮健康新經濟</span>
        </h2>
        <p class="text-white/60 text-lg max-w-2xl mb-10">
          LKK4 是全台規模最大的中高齡全能體能挑戰賽，我們誠摯歡迎企業贊助、加盟通路、技術研究或媒體採訪，共同發揮品牌影響力：
        </p>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h3 class="font-serif text-xl font-black text-white mb-2">
              企業贊助與<span class="text-orange">品牌合作</span>
            </h3>
            <p class="text-white/60 text-sm leading-relaxed mb-5">
              我們為重視大健康、高齡福祉、運動醫療與永續社會責任（ESG）的企業夥伴提供多元的賽事贊助方案，包含現場常駐 logo 牆露出、媒體聯合行銷等機會。
            </p>
            <NuxtLink to="/cooperation" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors text-sm">
              洽談贊助與合作 →
            </NuxtLink>
          </div>

          <div class="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h3 class="font-serif text-xl font-black text-white mb-2">
              媒體公關與<span class="text-orange">新聞專區</span>
            </h3>
            <p class="text-white/60 text-sm leading-relaxed mb-5">
              專為記者、節目製作人與研究機構設立。提供歷屆賽事影像資產、選手精彩故事、專業物理治療數據報告以及專屬媒體採訪席位登記。
            </p>
            <a href="mailto:lkk@l-kk.tw" class="inline-flex items-center gap-2 bg-transparent border border-white/25 text-white font-semibold px-6 py-2.5 rounded-full hover:border-white hover:bg-white/5 transition-colors text-sm">
              索取 Press Kit / 採訪登記
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="py-16 lg:py-20 bg-cream">
      <div class="container mx-auto px-4 text-center">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-4">
          準備好挑戰自己了嗎？
        </h2>
        <p class="text-ink/60 mb-8 max-w-xl mx-auto">
          無論你現在的程度如何，LKK4 歡迎所有 50 歲以上熱愛運動的人。先從免費體驗開始，讓教練幫你評估實力！
        </p>
        <NuxtLink to="/booking" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
          預約免費體驗 →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
