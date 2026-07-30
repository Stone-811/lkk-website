import { getDb, LecturerDoc, docsToArray } from '~/server/utils/firebase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as string | undefined

  try {
    console.log('[Public Lecturers GET] Connecting to Firestore...')
    const db = await getDb()
    console.log('[Public Lecturers GET] Firestore connected')

    let lecturersQuery = db
      .collection('lecturers')
      .where('isActive', '==', true)
      .orderBy('sortOrder', 'asc')

    if (type && ['lkk', 'partner', 'overseas'].includes(type)) {
      console.log(`[Public Lecturers GET] Filtering by type: ${type}`)
      lecturersQuery = db
        .collection('lecturers')
        .where('type', '==', type)
        .where('isActive', '==', true)
        .orderBy('sortOrder', 'asc')
    }

    const lecturersSnapshot = await lecturersQuery.get()
    console.log(`[Public Lecturers GET] Found ${lecturersSnapshot.size} lecturers in Firestore`)
    const lecturers = docsToArray<LecturerDoc>(lecturersSnapshot)

    const lecturersData = lecturers.map((lecturer) => ({
      id: lecturer.id,
      name: lecturer.name,
      slug: lecturer.slug,
      photo: lecturer.photo,
      title: lecturer.title,
      organization: lecturer.organization,
      region: lecturer.region,
      countries: lecturer.countries || [],
      type: lecturer.type,
      description: lecturer.description,
      specialties: lecturer.specialties || [],
      courses: lecturer.courses || [],
      certifications: lecturer.certifications || [],
    }))

    return {
      success: true,
      data: lecturersData,
      _debug: {
        source: 'firestore',
        count: lecturersData.length,
      },
    }
  } catch (error: any) {
    console.error('[Public Lecturers GET] Error:', error.message)
    console.error('[Public Lecturers GET] Full error:', error)
    return {
      success: true,
      data: [],
      _debug: {
        source: 'error',
        error: error.message,
      },
    }
  }
})
