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
// 併發刻意壓低：這支會對舊站的正式主機發 666 個請求，
// 密集執行會造成實際負載（實測到上游開始用 200 回錯誤頁）。
// 這是驗證工具，不是壓力測試，不需要跑快。
const CONCURRENCY = 3

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      // 503 的語意就是「暫時性、稍後再試」，所以要真的再試一次；
      // 不重試的話量到的是併發壓力，不是正確性。Google 的爬蟲也是這樣處理。
      if (res.status === 503 && i < tries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      if (!res.ok) return { __status: res.status }
      return await res.json()
    } catch (e) {
      if (i === tries - 1) return { __error: String(e).slice(0, 80) }
      await new Promise((r) => setTimeout(r, 1000))
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
  'about', 'booking', 'cases-center', 'activity-center', 'co-lecturer', 'cooperation', 'franchise',
  'group-booking', 'knowledge-center', 'lkk-academy', 'lkk-lecturer', 'lkk4',
  'news', 'oversea-lecturer', 'personal-record', 'privacy', 'services', 'shop',
  'admin', 'locations', 'team-intro', 'api', '_nuxt', 'sitemap.xml', 'robots.txt',
])

async function check({ slug, title }) {
  const problems = []
  const decoded = decodeURIComponent(slug)
  if (RESERVED.has(decoded)) return { slug, decoded, problems: ['與新站路由同名，永遠取不到'], reserved: true }

  // 頁面本身也要測，而且要測「帶結尾斜線」的形式 ——
  // 舊站文章網址全部帶斜線，卡片連結也是，只測 API 會漏掉路由層的問題
  // （2026-09-17 實測踩過：API 回 200 但 /spine/ 頁面回 404）。
  const pageStatus = await fetch(`${SITE}/${slug}/`, {
    method: 'HEAD',
    signal: AbortSignal.timeout(30000),
  })
    .then((r) => r.status)
    .catch(() => 0)
  if (pageStatus !== 200) problems.push(`頁面 /${decoded}/ 回 ${pageStatus}`)

  const d = await getJson(`${SITE}/api/public/article/${slug}`)
  if (d.__error) return { slug, decoded, problems: [`連線失敗 ${d.__error}`] }
  if (d.__status) return { slug, decoded, problems: [`HTTP ${d.__status}`] }
  if (!d.success) return { slug, decoded, problems: ['API 回傳失敗'] }

  const a = d.data
  // ⓪ 「宣稱成功但內容是空的」—— 比錯誤更危險，因為監控不會報，
  //    而且會被快取。2026-09-17 實測踩過：上游用 200 回非 JSON 時發生。
  if (!a || !a.slug) {
    problems.push('回傳成功但沒有資料')
    return { slug, decoded, problems }
  }
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
  // ④-2 嵌入的 iframe 不可以比內容欄寬
  //     🔴 2026-09-19 補上。WordPress 把原始尺寸寫死在屬性上（實測 159 個是
  //        width="1290"），會把整頁撐寬。這一層原本沒查——表格查了、iframe 漏了，
  //        結果是業主問「媒體報導點進去原本是 youtube 嗎」才翻出來。
  //     內容欄實測約 720px，這裡抓 800 當門檻。
  const wide = [...html.matchAll(/<iframe[^>]*\swidth="(\d+)"/g)]
    .map((m) => Number(m[1]))
    .filter((w) => w > 800)
  if (wide.length) problems.push(`iframe 寬度寫死 ${wide.join('/')}，會撐寬頁面`)

  // ④-3 整篇只有一支影片的文章，影片一定要在
  //     媒體報導那一類的內文去掉標籤後是空的，嵌入被拿掉就等於整頁空白。
  const plain = html.replace(/<[^>]+>/g, '').trim()
  if (!plain && !/<iframe/.test(html)) problems.push('整篇沒有文字也沒有嵌入影片')

  // ⑤ SEO 欄位
  if (!a.title) problems.push('標題是空的')
  // 有文字內容卻沒有 description 才是缺陷。純影片嵌入的媒體報導沒有可用
  // 文字，此時 Google 會自行產生摘要，硬塞一個與標題重複的字串反而更差。
  if (!a.description && plain.length > 0) problems.push('description 是空的')
  return { slug, decoded, problems }
}

/**
 * 彙整頁的卡片必須是真的 <a href>。
 *
 * 2026-09-17 踩過：卡片用 <component :is> 動態解析元件，解析失敗後
 * Vue 原樣輸出成 <NUXTLINK> 這個不存在的標籤 —— 沒有 href、點不動，
 * 但畫面看起來完全正常，API 與直接打網址也全部 200。
 * 只驗資料層與網址層都驗不出來，一定要驗渲染出來的連結。
 */
async function checkListingPages() {
  const out = []
  for (const [path, label] of [['/knowledge-center', '知識科普'], ['/cases-center', '學員故事']]) {
    const html = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(30000) })
      .then((r) => r.text())
      .catch(() => '')
    if (!html) { out.push(`${label}：頁面取不到`); continue }
    if (/<nuxtlink/i.test(html)) out.push(`${label}：渲染出 <NuxtLink> 字面標籤（元件沒解析）`)
    const links = [...html.matchAll(/<a\s[^>]*href="(\/[^"#][^"]*)"/g)].map((m) => m[1])
    const articleLinks = links.filter((h) => !h.startsWith('/booking') && h.endsWith('/'))
    if (articleLinks.length < 5) {
      out.push(`${label}：卡片連結只有 ${articleLinks.length} 條，預期 12 條`)
    }
  }
  return out
}

const listingProblems = await checkListingPages()
if (listingProblems.length) {
  console.log('▸ 彙整頁的卡片連結有問題：')
  listingProblems.forEach((p) => console.log(`    ${p}`))
  console.log('')
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
