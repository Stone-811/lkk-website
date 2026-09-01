<script setup lang="ts">
/**
 * LKK4 的四個功能圖示（拿／推／走穩／走久），沿用業主版型檔的線性圖示。
 * 依 CLAUDE.md 的原則不用 Emoji。stroke 用 currentColor，顏色由外層 text-* 決定。
 */
defineProps<{ name: string }>()
</script>

<template>
  <svg viewBox="0 0 48 48" fill="none" class="text-navy-700" aria-hidden="true">
    <!-- 拿得動：提袋 -->
    <template v-if="name === 'lift'">
      <path d="M14 20 L20 12 L28 12 L34 20 L34 38 L14 38 Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
      <path d="M20 20 V16 Q20 12 24 12 Q28 12 28 16 V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    </template>

    <!-- 推得動：箱子與推力方向 -->
    <template v-else-if="name === 'push'">
      <rect x="9" y="18" width="17" height="14" rx="2" stroke="currentColor" stroke-width="2.4" />
      <path d="M26 25 H39 M33 19 L39 25 L33 31" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- 走得穩：單側負重行走 -->
    <template v-else-if="name === 'walk'">
      <circle cx="24" cy="12" r="4" stroke="currentColor" stroke-width="2.4" />
      <path d="M24 16 V26 M24 26 L16 38 M24 26 L30 34 M30 20 L38 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    </template>

    <!-- 走得久：風扇車 -->
    <template v-else-if="name === 'endure'">
      <circle cx="14" cy="30" r="7" stroke="currentColor" stroke-width="2.4" />
      <circle cx="34" cy="30" r="7" stroke="currentColor" stroke-width="2.4" />
      <path d="M14 30 L21 17 H29 M21 17 L26 30 M29 17 L34 30" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>
