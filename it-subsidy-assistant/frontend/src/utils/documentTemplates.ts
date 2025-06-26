import * as XLSX from 'xlsx';
import { DocumentDataCollector } from './documentDataCollector';

interface CellStyle {
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    color?: { argb: string };
  };
  fill?: {
    type: 'pattern';
    pattern: 'solid';
    fgColor: { argb: string };
  };
  border?: {
    top?: { style: string; color?: { argb: string } };
    left?: { style: string; color?: { argb: string } };
    bottom?: { style: string; color?: { argb: string } };
    right?: { style: string; color?: { argb: string } };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };
}

export class DocumentTemplates {
  private collector: DocumentDataCollector;

  constructor() {
    this.collector = new DocumentDataCollector();
  }

  /**
   * ものづくり補助金 - 補助対象経費誓約書【様式1】のテンプレート
   */
  createMonozukuriSeiyakusho(
    worksheet: XLSX.WorkSheet,
    companyData: any,
    questionnaireData: any
  ): void {
    // 書類データを収集
    const docData = this.collector.collectAllDocumentData(
      'monozukuri',
      companyData,
      questionnaireData,
      ['hojo_taisho_keihi_seiyaku']
    )['hojo_taisho_keihi_seiyaku'] || {};

    // タイトル
    worksheet['A1'] = { v: '補助対象経費誓約書', t: 's' };
    worksheet['A2'] = { v: '【様式1】', t: 's' };
    
    // 日付
    worksheet['F4'] = { v: '令和', t: 's' };
    worksheet['G4'] = { v: new Date().getFullYear() - 2018, t: 'n' }; // 令和年
    worksheet['H4'] = { v: '年', t: 's' };
    worksheet['I4'] = { v: new Date().getMonth() + 1, t: 'n' };
    worksheet['J4'] = { v: '月', t: 's' };
    worksheet['K4'] = { v: new Date().getDate(), t: 'n' };
    worksheet['L4'] = { v: '日', t: 's' };

    // 宛先
    worksheet['A6'] = { v: '全国中小企業団体中央会会長　殿', t: 's' };

    // 申請者情報
    worksheet['C9'] = { v: '事業者名：', t: 's' };
    worksheet['E9'] = { v: docData.company_name || companyData.companyName || '', t: 's' };
    
    worksheet['C10'] = { v: '代表者役職：', t: 's' };
    worksheet['E10'] = { v: docData.representative_title || companyData.representativeTitle || '代表取締役', t: 's' };
    
    worksheet['C11'] = { v: '代表者氏名：', t: 's' };
    worksheet['E11'] = { v: docData.representative_name || companyData.representativeName || '', t: 's' };
    worksheet['I11'] = { v: '印', t: 's' };

    // 本文
    worksheet['A14'] = { 
      v: '　私は、ものづくり・商業・サービス生産性向上促進補助金の交付を申請するにあたり、' +
         '補助対象経費について、下記の事項を誓約いたします。',
      t: 's'
    };

    worksheet['C16'] = { v: '記', t: 's' };

    // 誓約事項
    const pledgeItems = [
      '１．補助対象経費は、補助事業の遂行に必要な経費であり、他の用途に使用しません。',
      '２．補助対象経費の支払いは、原則として補助事業実施期間内に完了します。',
      '３．補助対象経費の経理処理にあたっては、帳簿及びすべての証拠書類を整備し、' +
      '　　他の経理と明確に区分して処理します。',
      '４．補助事業に係る帳簿及び証拠書類は、補助事業の完了の日の属する年度の終了後' +
      '　　５年間、いつでも閲覧に供することができるよう保管します。',
      '５．補助金の不正受給等の不正行為を行わず、不正行為を行った場合は、' +
      '　　交付規程に従い交付決定の取消及び返還等の処分を受けることを了承します。'
    ];

    pledgeItems.forEach((item, index) => {
      worksheet[`A${18 + index * 2}`] = { v: item, t: 's' };
    });

    // 補助事業名
    worksheet['A30'] = { v: '【補助事業名】', t: 's' };
    worksheet['A31'] = { 
      v: docData.project_name || companyData.projectName || '（補助事業名を記入）', 
      t: 's' 
    };

    // セルの結合
    this.mergeCells(worksheet, [
      'A1:L1',  // タイトル
      'A2:L2',  // 様式番号
      'A6:D6',  // 宛先
      'E9:H9',  // 事業者名
      'E10:H10', // 代表者役職
      'E11:H11', // 代表者氏名
      'A14:L15', // 本文
      'A31:L32'  // 補助事業名
    ]);

    // スタイル設定
    this.applyStyles(worksheet, {
      'A1': {
        font: { size: 18, bold: true },
        alignment: { horizontal: 'center' }
      },
      'A2': {
        font: { size: 14 },
        alignment: { horizontal: 'center' }
      },
      'C16': {
        font: { size: 14, bold: true },
        alignment: { horizontal: 'center' }
      },
      'A30': {
        font: { bold: true }
      }
    });

    // 列幅設定
    worksheet['!cols'] = [
      { wch: 3 },   // A
      { wch: 3 },   // B
      { wch: 12 },  // C
      { wch: 3 },   // D
      { wch: 20 },  // E
      { wch: 8 },   // F
      { wch: 8 },   // G
      { wch: 8 },   // H
      { wch: 8 },   // I
      { wch: 8 },   // J
      { wch: 8 },   // K
      { wch: 8 }    // L
    ];

    // 行高設定
    worksheet['!rows'] = [
      { hpt: 30 }, // 1
      { hpt: 20 }, // 2
      { hpt: 15 }, // 3
      { hpt: 20 }, // 4
    ];
  }

  /**
   * セルの結合
   */
  private mergeCells(worksheet: XLSX.WorkSheet, ranges: string[]): void {
    if (!worksheet['!merges']) {
      worksheet['!merges'] = [];
    }
    
    ranges.forEach(range => {
      const decoded = XLSX.utils.decode_range(range);
      worksheet['!merges']!.push(decoded);
    });
  }

  /**
   * スタイルの適用（ExcelJSとの互換性のため、基本的なスタイル情報を保存）
   */
  private applyStyles(worksheet: XLSX.WorkSheet, styles: { [cell: string]: CellStyle }): void {
    Object.entries(styles).forEach(([cell, style]) => {
      if (!worksheet[cell]) return;
      
      // スタイル情報をセルに保存（ExcelJSで後から適用するため）
      worksheet[cell].s = style;
    });
  }

  /**
   * 汎用的な書類生成
   */
  generateDocument(
    subsidyType: string,
    documentId: string,
    companyData: any,
    questionnaireData: any
  ): XLSX.WorkSheet {
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    
    // 書類タイプに応じて適切なテンプレートを選択
    if (subsidyType === 'monozukuri' && documentId === 'hojo_taisho_keihi_seiyaku') {
      this.createMonozukuriSeiyakusho(worksheet, companyData, questionnaireData);
    }
    // 他の書類テンプレートもここに追加
    
    return worksheet;
  }
}