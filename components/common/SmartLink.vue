<script setup lang="ts">
/**
 * 一條連結：以 `/` 開頭走站內路由，其餘一律外部連結（另開分頁）。
 *
 * 用在媒體報導頁——同一張卡片上可能同時有「本站的報導頁」與「媒體官網原文」，
 * 兩者要用不同方式開啟，但外觀完全一樣。
 *
 * 🔴 不要改用 <component :is="resolveComponent('NuxtLink')"> 之類的動態解析。
 *    解析失敗時 Vue 會把元件名當成自訂元素原樣輸出（畫面看起來正常、
 *    但那不是連結、點不動，而且完全不報錯）。2026-09-17 在彙整頁卡片上
 *    整批踩過一次。用 v-if / v-else 明確寫出兩個標籤。
 *
 * class 等屬性由 Vue 的 fallthrough 自動帶到實際渲染出來的那個標籤上。
 */
const props = defineProps<{ href: string }>()
const isInternal = computed(() => props.href.startsWith('/'))
</script>

<template>
  <NuxtLink v-if="isInternal" :to="href"><slot /></NuxtLink>
  <a v-else :href="href" target="_blank" rel="noopener noreferrer"><slot /></a>
</template>
