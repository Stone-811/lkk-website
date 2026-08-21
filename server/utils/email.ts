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
  group_class: '團體課報名',
}

// 體驗費標示：一律以「使用者實際勾選的付款方式」為權威依據，信件與表單勾選一致。
// （50 歲以上仍可自行選擇臨櫃付款；未勾選時才退回用出生年月的年齡推算。）
//
// ⚠️ 不可再用 company 當「免費」的判斷依據（2026-08-21 移除該特例）：
// company 只代表「這筆來自廠商連結」，不代表免費——例如 abbott(亞培) 沒有
// allAgesFree、走標準 50 歲條件，未滿 50 歲是真的要付 $500。全齡免費的變體
// （如 nanshan）在 booking.vue 會自動把 paymentMethod 設成「活動免費」，
// 因此靠 paymentMethod 就能正確分辨，不需要也不應該再看 company。
function bookingFeeLabel(birthDate?: string, paymentMethod?: string): string | null {
  // 優先依使用者勾選的付款方式
  if (paymentMethod) {
    if (paymentMethod === '臨櫃付款') return '臨櫃付款 $500'
    if (paymentMethod === '50歲以上免費') return '50 歲以上免費體驗'
    if (paymentMethod === '活動免費') return '活動免費'
    return paymentMethod // 其他未知值：原樣顯示
  }
  // 沒帶付款方式時（保險）才退回用年齡推算
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
  return null
}

interface LeadNotificationData {
  type: 'booking' | 'franchise' | 'cooperation' | 'group_class'
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
  company?: string
  leadSource?: string
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
  // Group class specific fields
  desiredClass?: string
  age?: string
  ageRange?: string
  courseName?: string
  experience?: string
  medicalHistory?: string
  groupTime?: string
  isFillerSelf?: string
  fillerName?: string
}

// 通知信表格列產生器（54 列共用；變化型以 opts 控制，輸出與舊版逐字元相同）
// wide=首列固定欄寬 / top=label 靠上 / pre=value 保留換行 /
// tone: 'warn' 黃底（代填提醒）、'danger' 紅底（健康狀況警示） / last=末列（無底線）
function notifRow(
  label: string,
  value: string | number,
  opts: { wide?: boolean; top?: boolean; pre?: boolean; tone?: 'warn' | 'danger'; last?: boolean } = {},
): string {
  if (opts.last) {
    return `
      <tr>
        <td style="padding: 10px; font-weight: bold;">${label}</td>
        <td style="padding: 10px;">${value}</td>
      </tr>`
  }
  const tone =
    opts.tone === 'warn'
      ? ' background: #fff3cd;'
      : opts.tone === 'danger'
        ? ' background: #f8d7da; color: #721c24;'
        : ''
  return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;${opts.top ? ' vertical-align: top;' : ''}${opts.wide ? ' width: 120px;' : ''}${tone}">${label}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;${opts.pre ? ' white-space: pre-wrap;' : ''}${tone}">${value}</td>
      </tr>`
}

// 純函式：組管理者通知信的主旨與 HTML（不碰 SMTP/Firestore，供寄信與快照驗證使用）
export function buildLeadNotificationEmail(data: LeadNotificationData): { subject: string; html: string } {
  const typeLabel = leadTypeLabels[data.type] || data.type
  const subject = `【練健康】新${typeLabel}表單${data.company ? `【${data.company}】` : ''} - ${data.name}`
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://l-kk.tw'

  // 有值才輸出該列（對應舊版逐列的 if 判斷）
  const opt = (
    label: string,
    value?: string | number | null,
    opts?: Parameters<typeof notifRow>[2],
  ) => (value ? notifRow(label, value, opts) : '')

  let rows = notifRow('表單類型', typeLabel, { wide: true })
  rows += notifRow('姓名', data.name)
  rows += notifRow('電話', data.phone)
  rows += opt('Email', data.email)
  rows += opt('公司/單位', data.organization)
  rows += opt('洽詢類型', data.cooperationType)
  rows += opt(data.type === 'group_class' ? '上課門店' : '選擇分店', data.storeName)

  // Group class specific fields
  if (data.type === 'group_class') {
    rows += opt('報名課程', data.courseName || data.desiredClass, { pre: true })
    rows += opt('學員性別', data.gender, { pre: true })
    rows += opt('學員年齡區間', data.ageRange || data.age, { pre: true })
    if (data.isFillerSelf === '否') {
      rows += opt('代填者姓名', data.fillerName, { pre: true })
      rows += opt('與學員關係', data.relationship, { pre: true })
    }
    rows += opt('偏好時段', data.groupTime, { pre: true })
    rows += opt('重訓經驗', data.experience, { pre: true })
    rows += opt('疾病／舊傷／開刀史', data.medicalHistory, { pre: true })
    if (data.sources && data.sources.length) rows += notifRow('得知管道', data.sources.join('、'), { pre: true })
  }

  // Booking specific fields
  if (data.type === 'booking') {
    rows += opt('性別', data.gender)
    rows += opt('出生年月', data.birthDate)
    rows += opt('LINE ID', data.line)
    // Booker info (代填者資訊)
    if (data.filledBySelf === false) {
      rows += notifRow('填表人', '代為填寫', { tone: 'warn' })
      rows += opt('與學員關係', data.relationship)
      rows += opt('填表人姓名', data.bookerName)
      rows += opt('聯絡電話', data.contactPhone)
    }
    // Medical condition (健康狀況)
    if (data.hasMedicalCondition) {
      rows += notifRow('健康狀況', '有特殊健康狀況', { tone: 'danger' })
      rows += opt('健康狀況說明', data.medicalConditionNote, { top: true, pre: true })
    }
    if (data.preferredTime && data.preferredTime.length > 0) {
      rows += notifRow('方便聯繫時段', data.preferredTime.join('、'))
    }
    rows += opt('付款方式', bookingFeeLabel(data.birthDate, data.paymentMethod))
    if (data.exerciseGoals && data.exerciseGoals.length > 0) {
      let goalsText = data.exerciseGoals.join('、')
      if (data.exerciseGoalOther) {
        goalsText += `（其他：${data.exerciseGoalOther}）`
      }
      rows += notifRow('運動目的', goalsText)
    }
    if (data.sources && data.sources.length > 0) {
      rows += notifRow('得知管道', data.sources.join('、'))
    }
  }

  // Cooperation specific fields
  if (data.type === 'cooperation') {
    rows += opt('LINE ID', data.lineId)
    rows += opt('公司規模', data.companySize)
    rows += opt('預算區間', data.budgetRange)
  }

  // Franchise specific fields
  if (data.type === 'franchise') {
    rows += opt('目標區域', data.region)
    rows += opt('合作類型', data.franchiseType)
  }

  rows += opt('留言內容', data.message, { top: true, pre: true })
  rows += notifRow('提交時間', data.createdAt.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), { last: true })

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2A5269; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">新${typeLabel}通知</h1>
  </div>
  ${(data.company || data.leadSource) ? `
  <div style="background: #FB720A; color: white; padding: 12px 20px; font-size: 15px; font-weight: bold; text-align: center;">
    活動來源：${[data.company, data.leadSource].filter(Boolean).join(' · ')}
  </div>` : ''}

  <div style="padding: 20px; background: #f9f9f9;">
    <table style="width: 100%; border-collapse: collapse;">${rows}
    </table>
  </div>

  <div style="padding: 20px; background: #2A5269; color: white; text-align: center;">
    <p style="margin: 0;">
      <a href="${siteUrl}${data.type === 'group_class' ? '/admin/group-classes' : '/admin/leads'}"
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

  return { subject, html }
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

  const { subject, html } = buildLeadNotificationEmail(data)

  try {
    await transporter.sendMail({
      from: `"練健康" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject,
      html,
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
  group_class: {
    subject: '【練健康】感謝您報名團體課程',
    title: '團體課程報名確認',
    greeting: '感謝您報名練健康的團體課程！',
    message: '我們已收到您的報名資料。由於團體課程需依當期名額與人數安排梯次，教練將於 1 個工作天內主動與您聯繫，確認可開班的梯次日期、名額狀況與繳費方式。',
    closing: '想更快確認梯次，歡迎加入練健康 LINE 官方帳號 <a href="https://line.me/R/ti/p/%40201fzruh" style="color:#FB720A;">@201fzruh</a>，傳送學員姓名與想上的課程。<br>期待在課堂上見到您！',
  },
}

interface FormConfirmationData {
  type: 'booking' | 'cooperation' | 'franchise' | 'group_class'
  name: string
  email: string
  details?: Array<{ label: string; value: string }>
  sections?: Array<{ title: string; rows: Array<{ label: string; value: string }> }>
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
  if (data.sections && data.sections.length > 0) {
    // 分區塊版型（每區一個標題列 + 欄位），比照後台名單詳情
    detailsHtml = data.sections
      .filter((s) => s.rows && s.rows.length > 0)
      .map(
        (section) => `
    <div style="background: white; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e2e2; overflow: hidden;">
      <div style="background: #f1f5f7; padding: 10px 16px; border-bottom: 1px solid #e2e2e2; font-weight: bold; color: #2A5269; font-size: 14px;">${section.title}</div>
      <div style="padding: 14px 16px;">
        ${section.rows
          .map(
            (d) =>
              `<p style="margin: 0 0 8px 0; color: #444; font-size: 14px; line-height: 1.6;"><strong style="color: #888; font-weight: 600;">${d.label}：</strong>${d.value}</p>`
          )
          .join('')}
      </div>
    </div>`
      )
      .join('')
  } else if (data.details && data.details.length > 0) {
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
  company?: string
  leadSource?: string
  exerciseGoals?: string[]
  exerciseGoalOther?: string
  sources?: string[]
  message?: string
}) {
  // 學員資料
  const studentRows: Array<{ label: string; value: string }> = [
    { label: '姓名', value: data.name },
  ]
  if (data.phone) studentRows.push({ label: '電話', value: data.phone })
  if (data.email) studentRows.push({ label: 'Email', value: data.email })
  if (data.gender) studentRows.push({ label: '性別', value: data.gender })
  if (data.birthDate) studentRows.push({ label: '出生年月日', value: data.birthDate })
  if (data.line) studentRows.push({ label: 'LINE ID', value: data.line })

  // 填表人資料（僅代填時顯示）
  const fillerRows: Array<{ label: string; value: string }> = []
  if (data.filledBySelf === false) {
    fillerRows.push({ label: '填表人', value: '親友代為填寫' })
    if (data.relationship) fillerRows.push({ label: '與學員關係', value: data.relationship })
    if (data.bookerName) fillerRows.push({ label: '填表人姓名', value: data.bookerName })
    if (data.contactPhone) fillerRows.push({ label: '聯絡電話', value: data.contactPhone })
  }

  // 健康狀況
  const healthRows: Array<{ label: string; value: string }> = [
    {
      label: '健康狀況',
      value: data.hasMedicalCondition
        ? '有特殊健康狀況' + (data.medicalConditionNote ? `（${data.medicalConditionNote}）` : '')
        : '無特殊健康狀況',
    },
  ]

  // 預約資訊
  const bookingRows: Array<{ label: string; value: string }> = [
    { label: '預約分店', value: data.storeName },
  ]
  if (data.preferredTime && data.preferredTime.length > 0) {
    bookingRows.push({ label: '方便聯繫時段', value: data.preferredTime.join('、') })
  }
  const feeLabel = bookingFeeLabel(data.birthDate, data.paymentMethod)
  if (feeLabel) bookingRows.push({ label: '付款方式', value: feeLabel })
  if (data.exerciseGoals && data.exerciseGoals.length > 0) {
    let goalsText = data.exerciseGoals.join('、')
    if (data.exerciseGoalOther) goalsText += `（其他：${data.exerciseGoalOther}）`
    bookingRows.push({ label: '訓練目的', value: goalsText })
  }
  if (data.sources && data.sources.length > 0) {
    bookingRows.push({ label: '得知管道', value: data.sources.join('、') })
  }
  if (data.message) {
    bookingRows.push({ label: '備註', value: data.message })
  }

  return sendFormConfirmation({
    type: 'booking',
    name: data.name,
    email: data.email,
    sections: [
      { title: '學員資料', rows: studentRows },
      { title: '填表人資料', rows: fillerRows },
      { title: '健康狀況', rows: healthRows },
      { title: '預約資訊', rows: bookingRows },
    ],
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

// Group class confirmation helper —— 給填單人的確認信，帶完整表單填寫內容（版型對齊 sendBookingConfirmation）
export async function sendGroupClassConfirmation(data: {
  name: string
  email: string
  phone?: string
  gender?: string
  ageRange?: string
  isFillerSelf?: string
  fillerName?: string
  relationship?: string
  courseName?: string
  coursePrice?: string
  storeName?: string
  preferredTime?: string
  experience?: string
  medicalHistory?: string
  sources?: string[]
  message?: string
  company?: string
}) {
  // 學員資料
  const studentRows: Array<{ label: string; value: string }> = [
    { label: '姓名', value: data.name },
  ]
  if (data.phone) studentRows.push({ label: '電話', value: data.phone })
  if (data.email) studentRows.push({ label: 'Email', value: data.email })
  if (data.gender) studentRows.push({ label: '性別', value: data.gender })
  if (data.ageRange) studentRows.push({ label: '年齡區間', value: data.ageRange })

  // 填表人資料（僅代填時顯示）
  const fillerRows: Array<{ label: string; value: string }> = []
  if (data.isFillerSelf === '否') {
    fillerRows.push({ label: '填表人', value: '親友代為填寫' })
    if (data.fillerName) fillerRows.push({ label: '填表人姓名', value: data.fillerName })
    if (data.relationship) fillerRows.push({ label: '與學員關係', value: data.relationship })
  }

  // 健康狀況
  const healthRows: Array<{ label: string; value: string }> = []
  if (data.medicalHistory) healthRows.push({ label: '疾病／舊傷／開刀史', value: data.medicalHistory })
  if (data.experience) healthRows.push({ label: '重訓經驗', value: data.experience })

  // 報名資訊
  const classRows: Array<{ label: string; value: string }> = []
  if (data.courseName) {
    classRows.push({
      label: '報名課程',
      value: data.courseName + (data.coursePrice ? `（${data.coursePrice}／4 堂一期）` : ''),
    })
  }
  if (data.storeName) classRows.push({ label: '上課門店', value: data.storeName })
  if (data.preferredTime) classRows.push({ label: '偏好時段', value: data.preferredTime })
  if (data.sources && data.sources.length > 0) {
    classRows.push({ label: '得知管道', value: data.sources.join('、') })
  }
  if (data.message) classRows.push({ label: '備註', value: data.message })

  return sendFormConfirmation({
    type: 'group_class',
    name: data.name,
    email: data.email,
    sections: [
      { title: '學員資料', rows: studentRows },
      { title: '填表人資料', rows: fillerRows },
      { title: '健康狀況', rows: healthRows },
      { title: '報名資訊', rows: classRows },
    ],
  })
}
