<script setup lang="ts">
/**
 * GTM 的 <noscript> 區塊（業主提供的安裝說明要求放在 <body> 開頭）。
 *
 * 🔴 這一段必須由伺服器端輸出，不能像 plugins/gtm.client.ts 那樣在瀏覽器端判斷——
 *    它的用途就是「瀏覽器沒有執行 JavaScript」時的備援，靠 JS 插入等於沒插。
 *    所以網域判斷改用 useRequestURL()，它在伺服器端與瀏覽器端都讀得到。
 *
 * ⚠️ 正式網域以外一律不輸出。CDN 的快取鍵含主機名，所以不同網域不會互相污染。
 *
 * 實務上影響很小（關閉 JavaScript 的訪客極少），但業主的安裝說明有寫，照做。
 */
const GTM_ID = 'GTM-5X328JSM'
const isProductionHost = useRequestURL().hostname === 'lkkwellness.com'

useHead({
  noscript: isProductionHost
    ? [{
        tagPosition: 'bodyOpen',
        innerHTML:
          `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"` +
          ` height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      }]
    : [],
})
</script>

<template>
  <div>
    <!--
      🔴 VitePwaManifest 的唯一作用是往 <head> 插一行 <link rel="manifest">。
         少了它，public 底下的 manifest.webmanifest 與 pwa-192/512 圖示全都是空轉——
         瀏覽器讀不到 manifest 就不會提供「安裝」，2026-09-12 之前一直是這個狀態。
         （iPhone Safari 的「加入主畫面」不吃 manifest，本來就能用；
           這一行補的是 Android Chrome 與桌機 Chrome 的安裝選項。）
         它不插任何 meta，也不碰 Service Worker 註冊，對沒安裝的訪客零影響。
    -->
    <VitePwaManifest />
    <CommonOfflineIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
