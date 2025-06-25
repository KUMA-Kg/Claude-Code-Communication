import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import MagicParticles from './MagicParticles';
import DocumentMagicAIService from '../../services/DocumentMagicAIService';
import './DocumentMagicStudio.css';

// ブロックタイプの定義
interface DocumentBlock {
  id: string;
  type: 'title' | 'section' | 'text' | 'list' | 'table' | 'image' | 'smart';
  content: any;
  position: number;
  aiSuggestions?: string[];
  isCompleted?: boolean;
}

// テンプレートの定義
interface DocumentTemplate {
  id: string;
  name: string;
  icon: string;
  blocks: Omit<DocumentBlock, 'id' | 'position'>[];
  category: 'it-donyu' | 'monozukuri' | 'jizokuka';
}

// AI提案の定義
interface AISuggestion {
  text: string;
  confidence: number;
  category: string;
}

// ドラッグ可能なブロックコンポーネント
const DraggableBlock: React.FC<{
  block: DocumentBlock;
  index: number;
  moveBlock: (dragIndex: number, hoverIndex: number) => void;
  updateBlock: (id: string, updates: Partial<DocumentBlock>) => void;
  deleteBlock: (id: string) => void;
  onAIComplete: (id: string) => void;
}> = ({ block, index, moveBlock, updateBlock, deleteBlock, onAIComplete }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);

  const [{ handlerId }, drop] = useDrop({
    accept: 'block',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveBlock(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: () => {
      return { id: block.id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  // AI自動補完のシミュレーション
  const handleAIAutoComplete = useCallback(async () => {
    setShowAISuggestions(false);
    
    // マジカルなアニメーション効果
    const element = ref.current;
    if (element) {
      element.classList.add('magic-effect');
      setTimeout(() => {
        element.classList.remove('magic-effect');
      }, 1000);
    }

    // AIサービスのインスタンスを取得
    const aiService = DocumentMagicAIService.getInstance();
    
    // コンテキスト情報を準備
    const context = {
      subsidyType: 'it-donyu', // 実際にはpropsから取得
      companyType: 'manufacturing',
      industry: 'manufacturing',
      currentContent: localContent || '',
      blockType: block.type
    };

    try {
      // AI補完の実行
      const aiContent = await aiService.generateCompletion(context);
      
      updateBlock(block.id, { content: aiContent, isCompleted: true });
      setLocalContent(aiContent);
      onAIComplete(block.id);
    } catch (error) {
      console.error('AI補完エラー:', error);
      // エラー時はフォールバック
      updateBlock(block.id, { isCompleted: true });
    }
  }, [block, updateBlock, localContent, onAIComplete]);

  // コンテンツのレンダリング
  const renderContent = () => {
    switch (block.type) {
      case 'title':
        return (
          <h2 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => {
              setIsEditing(false);
              const newContent = e.currentTarget.textContent || '';
              setLocalContent(newContent);
              updateBlock(block.id, { content: newContent });
            }}
            onClick={() => setIsEditing(true)}
            className="block-title"
          >
            {localContent || 'タイトルを入力...'}
          </h2>
        );
      
      case 'section':
      case 'text':
        return (
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => {
              setIsEditing(false);
              const newContent = e.currentTarget.textContent || '';
              setLocalContent(newContent);
              updateBlock(block.id, { content: newContent });
            }}
            onClick={() => setIsEditing(true)}
            className="block-text"
          >
            {localContent || 'テキストを入力...'}
          </div>
        );
      
      case 'list':
        return (
          <div className="block-list">
            {Array.isArray(localContent) ? (
              localContent.map((item, idx) => (
                <div key={idx} className="list-item">{item}</div>
              ))
            ) : (
              <div className="placeholder">リスト項目を追加...</div>
            )}
          </div>
        );
      
      case 'table':
        return (
          <div className="block-table">
            {localContent?.headers ? (
              <table>
                <thead>
                  <tr>
                    {localContent.headers.map((header: string, idx: number) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localContent.rows?.map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx}>
                      {row.map((cell: string, cellIdx: number) => (
                        <td key={cellIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="placeholder">表を作成...</div>
            )}
          </div>
        );
      
      case 'smart':
        return (
          <div className="block-smart">
            <div className="smart-prompt">
              <input 
                type="text" 
                placeholder="AIに質問を入力（例：導入効果を詳しく説明して）"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAIAutoComplete();
                  }
                }}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={ref}
      data-handler-id={handlerId}
      className={`document-block ${block.type} ${isDragging ? 'dragging' : ''} ${block.isCompleted ? 'completed' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="block-header">
        <div className="block-handle">⋮⋮</div>
        <div className="block-type-label">
          {block.type === 'title' && '📝 タイトル'}
          {block.type === 'section' && '📄 セクション'}
          {block.type === 'text' && '📃 テキスト'}
          {block.type === 'list' && '📋 リスト'}
          {block.type === 'table' && '📊 表'}
          {block.type === 'smart' && '✨ スマートブロック'}
        </div>
        <div className="block-actions">
          {!block.isCompleted && (
            <button
              className="ai-complete-btn"
              onClick={handleAIAutoComplete}
              title="AI自動補完"
            >
              ✨ AI補完
            </button>
          )}
          <button
            className="delete-btn"
            onClick={() => deleteBlock(block.id)}
            title="削除"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="block-content">
        {renderContent()}
      </div>

      {showAISuggestions && block.aiSuggestions && (
        <div className="ai-suggestions">
          <div className="suggestions-header">✨ AI提案</div>
          {block.aiSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => {
                setLocalContent(suggestion);
                updateBlock(block.id, { content: suggestion });
                setShowAISuggestions(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// メインコンポーネント
const DocumentMagicStudio: React.FC<{
  subsidyType?: string;
  initialData?: any;
  onSave?: (data: any) => void;
  onExport?: (format: 'pdf' | 'word' | 'excel') => void;
}> = ({ subsidyType = 'it-donyu', initialData, onSave, onExport }) => {
  const aiService = DocumentMagicAIService.getInstance();
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [magicEffects, setMagicEffects] = useState(true);
  const [aiAssistLevel, setAiAssistLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [documentProgress, setDocumentProgress] = useState(0);

  // テンプレートデータ
  const templates: DocumentTemplate[] = [
    {
      id: 'it-basic',
      name: 'IT導入補助金 基本テンプレート',
      icon: '💻',
      category: 'it-donyu',
      blocks: [
        { type: 'title', content: '' },
        { type: 'section', content: '1. 事業概要' },
        { type: 'text', content: '' },
        { type: 'section', content: '2. 導入するITツール' },
        { type: 'list', content: [] },
        { type: 'section', content: '3. 期待される効果' },
        { type: 'table', content: {} },
        { type: 'smart', content: '' }
      ]
    },
    {
      id: 'monozukuri-basic',
      name: 'ものづくり補助金 基本テンプレート',
      icon: '🏭',
      category: 'monozukuri',
      blocks: [
        { type: 'title', content: '' },
        { type: 'section', content: '1. 革新的サービスの内容' },
        { type: 'text', content: '' },
        { type: 'section', content: '2. 実施内容' },
        { type: 'text', content: '' },
        { type: 'section', content: '3. 将来の展望' },
        { type: 'text', content: '' }
      ]
    },
    {
      id: 'jizokuka-basic',
      name: '持続化補助金 基本テンプレート',
      icon: '🌱',
      category: 'jizokuka',
      blocks: [
        { type: 'title', content: '' },
        { type: 'section', content: '1. 経営計画' },
        { type: 'text', content: '' },
        { type: 'section', content: '2. 補助事業計画' },
        { type: 'list', content: [] },
        { type: 'section', content: '3. 収支計画' },
        { type: 'table', content: {} }
      ]
    }
  ];

  // ブロックタイプのアイコンマップ
  const blockTypeIcons = {
    title: '📝',
    section: '📄',
    text: '📃',
    list: '📋',
    table: '📊',
    image: '🖼️',
    smart: '✨'
  };

  // テンプレート選択時の処理
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newBlocks = template.blocks.map((block, index) => ({
        ...block,
        id: `block-${Date.now()}-${index}`,
        position: index
      }));
      setBlocks(newBlocks);
      setSelectedTemplate(templateId);
      setShowTemplates(false);
      
      // マジカルエフェクト
      setTimeout(() => {
        setDocumentProgress(20);
      }, 500);
    }
  };

  // ブロックの移動
  const moveBlock = useCallback((dragIndex: number, hoverIndex: number) => {
    const dragBlock = blocks[dragIndex];
    const newBlocks = [...blocks];
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, dragBlock);
    
    // ポジションの更新
    const updatedBlocks = newBlocks.map((block, index) => ({
      ...block,
      position: index
    }));
    
    setBlocks(updatedBlocks);
  }, [blocks]);

  // ブロックの更新
  const updateBlock = useCallback((id: string, updates: Partial<DocumentBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  // ブロックの削除
  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const newBlocks = prev.filter(block => block.id !== id);
      return newBlocks.map((block, index) => ({
        ...block,
        position: index
      }));
    });
  }, []);

  // 新しいブロックの追加
  const addBlock = (type: DocumentBlock['type']) => {
    const newBlock: DocumentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'list' ? [] : type === 'table' ? {} : '',
      position: blocks.length
    };
    setBlocks([...blocks, newBlock]);
  };

  // AI補完完了時の処理
  const handleAIComplete = useCallback((blockId: string) => {
    // プログレスの更新
    const completedBlocks = blocks.filter(b => b.isCompleted).length + 1;
    const progress = Math.min(90, (completedBlocks / blocks.length) * 80 + 20);
    setDocumentProgress(progress);

    // 全ブロック完了時の処理
    if (completedBlocks === blocks.length) {
      setTimeout(() => {
        setDocumentProgress(100);
      }, 500);
    }
  }, [blocks]);

  // エクスポート処理
  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    if (onExport) {
      onExport(format);
    } else {
      // デフォルトのエクスポート処理
      console.log(`Exporting as ${format}...`);
      // 実際のエクスポート処理をここに実装
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="document-magic-studio">
        {/* 背景のパーティクル効果 */}
        {magicEffects && (
          <div className="magic-particles">
            <MagicParticles count={40} interactive={true} />
          </div>
        )}

        {/* ヘッダー */}
        <div className="studio-header">
          <h1>
            <span className="magic-icon">🎨</span>
            Document Magic Studio
          </h1>
          <div className="header-controls">
            <button
              className={`mode-toggle ${!isPreviewMode ? 'active' : ''}`}
              onClick={() => setIsPreviewMode(false)}
            >
              編集モード
            </button>
            <button
              className={`mode-toggle ${isPreviewMode ? 'active' : ''}`}
              onClick={() => setIsPreviewMode(true)}
            >
              プレビュー
            </button>
            <div className="ai-assist-control">
              <label>AIアシスト:</label>
              <select 
                value={aiAssistLevel} 
                onChange={(e) => setAiAssistLevel(e.target.value as any)}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <button
              className="magic-toggle"
              onClick={() => setMagicEffects(!magicEffects)}
              title="マジックエフェクト"
            >
              {magicEffects ? '✨' : '🌙'}
            </button>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="document-progress">
          <div className="progress-label">
            文書作成進捗: {documentProgress}%
          </div>
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${documentProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="studio-body">
          {/* 左サイドバー - ブロックパレット */}
          <div className="block-palette">
            <h3>ブロック追加</h3>
            <div className="block-types">
              {Object.entries(blockTypeIcons).map(([type, icon]) => (
                <button
                  key={type}
                  className="block-type-btn"
                  onClick={() => addBlock(type as DocumentBlock['type'])}
                  disabled={isPreviewMode}
                >
                  <span className="block-icon">{icon}</span>
                  <span className="block-label">
                    {type === 'title' && 'タイトル'}
                    {type === 'section' && 'セクション'}
                    {type === 'text' && 'テキスト'}
                    {type === 'list' && 'リスト'}
                    {type === 'table' && '表'}
                    {type === 'image' && '画像'}
                    {type === 'smart' && 'スマート'}
                  </span>
                </button>
              ))}
            </div>

            <div className="template-selector">
              <h3>テンプレート</h3>
              {templates.map(template => (
                <button
                  key={template.id}
                  className={`template-btn ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <span className="template-icon">{template.icon}</span>
                  <span className="template-name">{template.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* メインエディタエリア */}
          <div className="document-editor">
            {showTemplates && blocks.length === 0 ? (
              <div className="template-prompt">
                <h2>テンプレートを選択して開始</h2>
                <p>左側のテンプレートから選択するか、ブロックを追加して独自の文書を作成できます</p>
              </div>
            ) : isPreviewMode ? (
              <div className="document-preview">
                {blocks.map(block => (
                  <div key={block.id} className={`preview-block ${block.type}`}>
                    {block.type === 'title' && <h1>{block.content}</h1>}
                    {block.type === 'section' && <h2>{block.content}</h2>}
                    {block.type === 'text' && <p>{block.content}</p>}
                    {block.type === 'list' && Array.isArray(block.content) && (
                      <ul>
                        {block.content.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {block.type === 'table' && block.content.headers && (
                      <table>
                        <thead>
                          <tr>
                            {block.content.headers.map((header: string, idx: number) => (
                              <th key={idx}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.content.rows?.map((row: string[], rowIdx: number) => (
                            <tr key={rowIdx}>
                              {row.map((cell: string, cellIdx: number) => (
                                <td key={cellIdx}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                {blocks.map((block, index) => (
                  <DraggableBlock
                    key={block.id}
                    block={block}
                    index={index}
                    moveBlock={moveBlock}
                    updateBlock={updateBlock}
                    deleteBlock={deleteBlock}
                    onAIComplete={handleAIComplete}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* 右サイドバー - AI提案とエクスポート */}
          <div className="ai-sidebar">
            <div className="ai-suggestions-panel">
              <h3>✨ AI提案</h3>
              <div className="suggestion-cards">
                <div className="suggestion-card">
                  <p>現在の内容に基づいて、「導入効果の数値化」セクションを追加することをお勧めします。</p>
                  <button className="apply-suggestion">適用</button>
                </div>
                <div className="suggestion-card">
                  <p>費用対効果の表を追加して、投資回収期間を明確にしましょう。</p>
                  <button className="apply-suggestion">適用</button>
                </div>
              </div>
            </div>

            <div className="export-panel">
              <h3>エクスポート</h3>
              <button 
                className="export-btn pdf"
                onClick={() => handleExport('pdf')}
                disabled={documentProgress < 100}
              >
                📄 PDF形式
              </button>
              <button 
                className="export-btn word"
                onClick={() => handleExport('word')}
                disabled={documentProgress < 100}
              >
                📝 Word形式
              </button>
              <button 
                className="export-btn excel"
                onClick={() => handleExport('excel')}
                disabled={documentProgress < 100}
              >
                📊 Excel形式
              </button>
              {documentProgress < 100 && (
                <p className="export-note">
                  文書を完成させてからエクスポートできます
                </p>
              )}
            </div>

            <div className="completion-stats">
              <h3>完成度</h3>
              <div className="stat-item">
                <span className="stat-label">完了ブロック:</span>
                <span className="stat-value">
                  {blocks.filter(b => b.isCompleted).length} / {blocks.length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">推定作成時間削減:</span>
                <span className="stat-value">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default DocumentMagicStudio;