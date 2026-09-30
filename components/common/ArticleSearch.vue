<script setup lang="ts">
/**
 * 彙整頁的分頁內搜尋框。
 *
 * 🔴 刻意是「按送出才查」，不是邊打邊查。
 *    每一次查詢都會打到舊站 l-kk.tw 的 WordPress，而它是全站 675 篇文章的
 *    唯一資料來源。2026-09-30 實測它的併發表現不穩定（同樣 6 個並發，
 *    量過 4 秒也量過 26 秒），邊打邊查等於讓每個讀者用鍵盤決定並發數。
 *
 * 🔴 中文輸入法按 Enter 是在「選字」，不是要送出。
 *    Vue 的 v-model 本身已經會忽略組字期間的 input 事件，但 Enter 不會 ——
 *    沒擋的話注音使用者每選一個字就送出一次查詢。
 *    這裡在 keydown 檢查 isComposing（部分瀏覽器改用 keyCode 229），
 *    組字中的 Enter 直接 preventDefault，表單根本不會收到 submit。
 *
 * ⚠️ 輸入框的字級一定要 16px（text-base），不能用 text-sm。
 *    iOS Safari 對 font-size < 16px 的輸入框，一聚焦就會自動放大整頁，
 *    讀者得自己縮回去。這是 lkk-mobile-audit 記過的四個常見問題之一。
 *
 * ⚠️ type="search" 會由瀏覽器自己畫一顆清除鈕（::-webkit-search-cancel-button），
 *    跟下面自訂的清除鈕重疊成兩個 × —— 實測在 dev 站確認過，所以把原生那顆藏掉。
 *    不能改用 type="text"：type="search" 才會讓手機鍵盤出現「搜尋」鍵。
 */
import { MIN_SEARCH_LENGTH } from '~/composables/useArticleBrowser'

const props = withDefaults(
  defineProps<{
    modelValue: string
    canSubmit?: boolean
    loading?: boolean
    active?: boolean
    placeholder?: string
    label?: string
  }>(),
  {
    canSubmit: false,
    loading: false,
    active: false,
    placeholder: '輸入關鍵字，例如：膝蓋、肌少症、深蹲',
    label: '搜尋文章',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
  (e: 'clear'): void
}>()

function onKeydownEnter(event: KeyboardEvent) {
  // 組字中的 Enter 是選字，不是送出
  if (event.isComposing || event.keyCode === 229) event.preventDefault()
}

function onSubmit() {
  if (!props.canSubmit || props.loading) return
  emit('submit')
}
</script>

<template>
  <form
    role="search"
    class="max-w-xl mx-auto mb-8"
    @submit.prevent="onSubmit"
  >
    <label :for="'article-search'" class="sr-only">{{ label }}</label>
    <div class="flex items-center gap-2 bg-white rounded-full pl-5 pr-2 py-2 shadow-sm border border-navy/10 focus-within:border-navy/40 transition-colors">
      <svg
        class="w-5 h-5 text-navy/35 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        id="article-search"
        :value="modelValue"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :placeholder="placeholder"
        class="flex-1 min-w-0 bg-transparent text-ink placeholder:text-ink/35 text-base py-1.5 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="onKeydownEnter"
      >

      <button
        v-if="active || modelValue"
        type="button"
        class="shrink-0 w-8 h-8 grid place-items-center rounded-full text-ink/40 hover:text-navy hover:bg-cream transition-colors"
        aria-label="清除搜尋"
        @click="emit('clear')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <button
        type="submit"
        :disabled="!canSubmit || loading"
        class="shrink-0 bg-navy hover:bg-navy-800 disabled:bg-navy/25 disabled:cursor-not-allowed text-cream-50 text-sm font-bold px-4 md:px-5 py-2 rounded-full transition-colors"
      >
        {{ loading ? '搜尋中' : '搜尋' }}
      </button>
    </div>

    <p
      v-if="modelValue.trim().length > 0 && !canSubmit"
      class="text-xs text-ink/50 mt-2 text-center"
    >
      請至少輸入 {{ MIN_SEARCH_LENGTH }} 個字
    </p>
  </form>
</template>
