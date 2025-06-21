import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// jsPDF用の型定義
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportData {
  companyData: any;
  questionnaireData: any;
  subsidyType: string;
  subsidyName: string;
}

// 日本語フォントの設定（実際の実装では日本語フォントファイルが必要）
const setupJapaneseFont = (pdf: jsPDF) => {
  // TODO: 実際の日本語フォントを追加する必要があります
  // pdf.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
  // pdf.setFont('NotoSansJP');
};

// データを整形する関数
const formatDataForExport = (data: ExportData) => {
  const { companyData, questionnaireData, subsidyName } = data;
  
  // フィールドラベルのマッピング
  const fieldLabels: { [key: string]: string } = {
    // 基本情報
    company_name: '法人名（商号）',
    companyName: '法人名（商号）',
    company_name_kana: '法人名（フリガナ）',
    companyNameKana: '法人名（フリガナ）',
    corporate_number: '法人番号',
    corporateNumber: '法人番号',
    establishment_date: '設立年月日',
    establishmentDate: '設立年月日',
    capital: '資本金',
    representative_name: '代表者氏名',
    representativeName: '代表者氏名',
    contact_person: '担当者氏名',
    contactPerson: '担当者氏名',
    contact_email: 'メールアドレス',
    contactEmail: 'メールアドレス',
    contact_phone: '電話番号',
    contactPhone: '電話番号',
    employee_count: '従業員数',
    employeeCount: '従業員数',
    annual_revenue: '年間売上高',
    annualRevenue: '年間売上高',
    
    // 事業内容
    business_description: '事業内容',
    businessDescription: '事業内容',
    main_business: '主な事業内容',
    target_customers: '主な顧客層',
    sales_area: '主な商圏',
    
    // IT導入補助金
    it_tool_category: '導入予定のITツールカテゴリ',
    implementation_purpose: 'IT導入の目的と期待効果',
    implementation_cost: '導入予定費用',
    
    // ものづくり補助金
    project_title: '事業計画名',
    project_category: '申請枠',
    innovation_type: '革新的サービスの内容',
    current_challenges: '現在の課題・問題点',
    solution_approach: '課題解決のアプローチ',
    expected_outcome: '期待される成果・効果',
    total_project_cost: '事業総額',
    subsidy_request_amount: '補助金申請額',
    equipment_cost: '機械装置・システム構築費',
    outsourcing_cost: '外注費',
    
    // 持続化補助金
    business_type: '事業形態',
    current_issues: '現在の経営課題',
    expansion_strategy: '販路開拓の取組内容',
    expected_results: '期待される効果',
    total_cost: '補助事業に要する経費総額',
    subsidy_amount: '補助金申請額',
    advertising_cost: '広報費',
    website_cost: 'ウェブサイト関連費',
    exhibition_cost: '展示会等出展費'
  };
  
  // 値のフォーマット
  const formatValue = (key: string, value: any): string => {
    if (!value) return '';
    
    if (key.includes('cost') || key.includes('amount') || key === 'capital' || key.includes('revenue')) {
      return `${Number(value).toLocaleString()} 円`;
    }
    
    if (key.includes('count')) {
      return `${value} 名`;
    }
    
    if (key.includes('date')) {
      try {
        return new Date(value).toLocaleDateString('ja-JP');
      } catch {
        return value;
      }
    }
    
    return value;
  };
  
  // データを配列形式に変換
  const rows: any[] = [];
  
  // ヘッダー
  rows.push([subsidyName + ' 申請書']);
  rows.push(['作成日', new Date().toLocaleDateString('ja-JP')]);
  rows.push([]); // 空行
  
  // 基本情報セクション
  rows.push(['【基本情報】']);
  Object.entries(companyData).forEach(([key, value]) => {
    if (fieldLabels[key] && value) {
      rows.push([fieldLabels[key], formatValue(key, value)]);
    }
  });
  
  rows.push([]); // 空行
  
  // 初期診断結果
  rows.push(['【初期診断結果】']);
  if (questionnaireData.businessType) {
    const businessTypeLabel = {
      'manufacturing': '製造業',
      'retail': '小売業',
      'service': 'サービス業',
      'it': 'IT関連',
      'other': 'その他'
    };
    rows.push(['事業形態', businessTypeLabel[questionnaireData.businessType as keyof typeof businessTypeLabel] || questionnaireData.businessType]);
  }
  
  if (questionnaireData.currentChallenges) {
    const challengesLabel = {
      'efficiency': '業務効率化',
      'sales': '売上拡大',
      'cost': 'コスト削減',
      'innovation': '新商品・サービス開発',
      'hr': '人材育成・確保'
    };
    rows.push(['現在の経営課題', challengesLabel[questionnaireData.currentChallenges as keyof typeof challengesLabel] || questionnaireData.currentChallenges]);
  }
  
  if (questionnaireData.digitalizationLevel) {
    const digitalizationLabel = {
      'none': 'ほとんど導入していない',
      'basic': '基本的なツールのみ',
      'partial': '一部業務で活用',
      'advanced': '積極的に活用中'
    };
    rows.push(['IT/デジタル化の現状', digitalizationLabel[questionnaireData.digitalizationLevel as keyof typeof digitalizationLabel] || questionnaireData.digitalizationLevel]);
  }
  
  if (questionnaireData.budgetRange) {
    const budgetLabel = {
      'under-500k': '50万円未満',
      '500k-1m': '50万〜100万円',
      '1m-3m': '100万〜300万円',
      '3m-5m': '300万〜500万円',
      'over-5m': '500万円以上'
    };
    rows.push(['想定投資予算', budgetLabel[questionnaireData.budgetRange as keyof typeof budgetLabel] || questionnaireData.budgetRange]);
  }
  
  return rows;
};

// Excel出力関数
export const generateExcelFile = (data: ExportData) => {
  try {
    const rows = formatDataForExport(data);
    
    // ワークブックの作成
    const wb = XLSX.utils.book_new();
    
    // ワークシートの作成
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // 列幅の設定
    const colWidths = [
      { wch: 30 }, // 項目名列
      { wch: 50 }  // 値列
    ];
    ws['!cols'] = colWidths;
    
    // セルの書式設定
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // ヘッダー行のスタイル
        if (ws[cellAddress].v && ws[cellAddress].v.toString().startsWith('【') && ws[cellAddress].v.toString().endsWith('】')) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E5E7EB" } }
          };
        }
      }
    }
    
    // ワークシートをワークブックに追加
    XLSX.utils.book_append_sheet(wb, ws, '申請書');
    
    // ファイル名の生成
    const fileName = `${data.subsidyName}_申請書_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.xlsx`;
    
    // ファイルの書き出し
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
    
    return true;
  } catch (error) {
    console.error('Excel出力エラー:', error);
    throw new Error('Excel出力に失敗しました');
  }
};

// PDF出力関数
export const generatePDFFile = (data: ExportData) => {
  try {
    const pdf = new jsPDF();
    
    // 日本語フォントの設定（現在はデフォルトフォントを使用）
    // setupJapaneseFont(pdf);
    
    // タイトル
    pdf.setFontSize(20);
    pdf.text(data.subsidyName + ' Application Form', 105, 20, { align: 'center' });
    
    // 作成日
    pdf.setFontSize(10);
    pdf.text('Created: ' + new Date().toLocaleDateString('ja-JP'), 105, 30, { align: 'center' });
    
    // データの準備
    const rows = formatDataForExport(data);
    const tableData: any[] = [];
    
    rows.forEach(row => {
      if (row.length === 1 && row[0].startsWith('【')) {
        // セクションヘッダー
        tableData.push([{ content: row[0], colSpan: 2, styles: { fillColor: [229, 231, 235], fontStyle: 'bold' } }]);
      } else if (row.length === 2) {
        // データ行
        tableData.push(row);
      }
    });
    
    // テーブルの作成
    (pdf as any).autoTable({
      startY: 40,
      head: [],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 120 }
      },
      theme: 'grid'
    });
    
    // ファイル名の生成
    const fileName = `${data.subsidyName}_申請書_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.pdf`;
    
    // PDFを保存
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('PDF出力エラー:', error);
    throw new Error('PDF出力に失敗しました（日本語フォントのサポートが必要です）');
  }
};