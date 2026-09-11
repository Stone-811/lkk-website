<script setup lang="ts">
/**
 * 後台表單欄位的說明氣泡：標題旁一個「?」，游標停留時顯示。
 *
 * 用法：<AdminFieldHelp text="這個欄位改了會讓既有連結失效" />
 *
 * 設計取捨：
 * - 純 CSS group-hover，不引入任何 tooltip 套件，也不需要 JS 狀態。
 * - 只寫「看名字猜不到的後果」。像「姓名」「電話」這種自明的欄位不要加，
 *   每個欄位都掛一顆問號只會讓真正重要的說明被淹沒。
 * - `wide` 給字多的說明用；預設 18rem 夠放兩三行。
 *
 * ⚠️ 氣泡是 absolute 定位，父層若有 overflow-hidden 會被裁掉。
 *    後台的編輯彈窗是 overflow-y-auto（只裁垂直），實測不影響。
 */
defineProps<{
  text: string
  /** 說明較長時給更寬的氣泡 */
  wide?: boolean
}>()
</script>

<template>
  <span class="relative group inline-flex align-middle">
    <span
      class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help select-none"
      aria-hidden="true"
    >?</span>
    <span class="sr-only">{{ text }}</span>
    <span
      class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-30 bg-navy-700 text-white text-xs font-normal leading-relaxed rounded-lg px-3 py-2 shadow-xl"
      :class="wide ? 'w-80' : 'w-72'"
    >{{ text }}</span>
  </span>
</template>
