# 補助金書類自動生成機能 詳細仕様書

## 1. 収集済み書類フォーマット一覧

### 1.1 IT導入補助金2025
```
/data/subsidies/it-donyu-2024/forms/
├── 基本書類
│   ├── it2025_chingin_houkoku.xlsx          # 賃金報告書
│   ├── it2025_hanbai_it_jigyousya.xlsx      # 販売IT事業者情報
│   └── it2025_yoshikikeisan_fukusu.xlsx     # 様式計算書（複数社）
├── カテゴリー別書類
│   ├── it2025_jisshinaiyosetsumei_cate5.xlsx   # 実施内容説明書（カテゴリー5）
│   ├── it2025_jisshinaiyosetsumei_cate6.xlsx   # 実施内容説明書（カテゴリー6）
│   ├── it2025_jisshinaiyosetsumei_cate7.xlsx   # 実施内容説明書（カテゴリー7）
│   ├── it2025_kakakusetsumei_cate5.xlsx        # 価格説明書（カテゴリー5）
│   ├── it2025_kakakusetsumei_cate6.xlsx        # 価格説明書（カテゴリー6）
│   └── it2025_kakakusetsumei_cate7.xlsx        # 価格説明書（カテゴリー7）
├── 選定理由書
│   ├── it2025_sentei_gaibu_fukusu.docx      # 外部専門家選定理由書
│   └── it2025_sentei_it_fukusu.docx         # IT事業者選定理由書
└── 枠別書類
    ├── it2025_torihiki_denshi.xlsx          # 取引関係（電子化枠）
    └── it2025_torihiki_security.xlsx        # 取引関係（セキュリティ枠）
```

### 1.2 小規模事業者持続化補助金
```
/data/subsidies/jizokuka-2024/forms/
├── 基本様式
│   ├── r3i_y1.docx                    # 様式1（申請書）
│   ├── r3i_y2.docx                    # 様式2（経営計画書）
│   └── r3i_y3e.xlsx                   # 様式3（補助事業計画書）
├── 条件別様式
│   ├── r3i_y5.docx                    # 様式5（定住宣誓書）
│   ├── r3i_y6.docx                    # 様式6（支援機関確認書）
│   ├── r3i_y7.docx                    # 様式7（特定創業支援等事業証明書）
│   ├── r3i_y8.docx                    # 様式8（賃金引上げ枠申請書）
│   ├── r3i_y9_hojin.docx              # 様式9（事業承継診断票・法人用）
│   └── r3i_y9_kojin.docx              # 様式9（事業承継診断票・個人用）
└── 創業枠専用
    ├── r6_checklist_sogyo1.xlsx       # チェックリスト（創業枠）
    ├── r6_y2_sogyo1.docx              # 様式2（経営計画書・創業枠）
    ├── r6_y3_sogyo1.xlsx              # 様式3（補助事業計画書・創業枠）
    ├── r6_y30_sogyo1.xlsx             # 様式30（創業枠専用）
    ├── r6_y6_sogyo1.docx              # 様式6（支援機関確認書・創業枠）
    ├── r6_y8_sogyo1.docx              # 様式8（賃金引上げ枠・創業枠）
    ├── r6_y9h_sogyo1.docx             # 様式9（事業承継・法人・創業枠）
    └── r6_y9k_sogyo1.docx             # 様式9（事業承継・個人・創業枠）
```

### 1.3 ものづくり補助金
```
/data/subsidies/monozukuri-2024/forms/
├── 事業計画書
│   └── 参考様式_事業計画書記載項目_20次締切_20250617.docx
├── 付随書類
│   ├── 様式４_大幅な賃上げに係る計画書_20250317.docx
│   └── 様式５_資金調達に係る確認書_20250617.docx
└── 計算ツール
    └── CAGR算出ツール_20250314.xlsx
```

## 2. 書類自動生成アーキテクチャ

### 2.1 データフロー
```typescript
interface DocumentGenerationFlow {
  // Step 1: ユーザー情報収集
  userInput: {
    companyInfo: CompanyBasicInfo;
    diagnosisAnswers: DiagnosisAnswers;
    additionalDetails: AdditionalFormData;
  };
  
  // Step 2: 書類テンプレート選択
  templateSelection: {
    subsidyType: 'it' | 'monozukuri' | 'jizokuka';
    applicationFrame: string; // 申請枠
    requiredDocuments: Document[];
  };
  
  // Step 3: データマッピング
  dataMapping: {
    fieldMappings: FieldMapping[];
    calculations: CalculationRule[];
    validations: ValidationRule[];
  };
  
  // Step 4: 書類生成
  generation: {
    format: 'excel' | 'word' | 'pdf';
    fillMethod: 'template' | 'generate';
    output: GeneratedDocument[];
  };
}
```

### 2.2 Excel/Word操作ライブラリ
```typescript
// Excel操作（ExcelJS使用）
import ExcelJS from 'exceljs';

class ExcelDocumentFiller {
  async fillTemplate(templatePath: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    // セルへのデータ挿入
    const worksheet = workbook.getWorksheet(1);
    Object.entries(data).forEach(([cellRef, value]) => {
      worksheet.getCell(cellRef).value = value;
    });
    
    // 計算式の再計算
    workbook.calcProperties.fullCalcOnLoad = true;
    
    return await workbook.xlsx.writeBuffer();
  }
}

// Word操作（docx使用）
import * as docx from 'docx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

class WordDocumentFiller {
  async fillTemplate(templatePath: string, data: any): Promise<Buffer> {
    const content = await fs.readFile(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });
    
    doc.setData(data);
    doc.render();
    
    return doc.getZip().generate({ type: 'nodebuffer' });
  }
}
```

## 3. 各補助金の書類生成仕様

### 3.1 IT導入補助金
```typescript
interface ITSubsidyDocumentGenerator {
  // 基本情報の入力項目
  basicInfo: {
    '事業者名': string;
    '法人番号': string;
    '代表者名': string;
    '所在地': string;
    '業種コード': string;
    '従業員数': number;
    '資本金': number;
    '設立年月日': Date;
  };
  
  // ITツール情報
  itToolInfo: {
    'ITツール名': string[];
    'カテゴリー': 5 | 6 | 7;
    '導入費用': number;
    '月額費用': number;
    '利用期間': number;
  };
  
  // 申請枠別の追加情報
  frameSpecific: {
    // 電子化枠
    denshi?: {
      '紙業務の内容': string;
      'デジタル化後の業務フロー': string;
      '削減時間': number;
    };
    // セキュリティ枠
    security?: {
      'セキュリティ課題': string;
      '対策内容': string;
      'リスク評価': string;
    };
  };
}
```

### 3.2 小規模事業者持続化補助金
```typescript
interface JizokukaDocumentGenerator {
  // 様式1: 申請書の基本情報
  applicationForm: {
    '申請者名': string;
    '郵便番号': string;
    '所在地': string;
    '電話番号': string;
    'メールアドレス': string;
    '業種': string;
    '常時使用する従業員数': number;
  };
  
  // 様式2: 経営計画書
  businessPlan: {
    '企業概要': string;
    '顧客ニーズと市場の動向': string;
    '自社や自社の提供する商品・サービスの強み': string;
    '経営方針・目標と今後のプラン': string;
  };
  
  // 様式3: 補助事業計画書
  projectPlan: {
    '補助事業の内容': string;
    '補助事業の効果': string;
    '経費明細表': ExpenseItem[];
    '資金調達方法': FundingSource[];
  };
}
```

### 3.3 ものづくり補助金
```typescript
interface MonozukuriDocumentGenerator {
  // 事業計画書の記載項目
  businessPlan: {
    '事業計画名': string;
    '事業の背景・目的': string;
    '実施内容': {
      '技術的課題': string;
      '解決方法': string;
      '新規性・革新性': string;
    };
    '将来の展望': string;
    '実施体制': OrganizationChart;
    'スケジュール': ProjectSchedule;
  };
  
  // CAGR計算
  cagrCalculation: {
    '基準年売上': number;
    '3年後売上目標': number;
    '5年後売上目標': number;
    'CAGR': number; // 自動計算
  };
  
  // 賃上げ計画（該当する場合）
  wageIncreasePlan?: {
    '現在の平均給与': number;
    '引上げ率': number;
    '引上げ後の平均給与': number;
    '実施時期': Date;
  };
}
```

## 4. フィールドマッピング設定

### 4.1 マッピング定義
```json
{
  "it_subsidy": {
    "it2025_chingin_houkoku.xlsx": {
      "B5": "companyInfo.name",
      "B6": "companyInfo.corporateNumber",
      "B7": "companyInfo.representative",
      "D10": "companyInfo.employeeCount",
      "D11": "=AVERAGE(employeeSalaries)",
      "D12": "companyInfo.plannedWageIncrease"
    }
  },
  "jizokuka": {
    "r3i_y1.docx": {
      "{{申請者名}}": "companyInfo.name",
      "{{所在地}}": "companyInfo.address",
      "{{代表者}}": "companyInfo.representative",
      "{{業種}}": "companyInfo.industry"
    }
  }
}
```

### 4.2 条件分岐ロジック
```typescript
class DocumentSelector {
  selectRequiredDocuments(userProfile: UserProfile): Document[] {
    const documents: Document[] = [];
    
    // 基本書類は全員必須
    documents.push(...this.getBasicDocuments(userProfile.subsidyType));
    
    // 条件による書類選択
    if (userProfile.isStartup && userProfile.businessAge < 3) {
      documents.push(this.getStartupDocuments());
    }
    
    if (userProfile.hasWageIncreasePlan) {
      documents.push(this.getWageIncreaseDocuments());
    }
    
    if (userProfile.needsExternalExpert) {
      documents.push(this.getExpertSelectionDocuments());
    }
    
    return documents;
  }
}
```

## 5. PDF変換・出力機能

### 5.1 統合PDF生成
```typescript
import { PDFDocument } from 'pdf-lib';

class IntegratedPDFGenerator {
  async generateApplicationPackage(
    filledDocuments: FilledDocument[]
  ): Promise<Buffer> {
    const mergedPdf = await PDFDocument.create();
    
    for (const doc of filledDocuments) {
      let pdfBytes: Uint8Array;
      
      // Excel/WordをPDFに変換
      if (doc.format === 'excel' || doc.format === 'word') {
        pdfBytes = await this.convertToPDF(doc);
      } else {
        pdfBytes = doc.buffer;
      }
      
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    // メタデータ追加
    mergedPdf.setTitle(`補助金申請書類_${new Date().toISOString()}`);
    mergedPdf.setAuthor('IT補助金アシスタント');
    
    return Buffer.from(await mergedPdf.save());
  }
}
```

### 5.2 品質チェック機能
```typescript
class DocumentQualityChecker {
  async validateDocument(document: GeneratedDocument): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 必須項目チェック
    const missingFields = this.checkRequiredFields(document);
    if (missingFields.length > 0) {
      errors.push({
        type: 'MISSING_REQUIRED_FIELD',
        fields: missingFields
      });
    }
    
    // 文字数チェック
    const textLengthIssues = this.checkTextLength(document);
    warnings.push(...textLengthIssues);
    
    // 数値の妥当性チェック
    const numericIssues = this.checkNumericValues(document);
    warnings.push(...numericIssues);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## 6. 実装ロードマップ

### Phase 1: 基盤構築（1週間）
- [ ] Excel/Word操作ライブラリの統合
- [ ] テンプレートファイル管理システム
- [ ] 基本的なフィールドマッピング機能

### Phase 2: 各補助金対応（2週間）
- [ ] IT導入補助金の書類生成
- [ ] 小規模事業者持続化補助金の書類生成
- [ ] ものづくり補助金の書類生成

### Phase 3: 高度化（1週間）
- [ ] 条件分岐による動的書類選択
- [ ] PDF統合・最適化
- [ ] 品質チェック・バリデーション

### Phase 4: UI/UX改善（1週間）
- [ ] プレビュー機能
- [ ] 編集機能
- [ ] 進捗表示・エラーハンドリング

## 7. セキュリティ考慮事項

1. **機密情報の取り扱い**
   - 生成した書類は暗号化してSupabase Storageに保存
   - アクセスログの記録
   - 一定期間後の自動削除

2. **入力値検証**
   - SQLインジェクション対策
   - XSS対策
   - ファイルアップロードのサイズ・形式制限

3. **監査証跡**
   - 書類生成履歴の保存
   - 変更履歴の追跡
   - 不正アクセスの検知