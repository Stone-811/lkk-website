// 表單共用選項（客戶預約 /booking 與團體課報名 /group-booking 共用，
// 兩邊的「他人代填」欄位需維持一致的選項與格式）
// 選「練健康同仁」時，方便聯繫的電話改為選填（2026-10 業主指定，兩張表單都是；
// 團課後端 server/api/leads/group-class.post.ts 也照這個放寬）
export const STAFF_RELATIONSHIP = '練健康同仁'

export const relationshipOptions = [
  '配偶',
  '子女',
  '父母',
  '兄弟姊妹',
  '朋友',
  STAFF_RELATIONSHIP,
  '其他',
]
