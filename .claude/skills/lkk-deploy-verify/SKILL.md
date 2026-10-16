---
name: lkk-deploy-verify
description: 確認一次改動真的到了 dev 或 prod。推完分支、要輪詢線上狀態、或想判斷「部署好了沒」時使用。內含依改動類型選驗證法的對照表、marker 的四種自爆寫法、另有一節講「舊版也會通過」這種假通過、推完一定要先等 rollout 到 SUCCEEDED 再驗、rollout→build→commit 的對照腳本、業主回報「改了沒變」時先確認是不是瀏覽器沒重新整理、後台這類「本機驗不到」的改動怎麼用臨時公開端點測純函式並誠實標註驗證邊界、三方對照（開發機／dev／prod）分辨上游壞掉還是我們連不上、只是搬位置的改動怎麼用 byte offset 驗順序，以及查「線上正在跑哪個 commit」的方法。發 prod 的流程本身見 CLAUDE.md 與 lkk-project-context。
---

# 部署驗證

> 流程（檔案級帶入、`apphosting.yaml` 不能互蓋、看結束碼不看 grep）見 CLAUDE.md
> 與 `lkk-project-context`。這裡只講**怎麼證明它真的上線了**。

## 動手前先問：這個改動在外部看得到嗎？

**不是每個改動都有線上可觀測的訊號。** 想不出 marker 就代表該換驗證方式，
硬湊一個只會得到「永遠不會成立的條件」，然後把成功的部署誤判成失敗。

| 改動類型 | 驗證方式 |
|---|---|
| 前台文案／版面／圖片 | 輪詢線上 HTML：新內容出現 **＋ 舊內容歸零** |
| `v-if` 後面的內容（表單提示、錯誤訊息） | **不在 SSR HTML 裡**——抓 client chunk，或用瀏覽器實際點過 |
| 表單邏輯／互動 | 瀏覽器實際操作一輪（含「先選 A 再改 B」這種順序） |
| **後台 API 增刪** | **看不到**——`/api/admin/*` 未登入一律 401（見下），改看 git 樹與建置產物 |
| 純文件（skill／註解） | 不影響服務，不需要輪詢 |
| 寄信 | 查 Cloud Logging（`Confirmation sent to` / `notification email sent` / `535`） |
| 環境變數／secret | 查 App Hosting build 的 `SMTP_PASS` 版本（見 `lkk-env-audit`） |

## 🔴 `/api/admin/*` 未登入一律 401，端點存不存在都一樣

`server/middleware/admin-api-guard.ts` 攔在**路由比對之前**。實測：

```
/api/admin/this-does-not-exist-xyz → 401
/api/admin/seed（已刪除）           → 401
```

所以**「等它變 404」這種 marker 永遠不會成立**。2026-09-05 為了驗證 seed 端點刪除，
用這個條件輪詢 30 次全數逾時——端點其實早就移除了。

（附帶好處：外部無法從回應碼探測後台有哪些端點。）

刪除後台端點的正確驗法：

```bash
git ls-tree -r origin/prod --name-only | grep 'api/admin/'   # 檔案樹
ls .output/server/chunks/routes/api/admin/                    # 建置產物
```

## 🔴 輪詢 rollouts 一定要翻完所有分頁

dev 有 **350 筆以上**的 rollout，而 API **不保證排序**。只抓第一頁 100 筆
會拿到一堆舊的，誤判成「沒有部署」——2026-09-15 因此對業主回報過錯誤結論。

```python
url, rs, n = base, [], 0
while url and n < 20:
    d = json.loads(...)
    rs += d.get('rollouts', [])
    tk = d.get('nextPageToken'); n += 1
    url = f"{base}&pageToken={tk}" if tk else None
new = [r for r in rs if fromisoformat(r['createTime']) > push_time]
```

prod 只有幾十筆，不翻頁也碰巧會對——**不要用 prod 的經驗推論 dev**。

## 🔴 驗證要覆蓋每一層，不是抽樣其中一層

2026-09-15～18 同一類問題出現四次，每次都是「每一層單獨看都正常」：

| 驗了什麼 | 漏了什麼 | 症狀 |
|---|---|---|
| 只測英文代稱 | 中文代稱 | 全部中文文章拿到同一篇 |
| 只測單筆 | 互相比對 | 共用狀態被覆寫，單筆一定通過 |
| 只測 API | 頁面路由 | API 200 但頁面 404 |
| 只測 API 與網址 | 渲染出的連結 | 卡片不是 `<a>`，沒有 href、點不動 |

**「共用狀態被覆寫」這一類的缺陷，單筆測試必定通過。**
要驗就要比對「請求的」與「回傳的」是不是同一個。

## 測試方法本身出錯的三種（都誤報過）

- **導到同一個網址不會重新載入**（含只差 hash 的情況），Vue 狀態留著，
  驗不出初始狀態。要先導到別頁再回來。
- **`className.includes()` 會誤判**：未選中的樣式可能含 `hover:border-orange/50`，
  字串裡也有 `border-orange`。
- **`timeout` 在 macOS 不存在**（那是 GNU coreutils）。指令失敗會被誤讀成服務故障。

## marker 的四種自爆寫法（都實際踩過）

| 寫法 | 為什麼壞 |
|---|---|
| `grep -c "字串"` | 算**行數**不是次數。壓縮後的 HTML 全在一行，三個按鈕只回 1 |
| `grep -o 'path/.*\.webp'` | `.*` 貪婪，同一行的四個路徑被吃成**一個** match。用 `[a-z-]+` |
| `grep "[A-E]-[0-9]"` | 誤中 `<meta charset="UTF-8">` 裡的「F-8」 |
| `grep -c 'bg-navy-800'` | 命中 CSS bundle 裡的**類別定義**，不是版面標籤。用 `grep -o '<section[^>]*class="[^"]*"'` |

**輪詢前先在本機對同一份輸出跑一次 marker**，確認它回傳你預期的數字。
marker 也要對照原始碼確認字串真的存在（大小寫、有沒有那個 `id`），不要憑印象寫。

## 「該消失的東西」也要驗

只驗新內容出現，會漏掉「新舊並存」或「舊版還在服務」。每次輪詢至少放一個歸零條件：

```
新用語「哪一間分店上課」≥1  ＋  舊用語「哪一間門店上課」＝0
新圖示路徑 ≥1              ＋  舊破圖占位路徑 ＝0
```

⚠️ 但要小心**歸零條件誤殺**：驗「門店→分店」時，「西**門店**」是分店名、必須還在。
那次的輪詢特地加了 `西門店 ≥1` 當保護。

## 「只是搬位置」的改動：用 byte offset 驗順序

搬動區塊時**沒有任何新字串**，新舊兩版的 grep 計數完全一樣，`grep -c` 驗不出來。
改驗相對位置：`grep -bo` 回傳 byte offset，比大小就知道誰在前面。

```bash
P1=$(printf '%s' "$H" | grep -bo '個人賽＋團體接力賽' | head -1 | cut -d: -f1)
P2=$(printf '%s' "$H" | grep -bo '服裝、輪椅與輔具'   | head -1 | cut -d: -f1)
P3=$(printf '%s' "$H" | grep -bo '賽程預計於'         | head -1 | cut -d: -f1)
[ "$P2" -gt "$P1" ] && [ "$P2" -lt "$P3" ]   # 夾在中間 → 搬對了
```

同樣適用「兩項的先後對調」（例如對照框把 B 排到 A 前面）：
取兩個 `<dt>` 的 offset 比大小即可，不需要解析 HTML。

## 🔴 2026-10-15 自己踩的：舊版也會通過的 marker ＝ 假通過

推完 prod 後我輪詢「前台五頁狀態碼是不是 200」，**第一次就通過**。
但當時 rollout 還是 `QUEUED` —— 正式站跑的還是舊版，舊版當然也回 200。

```
[1] 23:45:02 前台 200=5/5  ✅ 前台未受影響     ← 假的，新版根本還沒上
```

**狀態碼、頁面存在、連結點得動——這些舊版也成立的東西不能單獨當 marker。**

⚠️ 本檔另有一節「marker 的四種自爆寫法」，但那四種全是 **grep 寫法本身**出錯
（`grep -c` 算行數、`.*` 貪婪、誤中 UTF-8、命中 CSS bundle）。
**這裡是不同的失敗模式：grep 完全正確，但它要找的東西舊版也有。**

### 做法：先等 rollout 到 SUCCEEDED，再驗

```bash
G=~/.claude/skills/firebase-app-hosting-ops/scripts/gapi.cjs
AH=https://firebaseapphosting.googleapis.com/v1beta/projects/<P>/locations/asia-east1/backends/<B>
until node $G GET "$AH/rollouts" 2>/dev/null | python3 -c "
import sys,json
rs=(json.load(sys.stdin).get('body') or {}).get('rollouts') or []
r=sorted(rs,key=lambda x:x.get('createTime',''))[-1]
print(r.get('createTime','')[:19], r.get('state'))
sys.exit(0 if r.get('state') in ('SUCCEEDED','FAILED') else 1)
"; do sleep 30; done
# 到這裡才開始驗
```

而且驗的時候**一定要混進至少一個「只有新版才有」的字串**，不要全部都是狀態碼。

### 另一條：rollout → build → commit 要自己對一次

`rollouts` 列表只給 build id，`builds` 才有 commit hash。業主回報「畫面沒變」時，
先確認他看的那一版到底是哪個 commit，再去懷疑程式：

```bash
node $G GET "$AH/rollouts" > /tmp/r.json; node $G GET "$AH/builds" > /tmp/b.json
python3 - <<'PY2'
import json, subprocess
bs={b['name'].split('/')[-1]: b for b in json.load(open('/tmp/b.json'))['body'].get('builds') or []}
for r in sorted(json.load(open('/tmp/r.json'))['body'].get('rollouts') or [], key=lambda x: x.get('createTime',''))[-4:]:
    bid=(r.get('build') or '').split('/')[-1]
    h=((bs.get(bid,{}).get('source') or {}).get('codebase') or {}).get('hash')
    msg=subprocess.run(['git','log','-1','--format=%s',h],capture_output=True,text=True).stdout.strip()[:44] if h else ''
    print(r.get('createTime','')[:19], r.get('state'), bid, (h or '')[:8], msg)
PY2
```

2026-10-15 用這招直接證明了「業主看到舊畫面」是**瀏覽器沒重新整理**，
不是部署沒上：rollout 成功時間比他的截圖早四分鐘。後台是 SPA，
停在同一頁不會自己抓新的 JS。**業主回報「改了沒變」時，先問有沒有關掉分頁重開。**

---

## 🔴 驗不到的那一層要講出來，不要讓它看起來像驗過了

這一輪有大量改動落在 `/admin/*`，而 `/api/admin/*` 未登入一律 401、頁面一律 302
導向登入。**邊界要畫在對的地方——「進不去後台」和「驗不到寫入」是兩件事：**

- **線上 dev／prod 確實沒有後台帳號。** `auth.ts` 的 `isDevLoginAllowed()` 要
  `NODE_ENV !== 'production' && ALLOW_DEV_ADMIN === 'true'` 才回 true；App Hosting
  的執行環境是 `NODE_ENV=production`，而 `ALLOW_DEV_ADMIN` 在 **dev 與 prod 兩分支的
  `apphosting.yaml` 都沒有設**（實查 grep 皆 0 命中）。所以線上後台我進不去，也不該進。
- **本機進得去。** `auth.ts` 的 `DEV_TEST_USER`（`admin@l-kk.tw`、role `'admin'`）在
  `ALLOW_DEV_ADMIN=true` 下由 `loginWithCredentials()` 直接放行，而且**在查 Firestore 之前就
  return**；role `admin` 在 `admin-api-guard` 是「全部放行」。這本來就是
  `lkk-project-context` 寫明的本機驗證管線，不是什麼例外手段。
- **但後門不能用來證明寫入。** 本機 `.env` 的 `FIREBASE_PROJECT_ID=lkkdev` 沒有附憑證，
  `server/utils/firebase.ts` 會落到 `applicationDefault()`，而本機沒有 ADC ——
  **本機的 Firestore 讀寫一律不通**。所以後門能驗的是「後台畫面與前端邏輯」，
  資料清單那層反而會直接掛掉。

**結論：真正驗不到的那一層是「dev／prod 的 Firestore 實際寫入」，不是「登入」。**
寫報告時別把它說成「我沒有帳號所以什麼都沒驗」——那會把邊界畫錯位置，
也會跟 `lkk-project-context` 的本機管線自相矛盾。

做法是兩件事一起：

**① 把能測的那一層測到滿。** 後台頁面背後的純函式可以靠一支臨時的公開端點跑：

```bash
cat > server/api/public/__tmp-x.get.ts <<'EOF'
import { 要測的函式 } from '~/utils/xxx'
export default defineEventHandler(() => { /* 斷言，回 {pass, fail, results} */ })
EOF
curl -s -o /dev/null --max-time 90 http://localhost:3000/api/public/__tmp-x   # 先暖機讓 Vite 編譯
curl -s http://localhost:3000/api/public/__tmp-x | python3 -c "..."
rm -f server/api/public/__tmp-x.get.ts                                        # 驗完一定要刪
```

⚠️ **這招與「改動一律先驗 dev 站，不要開 localhost」不衝突，但要知道界線。**
那條規則（CLAUDE.md）針對的是「本機 `.env` 指向另一個舊專案」造成的資料誤導。
臨時端點只測**不碰 Firestore 的純函式**，所以不受影響。
要驗資料仍然一律上 dev 站。

```
```

⚠️ 放 `/api/admin/` 會被 `admin-api-guard` 擋掉，要放 `/api/public/`。
⚠️ 第一次請求常常是空的（Vite 還在編譯），**先打一次丟掉再打第二次**。
⚠️ 用完立刻刪，不要 commit 進去。

**② 在回報與 commit 訊息裡明寫「哪一層沒驗到」。** 不要只說「建置通過」就帶過，
那會讓人以為驗過了。**定成規則：每一筆動到 `/admin` 的 commit 都要寫一行驗證邊界。**
（2026-10-15 那一輪動到 `/admin` 的 7 筆 commit 裡只有 4 筆寫了，所以才定成規則。）

---

## 三方對照：分辨「上游壞了」還是「我們連不上」

同一個上游，從三個地方打：**開發機 ／ dev 站 ／ 正式站**。
dev 與 prod 跑同一份程式碼、同一個區域，差別只剩 egress，所以三者的落差
直接指出問題在哪一層。2026-10-13 靠這招五分鐘內就定位到「只有 prod 連不上」。

細節與那次事件的完整查法見 [[lkk-wp-articles]]。

---

## 部署節奏（抓等待時間用）

2026-10-08～09 連續七次推送，dev 與 prod 都是 **20 秒間隔輪詢第 8～14 次才上線**，
也就是**推完約 3～5 分鐘**。第 1～7 次拿到舊版是正常的，不是失敗。
輪詢上限給到 24 次（8 分鐘）足夠，給太少會誤判成逾時。

## 查線上正在跑哪個 commit（最可靠，不吃 Cloud Logging 配額）

App Hosting REST API：`traffic` 拿到目前導流的 build，再讀該 build 的 commit 與 secret 版本。

```js
const base = `https://firebaseapphosting.googleapis.com/v1beta/projects/${proj}/locations/asia-east1/backends/${backend}`
const tr = await (await fetch(`${base}/traffic`, { headers: H })).json()
const b  = await (await fetch(`https://firebaseapphosting.googleapis.com/v1beta/${tr.current.splits[0].build}`, { headers: H })).json()
// b.state / b.source.codebase.commit / b.environment 裡的 SMTP_PASS secret 版本
```

token 取法：firebase-tools 的 refresh_token（`~/.config/configstore/firebase-tools.json`）
換 access token。**gcloud 沒安裝**。

⚠️ **Cloud Logging 有每分鐘讀取配額**，而且算在 firebase-tools 共用的 OAuth 專案上——
每 30 秒輪詢兩個專案就會撞 `Quota exceeded`。查部署狀態改用上面的 App Hosting API。

## 比對 build 完成時間與 commit 推送時間

沒有可觀測 marker 時，這是最省事的判斷：

```bash
git log --format="%h %cd %s" --date=format:"%H:%M" -3 origin/dev   # 推送時間（台北）
# App Hosting build.updateTime 是 UTC，+8 才是台北
```

build 完成時間晚於 commit 推送時間 → 該 commit 已在服務中。

## 判斷「什麼還沒上 prod」

一律 `git diff --stat origin/prod origin/dev`。
**不要看 `git log origin/prod..origin/dev`**——prod 是檔案級帶入建的，
兩邊 commit 圖完全分開，log 會列出兩百多個 commit，嚴重高估未上線的量。
