import { getDb } from '~/server/utils/firebase'
import { getSession } from '~/server/utils/auth'
import { hasPagePermission } from '~/utils/adminAccess'
import {
  DEFAULT_UTM_CHANNELS,
  normalizeUtmSource,
  validateUtmChannel,
  type UtmChannel,
} from '~/config/utmChannels'

type StoredChannel = UtmChannel & { active: boolean }

/**
 * 新增或停用投放管道。
 *
 * 🔴 只有 add 與 toggle，**沒有 edit**。label 會存進名單的 leadSource、
 *    source／medium 會進 GA4 與名單的 payload.utm —— 發出去之後改字面都救不回來。
 *    停用只是不再出現在選單，已發出的連結與已收到的名單不受影響。
 *
 * 🔴 文件或欄位還不存在時，要先用程式裡的預設清單當起始內容。
 *    GET 本來就是這樣回的（所以畫面看得到七個預設管道），PATCH 若不做同樣的事：
 *    第一次按「停用」會在空陣列裡找不到那個管道而報錯，
 *    第一次「新增」會把七個預設管道全部弄丟、只留新增的那一筆。
 *    referral-options 在 2026-09-18 就是踩到這個，業主回報「無法停用」。
 */
export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  if (
    !session ||
    (!['admin', 'editor'].includes(session.role) && !hasPagePermission(session, '/admin/campaigns'))
  ) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const body = await readBody(event)
  const action = body?.action as 'add' | 'toggle'
  if (action !== 'add' && action !== 'toggle') {
    throw createError({ statusCode: 400, message: '未知的操作' })
  }

  const db = await getDb()
  const ref = db.collection('settings').doc('utmChannels')
  const doc = await ref.get()
  const raw: any = doc.exists ? doc.data() || {} : {}

  const list: StoredChannel[] =
    Array.isArray(raw.channels) && raw.channels.length
      ? [...raw.channels]
      : DEFAULT_UTM_CHANNELS.map((c) => ({ ...c, active: true }))

  if (action === 'add') {
    const label = String(body?.label || '').trim()
    const source = normalizeUtmSource(body?.source)
    const medium = String(body?.medium || '')

    const err = validateUtmChannel(label, source, medium)
    if (err) throw createError({ statusCode: 400, message: err })

    // 顯示名稱重複會讓後台兩個按鈕長得一樣、而且 ?src= 的值會撞在一起
    if (list.some((c) => c.label === label)) {
      throw createError({ statusCode: 400, message: `管道「${label}」已存在` })
    }
    // source 重複不會壞，但兩個管道的 GA4 數據會合在一起，多半不是本意
    if (list.some((c) => c.source === source)) {
      const dup = list.find((c) => c.source === source)!
      throw createError({
        statusCode: 400,
        message: `utm_source「${source}」已被管道「${dup.label}」使用，兩者在 GA4 會合併計算`,
      })
    }

    list.push({ label, source, medium, active: true })
  } else {
    const label = String(body?.label || '').trim()
    const i = list.findIndex((c) => c.label === label)
    if (i === -1) throw createError({ statusCode: 400, message: `找不到管道「${label}」` })
    list[i] = { ...list[i], active: !list[i].active }
  }

  await ref.set({ channels: list }, { merge: true })
  return { success: true, data: list }
})
