// Capture UTM attribution on initial load and on every client-side navigation,
// so a visitor who lands on any page with utm_* params keeps that attribution
// through to the booking / cooperation / franchise form submit.
export default defineNuxtPlugin(() => {
  const { captureFrom } = useUtm()
  const router = useRouter()

  const current = router.currentRoute.value
  captureFrom(current.query as Record<string, any>, current.fullPath)

  router.afterEach((to) => {
    captureFrom(to.query as Record<string, any>, to.fullPath)
  })
})
