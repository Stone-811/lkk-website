// 團體課報名表單 → 寫入 type:'group_class' 名單（後台「團課預約」/admin/group-classes 讀取）＋寄管理者通知信
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, phone, email, storeId, desiredClass, age, message, sourcePage } = body

    // 必填
    if (!name || !phone || !storeId || !desiredClass) {
      setResponseStatus(event, 400)
      return { success: false, error: '請填寫必要欄位' }
    }
    if (!/^09\d{8}$/.test(phone)) {
      setResponseStatus(event, 400)
      return { success: false, error: '手機號碼格式不正確' }
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResponseStatus(event, 400)
      return { success: false, error: 'Email 格式不正確' }
    }

    const { getDb, getTimestamp } = await import('~/server/utils/firebase')
    const db = await getDb()
    const Timestamp = await getTimestamp()

    const now = Timestamp.now()
    const leadRef = db.collection('leads').doc()
    await leadRef.set({
      type: 'group_class',
      name,
      phone,
      email: email || null,
      storeId,
      sourcePage: sourcePage || '/group-booking',
      sourceChannel: null,
      message: message || null,
      payload: {
        desiredClass: desiredClass || null,
        age: age || null,
        utm: body.utm || null,
      },
      status: 'new',
      internalNote: null,
      createdAt: now,
      updatedAt: now,
    })

    // 取得分店名稱（通知信用）
    let storeName = ''
    try {
      const storeDoc = await db.collection('stores').doc(storeId).get()
      if (storeDoc.exists) storeName = storeDoc.data()?.name || ''
    } catch (e) {
      console.warn('Could not fetch store name:', e)
    }

    console.log('New group_class lead:', { id: leadRef.id, name, phone, storeId, storeName, desiredClass })

    // 管理者通知信（非阻塞）
    try {
      const { sendLeadNotification } = await import('~/server/utils/email')
      sendLeadNotification({
        type: 'group_class',
        name,
        phone,
        email,
        storeName,
        message,
        desiredClass,
        age,
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
