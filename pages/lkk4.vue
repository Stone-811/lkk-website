<script setup lang="ts">
/**
 * LKK4 聖誕老人功能錦標賽
 *
 * 2026-09-01 依業主提供的版型（lkk4 (1).html）重構架構：
 *   Hero → 四詞卡 → 四大功能挑戰 → 自我測驗 → 團體賽 → 賽事緣起
 *   → 賽制與報名（保留原有硬資訊）→ 成績查詢 → FAQ → 報名 CTA
 *
 * ⚠️ 配色用站上 token，不用參考檔的 #004B69/#EC6F00/#F5F0E4。
 *    全頁底色 navy-700（#2A5269），米色票券浮在上面。實測對比：
 *      白 8.37、cream 7.31、white/75 5.54、orange-300 4.96 → 全過
 *      orange DEFAULT 只有 2.99 → 票券外的橘字一律用 orange-300，
 *      橘底按鈕（白字 2.80）維持全站既有做法不動。
 *    票券內是米色底，改回 orange-700(4.52) / navy-800(11.19) / ink/70(6.02)。
 *
 * ⚠️ 關卡數：路線圖海報標的是 Stage 01 / Stage 02+03 / Stage 04，
 *    也就是「3 關、4 個項目」，與下方 stations 一致。四大功能挑戰講的是
 *    4 個「項目」，不是 4 關，改文案時不要把兩者混為一談。
 *
 * 原有的 highlights 四個數字卡與「練健康是誰」在本次改版移除：
 *   前者被四詞卡與團體賽取代，後者與 /about 重複（頁尾有連結過去）。
 */
useHead({
  title: 'LKK4 聖誕老人功能錦標賽｜全齡體能挑戰賽 | 練健康',
  meta: [
    {
      name: 'description',
      content: '「聖誕老人六角槓硬舉大賽」今年全面升級為「LKK4 聖誕老人功能錦標賽」！保留經典六角槓硬舉，全新加入推雪橇、單側農夫走與風扇車。全齡友善賽制，打造日常實用體能舞台，立即看最新賽制說明與報名資訊。'
    }
  ]
})

// 官方報名頁（Accupass）
const ACCUPASS_URL = 'https://www.accupass.com/event/2606231002373711869520?utm_source=google&utm_medium=Direct&utm_campaign=accu_260702a6zestso'

// 把賽事翻譯成生活語言的四個詞
const fourWords = [
  { icon: 'lift', t: '拿得動', d: '提菜籃、拿行李、搬東西' },
  { icon: 'push', t: '推得動', d: '推購物車、推門、搬家具' },
  { icon: 'walk', t: '走得穩', d: '單手提重物也不晃' },
  { icon: 'endure', t: '走得久', d: '出門一整天不喊累' },
]

const disciplines = [
  {
    id: 'deadlift',
    n: '01',
    icon: 'lift',
    life: '拿得動',
    name: '六角槓硬舉',
    meta: '肌力',
    desc: '把重量從地上拉起來——就像提起購物袋、搬起箱子、拿起行李。要問的不是「硬舉幾公斤」，是生活需要時，你還拿得動嗎。',
  },
  {
    id: 'sled',
    n: '02',
    icon: 'push',
    life: '推得動',
    name: '推雪橇',
    meta: '爆發力',
    desc: '全身一起出力，把東西往前推——就像推購物車、推門、移動家具。比起需要肩膀高舉的動作，推的方式對很多長輩的身體更友善。',
  },
  {
    id: 'farmer',
    n: '03',
    icon: 'walk',
    life: '走得穩',
    name: '單側農夫走路',
    meta: '核心能力',
    desc: '重量壓在身體單側，還要穩穩走——就像單手提菜、提水、一手拿東西一手做別的事。重點不是提多重，是提著東西還能不能穩穩走回家。',
  },
  {
    id: 'bike',
    n: '04',
    icon: 'endure',
    life: '走得久',
    name: '風扇車',
    meta: '有氧能力',
    desc: '考驗的是體力能不能撐得久——就像出門一整天、爬樓梯、陪家人到處走。要問的不是騎多快，是體力還能不能帶你去想去的地方。',
  },
]

// ── 自我測驗：4 題累加計分，11 分以上／8–10 分／7 分以下三種結果 ──
const quizQuestions = [
  {
    q: '提兩袋菜走回家，你現在的狀況是？',
    opts: [
      { t: '很輕鬆，走多遠都沒問題', v: 3 },
      { t: '可以，但走一段會想放下來休息', v: 2 },
      { t: '有點吃力，希望有人可以分攤', v: 1 },
    ],
  },
  {
    q: '從地上搬起一箱水或行李，你會？',
    opts: [
      { t: '直接彎腰拿起來，沒有問題', v: 3 },
      { t: '可以拿，但會小心翼翼', v: 2 },
      { t: '想找人幫忙比較安心', v: 1 },
    ],
  },
  {
    q: '推超市推車或家裡的家具，感覺如何？',
    opts: [
      { t: '推得動，不會覺得吃力', v: 3 },
      { t: '推得動，但推久了手會痠', v: 2 },
      { t: '比較希望有人一起出力', v: 1 },
    ],
  },
  {
    q: '如果要出門一整天，逛街、爬樓梯、走很多路，你會？',
    opts: [
      { t: '沒問題，回家還有力氣', v: 3 },
      { t: '可以，但下午會開始累', v: 2 },
      { t: '通常撐不到一整天', v: 1 },
    ],
  },
]

const qIndex = ref(0)
const qScore = ref(0)
const qDone = computed(() => qIndex.value >= quizQuestions.length)
const qOutcome = computed(() => {
  if (qScore.value >= 11) {
    return {
      badge: '你已經準備好了',
      msg: '四個面向都跟得上生活，很適合直接來挑戰完整的四項任務，看看今年可以再進步多少。',
    }
  }
  if (qScore.value >= 8) {
    return {
      badge: '從團體賽開始，剛剛好',
      msg: '身體已經有不錯的底子，找 1–2 位同伴一起組隊，彼此分攤，會是很舒服的起點。',
    }
  }
  return {
    badge: '完賽組歡迎你先來看看',
    msg: '現在的你已經很願意動了，這就是最重要的一步。找教練聊聊怎麼安排陪伴，慢慢來就好。',
  }
})
function pickOption(v: number) {
  qScore.value += v
  qIndex.value += 1
}
function restartQuiz() {
  qIndex.value = 0
  qScore.value = 0
}

// ── 團體賽 ──
const teamSteps = [
  { t: '長輩先起頭', d: '每一關都由長輩親自開始動作，這是團體賽唯一堅持的事。' },
  { t: '做不下去就換手', d: '同伴隨時可以接手，不用等長輩喊累才換人，從當下的進度直接接續，不用重來。' },
  { t: '陪伴，不代做', d: '行動不便的長輩可以有一位協助者隨行——推輪椅、攙扶、穩定平衡都可以，這段時間仍算長輩本人在場上。' },
  { t: '時間加總，就是成績', d: '沒有裁判來判斷「他是不是真的做不到」，換人不用申報，也不停表。三個人分攤，本來就比一個人輕鬆。' },
]
const teamNotes = [
  '同伴不限年齡、不限性別，家人、朋友、教練都可以一起上場。',
  '行動不便、需要輪椅的長輩，也有專屬的協助條款可以參加。',
  '80 歲以上長輩參與組別，全程不排名、全體都能拿到完賽證書。',
  '重點從來不是量測誰最強，是讓每個人都真的有下場，走過這四關。',
]
const teamBadges = ['2–3 人一隊', '長輩帶頭', '全員可完賽']

const milestones = [
  { year: '2021', title: '第一屆 聖誕老人硬舉邀請賽', desc: '由練健康團隊內部發起，數十位阿公阿嬤首度披上聖誕戰袍參賽，顛覆社會大眾對高齡重訓危險的偏見。' },
  { year: '2022', title: '第二屆 聖誕老人硬舉大賽', desc: '220 人參賽，規模較首屆翻倍，開始獲得公眾與媒體關注。' },
  { year: '2023', title: '第三屆 聖誕老人硬舉大賽', desc: '225 人參賽，中高齡訓練的風氣逐漸打開，賽事規模持續擴大。' },
  { year: '2024', title: '第四屆 聖誕老人硬舉大賽', desc: '場地擴及華山文創、松山文創等指標場域，報名開放後屢次秒殺額滿。' },
  { year: '2025', title: '第五屆 聖誕老人硬舉大賽', desc: '70 歲以上選手超過 60 人參賽，並獲華視、中央社、BBC、路透社、法新社、新加坡電視台 CNA 等海內外媒體報導。' },
  { year: '2026', title: '第六屆 LKK4 聖誕老人功能錦標賽', desc: '全面進化為涵蓋肌力、爆發力、核心能力與心肺有氧能力四大面向的功能錦標賽。安全、直覺、全齡友善，所有年齡皆可參加。', current: true },
]

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

const faqs = [
  {
    q: '比賽在什麼時候、哪裡舉行？',
    a: '2026 年 12 月 13 日（日）09:00–17:00，台北世貿一館 C 區（台北市信義區信義路五段 5 號），第六屆聖誕老人 LKK4 功能錦標賽。年齡以當天實際歲數計算。',
  },
  {
    q: '做不到規定的重量，還可以參加嗎？',
    a: '可以。LKK4 想驗收的是完成，不是只有名次。未在限時內完成的關卡會以該關的時間上限計算，完賽本身就是這一年最實在的成果。',
  },
  {
    q: '長輩需要坐輪椅或走路不方便，可以報名嗎？',
    a: '可以參加團體賽，並由一位協助者隨行——推輪椅、攙扶、穩定平衡都在協助範圍內。這段時間仍算長輩本人在場上完成，不算換人。',
  },
  {
    q: '完全沒有比賽經驗，第一次來會不會太難？',
    a: '四項任務本來就取材自日常生活的拿、推、走——不需要特殊的競賽經驗。如果一個人有點吃力，還可以找 1–2 位同伴組成團體賽，一起完成。',
  },
  {
    q: '報名費用是多少？',
    a: '早鳥優惠價 NT$2,700、一般報名費 NT$3,000，報名於 2026/10/30 截止。詳細費用與場次資訊請見下方「賽制與報名」，或直接前往 Accupass 活動頁。',
  },
]
</script>

<template>
  <div class="min-h-screen bg-navy-700">
    <!-- ================= Hero ================= -->
    <section class="pt-10 pb-6 lg:pt-16 lg:pb-10">
      <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto">
          <!--
            主視覺是「有標題的完整版」，標題燒在圖裡，所以 alt 要把圖上的字全部寫出來，
            另外保留一個 sr-only 的 h1 給搜尋引擎與螢幕閱讀器。
          -->
          <Lkk4Ticket bunting pad="p-3 lg:p-4">
            <img
              src="/images/lkk4/keyvisual.webp"
              alt="2026 年第六屆 聖誕老人 LKK4 功能錦標賽・十二月十三日・台北世貿一館 C 區・健康是練出來的"
              class="w-full h-auto rounded-2xl"
              width="1600"
              height="800"
            />
          </Lkk4Ticket>
          <h1 class="sr-only">LKK4 聖誕老人功能錦標賽｜2026 年 12 月 13 日・台北世貿一館 C 區</h1>

          <div class="max-w-2xl mx-auto text-center mt-9">
            <p class="text-white/75 text-base lg:text-lg leading-relaxed mb-8">
              不是比誰舉得最重。LKK4 用四個生活裡本來就在做的動作——拿、推、走穩、走久，陪你看看這一年，身體多做到了哪些事。第一次參加也沒關係，完成，本身就是成果。
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                :href="ACCUPASS_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
                </svg>
                立即報名
              </a>
              <a
                href="#quiz"
                class="inline-flex items-center gap-2 border-2 border-cream text-cream font-bold px-8 py-3 rounded-full hover:bg-cream hover:text-navy-800 transition-colors"
              >
                先看看我適不適合
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 四詞卡 ================= -->
    <section class="py-10 lg:py-14">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="w in fourWords"
            :key="w.t"
            class="bg-cream border-[2.5px] border-navy-900 rounded-[20px] px-4 py-6 text-center"
          >
            <div class="w-16 h-16 rounded-full border-[2.5px] border-navy-700 bg-white flex items-center justify-center mx-auto mb-3.5">
              <Lkk4Icon :name="w.icon" class="w-8 h-8" />
            </div>
            <div class="font-serif text-lg lg:text-xl font-black text-navy-800 mb-1">{{ w.t }}</div>
            <div class="text-[13px] text-ink/65 leading-relaxed">{{ w.d }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 四大功能挑戰 ================= -->
    <section id="challenges" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center mb-11">
          <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange-300" />
            Four Challenges
          </div>
          <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">四大功能挑戰</h2>
          <p class="text-white/75 leading-relaxed">
            每一項都翻譯自一個日常動作。真正要問的，不是「你能舉多重」，而是「生活需要你的時候，你還做得到嗎」。
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-4 mb-10">
          <div
            v-for="d in disciplines"
            :key="d.id"
            class="relative bg-cream border-[2.5px] border-navy-900 rounded-[20px] p-6 lg:p-7"
          >
            <div class="absolute top-6 right-7 font-black text-sm text-cream-500">{{ d.n }}</div>
            <div class="w-14 h-14 rounded-full border-[2.5px] border-navy-700 bg-white flex items-center justify-center mb-4">
              <Lkk4Icon :name="d.icon" class="w-7 h-7" />
            </div>
            <div class="font-serif text-2xl font-black text-orange-700 leading-none mb-1.5">{{ d.life }}</div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm font-bold text-ink/70">{{ d.name }}</span>
              <span class="text-[11px] font-bold text-navy-800 bg-navy-700/10 rounded-full px-2 py-0.5">{{ d.meta }}</span>
            </div>
            <p class="text-[15px] text-ink/70 leading-relaxed">{{ d.desc }}</p>
          </div>
        </div>

        <!-- 關卡路線圖 -->
        <div class="max-w-2xl mx-auto">
          <Lkk4Ticket pad="p-3 lg:p-4">
            <img
              src="/images/lkk4/stages.webp"
              alt="LKK4 關卡路線圖：Stage 01 六角槓硬舉，1 分鐘內依序完成不同重量；Stage 02+03 推雪橇與農夫走路，3 分鐘內完成，去回需換手，單項來回共 25 公尺；Stage 04 風扇車，10 分鐘內挑戰完成 3 公里。"
              class="w-full h-auto rounded-2xl"
              width="1100"
              height="1375"
              loading="lazy"
            />
          </Lkk4Ticket>
          <p class="text-center text-[13px] text-white/60 mt-4">
            ＊四項賽制為 2026 年最新修訂標準，詳細官方競賽計分規則將於正式賽前 3 個月完整公告。
          </p>
        </div>
      </div>
    </section>

    <!-- ================= 自我測驗 ================= -->
    <section id="quiz" class="py-14 lg:py-20 scroll-mt-20">
      <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto">
          <Lkk4Ticket pad="p-7 lg:p-11">
            <div class="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-9 items-center">
              <div>
                <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-800 leading-snug mb-3.5">
                  不確定自己適不適合？<br />先花一分鐘看看。
                </h2>
                <p class="text-[15px] text-ink/70 leading-relaxed">
                  四個小問題，不是測驗成績，是想讓你看見自己已經做到的事。回答完，我們會告訴你，從哪裡開始最適合。
                </p>
              </div>

              <div class="bg-white rounded-[20px] p-6 lg:p-7 border-2 border-cream-200">
                <!-- 進度條 -->
                <div class="flex gap-1.5 mb-5" aria-hidden="true">
                  <span
                    v-for="(_, i) in quizQuestions"
                    :key="i"
                    class="flex-1 h-[5px] rounded-full transition-colors"
                    :class="(qDone || i < qIndex) ? 'bg-orange-700' : 'bg-cream-200'"
                  />
                </div>

                <div v-if="!qDone">
                  <p class="font-black text-lg text-navy-800 leading-snug mb-4 min-h-[2.6em]">
                    {{ quizQuestions[qIndex].q }}
                  </p>
                  <div class="flex flex-col gap-2.5">
                    <button
                      v-for="opt in quizQuestions[qIndex].opts"
                      :key="opt.t"
                      type="button"
                      class="text-left text-[15px] text-ink/80 bg-cream/60 border-2 border-cream-200 rounded-xl px-4 py-3 hover:border-orange-700 hover:bg-cream transition-colors"
                      @click="pickOption(opt.v)"
                    >
                      {{ opt.t }}
                    </button>
                  </div>
                </div>

                <div v-else class="text-center">
                  <div class="inline-block font-black text-lg text-orange-700 mb-2">{{ qOutcome.badge }}</div>
                  <p class="text-[15px] text-ink/70 leading-relaxed mb-5">{{ qOutcome.msg }}</p>
                  <a
                    :href="ACCUPASS_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-2.5 rounded-full shadow-lg shadow-orange/30 hover:bg-orange-400 transition-colors"
                  >
                    立即報名
                  </a>
                  <div class="mt-3">
                    <button
                      type="button"
                      class="text-sm text-ink/55 underline underline-offset-4 hover:text-orange-700 transition-colors"
                      @click="restartQuiz"
                    >
                      重新測一次
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Lkk4Ticket>
        </div>
      </div>
    </section>

    <!-- ================= 團體賽 ================= -->
    <section id="team" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center mb-11">
          <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange-300" />
            Team Entry
          </div>
          <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">一個人怕做不到？找個同伴一起來</h2>
          <p class="text-white/75 leading-relaxed">
            70 歲以上的長輩，可以組成 2–3 人的團體賽，不用一個人撐完全程。
          </p>
        </div>

        <div class="max-w-5xl mx-auto">
          <Lkk4Ticket pad="p-7 lg:p-11">
            <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
              <ol class="space-y-6">
                <li v-for="(s, i) in teamSteps" :key="s.t" class="flex gap-4">
                  <span class="w-8 h-8 rounded-full bg-navy-700 text-white text-sm font-black flex items-center justify-center shrink-0">
                    {{ i + 1 }}
                  </span>
                  <div>
                    <div class="font-black text-navy-800 mb-1">{{ s.t }}</div>
                    <p class="text-[15px] text-ink/70 leading-relaxed">{{ s.d }}</p>
                  </div>
                </li>
              </ol>

              <div class="bg-white rounded-[20px] p-6 lg:p-7 border-2 border-cream-200">
                <h3 class="font-serif text-xl font-black text-navy-800 mb-4">不用擔心的幾件事</h3>
                <ul class="space-y-3 mb-6">
                  <li v-for="note in teamNotes" :key="note" class="flex items-start gap-2.5">
                    <svg class="w-5 h-5 text-orange-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-[15px] text-ink/70 leading-relaxed">{{ note }}</span>
                  </li>
                </ul>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="b in teamBadges"
                    :key="b"
                    class="text-xs font-bold text-navy-800 bg-cream border border-navy-700/15 rounded-full px-3 py-1"
                  >
                    {{ b }}
                  </span>
                </div>
              </div>
            </div>
          </Lkk4Ticket>
        </div>
      </div>
    </section>

    <!-- ================= 賽事緣起 ================= -->
    <section id="story" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-6 items-start">
          <!-- 為什麼從 1 變成 4 -->
          <Lkk4Ticket pad="p-7 lg:p-11">
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-800 leading-snug mb-5">
              為什麼從「1」變成「4」？
            </h2>
            <div class="space-y-4 text-[15px] text-ink/70 leading-relaxed">
              <p>過去，練健康的年度賽事只有六角槓硬舉一項。它能告訴你肌力進步了多少，卻回答不了另一個問題：一個人硬舉很強，身體就一定夠用嗎？</p>
              <p>不一定。身體能不能撐起生活，從來不是只看一種能力。能把東西從地上拿起來，也要能推得動、能提著重物穩穩走、能走一整天不累。</p>
              <p class="font-serif text-lg lg:text-xl font-black text-navy-800 border-l-4 border-orange-700 pl-4 py-1 leading-relaxed">
                健康不是一個數字，是四個面向合在一起，還能不能繼續過自己想過的生活。
              </p>
              <p>所以今年，LKK4 把單一項目擴大成四項生活任務。不是為了讓比賽變難，而是想讓每個人第一次把自己的身體能力「攤開來看」。</p>
              <p>台灣已邁入超高齡社會，中高齡族群的健康與生活能力，將成為整個社會的重要議題。我們想傳達的觀念是：<strong class="text-navy-800">體能不只是運動表現，而是支撐日常生活的重要能力。</strong></p>
            </div>
          </Lkk4Ticket>

          <!-- 里程碑 -->
          <Lkk4Ticket pad="p-7 lg:p-11">
            <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
              <span class="w-5 h-0.5 bg-orange-700" />
              Milestones
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-800 mb-7">賽事緣起與里程碑</h2>
            <div>
              <div
                v-for="(m, i) in milestones"
                :key="m.year"
                class="relative flex gap-4 pb-7 last:pb-0"
              >
                <div class="flex flex-col items-center shrink-0">
                  <div
                    class="w-3.5 h-3.5 rounded-full"
                    :class="m.current ? 'bg-orange-700 ring-4 ring-orange-700/20' : 'bg-navy-700'"
                  />
                  <div v-if="i < milestones.length - 1" class="w-0.5 flex-1 bg-navy-700/15 mt-1" />
                </div>
                <div class="-mt-1.5 pb-1">
                  <div class="font-serif text-xl font-black text-navy-800 leading-none mb-1.5">{{ m.year }}</div>
                  <div class="font-bold text-[15px] text-ink mb-1">{{ m.title }}</div>
                  <p class="text-sm text-ink/65 leading-relaxed">{{ m.desc }}</p>
                </div>
              </div>
            </div>
          </Lkk4Ticket>
        </div>
      </div>
    </section>

    <!-- ================= 賽制與報名（硬資訊，2026-09-01 改版時保留並移到後段）================= -->
    <section id="rules" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center mb-11">
          <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange-300" />
            Rules &amp; Entry
          </div>
          <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">賽制與報名資訊</h2>
          <p class="text-white/75 leading-relaxed">組別、費用、關卡計分、重量與距離、選手 T 尺寸，都在這裡。</p>
        </div>

        <div class="max-w-5xl mx-auto">
          <Lkk4Ticket pad="p-7 lg:p-11">
            <!-- 活動資訊 -->
            <div class="grid sm:grid-cols-2 gap-4 mb-12">
              <div class="flex items-start gap-3 bg-white rounded-2xl p-5 border-2 border-cream-200">
                <svg class="w-6 h-6 text-orange-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div class="text-xs text-ink/55 font-semibold tracking-wide mb-1">活動日期</div>
                  <div class="font-bold text-navy-800">2026 年 12 月 13 日（日）</div>
                  <div class="text-sm text-ink/65">09:00 – 17:00</div>
                </div>
              </div>
              <div class="flex items-start gap-3 bg-white rounded-2xl p-5 border-2 border-cream-200">
                <svg class="w-6 h-6 text-orange-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div class="text-xs text-ink/55 font-semibold tracking-wide mb-1">活動地點</div>
                  <div class="font-bold text-navy-800">台北世貿一館 C 區</div>
                  <div class="text-sm text-ink/65">台北市信義區信義路五段 5 號</div>
                </div>
              </div>
            </div>

            <!-- 比賽組別 -->
            <h3 class="font-serif text-2xl font-black text-navy-800 mb-2">比賽組別與預計選手人數</h3>
            <p class="text-[15px] text-ink/70 leading-relaxed mb-6">
              39 歲以下、40–49 歲、50–59 歲、60–69 歲、70–79 歲，各分男女組共十組，另特別加開 80 歲以上不分性別的長者推廣組。
            </p>
            <div class="grid md:grid-cols-3 gap-4 mb-12">
              <div
                v-for="g in competitionGroups"
                :key="g.key"
                class="bg-white rounded-2xl p-6 border-2 border-cream-200"
              >
                <div class="flex items-baseline gap-2 mb-4">
                  <h4 class="font-serif text-xl font-black text-navy-800">{{ g.label }}</h4>
                  <span class="text-xs font-bold text-orange-700 bg-orange-50 rounded-full px-2.5 py-0.5">{{ g.count }}</span>
                </div>
                <ul class="space-y-1.5">
                  <li v-for="item in g.items" :key="item" class="flex items-center gap-2 text-sm text-ink/70">
                    <span class="w-1.5 h-1.5 rounded-full bg-orange-700 shrink-0" />
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- 報名費用 -->
            <h3 class="font-serif text-2xl font-black text-navy-800 mb-6">報名費用</h3>
            <div class="grid sm:grid-cols-2 gap-4 mb-4">
              <div
                v-for="fee in entryFees"
                :key="fee.name"
                class="rounded-2xl p-6 border-2"
                :class="fee.current ? 'bg-orange-50 border-orange-700/35' : 'bg-white border-cream-200'"
              >
                <div class="text-sm font-bold mb-1" :class="fee.current ? 'text-orange-700' : 'text-ink/55'">{{ fee.name }}</div>
                <div class="font-serif text-3xl font-black text-navy-800 mb-2">
                  NT$ {{ fee.price }}<span class="text-base font-bold text-ink/55"> / 人</span>
                </div>
                <div class="text-sm text-ink/65">{{ fee.period }}</div>
              </div>
            </div>
            <div class="bg-white rounded-xl px-5 py-3.5 text-sm text-ink/70 border-2 border-cream-200 mb-12">
              賽程預計於 <strong class="text-navy-800">2026/11/6（星期五）前</strong>公佈。
            </div>

            <!-- 比賽方式與計分 -->
            <h3 class="font-serif text-2xl font-black text-navy-800 mb-6">比賽方式與計分說明</h3>
            <ol class="space-y-3 mb-8">
              <li v-for="(rule, i) in raceRules" :key="i" class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-full bg-orange-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {{ i + 1 }}
                </span>
                <span class="text-[15px] text-ink/70 leading-relaxed">{{ rule }}</span>
              </li>
            </ol>

            <div class="grid md:grid-cols-3 gap-4 mb-12">
              <div
                v-for="st in stations"
                :key="st.n"
                class="bg-white rounded-2xl p-6 border-2 border-cream-200"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-bold text-white bg-navy-700 rounded-full px-2.5 py-0.5">{{ st.n }}</span>
                  <span class="text-xs font-bold text-orange-700 bg-orange-50 rounded-full px-2.5 py-0.5">{{ st.limit }}</span>
                </div>
                <h4 class="font-serif text-xl font-black text-navy-800 mb-3">{{ st.name }}</h4>
                <ul class="space-y-1.5">
                  <li v-for="pt in st.points" :key="pt" class="flex items-start gap-2 text-sm text-ink/70 leading-relaxed">
                    <span class="text-orange-700 mt-0.5">・</span>{{ pt }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- 重量與距離 -->
            <h3 class="font-serif text-2xl font-black text-navy-800 mb-6">重量與距離說明</h3>
            <div class="overflow-x-auto mb-12 rounded-2xl border-2 border-cream-200">
              <table class="w-full min-w-[640px] text-sm bg-white">
                <thead>
                  <tr class="bg-navy-700 text-white">
                    <th rowspan="2" class="text-left font-bold px-4 py-3 align-middle">組別</th>
                    <th colspan="3" class="font-bold px-4 py-2 border-l border-white/15">第一關｜六角槓硬舉 (kg)</th>
                    <th rowspan="2" class="font-bold px-4 py-3 align-middle border-l border-white/15">第二關<br />推雪橇 (kg)</th>
                    <th rowspan="2" class="font-bold px-4 py-3 align-middle border-l border-white/15">第二關<br />單側農夫走路 (kg)</th>
                    <th rowspan="2" class="font-bold px-4 py-3 align-middle border-l border-white/15">第三關<br />風扇車 (km)</th>
                  </tr>
                  <tr class="bg-navy-800 text-white">
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
                    <td class="px-4 py-3 font-semibold text-navy-800 whitespace-nowrap">{{ row.group }}</td>
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

            <!-- 選手 T 尺寸 -->
            <h3 class="font-serif text-2xl font-black text-navy-800 mb-2">選手 T 尺寸表</h3>
            <p class="text-[15px] text-ink/70 leading-relaxed mb-6">Model 試穿狀況，提供你挑選尺寸時參考。</p>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
              <div
                v-for="(f, i) in tshirtFits"
                :key="i"
                class="flex items-center gap-4 bg-white rounded-xl px-5 py-4 border-2 border-cream-200"
              >
                <div class="font-serif text-2xl font-black text-orange-700 w-10 shrink-0">{{ f.size }}</div>
                <div class="text-sm text-ink/70 leading-relaxed">
                  {{ f.body }}／{{ f.height }}／{{ f.weight }}<br />
                  <span class="text-ink/55">穿著感受{{ f.fit }}</span>
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
          </Lkk4Ticket>
        </div>
      </div>
    </section>

    <!-- ================= 歷年成績查詢 ================= -->
    <section class="py-8 lg:py-10">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <Lkk4Ticket pad="p-7 lg:p-10">
            <div class="text-center">
              <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-3">
                <span class="w-5 h-0.5 bg-orange-700" />
                Past Results
              </div>
              <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-800 mb-6">
                查詢歷屆選手的參賽成績與排名紀錄
              </h2>
              <NuxtLink
                to="/personal-record"
                class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                參賽成績查詢
              </NuxtLink>
            </div>
          </Lkk4Ticket>
        </div>
      </div>
    </section>

    <!-- ================= FAQ ================= -->
    <section id="faq" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center mb-11">
          <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange-300" />
            FAQ
          </div>
          <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">常見問題</h2>
          <p class="text-white/75 leading-relaxed">報名前，你可能會想先知道的事。</p>
        </div>

        <div class="max-w-3xl mx-auto">
          <Lkk4Ticket pad="p-5 lg:p-8">
            <details
              v-for="(f, i) in faqs"
              :key="i"
              class="group border-b border-navy-700/12 last:border-b-0"
            >
              <summary class="cursor-pointer list-none flex items-start justify-between gap-4 py-4 select-none">
                <span class="font-bold text-navy-800 leading-relaxed">{{ f.q }}</span>
                <span class="text-2xl leading-none text-orange-700 shrink-0 mt-0.5 transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p class="text-[15px] text-ink/70 leading-relaxed pb-5 pr-8">{{ f.a }}</p>
            </details>
          </Lkk4Ticket>
        </div>
      </div>
    </section>

    <!-- ================= 最終 CTA ================= -->
    <section id="register" class="py-14 lg:py-20 scroll-mt-20">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <Lkk4Ticket pad="p-8 lg:p-12">
            <div class="text-center">
              <h2 class="font-serif text-2xl lg:text-4xl font-black text-navy-800 leading-snug mb-4">
                去年做不到的事，<br class="sm:hidden" />今年的你，做得到多少了？
              </h2>
              <p class="text-[15px] lg:text-base text-ink/70 leading-relaxed mb-7">
                不用先變強才能報名。帶著現在的身體來就好，剩下的，讓四個關卡陪你看見。
              </p>
              <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-bold text-navy-800 mb-8">
                <span class="bg-cream-200 rounded-full px-4 py-1.5">2026 年 12 月 13 日</span>
                <span class="bg-cream-200 rounded-full px-4 py-1.5">台北世貿一館 C 區</span>
                <span class="bg-cream-200 rounded-full px-4 py-1.5">第六屆</span>
              </div>
              <a
                :href="ACCUPASS_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-orange text-white font-bold px-9 py-3.5 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
                </svg>
                立即報名 LKK4
              </a>
            </div>
          </Lkk4Ticket>
        </div>
      </div>
    </section>
  </div>
</template>
