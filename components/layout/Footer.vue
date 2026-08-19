<script setup lang="ts">
const navigation = [
  { name: '首頁', href: '/' },
  { name: '服務方案', href: '/services' },
  { name: '關於練健康', href: '/about' },
  { name: '分店資訊', href: '/locations' },
  { name: '預約體驗', href: '/booking' },
]

const stores = [
  { name: '南京店', phone: '(02) 2507-4196', href: '/locations/nanjing' },
  { name: '松江店', phone: '(02) 2537-1055', href: '/locations/songjiang' },
  { name: '西門店', phone: '(02) 2370-3245', href: '/locations/ximending' },
  { name: '七張店', phone: '(02) 8914-6428', href: '/locations/xindian' },
]

// 聯絡資訊與社群連結：由後台系統設定驅動（settings/general + settings/social）。
// 非阻塞載入，先以預設值渲染（後台未設定時就用這些預設），抓到後台值後更新。
const { data: site } = useLazyFetch('/api/public/settings', {
  key: 'public-site-settings',
  default: () => ({
    contactEmail: 'lkkwellness@gmail.com',
    contactPhone: '02-2537-1055',
    socialLinks: {
      facebook: 'https://www.facebook.com/LKKWellnessCenter/',
      instagram: 'https://www.instagram.com/lkk_wellness/',
      youtube: 'https://www.youtube.com/c/LKKWellness',
      podcast: 'https://podcasts.apple.com/tw/podcast/%E5%88%9D%E4%B8%80%E5%8D%81%E4%BA%94%E7%B7%B4%E5%81%A5%E5%BA%B7/id1779024584',
      line: 'https://line.me/R/ti/p/%40201fzruh',
      email: 'lkkwellness@gmail.com',
    },
  }),
})

const telHref = (phone: string) => `tel:${(phone || '').replace(/[^0-9+]/g, '')}`

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-navy-700 text-white">
    <div class="container mx-auto px-4 py-8 sm:py-12">
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        <!-- Company Info -->
        <div class="col-span-2 sm:col-span-2 md:col-span-1">
          <NuxtLink to="/" class="inline-block mb-4">
            <span class="text-xl sm:text-2xl font-bold text-orange font-serif">練健康</span>
          </NuxtLink>
          <p class="text-cream-200 text-sm mb-4">
            練健康中高齡訓練中心
          </p>
          <div class="flex flex-wrap gap-3">
            <!-- Facebook -->
            <a
              v-if="site.socialLinks.facebook"
              :href="site.socialLinks.facebook"
              target="_blank"
              rel="noopener noreferrer"
              class="text-cream-200 hover:text-orange transition-colors"
              aria-label="Facebook"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <!-- Instagram -->
            <a
              v-if="site.socialLinks.instagram"
              :href="site.socialLinks.instagram"
              target="_blank"
              rel="noopener noreferrer"
              class="text-cream-200 hover:text-orange transition-colors"
              aria-label="Instagram"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </a>
            <!-- YouTube -->
            <a
              v-if="site.socialLinks.youtube"
              :href="site.socialLinks.youtube"
              target="_blank"
              rel="noopener noreferrer"
              class="text-cream-200 hover:text-orange transition-colors"
              aria-label="YouTube"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <!-- Podcast -->
            <a
              v-if="site.socialLinks.podcast"
              :href="site.socialLinks.podcast"
              target="_blank"
              rel="noopener noreferrer"
              class="text-cream-200 hover:text-orange transition-colors"
              aria-label="Podcast"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m0-4a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </a>
            <!-- LINE -->
            <a
              v-if="site.socialLinks.line"
              :href="site.socialLinks.line"
              target="_blank"
              rel="noopener noreferrer"
              class="text-cream-200 hover:text-orange transition-colors"
              aria-label="LINE"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </a>
            <!-- Email -->
            <a
              v-if="site.contactEmail"
              :href="`mailto:${site.contactEmail}`"
              class="text-cream-200 hover:text-orange transition-colors"
              aria-label="Email"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="font-medium mb-3 sm:mb-4 font-serif text-sm sm:text-base">導覽</h3>
          <ul class="space-y-1.5 sm:space-y-2">
            <li v-for="item in navigation" :key="item.name">
              <NuxtLink
                :to="item.href"
                class="text-cream-200 hover:text-white transition-colors text-xs sm:text-sm"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Stores -->
        <div>
          <h3 class="font-medium mb-3 sm:mb-4 font-serif text-sm sm:text-base">分店資訊</h3>
          <ul class="space-y-2 sm:space-y-3">
            <li v-for="store in stores" :key="store.name">
              <NuxtLink
                :to="store.href"
                class="text-cream-200 hover:text-white transition-colors text-xs sm:text-sm block"
              >
                {{ store.name }}
              </NuxtLink>
              <span class="text-cream-300/60 text-[10px] sm:text-xs">{{ store.phone }}</span>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="col-span-2 sm:col-span-1">
          <h3 class="font-medium mb-3 sm:mb-4 font-serif text-sm sm:text-base">聯絡我們</h3>
          <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-cream-200">
            <li v-if="site.contactEmail">
              <span class="text-cream-300/70">信箱：</span>
              <a :href="`mailto:${site.contactEmail}`" class="hover:text-white transition-colors">
                {{ site.contactEmail }}
              </a>
            </li>
            <li v-if="site.contactPhone">
              <span class="text-cream-300/70">電話：</span>
              <a :href="telHref(site.contactPhone)" class="hover:text-white transition-colors">
                {{ site.contactPhone }}
              </a>
            </li>
            <li v-if="site.socialLinks.line">
              <span class="text-cream-300/70">LINE：</span>
              <a
                :href="site.socialLinks.line"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors"
              >官方帳號</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-navy-600 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-cream-300 text-xs sm:text-sm text-center sm:text-left">
          &copy; {{ currentYear }} 練健康中高齡訓練中心. All rights reserved.
        </p>
        <div class="flex gap-4 sm:gap-6 text-xs sm:text-sm">
          <NuxtLink to="/privacy" class="text-cream-300 hover:text-white transition-colors">
            隱私權政策
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
