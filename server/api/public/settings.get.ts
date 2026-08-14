import { getDb } from '~/server/utils/firebase'

// 公開站台設定：只回「可公開」的聯絡資訊與社群連結（來自 settings/general + settings/social）。
// 絕不回傳通知收件人等後台專用設定。後台未設定時回傳合理預設值，前台永不空白。

const DEFAULTS = {
  siteName: '練健康',
  siteDescription: '專業一對一私人教練，科學化訓練，找回你的健康生活。',
  contactEmail: 'lkkwellness@gmail.com',
  contactPhone: '02-2537-1055',
  socialLinks: {
    facebook: 'https://www.facebook.com/LKKWellnessCenter/',
    instagram: 'https://www.instagram.com/lkk_wellness/',
    youtube: 'https://www.youtube.com/c/LKKWellness',
    podcast: 'https://podcasts.apple.com/tw/podcast/%E5%88%9D%E4%B8%80%E5%8D%81%E4%BA%94%E7%B7%B4%E5%81%A5%E5%BA%B7/id1779024584',
    line: 'https://line.me/R/ti/p/%40201fzruh',
    email: 'lkkwellness@gmail.com',
  },
}

// nullish → 用預設；空字串（業主刻意清空以隱藏）則保留空字串，由前台 v-if 隱藏
const pick = (v: any, fallback: string) => (v === undefined || v === null ? fallback : v)

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    const [generalSnap, socialSnap] = await Promise.all([
      db.collection('settings').doc('general').get(),
      db.collection('settings').doc('social').get(),
    ])
    const general: any = generalSnap.exists ? generalSnap.data() : {}
    const social: any = socialSnap.exists ? socialSnap.data() : {}

    return {
      siteName: pick(general.siteName, DEFAULTS.siteName),
      siteDescription: pick(general.siteDescription, DEFAULTS.siteDescription),
      contactEmail: pick(general.contactEmail, DEFAULTS.contactEmail),
      contactPhone: pick(general.contactPhone, DEFAULTS.contactPhone),
      socialLinks: {
        facebook: pick(social.facebook, DEFAULTS.socialLinks.facebook),
        instagram: pick(social.instagram, DEFAULTS.socialLinks.instagram),
        youtube: pick(social.youtube, DEFAULTS.socialLinks.youtube),
        podcast: pick(social.podcast, DEFAULTS.socialLinks.podcast),
        line: pick(social.line, DEFAULTS.socialLinks.line),
        email: pick(social.email, DEFAULTS.socialLinks.email),
      },
    }
  } catch (error) {
    console.error('[Public Settings GET] Error, using defaults:', error)
    return DEFAULTS
  }
})
