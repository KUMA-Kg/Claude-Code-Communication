import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FolderOpen, 
  Clock, 
  User, 
  Calendar,
  ChevronRight,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useDarkModeColors } from '../../hooks/useDarkMode';
import { apiService } from '../../services/api.service';
import { formatDistanceToNow } from '../../utils/dateUtils';

// セッションデータの型定義
export interface SessionData {
  id: string;
  userId?: string;
  sessionName: string;
  currentStep: number;
  totalSteps: number;
  answers: Record<string, any>;
  subsidyType?: string;
  matchingResults?: any[];
  documents?: any[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'in_progress' | 'completed';
}

interface SessionManagerProps {
  currentSession?: SessionData;
  onLoadSession: (session: SessionData) => void;
  onSaveSession: (sessionData: Partial<SessionData>) => Promise<void>;
  onNewSession: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  currentSession,
  onLoadSession,
  onSaveSession,
  onNewSession
}) => {
  const { colors } = useDarkModeColors();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // セッション一覧の取得
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get<SessionData[]>('/sessions');
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('セッション取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchSessions();
  }, []);

  // セッションの保存
  const handleSaveSession = async () => {
    if (!sessionName.trim() && !currentSession?.sessionName) {
      alert('セッション名を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSession({
        sessionName: sessionName || currentSession?.sessionName,
        updatedAt: new Date().toISOString()
      });
      
      // セッション一覧を更新
      await fetchSessions();
      setSessionName('');
    } catch (error) {
      console.error('セッション保存エラー:', error);
      alert('セッションの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // セッションの削除
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('このセッションを削除してもよろしいですか？')) {
      return;
    }

    try {
      await apiService.delete(`/sessions/${sessionId}`);
      await fetchSessions();
      
      // 現在のセッションが削除された場合は新規作成
      if (currentSession?.id === sessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error('セッション削除エラー:', error);
      alert('セッションの削除に失敗しました');
    }
  };

  // 進捗率の計算
  const getProgress = (session: SessionData) => {
    if (session.totalSteps === 0) return 0;
    return Math.round((session.currentStep / session.totalSteps) * 100);
  };

  return (
    <div style={{
      background: colors.backgroundSecondary,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={20} />
          診断セッション管理
        </h3>

        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            style={{
              padding: '8px 16px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FolderOpen size={16} />
            履歴から読み込み
          </button>

          <button
            onClick={onNewSession}
            style={{
              padding: '8px 16px',
              background: 'none',
              color: colors.primary,
              border: `1px solid ${colors.primary}`,
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            新規作成
          </button>
        </div>
      </div>

      {/* 現在のセッション情報 */}
      {currentSession && (
        <div style={{
          background: colors.background,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '500',
                margin: '0 0 4px 0'
              }}>
                {currentSession.sessionName || '未保存のセッション'}
              </h4>
              <p style={{
                fontSize: '12px',
                color: colors.textSecondary,
                margin: 0
              }}>
                最終更新: {formatDistanceToNow(new Date(currentSession.updatedAt))}前
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* 進捗表示 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {getProgress(currentSession)}%
                </span>
                <div style={{
                  width: '100px',
                  height: '6px',
                  background: colors.border,
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${getProgress(currentSession)}%`,
                    height: '100%',
                    background: colors.primary,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* 保存ボタン */}
              <button
                onClick={handleSaveSession}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  background: colors.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>

          {/* セッション名の編集 */}
          {!currentSession.sessionName && (
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="セッション名を入力..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: colors.backgroundSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                color: colors.text
              }}
            />
          )}
        </div>
      )}

      {/* セッション一覧 */}
      {showSessionList && (
        <div style={{
          background: colors.background,
          borderRadius: '8px',
          padding: '16px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '500',
            margin: '0 0 16px 0'
          }}>
            保存済みセッション
          </h4>

          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: colors.textSecondary
            }}>
              読み込み中...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: colors.textSecondary
            }}>
              保存されたセッションがありません
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: colors.backgroundSecondary,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => onLoadSession(session)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      margin: '0 0 4px 0'
                    }}>
                      {session.sessionName}
                    </h5>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '12px',
                      color: colors.textSecondary
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        {session.subsidyType || '未選択'}
                      </span>
                      <span>
                        進捗: {getProgress(session)}%
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      style={{
                        padding: '6px',
                        background: 'none',
                        border: 'none',
                        color: colors.error,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={16} style={{ color: colors.textSecondary }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};