<script setup lang="ts">
useHead({
  title: 'LKK4 參賽成績查詢｜練健康',
  meta: [
    { name: 'description', content: 'LKK4 中高齡四項體能挑戰賽成績查詢，選擇參賽年度並輸入姓名即可查詢您的參賽成績紀錄。' }
  ]
})

interface LKK4Record {
  id: string
  year: number
  name: string
  competitionGroup: string
  rank: number | null
  finalScore: number
  teamName: string | null
  gender: string
}

const year = ref('')
const name = ref('')
const searched = ref(false)
const isLoading = ref(false)
const records = ref<LKK4Record[]>([])
const error = ref('')

const availableYears = ['2025', '2024']

const handleSearch = async () => {
  if (!year.value || !name.value.trim()) return

  isLoading.value = true
  error.value = ''
  records.value = []

  try {
    const res = await fetch(
      `/api/public/lkk4-records?year=${encodeURIComponent(year.value)}&name=${encodeURIComponent(name.value.trim())}`
    )
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || '查詢失敗')
    }

    records.value = data.data || []
    searched.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : '查詢失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

const handleReset = () => {
  year.value = ''
  name.value = ''
  searched.value = false
  records.value = []
  error.value = ''
}

const getGroupDisplayName = (group: string) => {
  const groupMap: Record<string, string> = {
    '長青混合組': '長青混合組',
    '男子第一組': '男子第一組',
    '男子第二組': '男子第二組',
    '男子第三組': '男子第三組',
    '男子第四組': '男子第四組',
    '女子第一組': '女子第一組',
    '女子第二組': '女子第二組',
    '女子第三組': '女子第三組',
    '女子第四組': '女子第四組',
  }
  return groupMap[group] || group
}
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero -->
    <section class="relative bg-[#0e2230] py-16 lg:py-24 overflow-hidden text-center">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,114,10,0.15)_0%,transparent_60%)]" />
      <div class="container mx-auto px-4 relative z-10">
        <NuxtLink
          to="/lkk4"
          class="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回 LKK4 賽事頁
        </NuxtLink>

        <h1 class="font-serif text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
          LKK4 <span class="text-orange">參賽成績查詢</span>
        </h1>
        <p class="text-white/60 text-lg max-w-xl mx-auto">
          選擇參賽年度並輸入姓名，即可查詢您的參賽成績紀錄
        </p>
      </div>
    </section>

    <!-- Search Form -->
    <section class="py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-lg mx-auto">
          <form @submit.prevent="handleSearch" class="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-navy/10">
            <div class="space-y-5">
              <!-- Year -->
              <div>
                <label for="year" class="block text-sm font-semibold text-navy mb-2">
                  參賽年度 <span class="text-orange">*</span>
                </label>
                <select
                  id="year"
                  v-model="year"
                  class="w-full px-4 py-3 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-colors bg-white"
                  required
                >
                  <option value="">請選擇年度</option>
                  <option v-for="y in availableYears" :key="y" :value="y">
                    {{ y }} 年
                  </option>
                </select>
              </div>

              <!-- Name -->
              <div>
                <label for="name" class="block text-sm font-semibold text-navy mb-2">
                  姓名 <span class="text-orange">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  v-model="name"
                  placeholder="請輸入報名時填寫的姓名"
                  class="w-full px-4 py-3 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-colors"
                  required
                />
              </div>

              <!-- Error Message -->
              <div v-if="error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                {{ error }}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="isLoading || !year || !name.trim()"
                class="w-full bg-orange text-white font-bold py-3 rounded-lg shadow-lg shadow-orange/25 hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <template v-if="isLoading">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  查詢中...
                </template>
                <template v-else>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  查詢成績
                </template>
              </button>
            </div>
          </form>

          <!-- Search Result - Has Records -->
          <div v-if="searched && records.length > 0" class="mt-8 bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-navy/10">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 class="font-serif text-xl font-bold text-navy">
                  查詢成功
                </h3>
                <p class="text-ink/60 text-sm">
                  共找到 {{ records.length }} 筆成績紀錄
                </p>
              </div>
            </div>

            <!-- Records Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-navy/10">
                    <th class="text-left py-3 px-2 font-semibold text-navy">年度</th>
                    <th class="text-left py-3 px-2 font-semibold text-navy">組別</th>
                    <th class="text-left py-3 px-2 font-semibold text-navy">隊名</th>
                    <th class="text-center py-3 px-2 font-semibold text-navy">名次</th>
                    <th class="text-right py-3 px-2 font-semibold text-navy">成績 (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in records" :key="record.id" class="border-b border-navy/5 hover:bg-cream/50">
                    <td class="py-3 px-2">
                      <span class="font-medium text-navy">{{ record.year }}</span>
                    </td>
                    <td class="py-3 px-2">
                      <span class="text-ink/80">{{ getGroupDisplayName(record.competitionGroup) }}</span>
                    </td>
                    <td class="py-3 px-2">
                      <span class="text-ink/80">{{ record.teamName || '-' }}</span>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <span
                        v-if="record.rank"
                        :class="[
                          'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold',
                          record.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          record.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          record.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-navy/5 text-navy'
                        ]"
                      >
                        {{ record.rank }}
                      </span>
                      <span v-else class="text-ink/40">-</span>
                    </td>
                    <td class="py-3 px-2 text-right">
                      <span class="font-bold text-orange text-lg">
                        {{ record.finalScore > 0 ? record.finalScore : '-' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-6 pt-4 border-t border-navy/10 flex justify-center">
              <button
                @click="handleReset"
                class="text-navy font-semibold hover:text-orange transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新查詢
              </button>
            </div>
          </div>

          <!-- Search Result - No Records -->
          <div v-if="searched && records.length === 0" class="mt-8 bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-navy/10 text-center">
            <div class="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-navy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="font-serif text-xl font-bold text-navy mb-2">
              尚無符合的成績紀錄
            </h3>
            <p class="text-ink/60 text-sm mb-4">
              查無 {{ year }} 年姓名「{{ name }}」的成績資料。<br />
              請確認輸入資訊是否正確，或聯繫主辦單位。
            </p>
            <button
              @click="handleReset"
              class="text-orange font-semibold hover:text-orange-600 transition-colors"
            >
              重新查詢
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 lg:py-16 bg-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="font-serif text-2xl lg:text-3xl font-black text-navy mb-4">
          還沒參加過 LKK4？
        </h2>
        <p class="text-ink/60 mb-6 max-w-md mx-auto">
          50 歲以上即可報名參賽，先從免費體驗開始，讓教練評估你的實力！
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink
            to="/lkk4"
            class="inline-flex items-center gap-2 bg-navy text-white font-bold px-6 py-3 rounded-full hover:bg-navy-800 transition-colors"
          >
            了解 LKK4 賽事
          </NuxtLink>
          <NuxtLink
            to="/booking"
            class="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-orange/25 hover:bg-orange-400 transition-colors"
          >
            預約免費體驗 →
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
