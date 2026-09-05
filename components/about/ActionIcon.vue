<script setup lang="ts">
/**
 * 「從知識到行動」五個項目的線性圖示。
 * 依 CLAUDE.md 的原則不用 Emoji；stroke 用 currentColor，顏色由外層 text-* 決定。
 * 風格對齊 components/lkk4/Icon.vue：viewBox 48×48、stroke-width 2.4、圓端點。
 */
defineProps<{ name: string }>()
</script>

<template>
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <!-- 知識轉譯：翻開的書，知識往外傳遞 -->
    <template v-if="name === 'translate'">
      <path
        d="M21 21C18 18.5 13 18.5 9 19.5V37c4-1 9-1 12 1M21 21c3-2.5 8-2.5 12-1.5V37c-4-1-9-1-12 1M21 21v17"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
      />
      <path d="M36 18l7-7M38 11h5v5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- 人才培育：學士帽 -->
    <template v-else-if="name === 'cultivate'">
      <path d="M24 11 42 19 24 27 6 19Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
      <path d="M13 22.5V32c0 0 4 5 11 5s11-5 11-5v-9.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- 訓練服務：啞鈴 -->
    <template v-else-if="name === 'training'">
      <path
        d="M15 24h18M15 17v14M33 17v14M10 20v8M38 20v8"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
      />
    </template>

    <!-- 產業升級：上升趨勢 -->
    <template v-else-if="name === 'upgrade'">
      <path d="M8 38h32" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <path d="M9 31l10-8 8 5 13-13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M33 15h7v7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- 教練陪伴：教練攙扶學員 -->
    <template v-else-if="name === 'companion'">
      <circle cx="16" cy="13" r="4" stroke="currentColor" stroke-width="2.4" />
      <path d="M16 17v11M16 28l-4 10M16 28l5 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="33" cy="18" r="3.5" stroke="currentColor" stroke-width="2.4" />
      <path d="M33 21.5V31M33 31l-3 7M33 31l4 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <path d="M19 22h11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    </template>
  </svg>
</template>
