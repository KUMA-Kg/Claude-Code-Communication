# IT導入補助金2025 公式様式Excelジェネレーター

## 概要
このExcelジェネレーターは、IT導入補助金2025の公式申請書類（様式1〜6）を自動生成するツールです。政府の公式フォーマットに準拠し、MSゴシックフォントや適切なセル書式を使用しています。

## 生成される書類

### 様式1: 申請書
- 申請者情報（法人番号、会社名、代表者名等）
- 事業計画の概要
- 導入するITツールの詳細
- 申請額の内訳

### 様式2: 事業計画書
- 現状の課題と解決策
- IT導入による効果（定量的・定性的）
- 3年間の数値目標
- 実施体制

### 様式3: 導入ITツール一覧
- ITツール名と機能分類
- ツール概要
- 導入費用内訳（初期費用、月額費用、年間費用）
- 保守費用

### 様式4: 賃金引上げ計画書
- 現在の賃金状況（従業員区分別）
- 賃金引上げ計画（3年間）
- 実施方法
- 年率平均1.5%以上の引上げ計画

### 様式5: 労働生産性向上計画書
- 現状の労働生産性と算出方法
- 目標値（3年間）
- 具体的な取組内容
- 改善率の計画

### 様式6: 申請者概要
- 企業情報詳細
- 財務情報（直近2期分）
- 従業員情報（性別・区分別）

## 使用方法

### 1. 全様式一括生成
```typescript
import { generateITSubsidyDocuments } from './utils/it-subsidy-excel-generator';

const applicantData = {
  companyName: '株式会社サンプル',
  representativeName: '山田太郎',
  // ... その他の必要情報
};

// 全6様式を個別のExcelファイルとして生成
await generateITSubsidyDocuments.allOfficialForms(applicantData);
```

### 2. 個別様式の生成
```typescript
// 様式1のみ生成
await generateITSubsidyDocuments.form1(applicantData);

// 様式2のみ生成
await generateITSubsidyDocuments.form2(applicantData);

// その他の様式も同様にform3〜form6で生成可能
```

## 必要なデータ構造

```typescript
interface ApplicantData {
  // 基本情報
  companyName?: string;          // 会社名
  representativeName?: string;   // 代表者名
  representativeTitle?: string;  // 代表者役職
  companyNumber?: string;        // 法人番号（13桁）
  
  // 連絡先
  postalCode?: string;          // 郵便番号
  address?: string;             // 所在地
  phoneNumber?: string;         // 電話番号
  faxNumber?: string;           // FAX番号
  email?: string;               // メールアドレス
  websiteUrl?: string;          // ホームページURL
  
  // 企業情報
  establishmentDate?: string;    // 設立年月日
  fiscalYearEnd?: string;        // 決算月
  capitalAmount?: string;        // 資本金
  employeeCount?: string;        // 従業員数
  businessType?: string;         // 業種
  
  // 財務情報
  salesRevenue?: string;         // 売上高
  operatingProfit?: string;      // 営業利益
  
  // プロジェクト情報
  subsidyType?: string;          // 申請枠
  projectName?: string;          // 事業名
  requestAmount?: string;        // 申請金額
  totalProjectCost?: string;     // 総事業費
  implementationPeriod?: string; // 実施期間
  
  // ITツール情報
  vendorName?: string;           // IT導入支援事業者名
  toolName?: string;             // ITツール名
  toolCategory?: string;         // 機能分類
  toolFunction?: string;         // ツール概要
  initialCost?: string;          // 導入費用
  monthlyFee?: string;           // 月額費用
  maintenanceCost?: string;      // 保守費用
  
  // 賃金・生産性情報
  currentWage?: string;          // 現在の平均賃金
  targetWage?: string;           // 引上げ後の賃金
  wageIncreaseRate?: string;     // 引上げ率
  productivityCurrent?: string;  // 現状の労働生産性
  productivityTarget?: string;   // 目標労働生産性
}
```

## 特徴

1. **公式フォーマット準拠**
   - 政府指定の様式番号付き
   - MSゴシックフォント使用
   - 適切なセル結合と罫線

2. **自動計算機能**
   - 補助金額の自動計算
   - 賃金引上げ率の計算
   - 労働生産性の算出

3. **使いやすさ**
   - ローカルストレージからの自動データ読み込み
   - 個別・一括生成の選択可能
   - わかりやすいファイル名

## 注意事項

- 生成されたExcelファイルは申請前に必ず内容を確認してください
- 空欄の項目は手動で入力が必要です
- 賃金引上げは年率平均1.5%以上が必須要件です
- 労働生産性の向上計画は3年間の具体的な数値目標が必要です

## 更新履歴

- 2024年12月: 初版作成（IT導入補助金2025対応）