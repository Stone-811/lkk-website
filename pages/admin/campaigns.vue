<script setup lang="ts">
/**
 * UTM 活動連結產生器。
 *
 * 業主流程：建一檔活動 → 勾投放管道 → 每個管道各產出一條連結 → 複製去投放。
 * 名單進來後帶著 utm_campaign，後台「UTM 活動」篩選就能對照。
 *
 * 🔴 刻意做成「單頁 ＋ Modal」，不要另開 campaigns/[id].vue。
 *    講師管理踩過這個坑：原本是「列表頁 → 獨立編輯頁」，後來改成列表＋彈窗，
 *    舊的 lecturers/[id].vue 沒人刪，變成 527 行的孤兒檔（父層沒有 <NuxtPage/>、
 *    全站零連結，進不去也沒人維護，欄位還比現行少 5 個）。已於 2026-09-11 刪除。
 *    只要 Nuxt 的 xxx.vue 與 xxx/ 目錄並存，父層就必須放 <NuxtPage/> 子路由才會渲染。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { bookingVariants } from '~/config/bookingVariants'
import { groupClassVariants } from '~/config/groupClassVariants'
import {
  CAMPAIGN_TARGETS,
  buildCampaignLinks,
  validateCampaignCode,
  normalizeCampaignCode,
  summarizeVariants,
  campaignLinkKey,
  normalizeCampaignLinks,
  type CampaignLink,
} from '~/utils/campaignLinks'
import { DEFAULT_UTM_CHANNELS, GA4_MEDIUMS, type UtmChannel } from '~/config/utmChannels'

definePageMeta({ layout: 'admin' })
useHead({ title: 'UTM 活動｜練健康後台' })

const campaigns = ref<any[]>([])
// 流通中但沒登記成活動的代號——後端從真實名單反推出來的（見 index.get.ts 的說明）
const unregistered = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)

// 🔴 連結一律用「目前所在環境」的網域（業主 2026-09-11 指定）：
//    在 dev 後台就產測試連結、在正式後台就產正式連結。
//    因為 campaigns 資料本身也是分環境存的（dev 進 lkkdev、prod 進 lkkprod），
//    兩邊的活動清單本來就不互通，跟著環境走才不會錯亂。
//    環境用上方的醒目橫幅標示，避免把測試連結拿去投放。
const currentOrigin = ref('')
const origin = computed(() => currentOrigin.value)
const env = computed(() => {
  if (!currentOrigin.value) return { name: '載入中', isProd: false }
  let host = ''
  try {
    host = new URL(currentOrigin.value).hostname
  } catch {
    return { name: '未知環境', isProd: false }
  }
  const isProd = host === 'lkkwellness.com' || host.endsWith('.lkkwellness.com')
  return { name: isProd ? '正式環境' : '測試環境（dev）', isProd }
})

/**
 * 投放管道清單。業主可自行新增，存在 Firestore `settings/utmChannels`。
 * 初值用程式裡的預設，API 還沒回來、或 Firestore 掛了，畫面都還是能建活動。
 */
const channelDefs = ref<(UtmChannel & { active: boolean })[]>(
  DEFAULT_UTM_CHANNELS.map((c) => ({ ...c, active: true })),
)
/** 產連結與勾選只用啟用中的；停用的仍留在清單裡，供既有活動的連結照常組出來。 */
const activeChannels = computed(() => channelDefs.value.filter((c) => c.active))

const showChannelPanel = ref(false)
const newChannel = reactive({ label: '', source: '', medium: 'social' })
const channelError = ref('')
const channelSaving = ref(false)

async function loadChannels() {
  try {
    const res: any = await $fetch('/api/admin/utm-channels')
    if (Array.isArray(res?.data) && res.data.length) channelDefs.value = res.data
  } catch {
    /* 讀不到就用程式裡的預設，不擋住建活動 */
  }
}

async function addChannel() {
  channelError.value = ''
  channelSaving.value = true
  try {
    const res: any = await $fetch('/api/admin/utm-channels', {
      method: 'PATCH',
      body: { action: 'add', ...newChannel },
    })
    channelDefs.value = res.data
    newChannel.label = ''
    newChannel.source = ''
    newChannel.medium = 'social'
  } catch (e: any) {
    channelError.value = e?.data?.message || e?.message || '新增失敗'
  } finally {
    channelSaving.value = false
  }
}

async function toggleChannelActive(label: string) {
  channelError.value = ''
  try {
    const res: any = await $fetch('/api/admin/utm-channels', {
      method: 'PATCH',
      body: { action: 'toggle', label },
    })
    channelDefs.value = res.data
  } catch (e: any) {
    channelError.value = e?.data?.message || e?.message || '更新失敗'
  }
}

const showModal = ref(false)
const editingId = ref<string | null>(null)
const expanded = ref<Record<string, boolean>>({})
const copied = ref<string>('')

const blank = () => ({
  name: '',
  utmCampaign: '',
  /** 這檔活動底下的所有連結，每一條各自獨立 */
  links: [] as CampaignLink[],
  note: '',
  isActive: true,
})

/** 正在編輯中的那一列（還沒按「新增」加進 links）。 */
const draftBlank = () => ({
  targetPath: '/booking',
  variantKey: '',
  utmSource: 'website',
  utmMedium: 'referral',
  utmContent: '',
})
const form = reactive(blank())
const draft = reactive(draftBlank())
const draftError = ref('')
const formError = ref('')


// 欄位說明（游標停在 ⓘ 上會出現）
const HELP: Record<string, string> = {
  name: '只在這個後台頁面顯示，方便你辨識活動。不進連結也不進名單，改名不影響任何已發出的連結。',
  utmCampaign: '會寫進連結的 utm_campaign，是名單對照活動的唯一依據。發出去之後修改，舊名單就對不回來了。',
  targetPath: '連結要把人帶到哪些表單。可以同時選兩張，各產一條連結、共用同一個活動代號。只列出會收名單的表單，其他頁面收不到可歸因的名單。',
  variantKey: '決定表單長相（專屬文案、全齡免費、鎖分店）。兩張表單的變體是分開的兩套，各自選。需工程師事先製作，這裡只能挑既有的。',
  utmSource: '流量的「來處」，例如 line、facebook。可以自行新增。',
  utmMedium: '流量的「性質」，例如 social、cpc。與 source 獨立 —— 同一個 source 配不同 medium 都合法（google/cpc 是廣告、google/organic 是自然搜尋）。只能從 GA4 標準值挑，填非標準值會讓 GA4 把那批流量歸到 Unassigned 且無法回填。',
  utmContent: '同一檔活動有多種素材時用來區分，例如 card-a。非必填。',
  note: '給自己看的補充說明，顯示在活動列表展開處。不會出現在連結裡。',
}

// ?v= 的選項一律從設定檔現讀，不要抄文件——docs/廠商表單網址規範.md 實測是過期的
// （漏了 gigabyte，又把 abbott/nanshan 誤寫成隱藏得知管道）
const bookingSummaries = computed(() => summarizeVariants(bookingVariants, 'booking'))
const groupSummaries = computed(() => summarizeVariants(groupClassVariants, 'groupClass'))
const allSummaries = computed(() => [
  ...bookingSummaries.value.map((v) => ({ ...v, form: '預約體驗', path: '/booking' })),
  ...groupSummaries.value.map((v) => ({ ...v, form: '團體課程', path: '/group-booking' })),
])
const showVariantRef = ref(false)

/** 某一張表單可以挑的變體（兩張表單讀的是不同的設定檔）。 */
const variantOptionsFor = (path: string) => {
  const t = CAMPAIGN_TARGETS.find((x) => x.value === path)
  if (!t?.variantSource) return []
  return t.variantSource === 'booking' ? bookingSummaries.value : groupSummaries.value
}

/** 切換目標表單時清掉變體 —— 兩張表單的變體設定檔是不同的兩份，沿用會指到不存在的 key。 */
function onPickTarget(path: string) {
  draft.targetPath = path
  draft.variantKey = ''
}

/** 挑 source 時自動帶出它的預設 medium —— 只是預設，使用者可以再改。 */
function onPickSource(source: string) {
  draft.utmSource = source
  const def = channelDefs.value.find((c) => c.source === source)
  if (def) draft.utmMedium = def.medium
}

/** 把目前這一列加進清單。重複的組合在這裡就擋掉，不要等到送出。 */
function addLink() {
  draftError.value = ''
  if (!draft.targetPath) return (draftError.value = '請選擇目標表單')
  if (!draft.utmSource) return (draftError.value = '請選擇來源')
  if (!draft.utmMedium) return (draftError.value = '請選擇性質')

  const link: CampaignLink = {
    targetPath: draft.targetPath,
    variantKey: draft.variantKey || null,
    utmSource: draft.utmSource,
    utmMedium: draft.utmMedium,
    utmContent: draft.utmContent.trim() || null,
  }
  if (form.links.some((l) => campaignLinkKey(l) === campaignLinkKey(link))) {
    return (draftError.value = '這個組合已經加過了，會產出一模一樣的網址')
  }
  form.links.push(link)
  // 只清素材代號，其餘留著 —— 連續加同一張表單的不同管道時少點幾下
  draft.utmContent = ''
}

function removeLink(i: number) {
  form.links.splice(i, 1)
}

const previewLinks = computed(() => {
  if (!form.utmCampaign || !form.links.length) return []
  return buildCampaignLinks(origin.value, {
    utmCampaign: normalizeCampaignCode(form.utmCampaign),
    links: form.links,
  })
})

// 直接把紀錄傳進去：buildCampaignLinks 會自己分辨新舊模型。
// 舊活動（沒有 utmSource）仍照原本的「一張表單 × N 個管道」組回來，
// 連結與實際流通中的一字不差。
const linksFor = (c: any) => buildCampaignLinks(origin.value, c, channelDefs.value)

const targetLabel = (p: string) => CAMPAIGN_TARGETS.find((t) => t.value === p)?.label || p

/** 列表上的一行摘要。三種歷史形狀都先正規化成 links 再描述，不必各自分支。 */
function summarizeRecord(c: any): string {
  const links = normalizeCampaignLinks(c, channelDefs.value)
  if (!links.length) return '（沒有連結）'
  const forms = [...new Set(links.map((l) => targetLabel(l.targetPath)))].join('＋')
  const srcs = [...new Set(links.map((l) => `${l.utmSource}/${l.utmMedium}`))]
  const shown = srcs.slice(0, 3).join('、') + (srcs.length > 3 ? ` …共 ${srcs.length} 組` : '')
  return `${forms}・${shown}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res: any = await $fetch('/api/admin/campaigns')
    campaigns.value = res.data || []
    unregistered.value = res.unregistered || []
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, blank())
  Object.assign(draft, draftBlank())
  draftError.value = ''
  formError.value = ''
  showModal.value = true
}

/**
 * 把「流通中但未登記」的代號帶進新增表單。
 * 只預填代號與能從名單推得的名稱，表單與 source／medium 仍要業主自己確認——
 * 名單雖然記得 utm_source，但推不回當初掛了哪幾張表單，猜錯會產生錯的連結。
 */
function registerUnregistered(u: any) {
  editingId.value = null
  Object.assign(form, blank())
  Object.assign(draft, draftBlank())
  draftError.value = ''
  form.utmCampaign = u.utmCampaign
  form.name = u.companies?.[0] ? `${u.companies[0]}（既有連結）` : ''
  form.note = `從既有名單登記。目前已收到 ${u.leadCount} 筆，來源：${(u.sources || []).join('、') || '未記錄'}。`
  formError.value = ''
  showModal.value = true
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 把一筆紀錄塞進表單。
 *
 * ⚠️ 要相容舊資料：2026-10-15 之前的活動是 { targetPath, variantKey, channels }，
 *    沒有 targetPaths／variantKeys／utmSource／utmMedium。
 *    不轉換的話，編輯舊活動時表單會是空的，一存檔就把原本的設定清掉。
 *    舊活動有多個管道時只能取第一個當 source（新模型一檔活動一組 source/medium），
 *    所以存檔前會提示它會從幾條連結變成幾條。
 */
function openEdit(c: any) {
  editingId.value = c.id
  Object.assign(form, {
    name: c.name || '',
    utmCampaign: c.utmCampaign || '',
    // 任何歷史形狀都先轉成 links[]。
    // 🔴 轉換是無損的（斷言在 utils 的測試裡）：轉出來的每一條連結網址
    //    與轉換前逐字相同，所以編輯舊活動不會動到已經發出去的連結。
    links: normalizeCampaignLinks(c, channelDefs.value),
    note: c.note || '',
    isActive: c.isActive ?? true,
  })
  Object.assign(draft, draftBlank())
  draftError.value = ''
  formError.value = ''
  showModal.value = true
}

async function save() {
  formError.value = ''
  const codeErr = validateCampaignCode(form.utmCampaign)
  if (codeErr) return (formError.value = codeErr)
  if (!form.links.length) return (formError.value = '請至少新增一條連結')

  saving.value = true
  try {
    const payload = { ...form, utmCampaign: normalizeCampaignCode(form.utmCampaign) }
    if (editingId.value) {
      await $fetch(`/api/admin/campaigns/${editingId.value}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/admin/campaigns', { method: 'POST', body: payload })
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    formError.value = e?.data?.message || e?.message || '儲存失敗'
  } finally {
    saving.value = false
  }
}

async function toggleActive(c: any) {
  try {
    await $fetch(`/api/admin/campaigns/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } })
    await load()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '更新失敗'
  }
}

async function remove(c: any) {
  if (!confirm(`確定刪除「${c.name || c.utmCampaign}」？\n\n舊連結仍在流通、名單照樣會帶 ${c.utmCampaign} 進來，\n刪掉只會讓後台少一個中文對照名稱。\n建議改用「停用」。`)) return
  try {
    await $fetch(`/api/admin/campaigns/${c.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '刪除失敗'
  }
}

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = url
    setTimeout(() => (copied.value = ''), 1600)
  } catch {
    error.value = '複製失敗，請手動選取'
  }
}

onMounted(() => {
  currentOrigin.value = window.location.origin
  load()
  loadChannels()
})
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-navy-700">UTM 活動</h1>
      <p class="text-sm text-ink/60 mt-1">產生活動專屬連結，投放出去後就能在「客戶預約」看出名單是從哪來的。</p>
    </div>

    <!-- 環境橫幅：連結跟著目前環境走，所以一定要讓人一眼看出在哪 -->
    <div
      class="rounded-lg p-4 mb-5 text-sm border"
      :class="env.isProd ? 'bg-green-50 border-green-300 text-green-900' : 'bg-amber-50 border-amber-400 text-amber-900'"
    >
      <p v-if="env.isProd"><strong>✅ 正式環境</strong> — 這裡產生的連結可以直接對外投放。</p>
      <p v-else><strong>⚠️ 測試環境</strong> — 這裡的活動只在測試站，<strong>要對外投放請到正式後台建</strong>。</p>
    </div>

    <!-- 能力界線：寫在頁面上，避免業主以為這裡能改表單長相 -->
    <div class="bg-cream-50 border border-navy-700/15 rounded-lg p-4 mb-5 text-sm text-ink/75">
      <p>✅ 活動與追蹤連結，你自己就能建。</p>
      <p class="mt-1">⚠️ 表單本身的樣子（專屬文案、免費體驗、指定分店）要請工程師做，這裡只能挑現成的。</p>
    </div>

    <!-- 現有合作案表單：即時從 config 讀，不會像 docs/廠商表單網址規範.md 那樣過期 -->
    <div class="border border-navy-700/12 rounded-lg bg-white mb-6 overflow-hidden">
      <button class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cream-50 transition-colors" @click="showVariantRef = !showVariantRef">
        <span class="text-sm font-bold text-navy-700">
          現有合作案表單（{{ allSummaries.length }} 個）
          <span class="font-normal text-ink/55">— 建活動時可以直接挑</span>
        </span>
        <span class="text-ink/50 text-xs">{{ showVariantRef ? '收合 ▲' : '展開 ▼' }}</span>
      </button>
      <div v-if="showVariantRef" class="border-t border-navy-700/10 overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-cream-50 text-left">
              <th class="px-4 py-2.5 font-bold text-navy-700 whitespace-nowrap">代號</th>
              <th class="px-4 py-2.5 font-bold text-navy-700 whitespace-nowrap">合作夥伴</th>
              <th class="px-4 py-2.5 font-bold text-navy-700 whitespace-nowrap">適用表單</th>
              <th class="px-4 py-2.5 font-bold text-navy-700">表單效果</th>
              <th class="px-4 py-2.5 font-bold text-navy-700 whitespace-nowrap">名單來源</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in allSummaries" :key="v.path + v.key" class="border-t border-navy-700/8">
              <td class="px-4 py-2.5 whitespace-nowrap">
                <code class="text-xs bg-cream-100 text-navy-700 px-2 py-0.5 rounded font-bold">?v={{ v.key }}</code>
              </td>
              <td class="px-4 py-2.5 font-bold text-navy-700 whitespace-nowrap">{{ v.company || '—' }}</td>
              <td class="px-4 py-2.5 text-ink/70 whitespace-nowrap">{{ v.form }}</td>
              <td class="px-4 py-2.5 text-ink/70">{{ v.effects.join('、') }}</td>
              <td class="px-4 py-2.5 text-ink/60 whitespace-nowrap">{{ v.leadSource || '—' }}</td>
            </tr>
            <tr v-if="!allSummaries.length">
              <td colspan="5" class="px-4 py-6 text-center text-ink/45">尚無合作案表單</td>
            </tr>
          </tbody>
        </table>
        <p class="text-xs text-ink/50 px-4 py-3 border-t border-navy-700/10 bg-cream-50">
          新的合作案表單要請工程師做，做好之後這裡會自動出現。
        </p>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{{ error }}</div>

    <!-- 流通中但未登記：UTM 工具做好之前就發出去的連結，業主原本在後台看不到 -->
    <div v-if="unregistered.length" class="border border-amber-300 bg-amber-50 rounded-lg mb-6 overflow-hidden">
      <div class="px-4 py-3 border-b border-amber-200">
        <p class="font-bold text-amber-900">流通中，但不在下方清單裡（{{ unregistered.length }}）</p>
        <p class="text-sm text-amber-900/75 mt-0.5">
          這些活動代號已經出現在真實名單裡，代表連結正在外面被使用，但沒有登記成活動。
          多半是這個工具做好之前就發出去的。按「登記」把它納入管理。
        </p>
      </div>
      <div class="divide-y divide-amber-200">
        <div v-for="u in unregistered" :key="u.utmCampaign" class="flex flex-wrap items-center gap-3 px-4 py-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <code class="text-sm bg-white border border-amber-300 text-ink px-2 py-0.5 rounded">{{ u.utmCampaign }}</code>
              <span class="text-sm font-bold text-amber-900">{{ u.leadCount }} 筆名單</span>
              <span v-for="co in u.companies" :key="co" class="text-xs bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">{{ co }}</span>
            </div>
            <div class="text-xs text-amber-900/70 mt-1">
              來源 {{ (u.sources || []).join('、') || '未記錄' }}
              ・{{ fmtDate(u.firstSeen) }} ～ {{ fmtDate(u.lastSeen) }}
            </div>
          </div>
          <button
            class="text-sm shrink-0 px-3 py-1.5 rounded border border-amber-700/40 text-amber-900 hover:bg-amber-900 hover:text-white transition-colors"
            @click="registerUnregistered(u)"
          >登記</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-ink/50 py-12 text-center">載入中…</div>
    <div v-else-if="!campaigns.length" class="text-ink/50 py-12 text-center border border-dashed border-navy-700/20 rounded-lg">
      還沒有任何活動。點下方「新增活動」開始。
    </div>

    <div v-else class="space-y-3">
      <div v-for="c in campaigns" :key="c.id" class="border border-navy-700/12 rounded-lg bg-white overflow-hidden">
        <div class="flex flex-wrap items-center gap-3 p-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-navy-700">{{ c.name || c.utmCampaign }}</span>
              <code class="text-xs bg-cream-100 text-ink/70 px-2 py-0.5 rounded">{{ c.utmCampaign }}</code>
              <span v-if="!c.isActive" class="text-xs bg-ink/10 text-ink/60 px-2 py-0.5 rounded">已停用</span>
            </div>
            <!-- 新舊模型都要顯示得出來：舊紀錄沒有 targetPaths／utmSource -->
            <div class="text-xs text-ink/55 mt-1">
              <!-- 一律從正規化後的 links 摘要，三種歷史形狀都適用 -->
              {{ summarizeRecord(c) }}
            </div>
          </div>
          <button class="text-sm text-navy-700 hover:text-orange underline" @click="expanded[c.id] = !expanded[c.id]">
            {{ expanded[c.id] ? '收合' : `連結（${linksFor(c).length}）` }}
          </button>
          <button class="text-sm text-navy-700 hover:text-orange" @click="openEdit(c)">編輯</button>
          <button class="text-sm text-ink/60 hover:text-ink" @click="toggleActive(c)">{{ c.isActive ? '停用' : '啟用' }}</button>
          <button class="text-sm text-red-600 hover:text-red-700" @click="remove(c)">刪除</button>
        </div>

        <div v-if="expanded[c.id]" class="border-t border-navy-700/10 bg-cream-50 p-4 space-y-2">
          <div v-for="l in linksFor(c)" :key="l.label" class="flex items-start gap-3">
            <span class="text-xs font-bold text-navy-700 w-24 shrink-0 pt-1.5">{{ targetLabel(l.label) }}</span>
            <code class="flex-1 min-w-0 text-xs break-all bg-white border border-navy-700/10 rounded px-2 py-1.5">{{ l.url }}</code>
            <button
              class="text-xs shrink-0 px-3 py-1.5 rounded border transition-colors"
              :class="copied === l.url ? 'bg-green-600 text-white border-green-600' : 'border-navy-700/25 text-navy-700 hover:bg-navy-700 hover:text-white'"
              @click="copy(l.url)"
            >{{ copied === l.url ? '已複製' : '複製' }}</button>
          </div>
          <p v-if="c.note" class="text-xs text-ink/55 pt-1">備註：{{ c.note }}</p>
        </div>
      </div>
    </div>

    <!-- 新增按鈕：置中放在列表下方（業主指定，不放右上角） -->
    <div class="flex justify-center mt-8">
      <button class="bg-orange text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-orange/30 hover:bg-orange-400 transition-colors" @click="openCreate">
        ＋ 新增活動
      </button>
    </div>

    <!-- 新增／編輯 -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4" @click.self="showModal = false">
      <div class="bg-white rounded-xl w-full max-w-2xl my-8">
        <div class="flex items-center justify-between px-6 py-4 border-b border-navy-700/10">
          <h2 class="font-bold text-navy-700">{{ editingId ? '編輯活動' : '新增活動' }}</h2>
          <button class="text-ink/50 hover:text-ink text-xl leading-none" @click="showModal = false">×</button>
        </div>

        <div class="p-6 space-y-6">
          <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ formError }}</div>

            <div>
              <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                活動名稱 <span class="text-ink/45 font-normal">（選填）</span>
                <AdminFieldHelp :text="HELP.name" />
              </label>
              <input v-model="form.name" type="text" placeholder="南山健康守護圈 2026 Q4" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
            </div>

          <!-- ① 活動層級：整檔共用 -->
          <section>
            <h3 class="text-sm font-bold text-navy-700 pb-2 mb-3 border-b border-navy-700/15">
              活動代號
              <span class="font-normal text-ink/50">— 整檔活動共用，是名單對照活動的唯一依據</span>
            </h3>
            <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
              utm_campaign <span class="text-red-500">*</span>
              <AdminFieldHelp :text="HELP.utmCampaign" />
            </label>
            <input v-model="form.utmCampaign" type="text" placeholder="nanshan-2026q4" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 font-mono text-sm" />
            <p class="text-xs text-red-600 mt-1">⚠️ 只能用小寫英文、數字、- 與 _。<strong>連結發出去之後就不要再改</strong>。</p>
          </section>

          <!-- ② 一列一列把連結加進來。每一條各自獨立：自己的表單、變體、來源、性質、素材。 -->
          <section>
            <h3 class="text-sm font-bold text-navy-700 pb-2 mb-3 border-b border-navy-700/15">
              連結
              <span class="font-normal text-ink/50">— 選好一組按「加入」，可以一直加</span>
            </h3>

            <div class="border border-navy-700/15 rounded-lg p-3 bg-cream-50 space-y-3">
              <div class="grid sm:grid-cols-2 gap-3">
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-navy-700 mb-1">
                    目標表單 <span class="text-red-500">*</span>
                    <AdminFieldHelp :text="HELP.targetPath" />
                  </label>
                  <select
                    :value="draft.targetPath"
                    class="w-full border border-navy-700/20 rounded px-2 py-1.5 text-sm"
                    @change="onPickTarget(($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="t in CAMPAIGN_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-navy-700 mb-1">
                    合作案表單（?v=）
                    <AdminFieldHelp :text="HELP.variantKey" />
                  </label>
                  <select
                    v-model="draft.variantKey"
                    :disabled="!variantOptionsFor(draft.targetPath).length"
                    class="w-full border border-navy-700/20 rounded px-2 py-1.5 text-sm disabled:bg-cream-100 disabled:text-ink/40"
                  >
                    <option value="">不使用</option>
                    <option v-for="v in variantOptionsFor(draft.targetPath)" :key="v.key" :value="v.key">{{ v.label }}</option>
                  </select>
                </div>
              </div>

              <div class="grid sm:grid-cols-3 gap-3">
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-navy-700 mb-1">
                    來源（utm_source） <span class="text-red-500">*</span>
                    <AdminFieldHelp :text="HELP.utmSource" />
                  </label>
                  <select
                    :value="draft.utmSource"
                    class="w-full border border-navy-700/20 rounded px-2 py-1.5 text-sm font-mono"
                    @change="onPickSource(($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="c in activeChannels" :key="c.source" :value="c.source">{{ c.source }}（{{ c.label }}）</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-navy-700 mb-1">
                    性質（utm_medium） <span class="text-red-500">*</span>
                    <AdminFieldHelp :text="HELP.utmMedium" />
                  </label>
                  <select v-model="draft.utmMedium" class="w-full border border-navy-700/20 rounded px-2 py-1.5 text-sm">
                    <option v-for="m in GA4_MEDIUMS" :key="m.value" :value="m.value">{{ m.value }}</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-navy-700 mb-1">
                    素材（utm_content）
                    <AdminFieldHelp :text="HELP.utmContent" />
                  </label>
                  <input v-model="draft.utmContent" type="text" placeholder="card-a" class="w-full border border-navy-700/20 rounded px-2 py-1.5 text-sm font-mono" />
                </div>
              </div>

              <p v-if="draftError" class="text-xs text-red-600">{{ draftError }}</p>

              <div class="flex items-center justify-between">
                <p class="text-xs text-ink/50">
                  來源清單可以自己維護。
                  <button type="button" class="text-orange underline" @click="showChannelPanel = !showChannelPanel">
                    {{ showChannelPanel ? '收合' : '新增／停用來源' }}
                  </button>
                </p>
                <button type="button" class="bg-navy-700 text-white text-sm font-bold px-4 py-1.5 rounded shrink-0" @click="addLink">
                  ＋ 加入這一條
                </button>
              </div>

              <!-- 來源維護。只開放新增與停用：source 會進 GA4 與名單，改字面救不回來。 -->
              <div v-if="showChannelPanel" class="border-t border-navy-700/10 pt-3">
                <p class="text-xs font-bold text-navy-700 mb-2">目前的來源</p>
                <div class="space-y-1 mb-3">
                  <div v-for="c in channelDefs" :key="c.label" class="flex items-center gap-2 text-xs">
                    <span class="w-20 shrink-0" :class="c.active ? 'text-navy-700 font-bold' : 'text-ink/35 line-through'">{{ c.label }}</span>
                    <code class="flex-1 text-ink/55">{{ c.source }}<span class="text-ink/35">（預設 {{ c.medium }}）</span></code>
                    <button type="button" class="text-orange underline shrink-0" @click="toggleChannelActive(c.label)">
                      {{ c.active ? '停用' : '啟用' }}
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <input v-model="newChannel.label" type="text" placeholder="顯示名稱（Threads）" class="border border-navy-700/20 rounded px-2 py-1.5 text-xs" />
                  <input v-model="newChannel.source" type="text" placeholder="utm_source（threads）" class="border border-navy-700/20 rounded px-2 py-1.5 text-xs font-mono" />
                  <select v-model="newChannel.medium" class="border border-navy-700/20 rounded px-2 py-1.5 text-xs">
                    <option v-for="m in GA4_MEDIUMS" :key="m.value" :value="m.value">預設 {{ m.value }}</option>
                  </select>
                </div>
                <p v-if="channelError" class="text-xs text-red-600 mt-1.5">{{ channelError }}</p>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-xs text-red-600">⚠️ 新增後<strong>不能改字</strong>，只能停用。</p>
                  <button type="button" class="bg-navy-700 text-white text-xs font-bold px-3 py-1.5 rounded shrink-0 ml-3 disabled:opacity-50" :disabled="channelSaving" @click="addChannel">
                    {{ channelSaving ? '新增中…' : '新增來源' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 已加入的連結 -->
            <div v-if="form.links.length" class="mt-3 space-y-1.5">
              <p class="text-xs font-bold text-navy-700">已加入 {{ form.links.length }} 條</p>
              <div v-for="(l, i) in form.links" :key="i" class="flex items-center gap-2 text-xs border border-navy-700/12 rounded px-2 py-1.5">
                <span class="font-bold text-navy-700 shrink-0">{{ targetLabel(l.targetPath) }}</span>
                <code class="flex-1 min-w-0 text-ink/60 break-all">
                  {{ l.utmSource }} / {{ l.utmMedium }}<template v-if="l.variantKey"> · v={{ l.variantKey }}</template><template v-if="l.utmContent"> · {{ l.utmContent }}</template>
                </code>
                <button type="button" class="text-red-600 underline shrink-0" @click="removeLink(i)">刪除</button>
              </div>
            </div>
            <p v-else class="text-xs text-ink/45 mt-2">還沒有連結。選好上面的組合後按「加入這一條」。</p>
          </section>

            <div>
              <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                備註
                <AdminFieldHelp :text="HELP.note" />
              </label>
              <textarea v-model="form.note" rows="2" class="w-full border border-navy-700/20 rounded-lg px-3 py-2"></textarea>
            </div>

          <div v-if="previewLinks.length" class="border border-navy-700/12 rounded-lg bg-cream-50 p-3">
            <p class="text-xs font-bold text-navy-700 mb-2">
              連結預覽（{{ previewLinks.length }} 條）
              <span class="font-normal" :class="env.isProd ? 'text-green-700' : 'text-amber-700'">— {{ env.name }}</span>
            </p>
            <div v-for="l in previewLinks" :key="l.label" class="flex items-start gap-2 mb-1.5 last:mb-0">
              <span class="text-xs font-bold text-navy-700 w-24 shrink-0 pt-0.5">{{ targetLabel(l.label) }}</span>
              <code class="text-xs break-all text-ink/70">{{ l.url }}</code>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-700/10">
          <button class="px-4 py-2 text-ink/60 hover:text-ink" @click="showModal = false">取消</button>
          <button
            class="bg-orange text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors"
            :disabled="saving"
            @click="save"
          >{{ saving ? '儲存中…' : '儲存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
