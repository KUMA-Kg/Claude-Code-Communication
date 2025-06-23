import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, CheckCircle, Edit, ArrowLeft, Wand2, Save } from 'lucide-react';
import { styles } from '../styles';
import * as XLSX from 'xlsx';
import InlineEditor from './InlineEditor';
import FigmaIntegration from './FigmaIntegration';

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

interface EnhancedConfirmationScreenProps {
  requiredDocuments: DocumentRequirement[];
  formData: FormData;
  subsidyName: string;
  onBack: () => void;
  onEdit: (documentIndex: number) => void;
}

const EnhancedConfirmationScreen: React.FC<EnhancedConfirmationScreenProps> = ({
  requiredDocuments,
  formData: initialFormData,
  subsidyName,
  onBack,
  onEdit
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [editingField, setEditingField] = useState<{docId: string, questionIndex: number} | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  // インライン編集の保存
  const handleInlineSave = useCallback((docId: string, questionIndex: number, newContent: string) => {
    setFormData(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [questionIndex]: newContent
      }
    }));
    setHasUnsavedChanges(true);
    setEditingField(null);
    
    // 自動保存
    setTimeout(() => {
      setHasUnsavedChanges(false);
    }, 1000);
  }, []);

  // 一括保存
  const handleSaveAll = () => {
    setHasUnsavedChanges(false);
    // 実際のアプリケーションでは、ここでAPIに保存
    console.log('Saving all changes:', formData);
  };

  const generateExcelData = () => {
    const workbook = XLSX.utils.book_new();

    // サマリーシート
    const summaryData = [
      ['補助金申請書類', ''],
      ['補助金名', subsidyName],
      ['作成日時', new Date().toLocaleString('ja-JP')],
      ['書類数', requiredDocuments.length],
      ['適用テンプレート', appliedTemplate || 'デフォルト'],
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
      const timestamp = new Date().toISOString().split('T')[0];
      const templateSuffix = appliedTemplate ? `_${appliedTemplate}` : '';
      const filename = `${subsidyName}_申請書類${templateSuffix}_${timestamp}.xlsx`;
      
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

  // Figma統合コールバック
  const handleTemplateApply = (templateId: string) => {
    setAppliedTemplate(templateId);
  };

  const handleLayoutGenerate = (layout: any) => {
    console.log('Generated layout:', layout);
    // レイアウトを適用する処理
  };

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <CheckCircle size={32} color="#22c55e" />
          <h1 style={styles.text.title}>申請書類の確認・編集</h1>
        </div>
        <p style={styles.text.subtitle}>
          内容を確認・編集してExcelファイルをダウンロードしてください
        </p>
      </div>

      {/* 編集モード切り替え & 保存 */}
      <div style={{ ...styles.flex.between, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setInlineEditMode(!inlineEditMode)}
            style={{
              ...styles.button.secondary,
              backgroundColor: inlineEditMode ? '#dbeafe' : undefined,
              border: inlineEditMode ? '2px solid #2563eb' : undefined
            }}
          >
            <Edit size={16} />
            {inlineEditMode ? '編集モード終了' : 'インライン編集モード'}
          </button>
          
          {appliedTemplate && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '6px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Wand2 size={14} />
              テンプレート適用済み: {appliedTemplate}
            </div>
          )}
        </div>

        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleSaveAll}
              style={{
                ...styles.button.primary,
                backgroundColor: '#059669'
              }}
            >
              <Save size={16} />
              変更を保存
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 完了ステータス */}
      <motion.div 
        style={{ 
          ...styles.card, 
          marginBottom: '32px',
          backgroundColor: allDocumentsComplete ? '#f0fdf4' : '#fef3c7',
          border: allDocumentsComplete ? '2px solid #22c55e' : '2px solid #f59e0b'
        }}
        layout
      >
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
      </motion.div>

      {/* 書類一覧 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          書類一覧 ({requiredDocuments.length}件)
        </h3>
        
        {requiredDocuments.map((doc, index) => {
          const status = getCompletionStatus(doc);
          const docData = formData[doc.id] || {};
          
          return (
            <motion.div
              key={doc.id}
              layout
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
                
                {!inlineEditMode && (
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
                )}
              </div>

              {/* 質問と回答のプレビュー/編集 */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                {doc.template_questions.map((question, qIndex) => {
                  const answer = docData[qIndex] || '';
                  const isEditing = editingField?.docId === doc.id && editingField?.questionIndex === qIndex;
                  
                  return (
                    <div key={qIndex} style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        {qIndex + 1}. {question}
                      </div>
                      
                      {inlineEditMode ? (
                        <InlineEditor
                          initialContent={answer}
                          onSave={(content) => handleInlineSave(doc.id, qIndex, content)}
                          placeholder="内容を入力してください..."
                          autoSave={true}
                          showDiff={true}
                        />
                      ) : (
                        <div 
                          style={{ 
                            fontSize: '13px', 
                            color: answer ? '#111827' : '#9ca3af',
                            backgroundColor: answer ? 'transparent' : '#f9fafb',
                            padding: '12px',
                            borderRadius: '6px',
                            minHeight: '40px',
                            lineHeight: '1.6',
                            cursor: 'pointer',
                            border: '1px solid transparent',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setInlineEditMode(true);
                            setEditingField({ docId: doc.id, questionIndex: qIndex });
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = answer ? 'transparent' : '#f9fafb';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          {answer || '（未記入） - クリックして編集'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
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
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✓ ダウンロード完了！
            </motion.div>
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

      {/* Figma統合パネル */}
      <FigmaIntegration
        documentContent={JSON.stringify(formData)}
        onTemplateApply={handleTemplateApply}
        onLayoutGenerate={handleLayoutGenerate}
      />

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
          <li>インライン編集で直接内容を修正できます</li>
          <li>Figma統合でプロフェッショナルなレイアウトを適用できます</li>
          <li>変更は自動保存されますが、重要な変更後は手動保存を推奨します</li>
          <li>ダウンロードしたExcelファイルは申請書類の下書きです</li>
          <li>正式な申請前に内容をよく確認してください</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedConfirmationScreen;