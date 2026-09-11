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
} from '~/utils/campaignLinks'

definePageMeta({ layout: 'admin' })
useHead({ title: 'UTM 活動｜練健康後台' })

const PROD_ORIGIN = 'https://lkkwellness.com'

const campaigns = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)

// 🔴 預設一律用正式網域。dev 後台建的活動若用 dev 網域產連結，
//    投放出去名單會全進 lkkdev、正式站一筆都沒有，而且沒有任何錯誤訊息。
const useCurrentOrigin = ref(false)
const currentOrigin = ref('')
const origin = computed(() => (useCurrentOrigin.value && currentOrigin.value ? currentOrigin.value : PROD_ORIGIN))

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
  utmSourceOverride: '',
  utmContent: '',
  partner: '',
  note: '',
  startDate: '',
  endDate: '',
  isActive: true,
})
const form = reactive(blank())
const formError = ref('')

// ?v= 的選項一律從設定檔現讀，不要抄文件——docs/廠商表單網址規範.md 實測是過期的
const variantOptions = computed(() => {
  const t = CAMPAIGN_TARGETS.find((x) => x.value === form.targetPath)
  if (!t?.variantSource) return []
  const src = t.variantSource === 'booking' ? bookingVariants : groupClassVariants
  return Object.keys(src).filter((k) => k !== 'default')
})

const previewLinks = computed(() => {
  if (!form.utmCampaign || !form.channels.length) return []
  return buildCampaignLinks(origin.value, {
    targetPath: form.targetPath,
    variantKey: form.variantKey || null,
    utmCampaign: normalizeCampaignCode(form.utmCampaign),
    channels: form.channels,
    utmSourceOverride: form.utmSourceOverride || null,
    utmContent: form.utmContent || null,
  })
})

const linksFor = (c: any) =>
  buildCampaignLinks(origin.value, {
    targetPath: c.targetPath,
    variantKey: c.variantKey,
    utmCampaign: c.utmCampaign,
    channels: c.channels || [],
    utmSourceOverride: c.utmSourceOverride,
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
    utmSourceOverride: c.utmSourceOverride || '',
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
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-navy-700">UTM 活動</h1>
        <p class="text-sm text-ink/60 mt-1">建立活動並產生帶追蹤參數的連結，名單進來後可在「客戶預約」用 UTM 活動篩選對照。</p>
      </div>
      <button class="bg-orange text-white font-bold px-5 py-2.5 rounded-lg hover:bg-orange-400 transition-colors" @click="openCreate">
        ＋ 新增活動
      </button>
    </div>

    <!-- 能力界線：寫在頁面上，避免業主以為這裡能改表單長相 -->
    <div class="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 text-sm text-amber-900">
      <p class="font-bold mb-1">這裡能做與不能做的事</p>
      <p>✅ 產生帶 <code>utm_*</code> 的追蹤連結、管理活動清單 —— 你自己就能新增，不需要工程師。</p>
      <p>⚠️ <code>?v=</code>（表單變體）決定的是<strong>表單長相</strong>：專屬 Hero 文案、不限年齡免費、鎖定分店。
        新的變體仍需工程師改程式並部署，這裡只能從既有的選單挑。</p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{{ error }}</div>

    <label class="flex items-center gap-2 text-sm mb-4 select-none">
      <input v-model="useCurrentOrigin" type="checkbox" class="w-4 h-4 accent-orange" />
      <span :class="useCurrentOrigin ? 'text-red-600 font-bold' : 'text-ink/70'">
        用目前網域產生連結（測試用）
      </span>
      <span class="text-ink/50 text-xs">目前：{{ origin }}</span>
    </label>

    <div v-if="loading" class="text-ink/50 py-12 text-center">載入中…</div>
    <div v-else-if="!campaigns.length" class="text-ink/50 py-12 text-center border border-dashed border-navy-700/20 rounded-lg">
      還沒有任何活動。點右上角「新增活動」開始。
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
              <template v-if="c.variantKey"> ・變體 {{ c.variantKey }}</template>
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

    <!-- 新增／編輯 -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4" @click.self="showModal = false">
      <div class="bg-white rounded-xl w-full max-w-2xl my-8">
        <div class="flex items-center justify-between px-6 py-4 border-b border-navy-700/10">
          <h2 class="font-bold text-navy-700">{{ editingId ? '編輯活動' : '新增活動' }}</h2>
          <button class="text-ink/50 hover:text-ink text-xl leading-none" @click="showModal = false">×</button>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ formError }}</div>

          <div>
            <label class="block text-sm font-medium text-navy-700 mb-1">活動名稱 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="南山健康守護圈 2026 Q4" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
            <p class="text-xs text-ink/50 mt-1">給人看的中文名稱，後台用它把活動代號翻成看得懂的字。</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-navy-700 mb-1">活動代號（utm_campaign） <span class="text-red-500">*</span></label>
            <input v-model="form.utmCampaign" type="text" placeholder="nanshan-2026q4" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 font-mono text-sm" />
            <p class="text-xs text-red-600 mt-1">⚠️ 只能用小寫英文、數字、- 與 _。<strong>連結發出去之後就不要再改</strong>——已經收到的名單帶的是舊代號，改了對不回來。</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">目標頁面 <span class="text-red-500">*</span></label>
              <select v-model="form.targetPath" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" @change="form.variantKey = ''">
                <option v-for="t in CAMPAIGN_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">表單變體（?v=）</label>
              <select v-model="form.variantKey" :disabled="!variantOptions.length" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 disabled:bg-cream-100 disabled:text-ink/40">
                <option value="">不使用</option>
                <option v-for="v in variantOptions" :key="v" :value="v">{{ v }}</option>
              </select>
              <p class="text-xs text-ink/50 mt-1">{{ variantOptions.length ? '由工程師維護，這裡只能挑既有的。' : '這個頁面沒有變體。' }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-navy-700 mb-2">投放管道 <span class="text-red-500">*</span><span class="text-ink/50 font-normal">（可複選，勾幾個就產生幾條連結）</span></label>
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
              每個管道對應固定的 utm_source／utm_medium，例如 LINE →
              <code>{{ CHANNEL_TO_SOURCE['LINE'] }}</code> / <code>{{ CHANNEL_TO_MEDIUM['LINE'] }}</code>。
            </p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">覆寫 utm_source</label>
              <input v-model="form.utmSourceOverride" type="text" placeholder="留空用管道預設值" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 font-mono text-sm" />
              <p class="text-xs text-ink/50 mt-1">技嘉那檔沿用共用值 website，靠 utm_campaign 辨識。</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">utm_content</label>
              <input v-model="form.utmContent" type="text" placeholder="區分同管道的不同素材" class="w-full border border-navy-700/20 rounded-lg px-3 py-2 font-mono text-sm" />
            </div>
          </div>

          <div class="grid sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">合作夥伴</label>
              <input v-model="form.partner" type="text" placeholder="南山" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">開始日</label>
              <input v-model="form.startDate" type="date" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-navy-700 mb-1">結束日</label>
              <input v-model="form.endDate" type="date" class="w-full border border-navy-700/20 rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-navy-700 mb-1">備註</label>
            <textarea v-model="form.note" rows="2" class="w-full border border-navy-700/20 rounded-lg px-3 py-2"></textarea>
          </div>

          <div v-if="previewLinks.length" class="border border-navy-700/12 rounded-lg bg-cream-50 p-3">
            <p class="text-xs font-bold text-navy-700 mb-2">連結預覽（{{ previewLinks.length }} 條）</p>
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
