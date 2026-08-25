import { getSession } from '~/server/utils/auth'
import { getDb } from '~/server/utils/firebase'
import { hasPagePermission } from '~/utils/adminAccess'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session || (session.role !== 'admin' && !hasPagePermission(session, '/admin/settings'))) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const db = await getDb()

    // Get notification settings
    const notificationsDoc = await db.collection('settings').doc('notifications').get()
    const notifications = notificationsDoc.exists
      ? notificationsDoc.data()
      : { emailOnNewLead: true, emailRecipients: '' }

    // Get general settings
    const generalDoc = await db.collection('settings').doc('general').get()
    const general = generalDoc.exists
      ? generalDoc.data()
      : {
          siteName: '練健康',
          siteDescription: '專業一對一私人教練，科學化訓練，找回您的健康生活。',
          contactEmail: 'lkkwellness@gmail.com',
        }

    // Get social links
    const socialDoc = await db.collection('settings').doc('social').get()
    const socialLinks = socialDoc.exists
      ? socialDoc.data()
      : {
          facebook: '',
          instagram: '',
          youtube: '',
          line: '',
        }

    return {
      success: true,
      data: {
        ...general,
        socialLinks,
        notifications,
      },
    }
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Failed to fetch settings' })
  }
})
