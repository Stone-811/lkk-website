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
//   - 頁面上 v-model 綁的每個欄位都要是 JSON 的一題（或列在 NOT_OPTIONS），選擇題還要在 FIELDS 比對選項
//     （防止頁面新增題目卻沒寫進 JSON；模板與 script 的註解不算）
//   - 跟上一版比（docs/form-schema/values-ledger.json）：每個欄位（含隱藏欄位）的名單位置、型別、alsoWrites，
//     存進名單的值（選項值含 retiredOptions、possibleValues、store.map 對照後的值）、leadType、
//     網址變體與合作方代號。值與代號不能消失或改字（停用要移到 retiredOptions／retiredVariants，
//     升 schemaVersion 也一樣；升版刪掉的題目在記錄檔留墓碑）；欄位刪除或改 key、位置、型別、leadType
//     要改就得升 schemaVersion；新增的東西要先記錄（--record）才會過
//   - 寫名單的程式：server/ 底下每個 createLead 的 type、每張表單 submit.endpoint 那支只寫自己的 leadType
//   - 給 Hub 的版本（toHubView 白名單）：位置、型別、存的值、代號、段落、題目與選項文字都跟正本一樣
//   - 新表單：名單 type（server/utils/leads.ts 的 CreateLeadInput.type，與實際呼叫 createLead 的地方）
//     都要有 leadType 相同的 JSON；JSON 檔、server/utils/form-schemas.ts 的 SOURCES、下面的 FIELDS 要對齊
//   - 下架：JSON 留著、加 retiredOn，只從 FIELDS 拿掉
// 沒檢查：欄位標題、placeholder、錯誤訊息、驗證規則（含「選某項才必填」這類條件）、同意事項文字、
// 頁面什麼時候寫入隱藏值（例如「活動免費」；值本身在 possibleValues 裡，記錄後不能消失）——改這些時要自己同步 JSON。
// 也沒檢查（做不到可靠的靜態比對）：
//   - 送出端點（server/api/leads/*.post.ts）實際把值存在 payload 的哪個 key、有沒有轉換：改存法時要自己同步 JSON 的 store.path
//   - 標成 { inTemplate: false } 的陣列（透過 computed 給模板）：computed 裡另外加的選項
//   - 自己處理點選、沒用 v-model 的選擇題（booking 的時段／目的／得知管道已在 FIELDS 裡，新加的要自己補）
//   - 刻意繞過：把集合名稱藏在別的變數或函式裡、從後台（server/api/admin/）寫新類型的名單
// 原始碼一律用 Vue（vue/compiler-sfc）與 TypeScript 自己的解析器讀，註解、字串、巢狀模板字串不會被誤認。
//
// 用法：
//   node scripts/check-form-schemas.mjs            檢查（npm run build 會先跑這個）
//   node scripts/check-form-schemas.mjs --record   檢查通過、只剩「新增還沒記錄」時，把現況寫進 values-ledger.json
//                                                  （記錄檔要跟著 commit；只有新增或升了 schemaVersion 才寫得進去）
//
// 選項的來源有三種：config/*.ts 的 export、頁面 <script setup> 裡的 const 陣列、
// 模板裡寫死的 <option value="…"> 或 v-for="opt in [...]"。下面 FIELDS 逐欄指定。
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createJiti } from 'jiti'
import ts from 'typescript'
import { parse as parseSfc } from 'vue/compiler-sfc'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// config/*.ts 也被頁面用 ~/ 匯入；這裡在 Nuxt 外面載入，所以要自己給別名（Nuxt 的自動匯入與 #imports 還是不能用）
const jiti = createJiti(import.meta.url, { alias: { '~~': root, '~': root, '@@': root, '@': root } })
const read = (p) => readFileSync(join(root, p), 'utf8')
const schema = (id) => JSON.parse(read(`docs/form-schema/${id}.json`))
const cfg = (p) => jiti.import(join(root, p))

const errors = []
const fail = (where, msg) => errors.push(`${where}：${msg}`)
// 讀不到檔、JSON 壞掉這類「根本原因」：有的話只印這些，後面連帶的錯誤先不印，免得被帶錯方向
const fatal = []
const failFatal = (where, msg) => {
  fatal.push(`${where}：${msg}`)
  fail(where, msg)
}
// 新增的值還沒寫進記錄檔：建置一樣失敗，但 --record 可以把它們記下來
const pending = []
const RECORD = process.argv.includes('--record')
const LEDGER = 'docs/form-schema/values-ledger.json'

// ---------- 從程式碼取選項 ----------

// ---------- 讀原始碼：用 Vue 與 TypeScript 自己的解析器，不用正規式猜 ----------
// （註解、字串、巢狀模板字串、regex 字面值都由解析器處理，跟實際建置看到的一樣）

const parseErr = (msg) => Object.assign(new Error(msg), { parse: true })

/** 把 TS 原始碼片段轉成 JS 再求值（只用在字面值陣列）。 */
const evalLiteral = (text) =>
  new Function(`return ${ts.transpile(`(${text})`, { target: ts.ScriptTarget.ES2020 }).trim().replace(/;$/, '')}`)()

const tsFile = (name, text) => ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, name.endsWith('.js') || name.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS)
function tsWalk(node, fn) {
  fn(node)
  ts.forEachChild(node, (c) => tsWalk(c, fn))
}
const unwrap = (n) => {
  while (n && (ts.isAsExpression(n) || ts.isSatisfiesExpression?.(n) || ts.isParenthesizedExpression(n) || ts.isTypeAssertionExpression?.(n))) n = n.expression
  return n
}
const stringValue = (n) => {
  n = unwrap(n)
  return n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null
}
const propName = (p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null)

/** .vue 檔：template AST 與 <script setup> 的 TS AST。 */
const vueCache = {}
function vueParts(file) {
  if (vueCache[file]) return vueCache[file]
  const { descriptor, errors } = parseSfc(read(file), { filename: file })
  if (errors.length) throw parseErr(`${file} 解析失敗：${errors[0].message ?? errors[0]}`)
  if (!descriptor.template?.ast) throw parseErr(`${file} 找不到 <template>`)
  if (!descriptor.scriptSetup) throw parseErr(`${file} 找不到 <script setup>`)
  const elements = [] // { node, parent }
  const walk = (n, parent) => {
    if (n.type === 1) elements.push({ node: n, parent })
    for (const c of n.children ?? []) walk(c, n.type === 1 ? { node: n, parent } : parent)
    // v-if／v-for 的分支
    for (const b of n.branches ?? []) walk(b, parent)
  }
  walk(descriptor.template.ast, null)
  const script = tsFile(`${file}.ts`, descriptor.scriptSetup.content)
  return (vueCache[file] = { elements, script })
}

const attr = (el, name) => el.props.find((p) => p.type === 6 && p.name === name)
const dir = (el, name, arg) =>
  el.props.find((p) => p.type === 7 && p.name === name && (arg === undefined || p.arg?.content === arg))
/** v-model（任何修飾、v-model:xxx）綁的 formData 欄位；formData.a.b 取 a。 */
function vModelKey(el) {
  const d = el.props.find((p) => p.type === 7 && p.name === 'model')
  const m = d && /^\s*formData\s*(?:\.\s*(\w+)|\[\s*(['"`])(\w+)\2\s*\])/.exec(d.exp?.content ?? '')
  return m ? m[1] ?? m[3] : null
}

/** 綁 formData.X 的所有元素。 */
function modelElements(file, model) {
  const els = vueParts(file).elements.filter((e) => vModelKey(e.node) === model)
  if (!els.length) throw parseErr(`${file} 找不到 v-model="formData.${model}"`)
  return els
}

/** v-for 的來源運算式（"g in genders" → "genders"）。 */
const vForSource = (el) => {
  const d = dir(el, 'for')
  const m = d && /^[\s\S]*?\s(?:in|of)\s+([\s\S]+)$/.exec(d.exp?.content ?? '')
  return m ? m[1].trim() : null
}

/**
 * <script setup> 裡 `const name = [ ... ]`（或 `= ref([ ... ])`、加 as const）的陣列，內容只能是字面值。
 * 預設還要求模板有一個 v-for 直接跑這個陣列（v-for="x in name"）：改名時舊的常數若還留著、
 * 或模板改成 [...name, '新選項'] 這類寫法，才不會一直比到舊的那份。
 * 透過 computed 篩選後才給模板用的，傳 { inTemplate: false }。
 */
function constArray(file, name, { inTemplate = true } = {}) {
  const { script, elements } = vueParts(file)
  let init = null
  tsWalk(script, (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name) init = n.initializer
  })
  if (!init) throw parseErr(`${file} 找不到 const ${name}`)
  let arr = unwrap(init)
  if (arr && ts.isCallExpression(arr) && ts.isIdentifier(arr.expression) && arr.expression.text === 'ref') arr = unwrap(arr.arguments[0])
  if (!arr || !ts.isArrayLiteralExpression(arr) || arr.elements.some((e) => ts.isSpreadElement(e))) {
    throw parseErr(`${file} 的 const ${name} 要直接寫成陣列字面值（不能 concat、展開或呼叫函式），檢查才讀得到`)
  }
  if (inTemplate && !elements.some((e) => vForSource(e.node) === name)) {
    throw parseErr(`${file} 的模板沒有 v-for 直接跑 ${name}（改名了？或包了一層 computed？包 computed 的話把這欄的取法改成 { inTemplate: false }）`)
  }
  try {
    return evalLiteral(arr.getText())
  } catch (e) {
    throw parseErr(`${file} 的 const ${name} 讀不出來（內容只能是字面值）：${e.message}`)
  }
}

/** 元素底下的純文字（瀏覽器會把連續空白顯示成一格）；有 {{ }} 就回 null。 */
function textOf(el) {
  let out = ''
  for (const c of el.children ?? []) {
    if (c.type === 2) out += c.content
    else if (c.type === 3) continue // 註解
    else return null
  }
  return out.replace(/\s+/g, ' ').trim()
}

/** 模板裡 v-model="formData.X" 的 <select> 底下寫死的 <option value="V">文字</option>（略過空值的提示選項）。
 *  同一欄有 v-if／v-else 兩個 <select> 時，兩邊選項要一樣。 */
function selectOptions(file, model) {
  let result = null
  for (const { node } of modelElements(file, model)) {
    if (node.tag !== 'select') throw parseErr(`${file} 的 formData.${model} 不在 <select> 上（是 <${node.tag}>，可能搬進元件或改寫法了）`)
    const out = []
    for (const o of node.children ?? []) {
      if (o.type === 3 || (o.type === 2 && !o.content.trim())) continue
      if (o.type !== 1 || o.tag !== 'option') throw parseErr(`${file} 的 formData.${model} 的 <select> 裡有 <option> 以外的東西（v-for、<template>…），請改用別的取法`)
      const bound = dir(o, 'bind', 'value')
      if (bound) {
        // 提示用的 <option :value="null" disabled>請選擇</option> 不算選項
        if (/^\s*(null|''|""|undefined)\s*$/.test(bound.exp?.content ?? '')) continue
        throw parseErr(`${file} 的 formData.${model} 有動態選項（:value），請改用別的取法`)
      }
      if (dir(o, 'for')) throw parseErr(`${file} 的 formData.${model} 有 v-for 產生的選項，請改用別的取法`)
      const v = attr(o, 'value')
      // 沒寫 value 時瀏覽器拿文字當值，這支取不到 → 擋下來，不要靜默略過
      if (!v) throw parseErr(`${file} 的 formData.${model} 有沒寫 value 的 <option>`)
      if ((v.value?.content ?? '') === '') continue
      const label = textOf(o)
      if (label === null) throw parseErr(`${file} 的 formData.${model} 的選項「${v.value.content}」文字有 {{ }}，請改用別的取法`)
      out.push({ value: v.value.content, label })
    }
    if (result && JSON.stringify(result) !== JSON.stringify(out)) throw parseErr(`${file} 的 formData.${model} 有兩個 <select>，選項不一樣`)
    result = out
  }
  return result
}

/** 綁 formData.X 的元素自己或外層的 v-for="… in [ ... ]" 寫死陣列。 */
function inlineVFor(file, model) {
  const els = modelElements(file, model)
  if (els.length > 1) throw parseErr(`${file} 有 ${els.length} 個 v-model="formData.${model}"，請改用別的取法`)
  for (let e = els[0]; e; e = e.parent) {
    const src = vForSource(e.node)
    if (src && src.startsWith('[')) return evalLiteral(src)
    if (src) break
  }
  throw parseErr(`${file} 的 formData.${model} 沒有在 v-for 寫死陣列裡`)
}

/** 選項來自程式陣列（不是 selectOptions）的欄位：綁這個 v-model 的元素只能有一個，<select> 裡也不能另外寫死選項。 */
function singleSourceCheck(file, model) {
  const els = modelElements(file, model)
  if (els.length > 1) throw parseErr(`${file} 有 ${els.length} 個 v-model="formData.${model}"（選項來自程式陣列時只能有一個，另外寫死的選項檢查比不到）`)
  const { node } = els[0]
  if (node.tag === 'select') {
    for (const o of node.children ?? []) {
      if (o.type !== 1 || o.tag !== 'option' || dir(o, 'for')) continue
      const v = attr(o, 'value')
      if (v && (v.value?.content ?? '') !== '') throw parseErr(`${file} 的 formData.${model} 除了程式陣列，<select> 裡又寫死了選項「${v.value.content}」`)
    }
  }
}

/**
 * 頁面上所有 v-model="formData.X" 的欄位：all 是全部，choice 是原生選擇題（<select>、type 是 radio／checkbox，含 :type）。
 * 抓的是「頁面多了一題，JSON 卻沒寫」。元件（<BaseSelect> 等）不知道是不是選擇題，只要求它是 JSON 的一題。
 * （沒用 v-model、自己處理點選的欄位抓不到，目前 booking 的時段／目的／得知管道就是這種，已在 FIELDS 裡。）
 */
function pageModels(file) {
  const all = new Set()
  const choice = new Set()
  for (const { node } of vueParts(file).elements) {
    const key = vModelKey(node)
    if (!key) continue
    all.add(key)
    // 靜態 type 與 :type 都看（兩個都寫時 Vue 以 :type 為準）
    const t = `${attr(node, 'type')?.value?.content ?? ''} ${dir(node, 'bind', 'type')?.exp?.content ?? ''}`
    if (node.tag === 'select' || /\b(radio|checkbox)\b/.test(t)) choice.add(key)
  }
  return { all, choice }
}

// ---------- server 端原始碼 ----------

/** 檔案裡寫成字面值的 'leads'（含 const X = 'leads' 這種常數）有沒有被拿來 collection(...)／doc('leads/…')。回傳 [{ pos, insideFn }] */
function leadsCollectionUses(sf) {
  const leadsConsts = new Set()
  tsWalk(sf, (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && stringValue(n.initializer ?? null) === 'leads') leadsConsts.add(n.name.text)
  })
  const uses = []
  tsWalk(sf, (n) => {
    if (!ts.isCallExpression(n)) return
    const callee = ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : ts.isIdentifier(n.expression) ? n.expression.text : null
    const a0 = n.arguments[0]
    const s = a0 ? stringValue(a0) : null
    const isLeads =
      (callee === 'collection' && (s === 'leads' || (a0 && ts.isIdentifier(a0) && leadsConsts.has(a0.text)))) ||
      (callee === 'doc' && typeof s === 'string' && s.startsWith('leads/'))
    if (!isLeads) return
    let fn = n.parent
    while (fn && !(ts.isFunctionDeclaration(fn) && fn.name)) fn = fn.parent
    uses.push({ line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, insideFn: fn?.name?.text ?? null })
  })
  return uses
}

/** createLead 的呼叫：[{ type } | { error }]；也回報換名字的用法。 */
function createLeadCalls(sf) {
  const out = []
  tsWalk(sf, (n) => {
    const line = () => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1
    // 換名字：import { createLead as x }、const x = createLead、const { createLead: x } = …
    if (ts.isImportSpecifier(n) && n.propertyName?.text === 'createLead' && n.name.text !== 'createLead') out.push({ error: `第 ${line()} 行：createLead 不要換名字匯入，檢查是用名字找呼叫的` })
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isIdentifier(unwrap(n.initializer)) && unwrap(n.initializer).text === 'createLead') out.push({ error: `第 ${line()} 行：不要把 createLead 指派給別的名字` })
    if (ts.isBindingElement(n) && n.propertyName && propName(n) !== 'createLead' && n.propertyName.text === 'createLead') out.push({ error: `第 ${line()} 行：createLead 不要換名字` })
    if (!ts.isCallExpression(n) || !ts.isIdentifier(n.expression) || n.expression.text !== 'createLead') return
    const arg = unwrap(n.arguments[0])
    if (!arg || !ts.isObjectLiteralExpression(arg)) {
      out.push({ error: `第 ${line()} 行：createLead 請直接傳物件字面值（例如 createLead({ type: 'booking', … })），檢查才對得到 type` })
      return
    }
    const props = arg.properties
    const t = props.filter((p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && propName(p) === 'type')
    if (t.length !== 1 || !ts.isPropertyAssignment(t[0]) || props.some((p) => ts.isSpreadAssignment(p))) {
      out.push({ error: `第 ${line()} 行：createLead 的 type 要直接寫成字面值（type: 'booking'），不要用簡寫、變數或展開` })
      return
    }
    const v = stringValue(t[0].initializer)
    if (v === null) out.push({ error: `第 ${line()} 行：createLead 的 type 是「${t[0].initializer.getText()}」，請寫成字面值，檢查才對得到 config` })
    else out.push({ type: v })
  })
  return out
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

// ---------- 逐欄指定 ----------

const cfgOr = async (p) => {
  try {
    return await cfg(p)
  } catch (e) {
    failFatal(p, `讀不到：${e.message}（設定檔刪了或改名的話，這支下面用到它的地方也要改；config 不能用 Nuxt 的自動匯入或 #imports，因為這支在 Nuxt 外面跑）`)
    return {}
  }
}
const { relationshipOptions = [] } = await cfgOr('config/formOptions.ts')
const { REFERRAL_SOURCES = [] } = await cfgOr('config/referralSources.ts')
const { bookingVariants } = await cfgOr('config/bookingVariants.ts')
const { groupClassVariants } = await cfgOr('config/groupClassVariants.ts')
const { freeTrialPartners } = await cfgOr('config/freeTrialPartners.ts')

const B = 'pages/booking.vue'
const G = 'pages/group-booking.vue'
const C = 'pages/cooperation.vue'
const vfor = (o) => ({ value: o.v, label: o.l })
const PAGES = { booking: B, 'group-booking': G, cooperation: C }
// 頁面上 v-model 綁的欄位，但不是 JSON 的一題、或不在 FIELDS 比對選項的：原因寫在旁邊
const NOT_OPTIONS = {
  booking: {
    storeId: '選項來自分店 API；頁面內建的備用四間另外比對（optionsSource.fallback）',
    sourceDetail: '得知管道的第二層，跟著 source 一起比對',
    agreeToTerms: '同意事項勾選框，不是選項',
    preferredTimeOther: '時段選「其他」時的說明，存在 preferredTimes 裡（其他: <說明>）',
    exerciseGoalOther: '訓練目的選「其他」時的說明，存在 exerciseGoals 裡（其他: <說明>）',
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
    course: () => norm(constArray(G, 'courses', { inTemplate: false }), (o) => ({ value: o.value, label: o.value, price: o.price })),
    store: () => norm(constArray(G, 'storeOptions', { inTemplate: false })),
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
    failFatal(`${formId}.json`, `讀不到或不是合法 JSON：${e.message}`)
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

  if (!PAGES[formId] || !NOT_OPTIONS[formId]) {
    fail(formId, 'check-form-schemas.mjs 的 PAGES 或 NOT_OPTIONS 沒有這張表單（新增表單要一起加）')
    continue
  }
  let models = { all: new Set(), choice: new Set() }
  try {
    models = pageModels(PAGES[formId])
  } catch (e) {
    fail(formId, e.message)
  }
  const jsonKeys = new Set([
    ...form.sections.flatMap((sec) => sec.fields.map((f) => f.key)),
    ...(Array.isArray(form.hiddenFields) ? form.hiddenFields.map((h) => h.key) : []),
  ])
  for (const key of models.all) {
    if (!jsonKeys.has(key) && !(key in NOT_OPTIONS[formId])) {
      fail(`${formId}.${key}`, `${PAGES[formId]} 有 formData.${key} 這個欄位，但 ${formId}.json 沒有這一題（新增題目要寫進 JSON；不存進名單的輸入框列進 check-form-schemas.mjs 的 NOT_OPTIONS 並寫明原因）`)
    }
  }
  for (const key of models.choice) {
    if (!(key in fields) && !(key in NOT_OPTIONS[formId])) {
      fail(`${formId}.${key}`, `${PAGES[formId]} 有這個選擇題，但 check-form-schemas.mjs 沒有比對它（在 FIELDS 補上取法，JSON 也要寫選項）`)
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
      else {
        compareOptions(where, f.options, get(), EXTRA_KEYS[key])
        // 選項來自程式陣列的欄位：頁面不能在旁邊另外寫死選項或多綁一個輸入框（那些值檢查比不到）
        if (models.all.has(key) && !String(get).includes('selectOptions(')) singleSourceCheck(PAGES[formId], key)
      }
    } catch (e) {
      fail(where, e.parse ? `${e.message}。頁面改寫法（改名、搬進元件、改成動態）時，要改 scripts/check-form-schemas.mjs 的 FIELDS 取法` : e.message)
    }
  }
}

// 下架的表單（不在 FIELDS）不比對程式：它的頁面與設定檔可能已經刪了
try {
  // hero／adminLabel 是頁面標題與後台下拉的顯示文字，note 是內部備註，JSON 不收
  if ('booking' in FIELDS) {
    compareVariants('booking 網址變體（?v=）', schema('booking').context?.variants, bookingVariants, ['hero', 'adminLabel'])
    compareVariants('booking 免費合作方（?co=）', schema('booking').context?.freeTrialPartners, freeTrialPartners, ['note'])
  }
  if ('group-booking' in FIELDS) {
    compareVariants('group-booking 網址變體（?v=）', schema('group-booking').context?.variants, groupClassVariants, ['hero'])
  }
} catch (e) {
  fail('網址變體', e.message)
}

// booking 分店：選項來自分店 API，但頁面內建四間當備用（SSR 與 API 失敗時用），這四間的代號會存進 leads.storeId
if ('booking' in FIELDS) try {
  const fb = fieldOf(schema('booking'), 'storeId').optionsSource?.fallback
  const code = constArray(B, 'stores').map((s) => ({ value: s.id, label: s.name, address: s.address, phone: s.phone }))
  singleSourceCheck(B, 'storeId')
  if (!Array.isArray(fb)) fail('booking.storeId', 'JSON 沒有 optionsSource.fallback')
  else compareOptions('booking.storeId 備用分店', fb, code, ['address', 'phone'])
} catch (e) {
  fail('booking.storeId', e.message)
}


// ---------- 新表單與下架：名單 type ↔ JSON ↔ SOURCES ↔ FIELDS ↔ 寫入端 ----------
//
// 新增一張表單，這幾處都要加：docs/form-schema/<formId>.json（含 leadType、submit.endpoint）、
// server/utils/form-schemas.ts 的 SOURCES、server/utils/leads.ts 的 CreateLeadInput.type，
// 以及這支的 FIELDS、PAGES、NOT_OPTIONS。
// 下架一張表單：JSON 留著、頂層加 "retiredOn": "YYYY-MM-DD"，SOURCES 照樣列著（Hub 還要靠它解讀舊名單），
// 從 FIELDS／PAGES／NOT_OPTIONS 拿掉、刪頁面與送出端點。同步時 Firestore 文件會帶 retiredOn。

/** 遞迴列出資料夾裡的 .ts／.js 檔（不用 readdirSync 的 recursive，舊版 Node 18 沒有）。 */
function listTs(dir) {
  const out = []
  for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) out.push(...listTs(p))
    else if (/\.[cm]?[jt]s$/.test(e.name)) out.push(p)
  }
  return out
}

// 名單 type 沒有 config 的（舊資料才有、已經沒有程式在寫）：寫明原因
const NO_CONFIG_LEAD_TYPES = { franchise: '加盟表單 2026-10-16 下架（bfa10d3），當時還沒有 config；Hub 照原值顯示' }
// 讀 leads 集合但不寫入的檔案（後台以外）：要加就寫明原因。寫入一律經過 server/utils/leads.ts 的 createLead。
// （用 TypeScript 解析器找 collection('leads')／doc('leads/…') 的呼叫，含 const X = 'leads' 的常數；註解與字串裡提到不算）
const LEADS_READERS = {}

const jsonIds = readdirSync(join(root, 'docs/form-schema'))
  .filter((f) => f.endsWith('.json') && `docs/form-schema/${f}` !== LEDGER)
  .map((f) => f.replace(/\.json$/, ''))
const forms = {}
for (const id of jsonIds) {
  try {
    forms[id] = schema(id)
  } catch (e) {
    if (!(id in FIELDS)) failFatal(`${id}.json`, `讀不到或不是合法 JSON：${e.message}`) // FIELDS 裡的上面已經報過
  }
}
const isRetired = (id) => Boolean(forms[id]?.retiredOn)
const leadTypeOf = {}
try {
  const fsSf = tsFile('server/utils/form-schemas.ts', read('server/utils/form-schemas.ts'))
  const importName = {}
  let sourceNames = null
  tsWalk(fsSf, (n) => {
    if (ts.isImportDeclaration(n) && n.importClause?.name) {
      const m = /(?:^|\/)docs\/form-schema\/([\w-]+)\.json$/.exec(n.moduleSpecifier.text)
      if (m) importName[n.importClause.name.text] = m[1]
    }
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === 'SOURCES') {
      const a = unwrap(n.initializer)
      if (a && ts.isArrayLiteralExpression(a)) sourceNames = a.elements.map((e) => (ts.isIdentifier(e) ? e.text : `?${e.getText()}`))
    }
  })
  if (!sourceNames) fail('server/utils/form-schemas.ts', '找不到 const SOURCES = [...]')
  const sourceIds = (sourceNames ?? []).map((n) => importName[n] ?? `?${n}`)
  const live = jsonIds.filter((id) => !isRetired(id))
  const show = (a) => JSON.stringify([...a].sort())
  if (show(sourceIds) !== show(jsonIds) || show(Object.keys(FIELDS)) !== show(live)) {
    fail('表單清單', [
      '不一致（新增表單要改的地方見 check-form-schemas.mjs 的「新表單與下架」註解；下架的表單 JSON 加 retiredOn、留在 SOURCES、從 FIELDS 拿掉）',
      `    docs/form-schema/*.json：${show(jsonIds)}（其中已下架：${show(jsonIds.filter(isRetired))}）`,
      `    server/utils/form-schemas.ts 的 SOURCES：${show(sourceIds)}（應等於全部 JSON）`,
      `    check-form-schemas.mjs 的 FIELDS：${show(Object.keys(FIELDS))}（應等於沒下架的 JSON）`,
    ].join('\n'))
  }
  for (const id of jsonIds) {
    const f = forms[id]
    if (!f) continue
    if (f.formId !== id) fail(`${id}.json`, `formId 是「${f.formId}」，應為「${id}」`)
    if (f.retiredOn !== undefined) {
      const d = new Date(`${f.retiredOn}T00:00:00Z`)
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(f.retiredOn)) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f.retiredOn
      if (!ok) fail(`${id}.json`, `retiredOn「${f.retiredOn}」不是合法日期（YYYY-MM-DD）`)
    }
    const lt = f.leadType
    if (typeof lt !== 'string' || !lt) fail(`${id}.json`, '缺 leadType（這張表單寫進 leads 的 type）')
    else if (leadTypeOf[lt]) fail(`${id}.json`, `leadType「${lt}」跟 ${leadTypeOf[lt]}.json 重複`)
    else leadTypeOf[lt] = id
  }

  // 1) 名單 type 的型別宣告（CreateLeadInput.type）：每個成員都要有 config，或列在 NO_CONFIG_LEAD_TYPES
  // CreateLeadInput（interface 或 type 別名）最外層的 type 欄位，要是字串字面值的聯集
  const leadsSf = tsFile('server/utils/leads.ts', read('server/utils/leads.ts'))
  let declared = null
  tsWalk(leadsSf, (n) => {
    let members = null
    if (ts.isInterfaceDeclaration(n) && n.name.text === 'CreateLeadInput') members = n.members
    if (ts.isTypeAliasDeclaration(n) && n.name.text === 'CreateLeadInput' && ts.isTypeLiteralNode(n.type)) members = n.type.members
    const t = members?.find((m) => ts.isPropertySignature(m) && propName(m) === 'type')?.type
    if (!t) return
    const parts = ts.isUnionTypeNode(t) ? t.types : [t]
    const lits = parts.map((x) => (ts.isLiteralTypeNode(x) && ts.isStringLiteral(x.literal) ? x.literal.text : null))
    if (lits.every((x) => x !== null)) declared = lits
  })
  if (!declared) fail('server/utils/leads.ts', '找不到 CreateLeadInput 的 type 字面值聯集（檢查要靠它）')
  declared ??= []
  for (const t of declared) {
    if (!leadTypeOf[t] && !(t in NO_CONFIG_LEAD_TYPES)) {
      fail('server/utils/leads.ts', `名單 type「${t}」沒有 leadType 是它的 config。新表單要寫 docs/form-schema/<formId>.json（含 leadType），加進 server/utils/form-schemas.ts 的 SOURCES 與這支的 FIELDS`)
    }
  }
  // 2) server/ 底下所有 createLead 呼叫：type 必須是字面值、在聯集裡、有 config、表單沒下架；
  //    leads 集合在 server/utils/leads.ts 與後台以外不能直接碰
  const writers = {}
  for (const file of listTs('server')) {
    const sf = tsFile(file, read(file))
    for (const u of leadsCollectionUses(sf)) {
      // server/utils/leads.ts 裡只有 createLead 本身可以寫；後台（server/api/admin/）管理既有名單，不檢查
      if (file === 'server/utils/leads.ts' ? u.insideFn === 'createLead' : file.startsWith('server/api/admin/') || file in LEADS_READERS) continue
      fail(file, `第 ${u.line} 行直接讀寫 leads 集合。新名單一律經過 server/utils/leads.ts 的 createLead（這支檢查靠它對 type）；只讀不寫的話加進 check-form-schemas.mjs 的 LEADS_READERS 並寫明原因`)
    }
    if (file === 'server/utils/leads.ts') continue
    for (const r of createLeadCalls(sf)) {
      if (r.error) {
        fail(file, r.error)
        continue
      }
      ;(writers[file] ??= []).push(r.type)
      if (!declared.includes(r.type)) fail(file, `createLead 寫入 type「${r.type}」，但 CreateLeadInput.type 沒有它`)
      else if (!leadTypeOf[r.type]) fail(file, `寫入 type「${r.type}」的名單，但沒有 leadType 是它的 config`)
      else if (isRetired(leadTypeOf[r.type])) fail(file, `還在寫 type「${r.type}」的名單，但 ${leadTypeOf[r.type]}.json 已標 retiredOn`)
    }
  }
  // 3) 每張沒下架的表單：submit.endpoint 對應的檔案存在，而且只寫這張表單的 leadType（防複製貼上忘了改 type）
  for (const id of jsonIds.filter((x) => forms[x] && !isRetired(x))) {
    const m = /^POST \/api\/([\w/-]+)$/.exec(String(forms[id].submit?.endpoint ?? ''))
    if (!m) {
      fail(`${id}.json`, `submit.endpoint 要寫成「POST /api/…」（現在是 ${JSON.stringify(forms[id].submit?.endpoint)}）`)
      continue
    }
    const file = `server/api/${m[1]}.post.ts`
    if (!existsSync(join(root, file))) fail(`${id}.json`, `submit.endpoint 對應的 ${file} 不存在`)
    else if (!(writers[file] ?? []).length) fail(file, `${id}.json 說名單從這裡送出，但這支沒有 createLead`)
    else if (writers[file].some((t) => t !== forms[id].leadType)) {
      fail(file, `寫入的 type ${JSON.stringify(writers[file])}，跟 ${id}.json 的 leadType「${forms[id].leadType}」不一致`)
    }
  }
} catch (e) {
  fail('表單清單', e.message)
}

// ---------- 跟上一版比：values-ledger.json ----------

/** valueType 只取第一個出現的型別字（有時前後接說明文字，例如「string（只有經表單送出時保證…）」）；沒寫就是字串。 */
const baseType = (t) => (t == null ? 'string' : /\b(?:string|boolean|number|object)(?:\[\])?/.exec(String(t))?.[0] ?? String(t))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const has = (list, v) => (list ?? []).some((x) => same(x, v))
const uniq = (list) => list.reduce((a, v) => (has(a, v) ? a : [...a, v]), [])

/**
 * 一張表單「存進名單、Hub 要能解讀」的東西：
 *   每題（含隱藏欄位，key 加 hidden: 前綴）的名單位置、型別、順帶寫入的位置（alsoWrites），
 *   以及存進名單的值：選項值（含 retiredOptions）、store.possibleValues；
 *   有 store.map 的題目存的是對照後的值（例如 true／false），選項文字只是畫面用，改字不算不相容。
 *   還有網址變體與免費合作方的代號（含已停用）。
 */
function snapshot(form) {
  const fields = {}
  const add = (key, where, f, store, valueType) => {
    if (key in fields) fail(where, '同一張表單有兩個欄位 key 相同')
    const entry = { path: store?.path ?? null, valueType: baseType(valueType) }
    const also = store?.alsoWrites ? [].concat(store.alsoWrites).map((a) => a?.path).filter(Boolean).sort() : []
    if (also.length) entry.alsoWrites = also
    let values = []
    if (f && Array.isArray(f.options)) {
      if (f.retiredOptions !== undefined && !Array.isArray(f.retiredOptions)) fail(where, 'retiredOptions 要是陣列')
      const retired = Array.isArray(f.retiredOptions) ? f.retiredOptions : []
      for (const r of retired) {
        if (!r || typeof r !== 'object' || !('value' in r)) fail(where, `retiredOptions 每一項要是 { value, … }：${JSON.stringify(r)}`)
        else if (f.options.some((o) => o.value === r.value)) fail(where, `「${r.value}」同時在 options 和 retiredOptions`)
      }
      if (!store?.map) values = [...f.options, ...retired].filter((o) => o && typeof o === 'object').map((o) => o.value)
    } else if (f?.retiredOptions !== undefined) {
      fail(where, '沒有 options 卻有 retiredOptions')
    }
    if (store?.map && typeof store.map === 'object') values.push(...Object.values(store.map))
    if (Array.isArray(store?.possibleValues)) values.push(...store.possibleValues)
    values = uniq(values)
    if (values.length) entry.values = values
    fields[key] = entry
  }
  for (const sec of form.sections ?? []) {
    for (const f of sec.fields ?? []) add(f.key, `${form.formId}.${f.key}`, f, f.store, f.store?.valueType)
  }
  for (const h of Array.isArray(form.hiddenFields) ? form.hiddenFields : []) {
    if (h?.key) add(`hidden:${h.key}`, `${form.formId}.hiddenFields.${h.key}`, null, h.store, h.valueType ?? h.store?.valueType)
  }
  const ctx = form.context ?? {}
  const codes = (k, rk, label) => {
    const a = Object.keys(ctx[k] ?? {})
    const b = Object.keys(ctx[rk] ?? {})
    for (const c of a) if (b.includes(c)) fail(`${form.formId}.json`, `${label}代號「${c}」同時在 context.${k} 和 context.${rk}`)
    return uniq([...a, ...b])
  }
  const out = {
    leadType: form.leadType ?? null,
    schemaVersion: String(form.schemaVersion),
    fields,
    variants: codes('variants', 'retiredVariants', '網址變體'),
  }
  const partners = codes('freeTrialPartners', 'retiredFreeTrialPartners', '免費合作方')
  if (partners.length) out.freeTrialPartners = partners
  if (form.retiredOn) out.retiredOn = String(form.retiredOn)
  return out
}

const cmpVersion = (a, b) => {
  const x = String(a).split('.').map(Number)
  const y = String(b).split('.').map(Number)
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0)
  return 0
}

let ledger = {}
if (existsSync(join(root, LEDGER))) {
  try {
    ledger = JSON.parse(read(LEDGER))
  } catch (e) {
    failFatal(LEDGER, `不是合法 JSON：${e.message}`)
  }
} else if (!RECORD) {
  fail(LEDGER, '找不到記錄檔（第一次請跑 node scripts/check-form-schemas.mjs --record；這個檔要 commit）')
}

const snapshots = {}
for (const formId of Object.keys(forms)) {
  const cur = (snapshots[formId] = snapshot(forms[formId]))
  const old = ledger.forms?.[formId]
  if (!old) {
    pending.push(`${formId}：整張表單還沒記錄`)
    continue
  }
  const v = cmpVersion(cur.schemaVersion, old.schemaVersion)
  if (v < 0) {
    fail(`${formId}.json`, `schemaVersion ${cur.schemaVersion} 比記錄的 ${old.schemaVersion} 舊`)
    continue
  }
  // 升了 schemaVersion：放行欄位刪除／改名、位置、型別、leadType 的改動（不相容改動，要先通知 Hub）；
  // 但記錄過的值永遠不能消失（題目刪掉的話，記錄檔會留著它當墓碑，之後同一個 key 再出現時照樣要含這些值）
  const bumped = v > 0
  if (bumped) pending.push(`${formId}：schemaVersion ${old.schemaVersion} → ${cur.schemaVersion}（不相容改動，記得先通知 Hub）`)
  const W = `${formId}（跟記錄比）`
  const HOW = '名單裡已經存了這個值，改字或拿掉會讓 Hub 解讀不了舊名單'
  const BUMP = '這是不相容改動，要升 schemaVersion 並先通知 Hub'
  if (old.leadType != null && cur.leadType !== old.leadType) {
    if (!bumped) fail(W, `leadType「${old.leadType}」→「${cur.leadType}」。${BUMP}`)
    else pending.push(`${formId}：leadType 改成「${cur.leadType}」`)
  }
  for (const [key, o] of Object.entries(old.fields)) {
    const c = cur.fields[key]
    if (!c) {
      if (o.removedIn) continue // 之前升版刪掉的題目，墓碑留著
      if (!bumped) fail(W, `「${key}」這題不見了（刪除或改了 key）。${BUMP}`)
      else pending.push(`${formId}：刪除「${key}」（記錄檔會保留它的值${o.values ? ` ${JSON.stringify(o.values)}` : ''}，同一個 key 之後不能拿來存別的）`)
      continue
    }
    for (const val of o.values ?? []) {
      if (!has(c.values, val)) fail(W, `「${key}」的值 ${JSON.stringify(val)} 不見了。${HOW}。停用請把選項移到這題的 retiredOptions；改字＝停用舊的＋新增新的（升 schemaVersion 也不能直接拿掉）`)
    }
    if (o.removedIn) {
      pending.push(`${formId}：「${key}」重新出現（之前在 ${o.removedIn} 刪過）`)
      continue
    }
    const changed = []
    if (o.path !== null && c.path !== o.path) changed.push(`存的位置 ${o.path} → ${c.path}`)
    if (c.valueType !== o.valueType) changed.push(`存的型別 ${o.valueType} → ${c.valueType}`)
    for (const p of o.alsoWrites ?? []) if (!(c.alsoWrites ?? []).includes(p)) changed.push(`不再寫 ${p}`)
    if (changed.length && !bumped) fail(W, `「${key}」${changed.join('、')}。${BUMP}`)
    if (changed.length && bumped) pending.push(`${formId}.${key}：${changed.join('、')}`)
    if (o.path === null && c.path !== null) pending.push(`${formId}.${key}：補上位置 ${c.path}`)
    for (const p of c.alsoWrites ?? []) if (!(o.alsoWrites ?? []).includes(p)) pending.push(`${formId}.${key}：多寫 ${p}`)
    for (const val of c.values ?? []) if (!has(o.values, val)) pending.push(`${formId}.${key}：新值 ${JSON.stringify(val)}`)
  }
  for (const key of Object.keys(cur.fields)) if (!old.fields[key]) pending.push(`${formId}：新的欄位「${key}」`)
  for (const [k, rk, label] of [['variants', 'retiredVariants', '網址變體'], ['freeTrialPartners', 'retiredFreeTrialPartners', '免費合作方']]) {
    for (const code of old[k] ?? []) {
      if (!(cur[k] ?? []).includes(code)) fail(W, `${label}代號「${code}」不見了。舊名單還帶著這個代號；下架請移到 context.${rk}（寫明它當時存了什麼）`)
    }
    for (const code of cur[k] ?? []) if (!(old[k] ?? []).includes(code)) pending.push(`${formId}：新的${label}「${code}」`)
  }
  if ((cur.retiredOn ?? null) !== (old.retiredOn ?? null)) pending.push(`${formId}：${cur.retiredOn ? `標記下架（${cur.retiredOn}）` : '取消下架'}`)
  // 墓碑：記錄檔要保留刪掉的題目（含之前的墓碑）
  for (const [key, o] of Object.entries(old.fields)) {
    if (!cur.fields[key]) cur.fields[key] = o.removedIn ? o : { ...o, removedIn: cur.schemaVersion }
  }
}
for (const formId of Object.keys(ledger.forms ?? {})) {
  if (!(formId in forms)) fail(LEDGER, `記錄裡有「${formId}」，但 docs/form-schema/${formId}.json 不見了。下架表單請保留 JSON、加 retiredOn（Hub 還要靠它解讀舊名單）`)
}

// ---------- 給 Hub 的版本（server/utils/form-schemas.ts 的 toHubView 白名單）不能漏東西 ----------
// 拿同步時真正會寫進 Firestore 的內容，跟正本 JSON 比：每一題的位置、型別、存的值、代號（snapshot 一樣），
// 加上段落、題目文字、選項的畫面文字。白名單改壞了（例如刪掉 options 的 label）就建置失敗。
try {
  const { getPublishedFormSchemas } = await jiti.import(join(root, 'server/utils/form-schemas.ts'))
  const published = getPublishedFormSchemas()
  for (const pub of published) {
    const where = `${pub.formId}（給 Hub 的版本）`
    const src = forms[pub.formId]
    if (!src) continue
    const view = JSON.parse(pub.schemaJson)
    if (pub.leadType !== src.leadType) fail(where, `leadType「${pub.leadType}」≠ 正本「${src.leadType}」`)
    const a = canon(snapshot(view))
    const b = canon(snapshot(src))
    if (a !== b) fail(where, `跟正本的位置、型別、存的值或代號不一樣（toHubView 的白名單漏了東西）\n    給 Hub：${a.slice(0, 300)}\n    正本：${b.slice(0, 300)}`)
    const shown = (f) => ({
      key: f.key,
      label: f.label ?? null,
      labelSuffix: f.labelSuffix ?? null,
      options: (f.options ?? []).map((o) => [o.value, o.label ?? null]),
      retired: (f.retiredOptions ?? []).map((o) => [o.value, o.label ?? null]),
      fallback: (f.optionsSource?.fallback ?? []).map((o) => [o.value, o.label ?? null]),
    })
    const secs = (s) => (s.sections ?? []).map((sec) => ({ id: sec.id ?? null, title: sec.title ?? null, fields: (sec.fields ?? []).map(shown) }))
    if (canon(secs(view)) !== canon(secs(src))) fail(where, '段落、題目文字或選項的畫面文字跟正本不一樣（toHubView 的白名單漏了東西）')
  }
  const ids = published.map((p) => p.formId).sort()
  if (JSON.stringify(ids) !== JSON.stringify([...jsonIds].sort())) fail('server/utils/form-schemas.ts', `同步的表單 ${JSON.stringify(ids)} 跟 JSON ${JSON.stringify(jsonIds)} 不一樣`)
} catch (e) {
  failFatal('server/utils/form-schemas.ts', `載入失敗：${e.message}`)
}

if (RECORD && !errors.length) {
  const out = {
    _說明: '表單 config 上一次記錄時的狀態，給 scripts/check-form-schemas.mjs 比對用：記錄過的選項值、名單位置、布林對照、代號不能消失或改字。由 --record 產生，不要手改；要跟著 commit。',
    forms: snapshots,
  }
  writeFileSync(join(root, LEDGER), JSON.stringify(out, null, 2) + '\n')
  console.log(`[check-form-schemas] ✓ 已記錄到 ${LEDGER}${pending.length ? `（${pending.length} 項新增）` : '（沒有變動）'}`)
  for (const p of pending) console.log(`  + ${p}`)
  process.exit(0)
}
if (!errors.length && pending.length) {
  fail(LEDGER, `有新增還沒記錄（${pending.length} 項）：\n${pending.map((p) => `    + ${p}`).join('\n')}\n    確認都是新增（不是改字；升 schemaVersion 的要先通知 Hub）後，跑 node scripts/check-form-schemas.mjs --record，記錄檔要一起 commit`)
}

if (fatal.length) {
  console.error(`\n[check-form-schemas] ✗ 有檔案讀不到或格式壞了（${fatal.length} 項），先修這些，其他比對的結果先不印：\n`)
  for (const e of fatal) console.error(`  - ${e}`)
  if (RECORD) console.error('\n（記錄檔沒有更新）')
  console.error('')
  process.exit(1)
}
if (errors.length) {
  console.error(`\n[check-form-schemas] ✗ docs/form-schema 跟程式不一致（${errors.length} 項）：\n`)
  for (const e of errors) console.error(`  - ${e}`)
  if (RECORD) console.error('\n（有上面這些問題，記錄檔沒有更新）')
  console.error('\n改程式的選項時要一起改 docs/form-schema/*.json（只新增或停用，不改既有選項的字；停用的移到 retiredOptions），')
  console.error('有不相容的改動（欄位改名、存法改變）就升 schemaVersion 並先通知 CRM。\n')
  process.exit(1)
}
console.log(`[check-form-schemas] ✓ ${Object.keys(FIELDS).length} 張表單的 schema 跟程式一致，也跟上一版記錄相容`)
