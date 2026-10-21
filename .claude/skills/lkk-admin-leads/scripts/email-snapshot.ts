// 信件快照：用同一組 fixture 產生管理者通知信與四種確認信，輸出 JSON（不會真的寄）。
// 2026-10-21 確認信「親友代為填寫」→「他人代為填寫」時實際用過，結果只差三封代填確認信。
//
// 用法（在 repo 根目錄，W 是 scratchpad 資料夾）：
//   git show <改前 commit>:server/utils/email.ts > $W/email_orig.ts ; cp server/utils/email.ts $W/email_new.ts
//   for f in $W/email_orig.ts $W/email_new.ts; do
//     grep -c 'const transporter = await createTransporter()' $f      # 要剛好 2
//     sed -i '' 's/const transporter = await createTransporter()/const transporter = (globalThis as any).__stub/' $f
//   done
//   node_modules/.bin/jiti .claude/skills/lkk-admin-leads/scripts/email-snapshot.ts $W/email_orig.ts 2>/dev/null | tail -1 > $W/orig.json
//   node_modules/.bin/jiti .claude/skills/lkk-admin-leads/scripts/email-snapshot.ts $W/email_new.ts  2>/dev/null | tail -1 > $W/new.json
//   python3 .claude/skills/lkk-admin-leads/scripts/email-snapshot-diff.py $W/orig.json $W/new.json
// fixture 含 & < > " ' 以檢查跳脫；改了信件欄位就把對應 fixture 補進來。
const sent: any[] = []
;(globalThis as any).__stub = { sendMail: async (m: any) => { sent.push({ subject: m.subject, html: m.html }) } }
const email = await import(process.argv[2])
const X = `A&B <b>"q"</b> 'x'`
const base = { id: 't1', createdAt: new Date('2026-10-21T02:00:00Z'), name: '王' + X, phone: '0911111111', email: 'a@example.com', storeName: '南京店' }
const notifs = [
  { ...base, type: 'booking', gender: '女', birthDate: '1961-01-01', filledBySelf: true, hasMedicalCondition: false, preferredTime: ['平日白天'], paymentMethod: '臨櫃付款' },
  { ...base, type: 'booking', filledBySelf: false, relationship: '練健康同仁', bookerName: '同仁' + X, contactPhone: '', hasMedicalCondition: true, medicalConditionNote: X },
  { ...base, type: 'booking', filledBySelf: false, relationship: '子女', bookerName: '女兒', contactPhone: '0922222222' },
  { ...base, type: 'group_class', isFillerSelf: '否', fillerName: '女兒' + X, relationship: '子女', contactPhone: '0922222222', courseName: '團班', medicalHistory: '無', sources: ['親友推薦'] },
  { ...base, type: 'group_class', isFillerSelf: '是', courseName: '團班', medicalHistory: X },
  { ...base, type: 'cooperation', organization: X, cooperationType: '講座邀約', message: X },
  { ...base, type: 'franchise', message: X },
]
const out: any = { notif: notifs.map(n => email.buildLeadNotificationEmail(n as any)) }
await email.sendBookingConfirmation({ ...base, filledBySelf: true, hasMedicalCondition: false, preferredTime: ['平日白天'], birthDate: '1961-01-01', paymentMethod: '50歲以上免費' } as any)
await email.sendBookingConfirmation({ ...base, filledBySelf: false, relationship: '練健康同仁', bookerName: '同仁' + X, contactPhone: '', hasMedicalCondition: true, medicalConditionNote: X, preferredTime: ['其他: ' + X] } as any)
await email.sendBookingConfirmation({ ...base, filledBySelf: false, relationship: '子女', bookerName: '女兒', contactPhone: '0922222222', hasMedicalCondition: false } as any)
await email.sendGroupClassConfirmation({ ...base, gender: '女', ageRange: '50-59', isFillerSelf: '否', fillerName: '女兒' + X, relationship: '子女', contactPhone: '0922222222', courseName: '團班', medicalHistory: '無' } as any)
await email.sendGroupClassConfirmation({ ...base, isFillerSelf: '是', courseName: '團班', medicalHistory: X } as any)
await email.sendCooperationConfirmation({ ...base, organization: X, message: X } as any)
await email.sendFranchiseConfirmation({ ...base, message: X } as any)
out.sent = sent
console.log(JSON.stringify(out))
