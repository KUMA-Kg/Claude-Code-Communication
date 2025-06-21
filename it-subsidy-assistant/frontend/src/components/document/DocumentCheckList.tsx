import React, { useRef } from 'react';
import { Printer, Download, X, CheckSquare, Square } from 'lucide-react';
import { RequiredDocumentResult, Answer } from '../../utils/documentFlowLogic';

interface DocumentCheckListProps {
  subsidyType: string;
  subsidyName: string;
  requiredDocuments: RequiredDocumentResult[];
  checkedDocuments: Set<string>;
  answers: Record<string, Answer>;
  onBack: () => void;
}

const DocumentCheckList: React.FC<DocumentCheckListProps> = ({
  subsidyType,
  subsidyName,
  requiredDocuments,
  checkedDocuments,
  answers,
  onBack
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // 簡易的なPDFダウンロード実装
    // 実際の実装では、jsPDFやhtml2canvasなどのライブラリを使用
    alert('PDF機能は準備中です。印刷機能をご利用ください。');
  };

  const getFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  };

  const getAnswerLabel = (key: string): string => {
    const answer = answers[key];
    if (!answer) return '未回答';
    if (Array.isArray(answer)) {
      return answer.map(a => a.label).join(', ');
    }
    return answer.label;
  };

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

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* ヘッダー（印刷時は非表示） */}
        <div className="p-6 border-b border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">必要書類チェックリスト</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>PDF保存</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Printer className="h-5 w-5" />
                <span>印刷</span>
              </button>
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* チェックリスト本体 */}
        <div ref={printRef} className="p-8 print:p-4">
          {/* タイトル（印刷時のみ表示） */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{subsidyName}</h1>
            <h2 className="text-xl">必要書類チェックリスト</h2>
            <p className="text-sm text-gray-600 mt-2">作成日: {getFormattedDate()}</p>
          </div>

          {/* 申請者情報 */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg print:border print:border-gray-300">
            <h3 className="font-bold text-lg mb-3">申請者情報</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">企業形態:</span>
                <span className="ml-2">{getAnswerLabel('company_type')}</span>
              </div>
              <div>
                <span className="font-medium">事業年数:</span>
                <span className="ml-2">{getAnswerLabel('business_years')}</span>
              </div>
              {subsidyType === 'it_donyu' && (
                <div>
                  <span className="font-medium">申請枠:</span>
                  <span className="ml-2">{getAnswerLabel('application_frame')}</span>
                </div>
              )}
              {subsidyType === 'monozukuri' && (
                <div>
                  <span className="font-medium">事業類型:</span>
                  <span className="ml-2">{getAnswerLabel('project_type')}</span>
                </div>
              )}
              {subsidyType === 'jizokuka' && (
                <>
                  <div>
                    <span className="font-medium">従業員数:</span>
                    <span className="ml-2">{getAnswerLabel('employee_count')}</span>
                  </div>
                  <div>
                    <span className="font-medium">申請目的:</span>
                    <span className="ml-2">{getAnswerLabel('application_purpose')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 書類リスト */}
          <div className="space-y-6">
            {Object.entries(documentsByCategory).map(([category, docs], categoryIndex) => (
              <div key={category} className="break-inside-avoid">
                <h3 className="font-bold text-lg mb-3 text-gray-900">
                  {categoryIndex + 1}. {categoryLabels[category]}
                </h3>
                
                <div className="space-y-2">
                  {docs.map((doc, docIndex) => (
                    <div
                      key={doc.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 print:hover:bg-transparent"
                    >
                      <div className="mt-0.5 print:mt-0">
                        {checkedDocuments.has(doc.id) ? (
                          <CheckSquare className="h-5 w-5 text-green-600 print:text-black" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400 print:text-black" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">
                            {categoryIndex + 1}-{docIndex + 1}. {doc.name}
                          </span>
                          {doc.required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded print:bg-transparent print:border print:border-red-700">
                              必須
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          {doc.description}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">必要理由:</span> {doc.reason}
                        </div>
                        
                        {doc.notes && (
                          <p className="text-xs text-gray-400 mt-1">
                            ※ {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* メモ欄 */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <h3 className="font-bold text-lg mb-3">メモ・備考欄</h3>
            <div className="border border-gray-300 rounded-lg p-4 min-h-[100px] bg-gray-50 print:bg-white">
              <div className="text-sm text-gray-400 print:hidden">
                印刷後、こちらに手書きでメモを記入できます
              </div>
              <div className="hidden print:block h-24"></div>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 print:text-black">
            <p>※ このチェックリストは診断結果に基づく参考情報です。</p>
            <p>※ 実際の申請時には最新の公募要領をご確認ください。</p>
            <p>※ 申請内容によっては追加書類が必要になる場合があります。</p>
          </div>
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          ${printRef.current ? '#print-area, #print-area *' : ''} {
            visibility: visible;
          }
          
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:border {
            border-width: 1px !important;
          }
          
          .print\\:text-black {
            color: black !important;
          }
          
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:bg-transparent {
            background-color: transparent !important;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentCheckList;