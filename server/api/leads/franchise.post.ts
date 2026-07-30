export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const {
      name,
      organization,
      email,
      phone,
      region,
      cooperationType,
      message,
      sourcePage,
    } = body

    // Validate required fields
    if (!name || !phone || !email) {
      setResponseStatus(event, 400)
      return { success: false, error: '請填寫必要欄位' }
    }

    // Validate phone format (Taiwan mobile or landline)
    const phoneRegex = /^(09\d{8}|0\d{1,2}-?\d{3,4}-?\d{4})$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setResponseStatus(event, 400)
      return { success: false, error: '電話格式不正確' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setResponseStatus(event, 400)
      return { success: false, error: '電子郵件格式不正確' }
    }

    // Dynamic import to avoid bundling issues
    const { getDb, getTimestamp } = await import('~/server/utils/firebase')
    const db = await getDb()
    const Timestamp = await getTimestamp()

    // Create lead in Firestore
    const now = Timestamp.now()
    const leadRef = db.collection('leads').doc()
    const leadData = {
      type: 'franchise',
      name,
      phone,
      email: email || null,
      storeId: null,
      sourcePage: sourcePage || '/franchise',
      sourceChannel: null,
      message: message || null,
      payload: {
        organization: organization || null,
        region: region || null,
        cooperationType: cooperationType || null,
      },
      status: 'new',
      internalNote: null,
      createdAt: now,
      updatedAt: now,
    }

    await leadRef.set(leadData)

    console.log('New franchise lead:', {
      id: leadRef.id,
      name,
      organization,
      region,
    })

    // Send email notifications (non-blocking)
    try {
      const { sendLeadNotification, sendFranchiseConfirmation } = await import('~/server/utils/email')

      // Notify admins with full form data
      sendLeadNotification({
        type: 'franchise',
        name,
        phone,
        email,
        organization,
        message,
        createdAt: new Date(),
        // Franchise specific fields
        region,
        franchiseType: cooperationType,
      }).catch(err => console.error('Failed to send admin notification:', err))

      // Send confirmation to customer
      sendFranchiseConfirmation({
        name,
        email,
        region,
      }).catch(err => console.error('Failed to send franchise confirmation:', err))
    } catch (emailError) {
      console.error('Email module error:', emailError)
    }

    return {
      success: true,
      message: '表單已送出，我們將盡快與您聯繫',
    }
  } catch (error: any) {
    console.error('Franchise API error:', error)
    setResponseStatus(event, 500)
    return { success: false, error: '系統錯誤，請稍後再試' }
  }
})
