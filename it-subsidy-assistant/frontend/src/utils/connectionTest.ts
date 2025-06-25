import { supabase } from '../lib/supabase';
import { apiService } from '../services/api.service';
import { initializeSocket, disconnectSocket, getSocket } from '../lib/socket';
import { API_CONFIG } from '../config/api.config';

// 接続テスト結果の型定義
export interface ConnectionTestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  latency?: number;
  details?: any;
}

// 接続テストクラス
export class ConnectionTester {
  // Supabase接続テスト
  static async testSupabaseConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // 簡単なクエリでテスト
      const { data, error } = await supabase
        .from('subsidies')
        .select('id')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          service: 'Supabase',
          status: 'error',
          message: `Supabase接続エラー: ${error.message}`,
          latency,
          details: error
        };
      }
      
      return {
        service: 'Supabase',
        status: 'success',
        message: 'Supabase接続成功',
        latency,
        details: { recordCount: data?.length || 0 }
      };
    } catch (error: any) {
      return {
        service: 'Supabase',
        status: 'error',
        message: `Supabase接続失敗: ${error.message}`,
        details: error
      };
    }
  }

  // バックエンドAPI接続テスト
  static async testBackendApiConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // ヘルスチェックエンドポイントまたは軽量なエンドポイントでテスト
      const response = await apiService.get('/health', {}, { timeout: 5000 });
      const latency = Date.now() - startTime;
      
      if (!response.success) {
        return {
          service: 'Backend API',
          status: 'error',
          message: 'バックエンドAPI接続エラー',
          latency,
          details: response.error
        };
      }
      
      return {
        service: 'Backend API',
        status: 'success',
        message: 'バックエンドAPI接続成功',
        latency,
        details: response.data
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      // タイムアウトの場合
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          service: 'Backend API',
          status: 'warning',
          message: 'バックエンドAPIがタイムアウトしました',
          latency,
          details: { timeout: true }
        };
      }
      
      return {
        service: 'Backend API',
        status: 'error',
        message: `バックエンドAPI接続失敗: ${error.message}`,
        latency,
        details: error
      };
    }
  }

  // WebSocket接続テスト
  static async testWebSocketConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      // タイムアウト設定
      const timeout = setTimeout(() => {
        disconnectSocket();
        resolve({
          service: 'WebSocket',
          status: 'error',
          message: 'WebSocket接続タイムアウト',
          latency: Date.now() - startTime,
          details: { timeout: true }
        });
      }, 10000);

      try {
        const socket = initializeSocket();
        
        // 接続成功
        socket.once('connect', () => {
          clearTimeout(timeout);
          const latency = Date.now() - startTime;
          
          // Pingテスト
          const pingStart = Date.now();
          socket.emit('ping');
          
          socket.once('pong', () => {
            const pingLatency = Date.now() - pingStart;
            
            resolve({
              service: 'WebSocket',
              status: 'success',
              message: 'WebSocket接続成功',
              latency,
              details: {
                socketId: socket.id,
                pingLatency,
                transport: socket.io.engine.transport.name
              }
            });
          });
          
          // Pong応答がない場合
          setTimeout(() => {
            resolve({
              service: 'WebSocket',
              status: 'warning',
              message: 'WebSocket接続成功（Ping応答なし）',
              latency,
              details: { socketId: socket.id, pingTimeout: true }
            });
          }, 3000);
        });

        // 接続エラー
        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({
            service: 'WebSocket',
            status: 'error',
            message: `WebSocket接続エラー: ${error.message}`,
            latency: Date.now() - startTime,
            details: error
          });
        });
      } catch (error: any) {
        clearTimeout(timeout);
        resolve({
          service: 'WebSocket',
          status: 'error',
          message: `WebSocket初期化エラー: ${error.message}`,
          latency: Date.now() - startTime,
          details: error
        });
      }
    });
  }

  // 環境変数の確認
  static checkEnvironmentVariables(): ConnectionTestResult {
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_API_BASE_URL'
    ];

    const missing: string[] = [];
    const configured: Record<string, boolean> = {};

    for (const key of required) {
      const value = import.meta.env[key];
      if (!value || value === 'your-project.supabase.co' || value === 'your-anon-key') {
        missing.push(key);
        configured[key] = false;
      } else {
        configured[key] = true;
      }
    }

    if (missing.length > 0) {
      return {
        service: '環境変数',
        status: 'error',
        message: `必要な環境変数が設定されていません: ${missing.join(', ')}`,
        details: { missing, configured }
      };
    }

    return {
      service: '環境変数',
      status: 'success',
      message: '全ての環境変数が正しく設定されています',
      details: { configured }
    };
  }

  // 全体的な接続テスト
  static async runAllTests(): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    // 環境変数チェック
    results.push(this.checkEnvironmentVariables());

    // 並列で接続テストを実行
    const [supabaseResult, apiResult, wsResult] = await Promise.allSettled([
      this.testSupabaseConnection(),
      this.testBackendApiConnection(),
      this.testWebSocketConnection()
    ]);

    // 結果を追加
    if (supabaseResult.status === 'fulfilled') {
      results.push(supabaseResult.value);
    } else {
      results.push({
        service: 'Supabase',
        status: 'error',
        message: 'Supabaseテスト実行エラー',
        details: supabaseResult.reason
      });
    }

    if (apiResult.status === 'fulfilled') {
      results.push(apiResult.value);
    } else {
      results.push({
        service: 'Backend API',
        status: 'error',
        message: 'APIテスト実行エラー',
        details: apiResult.reason
      });
    }

    if (wsResult.status === 'fulfilled') {
      results.push(wsResult.value);
    } else {
      results.push({
        service: 'WebSocket',
        status: 'error',
        message: 'WebSocketテスト実行エラー',
        details: wsResult.reason
      });
    }

    // WebSocketのクリーンアップ
    setTimeout(() => {
      if (getSocket()?.connected) {
        disconnectSocket();
      }
    }, 1000);

    return results;
  }

  // 結果のサマリー生成
  static generateSummary(results: ConnectionTestResult[]): {
    overall: 'success' | 'warning' | 'error';
    summary: string;
    details: ConnectionTestResult[];
  } {
    const hasError = results.some(r => r.status === 'error');
    const hasWarning = results.some(r => r.status === 'warning');

    let overall: 'success' | 'warning' | 'error' = 'success';
    if (hasError) overall = 'error';
    else if (hasWarning) overall = 'warning';

    const summary = results
      .map(r => `${r.service}: ${r.status === 'success' ? '✅' : r.status === 'warning' ? '⚠️' : '❌'} ${r.message}`)
      .join('\n');

    return {
      overall,
      summary,
      details: results
    };
  }
}

// デバッグ用のコンソールコマンド
if (import.meta.env.DEV) {
  (window as any).testConnections = async () => {
    console.log('接続テストを開始します...');
    const results = await ConnectionTester.runAllTests();
    const summary = ConnectionTester.generateSummary(results);
    
    console.group('接続テスト結果');
    console.log(`全体ステータス: ${summary.overall}`);
    console.log('\n詳細:');
    results.forEach(result => {
      console.group(`${result.service} - ${result.status}`);
      console.log('メッセージ:', result.message);
      if (result.latency) console.log('レイテンシ:', `${result.latency}ms`);
      if (result.details) console.log('詳細:', result.details);
      console.groupEnd();
    });
    console.groupEnd();
    
    return summary;
  };
}