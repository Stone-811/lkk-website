/**
 * 分店預設資料
 * 用於後台編輯時自動帶入、前端顯示時補充缺失資料
 */

export interface StoreDefaultData {
  phone?: string
  googleMapUrl?: string
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
  xindian: {
    phone: '02-8914-6428',
    googleMapUrl: 'https://maps.app.goo.gl/TMJki8DVdS6bE3sR7',
    description: '新北市新店區唯一專注中高齡與特殊族群的肌力訓練中心，由物理治療師背景教練帶領，捷運七張站步行 3 分鐘。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '新店七張站 1 號出口', desc: '出站後沿北新路方向直行，約步行 3 分鐘，大樓入口在便利商店旁，下樓梯至 B1-2。' },
      bus: { stop: '七張站', desc: '849、綠12、綠14、橘12 等路線均可抵達，下車後步行 2 分鐘。' },
      car: { desc: '沿北新路往新店方向，過七張路口後即可見到，大樓地下室入口在右側。' },
      parking: { desc: '七張捷運站旁有公共停車場（收費），或北新路沿線路邊停車格。地下室停車空間有限，請提前確認。' },
    },
    geo: { lat: 24.9682, lng: 121.5396 },
  },
  nanjing: {
    phone: '02-2507-4196',
    googleMapUrl: 'https://maps.app.goo.gl/gnGhthhJNtiww4jn9',
    description: '位於台北市中心南京復興商圈，捷運南京復興站步行 3 分鐘。專為中高齡及特殊族群設計的肌力訓練中心。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '南京復興站 2 號出口', desc: '出站後沿南京東路三段方向步行約 3 分鐘。' },
      bus: { stop: '南京復興站', desc: '多條公車路線可達。' },
      car: { desc: '南京東路三段，近南京復興捷運站。' },
      parking: { desc: '附近有公共停車場，或路邊停車格。' },
    },
    geo: { lat: 25.0522, lng: 121.5443 },
  },
  songjiang: {
    phone: '02-2537-1055',
    googleMapUrl: 'https://maps.app.goo.gl/YzNzUDwxVLgSJgxr8',
    description: '位於台北市松江路商圈，捷運松江南京站步行 5 分鐘。專業物理治療師教練團隊。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '松江南京站 4 號出口', desc: '出站後沿松江路方向步行約 5 分鐘。' },
      bus: { stop: '松江南京站', desc: '多條公車路線可達。' },
      car: { desc: '松江路，近松江南京捷運站。' },
      parking: { desc: '附近有公共停車場。' },
    },
    geo: { lat: 25.0531, lng: 121.5332 },
  },
  ximending: {
    phone: '02-2370-3245',
    googleMapUrl: 'https://maps.app.goo.gl/9N3aCCfo1DFP1raG7',
    description: '位於西門町商圈，捷運西門站步行 3 分鐘。鄰近交通便利，適合各年齡層。',
    businessHours: {
      weekday: '09:00 – 21:00',
      saturday: '09:00 – 18:00',
      sunday: '公休',
      holiday: '依公告，請來電確認',
    },
    transport: {
      mrt: { station: '西門站 6 號出口', desc: '出站後沿寶慶路方向步行約 3 分鐘。' },
      bus: { stop: '西門站', desc: '多條公車路線可達。' },
      car: { desc: '寶慶路，近西門捷運站。' },
      parking: { desc: '附近有多處公共停車場。' },
    },
    geo: { lat: 25.0423, lng: 121.5069 },
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
