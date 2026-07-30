import { getDb, docsToArray, LecturerDoc } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  try {
    console.log('[Admin Lecturers GET] Connecting to Firestore...')
    const db = await getDb()
    console.log('[Admin Lecturers GET] Firestore connected, querying lecturers...')

    const query = getQuery(event)
    const type = query.type as string | undefined

    let lecturersQuery = db.collection('lecturers').orderBy('sortOrder', 'asc')

    if (type) {
      lecturersQuery = db
        .collection('lecturers')
        .where('type', '==', type)
        .orderBy('sortOrder', 'asc')
    }

    const lecturersSnapshot = await lecturersQuery.get()
    console.log(`[Admin Lecturers GET] Found ${lecturersSnapshot.size} lecturers in Firestore`)
    const lecturers = docsToArray<LecturerDoc>(lecturersSnapshot)

    return {
      success: true,
      data: lecturers,
      _debug: {
        source: 'firestore',
        count: lecturers.length,
      },
    }
  } catch (error: any) {
    console.error('[Admin Lecturers GET] Error:', error.message)
    console.error('[Admin Lecturers GET] Full error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: `Firestore 錯誤: ${error.message}`,
    })
  }
})
