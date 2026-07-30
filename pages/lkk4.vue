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
    meta: '下肢肌力・爆發力',
    description: 'LKK4 的最招牌經典項目。透過相較於傳統槓鈴更符合人體工學的六角槓，檢測中高齡選手的純力量外釋與下肢爆發綜合素質。',
  },
  {
    id: 'walk',
    name: '功能性行走',
    iconType: 'walk',
    meta: '步態穩定・平衡控制',
    description: '模擬日常生活中最常面臨的提重物行走情境，考驗選手在負重狀態下的核心抗旋轉能力、步態動態穩定度與平衡感。',
  },
  {
    id: 'pushpull',
    name: '上肢推拉力',
    iconType: 'pushpull',
    meta: '肩部功能・核心整合',
    description: '全面檢測上半身非對稱結構下的推與拉力表現。不僅考驗肩關節的健康度，更強調力量從核心貫穿至上肢的連動控制。',
  },
  {
    id: 'cardio',
    name: '心肺耐力',
    iconType: 'cardio',
    meta: '有氧能力・恢復速度',
    description: '針對高強度間歇運動後的能量系統運作設計。考驗選手的有氧基底能力，以及身體在短暫休息後的機能高效率恢復速度。',
  },
]

const history = [
  { year: '2026', title: '第六屆 LKK4 賽事籌備中', description: '全面引進國際化評分標準與 hreflang 多語言佈局，配合海外市場（如新加坡）發展計劃，打造全亞太區指標性中高齡挑戰賽。' },
  { year: '2025', title: '第五屆 聖誕老人老人六角槓硬舉大賽', description: '參賽總人數創歷史新高，成功引爆主流社群話題。運動醫學與物理治療的整合規範獲得高度好評。' },
  { year: '2022-24', title: '第二屆至第四屆 賽制功能化轉型', description: '賽事正式更名為 LKK4，擺脫單純的重量競技，全面納入心肺與步態穩定度等全能指標。' },
  { year: '2019', title: '第一屆 聖誕老人硬舉邀請賽', description: '由練健康團隊內部發起，數十位阿公阿嬤首度披上聖誕戰袍參賽，顛覆社會大眾對高齡重訓危險的偏見。' },
]

const highlights = [
  { num: '50+', title: '參賽年齡資格', desc: '專為 50 歲以上健康長輩與特殊族群量身規劃的安全賽制。' },
  { num: '5 屆', title: '賽事歷史累積', desc: '已成功舉辦五屆年度盛事，累計數百位中高齡選手參賽。' },
  { num: '100%', title: '醫療背景主導', desc: '全程由專業物理治療師與合格教練進行安全監督與動作審查。' },
  { num: '4 項', title: '全能核心指標', desc: '整合日常生活中最核心的動作功能，兼顧肌力與靈活性。' },
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
          <span class="text-orange text-sm font-medium">第六屆賽事・2026 年 12 月・籌備中</span>
        </div>

        <h1 class="font-serif text-6xl lg:text-8xl font-black text-white tracking-tight mb-2">
          LKK<span class="text-orange">4</span>
        </h1>
        <div class="text-xl lg:text-2xl text-white/70 font-light tracking-widest mb-6">
          中高齡四項體能挑戰賽
        </div>
        <p class="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed font-light mb-8">
          台灣唯一專為 50 歲以上設計的年度競技賽事。擺脫被動老化，我們在安全無虞的運動醫學基礎上，號召全台銀髮強者用成績證明：年齡不是終點。
        </p>

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
    </section>

    <!-- Brand Story -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-10 items-center">
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
                <strong class="text-navy">LKK4</strong> 誕生於 2019 年，最初由「練健康」創辦。團隊發現許多中高齡學員在經過科學化肌力訓練後，展現出驚人的身體動作實力，卻苦於全台灣沒有任何一個專為他們設計的體能賽事舞台。
              </p>
              <p>
                第一屆賽事以極具趣味性的「聖誕老人老人六角槓硬舉大賽」出發，成功引發大眾及媒體熱烈迴響。隨後數年間，隨著物理治療與呼吸治療背景的教練團隊深度介入，賽事規模逐年擴大。
              </p>
              <p>
                演進至今，LKK4 已全面進化為涵蓋<strong class="text-navy">肌力、爆發力、心肺與靈活度</strong>的跨領域四項全能競技挑戰。這不只是一場賽事，更是台灣中高齡群體向被動老化宣戰的最高殿堂。
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
      </div>
    </section>

    <!-- Disciplines -->
    <section class="py-16 lg:py-20 bg-cream">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          2026 全新賽制
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-3">
          LKK4 核心<span class="text-orange">四項體能競技項目</span>
        </h2>
        <p class="text-ink/60 text-lg max-w-2xl mb-10">
          賽事以全方位身體動作功能為核心目標。每位選手皆須依序完成以下四大挑戰項目，全面檢測動作整合能力：
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
              <!-- Walk Icon -->
              <svg v-else-if="item.iconType === 'walk'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h3a2 2 0 012 2v9a2 2 0 01-2 2h-3m-6-4l3 3-3 3M7 15h6" />
              </svg>
              <!-- Push/Pull Icon -->
              <svg v-else-if="item.iconType === 'pushpull'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <!-- Cardio Icon -->
              <svg v-else-if="item.iconType === 'cardio'" class="w-10 h-10 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="font-serif text-xl font-bold text-navy mb-1">{{ item.name }}</h3>
            <div class="text-xs font-semibold text-orange tracking-wide mb-3">{{ item.meta }}</div>
            <p class="text-sm text-ink/60 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-ink/40 bg-black/[0.03] py-2 rounded-lg">
          ＊註：以上四項賽制為 2026 年最新修訂標準，詳細官方競賽計分規則將於正式賽前 3 個月完整公告。
        </div>
      </div>
    </section>

    <!-- History -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          榮譽里程碑
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-3">
          歷屆足跡與<span class="text-orange">大眾媒體肯定</span>
        </h2>
        <p class="text-ink/60 text-lg max-w-2xl mb-10">
          從地區型的趣味運動會，蛻變為各界關注的年度賽事，以下是我們的成長軌跡：
        </p>

        <div class="max-w-3xl mx-auto space-y-4 mb-12">
          <div
            v-for="item in history"
            :key="item.year"
            class="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-cream rounded-xl p-5 border border-navy/10"
          >
            <div class="font-serif text-2xl font-black text-navy shrink-0 sm:w-24">{{ item.year }}</div>
            <div>
              <div class="font-bold text-ink mb-1">{{ item.title }}</div>
              <div class="text-sm text-ink/60 leading-relaxed">{{ item.description }}</div>
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
