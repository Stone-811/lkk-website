<script setup lang="ts">
/**
 * 「從哪裡得知練健康」裡兩個下拉選單的選項維護。
 *
 * 🔴 刻意只提供「新增」與「啟用／停用」，不提供修改文字與刪除。
 *    這些字串會直接存進名單，而名單的 PATCH 白名單只放行 status 與
 *    internalNote，改了字面就回填不了 —— 舊名單與新名單會在 CSV 匯出裡
 *    裂成兩種寫法，業主做統計時才會發現，而且無法補救。
 *    新增不會破壞舊資料；停用只是不再顯示給新填表的人，既有名單不受影響。
 */
const LISTS = [
  { field: 'social' as const, title: '社群平台', hint: '選「社群」之後展開的下拉選單' },
  { field: 'event' as const, title: '實體活動', hint: '選「實體活動」之後展開的下拉選單' },
  {
    field: 'doctor' as const,
    title: '醫師／院所',
    hint: '選「醫師/醫療轉介」之後展開的下拉選單。預設的「張文穎」是範例資料，請換成實際的合作對象',
  },
]

const data = ref<Record<string, { label: string; active: boolean }[]>>({
  social: [],
  event: [],
  doctor: [],
})
const newLabel = reactive<Record<string, string>>({ social: '', event: '', doctor: '' })
const busy = ref('')
const message = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

async function load() {
  try {
    const res: any = await $fetch('/api/admin/referral-options')
    data.value = res.data
  } catch (e: any) {
    message.value = { type: 'err', text: e?.data?.message || '讀取失敗' }
  }
}
onMounted(load)

async function send(field: string, action: 'add' | 'toggle', label: string) {
  busy.value = field + action + label
  message.value = null
  try {
    const res: any = await $fetch('/api/admin/referral-options', {
      method: 'PATCH',
      body: { field, action, label },
    })
    data.value[field] = res.data
    if (action === 'add') newLabel[field] = ''
    message.value = { type: 'ok', text: '已更新，前台最多一分鐘後生效' }
  } catch (e: any) {
    message.value = { type: 'err', text: e?.data?.message || '更新失敗' }
  } finally {
    busy.value = ''
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">表單的「從哪裡得知」選項</h2>
      <p class="text-sm text-gray-500 mt-1">
        預約體驗與團體課程兩張表單共用。這裡只管下拉選單的內容，主要的十個選項寫在程式裡。
      </p>
    </div>

    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 leading-relaxed">
      <p class="font-medium mb-1">為什麼不能修改或刪除既有選項</p>
      <p>
        選項文字會直接存進名單。改了字，之前填過的名單仍是舊字串而且無法回填，
        匯出報表時會變成兩種寫法。<strong>新增</strong>不影響舊資料；
        <strong>停用</strong>只是不再顯示給新填表的人，既有名單照常保留。
      </p>
    </div>

    <div v-for="list in LISTS" :key="list.field" class="space-y-3">
      <div>
        <h3 class="font-medium text-gray-900">{{ list.title }}</h3>
        <p class="text-xs text-gray-500">{{ list.hint }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="opt in data[list.field]"
          :key="opt.label"
          :class="[
            'inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg border text-sm',
            opt.active
              ? 'border-gray-300 bg-white text-gray-900'
              : 'border-gray-200 bg-gray-50 text-gray-400 line-through',
          ]"
        >
          {{ opt.label }}
          <button
            type="button"
            :disabled="busy === list.field + 'toggle' + opt.label"
            class="px-2 py-0.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
            :class="opt.active ? 'text-gray-500 hover:bg-gray-100' : 'text-orange hover:bg-orange/10'"
            @click="send(list.field, 'toggle', opt.label)"
          >
            {{ opt.active ? '停用' : '啟用' }}
          </button>
        </div>
        <p v-if="!data[list.field]?.length" class="text-sm text-gray-400">讀取中…</p>
      </div>

      <div class="flex gap-2">
        <input
          v-model="newLabel[list.field]"
          type="text"
          maxlength="30"
          :placeholder="`新增${list.title}選項`"
          class="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange focus:border-orange"
          @keyup.enter="newLabel[list.field].trim() && send(list.field, 'add', newLabel[list.field])"
        />
        <button
          type="button"
          :disabled="!newLabel[list.field].trim() || busy.startsWith(list.field + 'add')"
          class="px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-600 disabled:opacity-40 transition-colors"
          @click="send(list.field, 'add', newLabel[list.field])"
        >
          新增
        </button>
      </div>
    </div>

    <p
      v-if="message"
      :class="['text-sm', message.type === 'ok' ? 'text-green-700' : 'text-red-600']"
    >
      {{ message.text }}
    </p>
  </div>
</template>
