import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Loader, 
  RefreshCw,
  Database,
  Server,
  Zap
} from 'lucide-react';
import { ConnectionTester, ConnectionTestResult } from '../utils/connectionTest';
import { useDarkModeColors } from '../hooks/useDarkMode';

export const ConnectionStatus: React.FC = () => {
  const { colors } = useDarkModeColors();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ConnectionTestResult[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // アイコンマッピング
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Supabase':
        return Database;
      case 'Backend API':
        return Server;
      case 'WebSocket':
        return Zap;
      default:
        return AlertCircle;
    }
  };

  // ステータスカラー
  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  // 接続テストの実行
  const runConnectionTests = async () => {
    setIsLoading(true);
    try {
      const testResults = await ConnectionTester.runAllTests();
      setResults(testResults);
      setLastChecked(new Date());
    } catch (error) {
      console.error('接続テストエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回実行
  useEffect(() => {
    runConnectionTests();
  }, []);

  // 自動リトライ（エラーがある場合）
  useEffect(() => {
    const hasError = results.some(r => r.status === 'error');
    if (hasError && !isLoading) {
      const timer = setTimeout(() => {
        runConnectionTests();
      }, 30000); // 30秒後にリトライ

      return () => clearTimeout(timer);
    }
  }, [results, isLoading]);

  const summary = ConnectionTester.generateSummary(results);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: colors.backgroundSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px',
      minWidth: '300px',
      maxWidth: '400px',
      boxShadow: colors.shadowLarge,
      zIndex: 1000
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          接続状態
          {isLoading && <Loader size={16} className="animate-spin" />}
        </h3>
        
        <button
          onClick={runConnectionTests}
          disabled={isLoading}
          style={{
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="接続を再チェック"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* サマリー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        background: getStatusColor(summary.overall) + '20',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        {summary.overall === 'success' && <CheckCircle size={20} style={{ color: colors.success }} />}
        {summary.overall === 'warning' && <AlertTriangle size={20} style={{ color: colors.warning }} />}
        {summary.overall === 'error' && <AlertCircle size={20} style={{ color: colors.error }} />}
        
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: getStatusColor(summary.overall)
        }}>
          {summary.overall === 'success' && '全ての接続が正常です'}
          {summary.overall === 'warning' && '一部の接続に問題があります'}
          {summary.overall === 'error' && '接続エラーが発生しています'}
        </span>
      </div>

      {/* 詳細表示トグル */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          padding: '8px',
          background: 'none',
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          color: colors.textSecondary,
          marginBottom: showDetails ? '12px' : 0
        }}
      >
        {showDetails ? '詳細を隠す' : '詳細を表示'}
      </button>

      {/* 詳細結果 */}
      {showDetails && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {results.map((result, index) => {
            const Icon = getServiceIcon(result.service);
            
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '8px',
                  background: colors.background,
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`
                }}
              >
                <Icon size={20} style={{ 
                  color: getStatusColor(result.status),
                  marginTop: '2px',
                  flexShrink: 0
                }} />
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>
                    {result.service}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.textSecondary
                  }}>
                    {result.message}
                  </div>
                  {result.latency !== undefined && (
                    <div style={{
                      fontSize: '11px',
                      color: colors.textTertiary,
                      marginTop: '2px'
                    }}>
                      応答時間: {result.latency}ms
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 最終チェック時刻 */}
      {lastChecked && (
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: colors.textTertiary,
          textAlign: 'center'
        }}>
          最終チェック: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};