import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  Undo, 
  Redo, 
  Type, 
  Bold, 
  Italic, 
  List, 
  Eye,
  EyeOff,
  Sparkles,
  History,
  Check,
  X
} from 'lucide-react';
import { styles } from '../styles';

interface InlineEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  autoSave?: boolean;
  showDiff?: boolean;
}

interface EditHistory {
  id: string;
  content: string;
  timestamp: Date;
  action: 'edit' | 'save' | 'restore';
}

interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

const InlineEditor: React.FC<InlineEditorProps> = ({
  initialContent,
  onSave,
  onCancel,
  placeholder = "クリックして編集開始...",
  className = "",
  autoSave = true,
  showDiff = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showDiffMode, setShowDiffMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeout = useRef<NodeJS.Timeout>();

  // デバウンス付き自動保存
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    autoSaveTimeout.current = setTimeout(() => {
      if (content !== savedContent && content.trim()) {
        setIsAutoSaving(true);
        
        // ローカルストレージに保存
        const saveData = {
          content,
          timestamp: new Date().toISOString(),
          version: Date.now()
        };
        localStorage.setItem('inlineEditor_autoSave', JSON.stringify(saveData));
        
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    }, 300);
  }, [content, savedContent]);

  // 編集履歴の追加
  const addToHistory = useCallback((newContent: string, action: EditHistory['action']) => {
    const newEntry: EditHistory = {
      id: Date.now().toString(),
      content: newContent,
      timestamp: new Date(),
      action
    };
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newEntry]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // 差分計算
  const calculateDiff = useCallback((original: string, current: string): DiffSegment[] => {
    const originalWords = original.split(/(\s+)/);
    const currentWords = current.split(/(\s+)/);
    const diff: DiffSegment[] = [];
    
    let i = 0, j = 0;
    
    while (i < originalWords.length || j < currentWords.length) {
      if (i >= originalWords.length) {
        diff.push({ type: 'added', content: currentWords.slice(j).join('') });
        break;
      }
      
      if (j >= currentWords.length) {
        diff.push({ type: 'removed', content: originalWords.slice(i).join('') });
        break;
      }
      
      if (originalWords[i] === currentWords[j]) {
        diff.push({ type: 'unchanged', content: originalWords[i] });
        i++;
        j++;
      } else {
        // 簡単な差分検出（実際にはより sophisticated なアルゴリズムを使用）
        diff.push({ type: 'removed', content: originalWords[i] });
        diff.push({ type: 'added', content: currentWords[j] });
        i++;
        j++;
      }
    }
    
    return diff;
  }, []);

  // 編集開始
  const handleStartEdit = () => {
    setIsEditing(true);
    addToHistory(content, 'edit');
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        // カーソルを末尾に移動
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 100);
  };

  // 保存
  const handleSave = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      setSavedContent(trimmedContent);
      onSave(trimmedContent);
      addToHistory(trimmedContent, 'save');
      setLastSaved(new Date());
    }
    setIsEditing(false);
  };

  // キャンセル
  const handleCancel = () => {
    setContent(savedContent);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  // 元に戻す
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousEntry = history[historyIndex - 1];
      setContent(previousEntry.content);
      setHistoryIndex(prev => prev - 1);
    }
  };

  // やり直し
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      setContent(nextEntry.content);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // テキスト装飾
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerText);
    }
  };

  // キーボードショートカット
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
      }
    }
    
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // コンテンツ変更時の処理
  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerText;
      setContent(newContent);
      
      if (autoSave) {
        debouncedAutoSave();
      }
    }
  };

  // 自動復元
  useEffect(() => {
    const savedData = localStorage.getItem('inlineEditor_autoSave');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.content && parsed.content !== initialContent) {
          // 自動保存されたデータがある場合の復元確認
          const shouldRestore = window.confirm(
            '自動保存されたデータが見つかりました。復元しますか？'
          );
          if (shouldRestore) {
            setContent(parsed.content);
            addToHistory(parsed.content, 'restore');
          }
        }
      } catch (error) {
        console.error('自動保存データの復元に失敗:', error);
      }
    }
  }, [initialContent, addToHistory]);

  const diff = showDiff ? calculateDiff(savedContent, content) : [];
  const hasChanges = content !== savedContent;

  return (
    <div className={`inline-editor ${className}`} style={{ position: 'relative' }}>
      {/* ツールバー */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: '-60px',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000
            }}
          >
            {/* フォーマットボタン */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => applyFormat('bold')}
                style={{ ...styles.button.secondary, padding: '6px', fontSize: '12px' }}
                title="太字 (Ctrl+B)"
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => applyFormat('italic')}
                style={{ ...styles.button.secondary, padding: '6px', fontSize: '12px' }}
                title="斜体 (Ctrl+I)"
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => applyFormat('insertUnorderedList')}
                style={{ ...styles.button.secondary, padding: '6px', fontSize: '12px' }}
                title="箇条書き"
              >
                <List size={14} />
              </button>
            </div>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

            {/* 履歴ボタン */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                style={{ 
                  ...styles.button.secondary, 
                  padding: '6px', 
                  fontSize: '12px',
                  opacity: historyIndex <= 0 ? 0.5 : 1
                }}
                title="元に戻す (Ctrl+Z)"
              >
                <Undo size={14} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                style={{ 
                  ...styles.button.secondary, 
                  padding: '6px', 
                  fontSize: '12px',
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1
                }}
                title="やり直し (Ctrl+Shift+Z)"
              >
                <Redo size={14} />
              </button>
            </div>

            {showDiff && (
              <>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />
                <button
                  onClick={() => setShowDiffMode(!showDiffMode)}
                  style={{ 
                    ...styles.button.secondary, 
                    padding: '6px', 
                    fontSize: '12px',
                    backgroundColor: showDiffMode ? '#dbeafe' : undefined
                  }}
                  title="差分表示の切り替え"
                >
                  {showDiffMode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </>
            )}

            <div style={{ flex: 1 }} />

            {/* 保存状態表示 */}
            {isAutoSaving && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}
              >
                <Sparkles size={12} />
                自動保存中...
              </motion.div>
            )}

            {lastSaved && !isAutoSaving && (
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                最終保存: {lastSaved.toLocaleTimeString()}
              </div>
            )}

            {/* アクションボタン */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleCancel}
                style={{ ...styles.button.secondary, padding: '6px 12px', fontSize: '12px' }}
                title="キャンセル (Esc)"
              >
                <X size={14} />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                style={{ ...styles.button.primary, padding: '6px 12px', fontSize: '12px' }}
                title="保存 (Ctrl+S)"
              >
                <Check size={14} />
                保存
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* エディタ本体 */}
      <div
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onClick={!isEditing ? handleStartEdit : undefined}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: '40px',
          padding: '12px',
          border: isEditing ? '2px solid #2563eb' : '1px solid transparent',
          borderRadius: '8px',
          backgroundColor: isEditing ? '#ffffff' : 'transparent',
          cursor: isEditing ? 'text' : 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
          position: 'relative',
          lineHeight: '1.6',
          ...(!content && !isEditing && {
            color: '#9ca3af',
            fontStyle: 'italic'
          }),
          ...(hasChanges && !isEditing && {
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b'
          })
        }}
        data-placeholder={placeholder}
      >
        {showDiffMode && showDiff && isEditing ? (
          // 差分表示モード
          <div>
            {diff.map((segment, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: 
                    segment.type === 'added' ? '#dcfce7' :
                    segment.type === 'removed' ? '#fee2e2' : 'transparent',
                  textDecoration: segment.type === 'removed' ? 'line-through' : 'none',
                  color: 
                    segment.type === 'added' ? '#166534' :
                    segment.type === 'removed' ? '#991b1b' : 'inherit'
                }}
              >
                {segment.content}
              </span>
            ))}
          </div>
        ) : (
          // 通常表示
          content || (!isEditing && placeholder)
        )}
      </div>

      {/* 編集アイコン（非編集時） */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '4px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Edit3 size={14} color="#6b7280" />
        </motion.div>
      )}

      {/* 変更インジケーター */}
      {hasChanges && !isEditing && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#f59e0b',
            borderRadius: '50%'
          }}
        />
      )}
    </div>
  );
};

export default InlineEditor;