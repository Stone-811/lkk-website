<script setup lang="ts">
const route = useRoute()

// 分店資料
const stores = [
  { id: 'nanjing', name: '南京店' },
  { id: 'songjiang', name: '松江店' },
  { id: 'ximending', name: '西門店' },
  { id: 'xindian', name: '七張店' },
]

// 團隊介紹子選單
const teamSubMenu = [
  { name: '經營團隊', href: '/team-intro' },
  { name: '教練團隊', href: '/team-intro/coaches' },
  { name: '練健康講師', href: '/lkk-lecturer' },
  { name: '合作講師', href: '/co-lecturer' },
  { name: '海外授權講師', href: '/oversea-lecturer' },
]

const mobileMenuOpen = ref(false)
const openDropdown = ref<string | null>(null)
const mobileOpenDropdown = ref<string | null>(null)

const isActive = (href: string) => {
  if (href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(href)
}

const toggleDropdown = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key
}

const toggleMobileDropdown = (key: string) => {
  mobileOpenDropdown.value = mobileOpenDropdown.value === key ? null : key
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-navy-700 shadow-lg">
    <nav class="container mx-auto px-4">
      <div class="flex items-center justify-between h-14 sm:h-16 lg:h-20">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center">
          <img
            src="/lkklogo.png"
            alt="練健康"
            class="h-8 sm:h-10 lg:h-12 w-auto"
          />
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-6 xl:gap-8">
          <!-- 服務方案 -->
          <NuxtLink
            to="/services"
            :class="[
              'text-sm xl:text-base transition-colors',
              isActive('/services') ? 'text-orange font-medium' : 'text-cream-100 hover:text-orange'
            ]"
          >
            服務方案
          </NuxtLink>

          <!-- 團隊介紹 - 下拉選單 -->
          <div
            class="relative group"
            @mouseenter="openDropdown = 'team'"
            @mouseleave="openDropdown = null"
          >
            <button
              :class="[
                'flex items-center gap-1 text-sm xl:text-base transition-colors',
                isActive('/team') ? 'text-orange font-medium' : 'text-cream-100 hover:text-orange'
              ]"
            >
              團隊介紹
              <svg
                :class="['w-4 h-4 transition-transform', openDropdown === 'team' ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-if="openDropdown === 'team'" class="absolute top-full left-0 pt-2 z-50">
              <div class="w-48 bg-white rounded-lg shadow-lg py-2">
                <NuxtLink
                  v-for="item in teamSubMenu"
                  :key="item.href"
                  :to="item.href"
                  class="block px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 hover:text-orange transition-colors"
                  @click="openDropdown = null"
                >
                  {{ item.name }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 分店資訊 - 下拉選單 -->
          <div
            class="relative group"
            @mouseenter="openDropdown = 'locations'"
            @mouseleave="openDropdown = null"
          >
            <button
              :class="[
                'flex items-center gap-1 text-sm xl:text-base transition-colors',
                isActive('/locations') ? 'text-orange font-medium' : 'text-cream-100 hover:text-orange'
              ]"
            >
              分店資訊
              <svg
                :class="['w-4 h-4 transition-transform', openDropdown === 'locations' ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-if="openDropdown === 'locations'" class="absolute top-full left-0 pt-2 z-50">
              <div class="w-40 bg-white rounded-lg shadow-lg py-2">
                <NuxtLink
                  to="/locations"
                  class="block px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 hover:text-orange transition-colors font-medium"
                  @click="openDropdown = null"
                >
                  全部分店
                </NuxtLink>
                <div class="border-t border-cream-200 my-1" />
                <NuxtLink
                  v-for="store in stores"
                  :key="store.id"
                  :to="`/locations/${store.id}`"
                  class="block px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 hover:text-orange transition-colors"
                  @click="openDropdown = null"
                >
                  {{ store.name }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 知識分享 -->
          <a
            href="https://l-kk.tw/category/knowledge"
            class="text-sm xl:text-base text-cream-100 hover:text-orange transition-colors"
          >
            知識分享
          </a>

          <!-- 學員案例 -->
          <a
            href="https://l-kk.tw/category/%e6%a1%88%e4%be%8b%e5%88%86%e4%ba%ab/"
            class="text-sm xl:text-base text-cream-100 hover:text-orange transition-colors"
          >
            學員案例
          </a>

          <!-- LKK4 -->
          <NuxtLink
            to="/lkk4"
            :class="[
              'text-sm xl:text-base transition-colors',
              isActive('/lkk4') ? 'text-orange font-medium' : 'text-cream-100 hover:text-orange'
            ]"
          >
            LKK4
          </NuxtLink>

          <!-- 異業結盟 -->
          <NuxtLink
            to="/cooperation"
            :class="[
              'text-sm xl:text-base transition-colors',
              isActive('/cooperation') ? 'text-orange font-medium' : 'text-cream-100 hover:text-orange'
            ]"
          >
            異業結盟
          </NuxtLink>
        </div>

        <!-- Right Section - Desktop -->
        <div class="hidden lg:flex items-center gap-3 xl:gap-4">
          <NuxtLink to="/booking" class="btn btn-primary text-sm xl:text-base px-4 xl:px-6">
            預約體驗
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          type="button"
          class="lg:hidden p-2 text-cream-100"
          aria-label="Toggle menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="lg:hidden py-4 border-t border-navy-600 max-h-[70vh] overflow-y-auto">
        <div class="flex flex-col gap-1">
          <!-- 服務方案 -->
          <NuxtLink
            to="/services"
            :class="['py-3 px-2 rounded', isActive('/services') ? 'text-orange font-medium bg-navy-600/50' : 'text-cream-100']"
            @click="closeMobileMenu"
          >
            服務方案
          </NuxtLink>

          <!-- 團隊介紹 - 手機版下拉 -->
          <div>
            <button
              :class="[
                'w-full flex items-center justify-between py-3 px-2 rounded',
                isActive('/team') ? 'text-orange font-medium bg-navy-600/50' : 'text-cream-100'
              ]"
              @click="toggleMobileDropdown('team')"
            >
              團隊介紹
              <svg
                :class="['w-4 h-4 transition-transform', mobileOpenDropdown === 'team' ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-if="mobileOpenDropdown === 'team'" class="ml-4 mt-1 space-y-1">
              <NuxtLink
                v-for="item in teamSubMenu"
                :key="item.href"
                :to="item.href"
                class="block py-2 px-3 text-sm text-cream-200 hover:text-orange rounded"
                @click="closeMobileMenu"
              >
                {{ item.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- 分店資訊 - 手機版下拉 -->
          <div>
            <button
              :class="[
                'w-full flex items-center justify-between py-3 px-2 rounded',
                isActive('/locations') ? 'text-orange font-medium bg-navy-600/50' : 'text-cream-100'
              ]"
              @click="toggleMobileDropdown('locations')"
            >
              分店資訊
              <svg
                :class="['w-4 h-4 transition-transform', mobileOpenDropdown === 'locations' ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-if="mobileOpenDropdown === 'locations'" class="ml-4 mt-1 space-y-1">
              <NuxtLink
                to="/locations"
                class="block py-2 px-3 text-sm text-cream-200 hover:text-orange rounded font-medium"
                @click="closeMobileMenu"
              >
                全部分店
              </NuxtLink>
              <NuxtLink
                v-for="store in stores"
                :key="store.id"
                :to="`/locations/${store.id}`"
                class="block py-2 px-3 text-sm text-cream-200 hover:text-orange rounded"
                @click="closeMobileMenu"
              >
                {{ store.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- 知識分享 -->
          <a
            href="https://l-kk.tw/category/knowledge"
            class="py-3 px-2 text-cream-100 rounded"
            @click="closeMobileMenu"
          >
            知識分享
          </a>

          <!-- 學員案例 -->
          <a
            href="https://l-kk.tw/category/%e6%a1%88%e4%be%8b%e5%88%86%e4%ba%ab/"
            class="py-3 px-2 text-cream-100 rounded"
            @click="closeMobileMenu"
          >
            學員案例
          </a>

          <!-- LKK4 -->
          <NuxtLink
            to="/lkk4"
            :class="['py-3 px-2 rounded', isActive('/lkk4') ? 'text-orange font-medium bg-navy-600/50' : 'text-cream-100']"
            @click="closeMobileMenu"
          >
            LKK4
          </NuxtLink>

          <!-- 異業結盟 -->
          <NuxtLink
            to="/cooperation"
            :class="['py-3 px-2 rounded', isActive('/cooperation') ? 'text-orange font-medium bg-navy-600/50' : 'text-cream-100']"
            @click="closeMobileMenu"
          >
            異業結盟
          </NuxtLink>

          <!-- 底部區塊 -->
          <div class="pt-4 mt-2 border-t border-navy-600 flex items-center justify-end">
            <NuxtLink
              to="/booking"
              class="btn btn-primary text-sm px-4"
              @click="closeMobileMenu"
            >
              預約體驗
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
