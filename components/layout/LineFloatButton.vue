<script setup lang="ts">
// 練健康 LINE 官方帳號加好友連結（與 Footer / booking 成功頁一致）
const LINE_URL = 'https://line.me/R/ti/p/%40201fzruh'
</script>

<template>
  <!-- 常駐於右下、疊在「回到頂部」鈕正上方 -->
  <div class="fixed right-4 md:right-6 bottom-40 md:bottom-24 z-40 group">
    <!-- QR 彈出卡片：僅桌機、hover 顯示（手機無 hover，掃自己的 QR 無意義） -->
    <div
      class="hidden md:block absolute bottom-full right-0 pb-3 w-56
             opacity-0 translate-y-2 pointer-events-none
             group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
             transition-all duration-200 ease-out"
    >
      <div class="relative bg-white rounded-2xl shadow-xl border border-navy/10 p-4 text-center">
        <img
          src="/line-qr.svg"
          alt="練健康 LINE 官方帳號 QR Code"
          width="192"
          height="192"
          class="w-48 h-48 mx-auto"
        />
        <p class="mt-2 text-sm font-bold text-navy">加入練健康 LINE</p>
        <p class="text-xs text-ink/60 mt-0.5">掃描 QR 或點按鈕加入好友</p>
        <!-- 指向按鈕的小箭頭 -->
        <span
          class="absolute right-5 -bottom-1.5 w-3 h-3 bg-white border-b border-r border-navy/10 rotate-45"
        ></span>
      </div>
    </div>

    <!-- LINE 按鈕：點擊／手機點按皆開啟加好友頁 -->
    <a
      :href="LINE_URL"
      target="_blank"
      rel="noopener"
      aria-label="加入練健康 LINE 官方帳號"
      class="flex items-center justify-center w-12 h-12 rounded-full shadow-lg
             bg-[#06C755] hover:bg-[#05b34c] text-white
             transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    </a>
  </div>
</template>
