import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

// Helper function to delete all records
async function deleteAllRecords(db: FirebaseFirestore.Firestore): Promise<number> {
  const recordsRef = db.collection('lkk4_records')
  const snapshot = await recordsRef.get()

  if (snapshot.empty) {
    return 0
  }

  const batchSize = 500
  let totalDeleted = 0
  const docs = snapshot.docs

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch()
    const chunk = docs.slice(i, i + batchSize)

    for (const doc of chunk) {
      batch.delete(doc.ref)
    }

    await batch.commit()
    totalDeleted += chunk.length
  }

  return totalDeleted
}

// Delete all records (for manual cleanup)
export default defineEventHandler(async (event) => {
  try {
    // Verify admin session
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const db = await getDb()
    const totalDeleted = await deleteAllRecords(db)

    return {
      success: true,
      message: totalDeleted > 0 ? `成功刪除 ${totalDeleted} 筆資料` : '沒有資料需要刪除',
      count: totalDeleted,
    }
  } catch (error: any) {
    console.error('Error deleting LKK4 records:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '刪除失敗，請稍後再試',
    })
  }
})
