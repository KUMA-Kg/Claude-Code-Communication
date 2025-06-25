import express, { Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const app = express();
app.use(express.json());

// Redisクライアント
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// サービスの設定
const services = {
  quantum: {
    url: process.env.QUANTUM_SERVICE_URL || 'http://localhost:3001',
    paths: ['/api/quantum']
  },
  dna: {
    url: process.env.DNA_SERVICE_URL || 'http://localhost:3002',
    paths: ['/api/dna']
  },
  main: {
    url: process.env.MAIN_SERVICE_URL || 'http://localhost:3000',
    paths: ['/api/v1']
  }
};

// レート制限の設定
const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // 内部サービス間通信はスキップ
      return req.headers['x-service-token'] === process.env.INTERNAL_SERVICE_TOKEN;
    }
  });
};

// 各エンドポイントのレート制限
const rateLimiters = {
  quantum: createRateLimiter(60 * 1000, 100), // 1分間に100リクエスト
  dna: createRateLimiter(60 * 1000, 50), // 1分間に50リクエスト
  default: createRateLimiter(60 * 1000, 200) // 1分間に200リクエスト
};

// 認証ミドルウェア
const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // トークン検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // ユーザー情報をリクエストに追加
    req.user = decoded;
    
    // サービス間通信用のヘッダーを追加
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-company-id'] = decoded.companyId;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// リクエストログミドルウェア
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip
    });
  });
  
  next();
};

// メトリクス収集ミドルウェア
const collectMetrics = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const key = `metrics:${req.method}:${req.path}:${res.statusCode}`;
    
    // メトリクスをRedisに保存
    await redis.hincrby('api:requests', key, 1);
    await redis.lpush(`api:latency:${key}`, duration);
    await redis.ltrim(`api:latency:${key}`, 0, 999); // 最新1000件のみ保持
  });
  
  next();
};

// サーキットブレーカー実装
class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailTime: Map<string, number> = new Map();
  private state: Map<string, 'closed' | 'open' | 'half-open'> = new Map();
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 60秒
  ) {}
  
  async execute(serviceName: string, fn: () => Promise<any>): Promise<any> {
    const currentState = this.state.get(serviceName) || 'closed';
    
    if (currentState === 'open') {
      const lastFail = this.lastFailTime.get(serviceName) || 0;
      if (Date.now() - lastFail > this.timeout) {
        this.state.set(serviceName, 'half-open');
      } else {
        throw new Error(`Service ${serviceName} is unavailable`);
      }
    }
    
    try {
      const result = await fn();
      
      if (currentState === 'half-open') {
        this.state.set(serviceName, 'closed');
        this.failures.set(serviceName, 0);
      }
      
      return result;
    } catch (error) {
      const failCount = (this.failures.get(serviceName) || 0) + 1;
      this.failures.set(serviceName, failCount);
      this.lastFailTime.set(serviceName, Date.now());
      
      if (failCount >= this.threshold) {
        this.state.set(serviceName, 'open');
        logger.error(`Circuit breaker opened for service: ${serviceName}`);
      }
      
      throw error;
    }
  }
  
  getStatus(serviceName: string): string {
    return this.state.get(serviceName) || 'closed';
  }
}

const circuitBreaker = new CircuitBreaker();

// プロキシミドルウェアの作成
const createProxyMiddleware = (serviceName: string, target: string) => {
  return httpProxy.createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // 内部サービストークンを追加
      proxyReq.setHeader('x-service-token', process.env.INTERNAL_SERVICE_TOKEN!);
      
      // リクエストIDを追加
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      proxyReq.setHeader('x-request-id', requestId);
    },
    onProxyRes: (proxyRes, req, res) => {
      // レスポンスヘッダーにサービス情報を追加
      proxyRes.headers['x-served-by'] = serviceName;
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceName
      });
    }
  });
};

// ヘルスチェックエンドポイント
app.get('/health', async (req: Request, res: Response) => {
  const healthChecks = await Promise.allSettled([
    fetch(`${services.quantum.url}/health`).then(r => r.json()),
    fetch(`${services.dna.url}/health`).then(r => r.json()),
    fetch(`${services.main.url}/health`).then(r => r.json())
  ]);
  
  const serviceHealth = {
    quantum: healthChecks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    dna: healthChecks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    main: healthChecks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
  };
  
  const allHealthy = Object.values(serviceHealth).every(status => status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: serviceHealth,
    circuitBreakers: {
      quantum: circuitBreaker.getStatus('quantum'),
      dna: circuitBreaker.getStatus('dna'),
      main: circuitBreaker.getStatus('main')
    },
    timestamp: new Date().toISOString()
  });
});

// メトリクスエンドポイント
app.get('/metrics', authenticateRequest, async (req: Request, res: Response) => {
  const requests = await redis.hgetall('api:requests');
  const metrics: any = {};
  
  for (const [key, count] of Object.entries(requests)) {
    const latencies = await redis.lrange(`api:latency:${key}`, 0, -1);
    const latencyNumbers = latencies.map(l => parseInt(l));
    
    metrics[key] = {
      count: parseInt(count),
      avgLatency: latencyNumbers.length > 0
        ? latencyNumbers.reduce((a, b) => a + b, 0) / latencyNumbers.length
        : 0,
      p95Latency: latencyNumbers.length > 0
        ? latencyNumbers.sort((a, b) => a - b)[Math.floor(latencyNumbers.length * 0.95)]
        : 0
    };
  }
  
  res.json({
    metrics,
    timestamp: new Date().toISOString()
  });
});

// グローバルミドルウェアの適用
app.use(requestLogger);
app.use(collectMetrics);

// 量子マッチングサービスへのルーティング
app.use('/api/quantum',
  authenticateRequest,
  rateLimiters.quantum,
  async (req, res, next) => {
    try {
      await circuitBreaker.execute('quantum', async () => {
        createProxyMiddleware('quantum', services.quantum.url)(req, res, next);
      });
    } catch (error) {
      res.status(503).json({
        error: 'Quantum service is currently unavailable',
        retryAfter: 60
      });
    }
  }
);

// DNA生成サービスへのルーティング
app.use('/api/dna',
  authenticateRequest,
  rateLimiters.dna,
  async (req, res, next) => {
    try {
      await circuitBreaker.execute('dna', async () => {
        createProxyMiddleware('dna', services.dna.url)(req, res, next);
      });
    } catch (error) {
      res.status(503).json({
        error: 'DNA generation service is currently unavailable',
        retryAfter: 60
      });
    }
  }
);

// メインサービスへのルーティング（フォールバック）
app.use('/api',
  authenticateRequest,
  rateLimiters.default,
  async (req, res, next) => {
    try {
      await circuitBreaker.execute('main', async () => {
        createProxyMiddleware('main', services.main.url)(req, res, next);
      });
    } catch (error) {
      res.status(503).json({
        error: 'Main service is currently unavailable',
        retryAfter: 60
      });
    }
  }
);

// 404ハンドラー
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// エラーハンドラー
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing API Gateway...');
  
  await redis.quit();
  
  process.exit(0);
});

// サーバー起動
const PORT = process.env.GATEWAY_PORT || 3003;
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Services configuration:', services);
});