import { randomBytes } from 'node:crypto'

/**
 * 後台上傳圖片的存放路徑。每次上傳都產生不重複的檔名。
 *
 * 🔴 為什麼不能再用固定檔名（2026-10-16 改）：
 *    原本三個後台頁各送一個固定檔名（教練送 slug、講師送 'photo'、分店送 env1…env5），
 *    同一位教練重傳照片就覆蓋同一個物件；但上傳時設了一年的 Cache-Control，
 *    瀏覽器與 Google 邊緣快取都留著舊圖，所以「換了照片，前台還是舊的」。
 *    另外新分店還沒有 slug 時，全部寫進 stores/temp/env1.*，不同分店會互相覆蓋。
 *
 * 換成不重複的檔名之後，一年的快取反而是安全的（內容永遠不變），所以加上 immutable。
 * 代價：上傳完一定要按「儲存」，Firestore 才會指向新網址。舊檔不刪 ——
 * 業主上傳後按取消時，Firestore 仍指著舊網址，刪了前台會破圖。
 *
 * ⚠️ 物件名稱維持未編碼；只有對外網址要逐段 encodeURIComponent。
 *    兩邊都編碼會變成 %25E6…，對應不到物件而破圖。
 */

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** 檔名片段只留 a-z 0-9 _ -：先轉小寫，其餘換成 -，合併連續的 -、去掉頭尾，截長。空的就用 img。 */
export function uploadSafeName(raw: string | undefined | null): string {
  const s = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return s || 'img'
}

/**
 * @param folder 後台頁送來的資料夾（例如 coaches、stores/nanjing），原樣保留
 * @param customFilename 後台頁送來的名稱（slug、photo、env1…），只當作可讀的前綴
 * @param contentType 已通過白名單檢查的 MIME；副檔名依它決定，不從原始檔名取
 */
export function buildUploadPath(folder: string, customFilename: string | undefined, contentType: string) {
  const ext = EXT_BY_TYPE[contentType] || 'jpg'
  const unique = Date.now().toString(36) + randomBytes(3).toString('hex')
  const filename = `${uploadSafeName(customFilename)}-${unique}.${ext}`
  const objectPath = `${folder}/${filename}`
  return {
    filename,
    /** 給 bucket.file() 用：不編碼 */
    objectPath,
    /** 給對外網址用：逐段編碼、保留 / */
    urlPath: objectPath.split('/').map(encodeURIComponent).join('/'),
  }
}
