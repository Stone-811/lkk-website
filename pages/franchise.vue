<script setup lang="ts">
useHead({
  title: '加盟說明｜練健康 LKK Wellness',
  meta: [
    { name: 'description', content: '練健康加盟說明，七年深耕中高齡訓練市場，物理治療師主導的訓練體系，LKK4 賽事品牌資產。' },
    { name: 'robots', content: 'noindex' }
  ]
})

const stats = [
  { num: '5.4億', label: '亞太地區 60 歲以上人口', src: '來源：WHO, 2024' },
  { num: '2030', label: '亞洲每 5 人將有 1 人超過 60 歲', src: '來源：聯合國人口署' },
  { num: '8年', label: '練健康深耕中高齡訓練市場', src: '2018 年成立至今' },
  { num: '6屆', label: 'LKK4 年度中高齡競技賽事', src: '台灣唯一同類型賽事' },
]

const marketPoints = [
  '台灣 65 歲以上人口佔比已達 <strong class="text-navy font-medium">19.2%</strong>，預計 2025 年進入超高齡社會（20%）',
  '新加坡、馬來西亞、香港同步面對高齡化，且中高收入族群比例更高，消費力更強',
  '現有健身市場幾乎以年輕族群為主，專門服務中高齡、有醫療背景支撐的訓練品牌<strong class="text-navy font-medium">極度稀缺</strong>',
  '肌少症、骨質疏鬆、術後復健的社會關注持續升高，帶動相關健康服務需求的快速成長',
]

const timingCards = [
  { num: '01', title: '市場空窗正在關閉', body: '高齡化帶來的商業機會已有更多人意識到，但能真正落地執行、有完整方法論的品牌仍然極少。先進場的品牌將取得定位優勢，後進者需要付出更高的市場教育成本。' },
  { num: '02', title: '練健康的體系已經成熟', body: '七年的實戰經驗、四間分店的營運模式、完整的教練培訓體系、以及六屆 LKK4 建立的品牌知名度——這些都已就位。你不是在投資一個概念，而是一個已被市場驗證的系統。' },
  { num: '03', title: '我們正在選擇性擴張', body: '我們不以規模為優先，而是選擇真正理解這個市場、有資源把事情做好的夥伴。現在是加入討論的合適時機，我們希望和有意思的人一起把這件事做大。' },
]

const differentiators = [
  {
    tag: '方法論',
    title: '由物理治療師主導的訓練體系',
    body: '一般健身品牌的教練是體育背景，練健康的核心團隊是物理治療師和呼吸治療師。這個差異讓我們能服務一般健身無法接觸的族群——術後、慢性病、骨質疏鬆——而這些正是中高齡市場中需求最強、黏著度最高的客群。',
  },
  {
    tag: '認證體系',
    title: '練健康學院：教練不靠外聘',
    body: '我們自建教練認證培訓體系（練健康學院），採學分制發證。這意味著加盟夥伴的教練人才問題，不需要自行從市場上搜尋和篩選——有一個完整的培訓和認證系統在支撐。這是大多數連鎖健身品牌做不到的。',
  },
  {
    tag: '品牌資產',
    title: '已有媒體信任度和公眾知名度',
    body: '大愛新聞、吳淡如、動思學院等媒體背書，以及六屆 LKK4 建立的賽事品牌，讓練健康在中高齡訓練這個品類上已有公眾辨識度。加盟夥伴進場時，不需要從零開始建立品牌信任——你站在一個已有高度的起點上。',
  },
]

const lkk4Points = [
  { iconType: 'marketing', title: '賽事即行銷，無需另外投放廣告', desc: '每年一屆的 LKK4 產生大量媒體曝光、社群擴散和口碑，這些流量自然流入分店，降低加盟夥伴的行銷成本' },
  { iconType: 'globe', title: '亞洲擴張的贊助吸引力', desc: 'LKK4 進入新市場後，對保健品、保險、金融品牌的贊助吸引力，是一般健身中心無法比擬的附加資產' },
  { iconType: 'growth', title: '參賽者即最高黏著度學員', desc: '參加過 LKK4 的學員，流失率遠低於一般學員。賽事讓訓練有了目標，目標讓人留下來' },
  { iconType: 'shield', title: '模仿者已出現，但七年的積累無法複製', desc: '市面上已有品牌開始模仿練健康的方向，甚至出現類似賽事。但六屆的歷史、媒體認知、學員社群，是時間積累出來的護城河' },
]

const supports = [
  { iconType: 'education', title: '教練培訓與認證', desc: '練健康學院提供完整的教練培訓課程和學分制認證，確保每個門市的服務品質一致，不依賴外部人才市場的不確定性。' },
  { iconType: 'clipboard', title: '營運方法論', desc: '七年累積的學員評估流程、課程設計框架、客戶管理系統，讓加盟夥伴不需要從頭摸索，直接站在已驗證的系統上運作。' },
  { iconType: 'trophy', title: 'LKK4 賽事體系', desc: '加盟夥伴進入 LKK4 的賽事生態，包含品牌使用、賽事籌辦支援、贊助招商協助，讓門市從第一天就有不同於競爭者的差異化資產。' },
  { iconType: 'megaphone', title: '品牌與行銷支援', desc: '台灣總部建立的媒體關係、社群內容體系、品牌設計規範，提供給夥伴使用，確保品牌在不同市場的一致性。' },
  { iconType: 'globe', title: '在地市場進入支援', desc: '針對不同市場（新加坡、馬來西亞、香港等），提供在地化建議，包括法規差異、目標族群定位、語言本地化，協助夥伴減少進場摩擦。' },
  { iconType: 'handshake', title: '持續的夥伴關係', desc: '不是簽約後就放生。我們建立持續的溝通機制，包含定期交流、問題回應、以及隨體系升級而同步更新的知識支援。' },
]

const formData = ref({
  name: '',
  organization: '',
  email: '',
  phone: '',
  region: '',
  cooperationType: '',
  message: '',
})
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const handleSubmit = async () => {
  isSubmitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''

  try {
    const response = await fetch('/api/leads/franchise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData.value,
        sourcePage: '/franchise',
        utm: useUtm().getUtm(),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '提交失敗，請稍後再試')
    }

    submitStatus.value = 'success'
    formData.value = {
      name: '',
      organization: '',
      email: '',
      phone: '',
      region: '',
      cooperationType: '',
      message: '',
    }
  } catch (error) {
    submitStatus.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '系統錯誤，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero -->
    <section class="relative bg-navy min-h-screen flex items-center pt-16 overflow-hidden">
      <div class="absolute inset-0 opacity-[0.03] bg-[length:200px]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E&quot;)" />
      <div class="absolute w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(251,114,10,0.14)_0%,transparent_70%)] -top-[200px] -right-[150px]" />
      <div class="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(58,106,133,0.35)_0%,transparent_70%)] -bottom-[100px] -left-[100px]" />

      <div class="container mx-auto px-4 relative z-10 py-16 lg:py-24">
        <div class="flex items-center gap-3 text-orange text-sm font-medium tracking-widest uppercase mb-8">
          <span class="w-7 h-px bg-orange" />
          練健康 LKK Wellness・加盟說明
          <span class="w-7 h-px bg-orange" />
        </div>

        <h1 class="font-serif text-5xl lg:text-7xl font-black text-white leading-tight mb-3">
          亞洲正在<br /><span class="text-orange italic">老去</span>
        </h1>
        <p class="font-serif text-xl lg:text-2xl text-white/45 mb-8 tracking-wide">
          而這個市場，幾乎還沒有人在認真做
        </p>

        <p class="text-white/60 text-lg font-light leading-relaxed max-w-xl mb-10">
          全球人口老化速度最快的地區，正是我們所在的亞洲。<br />
          <strong class="text-white/85 font-medium">需求已經在這裡，缺的是有方法論的人來承接它。</strong><br />
          練健康花了七年建立這套體系，現在我們正在選擇合適的夥伴，一起把它帶出去。
        </p>

        <div class="flex items-center gap-6 flex-wrap">
          <a href="#apply" class="inline-flex items-center gap-2 bg-orange text-white font-medium px-9 py-4 rounded shadow-lg shadow-orange/40 hover:bg-orange-600 transition-all">
            預約加盟說明會 →
          </a>
          <span class="text-white/25 text-sm tracking-wide">說明會保密進行，不對外公開</span>
        </div>
      </div>
    </section>

    <!-- Stats Bar -->
    <div class="bg-orange">
      <div class="container mx-auto">
        <div class="grid grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(stat, idx) in stats"
            :key="stat.label"
            :class="['py-6 px-4 text-center border-white/20', idx < 3 ? 'border-r' : '']"
          >
            <div class="font-serif text-3xl lg:text-4xl font-black text-white leading-none">{{ stat.num }}</div>
            <div class="text-white/70 text-xs mt-1 tracking-wide uppercase">{{ stat.label }}</div>
            <div class="text-white/45 text-[10px] mt-1">{{ stat.src }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Market Section -->
    <section class="py-20 bg-cream">
      <div class="container mx-auto px-4">
        <span class="text-orange text-sm font-medium tracking-widest uppercase block mb-4">市場機會</span>
        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 class="font-serif text-4xl lg:text-5xl font-black text-navy leading-tight mb-6">
              這個需求<br /><span class="text-orange italic">已經存在</span>
            </h2>
            <p class="text-ink/70 leading-relaxed mb-8 max-w-lg">
              高齡人口不只是在增加，他們的消費能力和健康意識也在同步提升。這一代的 60 歲，和上一代的 60 歲完全不同——他們有意願、有能力、有需求，但幾乎找不到真正懂他們的訓練服務。
            </p>
            <div class="space-y-4">
              <div v-for="(point, idx) in marketPoints" :key="idx" class="flex gap-3 items-start">
                <span class="w-1.5 h-1.5 bg-orange rounded-full mt-2.5 flex-shrink-0" />
                <p class="text-ink/70 leading-relaxed" v-html="point" />
              </div>
            </div>
          </div>

          <!-- Data Callout -->
          <div class="bg-[#0f2130] rounded p-8 space-y-6">
            <div>
              <div class="font-serif text-5xl font-black text-orange leading-none mb-2">19.2%</div>
              <div class="text-white/65 text-sm leading-relaxed">台灣 65 歲以上人口佔比<br />亞洲最快速高齡化地區之一</div>
              <div class="text-white/30 text-xs mt-1">來源：國家發展委員會, 2024</div>
            </div>
            <div class="h-px bg-white/10" />
            <div>
              <div class="font-serif text-5xl font-black text-orange leading-none mb-2">2倍+</div>
              <div class="text-white/65 text-sm leading-relaxed">亞太地區老年健康相關支出<br />預估 2035 年前成長速度</div>
              <div class="text-white/30 text-xs mt-1">來源：Deloitte Asia Pacific Health Report</div>
            </div>
            <div class="h-px bg-white/10" />
            <div>
              <div class="font-serif text-5xl font-black text-orange leading-none mb-2">幾乎0</div>
              <div class="text-white/65 text-sm leading-relaxed">具備系統化方法論、醫療背景支撐<br />且已有賽事品牌的中高齡訓練連鎖</div>
              <div class="text-white/30 text-xs mt-1">東南亞市場現況</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Timing Section -->
    <section class="py-20 bg-navy">
      <div class="container mx-auto px-4">
        <span class="text-orange/80 text-sm font-medium tracking-widest uppercase block mb-4">為什麼是現在</span>
        <h2 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-10">
          時機<span class="text-orange italic">從不等人</span>
        </h2>

        <div class="grid lg:grid-cols-3 gap-0.5 bg-white/10 rounded overflow-hidden mb-10">
          <div
            v-for="card in timingCards"
            :key="card.num"
            class="bg-navy p-8 hover:bg-white/[0.04] transition-colors"
          >
            <div class="font-serif text-5xl font-black text-orange/35 leading-none mb-4">{{ card.num }}</div>
            <h3 class="font-serif text-lg font-bold text-white mb-3">{{ card.title }}</h3>
            <p class="text-white/50 text-sm leading-relaxed">{{ card.body }}</p>
          </div>
        </div>

        <div class="border border-white/10 rounded p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <p class="text-white/65 leading-relaxed">
            若你也認同這個市場機會，<strong class="text-white font-medium">我們希望和你進一步談談</strong>。說明會保密進行，沒有銷售壓力。
          </p>
          <a href="#apply" class="inline-flex items-center gap-2 bg-orange text-white font-medium px-8 py-3 rounded shadow-lg shadow-orange/40 hover:bg-orange-600 transition-all flex-shrink-0">
            預約說明會 →
          </a>
        </div>
      </div>
    </section>

    <!-- Differentiation -->
    <section class="py-20 bg-cream">
      <div class="container mx-auto px-4">
        <span class="text-orange text-sm font-medium tracking-widest uppercase block mb-4">為什麼是練健康</span>
        <h2 class="font-serif text-4xl lg:text-5xl font-black text-navy leading-tight mb-3">
          不是自己做，<br /><span class="text-orange italic">而是站在體系上做</span>
        </h2>
        <p class="text-ink/70 leading-relaxed max-w-xl mb-10">
          自己開一間健身房服務中高齡，和加入一個已有方法論、認證體系、品牌資產的體系，是完全不同的事。
        </p>

        <div class="space-y-0 border-t border-navy/15">
          <div
            v-for="(item, idx) in differentiators"
            :key="item.title"
            class="grid lg:grid-cols-[3rem_1fr_1fr] gap-4 lg:gap-8 py-8 border-b border-navy/15"
          >
            <div class="font-serif text-4xl font-black text-navy/15 leading-none">0{{ idx + 1 }}</div>
            <div>
              <span class="text-orange text-xs font-medium tracking-widest uppercase block mb-2">{{ item.tag }}</span>
              <h3 class="font-serif text-lg font-bold text-navy">{{ item.title }}</h3>
            </div>
            <p class="text-ink/60 text-sm leading-relaxed lg:pt-4">{{ item.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- LKK4 Section -->
    <section class="py-20 bg-navy-800 relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange to-transparent" />
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="relative">
            <div class="absolute -top-4 -left-4 font-serif text-[10rem] lg:text-[14rem] font-black text-white/[0.06] leading-none select-none">LKK4</div>
            <div class="relative z-10">
              <div class="inline-flex items-center gap-2 bg-orange/15 border border-orange/30 text-orange text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
                <span class="w-1.5 h-1.5 bg-orange rounded-full animate-pulse" />
                護城河
              </div>
              <h2 class="font-serif text-3xl lg:text-4xl font-black text-white leading-tight mb-4">
                競爭者可以<br />複製門市，<br />但複製不了<span class="text-orange"> LKK4</span>
              </h2>
              <p class="text-white/60 text-sm leading-relaxed max-w-md">
                LKK4 中高齡四項體能挑戰賽是練健康獨創的年度競技賽事，也是目前台灣唯一同類型賽事。七年的積累讓它成為一個有社群、有口碑、有媒體黏著度的品牌本身——而不只是一個活動。
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="point in lkk4Points"
              :key="point.title"
              class="flex gap-4 items-start p-4 bg-white/[0.04] border border-white/10 rounded hover:bg-white/[0.07] transition-colors"
            >
              <div class="flex-shrink-0 mt-0.5">
                <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="point.iconType === 'marketing'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h4v12H4zM16 8h4v12h-4zM2 12h20M12 4v4" />
                  <path v-else-if="point.iconType === 'globe'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path v-else-if="point.iconType === 'growth'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  <path v-else-if="point.iconType === 'shield'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 class="text-white font-medium text-sm mb-1">{{ point.title }}</h4>
                <p class="text-white/45 text-xs leading-relaxed">{{ point.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Support Section -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <span class="text-orange text-sm font-medium tracking-widest uppercase block mb-4">總部支援</span>
        <h2 class="font-serif text-4xl lg:text-5xl font-black text-navy leading-tight mb-3">
          你不是一個人<br /><span class="text-orange italic">在面對這個市場</span>
        </h2>
        <p class="text-ink/70 leading-relaxed max-w-xl mb-10">
          我們的目標不是找人開店，而是找對的夥伴，然後給他最好的後援讓他做好。
        </p>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/15 rounded overflow-hidden mb-8">
          <div
            v-for="item in supports"
            :key="item.title"
            class="bg-white p-6 hover:bg-cream transition-colors"
          >
            <div class="mb-4">
              <svg class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="item.iconType === 'education'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path v-if="item.iconType === 'education'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path v-if="item.iconType === 'clipboard'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                <path v-if="item.iconType === 'trophy'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                <path v-if="item.iconType === 'megaphone'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                <path v-if="item.iconType === 'globe'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path v-if="item.iconType === 'handshake'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="font-serif text-base font-bold text-navy mb-2">{{ item.title }}</h3>
            <p class="text-ink/50 text-sm leading-relaxed">{{ item.desc }}</p>
          </div>
        </div>

        <div class="bg-cream border border-navy/15 rounded p-6 flex flex-col lg:flex-row items-center gap-6">
          <p class="text-ink/70 text-sm leading-relaxed flex-1">
            以上所有支援的細節，包含具體的合作模式和條件，<strong class="text-navy font-medium">只在說明會中說明</strong>。我們希望在真正的對話中，找到適合一起做這件事的夥伴。
          </p>
          <a href="#apply" class="inline-flex items-center gap-2 bg-orange text-white font-medium px-8 py-3 rounded shadow-lg shadow-orange/40 hover:bg-orange-600 transition-all flex-shrink-0">
            預約說明會 →
          </a>
        </div>
      </div>
    </section>

    <!-- Application Form -->
    <section id="apply" class="py-20 bg-navy relative overflow-hidden">
      <div class="container mx-auto px-4 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span class="text-orange/80 text-sm font-medium tracking-widest uppercase block mb-4">預約說明會</span>
            <h2 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              讓我們<br /><span class="text-orange italic">深入談談</span>
            </h2>
            <p class="text-white/55 leading-relaxed mb-8">
              說明會以線上或面談方式進行，通常 60–90 分鐘，保密進行，沒有任何銷售壓力。我們只是想多了解你，也讓你更了解我們。
            </p>

            <div class="space-y-4 mb-8">
              <div class="flex gap-3 items-start">
                <span class="text-orange mt-1">→</span>
                <div>
                  <strong class="text-white/80 font-medium block">完整的品牌與市場說明</strong>
                  <span class="text-white/45 text-sm">無法在網站公開的資訊，在說明會中呈現</span>
                </div>
              </div>
              <div class="flex gap-3 items-start">
                <span class="text-orange mt-1">→</span>
                <div>
                  <strong class="text-white/80 font-medium block">雙向提問</strong>
                  <span class="text-white/45 text-sm">你問我們，我們也想了解你的背景和想法</span>
                </div>
              </div>
              <div class="flex gap-3 items-start">
                <span class="text-orange mt-1">→</span>
                <div>
                  <strong class="text-white/80 font-medium block">探索合作可能性</strong>
                  <span class="text-white/45 text-sm">不一定要立刻做決定，先看看有沒有可以一起做的事</span>
                </div>
              </div>
            </div>

            <div class="bg-orange/10 border border-orange/20 rounded p-4 text-white/45 text-sm leading-relaxed">
              <strong class="text-orange">保密說明：</strong> 本頁面不在搜尋引擎索引範圍，說明會內容保密，資料僅用於聯繫目的，不對外分享。
            </div>
          </div>

          <!-- Form -->
          <div class="bg-white rounded p-8 shadow-2xl">
            <h3 class="font-serif text-lg font-bold text-navy mb-1">填寫基本資料</h3>
            <p class="text-ink/50 text-sm mb-6 pb-6 border-b border-navy/15">
              我們會在 3 個工作天內以你偏好的方式聯繫，安排說明會時間
            </p>

            <div v-if="submitStatus === 'success'" class="text-center py-12">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="font-serif text-xl font-bold text-navy mb-2">感謝你的洽詢！</h3>
              <p class="text-ink/60 text-sm mb-4">我們將於 3 個工作天內與你聯繫，安排說明會時間。</p>
              <p class="text-ink/40 text-xs">確認信已寄送至你的信箱</p>
            </div>

            <form v-else @submit.prevent="handleSubmit" class="space-y-5">
              <div v-if="submitStatus === 'error'" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {{ errorMessage }}
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-ink/70 block mb-1.5">姓名 <span class="text-orange">*</span></label>
                  <input
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm"
                    placeholder="你的姓名"
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink/70 block mb-1.5">公司／機構名稱</label>
                  <input
                    v-model="formData.organization"
                    type="text"
                    class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm"
                    placeholder="如適用"
                  />
                </div>
              </div>

              <div>
                <label class="text-xs font-medium text-ink/70 block mb-1.5">電子郵件 <span class="text-orange">*</span></label>
                <input
                  v-model="formData.email"
                  type="email"
                  required
                  class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm"
                  placeholder="主要聯繫信箱"
                />
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-ink/70 block mb-1.5">聯繫電話</label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm"
                    placeholder="+886 或當地號碼"
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-ink/70 block mb-1.5">所在地區 <span class="text-orange">*</span></label>
                  <select
                    v-model="formData.region"
                    required
                    class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm bg-white"
                  >
                    <option value="">請選擇</option>
                    <option value="台灣">台灣</option>
                    <option value="新加坡">新加坡</option>
                    <option value="馬來西亞">馬來西亞</option>
                    <option value="香港">香港</option>
                    <option value="中國大陸">中國大陸</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-xs font-medium text-ink/70 block mb-1.5">你對哪種合作方式最感興趣？ <span class="text-orange">*</span></label>
                <select
                  v-model="formData.cooperationType"
                  required
                  class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm bg-white"
                >
                  <option value="">請選擇</option>
                  <option value="實體加盟分店">實體加盟分店</option>
                  <option value="區域代理">區域代理／主加盟</option>
                  <option value="教練認證授權">教練認證授權</option>
                  <option value="LKK4賽事授權">LKK4 賽事授權</option>
                  <option value="尚在評估中">尚在評估中，想先了解</option>
                </select>
              </div>

              <div>
                <label class="text-xs font-medium text-ink/70 block mb-1.5">想讓我們事先了解的事（選填）</label>
                <textarea
                  v-model="formData.message"
                  rows="3"
                  class="w-full px-4 py-2.5 border border-navy/20 rounded focus:ring-2 focus:ring-navy focus:border-navy outline-none text-sm resize-none"
                  placeholder="你的背景、目前的想法、或任何想提前說明的事項..."
                />
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full bg-orange text-white font-medium py-3.5 rounded shadow-lg shadow-orange/35 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? '送出中...' : '送出預約申請 →' }}
              </button>
              <p class="text-center text-xs text-ink/40">你的資料保密處理，僅用於說明會安排，不作其他用途</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
