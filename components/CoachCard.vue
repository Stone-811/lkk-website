<script setup lang="ts">
/**
 * 教練卡片（分店詳情頁的教練輪播用）
 * 2026-08-23 改為比照 /team-intro/coaches 的卡片：3:4 照片、姓名與職稱放在照片下方、
 * 專長標籤最多 3 個，點擊開啟教練詳情彈窗。
 * （舊版是 h-56 橫幅裁切 + 姓名壓在照片上的漸層字，會把新版去背照的頭切掉。）
 */
interface Coach {
  id: string
  name: string
  roleTitle?: string
  photo?: string
  specialties?: string[]
}

defineProps<{ coach: Coach }>()
const emit = defineEmits<{ select: [] }>()

const imageError = ref(false)
</script>

<template>
  <button
    type="button"
    class="group flex flex-col flex-shrink-0 w-[200px] sm:w-[240px] bg-white rounded-xl overflow-hidden shadow-sm border border-navy/10 hover:shadow-lg hover:border-orange/30 transition-all duration-300 text-left cursor-pointer snap-start"
    @click="emit('select')"
  >
    <!-- Photo -->
    <div class="aspect-[3/4] relative bg-white overflow-hidden">
      <img
        v-if="coach.photo && !imageError"
        :src="coach.photo"
        :alt="coach.name"
        loading="lazy"
        class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        @error="imageError = true"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy to-navy/80">
        <span class="font-serif text-5xl font-black text-white/20">{{ coach.name.charAt(0) }}</span>
      </div>
      <!-- Click hint -->
      <div class="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors flex items-center justify-center">
        <span class="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-navy text-sm font-medium px-3 py-1.5 rounded-full shadow">
          查看完整資訊
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="p-4">
      <h3 class="text-lg font-bold text-navy font-serif group-hover:text-orange transition-colors truncate">
        {{ coach.name }}
      </h3>
      <p v-if="coach.roleTitle" class="text-orange-700 font-medium text-sm leading-snug">
        {{ coach.roleTitle }}
      </p>

      <!-- 標籤數與樣式比照 /team-intro/coaches：全部列出，不收成 +N -->
      <div v-if="coach.specialties && coach.specialties.length > 0" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="specialty in coach.specialties"
          :key="specialty"
          class="px-2 py-0.5 bg-cream text-ink/70 text-[11px] leading-tight rounded-full whitespace-nowrap"
        >
          {{ specialty }}
        </span>
      </div>
    </div>
  </button>
</template>
