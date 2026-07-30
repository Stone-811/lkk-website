import { getSession } from '~/server/utils/auth'
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session || session.role !== 'admin') {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { action, recipients } = body

    if (action === 'test-notification') {
      if (!recipients || recipients.length === 0) {
        throw createError({ statusCode: 400, message: '請輸入收件人信箱' })
      }

      // Send test notification
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipients.join(', '),
        subject: '[練健康] 測試通知',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2A5269;">測試通知</h2>
            <p>這是一封測試郵件，用於確認通知功能正常運作。</p>
            <p>如果您收到此郵件，表示郵件通知設定正確！</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">此郵件由練健康後台系統自動發送</p>
          </div>
        `,
      })

      return {
        success: true,
        message: '測試通知已發送',
      }
    }

    throw createError({ statusCode: 400, message: 'Unknown action' })
  } catch (error: any) {
    console.error('Error sending test notification:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || '發送失敗' })
  }
})
