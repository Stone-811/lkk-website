---
name: lkk-image-swap
description: 幫練健康官網換照片／底圖／橫幅（首頁 Hero、服務卡、分店底圖、人物照、圖上有字的橫幅）。收到業主的圖片壓縮檔或「某頁換圖」需求時使用。內含中文檔名 zip 的解法、各位置的尺寸規格、壓暗參數、「換完一定要量對比」的正確算法，以及兩個只有實測才發現的點：圖上燒的字在手機會剩幾 px（要量全形 advance 不是墨跡高度）、display:none 不會阻止下載所以分斷點顯示的圖一定要 loading="lazy"。
---

# 換圖流程

> 人物照（教練／講師／經營團隊）另有專屬規格，見 `lkk-coach-import`。

## 收到 zip 先處理檔名編碼

業主從 Google Drive 下載的壓縮檔，中文檔名常常沒設 UTF-8 旗標，`unzip` 會噴
`Illegal byte sequence`。用 Python 逐一嘗試編碼：

```python
raw = info.filename.encode('cp437') if not (info.flag_bits & 0x800) else info.filename.encode('utf8')
for enc in ('utf-8', 'big5', 'cp950'):
    try: name = raw.decode(enc); break
    except UnicodeDecodeError: continue
```

檔名通常就是用途（`首頁-中高齡肌力訓練.jpg`、`首頁-最近門店底圖.jpg`），照著對位置。

## 各位置的規格

| 位置 | 路徑 | 比例 | 容器寫法 |
|---|---|---|---|
| 首頁 Hero 底圖 | `/images/home/hero.webp` | 16:9 | `object-cover` |
| 首頁分店區塊底圖 | `/images/home/locations-bg.webp` | 16:9 | `object-cover` |
| 首頁服務三卡 | `/images/services/{senior,special,performance}.webp` | **4:3** | `aspect-[4/3]` + `object-contain` |
| 分店資訊頁 Hero | `/images/locations/overview.webp` | 16:9 | `object-cover` |
| 分店卡片照 | `/images/locations/<slug>.webp` | 16:9 | `object-cover` |

⚠️ 服務卡是 `object-contain`，**圖不是 4:3 就會上下留白**（舊圖 1:1 就是這樣）。

**一律轉 WebP**：`Image.open(p).convert('RGB')`，寬度上限依上表，`quality=86, method=6`。
實測 JPG 147–414 KB → WebP 89–317 KB。舊的 `special.png` 一張 5.4MB，換掉省很多。

## 圖上有字的圖：先算它在手機上會剩幾 px

業主給的橫幅、海報常把說明文字燒在圖裡。**縮到手機寬度後那些字往往變成純裝飾。**
動手前先算，不要等上線才用眼睛看。

**要量的是「全形字的 advance」，不是墨跡高度。** 中文字的墨跡約是字級的 0.91，
拿墨跡當字級會低估約 10%：

```python
from PIL import Image
import numpy as np
a = np.array(Image.open('x.webp').convert('L'))
# 1) 先找說明文字那一條的 y 範圍（掃每列的暗點數，找連續區間）
# 2) 在該範圍內找相鄰字元的起點 x，相減就是 advance
#    例：起點 1474,1498,1523,1547 → advance ≈ 24.6px（墨跡量到只有 23px）
```

換算：`畫面字級 = advance × 容器寬 ÷ 圖片原寬`。
⚠️ 容器寬要用實際值——`container mx-auto px-4` 的 `container` padding 會被 `px-4` 蓋掉
（utilities 在 components 之後），而 `container` 的 max-width 卡在斷點值，
所以 1024–1279 與 1280–1535 各自是**固定寬度**，不是連續變化。

LKK4「實拿久穩」橫幅（2000px 寬，說明 24.6px）的實測：

| 視埠 | 圖寬 | 說明文字 | 判斷 |
|---|---|---|---|
| 375 | 343 | **4.2px** | 不能用 |
| 768 | 736 | 9.1px | 不能用 |
| 1024 | 992 | 12.2px | 勉強 |
| 1280 | 1248 | 15.3px | 可以 |
| 1536 | 1504 | 18.5px | 可以 |

→ 做法：圖掛 `hidden lg:block`，`lg` 以下用同一組資料重建**可讀的文字版**
（內容要與圖上逐字相同）。**不要只放圖然後期待它縮小後還能看。**

四角透明的 webp（`mode == 'RGBA'` 且角落 alpha 為 0）直接疊在底色上就好，
不要再包一層卡片框、也不要加 CSS 圓角——圖自己有。先確認再決定：

```python
im = Image.open(p); print(im.mode, im.convert('RGBA').getpixel((2,2)))
```

## 🔴 `display:none` 不會阻止下載

只在某個斷點顯示的圖，**一定要加 `loading="lazy"`**，否則被 `hidden` 掉的裝置
照樣把整張圖抓下來。LKK4 那張是 93 KB，等於每個手機訪客白白付一次流量。

實測（不要憑印象）：同一支圖複製成兩份，兩張都 `display:none`，一張加 `loading="lazy"`，
用 `python3 -m http.server` 開起來，看 access log：

```
GET /eager.webp HTTP/1.1" 200     ← 沒有 loading 屬性的被抓了
（lazy.webp 完全沒有請求）
```

這個專案沒有 `@nuxt/image`，`<img>` 是原樣輸出，**不會有人幫你補 lazy**。
Hero 的 LCP 圖維持 eager，其餘一律 lazy（`stages.webp` 本來就是這樣寫）。

## 深色底圖的壓暗參數（**不是常數，每張都要重量**）

```html
<img src="…" alt="" aria-hidden="true"
     class="absolute inset-0 w-full h-full object-cover opacity-60"
     style="filter: brightness(0.30)" />   <!-- 值依頁面而異，見下表 -->
```

⚠️ **brightness 用 inline style，不要用 Tailwind 任意屬性** `[filter:brightness(0.4)]`。
兩種都會編譯，但 Nuxt 把 critical CSS 內嵌進 HTML 的 `<style>`，用 class 寫法在驗證時
會 grep 不到 `.css` 檔而誤判成沒生效。

**已量過的值**（`opacity-60` 固定，只調 brightness）：

| Hero | brightness | 為什麼 |
|---|---|---|
| `/about` | **0.30** | 學員與教練合照 |
| `/booking` | **0.40** | 四位學員豎拇指，但另有五處文字要一起修（見下表） |
| `/lkk-academy` | **0.24** | 室內開燈的訓練營合照，比一般實拍亮。**2026-09-10 由 0.30 再壓暗**——h1 的橘字改用 `text-orange` (#FB720A，與 CTA 按鈕同色) 而非 orange-300，在 0.30 下對比只有 3.05，大字門檻 3.0 只多 0.05；0.24 後為 3.53。**本頁刻意比 /about 更暗，不要「順手改回一致」** |

`/lkk-academy` 的實測（示範為什麼不能照抄）：

| 文字 | 0.40 | 0.35 | 0.30 | 門檻 |
|---|---|---|---|---|
| eyebrow `orange-300` | 4.14 ❌ | 4.64 ✅ | 5.21 ✅ | 4.5 |
| eyebrow 後綴 `white/65` | 4.04 ❌ | 4.41 ❌ | 4.82 ✅ | 4.5 |
| 副標 `white/70` | 4.40 ❌ | 4.83 ✅ | 5.30 ✅ | 4.5 |

## object-position 怎麼決定：看主體在畫面的哪一段

`object-cover` 在寬螢幕會把 16:9 的圖壓成扁長條，裁掉上下。**先看照片再決定**：

| 主體位置 | 寫法 | 實例 |
|---|---|---|
| 頭在畫面上緣 | `object-top` | `/booking` 四人豎拇指、`/services` 團課——預設置中會把頭全切掉 |
| 主體在中段 | 不加（預設 50% 50%） | `/lkk-academy` 合照——上緣天花板、下緣桌面，置中剛好保住人臉 |

⚠️ 兩者相反，不要養成「一律加 object-top」的習慣。

## 🔴 換完一定要量對比，而且要算對

底圖一放，原本合格的文字可能就掉了。**半透明文字不能拿固定灰階當替身**，
必須做 alpha 合成：

```python
comp  = (img * 0.4) * 0.6 + NAVY * 0.4          # 壓暗＋疊在底色上
bg    = np.percentile(comp[文字區], 95, axis=0)  # 最壞情況
mixed = np.array(fg) * alpha + bg * (1 - alpha)  # ← 半透明文字的實際顏色
ratio(lum(mixed), lum(bg))
```

文字區取「垂直 25–75%、水平 5–55%」（左欄文案的落點），取 95 百分位當最壞情況。

**兩種門檻**：大字（≥24px 或 ≥18.66px 粗體）**3:1**；一般內文 **4.5:1**。

**已知的修法**（都在專案裡用過）：

| 症狀 | 改法 |
|---|---|
| 橘色 `#FB720A` 小字不足（約 3.2） | 換 **`text-orange-300`**（#fdba74，約 5.2） |
| `text-white/50` 小字不足（約 3.6） | 提到 `text-white/75`（約 5.8） |
| 大標橘字 3.16 | **不用改**，大字門檻是 3:1 |
| 橘字疊在 `bg-orange/20` 徽章上（2.30） | **`orange-300` 不夠**（只有 3.81，底色被墊亮了）→ 用 **`text-orange-200`**（4.75） |

⚠️ 最後一列是 `/booking` 踩到的：知識庫慣用的 `orange-300` 在**純深色底**上夠用，
但疊在半透明橘底（徽章、清單勾勾的圓圈）上就不夠——底色被自己的橘色墊亮，要再淡一階。

## 淺色區塊要放底圖 → 是一次配色改版

`LocationsSection.vue` 原本 `bg-cream-100` ＋ `text-navy-700` 標題。放底圖後深藍字讀不到，
只能整區改 `bg-navy-800`、標題與 CTA 轉白（白底卡片不用動）。
**業主說「換圖」時未必意識到這件事，交付時要主動講明。**

## 驗收

1. `npm run build`
2. 推 dev → 輪詢**線上 HTML 有沒有新檔名、舊檔名歸零**（不要只看 buildId）
3. 量對比（上面的算法），把數字寫進回報
4. 舊圖用 `git rm` 刪掉，別留孤兒檔
