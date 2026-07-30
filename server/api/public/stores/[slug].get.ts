import { getDb, StoreDoc, CoachDoc, docsToArray } from '~/server/utils/firebase';
import { fallbackStores, fallbackCoaches } from '~/server/utils/fallback-data';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Store slug is required',
    });
  }

  try {
    const db = await getDb();

    // Find store by slug
    const storeSnapshot = await db
      .collection('stores')
      .where('slug', '==', slug)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (storeSnapshot.empty) {
      // Try fallback data
      const fallbackStore = fallbackStores.find(s => s.slug === slug);
      if (fallbackStore) {
        const coaches = fallbackCoaches[slug] || [];
        return {
          success: true,
          data: {
            ...fallbackStore,
            googleMapUrl: null,
            businessHours: null,
            transportation: null,
            heroImage: null,
            galleryImages: [],
            coaches: coaches.map(c => ({
              id: c.id,
              name: c.name,
              photo: c.photo,
              roleTitle: c.roleTitle,
              specialties: c.specialties || [],
              certifications: c.certifications || [],
              education: c.education || [],
              experiences: c.experiences || [],
            })),
          },
        };
      }

      throw createError({
        statusCode: 404,
        statusMessage: 'Store not found',
      });
    }

    const storeDoc = storeSnapshot.docs[0];
    const storeData = storeDoc.data() as StoreDoc;

    // Get coaches for this store
    const coachesSnapshot = await db
      .collection('coaches')
      .where('storeId', '==', storeDoc.id)
      .where('isActive', '==', true)
      .orderBy('sortOrder', 'asc')
      .get();

    const coaches = docsToArray<CoachDoc>(coachesSnapshot).map((coach) => ({
      id: coach.id,
      name: coach.name,
      slug: coach.slug,
      photo: coach.photo,
      roleTitle: coach.roleTitle,
      specialties: coach.specialties || [],
      certifications: coach.certifications || [],
      education: coach.education || [],
      experiences: coach.experiences || [],
      description: coach.description,
    }));

    return {
      success: true,
      data: {
        id: storeDoc.id,
        name: storeData.name,
        slug: storeData.slug,
        city: storeData.city,
        district: storeData.district,
        address: storeData.address,
        phone: storeData.phone,
        googleMapUrl: storeData.googleMapUrl,
        businessHours: storeData.businessHours,
        transportation: storeData.transportation,
        heroImage: storeData.images?.[0] || null,
        galleryImages: storeData.images || [],
        coaches,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error('Error fetching store:', error);

    // Try fallback on error
    const fallbackStore = fallbackStores.find(s => s.slug === slug);
    if (fallbackStore) {
      const coaches = fallbackCoaches[slug] || [];
      return {
        success: true,
        data: {
          ...fallbackStore,
          googleMapUrl: null,
          businessHours: null,
          transportation: null,
          heroImage: null,
          galleryImages: [],
          coaches: coaches.map(c => ({
            id: c.id,
            name: c.name,
            photo: c.photo,
            roleTitle: c.roleTitle,
            specialties: c.specialties || [],
            certifications: c.certifications || [],
            education: c.education || [],
            experiences: c.experiences || [],
          })),
        },
      };
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch store',
    });
  }
});
