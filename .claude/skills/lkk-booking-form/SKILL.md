---
name: lkk-booking-form
description: 改預約體驗表單（pages/booking.vue）之前必讀。這頁有 22 個欄位、一套「廠商變體」機制（?v=）、一份「不限年齡免費合作方名冊」（?co=）、七條同意事項，而且價格文案散在八個地方，其中六處靠一個 computed（pricingCopy）收斂，付款欄位與生日下方的免費提示是另外兩個 v-if。要動欄位、文案、價格規則、同意事項、合作案連結，或被問「怎麼幫某公司開一張專屬表單」「為什麼某個連結看到的價格不一樣」「名單的公司／來源欄是哪來的」「生日欄能不能從 1961 年開始」「名單上的生日怎麼是今年／0044 年」「代填的關係選項」「練健康同仁為什麼電話不用填」時使用。內含 2026-10-19 生日欄改成點開從 1961 開始（帶值＋未確認防呆＋範圍檢查）的做法、正式站生日資料的統計，2026-10-21「與學員的關係」只在預約表單多了「練健康同仁」（選了電話改選填），以及業主拍板與不做的項目。團體課報名（group-booking）是另一支整頁複製的實作，共用的只有兩個 config。UTM 連結產生器看 lkk-admin-campaigns。
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
直接讀 `variant.allAgesFree`（`pages/booking.vue:1061` 的 `id="paymentMethod"` 區塊、`:726` 的 `isFreeEligible && !variant.allAgesFree` 提示），
值由 `:318-320` 的 `watch(() => variant.value.allAgesFree` 填入。（行號以 2026-10-21 的 e16e2d1 為準，會跑掉時用引號裡的字串搜尋。）
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
關係選「練健康同仁」時，聯繫電話改**選填**（有填仍驗格式；2026-10-21 業主要求）。
這個選項只在預約表單：`config/formOptions.ts` 的 `bookingRelationshipOptions`＝共用清單在「其他」前插入 `STAFF_RELATIONSHIP`，
團課表單仍用共用的 `relationshipOptions`（團課後端代填電話必填）。
同仁沒填電話時，前端送空字串、後端照舊存 `contactPhone || phone`＝學員電話——
後台詳情因為「與學員電話相同就不顯示」而不出現，客戶預約 CSV 的「聯繫電話」欄（`pages/admin/leads.vue:121`）是學員電話（和本人填寫的列一樣）。
寫法（`pages/booking.vue`，搜 `contactPhoneOptional`）：
- `contactPhoneOptional = computed(() => formData.relationship === STAFF_RELATIONSHIP)`——不要另存旗標，切來切去才不會不同步。
- 標籤 `<span v-if="!contactPhoneOptional" class="text-red-500">*</span><span v-else class="text-ink-500 font-normal">（選填）</span>`，
  和 Email、LINE ID、同意事項的（選填）同一個樣式。
- `watch(contactPhoneOptional)`：改選同仁時**只清「請輸入方便聯繫的電話」那句**（`CONTACT_PHONE_REQUIRED_ERROR`），
  格式錯的紅字照留。這是生日欄之外第二個「改了就清紅字」的欄位；其他欄位（含「請選擇與學員的關係」）仍是按送出才更新。
- 格式檢查用沒 trim 的值，只打空白會被「請輸入有效的手機號碼」擋下，不會送出空白字串
  （後端 `contactPhone || phone` 會把空白當成有值存進去）。分店市話（02-…）也會被擋——業主還沒決定要不要放寬。
- 上線：dev `e16e2d1`、prod `5a6a1fa`（2026-10-21）。dev 站 headless 39 項全過（手機、電腦、團課五種寬度、文章頁）。
**選填**：Email（2026-10 業主改的）、LINE ID、病況備註、訓練目的、備註。

⚠️ 手機正則只收台灣手機、**不做 trim 也不去橫線**，使用者打「0912-345-678」會被擋。
   `cooperation`／`franchise` 用的是另一條容許市話的正則，`group-class` 會先
   `replace(/[\s-]/g,'')`。受眾含企業窗口或長輩時要考慮換。

### 出生年月日（2026-10-19 起：手機與電腦點開都從 1961 開始）

原生 `type=date`，業主要求長輩點開時直接停在 1961 年。**原生日期欄沒有「起始顯示日」的設定**，
選擇器一律從欄位現有的值開始；值是空的時候各平台停的地方都不一樣，而且都很遠：

| 平台 | 空值點開停在 | 打開時會不會自己寫值 |
|---|---|---|
| iPhone（Safari、LINE） | **今天**，而且**不理 min/max** | **會**，一打開就把今天寫進欄位並觸發 input |
| Android 的 LINE（WebView）、Chrome ≤151 | max（2010-01-01） | 不會，按「設定」才寫 |
| Android Chrome 152+（Material 對話框） | min 所在月（1920-01），上方預選今天 | 不會，但「確定」一開始就能按 |
| 桌機 Chrome／Firefox | 2010 年 1 月 | 不會，可以直接打年份 |

（WebKit `WKDateTimeInputControl.mm` 的 `setDateTimePickerToInitialValue` 已親自核對；
Android 與桌機是讀 Chromium／Firefox 原始碼推得，**都沒有實機驗證**。）

做法（`pages/booking.vue` 的 `primeBirthDate` 一帶，註解寫得很完整）：
- **主鍵 mousedown 時、欄位空白，就先帶 `1961-01-01`，不分裝置**（業主 10-19：電腦也要從 1961 開始）。
  不用 focus（iOS 舊版 WebKit 先把空值交給選擇器才派 focus，來不及）；
  不用 pointerdown／touchstart（手指放上去捲動頁面也會觸發）；鍵盤 Tab 進來不帶值，照常打字。
  電腦實測（headless Chrome、zh-TW 語系）：點年／月／日任一格帶值後，接著打 19550503 得到 1955-05-03，
  也就是焦點落在第一格（zh-TW 是「年」）；點日曆圖示時，click 當下（選單讀值的時機）值已是 1961-01-01，
  選單實際停在哪個月份沒驗到（headless 不會真的開選單）。
  代價：電腦只打年份就送出，月日會是帶入的 01/01（手機只轉年份滾輪也一樣），已接受。
  ⚠️ 演變：第一版用「上一個 pointerdown 是 touch」只對手機帶值——觸控筆是 `pen`；iOS 可能把點在欄位邊緣的 tap
  校正到欄位上（mousedown 落在欄位、pointerdown 可能落在外層；讀原始碼推得、未實機驗證），判斷時有時無；
  第二版改看 `any-pointer: fine`；
  第三版業主要電腦也帶，判斷整個拿掉。
- 🔴 **帶入的值是「未確認」（`birthDatePreset`）**：不算年齡（`confirmedBirthDate`）、
  不出現免費提示與免費付款選項、送出擋下「請點選學員的生日（目前是預設的 1961/1/1）」。
  不這樣做的話，點開就關的人會送出 1961-01-01——看起來像真的生日、又剛好符合 50 歲以上免費。
- 生日剛好 1961/1/1 的人重選同一天**不會觸發 input**（值沒變，WebKit 與 Blink 都直接 return），
  所以被擋下時才出現「生日就是 1961/1/1」按鈕。
- **範圍檢查 1920-01-01～2010-01-01 在 `validateForm`**：頁面沒有 `<form>`、送出鈕是 type=button，
  瀏覽器的 min/max 驗證從不執行；iPhone 的選擇器也不受限。超出範圍顯示
  「請確認出生年月日，年份請用西元（民國 50 年＝1961 年）」。⚠️ 後端仍不檢查。
  上限 2010-01-01 的由來：7/20 從 Next.js 搬到 Nuxt 時（`14ed934`）順手寫的，沒有業務理由（舊版年份列到今年）；
  它是寫死的日期、不會跟著年份走。**業主 2026-10-19 決定維持原樣，不要改成「滿 N 歲」，也不要再提。**
  範圍**含端點**（與 min/max 的語意一致），所以擋不到剛好 2010-01-01 或 1920-01-01。
  剛好 2010-01-01 推測是 Android（LINE／Chrome ≤151）或電腦停在 max 直接按確定（裝置查不到），現在靠「帶值＋未確認」避免；
  剛好 1920-01-01 沒有這種來源（Chrome 152+ 直接按確定寫入的是今天，會被範圍擋），只會是使用者自己選或打出來。
  不帶值的路徑（鍵盤、讀屏）仍可能送出端點值。
- 帶值時會清掉先前「請選擇出生年月日」的紅字；「生日就是 1961/1/1」只在紅字正好是未確認那句時出現。
- 生日欄改好就清紅字。另外關係改選「練健康同仁」時，會清掉「請輸入方便聯繫的電話」那句（只清這句，見「欄位與驗證」）。
  其他欄位維持按送出才更新。
- 上線：dev `87990e0`→`ef22b27`→`3cee7f9`，prod `d76e443`（2026-10-19）。
  各平台行為的完整整理、帶值時機的理由、測試腳本範本在個人 skill `native-date-input`。

**業主 2026-10-21 的決定（代填改名＋練健康同仁）**：
- 「練健康同仁」**只加預約表單**，團課不加；放在「其他」前面
- 後台兩頁的詳情與 CSV「填寫者」、客戶確認信「填表人」都改成「他人代填／他人代為填寫」
- 我提過、業主還沒回的（提一次就好，不要每次都問）：團課按鈕實測 360、375px 折成「否，我是幫他人代／填」留一個孤字
  （320px 是「…他人／代填」，390、414px 一行；其他寬度沒量，依 CSS 推算孤字區間約 348～377px）；
  同仁電話要不要收市話；學員案例、活動資訊列表頁底部的預約區塊要不要也刪

**業主 2026-10-19 拍板不做（不要再提）**：
- 生日上限 2010-01-01 維持原樣（見上）
- 正式站那 10 筆生日不合理、只能選臨櫃付款的舊名單：「不用管，有些是活動」
- 先選「臨櫃付款」、之後才把生日改成滿 50 歲時，付款不會自動換成免費、也沒有提醒：「沒事，暫時先這樣」

**為什麼要範圍檢查**：2026-10-19 統計正式站 218 筆預約名單，16 筆生日不合理——
7 筆生日在 2026 年 10、11 月（iPhone 一打開是當月月曆，疑似當成預約日期在點）、
3 筆剛好 2010-01-01（推測是 Android／電腦停在 max 直接按確定）、
6 筆年份小於 1920，其中 5 筆是 0027／0035／0040／0044／0062＝**把民國年打進西元欄**。
前兩類共 10 筆算出來都不到 50 歲（今年生的是 0 或 −1 歲、2010-01-01 是 16 歲），免費選項被藏起來，全部只能選臨櫃付款。
（請求日誌查不到裝置：App Hosting 的 CDN 把 User-Agent 全換成「Google」。）

⚠️ 驗證邊界：headless Chrome 跑的是桌機版選擇器，只能驗「帶值、未確認、範圍、紅字」這些邏輯
（2026-10-19 在 dev 站 45 項全過，含電腦點三格＋打字、日曆圖示、右鍵、Tab、捲動真的有捲；範本在 native-date-input）；
**選擇器實際從哪裡開始只能請業主實機看**——手機如此，電腦也一樣：headless Chrome 不會真的打開日期選單。
測試腳本的寫法：模擬手機（`touch: true`）用真的觸控點欄位、送出前先勾同意事項（否則送出鈕是 disabled）、
姓名永遠留空，確保一定被驗證擋下、不會真的寫進名單。

⚠️ 分店清單 SSR 時是**寫死的四間**，client 掛載後才用原生 `fetch` 打
`/api/public/stores` 覆蓋。所以 SSR 的 HTML 裡永遠是那份寫死的清單。

⚠️ `handleSubmit`（`pages/booking.vue:437`）**沒有再入保護**——開頭只有 `validateForm()`，
   擋重複送出全靠 1121 行的 `:disabled="isSubmitting || ..."`（行號以 e16e2d1 為準）。
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
  ⚠️ 但改 `formOptions.ts` 的 `relationshipOptions` 會兩邊一起變。只給預約用的是 `bookingRelationshipOptions`
  （多了「練健康同仁」，2026-10-21），要只動一邊就改衍生清單，不要動共用的那份。
- **四張前台表單沒有共用任何表單元件**，各自用 inline class。
  （`components/SearchableSelect.vue` 確實存在，但只服務後台名單的篩選列。）
- 送出成功後整段取代表單（不是另一頁），成功區塊的 `id="lead-success"`
  是 GTM 轉換事件的觸發依據，**不要改這個 id**。
- 錯誤處理只有 `alert()`。
- 通知信與確認信從 2026-10-16 起會把使用者填的值做 HTML 跳脫（主旨與 LINE 連結不動）。
  改信件內容前先做快照比對，見 [[lkk-admin-leads]]。
- iOS 的 `input[type=date]` 會撐破容器，而且修掉之後空值時高度會塌 —— 見 [[lkk-mobile-audit]]。
  生日欄的起始年份與範圍檢查見上面「出生年月日」。
