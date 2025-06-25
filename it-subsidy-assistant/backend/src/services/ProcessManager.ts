import { EventEmitter } from 'events';
import * as cluster from 'cluster';
import * as os from 'os';
import { healthMonitor } from './HealthMonitor';

interface WorkerInfo {
  id: number;
  pid: number;
  startTime: Date;
  restartCount: number;
  lastCrash?: Date;
  status: 'online' | 'offline' | 'restarting';
}

interface CircuitBreakerState {
  failures: number;
  lastFailure?: Date;
  state: 'closed' | 'open' | 'half-open';
  nextRetry?: Date;
}

export class ProcessManager extends EventEmitter {
  private workers: Map<number, WorkerInfo> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly MAX_RESTART_ATTEMPTS = 5;
  private readonly RESTART_WINDOW = 60000; // 1分
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30秒

  constructor(private numWorkers: number = os.cpus().length) {
    super();
  }

  /**
   * クラスターモードで起動
   */
  async startCluster(): Promise<void> {
    if (cluster.isPrimary) {
      console.log(`Master ${process.pid} starting ${this.numWorkers} workers...`);

      // ワーカーを起動
      for (let i = 0; i < this.numWorkers; i++) {
        this.forkWorker();
      }

      // ワーカーのイベント監視
      cluster.on('exit', (worker, code, signal) => {
        this.handleWorkerExit(worker, code, signal);
      });

      cluster.on('online', (worker) => {
        this.handleWorkerOnline(worker);
      });

      // ヘルスモニター開始
      healthMonitor.start();

      // 定期的なヘルスチェック
      setInterval(() => this.performHealthCheck(), 30000);

    } else {
      // ワーカープロセスでアプリケーションを起動
      await this.startWorkerApp();
    }
  }

  /**
   * ワーカーをフォーク
   */
  private forkWorker(): void {
    const worker = cluster.fork();
    
    this.workers.set(worker.id, {
      id: worker.id,
      pid: worker.process.pid || 0,
      startTime: new Date(),
      restartCount: 0,
      status: 'online'
    });

    this.emit('worker-forked', { workerId: worker.id });
  }

  /**
   * ワーカーのオンライン処理
   */
  private handleWorkerOnline(worker: cluster.Worker): void {
    const workerInfo = this.workers.get(worker.id);
    if (workerInfo) {
      workerInfo.status = 'online';
      workerInfo.pid = worker.process.pid || 0;
    }

    console.log(`Worker ${worker.id} (PID: ${worker.process.pid}) is online`);
    this.emit('worker-online', { workerId: worker.id });
  }

  /**
   * ワーカーの終了処理
   */
  private handleWorkerExit(
    worker: cluster.Worker, 
    code: number, 
    signal: string
  ): void {
    const workerInfo = this.workers.get(worker.id);
    
    if (!workerInfo) {
      return;
    }

    workerInfo.status = 'offline';
    workerInfo.lastCrash = new Date();

    console.log(`Worker ${worker.id} died (${signal || code})`);
    this.emit('worker-exit', { 
      workerId: worker.id, 
      code, 
      signal 
    });

    // 自動再起動の判断
    if (this.shouldRestart(workerInfo)) {
      this.restartWorker(worker.id);
    } else {
      console.error(`Worker ${worker.id} exceeded restart limit`);
      this.emit('worker-restart-limit', { workerId: worker.id });
    }
  }

  /**
   * 再起動すべきか判断
   */
  private shouldRestart(workerInfo: WorkerInfo): boolean {
    // 再起動回数チェック
    if (workerInfo.restartCount >= this.MAX_RESTART_ATTEMPTS) {
      const timeSinceLastCrash = Date.now() - (workerInfo.lastCrash?.getTime() || 0);
      
      // 時間窓が過ぎていればカウントをリセット
      if (timeSinceLastCrash > this.RESTART_WINDOW) {
        workerInfo.restartCount = 0;
        return true;
      }
      
      return false;
    }

    return true;
  }

  /**
   * ワーカーを再起動
   */
  private async restartWorker(workerId: number): Promise<void> {
    const workerInfo = this.workers.get(workerId);
    
    if (!workerInfo) {
      return;
    }

    workerInfo.status = 'restarting';
    workerInfo.restartCount++;

    // 指数バックオフで遅延
    const delay = Math.min(1000 * Math.pow(2, workerInfo.restartCount - 1), 30000);
    
    setTimeout(() => {
      console.log(`Restarting worker ${workerId} (attempt ${workerInfo.restartCount})`);
      this.forkWorker();
    }, delay);
  }

  /**
   * ワーカーアプリケーションの起動
   */
  private async startWorkerApp(): Promise<void> {
    // エラーハンドリング強化
    process.on('uncaughtException', (error) => {
      console.error(`Worker ${process.pid} uncaught exception:`, error);
      // クリティカルなエラーでない限り継続
      if (this.isCriticalError(error)) {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(`Worker ${process.pid} unhandled rejection:`, reason);
      // ログのみで継続
    });

    // 実際のアプリケーションを起動
    try {
      // ここで実際のExpressアプリケーションを起動
      require('./index');
    } catch (error) {
      console.error(`Worker ${process.pid} failed to start:`, error);
      process.exit(1);
    }
  }

  /**
   * クリティカルエラーの判定
   */
  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      'ENOMEM',
      'ENOSPC',
      'Cannot find module',
      'FATAL'
    ];

    return criticalPatterns.some(pattern => 
      error.message.includes(pattern)
    );
  }

  /**
   * ヘルスチェック実行
   */
  private async performHealthCheck(): Promise<void> {
    const activeWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'online');

    // 最小ワーカー数チェック
    if (activeWorkers.length < Math.floor(this.numWorkers / 2)) {
      console.warn('Running with less than 50% workers');
      this.emit('low-worker-count', { 
        active: activeWorkers.length, 
        expected: this.numWorkers 
      });
    }

    // 各ワーカーのヘルスチェック
    for (const worker of cluster.workers || []) {
      if (worker.isDead()) {
        continue;
      }

      try {
        // ワーカーにヘルスチェックメッセージを送信
        await this.pingWorker(worker);
      } catch (error) {
        console.error(`Worker ${worker.id} health check failed`);
        worker.kill();
      }
    }
  }

  /**
   * ワーカーへのPing
   */
  private pingWorker(worker: cluster.Worker): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'));
      }, 5000);

      worker.send({ type: 'health-check' });
      
      worker.once('message', (msg) => {
        if (msg.type === 'health-check-response') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  /**
   * サーキットブレーカーのチェック
   */
  checkCircuitBreaker(service: string): boolean {
    const breaker = this.circuitBreakers.get(service) || {
      failures: 0,
      state: 'closed'
    };

    // オープン状態の場合
    if (breaker.state === 'open') {
      if (breaker.nextRetry && Date.now() >= breaker.nextRetry.getTime()) {
        // ハーフオープン状態に移行
        breaker.state = 'half-open';
      } else {
        return false; // 接続を拒否
      }
    }

    return true;
  }

  /**
   * サーキットブレーカーの記録
   */
  recordCircuitBreakerResult(service: string, success: boolean): void {
    let breaker = this.circuitBreakers.get(service);
    
    if (!breaker) {
      breaker = {
        failures: 0,
        state: 'closed'
      };
      this.circuitBreakers.set(service, breaker);
    }

    if (success) {
      // 成功時
      if (breaker.state === 'half-open') {
        // 回復
        breaker.state = 'closed';
        breaker.failures = 0;
      }
    } else {
      // 失敗時
      breaker.failures++;
      breaker.lastFailure = new Date();

      if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        breaker.state = 'open';
        breaker.nextRetry = new Date(
          Date.now() + this.CIRCUIT_BREAKER_TIMEOUT
        );
        
        this.emit('circuit-breaker-open', { service });
      }
    }
  }

  /**
   * グレースフルシャットダウン
   */
  async gracefulShutdown(): Promise<void> {
    console.log('Starting graceful shutdown...');

    // 新しい接続を拒否
    if (cluster.isPrimary) {
      // すべてのワーカーに停止シグナルを送信
      for (const worker of Object.values(cluster.workers || {})) {
        worker.send({ type: 'shutdown' });
      }

      // ワーカーの終了を待つ
      await new Promise<void>((resolve) => {
        let remainingWorkers = Object.keys(cluster.workers || {}).length;
        
        if (remainingWorkers === 0) {
          resolve();
          return;
        }

        cluster.on('exit', () => {
          remainingWorkers--;
          if (remainingWorkers === 0) {
            resolve();
          }
        });

        // タイムアウト設定
        setTimeout(() => {
          console.warn('Graceful shutdown timeout, forcing exit');
          resolve();
        }, 30000);
      });
    }

    console.log('Graceful shutdown completed');
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    workers: number;
    activeWorkers: number;
    totalRestarts: number;
    circuitBreakers: Map<string, CircuitBreakerState>;
  } {
    const activeWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'online').length;
    
    const totalRestarts = Array.from(this.workers.values())
      .reduce((sum, w) => sum + w.restartCount, 0);

    return {
      workers: this.workers.size,
      activeWorkers,
      totalRestarts,
      circuitBreakers: this.circuitBreakers
    };
  }
}

// シングルトンインスタンス
export const processManager = new ProcessManager();

// ワーカープロセスでのメッセージハンドリング
if (!cluster.isPrimary) {
  process.on('message', (msg) => {
    if (msg.type === 'health-check') {
      process.send!({ type: 'health-check-response' });
    } else if (msg.type === 'shutdown') {
      // グレースフルシャットダウン
      process.exit(0);
    }
  });
}