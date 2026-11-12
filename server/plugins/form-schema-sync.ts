// 把表單 schema 同步到 Firestore（formSchemas/*）。細節見 server/utils/form-schemas.ts。
//
// 什麼時候比對：
//   1. 執行個體啟動時（發版、冷啟動、擴充）
//   2. 之後有請求進來時，距離上次成功超過 10 分鐘就再比一次（失敗的話 1 分鐘後再試）
// 第 2 點是補兩種情況：
//   - Cloud Run 沒有請求時 CPU 會降速（cpuIdle），啟動時那次可能卡到逾時失敗
//   - 發版當下新舊兩版短暫同時在跑，舊版可能晚一步把舊內容寫回去
// 比對只是讀一份文件、內容一樣就不寫，所以 10 分鐘一次的成本可以忽略。
//
// 防呆：
// - 只在 Cloud Run 上跑（有 K_SERVICE）：本機 dev／preview 的 .env 指向另一個舊專案，不能寫；
//   建置時的 prerender 也不跑。設 FORM_SCHEMA_SYNC=off 可整個關掉。
// - 不 await：不擋請求。失敗只記 log，網站照常運作。
import { syncFormSchemas } from '~/server/utils/form-schemas'

const RECHECK_MS = 10 * 60 * 1000
const RETRY_MS = 60 * 1000

export default defineNitroPlugin((nitroApp) => {
  if (import.meta.prerender || !process.env.K_SERVICE) return
  if (process.env.FORM_SCHEMA_SYNC === 'off') return

  let running = false
  let nextAt = 0

  const run = () => {
    if (running || Date.now() < nextAt) return
    running = true
    syncFormSchemas()
      .then((r) => {
        nextAt = Date.now() + RECHECK_MS
        if (r.some((x) => !x.endsWith('=same'))) console.log(`[form-schema-sync] ${r.join(' ')}`)
      })
      .catch((e) => {
        nextAt = Date.now() + RETRY_MS
        console.error('[form-schema-sync] failed:', e?.message || e)
      })
      .finally(() => {
        running = false
      })
  }

  run()
  nitroApp.hooks.hook('request', run)
})
