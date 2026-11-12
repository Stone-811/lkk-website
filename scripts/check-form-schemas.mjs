// 建置前檢查：docs/form-schema/*.json 的選項跟網站程式實際用的有沒有對齊。
// 不一致就以結束碼 1 讓 `npm run build` 失敗（App Hosting 也跑 npm run build，所以壞的不會部署出去）。
//
// 為什麼要有這支：那三份 JSON 會在網站啟動時同步到 Firestore 給 CRM 讀
// （server/utils/form-schemas.ts）。JSON 是手寫的，程式改了選項卻忘了改 JSON，CRM 就會讀到錯的定義。
//
// 檢查範圍（只比對「存進名單的值」相關的東西）：
//   - 每個有選項的欄位：值、順序、顯示文字，以及 price／messagePlaceholder／得知管道的展開設定
//   - 網址變體（?v=）與免費合作方（?co=）的代號，以及會進名單的設定值（company、leadSource…）
//   - booking 頁面內建的備用分店（代號、名稱、地址、電話）
//   - 頁面上用 v-model 綁的選擇題，都有被比對（防止頁面新增選擇題卻沒寫進 JSON）
// 沒檢查：欄位標題、placeholder、錯誤訊息、驗證規則（含「選某項才必填」這類條件）、同意事項文字、
// 隱藏值（例如「活動免費」）——改這些時要自己同步 JSON。
//
// 選項的來源有三種：config/*.ts 的 export、頁面 <script setup> 裡的 const 陣列、
// 模板裡寫死的 <option value="…"> 或 v-for="opt in [...]"。下面 FIELDS 逐欄指定。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createJiti } from 'jiti'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jiti = createJiti(import.meta.url)
const read = (p) => readFileSync(join(root, p), 'utf8')
const schema = (id) => JSON.parse(read(`docs/form-schema/${id}.json`))
const cfg = (p) => jiti.import(join(root, p))

const errors = []
const fail = (where, msg) => errors.push(`${where}：${msg}`)

// ---------- 從程式碼取選項 ----------

/** 從 start（指向 '['）找到對應的 ']'，略過字串與行註解、區塊註解。 */
function matchBracket(src, start) {
  let depth = 0
  for (let i = start; i < src.length; i++) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i)
      if (i === -1) break
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2) + 1
      if (i === 0) break
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++
      continue
    }
    if (c === '[') depth++
    else if (c === ']' && --depth === 0) return i
  }
  throw new Error('找不到對應的 ]')
}

const evalLiteral = (text) => new Function(`return (${text})`)()

/** <script setup> 裡 `const name = [ ... ]`（或 `= ref([ ... ])`、有型別標註）的陣列，內容只能是字面值。 */
function constArray(file, name) {
  const src = read(file)
  const m = new RegExp(`const ${name}(?:\\s*:[^=]+)?\\s*=\\s*(?:ref(?:<[^>]*>)?\\(\\s*)?\\[`).exec(src)
  if (!m) throw new Error(`${file} 找不到 const ${name} = [`)
  const start = m.index + m[0].length - 1
  return evalLiteral(src.slice(start, matchBracket(src, start) + 1))
}

/** 模板裡 v-model="formData.X" 的 <select> 底下寫死的 <option value="V">文字</option>（略過空值的提示選項）。 */
function selectOptions(file, model) {
  const src = read(file)
  const at = src.indexOf(`v-model="formData.${model}"`)
  if (at === -1) throw new Error(`${file} 找不到 v-model="formData.${model}"`)
  const open = src.lastIndexOf('<select', at)
  const close = src.indexOf('</select>', at)
  if (open === -1 || close === -1) throw new Error(`${file} 的 formData.${model} 不在 <select> 裡`)
  // 註解掉的 <option> 不算；屬性值裡可能有 '>'（例如 v-if="age > 50"），所以照引號切
  const block = src.slice(open, close).replace(/<!--[\s\S]*?-->/g, '')
  const out = []
  for (const m of block.matchAll(/<option\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/option>/g)) {
    const attrs = m[1]
    if (/(^|\s)(:value|v-bind:value|v-for)\b/.test(attrs)) {
      throw new Error(`${file} 的 formData.${model} 有動態選項，請改用別的取法`)
    }
    const v = /(?:^|\s)value="([^"]*)"/.exec(attrs)
    // 沒寫 value 時瀏覽器拿文字當值，這支取不到 → 擋下來，不要靜默略過
    if (!v) throw new Error(`${file} 的 formData.${model} 有沒寫 value 的 <option>：${m[0].slice(0, 60)}`)
    if (v[1] === '') continue
    out.push({ value: v[1], label: m[2].trim() })
  }
  return out
}

/** 模板裡緊接在 v-model="formData.X" 之前的 v-for="… in [ ... ]" 寫死陣列。 */
function inlineVFor(file, model) {
  const src = read(file)
  const at = src.indexOf(`v-model="formData.${model}"`)
  if (at === -1) throw new Error(`${file} 找不到 v-model="formData.${model}"`)
  const vf = src.lastIndexOf('v-for="', at)
  const start = src.indexOf('[', vf)
  if (vf === -1 || start === -1 || start > at) throw new Error(`${file} 的 formData.${model} 前面沒有 v-for 寫死陣列`)
  return evalLiteral(src.slice(start, matchBracket(src, start) + 1))
}

/** 統一成 { value, label, ...其他 }；字串選項的 label 就是 value。 */
const norm = (list, map = (o) => o) =>
  list.map((o) => (typeof o === 'string' ? { value: o, label: o } : map(o)))

// ---------- 比對 ----------

function compareOptions(where, schemaOpts, codeOpts, extraKeys = []) {
  const sv = schemaOpts.map((o) => o.value)
  const cv = codeOpts.map((o) => o.value)
  if (JSON.stringify(sv) !== JSON.stringify(cv)) {
    fail(where, `選項值不一致\n    JSON：${JSON.stringify(sv)}\n    程式：${JSON.stringify(cv)}`)
    return
  }
  schemaOpts.forEach((s, i) => {
    const c = codeOpts[i]
    const sl = s.label ?? s.value
    const cl = c.label ?? c.value
    if (sl !== cl) fail(where, `「${s.value}」的顯示文字 JSON「${sl}」≠ 程式「${cl}」`)
    for (const k of extraKeys) {
      if ((s[k] ?? null) !== (c[k] ?? null)) fail(where, `「${s.value}」的 ${k} JSON「${s[k]}」≠ 程式「${c[k]}」`)
    }
  })
}

function fieldOf(form, key) {
  for (const sec of form.sections) for (const f of sec.fields) if (f.key === key) return f
  throw new Error(`${form.formId}.json 沒有欄位 ${key}`)
}

/** 得知管道：值＋展開設定（下拉／文字、提示字、下拉的預設選項）。 */
function compareReferral(where, schemaOpts, referralSources) {
  const code = referralSources.map((s) => ({ value: s.value, label: s.value }))
  compareOptions(where, schemaOpts, code)
  schemaOpts.forEach((s) => {
    const c = referralSources.find((r) => r.value === s.value)
    if (!c) return
    const kind = s.detail?.type ?? 'none'
    if (kind !== c.expand.kind) return fail(where, `「${s.value}」展開方式 JSON ${kind} ≠ 程式 ${c.expand.kind}`)
    if (kind === 'none') return
    if (s.detail.placeholder !== c.expand.placeholder) {
      fail(where, `「${s.value}」提示字 JSON「${s.detail.placeholder}」≠ 程式「${c.expand.placeholder}」`)
    }
    if (kind === 'select' && JSON.stringify(s.detail.defaultOptions) !== JSON.stringify(c.expand.options)) {
      fail(where, `「${s.value}」預設下拉選項 JSON ${JSON.stringify(s.detail.defaultOptions)} ≠ 程式 ${JSON.stringify(c.expand.options)}`)
    }
  })
}

/** 物件轉成 key 排序後的 JSON，拿來比對內容（不管 key 的先後）。 */
const canon = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x)

/** 代號清單＋每個代號底下會進名單的設定值（omit 的是純畫面用、JSON 不收的欄位）。 */
function compareVariants(where, schemaObj, codeObj, omit) {
  const a = Object.keys(schemaObj || {}).sort()
  const b = Object.keys(codeObj || {}).sort()
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail(where, `代號清單不一致\n    JSON：${JSON.stringify(a)}\n    程式：${JSON.stringify(b)}`)
    return
  }
  for (const k of a) {
    const code = Object.fromEntries(Object.entries(codeObj[k]).filter(([p]) => !omit.includes(p)))
    if (canon(schemaObj[k]) !== canon(code)) {
      fail(`${where} ${k}`, `設定不一致\n    JSON：${canon(schemaObj[k])}\n    程式：${canon(code)}`)
    }
  }
}

/**
 * 頁面上用 v-model 綁的下拉、單選、複選，都要嘛在 FIELDS 裡比對、要嘛列在 NOT_OPTIONS 說明為什麼不比。
 * 抓的是「頁面多了一個選擇題，JSON 卻沒寫」。（沒用 v-model、自己處理點選的欄位抓不到，
 * 目前 booking 的時段／目的／得知管道就是這種，已在 FIELDS 裡。）
 */
function choiceModels(file) {
  const src = read(file)
  const keys = new Set()
  for (const m of src.matchAll(/v-model="formData\.(\w+)"/g)) {
    const st = src.lastIndexOf('<', m.index)
    const tag = /^<((?:[^>"']|"[^"]*"|'[^']*')*)>/.exec(src.slice(st))?.[1] || ''
    if (/^select\b/.test(tag) || /\btype="(radio|checkbox)"/.test(tag)) keys.add(m[1])
  }
  return keys
}

// ---------- 逐欄指定 ----------

const { relationshipOptions } = await cfg('config/formOptions.ts')
const { REFERRAL_SOURCES } = await cfg('config/referralSources.ts')
const { bookingVariants } = await cfg('config/bookingVariants.ts')
const { groupClassVariants } = await cfg('config/groupClassVariants.ts')
const { freeTrialPartners } = await cfg('config/freeTrialPartners.ts')

const B = 'pages/booking.vue'
const G = 'pages/group-booking.vue'
const C = 'pages/cooperation.vue'
const vfor = (o) => ({ value: o.v, label: o.l })
const PAGES = { booking: B, 'group-booking': G, cooperation: C }
// 頁面上的選擇題但不在 FIELDS 比對選項的：原因寫在旁邊
const NOT_OPTIONS = {
  booking: {
    storeId: '選項來自分店 API；頁面內建的備用四間另外比對（optionsSource.fallback）',
    sourceDetail: '得知管道的第二層，跟著 source 一起比對',
    agreeToTerms: '同意事項勾選框，不是選項',
  },
  'group-booking': { sourceDetail: '得知管道的第二層，跟著 source 一起比對' },
  cooperation: {},
}

const FIELDS = {
  booking: {
    gender: () => selectOptions(B, 'gender'),
    filledBySelf: () => selectOptions(B, 'filledBySelf'),
    relationship: () => norm(relationshipOptions),
    hasMedicalCondition: () => selectOptions(B, 'hasMedicalCondition'),
    preferredTimes: () => norm(constArray(B, 'contactTimeOptions')),
    source: 'referral',
    exerciseGoals: () => norm(constArray(B, 'exerciseGoalOptions')),
    paymentMethod: () => selectOptions(B, 'paymentMethod'),
  },
  'group-booking': {
    gender: () => norm(constArray(G, 'genders')),
    ageRange: () => norm(constArray(G, 'ageRanges')),
    isFillerSelf: () => inlineVFor(G, 'isFillerSelf').map(vfor),
    relationship: () => norm(relationshipOptions),
    course: () => norm(constArray(G, 'courses'), (o) => ({ value: o.value, label: o.value, price: o.price })),
    store: () => norm(constArray(G, 'storeOptions')),
    experience: () => norm(constArray(G, 'experiences'), (o) => ({ value: o.value, label: o.label })),
    source: 'referral',
  },
  cooperation: {
    cooperationType: () =>
      constArray(C, 'enquiryTypes').map((o) => ({ value: o.value, label: o.label, messagePlaceholder: o.placeholder })),
  },
}
const EXTRA_KEYS = { course: ['price'], cooperationType: ['messagePlaceholder'] }

for (const [formId, fields] of Object.entries(FIELDS)) {
  let form
  try {
    form = schema(formId)
  } catch (e) {
    fail(`${formId}.json`, `讀不到或不是合法 JSON：${e.message}`)
    continue
  }
  if (form.formId !== formId) fail(`${formId}.json`, `formId 是「${form.formId}」，應為「${formId}」`)
  if (!form.schemaVersion) fail(`${formId}.json`, '缺 schemaVersion')

  // JSON 裡有選項、但上面沒指定怎麼比對的欄位 → 也算失敗，避免新欄位漏網
  for (const sec of form.sections) {
    for (const f of sec.fields) {
      if (Array.isArray(f.options) && !(f.key in fields)) {
        fail(`${formId}.${f.key}`, '有選項但 check-form-schemas.mjs 沒有指定比對來源，請在 FIELDS 補上')
      }
    }
  }

  for (const key of choiceModels(PAGES[formId])) {
    if (!(key in fields) && !(key in NOT_OPTIONS[formId])) {
      fail(`${formId}.${key}`, `${PAGES[formId]} 有這個選擇題，但 check-form-schemas.mjs 沒有比對它（JSON 可能也漏寫）`)
    }
  }

  for (const [key, get] of Object.entries(fields)) {
    const where = `${formId}.${key}`
    try {
      const f = fieldOf(form, key)
      if (!Array.isArray(f.options)) {
        fail(where, 'JSON 裡沒有 options 陣列')
        continue
      }
      if (get === 'referral') compareReferral(where, f.options, REFERRAL_SOURCES)
      else compareOptions(where, f.options, get(), EXTRA_KEYS[key])
    } catch (e) {
      fail(where, e.message)
    }
  }
}

try {
  // hero／adminLabel 是頁面標題與後台下拉的顯示文字，note 是內部備註，JSON 不收
  compareVariants('booking 網址變體（?v=）', schema('booking').context?.variants, bookingVariants, ['hero', 'adminLabel'])
  compareVariants('booking 免費合作方（?co=）', schema('booking').context?.freeTrialPartners, freeTrialPartners, ['note'])
  compareVariants('group-booking 網址變體（?v=）', schema('group-booking').context?.variants, groupClassVariants, ['hero'])
} catch (e) {
  fail('網址變體', e.message)
}

// booking 分店：選項來自分店 API，但頁面內建四間當備用（SSR 與 API 失敗時用），這四間的代號會存進 leads.storeId
try {
  const fb = fieldOf(schema('booking'), 'storeId').optionsSource?.fallback
  const code = constArray(B, 'stores').map((s) => ({ value: s.id, label: s.name, address: s.address, phone: s.phone }))
  if (!Array.isArray(fb)) fail('booking.storeId', 'JSON 沒有 optionsSource.fallback')
  else compareOptions('booking.storeId 備用分店', fb, code, ['address', 'phone'])
} catch (e) {
  fail('booking.storeId', e.message)
}

if (errors.length) {
  console.error(`\n[check-form-schemas] ✗ docs/form-schema 跟程式不一致（${errors.length} 項）：\n`)
  for (const e of errors) console.error(`  - ${e}`)
  console.error('\n改程式的選項時要一起改 docs/form-schema/*.json（只新增或停用，不改既有選項的字），')
  console.error('有不相容的改動（欄位改名、存法改變）就升 schemaVersion 並先通知 CRM。\n')
  process.exit(1)
}
console.log('[check-form-schemas] ✓ 三張表單的 schema 跟程式一致')
