---
name: lkk-deploy-verify
description: 確認一次改動真的到了 dev 或 prod。推完分支、要輪詢線上狀態、或想判斷「部署好了沒」時使用。內含依改動類型選驗證法的對照表、marker 的四種自爆寫法、另有一節講「舊版也會通過」這種假通過、推完一定要先等 rollout 到 SUCCEEDED 再驗、rollout→build→commit 的對照腳本、業主回報「改了沒變」時先確認是不是瀏覽器沒重新整理、後台這類「本機驗不到」的改動怎麼用臨時公開端點測純函式並誠實標註驗證邊界、三方對照（開發機／dev／prod）分辨上游壞掉還是我們連不上、只是搬位置的改動怎麼用 byte offset 驗順序，以及查「線上正在跑哪個 commit」的方法（用 gapi.cjs，權杖不經手）。另含 2026-10-16 起的：發 prod 時有刪除檔案要分兩步（diff-filter AMR 帶入、D 用 git rm）、從 commit hash 對 build 再對 rollout 的等待腳本、剛部署完 CDN 回舊 HTML（內嵌樣式也是舊的）要用 ?v= 繞過（/booking 與 /group-booking 的 ?v= 是變體參數，改用 ?qa=）、curl 抓頁面 JS chunk 驗正式站新程式、看標頭要用 GET 不要用 HEAD、驗正式站用 curl 避免污染 GA4、量頁面 JS 下載量、本機 production server 加假上游、用 jiti 在瀏覽器外測純函式、內建瀏覽器擋彈出視窗，以及寫檔工具會把反斜線 u 跳脫轉成實際字元這類工具本身的坑。發 prod 的流程本身見 CLAUDE.md 與 lkk-project-context。
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

🔴 **用個人 skill `firebase-app-hosting-ops` 的 `scripts/gapi.cjs`，不要自己拿權杖。**
這裡以前寫「讀 `~/.config/configstore/firebase-tools.json` 的 refresh_token 換 access token」——
那違反「權杖永遠不經手」的原則（另一個專案做類似的事被 auto mode 擋過）。gapi.cjs 借用 firebase-tools 自己的登入，
權杖不經手、機密欄位自動遮蔽。**gcloud 沒安裝。**

```bash
G=~/.claude/skills/firebase-app-hosting-ops/scripts/gapi.cjs
AH=https://firebaseapphosting.googleapis.com/v1beta/projects/lkkprod/locations/asia-east1/backends/lkk-website
node $G GET "$AH/traffic" --fields=current.splits
node $G GET "$AH/builds/<build-id>" --fields=state,source.codebase.hash
```

### 推完之後等它上線：用 commit hash 對 build，再用 build 對 rollout（2026-10-16 起都用這支）

```bash
H=$(git rev-parse origin/dev)   # prod 就用 prod 分支推上去的那一筆
# dev：projects/lkkdev … backends/lkk-website-dev；prod：projects/lkkprod … backends/lkk-website
for i in $(seq 1 60); do S=$(node $G GET "$AH/builds" | jq -r --arg h "$H" '.body.builds[]|select(.source.codebase.hash==$h)|.state' | head -1)
  [ "$S" = READY ] || [ "$S" = FAILED ] && break; /bin/sleep 15; done
B=$(node $G GET "$AH/builds" | jq -r --arg h "$H" '.body.builds[]|select(.source.codebase.hash==$h)|.name|split("/")|last')
for i in $(seq 1 40); do R=$(node $G GET "$AH/rollouts" | jq -r --arg b "$B" '[.body.rollouts[]|select(.build|endswith($b))]|last|.state')
  [ "$R" = SUCCEEDED ] || [ "$R" = FAILED ] && break; /bin/sleep 15; done
```

⚠️ 「最新一筆 rollout」不一定是你這次的：同時有別人推、或連推兩次時會對錯。**一定要從 commit hash 出發。**
⚠️ 前景 `sleep` 會被擋，寫 `/bin/sleep` 放在迴圈裡，或整段丟背景（`run_in_background`）等通知。
實測推完到 SUCCEEDED 約 5～8 分鐘。

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

---

## 🔴 發 prod 時有「刪除的檔案」：要分兩步（2026-10-16 起兩次都遇到）

`git checkout origin/dev -- <檔案>` **只能帶入新增與修改，帶不了刪除**。
而把已刪的路徑寫進 checkout 的清單，git 會因 pathspec 對不到而**整條指令中止**。

```bash
git checkout -q -B prod origin/prod
# 1) 新增／修改（排除 apphosting.yaml）
git diff -z --name-only --diff-filter=AMR origin/prod origin/dev | grep -zv '^apphosting\.yaml$' | xargs -0 git checkout origin/dev --
# 2) 刪除
git diff -z --name-only --diff-filter=D origin/prod origin/dev | xargs -0 git rm -q
# 3) 帶完之後，與 dev 的差異必須只剩 apphosting.yaml
git diff --name-only origin/dev --cached
```

只帶一半的後果（兩種都很難察覺）：
- **只帶修改、沒刪檔**：被刪的頁面在 prod 仍在（靜態路由優先），新的擋法完全不生效；
  dev 驗證全部通過，正式站卻沒變。2026-10-16 的 `/franchise`、`/shop` 就是這種
- **只刪檔、沒帶修改**：例如刪了 `plugins/firebase.client.ts` 卻沒帶新的 `login.vue`，
  正式站 Google 登入會顯示「尚未設定」

上線後一定要實測被刪的東西真的不見了（網址回 404、API 回 404）。

---

## 🔴 剛部署完，CDN 會回舊的 HTML

全站 routeRules 是 `s-maxage=600, stale-while-revalidate=86400`。過期後 CDN **先回舊的、在背景更新**。
本站元件樣式是**內嵌在 HTML 裡**的，所以舊 HTML ＝ 舊樣式，連 JS 檔名都是舊的。

2026-10-16 在 dev 驗按鈕顏色時，`getComputedStyle` 量到的還是舊的深藍 —— 差點判定成改壞。
實際是 CDN 回了部署前的頁面。

- **網址加一個沒意義的參數繞過快取**（`?v=<commit>`）：新的快取鍵一定是新版。用它確認新版確實上線
  ⚠️ **`/booking` 與 `/group-booking` 不要用 `?v=`**：那是廠商變體參數（`?v=nanshan`…），
  剛好撞到代號就會載到別的變體。改用 `?qa=<時間戳>` 這種表單不認得的參數
- 驗正式站某頁的新程式（不開瀏覽器、不污染 GA4）：curl 抓那頁的 HTML，取出所有 `/_nuxt/*.js`，
  逐一 curl 下來 grep 這次新加的字串（2026-10-19 生日欄：grep `1961-01-01` 與新紅字，命中 1 個 chunk）。
  選舊版一定沒有的字串當標記，才不會「舊版也通過」
- 一般網址約 10 分鐘內會被背景更新；業主那邊「剛上線怎麼沒變」先請他重新整理一兩次
- 站內換頁（SPA）載入的是新 JS，所以「點進去正常、直接打開網址不正常」也是這個原因

⚠️ **看標頭要用 GET，不要用 `curl -I`**。同一支文章 API，HEAD 量到 `cache-control: no-cache`、
GET 量到 `s-maxage=600, stale-while-revalidate` ＋ ETag，差點被當成改動造成的差異。
用 `curl -s -o /dev/null -D - <url>`。

---

## 驗正式站用 curl，不要開瀏覽器

GA4／GTM **只在 lkkwellness.com 載入**。用瀏覽器打開正式站就會送 page_view；帶測試用的 `utm_*`
更會在 GA4 留下假的來源，也會在測試瀏覽器留下 30 天的 UTM cookie。

- 正式站：用 curl 檢查 SSR 輸出（搜尋框的 `value`、骨架數、內嵌 CSS 有沒有新規則、狀態碼）
- 需要真瀏覽器的（點擊、computed style、cookie 行為）：**在 dev 做**，dev 不載入追蹤
- 測完刪掉測試 cookie：`document.cookie='lkk_utm=; Max-Age=0; path=/; secure; samesite=lax'`

---

## 量「頁面要下載多少 JS」

```bash
P=https://lkk-website-dev--lkkdev.asia-east1.hosted.app; T=$(mktemp -d); curl -s "$P/?v=x" > $T/p.html
tot=0; for f in $(grep -oE '/_nuxt/[A-Za-z0-9_.-]+\.js' $T/p.html | sort -u); do
  curl -s "$P$f" -o $T/x.js; g=$(gzip -c $T/x.js | wc -c); tot=$((tot+g))
  grep -q identitytoolkit $T/x.js && echo "含 Firebase Auth：$f $((g/1024))KB"; done; echo "壓縮後共 $((tot/1024))KB"
```

本機 build 的版本：起 `.output/server/index.mjs` 後一樣抓 HTML，檔案直接讀 `.output/public/_nuxt/`。
2026-10-16 基準：首頁 151KB → 107KB（拿掉全站的 Firebase）。

---

## 本機 production server ＋ 假上游

要驗「上游回什麼時我們怎麼反應」（文章被刪、上游 500、回 HTML 錯誤頁），線上做不到，就在本機做：

```bash
npm run build; echo $?
WORDPRESS_API_URL=http://127.0.0.1:8787/wp-json PORT=3999 HOST=127.0.0.1 node .output/server/index.mjs
```

- 假上游用 `node:http` 寫幾十行，提供切換模式的端點，詳見 [[lkk-wp-articles]] 的「已刪文章的快取清除」
- `.output/server` **不會讀 `.env`**，Firestore 連不上（log 會有 `Unable to detect a Project Id`），
  只適合驗不碰 Firestore 的路徑
- 要縮短快取時間就暫改常數並加 `// TEMP-LOCAL-TEST`，**commit 前 `grep -c TEMP-LOCAL-TEST` 必須是 0**
- 測完 `pkill -f ".output/server/index.mjs"`，不然下一次的 port 會撞

---

## 用 jiti 在瀏覽器外測純函式（比臨時端點省事）

repo 有 `node_modules/.bin/jiti`，可以直接跑 TypeScript：

```bash
node_modules/.bin/jiti /tmp/t.ts "$PWD/composables/useCsvExport.ts"   # t.ts 裡 await import(process.argv[2])
```

限制：被測的檔案**不能用 Nitro／Nuxt 的全域**（`defineEventHandler`、`useRuntimeConfig`、自動匯入），
也不能有 `~/` 別名 import（要用就設 `JITI_ALIAS`）。所以 2026-10-16 起的做法是
**把要測的邏輯抽成獨立模組，handler 明確 import 它**：
`server/utils/upload-name.ts`、`composables/useCsvExport.ts` 的 `toCsvCell`／`buildCsv`、
`utils/adminAccess.ts`。明確 import 還有一個好處：發 prod 漏帶那個檔案時 build 會直接失敗，
而不是執行時才 `ReferenceError`。

信件的快照比對（換掉 transporter 的做法）見 [[lkk-admin-leads]]。

---

## 內建瀏覽器的限制

- **彈出視窗一律被擋**：自動化的點擊開不了 popup。Google 登入只能測到「程式有呼叫
  signInWithPopup、視窗要開到 `<專案>.firebaseapp.com`」，實際登入要請人手動點
- 它的瀏覽器設定檔是 Stone 的、跨對話保留：已登入的帳號不要動，測試 cookie 要刪
- 打不開 Claude 自己在本機起的 localhost server（跑在不同環境）

---

## 工具本身的坑（都在 2026-10-16 踩過）

- 🔴 **寫檔工具會把內容裡的反斜線 u 加四碼十六進位，轉成實際的 Unicode 字元**。
  寫 `'\` + `uFEFF'` 進去，檔案裡變成看不見的 BOM；commit 訊息也一樣。註解還寫著「已改成跳脫字元」，
  等於防護沒生效又誤導人。**要寫這種跳脫就用 python 對位元組做替換，寫完數位元組確認**
  （`b.count(b'\xef\xbb\xbf')`）。
- zsh 的 `"$1:server/..."` 會被當成 `$1` 加 `:s` 修飾語，git 報「有歧義的參數」。寫成 `"${1}:..."`。
- 舊版 Python 的 f-string 大括號裡不能有反斜線（`re.findall(r"<article\b", h)` 放在 f-string 裡會 SyntaxError）。
  先算好變數再印。
- Chrome headless `--print-to-pdf` 寫完檔常常不結束：輪詢檔案大小穩定後 `pkill`，退出碼 144 是被我們殺的，不是失敗。
