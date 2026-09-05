---
name: lkk-env-audit
description: 稽核練健康官網 dev/prod 兩個環境的設定有沒有漂移或交叉污染，並釐清 Firestore/Storage 安全規則在這個架構裡的角色。當被問「兩邊設定一樣嗎」「會不會環境污染」「apphosting.yaml 能不能統一」「規則沒部署要不要補」，或動到 apphosting.yaml、firestore.rules、storage.rules、secrets、環境變數之前使用。
---

# 環境設定稽核

## 先講結論：`apphosting.yaml` 的差異不能消除

它是全站**唯一**分隔兩個 Firebase 專案的檔案。弄成一致＝兩邊指向同一個專案，那才是真正的污染。

| | dev | prod |
|---|---|---|
| Firebase 專案 | `lkkdev` | `lkkprod` |
| App Hosting backend | `lkk-website-dev` | `lkk-website` |
| 分支 | `dev` | `prod` |
| 對外網址 | `lkk-website-dev--lkkdev.asia-east1.hosted.app` | `lkkwellness.com` |

⚠️ 網址是 **`<backend>--<專案>`**，很容易讀反。曾經因此把 Firestore 寫進 `lkk-website-dev`
（那是**另一個舊專案**，不是 dev 站）——而且兩邊 docId 相同，腳本會「找到 1 筆」看起來完全正常、不報錯。

## 稽核四步

### 1. 結構化比對兩支的 apphosting.yaml

不要只看 `git diff`——要拆成 key→value 才分得出「該一致的漂移了」vs「該不同的環境項」。

```python
import subprocess, re
def parse(branch):
    txt = subprocess.run(['git','show',f'origin/{branch}:apphosting.yaml'],
                         capture_output=True, text=True).stdout
    out={}; cur=None
    for line in txt.splitlines():
        m=re.match(r'\s*-\s*variable:\s*(\S+)', line)
        if m: cur=m.group(1); continue
        m=re.match(r'\s*(value|secret):\s*(.*)', line)
        if m and cur: out[cur]=f'{m.group(1)}={m.group(2).strip()}'; cur=None
    for k in ('minInstances','maxInstances','concurrency','cpu','memoryMiB','buildCommand','runCommand'):
        m=re.search(rf'^\s*{k}:\s*(.*)$', txt, re.M)
        if m: out['['+k+']']=m.group(1).strip()
    return out
```

**2026-08-29 的基準線**：22 項中 **15 項一致、7 項不同、0 項單邊才有**。

- 一致（該一致）：`runConfig` 全套、`scripts` 兩項、`SMTP_HOST/PORT/USER/FROM`、`NOTIFICATION_EMAIL`、`ADMIN_ALLOWED_EMAILS`、`SMTP_PASS`／`JWT_SECRET` 的 secret 名稱
- 不同（該不同）：`FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`、`NUXT_PUBLIC_FIREBASE_*` 四項、`NUXT_PUBLIC_SITE_URL`

**出現「單邊才有」的項目＝有人只改了一邊，一定要追。**

### 2. 執行期交叉檢查（證明沒有真的污染）

```bash
curl -s "$SITE/admin/login" | grep -o 'lkkprod\|lkkdev' | sort | uniq -c
```
正式站應 `lkkprod` 有、`lkkdev` **0**；dev 站反之。順便看 `authDomain` 與 `appId`。

### 3. backend 與專案的綁定

```bash
npx firebase-tools apphosting:backends:list --project lkkdev
npx firebase-tools apphosting:backends:list --project lkkprod
```

### 4. secrets 是否各專案獨立

```bash
npx firebase-tools apphosting:secrets:describe smtp-pass --project lkkdev
npx firebase-tools apphosting:secrets:describe smtp-pass --project lkkprod
```
名稱相同不代表共用——secret 綁專案，看**建立時間不同**即可確認是不同物件。

## 🔴 註解也會造成跨環境破壞

值對了不代表安全。**註解錯了沒有任何 build／測試抓得到**，而且只在「照著做」時才發作——
通常是輪替密鑰這種最緊急的時候。2026-08-29 抓到三處（詳見記憶 `lkk-web-gotchas` 第 32 條）：

| 位置 | 問題 | 照做的後果 |
|---|---|---|
| dev `NUXT_PUBLIC_SITE_URL` | 值是舊 WordPress 站 `l-kk.tw` | 通知信的後台連結指向一個**還活著但沒有後台**的站，像「後台壞了」 |
| prod JWT 註解 | 整段從 dev 帶來，寫 `lkkdev` / `lkk-website-dev` | **覆蓋 dev 的密鑰、prod 沒動**；prod 仍用舊密鑰，dev 登入被誤踢 |
| dev `SMTP_PASS` 註解 | 說要用別名 `service@` 的應用程式密碼 | 別名產不出應用程式密碼 → 設錯 → **寄信全掛且靜默** |

### 兩個特別容易誤判的點

- **`NUXT_PUBLIC_SITE_URL` 不能「直接刪掉」**：`server/utils/email.ts:175` 的 fallback 是
  `'https://lkkwellness.com'`，刪掉之後 dev 的通知信會連到**正式站後台**，測試時看到真實客戶資料，更糟。
  正解是設成**該環境自己的網址**。
  （`nuxt.config.ts` 的 `runtimeConfig.public.siteUrl` 目前**宣告了但全站沒人消費**，所以 canonical/og
  還沒受影響——但哪天有人加 canonical 就會踩到，且只在 dev 錯、prod 對，測不出來。）
- **寄信失敗是靜默的**：`server/api/leads/*.post.ts` 的寄信是 fire-and-forget
  （`.catch(err => console.error(...))` 包在 try 裡），SMTP 設錯後表單照樣回「預約成功」，
  錯誤只進 Cloud Run log。**名單不會遺失**（Firestore 寫入在寄信之前），但沒有任何人被通知。

## 修這種問題的方式

**各改各的分支，絕不互相帶入。** 這是唯一該直接在 `prod` 分支編輯 `apphosting.yaml` 的情況。

改完自我驗證「只動註解、沒動任何值」：

```bash
git diff --unified=0 apphosting.yaml | grep -E '^[+-]' | grep -v '^[+-][+-]' \
  | grep -vE '^\s*[+-]\s*#' | grep -E 'value:|secret:|variable:' \
  || echo "✅ 純註解異動"
```

改完再用 `node -e` 搭配專案既有的 `yaml` 套件解析一次，確認 YAML 沒壞、關鍵值仍是該環境的值。


---

# Firestore / Storage 規則：先搞清楚這個架構「不走規則」

稽核時很容易看到「`firestore.rules` 沒部署」就想補上去。**在這個專案，那是錯的。**

## 存取路徑只有一條

```
瀏覽器 ──HTTP──> Nitro API Routes ──firebase-admin──> Firestore
                  (server/api/**)   (server/utils/firebase.ts)
```

- 伺服器端唯一入口 `server/utils/firebase.ts`，憑證依序判斷：
  `FIRESTORE_EMULATOR_HOST` → service account（`CLIENT_EMAIL`+`PRIVATE_KEY`，**線上沒宣告、走不到**）
  → **`applicationDefault()`（ADC，App Hosting 自動注入）← 線上實際走這條**
- **Admin SDK 依服務帳號 IAM 權限存取，設計上繞過 Security Rules。**
- 前端 `plugins/firebase.client.ts` 只 import `'firebase/app'` + `'firebase/auth'`（後台 Google 登入），
  全站**沒有任何** `import 'firebase/firestore'`。
- ⚠️ 連 emulator 也一樣：`firebase.ts:46` 連 emulator 時用的仍是 firebase-admin，同樣繞過規則。
  **不要拿「emulator 沒規則檔會預設全開」當論證**——那條路徑本地也不會走到。

## 查「線上實際生效」的規則

```javascript
// 用 ADC 換 access_token 後
fetch(`https://firebaserules.googleapis.com/v1/projects/${p}/releases`, {headers:{Authorization:'Bearer '+token}})
```
2026-08-29 實測：兩個專案都**只有 `firebase.storage/…`，沒有 `cloud.firestore`**
→ Firestore 跑在預設 deny-all。實測佐證：

```bash
KEY=<NUXT_PUBLIC_FIREBASE_API_KEY>
curl -o /dev/null -w '%{http_code}' "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/stores?key=$KEY"   # 403
curl -o /dev/null -w '%{http_code}' -X POST "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/leads?key=$KEY" -d '{"fields":{}}'  # 403
```

## 🔴 舊版規則檔為什麼是上膛的槍

2026-08-29 之前的 `firestore.rules` 假設「client SDK 直連」，內含：

```javascript
match /leads/{leadId} {
  allow create: if true;                     // 任何人、不需登入即可寫入名單
  allow read, update: if isAuthenticated();  // 任何 Google 帳號可讀全部名單
}
```

`ADMIN_ALLOWED_EMAILS` 白名單是在 Nitro API 比對的，**規則看不到**；`isAdmin()` 靠
`users/{request.auth.uid}` 查角色，但本站 `users` 是自訂 docId＋bcrypt＋自簽 JWT，
跟 Firebase Auth UID 無關 → 永遠 false。部署下去＝名單對外開放。

**觸發機率不低**：`firebase.json` 宣告了 `"firestore": {"rules": "firestore.rules"}`，
不加 `--only` 的 `firebase deploy` 就會推；而 `CLAUDE.md` 當時直接寫著那道指令。

**現況（已處置）**：`firestore.rules` 改成明文 `allow read, write: if false` 並在檔頭寫清楚
架構與理由；`CLAUDE.md` 移除該指令改成警告。部署與否結果都安全。

## ⚠️ `firebase.json` 的 `firestore` 區塊不能整塊刪

同一區塊的 `indexes` 是真的有在用：檔案宣告 10 個複合索引，`lkkdev`/`lkkprod`
線上各 10 個且全部 READY。查法：

```javascript
fetch(`https://firestore.googleapis.com/v1/projects/${p}/databases/(default)/collectionGroups/-/indexes`, …)
```

## Storage 規則「有」部署，而且偏寬

`allow read: if true`（公開讀，符合預期）／`allow write: if isAuthenticated() && isValidImage()`
——**任何 Firebase 登入者**皆可上傳，不限白名單。影響面小（圖片已改走 `public/`），
但這是目前唯一「規則真的生效」的地方，收緊要改 `storage.rules` 並重新部署。

## 別把 middleware 的防護誤判成沒有

逐支 admin 端點大多只 `getSession`、不驗角色，看起來像沒防護。**防護在
`server/middleware/admin-api-guard.ts`**：`/api/admin/*`（`auth/` 除外）一律要登入，
`users`/`debug` 僅 admin。實測正式站未登入時皆 401。
（`seed` 端點已於 2026-09-05 刪除——建置初期用來把 fallback-data 灌進空的 Firestore，
帶 `clearExisting` 會清空 coaches 與 stores 兩個 collection，資料上線後只剩誤觸風險。）
