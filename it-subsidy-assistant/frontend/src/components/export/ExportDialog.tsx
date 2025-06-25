import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File, 
  X, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useDarkModeColors } from '../../hooks/useDarkMode';
import { 
  exportData, 
  batchExport,
  EnhancedCSVExporter,
  EnhancedExcelExporter,
  EnhancedPDFExporter
} from '../../utils/enhancedExportUtils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    companyData: any;
    questionnaireData: any;
    subsidyType: string;
    subsidyName: string;
    matchingResults?: any[];
    applicationData?: any;
  };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const { colors } = useDarkModeColors();
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 詳細オプション
  const [csvOptions, setCsvOptions] = useState({
    includeHeaders: true,
    delimiter: ',',
    dateFormat: 'Japanese' as const,
    includeMetadata: true
  });
  
  const [excelOptions, setExcelOptions] = useState({
    multiSheet: true,
    includeSummary: true,
    formatting: true
  });
  
  const [pdfOptions, setPdfOptions] = useState({
    template: 'detailed' as const,
    pageSize: 'A4' as const,
    includeCharts: false
  });

  const formatOptions = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'コンマ区切り形式（Excel等で開ける）',
      icon: FileText,
      color: '#10b981',
      features: ['軽量', 'Excel対応', 'データ分析向け']
    },
    {
      id: 'excel',
      name: 'Excel',
      description: '高機能なスプレッドシート形式',
      icon: FileSpreadsheet,
      color: '#059669',
      features: ['複数シート', '書式設定', '関数対応']
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: '印刷・共有に最適な形式',
      icon: File,
      color: '#dc2626',
      features: ['レイアウト保持', '印刷対応', '共有向け']
    }
  ];

  const handleFormatToggle = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId)
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    );
  };

  const handleExport = async () => {
    if (selectedFormats.length === 0) {
      setExportStatus({
        success: false,
        message: '出力形式を選択してください'
      });
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      const exportData = {
        ...data,
        metadata: {
          exportedBy: 'IT補助金アシストツール',
          exportedAt: new Date(),
          version: '1.0.0'
        }
      };

      if (selectedFormats.length === 1) {
        const format = selectedFormats[0] as 'csv' | 'excel' | 'pdf';
        const options = format === 'csv' ? csvOptions : 
                      format === 'excel' ? excelOptions : pdfOptions;
        
        await exportData(exportData, format, options);
      } else {
        // バッチエクスポート
        const formats = selectedFormats as Array<'csv' | 'excel' | 'pdf'>;
        await batchExport(exportData, formats, {
          csv: csvOptions,
          excel: excelOptions,
          pdf: pdfOptions
        });
      }

      setExportStatus({
        success: true,
        message: `${selectedFormats.length}個のファイルを出力しました`
      });

      // 3秒後に自動的にダイアログを閉じる
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('エクスポートエラー:', error);
      setExportStatus({
        success: false,
        message: `出力に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="export-dialog-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="export-dialog"
          style={{
            background: colors.background,
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: `0 20px 40px ${colors.shadowLarge}`,
            border: `1px solid ${colors.border}`
          }}
        >
          {/* ヘッダー */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colors.text,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Download size={24} style={{ color: colors.primary }} />
                データ出力
              </h2>
              <p style={{
                color: colors.textSecondary,
                margin: '8px 0 0 0',
                fontSize: '14px'
              }}>
                {data.subsidyName}のデータを希望の形式で出力できます
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ステータス表示 */}
          <AnimatePresence>
            {exportStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: exportStatus.success ? colors.success + '20' : colors.error + '20',
                  border: `1px solid ${exportStatus.success ? colors.success : colors.error}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {exportStatus.success ? (
                  <CheckCircle size={20} style={{ color: colors.success }} />
                ) : (
                  <AlertCircle size={20} style={{ color: colors.error }} />
                )}
                <span style={{
                  color: exportStatus.success ? colors.success : colors.error,
                  fontWeight: '500'
                }}>
                  {exportStatus.message}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 形式選択 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.text,
              marginBottom: '16px'
            }}>
              出力形式を選択
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {formatOptions.map((format) => {
                const isSelected = selectedFormats.includes(format.id);
                const Icon = format.icon;
                
                return (
                  <motion.div
                    key={format.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFormatToggle(format.id)}
                    style={{
                      background: isSelected ? format.color + '10' : colors.backgroundSecondary,
                      border: `2px solid ${isSelected ? format.color : colors.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <Icon size={20} style={{ color: format.color }} />
                      <span style={{
                        fontWeight: '600',
                        color: colors.text
                      }}>
                        {format.name}
                      </span>
                      {isSelected && (
                        <CheckCircle size={16} style={{ color: format.color, marginLeft: 'auto' }} />
                      )}
                    </div>
                    
                    <p style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      margin: '0 0 8px 0',
                      lineHeight: '1.4'
                    }}>
                      {format.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      {format.features.map((feature, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '10px',
                            background: format.color + '20',
                            color: format.color,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 詳細オプション */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: colors.primary,
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              <Settings size={16} />
              詳細オプション
              <motion.span
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                style={{ marginLeft: '4px' }}
              >
                ↓
              </motion.span>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: colors.backgroundSecondary,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`
                  }}
                >
                  {/* CSV オプション */}
                  {selectedFormats.includes('csv') && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: colors.text,
                        marginBottom: '12px'
                      }}>
                        CSV オプション
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={csvOptions.includeHeaders}
                            onChange={(e) => setCsvOptions(prev => ({ 
                              ...prev, 
                              includeHeaders: e.target.checked 
                            }))}
                          />
                          <span style={{ fontSize: '12px', color: colors.text }}>
                            ヘッダー行を含める
                          </span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={csvOptions.includeMetadata}
                            onChange={(e) => setCsvOptions(prev => ({ 
                              ...prev, 
                              includeMetadata: e.target.checked 
                            }))}
                          />
                          <span style={{ fontSize: '12px', color: colors.text }}>
                            メタデータを含める
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Excel オプション */}
                  {selectedFormats.includes('excel') && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: colors.text,
                        marginBottom: '12px'
                      }}>
                        Excel オプション
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={excelOptions.multiSheet}
                            onChange={(e) => setExcelOptions(prev => ({ 
                              ...prev, 
                              multiSheet: e.target.checked 
                            }))}
                          />
                          <span style={{ fontSize: '12px', color: colors.text }}>
                            複数シートに分割
                          </span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={excelOptions.includeSummary}
                            onChange={(e) => setExcelOptions(prev => ({ 
                              ...prev, 
                              includeSummary: e.target.checked 
                            }))}
                          />
                          <span style={{ fontSize: '12px', color: colors.text }}>
                            サマリーシートを含める
                          </span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={excelOptions.formatting}
                            onChange={(e) => setExcelOptions(prev => ({ 
                              ...prev, 
                              formatting: e.target.checked 
                            }))}
                          />
                          <span style={{ fontSize: '12px', color: colors.text }}>
                            書式設定を適用
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* PDF オプション */}
                  {selectedFormats.includes('pdf') && (
                    <div>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: colors.text,
                        marginBottom: '12px'
                      }}>
                        PDF オプション
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: colors.text, minWidth: '60px' }}>
                            テンプレート:
                          </span>
                          <select
                            value={pdfOptions.template}
                            onChange={(e) => setPdfOptions(prev => ({ 
                              ...prev, 
                              template: e.target.value as any
                            }))}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              background: colors.background,
                              color: colors.text
                            }}
                          >
                            <option value="simple">シンプル</option>
                            <option value="detailed">詳細</option>
                            <option value="official">公式</option>
                          </select>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: colors.text, minWidth: '60px' }}>
                            用紙サイズ:
                          </span>
                          <select
                            value={pdfOptions.pageSize}
                            onChange={(e) => setPdfOptions(prev => ({ 
                              ...prev, 
                              pageSize: e.target.value as any
                            }))}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              background: colors.background,
                              color: colors.text
                            }}
                          >
                            <option value="A4">A4</option>
                            <option value="A3">A3</option>
                            <option value="Letter">Letter</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* アクションボタン */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              disabled={isExporting}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textSecondary,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isExporting ? 0.5 : 1
              }}
            >
              キャンセル
            </button>

            <button
              onClick={handleExport}
              disabled={selectedFormats.length === 0 || isExporting}
              style={{
                padding: '12px 24px',
                background: selectedFormats.length > 0 && !isExporting 
                  ? colors.primary 
                  : colors.textTertiary,
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: selectedFormats.length > 0 && !isExporting 
                  ? 'pointer' 
                  : 'not-allowed',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isExporting ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  出力中...
                </>
              ) : (
                <>
                  <Download size={16} />
                  出力実行
                </>
              )}
            </button>
          </div>

          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};