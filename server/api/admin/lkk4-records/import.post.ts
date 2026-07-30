import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

interface LKK4Record {
  year: number
  competitionGroup: string
  teamName: string | null
  rank: number | null
  name: string
  gender: string
  bodyWeight: number | null
  firstAttempt: number | null
  firstAttemptResult: string | null
  secondAttempt: number | null
  secondAttemptResult: string | null
  thirdAttempt: number | null
  thirdAttemptResult: string | null
  finalScore: number
  ipfGlPoint: number
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

function parseNumber(value: string): number | null {
  if (!value || value === '' || value === 'n') return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

function parseRank(value: string): number | null {
  if (!value || value === '') return null
  const num = parseInt(value)
  return isNaN(num) ? null : num
}

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

export default defineEventHandler(async (event) => {
  try {
    // Verify admin session
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '未授權' })
    }

    const db = await getDb()

    const body = await readBody(event)
    const { csvData } = body

    if (!csvData || typeof csvData !== 'string') {
      throw createError({ statusCode: 400, message: '請提供 CSV 資料' })
    }

    // Parse CSV
    const lines = csvData.split('\n').filter((line: string) => line.trim())
    if (lines.length < 2) {
      throw createError({ statusCode: 400, message: 'CSV 資料格式錯誤' })
    }

    // Skip header row
    const dataLines = lines.slice(1)
    const records: LKK4Record[] = []

    for (const line of dataLines) {
      const fields = parseCSVLine(line)
      if (fields.length < 15) continue

      const [
        year,
        competitionGroup,
        teamName,
        rank,
        name,
        gender,
        bodyWeight,
        firstAttempt,
        firstAttemptResult,
        secondAttempt,
        secondAttemptResult,
        thirdAttempt,
        thirdAttemptResult,
        finalScore,
        ipfGlPoint,
      ] = fields

      // Skip empty names
      if (!name || name.trim() === '') continue

      records.push({
        year: parseInt(year) || 0,
        competitionGroup: competitionGroup || '',
        teamName: teamName || null,
        rank: parseRank(rank),
        name: name.trim(),
        gender: gender || '',
        bodyWeight: parseNumber(bodyWeight),
        firstAttempt: parseNumber(firstAttempt),
        firstAttemptResult: firstAttemptResult || null,
        secondAttempt: parseNumber(secondAttempt),
        secondAttemptResult: secondAttemptResult || null,
        thirdAttempt: parseNumber(thirdAttempt),
        thirdAttemptResult: thirdAttemptResult || null,
        finalScore: parseNumber(finalScore) || 0,
        ipfGlPoint: parseNumber(ipfGlPoint) || 0,
      })
    }

    if (records.length === 0) {
      throw createError({ statusCode: 400, message: '沒有有效的資料可匯入' })
    }

    // Delete existing records first (auto-overwrite mode)
    const deletedCount = await deleteAllRecords(db)

    // Write to Firestore in batches (max 500 per batch)
    const batchSize = 500
    let totalWritten = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = db.batch()
      const chunk = records.slice(i, i + batchSize)

      for (const record of chunk) {
        const docRef = db.collection('lkk4_records').doc()
        batch.set(docRef, {
          ...record,
          createdAt: new Date(),
        })
      }

      await batch.commit()
      totalWritten += chunk.length
    }

    return {
      success: true,
      message: deletedCount > 0
        ? `已覆蓋 ${deletedCount} 筆舊資料，成功匯入 ${totalWritten} 筆新資料`
        : `成功匯入 ${totalWritten} 筆資料`,
      count: totalWritten,
      deletedCount,
    }
  } catch (error: any) {
    console.error('Error importing LKK4 records:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '匯入失敗，請稍後再試',
    })
  }
})
