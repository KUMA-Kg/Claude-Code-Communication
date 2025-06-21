import React, { useState, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, Loader, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { generateSampleExcelFile, generateCompleteExcelSample } from '../utils/excelSampleGenerator';

interface ExtractedData {
  companyInfo: {
    companyName?: string;
    representativeName?: string;
    address?: string;
    revenue?: number;
    employees?: number;
    establishedDate?: string;
  };
  businessData: {
    mainBusiness?: string;
    products?: string[];
    challenges?: string;
    goals?: string;
  };
  financialData: {
    totalCost?: number;
    ownFunds?: number;
    subsidyAmount?: number;
    expenses?: Array<{
      category: string;
      amount: number;
      description: string;
    }>;
  };
}

interface ProcessingResult {
  success: boolean;
  data?: ExtractedData;
  errors?: string[];
  warnings?: string[];
}

const ExcelProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  // エクセルファイルのアップロード処理
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResult(null);
      setExtractedData(null);
    }
  }, []);

  // エクセルファイルからデータを抽出
  const extractDataFromExcel = useCallback(async (file: File): Promise<ProcessingResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const extractedData: ExtractedData = {
            companyInfo: {},
            businessData: {},
            financialData: { expenses: [] }
          };
          
          const errors: string[] = [];
          const warnings: string[] = [];

          // 各シートを解析
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // シート名に基づいてデータを分類
            if (sheetName.includes('企業') || sheetName.includes('会社') || sheetName.includes('基本')) {
              extractCompanyInfo(jsonData, extractedData.companyInfo, warnings);
            } else if (sheetName.includes('事業') || sheetName.includes('ビジネス')) {
              extractBusinessInfo(jsonData, extractedData.businessData, warnings);
            } else if (sheetName.includes('資金') || sheetName.includes('経費') || sheetName.includes('費用')) {
              extractFinancialInfo(jsonData, extractedData.financialData, warnings);
            } else {
              // 汎用的な解析
              extractGenericInfo(jsonData, extractedData, warnings);
            }
          });

          // データ検証
          validateExtractedData(extractedData, errors, warnings);

          resolve({
            success: errors.length === 0,
            data: extractedData,
            errors,
            warnings
          });
        } catch (error) {
          resolve({
            success: false,
            errors: [`ファイル読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`]
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // 企業情報の抽出
  const extractCompanyInfo = (data: any[][], companyInfo: any, warnings: string[]) => {
    data.forEach((row, index) => {
      if (!row || row.length === 0) return;
      
      const firstCell = String(row[0] || '').toLowerCase();
      const secondCell = row[1];

      if (firstCell.includes('会社名') || firstCell.includes('法人名') || firstCell.includes('企業名')) {
        companyInfo.companyName = secondCell;
      } else if (firstCell.includes('代表者') || firstCell.includes('社長')) {
        companyInfo.representativeName = secondCell;
      } else if (firstCell.includes('住所') || firstCell.includes('所在地')) {
        companyInfo.address = secondCell;
      } else if (firstCell.includes('売上') || firstCell.includes('revenue')) {
        const revenue = parseFloat(String(secondCell).replace(/[^\d.]/g, ''));
        if (!isNaN(revenue)) companyInfo.revenue = revenue;
      } else if (firstCell.includes('従業員') || firstCell.includes('employee')) {
        const employees = parseInt(String(secondCell).replace(/[^\d]/g, ''));
        if (!isNaN(employees)) companyInfo.employees = employees;
      } else if (firstCell.includes('設立') || firstCell.includes('創業')) {
        companyInfo.establishedDate = secondCell;
      }
    });
  };

  // 事業情報の抽出
  const extractBusinessInfo = (data: any[][], businessData: any, warnings: string[]) => {
    data.forEach((row) => {
      if (!row || row.length === 0) return;
      
      const firstCell = String(row[0] || '').toLowerCase();
      const secondCell = row[1];

      if (firstCell.includes('事業内容') || firstCell.includes('主力事業')) {
        businessData.mainBusiness = secondCell;
      } else if (firstCell.includes('課題') || firstCell.includes('問題')) {
        businessData.challenges = secondCell;
      } else if (firstCell.includes('目標') || firstCell.includes('ゴール')) {
        businessData.goals = secondCell;
      } else if (firstCell.includes('商品') || firstCell.includes('サービス')) {
        if (!businessData.products) businessData.products = [];
        businessData.products.push(secondCell);
      }
    });
  };

  // 財務情報の抽出
  const extractFinancialInfo = (data: any[][], financialData: any, warnings: string[]) => {
    data.forEach((row) => {
      if (!row || row.length === 0) return;
      
      const firstCell = String(row[0] || '').toLowerCase();
      const secondCell = row[1];

      if (firstCell.includes('総費用') || firstCell.includes('総額')) {
        const amount = parseFloat(String(secondCell).replace(/[^\d.]/g, ''));
        if (!isNaN(amount)) financialData.totalCost = amount;
      } else if (firstCell.includes('自己資金') || firstCell.includes('自己負担')) {
        const amount = parseFloat(String(secondCell).replace(/[^\d.]/g, ''));
        if (!isNaN(amount)) financialData.ownFunds = amount;
      } else if (firstCell.includes('補助金') || firstCell.includes('助成金')) {
        const amount = parseFloat(String(secondCell).replace(/[^\d.]/g, ''));
        if (!isNaN(amount)) financialData.subsidyAmount = amount;
      } else if (row.length >= 3) {
        // 経費明細の抽出
        const category = String(row[0]);
        const amount = parseFloat(String(row[1] || row[2]).replace(/[^\d.]/g, ''));
        const description = String(row[2] || row[1]);
        
        if (!isNaN(amount) && amount > 0) {
          financialData.expenses.push({
            category,
            amount,
            description
          });
        }
      }
    });
  };

  // 汎用的な情報抽出
  const extractGenericInfo = (data: any[][], extractedData: ExtractedData, warnings: string[]) => {
    // ヘッダー行を探す
    let headerRow = -1;
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (row && row.some(cell => 
        String(cell).includes('名前') || 
        String(cell).includes('金額') || 
        String(cell).includes('項目')
      )) {
        headerRow = i;
        break;
      }
    }

    if (headerRow >= 0) {
      const headers = data[headerRow].map(h => String(h).toLowerCase());
      
      for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.every(cell => !cell)) continue;

        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (!value) return;

          if (header.includes('会社') || header.includes('企業')) {
            extractedData.companyInfo.companyName = extractedData.companyInfo.companyName || value;
          } else if (header.includes('金額') || header.includes('費用')) {
            const amount = parseFloat(String(value).replace(/[^\d.]/g, ''));
            if (!isNaN(amount)) {
              extractedData.financialData.expenses.push({
                category: headers[0] ? String(row[0]) : '不明',
                amount,
                description: String(value)
              });
            }
          }
        });
      }
    }
  };

  // データ検証
  const validateExtractedData = (data: ExtractedData, errors: string[], warnings: string[]) => {
    if (!data.companyInfo.companyName) {
      warnings.push('企業名が見つかりませんでした');
    }
    if (!data.companyInfo.representativeName) {
      warnings.push('代表者名が見つかりませんでした');
    }
    if (!data.financialData.totalCost && data.financialData.expenses.length === 0) {
      warnings.push('財務データが見つかりませんでした');
    }
  };

  // ファイル処理実行
  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const result = await extractDataFromExcel(file);
      setResult(result);
      if (result.success && result.data) {
        setExtractedData(result.data);
      }
    } catch (error) {
      setResult({
        success: false,
        errors: [`処理エラー: ${error instanceof Error ? error.message : '不明なエラー'}`]
      });
    } finally {
      setProcessing(false);
    }
  };

  // 補助金申請書類の生成
  const generateSubsidyDocument = async (subsidyType: string) => {
    if (!extractedData) return;

    const workbook = new ExcelJS.Workbook();
    
    if (subsidyType === 'IT導入補助金') {
      await generateITSubsidyDocument(workbook, extractedData);
    } else if (subsidyType === 'ものづくり補助金') {
      await generateMonozukuriDocument(workbook, extractedData);
    } else if (subsidyType === '小規模事業者持続化補助金') {
      await generateJizokukaDocument(workbook, extractedData);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${subsidyType}_申請書_${new Date().getISOString().split('T')[0]}.xlsx`);
  };

  // IT導入補助金書類生成
  const generateITSubsidyDocument = async (workbook: ExcelJS.Workbook, data: ExtractedData) => {
    const worksheet = workbook.addWorksheet('実施内容説明書');
    
    // ヘッダー設定
    worksheet.addRow(['IT導入補助金 実施内容説明書']);
    worksheet.addRow([]);
    
    // 企業情報セクション
    worksheet.addRow(['■ 申請者情報']);
    worksheet.addRow(['企業名', data.companyInfo.companyName || '']);
    worksheet.addRow(['代表者名', data.companyInfo.representativeName || '']);
    worksheet.addRow(['住所', data.companyInfo.address || '']);
    worksheet.addRow(['年間売上高', data.companyInfo.revenue ? `${data.companyInfo.revenue}万円` : '']);
    worksheet.addRow(['従業員数', data.companyInfo.employees ? `${data.companyInfo.employees}人` : '']);
    worksheet.addRow([]);
    
    // 事業内容セクション
    worksheet.addRow(['■ 事業内容']);
    worksheet.addRow(['主要事業', data.businessData.mainBusiness || '']);
    worksheet.addRow(['現在の課題', data.businessData.challenges || '']);
    worksheet.addRow(['導入目的', data.businessData.goals || '']);
    worksheet.addRow([]);
    
    // 費用計画セクション
    worksheet.addRow(['■ 費用計画']);
    worksheet.addRow(['項目', '金額', '内容']);
    data.financialData.expenses.forEach(expense => {
      worksheet.addRow([expense.category, expense.amount, expense.description]);
    });
    worksheet.addRow(['総費用', data.financialData.totalCost || '', '']);
    worksheet.addRow(['補助金申請額', data.financialData.subsidyAmount || '', '']);
    worksheet.addRow(['自己負担額', data.financialData.ownFunds || '', '']);

    // スタイル設定
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 40;
  };

  // ものづくり補助金書類生成
  const generateMonozukuriDocument = async (workbook: ExcelJS.Workbook, data: ExtractedData) => {
    const worksheet = workbook.addWorksheet('事業計画書');
    
    worksheet.addRow(['ものづくり補助金 事業計画書']);
    worksheet.addRow([]);
    
    worksheet.addRow(['■ 事業者情報']);
    worksheet.addRow(['事業者名', data.companyInfo.companyName || '']);
    worksheet.addRow(['代表者名', data.companyInfo.representativeName || '']);
    worksheet.addRow(['設立年月日', data.companyInfo.establishedDate || '']);
    worksheet.addRow([]);
    
    worksheet.addRow(['■ 革新的な取組み']);
    worksheet.addRow(['事業計画名', '']);
    worksheet.addRow(['革新性の内容', '']);
    worksheet.addRow(['競合優位性', '']);
    worksheet.addRow([]);
    
    worksheet.addRow(['■ 設備投資計画']);
    worksheet.addRow(['設備名', '金額', '用途']);
    data.financialData.expenses.forEach(expense => {
      worksheet.addRow([expense.category, expense.amount, expense.description]);
    });

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 40;
  };

  // 小規模事業者持続化補助金書類生成
  const generateJizokukaDocument = async (workbook: ExcelJS.Workbook, data: ExtractedData) => {
    const worksheet = workbook.addWorksheet('経営計画書');
    
    worksheet.addRow(['小規模事業者持続化補助金 経営計画書']);
    worksheet.addRow([]);
    
    worksheet.addRow(['■ 事業者概要']);
    worksheet.addRow(['事業者名', data.companyInfo.companyName || '']);
    worksheet.addRow(['代表者名', data.companyInfo.representativeName || '']);
    worksheet.addRow(['主要事業', data.businessData.mainBusiness || '']);
    worksheet.addRow([]);
    
    worksheet.addRow(['■ 補助事業計画']);
    worksheet.addRow(['事業名', '']);
    worksheet.addRow(['事業目的', data.businessData.goals || '']);
    worksheet.addRow(['実施内容', '']);
    worksheet.addRow([]);
    
    worksheet.addRow(['■ 補助対象経費']);
    worksheet.addRow(['経費区分', '金額', '必要性・効果']);
    data.financialData.expenses.forEach(expense => {
      worksheet.addRow([expense.category, expense.amount, expense.description]);
    });

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 50;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="flex items-center space-x-3 mb-6">
          <FileSpreadsheet className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">エクセルデータ処理</h1>
            <p className="text-gray-600">エクセルファイルから情報を抽出し、補助金申請書類を自動生成</p>
          </div>
        </div>

        {/* サンプルファイルダウンロード */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📁 サンプルファイルダウンロード</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => generateSampleExcelFile('company')}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              <span className="text-sm">企業情報</span>
            </button>
            <button
              onClick={() => generateSampleExcelFile('business')}
              className="flex items-center justify-center space-x-2 p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              <span className="text-sm">事業情報</span>
            </button>
            <button
              onClick={() => generateSampleExcelFile('financial')}
              className="flex items-center justify-center space-x-2 p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              <span className="text-sm">財務情報</span>
            </button>
            <button
              onClick={generateCompleteExcelSample}
              className="flex items-center justify-center space-x-2 p-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              <span className="text-sm">統合サンプル</span>
            </button>
          </div>
        </div>

        {/* ファイルアップロード */}
        <div className="mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">エクセルファイルをアップロード</p>
              <p className="text-sm text-gray-600">企業情報、事業データ、財務データを含むファイルを選択</p>
              <p className="text-xs text-gray-500">上記のサンプルファイルを参考に、データを準備してください</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="mt-4"
            />
          </div>
        </div>

        {/* ファイル処理ボタン */}
        {file && (
          <div className="mb-8 text-center">
            <button
              onClick={processFile}
              disabled={processing}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  データを抽出
                </>
              )}
            </button>
          </div>
        )}

        {/* 処理結果 */}
        {result && (
          <div className="mb-8">
            <div className={`rounded-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center space-x-2 mb-4">
                {result.success ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'データ抽出完了' : 'エラーが発生しました'}
                </h3>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-900 mb-2">エラー:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.warnings && result.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-900 mb-2">警告:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 抽出データ表示 */}
        {extractedData && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">抽出されたデータ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 企業情報 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">企業情報</h4>
                <div className="space-y-2 text-sm">
                  {extractedData.companyInfo.companyName && (
                    <div><span className="font-medium">企業名:</span> {extractedData.companyInfo.companyName}</div>
                  )}
                  {extractedData.companyInfo.representativeName && (
                    <div><span className="font-medium">代表者:</span> {extractedData.companyInfo.representativeName}</div>
                  )}
                  {extractedData.companyInfo.revenue && (
                    <div><span className="font-medium">売上:</span> {extractedData.companyInfo.revenue}万円</div>
                  )}
                  {extractedData.companyInfo.employees && (
                    <div><span className="font-medium">従業員:</span> {extractedData.companyInfo.employees}人</div>
                  )}
                </div>
              </div>

              {/* 事業情報 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">事業情報</h4>
                <div className="space-y-2 text-sm">
                  {extractedData.businessData.mainBusiness && (
                    <div><span className="font-medium">主要事業:</span> {extractedData.businessData.mainBusiness}</div>
                  )}
                  {extractedData.businessData.challenges && (
                    <div><span className="font-medium">課題:</span> {extractedData.businessData.challenges}</div>
                  )}
                  {extractedData.businessData.goals && (
                    <div><span className="font-medium">目標:</span> {extractedData.businessData.goals}</div>
                  )}
                </div>
              </div>

              {/* 財務情報 */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3">財務情報</h4>
                <div className="space-y-2 text-sm">
                  {extractedData.financialData.totalCost && (
                    <div><span className="font-medium">総費用:</span> {extractedData.financialData.totalCost.toLocaleString()}円</div>
                  )}
                  {extractedData.financialData.subsidyAmount && (
                    <div><span className="font-medium">補助金:</span> {extractedData.financialData.subsidyAmount.toLocaleString()}円</div>
                  )}
                  <div><span className="font-medium">経費項目:</span> {extractedData.financialData.expenses.length}件</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 書類生成ボタン */}
        {extractedData && (
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">補助金申請書類生成</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => generateSubsidyDocument('IT導入補助金')}
                className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>IT導入補助金</span>
              </button>
              <button
                onClick={() => generateSubsidyDocument('ものづくり補助金')}
                className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>ものづくり補助金</span>
              </button>
              <button
                onClick={() => generateSubsidyDocument('小規模事業者持続化補助金')}
                className="flex items-center justify-center space-x-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>持続化補助金</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelProcessor;