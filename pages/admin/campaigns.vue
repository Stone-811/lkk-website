<script setup lang="ts">
/**
 * UTM 活動連結產生器。
 *
 * 業主流程：建一檔活動 → 勾投放管道 → 每個管道各產出一條連結 → 複製去投放。
 * 名單進來後帶著 utm_campaign，後台「UTM 活動」篩選就能對照。
 *
 * 🔴 刻意做成「單頁 ＋ Modal」，不要另開 campaigns/[id].vue。
 *    pages/admin/lecturers/[id].vue 就是那樣變成 527 行的孤兒檔——
 *    lecturers.vue 裡沒有 <NuxtPage/>，全站也沒有連結指向它。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { bookingVariants } from '~/config/bookingVariants'
import { groupClassVariants } from '~/config/groupClassVariants'
import { SOURCE_CHANNELS } from '~/composables/useAdminLeads'
import {
  CAMPAIGN_TARGETS,
  buildCampaignLinks,
  validateCampaignCode,
  normalizeCampaignCode,
  CHANNEL_TO_SOURCE,
  CHANNEL_TO_MEDIUM,
  summarizeVariants,
} from '~/utils/campaignLinks'

definePageMeta({ layout: 'admin' })
useHead({ title: 'UTM 活動｜練健康後台' })

const campaigns = ref<any[]>([])
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

const showModal = ref(false)
const editingId = ref<string | null>(null)
const expanded = ref<Record<string, boolean>>({})
const copied = ref<string>('')

const blank = () => ({
  name: '',
  utmCampaign: '',
  targetPath: '/booking',
  variantKey: '',
  channels: [] as string[],
  utmContent: '',
  partner: '',
  note: '',
  startDate: '',
  endDate: '',
  isActive: true,
})
const form = reactive(blank())
const formError = ref('')

// 欄位說明（游標停在 ⓘ 上會出現）
const HELP: Record<string, string> = {
  name: '只存在這個後台頁面，給你自己辨識用的中文名稱。它不會出現在連結裡，也不會寫進名單——名單上記的是下面那組英文「活動代號」。所以命名可以隨意改，不影響任何已經發出去的連結或已收到的名單。',
  utmCampaign:
    '英文代號，會直接出現在連結的 utm_campaign 參數裡，也是名單與這檔活動對照的唯一依據。只能用小寫英文、數字、- 與 _。連結發出去之後就不要再改——已經收到的名單帶的是舊代號，改了對不回來。',
  targetPath: '這條連結要把人帶到哪一張表單。只列出會收名單的兩張表單——其他頁面沒有表單，帶人過去也產不出可歸因的名單。',
  variantKey:
    '表單變體決定「表單長相」：專屬 Hero 文案、是否不限年齡免費、是否鎖定分店。只有預約體驗與團體課程兩張表單有變體，而且必須由工程師事先寫好，這裡只能挑既有的。',
  channels:
    '你要把這條連結放到哪些地方。勾幾個就產生幾條連結，每條自動帶不同的 utm_source 與 utm_medium（例如 LINE → line／social），之後才分得出人是從哪個管道來的。這兩個參數由管道決定，不另外開放修改。',
  utmContent: '同一個管道有多種素材時用來區分，例如 card-a、banner-b。非必填。',
  partner: '合作夥伴名稱，純備註用。實際寫進名單的公司欄位是由表單變體決定的，不是這裡。',
  dates: '純備註用，不會自動停用活動。活動結束請手動按「停用」。',
  note: '給自己或同事看的補充說明，不會出現在連結裡。',
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

const variantOptions = computed(() => {
  const t = CAMPAIGN_TARGETS.find((x) => x.value === form.targetPath)
  if (!t?.variantSource) return []
  return t.variantSource === 'booking' ? bookingSummaries.value : groupSummaries.value
})
const selectedVariant = computed(() => variantOptions.value.find((v) => v.key === form.variantKey) || null)

const previewLinks = computed(() => {
  if (!form.utmCampaign || !form.channels.length) return []
  return buildCampaignLinks(origin.value, {
    targetPath: form.targetPath,
    variantKey: form.variantKey || null,
    utmCampaign: normalizeCampaignCode(form.utmCampaign),
    channels: form.channels,
    utmContent: form.utmContent || null,
  })
})

const linksFor = (c: any) =>
  buildCampaignLinks(origin.value, {
    targetPath: c.targetPath,
    variantKey: c.variantKey,
    utmCampaign: c.utmCampaign,
    channels: c.channels || [],
    utmContent: c.utmContent,
  })

const targetLabel = (p: string) => CAMPAIGN_TARGETS.find((t) => t.value === p)?.label || p

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res: any = await $fetch('/api/admin/campaigns')
    campaigns.value = res.data || []
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, blank())
  formError.value = ''
  showModal.value = true
}

function openEdit(c: any) {
  editingId.value = c.id
  Object.assign(form, {
    name: c.name || '',
    utmCampaign: c.utmCampaign || '',
    targetPath: c.targetPath || '/booking',
    variantKey: c.variantKey || '',
    channels: [...(c.channels || [])],
    utmContent: c.utmContent || '',
    partner: c.partner || '',
    note: c.note || '',
    startDate: c.startDate || '',
    endDate: c.endDate || '',
    isActive: c.isActive ?? true,
  })
  formError.value = ''
  showModal.value = true
}

function toggleChannel(ch: string) {
  const i = form.channels.indexOf(ch)
  if (i === -1) form.channels.push(ch)
  else form.channels.splice(i, 1)
}

async function save() {
  formError.value = ''
  if (!form.name.trim()) return (formError.value = '請填寫活動名稱')
  const codeErr = validateCampaignCode(form.utmCampaign)
  if (codeErr) return (formError.value = codeErr)
  if (!form.channels.length) return (formError.value = '請至少勾選一個投放管道')

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
  if (!confirm(`確定刪除「${c.name}」？\n\n舊連結仍在流通、名單照樣會帶 ${c.utmCampaign} 進來，\n刪掉只會讓後台少一個中文對照名稱。\n建議改用「停用」。`)) return
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
})
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-navy-700">UTM 活動</h1>
      <p class="text-sm text-ink/60 mt-1">建立活動並產生帶追蹤參數的連結，名單進來後可在「客戶預約」用 UTM 活動篩選對照。</p>
    </div>

    <!-- 環境橫幅：連結跟著目前環境走，所以一定要讓人一眼看出在哪 -->
    <div
      class="rounded-lg p-4 mb-5 text-sm border"
      :class="env.isProd ? 'bg-green-50 border-green-300 text-green-900' : 'bg-amber-50 border-amber-400 text-amber-900'"
    >
      <p class="font-bold mb-1">
        {{ env.isProd ? '✅ 正式環境' : '⚠️ 測試環境（dev）' }}
        <span class="font-normal">— 這裡產生的連結會指向 <code>{{ origin }}</code></span>
      </p>
      <p v-if="env.isProd">這裡建立的活動與連結可以直接對外投放。</p>
      <p v-else>
        這裡建的活動與收到的名單都只存在測試站，<strong>不會同步到正式站</strong>。
        正式要上線的活動請到正式後台再建一次。
      </p>
    </div>

    <!-- 能力界線：寫在頁面上，避免業主以為這裡能改表單長相 -->
    <div class="bg-cream-50 border border-navy-700/15 rounded-lg p-4 mb-5 text-sm text-ink/75">
      <p class="font-bold text-navy-700 mb-1">這裡能做與不能做的事</p>
      <p>✅ 產生帶 <code>utm_*</code> 的追蹤連結、管理活動清單 —— 你自己就能新增，不需要工程師。</p>
      <p>⚠️ <code>?v=</code>（合作案表單）決定的是<strong>表單長相</strong>：專屬 Hero 文案、不限年齡免費、鎖定分店。
        新的合作案表單仍需工程師製作，這裡只能從既有的挑。</p>
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
          這份清單直接讀程式設定檔即時產生，工程師做好新的合作案表單後這裡會自動出現。要新增或修改請找工程師。
        </p>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{{ error }}</div>

    <div v-if="loading" class="text-ink/50 py-12 text-center">載入中…</div>
    <div v-else-if="!campaigns.length" class="text-ink/50 py-12 text-center border border-dashed border-navy-700/20 rounded-lg">
      還沒有任何活動。點下方「新增活動」開始。
    </div>

    <div v-else class="space-y-3">
      <div v-for="c in campaigns" :key="c.id" class="border border-navy-700/12 rounded-lg bg-white overflow-hidden">
        <div class="flex flex-wrap items-center gap-3 p-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-navy-700">{{ c.name }}</span>
              <code class="text-xs bg-cream-100 text-ink/70 px-2 py-0.5 rounded">{{ c.utmCampaign }}</code>
              <span v-if="!c.isActive" class="text-xs bg-ink/10 text-ink/60 px-2 py-0.5 rounded">已停用</span>
            </div>
            <div class="text-xs text-ink/55 mt-1">
              {{ targetLabel(c.targetPath) }}
              <template v-if="c.variantKey"> ・合作案 {{ c.variantKey }}</template>
              ・{{ (c.channels || []).join('、') }}
            </div>
          </div>
          <button class="text-sm text-navy-700 hover:text-orange underline" @click="expanded[c.id] = !expanded[c.id]">
            {{ expanded[c.id] ? '收合' : `連結（${(c.channels || []).length}）` }}
          </button>
          <button class="text-sm text-navy-700 hover:text-orange" @click="openEdit(c)">編輯</button>
          <button class="text-sm text-ink/60 hover:text-ink" @click="toggleActive(c)">{{ c.isActive ? '停用' : '啟用' }}</button>
          <button class="text-sm text-red-600 hover:text-red-700" @click="remove(c)">刪除</button>
        </div>

        <div v-if="expanded[c.id]" class="border-t border-navy-700/10 bg-cream-50 p-4 space-y-2">
          <div v-for="l in linksFor(c)" :key="l.channel" class="flex items-start gap-3">
            <span class="text-xs font-bold text-navy-700 w-20 shrink-0 pt-1.5">{{ l.channel }}</span>
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

          <!-- ① 活動基本資料：只存在後台，不影響連結 -->
          <section>
            <h3 class="text-sm font-bold text-navy-700 pb-2 mb-3 border-b border-navy-700/15">
              活動基本資料
              <span class="font-normal text-ink/50">— 只存在後台，不會出現在連結裡</span>
            </h3>
            <div class="space-y-4">
              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                  活動名稱 <span class="text-red-500">*</span>
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-80 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.name }}</span></span>
                </label>
                <input v-model="form.name" type="text" placeholder="南山健康守護圈 2026 Q4" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
              </div>
              <div class="grid sm:grid-cols-3 gap-4">
                <div>
                  <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                    合作夥伴
                    <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-72 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.partner }}</span></span>
                  </label>
                  <input v-model="form.partner" type="text" placeholder="南山" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                    開始日
                    <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-64 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.dates }}</span></span>
                  </label>
                  <input v-model="form.startDate" type="date" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-navy-700 mb-1">結束日</label>
                  <input v-model="form.endDate" type="date" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                  備註
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-64 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.note }}</span></span>
                </label>
                <textarea v-model="form.note" rows="2" class="w-full border border-navy-700/20 rounded-lg px-3 py-2"></textarea>
              </div>
            </div>
          </section>

          <!-- ② 連結要帶去哪 -->
          <section>
            <h3 class="text-sm font-bold text-navy-700 pb-2 mb-3 border-b border-navy-700/15">
              連結目標
              <span class="font-normal text-ink/50">— 決定人點了之後看到哪張表單</span>
            </h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                  目標頁面 <span class="text-red-500">*</span>
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-72 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.targetPath }}</span></span>
                </label>
                <select v-model="form.targetPath" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" @change="form.variantKey = ''">
                  <option v-for="t in CAMPAIGN_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                  合作案表單（?v=）
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-80 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.variantKey }}</span></span>
                </label>
                <select v-model="form.variantKey" :disabled="!variantOptions.length" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 disabled:bg-cream-100 disabled:text-ink/40">
                  <option value="">不使用</option>
                  <option v-for="v in variantOptions" :key="v.key" :value="v.key">{{ v.label }}</option>
                </select>
                <p v-if="selectedVariant" class="text-xs text-ink/60 mt-1 leading-relaxed">
                  <span class="font-bold text-navy-700">{{ selectedVariant.heroTitle || selectedVariant.key }}</span>：
                  {{ selectedVariant.effects.join('、') }}<template v-if="selectedVariant.leadSource">；名單來源記為「{{ selectedVariant.leadSource }}」</template>
                </p>
                <p v-else class="text-xs text-ink/50 mt-1">{{ variantOptions.length ? '由工程師維護，這裡只能挑既有的。' : '這個頁面沒有合作案表單。' }}</p>
              </div>
            </div>
          </section>

          <!-- ③ UTM 追蹤參數：三個欄位全部集中在這一區（業主指定） -->
          <section>
            <h3 class="text-sm font-bold text-navy-700 pb-2 mb-3 border-b border-navy-700/15">
              UTM 追蹤參數
              <span class="font-normal text-ink/50">— 會出現在連結裡，也是名單歸因的依據</span>
            </h3>
            <div class="space-y-4">
              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                  活動代號（utm_campaign） <span class="text-red-500">*</span>
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-80 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.utmCampaign }}</span></span>
                </label>
                <input v-model="form.utmCampaign" type="text" placeholder="nanshan-2026q4" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 font-mono text-sm" />
                <p class="text-xs text-red-600 mt-1">⚠️ 只能用小寫英文、數字、- 與 _。<strong>連結發出去之後就不要再改</strong>。</p>
              </div>

              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-2">
                  投放管道（utm_source／utm_medium） <span class="text-red-500">*</span>
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-80 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.channels }}</span></span>
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="ch in SOURCE_CHANNELS"
                    :key="ch"
                    type="button"
                    class="px-3 py-1.5 rounded-lg border text-sm transition-colors"
                    :class="form.channels.includes(ch) ? 'border-orange bg-orange/10 text-orange font-bold' : 'border-navy-700/20 hover:border-orange/50'"
                    @click="toggleChannel(ch)"
                  >{{ ch }}</button>
                </div>
                <p class="text-xs text-ink/50 mt-1.5">
                  勾幾個就產生幾條連結。每個管道對應固定的參數，例如 LINE →
                  <code>utm_source={{ CHANNEL_TO_SOURCE['LINE'] }}</code> ／ <code>utm_medium={{ CHANNEL_TO_MEDIUM['LINE'] }}</code>。
                </p>
              </div>

              <div>
                <label class="flex items-center gap-1.5 text-sm font-medium text-navy-700 mb-1">
                  素材代號（utm_content）
                  <span class="relative group inline-flex"><span class="w-4 h-4 rounded-full border border-navy-700/35 text-navy-700/70 text-[10px] font-bold flex items-center justify-center cursor-help">?</span><span class="pointer-events-none invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-72 bg-navy-700 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl">{{ HELP.utmContent }}</span></span>
                </label>
                <input v-model="form.utmContent" type="text" placeholder="區分同管道的不同素材，例如 card-a" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 font-mono text-sm" />
              </div>
            </div>
          </section>

          <div v-if="previewLinks.length" class="border border-navy-700/12 rounded-lg bg-cream-50 p-3">
            <p class="text-xs font-bold text-navy-700 mb-2">
              連結預覽（{{ previewLinks.length }} 條）
              <span class="font-normal" :class="env.isProd ? 'text-green-700' : 'text-amber-700'">— {{ env.name }}</span>
            </p>
            <div v-for="l in previewLinks" :key="l.channel" class="flex items-start gap-2 mb-1.5 last:mb-0">
              <span class="text-xs font-bold text-navy-700 w-16 shrink-0 pt-0.5">{{ l.channel }}</span>
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
