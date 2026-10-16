---
name: lkk-admin-campaigns
description: 後台「UTM 活動」連結產生器（/admin/campaigns）。要動活動資料結構、utm_source／utm_medium 清單、連結組裝、或被問「業主怎麼自己產投放連結」「utm_medium 可不可以自己填」「改了來源清單會不會動到已經發出去的連結」時使用。內含 2026-10-15 當天連改六輪的模型演進與每一版為什麼被推翻、GA4 的 medium 必須是標準值的理由、凍結歷史對照表的做法，以及「選項存 Firestore、只開放新增與停用」這個全站共用的模式。表單本身看 lkk-booking-form，參數規範看 docs/廠商表單網址規範.md。
---

# 後台 UTM 活動

`pages/admin/campaigns.vue` ＋ `utils/campaignLinks.ts` ＋ `config/utmChannels.ts`
＋ `server/api/admin/campaigns/*` ＋ `server/api/admin/utm-channels/*`。

業主流程：建一檔活動 → 一條一條把連結加進去 → 一次送出 → 複製去投放。

> 參數的對外規範（給行銷看的）在 `docs/廠商表單網址規範.md`；
> 表單本身見 [[lkk-booking-form]]；部署驗證見 [[lkk-deploy-verify]]。

---

## 🔴 `utm_source` 與 `utm_medium` 是獨立的兩個維度

這點我一度搞錯並寫進程式註解，業主追問「為什麼不能獨立」才更正。

```
utm_medium  =  流量的「性質」—— 怎麼來的
utm_source  =  流量的「來處」—— 從哪裡來
```

同一個 source 配不同 medium 全都合法，而且是必要的：

| 組合 | 代表什麼 |
|---|---|
| `google` / `cpc` | Google Ads |
| `google` / `organic` | Google 自然搜尋 |
| `google` / `referral` | 從某個 Google 產品的連結點過來 |

medium 該填什麼取決於**你實際做了什麼**，不取決於 source 是誰。

**所以「把 source 與 medium 綁成一組固定的投放管道」是錯的設計** ——
它把 Google 永久鎖在 `cpc`，表達不出 `google/organic`。2026-10-15 已拆開（commit `e5fc44d`）。

⚠️ 同一個 `utm_source` 出現在兩個項目裡**不該被擋**。
   一度加過「兩者在 GA4 會合併計算」的檢查，那句話不成立：
   GA4 的 source/medium 是成對的維度，`google/cpc` 與 `google/organic`
   在報表裡是分開的兩列，只有「只看 source」那種檢視才會加總。

## 🔴 但 `utm_medium` 不能開放自由打字

**GA4 的「預設管道分組」是拿 medium 去比對特定字串的。** 填清單外的值，
那批流量會被歸到 **Unassigned**，而且**歷史資料改不回來** ——
不是改設定就能補，是那段期間的報表永久歸錯類。

目前允許七個：`referral` `social` `email` `cpc` `display` `affiliate` `organic`

⚠️ `offline` 已於 2026-10-15 移除（業主要求）。它不是 GA4 認得的值，
   用它的流量一直歸在 Unassigned。唯一在用它的「傳單」(`flyer`) 同日一併移除。

---

## 🔴 凍結歷史對照表：改選項不能動到已發出的連結

`config/utmChannels.ts` 的 `LEGACY_CHANNEL_MAP`（`Object.freeze`）。

**為什麼需要它**：舊活動存的是 `{ channels: ['LINE','傳單'] }` 這種管道名稱，
連結是**讀取當下即時組出來的、不是存死的**。如果讓它去查「現在的來源清單」，
清單一被編輯（例如拿掉傳單），後台顯示的舊連結就會跟**實際已經發出去、
還在流通**的那些不一致 —— 而且無聲無息，沒有任何錯誤。

所以 `resolveChannel` **先查凍結表**，查不到才退回現在的清單。
凍結表保留 2026-10-15 之前的完整七組，**永不更動**。

這個觀念可以推廣：**任何「即時組裝、不存死」的對外識別字串，
它依賴的對照表都要凍結一份。**

---

## 資料模型與三種歷史形狀

一檔活動＝**一筆** Firestore 文件（`campaigns`），代號唯一。
不拆成多筆，因為代號是名單對照活動的 join key，拆開會讓「這檔活動叫什麼名字」
有多個答案。

```js
{ name, utmCampaign, note, isActive,
  links: [{ targetPath, variantKey, utmSource, utmMedium, utmContent }, …] }
```

每一條連結**五項全部獨立**：自己的目標表單、變體、來源、性質、素材。

### 三種形狀，統一由 `normalizeCampaignLinks` 轉換

| 形狀 | 哪裡有 |
|---|---|
| `{ targetPath, variantKey, channels[] }` | **正式站 2026-10-15 23:44（commit `dde0d75`）之前的資料** |
| `{ targetPaths[], variantKeys{}, utmSource, utmMedium }` | 只在 dev 存在過，沒上過正式站 |
| `{ links[] }` | 現行 |

列表摘要、編輯載入、連結組裝全部走這一支，不要各自分支。

🔴 **轉換必須無損**：轉出來的每一條連結網址要與轉換前**逐字相同**。
   這些連結已經發出去在流通，後台顯示的若與實際不一致，是最難察覺的那種錯。

   ⚠️ **這個 repo 沒有測試框架，無損性沒有自動化測試。**（2026-10-16 查證：
   全專案零個 `*.test.ts`／`*.spec.ts`，package.json 也沒有測試指令。）
   改這段要照 [[lkk-deploy-verify]] 的「臨時公開端點測純函式」手測三種形狀各一次。

---

## 「選項存 Firestore、只開放新增與停用」是全站共用的模式

`utm_source` 清單走這一套，範本是「從哪裡得知」的選項：

```
config/<xxx>.ts                     預設值，同時是 Firestore 讀不到時的退路
settings/<xxx>（Firestore）          業主新增的，疊在預設上面
/api/admin/<xxx> GET + PATCH        action: 'add' | 'toggle'
```

🔴 **只開放新增與停用，沒有「修改」。** 這些字串會寫進名單或 GA4，
   發出去之後改字面都救不回來（`leads` 的 PATCH 只放行 `status`／`internalNote`，
   GA4 的歷史資料更不可能回填）。停用只是不再出現在選單。

🔴 **GET 與 PATCH 都要在文件不存在時先用預設清單當種子。**
   `referral-options` 在 2026-09-18 漏了這一步，業主回報「無法停用」
   （PATCH 在空陣列裡找不到項目），而且第一次「新增」會把預設選項全部弄丟。

⚠️ **Firestore 讀不到時 GET 不要丟 500**，退回預設清單。
   活動頁靠這份清單渲染，丟 500 會讓整頁不能用。

⚠️ **dev 與 prod 的 Firestore 是分開的專案。** 在 prod 後台新增的來源不會出現在 dev。
   活動資料本來就是這樣（`campaigns` 也在 Firestore），所以一致，但要知道。

---

## 模型演進：四個版本、六個 commit，全在 2026-10-15 當天

記下來是為了避免再繞一次。

| 版本 | 模型 | 為什麼被推翻 |
|---|---|---|
| 原本 | 一張表單 × N 個固定管道 | 管道綁死 source/medium，表達不出 google/organic |
| 批次新增多代號 | 一次建 N 檔活動 | 業主評估後還原 —— 區分管道是 `utm_source` 的工作，不需要為每個管道各開一個代號 |
| source/medium 拆開 + 多張表單 | 一組 source/medium × N 張表單 | 不同管道該用不同 medium，一組套到多張會標錯 |
| **現行** | 一個代號 + N 條獨立連結 | — |

**一個代號搭配多條連結，在後台與 GA4 本來就分得出來**：
`/admin/leads` 的「UTM 活動」與「UTM 來源」是兩個獨立篩選維度，
CSV 也是 UTM來源／UTM形式／UTM活動／UTM素材 四個獨立欄位。
所以不要為了區分管道而濫開活動代號。

---

## 其他

- `CAMPAIGN_TARGETS` 只列 `/booking` 與 `/group-booking`（業主 2026-09-11：
  其餘頁面沒有表單，帶 utm 進去產不出可歸因的名單）。
- `utm_campaign` 強制小寫（`CAMPAIGN_CODE_RE`）。`useUtm` 擷取時**不做 lowercase
  也不比對白名單**，`Nanshan` 與 `nanshan` 會在後台裂成兩個活動且救不回來。
- 連結一律用「目前所在環境」的網域現算，**不存進 Firestore** ——
  在 dev 後台建的活動若存了完整網址，投放出去名單會全部進 lkkdev。
- 變體下拉的顯示名稱優先序：`company` → `adminLabel` → 只剩代號。
  不要在 `summarizeVariants` 裡特判代號字串，否則每多一個不具名變體就要再改一次。
- **後台的畫面與 Firestore 寫入本機驗不到**（`/api/admin/*` 未登入一律 401、
  頁面 302 導向登入）。純函式怎麼測、驗證邊界怎麼誠實標註，見 [[lkk-deploy-verify]]。
