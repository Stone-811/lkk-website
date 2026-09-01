<script setup lang="ts">
useHead({
  title: 'LKK4 聖誕老人功能錦標賽｜全齡體能挑戰賽 | 練健康',
  meta: [
    {
      name: 'description',
      content: '「聖誕老人六角槓硬舉大賽」今年全面升級為「LKK4 聖誕老人功能錦標賽」！保留經典六角槓硬舉，全新加入推雪橇、單側農夫走與風扇車。全齡友善賽制，打造日常實用體能舞台，立即看最新賽制說明與報名資訊。'
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

const milestones = [
  {
    year: '2021',
    title: '第一屆 聖誕老人硬舉邀請賽',
    desc: '由練健康團隊內部發起，數十位阿公阿嬤首度披上聖誕戰袍參賽，顛覆社會大眾對高齡重訓危險的偏見。',
  },
  {
    year: '2022',
    title: '第二屆 聖誕老人硬舉大賽',
    desc: '220 人參賽，規模較首屆翻倍，開始獲得公眾與媒體關注。',
  },
  {
    year: '2023',
    title: '第三屆 聖誕老人硬舉大賽',
    desc: '225 人參賽，中高齡訓練的風氣逐漸打開，賽事規模持續擴大。',
  },
  {
    year: '2024',
    title: '第四屆 聖誕老人硬舉大賽',
    desc: '場地擴及華山文創、松山文創等指標場域，報名開放後屢次秒殺額滿。',
  },
  {
    year: '2025',
    title: '第五屆 聖誕老人硬舉大賽',
    desc: '70 歲以上選手超過 60 人參賽，並獲華視、中央社、BBC、路透社、法新社、新加坡電視台 CNA 等海內外媒體報導。',
  },
  {
    year: '2026',
    title: '第六屆 LKK4 聖誕老人功能錦標賽',
    desc: '全面進化為涵蓋肌力、爆發力、核心能力與心肺有氧能力四大面向的功能錦標賽。安全、直覺、全齡友善，所有年齡皆可參加。',
  },
]

// 官方報名頁（Accupass）
const ACCUPASS_URL = 'https://www.accupass.com/event/2606231002373711869520?utm_source=google&utm_medium=Direct&utm_campaign=accu_260702a6zestso'

// ── 以下賽制資訊來源：Accupass 官方活動頁 ──
const competitionGroups = [
  { key: 'female', label: '女子組', count: '共五組', items: ['39 歲以下', '40–49 歲', '50–59 歲', '60–69 歲', '70–79 歲'] },
  { key: 'male', label: '男子組', count: '共五組', items: ['39 歲以下', '40–49 歲', '50–59 歲', '60–69 歲', '70–79 歲'] },
  { key: 'senior', label: '長者推廣組', count: '不分性別', items: ['80 歲以上，一同挑戰！'] },
]

const entryFees = [
  { name: '早鳥優惠價', price: '2,700', period: '2026/6/29 12:00 – 2026/7/12 23:55' },
  { name: '一般報名費', price: '3,000', period: '2026/7/13 00:00 – 2026/10/30 23:55', current: true },
]

const raceRules = [
  '比賽開始後，每 5 分鐘會響鈴一次，每一次響鈴會安排 5 位選手入場比賽。',
  '請選手依出場序提前至預備區準備，並依響鈴聲與工作人員引導入場比賽。',
  '每位選手入場後，需依序完成 3 個關卡。',
  '每位選手比賽總時間為 20 分鐘。',
  '成績計算方式為三個關卡完成時間加總，總時間越短，名次越前面。',
]

const stations = [
  {
    n: '第一關',
    name: '六角槓硬舉',
    limit: '限時 1 分鐘',
    points: ['依序完成「輕、中、重」三種重量', '未於限時內完成，本關成績以 1:00 計算'],
  },
  {
    n: '第二關',
    name: '推雪橇 ＋ 單側農夫走路',
    limit: '限時 3 分鐘',
    points: ['先完成推雪橇，再換手完成農夫走路', '兩項皆需來回共 25 公尺，於 12.5 公尺處折返回起點才算完成', '未於限時內完成，本關成績以 3:00 計算'],
  },
  {
    n: '第三關',
    name: '風扇車',
    limit: '限時 10 分鐘',
    points: ['完成風扇車 3 公里', '未於限時內完成，本關成績以 10:00 計算'],
  },
]

const weightTable = [
  { group: '69 歲（含）以下・男', light: '80', mid: '100', heavy: '120', sled: '100', farmer: '28', bike: '3' },
  { group: '69 歲（含）以下・女', light: '50', mid: '60', heavy: '80', sled: '75', farmer: '20', bike: '3' },
  { group: '70 歲（含）以上・男', light: '40', mid: '50', heavy: '60', sled: '60', farmer: '20', bike: '3' },
  { group: '70 歲（含）以上・女', light: '30', mid: '40', heavy: '50', sled: '40', farmer: '12', bike: '3' },
]

const tshirtFits = [
  { body: '生理男', height: '183 cm', weight: '90 kg', size: 'L', fit: '合身' },
  { body: '生理男', height: '171 cm', weight: '70 kg', size: 'M', fit: '合身' },
  { body: '生理男', height: '177 cm', weight: '90 kg', size: 'XL', fit: '略寬鬆' },
  { body: '生理女', height: '153.5 cm', weight: '46 kg', size: 'S', fit: '略寬鬆' },
  { body: '生理女', height: '163 cm', weight: '68 kg', size: 'S', fit: '合身' },
  { body: '生理女', height: '165 cm', weight: '58 kg', size: 'M', fit: '略寬鬆' },
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

</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero -->
    <!--
      第六屆主視覺當底圖。opacity-60 + brightness(0.30)，與全站其他 Hero 同一組做法。
      ⚠️ 這張圖中央是大片米色，壓暗後底色仍比純 #0e2230 亮不少
      （L 0.0145 → 0.0391），status pill 的橘字會從 4.82 掉到 3.48，
      所以那顆一併改成 orange-300（5.78）。換照片要重量一次。
    -->
    <section class="relative bg-[#0e2230] py-24 lg:py-32 overflow-hidden text-center">
      <!--
        底圖只在 lg 以上出現。實測 object-cover 後的水平可見範圍：
        1440→100%、1024→98%、768→77%、390→只剩 43%（左右直排的
        「台北世貿一館C區」「十二月十三日」整條被裁掉，中間只剩一片深灰）。
        所以 lg 以下不套底圖，維持原本的純深色底。
      -->
      <img
        src="/images/lkk4/hero.webp"
        alt=""
        aria-hidden="true"
        class="hidden lg:block absolute inset-0 w-full h-full object-cover opacity-60"
        style="filter: brightness(0.30)"
      />
      <!--
        橘色光暈是為純深色底設計的，疊在主視覺上會把它的藍綠色調染成偏褐的灰，
        所以只留在沒有底圖的 lg 以下。
      -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,114,10,0.15)_0%,transparent_60%)] lg:hidden" />
      <div class="container mx-auto px-4 relative z-10">
        <!-- Status pill -->
        <div class="inline-flex items-center bg-orange/15 border border-orange/30 rounded-full px-4 py-1.5 mb-6">
          <span class="text-orange lg:text-orange-300 text-sm font-medium">第六屆賽事・2026 年 12 月 13 日・台北世貿一館</span>
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
        </div>
      </div>
    </section>

    <!-- Event Highlights + Audience + Team -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <!-- Highlights Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14 lg:mb-16">
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

        <!-- 參賽資訊 -->
        <div class="mb-14 lg:mb-16">
          <div class="bg-gradient-to-br from-[#1a3545] to-[#0e2230] rounded-3xl p-8 lg:p-10 text-center">
            <div class="text-sm font-bold text-orange-700 tracking-widest uppercase mb-4">
              安全・直覺・全齡友善
            </div>
            <h3 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">
              所有年齡皆可參加
            </h3>
            <p class="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              現場熱血歡樂、親友加油不間斷，打破你對年齡的想像，保證嗨翻整天！
            </p>

            <!-- Date + Location -->
            <div class="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-6 text-left">
              <div class="flex items-start gap-3 bg-white/[0.06] border border-white/10 rounded-2xl p-5">
                <svg class="w-6 h-6 text-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div class="text-xs text-white/50 font-semibold tracking-wide mb-1">活動日期</div>
                  <div class="font-bold text-white">2026 年 12 月 13 日（日）</div>
                  <div class="text-sm text-white/70">09:00 – 17:00</div>
                </div>
              </div>
              <div class="flex items-start gap-3 bg-white/[0.06] border border-white/10 rounded-2xl p-5">
                <svg class="w-6 h-6 text-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div class="text-xs text-white/50 font-semibold tracking-wide mb-1">活動地點</div>
                  <div class="font-bold text-white">台北世貿一館 C 區</div>
                  <div class="text-sm text-white/70">台北市信義區信義路五段 5 號</div>
                </div>
              </div>
            </div>

            <!-- Promo dates -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <span class="inline-flex items-center gap-2 bg-orange text-white rounded-full px-5 py-2 text-sm font-bold shadow-lg shadow-orange/30">
                報名截止 2026/10/30
              </span>
              <a
                :href="ACCUPASS_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-white text-navy rounded-full px-6 py-2.5 text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                前往 Accupass 報名
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
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
        <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange-700" />
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


    <!-- 賽制與報名資訊（資料來源：Accupass 官方活動頁）-->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange-700" />
          賽制與報名
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-10 leading-tight">
          比賽組別與<span class="text-orange">賽制說明</span>
        </h2>

        <!-- 比賽組別與預計選手人數 -->
        <h3 class="font-serif text-2xl font-black text-navy mb-2">比賽組別與預計選手人數</h3>
        <p class="text-ink/60 leading-relaxed mb-6">
          39 歲以下、40–49 歲、50–59 歲、60–69 歲、70–79 歲，各分男女組共十組，另特別加開 80 歲以上不分性別的長者推廣組。
        </p>
        <div class="grid md:grid-cols-3 gap-4 mb-14">
          <div
            v-for="g in competitionGroups"
            :key="g.key"
            class="bg-cream rounded-2xl p-6 border border-navy/10"
          >
            <div class="flex items-baseline gap-2 mb-4">
              <h4 class="font-serif text-xl font-black text-navy">{{ g.label }}</h4>
              <span class="text-xs font-bold text-orange bg-orange/10 rounded-full px-2.5 py-0.5">{{ g.count }}</span>
            </div>
            <ul class="space-y-1.5">
              <li v-for="item in g.items" :key="item" class="flex items-center gap-2 text-sm text-ink/70">
                <span class="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 報名費用 -->
        <h3 class="font-serif text-2xl font-black text-navy mb-6">報名費用</h3>
        <div class="grid sm:grid-cols-2 gap-4 mb-6">
          <div
            v-for="fee in entryFees"
            :key="fee.name"
            :class="[
              'rounded-2xl p-6 border',
              fee.current ? 'bg-orange/[0.06] border-orange/40' : 'bg-cream border-navy/10',
            ]"
          >
            <div class="text-sm font-bold mb-1" :class="fee.current ? 'text-orange' : 'text-ink/50'">{{ fee.name }}</div>
            <div class="font-serif text-3xl font-black text-navy mb-2">
              NT$ {{ fee.price }}<span class="text-base font-bold text-ink/50"> / 人</span>
            </div>
            <div class="text-sm text-ink/60">{{ fee.period }}</div>
          </div>
        </div>
        <div class="bg-navy/[0.04] rounded-xl px-5 py-3.5 text-sm text-ink/70 mb-14">
          賽程預計於 <strong class="text-navy">2026/11/6（星期五）前</strong>公佈。
        </div>

        <!-- 比賽方式與計分說明 -->
        <h3 class="font-serif text-2xl font-black text-navy mb-6">比賽方式與計分說明</h3>
        <ol class="space-y-3 mb-8">
          <li v-for="(rule, i) in raceRules" :key="i" class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-orange/12 text-orange text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {{ i + 1 }}
            </span>
            <span class="text-ink/70 leading-relaxed">{{ rule }}</span>
          </li>
        </ol>

        <div class="grid md:grid-cols-3 gap-4 mb-14">
          <div
            v-for="st in stations"
            :key="st.n"
            class="bg-cream rounded-2xl p-6 border border-navy/10"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold text-white bg-navy rounded-full px-2.5 py-0.5">{{ st.n }}</span>
              <span class="text-xs font-bold text-orange bg-orange/10 rounded-full px-2.5 py-0.5">{{ st.limit }}</span>
            </div>
            <h4 class="font-serif text-xl font-black text-navy mb-3">{{ st.name }}</h4>
            <ul class="space-y-1.5">
              <li v-for="pt in st.points" :key="pt" class="flex items-start gap-2 text-sm text-ink/65 leading-relaxed">
                <span class="text-orange mt-0.5">・</span>{{ pt }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 重量與距離說明 -->
        <h3 class="font-serif text-2xl font-black text-navy mb-6">重量與距離說明</h3>
        <div class="overflow-x-auto mb-14 rounded-2xl border border-navy/10">
          <table class="w-full min-w-[640px] text-sm bg-white">
            <thead>
              <tr class="bg-navy text-white">
                <th rowspan="2" class="text-left font-bold px-4 py-3 align-middle">組別</th>
                <th colspan="3" class="font-bold px-4 py-2 border-l border-white/15">第一關｜六角槓硬舉 (kg)</th>
                <th rowspan="2" class="font-bold px-4 py-3 align-middle border-l border-white/15">第二關<br />推雪橇 (kg)</th>
                <th rowspan="2" class="font-bold px-4 py-3 align-middle border-l border-white/15">第二關<br />單側農夫走路 (kg)</th>
                <th rowspan="2" class="font-bold px-4 py-3 align-middle border-l border-white/15">第三關<br />風扇車 (km)</th>
              </tr>
              <tr class="bg-navy/90 text-white">
                <th class="font-medium px-4 py-1.5 border-l border-white/15">輕</th>
                <th class="font-medium px-4 py-1.5">中</th>
                <th class="font-medium px-4 py-1.5">重</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in weightTable"
                :key="row.group"
                :class="i % 2 ? 'bg-cream/50' : 'bg-white'"
              >
                <td class="px-4 py-3 font-semibold text-navy whitespace-nowrap">{{ row.group }}</td>
                <td class="px-4 py-3 text-center text-ink/70">{{ row.light }}</td>
                <td class="px-4 py-3 text-center text-ink/70">{{ row.mid }}</td>
                <td class="px-4 py-3 text-center text-ink/70">{{ row.heavy }}</td>
                <td class="px-4 py-3 text-center text-ink/70">{{ row.sled }}</td>
                <td class="px-4 py-3 text-center text-ink/70">{{ row.farmer }}</td>
                <td class="px-4 py-3 text-center text-ink/70">{{ row.bike }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 選手 T 尺寸表 -->
        <h3 class="font-serif text-2xl font-black text-navy mb-2">選手 T 尺寸表</h3>
        <p class="text-ink/60 leading-relaxed mb-6">Model 試穿狀況，提供你挑選尺寸時參考。</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <div
            v-for="(f, i) in tshirtFits"
            :key="i"
            class="flex items-center gap-4 bg-cream rounded-xl px-5 py-4 border border-navy/10"
          >
            <div class="font-serif text-2xl font-black text-orange w-10 shrink-0">{{ f.size }}</div>
            <div class="text-sm text-ink/70 leading-relaxed">
              {{ f.body }}／{{ f.height }}／{{ f.weight }}<br />
              <span class="text-ink/50">穿著感受{{ f.fit }}</span>
            </div>
          </div>
        </div>

        <div class="text-center">
          <a
            :href="ACCUPASS_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
          >
            前往 Accupass 報名
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- Origin & Milestones -->
    <section class="py-16 lg:py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange-700" />
          賽事緣起
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy mb-8">
          賽事緣起與<span class="text-orange">里程碑</span>
        </h2>

        <!-- 里程碑時間軸 -->
        <div class="max-w-3xl mx-auto mb-12">
          <div
            v-for="(item, i) in milestones"
            :key="item.year"
            class="relative flex gap-5 pb-8 last:pb-0"
          >
            <div class="flex flex-col items-center shrink-0">
              <div class="w-4 h-4 rounded-full bg-orange ring-4 ring-orange/15" />
              <div v-if="i < milestones.length - 1" class="w-0.5 flex-1 bg-navy/10 mt-1" />
            </div>
            <div class="-mt-1 pb-1">
              <div class="font-serif text-2xl font-black text-navy leading-none mb-1.5">{{ item.year }}</div>
              <div class="font-bold text-ink mb-1">{{ item.title }}</div>
              <p class="text-sm text-ink/60 leading-relaxed">{{ item.desc }}</p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- 歷年參賽成績查詢 -->
    <section class="py-16 lg:py-20 bg-cream">
      <div class="container mx-auto px-4">
        <div class="bg-white rounded-2xl p-8 lg:p-10 border border-navy/10 text-center">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange-700" />
            歷年參賽成績查詢
          </div>
          <!-- 原本標題下方還有一段說明文字，內容與現在的標題完全相同，改標題後會重複出現兩次，故移除；
               mb-3 改 mb-6 補回那段說明原本佔的間距。 -->
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-6">查詢歷屆選手的參賽成績與排名紀錄</h2>
          <NuxtLink to="/personal-record" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            參賽成績查詢
          </NuxtLink>
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
          無論你現在的程度如何，LKK4 歡迎所有熱愛運動的人。
        </p>
        <a
          :href="ACCUPASS_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
          </svg>
          立即報名 LKK4
        </a>
      </div>
    </section>
  </div>
</template>
