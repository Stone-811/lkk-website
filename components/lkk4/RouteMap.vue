<script setup lang="ts">
/**
 * LKK4 場地動線圖（2026-11-03 業主提供「LKK4 場地動線圖 原版.html」）。
 *
 * 🔴 動畫引擎（mountRouteMap 裡的賽道幾何、Actor 步驟、時間軸、render、播放控制）
 *    是從原版逐行搬過來的，業主要求「不要更動到既有的動態流程顯示」。
 *    這次只改外觀：配色換成站上的 navy／cream／orange、按鈕與說明卡改成頁面的卡片樣式、
 *    播放鍵的 ▶／❚❚ 字元換成 SVG（iPhone 會把 ▶ 畫成 Emoji）。
 *    要改路線或時間，先對照原版，不要順手「整理」。
 *
 * ⚠️ 重量（G）、20 分鐘、14 分鐘、12.5 m 折返、每 5 分鐘 5 位，在 pages/lkk4.vue 的
 *    weightTable／raceRules／stations／teamSteps 也各寫了一次。改數字時兩邊一起改
 *    （見 skill lkk-lkk4-page 的「同一個事實散落在哪裡」）。
 *
 * ⚠️ SVG 內容是 onMounted 用 createElementNS 產生的，Vue 的 scoped 樣式掛不上去，
 *    所以樣式寫成非 scoped、全部以 .lkk4-route 開頭限定範圍。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const root = ref<HTMLElement | null>(null)
let teardown: (() => void) | null = null

onMounted(() => {
  if (root.value) teardown = mountRouteMap(root.value)
})
onBeforeUnmount(() => teardown?.())

function mountRouteMap(rootEl: HTMLElement): () => void {
  const NS = 'http://www.w3.org/2000/svg'
  const $ = (id: string): any => rootEl.querySelector(`[data-id="${id}"]`)
  function el(tag: string, a: Record<string, any>, p?: any, txt?: any): any {
    const e = document.createElementNS(NS, tag)
    for (const k in a) e.setAttribute(k, a[k])
    if (txt != null) e.textContent = txt
    p && p.appendChild(e)
    return e
  }
  const C = ['var(--s0)', 'var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s2b)'] // 4 = 農夫走路

  /* ---------- 組別重量（官網） ---------- */
  const G: Record<string, any> = {
    m69: { dl: [80, 100, 120], sled: 100, farm: 28 }, f69: { dl: [50, 60, 80], sled: 75, farm: 20 },
    m70: { dl: [40, 50, 60], sled: 60, farm: 20 }, f70: { dl: [30, 40, 50], sled: 40, farm: 12 },
    team: { dl: [30, 40, 50], sled: 40, farm: 12 },
  }
  let g = G.f70

  /* ---------- 賽道 ---------- */
  const LANE_Y = [60, 330, 600, 870, 1140], LH = 200
  // x, w, kind
  const SEG: [number, number, string][] = [[100, 200, 'bike'], [300, 50, 'sep'], [350, 200, 'bike'], [550, 50, 'sep'], [600, 200, 'bike'],
    [800, 150, 'gear'], [950, 1800, 'track'], [2750, 200, 'sled'], [2950, 150, 'gear'],
    [3100, 150, 'hex'], [3250, 150, 'hex'], [3400, 150, 'hex'], [3550, 200, 'gear']]
  const L = $('lanes')
  LANE_Y.forEach((y, i) => {
    el('text', { class: 'lane-no', x: 45, y: y + LH / 2 + 22, 'text-anchor': 'middle' }, L, i + 1)
    SEG.forEach(([x, w, k]) => {
      el('rect', { class: ({ bike: 'station', sled: 'station', hex: 'station', sep: 'sep', gear: 'gear', track: 'track' } as any)[k], x, y, width: w, height: LH, rx: k === 'track' ? 6 : 0 }, L)
      const cx = x + w / 2, cy = y + LH / 2
      if (k === 'bike') { el('circle', { class: 'icon', cx: cx - 25, cy: cy + 15, r: 42 }, L); el('path', { class: 'icon', d: `M${cx - 25} ${cy + 15}L${cx + 40} ${cy - 45}M${cx + 20} ${cy - 45}h40M${cx + 5} ${cy + 50}h50` }, L) }
      if (k === 'hex') { el('path', { class: 'icon', d: `M${cx - 30} ${cy}l15-26h30l15 26-15 26h-30z M${cx} ${cy - 75}V${cy - 26}M${cx} ${cy + 26}V${cy + 75}` }, L) }
      if (k === 'sled') { el('path', { class: 'icon', d: `M${cx - 70} ${cy - 10}h90l20-50M${cx - 70} ${cy - 10}v-30h60v30` }, L); el('path', { class: 'icon', d: `M${cx + 20} ${cy + 35}h40M${cx + 30} ${cy + 35}v40h20v-40` }, L) }
    })
  });
  [[20, 30, 4140, 30], [20, 1370, 3880, 1370], [20, 30, 20, 1370]].forEach(([a, b, c, d]) => el('line', { class: 'truss', x1: a, y1: b, x2: c, y2: d }, L))

  /* ---------- 下方區域（淡化） ---------- */
  const Z = $('zones');
  [[1050, 1400], [2850, 1400]].forEach(([x, y]) => { el('rect', { class: 'block', x, y, width: 300, height: 280, rx: 10 }, Z); el('text', { class: 'lbl-s', x: x + 150, y: y + 330, 'text-anchor': 'middle' }, Z, '大螢幕') })
  el('rect', { class: 'stagez', x: 240, y: 1800, width: 340, height: 620, rx: 10 }, Z)
  el('text', { class: 'lbl-s', x: 410, y: 2125, 'text-anchor': 'middle' }, Z, '舞台')
  for (let c = 0; c < 15; c++) for (let b = 0; b < 2; b++) el('rect', { class: 'seat', x: 760 + c * 98, y: 1770 + b * 400, width: 46, height: 300, rx: 12 }, Z)
  el('text', { class: 'lbl-s', x: 1450, y: 2560, 'text-anchor': 'middle' }, Z, '觀眾席')
  el('rect', { class: 'booth', x: 2390, y: 1830, width: 580, height: 600, rx: 14 }, Z)
  el('text', { class: 'lbl-s', x: 2680, y: 2150, 'text-anchor': 'middle' }, Z, '工作區')
  for (let i = 0; i < 11; i++) el('rect', { class: 'booth', x: 20 + i * 268, y: 2690, width: 256, height: 290, rx: 8 }, Z)
  el('text', { class: 'lbl-s', x: 1500, y: 2860, 'text-anchor': 'middle' }, Z, '攤位區')

  /* ---------- 標記：關卡徽章、重量、折返線、預備區 ---------- */
  const M = $('marks')
  function badge(x: number, y: number, n: string, t: string, ph: number) { const b = el('g', { class: 'stg-badge' }, M); el('circle', { cx: x, cy: y, r: 62, fill: C[ph] }, b); el('text', { class: 'n', x, y: y + 26 }, b, n); el('text', { class: 't', x: x + 84, y: y + 22, fill: C[ph] }, b, t) }
  badge(3160, -140, '1', '六角槓硬舉 1 分鐘', 1)
  badge(1500, -140, '2', '推雪橇＋農夫走路 3 分鐘', 2)
  badge(100, -140, '3', '風扇車 10 分鐘', 3)
  el('text', { class: 'wt', x: 184, y: -20, fill: C[3], 'text-anchor': 'start' }, M, '3 km')
  const wtT = [3475, 3325, 3175].map(x => el('text', { class: 'wt', x, y: -20, fill: C[1] }, M, ''))
  el('text', { class: 'wt', x: 2850, y: -20, fill: C[2] }, M, '雪橇／握把')
  el('line', { class: 'turn', x1: 960, y1: 40, x2: 960, y2: 1360 }, M);
  [[960, -30, 960, -10], [2780, -30, 2780, -10]].forEach(([a, b, c, d]) => el('line', { class: 'turnd', x1: a, y1: b, x2: c, y2: d }, M))
  el('line', { class: 'turnd', x1: 960, y1: -20, x2: 2780, y2: -20 }, M)
  el('text', { class: 'turn-l', x: 1870, y: -40, 'text-anchor': 'middle' }, M, '單趟 12.5 m・到底折返')
  el('rect', { x: 3600, y: 2480, width: 580, height: 220, rx: 14, fill: 'var(--s0t)', stroke: 'var(--s0)', 'stroke-width': 8 }, M)
  el('text', { x: 3890, y: 2610, 'text-anchor': 'middle', class: 'prep' }, M, '預備區')
  el('text', { x: 3890, y: 2775, 'text-anchor': 'middle', class: 'lbl-s' }, M, '每 5 分鐘響鈴入場')

  /* halos */
  const H = $('halos');
  [[0, 3580, 2450, 620, 280], [1, 3080, 40, 490, 1320], [2, 870, 40, 2100, 1320], [3, 80, 40, 740, 1320]].forEach(([p, x, y, w, h]) =>
    el('rect', { class: 'halo', 'data-ph': p, x, y, width: w, height: h, rx: 24, fill: ['var(--s0t)', 'var(--s1t)', 'var(--s2t)', 'var(--s3t)'][p], stroke: C[p] }, H))

  /* arrow markers */
  const D = $('defs')
  C.forEach((c, i) => { const m = el('marker', { id: 'lkk4ar' + i, viewBox: '0 0 10 10', refX: '5', refY: '5', markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse' }, D); el('path', { d: 'M0 0L10 5L0 10z', fill: c }, m) })

  /* ---------- 路線 ---------- */
  const FOCUS = 2
  const GH = $('ghosts'), PR = $('progs'), DT = $('dots')
  const gI = el('g', { class: 'ind' }, GH), pI = el('g', { class: 'ind' }, PR), dI = el('g', { class: 'ind' }, DT)
  const gT = el('g', { class: 'team' }, GH), pT = el('g', { class: 'team' }, PR), dT = el('g', { class: 'team' }, DT)
  const others = el('g', { class: 'others', 'data-on': 'off' }, pI), othersD = el('g', { class: 'others', 'data-on': 'off' }, dI)

  /* 一個「人」= 一串步驟。act:true 代表正在做關卡（上色、顯示字），false 代表在旁邊等 */
  function Actor(start?: number): any {
    const A: any = { steps: [], t: start || 0 }
    A.mv = (ph: number, d: string, dur: number, lab: any, o: any = {}) => { A.steps.push({ mv: 1, ph, d, dur, lab, act: o.act !== false, col: o.col, noArrow: o.noArrow, t0: A.t, t1: A.t + dur }); A.t += dur; return A }
    A.st = (ph: number, dur: number, lab: any, o: any = {}) => { A.steps.push({ mv: 0, ph, dur, lab, act: o.act !== false, col: o.col, ring: o.ring, km: o.km, who: o.who, t0: A.t, t1: A.t + dur }); A.t += dur; return A }
    A.waitUntil = (T: number, ph = 0) => { if (T > A.t) A.st(ph, T - A.t, null, { act: false }); return A }
    return A
  }
  function finalize(A: any, { ghostG, progG, dotG, ghost, progOp = 1, text, small, trailAll }: any) {
    let last: any = null
    A.steps.forEach((s: any) => {
      if (s.mv) {
        s.path = el('path', { d: s.d, fill: 'none', stroke: 'none' }, GH); s.len = s.path.getTotalLength()
        const ci = s.col ?? s.ph
        if (ghost && s.act) { const gp = el('path', { class: 'ghost', 'data-ph': s.ph, d: s.d, stroke: C[ci] }, ghostG); if (!s.noArrow) gp.setAttribute('marker-end', `url(#lkk4ar${ci})`) }
        if (s.act || trailAll) s.prog = el('path', { class: 'prog', d: s.d, stroke: C[ci], 'stroke-dasharray': s.len, 'stroke-dashoffset': s.len, opacity: progOp }, progG)
        last = s
      } else s.prev = last
    })
    A.end = A.steps[A.steps.length - 1].t1
    A.ring = el('circle', { class: 'ring', r: 110, stroke: C[3], opacity: 0 }, dotG)
    A.dot = el('circle', { class: 'dot' + (small ? ' other' : ''), r: small ? 42 : (A.r || 54), fill: C[0] }, dotG)
    A.num = el('text', { class: 'dnum' + (small ? ' sm' : ''), 'text-anchor': 'middle' }, dotG, text)
    A.lab = ghost ? el('text', { class: 'dlabel', 'text-anchor': 'middle' }, dotG, '') : null
    A.small = small; return A
  }

  /* 個人賽 */
  function buildInd(i: number, delay: number) {
    const cy = LANE_Y[i] + LH / 2, sx = 3660 + i * 105, A = Actor(delay)
    A.mv(0, `M${sx} 2590V2420H3810V${cy}H3660`, 5, () => '走到賽道入口')
    A.mv(1, `M3660 ${cy}H3475`, 0.8, () => '硬舉・輕')
    A.st(1, 1.6, () => `硬舉・輕 ${g.dl[0]} kg`)
    A.mv(1, `M3475 ${cy}H3325`, 0.6, () => '換到中')
    A.st(1, 1.6, () => `硬舉・中 ${g.dl[1]} kg`)
    A.mv(1, `M3325 ${cy}H3175`, 0.6, () => '換到重')
    A.st(1, 1.6, () => `硬舉・重 ${g.dl[2]} kg`)
    A.mv(2, `M3175 ${cy}H2800V${cy - 35}`, 1.2, () => '走到雪橇')
    A.mv(2, `M2800 ${cy - 35}H995A35 35 0 0 0 995 ${cy + 35}H2800`, 7, () => `推雪橇 ${g.sled} kg`)
    A.st(2, 1, () => '換農夫走路', { col: 4 })
    A.mv(2, `M2800 ${cy + 35}V${cy - 75}H1035A75 75 0 0 0 960 ${cy}`, 3.6, () => `農夫走路 ${g.farm} kg`, { col: 4, noArrow: 1 })
    A.st(2, 1, () => '換另一手', { col: 4 })
    A.mv(2, `M960 ${cy}A75 75 0 0 0 1035 ${cy + 75}H2800`, 3.6, () => `農夫走路・另一手 ${g.farm} kg`, { col: 4 })
    A.mv(3, `M2800 ${cy + 75}V${cy}H700`, 3.5, () => '走到風扇車')
    A.st(3, 6, () => '風扇車', { ring: 1 })
    A.st(3, 1.2, () => '完賽！')
    return A
  }
  const IND = LANE_Y.map((_, i) => {
    const focus = i === FOCUS, delay = focus ? 0 : Math.abs(i - FOCUS) * 0.5 * (i < FOCUS ? 1 : 1.1)
    return finalize(buildInd(i, delay), { ghostG: gI, progG: focus ? pI : others, dotG: focus ? dI : othersD, ghost: focus, progOp: focus ? 1 : 0.55, text: i + 1, small: !focus })
  })

  /* 團體接力賽：A 輕 → B 中、重 → C 推雪橇＋農夫走路 → D 風扇車 */
  const ROLE: Record<string, string> = { A: '硬舉・輕、中', B: '硬舉・重＋推雪橇＋風扇車後半', C: '農夫走路＋風扇車前半' }
  function buildTeam() {
    const cy = LANE_Y[FOCUS] + LH / 2
    const ent = (i: number, x: number, y: number) => `M${3660 + i * 105} 2590V2420H3810V${y}H${x}`
    const A = Actor(0), B = Actor(0.45), C2 = Actor(0.9)
    A.mv(0, ent(0, 3600, cy - 50), 5, () => '全隊入場')
    B.mv(0, ent(1, 3720, cy - 50), 5, null, { act: false })
    C2.mv(0, ent(2, 3600, cy + 50), 5, null, { act: false })
    const go = Math.max(A.t, B.t, C2.t) + 0.3
    A.waitUntil(go)
    // A：輕、中
    A.mv(1, `M3600 ${cy - 50}L3475 ${cy}`, 0.6, () => 'A：硬舉・輕')
    A.st(1, 1.6, () => `A：硬舉・輕 ${g.dl[0]} kg`)
    A.mv(1, `M3475 ${cy}H3325`, 0.6, () => 'A：換到中')
    A.st(1, 1.6, () => `A：硬舉・中 ${g.dl[1]} kg`)
    const h1 = A.t
    A.st(1, 1, () => 'A → B 交棒')
    A.mv(0, `M3325 ${cy}V${cy + 85}H3600`, 0.9, null, { act: false })
    // B：重＋推雪橇
    B.waitUntil(h1)
    B.mv(1, `M3720 ${cy - 50}V${cy - 85}H3175V${cy}`, 1.3, () => 'B 接棒')
    B.st(1, 1.6, () => `B：硬舉・重 ${g.dl[2]} kg`)
    B.mv(2, `M3175 ${cy}H2800V${cy - 35}`, 1.2, () => 'B：走到雪橇')
    B.mv(2, `M2800 ${cy - 35}H995A35 35 0 0 0 995 ${cy + 35}H2800`, 7, () => `B：推雪橇 ${g.sled} kg`)
    const h2 = B.t
    B.st(2, 1, () => 'B → C 交棒')
    B.mv(0, `M2800 ${cy + 35}V${cy - 85}H3025`, 0.8, null, { act: false })
    // C：農夫走路來回
    C2.waitUntil(h2)
    C2.mv(2, `M3600 ${cy + 50}V${cy + 85}H2800V${cy - 75}`, 2, () => 'C 接棒，換農夫走路', { col: 4 })
    C2.mv(2, `M2800 ${cy - 75}H1035A75 75 0 0 0 960 ${cy}`, 3.6, () => `C：農夫走路 ${g.farm} kg`, { col: 4, noArrow: 1 })
    C2.st(2, 1, () => 'C：換另一手', { col: 4 })
    C2.mv(2, `M960 ${cy}A75 75 0 0 0 1035 ${cy + 75}H2800`, 3.6, () => 'C：農夫走路・另一手', { col: 4 })
    // C：風扇車前半
    C2.mv(3, `M2800 ${cy + 75}V${cy}H700`, 3.5, () => 'C：走到風扇車')
    const tf = C2.t
    C2.st(3, 3.5, null, { ring: 1, km: [0, 1.5], who: 'C' })
    const h3 = C2.t
    C2.st(3, 1, () => 'C → B 交棒')
    C2.mv(0, `M700 ${cy}V${cy + 85}H520`, 0.7, null, { act: false })
    // B：先走到風扇車旁準備，再接手後半
    B.waitUntil(tf)
    B.mv(0, `M3025 ${cy - 85}H880`, 3, null, { act: false })
    B.waitUntil(h3 + 1)
    B.mv(3, `M880 ${cy - 85}H700V${cy}`, 0.8, () => 'B 接手')
    B.st(3, 3.5, null, { ring: 1, km: [1.5, 3], who: 'B' })
    B.st(3, 1.4, () => '全隊完賽！')
    const end = B.t;
    [A, C2].forEach(x => x.waitUntil(end))
    return ([['A', A], ['B', B], ['C', C2]] as [string, any][]).map(([k, x]) => { x.r = 48; x.key = k; finalize(x, { ghostG: gT, progG: pT, dotG: dT, ghost: true, text: k }); x.lastAct = Math.max(...x.steps.filter((s: any) => s.act && s.ph > 0).map((s: any) => s.t1)); return x })
  }
  const TEAM = buildTeam()
  /* 團體模式：隊伍賽道外框 */
  el('rect', { class: 'team teamlane', x: 85, y: LANE_Y[FOCUS] - 22, width: 3690, height: LH + 44, rx: 18 }, $('halos'))

  function phases(actors: any[]) {
    const acts = actors.flatMap(a => a.steps.filter((s: any) => s.act))
    const st = [0, 1, 2, 3].map(p => p === 0 ? 0 : Math.min(...acts.filter((s: any) => s.ph === p).map((s: any) => s.t0)))
    const en = [0, 1, 2, 3].map(p => Math.max(...acts.filter((s: any) => s.ph === p).map((s: any) => s.t1)))
    en[0] = st[1]; en[3] = Math.max(...actors.map(a => a.end))
    return { st, en, total: Math.max(...actors.map(a => a.end)) }
  }
  const MODES: Record<string, any> = { ind: { actors: IND, ...phases([IND[FOCUS]]) }, team: { actors: TEAM, ...phases(TEAM) } }
  MODES.ind.total = Math.max(...IND.map(a => a.end))
  let mode = 'ind', M2 = MODES.ind

  function stepAt(a: any, t: number) { for (const s of a.steps) if (t < s.t1) return s; return a.steps[a.steps.length - 1] }
  function render(t: number) {
    M2.actors.forEach((a: any) => {
      a.steps.forEach((s: any) => { if (s.prog) { const u = Math.max(0, Math.min(1, (t - s.t0) / s.dur)); s.prog.setAttribute('stroke-dashoffset', s.len * (1 - u)) } })
      let cur: any, pos: any
      if (t < a.steps[0].t0) { cur = a.steps[0]; pos = cur.path.getPointAtLength(0) }
      else {
        cur = stepAt(a, t)
        if (cur.mv) { const u = Math.max(0, Math.min(1, (t - cur.t0) / cur.dur)); pos = cur.path.getPointAtLength(cur.len * u) }
        else pos = cur.prev.path.getPointAtLength(cur.prev.len)
      }
      const active = cur.act && t >= a.steps[0].t0
      const ci = cur.col ?? (cur.mv ? cur.ph : (cur.prev && cur.prev.col) ?? cur.ph)
      a.dot.setAttribute('cx', pos.x); a.dot.setAttribute('cy', pos.y)
      a.dot.setAttribute('fill', active || mode === 'ind' ? C[ci] : 'var(--idle)')
      a.dot.classList.toggle('idle', mode === 'team' && !active)
      a.num.setAttribute('x', pos.x); a.num.setAttribute('y', pos.y + (a.small ? 17 : 20))
      const ringOn = !cur.mv && cur.ring && t >= cur.t0 && cur.act
      a.ring.setAttribute('cx', pos.x); a.ring.setAttribute('cy', pos.y); a.ring.setAttribute('opacity', ringOn ? 1 : 0)
      const k = cur.km || [0, 3], km = k[0] + (k[1] - k[0]) * Math.min(1, Math.max(0, (t - cur.t0) / cur.dur))
      if (ringOn) { const c = 2 * Math.PI * 110; a.ring.setAttribute('stroke-dasharray', `${c * km / 3} ${c}`) }
      if (a.lab) {
        let txt = active && cur.lab ? cur.lab() : ''
        if (ringOn) txt = `${cur.who ? cur.who + '：' : ''}風扇車 ${km.toFixed(1)} / 3 km`
        a.lab.textContent = txt
        a.lab.setAttribute('x', Math.min(Math.max(pos.x, 420), 3700)); a.lab.setAttribute('y', pos.y > 1400 ? pos.y - 90 : pos.y - 130)
      }
      if (a.chip) { a.chip.dataset.s = active && cur.ph > 0 ? 'on' : (t >= a.lastAct ? 'done' : 'wait'); a.chip.style.setProperty('--c', active ? C[ci] : 'var(--line)') }
    })
  }

  /* ---------- 隊員名單 ---------- */
  const rosterEl = $('roster')
  TEAM.forEach((a: any) => {
    const c = document.createElement('div'); c.className = 'mem'
    c.innerHTML = `<i>${a.key}</i><span><b>${ROLE[a.key]}</b><small></small></span>`
    rosterEl.appendChild(c); a.chip = c
  })

  /* ---------- 說明卡 ---------- */
  const capEl = $('cap')
  function caption(p: any) {
    const IND_T: Record<string, any> = {
      all: { c: 'var(--line)', h: '比賽怎麼走', em: '每位選手總時間 20 分鐘', html: '<ol><li>在<b>預備區</b>等候，聽到鈴聲後由工作人員帶到自己的賽道。</li><li><b>第一關 拿得動</b>：在最右側六角槓區，輕、中、重依序硬舉。</li><li><b>第二關 推得實、走得穩</b>：往左進跑道，先推雪橇、再換農夫走路，都是推／走到跑道另一端（12.5 公尺）再折返回來。</li><li><b>第三關 走得久</b>：走到最左側風扇車，完成 3 公里就完賽。</li></ol>' },
      0: { c: 'var(--s0)', h: '入場', em: '每 5 分鐘響鈴・每次 5 位', html: '<p>依出場順序在右下角預備區等候。聽到鈴聲後，工作人員會帶你沿右側通道走到自己的賽道入口。</p>' },
      1: { c: 'var(--s1)', h: '第一關 拿得動・六角槓硬舉', em: '限時 1:00', html: `<p>從入口往左，三支六角槓依序是 <b>輕 ${g.dl[0]} kg → 中 ${g.dl[1]} kg → 重 ${g.dl[2]} kg</b>。就像從地上提起一袋菜籃，一支完成再換下一支。</p>` },
      2: { c: 'var(--s2)', h: '第二關 推得實、走得穩', em: '限時 3:00', html: `<p>先推 <b style="color:var(--s2)">雪橇 ${g.sled} kg</b>，推到跑道另一端（12.5 公尺）再推回來。接著換 <b style="color:var(--s2b)">農夫走路</b>，單手提 ${g.farm} kg 走到對面，換另一手再走回來。兩項都是來回 25 公尺。</p>` },
      3: { c: 'var(--s3)', h: '第三關 走得久・風扇車', em: '限時 10:00', html: '<p>沿跑道走到最左邊的風扇車，用自己的節奏騎完 <b>3 公里</b>，就完成比賽了。</p>' },
    }
    const TEAM_T: Record<string, any> = {
      all: { c: 'var(--line)', h: '團體接力賽怎麼走', em: '2–4 人・全隊 14 分鐘內完成', html: '<ol><li>全隊一起入場，站在<b>同一條賽道</b>上。</li><li>三個關卡可以<b>隨時換手</b>，從當下的進度接著做，不停錶、不限次數。</li><li>沒輪到的隊友在自己的賽道裡等候、陪同，不要走出賽道。</li><li>下面是 3 人隊伍的範例：A 做輕、中 → B 接重、推雪橇 → C 農夫走路、騎風扇車 → 騎到一半換 B 騎完。誰做哪一段，隊伍可以自己決定。</li></ol>' },
      0: { c: 'var(--s0)', h: '全隊一起入場', em: '2–4 位隊友', html: '<p>聽到鈴聲後，隊友們一起由工作人員帶到同一條賽道。還沒輪到的人，先在賽道入口旁等候。</p>' },
      1: { c: 'var(--s1)', h: '第一關 拿得動・六角槓硬舉', em: '限時 1:00', html: `<p><b>A</b> 先做輕 ${g.dl[0]} kg、中 ${g.dl[1]} kg，做完交棒給 <b>B</b>；B 接著做重 ${g.dl[2]} kg。</p>` },
      2: { c: 'var(--s2)', h: '第二關 推得實、走得穩', em: '限時 3:00', html: `<p><b>B</b> 做完硬舉，直接去推 <b style="color:var(--s2)">雪橇 ${g.sled} kg</b> 來回，再交棒給 <b>C</b>；C 做 <b style="color:var(--s2b)">農夫走路</b> ${g.farm} kg，走到對面換另一手再走回來。</p>` },
      3: { c: 'var(--s3)', h: '第三關 走得久・風扇車', em: '限時 10:00', html: '<p><b>C</b> 走到風扇車開始騎，騎到一半換 <b>B</b> 接手，公里數接著算，騎滿 3 公里就全隊完賽。B 可以先走到風扇車旁邊準備。</p>' },
    }
    const T = (mode === 'team' ? TEAM_T : IND_T)[p]
    capEl.style.setProperty('--c', T.c)
    capEl.innerHTML = `<h4>${T.h}<em>${T.em}</em></h4>${T.html}`
  }
  function setWeights() { wtT.forEach((e: any, i: number) => e.textContent = ['輕', '中', '重'][i] + ' ' + g.dl[i]) }

  /* ---------- 播放控制 ---------- */
  let t = 0, until = M2.total, playing = false, last = 0, shown: any = 'all'
  const svg = $('svg'), btns = [...rootEl.querySelectorAll<HTMLElement>('[data-go]')]
  const playBtn = $('playAll')
  // 原版是把文字換成「▶ 播放全程」／「❚❚ 暫停」；這裡改成切換 SVG 圖示與文字
  function setPlayUI(on: boolean) { playBtn.dataset.playing = String(on); $('playTxt').textContent = on ? '暫停' : '播放全程' }
  function setActive(p: any, force?: boolean) {
    svg.dataset.active = p; btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.go == p)))
    if (p !== shown || force) { shown = p; caption(p) }
  }
  function phaseAt(t: number) { for (let p = 3; p >= 0; p--) if (t >= M2.st[p]) return p; return 0 }
  let disposed = false
  function frame(now: number) {
    if (!playing || disposed) return
    t += (now - last) / 1000; last = now
    if (t >= until) { t = until; stop() }
    render(t); setActive(phaseAt(Math.min(t, until - 0.01)))
    if (playing) requestAnimationFrame(frame)
  }
  function start(from: number, to: number) { t = from; until = to; playing = true; last = performance.now(); setPlayUI(true); requestAnimationFrame(frame) }
  function stop() { playing = false; setPlayUI(false) }
  btns.forEach(b => b.onclick = () => { const p = +b.dataset.go!; stop(); setActive(p); start(p === 0 ? 0 : M2.st[p], M2.en[p]) })
  playBtn.onclick = () => { if (playing) { stop(); return } start(t >= M2.total - 0.05 || until !== M2.total ? 0 : t, M2.total) }
  const grp = $('grp')
  grp.onchange = (e: any) => { g = G[e.target.value]; setWeights(); caption(shown); render(t) }
  $('five').onchange = (e: any) => rootEl.querySelectorAll<HTMLElement>('.others').forEach(o => o.dataset.on = e.target.checked ? 'on' : 'off')
  const prevGrp = { v: grp.value }
  rootEl.querySelectorAll<HTMLElement>('button[data-mode]').forEach(b => b.onclick = () => {
    const m = b.dataset.mode!; if (m === mode) return
    stop(); mode = m; M2 = MODES[m]; svg.dataset.mode = m
    rootEl.querySelectorAll('button[data-mode]').forEach(x => x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.mode === m)))
    rosterEl.hidden = m !== 'team'; $('fiveWrap').hidden = m === 'team'
    if (m === 'team') { prevGrp.v = grp.value; grp.value = 'team'; grp.disabled = true } else { grp.value = prevGrp.v; grp.disabled = false }
    g = G[grp.value]; setWeights()
    t = 0; until = M2.total; svg.dataset.active = 'all'; btns.forEach(x => x.setAttribute('aria-pressed', 'false'))
    shown = 'all'; caption('all'); render(0)
  })

  setWeights(); caption('all'); render(0)

  return () => { disposed = true; playing = false }
}
</script>

<template>
  <div ref="root" class="lkk4-route">
    <header class="rm-head">
      <div>
        <div class="rm-eyebrow"><span />Course Map</div>
        <h3 class="rm-title">LKK4 場地動線圖</h3>
        <p class="rm-sub">從預備區入場，依序完成三關：拿得動 → 推得實、走得穩 → 走得久</p>
      </div>
      <div class="rm-tools">
        <div class="rm-seg" role="group" aria-label="賽制">
          <button type="button" data-mode="ind" aria-pressed="true">個人賽</button>
          <button type="button" data-mode="team" aria-pressed="false">團體接力賽</button>
        </div>
        <label class="rm-select">
          <span>組別</span>
          <select data-id="grp" aria-label="組別" autocomplete="off">
            <option value="m69">69 歲以下・男</option>
            <option value="f69">69 歲以下・女</option>
            <option value="m70">70 歲以上・男</option>
            <option value="f70" selected>70 歲以上・女</option>
            <option value="team">團體接力賽</option>
          </select>
        </label>
        <label class="rm-chip" data-id="fiveWrap"><input type="checkbox" data-id="five" autocomplete="off">五位一起入場</label>
      </div>
    </header>

    <div class="rm-steps" role="group" aria-label="比賽流程">
      <button type="button" class="step" data-go="0" style="--c:var(--s0);--ct:var(--s0t)"><span class="no">入場</span><b>走到賽道</b><span class="d">聽鈴聲入場</span></button>
      <button type="button" class="step" data-go="1" style="--c:var(--s1);--ct:var(--s1t)"><span class="no">第一關</span><b>拿得動</b><span class="d">六角槓硬舉・1 分</span></button>
      <button type="button" class="step" data-go="2" style="--c:var(--s2);--ct:var(--s2t)"><span class="no">第二關</span><b>推得實、走得穩</b><span class="d">推雪橇＋農夫走路・3 分</span></button>
      <button type="button" class="step" data-go="3" style="--c:var(--s3);--ct:var(--s3t)"><span class="no">第三關</span><b>走得久</b><span class="d">風扇車 3 km・10 分</span></button>
      <button type="button" class="step play" data-id="playAll" data-playing="false">
        <span class="pi" aria-hidden="true">
          <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
          <svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
        </span>
        <span class="pt"><b data-id="playTxt">播放全程</b><span class="d">約 45 秒示意</span></span>
      </button>
    </div>

    <div class="rm-roster" data-id="roster" role="group" hidden aria-label="隊員" />

    <div class="rm-cap" data-id="cap" aria-live="polite" />

    <div class="rm-plan">
      <svg data-id="svg" viewBox="-160 -230 4460 3350" role="img" aria-label="LKK4 場地平面與選手比賽動線" data-active="all" data-mode="ind">
        <defs data-id="defs" />
        <rect class="floor" x="0" y="0" width="4200" height="3000" rx="20" />
        <g data-id="lanes" />
        <g data-id="zones" class="lower" />
        <g data-id="marks" />
        <g data-id="halos" />
        <g data-id="ghosts" />
        <g data-id="progs" />
        <g data-id="dots" />
      </svg>
    </div>
    <p class="rm-hint">左右滑動可看完整場地</p>

    <div class="rm-legend">
      <span><i class="ln" style="border-color:var(--s0);border-top-style:dotted" />入場路線</span>
      <span><i class="ln" style="border-color:var(--s1)" />第一關</span>
      <span><i class="ln" style="border-color:var(--s2)" />第二關・推雪橇</span>
      <span><i class="ln" style="border-color:var(--s2b)" />第二關・農夫走路</span>
      <span><i class="ln" style="border-color:var(--s3)" />第三關</span>
      <span><i class="sw" style="background:var(--track)" />跑道</span>
      <span><i class="sw" style="background:var(--gear)" />工作人員／器材區</span>
    </div>
  </div>
</template>

<style>
/*
 * 配色：票券內是米色底（cream #F5EFE4），卡片白底＋cream-200 外框，文字 navy-800，
 * 與 #rules 的卡片同一套。四段路線色保留原版「灰／橘／綠／藍＋黃」的區分，
 * 第一關改成站上的 orange-700，其餘調成在白底與米色場地上都看得清、
 * 白色號碼壓在圓點上也讀得到的深度。
 */
.lkk4-route {
  --paper: #ffffff; --ink: #1a3545; --muted: #5d6a70; --line: #e8dfd0;
  --floor: #f6f1e7; --station: #ffffff; --sep: #d6cab4;
  --track: #dbe9e1; --gear: #f4e4b4; --stage: #eadbd0;
  --block: #aeb8bc; --seat: #b9c2c5; --booth: #eef0ec;
  --s0: #546f7e; --s1: #c2410c; --s2: #0b7868; --s3: #4a53c4; --dn: #ffffff; --idle: #6e7d84; --s2b: #8f6400;
  --s1t: rgba(194, 65, 12, .08); --s2t: rgba(11, 120, 104, .08); --s3t: rgba(74, 83, 196, .08); --s0t: rgba(84, 111, 126, .10);
  --body: var(--font-main, 'Microsoft JhengHei', system-ui, sans-serif);
  display: grid;
  gap: 14px;
  color: var(--ink);
  font-family: var(--body);
}
.lkk4-route [hidden] { display: none !important; }

/* 標題列 */
.lkk4-route .rm-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 14px 20px; margin-bottom: 4px; }
.lkk4-route .rm-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #c2410c; margin-bottom: 6px; }
.lkk4-route .rm-eyebrow span { width: 18px; height: 2px; background: currentColor; }
.lkk4-route .rm-title { margin: 0; font-size: clamp(24px, 3.2vw, 32px); font-weight: 900; line-height: 1.2; color: #1a3545; text-wrap: balance; }
.lkk4-route .rm-sub { margin: 6px 0 0; font-size: 15px; line-height: 1.7; color: rgba(26, 26, 26, .7); }

/* 控制項 */
.lkk4-route .rm-tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.lkk4-route .rm-seg { display: inline-flex; padding: 3px; gap: 2px; background: #fff; border: 2px solid var(--line); border-radius: 999px; }
.lkk4-route .rm-seg button { font: 700 15px/1.4 var(--body); color: var(--muted); background: transparent; border: 0; border-radius: 999px; padding: 8px 16px; cursor: pointer; transition: background .2s, color .2s; }
.lkk4-route .rm-seg button:hover { color: var(--ink); }
.lkk4-route .rm-seg button[aria-pressed="true"] { background: #1a3545; color: #fff; }
.lkk4-route .rm-select { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 2px solid var(--line); border-radius: 999px; padding: 0 6px 0 14px; font-size: 13px; font-weight: 700; color: var(--muted); }
.lkk4-route .rm-select select {
  /* 16px：小於 16px 的 select 在 iPhone 點下去會整頁放大 */
  font: 700 16px/1.4 var(--body); color: var(--ink); background: transparent; border: 0; padding: 8px 26px 8px 2px; cursor: pointer;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5 7.5l5 5 5-5' fill='none' stroke='%231a3545' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 4px center; background-size: 16px;
}
.lkk4-route .rm-select select:disabled { color: var(--muted); cursor: not-allowed; }
.lkk4-route .rm-chip { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 2px solid var(--line); border-radius: 999px; padding: 9px 15px; font: 700 15px/1.4 var(--body); color: var(--ink); cursor: pointer; }
.lkk4-route .rm-chip input { width: 16px; height: 16px; margin: 0; accent-color: #1a3545; }
.lkk4-route button:focus-visible, .lkk4-route select:focus-visible, .lkk4-route .rm-chip:focus-within { outline: 2px solid #c2410c; outline-offset: 2px; }

/* 流程按鈕 */
.lkk4-route .rm-steps { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.lkk4-route .step {
  position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left;
  padding: 12px 14px 12px 16px; border-radius: 16px; border: 2px solid var(--line); background: var(--paper);
  color: var(--ink); cursor: pointer; overflow: hidden; transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
}
.lkk4-route .step::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--c); }
.lkk4-route .step:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(13, 26, 34, .08); }
.lkk4-route .step[aria-pressed="true"] { background: var(--ct); border-color: var(--c); }
.lkk4-route .step .no { font-size: 12px; font-weight: 800; letter-spacing: .08em; color: var(--c); }
.lkk4-route .step b { font-size: 16px; font-weight: 900; line-height: 1.3; }
.lkk4-route .step .d { font-size: 12.5px; color: var(--muted); line-height: 1.45; }
.lkk4-route .play { --c: #1a3545; flex-direction: row; align-items: center; gap: 12px; background: #1a3545; border-color: #1a3545; color: #fff; }
.lkk4-route .play::before { display: none; }
.lkk4-route .play:hover { background: #0d1a22; }
.lkk4-route .play .d { color: rgba(255, 255, 255, .7); }
.lkk4-route .play .pt { display: flex; flex-direction: column; gap: 2px; }
.lkk4-route .play .pi { flex: none; width: 38px; height: 38px; border-radius: 50%; background: #c2410c; display: grid; place-items: center; }
.lkk4-route .play .pi svg { width: 18px; height: 18px; color: #fff; }
.lkk4-route .play .i-pause, .lkk4-route .play[data-playing="true"] .i-play { display: none; }
.lkk4-route .play[data-playing="true"] .i-pause { display: block; }
/* 五欄只在 lg 以上；平板四個關卡一排、播放鍵自己一排，手機兩欄 */
@media (max-width: 1023px) {
  .lkk4-route .rm-steps { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lkk4-route .play { grid-column: 1 / -1; }
}
@media (max-width: 767px) {
  .lkk4-route .rm-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* 說明卡 */
.lkk4-route .rm-cap {
  background: var(--paper); border: 2px solid var(--line); border-left: 5px solid var(--c, var(--line));
  border-radius: 16px; padding: 16px 20px; display: grid; gap: 8px; min-height: 104px; transition: border-color .3s;
}
.lkk4-route .rm-cap h4 { margin: 0; font-size: 18px; font-weight: 900; color: #1a3545; display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; }
.lkk4-route .rm-cap h4 em { font-style: normal; font-size: 13px; font-weight: 700; color: var(--c, var(--muted)); font-variant-numeric: tabular-nums; background: color-mix(in srgb, var(--c, #e8dfd0) 10%, transparent); border-radius: 999px; padding: 2px 10px; }
.lkk4-route .rm-cap p { margin: 0; line-height: 1.8; max-width: 70ch; font-size: 15px; color: rgba(26, 26, 26, .78); }
.lkk4-route .rm-cap ol { margin: 0; padding-left: 1.3em; list-style: decimal; line-height: 1.85; font-size: 15px; color: rgba(26, 26, 26, .78); }
.lkk4-route .rm-cap b { color: #1a3545; }
/* 總覽（「比賽怎麼走」）的 --c 是外框色，太淡不能拿來當字色 */
.lkk4-route .rm-cap[style*="--line"] h4 em { color: var(--muted); background: #f3ede2; }

/* 平面圖 */
.lkk4-route .rm-plan { background: var(--paper); border: 2px solid var(--line); border-radius: 18px; overflow-x: auto; padding: 6px; }
.lkk4-route .rm-plan svg { display: block; width: 100%; min-width: 680px; height: auto; }
.lkk4-route .rm-hint { display: none; margin: -6px 0 0; font-size: 12.5px; color: var(--muted); text-align: right; }
@media (max-width: 1023px) { .lkk4-route .rm-hint { display: block; } }
.lkk4-route .floor { fill: var(--floor); } .lkk4-route .station { fill: var(--station); } .lkk4-route .sep { fill: var(--sep); }
.lkk4-route .track { fill: var(--track); } .lkk4-route .gear { fill: var(--gear); } .lkk4-route .stagez { fill: var(--stage); }
.lkk4-route .block { fill: var(--block); } .lkk4-route .seat { fill: var(--seat); } .lkk4-route .booth { fill: var(--booth); stroke: var(--line); stroke-width: 6; }
.lkk4-route .truss { stroke: var(--muted); stroke-width: 12; opacity: .35; }
.lkk4-route .icon { stroke: var(--ink); stroke-width: 9; fill: none; opacity: .5; stroke-linecap: round; stroke-linejoin: round; }
.lkk4-route .lbl-s { font: 700 46px var(--body); fill: var(--muted); }
.lkk4-route .lane-no { font: 900 64px var(--body); fill: var(--muted); }
.lkk4-route .prep { font: 900 58px var(--body); fill: var(--s0); }
.lkk4-route .lower { opacity: .6; }
.lkk4-route .stg-badge circle { stroke: var(--paper); stroke-width: 10; }
.lkk4-route .stg-badge text.n { font: 900 74px var(--body); fill: #fff; text-anchor: middle; }
.lkk4-route .stg-badge text.t { font: 900 60px var(--body); }
.lkk4-route .wt { font: 800 46px var(--body); text-anchor: middle; }
.lkk4-route .turn { stroke: var(--s2); stroke-width: 6; stroke-dasharray: 24 18; }
.lkk4-route .turnd { stroke: var(--s2); stroke-width: 6; }
.lkk4-route .turn-l { font: 700 42px var(--body); fill: var(--s2); }
.lkk4-route .halo { stroke-width: 10; stroke-dasharray: 30 20; opacity: 0; transition: opacity .3s; }
.lkk4-route .ghost { fill: none; stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 6 34; opacity: .9; transition: opacity .3s; }
.lkk4-route .prog { fill: none; stroke-width: 22; stroke-linecap: round; stroke-linejoin: round; }
.lkk4-route .dot { stroke: var(--paper); stroke-width: 12; }
.lkk4-route .dot.other { opacity: .85; }
.lkk4-route .dnum { font: 900 60px var(--body); fill: var(--dn); pointer-events: none; }
.lkk4-route .dnum.sm { font-size: 48px; }
.lkk4-route .dlabel { font: 900 58px var(--body); fill: var(--ink); paint-order: stroke; stroke: var(--paper); stroke-width: 16px; stroke-linejoin: round; }
.lkk4-route .ring { fill: none; stroke-width: 14; }
.lkk4-route svg[data-active="0"] [data-ph]:not([data-ph="0"]).ghost,
.lkk4-route svg[data-active="1"] [data-ph]:not([data-ph="1"]).ghost,
.lkk4-route svg[data-active="2"] [data-ph]:not([data-ph="2"]).ghost,
.lkk4-route svg[data-active="3"] [data-ph]:not([data-ph="3"]).ghost { opacity: .15; }
.lkk4-route svg[data-active="0"] .halo[data-ph="0"], .lkk4-route svg[data-active="1"] .halo[data-ph="1"],
.lkk4-route svg[data-active="2"] .halo[data-ph="2"], .lkk4-route svg[data-active="3"] .halo[data-ph="3"] { opacity: 1; }
.lkk4-route .others[data-on="off"] { display: none; }
.lkk4-route svg[data-mode="ind"] .team, .lkk4-route svg[data-mode="team"] .ind { display: none; }
.lkk4-route .teamlane { fill: none; stroke: var(--ink); stroke-width: 6; stroke-dasharray: 4 18; stroke-linecap: round; opacity: .55; }

/* 圖例 */
.lkk4-route .rm-legend { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; color: var(--muted); }
.lkk4-route .rm-legend span { display: inline-flex; align-items: center; gap: 7px; }
.lkk4-route .sw { width: 14px; height: 14px; border-radius: 4px; display: inline-block; border: 1px solid rgba(13, 26, 34, .12); }
.lkk4-route .ln { width: 22px; height: 0; border-top: 3px solid; display: inline-block; }

/* 團體接力賽的隊員卡 */
.lkk4-route .rm-roster { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 640px) { .lkk4-route .rm-roster { grid-template-columns: 1fr; } }
.lkk4-route .mem { display: flex; gap: 12px; align-items: center; padding: 10px 14px; border: 2px solid var(--line); border-radius: 14px; background: var(--paper); transition: border-color .2s, opacity .2s; min-width: 0; }
.lkk4-route .mem i { font-style: normal; font-size: 17px; font-weight: 900; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--idle); color: var(--dn); flex: none; transition: background .2s; }
.lkk4-route .mem[data-s="on"] { border-color: var(--c); }
.lkk4-route .mem[data-s="on"] i { background: var(--c); }
.lkk4-route .mem b { font-size: 14px; display: block; line-height: 1.4; }
.lkk4-route .mem small { font-size: 12px; color: var(--muted); }
.lkk4-route .mem small::after { content: "等待中"; }
.lkk4-route .mem[data-s="on"] small::after { content: "進行中"; }
.lkk4-route .mem[data-s="done"] small::after { content: "已完成"; }
.lkk4-route .mem[data-s="done"] { opacity: .65; }

@media (prefers-reduced-motion: reduce) {
  .lkk4-route .halo, .lkk4-route .ghost, .lkk4-route .step { transition: none; }
  .lkk4-route .step:hover { transform: none; }
}
</style>
