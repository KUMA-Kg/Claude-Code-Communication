import React, { useState } from 'react';
import { Download, FileText, CheckCircle, Edit, ArrowLeft } from 'lucide-react';
import { styles } from '../styles';
import * as XLSX from 'xlsx';

interface DocumentRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  template_questions: string[];
}

interface FormData {
  [documentId: string]: {
    [questionIndex: string]: string;
  };
}

interface ConfirmationScreenProps {
  requiredDocuments: DocumentRequirement[];
  formData: FormData;
  subsidyName: string;
  onBack: () => void;
  onEdit: (documentIndex: number) => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  requiredDocuments,
  formData,
  subsidyName,
  onBack,
  onEdit
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const generateExcelData = () => {
    const workbook = XLSX.utils.book_new();

    // サマリーシート
    const summaryData = [
      ['補助金申請書類', ''],
      ['補助金名', subsidyName],
      ['作成日時', new Date().toLocaleString('ja-JP')],
      ['書類数', requiredDocuments.length],
      ['', ''],
      ['書類一覧', ''],
      ...requiredDocuments.map((doc, index) => [`${index + 1}. ${doc.name}`, doc.description])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'サマリー');

    // 各書類のシート
    requiredDocuments.forEach((doc, docIndex) => {
      const docData = formData[doc.id] || {};
      const sheetData = [
        [doc.name],
        ['説明: ' + doc.description],
        [''],
        ['項目', '内容'],
        ...doc.template_questions.map((question, qIndex) => [
          question,
          docData[qIndex] || '（未記入）'
        ])
      ];
      
      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // 列幅の調整
      sheet['!cols'] = [
        { width: 30 }, // 項目列
        { width: 60 }  // 内容列
      ];
      
      // セルのスタイル設定（ヘッダー）
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:B1');
      for (let row = 0; row <= 3; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (sheet[cellRef]) {
            sheet[cellRef].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'EEEEEE' } }
            };
          }
        }
      }
      
      const sheetName = `${docIndex + 1}_${doc.name.replace(/[\\/:*?"<>|]/g, '_')}`;
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName.substring(0, 31));
    });

    return workbook;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const workbook = generateExcelData();
      const filename = `${subsidyName}_申請書類_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // ファイルをダウンロード
      XLSX.writeFile(workbook, filename);
      
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error('Excel出力エラー:', error);
      alert('Excel出力中にエラーが発生しました。');
    } finally {
      setIsExporting(false);
    }
  };

  const getCompletionStatus = (doc: DocumentRequirement) => {
    const docData = formData[doc.id] || {};
    const completedQuestions = doc.template_questions.filter((_, index) => 
      docData[index] && docData[index].trim().length > 0
    ).length;
    
    return {
      completed: completedQuestions,
      total: doc.template_questions.length,
      isComplete: completedQuestions === doc.template_questions.length
    };
  };

  const allDocumentsComplete = requiredDocuments.every(doc => 
    getCompletionStatus(doc).isComplete
  );

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <CheckCircle size={32} color="#22c55e" />
          <h1 style={styles.text.title}>申請書類の確認</h1>
        </div>
        <p style={styles.text.subtitle}>
          入力内容を確認してExcelファイルをダウンロードしてください
        </p>
      </div>

      {/* 完了ステータス */}
      <div style={{ 
        ...styles.card, 
        marginBottom: '32px',
        backgroundColor: allDocumentsComplete ? '#f0fdf4' : '#fef3c7',
        border: allDocumentsComplete ? '2px solid #22c55e' : '2px solid #f59e0b'
      }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          {allDocumentsComplete ? (
            <>
              <CheckCircle size={24} color="#22c55e" />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                すべての書類が完成しました！
              </h3>
            </>
          ) : (
            <>
              <FileText size={24} color="#f59e0b" />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400e' }}>
                一部の書類が未完成です
              </h3>
            </>
          )}
        </div>
        
        <div style={{ fontSize: '14px', color: allDocumentsComplete ? '#166534' : '#92400e' }}>
          {allDocumentsComplete 
            ? 'Excelファイルをダウンロードして申請手続きを進めてください。'
            : '未完成の書類を完成させてからダウンロードすることをお勧めします。'
          }
        </div>
      </div>

      {/* 書類一覧 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          書類一覧 ({requiredDocuments.length}件)
        </h3>
        
        {requiredDocuments.map((doc, index) => {
          const status = getCompletionStatus(doc);
          const docData = formData[doc.id] || {};
          
          return (
            <div
              key={doc.id}
              style={{
                ...styles.card,
                marginBottom: '16px',
                backgroundColor: status.isComplete ? '#f0fdf4' : '#fef3c7',
                border: status.isComplete ? '1px solid #22c55e' : '1px solid #f59e0b'
              }}
            >
              <div style={{ ...styles.flex.between, alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...styles.flex.start, gap: '12px', marginBottom: '8px' }}>
                    {status.isComplete ? (
                      <CheckCircle size={20} color="#22c55e" />
                    ) : (
                      <FileText size={20} color="#f59e0b" />
                    )}
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      {index + 1}. {doc.name}
                    </h4>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                    {doc.description}
                  </p>
                  
                  <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                    <span style={{ 
                      color: status.isComplete ? '#166534' : '#92400e',
                      fontWeight: 'bold'
                    }}>
                      入力状況: {status.completed} / {status.total} 項目完了
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => onEdit(index)}
                  style={{
                    ...styles.button.secondary,
                    padding: '8px 12px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Edit size={16} />
                  編集
                </button>
              </div>

              {/* 質問と回答のプレビュー */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                {doc.template_questions.map((question, qIndex) => {
                  const answer = docData[qIndex] || '';
                  
                  return (
                    <div key={qIndex} style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        {qIndex + 1}. {question}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: answer ? '#111827' : '#9ca3af',
                        backgroundColor: answer ? 'transparent' : '#f9fafb',
                        padding: '8px',
                        borderRadius: '4px',
                        minHeight: '20px',
                        maxHeight: '60px',
                        overflow: 'hidden'
                      }}>
                        {answer || '（未記入）'}
                        {answer && answer.length > 100 && '...'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* アクションボタン */}
      <div style={{ ...styles.flex.between, alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            ...styles.button.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} />
          書類作成に戻る
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {exportComplete && (
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ✓ ダウンロード完了！
            </div>
          )}
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              ...styles.button.primary,
              backgroundColor: isExporting ? '#9ca3af' : '#2563eb',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '12px 24px'
            }}
          >
            <Download size={20} />
            <span>
              {isExporting 
                ? 'Excel出力中...' 
                : 'Excelファイルをダウンロード'
              }
            </span>
          </button>
        </div>
      </div>

      {/* 注意事項 */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '8px' }}>
          ご注意
        </h4>
        <ul style={{ fontSize: '13px', color: '#0c4a6e', paddingLeft: '16px', margin: 0 }}>
          <li>ダウンロードしたExcelファイルは申請書類の下書きです</li>
          <li>正式な申請前に内容をよく確認してください</li>
          <li>補助金の申請方法は各制度の公式サイトをご確認ください</li>
          <li>不明な点は申請先の事務局にお問い合わせください</li>
        </ul>
      </div>
    </div>
  );
};

export default ConfirmationScreen;