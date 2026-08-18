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
  { id: 'pillars', label: '三個支柱' },
  { id: 'history', label: '發展歷程' },
  { id: 'team', label: '經營團隊' },
  { id: 'lkk4', label: '聖誕硬舉大賽' },
  { id: 'media', label: '媒體報導' },
  { id: 'programs', label: '課程與活動' },
  { id: 'locations', label: '分店' },
]

const stats = [
  { n: '10', u: '萬', l: 'Instagram 追蹤' },
  { n: '2.85', u: '萬', l: 'YouTube 訂閱' },
  { n: '2.4', u: '萬', l: 'Facebook 追蹤' },
  { n: '290', u: '萬次', l: '單支影片最高觸及' },
]

const socials = [
  { name: 'Facebook', href: 'https://www.facebook.com/LKKWellnessCenter/', path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' },
  { name: 'Instagram', href: 'https://www.instagram.com/lkk_wellness/', path: 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z' },
  { name: 'YouTube', href: 'https://www.youtube.com/c/LKKWellness', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { name: 'Podcast', href: 'https://open.spotify.com/show/1NeH1kghKxKkmOCftRGuVG', path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' },
]

const brandPillars = [
  '中高齡等特殊族群訓練中心',
  '知識科普轉譯平台',
  '醫療背景從業人員把關',
  '安全且有效的訓練環境',
]

const pillars = [
  { n: '1', t: '中高齡訓練推廣', d: '來自各領域的教練團隊，協助中高齡與特殊族群重新擁有健康的體能與肌力，把身體的自主權練回來。' },
  { n: '2', t: '知識科普教育', d: '以深入淺出的方式轉譯專業知識與最新研究，讓正確的訓練觀念真的走進一般家庭，而不只留在論文裡。' },
  { n: '3', t: '運動醫學為本', d: '以運動科學與醫學為基礎，為中高齡、術後與運動員族群提供專業、量身設計的訓練課表。' },
]

const timeline = [
  { y: '2018', t: '練健康創立', d: '以「中高齡也能安全重訓」為題籌備第一間中心。' },
  { y: '2019', t: '正式開幕', d: '南京店啟用，提供一對一教練課程。' },
  { y: '2020', t: '首辦週年講座', d: '百人參與，開始整理可對外分享的知識內容。' },
  { y: '2021.05', t: '疫情三級警戒', d: '實體課程全面暫停。' },
  { y: '2021', t: '第一屆聖誕老人硬舉大賽', d: '長輩第一次站上比賽舞台。' },
  { y: '2022', t: '第二屆賽事', d: '220 人參賽，規模翻倍。' },
  { y: '2023', t: '西門店開幕', d: '第三屆賽事 225 人參賽，學員突破 2,000 人。' },
  { y: '2024', t: '第四屆賽事', d: 'IG 突破十萬追蹤，獲走鐘獎「生命貢獻獎」。' },
  { y: '2025.10', t: '海外第一站', d: '台灣 × 馬來西亞《銀髮動作基礎訓練營》。' },
  { y: '2025', t: '第五屆賽事・新店七張店開幕', d: '70 歲以上選手超過 60 人參賽。' },
  { y: '2026', t: '松江加盟店開幕', d: '第六屆聖誕老人硬舉大賽，加盟版圖持續擴大。' },
]

const managementTeam = [
  {
    id: '1',
    name: '黃元杰',
    nickname: '肥老闆',
    title: '創辦人暨執行長',
    photo: '/images/team/huang-yuanjie.png',
    description: '練健康創辦人，經濟學碩士背景，曾任職於健身產業行銷與國際產品管理。看見台灣中高齡族群的運動需求，創立練健康，投入中高齡健身品牌的經營。',
    credentials: ['台大農經所碩士', 'IHFI 台灣 CPT 國際健康體適能專業人員', 'CPR + AED 認證'],
  },
  {
    id: '2',
    name: '曾子桓',
    nickname: 'Giwane',
    title: '訓練部區域經理・肌力與體能教練',
    photo: '/images/team/tseng-tzuhuan.png',
    description: '專精肌力與體能訓練、運動表現提升及中高齡族群訓練，具備豐富的運動員培訓經驗，負責教練團隊的訓練品質把關。',
    credentials: ['NSCA-CSCS', 'TSCA-SCC', 'SMA 運動總監認證', 'ASCA-VBT', 'AFAA-WT'],
  },
  {
    id: '3',
    name: '鄭宇劭',
    nickname: 'Bob',
    title: '總教練・物理治療師',
    photo: '/images/team/cheng-yushao.png',
    description: '物理治療師背景，專精運動傷害防護與中高齡肌力訓練，曾任競速滑冰世界盃隨隊體能訓練師，將專業運動員的訓練方法轉譯進中高齡課程。',
    credentials: ['物理治療師證照', 'NSCA-CSCS', 'NASM-CES', 'C 級肌力與體能教練'],
  },
]

const mediaOutlets = ['Associated Press', 'BBC', 'Reuters', 'AFP', 'CNA Insider', '天下雜誌', 'TVBS 新聞']

const branches = [
  { name: '南京店', desc: '台北市中山區・松江南京站', slug: 'nanjing' },
  { name: '松江店', desc: '台北市中山區・松江南京站', slug: 'songjiang' },
  { name: '西門店', desc: '台北市中正區・西門站', slug: 'ximending' },
  { name: '新店七張店', desc: '新北市新店區・七張站', slug: 'xindian' },
]

const programGroups = [
  {
    t: '練健康學院',
    items: [
      '中高齡訓練研習：如何帶學員從衰弱恢復健康',
      '練健康認證講師培訓（Level 1）',
      '銀髮動作基礎訓練營（含馬來西亞海外場）',
      '高效指導語與動作拆解實戰課',
      '舉重工作坊：奧林匹克舉重於肌力體能之應用',
    ],
  },
  {
    t: '賽事與公益推廣',
    items: [
      'LKK4 聖誕老人功能錦標賽',
      '高齡產業博覽會六角槓體驗',
      '骨質疏鬆醫學講座與免費骨密度測量',
      '社區公益長輩硬舉推廣',
    ],
  },
  {
    t: '產業與機構合作',
    items: [
      '國家衛生研究院、草屯療養院合作',
      '大專校院產學合作',
      '異業結盟與企業健康方案',
      '中高齡健康訓練創業與展店說明會',
    ],
  },
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
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Our Belief
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・品牌主張</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-4 max-w-3xl mx-auto leading-snug">
          透過專業訓練，讓每個人<span class="text-orange">在理想狀態老去</span>
        </h2>
        <p class="text-ink/70 leading-relaxed mb-8 max-w-2xl mx-auto">
          老化不可逆，但衰退的速度可以被改變。肌力是少數能靠訓練「重新長回來」的能力——即使已經八十、九十歲。這是練健康存在的理由：把運動科學與醫學實證，變成長輩真的做得到的訓練。
        </p>

        <div class="flex flex-wrap justify-center gap-2.5 mb-10">
          <span
            v-for="pillar in brandPillars"
            :key="pillar"
            class="inline-flex items-center bg-white border border-navy-700/12 rounded-full px-4 py-2 text-sm font-medium text-navy-700"
          >
            {{ pillar }}
          </span>
        </div>

        <div class="bg-white rounded-2xl border border-navy-700/12 shadow-sm p-4 lg:p-6 overflow-x-auto max-w-3xl mx-auto">
          <svg viewBox="0 0 820 420" class="w-full min-w-[520px] h-auto" role="img" aria-label="肌力隨年齡下滑與持續訓練的對照圖">
            <!-- 軸 -->
            <line x1="90" y1="40" x2="90" y2="360" stroke="#2A5269" stroke-opacity="0.25" stroke-width="2" />
            <line x1="90" y1="360" x2="790" y2="360" stroke="#2A5269" stroke-opacity="0.25" stroke-width="2" />
            <text x="70" y="60" text-anchor="end" font-size="14" fill="#2A5269" fill-opacity="0.5">高</text>
            <text x="70" y="352" text-anchor="end" font-size="14" fill="#2A5269" fill-opacity="0.5">低</text>
            <text x="30" y="210" font-size="13" fill="#2A5269" fill-opacity="0.5" transform="rotate(-90 30 210)" text-anchor="middle">身體功能</text>
            <text x="120" y="392" font-size="13" fill="#2A5269" fill-opacity="0.5">40 歲</text>
            <text x="760" y="392" font-size="13" fill="#2A5269" fill-opacity="0.5" text-anchor="end">90 歲</text>

            <!-- 落差陰影 -->
            <path d="M120,95 C330,120 540,175 770,250 L770,368 C540,300 330,160 120,95 Z" fill="#FB720A" fill-opacity="0.13" />

            <!-- 日常獨立生活門檻 -->
            <line x1="90" y1="300" x2="790" y2="300" stroke="#2A5269" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="6 6" />
            <text x="784" y="292" text-anchor="end" font-size="13" fill="#2A5269" fill-opacity="0.6">日常獨立生活門檻</text>

            <!-- 自然老化 -->
            <path d="M120,95 C330,160 540,300 770,368" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
            <circle cx="770" cy="368" r="6" fill="#94a3b8" />
            <text x="470" y="332" font-size="16" font-weight="bold" fill="#64748b">自然老化</text>

            <!-- 持續訓練 -->
            <path d="M120,95 C330,120 540,175 770,250" fill="none" stroke="#FB720A" stroke-width="5" stroke-linecap="round" />
            <circle cx="120" cy="95" r="6" fill="#FB720A" />
            <circle cx="770" cy="250" r="6" fill="#FB720A" />
            <text x="612" y="203" font-size="16" font-weight="bold" fill="#FB720A">持續訓練</text>

            <!-- 落差標籤 -->
            <text x="404" y="243" font-size="17" font-weight="bold" fill="#2A5269">這段落差，是練出來的</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- 我們是誰 -->
    <section id="who" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Who We Are
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・我們是誰</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-6 max-w-3xl mx-auto leading-snug">
          由醫療與<span class="text-orange">運動科學背景</span>創立的訓練團隊
        </h2>
        <div class="space-y-4 text-ink/70 leading-relaxed max-w-3xl mx-auto mb-8">
          <p>中高齡訓練的難處，從來不只是「怎麼練」。它牽涉到疾病史、用藥、關節限制、營養、心理與家庭支持，單一專業無法涵蓋。我們深知中高齡族群的身體需求，也知道錯誤的訓練會造成什麼後果——因此從評估、課表到現場指導，都由具備醫療或運動科學專業的教練把關，讓每一堂課都建立在專業與安全之上。</p>
          <p>現場教學之外，練健康也是一個運動科學科普平台：把正確知識轉譯成一般人聽得懂的語言，並分享中高齡與特殊族群真實的訓練紀錄，鼓勵每一個人加入訓練的行列。</p>
        </div>

        <!-- 社群 -->
        <div class="flex flex-wrap justify-center gap-2.5 mb-10">
          <a
            v-for="s in socials"
            :key="s.name"
            :href="s.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2.5 bg-white border border-navy-700/12 rounded-full pl-1.5 pr-5 py-1.5 hover:border-orange/40 hover:shadow-sm transition-all"
          >
            <span class="w-8 h-8 rounded-full bg-[#16202b] text-white flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path :d="s.path" /></svg>
            </span>
            <span class="text-sm font-medium text-navy-700">{{ s.name }}</span>
          </a>
        </div>

        <!-- 社群數據 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div v-for="s in stats" :key="s.l" class="bg-cream-100 rounded-2xl border border-navy-700/10 p-5 text-center">
            <div class="font-serif text-navy-700 leading-none">
              <span class="text-3xl font-black">{{ s.n }}</span><span class="text-base font-bold text-navy-700/60 ml-0.5">{{ s.u }}</span>
            </div>
            <div class="text-xs text-ink/55 mt-2 leading-snug">{{ s.l }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 三個支柱：練健康在做什麼 -->
    <section id="pillars" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          What We Do
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・三個支柱</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-10">練健康在做什麼</h2>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="p in pillars"
            :key="p.n"
            class="bg-white rounded-2xl border border-navy-700/10 shadow-sm p-7 lg:p-8"
          >
            <div class="w-12 h-12 rounded-full bg-orange/12 flex items-center justify-center mb-6">
              <span class="w-9 h-9 rounded-full bg-orange text-white font-serif font-black flex items-center justify-center">{{ p.n }}</span>
            </div>
            <h3 class="font-serif text-xl font-black text-navy-700 mb-3">{{ p.t }}</h3>
            <p class="text-ink/60 leading-relaxed text-sm">{{ p.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 發展歷程 -->
    <section id="history" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Milestones
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・發展歷程</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-2 text-center">練健康的旅程</h2>
        <p class="text-ink/40 text-xs mb-6 text-center">← 左右滑動看完整歷程 →</p>

        <div class="overflow-x-auto pb-4">
          <div class="relative flex gap-8 min-w-max">
            <!-- 橫向軸線 -->
            <div class="absolute left-0 right-0 top-2 h-0.5 bg-navy-700/15" />
            <div
              v-for="item in timeline"
              :key="item.y"
              class="relative w-60 flex-shrink-0"
            >
              <div class="w-4 h-4 rounded-full bg-orange ring-4 ring-cream relative z-10 mb-5" />
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
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Our Team
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・經營團隊</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3 text-center">核心經營與<span class="text-orange">教練團隊</span></h2>
        <p class="text-ink/60 leading-relaxed mb-10 max-w-2xl mx-auto text-center">帶領練健康走到今天的核心夥伴，橫跨經營、訓練與物理治療專業。</p>

        <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

        <div class="mt-8 text-center">
          <NuxtLink to="/team-intro/coaches" class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors font-medium">
            查看全體教練團隊 →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 聖誕老人硬舉大賽 / LKK4 -->
    <section id="lkk4" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="bg-gradient-to-br from-navy-700 to-[#0e2230] rounded-3xl p-8 lg:p-12 text-white text-center max-w-3xl mx-auto">
          <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
            <span class="w-5 h-0.5 bg-orange" />
            Signature Event
            <span class="text-white/35 tracking-normal normal-case font-medium">・年度盛事</span>
          </div>
          <h2 class="font-serif text-3xl lg:text-4xl font-black mb-2 leading-tight">
            聖誕老人<span class="text-orange">硬舉大賽</span>
          </h2>
          <p class="text-orange-300/80 text-xs font-bold tracking-widest uppercase mb-5">LKK4 · Santa Claus Deadlift Competition</p>
          <p class="text-white/60 leading-relaxed max-w-xl mx-auto mb-8">
            辦一場給長輩的比賽，是我們喚起社會意識的方式。每年 12 月舉辦，2026 年邁入第六屆，曾吸引 BBC、Reuters、AFP 等國際媒體到場採訪，是練健康最具代表性的年度品牌活動。
          </p>
          <NuxtLink to="/lkk4" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            查看 2026 第六屆賽事詳情 →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 媒體報導 -->
    <section id="media" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          As Seen In
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・媒體報導</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">被世界看見的台灣故事</h2>
        <p class="text-ink/60 leading-relaxed mb-8 max-w-2xl mx-auto">從台北出發，AP、BBC、Reuters、AFP、CNA Insider 等全球媒體相繼來台採訪，讓台灣的中高齡訓練故事被世界看見。</p>

        <div class="flex flex-wrap justify-center gap-2 mb-8">
          <span v-for="o in mediaOutlets" :key="o" class="bg-cream-100 border border-navy-700/10 text-navy-700/80 font-semibold text-xs px-3.5 py-1.5 rounded-full">
            {{ o }}
          </span>
        </div>

        <a href="https://l-kk.tw/category/news/" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
          查看完整報導清單 →
        </a>
      </div>
    </section>

    <!-- 課程與活動 -->
    <section id="programs" class="py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Programs
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・課程與活動</span>
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-4 max-w-2xl leading-snug">把方法，<span class="text-orange">交到更多人手上</span></h2>
        <p class="text-ink/70 leading-relaxed mb-10 max-w-2xl">除了分店的一對一與團體課程，我們也把六年來的個案經驗整理成教材，對教練、醫療從業人員與一般民眾開課——讓「怎麼教、為什麼這樣教」能被複製出去。</p>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="g in programGroups"
            :key="g.t"
            class="bg-white rounded-2xl border border-navy-700/12 shadow-sm p-6 lg:p-7"
          >
            <h3 class="font-serif text-lg font-black text-navy-700 mb-4 pb-3 border-b border-navy-700/10">{{ g.t }}</h3>
            <ul class="space-y-2.5">
              <li v-for="item in g.items" :key="item" class="flex items-start gap-2.5 text-ink/70 text-sm leading-relaxed">
                <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8">
          <NuxtLink to="/lkk-academy" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            了解練健康學院 →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 分店 -->
    <section id="locations" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          Locations
          <span class="text-navy-700/40 tracking-normal normal-case font-medium">・分店資訊</span>
        </div>
        <p class="text-orange font-bold text-sm mb-1">台北・新北</p>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">四間分店</h2>
        <p class="text-ink/60 leading-relaxed mb-10 max-w-2xl mx-auto">每一間分店都配置醫療或運動科學背景的教練團隊。第一次來，建議先預約體驗，我們會先做完整的身體評估再談訓練。</p>

        <div class="flex flex-wrap justify-center gap-3">
          <NuxtLink
            v-for="b in branches"
            :key="b.slug"
            :to="`/locations/${b.slug}`"
            class="bg-cream-100 border border-navy-700/10 text-navy-700 font-bold text-sm px-5 py-2.5 rounded-full hover:border-orange/50 hover:text-orange transition-colors"
          >
            {{ b.name }}
          </NuxtLink>
        </div>

        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <NuxtLink to="/booking" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            預約體驗與身體評估 →
          </NuxtLink>
          <NuxtLink to="/locations" class="inline-flex items-center gap-2 border border-navy-700/15 text-navy-700 font-bold px-7 py-3 rounded-full hover:border-navy-700 transition-colors">
            查看分店地址與電話 →
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>
