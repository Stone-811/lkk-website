<script setup lang="ts">
// 分店名稱/電話/地址：後台分店管理驅動（composables/usePublicStores，含 fallback）
const { stores } = usePublicStores()
</script>

<template>
  <section class="relative bg-navy-800 py-16 lg:py-24 overflow-hidden">
    <!-- 底圖壓暗參數與首頁 Hero、分店資訊頁 Hero 一致 -->
    <img
      src="/images/home/locations-bg.webp"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 w-full h-full object-cover opacity-60"
      style="filter: brightness(0.4)"
    />
    <div class="container mx-auto px-4 relative z-10">
      <!-- Section header -->
      <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
        <span class="w-5 h-0.5 bg-orange" />
        分店資訊
      </div>
      <h2 class="font-serif text-3xl lg:text-4xl font-black text-white mb-10">
        台北・新北，<span class="text-orange">找到離你最近</span>的分店
      </h2>

      <!-- Stores grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="(store, i) in stores"
          :key="store.slug"
          :to="`/locations/${store.slug}`"
          class="bg-white border border-navy-700/15 rounded-2xl p-5 hover:border-navy-700/30 hover:shadow-lg transition-all"
        >
          <!-- Number badge -->
          <div class="w-8 h-8 rounded-full bg-navy-700 text-white text-sm font-bold flex items-center justify-center mb-3">
            {{ i + 1 }}
          </div>

          <!-- Store name -->
          <h3 class="font-serif text-lg font-bold text-navy-700 mb-1">
            {{ store.name }}
          </h3>

          <!-- Address -->
          <p class="text-sm text-ink/50 leading-relaxed mb-2">
            {{ store.address }}
          </p>

          <!-- Phone -->
          <p class="text-sm text-navy-700 font-medium">
            {{ store.phone }}
          </p>
        </NuxtLink>
      </div>

      <!-- CTA -->
      <div class="text-center mt-10">
        <NuxtLink
          to="/locations"
          class="inline-flex items-center gap-2 text-white/80 border border-white/25 px-6 py-2.5 rounded-full hover:border-white hover:text-white transition-colors"
        >
          查看練健康分店 &rarr;
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
