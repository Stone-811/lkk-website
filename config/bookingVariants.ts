// 預約表單「變體設定」——給廠商 UTM 活動用。
// 原理：booking.vue 讀網址的 ?v=<key> → 找這裡對應的設定 → 表單依設定微調。
// 加新廠商＝在 bookingVariants 加一段（複製 abbott 改值），push 後幾分鐘自動部署，
// 不需要再改 booking.vue。未知的 v 值會自動 fallback 成 default（不會壞）。

export interface BookingVariant {
  // Hero 區文案（未填則用表單預設）
  hero?: {
    badge?: string          // 頂端小標籤
    title?: string          // 主標第一行
    titleHighlight?: string // 主標第二行（橘色）
    subtitle?: string       // 副標說明
    checklist?: string[]    // 「立即擁有」清單
    ctaText?: string        // CTA 按鈕文字
  }
  // 鎖定分店：填 slug 或 name 或 id 皆可（如 '南京店' / 'nanjing'）。
  // 設定後：自動預選該分店、隱藏分店下拉選單。
  lockStoreId?: string
  // 隱藏「從哪裡得知」區塊（來源已知時）
  hideSources?: boolean
  // 名單來源標記：存進 lead.payload.sourceTag，後台方便辨識是哪個廠商活動
  sourceTag?: string
}

export const bookingVariants: Record<string, BookingVariant> = {
  // 沒帶 ?v= 或未知值 → 用這個（＝原本的表單，什麼都不覆蓋）
  default: {},

  // ── 範例：亞培（實際文案/分店請自行調整）──
  abbott: {
    hero: {
      badge: '亞培 × 練健康 專屬體驗',
      title: '專為你打造的',
      titleHighlight: '專屬體驗課',
      subtitle: '由醫療相關、運動科學等專業背景教練帶領，安全有效。填寫後我們會主動與您聯繫安排時間。',
      ctaText: '立即預約專屬體驗 →',
    },
    lockStoreId: '南京店',
    hideSources: true,
    sourceTag: '亞培活動',
  },

  // ── 範例：南山 ──
  nanshan: {
    hero: {
      badge: '南山 × 練健康 專屬體驗',
      title: '專為你打造的',
      titleHighlight: '專屬體驗課',
      ctaText: '立即預約專屬體驗 →',
    },
    lockStoreId: '南京店',
    hideSources: true,
    sourceTag: '南山活動',
  },
}

// 依 ?v= 取變體（陣列/未知/空值都安全 fallback 成 default）
export function getBookingVariant(key?: string | string[] | null): BookingVariant {
  const k = Array.isArray(key) ? key[0] : key
  return (k && bookingVariants[k]) || bookingVariants.default
}
