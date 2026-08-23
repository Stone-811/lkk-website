<script setup lang="ts">
// 分店名稱/電話/地址：後台分店管理驅動（composables/usePublicStores，含 fallback）
const { stores } = usePublicStores()
</script>

<template>
  <section class="bg-cream-100 py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <!-- Section header -->
      <div class="flex items-center gap-2 text-sm font-bold text-orange tracking-widest uppercase mb-2">
        <span class="w-5 h-0.5 bg-orange" />
        分店資訊
      </div>
      <h2 class="font-serif text-3xl lg:text-4xl font-black text-navy-700 mb-10">
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
          class="inline-flex items-center gap-2 text-navy-700 border border-navy-700/15 px-6 py-2.5 rounded-full hover:border-navy-700 transition-colors"
        >
          查看練健康分店 &rarr;
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
