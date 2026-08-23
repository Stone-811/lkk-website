export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const {
      // 學員資料
      name,
      phone,
      email,
      gender,
      birthDate,
      line,
      // 填寫者資料
      filledBySelf,
      relationship,
      bookerName,
      contactPhone,
      // 健康狀況
      hasMedicalCondition,
      medicalConditionNote,
      // 預約資訊
      storeId,
      preferredTime,
      sources,
      paymentMethod,
      exerciseGoals,
      exerciseGoalOther,
      message,
      sourcePage,
    } = body

    // Validate required fields
    const hasPreferredTime = Array.isArray(preferredTime) ? preferredTime.length > 0 : !!preferredTime
    if (!name || !phone || !storeId || !hasPreferredTime) {
      setResponseStatus(event, 400)
      return { success: false, error: '請填寫必要欄位' }
    }

    // Validate phone format
    if (!/^09\d{8}$/.test(phone)) {
      setResponseStatus(event, 400)
      return { success: false, error: '手機號碼格式不正確' }
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Email 格式不正確' }
    }

    // Normalize preferredTime to array
    const preferredTimeArray = Array.isArray(preferredTime) ? preferredTime : [preferredTime]

    // Create lead in Firestore
    const { createLead } = await import('~/server/utils/leads')
    const leadId = await createLead({
      type: 'booking',
      name,
      phone,
      email: email || null,
      storeId,
      sourcePage: sourcePage || '/booking',
      sourceChannel: Array.isArray(sources) ? sources.join(', ') : sources || null,
      message: message || null,
      payload: {
        // 學員資料
        gender: gender || null,
        birthDate: birthDate || null,
        line: line || null,
        // 填寫者資料
        filledBySelf: filledBySelf ?? null,
        relationship: relationship || null,
        bookerName: bookerName || null,
        contactPhone: contactPhone || phone,
        // 健康狀況
        hasMedicalCondition: hasMedicalCondition ?? null,
        medicalConditionNote: medicalConditionNote || null,
        // 預約資訊
        preferredTime: preferredTimeArray,
        paymentMethod: paymentMethod || null,
        exerciseGoals: exerciseGoals || [],
        exerciseGoalOther: exerciseGoalOther || null,
        sources: sources || [],
        utm: body.utm || null,
        // 廠商變體表單（?v=）：來源標記，方便後台辨識活動來源
        formVariant: body.formVariant || null,
        company: body.company || null,
        leadSource: body.leadSource || null,
      },
    })

    // Get store name for logging
    let storeName = ''
    try {
      const { getDb } = await import('~/server/utils/firebase')
      const db = await getDb()
      const storeDoc = await db.collection('stores').doc(storeId).get()
      if (storeDoc.exists) {
        storeName = storeDoc.data()?.name || ''
      }
    } catch (e) {
      console.warn('Could not fetch store name:', e)
    }

    console.log('New booking lead:', {
      id: leadId,
      name,
      phone,
      email,
      storeId,
      storeName,
      line,
      paymentMethod,
    })

    // Send email notifications (non-blocking)
    try {
      const { sendLeadNotification, sendBookingConfirmation } = await import('~/server/utils/email')

      // Notify admins with full form data
      sendLeadNotification({
        type: 'booking',
        name,
        phone,
        email,
        storeName,
        message,
        createdAt: new Date(),
        // Booking specific fields
        gender,
        birthDate,
        line,
        filledBySelf,
        relationship,
        bookerName,
        contactPhone,
        hasMedicalCondition,
        medicalConditionNote,
        preferredTime: preferredTimeArray,
        paymentMethod,
        exerciseGoals: Array.isArray(exerciseGoals) ? exerciseGoals : [],
        exerciseGoalOther,
        sources: Array.isArray(sources) ? sources : sources ? [sources] : [],
        company: body.company,
        leadSource: body.leadSource,
      }).catch(err => console.error('Failed to send admin notification:', err))

      // Send confirmation to customer with the full submitted details (if email provided)
      if (email) {
        sendBookingConfirmation({
          name,
          email,
          phone,
          gender,
          birthDate,
          line,
          filledBySelf,
          relationship,
          bookerName,
          contactPhone,
          hasMedicalCondition,
          medicalConditionNote,
          storeName,
          preferredTime: preferredTimeArray,
          paymentMethod,
          exerciseGoals: Array.isArray(exerciseGoals) ? exerciseGoals : [],
          exerciseGoalOther,
          sources: Array.isArray(sources) ? sources : sources ? [sources] : [],
          message,
          company: body.company,
        }).catch(err => console.error('Failed to send booking confirmation:', err))
      }
    } catch (emailError) {
      console.error('Email module error:', emailError)
    }

    return {
      success: true,
      message: '預約成功，我們將盡快與您聯繫',
    }
  } catch (error: any) {
    console.error('Booking API error:', error)
    setResponseStatus(event, 500)
    return { success: false, error: '系統錯誤，請稍後再試' }
  }
})
