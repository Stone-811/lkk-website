import { getSession } from '~/server/utils/auth'
import { getAdminStorage } from '~/server/utils/firebase'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getSession(event)
    if (!session) {
      throw createError({ statusCode: 401, message: '請先登入' })
    }

    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, message: '請選擇檔案' })
    }

    const fileField = formData.find(field => field.name === 'file')
    const folderField = formData.find(field => field.name === 'folder')
    const filenameField = formData.find(field => field.name === 'filename')

    if (!fileField || !fileField.data) {
      throw createError({ statusCode: 400, message: '請選擇檔案' })
    }

    const folder = folderField?.data?.toString() || 'uploads'
    const customFilename = filenameField?.data?.toString()

    // Validate file type
    const contentType = fileField.type || 'application/octet-stream'
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(contentType)) {
      throw createError({ statusCode: 400, message: '僅支援 JPG、PNG、WebP、GIF 格式' })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (fileField.data.length > maxSize) {
      throw createError({ statusCode: 400, message: '檔案大小不可超過 5MB' })
    }

    // Generate filename
    const originalFilename = fileField.filename || 'file'
    const ext = originalFilename.split('.').pop() || 'jpg'
    const finalFilename = customFilename
      ? `${customFilename}.${ext}`
      : `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const filePath = `${folder}/${finalFilename}`

    // Upload to Firebase Storage
    const storage = await getAdminStorage()
    const bucket = storage.bucket()
    const fileRef = bucket.file(filePath)

    await fileRef.save(fileField.data, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    })

    // Make file public
    await fileRef.makePublic()

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

    return {
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        filename: finalFilename,
      },
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: '上傳失敗，請稍後再試' })
  }
})
