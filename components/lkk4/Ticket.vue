<script setup lang="ts">
/**
 * LKK4 票券框 —— 全頁重複使用的視覺主題（2026-09-01 依業主提供的版型導入）。
 *
 * 構造：米色底 + 深色實線外框 + 內縮的虛線框 + 四角的三角形摺角。
 * 摺角用四個 clip-path 的 span 做，不用 CSS 漸層——漸層要精算角度與尺寸，
 * 圓角一變就得重算，span 直接貼在 -3px（外框寬度）的位置永遠對齊。
 *
 * bunting：頂部的三角旗，只有 Hero 需要，用 prop 開啟。
 */
withDefaults(defineProps<{ bunting?: boolean; pad?: string }>(), {
  bunting: false,
  pad: 'p-6 lg:p-10',
})
</script>

<template>
  <div class="lkk4-ticket relative bg-cream border-[3px] border-navy-900 rounded-[26px] shadow-[0_18px_36px_rgba(0,26,38,0.35)]" :class="pad">
    <span class="fold tl" />
    <span class="fold tr" />
    <span class="fold bl" />
    <span class="fold br" />

    <div v-if="bunting" class="flex justify-between gap-2 mb-3 px-1.5" aria-hidden="true">
      <svg v-for="i in 2" :key="i" viewBox="0 0 220 26" preserveAspectRatio="none" class="w-full h-[26px]">
        <polygon v-for="(x, n) in [0, 26, 52, 78, 104]" :key="n"
          :points="`${x},0 ${x + 18},0 ${x + 9},20`" fill="#F5EFE4" />
      </svg>
    </div>

    <slot />
  </div>
</template>

<style scoped>
/* 內縮的虛線框。pointer-events:none 讓它不擋住裡面的按鈕與連結。 */
.lkk4-ticket::before {
  content: '';
  position: absolute;
  inset: 9px;
  border: 1.5px dashed rgba(13, 26, 34, 0.32);
  border-radius: 16px;
  pointer-events: none;
}
.fold {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #2a5269;
}
.fold.tl { top: -3px; left: -3px; clip-path: polygon(0 0, 100% 0, 0 100%); }
.fold.tr { top: -3px; right: -3px; clip-path: polygon(100% 0, 100% 100%, 0 0); }
.fold.bl { bottom: -3px; left: -3px; clip-path: polygon(0 100%, 0 0, 100% 100%); }
.fold.br { bottom: -3px; right: -3px; clip-path: polygon(100% 100%, 0 100%, 100% 0); }
</style>
