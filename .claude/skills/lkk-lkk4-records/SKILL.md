---
name: lkk-lkk4-records
description: 匯入或修改練健康 LKK4／聖誕老人硬舉賽的參賽成績（Firestore lkk4_records）。收到「某年成績.csv」、要補某一年的成績、或成績查詢頁出問題時使用。內含「後台匯入會清空全部資料」這個最大地雷、分組區段 CSV 的解析方式，以及年度下拉寫死的陷阱。
---

# LKK4 成績匯入

> 前置：專案脈絡看 `lkk-project-context`。教練／講師 CSV 看 `lkk-coach-import`。

## 🔴 最大地雷：後台的匯入功能會先清空全部資料

`server/api/admin/lkk4-records/import.post.ts` 裡有 `deleteAllRecords()`，
**匯入前會把整個 `lkk4_records` collection 刪光**再寫入。

這對「一次上傳全部年度」是對的，但**拿來補單一年度會把其他年份一起刪掉**。
補某一年一律**直接寫 Firestore**，不要走後台 UI 或那支 API。

寫入時務必加安全閥：

```js
if (before.byYear[YEAR]) throw new Error('該年度已存在，中止（避免重複）')
if (recs.length !== EXPECTED) throw new Error('筆數不符，中止')
// 寫完再比對其他年度筆數有沒有變
for (const y of OTHER_YEARS)
  if (before.byYear[y] !== after.byYear[y]) throw new Error(`${y} 年被改動了`)
```

## 🔴 第二個地雷：年度下拉是寫死的

`pages/personal-record.vue` 的 `availableYears` 是**硬編碼陣列**。
只把資料寫進 Firestore、不改這裡，該年度**進得了資料庫卻選不到、查不到**。

```js
const availableYears = ['2025', '2024', '2023']   // 每次新增年度都要加
```

匯入後一定要一起改，並且**驗線上的 `<option>`**，不是只驗 API：

```bash
curl -s "<站台>/personal-record" | grep -oE '<option[^>]*value="[0-9]{4}"[^>]*>[^<]*</option>'
```

## 資料結構（`lkk4_records`）

```
year, competitionGroup, teamName, rank, name, gender, bodyWeight,
firstAttempt, firstAttemptResult, secondAttempt, secondAttemptResult,
thirdAttempt, thirdAttemptResult, finalScore, ipfGlPoint, createdAt
```

**既有慣例，新資料一定要對齊：**

| 欄位 | 慣例 |
|---|---|
| `competitionGroup` | `長者友善組`、`男子第一組`～`男子第四組`、`女子第一組`～`女子第四組` |
| `gender` | `男` / `女`（不是「男性」「女性」） |
| `teamName` | 沒有隊名就 `null`（2024/2025 有部分填了隊名） |
| `rank` | 只有各組前三名有值，其餘 `null`；長者友善組沒有名次 |
| 棄賽者 | **保留該筆**，`bodyWeight: null`、`finalScore: 0`、`ipfGlPoint: 0` |
| 未試舉 | CSV 的 `x` 與 `-` 都轉 `null` |

## 業主 CSV 是「分組區段」格式，不是平面表

每一組一個區段：組名列（如 `男子第一組成績`）→ 該組的欄位列（`姓名,體重,…`）→ 資料列 → 空白列。
**與匯入 API 期望的單一平面 CSV 完全不同**，要自己逐段解析。

⚠️ **長者友善組的欄位跟其他組不一樣**：

| | 長者友善組 | 其他八組 |
|---|---|---|
| 性別 | **有獨立欄位**（值是「男性」「女性」） | 沒有，由組名推得 |
| IPF GL point | **分男女兩欄**，要取非空的那欄 | 單一欄 |
| 名次 | 沒有 | 有，另有「絕對肌力獎」欄 |

其他常見差異：
- CSV 可能寫「**長輩**友善組」，既有資料是「**長者**友善組」，要對齊，否則同一組別會有兩種名稱
- 檔尾常有「團隊名次／積分」表，資料結構沒有對應欄位，跳過
- 「絕對肌力獎」同樣沒有欄位，跳過（要顯示就得先加欄位）

## 流程

1. 逐段解析 CSV → **印出每組人數與抽樣資料人工檢視**（組別人數要跟 CSV 段落對得上）
2. 直接寫 Firestore（**不要走後台匯入**），先 dev 後 prod，安全閥如上
3. 改 `availableYears`
4. 驗證：API 各年度筆數、線上 `<option>`、抽查三種邊界情況
   （某位跨性別 IPF 欄的長者友善組選手／某組第一名 rank=1／`x` 未試舉／整列 `-` 的棄賽者）

腳本要點與教練／講師匯入相同：放專案目錄、副檔名 `.cjs`、firebase-admin v14 模組化 API、
憑證組法見 `lkk-project-context`。Firestore 單一 batch 上限 500 筆，一年份約 220 筆放得下。

## 現況（2026-08-28）

| 年度 | 筆數 |
|---|---|
| 2023 | 224 |
| 2024 | 225 |
| 2025 | 207 |
| **合計** | **656** |

dev（lkkdev）與正式站（lkkprod）一致，`availableYears` 三年都在。
