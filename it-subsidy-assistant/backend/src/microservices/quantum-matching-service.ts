import express, { Request, Response } from 'express';
import { QuantumMatchingEngineV2 } from '../services/quantum/QuantumMatchingEngineV2';
import { createClient } from '@supabase/supabase-js';
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

const app = express();
app.use(express.json());

// Supabaseクライアント
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Redisクライアント
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// BullMQキュー
const matchingQueue = new Queue('quantum-matching', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// キュースケジューラー
new QueueScheduler('quantum-matching', { connection: redis });

// Quantum Matching Engine インスタンス
const quantumEngine = new QuantumMatchingEngineV2(supabase, 3);

/**
 * ヘルスチェックエンドポイント
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'quantum-matching-service',
    timestamp: new Date().toISOString(),
    redis: redis.status,
    queueStatus: matchingQueue.name
  });
});

/**
 * 量子マッチング実行エンドポイント
 */
app.post('/api/quantum/match', async (req: Request, res: Response) => {
  try {
    const {
      companyProfile,
      subsidyFilters,
      options = {}
    } = req.body;
    
    // バリデーション
    if (!companyProfile || !companyProfile.id) {
      return res.status(400).json({
        error: 'Company profile with ID is required'
      });
    }
    
    // 非同期ジョブとしてキューに追加
    const job = await matchingQueue.add('match-job', {
      companyProfile,
      subsidyFilters,
      options,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    res.status(202).json({
      message: 'Quantum matching job queued',
      jobId: job.id,
      status: 'pending',
      estimatedTime: '5-10 seconds'
    });
  } catch (error) {
    logger.error('Quantum matching request error:', error);
    res.status(500).json({
      error: 'Failed to queue matching job'
    });
  }
});

/**
 * ジョブステータス確認エンドポイント
 */
app.get('/api/quantum/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await matchingQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    if (state === 'completed') {
      const result = job.returnvalue;
      res.json({
        jobId,
        status: state,
        progress: 100,
        result
      });
    } else if (state === 'failed') {
      res.status(500).json({
        jobId,
        status: state,
        error: job.failedReason
      });
    } else {
      res.json({
        jobId,
        status: state,
        progress: progress || 0
      });
    }
  } catch (error) {
    logger.error('Job status check error:', error);
    res.status(500).json({
      error: 'Failed to check job status'
    });
  }
});

/**
 * 高速ベクトル検索エンドポイント
 */
app.post('/api/quantum/vector-search', async (req: Request, res: Response) => {
  try {
    const { queryVector, k = 10 } = req.body;
    
    if (!queryVector || !Array.isArray(queryVector)) {
      return res.status(400).json({
        error: 'Query vector is required'
      });
    }
    
    const results = await quantumEngine.quantumVectorSearch(queryVector, k);
    
    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error) {
    logger.error('Vector search error:', error);
    res.status(500).json({
      error: 'Vector search failed'
    });
  }
});

/**
 * バッチ処理エンドポイント
 */
app.post('/api/quantum/batch-match', async (req: Request, res: Response) => {
  try {
    const { companies, options = {} } = req.body;
    
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        error: 'Array of companies is required'
      });
    }
    
    // バッチジョブを作成
    const jobs = await Promise.all(
      companies.map(company =>
        matchingQueue.add('batch-match-job', {
          companyProfile: company,
          options,
          batchId: `batch_${Date.now()}`
        })
      )
    );
    
    res.status(202).json({
      message: 'Batch matching jobs queued',
      batchId: jobs[0].data.batchId,
      jobIds: jobs.map(j => j.id),
      totalJobs: jobs.length
    });
  } catch (error) {
    logger.error('Batch matching error:', error);
    res.status(500).json({
      error: 'Failed to queue batch jobs'
    });
  }
});

/**
 * ワーカープロセス
 */
const matchingWorker = new Worker(
  'quantum-matching',
  async (job) => {
    const { companyProfile, subsidyFilters, options } = job.data;
    
    try {
      // 進捗更新
      await job.updateProgress(10);
      
      // 補助金候補の取得
      let query = supabase
        .from('subsidies')
        .select('*')
        .eq('status', 'active');
      
      if (subsidyFilters) {
        if (subsidyFilters.industries) {
          query = query.in('target_industries', subsidyFilters.industries);
        }
        if (subsidyFilters.minAmount) {
          query = query.gte('max_amount', subsidyFilters.minAmount);
        }
        if (subsidyFilters.maxAmount) {
          query = query.lte('max_amount', subsidyFilters.maxAmount);
        }
      }
      
      const { data: subsidyCandidates } = await query;
      
      await job.updateProgress(30);
      
      if (!subsidyCandidates || subsidyCandidates.length === 0) {
        return {
          matches: [],
          message: 'No matching subsidies found'
        };
      }
      
      // 量子マッチング実行
      const quantumResults = await quantumEngine.performQuantumMatching(
        companyProfile,
        subsidyCandidates,
        options
      );
      
      await job.updateProgress(90);
      
      // 結果をキャッシュ
      await redis.set(
        `quantum:result:${companyProfile.id}`,
        JSON.stringify(quantumResults),
        'EX',
        3600 // 1時間キャッシュ
      );
      
      await job.updateProgress(100);
      
      return {
        matches: quantumResults,
        timestamp: new Date().toISOString(),
        cached: false
      };
    } catch (error) {
      logger.error('Quantum matching worker error:', error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // 同時実行数
    limiter: {
      max: 100,
      duration: 60000 // 1分間に100ジョブまで
    }
  }
);

// ワーカーイベントハンドラ
matchingWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

matchingWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

/**
 * グレースフルシャットダウン
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing quantum matching service...');
  
  await matchingQueue.close();
  await matchingWorker.close();
  await redis.quit();
  
  process.exit(0);
});

// サービス起動
const PORT = process.env.QUANTUM_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Quantum Matching Service running on port ${PORT}`);
});