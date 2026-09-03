// 團體課報名表單「變體設定」——給廠商 UTM 活動用（架構比照 config/bookingVariants.ts）。
// 原理：group-booking.vue 讀網址的 ?v=<key> → 找這裡對應的設定 → 表單依設定微調。
// 加新廠商＝在 groupClassVariants 加一段（複製 abbott 改值），push 後幾分鐘自動部署，
// 不需要再改 group-booking.vue。未知的 v 值會自動 fallback 成 default（不會壞）。

export interface GroupClassVariant {
  // Hero 區文案（未填則用表單預設）
  hero?: {
    badge?: string          // 頂端小標籤
    title?: string          // 主標第一行
    titleHighlight?: string // 主標第二行（橘色）
    checklist?: string[]    // 「立即擁有」清單
    ctaText?: string        // CTA 按鈕文字
  }
  // 鎖定分店：填分店字串的開頭即可（如 '南京店'）。
  // 設定後：自動預選該分店、隱藏分店下拉選單。
  lockStore?: string
  // 鎖定課程：填課程名稱（如 '樂齡肌力體適能團班'）。設定後：自動預選、隱藏課程選項。
  lockCourse?: string
  // 隱藏「從哪裡得知」區塊（來源已知時）
  hideSources?: boolean
  // 公司（合作夥伴）：存進名單、後台顯示辨識，如 '南山' / '亞培'
  company?: string
  // 來源（管道）：存進名單、後台顯示，如 '網站' / 'LINE' / 'Facebook' / 'Email'
  leadSource?: string
}

export const groupClassVariants: Record<string, GroupClassVariant> = {
  // 沒帶 ?v= 或未知值 → 用這個（＝原本的表單，什麼都不覆蓋）
  default: {},

  // ── 範例：亞培（不鎖店、隱藏得知管道；來源預設 LINE）──
  abbott: {
    hero: {
      title: '亞培 × 練健康',
      titleHighlight: '專屬團體課程',
      ctaText: '立即填寫專屬報名 →',
    },
    hideSources: true,
    company: '亞培',
    leadSource: 'LINE',
  },

  // ── 南山（不鎖店、隱藏得知管道；來源預設 網站）──
  nanshan: {
    hero: {
      title: '南山 × 練健康',
      titleHighlight: '專屬團體課程',
      ctaText: '立即填寫專屬報名 →',
    },
    hideSources: true,
    company: '南山',
    leadSource: '網站',
  },
}

// 依 ?v= 取變體（陣列/未知/空值都安全 fallback 成 default）
export function getGroupClassVariant(key?: string | string[] | null): GroupClassVariant {
  const k = Array.isArray(key) ? key[0] : key
  return (k && groupClassVariants[k]) || groupClassVariants.default
}
