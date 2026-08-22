<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

/**
 * 教練詳情彈窗（Bottom Sheet）
 * 原本寫死在 pages/team-intro/coaches.vue 裡，2026-08-23 抽成共用元件，
 * 讓分店詳情頁的教練輪播也能開同一個彈窗，資訊呈現與教練團隊頁一致。
 */
interface Coach {
  id: string
  name: string
  roleTitle?: string
  photo?: string
  description?: string
  specialties?: string[]
  certifications?: string[]
  education?: string[]
  experiences?: string[]
  store?: { name?: string; slug?: string } | null
}

const props = defineProps<{ coach: Coach | null }>()
const emit = defineEmits<{ close: [] }>()

// 彈窗開啟時鎖住背景捲動；元件卸載時務必還原，否則整頁會捲不動
watch(
  () => props.coach,
  (c) => { document.body.style.overflow = c ? 'hidden' : '' },
)
onUnmounted(() => { document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="coach"
        class="fixed inset-0 z-[60] flex items-end justify-center"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

        <!-- Modal Content - Bottom Sheet (responsive) -->
        <!-- Mobile: floating card with margin for fixed button -->
        <!-- Desktop: full bottom sheet style -->
        <div class="relative bg-white rounded-2xl md:rounded-t-3xl md:rounded-b-none w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg md:w-full mx-auto max-h-[65vh] md:max-h-[70vh] mb-20 md:mb-0 shadow-2xl z-10 flex flex-col">
          <!-- Drag Handle -->
          <div class="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div class="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <!-- Close Button -->
          <button
            @click="emit('close')"
            class="absolute top-3 right-4 z-20 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Scrollable Content -->
          <div class="overflow-y-auto flex-1 overscroll-contain">
            <!-- Coach Header - Compact horizontal layout -->
            <div class="flex gap-4 px-4 pb-4">
              <!-- Photo - Smaller -->
              <div class="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-cream-200">
                <img
                  v-if="coach.photo"
                  :src="coach.photo"
                  :alt="coach.name"
                  class="w-full h-full object-cover object-top"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy to-navy/80">
                  <span class="font-serif text-3xl font-black text-white/20">{{ coach.name.charAt(0) }}</span>
                </div>
              </div>

              <!-- Basic Info - Compact -->
              <div class="flex-1 min-w-0">
                <h2 class="font-serif text-xl font-bold text-navy truncate">
                  {{ coach.name }}
                </h2>
                <p v-if="coach.roleTitle" class="text-orange font-medium text-sm">
                  {{ coach.roleTitle }}
                </p>
                <div v-if="coach.store" class="flex items-center gap-1.5 text-ink/60 text-xs mt-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ coach.store.name }}</span>
                </div>
                <!-- Specialties inline -->
                <div v-if="coach.specialties && coach.specialties.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="specialty in coach.specialties.slice(0, 3)"
                    :key="specialty"
                    class="px-2 py-0.5 bg-orange/10 text-orange text-[10px] rounded-full"
                  >
                    {{ specialty }}
                  </span>
                  <span v-if="coach.specialties.length > 3" class="text-ink/40 text-[10px] py-0.5">
                    +{{ coach.specialties.length - 3 }}
                  </span>
                </div>
              </div>
            </div>

          <!-- Detailed Info - Compact -->
          <div class="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
            <!-- Description -->
            <p v-if="coach.description" class="text-ink/70 text-xs leading-relaxed">
              {{ coach.description }}
            </p>

            <!-- Certifications -->
            <div v-if="coach.certifications && coach.certifications.length > 0">
              <h4 class="text-xs font-semibold text-navy mb-1.5 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                專業認證
              </h4>
              <ul class="space-y-0.5">
                <li v-for="cert in coach.certifications" :key="cert" class="text-ink/70 text-xs flex items-start gap-1.5">
                  <span class="text-orange">•</span>
                  {{ cert }}
                </li>
              </ul>
            </div>

            <!-- Education -->
            <div v-if="coach.education && coach.education.length > 0">
              <h4 class="text-xs font-semibold text-navy mb-1.5 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                學歷背景
              </h4>
              <ul class="space-y-0.5">
                <li v-for="edu in coach.education" :key="edu" class="text-ink/70 text-xs flex items-start gap-1.5">
                  <span class="text-orange">•</span>
                  {{ edu }}
                </li>
              </ul>
            </div>

            <!-- Experiences -->
            <div v-if="coach.experiences && coach.experiences.length > 0">
              <h4 class="text-xs font-semibold text-navy mb-1.5 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                經歷
              </h4>
              <ul class="space-y-0.5">
                <li v-for="exp in coach.experiences" :key="exp" class="text-ink/70 text-xs flex items-start gap-1.5">
                  <span class="text-orange">•</span>
                  {{ exp }}
                </li>
              </ul>
            </div>

            <!-- CTA -->
            <div class="pt-1">
              <NuxtLink
                :to="`/booking?store=${coach.store?.slug || ''}`"
                class="block w-full bg-orange text-white text-center font-semibold py-2.5 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                @click="emit('close')"
              >
                預約體驗
              </NuxtLink>
            </div>
          </div>
          </div><!-- closes Scrollable Content -->
        </div><!-- closes Modal Content -->
      </div><!-- closes Outer modal -->
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Bottom Sheet transitions */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: opacity 0.3s ease;
}
.bottom-sheet-enter-active > div:last-child,
.bottom-sheet-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}
.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}
.bottom-sheet-enter-from > div:last-child {
  transform: translateY(100%);
}
.bottom-sheet-leave-to > div:last-child {
  transform: translateY(100%);
}

/* Safe area for mobile devices with home indicator */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
