<script setup lang="ts">
// 「經營團隊」已整併進「關於練健康」(/about)，此舊網址導向 /about。
// 用 302（暫時導向）不用 301：整併本身是長期決策，但網站上線不久、舊網址沒什麼
// 累積權重要轉移，而 301 會被瀏覽器快取且不可逆。日後確定不拆頁再改 301 收攏權重。
// 注意：子頁 /team-intro/coaches（全體教練）不受影響，仍正常運作。
await navigateTo('/about', { redirectCode: 302 })
</script>

<template>
  <div />
</template>
