# Excel書類フィールドマッピング仕様書

## 1. IT導入補助金2025 フィールドマッピング

### 1.1 賃金報告書 (it2025_chingin_houkoku.xlsx)
| セル位置 | 項目名 | 入力タイプ | 必須 | バリデーション |
|----------|--------|------------|------|----------------|
| C4 | 申請者名（法人名/屋号） | text | ○ | 最大100文字 |
| C5 | 法人番号 | text | △ | 13桁数字 |
| C6 | 代表者役職 | text | ○ | 最大20文字 |
| C7 | 代表者氏名 | text | ○ | 最大50文字 |
| C10 | 直近決算期の従業員数 | number | ○ | 1-9999 |
| C11 | 直近決算期の平均給与額 | number | ○ | 単位:千円 |
| C12 | 事業計画期間終了時の平均給与額 | number | ○ | 単位:千円 |
| C13 | 給与支給総額の増加率 | formula | - | 自動計算 |

### 1.2 実施内容説明書 (it2025_jisshinaiyosetsumei_cate5/6/7.xlsx)
| セル位置 | 項目名 | 入力タイプ | 必須 | バリデーション |
|----------|--------|------------|------|----------------|
| B3 | ITツール名 | text | ○ | 最大100文字 |
| B4 | ITツール提供事業者名 | text | ○ | 最大100文字 |
| B7 | 導入前の課題・問題点 | textarea | ○ | 最大500文字 |
| B10 | 導入により期待される効果 | textarea | ○ | 最大500文字 |
| B13 | 具体的な活用方法 | textarea | ○ | 最大800文字 |
| B16 | 生産性向上の定量的目標 | text | ○ | 数値+単位 |
| B19 | 導入スケジュール | date_range | ○ | 開始日-終了日 |

### 1.3 価格説明書 (it2025_kakakusetsumei_cate5/6/7.xlsx)
| セル位置 | 項目名 | 入力タイプ | 必須 | バリデーション |
|----------|--------|------------|------|----------------|
| C5 | ソフトウェア費用 | number | ○ | 単位:円 |
| C6 | 導入関連費用 | number | △ | 単位:円 |
| C7 | 役務費用 | number | △ | 単位:円 |
| C8 | 保守費用（年額） | number | △ | 単位:円 |
| C10 | 費用合計 | formula | - | 自動計算 |
| C12 | 補助対象経費 | formula | - | 自動計算 |
| C13 | 補助金申請額 | formula | - | 自動計算 |

## 2. ものづくり補助金 フィールドマッピング

### 2.1 事業計画書記載項目 (参考様式_事業計画書記載項目.docx相当)
| 項目ID | 項目名 | 入力タイプ | 必須 | バリデーション |
|--------|--------|------------|------|----------------|
| A1 | 事業計画名 | text | ○ | 最大50文字 |
| A2 | 事業の概要 | textarea | ○ | 100文字程度 |
| B1 | 現在の事業内容 | textarea | ○ | 最大1000文字 |
| B2 | 強み・機会 | textarea | ○ | 最大800文字 |
| B3 | 弱み・脅威 | textarea | ○ | 最大800文字 |
| C1 | 事業化に向けた具体的内容 | textarea | ○ | 最大2000文字 |
| C2 | 実施スケジュール | table | ○ | 月別計画 |
| D1 | 収益計画（3年分） | table | ○ | 年度別売上/利益 |
| D2 | 投資回収計画 | number | ○ | 回収年数 |

### 2.2 CAGR算出ツール (CAGR算出ツール_20250314.xlsx)
| セル位置 | 項目名 | 入力タイプ | 必須 | バリデーション |
|----------|--------|------------|------|----------------|
| C5 | 基準年度売上高 | number | ○ | 単位:千円 |
| C6 | 1年後売上高目標 | number | ○ | 単位:千円 |
| C7 | 2年後売上高目標 | number | ○ | 単位:千円 |
| C8 | 3年後売上高目標 | number | ○ | 単位:千円 |
| C9 | 5年後売上高目標 | number | ○ | 単位:千円 |
| E10 | CAGR（3年） | formula | - | 自動計算 |
| E11 | CAGR（5年） | formula | - | 自動計算 |

## 3. 小規模事業者持続化補助金 フィールドマッピング

### 3.1 様式3 補助事業計画書 (r3i_y3e.xlsx)
| セル位置 | 項目名 | 入力タイプ | 必須 | バリデーション |
|----------|--------|------------|------|----------------|
| B3 | 補助事業名 | text | ○ | 最大30文字 |
| B5-B20 | 販路開拓等の取組内容 | textarea | ○ | 最大2000文字 |
| B22 | 補助事業の効果 | textarea | ○ | 最大500文字 |
| D25-D40 | 経費明細表（品名） | text | ○ | 各最大50文字 |
| E25-E40 | 経費明細表（数量） | number | ○ | 1-9999 |
| F25-F40 | 経費明細表（単価） | number | ○ | 単位:円 |
| G25-G40 | 経費明細表（金額） | formula | - | 自動計算 |
| G42 | 補助対象経費合計 | formula | - | 自動計算 |
| G43 | 補助金申請額 | formula | - | 自動計算 |

## 4. 入力フォーム設計仕様

### 4.1 フォームセクション構成
```typescript
interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  conditions?: FieldCondition[];
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'radio' | 'table';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  excelMapping?: ExcelMapping;
}

interface ExcelMapping {
  fileName: string;
  sheetName?: string;
  cellReference: string;
  format?: 'text' | 'number' | 'date' | 'currency';
}
```

### 4.2 IT導入補助金 入力フォーム構成

#### セクション1: 企業基本情報
```json
{
  "id": "company_info",
  "title": "企業基本情報",
  "fields": [
    {
      "id": "company_name",
      "label": "申請者名（法人名/屋号）",
      "type": "text",
      "required": true,
      "validation": { "maxLength": 100 },
      "excelMapping": {
        "fileName": "it2025_chingin_houkoku.xlsx",
        "cellReference": "C4"
      }
    },
    {
      "id": "corporate_number",
      "label": "法人番号",
      "type": "text",
      "required": false,
      "placeholder": "13桁の数字",
      "validation": { "pattern": "^\\d{13}$" },
      "excelMapping": {
        "fileName": "it2025_chingin_houkoku.xlsx",
        "cellReference": "C5"
      }
    }
  ]
}
```

#### セクション2: 事業計画
```json
{
  "id": "business_plan",
  "title": "事業計画",
  "fields": [
    {
      "id": "current_issues",
      "label": "導入前の課題・問題点",
      "type": "textarea",
      "required": true,
      "placeholder": "現在の業務における課題を具体的に記載してください",
      "validation": { "maxLength": 500 },
      "excelMapping": {
        "fileName": "it2025_jisshinaiyosetsumei_cate5.xlsx",
        "cellReference": "B7"
      }
    },
    {
      "id": "expected_effects",
      "label": "導入により期待される効果",
      "type": "textarea",
      "required": true,
      "helpText": "定量的な目標を含めて記載してください",
      "validation": { "maxLength": 500 },
      "excelMapping": {
        "fileName": "it2025_jisshinaiyosetsumei_cate5.xlsx",
        "cellReference": "B10"
      }
    }
  ]
}
```

### 4.3 動的フィールド表示ロジック

```typescript
// 申請枠に応じたフィールド表示制御
const conditionalFields = {
  "wage_increase": {
    condition: (formData) => formData.application_type === "normal" && formData.wage_increase_plan === "yes",
    fields: ["current_avg_salary", "planned_avg_salary", "increase_rate"]
  },
  "digital_frame": {
    condition: (formData) => formData.application_type === "digital",
    fields: ["paper_business_description", "digitalization_plan"]
  },
  "security_frame": {
    condition: (formData) => formData.application_type === "security",
    fields: ["security_issues", "security_measures"]
  }
};
```

### 4.4 バリデーションルール

```typescript
const validationRules = {
  // 数値フィールドの範囲チェック
  employee_count: {
    min: 1,
    max: 9999,
    message: "従業員数は1～9999の範囲で入力してください"
  },
  
  // 金額フィールドの妥当性チェック
  investment_amount: {
    min: 300000,
    max: 4500000,
    message: "IT導入補助金の対象額は30万円～450万円です"
  },
  
  // 関連フィールドの整合性チェック
  salary_increase: {
    custom: (data) => {
      if (data.planned_avg_salary <= data.current_avg_salary) {
        return "計画給与額は現在の給与額より高く設定してください";
      }
      return null;
    }
  }
};
```

## 5. Excel出力仕様

### 5.1 データ変換処理
```typescript
// フォームデータからExcelセルへのマッピング
const mapFormToExcel = (formData: any, mappings: ExcelMapping[]) => {
  const excelData = {};
  
  mappings.forEach(mapping => {
    const value = formData[mapping.fieldId];
    
    // フォーマット変換
    switch (mapping.format) {
      case 'currency':
        excelData[mapping.cellReference] = Number(value) * 1000; // 千円→円
        break;
      case 'date':
        excelData[mapping.cellReference] = formatDate(value, 'YYYY/MM/DD');
        break;
      case 'percentage':
        excelData[mapping.cellReference] = Number(value) / 100;
        break;
      default:
        excelData[mapping.cellReference] = value;
    }
  });
  
  return excelData;
};
```

### 5.2 複数シート対応
```typescript
// 補助金タイプに応じた出力ファイル選択
const getOutputFiles = (subsidyType: string, applicationFrame: string) => {
  const fileMap = {
    'it-donyu': {
      'normal': ['it2025_chingin_houkoku.xlsx', 'it2025_jisshinaiyosetsumei_cate5.xlsx'],
      'digital': ['it2025_torihiki_denshi.xlsx'],
      'security': ['it2025_torihiki_security.xlsx']
    },
    'monozukuri': {
      'all': ['事業計画書.docx', 'CAGR算出ツール.xlsx']
    },
    'jizokuka': {
      'all': ['r3i_y3e.xlsx']
    }
  };
  
  return fileMap[subsidyType][applicationFrame] || fileMap[subsidyType]['all'];
};