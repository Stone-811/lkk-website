---
name: lkk-deploy-verify
description: 確認一次改動真的到了 dev 或 prod。推完分支、要輪詢線上狀態、或想判斷「部署好了沒」時使用。內含依改動類型選驗證法的對照表、marker 四種會自爆的寫法，以及查「線上正在跑哪個 commit」的方法。發 prod 的流程本身見 CLAUDE.md 與 lkk-project-context。
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
