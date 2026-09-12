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
