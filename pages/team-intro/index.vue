<script setup lang="ts">
// 「經營團隊」已整併進「關於練健康」(/about)，此舊網址永久導向 /about。
// 注意：子頁 /team-intro/coaches（全體教練）不受影響，仍正常運作。
await navigateTo('/about', { redirectCode: 301 })
</script>

<template>
  <div />
</template>
