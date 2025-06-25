import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

interface ExportData {
  companyData: any;
  questionnaireData: any;
  subsidyType: string;
  subsidyName: string;
  matchingResults?: any[];
  applicationData?: any;
  metadata?: {
    exportedBy?: string;
    exportedAt?: Date;
    version?: string;
  };
}

interface CSVExportOptions {
  includeHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
  dateFormat?: 'ISO' | 'Japanese';
  includeMetadata?: boolean;
}

interface ExcelExportOptions {
  multiSheet?: boolean;
  includeSummary?: boolean;
  formatting?: boolean;
  password?: string;
  template?: string;
}

interface PDFExportOptions {
  includeCharts?: boolean;
  template?: 'simple' | 'detailed' | 'official';
  pageSize?: 'A4' | 'A3' | 'Letter';
  watermark?: string;
}

// 高度なCSV出力
export class EnhancedCSVExporter {
  private static formatValue(value: any, options: CSVExportOptions): string {
    if (value === null || value === undefined) return '';
    
    if (value instanceof Date) {
      return options.dateFormat === 'ISO' 
        ? value.toISOString()
        : value.toLocaleDateString('ja-JP');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    const str = String(value);
    // CSVエスケープ処理
    if (str.includes(options.delimiter || ',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  static exportToCSV(data: ExportData, options: CSVExportOptions = {}): void {
    const opts = {
      includeHeaders: true,
      delimiter: ',',
      encoding: 'utf-8',
      dateFormat: 'Japanese' as const,
      includeMetadata: true,
      ...options
    };

    const rows: string[] = [];
    
    // メタデータ
    if (opts.includeMetadata) {
      rows.push(`# ${data.subsidyName} 申請データ`);
      rows.push(`# 出力日時: ${new Date().toLocaleString('ja-JP')}`);
      if (data.metadata?.exportedBy) {
        rows.push(`# 出力者: ${data.metadata.exportedBy}`);
      }
      rows.push(''); // 空行
    }

    // 基本情報
    if (opts.includeHeaders) {
      rows.push(['項目', '値'].join(opts.delimiter));
    }

    // 会社データ
    Object.entries(data.companyData || {}).forEach(([key, value]) => {
      const label = this.getFieldLabel(key);
      const formattedValue = this.formatValue(value, opts);
      rows.push([label, formattedValue].join(opts.delimiter));
    });

    // 診断結果
    rows.push(''); // 空行
    if (opts.includeHeaders) {
      rows.push('初期診断結果');
    }
    
    Object.entries(data.questionnaireData || {}).forEach(([key, value]) => {
      const label = this.getFieldLabel(key);
      const formattedValue = this.formatValue(value, opts);
      rows.push([label, formattedValue].join(opts.delimiter));
    });

    // マッチング結果
    if (data.matchingResults && data.matchingResults.length > 0) {
      rows.push(''); // 空行
      if (opts.includeHeaders) {
        rows.push(['補助金名', 'マッチ度', '最大補助額', '補助率', '理由'].join(opts.delimiter));
      }
      
      data.matchingResults.forEach(result => {
        rows.push([
          result.subsidy?.name || '',
          `${result.match_score}%`,
          result.subsidy?.subsidy_amount_max?.toLocaleString() || '',
          `${(result.subsidy?.subsidy_rate * 100).toFixed(0)}%`,
          result.reasons?.join('; ') || ''
        ].join(opts.delimiter));
      });
    }

    const csvContent = rows.join('\n');
    
    // BOM付きUTF-8でエンコード
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const fileName = `${data.subsidyName}_データ_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  }

  private static getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      companyName: '会社名',
      representativeName: '代表者氏名',
      contactEmail: 'メールアドレス',
      contactPhone: '電話番号',
      employeeCount: '従業員数',
      annualRevenue: '年間売上高',
      businessType: '事業形態',
      currentChallenges: '現在の課題',
      digitalizationLevel: 'デジタル化レベル',
      budgetRange: '想定予算'
    };
    return labels[key] || key;
  }
}

// 高度なExcel出力
export class EnhancedExcelExporter {
  static exportToExcel(data: ExportData, options: ExcelExportOptions = {}): void {
    const opts = {
      multiSheet: true,
      includeSummary: true,
      formatting: true,
      ...options
    };

    const wb = XLSX.utils.book_new();

    // サマリーシート
    if (opts.includeSummary) {
      const summaryData = this.createSummarySheet(data);
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      this.applyFormatting(summaryWs, 'summary');
      XLSX.utils.book_append_sheet(wb, summaryWs, 'サマリー');
    }

    // 基本情報シート
    const basicData = this.createBasicInfoSheet(data);
    const basicWs = XLSX.utils.aoa_to_sheet(basicData);
    this.applyFormatting(basicWs, 'basic');
    XLSX.utils.book_append_sheet(wb, basicWs, '基本情報');

    // 診断結果シート
    if (data.questionnaireData) {
      const diagnosisData = this.createDiagnosisSheet(data);
      const diagnosisWs = XLSX.utils.aoa_to_sheet(diagnosisData);
      this.applyFormatting(diagnosisWs, 'diagnosis');
      XLSX.utils.book_append_sheet(wb, diagnosisWs, '診断結果');
    }

    // マッチング結果シート
    if (data.matchingResults && data.matchingResults.length > 0) {
      const matchingData = this.createMatchingSheet(data);
      const matchingWs = XLSX.utils.aoa_to_sheet(matchingData);
      this.applyFormatting(matchingWs, 'matching');
      XLSX.utils.book_append_sheet(wb, matchingWs, 'マッチング結果');
    }

    // 申請データシート
    if (data.applicationData) {
      const applicationData = this.createApplicationSheet(data);
      const applicationWs = XLSX.utils.aoa_to_sheet(applicationData);
      this.applyFormatting(applicationWs, 'application');
      XLSX.utils.book_append_sheet(wb, applicationWs, '申請データ');
    }

    const fileName = `${data.subsidyName}_完全データ_${new Date().toISOString().split('T')[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  private static createSummarySheet(data: ExportData): any[][] {
    return [
      ['IT補助金アシストツール - 申請データサマリー'],
      [''],
      ['補助金名', data.subsidyName],
      ['補助金タイプ', data.subsidyType],
      ['会社名', data.companyData?.companyName || ''],
      ['代表者', data.companyData?.representativeName || ''],
      ['従業員数', data.companyData?.employeeCount || ''],
      ['年間売上高', data.companyData?.annualRevenue ? `${data.companyData.annualRevenue}万円` : ''],
      [''],
      ['データ作成日時', new Date().toLocaleString('ja-JP')],
      [''],
      ['含まれるデータ'],
      ['✓ 基本情報'],
      ['✓ 診断結果'],
      data.matchingResults?.length ? ['✓ マッチング結果'] : ['- マッチング結果'],
      data.applicationData ? ['✓ 申請データ'] : ['- 申請データ']
    ];
  }

  private static createBasicInfoSheet(data: ExportData): any[][] {
    const rows = [
      ['基本情報'],
      [''],
      ['項目', '内容']
    ];

    Object.entries(data.companyData || {}).forEach(([key, value]) => {
      if (value) {
        const label = this.getFieldLabel(key);
        const formattedValue = this.formatValue(key, value);
        rows.push([label, formattedValue]);
      }
    });

    return rows;
  }

  private static createDiagnosisSheet(data: ExportData): any[][] {
    const rows = [
      ['診断結果'],
      [''],
      ['診断項目', '回答', '評価']
    ];

    const evaluations = this.calculateEvaluations(data);

    Object.entries(data.questionnaireData || {}).forEach(([key, value]) => {
      if (value) {
        const label = this.getFieldLabel(key);
        const formattedValue = this.formatQuestionnaireValue(key, value);
        const evaluation = evaluations[key] || '';
        rows.push([label, formattedValue, evaluation]);
      }
    });

    return rows;
  }

  private static createMatchingSheet(data: ExportData): any[][] {
    const rows = [
      ['マッチング結果'],
      [''],
      ['補助金名', 'マッチ度', '最大補助額', '補助率', '申請締切', '適合理由']
    ];

    data.matchingResults?.forEach(result => {
      rows.push([
        result.subsidy?.name || '',
        `${result.match_score}%`,
        result.subsidy?.subsidy_amount_max?.toLocaleString() + '円' || '',
        `${(result.subsidy?.subsidy_rate * 100).toFixed(0)}%`,
        result.subsidy?.application_end ? new Date(result.subsidy.application_end).toLocaleDateString('ja-JP') : '',
        result.reasons?.join('\n') || ''
      ]);
    });

    return rows;
  }

  private static createApplicationSheet(data: ExportData): any[][] {
    const rows = [
      ['申請データ'],
      [''],
      ['項目', '内容']
    ];

    Object.entries(data.applicationData || {}).forEach(([key, value]) => {
      if (value) {
        const label = this.getFieldLabel(key);
        const formattedValue = this.formatValue(key, value);
        rows.push([label, formattedValue]);
      }
    });

    return rows;
  }

  private static applyFormatting(ws: XLSX.WorkSheet, sheetType: string): void {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // 列幅設定
    const colWidths = sheetType === 'matching' 
      ? [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 40 }]
      : [{ wch: 30 }, { wch: 50 }, { wch: 20 }];
    
    ws['!cols'] = colWidths;

    // セルスタイル設定
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // ヘッダー行
        if (R === 0 || (R === 2 && ws[cellAddress].v)) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2563EB" } },
            alignment: { horizontal: "center" }
          };
        }
        // データ行の交互背景色
        else if (R > 2 && R % 2 === 0) {
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: "F8FAFC" } }
          };
        }
      }
    }
  }

  private static getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      companyName: '会社名',
      representativeName: '代表者氏名',
      contactEmail: 'メールアドレス',
      contactPhone: '電話番号',
      employeeCount: '従業員数',
      annualRevenue: '年間売上高',
      businessType: '事業形態',
      currentChallenges: '現在の課題',
      digitalizationLevel: 'デジタル化レベル',
      budgetRange: '想定予算',
      corporateNumber: '法人番号',
      establishmentDate: '設立年月日',
      capital: '資本金',
      businessDescription: '事業内容'
    };
    return labels[key] || key;
  }

  private static formatValue(key: string, value: any): string {
    if (value === null || value === undefined) return '';

    if (key.includes('revenue') || key.includes('capital') || key.includes('cost')) {
      return `${Number(value).toLocaleString()}万円`;
    }

    if (key.includes('count')) {
      return `${value}名`;
    }

    if (key.includes('date')) {
      try {
        return new Date(value).toLocaleDateString('ja-JP');
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  private static formatQuestionnaireValue(key: string, value: any): string {
    const mappings: { [key: string]: { [value: string]: string } } = {
      businessType: {
        'manufacturing': '製造業',
        'retail': '小売業',
        'service': 'サービス業',
        'it': 'IT関連',
        'other': 'その他'
      },
      currentChallenges: {
        'efficiency': '業務効率化',
        'sales': '売上拡大',
        'cost': 'コスト削減',
        'innovation': '新商品・サービス開発',
        'hr': '人材育成・確保'
      },
      digitalizationLevel: {
        'none': 'ほとんど導入していない',
        'basic': '基本的なツールのみ',
        'partial': '一部業務で活用',
        'advanced': '積極的に活用中'
      }
    };

    return mappings[key]?.[value] || String(value);
  }

  private static calculateEvaluations(data: ExportData): { [key: string]: string } {
    const evaluations: { [key: string]: string } = {};
    
    // 簡単な評価ロジック
    if (data.questionnaireData?.digitalizationLevel === 'none') {
      evaluations.digitalizationLevel = 'IT導入補助金が最適';
    } else if (data.questionnaireData?.digitalizationLevel === 'advanced') {
      evaluations.digitalizationLevel = '高度な補助金を検討';
    }

    if (data.questionnaireData?.currentChallenges === 'innovation') {
      evaluations.currentChallenges = 'ものづくり補助金を推奨';
    } else if (data.questionnaireData?.currentChallenges === 'sales') {
      evaluations.currentChallenges = '持続化補助金を推奨';
    }

    return evaluations;
  }
}

// 高度なPDF出力
export class EnhancedPDFExporter {
  static exportToPDF(data: ExportData, options: PDFExportOptions = {}): void {
    const opts = {
      template: 'detailed' as const,
      pageSize: 'A4' as const,
      includeCharts: false,
      ...options
    };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: opts.pageSize
    });

    let yPosition = 20;

    // タイトル
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.subsidyName} 申請書類`, 20, yPosition);
    yPosition += 15;

    // メタデータ
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`作成日: ${new Date().toLocaleDateString('ja-JP')}`, 20, yPosition);
    yPosition += 10;

    if (opts.watermark) {
      this.addWatermark(pdf, opts.watermark);
    }

    // 基本情報セクション
    yPosition = this.addSection(pdf, '基本情報', data.companyData, yPosition);
    
    // 診断結果セクション
    if (data.questionnaireData) {
      yPosition = this.addSection(pdf, '診断結果', data.questionnaireData, yPosition);
    }

    // マッチング結果セクション
    if (data.matchingResults && data.matchingResults.length > 0) {
      yPosition = this.addMatchingSection(pdf, data.matchingResults, yPosition);
    }

    const fileName = `${data.subsidyName}_申請書_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  private static addSection(pdf: jsPDF, title: string, data: any, startY: number): number {
    let yPosition = startY;
    
    // セクションタイトル
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 20, yPosition);
    yPosition += 10;

    // データ
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value && yPosition < 270) {
        const label = this.getFieldLabel(key);
        const formattedValue = String(value).substring(0, 60); // 文字数制限
        pdf.text(`${label}: ${formattedValue}`, 25, yPosition);
        yPosition += 6;
      } else if (yPosition >= 270) {
        pdf.addPage();
        yPosition = 20;
      }
    });

    return yPosition + 10;
  }

  private static addMatchingSection(pdf: jsPDF, matchingResults: any[], startY: number): number {
    let yPosition = startY;

    // セクションタイトル
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('マッチング結果', 20, yPosition);
    yPosition += 10;

    matchingResults.forEach((result, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${result.subsidy?.name || ''}`, 25, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`マッチ度: ${result.match_score}%`, 30, yPosition);
      yPosition += 6;
      
      if (result.subsidy?.subsidy_amount_max) {
        pdf.text(`最大補助額: ${result.subsidy.subsidy_amount_max.toLocaleString()}円`, 30, yPosition);
        yPosition += 6;
      }

      if (result.reasons && result.reasons.length > 0) {
        pdf.text('適合理由:', 30, yPosition);
        yPosition += 6;
        result.reasons.forEach((reason: string, idx: number) => {
          const reasonText = `・${reason}`;
          const lines = pdf.splitTextToSize(reasonText, 160);
          lines.forEach((line: string) => {
            pdf.text(line, 35, yPosition);
            yPosition += 5;
          });
        });
      }

      yPosition += 5;
    });

    return yPosition;
  }

  private static addWatermark(pdf: jsPDF, watermarkText: string): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.setFont('helvetica', 'bold');
      
      // 透明度設定（擬似的）
      const originalAlpha = pdf.internal.getLineOpacity();
      pdf.internal.setGState(pdf.internal.gStateStack.push({ opacity: 0.1 }));
      
      // 中央に配置
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
        angle: 45,
        align: 'center'
      });
      
      // 透明度を元に戻す
      pdf.internal.setGState(originalAlpha);
      pdf.setTextColor(0, 0, 0);
    }
  }

  private static getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      companyName: '会社名',
      representativeName: '代表者氏名',
      contactEmail: 'メールアドレス',
      contactPhone: '電話番号',
      employeeCount: '従業員数',
      annualRevenue: '年間売上高'
    };
    return labels[key] || key;
  }
}

// 統合エクスポート関数
export const exportData = async (
  data: ExportData,
  format: 'csv' | 'excel' | 'pdf',
  options: any = {}
): Promise<void> => {
  try {
    switch (format) {
      case 'csv':
        EnhancedCSVExporter.exportToCSV(data, options);
        break;
      case 'excel':
        EnhancedExcelExporter.exportToExcel(data, options);
        break;
      case 'pdf':
        EnhancedPDFExporter.exportToPDF(data, options);
        break;
      default:
        throw new Error(`未対応の形式: ${format}`);
    }
  } catch (error) {
    console.error('エクスポートエラー:', error);
    throw error;
  }
};

// バッチエクスポート（複数形式同時出力）
export const batchExport = async (
  data: ExportData,
  formats: Array<'csv' | 'excel' | 'pdf'>,
  options: any = {}
): Promise<void> => {
  const promises = formats.map(format => exportData(data, format, options));
  await Promise.all(promises);
};