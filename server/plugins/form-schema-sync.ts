// 網站執行個體啟動時，把表單 schema 同步到 Firestore（formSchemas/*）。細節見 server/utils/form-schemas.ts。
//
// - 只在 Cloud Run 上跑（有 K_SERVICE）：本機 dev／preview 的 .env 指向另一個舊專案，不能寫；
//   建置時的 prerender 也不跑。
// - 不 await：不擋第一個請求。失敗只記 log，網站照常運作，下一台啟動時會再試。
// - Cloud Run 沒有請求時 CPU 會降速（cpuIdle），同步可能拖到下一個請求才做完；可重複執行，沒關係。
import { syncFormSchemas } from '~/server/utils/form-schemas'

export default defineNitroPlugin(() => {
  if (import.meta.prerender || !process.env.K_SERVICE) return
  if (process.env.FORM_SCHEMA_SYNC === 'off') return
  syncFormSchemas()
    .then((r) => console.log(`[form-schema-sync] ${r.join(' ')}`))
    .catch((e) => console.error('[form-schema-sync] failed:', e?.message || e))
})
