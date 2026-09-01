<script setup lang="ts">
// 研習課程（原「練健康學院」，2026-08-31 依業主提供的設計稿改版）
// ⚠️ 「10,000+ 服務人次」必須與 pages/about.vue 的 keyStats 一致。
//    設計稿原寫「6,000+ 位學員」，與 /about 的「10,000+ 累計服務人次」數字與單位都不同，
//    業主 2026-08-31 決定統一採用 /about 那組。改其中一邊時記得兩邊一起改。
// 網址維持 /lkk-academy 不變，保留既有的 SEO 累積；標題與內容改為「研習課程」。
// 相對於改版前：刪除「課程總覽」「學習地圖」，課程由 5 門收斂為 3 門
// （移除【解剖生物力學】與【高效指導語與動作拆解實戰課】）。
useHead({
  title: '研習課程｜練健康 LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '練健康研習課程，整合 10,000+ 服務人次與中高齡、特殊族群訓練實務，提供訓練營、中高齡訓練研習與鷹眼大師課程，涵蓋評估、訓練規劃、動作判讀與現場教學，培養真正能落地的教練專業。',
    },
  ],
})

const problems = [
  { n: '01', t: '學用落差', d: '缺乏系統化管道，難以將書本上的「基礎理論」轉化為現場的「有效教學」。知道原理，不代表遇到不同學員時，能立刻做出適合的調整。' },
  { n: '02', t: '特殊族群缺口', d: '傳統肌力訓練教學多以年輕族群為主；面對高齡、慢性病、術後，或身體限制較多的學員，更需要相對應的訓練知識、風險判斷與指導技巧。' },
]

// ⚠️ 三張課程圖業主尚未提供，img 先留空 → 顯示占位圖示。
//    規格：16:10、建議 1200x750 以上，放 public/images/academy/*.webp
const courses = [
  {
    slug: 'coach-development',
    idx: '01 · COACH DEVELOPMENT PROGRAM',
    t: '徵才說明會暨訓練營',
    navEn: 'Coach Development',
    img: '',
    quote: '「我想轉職來練健康當教練，但不確定自己是否有能力帶中高齡學員訓練。」',
    desc: [
      '想一起為中高齡訓練盡一份心力？想要跨領域不知道怎麼跨出那一步？說明會我們將完整說明教練升遷路徑，並分享練健康組織架構及未來展望。第一階段說明會為免費！',
      '第二階段訓練營專門為有意加入的夥伴或是想釐清實務訓練的人設計，透過完整培訓及實務演練，讓你在陪伴中高齡訓練的路上更踏實有信心！',
    ],
    points: [
      { k: '學科培訓', v: '建立中高齡與一般大眾訓練所需的核心知識。' },
      { k: '術科實作', v: '從動作示範、口令到現場修正，把知道的內容真正教得出來。' },
      { k: '考核驗證', v: '透過實作與考核確認學習成果，建立更完整的教學能力。' },
    ],
    // ⚠️ 業主 2026-08-31 只提供了說明會日期；訓練營日期沿用改版前既有的四組
    //    （03/07、06/13、09/05、12/05），依時序推斷各自對應同一梯次的說明會
    //    （說明會皆早於訓練營約一個月）。此對應關係待業主確認。
    dates: [
      { k: '第一梯次', rows: [{ k: '說明會', v: '2/7' }, { k: '訓練營', v: '03/07–03/08、03/21–03/22' }] },
      { k: '第二梯次', rows: [{ k: '說明會', v: '5/30' }, { k: '訓練營', v: '06/13–06/14、06/27–06/28' }] },
      { k: '第三梯次', rows: [{ k: '說明會', v: '8/22' }, { k: '訓練營', v: '09/05–09/06、09/19–09/20' }] },
      { k: '第四梯次', rows: [{ k: '說明會', v: '10/31' }, { k: '訓練營', v: '11/07–11/08、11/28–11/29' }] },
    ],
    href: 'https://www.surveycake.com/s/W2y4Z',
    cta: '免費報名說明會點我 →',
  },
  {
    slug: 'elderly-wellness',
    idx: '02 · WORKSHOP FOR MIDDLE-AGE AND ELDERLY WELLNESS',
    t: '中高齡訓練研習',
    navEn: 'Elderly Wellness',
    img: '',
    // 業主 2026-08-31 定稿：中標由原本的引號句改為敘述句
    quote: '帶學員從衰弱恢復健康',
    desc: [
      '練健康累積近萬位個案訓練經驗，過半為中高齡族群。本研習整合醫師、物理治療師與肌力體能教練專業，從身體評估、常見疾病、安全考量，到訓練進退階與課表規劃，透過理論、實作與個案演練，培養教練面對中高齡及特殊族群時，能安全評估、有效訓練並建立醫療轉介判斷的實務能力。',
    ],
    points: [
      { k: '填補市場缺口', v: '學習如何應對「非結構異常」但有身體限制的特殊族群。' },
      { k: '醫體整合', v: '融合病理學與實務訓練，學習安全評估與風險控管，讓指導更安全、更有信心。' },
      { k: '功能性導向', v: '目標不是破 PR，而是協助學員恢復生活自理能力，例如穩定行走、降低跌倒風險。' },
    ],
    dates: [
      { k: '第一梯次', v: '05/09–05/10、05/16–05/17' },
      { k: '第二梯次', v: '11/14–11/15、11/21–11/22' },
    ],
    href: 'https://www.surveycake.com/s/DraAb',
  },
  {
    slug: 'eagle-eye',
    idx: '03 · EAGLE EYE DETECTIVE WORKSHOP',
    t: '鷹眼大師',
    navEn: 'Eagle Eye Detective',
    img: '',
    // 業主 2026-08-31 定稿：中標由引號句改為敘述句
    quote: '找出問題根源，真正解決學員問題',
    desc: [
      '培養教練精準判讀學員動作的觀察力，從現場快速抓出動作代償與風險，並掌握對應的調整策略，讓指導更即時、更到位。這堂課要訓練的，不只是「看見不一樣」，而是知道接下來該怎麼處理。',
    ],
    points: [
      { k: '精準評估', v: '從靜態評估連結到動態檢測，逐步找出可能的問題來源。' },
      { k: '實戰解法', v: '面對不對稱、動作歪斜與不明痠痛，透過實際案例訓練調整，而非只會照表操課。' },
      { k: '建立信心', v: '理解教練可以處理的範圍與轉介界線，精準提升動作品質。' },
    ],
    dates: [
      { k: '第一梯次', v: '06/20–06/21' },
      { k: '第二梯次', v: '10/17–10/18' },
    ],
    href: 'https://www.surveycake.com/s/1QavK',
  },
]

// 為什麼選擇（2026-08-31 業主定稿）
// 「近萬位個案」與本頁的「10,000+ 服務人次」及 /about 的 keyStats 一致。
const whyUs = [
  {
    n: '01',
    t: '第一線，你一定會遇到中高齡與特殊族群',
    d: '中高齡學員越來越多，伴隨慢性病、術後、疼痛或活動限制的個案，也早已出現在日常訓練現場。如何判斷能不能練、怎麼練、何時該轉介，是教學中高齡者必須具備的能力。',
  },
  {
    n: '02',
    t: '實證為王，近萬位個案淬鍊出的實務方法',
    d: '課程濃縮練健康近萬位個案的第一線經驗，整合醫師、物理治療師與肌力體能教練專業。從真實個案出發，把理論轉化成能直接運用的評估、判斷、指導與進退階方法。',
  },
  {
    n: '03',
    t: '從「知道怎麼練」到「真的敢帶」',
    d: '面對中風、骨質疏鬆、帕金森氏症、術後等不同狀況，教練需要的不只是動作知識，更需要知道怎麼評估、怎麼調整、怎麼降低風險。透過實作、個案演練與考核，建立面對特殊族群的實戰能力與信心。',
  },
]
</script>

<template>
  <div class="min-h-screen bg-cream">

    <!-- HERO -->
    <section class="relative bg-navy-700 text-white pt-16 overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_82%_25%,rgba(251,114,10,0.12)_0%,transparent_55%),radial-gradient(circle_at_4%_80%,rgba(58,106,133,0.35)_0%,transparent_45%)]" />
      <div class="container mx-auto px-4 relative z-10 py-14 lg:py-20">
        <div class="max-w-3xl">
          <div class="flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-4">
            <span class="w-5 h-0.5 bg-orange" />
            Programs
            <span class="text-white/65 tracking-normal normal-case font-medium">・研習課程</span>
          </div>
          <h1 class="font-serif text-4xl lg:text-5xl font-black leading-tight mb-5">
            把實務經驗，<span class="text-orange-300">變成教得會的方法</span>
          </h1>
          <div class="w-14 h-1 bg-orange rounded-full mb-6" />
          <p class="text-white/70 text-lg font-light leading-relaxed mb-8">
            從中高齡與特殊族群訓練，到動作觀察與教學實戰，我們把第一線累積的方法整理成循序漸進的研習課程，幫助教練把知識真正帶進現場。
          </p>
          <a href="#courses" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            查看研習課程 →
          </a>
        </div>
      </div>
    </section>

    <!--
      課程快速導覽（2026-09-01 業主指定，同日依回饋改版）。
      改版前是三張白色卡片：桌機上卡片很寬、文字只佔左側，箭頭被 ml-auto 推到最右，
      中間空一大塊；手機版則是三張全寬卡直接堆疊，很佔高度。
      現在改成「白色導覽列 + 分隔線切三段」——沒有卡片就沒有空卡問題，
      手機自然變成緊湊的三列（每列約 56px），桌機由分隔線界定三個區域。

      對比實測（白底）：編號 orange-700 5.18、標題 navy-700 8.37、
      英文標 navy-800/70 5.04、箭頭 navy-700/70 3.85（圖示門檻 3.0）——全過。
      ⚠️ 英文標不可改用 navy-700 的半透明版：navy-700 在任何透明度下都過不了 4.5。

      錨點是 courses 陣列的 slug，article 上有同名 id 與 scroll-mt-24（避開固定 Header）。
    -->
    <section class="bg-white border-b border-navy-700/12">
      <div class="container mx-auto px-4">
        <nav aria-label="研習課程快速導覽">
          <ul class="grid sm:grid-cols-3 divide-y divide-navy-700/10 sm:divide-y-0 sm:divide-x">
            <li v-for="(c, i) in courses" :key="c.slug">
              <a
                :href="`#${c.slug}`"
                class="group flex items-center gap-3.5 py-4 sm:py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0 transition-colors"
              >
                <span class="font-serif text-xl lg:text-2xl font-black text-orange-700 leading-none shrink-0 tabular-nums">
                  {{ String(i + 1).padStart(2, '0') }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="hidden lg:block text-[10.5px] font-bold text-navy-800/70 tracking-[0.14em] uppercase truncate mb-0.5">
                    {{ c.navEn }}
                  </span>
                  <span class="block font-bold text-navy-700 leading-snug group-hover:text-orange-700 transition-colors">
                    {{ c.t }}
                  </span>
                </span>
                <svg
                  class="w-4 h-4 shrink-0 text-navy-700/70 transition-transform group-hover:translate-y-0.5 group-hover:text-orange-700"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </section>

    <!-- 為什麼開設研習課程 -->
    <section class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-[.78fr_1.22fr] gap-10 lg:gap-16 items-start">

          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-4">
              <span class="w-5 h-0.5 bg-orange-700" />
              Why We Teach
            </div>
            <span class="block font-serif text-6xl lg:text-7xl font-black text-orange leading-none tracking-tight mb-5">10,000+</span>
            <h2 class="font-serif text-xl lg:text-2xl font-black text-navy-700 mb-4 leading-snug">
              從真實個案裡，找到教練現場真正需要的方法
            </h2>
            <p class="text-ink/70 leading-relaxed">
              練健康自成立以來，累計服務超過 10,000 人次，其中近 50% 為中高齡及特殊族群個案。這些第一線經驗，也是研習課程最重要的起點。
            </p>
          </div>

          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-4">
              <span class="w-5 h-0.5 bg-orange-700" />
              From Knowing to Coaching
              <span class="text-navy-800/70 tracking-normal normal-case font-medium">・從知道，到真的會教</span>
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-5 leading-snug">
              為什麼練健康要開設研習課程？
            </h2>
            <p class="text-ink/70 leading-relaxed mb-8">
              在實務現場，我們看見許多教練，以及想成為教練的人，反覆遇到相似的難題。真正困難的，往往不是「有沒有學過」，而是能不能在學員站到面前時，做出正確判斷與有效教學。
            </p>

            <div class="border-t border-navy-700/15">
              <div v-for="p in problems" :key="p.n" class="grid grid-cols-[40px_1fr] gap-4 py-6 border-b border-navy-700/15">
                <span class="font-serif text-sm font-black text-orange pt-1">{{ p.n }}</span>
                <div>
                  <h3 class="font-serif text-lg font-black text-navy-700 mb-2">{{ p.t }}</h3>
                  <p class="text-ink/65 text-sm leading-relaxed">{{ p.d }}</p>
                </div>
              </div>
            </div>

            <p class="text-ink/70 leading-relaxed mt-7">
              為了回應這些需求，我們整合學科與術科的專業，設計出循序漸進的研習課程。不論你是剛入門、想補強基礎的教練，還是希望在職涯中持續精進、拓展專業，都能在這裡找到實用且符合現場需求的學習資源。
            </p>
            <p class="text-ink/70 leading-relaxed mt-4">
              <strong class="text-navy-700">專業教練的養成不只需要知識，更需要能落地的解法。</strong>練健康希望為你搭建一座從「正確練」到「好會教」的橋樑。
            </p>
          </div>

        </div>
      </div>
    </section>

    <!-- 課程列表 -->
    <section id="courses" class="bg-white py-14 lg:py-20 scroll-mt-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-4">
          <span class="w-5 h-0.5 bg-orange-700" />
          Current Programs
          <span class="text-navy-800/70 tracking-normal normal-case font-medium">・開放報名</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-4 leading-snug">
          把現場遇到的問題，<br class="hidden sm:block" />變成真正用得上的能力
        </h2>
        <p class="text-ink/65 leading-relaxed max-w-3xl mb-10 lg:mb-14">
          每一門課都從實際教學情境出發。你不只會學到「怎麼做」，也會理解「為什麼這樣做」，並知道何時該調整、何時該進退階，以及自己的專業界線在哪裡。
        </p>

        <div>
          <article
            v-for="(c, i) in courses"
            :id="c.slug"
            :key="c.t"
            class="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start py-10 lg:py-16 border-t border-navy-700/15 first:border-t-0 first:pt-0 scroll-mt-24"
          >
            <!-- 偶數項圖片換到右邊 -->
            <div :class="['relative overflow-hidden rounded-sm bg-cream-200 border border-navy-700/12', i % 2 === 1 ? 'lg:order-2' : '']">
              <img v-if="c.img" :src="c.img" :alt="`練健康${c.t}課程`" loading="lazy" class="w-full aspect-[16/10] object-cover" />
              <div v-else class="w-full aspect-[16/10] flex items-center justify-center text-navy-700/20">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div>
              <p class="flex items-center gap-3 text-xs font-bold text-orange-700 tracking-widest uppercase mb-4">
                {{ c.idx }}
                <span class="w-8 h-px bg-orange-700" />
              </p>
              <h3 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 mb-4">{{ c.t }}</h3>
              <p class="font-serif font-bold text-lg lg:text-xl text-navy-700 leading-relaxed mb-5 pl-4 border-l-[3px] border-orange">
                {{ c.quote }}
              </p>
              <p v-for="(d, di) in c.desc" :key="di" class="text-ink/65 leading-relaxed mb-4">{{ d }}</p>

              <details class="group mt-2">
                <summary class="cursor-pointer list-none text-sm font-bold text-navy-700 hover:text-orange transition-colors select-none">
                  <span class="group-open:hidden">＋ 查看完整課程介紹</span>
                  <span class="hidden group-open:inline">－ 收起課程介紹</span>
                </summary>
                <ul class="mt-5 border-t border-navy-700/15">
                  <li v-for="pt in c.points" :key="pt.k" class="grid sm:grid-cols-[145px_1fr] gap-1 sm:gap-4 py-4 border-b border-navy-700/15 text-sm leading-relaxed text-ink/65">
                    <strong class="font-serif text-navy-700">{{ pt.k }}</strong>
                    <span>{{ pt.v }}</span>
                  </li>
                </ul>
              </details>

              <div class="mt-7 pt-6 border-t border-navy-700/15">
                <div class="flex items-baseline justify-between mb-3">
                  <b class="font-serif text-navy-700">2026 開課梯次</b>
                  <span class="text-[11px] tracking-widest uppercase text-navy-700/40">Course Dates</span>
                </div>
                <ul>
                  <li v-for="d in c.dates" :key="d.k" class="py-2 border-b border-navy-700/10 text-sm">
                    <!-- 有 rows 的梯次（說明會／訓練營）拆成子列，其餘維持單列 -->
                    <template v-if="d.rows">
                      <b class="text-navy-700 font-serif block mb-1.5">【{{ d.k }}】</b>
                      <div v-for="r in d.rows" :key="r.k" class="flex flex-wrap items-baseline gap-x-3 pl-4 py-0.5">
                        <span class="text-navy-700 font-medium min-w-[3.5rem]">{{ r.k }}</span>
                        <span class="text-ink/65">{{ r.v }}</span>
                      </div>
                    </template>
                    <div v-else class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <b class="text-navy-700 font-serif">{{ d.k }}</b>
                      <span class="text-ink/65">{{ d.v }}</span>
                    </div>
                  </li>
                </ul>
                <p class="text-xs text-ink/45 mt-3">※ 實際開課日期與報名狀態以最新公告及報名頁為準。</p>
              </div>

              <div class="mt-6">
                <a :href="c.href" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
                  {{ c.cta || '立即報名 →' }}
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 為什麼選擇 -->
    <section class="bg-navy-700 text-white py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-4">
          <span class="w-5 h-0.5 bg-orange" />
          Why LKK Programs
          <span class="text-white/65 tracking-normal normal-case font-medium">・為什麼選擇練健康研習課程</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black mb-10 leading-snug">
          不只教你「怎麼做」，<br class="hidden sm:block" />更讓你知道「為什麼這樣做」
        </h2>
        <div class="border-t border-white/15">
          <div v-for="w in whyUs" :key="w.n" class="grid grid-cols-[40px_1fr] gap-4 lg:gap-8 py-7 border-b border-white/15">
            <span class="font-serif text-sm font-black text-orange-300 pt-1">{{ w.n }}</span>
            <div>
              <h3 class="font-serif text-lg lg:text-xl font-black mb-2">{{ w.t }}</h3>
              <p class="text-white/70 text-sm lg:text-base leading-relaxed">{{ w.d }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 講師團隊 CTA（2026-08-31 業主指定改為米色底，文字改深色）-->
    <section class="bg-cream py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange-700 tracking-widest uppercase mb-4">
              <span class="w-5 h-0.5 bg-orange-700" />
              Faculty
              <span class="text-navy-800/70 tracking-normal normal-case font-medium">・講師團隊</span>
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 leading-snug mb-4">
              結合臨床醫療與實務訓練<br class="hidden sm:block" />專業的講師陣容
            </h2>
            <p class="text-ink/70 leading-relaxed">
              所有講師皆經嚴格培訓與實戰驗證，專注提供安全、有效且可持續的訓練解決方案。
            </p>
          </div>
          <div class="lg:justify-self-end">
            <!-- ⚠️ 設計稿此處寫死 dev 站網址，改為站內相對路徑 -->
            <NuxtLink to="/lkk-lecturer" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
              認識講師團隊 →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
