import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Figma, 
  Layers, 
  Eye, 
  Download, 
  Wand2, 
  Layout,
  Palette,
  Grid,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { styles } from '../styles';

interface FigmaTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'form' | 'report' | 'presentation' | 'dashboard';
  tags: string[];
}

interface FigmaIntegrationProps {
  documentContent: string;
  onTemplateApply: (templateId: string) => void;
  onLayoutGenerate: (layout: any) => void;
}

const FigmaIntegration: React.FC<FigmaIntegrationProps> = ({
  documentContent,
  onTemplateApply,
  onLayoutGenerate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FigmaTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLayout, setGeneratedLayout] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'design' | 'code'>('design');

  // モックFigmaテンプレート
  const figmaTemplates: FigmaTemplate[] = [
    {
      id: 'form-clean',
      name: 'クリーンフォーム',
      description: '申請書類に最適化されたクリーンなフォームレイアウト',
      thumbnail: '/api/placeholder/300/200',
      category: 'form',
      tags: ['minimal', 'professional', 'form']
    },
    {
      id: 'report-business',
      name: 'ビジネスレポート',
      description: '補助金申請書類向けのプロフェッショナルなレポート形式',
      thumbnail: '/api/placeholder/300/200',
      category: 'report',
      tags: ['business', 'formal', 'structured']
    },
    {
      id: 'presentation-modern',
      name: 'モダンプレゼン',
      description: '視覚的に訴求力の高いプレゼンテーション形式',
      thumbnail: '/api/placeholder/300/200',
      category: 'presentation',
      tags: ['modern', 'visual', 'engaging']
    },
    {
      id: 'dashboard-analytics',
      name: 'アナリティクス',
      description: 'データ分析結果を効果的に表示するダッシュボード',
      thumbnail: '/api/placeholder/300/200',
      category: 'dashboard',
      tags: ['data', 'charts', 'analytics']
    }
  ];

  // Figma MCPシミュレーション（実際のMCP統合時に置き換え）
  const simulateFigmaMCP = useCallback(async (action: string, params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // API呼び出しシミュレーション
    
    switch (action) {
      case 'generateLayout':
        return {
          components: [
            { type: 'header', content: 'タイトル部分', style: { fontSize: '24px', fontWeight: 'bold' } },
            { type: 'section', content: params.content.substring(0, 200), style: { padding: '16px' } },
            { type: 'footer', content: 'フッター部分', style: { fontSize: '12px', color: '#6b7280' } }
          ],
          layout: {
            type: 'vertical',
            spacing: '16px',
            maxWidth: '800px'
          },
          theme: {
            primaryColor: '#2563eb',
            backgroundColor: '#ffffff',
            borderRadius: '8px'
          }
        };
      
      case 'applyTemplate':
        return {
          template: params.templateId,
          generatedCSS: `
            .document-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 24px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .document-header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 16px;
              border-bottom: 2px solid #e5e7eb;
            }
            .document-content {
              line-height: 1.8;
              font-size: 16px;
              color: #374151;
            }
          `,
          components: ['header', 'content', 'footer']
        };
      
      default:
        return null;
    }
  }, []);

  // 自動レイアウト生成
  const handleGenerateLayout = async () => {
    setIsGenerating(true);
    
    try {
      const layout = await simulateFigmaMCP('generateLayout', {
        content: documentContent,
        type: 'document'
      });
      
      setGeneratedLayout(layout);
      onLayoutGenerate(layout);
    } catch (error) {
      console.error('Layout generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // テンプレート適用
  const handleApplyTemplate = async (template: FigmaTemplate) => {
    setIsGenerating(true);
    
    try {
      const result = await simulateFigmaMCP('applyTemplate', {
        templateId: template.id,
        content: documentContent
      });
      
      onTemplateApply(template.id);
      setSelectedTemplate(template);
      
      // 生成されたCSSを動的に適用
      if (result.generatedCSS) {
        const styleElement = document.createElement('style');
        styleElement.textContent = result.generatedCSS;
        document.head.appendChild(styleElement);
      }
    } catch (error) {
      console.error('Template application failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Figmaファイルエクスポート（シミュレーション）
  const handleExportToFigma = async () => {
    setIsGenerating(true);
    
    try {
      // 実際のFigma MCPでは、ここでFigmaファイルを生成・エクスポート
      await simulateFigmaMCP('exportToFigma', {
        content: documentContent,
        layout: generatedLayout
      });
      
      // シミュレーション: Figmaファイルリンクを表示
      const figmaUrl = `https://figma.com/file/mock-${Date.now()}`;
      window.open(figmaUrl, '_blank');
      
    } catch (error) {
      console.error('Figma export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Figma統合ボタン */}
      <motion.button
        onClick={() => setIsOpen(true)}
        style={{
          ...styles.button.secondary,
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          padding: '0',
          backgroundColor: '#ffffff',
          border: '2px solid #2563eb',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Figma統合機能"
      >
        <Figma size={24} color="#2563eb" />
      </motion.button>

      {/* Figma統合パネル */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1001
              }}
            />

            {/* パネル */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '400px',
                height: '100vh',
                backgroundColor: 'white',
                boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
                zIndex: 1002,
                overflow: 'auto'
              }}
            >
              <div style={{ padding: '24px' }}>
                {/* ヘッダー */}
                <div style={{ ...styles.flex.between, marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                    Figma統合
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ ...styles.button.secondary, padding: '8px' }}
                  >
                    ×
                  </button>
                </div>

                {/* 自動レイアウト生成 */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    <Wand2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    AIレイアウト生成
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                    文書内容を分析して最適なレイアウトを自動生成します
                  </p>
                  <button
                    onClick={handleGenerateLayout}
                    disabled={isGenerating}
                    style={{
                      ...styles.button.primary,
                      width: '100%',
                      opacity: isGenerating ? 0.7 : 1
                    }}
                  >
                    {isGenerating ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Layout size={16} />
                    )}
                    レイアウト生成
                  </button>
                </div>

                {/* テンプレート選択 */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    <Layers size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    デザインテンプレート
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {figmaTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        style={{
                          ...styles.card,
                          padding: '16px',
                          cursor: 'pointer',
                          border: selectedTemplate?.id === template.id ? '2px solid #2563eb' : '1px solid #e5e7eb'
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                            {template.name}
                          </h4>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>
                            {template.description}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                borderRadius: '4px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 生成結果プレビュー */}
                {generatedLayout && (
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ ...styles.flex.between, marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                        <Eye size={16} style={{ display: 'inline', marginRight: '8px' }} />
                        プレビュー
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => setPreviewMode('design')}
                          style={{
                            ...styles.button.secondary,
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: previewMode === 'design' ? '#dbeafe' : undefined
                          }}
                        >
                          デザイン
                        </button>
                        <button
                          onClick={() => setPreviewMode('code')}
                          style={{
                            ...styles.button.secondary,
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: previewMode === 'code' ? '#dbeafe' : undefined
                          }}
                        >
                          コード
                        </button>
                      </div>
                    </div>

                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {previewMode === 'design' ? (
                        <div>
                          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>レイアウト構造:</div>
                          {generatedLayout.components.map((comp: any, index: number) => (
                            <div key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
                              • {comp.type}: {comp.content.substring(0, 50)}...
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre style={{ margin: 0, fontSize: '11px' }}>
                          {JSON.stringify(generatedLayout, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* アクションボタン */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleExportToFigma}
                    disabled={!generatedLayout || isGenerating}
                    style={{
                      ...styles.button.primary,
                      opacity: (!generatedLayout || isGenerating) ? 0.5 : 1
                    }}
                  >
                    <ExternalLink size={16} />
                    Figmaにエクスポート
                  </button>
                  
                  <button
                    onClick={() => {
                      // カラーパレット調整機能
                      const colors = ['#2563eb', '#dc2626', '#059669', '#d97706'];
                      const randomColor = colors[Math.floor(Math.random() * colors.length)];
                      document.documentElement.style.setProperty('--primary-color', randomColor);
                    }}
                    style={styles.button.secondary}
                  >
                    <Palette size={16} />
                    カラー調整
                  </button>
                </div>

                {/* 統計情報 */}
                <div style={{
                  marginTop: '24px',
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    Figma統合統計
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>生成回数: {generatedLayout ? 1 : 0}</div>
                    <div>使用テンプレート: {selectedTemplate?.name || 'なし'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FigmaIntegration;