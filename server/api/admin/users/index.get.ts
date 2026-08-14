// 列出所有後台使用者（不含密碼雜湊）。僅 admin。
export default defineEventHandler(async (event) => {
  const { requireRole } = await import('~/server/utils/auth')
  await requireRole(event, ['admin'])

  const { getDb } = await import('~/server/utils/firebase')
  const db = await getDb()
  const snap = await db.collection('users').get()

  const toIso = (v: any) =>
    v?.toDate?.() ? v.toDate().toISOString() : (typeof v === 'string' ? v : null)

  const users = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      email: data.email ?? '',
      name: data.name ?? '',
      role: data.role ?? 'editor',
      storeId: data.storeId ?? null,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      isActive: data.isActive !== false,
      createdAt: toIso(data.createdAt),
    }
  })

  // createdAt 新到舊（缺 createdAt 者排最後）
  users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  return { success: true, data: users }
})
