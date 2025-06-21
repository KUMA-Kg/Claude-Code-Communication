import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateSampleExcelFile = async (type: 'company' | 'business' | 'financial') => {
  const workbook = new ExcelJS.Workbook();

  if (type === 'company') {
    await generateCompanyInfoSample(workbook);
  } else if (type === 'business') {
    await generateBusinessInfoSample(workbook);
  } else if (type === 'financial') {
    await generateFinancialInfoSample(workbook);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `サンプル_${type === 'company' ? '企業情報' : type === 'business' ? '事業情報' : '財務情報'}.xlsx`);
};

const generateCompanyInfoSample = async (workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet('企業基本情報');
  
  // ヘッダー設定
  worksheet.addRow(['項目', '内容', '備考']);
  worksheet.addRow(['会社名', '株式会社サンプル企業', '正式名称で記入']);
  worksheet.addRow(['代表者名', '山田太郎', '']);
  worksheet.addRow(['住所', '東京都千代田区丸の内1-1-1', '本社所在地']);
  worksheet.addRow(['郵便番号', '100-0005', '']);
  worksheet.addRow(['設立年月日', '2015-04-01', 'YYYY-MM-DD形式']);
  worksheet.addRow(['資本金', '1000', '万円単位']);
  worksheet.addRow(['年間売上高', '50000', '万円単位・前年度実績']);
  worksheet.addRow(['従業員数（正社員）', '25', '人数']);
  worksheet.addRow(['従業員数（パート・アルバイト）', '5', '人数']);
  worksheet.addRow(['主要業種', '製造業', '日本標準産業分類に基づく']);
  worksheet.addRow(['事業年数', '9', '年']);

  // スタイル設定
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7F3FF' }
  };

  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 30;
  worksheet.getColumn(3).width = 35;
};

const generateBusinessInfoSample = async (workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet('事業情報');
  
  worksheet.addRow(['項目', '内容', '詳細']);
  worksheet.addRow(['主要事業内容', 'ITシステム開発・保守', 'Webアプリケーション、業務システムの開発']);
  worksheet.addRow(['主要商品・サービス1', 'ECサイト構築サービス', 'オンラインショップの企画・開発・運用']);
  worksheet.addRow(['主要商品・サービス2', 'CRMシステム', '顧客管理システムの開発・カスタマイズ']);
  worksheet.addRow(['主要商品・サービス3', 'データ分析サービス', 'ビッグデータ分析・レポート作成']);
  worksheet.addRow(['現在の課題', '受注増加に対応できない', '人手不足により案件対応が困難']);
  worksheet.addRow(['解決したい問題', 'プロジェクト管理の効率化', 'スケジュール・リソース管理の改善']);
  worksheet.addRow(['事業目標', '売上30%向上', '新規顧客獲得と既存顧客の売上拡大']);
  worksheet.addRow(['ターゲット市場', '中小企業のDX支援', '従業員50-300人規模の企業']);
  worksheet.addRow(['競合優位性', '業界特化のノウハウ', '製造業向けシステム開発の専門性']);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7FFE7' }
  };

  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 35;
  worksheet.getColumn(3).width = 40;
};

const generateFinancialInfoSample = async (workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet('財務・経費情報');
  
  // 基本情報
  worksheet.addRow(['■ プロジェクト概要']);
  worksheet.addRow(['総事業費', '5000000', '円（税抜）']);
  worksheet.addRow(['補助金申請額', '2500000', '円']);
  worksheet.addRow(['自己負担額', '2500000', '円']);
  worksheet.addRow([]);
  
  // 経費明細
  worksheet.addRow(['■ 経費明細']);
  worksheet.addRow(['経費区分', '金額（円）', '内容・説明']);
  worksheet.addRow(['機械装置費', '2000000', '高性能サーバー導入']);
  worksheet.addRow(['ソフトウェア費', '1500000', 'プロジェクト管理システム']);
  worksheet.addRow(['専門家経費', '800000', 'ITコンサルタント費用']);
  worksheet.addRow(['研修費', '300000', '社員向けシステム研修']);
  worksheet.addRow(['導入設定費', '400000', 'システム設定・カスタマイズ']);
  worksheet.addRow([]);
  
  // 効果予測
  worksheet.addRow(['■ 期待効果']);
  worksheet.addRow(['現在の月間売上', '4000000', '万円']);
  worksheet.addRow(['目標月間売上', '5200000', '万円（30%向上）']);
  worksheet.addRow(['現在の月間コスト', '3000000', '万円']);
  worksheet.addRow(['目標月間コスト', '2700000', '万円（10%削減）']);
  worksheet.addRow(['投資回収期間', '18', 'ヶ月']);

  // スタイル設定
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(6).font = { bold: true, size: 12 };
  worksheet.getRow(14).font = { bold: true, size: 12 };
  
  const headerRow = worksheet.getRow(7);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE7E7' }
  };

  worksheet.getColumn(1).width = 20;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 40;
};

export const generateCompleteExcelSample = async () => {
  const workbook = new ExcelJS.Workbook();
  
  await generateCompanyInfoSample(workbook);
  await generateBusinessInfoSample(workbook);
  await generateFinancialInfoSample(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `補助金申請_統合サンプルデータ_${new Date().toISOString().split('T')[0]}.xlsx`);
};