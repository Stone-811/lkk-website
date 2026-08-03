// Lazy load nodemailer to avoid bundling issues
let _nodemailer: any = null

async function getNodemailer() {
  if (!_nodemailer) {
    _nodemailer = (await import('nodemailer')).default
  }
  return _nodemailer
}

// Email transporter configuration
async function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('SMTP configuration missing. Email notifications disabled.')
    return null
  }

  const nodemailer = await getNodemailer()
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

// Get notification settings from Firestore
async function getNotificationSettings() {
  try {
    const { getDb } = await import('./firebase')
    const db = await getDb()
    const settingsDoc = await db.collection('settings').doc('notifications').get()
    if (settingsDoc.exists) {
      return settingsDoc.data() as {
        emailOnNewLead: boolean
        emailRecipients: string
      }
    }
    return {
      emailOnNewLead: true,
      emailRecipients: process.env.NOTIFICATION_EMAIL || '',
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return null
  }
}

// Lead type labels
const leadTypeLabels: Record<string, string> = {
  booking: '預約體驗',
  franchise: '加盟洽詢',
  cooperation: '合作洽詢',
}

// 依「學員實際年齡」判斷體驗費（50 歲以上免費、未滿 50 歲 $500）。
// 以出生年月為權威依據，避免表單付款方式被誤選時信件顯示錯誤金額。
function bookingFeeLabel(birthDate?: string, paymentMethod?: string): string | null {
  if (birthDate) {
    const b = new Date(birthDate)
    if (!isNaN(b.getTime())) {
      const now = new Date()
      let age = now.getFullYear() - b.getFullYear()
      const m = now.getMonth() - b.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
      return age >= 50 ? '50 歲以上免費體驗' : '臨櫃付款 $500'
    }
  }
  if (paymentMethod) {
    return paymentMethod === '50歲以上免費' ? '50 歲以上免費體驗' : '臨櫃付款 $500'
  }
  return null
}

interface LeadNotificationData {
  type: 'booking' | 'franchise' | 'cooperation'
  name: string
  phone: string
  email?: string
  organization?: string
  cooperationType?: string
  storeName?: string
  message?: string
  createdAt: Date
  // Booking specific fields
  gender?: string
  birthDate?: string
  line?: string
  filledBySelf?: boolean
  relationship?: string
  bookerName?: string
  contactPhone?: string
  hasMedicalCondition?: boolean
  medicalConditionNote?: string
  preferredTime?: string[]
  paymentMethod?: string
  exerciseGoals?: string[]
  exerciseGoalOther?: string
  sources?: string[]
  // Franchise specific fields
  region?: string
  franchiseType?: string
  // Cooperation specific fields
  companySize?: string
  budgetRange?: string
  lineId?: string
}

// Send lead notification email to admins
export async function sendLeadNotification(data: LeadNotificationData) {
  const transporter = await createTransporter()
  if (!transporter) {
    console.log('Email transporter not configured, skipping notification')
    return false
  }

  const settings = await getNotificationSettings()
  if (!settings || !settings.emailOnNewLead || !settings.emailRecipients) {
    console.log('Email notifications disabled or no recipients configured')
    return false
  }

  const recipients = settings.emailRecipients
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email)

  if (recipients.length === 0) {
    console.log('No valid email recipients')
    return false
  }

  const typeLabel = leadTypeLabels[data.type] || data.type
  const subject = `【練健康】新${typeLabel}表單 - ${data.name}`
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://l-kk.tw'

  let content = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2A5269; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">新${typeLabel}通知</h1>
  </div>

  <div style="padding: 20px; background: #f9f9f9;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">表單類型</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">姓名</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">電話</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.phone}</td>
      </tr>`

  if (data.email) {
    content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.email}</td>
      </tr>`
  }

  if (data.organization) {
    content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">公司/單位</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.organization}</td>
      </tr>`
  }

  if (data.cooperationType) {
    content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">洽詢類型</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.cooperationType}</td>
      </tr>`
  }

  if (data.storeName) {
    content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">選擇分店</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.storeName}</td>
      </tr>`
  }

  // Booking specific fields
  if (data.type === 'booking') {
    if (data.gender) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">性別</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.gender}</td>
      </tr>`
    }

    if (data.birthDate) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">出生年月</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.birthDate}</td>
      </tr>`
    }

    if (data.line) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">LINE ID</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.line}</td>
      </tr>`
    }

    // Booker info (代填者資訊)
    if (data.filledBySelf === false) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; background: #fff3cd;">填表人</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; background: #fff3cd;">代為填寫</td>
      </tr>`
      if (data.relationship) {
        content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">與學員關係</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.relationship}</td>
      </tr>`
      }
      if (data.bookerName) {
        content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">填表人姓名</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.bookerName}</td>
      </tr>`
      }
      if (data.contactPhone) {
        content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">聯絡電話</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.contactPhone}</td>
      </tr>`
      }
    }

    // Medical condition (健康狀況)
    if (data.hasMedicalCondition) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; background: #f8d7da; color: #721c24;">健康狀況</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; background: #f8d7da; color: #721c24;">有特殊健康狀況</td>
      </tr>`
      if (data.medicalConditionNote) {
        content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; vertical-align: top;">健康狀況說明</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; white-space: pre-wrap;">${data.medicalConditionNote}</td>
      </tr>`
      }
    }

    if (data.preferredTime && data.preferredTime.length > 0) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">方便聯繫時段</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.preferredTime.join('、')}</td>
      </tr>`
    }

    const paymentLabel = bookingFeeLabel(data.birthDate, data.paymentMethod)
    if (paymentLabel) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">付款方式</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${paymentLabel}</td>
      </tr>`
    }

    if (data.exerciseGoals && data.exerciseGoals.length > 0) {
      let goalsText = data.exerciseGoals.join('、')
      if (data.exerciseGoalOther) {
        goalsText += `（其他：${data.exerciseGoalOther}）`
      }
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">運動目的</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${goalsText}</td>
      </tr>`
    }

    if (data.sources && data.sources.length > 0) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">得知管道</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.sources.join('、')}</td>
      </tr>`
    }
  }

  // Cooperation specific fields
  if (data.type === 'cooperation') {
    if (data.lineId) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">LINE ID</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.lineId}</td>
      </tr>`
    }
    if (data.companySize) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">公司規模</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.companySize}</td>
      </tr>`
    }
    if (data.budgetRange) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">預算區間</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.budgetRange}</td>
      </tr>`
    }
  }

  // Franchise specific fields
  if (data.type === 'franchise') {
    if (data.region) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">目標區域</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.region}</td>
      </tr>`
    }
    if (data.franchiseType) {
      content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">合作類型</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.franchiseType}</td>
      </tr>`
    }
  }

  if (data.message) {
    content += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; vertical-align: top;">留言內容</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; white-space: pre-wrap;">${data.message}</td>
      </tr>`
  }

  content += `
      <tr>
        <td style="padding: 10px; font-weight: bold;">提交時間</td>
        <td style="padding: 10px;">${data.createdAt.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</td>
      </tr>
    </table>
  </div>

  <div style="padding: 20px; background: #2A5269; color: white; text-align: center;">
    <p style="margin: 0;">
      <a href="${siteUrl}/admin/leads"
         style="color: #FB720A; text-decoration: none; font-weight: bold;">
        前往後台查看詳情 →
      </a>
    </p>
  </div>

  <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
    此郵件由系統自動發送，請勿直接回覆。
  </div>
</div>
`

  try {
    await transporter.sendMail({
      from: `"練健康" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject,
      html: content,
    })
    console.log(`Lead notification email sent to: ${recipients.join(', ')}`)
    return true
  } catch (error) {
    console.error('Failed to send lead notification email:', error)
    return false
  }
}

// Form confirmation config
const formConfirmationConfig: Record<string, {
  subject: string
  title: string
  greeting: string
  message: string
  closing: string
}> = {
  booking: {
    subject: '【練健康】感謝您的預約',
    title: '預約確認',
    greeting: '感謝您預約練健康的體驗課程！',
    message: '我們已收到您的預約申請，將盡快與您聯繫確認時間。',
    closing: '如有任何問題，歡迎直接回覆此信或致電分店。<br>我們期待與您見面！',
  },
  cooperation: {
    subject: '【練健康】感謝您的合作洽詢',
    title: '洽詢確認',
    greeting: '感謝您對練健康的關注與洽詢！',
    message: '我們已收到您的合作洽詢，專人將於 3-5 個工作天內與您聯繫。',
    closing: '如有緊急需求，歡迎直接來電洽詢。<br>期待與您的合作！',
  },
  franchise: {
    subject: '【練健康】感謝您的加盟洽詢',
    title: '加盟洽詢確認',
    greeting: '感謝您對練健康加盟的興趣！',
    message: '我們已收到您的加盟洽詢，加盟專員將於 3 個工作天內與您聯繫，提供詳細的加盟說明。',
    closing: '如有任何問題，歡迎直接回覆此信。<br>期待與您攜手共創健康事業！',
  },
}

interface FormConfirmationData {
  type: 'booking' | 'cooperation' | 'franchise'
  name: string
  email: string
  details?: Array<{ label: string; value: string }>
}

// Send form confirmation email to submitter
export async function sendFormConfirmation(data: FormConfirmationData) {
  const transporter = await createTransporter()
  if (!transporter) {
    console.log('Email transporter not configured, skipping confirmation')
    return false
  }

  const config = formConfirmationConfig[data.type]
  if (!config) {
    console.error(`Unknown form type: ${data.type}`)
    return false
  }

  let detailsHtml = ''
  if (data.details && data.details.length > 0) {
    detailsHtml = `
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
      ${data.details.map(d => `<p style="margin: 0 0 10px 0; color: #666;"><strong>${d.label}：</strong>${d.value}</p>`).join('')}
    </div>`
  }

  const content = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2A5269; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">${config.title}</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
      ${data.name} 您好，
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.8;">
      ${config.greeting}<br>
      ${config.message}
    </p>
    ${detailsHtml}
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      ${config.closing}
    </p>
  </div>

  <div style="padding: 20px; background: #2A5269; color: white; text-align: center;">
    <p style="margin: 0; font-size: 14px;">
      練健康｜中高齡肌力訓練專家
    </p>
    <p style="margin: 10px 0 0 0;">
      <a href="https://l-kk.tw" style="color: #FB720A; text-decoration: none;">
        l-kk.tw
      </a>
    </p>
  </div>
</div>
`

  try {
    await transporter.sendMail({
      from: `"練健康" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.email,
      subject: config.subject,
      html: content,
    })
    console.log(`[${data.type}] Confirmation sent to: ${data.email}`)
    return true
  } catch (error) {
    console.error(`Failed to send ${data.type} confirmation:`, error)
    return false
  }
}

// Booking confirmation helper —— 給填單人的確認信，帶完整表單填寫內容（對齊管理者通知信）
export async function sendBookingConfirmation(data: {
  name: string
  email: string
  phone?: string
  gender?: string
  birthDate?: string
  line?: string
  filledBySelf?: boolean
  relationship?: string
  bookerName?: string
  contactPhone?: string
  hasMedicalCondition?: boolean
  medicalConditionNote?: string
  storeName: string
  preferredTime: string[]
  paymentMethod?: string
  exerciseGoals?: string[]
  exerciseGoalOther?: string
  sources?: string[]
}) {
  const details: Array<{ label: string; value: string }> = []

  // 學員資料
  if (data.phone) details.push({ label: '電話', value: data.phone })
  if (data.email) details.push({ label: 'Email', value: data.email })
  if (data.gender) details.push({ label: '性別', value: data.gender })
  if (data.birthDate) details.push({ label: '出生年月日', value: data.birthDate })
  if (data.line) details.push({ label: 'LINE ID', value: data.line })

  // 填表人（代填）
  if (data.filledBySelf === false) {
    details.push({ label: '填表人', value: '親友代為填寫' })
    if (data.relationship) details.push({ label: '與學員關係', value: data.relationship })
    if (data.bookerName) details.push({ label: '填表人姓名', value: data.bookerName })
    if (data.contactPhone) details.push({ label: '聯絡電話', value: data.contactPhone })
  }

  // 健康狀況
  if (data.hasMedicalCondition) {
    let v = '有特殊健康狀況'
    if (data.medicalConditionNote) v += `（${data.medicalConditionNote}）`
    details.push({ label: '健康狀況', value: v })
  }

  // 預約資訊
  details.push({ label: '預約分店', value: data.storeName })
  if (data.preferredTime && data.preferredTime.length > 0) {
    details.push({ label: '方便聯繫時段', value: data.preferredTime.join('、') })
  }
  const feeLabel = bookingFeeLabel(data.birthDate, data.paymentMethod)
  if (feeLabel) details.push({ label: '付款方式', value: feeLabel })

  if (data.exerciseGoals && data.exerciseGoals.length > 0) {
    let goalsText = data.exerciseGoals.join('、')
    if (data.exerciseGoalOther) goalsText += `（其他：${data.exerciseGoalOther}）`
    details.push({ label: '訓練目的', value: goalsText })
  }
  if (data.sources && data.sources.length > 0) {
    details.push({ label: '得知管道', value: data.sources.join('、') })
  }

  return sendFormConfirmation({
    type: 'booking',
    name: data.name,
    email: data.email,
    details,
  })
}

// Cooperation confirmation helper
export async function sendCooperationConfirmation(data: {
  name: string
  email: string
  organization: string
  cooperationType: string
}) {
  return sendFormConfirmation({
    type: 'cooperation',
    name: data.name,
    email: data.email,
    details: [
      { label: '公司/單位', value: data.organization },
      { label: '洽詢類型', value: data.cooperationType },
    ],
  })
}

// Franchise confirmation helper
export async function sendFranchiseConfirmation(data: {
  name: string
  email: string
  region?: string
  investmentBudget?: string
}) {
  const details: Array<{ label: string; value: string }> = []
  if (data.region) details.push({ label: '有興趣地區', value: data.region })
  if (data.investmentBudget) details.push({ label: '投資預算', value: data.investmentBudget })

  return sendFormConfirmation({
    type: 'franchise',
    name: data.name,
    email: data.email,
    details: details.length > 0 ? details : undefined,
  })
}
