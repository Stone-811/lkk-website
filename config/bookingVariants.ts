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
      subtitle: '由專業教練帶領，安全有效。填寫後我們會主動與您聯繫安排時間。',
      ctaText: '立即預約專屬體驗 →',
    },
    company: '亞培',
    leadSource: 'LINE',
  },

  // ── 技嘉 GIGABYTE（2026-08 起，無結束日期）──
  // ⚠️ 優惠條件與一般人「完全相同」（50歲以上免費、未滿50歲 $500），
  //    所以不設 allAgesFree——這個變體純粹是為了歸因與品牌文案。
  //    文案不可寫成「專屬優惠」之類會讓人以為有額外折扣的說法。
  // 連結：/booking?v=gigabyte&utm_source=website&utm_medium=referral&utm_campaign=gigabyte-50plus-free-trial
  // ⚠️ utm_source 依業主決定沿用共用值 website，所以 GA4 裡辨識技嘉要看
  //    utm_campaign（gigabyte-50plus-free-trial），那是唯一的識別依據。
  // 活動結束時：把這一段刪掉即可，舊連結會自動 fallback 成一般表單，不會壞頁。
  gigabyte: {
    hero: {
      title: '技嘉 GIGABYTE × 練健康',
      titleHighlight: '員工專屬體驗課',
      subtitle: '由專業教練帶領，安全有效。填寫後我們會主動與您聯繫安排時間。第一堂體驗課 50 歲以上免費。',
      ctaText: '立即預約專屬體驗 →',
    },
    company: '技嘉',
    leadSource: '網站',
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
    company: '南山',
    leadSource: '網站',
  },
}

// 依 ?v= 取變體（陣列/未知/空值都安全 fallback 成 default）
export function getBookingVariant(key?: string | string[] | null): BookingVariant {
  const k = Array.isArray(key) ? key[0] : key
  return (k && bookingVariants[k]) || bookingVariants.default
}
