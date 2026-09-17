#!/usr/bin/env node
/**
 * 文章渲染的全量驗證。
 *
 * 用法：
 *   node scripts/verify-articles.mjs                     # 驗 dev
 *   node scripts/verify-articles.mjs https://lkkwellness.com
 *
 * 🔴 為什麼一定要全量、而且要「互相比對」：
 *    2026-09-15 的教訓 —— Nitro 會把快取鍵裡的中文清光，導致每一篇中文
 *    網址的文章都回傳同一篇。那個缺陷的特性是「單獨測任何一篇都會通過」，
 *    只有把請求的 slug 和回傳的 slug 拿來比對才看得出來。抽樣驗證對這一類
 *    共用狀態被覆寫的錯誤天生無效。
 *
 * 內容團隊天天發文，新文章可能有沒見過的結構。這支腳本就是那個閘門，
 * 部署後跑一次，目標是全部通過。
 */

const SITE = process.argv[2] || 'https://lkk-website-dev--lkkdev.asia-east1.hosted.app'
const WP = 'https://l-kk.tw/wp-json'
const CONCURRENCY = 5

async function getJson(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) return { __status: res.status }
      return await res.json()
    } catch (e) {
      if (i === tries - 1) return { __error: String(e).slice(0, 80) }
    }
  }
}

async function allSlugs() {
  const out = []
  for (let page = 1; page <= 10; page++) {
    const d = await getJson(`${WP}/wp/v2/posts?per_page=100&page=${page}&_fields=slug,title`)
    if (!Array.isArray(d) || d.length === 0) break
    out.push(...d.map((p) => ({ slug: p.slug, title: p.title?.rendered ?? '' })))
  }
  return out
}

/** 新站第一層路由。與這些同名的文章代稱永遠拿不到（靜態路由優先）。 */
const RESERVED = new Set([
  'about', 'booking', 'cases-center', 'co-lecturer', 'cooperation', 'franchise',
  'group-booking', 'knowledge-center', 'lkk-academy', 'lkk-lecturer', 'lkk4',
  'news', 'oversea-lecturer', 'personal-record', 'privacy', 'services', 'shop',
  'admin', 'locations', 'team-intro', 'api', '_nuxt', 'sitemap.xml', 'robots.txt',
])

async function check({ slug, title }) {
  const problems = []
  const decoded = decodeURIComponent(slug)
  if (RESERVED.has(decoded)) return { slug, decoded, problems: ['與新站路由同名，永遠取不到'], reserved: true }

  const d = await getJson(`${SITE}/api/public/article/${slug}`)
  if (d.__error) return { slug, decoded, problems: [`連線失敗 ${d.__error}`] }
  if (d.__status) return { slug, decoded, problems: [`HTTP ${d.__status}`] }
  if (!d.success) return { slug, decoded, problems: ['API 回傳失敗'] }

  const a = d.data
  // ① 最關鍵：回傳的是不是請求的那一篇
  if (a.slug !== slug) problems.push(`拿到別篇：${String(a.title).slice(0, 18)}`)
  // ② 內容
  const html = a.html || ''
  if (html.length < 200) problems.push(`內容過短 ${html.length}`)
  // ③ 殘留舊站連結（wp-content 圖片除外）
  const left = [...html.matchAll(/https:\/\/l-kk\.tw\/([^"'\s<>)]*)/g)]
    .map((m) => m[1])
    .filter((p) => !p.startsWith('wp-content'))
  if (left.length) problems.push(`殘留舊站連結 ${left.length}：${left[0].slice(0, 30)}`)
  // ④ 表格都有捲動容器
  const tables = (html.match(/<table/g) || []).length
  const wraps = (html.match(/table-scroll/g) || []).length
  if (tables && tables !== wraps) problems.push(`表格 ${tables} 個只包了 ${wraps}`)
  // ⑤ SEO 欄位
  if (!a.title) problems.push('標題是空的')
  if (!a.description) problems.push('description 是空的')
  return { slug, decoded, problems }
}

const posts = await allSlugs()
console.log(`站台 ${SITE}`)
console.log(`全站文章 ${posts.length} 篇，逐篇檢查中…\n`)

const results = []
for (let i = 0; i < posts.length; i += CONCURRENCY) {
  const batch = posts.slice(i, i + CONCURRENCY)
  results.push(...(await Promise.all(batch.map(check))))
  if ((i + CONCURRENCY) % 100 < CONCURRENCY) process.stdout.write(`  …${Math.min(i + CONCURRENCY, posts.length)}/${posts.length}\n`)
}

const reserved = results.filter((r) => r.reserved)
const bad = results.filter((r) => r.problems.length && !r.reserved)
const pass = results.length - bad.length - reserved.length

console.log(`\n═══ ${pass}/${results.length} 通過 ═══`)
if (reserved.length) {
  console.log(`\n▸ 與新站路由同名，永遠取不到（需在 WordPress 改代稱）：${reserved.length} 篇`)
  reserved.forEach((r) => console.log(`    ${r.decoded}`))
}
if (bad.length) {
  const agg = new Map()
  for (const r of bad) for (const p of r.problems) {
    const k = p.split('：')[0].replace(/\d+/g, 'N')
    if (!agg.has(k)) agg.set(k, [])
    agg.get(k).push(`${r.decoded.slice(0, 26)}  ${p.slice(0, 50)}`)
  }
  for (const [k, items] of [...agg].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n▸ ${k}  共 ${items.length} 篇`)
    items.slice(0, 6).forEach((s) => console.log(`    ${s}`))
    if (items.length > 6) console.log(`    …另外 ${items.length - 6} 篇`)
  }
}
process.exit(bad.length ? 1 : 0)
