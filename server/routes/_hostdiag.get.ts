// 臨時除錯：查 App Hosting 實際傳給程式的 host 相關 header（token 保護）。診斷完移除。
export default defineEventHandler((event) => {
  if (getQuery(event).token !== 'hd2026') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  return {
    host: getRequestHeader(event, 'host') || null,
    xForwardedHost: getRequestHeader(event, 'x-forwarded-host') || null,
    forwarded: getRequestHeader(event, 'forwarded') || null,
    xOriginalHost: getRequestHeader(event, 'x-original-host') || null,
    xForwardedProto: getRequestHeader(event, 'x-forwarded-proto') || null,
    urlHref: getRequestURL(event).href,
  }
})
