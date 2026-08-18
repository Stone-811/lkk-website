<script setup lang="ts">
useHead({
  title: '關於練健康｜LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '練健康是一間專注於中高齡、術後及特殊健康族群的肌力訓練中心。2018 年成立於台北，四間直營分店，故事登上 BBC、路透社、法新社與美聯社。健康，是練出來的。',
    },
  ],
})

const heroPills = [
  { k: '成立', v: '2018 年 6 月' },
  { k: '分店', v: '台北・新北 4 間' },
  { k: '國際報導', v: 'BBC・Reuters・AFP' },
]

const sectionNav = [
  { id: 'brand', label: '品牌主張' },
  { id: 'who', label: '我們是誰' },
  { id: 'history', label: '發展歷程' },
  { id: 'team', label: '經營團隊' },
  { id: 'lkk4', label: '聖誕硬舉大賽' },
  { id: 'media', label: '媒體報導' },
  { id: 'programs', label: '課程與活動' },
  { id: 'locations', label: '分店' },
]

const stats = [
  { n: '1,000+', l: '服務學員' },
  { n: '4', l: '直營分店' },
  { n: '7+ 年', l: '深耕中高齡' },
  { n: '70%', l: '學員 50 歲以上' },
]

const brandPillars = [
  '中高齡等特殊族群訓練中心',
  '知識科普轉譯平台',
  '醫療背景從業人員把關',
  '安全且有效的訓練環境',
]

const timeline = [
  { y: '2018', t: '練健康成立', d: '第一間專為中高齡打造的肌力訓練中心在台北誕生，把「長輩也能重訓」變成可能。' },
  { y: '2019–2023', t: '展店台北・新北', d: '陸續成立南京、松江、西門、七張四間直營分店，全部鄰近捷運，讓長輩就近安全訓練。' },
  { y: '2021', t: '首屆聖誕老人硬舉大賽', d: '把中高齡的力量搬上舞台，成為練健康的年度指標賽事，後發展為 LKK4 全齡體能挑戰賽。' },
  { y: '2024', t: 'BBC・路透社・法新社 國際報導', d: '90 歲帕金森氏症阿嬤參賽的故事登上三大國際通訊社，台灣中高齡訓練被世界看見。' },
  { y: '2026', t: '美聯社 AP 專題', d: '89 與 91 歲阿嬤持續訓練，獲美聯社影音報導——年齡不是健康的限制。' },
]

const managementTeam = [
  {
    id: '1',
    name: '黃元杰',
    nickname: '肥老闆',
    title: '創辦人暨執行長',
    photo: '/images/team/huang-yuanjie.png',
    description: '練健康創辦人，擁有經濟學碩士背景，曾任職於健身產業行銷與國際產品管理。深知台灣中高齡族群的運動需求，創立練健康，致力打造最專業的中高齡健身品牌。',
    credentials: ['IHFI 台灣 CPT 國際健康體適能專業人員', 'CPR + AED 認證', '台大農經所碩士'],
  },
  {
    id: '2',
    name: '曾子桓',
    nickname: 'Giwane',
    title: '訓練部區域經理・肌力與體能教練',
    photo: '/images/team/tseng-tzuhuan.png',
    description: '專精於肌力與體能訓練、運動表現提升及中高齡族群訓練。具備豐富的運動員培訓經驗，負責練健康教練團隊的訓練品質把關。',
    credentials: ['NSCA-CSCS', 'TSCA-SCC', 'SMA 運動總監認證', 'ASCA-VBT', 'AFAA-WT'],
  },
  {
    id: '3',
    name: '鄭宇劭',
    nickname: 'Bob',
    title: '總教練',
    photo: '/images/team/cheng-yushao.png',
    description: '物理治療師背景，專精於運動傷害防護與中高齡肌力訓練。曾擔任競速滑冰世界盃隨隊體能訓練師，將專業運動員的訓練方法融入中高齡健身課程。',
    credentials: ['物理治療師證照', 'NSCA-CSCS', 'NASM-CES', 'C 級肌力與體能教練'],
  },
]

const mediaOutlets = ['AP 美聯社', 'BBC', 'Reuters 路透社', 'AFP 法新社', 'CNA Insider', '天下雜誌', '大愛新聞', 'TVBS']

const branches = [
  { name: '南京店', desc: '台北市中山區・松江南京站', slug: 'nanjing' },
  { name: '松江店', desc: '台北市中山區・松江南京站', slug: 'songjiang' },
  { name: '西門店', desc: '台北市中正區・西門站', slug: 'ximending' },
  { name: '七張店', desc: '新北市新店區・七張站', slug: 'xindian' },
]
</script>

<template>
  <div class="bg-cream min-h-screen">
    <!-- Hero -->
    <section class="relative bg-navy-700 pt-16 overflow-hidden text-white">
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(251,114,10,0.12)_0%,transparent_55%),radial-gradient(circle_at_5%_80%,rgba(58,106,133,0.35)_0%,transparent_45%)]" />
        <div
          class="absolute inset-0 opacity-[0.022]"
          :style="{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }"
        />
      </div>

      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24">
        <div class="flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-4">
          <span class="w-5 h-0.5 bg-orange" />
          About LKK Wellness
          <span class="text-white/30 tracking-normal normal-case font-medium">・Est. 2018</span>
        </div>

        <h1 class="font-serif text-5xl lg:text-6xl font-black leading-tight mb-2">
          健康，<span class="text-orange">是練出來的</span>
        </h1>
        <div class="w-16 h-1 bg-orange rounded-full mb-6" />

        <p class="text-white/60 text-lg font-light leading-relaxed max-w-2xl mb-8">
          練健康是一間專注於中高齡、術後及特殊健康族群的肌力訓練中心。我們相信年齡不是限制，而是開始——期望每一個人，都能擁有獨立自主、有尊嚴的健康晚年生活。
        </p>

        <div class="flex flex-wrap gap-3">
          <div
            v-for="p in heroPills"
            :key="p.k"
            class="inline-flex items-center gap-2 bg-white/[0.06] border border-white/12 rounded-full px-5 py-2.5"
          >
            <span class="text-white/50 text-sm">{{ p.k }}</span>
            <span class="text-white font-bold text-sm">{{ p.v }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Section nav -->
    <div class="sticky top-16 z-30 bg-cream/90 backdrop-blur border-b border-navy-700/10">
      <div class="container mx-auto px-4">
        <nav class="flex gap-1 overflow-x-auto py-2.5 -mx-1 px-1">
          <a
            v-for="s in sectionNav"
            :key="s.id"
            :href="`#${s.id}`"
            class="whitespace-nowrap text-sm font-medium text-navy-700/70 hover:text-orange px-3 py-1.5 rounded-full hover:bg-navy-700/[0.05] transition-colors"
          >
            {{ s.label }}
          </a>
        </nav>
      </div>
    </div>

    <!-- 品牌主張：肌力衰退 vs 持續訓練 -->
    <section id="brand" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Our Thesis
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・品牌主張</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-4 max-w-3xl leading-snug">
          透過專業訓練，讓每個人<span class="text-orange">在理想狀態老去</span>
        </h2>
        <p class="text-ink/70 leading-relaxed mb-8 max-w-2xl">
          老化不可逆，但衰退的速度可以被改變。肌力是少數能靠訓練「重新長回來」的能力——即使已經八十、九十歲。這是練健康存在的理由：把運動科學與醫學實證，變成長輩真的做得到的訓練。
        </p>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <div
            v-for="pillar in brandPillars"
            :key="pillar"
            class="flex items-start gap-2.5 bg-white border border-navy-700/10 rounded-xl px-4 py-3.5"
          >
            <svg class="w-5 h-5 text-orange flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-sm font-medium text-navy-700 leading-snug">{{ pillar }}</span>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-navy-700/12 shadow-sm p-5 lg:p-8 overflow-x-auto">
          <svg viewBox="0 0 820 420" class="w-full min-w-[600px] h-auto" role="img" aria-label="肌力隨年齡下滑與持續訓練的對照圖">
            <!-- 軸 -->
            <line x1="90" y1="40" x2="90" y2="360" stroke="#2A5269" stroke-opacity="0.25" stroke-width="2" />
            <line x1="90" y1="360" x2="790" y2="360" stroke="#2A5269" stroke-opacity="0.25" stroke-width="2" />
            <text x="70" y="60" text-anchor="end" font-size="14" fill="#2A5269" fill-opacity="0.5">高</text>
            <text x="70" y="352" text-anchor="end" font-size="14" fill="#2A5269" fill-opacity="0.5">低</text>
            <text x="30" y="210" font-size="13" fill="#2A5269" fill-opacity="0.5" transform="rotate(-90 30 210)" text-anchor="middle">身體功能</text>
            <text x="120" y="392" font-size="13" fill="#2A5269" fill-opacity="0.5">40 歲</text>
            <text x="760" y="392" font-size="13" fill="#2A5269" fill-opacity="0.5" text-anchor="end">90 歲</text>

            <!-- 落差陰影 -->
            <path d="M120,95 C330,120 540,175 770,250 L770,368 C540,300 330,160 120,95 Z" fill="#FB720A" fill-opacity="0.10" />

            <!-- 日常獨立生活門檻 -->
            <line x1="90" y1="300" x2="790" y2="300" stroke="#2A5269" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="6 6" />
            <text x="784" y="292" text-anchor="end" font-size="13" fill="#2A5269" fill-opacity="0.6">日常獨立生活門檻</text>

            <!-- 自然老化 -->
            <path d="M120,95 C330,160 540,300 770,368" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" />
            <text x="470" y="330" font-size="15" font-weight="bold" fill="#64748b">自然老化</text>

            <!-- 持續訓練 -->
            <path d="M120,95 C330,120 540,175 770,250" fill="none" stroke="#FB720A" stroke-width="4" stroke-linecap="round" />
            <text x="612" y="205" font-size="15" font-weight="bold" fill="#FB720A">持續訓練</text>

            <!-- 落差標籤 -->
            <text x="410" y="245" font-size="16" font-weight="bold" fill="#2A5269">這段落差，是練出來的</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- 我們是誰 -->
    <section id="who" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
              <span class="w-5 h-0.5 bg-orange" />
              Who We Are
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-5">由物理治療與運動科學專業，<br class="hidden lg:block" />為長輩打造的訓練中心</h2>
            <div class="space-y-4 text-ink/70 leading-relaxed">
              <p>練健康由物理治療師與運動科學專家共同創立。我們看見台灣快速高齡化，卻很少有健身房真正懂得中高齡、術後與慢性病族群的身體。</p>
              <p>所以我們把「安全」放在第一位：每位學員都先經過專業評估，再依個人狀況設計訓練，讓 50 歲、70 歲、甚至 90 歲，都能安心開始第一堂課。</p>
              <p>七年多來，超過一千位學員在這裡找回肌力、平衡與生活的自主權。我們相信——<strong class="text-navy-700">健康，是練出來的。</strong></p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div v-for="s in stats" :key="s.l" class="bg-cream-100 rounded-2xl border border-navy-700/10 p-6 text-center">
              <div class="font-serif text-3xl lg:text-4xl font-black text-orange">{{ s.n }}</div>
              <div class="text-sm text-ink/60 mt-1">{{ s.l }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 發展歷程 -->
    <section id="history" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          Milestones
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-10">一路走來的發展歷程</h2>

        <div class="relative max-w-3xl">
          <div class="absolute left-[7px] top-2 bottom-2 w-0.5 bg-navy-700/15" />
          <div class="space-y-8">
            <div v-for="item in timeline" :key="item.y" class="relative pl-10">
              <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-orange border-4 border-cream" />
              <div class="text-orange font-black font-serif text-lg mb-1">{{ item.y }}</div>
              <h3 class="font-bold text-navy-700 mb-1">{{ item.t }}</h3>
              <p class="text-ink/60 text-sm leading-relaxed">{{ item.d }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 經營團隊 -->
    <section id="team" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          Our Team
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">經營團隊</h2>
        <p class="text-ink/60 leading-relaxed mb-10 max-w-2xl">由物理治療師與醫療專業人員創立，我們深知中高齡族群的身體需求，致力於打造最安全、最有效的訓練環境。</p>

        <div class="grid md:grid-cols-3 gap-6 max-w-5xl">
          <article
            v-for="member in managementTeam"
            :key="member.id"
            class="bg-cream-100 rounded-2xl overflow-hidden shadow-sm border border-navy-700/10 hover:-translate-y-1 transition-transform"
          >
            <div class="aspect-[3/4] bg-gradient-to-br from-navy-700 to-navy-700/80 relative">
              <img v-if="member.photo" :src="member.photo" :alt="member.name" loading="lazy" class="w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <span class="font-serif text-7xl font-black text-white/20">{{ member.name.charAt(0) }}</span>
              </div>
            </div>
            <div class="p-6">
              <div class="mb-4">
                <h3 class="font-serif text-xl font-bold text-navy-700">
                  {{ member.name }}
                  <span v-if="member.nickname" class="text-navy-700/50 font-normal ml-2">{{ member.nickname }}</span>
                </h3>
                <p class="text-orange font-semibold text-sm">{{ member.title }}</p>
              </div>
              <p class="text-ink/60 leading-relaxed mb-4 text-sm">{{ member.description }}</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="cred in member.credentials" :key="cred" class="text-xs font-medium text-navy-700 bg-navy-700/[0.08] px-3 py-1 rounded-full">
                  {{ cred }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <div class="mt-8">
          <NuxtLink to="/team-intro/coaches" class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors font-medium">
            查看全體教練團隊 →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 聖誕老人硬舉大賽 / LKK4 -->
    <section id="lkk4" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="bg-gradient-to-br from-navy-700 to-[#0e2230] rounded-3xl p-8 lg:p-12 text-white grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
              <span class="w-5 h-0.5 bg-orange" />
              LKK4 賽事
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black mb-4">聖誕老人硬舉大賽 → <span class="text-orange">LKK4 全齡挑戰</span></h2>
            <p class="text-white/60 leading-relaxed">
              2021 年起，練健康把中高齡的力量搬上舞台。長者穿上聖誕裝挑戰硬舉，感動了無數家庭，也吸引 BBC、路透社、法新社來台採訪。如今發展為 LKK4 中高齡四項體能挑戰賽。
            </p>
          </div>
          <div class="lg:text-right">
            <NuxtLink to="/lkk4" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
              認識 LKK4 賽事 →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 媒體報導 -->
    <section id="media" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          As Seen In
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">被世界看見的台灣故事</h2>
        <p class="text-ink/60 leading-relaxed mb-8 max-w-2xl mx-auto">從台北出發，練健康的故事登上全球主要通訊社與台灣各大媒體。</p>

        <div class="flex flex-wrap justify-center gap-3 mb-8">
          <span v-for="o in mediaOutlets" :key="o" class="bg-cream-100 border border-navy-700/10 text-navy-700 font-bold text-sm px-5 py-2.5 rounded-full">
            {{ o }}
          </span>
        </div>

        <NuxtLink to="/news" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
          查看完整媒體報導 →
        </NuxtLink>
      </div>
    </section>

    <!-- 課程與活動 -->
    <section id="programs" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          Programs
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-10">課程與活動</h2>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl border border-navy-700/12 shadow-sm p-6">
            <h3 class="font-serif text-lg font-black text-navy-700 mb-2">一對一私人教練</h3>
            <p class="text-ink/60 text-sm leading-relaxed">依個人身體狀況量身設計，物理治療背景教練全程陪同，最適合第一次接觸重訓的長輩。</p>
          </div>
          <div class="bg-white rounded-2xl border border-navy-700/12 shadow-sm p-6">
            <h3 class="font-serif text-lg font-black text-navy-700 mb-2">中高齡團體課</h3>
            <p class="text-ink/60 text-sm leading-relaxed">小班制團課，同儕一起練更有動力，兼顧肌力、平衡與心肺，價格更親民。</p>
          </div>
          <div class="bg-white rounded-2xl border border-navy-700/12 shadow-sm p-6">
            <h3 class="font-serif text-lg font-black text-navy-700 mb-2">賽事與社群活動</h3>
            <p class="text-ink/60 text-sm leading-relaxed">聖誕老人硬舉大賽、LKK4 挑戰賽與各式講座，讓訓練成為一種生活與榮耀。</p>
          </div>
        </div>

        <div class="mt-8">
          <NuxtLink to="/booking" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            預約免費體驗 →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 分店 -->
    <section id="locations" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          Locations
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">四間直營分店，都在捷運旁</h2>
        <p class="text-ink/60 leading-relaxed mb-10 max-w-2xl">台北・新北四間直營分店，全部鄰近捷運站，不管刮風下雨都能輕鬆抵達。</p>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="b in branches"
            :key="b.slug"
            :to="`/locations/${b.slug}`"
            class="group bg-cream-100 border border-navy-700/10 rounded-2xl p-6 hover:border-orange/40 hover:shadow-md transition-all"
          >
            <h3 class="font-serif text-xl font-black text-navy-700 group-hover:text-orange transition-colors mb-1">{{ b.name }}</h3>
            <p class="text-ink/55 text-sm mb-4">{{ b.desc }}</p>
            <span class="text-orange text-sm font-bold">查看分店 →</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-orange py-16 lg:py-20 text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-3">健康，從第一堂課開始練</h2>
        <p class="text-white/80 mb-8 max-w-md mx-auto">50 歲以上首次體驗完全免費，由專業教練陪你安全開始。</p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink to="/booking" class="inline-flex items-center gap-2 bg-white text-orange font-bold px-8 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform">
            預約免費體驗 →
          </NuxtLink>
          <NuxtLink to="/team-intro/coaches" class="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-8 py-3.5 rounded-full border border-white/30 hover:bg-white/30 transition-colors">
            認識教練團隊
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
