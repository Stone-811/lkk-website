<script setup lang="ts">
useHead({
  title: '關於練健康｜LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '練健康是一間專注於中高齡、術後及特殊健康族群的肌力訓練中心。2019 年成立於台北，四間直營分店，故事登上 BBC、路透社、法新社與美聯社。健康，是練出來的。',
    },
  ],
})

const heroPills = [
  { k: '成立', v: '2019 年' },
  { k: '分店', v: '台北・新北 4 間' },
  { k: '國際報導', v: 'BBC・Reuters・AFP' },
]

const sectionNav = [
  { id: 'brand', label: '品牌主張' },
  { id: 'who', label: '我們是誰' },
  { id: 'pillars', label: '三個支柱' },
  { id: 'founder', label: '創辦人故事' },
  { id: 'approach', label: '我們的方式' },
  { id: 'programs', label: '課程與活動' },
  { id: 'history', label: '發展歷程' },
]

// 社群：帳號、追蹤數與連結合併成一組卡片（數字來源＝業主 2026-08-23 提供的截圖）
// 社群卡片：前三張是平台追蹤數（可點進該平台），第四張是影片觸及數據（非連結）
// 數字來源＝業主提供
const socials = [
  { name: 'Facebook', handle: 'facebook 追蹤', n: '7.3', u: '萬', href: 'https://www.facebook.com/LKKWellnessCenter/', path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' },
  { name: 'YouTube', handle: 'youtube 追蹤', n: '8', u: '萬', href: 'https://www.youtube.com/c/LKKWellness', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { name: 'Instagram', handle: 'instagram 追蹤', n: '16', u: '萬', href: 'https://www.instagram.com/lkk_wellness/', path: 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z' },
  { name: 'Reach', handle: '單支影片最高觸及', n: '432', u: '萬次', path: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
]

const brandPillars = [
  '中高齡等特殊族群訓練中心',
  '知識科普轉譯平台',
  '醫療背景從業人員把關',
  '安全且有效的訓練環境',
]

// 三個支柱（2026-08-31 業主定稿；第 3 項由「永續經營」改為「運動醫學為本」）
// icon＝卡片右下角的淡色浮水印，依 CLAUDE.md 規範一律用 inline SVG，不用 Emoji。
const pillars = [
  {
    n: '1', t: '中高齡訓練推廣',
    d: '培育專業教練團隊，專注於中高齡及特殊族群訓練，透過肌力訓練，找回身體自主權。',
    icon: 'M6.5 6.5v11M4 8.5v6M17.5 6.5v11M20 8.5v6M6.5 12h11', // 啞鈴
  },
  {
    n: '2', t: '知識科普教育',
    d: '透過深入淺出的方式，將知識轉譯成大眾理解的語言，讓肌力訓練的重要性推廣普及。',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', // 書
  },
  {
    n: '3', t: '運動醫學為本',
    d: '以運動醫學，包含運動治療、運動科學等知識為根基，提供客製化的訓練服務。',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', // 盾
  },
]

// 創辦人故事（2026-08-31 業主定稿）
// 「肥老闆」經業主確認為慣用稱呼，不是錯字，保留。
// icon＝圓形外框內的線性圖示，依 CLAUDE.md 規範一律 inline SVG。
// ⚠️ 第 2 則設計稿用的是膝關節圖示，Heroicons 沒有對應款，改用「生命徵象曲線」，
//    語意上仍指向受傷與復健，若要精準的關節圖示需另外請設計提供 SVG。
const founderStory = [
  {
    t: '阿嬤的故事',
    d: '肥老闆的阿嬤晚年因為失智、跌倒及臥床讓老闆深深體會長者晚年健康對於長者本身的身體自主及家庭照護的重要性。',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    t: '自己受傷的經驗',
    d: '因為打籃球受傷經歷十字韌帶手術後復健發現與理解運動治療與肌力訓練的價值。',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
  },
  {
    t: '健保資料庫的啟發',
    d: '在學研究期間肥老闆因緣際會接觸健保資料庫，發現其實在醫療之前，我們可以做更多的預防。',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

// 我們的方式：四個價值（2026-08-31 依設計稿加入）
// 我們的方式：四個價值（2026-08-31 依設計稿圖二改為深底＋橘色圖示橫排）
// 圖示為裝飾性質，每個都有對應的文字標籤，故不受 WCAG 非文字對比 3:1 約束。
const approachValues = [
  { t: '以人為本', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { t: '安全有效', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { t: '快樂運動', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { t: '長期陪伴', icon: 'M6 20v-4M12 20V10M18 20V4' },
]

// 結尾 CTA 的數據（2026-08-31 業主標註定稿）
// ⚠️ 設計稿原為 4 格：50,000+ 累計服務人次／4 間／300+ 科普內容累積／海外合作中。
//    業主修正：50,000+ → 10,000+，並刪除「300+ 科普內容累積」整格，故為 3 格。
const ctaStats = [
  { n: '10,000+', t: '累計服務人次', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { n: '4 間', t: '台北・新北據點', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { n: '海外合作中', t: '教育訓練與專業服務', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
]

const timeline = [
  { y: '2018', t: '品牌籌備', d: '以「中高齡也能安全重訓」為題籌備第一間中心。' },
  { y: '2019', t: '練健康創立', d: '南京店啟用，提供一對一教練課程。' },
  { y: '2020', t: '首辦週年講座', d: '百人參與，開始整理可對外分享的知識內容。' },
  { y: '2021.05', t: '疫情三級警戒', d: '實體課程全面暫停。' },
  { y: '2021', t: '第一屆聖誕老人硬舉大賽', d: '長輩第一次站上比賽舞台。' },
  { y: '2022', t: '第二屆賽事', d: '220 人參賽，規模翻倍。' },
  { y: '2023', t: '西門店開幕', d: '第三屆賽事 225 人參賽，學員突破 2,000 人。' },
  { y: '2024', t: '第四屆賽事', d: 'IG 突破十萬追蹤，獲走鐘獎「生命貢獻獎」。' },
  { y: '2025.10', t: '海外第一站', d: '台灣 × 馬來西亞《銀髮動作基礎訓練營》。' },
  { y: '2025', t: '第五屆賽事・七張店開幕', d: '70 歲以上選手超過 60 人參賽。' },
  { y: '2026', t: '松江加盟店開幕', d: '第六屆聖誕老人硬舉大賽，加盟版圖持續擴大。' },
]

// 從知識到行動（2026-08-31 業主定稿，取代原本「把方法，交到更多人手上」的 3 大類 13 項）
// ⚠️ img 尚未提供，暫時留空 → 版面會顯示占位底色。照片到位後把檔名填進來即可。
//    規格：4:3、建議 800x600 以上，放 public/images/about/wwd-*.webp
const whatWeDo = [
  { t: '知識轉譯', img: '' },
  { t: '人才培育', img: '' },
  { t: '訓練服務', img: '' },
  { t: '產業升級', img: '' },
  { t: '教練陪伴', img: '' },
]</script>

<template>
  <div class="bg-cream min-h-screen">
    <!-- Hero -->
    <section class="relative bg-navy-700 pt-16 overflow-hidden text-white flex items-center xl:aspect-video">
      <!--
        底圖在所有尺寸都是絕對定位的全幅背景，文字壓在圖上——與首頁 Hero 同一套呈現。
        xl 以上：section 是 aspect-video，容器與圖片同比例，object-cover 零裁切。
        ⚠️ 斷點從 lg 提高到 xl：Hero 加入圖表卡片後內容變高，1024 寬的 16:9 只有 576px
           塞不下，會被 overflow-hidden 切掉；1280 寬的 720px 才夠。
        xl 以下：高度由文字內容決定，比例比圖片瘦，左右會被裁掉
        （390 手機約只剩三到五成寬）——這是換取「文字壓在照片上」的必然代價，
        首頁 Hero 手機版同樣只剩 26% 寬。主體請盡量置中構圖。
        ⚠️ 斷點是量出來的：文字內容必須塞得進 16:9 的高度。
      -->
      <img
        src="/images/about/hero.webp"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 w-full h-full object-cover opacity-60"
        style="filter: brightness(0.30)"
      />
      <div class="absolute inset-0">
        <!--
          學員與教練合照。opacity-60 + brightness(0.30)：文字區底色 L=0.0594，
          比純 navy-700 的 0.0755 更暗，所以加了底圖後對比只會更好、不會更差。
          ⚠️ 換照片要重量一次，brightness 不是通用常數。
        -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(251,114,10,0.12)_0%,transparent_55%),radial-gradient(circle_at_5%_80%,rgba(58,106,133,0.35)_0%,transparent_45%)]" />
        <div
          class="absolute inset-0 opacity-[0.022]"
          :style="{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }"
        />
      </div>

      <!--
        雙欄 Hero（2026-08-31 依設計稿調整）：左文字、右圖表卡片。
        圖表原本在下方的「品牌主張」區，依設計稿移進 Hero。
        lg 以下堆疊成上下，圖表卡片排在文字下方。
      -->
      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24 w-full">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

          <div class="text-center lg:text-left">
            <div class="flex items-center justify-center lg:justify-start gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-4">
              <span class="w-5 h-0.5 bg-orange" />
              About LKK Wellness Center
            </div>

            <h1 class="font-serif text-5xl lg:text-6xl font-black leading-tight mb-2">
              健康，<br /><span class="text-orange">是練出來的</span>
            </h1>
            <div class="w-16 h-1 bg-orange rounded-full mb-6 mx-auto lg:mx-0" />

            <p class="text-white/75 text-lg font-light leading-relaxed mb-8">
              練健康專注中高齡、特殊族群訓練<br />
              我們期許透過循序漸進的訓練<br />
              享有獨立自主有尊嚴的晚年生活
            </p>

            <div class="flex flex-wrap justify-center lg:justify-start gap-3">
              <div
                v-for="p in heroPills"
                :key="p.k"
                class="inline-flex items-center gap-2 bg-white/[0.06] border border-white/12 rounded-full px-5 py-2.5"
              >
                <span class="text-white/75 text-sm">{{ p.k }}</span>
                <span class="text-white font-bold text-sm">{{ p.v }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xl p-4 lg:p-5">
            <img
              src="/images/about/belief-chart.webp"
              alt="提升肌力是延緩失能的關鍵：有在訓練與沒在訓練的身體活動功能隨年齡變化對照圖"
              width="1600"
              height="904"
              class="w-full h-auto rounded-xl"
            />
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-[11px] text-ink/45 tracking-wide">Fig. 01 — 參考資料：多篇研究整合</p>
              <p class="font-serif text-sm font-black text-navy-700">
                練出力量，才能<span class="text-orange">保有生活品質</span>
              </p>
            </div>
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
          我們相信，年齡<span class="text-orange">不該限制一個人的可能</span>。
        </h2>
        <p class="text-ink/70 leading-relaxed mb-8 max-w-2xl mx-auto">
          年齡會增長，但我們仍然可以選擇怎麼面對身體的改變。透過循序漸進的肌力訓練，力量可以持續被鍛鍊，活動能力也能持續累積。
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
      </div>
    </section>

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
          <p>現場教學之外，練健康也是一個運動科學科普平台，把正確知識轉譯成一般人聽得懂的語言，並定期分享中高齡與特殊族群真實的訓練紀錄，鼓勵每一個人加入訓練的行列。</p>
        </div>

        <!-- 社群帳號與追蹤數 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <component
            :is="s.href ? 'a' : 'div'"
            v-for="s in socials"
            :key="s.name"
            :href="s.href"
            :target="s.href ? '_blank' : undefined"
            :rel="s.href ? 'noopener noreferrer' : undefined"
            class="group bg-cream-100 rounded-2xl border border-navy-700/10 p-5 text-center transition-all"
            :class="s.href ? 'hover:border-orange/40 hover:shadow-sm' : ''"
          >
            <span
              class="w-10 h-10 rounded-full bg-[#16202b] text-white flex items-center justify-center mx-auto mb-3 transition-colors"
              :class="s.href ? 'group-hover:bg-orange' : ''"
            >
              <svg class="w-5 h-5" :fill="s.href ? 'currentColor' : 'none'" :stroke="s.href ? undefined : 'currentColor'" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="s.path" /></svg>
            </span>
            <div class="text-xs text-ink/55 leading-snug mb-1.5 truncate">{{ s.handle }}</div>
            <div class="font-serif text-navy-700 leading-none">
              <span class="text-3xl font-black">{{ s.n }}</span><span class="text-base font-bold text-navy-700/60 ml-0.5">{{ s.u }}</span>
            </div>
          </component>
        </div>
      </div>
    </section>

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
            class="relative overflow-hidden bg-white rounded-2xl border border-navy-700/10 shadow-sm p-7 lg:p-8"
          >
            <div class="w-12 h-12 rounded-full bg-orange/12 flex items-center justify-center mb-6">
              <span class="w-9 h-9 rounded-full bg-orange text-white font-serif font-black flex items-center justify-center">{{ p.n }}</span>
            </div>
            <h3 class="font-serif text-xl font-black text-navy-700 mb-3">{{ p.t }}</h3>
            <p class="text-ink/60 leading-relaxed text-sm">{{ p.d }}</p>

            <!-- 右下角浮水印圖示（裝飾用，對輔助科技隱藏）-->
            <svg
              class="absolute -bottom-2 -right-2 w-20 h-20 text-navy-700/[0.06]"
              fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="p.icon" />
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- 創辦人故事（2026-08-31 業主定稿，版型依設計稿圖二：左文字、右照片）-->
    <section id="founder" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-14 items-start">

          <!-- 左：標題 + 三則故事 -->
          <div>
            <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
              <span class="w-5 h-0.5 bg-orange" />
              Founder Story
              <span class="text-navy-700/40 tracking-normal normal-case font-medium">・創辦人故事</span>
            </div>
            <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-10 leading-snug">
              一個家庭的經歷，開啟了<span class="text-orange">練健康的使命</span>
            </h2>

            <div class="grid sm:grid-cols-3 gap-8">
              <div v-for="f in founderStory" :key="f.t" class="text-center">
                <span class="w-14 h-14 rounded-full border border-navy-700/15 flex items-center justify-center mx-auto mb-4 text-navy-700">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="f.icon" />
                  </svg>
                </span>
                <h3 class="font-serif text-base font-black text-navy-700 mb-2">{{ f.t }}</h3>
                <p class="text-ink/65 text-sm leading-relaxed">{{ f.d }}</p>
              </div>
            </div>
          </div>

          <!-- 右：創辦人與阿嬤的合照 -->
          <div class="mx-auto lg:mx-0 max-w-[320px] w-full">
            <img
              src="/images/about/founder-grandma.webp"
              alt="練健康創辦人幼時與阿嬤的合照"
              loading="lazy"
              width="900"
              height="894"
              class="w-full h-auto rounded-2xl border-4 border-white shadow-xl"
            />
          </div>

        </div>
      </div>
    </section>

    <!-- 我們的方式（2026-08-31 依設計稿圖二：深底、左標題、右四個圖示橫排）-->
    <section id="approach" class="bg-navy-700 text-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          <div class="text-center lg:text-left">
            <div class="flex items-center justify-center lg:justify-start gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
              <span class="w-5 h-0.5 bg-orange" />
              Our Approach
              <span class="text-white/65 tracking-normal normal-case font-medium">・我們的方式</span>
            </div>
            <!-- 業主指定整句白字，不上橘色強調 -->
            <h2 class="font-serif text-2xl lg:text-3xl font-black mb-4 leading-snug">
              專業嚴謹，快樂訓練
            </h2>
            <p class="text-white/80 leading-relaxed">
              希望透過練健康的場域，讓你能感受訓練可以很自在開心。
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div v-for="v in approachValues" :key="v.t" class="text-center">
              <svg
                class="w-9 h-9 mx-auto mb-3 text-orange"
                fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="v.icon" />
              </svg>
              <div class="font-serif text-base font-black pb-2 border-b border-white/15">{{ v.t }}</div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 從知識到行動（2026-08-31 依設計稿：5 張照片卡片橫排）-->
    <section id="programs" class="bg-white py-14 lg:py-20 scroll-mt-28">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          What We Do
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-10 leading-snug">
          從知識到行動，<span class="text-orange">陪你一起成長</span>
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          <div v-for="w in whatWeDo" :key="w.t">
            <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-cream-200 border border-navy-700/10">
              <img
                v-if="w.img"
                :src="w.img"
                :alt="`練健康${w.t}`"
                loading="lazy"
                class="w-full h-full object-cover"
              />
              <!-- 照片未提供時的占位：不留空白破圖，維持版面高度 -->
              <div v-else class="w-full h-full flex items-center justify-center text-navy-700/20">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 class="font-serif text-lg font-black text-navy-700 mt-4">{{ w.t }}</h3>
          </div>
        </div>
      </div>
    </section>

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

    <!-- 結尾 CTA（2026-08-31 依設計稿：左文字＋按鈕、右數據）-->
    <section class="bg-navy-800 text-white py-16 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          <div class="text-center lg:text-left">
            <h2 class="font-serif text-3xl lg:text-4xl font-black mb-4 leading-tight">
              一起把健康，<span class="text-orange-300">練成日常</span>
            </h2>
            <p class="text-white/70 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              無論你是想變更健康的長輩、關心家人的你，或想推動健康的企業與夥伴，我們都在這裡，陪你一起練成更有力量的生活。
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4">
              <NuxtLink to="/booking" class="inline-flex items-center gap-2 bg-orange text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
                立即預約體驗 →
              </NuxtLink>
              <NuxtLink to="/locations" class="inline-flex items-center gap-2 border border-white/25 text-white font-bold px-7 py-3 rounded-full hover:border-white transition-colors">
                查看四間分店 →
              </NuxtLink>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 lg:gap-6">
            <div v-for="c in ctaStats" :key="c.t" class="text-center">
              <svg class="w-7 h-7 mx-auto mb-3 text-orange-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :d="c.icon" />
              </svg>
              <div class="font-serif text-xl lg:text-2xl font-black leading-tight mb-1">{{ c.n }}</div>
              <div class="text-white/65 text-xs leading-snug">{{ c.t }}</div>
            </div>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>
