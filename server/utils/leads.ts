// 表單名單共用寫入：四支 /api/leads/*.post.ts 的 Firestore 寫入樣板集中一處。
// 只負責寫入——欄位值由呼叫端「先正規化好」原樣傳入（本函式不再 || null，
// 避免與各表單原有語意漂移）；驗證與寄信留在各 API。回傳新文件 id。
export interface CreateLeadInput {
  type: 'booking' | 'franchise' | 'cooperation' | 'group_class'
  name: string
  phone: string
  email: string | null
  storeId: string | null
  sourcePage: string
  sourceChannel: string | null
  message: string | null
  payload: Record<string, unknown>
}

export async function createLead(input: CreateLeadInput): Promise<string> {
  const { getDb, getTimestamp } = await import('~/server/utils/firebase')
  const db = await getDb()
  const Timestamp = await getTimestamp()

  const now = Timestamp.now()
  const leadRef = db.collection('leads').doc()
  await leadRef.set({
    type: input.type,
    name: input.name,
    phone: input.phone,
    email: input.email,
    storeId: input.storeId,
    sourcePage: input.sourcePage,
    sourceChannel: input.sourceChannel,
    message: input.message,
    payload: input.payload,
    status: 'new',
    internalNote: null,
    createdAt: now,
    updatedAt: now,
  })
  return leadRef.id
}
