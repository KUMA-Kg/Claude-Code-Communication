import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import documentFieldSpecs from '../data/document-field-specifications.json';
import { FormDataMapper } from './formDataMapper';
import { DocumentDataCollector } from './documentDataCollector';
import { DocumentTemplates } from './documentTemplates';

interface DocumentField {
  field_name: string;
  field_id: string;
  type: string;
  required: boolean;
  description: string;
  max_length?: number;
  pattern?: string;
  options?: string[];
  min?: number;
  max?: number;
  decimal_places?: number;
  file_types?: string[];
  max_size_mb?: number;
  conditional?: {
    field: string;
    value: string;
  };
  fields?: DocumentField[];
  item_fields?: DocumentField[];
  min_items?: number;
  max_items?: number;
}

interface DocumentSpec {
  document_name: string;
  description: string;
  fields: DocumentField[];
}

interface FormData {
  [key: string]: any;
}

export class DocumentGenerator {
  private specs: any;
  private mapper: FormDataMapper;
  private collector: DocumentDataCollector;
  private templates: DocumentTemplates;

  constructor() {
    this.specs = documentFieldSpecs.document_field_specifications;
    this.mapper = new FormDataMapper();
    this.collector = new DocumentDataCollector();
    this.templates = new DocumentTemplates();
  }

  async generateExcel(subsidyType: string, documents: string[], formData: FormData, companyData?: any, questionnaireData?: any): Promise<void> {
    // ExcelJSを使用するか判定（ものづくり補助金の場合）
    if (subsidyType === 'monozukuri') {
      await this.generateExcelWithExcelJS(subsidyType, documents, formData, companyData, questionnaireData);
      return;
    }
    
    // 従来のXLSXライブラリを使用
    const workbook = XLSX.utils.book_new();
    
    let finalFormData: FormData;
    
    // 新しいデータ収集方式を使用（companyDataとquestionnaireDataが提供されている場合）
    if (companyData && questionnaireData) {
      finalFormData = this.collector.collectAllDocumentData(
        subsidyType,
        companyData,
        questionnaireData,
        documents
      );
    } else {
      // 旧形式のデータを新形式に変換（後方互換性のため）
      finalFormData = this.mapper.mapOldToNew(formData, subsidyType, documents);
    }
    
    // サマリーシート作成
    this.createSummarySheet(workbook, subsidyType, documents, finalFormData);
    
    // 各書類のシート作成
    documents.forEach(docId => {
      this.createDocumentSheet(workbook, subsidyType, docId, finalFormData[docId] || {});
    });
    
    // ファイル保存
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const blob = new Blob([this.s2ab(wbout)], { type: 'application/octet-stream' });
    const subsidyInfo = this.specs[subsidyType];
    const subsidyName = subsidyInfo ? subsidyInfo.subsidy_name : subsidyType;
    saveAs(blob, `${subsidyName}_申請書類_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * ExcelJSを使った高度な書類生成
   */
  private async generateExcelWithExcelJS(
    subsidyType: string,
    documents: string[],
    formData: FormData,
    companyData?: any,
    questionnaireData?: any
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // プロパティ設定
    workbook.creator = 'IT補助金アシストツール';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // サマリーシート作成
    await this.createSummarySheetExcelJS(workbook, subsidyType, documents, companyData, questionnaireData);
    
    // 各書類のシート作成
    for (const docId of documents) {
      if (subsidyType === 'monozukuri') {
        switch (docId) {
          case 'hojo_taisho_keihi_seiyaku':
            await this.createMonozukuriSeiyakushoExcelJS(workbook, companyData, questionnaireData);
            break;
          case 'chingin_hikiage_seiyaku':
            await this.createMonozukuriChinginSeiyakuExcelJS(workbook, companyData, questionnaireData);
            break;
          case 'rodosha_meibo':
            await this.createMonozukuriRodoshaMeiboExcelJS(workbook, companyData, questionnaireData);
            break;
          case 'ofuku_chingin_keikaku':
            await this.createMonozukuriOfukuChinginExcelJS(workbook, companyData, questionnaireData);
            break;
          default:
            await this.createGenericDocumentSheetExcelJS(workbook, subsidyType, docId, companyData, questionnaireData);
        }
      } else {
        // 他の書類は従来の方式で作成
        await this.createGenericDocumentSheetExcelJS(workbook, subsidyType, docId, companyData, questionnaireData);
      }
    }
    
    // ファイル保存
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const subsidyInfo = this.specs[subsidyType];
    const subsidyName = subsidyInfo ? subsidyInfo.subsidy_name : subsidyType;
    saveAs(blob, `${subsidyName}_申請書類_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * ExcelJSでサマリーシート作成
   */
  private async createSummarySheetExcelJS(
    workbook: ExcelJS.Workbook,
    subsidyType: string,
    documents: string[],
    companyData: any,
    questionnaireData: any
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('サマリー');
    const subsidyInfo = this.specs[subsidyType];
    
    // タイトル
    worksheet.getCell('A1').value = '補助金申請書類サマリー';
    worksheet.getCell('A1').font = { size: 18, bold: true };
    worksheet.mergeCells('A1:E1');
    
    // 基本情報
    const summaryData = [
      ['補助金名', subsidyInfo.subsidy_name],
      ['作成日時', new Date().toLocaleString('ja-JP')],
      ['書類数', documents.length],
      ['申請者名', companyData.companyName || ''],
      ['代表者名', companyData.representativeName || '']
    ];
    
    summaryData.forEach((row, index) => {
      worksheet.getCell(`A${index + 3}`).value = row[0];
      worksheet.getCell(`B${index + 3}`).value = row[1];
      worksheet.getCell(`A${index + 3}`).font = { bold: true };
    });
    
    // 書類一覧
    worksheet.getCell('A9').value = '書類一覧';
    worksheet.getCell('A9').font = { size: 14, bold: true };
    
    const headers = ['No.', '書類名', '入力状況', '必須項目数', '入力済み項目数'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(10, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 8 },   // No.
      { width: 30 },  // 書類名
      { width: 12 },  // 入力状況
      { width: 15 },  // 必須項目数
      { width: 15 }   // 入力済み項目数
    ];
  }

  /**
   * ものづくり補助金 補助対象経費誓約書をExcelJSで作成
   */
  private async createMonozukuriSeiyakushoExcelJS(
    workbook: ExcelJS.Workbook,
    companyData: any,
    questionnaireData: any
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('補助対象経費誓約書【様式1】');
    
    // 書類データを収集
    const docData = this.collector.collectAllDocumentData(
      'monozukuri',
      companyData,
      questionnaireData,
      ['hojo_taisho_keihi_seiyaku']
    )['hojo_taisho_keihi_seiyaku'] || {};
    
    // タイトル
    worksheet.getCell('A1').value = '補助対象経費誓約書';
    worksheet.getCell('A1').font = { size: 18, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:L1');
    
    worksheet.getCell('A2').value = '【様式1】';
    worksheet.getCell('A2').font = { size: 14 };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A2:L2');
    
    // 日付
    const today = new Date();
    worksheet.getCell('F4').value = '令和';
    worksheet.getCell('G4').value = today.getFullYear() - 2018;
    worksheet.getCell('H4').value = '年';
    worksheet.getCell('I4').value = today.getMonth() + 1;
    worksheet.getCell('J4').value = '月';
    worksheet.getCell('K4').value = today.getDate();
    worksheet.getCell('L4').value = '日';
    
    // 宛先
    worksheet.getCell('A6').value = '全国中小企業団体中央会会長　殿';
    worksheet.getCell('A6').font = { size: 12 };
    worksheet.mergeCells('A6:D6');
    
    // 申請者情報
    worksheet.getCell('C9').value = '事業者名：';
    worksheet.getCell('E9').value = docData.company_name || companyData.companyName || '';
    worksheet.getCell('E9').font = { size: 12 };
    worksheet.mergeCells('E9:H9');
    
    worksheet.getCell('C10').value = '代表者役職：';
    worksheet.getCell('E10').value = docData.representative_title || companyData.representativeTitle || '代表取締役';
    worksheet.mergeCells('E10:H10');
    
    worksheet.getCell('C11').value = '代表者氏名：';
    worksheet.getCell('E11').value = docData.representative_name || companyData.representativeName || '';
    worksheet.mergeCells('E11:H11');
    worksheet.getCell('I11').value = '印';
    worksheet.getCell('I11').border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // 本文
    const mainText = '　私は、ものづくり・商業・サービス生産性向上促進補助金の交付を申請するにあたり、' +
                    '補助対象経費について、下記の事項を誓約いたします。';
    worksheet.getCell('A14').value = mainText;
    worksheet.getCell('A14').alignment = { wrapText: true };
    worksheet.mergeCells('A14:L15');
    
    worksheet.getCell('C16').value = '記';
    worksheet.getCell('C16').font = { size: 14, bold: true };
    worksheet.getCell('C16').alignment = { horizontal: 'center' };
    
    // 誓約事項
    const pledgeItems = [
      '１．補助対象経費は、補助事業の遂行に必要な経費であり、他の用途に使用しません。',
      '２．補助対象経費の支払いは、原則として補助事業実施期間内に完了します。',
      '３．補助対象経費の経理処理にあたっては、帳簿及びすべての証拠書類を整備し、\n　　他の経理と明確に区分して処理します。',
      '４．補助事業に係る帳簿及び証拠書類は、補助事業の完了の日の属する年度の終了後\n　　５年間、いつでも閲覧に供することができるよう保管します。',
      '５．補助金の不正受給等の不正行為を行わず、不正行為を行った場合は、\n　　交付規程に従い交付決定の取消及び返還等の処分を受けることを了承します。'
    ];
    
    pledgeItems.forEach((item, index) => {
      const row = 18 + index * 2;
      worksheet.getCell(`A${row}`).value = item;
      worksheet.getCell(`A${row}`).alignment = { wrapText: true };
      worksheet.mergeCells(`A${row}:L${row + 1}`);
    });
    
    // 補助事業名
    worksheet.getCell('A30').value = '【補助事業名】';
    worksheet.getCell('A30').font = { bold: true };
    
    worksheet.getCell('A31').value = docData.project_name || companyData.projectName || '（補助事業名を記入）';
    worksheet.getCell('A31').alignment = { wrapText: true };
    worksheet.mergeCells('A31:L32');
    
    // 列幅設定
    worksheet.columns = [
      { width: 3 },   // A
      { width: 3 },   // B
      { width: 12 },  // C
      { width: 3 },   // D
      { width: 20 },  // E
      { width: 8 },   // F
      { width: 8 },   // G
      { width: 8 },   // H
      { width: 8 },   // I
      { width: 8 },   // J
      { width: 8 },   // K
      { width: 8 }    // L
    ];
    
    // 行高設定
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 20;
    worksheet.getRow(14).height = 40;
    
    // 印刷設定
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };
  }

  /**
   * ものづくり補助金 賃金引上げ計画の誓約書【様式2】をExcelJSで作成
   */
  private async createMonozukuriChinginSeiyakuExcelJS(
    workbook: ExcelJS.Workbook,
    companyData: any,
    questionnaireData: any
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('賃金引上げ計画の誓約書【様式2】');
    
    // 書類データを収集
    const docData = this.collector.collectAllDocumentData(
      'monozukuri',
      companyData,
      questionnaireData,
      ['chingin_hikiage_seiyaku']
    )['chingin_hikiage_seiyaku'] || {};
    
    // タイトル
    worksheet.getCell('A1').value = '賃金引上げ計画の誓約書';
    worksheet.getCell('A1').font = { size: 18, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:L1');
    
    worksheet.getCell('A2').value = '【様式2】';
    worksheet.getCell('A2').font = { size: 14 };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A2:L2');
    
    // 日付
    const today = new Date();
    worksheet.getCell('F4').value = '令和';
    worksheet.getCell('G4').value = today.getFullYear() - 2018;
    worksheet.getCell('H4').value = '年';
    worksheet.getCell('I4').value = today.getMonth() + 1;
    worksheet.getCell('J4').value = '月';
    worksheet.getCell('K4').value = today.getDate();
    worksheet.getCell('L4').value = '日';
    
    // 宛先
    worksheet.getCell('A6').value = '全国中小企業団体中央会会長　殿';
    worksheet.getCell('A6').font = { size: 12 };
    worksheet.mergeCells('A6:D6');
    
    // 申請者情報
    worksheet.getCell('C9').value = '事業者名：';
    worksheet.getCell('E9').value = docData.company_name || companyData.companyName || '';
    worksheet.getCell('E9').font = { size: 12 };
    worksheet.mergeCells('E9:H9');
    
    worksheet.getCell('C10').value = '代表者役職：';
    worksheet.getCell('E10').value = docData.representative_title || companyData.representativeTitle || '代表取締役';
    worksheet.mergeCells('E10:H10');
    
    worksheet.getCell('C11').value = '代表者氏名：';
    worksheet.getCell('E11').value = docData.representative_name || companyData.representativeName || '';
    worksheet.mergeCells('E11:H11');
    worksheet.getCell('I11').value = '印';
    worksheet.getCell('I11').border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // 本文
    const mainText = '　ものづくり・商業・サービス生産性向上促進補助金の交付申請にあたり、' +
                    '下記のとおり賃金引上げ計画を策定し、従業員に表明することを誓約いたします。';
    worksheet.getCell('A14').value = mainText;
    worksheet.getCell('A14').alignment = { wrapText: true };
    worksheet.mergeCells('A14:L15');
    
    worksheet.getCell('C16').value = '記';
    worksheet.getCell('C16').font = { size: 14, bold: true };
    worksheet.getCell('C16').alignment = { horizontal: 'center' };
    
    // 賃金引上げ計画
    worksheet.getCell('A18').value = '１．賃金引上げ計画';
    worksheet.getCell('A18').font = { bold: true };
    worksheet.mergeCells('A18:L18');
    
    // 現在の状況
    worksheet.getCell('B20').value = '（１）現在の事業場内最低賃金：';
    worksheet.getCell('G20').value = docData.current_minimum_wage || companyData.currentMinimumWage || '時給 1,000';
    worksheet.getCell('I20').value = '円';
    
    worksheet.getCell('B21').value = '（２）現在の従業員数：';
    worksheet.getCell('G21').value = docData.current_employee_count || companyData.employeeCount || '10';
    worksheet.getCell('I21').value = '名';
    
    // 引上げ計画
    worksheet.getCell('B23').value = '（３）賃金引上げ計画：';
    worksheet.mergeCells('B23:L23');
    
    const planText = '補助事業実施年度の翌年度末までに、事業場内最低賃金を地域別最低賃金＋' +
                    (docData.wage_increase_amount || '30') + '円以上の水準とする';
    worksheet.getCell('C24').value = planText;
    worksheet.getCell('C24').alignment = { wrapText: true };
    worksheet.mergeCells('C24:L25');
    
    worksheet.getCell('B27').value = '（４）引上げ後の事業場内最低賃金（予定）：';
    worksheet.getCell('G27').value = docData.planned_minimum_wage || '時給 1,030';
    worksheet.getCell('I27').value = '円';
    
    // 表明方法
    worksheet.getCell('A30').value = '２．従業員への表明について';
    worksheet.getCell('A30').font = { bold: true };
    worksheet.mergeCells('A30:L30');
    
    const announcementText = '上記の賃金引上げ計画について、補助金申請時点で従業員に対して表明済みです。';
    worksheet.getCell('B32').value = announcementText;
    worksheet.mergeCells('B32:L32');
    
    // 注意事項
    worksheet.getCell('A35').value = '【注意事項】';
    worksheet.getCell('A35').font = { bold: true };
    worksheet.mergeCells('A35:L35');
    
    const notes = [
      '・本計画が未達成の場合、補助金額の返還を求める場合があります。',
      '・事業場内最低賃金とは、事業場内で最も低い賃金を意味します。',
      '・地域別最低賃金は、都道府県ごとに定められた最低賃金を指します。'
    ];
    
    notes.forEach((note, index) => {
      const row = 37 + index;
      worksheet.getCell(`A${row}`).value = note;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.mergeCells(`A${row}:L${row}`);
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 3 },   // A
      { width: 3 },   // B
      { width: 20 },  // C
      { width: 3 },   // D
      { width: 8 },   // E
      { width: 8 },   // F
      { width: 15 },  // G
      { width: 5 },   // H
      { width: 8 },   // I
      { width: 8 },   // J
      { width: 8 },   // K
      { width: 8 }    // L
    ];
    
    // 行高設定
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 20;
    worksheet.getRow(14).height = 40;
    
    // 印刷設定
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };
  }

  /**
   * ものづくり補助金 労働者名簿をExcelJSで作成
   */
  private async createMonozukuriRodoshaMeiboExcelJS(
    workbook: ExcelJS.Workbook,
    companyData: any,
    questionnaireData: any
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('労働者名簿');
    
    // 書類データを収集
    const docData = this.collector.collectAllDocumentData(
      'monozukuri',
      companyData,
      questionnaireData,
      ['rodosha_meibo']
    )['rodosha_meibo'] || {};
    
    // タイトル
    worksheet.getCell('A1').value = '労働者名簿';
    worksheet.getCell('A1').font = { size: 18, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:J1');
    
    // 事業者情報
    worksheet.getCell('A3').value = '事業者名：';
    worksheet.getCell('C3').value = docData.company_name || companyData.companyName || '';
    worksheet.getCell('C3').font = { size: 12 };
    worksheet.mergeCells('C3:E3');
    
    worksheet.getCell('F3').value = '作成日：';
    worksheet.getCell('H3').value = new Date().toLocaleDateString('ja-JP');
    worksheet.mergeCells('H3:J3');
    
    // ヘッダー行
    const headers = [
      'No.',
      '氏名',
      'フリガナ',
      '生年月日',
      '性別',
      '住所',
      '雇用形態',
      '入社年月日',
      '職種',
      '時給/月給'
    ];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(5, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // サンプルデータ（実際のデータがある場合は置き換え）
    const employees = docData.employees || [
      {
        name: '山田 太郎',
        furigana: 'ヤマダ タロウ',
        birthDate: '1985/04/15',
        gender: '男',
        address: '東京都渋谷区...',
        employmentType: '正社員',
        hireDate: '2020/04/01',
        jobType: '営業',
        wage: '月給 300,000円'
      },
      // 必要に応じて追加
    ];
    
    // データ行
    employees.forEach((emp: any, index: number) => {
      const row = 6 + index;
      const data = [
        index + 1,
        emp.name || '',
        emp.furigana || '',
        emp.birthDate || '',
        emp.gender || '',
        emp.address || '',
        emp.employmentType || '',
        emp.hireDate || '',
        emp.jobType || '',
        emp.wage || ''
      ];
      
      data.forEach((value, colIndex) => {
        const cell = worksheet.getCell(row, colIndex + 1);
        cell.value = value;
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        if (colIndex === 0) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 6 },   // No.
      { width: 15 },  // 氏名
      { width: 15 },  // フリガナ
      { width: 12 },  // 生年月日
      { width: 8 },   // 性別
      { width: 30 },  // 住所
      { width: 12 },  // 雇用形態
      { width: 12 },  // 入社年月日
      { width: 15 },  // 職種
      { width: 15 }   // 時給/月給
    ];
    
    // 印刷設定
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };
  }

  /**
   * ものづくり補助金 大幅賃上げ計画書【様式4】をExcelJSで作成
   */
  private async createMonozukuriOfukuChinginExcelJS(
    workbook: ExcelJS.Workbook,
    companyData: any,
    questionnaireData: any
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('大幅賃上げ計画書【様式4】');
    
    // 書類データを収集
    const docData = this.collector.collectAllDocumentData(
      'monozukuri',
      companyData,
      questionnaireData,
      ['ofuku_chingin_keikaku']
    )['ofuku_chingin_keikaku'] || {};
    
    // タイトル
    worksheet.getCell('A1').value = '大幅賃上げ計画書';
    worksheet.getCell('A1').font = { size: 18, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:L1');
    
    worksheet.getCell('A2').value = '【様式4】';
    worksheet.getCell('A2').font = { size: 14 };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A2:L2');
    
    // 日付と宛先（様式2と同様）
    const today = new Date();
    worksheet.getCell('F4').value = '令和';
    worksheet.getCell('G4').value = today.getFullYear() - 2018;
    worksheet.getCell('H4').value = '年';
    worksheet.getCell('I4').value = today.getMonth() + 1;
    worksheet.getCell('J4').value = '月';
    worksheet.getCell('K4').value = today.getDate();
    worksheet.getCell('L4').value = '日';
    
    worksheet.getCell('A6').value = '全国中小企業団体中央会会長　殿';
    worksheet.getCell('A6').font = { size: 12 };
    worksheet.mergeCells('A6:D6');
    
    // 申請者情報
    worksheet.getCell('C9').value = '事業者名：';
    worksheet.getCell('E9').value = docData.company_name || companyData.companyName || '';
    worksheet.mergeCells('E9:H9');
    
    worksheet.getCell('C10').value = '代表者役職：';
    worksheet.getCell('E10').value = docData.representative_title || companyData.representativeTitle || '代表取締役';
    worksheet.mergeCells('E10:H10');
    
    worksheet.getCell('C11').value = '代表者氏名：';
    worksheet.getCell('E11').value = docData.representative_name || companyData.representativeName || '';
    worksheet.mergeCells('E11:H11');
    worksheet.getCell('I11').value = '印';
    worksheet.getCell('I11').border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // 本文
    const mainText = '　ものづくり・商業・サービス生産性向上促進補助金の交付申請にあたり、' +
                    '補助率引上げの要件として、下記のとおり大幅な賃上げを実施することを計画し、従業員に表明することを誓約いたします。';
    worksheet.getCell('A14').value = mainText;
    worksheet.getCell('A14').alignment = { wrapText: true };
    worksheet.mergeCells('A14:L15');
    
    worksheet.getCell('C16').value = '記';
    worksheet.getCell('C16').font = { size: 14, bold: true };
    worksheet.getCell('C16').alignment = { horizontal: 'center' };
    
    // 大幅賃上げ計画の内容
    worksheet.getCell('A18').value = '１．大幅賃上げ計画の内容';
    worksheet.getCell('A18').font = { bold: true };
    worksheet.mergeCells('A18:L18');
    
    // 現在の給与総額
    worksheet.getCell('B20').value = '（１）現在の給与総額（年額）：';
    worksheet.getCell('G20').value = docData.current_total_salary || companyData.currentTotalSalary || '50,000,000';
    worksheet.getCell('J20').value = '円';
    
    // 引上げ率
    worksheet.getCell('B22').value = '（２）計画する給与総額の引上げ率：';
    worksheet.getCell('G22').value = docData.salary_increase_rate || '6.0';
    worksheet.getCell('I22').value = '％以上';
    
    // 引上げ後の給与総額
    worksheet.getCell('B24').value = '（３）引上げ後の給与総額（年額・予定）：';
    worksheet.getCell('G24').value = docData.planned_total_salary || '53,000,000';
    worksheet.getCell('J24').value = '円';
    
    // 実施時期
    worksheet.getCell('B26').value = '（４）実施予定時期：';
    const implementationDate = '補助事業実施年度の翌年度末まで';
    worksheet.getCell('G26').value = docData.implementation_date || implementationDate;
    worksheet.mergeCells('G26:L26');
    
    // 対象者
    worksheet.getCell('A29').value = '２．賃上げの対象者';
    worksheet.getCell('A29').font = { bold: true };
    worksheet.mergeCells('A29:L29');
    
    const targetText = '全従業員（役員を除く正社員、契約社員、パート・アルバイトを含む）';
    worksheet.getCell('B31').value = targetText;
    worksheet.mergeCells('B31:L31');
    
    // 実施方法
    worksheet.getCell('A34').value = '３．実施方法';
    worksheet.getCell('A34').font = { bold: true };
    worksheet.mergeCells('A34:L34');
    
    const methodItems = [
      '・基本給の引上げ',
      '・賞与の増額',
      '・各種手当の新設・増額',
      '・その他（具体的に：　　　　　　　　　　　　　　　　）'
    ];
    
    methodItems.forEach((item, index) => {
      const row = 36 + index;
      worksheet.getCell(`B${row}`).value = item;
      worksheet.mergeCells(`B${row}:L${row}`);
    });
    
    // 注意事項
    worksheet.getCell('A42').value = '【注意事項】';
    worksheet.getCell('A42').font = { bold: true };
    worksheet.mergeCells('A42:L42');
    
    const cautionItems = [
      '・本計画に基づく賃上げが実施されない場合、補助金の返還を求めることがあります。',
      '・給与総額には、役員報酬は含みません。',
      '・実績報告時に賃金台帳等による確認を行います。'
    ];
    
    cautionItems.forEach((item, index) => {
      const row = 44 + index;
      worksheet.getCell(`A${row}`).value = item;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.mergeCells(`A${row}:L${row}`);
    });
    
    // 列幅設定（様式2と同様）
    worksheet.columns = [
      { width: 3 },   // A
      { width: 3 },   // B
      { width: 25 },  // C
      { width: 3 },   // D
      { width: 8 },   // E
      { width: 8 },   // F
      { width: 15 },  // G
      { width: 5 },   // H
      { width: 8 },   // I
      { width: 8 },   // J
      { width: 8 },   // K
      { width: 8 }    // L
    ];
    
    // 行高設定
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 20;
    worksheet.getRow(14).height = 40;
    
    // 印刷設定
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };
  }

  /**
   * 汎用的な書類シートをExcelJSで作成
   */
  private async createGenericDocumentSheetExcelJS(
    workbook: ExcelJS.Workbook,
    subsidyType: string,
    docId: string,
    companyData: any,
    questionnaireData: any
  ): Promise<void> {
    const subsidyInfo = this.specs[subsidyType];
    const docSpec = subsidyInfo?.documents?.[docId];
    if (!docSpec) return;
    
    const worksheet = workbook.addWorksheet(docSpec.document_name);
    
    // 書類データを収集
    const docData = this.collector.collectAllDocumentData(
      subsidyType,
      companyData,
      questionnaireData,
      [docId]
    )[docId] || {};
    
    // タイトル
    worksheet.getCell('A1').value = docSpec.document_name;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.mergeCells('A1:D1');
    
    // 説明
    worksheet.getCell('A3').value = docSpec.description;
    worksheet.getCell('A3').alignment = { wrapText: true };
    worksheet.mergeCells('A3:D3');
    
    // ヘッダー
    const headers = ['項目名', '入力値', '必須', '説明'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(5, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // フィールドデータ
    let row = 6;
    docSpec.fields.forEach((field: DocumentField) => {
      worksheet.getCell(`A${row}`).value = field.field_name;
      worksheet.getCell(`B${row}`).value = this.formatValue(docData[field.field_id], field.type);
      worksheet.getCell(`C${row}`).value = field.required ? '必須' : '';
      worksheet.getCell(`D${row}`).value = field.description || '';
      
      // 罫線
      for (let col = 1; col <= 4; col++) {
        worksheet.getCell(row, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      
      row++;
    });
    
    // 列幅設定
    worksheet.columns = [
      { width: 25 },  // 項目名
      { width: 35 },  // 入力値
      { width: 8 },   // 必須
      { width: 40 }   // 説明
    ];
  }

  private createSummarySheet(workbook: XLSX.WorkBook, subsidyType: string, documents: string[], formData: FormData): void {
    const subsidyInfo = this.specs[subsidyType];
    if (!subsidyInfo) return;
    
    const summaryData: any[][] = [
      ['補助金申請書類サマリー'],
      [''],
      ['補助金名', subsidyInfo.subsidy_name],
      ['作成日時', new Date().toLocaleString('ja-JP')],
      ['書類数', documents.length],
      [''],
      ['書類一覧'],
      ['No.', '書類名', '記入状況', '必須項目数', '記入済み項目数']
    ];
    
    documents.forEach((docId, index) => {
      const docSpec = subsidyInfo.documents[docId];
      if (docSpec) {
        const docData = formData[docId] || {};
        const requiredFields = docSpec.fields.filter((f: DocumentField) => f.required).length;
        const filledFields = Object.keys(docData).filter(key => {
          const field = docSpec.fields.find((f: DocumentField) => f.field_id === key);
          return field && docData[key] !== undefined && docData[key] !== '' && docData[key] !== null;
        }).length;
        
        summaryData.push([
          index + 1,
          docSpec.document_name,
          filledFields >= requiredFields ? '完了' : '未完了',
          requiredFields,
          filledFields
        ]);
      }
    });
    
    summaryData.push(['']);
    summaryData.push(['記入時の注意事項']);
    summaryData.push(['・すべての必須項目を記入してください']);
    summaryData.push(['・日付は YYYY-MM-DD 形式で記入してください']);
    summaryData.push(['・金額は半角数字で記入してください']);
    summaryData.push(['・チェックボックスは「はい」または空欄で表現されています']);
    
    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // スタイル設定（列幅）
    worksheet['!cols'] = [
      { wch: 5 },   // No.
      { wch: 30 },  // 書類名
      { wch: 10 },  // 記入状況
      { wch: 12 },  // 必須項目数
      { wch: 15 }   // 記入済み項目数
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'サマリー');
  }

  private createDocumentSheet(workbook: XLSX.WorkBook, subsidyType: string, docId: string, docData: FormData): void {
    const subsidyInfo = this.specs[subsidyType];
    if (!subsidyInfo || !subsidyInfo.documents[docId]) return;
    
    const docSpec: DocumentSpec = subsidyInfo.documents[docId];
    const sheetData: any[][] = [
      [docSpec.document_name],
      [''],
      ['説明:', docSpec.description],
      [''],
      ['項目名', '入力値', '必須', '説明']
    ];
    
    // フィールドごとにデータを追加
    docSpec.fields.forEach((field: DocumentField) => {
      this.addFieldToSheet(sheetData, field, docData, '');
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // スタイル設定（列幅）
    worksheet['!cols'] = [
      { wch: 30 },  // 項目名
      { wch: 40 },  // 入力値
      { wch: 8 },   // 必須
      { wch: 50 }   // 説明
    ];
    
    // シート名を適切な長さに調整（Excelの制限: 31文字以内）
    const sheetName = docSpec.document_name.length > 31 
      ? docSpec.document_name.substring(0, 28) + '...' 
      : docSpec.document_name;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  private addFieldToSheet(sheetData: any[][], field: DocumentField, docData: FormData, prefix: string): void {
    const fieldKey = prefix ? `${prefix}.${field.field_id}` : field.field_id;
    
    if (field.type === 'array' && field.item_fields) {
      // 配列型フィールドの処理
      sheetData.push(['']);
      sheetData.push([`【${field.field_name}】`]);
      
      const arrayData = docData[field.field_id] || [];
      if (Array.isArray(arrayData) && arrayData.length > 0) {
        arrayData.forEach((item: any, index: number) => {
          sheetData.push([`  ${index + 1}件目:`]);
          field.item_fields!.forEach((itemField: DocumentField) => {
            const value = item[itemField.field_id] || '';
            sheetData.push([
              `    ${itemField.field_name}`,
              this.formatValue(value, itemField.type),
              itemField.required ? '必須' : '',
              itemField.description || ''
            ]);
          });
        });
      } else {
        sheetData.push(['  （データなし）']);
      }
    } else if (field.type === 'object' && field.fields) {
      // オブジェクト型フィールドの処理
      sheetData.push(['']);
      sheetData.push([`【${field.field_name}】`]);
      field.fields.forEach((subField: DocumentField) => {
        this.addFieldToSheet(sheetData, subField, docData[field.field_id] || {}, field.field_id);
      });
    } else {
      // 通常のフィールド
      const value = docData[field.field_id] || '';
      sheetData.push([
        field.field_name,
        this.formatValue(value, field.type),
        field.required ? '必須' : '',
        field.description || ''
      ]);
    }
  }

  private formatValue(value: any, type: string): string {
    if (!value) return '';
    
    switch (type) {
      case 'date':
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        return String(value);
      case 'checkbox':
        return value ? 'はい' : '';
      case 'number':
        return String(value);
      case 'select':
      case 'radio':
        return String(value);
      case 'textarea':
      case 'text':
      case 'tel':
      case 'email':
      default:
        return String(value);
    }
  }

  private s2ab(s: string): ArrayBuffer {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }

  // フィールド仕様を取得するヘルパーメソッド
  getDocumentSpec(subsidyType: string, docId: string): DocumentSpec | null {
    const subsidyInfo = this.specs[subsidyType];
    if (!subsidyInfo || !subsidyInfo.documents[docId]) return null;
    return subsidyInfo.documents[docId];
  }

  // 補助金タイプの一覧を取得
  getSubsidyTypes(): string[] {
    return Object.keys(this.specs);
  }

  // 書類IDの一覧を取得
  getDocumentIds(subsidyType: string): string[] {
    const subsidyInfo = this.specs[subsidyType];
    if (!subsidyInfo) return [];
    return Object.keys(subsidyInfo.documents);
  }
}