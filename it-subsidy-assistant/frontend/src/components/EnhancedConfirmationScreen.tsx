import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, CheckCircle, Edit, ArrowLeft, Wand2, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import InlineEditor from './InlineEditor';
import FigmaIntegration from './FigmaIntegration';
import { DocumentGenerator } from '../utils/documentGenerator';
import DocumentFieldSummary from './DocumentFieldSummary';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
  subsidyType?: string;
  companyData?: any;
  questionnaireData?: any;
  onBack: () => void;
  onEdit: (documentIndex: number) => void;
}

const EnhancedConfirmationScreen: React.FC<EnhancedConfirmationScreenProps> = ({
  requiredDocuments,
  formData: initialFormData,
  subsidyName,
  subsidyType,
  companyData,
  questionnaireData,
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
      // 新しいDocumentGeneratorを使用
      if (subsidyType) {
        const generator = new DocumentGenerator();
        const documentIds = requiredDocuments.map(doc => doc.id);
        // companyDataとquestionnaireDataも渡す（asyncメソッドなのでawait）
        await generator.generateExcel(subsidyType, documentIds, formData, companyData, questionnaireData);
      } else {
        // 旧来の方式（後方互換性のため）
        const workbook = generateExcelData();
        const timestamp = new Date().toISOString().split('T')[0];
        const templateSuffix = appliedTemplate ? `_${appliedTemplate}` : '';
        const filename = `${subsidyName}_申請書類${templateSuffix}_${timestamp}.xlsx`;
        XLSX.writeFile(workbook, filename);
      }
      
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle size={32} className="text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900">申請書類の確認・編集</h1>
        </div>
        <p className="text-gray-600">
          内容を確認・編集してExcelファイルをダウンロードしてください
        </p>
      </div>

      {/* 編集モード切り替え & 保存 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => setInlineEditMode(!inlineEditMode)}
            variant={inlineEditMode ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2",
              inlineEditMode && "bg-blue-500 hover:bg-blue-600"
            )}
          >
            <Edit size={16} />
            {inlineEditMode ? '編集モード終了' : 'インライン編集モード'}
          </Button>
          
          {appliedTemplate && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
              <Wand2 size={14} />
              テンプレート適用済み: {appliedTemplate}
            </Badge>
          )}
        </div>

        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Button
                onClick={handleSaveAll}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Save size={16} />
                変更を保存
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 完了ステータス */}
      <motion.div layout>
        <Card className={cn(
          "mb-8",
          allDocumentsComplete 
            ? "bg-green-50 border-green-500 border-2" 
            : "bg-amber-50 border-amber-500 border-2"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              {allDocumentsComplete ? (
                <>
                  <CheckCircle size={24} className="text-green-500" />
                  <h3 className="text-lg font-bold text-green-800">
                    すべての書類が完成しました！
                  </h3>
                </>
              ) : (
                <>
                  <FileText size={24} className="text-amber-500" />
                  <h3 className="text-lg font-bold text-amber-800">
                    一部の書類が未完成です
                  </h3>
                </>
              )}
            </div>
            
            <p className={cn(
              "text-sm text-center",
              allDocumentsComplete ? "text-green-700" : "text-amber-700"
            )}>
              {allDocumentsComplete 
                ? 'Excelファイルをダウンロードして申請手続きを進めてください。'
                : '未完成の書類を完成させてからダウンロードすることをお勧めします。'
              }
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 書類別必要情報サマリー（subsidyTypeが提供されている場合のみ表示） */}
      {subsidyType && companyData && questionnaireData && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            書類別必要情報の入力状況
          </h3>
          <div className="flex flex-col gap-4">
            {requiredDocuments.map((doc) => (
              <DocumentFieldSummary
                key={doc.id}
                subsidyType={subsidyType}
                documentId={doc.id}
                companyData={companyData}
                questionnaireData={questionnaireData}
              />
            ))}
          </div>
        </div>
      )}

      {/* 書類一覧 */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          書類プレビュー ({requiredDocuments.length}件)
        </h3>
        
        {requiredDocuments.map((doc, index) => {
          const status = getCompletionStatus(doc);
          const docData = formData[doc.id] || {};
          
          return (
            <motion.div key={doc.id} layout>
              <Card className={cn(
                "mb-4",
                status.isComplete
                  ? "bg-green-50 border-green-300"
                  : "bg-amber-50 border-amber-300"
              )}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        {status.isComplete ? (
                          <CheckCircle size={20} className="text-green-500 mt-0.5" />
                        ) : (
                          <FileText size={20} className="text-amber-500 mt-0.5" />
                        )}
                        <CardTitle className="text-base">
                          {index + 1}. {doc.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-gray-600 mb-3">
                        {doc.description}
                      </CardDescription>
                      
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(status.completed / status.total) * 100} 
                          className="w-32 h-2"
                        />
                        <span className={cn(
                          "text-sm font-semibold",
                          status.isComplete ? "text-green-700" : "text-amber-700"
                        )}>
                          {status.completed} / {status.total} 項目完了
                        </span>
                      </div>
                    </div>
                    
                    {!inlineEditMode && (
                      <Button
                        onClick={() => onEdit(index)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Edit size={16} />
                        編集
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="bg-white/80 rounded-lg p-3">
                    {doc.template_questions.map((question, qIndex) => {
                      const answer = docData[qIndex] || '';
                      const isEditing = editingField?.docId === doc.id && editingField?.questionIndex === qIndex;
                      
                      return (
                        <div key={qIndex} className="mb-4 last:mb-0">
                          <div className="text-sm font-semibold text-gray-700 mb-2">
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
                              className={cn(
                                "text-sm p-3 rounded-md min-h-[40px] leading-relaxed cursor-pointer",
                                "border transition-all duration-200",
                                answer 
                                  ? "text-gray-900 bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-300" 
                                  : "text-gray-400 bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-300"
                              )}
                              onClick={() => {
                                setInlineEditMode(true);
                                setEditingField({ docId: doc.id, questionIndex: qIndex });
                              }}
                            >
                              {answer || '（未記入） - クリックして編集'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onBack}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft size={16} />
          書類作成に戻る
        </Button>

        <div className="flex gap-3 items-center">
          <AnimatePresence>
            {exportComplete && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Badge variant="secondary" className="bg-green-100 text-green-700 px-4 py-2">
                  ✓ ダウンロード完了！
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            onClick={handleExport}
            disabled={isExporting}
            size="lg"
            className="gap-2"
          >
            <Download size={20} />
            <span>
              {isExporting 
                ? 'Excel出力中...' 
                : 'Excelファイルをダウンロード'
              }
            </span>
          </Button>
        </div>
      </div>

      {/* Figma統合パネル */}
      <FigmaIntegration
        documentContent={JSON.stringify(formData)}
        onTemplateApply={handleTemplateApply}
        onLayoutGenerate={handleLayoutGenerate}
      />

      {/* 注意事項 */}
      <Alert className="mt-8 border-blue-200 bg-blue-50">
        <AlertTitle className="text-blue-900">ご注意</AlertTitle>
        <AlertDescription>
          <ul className="text-sm text-blue-800 pl-4 mt-2 space-y-1 list-disc">
            <li>インライン編集で直接内容を修正できます</li>
            <li>Figma統合でプロフェッショナルなレイアウトを適用できます</li>
            <li>変更は自動保存されますが、重要な変更後は手動保存を推奨します</li>
            <li>ダウンロードしたExcelファイルは申請書類の下書きです</li>
            <li>正式な申請前に内容をよく確認してください</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnhancedConfirmationScreen;