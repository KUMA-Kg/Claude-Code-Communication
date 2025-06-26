import React, { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, CheckCircle, Copy, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { NextAction, ApplicationLink } from '../data/subsidy-schedules';
import '../styles/next-action-guide.css';

interface NextActionGuideProps {
  nextActions: NextAction[];
  applicationLinks: ApplicationLink[];
  subsidyName: string;
}

const NextActionGuide: React.FC<NextActionGuideProps> = ({ 
  nextActions, 
  applicationLinks,
  subsidyName 
}) => {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // ローカルストレージから完了状態を復元
  useEffect(() => {
    const saved = localStorage.getItem(`next-actions-${subsidyName}`);
    if (saved) {
      setCompletedActions(new Set(JSON.parse(saved)));
    }
  }, [subsidyName]);

  // 完了状態の変更を保存
  const toggleActionComplete = (actionId: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId);
    } else {
      newCompleted.add(actionId);
    }
    setCompletedActions(newCompleted);
    localStorage.setItem(`next-actions-${subsidyName}`, JSON.stringify(Array.from(newCompleted)));
  };

  // アクションの展開切り替え
  const toggleActionExpanded = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  // URLコピー機能
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const completedCount = completedActions.size;
  const totalActions = nextActions.length;
  const progressPercentage = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;

  return (
    <div className="next-action-guide">
      {/* ヘッダー */}
      <div className="guide-header">
        <div className="header-title">
          <Sparkles className="w-6 h-6" />
          <h3>書類準備完了！次のステップ</h3>
        </div>
        <div className="progress-indicator">
          <span className="progress-text">{completedCount} / {totalActions} 完了</span>
          <div className="progress-bar-mini">
            <div 
              className="progress-fill-mini" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* アクションリスト */}
      <div className="actions-list">
        {nextActions.map((action, index) => {
          const isCompleted = completedActions.has(action.id);
          const isExpanded = expandedActions.has(action.id);
          
          return (
            <div 
              key={action.id} 
              className={`action-item ${isCompleted ? 'completed' : ''}`}
            >
              <div className="action-main">
                <div className="action-number">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                <div className="action-content">
                  <div className="action-header">
                    <h4 className="action-title">{action.title}</h4>
                    <div className="action-controls">
                      <button
                        className="expand-button"
                        onClick={() => toggleActionExpanded(action.id)}
                        aria-label={isExpanded ? '詳細を閉じる' : '詳細を開く'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="complete-button"
                        onClick={() => toggleActionComplete(action.id)}
                        aria-label={isCompleted ? '未完了にする' : '完了にする'}
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="action-details">
                      <p className="action-description">{action.description}</p>
                      {action.link && (
                        <a
                          href={action.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-link"
                        >
                          <span>{action.linkText || 'リンクを開く'}</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="action-icon">
                  <span>{action.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 電子申請リンク集 */}
      <div className="application-links">
        <h4 className="links-title">
          <ExternalLink className="w-5 h-5" />
          電子申請・関連サイト
        </h4>
        
        <div className="links-grid">
          {applicationLinks.map((link) => (
            <div 
              key={link.url}
              className={`link-card ${link.isPrimary ? 'primary' : ''}`}
            >
              <div className="link-header">
                <h5 className="link-title">{link.title}</h5>
                {link.isPrimary && <span className="primary-badge">メイン</span>}
              </div>
              <p className="link-description">{link.description}</p>
              <div className="link-actions">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-button"
                >
                  <span>サイトを開く</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(link.url)}
                  title="URLをコピー"
                >
                  <Copy className="w-4 h-4" />
                  {copiedUrl === link.url && <span className="copied-text">コピーしました</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NextActionGuide;