<script setup lang="ts">
useHead({
  title: '商品導購｜練健康 LKK Wellness',
  meta: [
    { name: 'description', content: '練健康商品導購，物理治療師與專業教練團隊嚴選。從精準調理、居家防跌到自主增肌，我們幫你挑選最安全、最科學化的銀髮健康必備品。' }
  ]
})

const nutritionProducts = [
  { name: '高純度乳清蛋白粉 (銀髮高吸收配方)', desc: '富含BCAA，極佳消化率，有效針對高齡肌肉流失進行日常營養阻截。', price: 1280, icon: '1', tag: '熱銷推薦', tagType: 'hot' },
  { name: '活性海藻鈣＋維生素 D3 膠囊', desc: '高鈣足量添加，協同D3促進鈣吸收，強健中高齡骨質密度的關鍵基石。', price: 780, icon: '2' },
  { name: '專利深海魚油高濃縮軟膠囊', desc: 'rTG型態高純度EPA/DHA，維持思緒敏捷與新陳代謝流暢循環。', price: 950, icon: '3', tag: '教練推薦' },
  { name: '高機能活性益生菌 (順暢防護型)', desc: '專利耐酸菌株，維護高齡腸道菌相平衡，全面提升自主消化防護力。', price: 880, icon: '4' },
  { name: '非變性二型膠原蛋白 (UC-II) 關鍵飲', desc: '每日一瓶，修復關鍵活動磨損，找回蹲低爬高的關節靈活自在度。', price: 1680, icon: '5' },
]

const safetyProducts = [
  { name: '強磁壓紋浴室防滑不鏽鋼扶手', desc: '物理治療師極力推薦，針對潮濕浴室起立坐下提供150kg極致穩固支撐。', price: 850, icon: '1', tag: '核心防跌', tagType: 'hot' },
  { name: '抗菌鋁合金高低可調防滑洗澡椅', desc: '高剛性防鏽支架，多檔高度微調，大幅度減少長輩洗澡時站立滑倒風險。', price: 1480, icon: '2' },
  { name: '醫療級四腳避震氣墊防滑健走杖', desc: '仿人體關節多視角抓地，分散雙膝壓力，讓每一次外出散步都穩健安心。', price: 980, icon: '3', tag: '外出首選' },
  { name: '超輕量可折疊雙煞車鋁合金輪椅', desc: '全車重量僅9.8kg，一秒折疊收納，出院、旅遊銜接雙腿動作弱化的最佳幫手。', price: 5500, icon: '4' },
  { name: '門檻防滑無障礙加高斜坡墊 (全橡膠)', desc: '徹底解決掃地機器人與輪椅門檻阻礙，更是避免老人家小碎步絆倒的隱形功臣。', price: 680, icon: '5' },
]

const fitnessProducts = [
  { name: '環保無味防滾動包膠六角啞鈴組', desc: '經典多邊防滾動設計，抓握手感細緻，居家進行阻力推舉、深蹲阻力加重核心。', price: 880, icon: '1', tag: '必備基礎', tagType: 'hot' },
  { name: '多功能多角度快速調整加固重訓椅', desc: '高承重鋼管、加厚背墊，7檔角度調節，提供銀髮居家訓練最高層級防翻車支撐。', price: 2980, icon: '2' },
  { name: '天然乳膠防斷裂高剛性阻力帶五件組', desc: '物理治療復健、上肢開背、下肢蚌殼式必備，循序漸進安全對抗阻力。', price: 450, icon: '3', tag: '彈性抗阻' },
  { name: '免打孔室內門框安全加固自鎖單槓', desc: '雙向防滑大基座、重力自鎖，居家垂吊伸展、脊椎減壓與上肢拉力養成利器。', price: 790, icon: '4' },
  { name: '核心訓練靜音防爆加厚防滑健身球', desc: '高彈防爆蜂巢結構，極佳的骨盆核心訓練工具，在安全晃動中召喚深層平衡肌肉群。', price: 490, icon: '5' },
]

const showModal = ref(false)
const modalProduct = ref('')

const openModal = (name: string) => {
  modalProduct.value = name
  showModal.value = true
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Hero -->
    <section class="bg-navy pt-24 pb-16 relative overflow-hidden text-center">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,114,10,0.08)_0%,transparent_60%)]" />
      <div class="container mx-auto px-4 relative z-10">
        <div class="flex items-center gap-3 justify-center text-orange text-sm font-bold tracking-widest uppercase mb-4">
          <span class="w-4 h-px bg-orange" />
          LKK Wellness Select
          <span class="w-4 h-px bg-orange" />
        </div>
        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
          支撐你一輩子的<span class="text-orange">自主健康生活</span>
        </h1>
        <p class="text-white/65 font-light max-w-xl mx-auto">
          物理治療師與專業教練團隊嚴選。從精準調理、居家防跌到自主增肌，我們幫你挑選最安全、最科學化的銀髮健康必備品。
        </p>
      </div>
    </section>

    <!-- Category Bar -->
    <div class="sticky top-16 z-40 bg-cream border-b border-navy/15">
      <div class="container mx-auto px-4">
        <div class="flex justify-center gap-3 py-3 overflow-x-auto">
          <a href="#nutrition" class="px-5 py-2 bg-white border border-navy/15 rounded-full text-sm font-medium text-navy hover:border-orange hover:text-orange transition-colors whitespace-nowrap">
            銀髮族營養調理
          </a>
          <a href="#safety" class="px-5 py-2 bg-white border border-navy/15 rounded-full text-sm font-medium text-navy hover:border-orange hover:text-orange transition-colors whitespace-nowrap">
            居家安全輔具
          </a>
          <a href="#fitness" class="px-5 py-2 bg-white border border-navy/15 rounded-full text-sm font-medium text-navy hover:border-orange hover:text-orange transition-colors whitespace-nowrap">
            專業健身器材
          </a>
        </div>
      </div>
    </div>

    <main class="container mx-auto px-4 py-12">
      <!-- Nutrition Section -->
      <section id="nutrition" class="mb-16 scroll-mt-32">
        <div class="mb-8">
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            銀髮族營養調理
          </h2>
          <p class="text-ink/50 text-sm mt-1">專為40歲後與高齡體質調配，著重高吸收率、肌肉維持與關節關鍵防護。</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <article
            v-for="product in nutritionProducts"
            :key="product.name"
            class="bg-white border border-navy/15 rounded overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="h-44 bg-gradient-to-br from-cream to-cream/50 flex items-center justify-center relative border-b border-navy/10">
              <span
                v-if="product.tag"
                :class="['absolute top-3 left-3 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded', product.tagType === 'hot' ? 'bg-orange text-white' : 'bg-navy text-white']"
              >
                {{ product.tag }}
              </span>
              <div class="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-navy text-sm leading-snug mb-1">{{ product.name }}</h3>
              <p class="text-ink/50 text-xs leading-relaxed flex-1">{{ product.desc }}</p>
            </div>
            <div class="px-4 pb-4 space-y-2">
              <div class="font-serif text-lg font-black text-orange">
                <small class="text-ink/40 font-normal text-xs mr-0.5">NT$</small>{{ product.price.toLocaleString() }}
              </div>
              <button @click="openModal(product.name)" class="w-full py-2 border border-navy text-navy text-sm font-medium rounded hover:bg-navy hover:text-white transition-colors">
                了解詳情
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- Safety Section -->
      <section id="safety" class="mb-16 scroll-mt-32">
        <div class="mb-8">
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            居家安全輔具
          </h2>
          <p class="text-ink/50 text-sm mt-1">守護長輩在家的最後防線，著重浴室、臥室與進出動線的防跌防護。</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <article
            v-for="product in safetyProducts"
            :key="product.name"
            class="bg-white border border-navy/15 rounded overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="h-44 bg-gradient-to-br from-cream to-cream/50 flex items-center justify-center relative border-b border-navy/10">
              <span
                v-if="product.tag"
                :class="['absolute top-3 left-3 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded', product.tagType === 'hot' ? 'bg-orange text-white' : 'bg-navy text-white']"
              >
                {{ product.tag }}
              </span>
              <div class="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-navy text-sm leading-snug mb-1">{{ product.name }}</h3>
              <p class="text-ink/50 text-xs leading-relaxed flex-1">{{ product.desc }}</p>
            </div>
            <div class="px-4 pb-4 space-y-2">
              <div class="font-serif text-lg font-black text-orange">
                <small class="text-ink/40 font-normal text-xs mr-0.5">NT$</small>{{ product.price.toLocaleString() }}
              </div>
              <button @click="openModal(product.name)" class="w-full py-2 border border-navy text-navy text-sm font-medium rounded hover:bg-navy hover:text-white transition-colors">
                了解詳情
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- Fitness Section -->
      <section id="fitness" class="mb-8 scroll-mt-32">
        <div class="mb-8">
          <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy">
            專業健身器材
          </h2>
          <p class="text-ink/50 text-sm mt-1">迎擊肌肉衰退，適合居家自主操作與教練課後課表落實的精選器材。</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <article
            v-for="product in fitnessProducts"
            :key="product.name"
            class="bg-white border border-navy/15 rounded overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="h-44 bg-gradient-to-br from-cream to-cream/50 flex items-center justify-center relative border-b border-navy/10">
              <span
                v-if="product.tag"
                :class="['absolute top-3 left-3 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded', product.tagType === 'hot' ? 'bg-orange text-white' : 'bg-navy text-white']"
              >
                {{ product.tag }}
              </span>
              <div class="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h4v12H4zM16 8h4v12h-4zM2 12h20" />
                </svg>
              </div>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-navy text-sm leading-snug mb-1">{{ product.name }}</h3>
              <p class="text-ink/50 text-xs leading-relaxed flex-1">{{ product.desc }}</p>
            </div>
            <div class="px-4 pb-4 space-y-2">
              <div class="font-serif text-lg font-black text-orange">
                <small class="text-ink/40 font-normal text-xs mr-0.5">NT$</small>{{ product.price.toLocaleString() }}
              </div>
              <button @click="openModal(product.name)" class="w-full py-2 border border-navy text-navy text-sm font-medium rounded hover:bg-navy hover:text-white transition-colors">
                了解詳情
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-5"
        @click="showModal = false"
      >
        <div class="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-2xl" @click.stop>
          <div class="flex justify-center mb-4">
            <svg class="w-12 h-12 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="font-serif text-xl font-black text-navy mb-3">{{ modalProduct }} - 洽詢</h3>
          <p class="text-ink/60 text-sm leading-relaxed mb-6">
            本網頁為「練健康商城」之一頁式視覺與商品展示示意設計，目前暫不開放直接線上購物。<br /><br />
            <strong class="text-navy">若您對此商品有訂購或體驗需求，歡迎前往或致電練健康各大實體分店，由您的專屬教練或現場人員為您提供預購與諮詢服務！</strong>
          </p>
          <button @click="showModal = false" class="bg-orange text-white font-medium px-6 py-2.5 rounded shadow-lg shadow-orange/35 hover:bg-orange-400 transition-colors">
            我知道了
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
