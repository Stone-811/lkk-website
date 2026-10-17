---
name: lkk-booking-form
description: 改預約體驗表單（pages/booking.vue）之前必讀。這頁有 22 個欄位、一套「廠商變體」機制（?v=）、一份「不限年齡免費合作方名冊」（?co=）、七條同意事項，而且價格文案散在八個地方靠一個 computed 收斂。要動欄位、文案、價格規則、同意事項、合作案連結，或被問「怎麼幫某公司開一張專屬表單」「為什麼某個連結看到的價格不一樣」「名單的公司／來源欄是哪來的」時使用。團體課報名（group-booking）是另一支整頁複製的實作，共用的只有兩個 config。UTM 連結產生器看 lkk-admin-campaigns。
---

# 預約體驗表單

`pages/booking.vue`。全站最重要的轉換頁，名單從這裡進 Firestore 的 `leads`。

> 版型草稿與逐條改稿的工作法見 [[lkk-owner-draft]]；
> 後台的 UTM 連結產生器見 [[lkk-admin-campaigns]]；
> 手機可讀性見 [[lkk-mobile-audit]]。

---

## 🔴 動手前先知道：變體機制早就存在

業主說「幫某公司開一張專屬表單」時，**不要從複製整頁開始**。
`config/bookingVariants.ts` ＋ 網址 `?v=<代號>` 已經做過多次，加一段設定就好。

線上實測可開（2026-10-15）：

```
/booking?v=abbott      亞培
/booking?v=gigabyte    技嘉
/booking?v=nanshan     南山（不限年齡免費）
/booking?v=freetrial   通用的「不限年齡免費」，公司由 ?co= 決定
```

未知的 `?v=` 值**無聲退回一般表單** —— 不會壞頁、不會報錯，但那批名單的
公司與來源會是空的。**打錯一個字母就是這個結果，而且沒有任何告警。**

`BookingVariant` 能覆寫的只有這幾項：

| 欄位 | 作用 |
|---|---|
| `hero` | badge／title／titleHighlight／subtitle／checklist／ctaText |
| `allAgesFree` | 解除「50 歲以上才免費」，見下節 |
| `lockStoreId` | 鎖定分店（填 id／slug／店名皆可） |
| `hideSources` | 隱藏「從哪裡得知」整區 |
| `extraSources` | 追加一個得知管道選項 |
| `company` / `leadSource` | 名單歸因 |
| `adminLabel` | 只給後台下拉顯示用（沒有 company 時才需要） |

⚠️ `lockStoreId` **四個現有變體一個都沒用過**，等於沒有實戰驗證。
   而且鎖的分店若打錯，`lockedStore` 會是 null，畫面直接顯示那個打錯的字串，
   `formData.storeId` 永遠是空的 → 驗證永遠擋不住也過不了（必填星號在鎖定時被隱藏）。

⚠️ `extraSources` 的字串**即資料值**：會寫進 `payload.sources` 與頂層 `sourceChannel`，
   直接進後台名單、CSV 與兩封通知信。**發出去收到名單之後改不掉**
   （`leads` 的 PATCH 白名單只放行 `status` 與 `internalNote`）。
   南山那次加「南山健康守護圈」是業主明示的個案，不進全站清單。

---

## `allAgesFree` 會連動八處，不要只改一個地方

`pricingCopy`（`pages/booking.vue` 的 computed）依這個布林一次決定：

| 位置 | 一般 | 不限年齡免費 |
|---|---|---|
| Hero 標籤 | 50歲以上免費體驗 | 不限年齡・免費體驗 |
| Hero 主標 | 第一堂課／讓我們陪你開始 | 不限年齡／體驗課完全免費 |
| 底部註記 | 50歲以上免費・未滿50歲 $500 | 本活動不限年齡免費 |
| FAQ 費用 | 50歲以上免費；未滿50歲 $500 | 本活動不限年齡，首次體驗完全免費 |
| FAQ 付款 | 體驗結束後至櫃台臨櫃繳費 | 本活動免費，無需付款 |
| 流程卡標籤 | 50歲以上 免費／未滿50歲 $500 | 不限年齡 免費 |
| **付款方式欄位** | 必填下拉 | **整欄隱藏**，自動填「活動免費」 |
| 生日下方的免費提示 | 滿 50 歲時顯示 | 不顯示 |

⚠️ **其中只有六處由 `pricingCopy` 收斂。** 付款欄位與生日提示另有兩個各自的 `v-if`
直接讀 `variant.allAgesFree`（`pages/booking.vue:966`、`:641`），值由 `:239-241` 的 watch 填入。
**這兩處是改價格規則時最容易漏掉的。**

集中設計是刻意的（註解寫「避免價格訊息散落多處各自分支」），但它沒有涵蓋那兩個欄位的顯示條件。
**要加第三種價格規則（指定金額、前 N 名免費）目前做不到** ——
付款下拉是寫死的兩個 option，`pricingCopy` 是布林二分。

### ⚠️ 已知落差：`<meta name="description">` 不跟著走

那段是寫死的「第一堂體驗課，50歲以上免費、未滿50歲 $500」。
所以**全齡免費的連結貼到 LINE 或 FB，預覽卡會顯示錯誤的價格**。
頁面本身是對的，只有預覽卡錯。線上的 `?v=nanshan` 一直都是這樣（2026-10-15 查證）。

---

## `?co=` 不限年齡免費合作方名冊

`config/freeTrialPartners.ts`。搭配 `?v=freetrial` 使用：

```
/booking?v=freetrial&co=taiwanlife
          ↑ 行為（不限年齡免費）      ↑ 是誰（公司名、到期日）
```

**為什麼拆兩層**：這類合作方之間真正不同的只有公司名與期間，行為完全一樣。
每一家各開一個變體會讓 `bookingVariants` 無限長，而且每家都要重寫一次 Hero 文案。

🔴 **`co` 帶的是代號不是公司名，查不到就當沒帶。** 若讓網址上的字直接進
`payload.company`，任何人都能偽造合作方名稱 —— 那串字會進通知信主旨的【】、
進名單、進後台「公司」篩選的選項清單，而且事後清不掉。

⚠️ **上面這道防護只在前端成立**（2026-10-16 稽核）。`server/api/leads/booking.post.ts` 直接收下
   `body.company`、`body.paymentMethod`、`body.leadSource`，只檢查姓名、電話、分店、方便時段四個必填。
   直接 POST 就能寫入任意公司名與「50歲以上免費」，後端不會拿生日核對。`group-class.post.ts` 同理。
   要在後端重算時（修正計畫 W3），**照字面做會闖禍**，動工前先讀：
   - 前端目前**沒有送 `co`**，後端只用 `formVariant` 重算的話，台灣人壽連結的名單公司欄會全變空白
   - `leadSource` 本來就由 `?src=` 決定、可以自由帶，不能改成只從 config 重算
   - `paymentMethod` 的合法值是送出的 value（`活動免費`、`50歲以上免費`、`臨櫃付款`），不是選單上的顯示文字
   - 布林欄位（`filledBySelf`、`hasMedicalCondition`）若被 `String()`，`'false'` 為真，**每封通知信都會標「有特殊健康狀況」**
   - 錯誤回應要維持 `{ success:false, error:'中文' }`；改成 `createError` 的話前端只會顯示「true」

🔴 **到期日用台北時間算。** Cloud Run 跑 UTC、台灣是 +8，直接比會提早八小時失效。
用 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })` 取 `YYYY-MM-DD` 再字串比大小。

⚠️ **只擋到期、不擋開始**（刻意）：合作方上線前通常會要求先看頁面，
擋開始日會讓他們看到一般表單的價格而誤會。開始日寫在 `note` 裡備查。
代價是**設定推上去就立刻生效**，連結要等到檔期才發。

🔴 **到期日只關掉歸因，沒有關掉免費。**（2026-10-16 查證）
   `allAgesFree: true` 掛在 **`freetrial` 變體**上（`config/bookingVariants.ts:101-105`），
   而 `withFreeTrialPartner` 在合作方過期時是 `return variant`（原封不動，:119-121）。
   所以到期後 `?v=freetrial&co=taiwanlife` **仍然是不限年齡免費的頁面**，
   只有 `payload.company` 變成 null。

   要在到期日真的收掉免費，必須額外處理（過期時連 `allAgesFree` 一起拿掉，
   或改／刪 `bookingVariants` 的 `freetrial` 那一段）。**目前沒有做。**
   另外也沒有「顯示活動已結束」的畫面。

⚠️ 後台 `/admin/leads` 的「公司」篩選選項是 `bookingVariants` ∪ **名冊** ∪ 名單實際值。
   加名冊這一份不能省，否則走 `?co=` 的合作方要等第一筆名單進來才長得出選項。

---

## 欄位與驗證

22 個 `formData` key，全部寫在頁面裡，沒有抽成元件。

**必填**：姓名、手機（`/^09\d{8}$/`）、性別、出生年月日、健康狀況（是／否）、
分店、方便時段（至少 1）、付款方式、得知管道、同意事項勾選。
**條件必填**：「他人代填」時要填關係／代填者姓名／聯繫電話。
**選填**：Email（2026-10 業主改的）、LINE ID、病況備註、訓練目的、備註。

⚠️ 手機正則只收台灣手機、**不做 trim 也不去橫線**，使用者打「0912-345-678」會被擋。
   `cooperation`／`franchise` 用的是另一條容許市話的正則，`group-class` 會先
   `replace(/[\s-]/g,'')`。受眾含企業窗口或長輩時要考慮換。

⚠️ 分店清單 SSR 時是**寫死的四間**，client 掛載後才用原生 `fetch` 打
`/api/public/stores` 覆蓋。所以 SSR 的 HTML 裡永遠是那份寫死的清單。

⚠️ `handleSubmit`（`pages/booking.vue:354`）**沒有再入保護**——開頭只有 `validateForm()`，
   擋重複送出全靠 1026 行的 `:disabled="isSubmitting || ..."`。
   對照 `pages/group-booking.vue:291-292` 的 `handleSubmit()` 開頭就有 `if (submitting.value) return`。
   ⚠️ 兩頁的識別字不同名：booking 的 ref 叫 `isSubmitting`（187 行），
   group-booking 叫 `submitting`（227 行）。跨檔引用時不要憑記憶套用另一頁的名字。

⚠️ **四張表單一行機器人防護都沒有**。CLAUDE.md 與 README 都寫了要做 reCAPTCHA，
   但程式碼是 0 命中、package.json 無相關套件。新開投放用的表單時要知道這件事，
   不要讓業主以為有。

---

## 同意事項（2026-10-15 改版，業主定稿）

九條整併為七條。兩處是**實質變更不是潤稿**，業主已確認：

- 第五條：從「肖像權及所有權均屬於練健康」改為「**無償使用**於宣傳、教學及紀錄等用途」，
  並新增「不希望入鏡可告知」的退出機制
- 第四條：未保留舊第九條「願就自身**或他人**健康、安全意外事件負責」一句；
  對自身的部分由新第三條「願意承擔相關風險」涵蓋

⚠️ **新第一條寫「每人限享一次免費體驗資格⋯實際資格以系統紀錄為準」，
   但系統沒有任何去重邏輯** —— 同一支手機號碼仍可重複送出。
   現階段是人工在後台比對。要系統擋是另一件工。

⚠️ 同意事項**只存在於 `/booking`**。`group-booking`／`cooperation`／`franchise`
   都沒有這個區塊，所以不會產生不一致。

`TERMS_OPTIONAL_SOURCES = ['參觀','電話詢問']` 時勾選改為選填（現場已說明過）。

---

## 慣例與地雷

- **`/group-booking` 是另一支獨立實作**（顯著行重疊只有約 9%），不是共用元件。
  739 行、自己的 `formData`
  （欄位名都不同：`isFillerSelf`／`fillerName` vs `filledBySelf`／`bookerName`、
  `store` 存整串字 vs `storeId` 存 id、`ageRange` 三段區間 vs `birthDate` 精確日期），
  自己的變體設定檔 `groupClassVariants`。兩者只共用 `config/formOptions.ts`
  與 `config/referralSources.ts`。**改 booking 不會自動影響它。**
- **四張前台表單沒有共用任何表單元件**，各自用 inline class。
  （`components/SearchableSelect.vue` 確實存在，但只服務後台名單的篩選列。）
- 送出成功後整段取代表單（不是另一頁），成功區塊的 `id="lead-success"`
  是 GTM 轉換事件的觸發依據，**不要改這個 id**。
- 錯誤處理只有 `alert()`。
- 通知信與確認信從 2026-10-16 起會把使用者填的值做 HTML 跳脫（主旨與 LINE 連結不動）。
  改信件內容前先做快照比對，見 [[lkk-admin-leads]]。
- iOS 的 `input[type=date]` 會撐破容器，而且修掉之後空值時高度會塌 —— 見 [[lkk-mobile-audit]]。
