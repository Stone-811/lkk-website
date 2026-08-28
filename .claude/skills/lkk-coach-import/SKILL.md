---
name: lkk-coach-import
description: 把業主給的教練／講師 CSV 與形象照匯入練健康官網（Firestore lkkdev/lkkprod ＋ fallback-data.ts ＋ public/images）。收到「某某店教練資訊.csv」、「補上某某照片」、要新增／刪除／更新教練或講師時使用。內含 CSV 解析地雷、照片取景對齊法、Firestore 寫入順序與安全閥。
---

# 練健康 教練／講師資料與形象照匯入

> 前置：專案脈絡看 `lkk-project-context`。Firestore 憑證組法、部署流程都在那份。
> 部署 repo：`/Users/stone/4.柚智源/練健康/3. 形象網站翻新`（dev 分支）。

## 資料落在三個地方，缺一不可

| 位置 | 生效時機 | 說明 |
|---|---|---|
| **Firestore `coaches` / `lecturers`** | **即時** | 線上實際顯示的來源，dev=`lkkdev`、prod=`lkkprod` 各一份 |
| `server/utils/fallback-data.ts` | 需部署 | Firestore 掛掉／查無資料時頂替。只改 Firestore 等於留一份舊資料隨時可能對外 |
| `public/images/coaches/<store>/*.webp` | **需部署** | 圖檔 |

## 🔴 最容易踩的雷：Firestore 即時、圖檔要部署

寫 photo 欄位**之前**，那個環境必須已經能 200 取到圖檔。順序反了，線上立刻破圖。

```
圖檔進 repo → git push → 輪詢確認該站 curl -I 圖檔回 200 → 才寫該環境的 Firestore photo
```

dev 與 prod **各自**走這個順序，不要一次寫兩個環境的 photo。
（2026-08-25 補林承緯照片時，先寫了 lkkprod 才發現圖檔還沒上 prod，正式站出現破圖。
當下補救＝把 prod 那筆 photo 還原成空字串，等部署完再寫回。）

三個渲染點現在都有 `@error` 退路（404 退回姓氏佔位），但那是最後一道保險，不是可以亂寫的理由。

## 步驟

### 1. 解析 CSV → dry-run 給人看

欄位（七張／西門／南京版）：`姓名, 英文名字, 分店, 職稱, 學歷/經歷, 證照, 專長1, 專長2, 專長3`
松江版另有 `官方LINE, 電話, Instagram, Email` 等欄。

⚠️ **電話／Email／Instagram／個人 LINE ID 一律不匯入**（個資，collection 也沒這些欄位）。
⚠️ **英文名字沒有對應欄位**，前台不顯示，直接丟棄（要跟業主說一聲）。

`學歷/經歷` 是一格塞兩段，實測遇過四種寫法，解析器都要吃：

| 寫法 | 範例 | 處理 |
|---|---|---|
| 標準 | `學歷：\n…\n\n經歷：\n…` | 依標題切 |
| 半形冒號＋空格 | `經歷 :` | 正規表示式用 `^經歷\s*[：:]\s*(.*)$` |
| **標題與第一筆同行** | `經歷：博凱音樂用品…` | 同上，**捕獲組的內容要留著當第一筆** |
| **合併標題** | `學歷/經歷`（沒有分開兩段） | 第一行算學歷、其餘算經歷 |
| **完全沒有「經歷：」** | 林稚荃（西門） | 依空行分段，第 2 段視為經歷 |

其他地雷：`•` 項目符號要去掉；「證照與研習：」是標題不是一張證照；證照有階層時
`-` 開頭＝前一項的子項，**前導空白但無破折號者是新的機構標題**。

**錯字修正做成明列的對照表**，不要散在程式各處——要能逐條回報給業主。已知會重複出現的：
`證證照`→證照、`紅字會`→紅十字會、`認設`→認證、`曁`→暨、`學系系學士`→`學系 學士`、
簡體字（`海盗`/`学院`）、證照等級 `LI`→`L1`、全形破折號 `－`、尾端空白、`ACSM - EP`→`ACSM-EP`。

**看不懂的不要自己補**：保留原文並在回報裡列出來問業主。業主先前的指示是
**「不確定的就刪掉」**，但那是針對歸屬不明的子項，整筆經歷不要擅自刪。

解析完**印出每個人的四個陣列讓人肉眼看過**再往下走。

### 2. 寫 Firestore（一次性 Node 腳本，不要用後台 UI）

後台 `pages/admin/coaches/[id].vue` 的「學歷」是單行輸入、用逗號切陣列，
CSV 裡含逗號的學歷會被切壞。

腳本要點：
- **放專案目錄執行**（scratchpad 沒有 node_modules），副檔名 **`.cjs`**（package.json 是 `type: module`）
- firebase-admin **v14 模組化 API**：`require('firebase-admin/app')` 的
  `initializeApp/applicationDefault` ＋ `require('firebase-admin/firestore')` 的 `getFirestore/FieldValue`
- 以 **`storeId` + 姓名** 對應既有文件（更名要有對照表，否則會被當成「不在 CSV」而刪除）
- 保留既有的 `docId`、`slug`、**`photo`**（CSV 沒有照片路徑，不要覆蓋成空）
- **安全閥**：刪除筆數、新增筆數、CSV 總人數任一超出預期就 `throw` 中止
- 先 **dry-run** 印出「將刪除／將新增／將更新」清單，確認後才 `apply`
- 刪除前把該店現有資料完整備份成 JSON 到 scratchpad

**dev 先跑 → 打 `/api/public/coaches?store=<slug>` 驗 → 再跑 prod。**

### 3. 同步 `fallback-data.ts`

不要手打。匯完 Firestore 後 dump 該店資料，用腳本產生 TS 區塊，
以字串定位整段抽換（`src.index('  nanjing: [')` 到 `src.index('  songjiang: [')`），
再 `npm run build` 驗語法。

### 4. 形象照

**規格**：750x1000（3:4）WebP、保留 alpha 透明、35–60KB（quality 78–82）。
檔名是姓名拼音（`林承緯` → `lin-chengwei.webp`），放 `public/images/coaches/<store-slug>/`。

**⭐ 取景要對齊既有照片，不是置中裁切。** 業主給的原圖可能是橫幅（2048x1152），
直接裁 3:4 會跟同排卡片大小不一。做法：

```python
# 既有照片量出來的基準：主體高度 ≈ 畫框 91%、底部切齊、水平置中
a = np.array(Image.open(src).convert('RGBA'))[..., 3]
ys, xs = np.where(a > 30)                      # 主體 bbox
scale = (1000 * 0.91) / (ys.max() - ys.min())  # 用「高度」當基準，寬度隨人浮動別用
sm = im.resize((round(im.width*scale), round(im.height*scale)), Image.LANCZOS)
off_x = round(750/2 - (xs.min()+xs.max())/2 * scale)   # 主體中心對畫框中心
off_y = 1000 - sm.height                                # 底部切齊
canvas = Image.new('RGBA', (750, 1000), (0,0,0,0)); canvas.paste(sm, (off_x, off_y), sm)
for q in (86, 82, 78, 74, 70):
    canvas.save(dst, 'WEBP', quality=q, method=6)
    if os.path.getsize(dst) <= 46000: break
```

驗收：主體上緣應落在 1–9%、下緣 ~100%、高度 ~91%。
**做完一定要輸出「新照片與既有照片並排」的比對圖**再交件，數字對不代表看起來對。

**不透明 PNG 的例外**：`alpha` 最小值 ≥250 表示沒去背，這時看四角顏色——
純白底沒問題，非白底（如淺灰 230）要 flood fill 轉白，否則白底容器上會多一塊色塊。

### 5. 刪除離職者

業主政策：**「不在 CSV 清單上的教練就刪除」**（2026-08-24 確認）。
連同 `public/images/coaches/<store>/` 底下的孤兒照片一起刪。

⚠️ **教練歸教練、講師歸講師**（2026-08-25 業主明示）。
`coaches` 與 `lecturers` 是兩份獨立名單，同一個人可能兩邊都有。
從教練名單移除**不代表**要動講師名單，不要自作主張連動。

## 驗證

```bash
# 該店名單、職稱、缺照
curl -s "<站台>/api/public/coaches?store=<slug>" | python3 -m json.tool

# 全站缺照清單
curl -s "<站台>/api/public/coaches" | python3 -c "
import json,sys; d=json.load(sys.stdin)['data']
print([x['name'] for x in d if not x.get('photo')])"
```

瀏覽器端（`/team-intro/coaches` 是 `useLazyFetch`，SSR HTML 只有骨架，**要等 client 載完**）：

```js
// 破圖檢查
[...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length
```

⚠️ **驗 `@error` 退路不能用 JS 直接改 `img.src`**——Vue 不知道 DOM 被外部改了，測出來是假的。
正確做法：在 **dev** Firestore 把某人 photo 暫時指到不存在的檔案 → 重新載入頁面 → 確認
`<img>` 被移除、姓氏佔位出現、全頁破圖數 0 → **測完務必還原**。

## 現況

四店 49 位，文字資料全部來自業主 CSV（松江 7／七張 11／西門 17／南京 14）。
缺形象照 7 位：楊君澤、蔡侑儒、張子誼（松江）、陳存灝（七張）、林稚荃、盧立軒（西門）、許之丞（南京）。
講師 **15 位**（練健康 11／海外 1／合作 3）。石峻瑋 2026-08-28 依業主指示刪除，
錯誤照片 `liuchang.png` 一併移除。仍有 3 位不是去背照（李柏橋／吳禎明／阮玟文）。

**講師 CSV 與教練 CSV 格式不同**：講師版是**轉置**的（第一列是姓名、每一列一個屬性），
欄位為 講師等級／學歷背景／專業經歷／專長領域／專業證照／授課經歷／自我介紹(編修版)／
自我介紹摘要／講師照片檔案。額外的解析地雷：
- **頓號不一定是分隔符**：「中高齡、特殊族群肌力訓練」是一個詞，拆開會變成兩筆錯的專長
- **縮排續行**：整行以空白開頭代表接續上一筆（周千媚的「發表者」）
- **`- ` 開頭是子項**：要併回前一筆（阮玟文的社群數據）
- 原表常用**連續 3 個以上空白**當同一格內的分隔，要一起拆
- 職稱欄可能有兩行（等級＋專業身分），以「・」合併
- `自我介紹(編修版)` 是給網站用的第三人稱版本；`自我介紹摘要` 是第一人稱長版，未採用

詳細沿革見記憶 [[lkk-web-coach-data]]。
