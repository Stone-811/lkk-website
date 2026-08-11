<script setup lang="ts">
const stores = [
  {
    id: 'nanjing',
    num: 1,
    name: '南京店',
    address: '台北市中山區南京東路三段 29 號 B1',
    phone: '(02) 2507-4196',
  },
  {
    id: 'songjiang',
    num: 2,
    name: '松江店',
    address: '台北市中山區松江路 122 號 B1',
    phone: '(02) 2537-1055',
  },
  {
    id: 'ximending',
    num: 3,
    name: '西門店',
    address: '台北市中正區寶慶路 39 號',
    phone: '(02) 2370-3245',
  },
  {
    id: 'xindian',
    num: 4,
    name: '七張店',
    address: '新北市新店區北新路二段 252 號 B1-2',
    phone: '(02) 8914-6428',
  },
]
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
        台北・新北，<span class="text-orange">找到離您最近</span>的分店
      </h2>

      <!-- Stores grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="store in stores"
          :key="store.id"
          :to="`/locations/${store.id}`"
          class="bg-white border border-navy-700/15 rounded-2xl p-5 hover:border-navy-700/30 hover:shadow-lg transition-all"
        >
          <!-- Number badge -->
          <div class="w-8 h-8 rounded-full bg-navy-700 text-white text-sm font-bold flex items-center justify-center mb-3">
            {{ store.num }}
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
