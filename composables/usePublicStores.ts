// 前台分店基本資料（店名／電話／地址／slug）：由後台分店管理
//（Firestore /api/public/stores）驅動——業主在後台改電話/地址會反映到
// 所有使用本 composable 的區塊。抓不到時用內建 fallback，頁面永不空白。
// 共用 key，同頁多處使用只打一次 API（模式同 pages/locations/index.vue）。
// ⚠️ 營業時間／交通／團課開課時段不在此範圍（2026-08 決策：由程式碼維護）。
export interface PublicStore {
  slug: string
  name: string
  phone: string
  address: string
}

// fallback 值與 Firestore 現值一致（含空格格式），API 載入後切換無視覺跳動
const FALLBACK_STORES: PublicStore[] = [
  { slug: 'nanjing', name: '南京店', phone: '(02) 2507-4196', address: '台北市中山區南京東路三段 29 號 B1' },
  { slug: 'songjiang', name: '松江店', phone: '(02) 2537-1055', address: '台北市中山區松江路 122 號 B1' },
  { slug: 'ximending', name: '西門店', phone: '(02) 2370-3245', address: '台北市中正區寶慶路 39 號' },
  { slug: 'xindian', name: '新店七張店', phone: '(02) 8914-6428', address: '新北市新店區北新路二段 252 號 B1-2' },
]

// 前台慣用的顯示順序（南京→松江→西門→七張；API 的 sortOrder 是分店總覽用）
const DISPLAY_ORDER = ['nanjing', 'songjiang', 'ximending', 'xindian']

export function usePublicStores() {
  // server:false → SSR 直接出 fallback（值與 Firestore 一致，切換無跳動），
  // 不讓「每頁都渲染的 Footer」替全站每次 SSR 多背一次 Firestore 查詢
  const { data } = useLazyFetch<{ data?: any[] }>('/api/public/stores', { key: 'public-stores', server: false })

  const stores = computed<PublicStore[]>(() => {
    const list = data.value?.data
    if (!Array.isArray(list) || list.length === 0) return FALLBACK_STORES
    const mapped: PublicStore[] = list.map((s: any) => ({
      slug: s.slug || s.id,
      name: s.name,
      phone: s.phone || '',
      address: `${s.city || ''}${s.district || ''}${s.address || ''}`,
    }))
    // 依慣用順序排列；API 出現規劃外的新分店時接在後面（不會被吃掉）
    const known = DISPLAY_ORDER.map((slug) => mapped.find((s) => s.slug === slug)).filter(Boolean) as PublicStore[]
    const extra = mapped.filter((s) => !DISPLAY_ORDER.includes(s.slug))
    return [...known, ...extra]
  })

  return { stores }
}
