// 團體課報名表單 → 寫入 type:'group_class' 名單（後台「團課預約」/admin/group-classes 讀取）＋寄管理者通知信
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      name,
      gender,
      ageRange,
      phone,
      email,
      isFillerSelf,
      fillerName,
      relationship,
      course,
      store,
      preferredTime,
      experience,
      medicalHistory,
      source,
      note,
      sourcePage,
    } = body

    // 必填
    if (!name || !gender || !ageRange || !phone || !email || !isFillerSelf || !course || !store || !medicalHistory) {
      setResponseStatus(event, 400)
      return { success: false, error: '請填寫所有必填欄位（標有 * 的項目）' }
    }
    const normalizedPhone = String(phone).replace(/[\s-]/g, '')
    if (!/^09\d{8}$/.test(normalizedPhone)) {
      setResponseStatus(event, 400)
      return { success: false, error: '手機號碼格式不正確' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Email 格式不正確' }
    }
    if (isFillerSelf === '否' && (!fillerName || !relationship)) {
      setResponseStatus(event, 400)
      return { success: false, error: '請填寫報名者姓名與學員關係' }
    }

    const sourceArr = Array.isArray(source) ? source : source ? [source] : []
    // store 為完整字串（如「南京店｜台北市...」），取「｜」前的店名供後台/通知信顯示
    const storeName = String(store).split('｜')[0].trim()

    const { getDb, getTimestamp } = await import('~/server/utils/firebase')
    const db = await getDb()
    const Timestamp = await getTimestamp()

    const now = Timestamp.now()
    const leadRef = db.collection('leads').doc()
    await leadRef.set({
      type: 'group_class',
      name,
      phone: normalizedPhone,
      email: email || null,
      storeId: null,
      sourcePage: sourcePage || '/group-booking',
      sourceChannel: null,
      message: note || null,
      payload: {
        gender: gender || null,
        ageRange: ageRange || null,
        isFillerSelf: isFillerSelf || null,
        fillerName: isFillerSelf === '否' ? fillerName || null : null,
        relationship: isFillerSelf === '否' ? relationship || null : null,
        course: course || null,
        store: store || null,
        storeName: storeName || null,
        preferredTime: preferredTime || null,
        experience: experience || null,
        medicalHistory: medicalHistory || null,
        source: sourceArr,
        note: note || null,
        utm: body.utm || null,
      },
      status: 'new',
      internalNote: null,
      createdAt: now,
      updatedAt: now,
    })

    console.log('New group_class lead:', { id: leadRef.id, name, phone: normalizedPhone, course, storeName })

    // 管理者通知信（非阻塞）
    try {
      const { sendLeadNotification } = await import('~/server/utils/email')
      sendLeadNotification({
        type: 'group_class',
        name,
        phone: normalizedPhone,
        email,
        storeName,
        message: note,
        gender,
        ageRange,
        courseName: course,
        experience,
        medicalHistory,
        groupTime: preferredTime,
        isFillerSelf,
        fillerName,
        relationship,
        sources: sourceArr,
        createdAt: new Date(),
      }).catch((err) => console.error('Failed to send admin notification:', err))
    } catch (emailError) {
      console.error('Email module error:', emailError)
    }

    return { success: true, message: '報名成功，我們將盡快與您聯繫確認課程時間' }
  } catch (error: any) {
    console.error('Group class API error:', error)
    setResponseStatus(event, 500)
    return { success: false, error: '系統錯誤，請稍後再試' }
  }
})
