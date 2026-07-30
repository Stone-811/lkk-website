export const usePwa = () => {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isOffline = ref(false)
  const needRefresh = ref(false)

  // Only run on client
  if (import.meta.client) {
    // Track online/offline status
    isOffline.value = !navigator.onLine

    const updateOnlineStatus = () => {
      isOffline.value = !navigator.onLine
    }

    onMounted(() => {
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)

      // Check if already installed (standalone mode)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        isInstalled.value = true
      }
    })

    onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    })
  }

  // Install prompt (handled by @vite-pwa/nuxt)
  const installPwa = async () => {
    // The actual install logic is handled by the PWA module
    // This is a placeholder for custom install UI
    console.log('PWA install triggered')
  }

  return {
    isInstallable,
    isInstalled,
    isOffline,
    needRefresh,
    installPwa,
  }
}
