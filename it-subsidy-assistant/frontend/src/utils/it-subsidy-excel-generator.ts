import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ApplicantData {
  companyName?: string;
  representativeName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  establishmentDate?: string;
  capitalAmount?: string;
  employeeCount?: string;
  businessType?: string;
  companyNumber?: string;
  subsidyType?: string;
  projectName?: string;
  requestAmount?: string;
  totalProjectCost?: string;
  vendorName?: string;
  toolName?: string;
  implementationPeriod?: string;
}

// セルのスタイル設定
const headerStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 12 },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  },
  alignment: { horizontal: 'center', vertical: 'middle' }
};

const titleStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 16 },
  alignment: { horizontal: 'center', vertical: 'middle' }
};

const normalStyle: Partial<ExcelJS.Style> = {
  font: { size: 11 },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  },
  alignment: { vertical: 'middle', wrapText: true }
};

// IT導入補助金申請書類生成クラス
export class ITSubsidyExcelGenerator {
  private applicantData: ApplicantData;

  constructor(applicantData: ApplicantData = {}) {
    this.applicantData = applicantData;
  }

  // 入力済み申請書一式を生成
  async generateFilledApplicationDocuments(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // 申請書表紙
    this.createApplicationCoverSheet(workbook);
    
    // 事業計画書
    this.createBusinessPlanSheet(workbook);
    
    // 導入効果説明書
    this.createEffectDescriptionSheet(workbook);
    
    // 経費明細書
    this.createCostDetailSheet(workbook);

    await this.downloadWorkbook(workbook, 'IT導入補助金_申請書一式_入力済み.xlsx');
  }

  // 賃金報告書を生成
  async generateWageReport(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('賃金報告書');

    // タイトル
    worksheet.mergeCells('A1:H2');
    worksheet.getCell('A1').value = '賃金報告書';
    worksheet.getCell('A1').style = titleStyle;

    // 企業情報
    worksheet.getCell('A4').value = '企業名';
    worksheet.getCell('B4').value = this.applicantData.companyName || '';
    worksheet.getCell('D4').value = '代表者名';
    worksheet.getCell('E4').value = this.applicantData.representativeName || '';

    // 賃金情報ヘッダー
    const headers = ['従業員区分', '人数', '平均年齢', '平均勤続年数', '現在の平均賃金', '引上げ後の平均賃金', '引上げ率', '備考'];
    const headerRow = worksheet.getRow(7);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // サンプルデータ
    const wageData = [
      ['正社員', '15', '35', '8', '350,000', '367,500', '5.0%', ''],
      ['パート・アルバイト', '5', '42', '3', '180,000', '189,000', '5.0%', ''],
      ['契約社員', '3', '38', '5', '280,000', '294,000', '5.0%', ''],
    ];

    wageData.forEach((data, rowIndex) => {
      const row = worksheet.getRow(8 + rowIndex);
      data.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.style = normalStyle;
      });
    });

    // 列幅調整
    worksheet.columns = [
      { width: 20 }, { width: 10 }, { width: 12 }, { width: 15 },
      { width: 18 }, { width: 18 }, { width: 12 }, { width: 25 }
    ];

    // 注記
    worksheet.getCell('A13').value = '※賃金引上げは補助事業実施年度及びその後3年間の計画を記載してください';
    worksheet.getCell('A14').value = '※全従業員の給与支給総額を年率平均1.5%以上増加させる必要があります';

    await this.downloadWorkbook(workbook, 'IT導入補助金_賃金報告書.xlsx');
  }

  // 実施内容説明書を生成
  async generateImplementationPlan(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('実施内容説明書');

    // タイトル
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = 'IT導入補助金 実施内容説明書';
    worksheet.getCell('A1').style = titleStyle;

    // プロジェクト情報
    const projectInfo = [
      ['プロジェクト名', this.applicantData.projectName || 'クラウド型業務管理システム導入プロジェクト'],
      ['導入ITツール', this.applicantData.toolName || ''],
      ['IT導入支援事業者', this.applicantData.vendorName || ''],
      ['実施期間', this.applicantData.implementationPeriod || '2025年7月〜2025年12月'],
    ];

    let currentRow = 4;
    projectInfo.forEach(([label, value]) => {
      worksheet.getCell(`A${currentRow}`).value = label;
      worksheet.getCell(`A${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = value;
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      currentRow++;
    });

    // 実施内容詳細
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '1. 導入の背景と課題';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'left' } };
    currentRow++;
    
    worksheet.mergeCells(`A${currentRow}:F${currentRow + 3}`);
    worksheet.getCell(`A${currentRow}`).value = `現在、紙ベースでの業務管理を行っており、以下の課題があります：
・情報共有の遅延による業務効率の低下
・データの重複入力による作業時間の増加
・リアルタイムでの進捗把握が困難
これらの課題解決のため、クラウド型業務管理システムの導入を計画しています。`;
    worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'left', vertical: 'top' } };

    currentRow += 5;
    worksheet.getCell(`A${currentRow}`).value = '2. 実施スケジュール';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'left' } };
    currentRow++;

    // スケジュール表
    const scheduleHeaders = ['実施項目', '7月', '8月', '9月', '10月', '11月', '12月'];
    const scheduleRow = worksheet.getRow(currentRow);
    scheduleHeaders.forEach((header, index) => {
      const cell = scheduleRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    const scheduleData = [
      ['要件定義・設計', '●', '●', '', '', '', ''],
      ['システム導入・設定', '', '●', '●', '', '', ''],
      ['データ移行', '', '', '●', '●', '', ''],
      ['研修・教育', '', '', '', '●', '●', ''],
      ['本格運用', '', '', '', '', '●', '●'],
    ];

    scheduleData.forEach((data, rowIndex) => {
      const row = worksheet.getRow(currentRow + 1 + rowIndex);
      data.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.style = normalStyle;
        if (colIndex === 0) {
          cell.style = { ...normalStyle, alignment: { horizontal: 'left' } };
        } else {
          cell.style = { ...normalStyle, alignment: { horizontal: 'center' } };
        }
      });
    });

    // 列幅調整
    worksheet.columns = [
      { width: 25 }, { width: 10 }, { width: 10 }, 
      { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }
    ];

    await this.downloadWorkbook(workbook, 'IT導入補助金_実施内容説明書.xlsx');
  }

  // 価格説明書を生成
  async generatePriceBreakdown(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('価格説明書');

    // タイトル
    worksheet.mergeCells('A1:G2');
    worksheet.getCell('A1').value = 'IT導入補助金 価格説明書';
    worksheet.getCell('A1').style = titleStyle;

    // 企業情報
    worksheet.getCell('A4').value = '申請者名';
    worksheet.getCell('B4').value = this.applicantData.companyName || '';
    worksheet.getCell('D4').value = '申請金額';
    worksheet.getCell('E4').value = this.applicantData.requestAmount || '¥1,500,000';

    // 価格明細ヘッダー
    const headers = ['区分', '項目', '内容', '数量', '単価', '金額', '備考'];
    const headerRow = worksheet.getRow(7);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // 価格データ
    const priceData = [
      ['ソフトウェア', 'クラウド業務管理システム', '基本パッケージ（10ユーザー）', '1', '¥800,000', '¥800,000', '年間利用料'],
      ['ソフトウェア', '追加ユーザーライセンス', '5ユーザー分', '5', '¥50,000', '¥250,000', ''],
      ['導入費用', '初期設定費用', 'システム設定・カスタマイズ', '1', '¥300,000', '¥300,000', ''],
      ['導入費用', 'データ移行費用', '既存データの移行作業', '1', '¥200,000', '¥200,000', ''],
      ['研修費用', '操作研修', '管理者・一般ユーザー研修', '3', '¥100,000', '¥300,000', '各拠点1回'],
      ['保守費用', '運用サポート', '導入後6ヶ月間のサポート', '1', '¥150,000', '¥150,000', ''],
    ];

    let currentRow = 8;
    priceData.forEach((data) => {
      const row = worksheet.getRow(currentRow);
      data.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.style = normalStyle;
        if (colIndex === 4 || colIndex === 5) {
          cell.style = { ...normalStyle, alignment: { horizontal: 'right' } };
        }
      });
      currentRow++;
    });

    // 合計行
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '合計';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };
    worksheet.getCell(`F${currentRow}`).value = '¥2,000,000';
    worksheet.getCell(`F${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };

    // 補助金計算
    currentRow += 2;
    worksheet.getCell(`A${currentRow}`).value = '補助金計算';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'left' } };
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '補助対象経費';
    worksheet.getCell(`C${currentRow}`).value = '¥2,000,000';
    worksheet.getCell(`C${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'right' } };
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '補助率';
    worksheet.getCell(`C${currentRow}`).value = '3/4';
    worksheet.getCell(`C${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'right' } };
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '補助金申請額';
    worksheet.getCell(`C${currentRow}`).value = '¥1,500,000';
    worksheet.getCell(`C${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };

    // 列幅調整
    worksheet.columns = [
      { width: 15 }, { width: 25 }, { width: 30 }, 
      { width: 10 }, { width: 15 }, { width: 15 }, { width: 20 }
    ];

    await this.downloadWorkbook(workbook, 'IT導入補助金_価格説明書.xlsx');
  }

  // ブランクテンプレート一式を生成
  async generateBlankTemplates(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // 各シートをブランクで作成
    this.createBlankApplicationSheet(workbook);
    this.createBlankBusinessPlanSheet(workbook);
    this.createBlankWageReportSheet(workbook);
    this.createBlankPriceSheet(workbook);

    await this.downloadWorkbook(workbook, 'IT導入補助金_ブランクテンプレート一式.xlsx');
  }

  // IT導入補助金申請ガイドを生成（Excel形式）
  async generateApplicationGuide(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // 表紙
    this.createGuidesCoverSheet(workbook);
    
    // 申請の流れ
    this.createApplicationFlowSheet(workbook);
    
    // 必要書類チェックリスト
    this.createDocumentChecklistSheet(workbook);
    
    // よくある質問
    this.createFAQSheet(workbook);
    
    // 審査のポイント
    this.createReviewPointsSheet(workbook);

    await this.downloadWorkbook(workbook, 'IT導入補助金_申請ガイド.xlsx');
  }

  // ========== Private Helper Methods ==========

  private createApplicationCoverSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('申請書表紙');
    
    // タイトル
    worksheet.mergeCells('A1:F3');
    worksheet.getCell('A1').value = 'IT導入補助金2025\n交付申請書';
    worksheet.getCell('A1').style = {
      font: { bold: true, size: 20 },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // 申請日
    worksheet.getCell('E5').value = '申請日';
    worksheet.getCell('F5').value = new Date().toLocaleDateString('ja-JP');

    // 申請者情報
    const applicantInfo = [
      ['申請者名（企業名）', this.applicantData.companyName || ''],
      ['代表者氏名', this.applicantData.representativeName || ''],
      ['法人番号', this.applicantData.companyNumber || ''],
      ['所在地', this.applicantData.address || ''],
      ['電話番号', this.applicantData.phoneNumber || ''],
      ['メールアドレス', this.applicantData.email || ''],
      ['設立年月日', this.applicantData.establishmentDate || ''],
      ['資本金', this.applicantData.capitalAmount || ''],
      ['従業員数', this.applicantData.employeeCount || ''],
      ['業種', this.applicantData.businessType || ''],
    ];

    let currentRow = 8;
    applicantInfo.forEach(([label, value]) => {
      worksheet.getCell(`B${currentRow}`).value = label;
      worksheet.getCell(`B${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
      worksheet.getCell(`C${currentRow}`).value = value;
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      currentRow++;
    });

    // 申請概要
    currentRow += 2;
    worksheet.getCell(`B${currentRow}`).value = '申請概要';
    worksheet.getCell(`B${currentRow}`).style = { ...headerStyle, font: { bold: true, size: 14 } };
    
    currentRow++;
    const summaryInfo = [
      ['事業名', this.applicantData.projectName || ''],
      ['申請枠', 'デジタル化基盤導入枠'],
      ['申請金額', this.applicantData.requestAmount || ''],
      ['補助率', '3/4'],
      ['事業実施期間', this.applicantData.implementationPeriod || ''],
    ];

    summaryInfo.forEach(([label, value]) => {
      worksheet.getCell(`B${currentRow}`).value = label;
      worksheet.getCell(`B${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
      worksheet.getCell(`C${currentRow}`).value = value;
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      currentRow++;
    });

    // 列幅設定
    worksheet.columns = [
      { width: 5 }, { width: 25 }, { width: 20 }, 
      { width: 20 }, { width: 20 }, { width: 20 }
    ];
  }

  private createBusinessPlanSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('事業計画書');
    
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = '事業計画書';
    worksheet.getCell('A1').style = titleStyle;

    // 事業計画の内容を記載
    const sections = [
      {
        title: '1. 事業の目的・概要',
        content: `本事業では、業務効率化と生産性向上を目的として、クラウド型業務管理システムを導入します。
現在の紙ベースの業務管理から、デジタル化された統合管理システムへ移行することで、
情報共有の迅速化、業務プロセスの自動化、データ分析による意思決定の高度化を実現します。`
      },
      {
        title: '2. 現状の課題',
        content: `・紙ベースでの情報管理による検索性の低さ
・部門間での情報共有の遅延
・手作業によるデータ入力の重複と誤り
・リアルタイムでの業務状況把握が困難
・データ分析による経営判断材料の不足`
      },
      {
        title: '3. 導入による効果',
        content: `・業務時間の30%削減（年間約1,200時間）
・情報共有の迅速化（即時共有が可能に）
・データ入力ミスの90%削減
・経営判断のスピード向上
・顧客満足度の向上`
      },
      {
        title: '4. 実施体制',
        content: `プロジェクトリーダー：${this.applicantData.representativeName || '代表取締役'}
IT担当責任者：情報システム部長
各部門責任者：営業部長、製造部長、管理部長
外部支援：${this.applicantData.vendorName || 'IT導入支援事業者'}`
      }
    ];

    let currentRow = 4;
    sections.forEach(section => {
      worksheet.getCell(`A${currentRow}`).value = section.title;
      worksheet.getCell(`A${currentRow}`).style = { 
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FF' } }
      };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:F${currentRow + 4}`);
      worksheet.getCell(`A${currentRow}`).value = section.content;
      worksheet.getCell(`A${currentRow}`).style = { 
        ...normalStyle, 
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true } 
      };
      currentRow += 6;
    });

    worksheet.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createEffectDescriptionSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('導入効果説明書');
    
    worksheet.mergeCells('A1:G2');
    worksheet.getCell('A1').value = '導入効果説明書';
    worksheet.getCell('A1').style = titleStyle;

    // 定量的効果
    worksheet.getCell('A4').value = '定量的効果';
    worksheet.getCell('A4').style = { ...headerStyle, font: { bold: true, size: 14 } };

    const quantitativeHeaders = ['項目', '現状', '導入後', '改善幅', '改善率', '年間効果額', '備考'];
    const headerRow = worksheet.getRow(6);
    quantitativeHeaders.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    const quantitativeData = [
      ['書類作成時間（月間）', '120時間', '84時間', '36時間', '30%', '¥1,080,000', '時給3,000円で計算'],
      ['データ入力時間（月間）', '80時間', '16時間', '64時間', '80%', '¥1,920,000', ''],
      ['情報検索時間（月間）', '40時間', '8時間', '32時間', '80%', '¥960,000', ''],
      ['会議準備時間（月間）', '20時間', '10時間', '10時間', '50%', '¥300,000', ''],
    ];

    let currentRow = 7;
    quantitativeData.forEach(data => {
      const row = worksheet.getRow(currentRow);
      data.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.style = normalStyle;
        if (colIndex >= 1 && colIndex <= 5) {
          cell.style = { ...normalStyle, alignment: { horizontal: 'right' } };
        }
      });
      currentRow++;
    });

    // 合計行
    worksheet.getCell(`A${currentRow}`).value = '合計年間削減効果';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = '¥4,260,000';
    worksheet.getCell(`F${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };

    // 定性的効果
    currentRow += 3;
    worksheet.getCell(`A${currentRow}`).value = '定性的効果';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, font: { bold: true, size: 14 } };

    currentRow += 2;
    const qualitativeEffects = [
      '1. 意思決定の迅速化：リアルタイムデータにより経営判断が即座に可能',
      '2. 従業員満足度の向上：ルーティンワークの削減により創造的業務に注力可能',
      '3. 顧客サービスの向上：迅速な対応により顧客満足度が向上',
      '4. 業務の標準化：システム化により業務プロセスが統一され品質が安定',
      '5. 情報セキュリティの強化：クラウドサービスによる高度なセキュリティ確保',
    ];

    qualitativeEffects.forEach(effect => {
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = effect;
      worksheet.getCell(`A${currentRow}`).style = { 
        ...normalStyle, 
        alignment: { horizontal: 'left' } 
      };
      currentRow++;
    });

    worksheet.columns = [
      { width: 25 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 12 }, { width: 18 }, { width: 20 }
    ];
  }

  private createCostDetailSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('経費明細書');
    
    worksheet.mergeCells('A1:H2');
    worksheet.getCell('A1').value = '経費明細書';
    worksheet.getCell('A1').style = titleStyle;

    // 経費区分別の明細
    const sections = [
      {
        title: 'ソフトウェア費',
        items: [
          ['クラウド業務管理システム', '基本パッケージ', '1式', '¥800,000', '¥800,000', '10ユーザーライセンス'],
          ['追加ユーザーライセンス', '追加5ユーザー分', '5', '¥50,000', '¥250,000', ''],
          ['オプション機能', 'AI分析機能', '1式', '¥200,000', '¥200,000', ''],
        ]
      },
      {
        title: '導入関連費',
        items: [
          ['初期設定費用', 'システム設定', '1式', '¥300,000', '¥300,000', 'カスタマイズ含む'],
          ['データ移行費用', '既存データ移行', '1式', '¥200,000', '¥200,000', ''],
          ['インターフェース開発', '既存システム連携', '1式', '¥150,000', '¥150,000', ''],
        ]
      },
      {
        title: '役務費',
        items: [
          ['導入コンサルティング', '要件定義・設計', '40時間', '¥10,000', '¥400,000', ''],
          ['操作研修費用', '管理者・利用者研修', '3回', '¥100,000', '¥300,000', '各拠点1回'],
          ['導入後サポート', '6ヶ月間サポート', '1式', '¥150,000', '¥150,000', ''],
        ]
      }
    ];

    let currentRow = 4;
    let grandTotal = 0;

    sections.forEach(section => {
      // セクションヘッダー
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = section.title;
      worksheet.getCell(`A${currentRow}`).style = { 
        ...headerStyle, 
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
        font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      };
      
      currentRow++;
      
      // 項目ヘッダー
      const itemHeaders = ['項目', '内容', '数量', '単価', '金額', '備考'];
      const headerRow = worksheet.getRow(currentRow);
      itemHeaders.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.style = headerStyle;
      });
      
      currentRow++;
      
      // 項目データ
      let sectionTotal = 0;
      section.items.forEach(item => {
        const row = worksheet.getRow(currentRow);
        item.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          cell.style = normalStyle;
          if (colIndex === 3 || colIndex === 4) {
            cell.style = { ...normalStyle, alignment: { horizontal: 'right' } };
          }
        });
        // 金額を合計に加算
        const amount = parseInt(item[4].replace(/[¥,]/g, ''));
        sectionTotal += amount;
        currentRow++;
      });
      
      // セクション小計
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `${section.title} 小計`;
      worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };
      worksheet.getCell(`E${currentRow}`).value = `¥${sectionTotal.toLocaleString()}`;
      worksheet.getCell(`E${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };
      
      grandTotal += sectionTotal;
      currentRow += 2;
    });

    // 総計
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '総計';
    worksheet.getCell(`A${currentRow}`).style = { 
      ...headerStyle, 
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'right' }
    };
    worksheet.getCell(`E${currentRow}`).value = `¥${grandTotal.toLocaleString()}`;
    worksheet.getCell(`E${currentRow}`).style = { 
      ...headerStyle, 
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'right' }
    };

    worksheet.columns = [
      { width: 25 }, { width: 25 }, { width: 12 }, 
      { width: 15 }, { width: 15 }, { width: 25 }
    ];
  }

  private createBlankApplicationSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('申請書（空欄）');
    
    worksheet.mergeCells('A1:F3');
    worksheet.getCell('A1').value = 'IT導入補助金2025\n交付申請書';
    worksheet.getCell('A1').style = {
      font: { bold: true, size: 20 },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    const fields = [
      '申請者名（企業名）',
      '代表者氏名',
      '法人番号',
      '所在地',
      '電話番号',
      'メールアドレス',
      '設立年月日',
      '資本金',
      '従業員数',
      '業種',
      '事業名',
      '申請枠',
      '申請金額',
      '事業実施期間'
    ];

    let currentRow = 5;
    fields.forEach(field => {
      worksheet.getCell(`B${currentRow}`).value = field;
      worksheet.getCell(`B${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      currentRow++;
    });

    worksheet.columns = [
      { width: 5 }, { width: 25 }, { width: 20 }, 
      { width: 20 }, { width: 20 }, { width: 20 }
    ];
  }

  private createBlankBusinessPlanSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('事業計画書（空欄）');
    
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = '事業計画書';
    worksheet.getCell('A1').style = titleStyle;

    const sections = [
      '1. 事業の目的・概要',
      '2. 現状の課題',
      '3. 導入による効果',
      '4. 実施体制',
      '5. 実施スケジュール',
      '6. 期待される成果'
    ];

    let currentRow = 4;
    sections.forEach(section => {
      worksheet.getCell(`A${currentRow}`).value = section;
      worksheet.getCell(`A${currentRow}`).style = { 
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FF' } }
      };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:F${currentRow + 5}`);
      worksheet.getCell(`A${currentRow}`).style = { 
        ...normalStyle,
        alignment: { horizontal: 'left', vertical: 'top' }
      };
      currentRow += 7;
    });

    worksheet.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createBlankWageReportSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('賃金報告書（空欄）');

    worksheet.mergeCells('A1:H2');
    worksheet.getCell('A1').value = '賃金報告書';
    worksheet.getCell('A1').style = titleStyle;

    worksheet.getCell('A4').value = '企業名';
    worksheet.getCell('B4').style = normalStyle;
    worksheet.getCell('D4').value = '代表者名';
    worksheet.getCell('E4').style = normalStyle;

    const headers = ['従業員区分', '人数', '平均年齢', '平均勤続年数', '現在の平均賃金', '引上げ後の平均賃金', '引上げ率', '備考'];
    const headerRow = worksheet.getRow(7);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // 空欄行を作成
    for (let i = 0; i < 5; i++) {
      const row = worksheet.getRow(8 + i);
      for (let j = 0; j < 8; j++) {
        row.getCell(j + 1).style = normalStyle;
      }
    }

    worksheet.columns = [
      { width: 20 }, { width: 10 }, { width: 12 }, { width: 15 },
      { width: 18 }, { width: 18 }, { width: 12 }, { width: 25 }
    ];
  }

  private createBlankPriceSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('価格説明書（空欄）');

    worksheet.mergeCells('A1:G2');
    worksheet.getCell('A1').value = 'IT導入補助金 価格説明書';
    worksheet.getCell('A1').style = titleStyle;

    worksheet.getCell('A4').value = '申請者名';
    worksheet.getCell('B4').style = normalStyle;
    worksheet.getCell('D4').value = '申請金額';
    worksheet.getCell('E4').style = normalStyle;

    const headers = ['区分', '項目', '内容', '数量', '単価', '金額', '備考'];
    const headerRow = worksheet.getRow(7);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // 空欄行を作成
    for (let i = 0; i < 10; i++) {
      const row = worksheet.getRow(8 + i);
      for (let j = 0; j < 7; j++) {
        row.getCell(j + 1).style = normalStyle;
      }
    }

    worksheet.columns = [
      { width: 15 }, { width: 25 }, { width: 30 }, 
      { width: 10 }, { width: 15 }, { width: 15 }, { width: 20 }
    ];
  }

  private createGuidesCoverSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('表紙');
    
    worksheet.mergeCells('A5:H15');
    worksheet.getCell('A5').value = 'IT導入補助金2025\n\n申請ガイドブック\n\n〜申請の流れから審査のポイントまで〜';
    worksheet.getCell('A5').style = {
      font: { bold: true, size: 24 },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FF' } }
    };

    worksheet.getCell('D20').value = '作成日：' + new Date().toLocaleDateString('ja-JP');
    worksheet.getCell('D21').value = 'Version 1.0';

    worksheet.columns = [
      { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
      { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }
    ];
  }

  private createApplicationFlowSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('申請の流れ');
    
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = 'IT導入補助金 申請の流れ';
    worksheet.getCell('A1').style = titleStyle;

    const steps = [
      {
        step: 'STEP 1',
        title: '事前準備',
        period: '申請開始2ヶ月前〜',
        tasks: [
          'gBizIDプライムの取得（2-3週間）',
          'SECURITY ACTIONの自己宣言',
          'IT導入支援事業者の選定',
          '導入するITツールの選定'
        ]
      },
      {
        step: 'STEP 2',
        title: '申請書作成',
        period: '申請開始1ヶ月前〜',
        tasks: [
          '事業計画書の作成',
          '導入効果の試算',
          '見積書の取得',
          '必要書類の収集'
        ]
      },
      {
        step: 'STEP 3',
        title: '電子申請',
        period: '申請期間中',
        tasks: [
          'jGrantsへログイン',
          '申請情報の入力',
          '必要書類のアップロード',
          '申請内容の最終確認'
        ]
      },
      {
        step: 'STEP 4',
        title: '審査・交付決定',
        period: '申請後1-2ヶ月',
        tasks: [
          '審査結果の通知待ち',
          '交付決定通知の受領',
          '事業実施の開始',
          '実績報告の準備'
        ]
      }
    ];

    let currentRow = 4;
    steps.forEach((stepData, index) => {
      // ステップヘッダー
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `${stepData.step}: ${stepData.title}`;
      worksheet.getCell(`A${currentRow}`).style = {
        font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = '期間';
      worksheet.getCell(`A${currentRow}`).style = headerStyle;
      worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = stepData.period;
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      
      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = '実施内容';
      worksheet.getCell(`A${currentRow}`).style = headerStyle;
      
      stepData.tasks.forEach((task, taskIndex) => {
        currentRow++;
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        worksheet.getCell(`B${currentRow}`).value = `${taskIndex + 1}. ${task}`;
        worksheet.getCell(`B${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'left' } };
      });
      
      currentRow += 2;
    });

    // 注意事項
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '【重要】申請時の注意事項';
    worksheet.getCell(`A${currentRow}`).style = {
      font: { bold: true, size: 12, color: { argb: 'FFFF0000' } },
      alignment: { horizontal: 'left' }
    };
    
    currentRow++;
    const notes = [
      '・gBizIDプライムの取得には書類郵送が必要で、2-3週間かかります',
      '・IT導入支援事業者は事前に登録された事業者から選ぶ必要があります',
      '・交付決定前に発注・契約・支払いを行った経費は補助対象外です',
      '・実績報告期限を過ぎると補助金が受け取れません'
    ];
    
    notes.forEach(note => {
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = note;
      worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'left' } };
    });

    worksheet.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createDocumentChecklistSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('必要書類チェックリスト');
    
    worksheet.mergeCells('A1:E2');
    worksheet.getCell('A1').value = '必要書類チェックリスト';
    worksheet.getCell('A1').style = titleStyle;

    const headers = ['チェック', '書類名', '取得先', '取得期間', '備考'];
    const headerRow = worksheet.getRow(4);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    const documents = [
      ['□', 'gBizIDプライムアカウント', 'gBizIDサイト', '2-3週間', '印鑑証明書が必要'],
      ['□', 'SECURITY ACTION自己宣言ID', 'IPAサイト', '即日', 'オンラインで完結'],
      ['□', '履歴事項全部証明書', '法務局', '即日-3日', '3ヶ月以内のもの'],
      ['□', '納税証明書（その1）', '税務署', '即日-1週間', '直近のもの'],
      ['□', '決算書（直近2期分）', '自社', '-', '貸借対照表、損益計算書'],
      ['□', '見積書', 'IT導入支援事業者', '数日', '詳細な内訳が必要'],
      ['□', '事業計画書', '自社作成', '-', '指定様式あり'],
      ['□', '従業員数がわかる書類', '自社', '-', '労働者名簿等'],
    ];

    let currentRow = 5;
    documents.forEach(doc => {
      const row = worksheet.getRow(currentRow);
      doc.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        cell.style = normalStyle;
        if (colIndex === 0) {
          cell.style = { ...normalStyle, alignment: { horizontal: 'center' } };
        }
      });
      currentRow++;
    });

    // 書類準備のポイント
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '書類準備のポイント';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, font: { bold: true, size: 12 } };
    
    currentRow++;
    const points = [
      '1. gBizIDプライムは最も時間がかかるため、真っ先に申請しましょう',
      '2. 履歴事項全部証明書は発行から3ヶ月以内のものが必要です',
      '3. 見積書は補助対象経費が明確にわかるよう詳細な内訳を記載してもらいましょう',
      '4. 事業計画書は審査の重要ポイントです。具体的な数値目標を含めましょう'
    ];
    
    points.forEach(point => {
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = point;
      worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'left' } };
    });

    worksheet.columns = [
      { width: 10 }, { width: 30 }, { width: 20 }, { width: 15 }, { width: 30 }
    ];
  }

  private createFAQSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('よくある質問');
    
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = 'よくある質問（FAQ）';
    worksheet.getCell('A1').style = titleStyle;

    const faqs = [
      {
        q: 'Q1. どのような企業が申請できますか？',
        a: '中小企業・小規模事業者が対象です。業種により資本金・従業員数の上限が異なります。製造業の場合、資本金3億円以下または従業員300人以下が対象です。'
      },
      {
        q: 'Q2. 補助率と補助上限額は？',
        a: 'デジタル化基盤導入枠の場合、補助率は3/4以内、補助上限額は450万円です。ただし、会計・受発注・決済・ECソフトの場合は50万円以下の部分は3/4、50万円超350万円以下の部分は2/3となります。'
      },
      {
        q: 'Q3. どのようなITツールが対象になりますか？',
        a: '事前に登録されたITツールのみが対象です。会計ソフト、受発注システム、決済システム、ECサイトなどが含まれます。IT導入支援事業者のサイトで検索できます。'
      },
      {
        q: 'Q4. 申請から交付決定までどのくらいかかりますか？',
        a: '通常、申請締切から1〜2ヶ月程度で交付決定されます。ただし、申請内容に不備がある場合は、さらに時間がかかることがあります。'
      },
      {
        q: 'Q5. 交付決定前に購入したものは対象になりますか？',
        a: 'なりません。必ず交付決定通知を受けてから、発注・契約・支払いを行ってください。交付決定前の経費は補助対象外です。'
      },
      {
        q: 'Q6. 賃金引上げは必須ですか？',
        a: 'はい、必須です。事業実施年度とその後3年間で、給与支給総額を年率平均1.5%以上増加させる計画が必要です。未達成の場合、補助金返還の可能性があります。'
      }
    ];

    let currentRow = 4;
    faqs.forEach((faq, index) => {
      // 質問
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = faq.q;
      worksheet.getCell(`A${currentRow}`).style = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FF' } },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };
      
      currentRow++;
      
      // 回答
      worksheet.mergeCells(`A${currentRow}:F${currentRow + 2}`);
      worksheet.getCell(`A${currentRow}`).value = faq.a;
      worksheet.getCell(`A${currentRow}`).style = {
        ...normalStyle,
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true }
      };
      
      currentRow += 4;
    });

    worksheet.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createReviewPointsSheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('審査のポイント');
    
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = '審査のポイント';
    worksheet.getCell('A1').style = titleStyle;

    worksheet.getCell('A4').value = '審査では以下の観点から総合的に評価されます';
    worksheet.getCell('A4').style = { font: { size: 12 }, alignment: { horizontal: 'left' } };

    const reviewPoints = [
      {
        category: '1. 事業計画の妥当性',
        points: [
          '現状の課題が明確に分析されているか',
          'ITツール導入による解決策が適切か',
          '実施スケジュールが現実的か',
          '実施体制が整っているか'
        ]
      },
      {
        category: '2. 導入効果の具体性',
        points: [
          '定量的な効果（時間削減、コスト削減等）が示されているか',
          '生産性向上の目標が明確か',
          '効果測定の方法が具体的か',
          '投資対効果が妥当か'
        ]
      },
      {
        category: '3. 事業の実現可能性',
        points: [
          '財務状況が健全か',
          '自己負担分の資金調達が可能か',
          'ITツールを活用できる人材がいるか',
          '導入後の運用体制が整っているか'
        ]
      },
      {
        category: '4. 政策的観点',
        points: [
          '地域経済への貢献度',
          '雇用の維持・拡大への寄与',
          'デジタル化による業界への波及効果',
          '賃金引上げ計画の実現可能性'
        ]
      }
    ];

    let currentRow = 6;
    reviewPoints.forEach(point => {
      // カテゴリヘッダー
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = point.category;
      worksheet.getCell(`A${currentRow}`).style = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      currentRow++;
      
      // ポイント詳細
      point.points.forEach(item => {
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        worksheet.getCell(`B${currentRow}`).value = `・${item}`;
        worksheet.getCell(`B${currentRow}`).style = {
          ...normalStyle,
          alignment: { horizontal: 'left' }
        };
        currentRow++;
      });
      
      currentRow++;
    });

    // 審査で高評価を得るためのコツ
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '審査で高評価を得るためのコツ';
    worksheet.getCell(`A${currentRow}`).style = {
      font: { bold: true, size: 14 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
    
    currentRow += 2;
    const tips = [
      '✓ 具体的な数値目標を設定する（例：作業時間30%削減、売上10%向上）',
      '✓ 現状分析では課題を定量的に示す（例：月間○○時間の作業が発生）',
      '✓ 導入後の業務フローを図解で示す',
      '✓ 他社の成功事例を参考に、自社への適用方法を説明する',
      '✓ IT導入支援事業者と綿密に相談し、実現可能な計画を立てる'
    ];
    
    tips.forEach(tip => {
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = tip;
      worksheet.getCell(`A${currentRow}`).style = {
        font: { size: 11, bold: true },
        alignment: { horizontal: 'left' }
      };
      currentRow++;
    });

    worksheet.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private async downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, filename);
  }
}

// エクスポート用の便利な関数
export const generateITSubsidyDocuments = {
  filledApplication: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateFilledApplicationDocuments(),
  
  wageReport: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateWageReport(),
  
  implementationPlan: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateImplementationPlan(),
  
  priceBreakdown: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generatePriceBreakdown(),
  
  blankTemplates: () => 
    new ITSubsidyExcelGenerator().generateBlankTemplates(),
  
  applicationGuide: () => 
    new ITSubsidyExcelGenerator().generateApplicationGuide()
};