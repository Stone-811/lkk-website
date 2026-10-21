// 表單共用選項（客戶預約 /booking 與團體課報名 /group-booking 共用，
// 兩邊的「他人代填」欄位需維持一致的選項與格式）
export const relationshipOptions = [
  '配偶',
  '子女',
  '父母',
  '兄弟姊妹',
  '朋友',
  '其他',
]

// 只有客戶預約多一個「練健康同仁」：同仁幫客人代填時，方便聯繫的電話改為選填（2026-10 業主指定）。
// 團課表單沒有這個選項 —— 團課後端（server/api/leads/group-class.post.ts）代填電話仍是必填。
export const STAFF_RELATIONSHIP = '練健康同仁'
export const bookingRelationshipOptions = relationshipOptions.flatMap(r =>
  r === '其他' ? [STAFF_RELATIONSHIP, r] : [r],
)
