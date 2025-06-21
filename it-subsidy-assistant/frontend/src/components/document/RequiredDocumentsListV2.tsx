import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Download, AlertCircle, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import DocumentCheckList from './DocumentCheckList';
import { RequiredDocumentResult, Answer } from '../../utils/documentFlowLogic';

interface RequiredDocumentsListV2Props {
  subsidyType: string;
  subsidyName: string;
  answers: Record<string, Answer>;
  requiredDocuments: RequiredDocumentResult[];
  onBack: () => void;
}

const RequiredDocumentsListV2: React.FC<RequiredDocumentsListV2Props> = ({
  subsidyType,
  subsidyName,
  answers,
  requiredDocuments,
  onBack
}) => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  const [showCheckList, setShowCheckList] = useState(false);

  // カテゴリ別に書類をグループ化
  const documentsByCategory = requiredDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, RequiredDocumentResult[]>);

  const categoryLabels: Record<string, string> = {
    common: '共通書類（全申請者必須）',
    company_type: '企業形態別書類',
    frame_specific: '申請枠別書類',
    conditional: '条件付き書類',
    optional: '任意提出書類（加点対象）'
  };

  const categoryIcons: Record<string, string> = {
    common: '📋',
    company_type: '🏢',
    frame_specific: '🎯',
    conditional: '⚡',
    optional: '✨'
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDocumentCheck = (docId: string) => {
    const newChecked = new Set(checkedDocuments);
    if (newChecked.has(docId)) {
      newChecked.delete(docId);
    } else {
      newChecked.add(docId);
    }
    setCheckedDocuments(newChecked);
  };

  const getRequiredCount = () => {
    return requiredDocuments.filter(doc => doc.required).length;
  };

  const getCheckedRequiredCount = () => {
    return requiredDocuments.filter(doc => doc.required && checkedDocuments.has(doc.id)).length;
  };

  const getCompletionRate = () => {
    const required = getRequiredCount();
    if (required === 0) return 100;
    return Math.round((getCheckedRequiredCount() / required) * 100);
  };

  const canProceed = () => {
    return requiredDocuments.filter(doc => doc.required).every(doc => checkedDocuments.has(doc.id));
  };

  const handleExportChecklist = () => {
    setShowCheckList(true);
  };

  const getAnswerSummary = () => {
    const summary: string[] = [];
    
    // 企業形態
    if (answers.company_type) {
      summary.push(`企業形態: ${answers.company_type.label}`);
    }
    
    // 事業年数
    if (answers.business_years) {
      summary.push(`事業年数: ${answers.business_years.label}`);
    }
    
    // 申請枠
    if (answers.application_frame) {
      summary.push(`申請枠: ${answers.application_frame.label}`);
    } else if (answers.project_type) {
      summary.push(`事業類型: ${answers.project_type.label}`);
    } else if (answers.application_purpose) {
      summary.push(`申請目的: ${answers.application_purpose.label}`);
    }
    
    return summary;
  };

  if (showCheckList) {
    return (
      <DocumentCheckList
        subsidyType={subsidyType}
        subsidyName={subsidyName}
        requiredDocuments={requiredDocuments}
        checkedDocuments={checkedDocuments}
        answers={answers}
        onBack={() => setShowCheckList(false)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">必要書類診断結果</h1>
              <p className="text-gray-600">{subsidyName}</p>
            </div>
          </div>
          <button
            onClick={handleExportChecklist}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Printer className="h-5 w-5" />
            <span>チェックリスト印刷</span>
          </button>
        </div>

        {/* 診断結果サマリー */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">診断内容</h3>
          <div className="space-y-1">
            {getAnswerSummary().map((item, index) => (
              <p key={index} className="text-sm text-blue-800">• {item}</p>
            ))}
          </div>
        </div>

        {/* 進捗状況 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">書類準備状況</span>
            <span className="text-2xl font-bold text-blue-600">{getCompletionRate()}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionRate()}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            必須書類: {getCheckedRequiredCount()} / {getRequiredCount()} 準備完了
          </p>
        </div>
      </div>

      {/* 書類リスト */}
      <div className="space-y-4">
        {Object.entries(documentsByCategory).map(([category, docs]) => (
          <div key={category} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{categoryIcons[category]}</span>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {categoryLabels[category]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {docs.filter(d => d.required).length}件の必須書類
                    {docs.filter(d => !d.required).length > 0 && ` + ${docs.filter(d => !d.required).length}件の任意書類`}
                  </p>
                </div>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedCategories.has(category) && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border transition-all ${
                      checkedDocuments.has(doc.id)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={checkedDocuments.has(doc.id)}
                        onChange={() => handleDocumentCheck(doc.id)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          {doc.required && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                              必須
                            </span>
                          )}
                          {doc.format && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {doc.format}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        
                        {/* 必要理由 */}
                        <div className="flex items-start space-x-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <p className="text-sm text-amber-700">
                            <span className="font-medium">必要理由:</span> {doc.reason}
                          </p>
                        </div>

                        {/* 追加メモ */}
                        {doc.notes && (
                          <p className="text-xs text-gray-500 italic">※ {doc.notes}</p>
                        )}

                        {/* テンプレート質問がある場合 */}
                        {doc.templateQuestions && doc.templateQuestions.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-xs font-medium text-blue-900 mb-1">
                              この書類で回答が必要な項目:
                            </p>
                            <ul className="text-xs text-blue-800 space-y-0.5">
                              {doc.templateQuestions.map((q, idx) => (
                                <li key={idx}>• {q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 注意事項 */}
      <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">重要な注意事項</h3>
            <ul className="space-y-1 text-sm text-amber-800">
              <li>• 各種証明書は発行から3ヶ月以内のものをご用意ください</li>
              <li>• 見積書は税抜金額で記載されたものが必要です</li>
              <li>• すべての書類はPDF形式での提出を推奨します</li>
              <li>• 書類に不備があると審査に時間がかかる場合があります</li>
              <li>• 申請内容によっては追加書類を求められる場合があります</li>
            </ul>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← 診断をやり直す
        </button>

        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/documents/templates')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            書類テンプレート一覧
          </button>
          
          <button
            onClick={() => navigate('/application/start')}
            disabled={!canProceed()}
            className={`px-8 py-3 font-medium rounded-lg transition-colors ${
              canProceed()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canProceed() ? '申請書作成を開始' : 'すべての必須書類を確認してください'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequiredDocumentsListV2;