<script setup lang="ts">
const coaches = [
  {
    id: '1',
    name: '鄭宇劭',
    role: '物理治療師・練健康總教練',
    avatar: '鄭',
    description: '國家高考物理治療師，NSCA-CSCS 美國肌力體能訓練專家，曾任世大運運動傷害防護組場館經理、競速滑冰世界盃隨隊物理治療師，深耕中高齡訓練與術後訓練多年。',
    creds: ['物理治療師', '中高齡訓練', '術後訓練'],
    photo: '/images/team/cheng-yushao.webp',
  },
  {
    id: '2',
    name: '吳皓宇',
    role: '營養師・教練部副區經理',
    avatar: '吳',
    description: '國家高考營養師，ACE-CPT 美國運動協會私人教練，專精增肌減脂與銀髮族訓練，曾任三鐵選手合作營養師。',
    creds: ['營養師', '增肌減脂', '銀髮族訓練'],
    photo: '/images/team/wu-haoyu.webp',
  },
  {
    id: '3',
    name: '蕭彥嶸',
    role: '南京店店經理・運動防護員',
    avatar: '蕭',
    description: '高雄醫學大學運動醫學系畢業，ACSM-EP 認證教練，具教育部體育署運動防護員與 EMT-1 資格，專精大重量訓練與健力三項，協助學員安全有效地達成訓練目標。',
    creds: ['肌力與體能教練', '舉重訓練', '中高齡訓練'],
    photo: '/images/team/xiao-yanrong.webp',
  },
]
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <!-- Section header -->
      <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
        <span class="w-5 h-0.5 bg-orange" />
        專業教練團隊
      </div>
      <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 mb-3">
        由<span class="text-orange">醫療背景</span>專業人員組成
      </h2>
      <p class="text-ink/60 leading-relaxed mb-10">
        練健康成立於 2019 年，由一群關心台灣高齡健康的物理治療師、營養師與專業教練組成，結合最新的醫學研究與運動科學，專注培養專業且具豐富實戰經驗的教練，服務中高齡族群。
      </p>

      <!-- Coaches grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="coach in coaches"
          :key="coach.id"
          class="bg-white rounded-3xl p-6 lg:p-8 border border-navy-700/15 shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform"
        >
          <!-- Avatar -->
          <div class="w-32 h-32 rounded-full bg-navy-700 flex items-center justify-center text-white font-serif text-4xl font-bold mb-4 border-[3px] border-cream-200 overflow-hidden relative">
            <img
              v-if="coach.photo"
              :src="coach.photo"
              :alt="coach.name"
              class="w-full h-full object-cover object-top"
            />
            <span v-else>{{ coach.avatar }}</span>
          </div>

          <!-- Name & role -->
          <h3 class="font-serif text-lg font-bold text-navy-700 mb-1">
            {{ coach.name }} 教練
          </h3>
          <div class="text-sm text-orange font-semibold tracking-wide mb-3">
            {{ coach.role }}
          </div>

          <!-- Description -->
          <p class="text-sm text-ink/50 leading-relaxed mb-4">
            {{ coach.description }}
          </p>

          <!-- Credentials -->
          <div class="flex flex-wrap gap-1.5 justify-center">
            <span
              v-for="cred in coach.creds"
              :key="cred"
              class="text-xs font-medium text-navy-700 bg-navy-700/[0.08] px-2.5 py-0.5 rounded-full"
            >
              {{ cred }}
            </span>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center mt-10">
        <NuxtLink
          to="/team-intro/coaches"
          class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors"
        >
          查看完整教練介紹 &rarr;
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
