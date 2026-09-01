<script setup lang="ts">
/**
 * LKK4 票券框 —— 全頁重複使用的視覺主題（2026-09-01 依業主提供的版型導入）。
 *
 * 構造：米色底 + 深色實線外框 + 內縮的虛線框 + 四角的三角形摺角。
 * 摺角用四個 clip-path 的 span 做，不用 CSS 漸層——漸層要精算角度與尺寸，
 * 圓角一變就得重算，span 直接貼在 -3px（外框寬度）的位置永遠對齊。
 *
 * 註：參考版型在票券頂部有一排三角旗，但它的 fill 是 #F5F0E4，
 * 跟票券底色同一個顏色——在業主的草稿裡它本來就是隱形的，
 * 而且 Hero 主視覺圖本身已經畫了三角旗，所以這裡不重做。
 */
withDefaults(defineProps<{ pad?: string }>(), {
  pad: 'p-6 lg:p-10',
})
</script>

<template>
  <div class="lkk4-ticket relative bg-cream border-[3px] border-navy-900 rounded-[26px] shadow-[0_18px_36px_rgba(0,26,38,0.35)]" :class="pad">
    <span class="fold tl" />
    <span class="fold tr" />
    <span class="fold bl" />
    <span class="fold br" />

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
