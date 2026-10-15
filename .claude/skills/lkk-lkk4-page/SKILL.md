---
name: lkk-lkk4-page
description: 改 /lkk4 賽事頁（pages/lkk4.vue）之前必讀。這頁把同一個賽制事實重複寫在 2–5 個地方，改一處不改其他處就會自相矛盾——內含完整的「同一事實散落在哪裡」對照表、頁面區塊與資料陣列的對應、實拿久穩橫幅的斷點與理由，以及業主用 class 字串指位置的改稿工作法。成績資料（lkk4_records／CSV 匯入）看 lkk-lkk4-records，不在這裡。
---

# /lkk4 賽事頁

`pages/lkk4.vue` 一支約 980 行（2026-10-09），是全站改動最頻繁的頁面。資料全寫死在 `<script setup>`
的常數陣列裡（**沒有 Firestore、沒有後台**），模板只負責排版。

> 版型來源與草稿流程見 [[lkk-owner-draft]]；部署驗證見 [[lkk-deploy-verify]]；
> 成績查詢與 CSV 匯入見 [[lkk-lkk4-records]]。

---

## 🔴 同一個事實散落在哪裡（改之前先查這張表）

這是這頁最大的地雷，而且**已經實際出事過**：2026-10-08 業主只指名改一顆標籤的
「2–3 人一隊」，但同一個區塊的說明文字也寫著 2–3 人 —— 只改標籤會讓一句話和它
正下方的標籤互相打臉。後來每一輪改稿都靠先查這張表才沒有再犯。

| 事實 | 出現在（行號會漂，用字串 grep） |
|---|---|
| **隊伍人數 2–4 人** | `teamSteps[0]` 標題／`teamBadges[0]`／`teamVsGroup` 接力賽定義／`competitionGroups` relay items／FAQ「接力賽 vs 積分獎」 **共 5 處** |
| **14 分鐘完賽** | `teamSteps[2]` 說明／`raceRules[5]` |
| **不排名** | `teamNotes[3]`／`competitionGroups` relay items／`raceRules[5]` |
| **重量依 70 歲以上女子組** | `teamNotes[2]`／`raceRules[5]`／`weightTable` 最後一列「團體接力賽（新增）」 |
| **協助者條款** | `teamNotes[1]`／FAQ 輪椅那題 |
| **報名費三段價** | `entryFees`／FAQ 報名費用那題 |
| **同時報名要付兩份** | 賽制區「個人賽＋團體接力賽」色塊／FAQ「可以同時報名嗎」 |
| **退費條款** | `relayExtras[1].text`／FAQ 退費那題 |
| **服裝與輔具** | `relayExtras[0].items`／FAQ 服裝那題 |
| **四個生活詞「推得實／拿得動／走得久／走得穩」** | `fourWords`（4 筆）／`disciplines[].life`（4 筆）／Hero 段落／`milestones` 2026／橫幅 `alt` **這五處四個詞同時出現**；另有賽事緣起段落與兩個測驗選項只提其中一個。`grep -c 推得實` 目前 **8 行** |

**改任何一個數字或條款之前，先把它當字串 grep 一遍。** 只改業主指名的那一處，
幾乎一定會留下矛盾。

```bash
grep -n "2–4\|14 分鐘\|不排名\|70 歲以上女子\|協助者" pages/lkk4.vue
```

⚠️ `grep` 時注意破折號是 **U+2013（–）**不是 ASCII `-`。業主打字常給 ASCII 版，
寫進程式碼要換成全形版，與全站一致。

---

## 區塊順序與對應資料

| 模板 section | id | 吃哪個陣列 |
|---|---|---|
| Hero | — | 主視覺圖＋`ACCUPASS_URL` |
| 實拿久穩 | — | 橫幅圖＋`fourWords`（見下節） |
| 四大功能挑戰 | `#challenges` | `disciplines`（`meta` 是**陣列**，一張卡可以掛多顆標籤） |
| 自我測驗 | `#quiz` | `quizQuestions` / `qOutcome` |
| 團體接力賽 | `#team` | `teamSteps`（4 張編號卡）／`teamNotes`（不用擔心的幾件事）／`teamBadges`／`teamVsGroup` |
| 賽事緣起 | `#story` | `milestones` |
| 賽制與報名 | `#rules` | `competitionGroups`／`entryFees`／`relayExtras`／`raceRules`／`stations`／`weightTable`／`tshirtFits` |
| 歷年成績查詢 | — | 連到 `/personal-record` |
| 常見問題 | `#faq` | `faqs`（9 題） |
| 最終 CTA | `#register` | `ACCUPASS_URL` |

`relayExtras`（服裝、輪椅與輔具／報名變更與退費）渲染在 **`#rules` 的「報名費用」底下**，
夾在「個人賽＋團體接力賽」色塊與「賽程預計公佈」之間——不在 `#team`。
它 2026-10-09 當天被搬過兩次，名字看起來像 `#team` 的東西，別照名字找位置。

---

## 實拿久穩橫幅：斷點是 `lg`，理由是量出來的

`public/images/lkk4/four-words.webp`（2000×859，四角透明）只在 **`lg` 以上**顯示，
`lg` 以下改用 `fourWords` 重建的文字卡（圓圈裡放 實／拿／久／穩）。

**判斷圖上的字在小螢幕讀不讀得到，要量「全形字的 advance」，不是墨跡高度。**
墨跡高度約等於字級的 0.91，用它換算會低估約 10%：

```python
# 量 advance：找同一行相鄰字元的起點 x，相減
a = np.array(Image.open(p).convert('L'))
cols = (a[692:715, :] < 140).sum(axis=0)      # 說明文字那一帶
# 字元起點 1474,1498,1523,1547… → advance ≈ 24.6px（墨跡只有 23px）
```

實測這張圖：標題 37.5px、說明 24.6px。容器是 `container mx-auto px-4`
（`container` 的 padding 被 `px-4` 蓋掉，實際左右各 16px），換算成畫面字級：

| 視埠 | 圖寬 | 說明文字 |
|---|---|---|
| 375 | 343 | **4.2px** ← 純裝飾 |
| 768 | 736 | 9.1px |
| 1024–1279 | 992 | 12.2px |
| 1280–1535 | 1248 | 15.3px |
| ≥1536 | 1504 | 18.5px |

（`container` 的 max-width 卡在斷點值，所以 1024–1279 與 1280–1535 各自是**固定**寬度。）

兩個一起記：

- **四角透明的 webp 直接疊在 navy 底上**，不要再包 `Lkk4Ticket`（會變雙層框），
  也不要加 CSS 圓角（圖自己有）。
- 🔴 **`display:none` 不會阻止下載。** 只在某個斷點顯示的圖一定要加 `loading="lazy"`，
  否則每個手機訪客都會下載一張永遠看不到的圖。實測方法與完整說明見 [[lkk-image-swap]]。

---

## 業主的改稿工作法：用 class 字串指位置

2026-10-08～09 連續六輪改稿，業主每一條都長這樣：

```
區塊(text-xs font-bold text-navy-800 bg-cream border border-navy-700/15 rounded-full px-3 py-1)：
2–3 人一隊，改成：2–4 人一隊
```

**直接 grep 那串 class 就能定位**，不用猜。但有三件事要注意：

1. **同一串 class 的命中數未必是你以為的那個**，要靠業主附的內容判斷是哪一個。
   例：`font-serif text-3xl lg:text-4xl font-black text-white` 有**四個** h2，
   但尾端多一個 `mb-3` 就只剩**三個**（四大功能挑戰／這一次，不一定要一個人完成／
   賽制與報名資訊）——FAQ 的「常見問題」把 margin 放在外層 wrapper，沒有 `mb-3`。
   **grep 從較短的共同前綴下手**，尾端的 margin 類別最容易有差。
2. **業主附圖是「格式」，打字的內容才是「文案」。** 兩者不一致時：版面照圖、文字照打字。
3. **分批改稿會推翻前一輪。** 這次「團體接力賽規則」四張卡在同一天內：新增 →
   刪兩張、另兩張搬到 `#team` → 再搬回 `#rules`。**照業主說的位置放就好，
   不要自己先「整理」到你覺得更合理的地方**，他看了才會決定。

搬動區塊時，模板樣式要跟著落點的慣例走：`#rules` 的卡片是
`rounded-2xl` / `p-6` / `text-sm`，`#team` 是 `rounded-[20px]` / `p-5` / `text-[15px]`；
標題層級也要跟著改（搬到 `h3 報名費用` 底下就得是 `h4`）。

---

## 刻意保留、不要「順手修掉」的東西

- **`#team` 的白話版與 `#rules` 的條文版重複**。業主明確要求兩邊都留：
  `#team` 是給還在猶豫的人看的，`#rules` 是要照著比賽的。
  ⚠️ 真正 `#team` ↔ `#rules` 兩邊都有的只有**兩項**：14 分鐘（`teamSteps[2]` ↔ `raceRules[5]`）
  與同一套重量（`teamNotes[2]` ↔ `raceRules[5]` ＋ `weightTable` 最後一列）。
  「不停錶」「不限制接力次數」**全檔只有 `teamSteps[2]` 一處**，`#rules` 沒有對應條文；
  協助者條款的第二份在 **FAQ**，不在 `#rules`。
  （`pages/lkk4.vue` 裡**沒有**標註「兩邊刻意重複」的註解——`relayExtras` 上方那條講的是
  被刪掉的兩張卡，別把它讀成「重複的可以刪」。）
- **`qOutcome` 的「找 1–2 位同伴一起組隊」（約第 133 行）**。2–4 人規則下組 2–3 人
  仍然合法，業主兩次都說不用改。FAQ 那句已經改成「1–3 位」，兩邊講法不同是**已知且業主同意的**。
- **`raceRules[5]`**（團體接力賽重量參照、不參與排名、14 分鐘、未完成者需離場）。
  它和 `#team` 重複，但另外帶了「不參與排名」與「未完成者也需離場」兩個別處沒有的資訊。

## 已經刪掉、不要加回來的東西

| 刪了什麼 | 為什麼 |
|---|---|
| `teamBadges` 的「長輩帶頭」 | 舊賽制是「每一關都由長輩親自開始」，新賽制是「每位隊員自由分配順序」，直接牴觸 |
| 長者推廣組（80 歲以上）卡片與組別說明段落 | 2026-10-09 業主要求移除 |
| `teamNotes[3]` 的「80 歲以上長輩參與組別，」前綴 | 長者推廣組移除後變成指涉不存在的東西；業主確認不排名與完賽證書適用整個接力賽 |
| 「第一關：六角槓硬舉輕／中／重各 1 下」 | **業主說那是錯誤資訊**，不要再提議補回去 |
| 「團體接力賽規則」的比賽內容／接力規則兩張卡 | 條文在 `teamSteps`／`teamNotes`／`raceRules`／`stations` 都還在 |

## 慣例

- 四項挑戰的能力標籤 `disciplines[].meta` 是**陣列**，模板 `v-for` 出多顆 pill。
  標籤一變長就要確認外層有 `flex-wrap`，否則窄螢幕會撐破卡片。
- 組別卡目前三張（女子組／男子組／團體接力賽），grid 是 `md:grid-cols-3`。
  **四張卡的時代**是 `md:grid-cols-2 lg:grid-cols-4`。張數一變斷點要重算，
  而且**算的時候別漏掉票券**：768px 視埠 → container 736（`container` 自己的 padding
  被 `px-4` 蓋掉）→ 再扣 `Lkk4Ticket` 的 `border-[3px]`×2 ＝ 6 與 `p-7` ＝ 56
  → grid 可用寬 **674**。三欄 `(674−2×16)/3 = 214px`、四欄 `(674−3×16)/4 = 156.5px`
  （headless Chrome 實測相符）。四欄 156px 塞不下「歡迎長輩及行動不便者一起參加」，
  三欄 214px 折兩行可以。
- 報名費用卡 `entryFees` 用 `tiers` 走另一種版面（依人數分級），不是「每人一價」。
- 全頁底色 navy-700，票券內是米色。票券外的橘字一律 `orange-300`
  （`orange` DEFAULT 對比只有 2.99）；票券內用 `orange-700` / `navy-800` / `ink/70`。
- 摺疊用原生 `<details>`，圖示用 SVG 不用 Emoji。
