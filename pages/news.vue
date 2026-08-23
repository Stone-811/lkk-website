<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '媒體報導｜練健康 LKK Wellness',
  meta: [
    {
      name: 'description',
      content: '從台北出發，練健康陪伴中高齡學員重新練出肌力與自信的故事，登上 AP 美聯社、BBC、路透社、法新社與 CNA 等國際媒體。一起看看，這些真實的力量如何被全世界看見。',
    },
  ],
})

interface Link { text: string; href: string; primary?: boolean }
interface Report {
  outlet: string
  cat?: string
  lang?: string
  lkk4?: boolean
  title: string
  excerpt?: string
  date?: string
  image?: string | null
  type: 'video' | 'print'
  link: Link
  links?: Link[]
}

// 篩選（本站設計原則不使用 emoji，改用文字標籤）
const filters = [
  { key: 'all', label: '全部' },
  { key: 'video', label: '影音報導' },
  { key: 'print', label: '平面報導' },
  { key: 'lkk4', label: 'LKK4 賽事' },
] as const
const active = ref<'all' | 'video' | 'print' | 'lkk4'>('all')
function matches(item: Report) {
  if (active.value === 'all') return true
  if (active.value === 'lkk4') return !!item.lkk4
  return item.type === active.value
}

// 國際通訊社 —— AP 為大張精選
const apFeatured: Report = {
  outlet: 'Associated Press · 美聯社 · 2026',
  title: 'Taiwanese grandmothers aged 89 and 91 train at the gym to stay healthy',
  excerpt:
    '89 歲與 91 歲的台灣阿嬤，每週固定到練健康報到、持續訓練。美聯社用鏡頭記錄下這一幕，告訴全世界：年齡從來不是健康的限制。',
  image: '/images/news/ap.jpg',
  type: 'video',
  lkk4: false,
  link: { text: '完整報導 →', href: 'https://l-kk.tw/taiwanese-grandmothers-aged-89-and-91-train-at-the-gym-to-stay-healthy/' },
  links: [
    { text: '完整報導 →', href: 'https://l-kk.tw/taiwanese-grandmothers-aged-89-and-91-train-at-the-gym-to-stay-healthy/', primary: true },
    { text: '前往美聯社原文 ↗', href: 'https://apnews.com/video/taiwanese-grandmothers-show-age-is-no-obstacle-to-good-health-and-prowess-in-the-gym-a94b31caecb5485b91a350a0895e8782' },
  ],
}

const intl: Report[] = [
  {
    outlet: 'BBC', lang: 'English', lkk4: true, type: 'video',
    title: "90-year-old with Parkinson's enters weightlifting contest",
    excerpt: '「I want to tell all the old people to join the workout. You don\'t need to work extremely hard, but taking part is important.」BBC 專訪 90 歲帕金森氏症阿嬤參加練健康聖誕硬舉大賽。',
    date: 'Dec 23, 2024', image: '/images/news/bbc.jpg',
    link: { text: '完整報導 →', href: 'https://l-kk.tw/bbc-90-year-old-with-parkinsons-enters-weightlifting-contest/' },
  },
  {
    outlet: 'Reuters 路透社', lang: 'English', lkk4: true, type: 'print',
    title: 'Weightlifting Taiwan granny, 90, garners cheers, health benefits at gym',
    excerpt: 'Cheng Chen has been training at LKK Wellness for two years — helping to fix her posture and regain strength.　— By Angie Teo and Ann Wang',
    date: 'Dec 21, 2024', image: '/images/news/reuters.jpg',
    link: { text: '完整報導 →', href: 'https://l-kk.tw/reuters-weightlifting-taiwan-granny-90-garners-cheers-health-benefits-at-gym/' },
  },
  {
    outlet: 'AFP 法新社', lang: 'English', lkk4: true, type: 'video',
    title: 'Taipei hosts Christmas-themed senior deadlift competition',
    excerpt: "Taiwan's capital Taipei hosts a deadlift competition for seniors with a Christmas theme, attracting international attention.",
    date: 'Dec 2024', image: '/images/news/afp.jpg',
    link: { text: '觀看影片 →', href: 'https://www.facebook.com/AFPnewsenglish/videos/904278765198954/' },
  },
  {
    outlet: 'CNA Insider 新加坡', type: 'video', lkk4: false,
    title: 'CNA Insider：重新定義亞洲的積極老化',
    excerpt: '新加坡 Channel NewsAsia 深入採訪，記錄練健康如何改變台灣人對老化的認知，透過力量訓練讓長輩活得更好。',
    date: '2024', image: '/images/news/cna.jpg',
    link: { text: 'YouTube 觀看 →', href: 'https://youtu.be/Xfzd8MsNW2o' },
  },
]

const tw: Report[] = [
  {
    outlet: '吳淡如人生實用商學院', cat: 'Podcast・YouTube', type: 'video', lkk4: false,
    title: '最偉大的父愛母愛，是你自己健康的身體！',
    excerpt: '吳淡如 × 鄭宇劭 × 黃元杰，三人深度對談：為什麼父母健康是最好的禮物？如何讓長輩真正動起來？',
    date: '2026-05-08', image: '/images/news/wutanru.jpg',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/%e5%90%b3%e6%b7%a1%e5%a6%82%e4%ba%ba%e7%94%9f%e5%af%a6%e7%94%a8%e5%95%86%e5%ad%b8%e9%99%a2%ef%bc%88official%e5%ae%98%e6%96%b9%e5%94%af%e4%b8%80%e9%a0%bb%e9%81%93%ef%bc%89%f0%9f%9a%a9%e3%80%90%e5%90%b3/' },
  },
  {
    outlet: '大愛新聞 DaaiNews', cat: '電視新聞', type: 'video', lkk4: false,
    title: '銀髮族也能重訓 強健肌力不跌跤',
    excerpt: '大愛電視深入練健康，採訪學員與教練，說明中高齡肌力訓練如何改善日常生活功能，預防跌倒風險。',
    date: '2026-05-08', image: '/images/news/daai.jpg',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/%e3%80%90%e5%a4%a7%e6%84%9b%e6%96%b0%e8%81%9edaainews%e3%80%91%e9%8a%80%e9%ab%ae%e6%97%8f%e4%b9%9f%e8%83%bd%e9%87%8d%e8%a8%93-%e5%bc%b7%e5%81%a5%e8%82%8c%e5%8a%9b%e4%b8%8d%e8%b7%8c%e8%b7%a4/' },
  },
  {
    outlet: '動思學院 MoveThink', cat: 'Podcast・YouTube', type: 'video', lkk4: false,
    title: '每個爸媽都該重訓！長輩也可以很強壯？',
    excerpt: '動思學院深度訪談，剖析中高齡肌力訓練的科學基礎與實務做法，以及練健康如何讓長輩也能安全重訓。',
    date: '2026-05-08', image: '/images/news/movethink.jpg',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/%e3%80%90%e5%8b%95%e6%80%9d%e5%ad%b8%e9%99%a2-movethink%e3%80%91%e6%af%8f%e5%80%8b%e7%88%b8%e5%aa%bd%e9%83%bd%e8%a9%b2%e9%87%8d%e8%a8%93%ef%bc%81%e9%95%b7%e8%bc%a9%e4%b9%9f%e5%8f%af%e4%bb%a5%e5%be%88/' },
  },
  {
    outlet: '天下雜誌', cat: '雜誌・財經', type: 'print', lkk4: false,
    title: '肌少症篩檢提前到 50 歲！健身房變第二復健室，銀髮商機起飛',
    excerpt: '天下雜誌全齡健身商機系列報導，採訪練健康總教練鄭宇劭，探討台灣銀髮健身產業的現在與未來。',
    date: '2026-03-21', image: '/images/news/cw.jpg',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/%e5%85%a8%e9%bd%a1%e5%81%a5%e8%ba%ab%e5%95%86%e6%a9%9f3%e3%80%8b%e8%82%8c%e5%b0%91%e7%97%87%e7%af%a9%e6%aa%a2%e6%8f%90%e5%89%8d%e5%88%b050%e6%ad%b2%ef%bc%81%e5%81%a5%e8%ba%ab%e6%88%bf%e8%ae%8a/' },
  },
]

const more: Report[] = [
  { outlet: '強者我朋友 Podcast', cat: 'Podcast', type: 'video', lkk4: false, date: '2026-05-08',
    title: '90 歲阿嬤也能硬舉！要怎麼說服爸媽去運動？ft. 練健康鄭宇劭總教練《強者我朋友》EP 054',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/90%e6%ad%b2%e9%98%bf%e5%ac%a4%e4%b9%9f%e8%83%bd%e7%a1%ac%e8%88%89%ef%bc%81%e8%a6%81%e6%80%8e%e9%ba%bc%e8%aa%aa%e6%9c%8d%e7%88%b8%e5%aa%bd%e5%8e%bb%e9%81%8b%e5%8b%95%ef%bc%9f%e9%87%8d%e8%a8%93%e6%9c%80/' } },
  { outlet: '高年級不打烊 Podcast', cat: 'Podcast', type: 'video', lkk4: true, date: '2026-05-08',
    title: 'EP146 黃元杰－練健康打好體能基礎，聖誕老人負重大賽讓你看到令人感動的熟齡超能力！',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/%e3%80%90%e9%ab%98%e5%b9%b4%e7%b4%9a%e4%b8%8d%e6%89%93%e7%83%8a-x-%e7%94%a8-ai-%e9%bb%9e%e4%ba%ae%e7%ac%ac%e4%ba%8c%e4%ba%ba%e7%94%9f%e3%80%91ep146-%e9%bb%83%e5%85%83%e6%9d%b0%ef%bc%8d%e7%b7%b4/' } },
  { outlet: 'TVBS 新聞', cat: '電視新聞', type: 'video', lkk4: false, date: '2026-03-21',
    title: '影音／專家揭心理健康 3 警訊！功能喪失、關係疏離，恐失去生命意義',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/%e5%bd%b1%e9%9f%b3%ef%bc%8f%e5%b0%88%e5%ae%b6%e6%8f%ad%e5%bf%83%e7%90%86%e5%81%a5%e5%ba%b73%e8%ad%a6%e8%a8%8a%ef%bc%81%e5%8a%9f%e8%83%bd%e5%96%aa%e5%a4%b1%e3%80%80-%e9%97%9c%e4%bf%82%e7%96%8f%e9%9b%a2/' } },
  { outlet: '初一十五練健康 Podcast', cat: 'Podcast', type: 'video', lkk4: false, date: '2025-12-04',
    title: '肌肉流失比你想的更早！亞洲肌少症診斷指引更新（自製內容）',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/sarcopenia-6/' } },
  { outlet: '科技新報 TechNews', cat: '科技・健康', type: 'print', lkk4: false, date: '2025-10-02',
    title: '北榮結合運動科學與醫學，創滑雪運動員全方位檢測體系',
    link: { text: '閱讀全文 →', href: 'https://l-kk.tw/ski/' } },
  { outlet: 'BBC 英國廣播公司', cat: '國際媒體', lang: 'EN', type: 'video', lkk4: true, date: '2024-12-23',
    title: "90-year-old with Parkinson's enters weightlifting contest",
    link: { text: '完整報導 →', href: 'https://l-kk.tw/bbc-90-year-old-with-parkinsons-enters-weightlifting-contest/' } },
  { outlet: 'Reuters 路透社', cat: '國際媒體', lang: 'EN', type: 'print', lkk4: true, date: '2024-12-21 · Angie Teo & Ann Wang',
    title: 'Weightlifting Taiwan granny, 90, garners cheers, health benefits at gym',
    link: { text: '完整報導 →', href: 'https://l-kk.tw/reuters-weightlifting-taiwan-granny-90-garners-cheers-health-benefits-at-gym/' } },
  { outlet: 'AFP 法新社', cat: '國際媒體', lang: 'EN', type: 'video', lkk4: true, date: '2024-12 · AFP English',
    title: 'Taipei hosts Christmas-themed senior deadlift competition（影片）',
    link: { text: '觀看影片 →', href: 'https://www.facebook.com/AFPnewsenglish/videos/904278765198954/' } },
  { outlet: 'CNA Insider 新加坡', cat: '國際媒體', type: 'video', lkk4: false, date: '2024 · Channel NewsAsia',
    title: 'CNA Insider 紀錄片：重新定義亞洲的積極老化',
    link: { text: 'YouTube 觀看 →', href: 'https://youtu.be/Xfzd8MsNW2o' } },
]

// 篩選用「computed 過濾陣列」重繪，而非在 v-for 元素上掛 v-show
//（v-for + v-show 同一元素在此不會更新 → 改用過濾後的陣列）
const apShown = computed(() => matches(apFeatured))
const fIntl = computed(() => intl.filter((i) => matches(i)))
const fTw = computed(() => tw.filter((i) => matches(i)))
const fMore = computed(() => more.filter((i) => matches(i)))
// 篩選後整區皆無符合就隱藏該區塊（比只留空標題乾淨）
const showIntl = computed(() => apShown.value || fIntl.value.length > 0)
const showTw = computed(() => fTw.value.length > 0)
const showMore = computed(() => fMore.value.length > 0)
</script>

<template>
  <div class="bg-cream min-h-screen">
    <!-- Hero -->
    <section class="relative bg-navy-700 pt-16 overflow-hidden text-white">
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,114,10,0.12)_0%,transparent_55%),radial-gradient(circle_at_5%_80%,rgba(58,106,133,0.35)_0%,transparent_45%)]" />
      </div>
      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24 text-center">
        <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-4">
          <span class="w-5 h-0.5 bg-orange" />
          Media Coverage
        </div>
        <h1 class="font-serif text-4xl lg:text-5xl font-black leading-tight mb-5">
          被<span class="text-orange">世界看見</span>的台灣故事
        </h1>
        <p class="text-white/60 text-lg font-light leading-relaxed max-w-2xl mx-auto">
          這裡收錄了一群相信「幾歲開始肌力訓練都不嫌晚」的故事，讓全球看見了台灣中高齡的力量。
        </p>
      </div>
    </section>

    <!-- Filter tabs -->
    <div class="sticky top-16 z-30 bg-cream/90 backdrop-blur border-b border-navy-700/10">
      <div class="container mx-auto px-4 py-3">
        <div class="flex flex-wrap gap-2 justify-center">
          <button
            v-for="f in filters"
            :key="f.key"
            @click="active = f.key"
            :class="[
              'px-4 py-2 rounded-full text-sm font-bold transition-colors border',
              active === f.key
                ? 'bg-orange text-white border-orange'
                : 'bg-white text-navy-700 border-navy-700/15 hover:border-orange',
            ]"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 國際通訊社 -->
    <section v-show="showIntl" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          International Press
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-10">國際媒體報導</h2>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- AP featured (big) -->
          <article
            v-if="apShown"
            class="sm:col-span-2 lg:col-span-4 grid md:grid-cols-2 bg-white rounded-3xl overflow-hidden border border-navy-700/12 shadow-sm"
          >
            <div class="aspect-video md:aspect-auto md:min-h-[280px] overflow-hidden bg-navy-700/5">
              <img :src="apFeatured.image!" :alt="apFeatured.title" loading="lazy" class="w-full h-full object-cover" />
            </div>
            <div class="p-6 lg:p-9 flex flex-col justify-center">
              <div class="flex items-center gap-2 flex-wrap mb-3">
                <span class="text-xs font-bold text-orange">{{ apFeatured.outlet }}</span>
                <span class="text-[10px] font-bold bg-orange/12 text-orange px-2 py-0.5 rounded-full">最新報導</span>
              </div>
              <h3 class="font-serif text-xl lg:text-2xl font-black text-navy-700 mb-3 leading-snug">
                {{ apFeatured.title }}
              </h3>
              <p class="text-sm text-ink/60 leading-relaxed mb-5">{{ apFeatured.excerpt }}</p>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                  v-for="l in apFeatured.links"
                  :key="l.href"
                  :href="l.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="l.primary
                    ? 'inline-flex items-center gap-2 bg-orange text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-orange-400 transition-colors'
                    : 'text-sm font-semibold text-navy-700 hover:text-orange transition-colors'"
                >
                  {{ l.text }}
                </a>
              </div>
            </div>
          </article>

          <!-- BBC / Reuters / AFP / CNA -->
          <article
            v-for="item in fIntl"
            :key="item.title"
            class="group bg-white rounded-2xl overflow-hidden border border-navy-700/12 shadow-sm hover:shadow-xl transition-all flex flex-col"
          >
            <div class="aspect-video overflow-hidden">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-navy-700 to-[#0e2230] flex items-center justify-center px-4">
                <span class="font-serif text-xl font-black text-white/85 text-center leading-snug">{{ item.outlet }}</span>
              </div>
            </div>
            <div class="p-5 flex flex-col flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="text-xs font-bold text-orange">{{ item.outlet }}</span>
              </div>
              <h3 class="font-serif text-lg font-black text-navy-700 mb-2 leading-snug">{{ item.title }}</h3>
              <p class="text-sm text-ink/60 leading-relaxed mb-4 flex-1">{{ item.excerpt }}</p>
              <div class="flex items-center justify-end mt-auto pt-2">
                <a :href="item.link.href" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-orange hover:text-orange-400 transition-colors">{{ item.link.text }}</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 台灣媒體精選 -->
    <section v-show="showTw" class="bg-white py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          台灣媒體精選
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-3">每一次出現，都是一次信任累積</h2>
        <p class="text-ink/60 leading-relaxed mb-10 max-w-2xl">
          吳淡如、大愛新聞、天下等知名媒體的採訪，讓更多台灣家庭認識練健康。
        </p>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <article
            v-for="item in fTw"
            :key="item.title"
            class="group bg-cream-100 rounded-2xl overflow-hidden border border-navy-700/12 shadow-sm hover:shadow-xl transition-all flex flex-col"
          >
            <div class="aspect-video overflow-hidden">
              <img :src="item.image!" :alt="item.title" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div class="p-5 flex flex-col flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="text-xs font-bold text-orange">{{ item.outlet }}</span>
                <span v-if="item.cat" class="text-[10px] font-medium bg-navy-700/8 text-navy-700 px-1.5 py-0.5 rounded">{{ item.cat }}</span>
              </div>
              <h3 class="font-serif text-base font-black text-navy-700 mb-2 leading-snug">{{ item.title }}</h3>
              <p class="text-sm text-ink/60 leading-relaxed mb-4 flex-1">{{ item.excerpt }}</p>
              <div class="flex items-center justify-end mt-auto pt-2">
                <a :href="item.link.href" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-orange hover:text-orange-400 transition-colors">{{ item.link.text }}</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 所有報導 -->
    <section v-show="showMore" class="py-14 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
          <span class="w-5 h-0.5 bg-orange" />
          完整報導紀錄
        </div>
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy-700 mb-8">所有報導</h2>

        <div class="space-y-3 max-w-4xl">
          <a
            v-for="item in fMore"
            :key="item.title + item.date"
            :href="item.link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white border border-navy-700/10 rounded-xl px-5 py-4 hover:border-orange/40 hover:shadow-sm transition-all"
          >
            <div class="flex items-center gap-2 flex-wrap sm:w-48 sm:shrink-0">
              <span class="text-xs font-bold text-orange">{{ item.outlet }}</span>
              <span v-if="item.lkk4" class="text-[10px] font-bold bg-orange/12 text-orange px-1.5 py-0.5 rounded">LKK4</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-navy-700 group-hover:text-orange transition-colors leading-snug">{{ item.title }}</div>
            </div>
            <span class="text-orange text-sm font-bold sm:shrink-0 whitespace-nowrap">{{ item.link.text }}</span>
          </a>
        </div>

        <div class="mt-8">
          <a
            href="https://l-kk.tw/category/news/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors font-medium"
          >
            查看全部 36+ 篇報導（舊網站）→
          </a>
        </div>
      </div>
    </section>

    <!-- 記者洽詢 CTA -->
    <section class="bg-navy-700 text-white py-16 lg:py-20">
      <div class="container mx-auto px-4 text-center">
        <div class="inline-flex items-center gap-2 text-sm font-bold text-orange-300 tracking-widest uppercase mb-3">
          <span class="w-5 h-0.5 bg-orange" />
          For Journalists &amp; Editors
        </div>
        <h2 class="font-serif text-3xl lg:text-4xl font-black mb-4">歡迎<span class="text-orange">聯繫我們</span></h2>
        <p class="text-white/60 leading-relaxed mb-8 max-w-2xl mx-auto">
          如果你正在報導中高齡健康、銀髮健身、或台灣的積極老化故事，我們很樂意協助。
        </p>
        <div class="flex flex-wrap justify-center items-center gap-4">
          <NuxtLink
            to="/cooperation"
            class="inline-flex items-center gap-2 bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors"
          >
            媒體採訪洽詢 →
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
