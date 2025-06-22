import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Printer, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  Loader2
} from 'lucide-react';
import { ComprehensiveFormData } from '../types/documentForm';
import { 
  getFieldMappingsForSubsidy, 
  applyFieldMappings,
  generateDocumentFilename 
} from '../utils/documentFieldMapping';

interface Props {
  subsidyType: string;
  formData: ComprehensiveFormData;
  onBack: () => void;
  onExport: (format: 'excel' | 'word' | 'pdf') => void;
}

interface DocumentSection {
  id: string;
  title: string;
  fields: Array<{
    label: string;
    value: any;
    format?: (value: any) => string;
  }>;
}

const DocumentPreviewExport: React.FC<Props> = ({
  subsidyType,
  formData,
  onBack,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'word' | 'pdf'>('excel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Format currency values
  const formatCurrency = (value: number): string => {
    return `¥${value.toLocaleString('ja-JP')}`;
  };

  // Format date values
  const formatDate = (value: string): string => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Define document sections based on form data
  const getDocumentSections = (): DocumentSection[] => {
    const sections: DocumentSection[] = [
      {
        id: 'company',
        title: '企業基本情報',
        fields: [
          { label: '法人名', value: formData.companyInfo.companyName },
          { label: '法人名（カナ）', value: formData.companyInfo.companyNameKana },
          { label: '法人番号', value: formData.companyInfo.corporateNumber },
          { label: '設立年月日', value: formData.companyInfo.establishmentDate, format: formatDate },
          { label: '資本金', value: formData.companyInfo.capital, format: formatCurrency },
          { label: '決算月', value: formData.companyInfo.fiscalYearEnd ? `${formData.companyInfo.fiscalYearEnd}月` : '' },
        ]
      },
      {
        id: 'address',
        title: '所在地情報',
        fields: [
          { label: '郵便番号', value: formData.addressInfo.postalCode },
          { label: '都道府県', value: formData.addressInfo.prefecture },
          { label: '市区町村', value: formData.addressInfo.city },
          { label: '番地', value: formData.addressInfo.address1 },
          { label: '建物名', value: formData.addressInfo.buildingName },
        ]
      },
      {
        id: 'representative',
        title: '代表者・連絡先情報',
        fields: [
          { label: '代表者氏名', value: formData.representativeInfo.representativeName },
          { label: '代表者役職', value: formData.representativeInfo.representativeTitle },
          { label: '担当者氏名', value: formData.representativeInfo.contactPersonName },
          { label: '担当者部署', value: formData.representativeInfo.contactPersonDepartment },
          { label: 'メールアドレス', value: formData.representativeInfo.contactEmail },
          { label: '電話番号', value: formData.representativeInfo.contactPhone },
        ]
      },
      {
        id: 'business',
        title: '事業情報',
        fields: [
          { label: '事業内容', value: formData.businessInfo.businessDescription },
          { label: '従業員数', value: `正社員: ${formData.businessInfo.employeeCount}名 / パート・アルバイト: ${formData.businessInfo.partTimeEmployeeCount}名` },
          { label: '直近年度売上高', value: formData.businessInfo.annualRevenue, format: formatCurrency },
          { label: '前年度売上高', value: formData.businessInfo.previousYearRevenue, format: formatCurrency },
          { label: 'Webサイト', value: formData.businessInfo.websiteUrl },
        ]
      },
      {
        id: 'project',
        title: '補助事業計画',
        fields: [
          { label: '事業計画名', value: formData.projectPlan.projectTitle },
          { label: '事業目的', value: formData.projectPlan.projectObjective },
          { label: '現状の課題', value: formData.projectPlan.currentIssues },
          { label: '解決方法', value: formData.projectPlan.solutionApproach },
          { label: '期待される成果', value: formData.projectPlan.expectedResults },
          { 
            label: '実施期間', 
            value: `${formatDate(formData.projectPlan.implementationSchedule.startDate)} 〜 ${formatDate(formData.projectPlan.implementationSchedule.endDate)}` 
          },
        ]
      },
    ];

    // Add subsidy-specific sections
    if (subsidyType.includes('IT導入補助金') && formData.itImplementation) {
      sections.push({
        id: 'it-implementation',
        title: 'IT導入計画',
        fields: [
          { label: 'ITツールカテゴリ', value: formData.itImplementation.itToolCategory },
          { label: 'ITツール名', value: formData.itImplementation.itToolName },
          { label: 'IT導入支援事業者', value: formData.itImplementation.vendorName },
          { label: '導入費用', value: formData.itImplementation.implementationCost, format: formatCurrency },
          { label: '月額利用料', value: formData.itImplementation.monthlyFee, format: formatCurrency },
          { label: 'ライセンス数', value: `${formData.itImplementation.licenseCount}ライセンス` },
        ]
      });
    }

    // Add expense section
    const totalExpenses = formData.expenses.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalSubsidy = formData.expenses.items.reduce((sum, item) => sum + item.subsidyAmount, 0);
    
    sections.push({
      id: 'expenses',
      title: '経費明細',
      fields: [
        { label: '経費項目数', value: `${formData.expenses.items.length}件` },
        { label: '経費合計', value: totalExpenses, format: formatCurrency },
        { label: '補助金申請額', value: totalSubsidy, format: formatCurrency },
        { label: '自己負担額', value: totalExpenses - totalSubsidy, format: formatCurrency },
        { label: '補助率', value: totalExpenses > 0 ? `${Math.round((totalSubsidy / totalExpenses) * 100)}%` : '0%' },
      ]
    });

    return sections;
  };

  // Handle document generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStatus({ type: null, message: '' });

    try {
      // Apply field mappings
      const mappings = getFieldMappingsForSubsidy(subsidyType);
      const documentData = applyFieldMappings(formData, mappings);
      
      // TODO: Call backend API to generate document
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate filename
      const filename = generateDocumentFilename(subsidyType, selectedFormat);
      
      setGenerationStatus({
        type: 'success',
        message: `書類を生成しました: ${filename}`
      });
      
      // Trigger download (would be actual file download in production)
      onExport(selectedFormat);
      
    } catch (error) {
      setGenerationStatus({
        type: 'error',
        message: '書類の生成中にエラーが発生しました'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const documentSections = getDocumentSections();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            申請書類プレビュー
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>印刷</span>
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800">
                以下の内容で申請書類を生成します。内容を確認してからファイル形式を選択してダウンロードしてください。
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>補助金種別:</strong> {subsidyType}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
        <div className="space-y-8">
          {documentSections.map((section) => (
            <div key={section.id} className="border-b border-gray-200 pb-6 last:border-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600 mb-1">
                      {field.label}
                    </span>
                    <span className="text-base text-gray-900">
                      {field.format ? field.format(field.value) : field.value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Expense Details Table */}
        {formData.expenses.items.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">経費明細詳細</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      経費区分
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      品名
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数量
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      単価
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金額
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      補助金申請額
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.expenses.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.subsidyAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          ファイル形式を選択
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <label
            className={`relative flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFormat === 'excel'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="excel"
              checked={selectedFormat === 'excel'}
              onChange={(e) => setSelectedFormat(e.target.value as 'excel')}
              className="sr-only"
            />
            <div className="flex items-center">
              <FileSpreadsheet className={`h-8 w-8 ${
                selectedFormat === 'excel' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">Excel形式</p>
                <p className="text-sm text-gray-500">編集可能な表計算形式</p>
              </div>
            </div>
            {selectedFormat === 'excel' && (
              <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-blue-600" />
            )}
          </label>
          
          <label
            className={`relative flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFormat === 'word'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="word"
              checked={selectedFormat === 'word'}
              onChange={(e) => setSelectedFormat(e.target.value as 'word')}
              className="sr-only"
            />
            <div className="flex items-center">
              <FileText className={`h-8 w-8 ${
                selectedFormat === 'word' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">Word形式</p>
                <p className="text-sm text-gray-500">編集可能な文書形式</p>
              </div>
            </div>
            {selectedFormat === 'word' && (
              <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-blue-600" />
            )}
          </label>
          
          <label
            className={`relative flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFormat === 'pdf'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={selectedFormat === 'pdf'}
              onChange={(e) => setSelectedFormat(e.target.value as 'pdf')}
              className="sr-only"
            />
            <div className="flex items-center">
              <FileDown className={`h-8 w-8 ${
                selectedFormat === 'pdf' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">PDF形式</p>
                <p className="text-sm text-gray-500">印刷・提出用形式</p>
              </div>
            </div>
            {selectedFormat === 'pdf' && (
              <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-blue-600" />
            )}
          </label>
        </div>

        {generationStatus.type && (
          <div className={`mb-6 p-4 rounded-lg ${
            generationStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              {generationStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                generationStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {generationStatus.message}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            戻る
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center space-x-2 px-8 py-3 rounded-lg transition-colors ${
              isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>ダウンロード</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewExport;