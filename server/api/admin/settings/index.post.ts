import { getSession } from '~/server/utils/auth'
import nodemailer from 'nodemailer'
import { hasPagePermission } from '~/utils/adminAccess'

export default defineEventHandler(async (event) => {
  try {
    const session = await getSession(event)
    if (!session || (session.role !== 'admin' && !hasPagePermission(session, '/admin/settings'))) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { action, recipients } = body

    if (action === 'test-notification') {
      if (!recipients || recipients.length === 0) {
        return { success: false, error: '請輸入收件人信箱' }
      }

      // 全程包在 try 內並加逾時：任何 SMTP 問題（認證失敗、連線卡住）都快速回 200+錯誤字串，
      // 不讓它變成「訊息被吃掉的 500」或「連線 hang 到請求逾時的 500」。
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 20000,
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

        return { success: true, message: '測試通知已發送' }
      } catch (smtpError: any) {
        console.error('[test-notification] SMTP error:', smtpError)
        const detail = [smtpError?.message, smtpError?.response, smtpError?.code]
          .filter(Boolean)
          .join(' | ')
        return {
          success: false,
          error: `SMTP 失敗：${detail || String(smtpError)}（SMTP_USER=${process.env.SMTP_USER || '未設定'}、密碼${process.env.SMTP_PASS ? '已設定' : '缺失'}）`,
        }
      }
    }

    throw createError({ statusCode: 400, message: 'Unknown action' })
  } catch (error: any) {
    console.error('Error sending test notification:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || '發送失敗' })
  }
})
