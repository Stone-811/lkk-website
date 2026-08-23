/**
 * 分店資料（營業時間、交通、地圖、電話）——全站唯一來源
 *
 * 2026-08-23 整併：原本同一份資料散在三個地方且互不一致
 *   1. pages/locations/[store].vue 的 storeExtraData（前台實際顯示的那份）
 *   2. 本檔案舊有的 storeDefaults
 *   3. Firestore 的 businessHours / transportation 欄位
 * 現以「前台實際顯示的那份」為準合併於此，另兩份已移除。
 *
 * ⚠️ Firestore 仍留著舊的 businessHours / transportation（JSON 字串），
 *    但後台已於 2026-08-12 移除這兩個編輯區塊，前台也不再讀取，
 *    要改營業時間或交通資訊請直接改這個檔案。
 */

/**
 * 把「捷運七張站 2 號出口，步行 5 分鐘」轉成「鄰近捷運七張站」。
 * 分店總覽與分店詳情的 Hero 只講鄰近哪一站，出口與步行時間留給詳情頁的交通區塊。
 * 分店總覽與分店詳情都用這個函式，規則只有一處。
 */
export function toNearestMrt(desc?: string): string {
  const station = (desc || '').match(/捷運(.+?)站/)?.[1]
  return station ? `鄰近捷運${station}站` : ''
}

export interface StoreDefaultData {
  phone?: string
  /** tel: 連結用的純數字格式 */
  phoneRaw?: string
  googleMapUrl?: string
  /** Google Maps 內嵌地圖 iframe 網址 */
  mapEmbed?: string
  description?: string
  businessHours?: {
    weekday: string
    saturday: string
    sunday: string
    holiday: string
  }
  transport?: {
    mrt: { station: string; desc: string }
    bus: { stop: string; desc: string }
    car: { desc: string }
    parking: { desc: string }
  }
  geo?: { lat: number; lng: number }
}

const storeDefaults: Record<string, StoreDefaultData> = {
  'xindian': {
    phone: '02-8914-6428',
    phoneRaw: '+886289146428',
    googleMapUrl: 'https://maps.app.goo.gl/HtbnehGKnShnHsiB7',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1808.5!2d121.5428873!3d24.9784213!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346801fa0764a755%3A0x29042ff770880f40!2z%E7%B7%B4%E5%81%A5%E5%BA%B7%EF%BC%8D%E6%96%B0%E5%BA%97%E4%B8%83%E5%BC%B5%E5%BA%97!5e0!3m2!1szh-TW!2stw!4v1700000000000!5m2!1szh-TW!2stw',
    description: '捷運七張站 2 號出口，步行 5 分鐘',
    businessHours: {
      weekday: '10:00–22:00',
      saturday: '10:00–18:00',
      sunday: '10:00–18:00',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '七張站 2 號出口', desc: '出站後沿北新路方向直行，約步行 5 分鐘，大樓入口在便利商店旁，下樓梯至 B1-2。' },
      bus: { stop: '公車站：新店郵局', desc: '' },
      car: { desc: '停車場：歐特儀-中興低碳立體停車場、寶橋停車場' },
      parking: { desc: '七張捷運站旁有公共停車場（收費），或北新路沿線路邊停車格。地下室停車空間有限，請提前確認。' },
    },
    geo: { lat: 24.9784213, lng: 121.5428873 },
  },
  'nanjing': {
    phone: '02-2507-4196',
    phoneRaw: '+886225074196',
    googleMapUrl: 'https://maps.app.goo.gl/Px5LAT6LC9Q8KvAA7',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1808.5!2d121.537984!3d25.052245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442ab59356317d7%3A0xbd4e3d04026121fe!2z%E7%B7%B4%E5%81%A5%E5%BA%B7%EF%BC%8D%E5%8D%97%E4%BA%AC%E5%BA%97!5e0!3m2!1szh-TW!2stw!4v1700000000000!5m2!1szh-TW!2stw',
    description: '捷運松江南京站 6 號出口，步行 6 分鐘',
    businessHours: {
      weekday: '09:30–22:00',
      saturday: '09:30–18:00',
      sunday: '09:30–18:00',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '松江南京站 6 號出口', desc: '出站後沿南京東路方向步行約 6 分鐘。' },
      bus: { stop: '公車站：中山女高、長春國小、南京建國路口', desc: '' },
      car: { desc: '停車場：建國北路高架下、台灣聯通停車場(首都場)' },
      parking: { desc: '附近有公共停車場，或路邊停車格。' },
    },
    geo: { lat: 25.052245, lng: 121.537984 },
  },
  'songjiang': {
    phone: '02-2537-1055',
    phoneRaw: '+886225371055',
    googleMapUrl: 'https://maps.app.goo.gl/giFuLHGz4pMwAnpFA',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1808.5!2d121.5327347!3d25.0525134!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442a95792149a0f%3A0x3883ae1ade5dc5c7!2z%E7%B7%B4%E5%81%A5%E5%BA%B7-%E6%9D%BE%E6%B1%9F%E5%BA%97!5e0!3m2!1szh-TW!2stw!4v1700000000000!5m2!1szh-TW!2stw',
    description: '捷運松江南京站 8 號出口，步行 1 分鐘',
    businessHours: {
      weekday: '10:00–22:00',
      saturday: '10:00–18:00',
      sunday: '10:00–18:00',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '松江南京站 8 號出口', desc: '出站後沿松江路方向步行約 1 分鐘。' },
      bus: { stop: '公車站：捷運松江南京站、松江長春路口', desc: '' },
      car: { desc: '停車場：建國北路高架下、台灣聯通停車場-將捷一場' },
      parking: { desc: '附近有公共停車場。' },
    },
    geo: { lat: 25.0525134, lng: 121.5327347 },
  },
  'ximending': {
    phone: '02-2370-3245',
    phoneRaw: '+886223703245',
    googleMapUrl: 'https://maps.app.goo.gl/b4z2D4XECCsi7zsy7',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1808.5!2d121.5101882!3d25.0416063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442a96d8303852b%3A0x8c919512ed52b425!2z%E7%B7%B4%E5%81%A5%E5%BA%B7%EF%BC%8D%E8%A5%BF%E9%96%80%E5%BA%97!5e0!3m2!1szh-TW!2stw!4v1700000000000!5m2!1szh-TW!2stw',
    description: '捷運西門站 3 號出口，步行 3 分鐘',
    businessHours: {
      weekday: '10:00–22:00',
      saturday: '10:00–18:00',
      sunday: '10:00–18:00',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '西門站 3 號出口', desc: '出站後沿寶慶路方向步行約 3 分鐘。' },
      bus: { stop: '公車站：寶慶路', desc: '' },
      car: { desc: '停車場：歐特儀-中山地下停車場、嘟嘟房中華西門1號、中山堂' },
      parking: { desc: '附近有多處公共停車場。' },
    },
    geo: { lat: 25.0416063, lng: 121.5101882 },
  },
}

export function useStoreDefaults() {
  /**
   * 取得分店預設資料
   */
  function getStoreDefaults(slug: string): StoreDefaultData | undefined {
    return storeDefaults[slug]
  }

  /**
   * 取得所有分店預設資料
   */
  function getAllStoreDefaults(): Record<string, StoreDefaultData> {
    return storeDefaults
  }

  /**
   * 合併分店資料與預設資料（預設資料只在欄位為空時使用）
   */
  function mergeWithDefaults<T extends Record<string, any>>(storeData: T, slug: string): T {
    const defaults = storeDefaults[slug]
    if (!defaults) return storeData

    return {
      ...storeData,
      phone: storeData.phone || defaults.phone || '',
      googleMapUrl: storeData.googleMapUrl || defaults.googleMapUrl || '',
      businessHours: {
        weekday: storeData.businessHours?.weekday || defaults.businessHours?.weekday || '09:00 – 21:00',
        saturday: storeData.businessHours?.saturday || defaults.businessHours?.saturday || '09:00 – 18:00',
        sunday: storeData.businessHours?.sunday || defaults.businessHours?.sunday || '公休',
        holiday: storeData.businessHours?.holiday || defaults.businessHours?.holiday || '依公告，請來電確認',
      },
      transport: {
        mrt: {
          station: storeData.transport?.mrt?.station || defaults.transport?.mrt?.station || '',
          desc: storeData.transport?.mrt?.desc || defaults.transport?.mrt?.desc || '',
        },
        bus: {
          stop: storeData.transport?.bus?.stop || defaults.transport?.bus?.stop || '',
          desc: storeData.transport?.bus?.desc || defaults.transport?.bus?.desc || '',
        },
        car: {
          desc: storeData.transport?.car?.desc || defaults.transport?.car?.desc || '',
        },
        parking: {
          desc: storeData.transport?.parking?.desc || defaults.transport?.parking?.desc || '',
        },
      },
    }
  }

  return {
    getStoreDefaults,
    getAllStoreDefaults,
    mergeWithDefaults,
  }
}
