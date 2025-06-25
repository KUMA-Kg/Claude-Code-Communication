import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { useAuth } from './useAuth';
import { SessionData } from '../components/session/SessionManager';

// セッション管理フック
export const useSessionManager = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ローカルストレージキー
  const LOCAL_SESSION_KEY = 'it-subsidy-session-draft';

  // セッションの初期化
  useEffect(() => {
    // ローカルストレージから下書きを復元
    const savedDraft = localStorage.getItem(LOCAL_SESSION_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setCurrentSession(draft);
      } catch (error) {
        console.error('下書きの復元エラー:', error);
      }
    } else {
      // 新規セッションの作成
      createNewSession();
    }
  }, []);

  // 新規セッション作成
  const createNewSession = useCallback(() => {
    const newSession: SessionData = {
      id: `local-${Date.now()}`,
      userId: user?.id,
      sessionName: '',
      currentStep: 0,
      totalSteps: 6,
      answers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    setCurrentSession(newSession);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newSession));
  }, [user]);

  // セッションの更新
  const updateSession = useCallback((updates: Partial<SessionData>) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(updatedSession);
    
    // ローカルストレージに保存
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedSession));

    // ユーザーがログインしている場合は自動保存
    if (user && updatedSession.id.startsWith('server-')) {
      debouncedAutoSave(updatedSession);
    }
  }, [currentSession, user]);

  // 回答の保存
  const saveAnswer = useCallback((questionId: string, answer: any) => {
    updateSession({
      answers: {
        ...currentSession?.answers,
        [questionId]: answer
      }
    });
  }, [currentSession, updateSession]);

  // ステップの更新
  const updateStep = useCallback((step: number) => {
    updateSession({
      currentStep: step,
      status: step === (currentSession?.totalSteps || 6) ? 'completed' : 'in_progress'
    });
  }, [currentSession, updateSession]);

  // サーバーへの保存
  const saveToServer = useCallback(async (sessionData?: Partial<SessionData>) => {
    if (!user) {
      throw new Error('ログインが必要です');
    }

    if (!currentSession) return;

    setIsSaving(true);
    try {
      const dataToSave = {
        ...currentSession,
        ...sessionData,
        userId: user.id
      };

      let response;
      if (currentSession.id.startsWith('local-')) {
        // 新規作成
        response = await apiService.post<SessionData>('/sessions', dataToSave);
      } else {
        // 更新
        response = await apiService.put<SessionData>(
          `/sessions/${currentSession.id}`,
          dataToSave
        );
      }

      if (response.success && response.data) {
        setCurrentSession(response.data);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || '保存に失敗しました');
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, currentSession]);

  // サーバーからセッションを読み込み
  const loadFromServer = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.get<SessionData>(`/sessions/${sessionId}`);
      
      if (response.success && response.data) {
        setCurrentSession(response.data);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || 'セッションの読み込みに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // セッション一覧の取得
  const fetchSessions = useCallback(async () => {
    if (!user) return [];

    try {
      const response = await apiService.get<SessionData[]>('/sessions');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('セッション一覧取得エラー:', error);
      return [];
    }
  }, [user]);

  // セッションの削除
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) throw new Error('ログインが必要です');

    const response = await apiService.delete(`/sessions/${sessionId}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || '削除に失敗しました');
    }

    // 現在のセッションが削除された場合は新規作成
    if (currentSession?.id === sessionId) {
      createNewSession();
    }
  }, [user, currentSession, createNewSession]);

  // ローカルストレージのクリア
  const clearLocalSession = useCallback(() => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    createNewSession();
  }, [createNewSession]);

  // 自動保存（デバウンス付き）
  let autoSaveTimer: NodeJS.Timeout;
  const debouncedAutoSave = useCallback((session: SessionData) => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveToServer({ answers: session.answers });
    }, 2000); // 2秒後に保存
  }, [saveToServer]);

  return {
    currentSession,
    isLoading,
    isSaving,
    createNewSession,
    updateSession,
    saveAnswer,
    updateStep,
    saveToServer,
    loadFromServer,
    fetchSessions,
    deleteSession,
    clearLocalSession
  };
};