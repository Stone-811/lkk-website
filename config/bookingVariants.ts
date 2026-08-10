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
  // 不限年齡免費：解除「50 歲以上才免費」規則。開啟後：
  // 隱藏付款方式選擇（自動免費）、Hero/底部/FAQ/服務卡的價格文案改為全齡免費。
  allAgesFree?: boolean
  // 公司（合作夥伴）：存進名單、後台顯示辨識，如 '南山' / '亞培'
  company?: string
  // 來源（管道）：存進名單、後台顯示，如 '網站' / 'LINE' / 'Facebook' / 'Email'
  leadSource?: string
}

export const bookingVariants: Record<string, BookingVariant> = {
  // 沒帶 ?v= 或未知值 → 用這個（＝原本的表單，什麼都不覆蓋）
  default: {},

  // ── 範例：亞培（不限年齡免費、不鎖分店；實際文案請自行調整）──
  abbott: {
    hero: {
      title: '亞培 × 練健康',
      titleHighlight: '專屬體驗課',
      subtitle: '不限年齡皆可報名，由專業教練帶領，安全有效。填寫後我們會主動與您聯繫安排時間。',
      ctaText: '立即預約專屬體驗 →',
    },
    allAgesFree: true,
    hideSources: true,
    company: '亞培',
    leadSource: 'LINE',
  },

  // ── 南山（不限年齡免費、不鎖店；來源：網站）──
  nanshan: {
    hero: {
      title: '南山 × 練健康',
      titleHighlight: '專屬體驗課',
      subtitle: '不限年齡皆可報名，由專業教練帶領，安全有效。',
      ctaText: '立即預約專屬體驗 →',
    },
    allAgesFree: true,
    hideSources: true,
    company: '南山',
    leadSource: '網站',
  },
}

// 依 ?v= 取變體（陣列/未知/空值都安全 fallback 成 default）
export function getBookingVariant(key?: string | string[] | null): BookingVariant {
  const k = Array.isArray(key) ? key[0] : key
  return (k && bookingVariants[k]) || bookingVariants.default
}
