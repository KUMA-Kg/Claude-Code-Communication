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
  // 追加フィールド
  representativeTitle?: string;
  department?: string;
  postalCode?: string;
  faxNumber?: string;
  websiteUrl?: string;
  fiscalYearEnd?: string;
  currentWage?: string;
  targetWage?: string;
  wageIncreaseRate?: string;
  productivityCurrent?: string;
  productivityTarget?: string;
  salesRevenue?: string;
  operatingProfit?: string;
  toolCategory?: string;
  toolFunction?: string;
  monthlyFee?: string;
  initialCost?: string;
  maintenanceCost?: string;
}

// セルのスタイル設定 - 政府文書形式
const headerStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 10, name: 'ＭＳ ゴシック' },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' }
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
  font: { bold: true, size: 14, name: 'ＭＳ ゴシック' },
  alignment: { horizontal: 'center', vertical: 'middle' }
};

const normalStyle: Partial<ExcelJS.Style> = {
  font: { size: 10, name: 'ＭＳ ゴシック' },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  },
  alignment: { vertical: 'middle', wrapText: true }
};

const labelStyle: Partial<ExcelJS.Style> = {
  font: { size: 10, name: 'ＭＳ ゴシック' },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }
  },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  },
  alignment: { horizontal: 'left', vertical: 'middle' }
};

const formNumberStyle: Partial<ExcelJS.Style> = {
  font: { size: 10, name: 'ＭＳ ゴシック' },
  alignment: { horizontal: 'right', vertical: 'top' }
};

// IT導入補助金申請書類生成クラス
export class ITSubsidyExcelGenerator {
  private applicantData: ApplicantData;

  constructor(applicantData: ApplicantData = {}) {
    this.applicantData = applicantData;
  }

  // 公式様式に基づく申請書類一式を生成
  async generateOfficialDocuments(): Promise<void> {
    // 各様式を個別のファイルとして生成
    await this.generateForm1(); // 様式1: 申請書
    await this.generateForm2(); // 様式2: 事業計画書
    await this.generateForm3(); // 様式3: 導入ITツール一覧
    await this.generateForm4(); // 様式4: 賃金引上げ計画書
    await this.generateForm5(); // 様式5: 労働生産性向上計画書
    await this.generateForm6(); // 様式6: 申請者概要
  }

  // 様式1: 申請書
  async generateForm1(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.createForm1Sheet(workbook);
    await this.downloadWorkbook(workbook, 'IT導入補助金2025_様式1_申請書.xlsx');
  }

  // 様式2: 事業計画書
  async generateForm2(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.createForm2Sheet(workbook);
    await this.downloadWorkbook(workbook, 'IT導入補助金2025_様式2_事業計画書.xlsx');
  }

  // 様式3: 導入ITツール一覧
  async generateForm3(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.createForm3Sheet(workbook);
    await this.downloadWorkbook(workbook, 'IT導入補助金2025_様式3_導入ITツール一覧.xlsx');
  }

  // 様式4: 賃金引上げ計画書
  async generateForm4(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.createForm4Sheet(workbook);
    await this.downloadWorkbook(workbook, 'IT導入補助金2025_様式4_賃金引上げ計画書.xlsx');
  }

  // 様式5: 労働生産性向上計画書
  async generateForm5(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.createForm5Sheet(workbook);
    await this.downloadWorkbook(workbook, 'IT導入補助金2025_様式5_労働生産性向上計画書.xlsx');
  }

  // 様式6: 申請者概要
  async generateForm6(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.createForm6Sheet(workbook);
    await this.downloadWorkbook(workbook, 'IT導入補助金2025_様式6_申請者概要.xlsx');
  }

  // ========== Private Helper Methods for Official Forms ==========

  // 様式1: 申請書
  private createForm1Sheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('様式1_申請書');
    
    // 様式番号
    worksheet.getCell('H1').value = '様式1';
    worksheet.getCell('H1').style = formNumberStyle;
    
    // タイトル
    worksheet.mergeCells('A2:H3');
    worksheet.getCell('A2').value = 'IT導入補助金2025年 交付申請書';
    worksheet.getCell('A2').style = {
      font: { bold: true, size: 16, name: 'ＭＳ ゴシック' },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    // 申請日
    worksheet.getCell('F5').value = '申請日';
    worksheet.getCell('F5').style = labelStyle;
    worksheet.getCell('G5').value = '令和7年　月　日';
    worksheet.getCell('G5').style = normalStyle;
    
    // 申請者情報セクション
    let currentRow = 7;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '1. 申請者情報';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const applicantFields = [
      { label: '法人番号', value: this.applicantData.companyNumber, width: 2 },
      { label: '商号又は名称', value: this.applicantData.companyName, width: 4 },
      { label: '代表者役職', value: this.applicantData.representativeTitle || '代表取締役', width: 2 },
      { label: '代表者氏名', value: this.applicantData.representativeName, width: 4 },
      { label: '郵便番号', value: this.applicantData.postalCode, width: 2 },
      { label: '所在地', value: this.applicantData.address, width: 6 },
      { label: '電話番号', value: this.applicantData.phoneNumber, width: 2 },
      { label: 'FAX番号', value: this.applicantData.faxNumber, width: 2 },
      { label: 'メールアドレス', value: this.applicantData.email, width: 4 },
      { label: '設立年月日', value: this.applicantData.establishmentDate, width: 2 },
      { label: '資本金', value: this.applicantData.capitalAmount, width: 2 },
      { label: '従業員数', value: this.applicantData.employeeCount, width: 2 },
      { label: '業種', value: this.applicantData.businessType, width: 4 },
    ];
    
    applicantFields.forEach(field => {
      worksheet.getCell(`A${currentRow}`).value = field.label;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`B${currentRow}:${this.getColumnLetter(field.width)}${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = field.value || '';
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    // 事業計画の概要セクション
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '2. 事業計画の概要';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '事業名称';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = this.applicantData.projectName || '';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '事業概要';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:H${currentRow + 3}`);
    worksheet.getCell(`B${currentRow}`).value = '';
    worksheet.getCell(`B${currentRow}`).style = { ...normalStyle, alignment: { vertical: 'top', wrapText: true } };
    
    currentRow += 5;
    // 導入するITツールの詳細セクション
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '3. 導入するITツールの詳細';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'ITツール名';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = this.applicantData.toolName || '';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'IT導入支援事業者名';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = this.applicantData.vendorName || '';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    // 申請額の内訳セクション
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '4. 申請額の内訳';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const costHeaders = ['費目', '内容', '金額（税抜）', '補助対象', '補助率', '補助金額'];
    costHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
    });
    
    // 空の明細行
    for (let i = 0; i < 5; i++) {
      currentRow++;
      for (let j = 0; j < 6; j++) {
        worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = normalStyle;
      }
    }
    
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '合計';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    for (let j = 2; j < 6; j++) {
      worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = headerStyle;
    }
    
    // 列幅設定
    worksheet.columns = [
      { width: 15 }, { width: 12 }, { width: 15 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
    ];
  }

  // 様式2: 事業計画書
  private createForm2Sheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('様式2_事業計画書');
    
    // 様式番号
    worksheet.getCell('H1').value = '様式2';
    worksheet.getCell('H1').style = formNumberStyle;
    
    // タイトル
    worksheet.mergeCells('A2:H3');
    worksheet.getCell('A2').value = 'IT導入補助金2025年 事業計画書';
    worksheet.getCell('A2').style = {
      font: { bold: true, size: 16, name: 'ＭＳ ゴシック' },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    let currentRow = 5;
    
    // 1. 現状の課題と解決策
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '1. 現状の課題と解決策';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '(1) 現状の課題';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow + 4}`);
    worksheet.getCell(`A${currentRow}`).value = '';
    worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { vertical: 'top', wrapText: true } };
    
    currentRow += 6;
    worksheet.getCell(`A${currentRow}`).value = '(2) IT導入による解決策';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow + 4}`);
    worksheet.getCell(`A${currentRow}`).value = '';
    worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { vertical: 'top', wrapText: true } };
    
    // 2. IT導入による効果
    currentRow += 6;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '2. IT導入による効果';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '(1) 定量的効果';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    
    currentRow++;
    const effectHeaders = ['項目', '現状', '導入後', '改善幅', '改善率'];
    effectHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
    });
    
    // 効果測定項目の空行
    for (let i = 0; i < 4; i++) {
      currentRow++;
      for (let j = 0; j < 5; j++) {
        worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = normalStyle;
      }
    }
    
    currentRow += 2;
    worksheet.getCell(`A${currentRow}`).value = '(2) 定性的効果';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow + 3}`);
    worksheet.getCell(`A${currentRow}`).value = '';
    worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { vertical: 'top', wrapText: true } };
    
    // 3. 3年間の数値目標
    currentRow += 5;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '3. 3年間の数値目標';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const targetHeaders = ['項目', '基準年度', '1年目', '2年目', '3年目', '3年間平均'];
    targetHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
    });
    
    currentRow++;
    const targetItems = ['売上高', '営業利益率', '労働生産性', '従業員数'];
    targetItems.forEach(item => {
      worksheet.getCell(`A${currentRow}`).value = item;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      for (let j = 1; j < 6; j++) {
        worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = normalStyle;
      }
      currentRow++;
    });
    
    // 4. 実施体制
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '4. 実施体制';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const roleHeaders = ['役割', '担当者名', '所属・役職', '責任範囲'];
    roleHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index * 2 + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
      if (index < 3) {
        worksheet.mergeCells(`${this.getColumnLetter(index * 2 + 1)}${currentRow}:${this.getColumnLetter(index * 2 + 2)}${currentRow}`);
      }
    });
    
    // 実施体制の空行
    for (let i = 0; i < 4; i++) {
      currentRow++;
      worksheet.getCell(`A${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
      worksheet.getCell(`E${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
      worksheet.getCell(`G${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    }
    
    // 列幅設定
    worksheet.columns = [
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
    ];
  }

  // 様式3: 導入ITツール一覧
  private createForm3Sheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('様式3_導入ITツール一覧');
    
    // 様式番号
    worksheet.getCell('I1').value = '様式3';
    worksheet.getCell('I1').style = formNumberStyle;
    
    // タイトル
    worksheet.mergeCells('A2:I3');
    worksheet.getCell('A2').value = 'IT導入補助金2025年 導入ITツール一覧';
    worksheet.getCell('A2').style = {
      font: { bold: true, size: 16, name: 'ＭＳ ゴシック' },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    let currentRow = 5;
    
    // 申請者情報
    worksheet.getCell(`A${currentRow}`).value = '申請者名';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = this.applicantData.companyName || '';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    worksheet.getCell(`F${currentRow}`).value = 'IT導入支援事業者';
    worksheet.getCell(`F${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = this.applicantData.vendorName || '';
    worksheet.getCell(`G${currentRow}`).style = normalStyle;
    
    currentRow += 2;
    
    // ITツール詳細ヘッダー
    const headers = [
      'No.', 'ITツール名', '機能分類', 'ツール概要', 
      '導入費用(税抜)', '月額費用(税抜)', '年間費用(税抜)', '保守費用(税抜)', '備考'
    ];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
    });
    
    // ITツール明細行
    currentRow++;
    // サンプルデータ行
    const toolData = [
      {
        no: '1',
        name: this.applicantData.toolName || '',
        category: this.applicantData.toolCategory || '業務効率化',
        description: this.applicantData.toolFunction || '',
        initialCost: this.applicantData.initialCost || '',
        monthlyFee: this.applicantData.monthlyFee || '',
        annualFee: '',
        maintenanceCost: this.applicantData.maintenanceCost || '',
        notes: ''
      }
    ];
    
    toolData.forEach(tool => {
      worksheet.getCell(`A${currentRow}`).value = tool.no;
      worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'center' } };
      worksheet.getCell(`B${currentRow}`).value = tool.name;
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      worksheet.getCell(`C${currentRow}`).value = tool.category;
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      worksheet.getCell(`D${currentRow}`).value = tool.description;
      worksheet.getCell(`D${currentRow}`).style = normalStyle;
      worksheet.getCell(`E${currentRow}`).value = tool.initialCost;
      worksheet.getCell(`E${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'right' } };
      worksheet.getCell(`F${currentRow}`).value = tool.monthlyFee;
      worksheet.getCell(`F${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'right' } };
      worksheet.getCell(`G${currentRow}`).value = tool.annualFee;
      worksheet.getCell(`G${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'right' } };
      worksheet.getCell(`H${currentRow}`).value = tool.maintenanceCost;
      worksheet.getCell(`H${currentRow}`).style = { ...normalStyle, alignment: { horizontal: 'right' } };
      worksheet.getCell(`I${currentRow}`).value = tool.notes;
      worksheet.getCell(`I${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    // 追加の空行
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 9; j++) {
        worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = normalStyle;
      }
      currentRow++;
    }
    
    // 合計行
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '合計';
    worksheet.getCell(`A${currentRow}`).style = { ...headerStyle, alignment: { horizontal: 'right' } };
    for (let j = 4; j < 9; j++) {
      worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = headerStyle;
    }
    
    currentRow += 2;
    
    // 機能分類の説明
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '【機能分類】';
    worksheet.getCell(`A${currentRow}`).style = { font: { bold: true, size: 10, name: 'ＭＳ ゴシック' } };
    
    currentRow++;
    const categories = [
      '・業務効率化：業務プロセスの自動化・効率化を図るツール',
      '・情報共有：社内の情報共有・コミュニケーションを支援するツール',
      '・顧客管理：顧客情報の管理・分析を行うツール',
      '・財務会計：会計・経理業務を支援するツール',
      '・その他：上記に分類されないツール'
    ];
    
    categories.forEach(category => {
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = category;
      worksheet.getCell(`A${currentRow}`).style = { font: { size: 9, name: 'ＭＳ ゴシック' } };
      currentRow++;
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 5 }, { width: 20 }, { width: 12 }, { width: 25 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }
    ];
  }

  // 様式4: 賃金引上げ計画書
  private createForm4Sheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('様式4_賃金引上げ計画書');
    
    // 様式番号
    worksheet.getCell('H1').value = '様式4';
    worksheet.getCell('H1').style = formNumberStyle;
    
    // タイトル
    worksheet.mergeCells('A2:H3');
    worksheet.getCell('A2').value = 'IT導入補助金2025年 賃金引上げ計画書';
    worksheet.getCell('A2').style = {
      font: { bold: true, size: 16, name: 'ＭＳ ゴシック' },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    let currentRow = 5;
    
    // 申請者情報
    worksheet.getCell(`A${currentRow}`).value = '申請者名';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = this.applicantData.companyName || '';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    worksheet.getCell(`E${currentRow}`).value = '代表者名';
    worksheet.getCell(`E${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = this.applicantData.representativeName || '';
    worksheet.getCell(`F${currentRow}`).style = normalStyle;
    
    currentRow += 2;
    
    // 現在の賃金状況
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '1. 現在の賃金状況';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const wageHeaders = ['従業員区分', '人数', '平均年齢', '平均勤続年数', '現在の平均賃金(月額)', '年間給与総額'];
    wageHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
      if (index === 0) {
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      }
    });
    
    currentRow++;
    const employeeTypes = ['正社員', 'パート・アルバイト', '契約社員', 'その他'];
    employeeTypes.forEach(type => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = type;
      worksheet.getCell(`A${currentRow}`).style = normalStyle;
      for (let j = 2; j < 7; j++) {
        worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = normalStyle;
      }
      currentRow++;
    });
    
    // 合計行
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '合計';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    for (let j = 2; j < 7; j++) {
      worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = headerStyle;
    }
    
    currentRow += 2;
    
    // 賃金引上げ計画
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '2. 賃金引上げ計画';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const planHeaders = ['年度', '給与支給総額', '前年比増加額', '増加率', '平均賃金(月額)', '対象従業員数'];
    planHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
      if (index === 1 || index === 2) {
        worksheet.mergeCells(`${this.getColumnLetter(index + 1)}${currentRow}:${this.getColumnLetter(index + 2)}${currentRow}`);
      }
    });
    
    currentRow++;
    const years = ['基準年度(2024年度)', '1年目(2025年度)', '2年目(2026年度)', '3年目(2027年度)'];
    years.forEach(year => {
      worksheet.getCell(`A${currentRow}`).value = year;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).style = normalStyle;
      worksheet.getCell(`F${currentRow}`).style = normalStyle;
      worksheet.getCell(`G${currentRow}`).style = normalStyle;
      worksheet.getCell(`H${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '3年間平均増加率';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow += 2;
    
    // 実施方法
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '3. 賃金引上げの実施方法';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow + 4}`);
    worksheet.getCell(`A${currentRow}`).value = '';
    worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { vertical: 'top', wrapText: true } };
    
    currentRow += 6;
    
    // 注意事項
    worksheet.mergeCells(`A${currentRow}:H${currentRow + 2}`);
    worksheet.getCell(`A${currentRow}`).value = '※ 給与支給総額を年率平均1.5%以上増加させる計画を策定してください。\n※ 計画未達成の場合、補助金の返還を求められる場合があります。';
    worksheet.getCell(`A${currentRow}`).style = {
      font: { size: 9, name: 'ＭＳ ゴシック', color: { argb: 'FF0000FF' } },
      alignment: { vertical: 'top', wrapText: true }
    };
    
    // 列幅設定
    worksheet.columns = [
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 15 }, { width: 12 }, { width: 12 }
    ];
  }

  // 様式5: 労働生産性向上計画書
  private createForm5Sheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('様式5_労働生産性向上計画書');
    
    // 様式番号
    worksheet.getCell('H1').value = '様式5';
    worksheet.getCell('H1').style = formNumberStyle;
    
    // タイトル
    worksheet.mergeCells('A2:H3');
    worksheet.getCell('A2').value = 'IT導入補助金2025年 労働生産性向上計画書';
    worksheet.getCell('A2').style = {
      font: { bold: true, size: 16, name: 'ＭＳ ゴシック' },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    let currentRow = 5;
    
    // 申請者情報
    worksheet.getCell(`A${currentRow}`).value = '申請者名';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = this.applicantData.companyName || '';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    currentRow += 2;
    
    // 1. 現状の労働生産性
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '1. 現状の労働生産性';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = '算出方法';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`B${currentRow}:H${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = '労働生産性 = 営業利益 + 人件費 + 減価償却費 ÷ 労働投入量（労働者数×年間労働時間）';
    worksheet.getCell(`B${currentRow}`).style = normalStyle;
    
    currentRow += 2;
    const calcHeaders = ['項目', '金額・数値', '単位', '備考'];
    calcHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index * 2 + 1)}${currentRow}`);
      cell.value = header;
      cell.style = headerStyle;
      worksheet.mergeCells(`${this.getColumnLetter(index * 2 + 1)}${currentRow}:${this.getColumnLetter(index * 2 + 2)}${currentRow}`);
    });
    
    currentRow++;
    const calcItems = [
      { item: '営業利益', unit: '千円' },
      { item: '人件費', unit: '千円' },
      { item: '減価償却費', unit: '千円' },
      { item: '労働者数', unit: '人' },
      { item: '年間労働時間', unit: '時間/人' },
      { item: '労働生産性', unit: '円/時間' }
    ];
    
    calcItems.forEach(item => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = item.item;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
      worksheet.getCell(`E${currentRow}`).value = item.unit;
      worksheet.getCell(`E${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
      worksheet.getCell(`G${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    currentRow += 2;
    
    // 2. 目標値
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '2. 目標値';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const targetHeaders = ['年度', '労働生産性', '前年比', '改善率', '主な取組内容'];
    targetHeaders.forEach((header, index) => {
      if (index === 0) {
        worksheet.getCell(`A${currentRow}`).value = header;
        worksheet.getCell(`A${currentRow}`).style = headerStyle;
      } else if (index === 4) {
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = header;
        worksheet.getCell(`E${currentRow}`).style = headerStyle;
      } else {
        worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`).value = header;
        worksheet.getCell(`${this.getColumnLetter(index + 1)}${currentRow}`).style = headerStyle;
      }
    });
    
    currentRow++;
    const targetYears = ['基準年度', '1年目', '2年目', '3年目'];
    targetYears.forEach(year => {
      worksheet.getCell(`A${currentRow}`).value = year;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      worksheet.getCell(`D${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
      worksheet.getCell(`E${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    currentRow += 2;
    
    // 3. 具体的な取組内容
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '3. 具体的な取組内容';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const initiatives = [
      '(1) IT導入による業務効率化',
      '(2) 業務プロセスの見直し',
      '(3) 従業員のスキル向上',
      '(4) その他の取組'
    ];
    
    initiatives.forEach(initiative => {
      worksheet.getCell(`A${currentRow}`).value = initiative;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:H${currentRow + 2}`);
      worksheet.getCell(`A${currentRow}`).value = '';
      worksheet.getCell(`A${currentRow}`).style = { ...normalStyle, alignment: { vertical: 'top', wrapText: true } };
      currentRow += 4;
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
    ];
  }

  // 様式6: 申請者概要
  private createForm6Sheet(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('様式6_申請者概要');
    
    // 様式番号
    worksheet.getCell('H1').value = '様式6';
    worksheet.getCell('H1').style = formNumberStyle;
    
    // タイトル
    worksheet.mergeCells('A2:H3');
    worksheet.getCell('A2').value = 'IT導入補助金2025年 申請者概要';
    worksheet.getCell('A2').style = {
      font: { bold: true, size: 16, name: 'ＭＳ ゴシック' },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    let currentRow = 5;
    
    // 1. 企業情報詳細
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '1. 企業情報詳細';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const companyFields = [
      { label: '法人番号', value: this.applicantData.companyNumber, width: 2 },
      { label: '商号又は名称', value: this.applicantData.companyName, width: 4 },
      { label: '商号又は名称（カナ）', value: '', width: 4 },
      { label: '代表者役職', value: this.applicantData.representativeTitle || '代表取締役', width: 2 },
      { label: '代表者氏名', value: this.applicantData.representativeName, width: 4 },
      { label: '代表者氏名（カナ）', value: '', width: 4 },
      { label: '設立年月日', value: this.applicantData.establishmentDate, width: 2 },
      { label: '決算月', value: this.applicantData.fiscalYearEnd || '3月', width: 2 },
      { label: '資本金', value: this.applicantData.capitalAmount, width: 2 },
      { label: '常時使用する従業員数', value: this.applicantData.employeeCount, width: 2 },
      { label: '主たる業種', value: this.applicantData.businessType, width: 4 },
      { label: '郵便番号', value: this.applicantData.postalCode, width: 2 },
      { label: '所在地', value: this.applicantData.address, width: 6 },
      { label: '電話番号', value: this.applicantData.phoneNumber, width: 2 },
      { label: 'FAX番号', value: this.applicantData.faxNumber, width: 2 },
      { label: 'メールアドレス', value: this.applicantData.email, width: 4 },
      { label: 'ホームページURL', value: this.applicantData.websiteUrl, width: 6 }
    ];
    
    companyFields.forEach(field => {
      worksheet.getCell(`A${currentRow}`).value = field.label;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`B${currentRow}:${this.getColumnLetter(field.width)}${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = field.value || '';
      worksheet.getCell(`B${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    currentRow++;
    
    // 2. 財務情報
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '2. 財務情報（直近2期分）';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const financeHeaders = ['項目', '前々期', '前期', '単位'];
    worksheet.getCell(`A${currentRow}`).value = financeHeaders[0];
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value = financeHeaders[1];
    worksheet.getCell(`C${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = financeHeaders[2];
    worksheet.getCell(`E${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = financeHeaders[3];
    worksheet.getCell(`G${currentRow}`).style = headerStyle;
    
    currentRow++;
    const financeItems = [
      { item: '売上高', unit: '千円' },
      { item: '営業利益', unit: '千円' },
      { item: '経常利益', unit: '千円' },
      { item: '当期純利益', unit: '千円' },
      { item: '総資産', unit: '千円' },
      { item: '純資産', unit: '千円' }
    ];
    
    financeItems.forEach(item => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = item.item;
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
      worksheet.getCell(`C${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
      worksheet.getCell(`E${currentRow}`).style = normalStyle;
      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
      worksheet.getCell(`G${currentRow}`).value = item.unit;
      worksheet.getCell(`G${currentRow}`).style = normalStyle;
      currentRow++;
    });
    
    currentRow++;
    
    // 3. 従業員情報
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = '3. 従業員情報';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    
    currentRow++;
    const employeeHeaders = ['区分', '男性', '女性', '計', '平均年齢', '平均勤続年数'];
    employeeHeaders.forEach((header, index) => {
      if (index === 0) {
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = header;
        worksheet.getCell(`A${currentRow}`).style = headerStyle;
      } else {
        worksheet.getCell(`${this.getColumnLetter(index + 2)}${currentRow}`).value = header;
        worksheet.getCell(`${this.getColumnLetter(index + 2)}${currentRow}`).style = headerStyle;
      }
    });
    
    currentRow++;
    const employeeCategories = ['正社員', 'パート・アルバイト', '契約社員', 'その他', '合計'];
    employeeCategories.forEach(category => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = category;
      worksheet.getCell(`A${currentRow}`).style = category === '合計' ? headerStyle : normalStyle;
      for (let j = 2; j < 8; j++) {
        worksheet.getCell(`${this.getColumnLetter(j + 1)}${currentRow}`).style = category === '合計' ? headerStyle : normalStyle;
      }
      currentRow++;
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
    ];
  }

  // ========== Helper Methods ==========

  // 列番号を文字に変換するヘルパー関数
  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
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
  // 全様式を一括生成
  allOfficialForms: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateOfficialDocuments(),
  
  // 個別様式の生成
  form1: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateForm1(),
  
  form2: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateForm2(),
  
  form3: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateForm3(),
  
  form4: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateForm4(),
  
  form5: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateForm5(),
  
  form6: (data?: ApplicantData) => 
    new ITSubsidyExcelGenerator(data).generateForm6()
};