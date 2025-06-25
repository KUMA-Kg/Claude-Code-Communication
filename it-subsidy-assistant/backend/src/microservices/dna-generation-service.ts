import express, { Request, Response } from 'express';
import { AIDocumentDNAGeneratorV2 } from '../services/genetics/AIDocumentDNAGeneratorV2';
import { createClient } from '@supabase/supabase-js';
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

const app = express();
app.use(express.json({ limit: '10mb' })); // 大きな文書に対応

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
const dnaQueue = new Queue('dna-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// キュースケジューラー
new QueueScheduler('dna-generation', { connection: redis });

// DNA Generator インスタンス
const dnaGenerator = new AIDocumentDNAGeneratorV2(supabase, 1.0);

/**
 * ヘルスチェックエンドポイント
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'dna-generation-service',
    timestamp: new Date().toISOString(),
    redis: redis.status,
    queueStatus: dnaQueue.name
  });
});

/**
 * 遺伝的文書生成エンドポイント
 */
app.post('/api/dna/generate', async (req: Request, res: Response) => {
  try {
    const {
      companyProfile,
      subsidyId,
      targetFitness = 0.9,
      maxGenerations = 50
    } = req.body;
    
    // バリデーション
    if (!companyProfile || !subsidyId) {
      return res.status(400).json({
        error: 'Company profile and subsidy ID are required'
      });
    }
    
    // 非同期ジョブとしてキューに追加
    const job = await dnaQueue.add('generate-document', {
      companyProfile,
      subsidyId,
      targetFitness,
      maxGenerations,
      requestId: `dna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    res.status(202).json({
      message: 'DNA generation job queued',
      jobId: job.id,
      status: 'pending',
      estimatedTime: '30-60 seconds'
    });
  } catch (error) {
    logger.error('DNA generation request error:', error);
    res.status(500).json({
      error: 'Failed to queue generation job'
    });
  }
});

/**
 * 進化状態確認エンドポイント
 */
app.get('/api/dna/evolution/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await dnaQueue.getJob(jobId);
    
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
        result: {
          content: result.content,
          fitness: result.fitness,
          generation: result.dna.generation,
          mutations: result.dna.mutations.length,
          adaptations: result.adaptations
        }
      });
    } else if (state === 'failed') {
      res.status(500).json({
        jobId,
        status: state,
        error: job.failedReason
      });
    } else {
      // 進化中の詳細情報
      const evolutionData = await redis.get(`evolution:${jobId}`);
      const evolution = evolutionData ? JSON.parse(evolutionData) : null;
      
      res.json({
        jobId,
        status: state,
        progress: progress || 0,
        evolution: evolution ? {
          currentGeneration: evolution.generation,
          bestFitness: evolution.bestFitness,
          populationSize: evolution.populationSize,
          mutationRate: evolution.mutationRate
        } : null
      });
    }
  } catch (error) {
    logger.error('Evolution status check error:', error);
    res.status(500).json({
      error: 'Failed to check evolution status'
    });
  }
});

/**
 * DNA分析エンドポイント
 */
app.post('/api/dna/analyze', async (req: Request, res: Response) => {
  try {
    const { documentContent, subsidyId } = req.body;
    
    if (!documentContent || !subsidyId) {
      return res.status(400).json({
        error: 'Document content and subsidy ID are required'
      });
    }
    
    // DNA逆設計を実行
    const dna = await dnaGenerator['reverseEngineerDNA'](documentContent);
    
    // 適応度を計算
    const fitness = await dnaGenerator['calculateFitness'](
      dna,
      { /* デフォルトプロファイル */ },
      subsidyId
    );
    
    res.json({
      success: true,
      analysis: {
        dnaId: dna.id,
        geneCount: dna.genes.length,
        chromosomeCount: dna.chromosomes.length,
        fitness: fitness,
        dominantGenes: dna.genes
          .filter(g => g.dominance > 0.7)
          .map(g => ({
            id: g.id,
            dominance: g.dominance,
            expression: g.expression
          })),
        phenotype: dnaGenerator['determinePhenotype'](dna.genes)
      }
    });
  } catch (error) {
    logger.error('DNA analysis error:', error);
    res.status(500).json({
      error: 'DNA analysis failed'
    });
  }
});

/**
 * DNA交配エンドポイント
 */
app.post('/api/dna/crossbreed', async (req: Request, res: Response) => {
  try {
    const { parent1Content, parent2Content, companyProfile } = req.body;
    
    if (!parent1Content || !parent2Content || !companyProfile) {
      return res.status(400).json({
        error: 'Two parent documents and company profile are required'
      });
    }
    
    // 親DNAを抽出
    const parent1DNA = await dnaGenerator['reverseEngineerDNA'](parent1Content);
    const parent2DNA = await dnaGenerator['reverseEngineerDNA'](parent2Content);
    
    // 交配を実行
    const [offspring1, offspring2] = await dnaGenerator['uniformCrossover'](
      parent1DNA,
      parent2DNA
    );
    
    // 子孫の文書を生成
    const childDocument1 = await dnaGenerator['expressPhenotype'](
      offspring1,
      companyProfile
    );
    
    const childDocument2 = await dnaGenerator['expressPhenotype'](
      offspring2,
      companyProfile
    );
    
    res.json({
      success: true,
      offspring: [
        {
          content: childDocument1.content,
          fitness: childDocument1.fitness,
          phenotype: childDocument1.phenotype
        },
        {
          content: childDocument2.content,
          fitness: childDocument2.fitness,
          phenotype: childDocument2.phenotype
        }
      ]
    });
  } catch (error) {
    logger.error('DNA crossbreeding error:', error);
    res.status(500).json({
      error: 'Crossbreeding failed'
    });
  }
});

/**
 * バッチ進化エンドポイント
 */
app.post('/api/dna/batch-evolve', async (req: Request, res: Response) => {
  try {
    const { companies, subsidyId, evolutionSettings = {} } = req.body;
    
    if (!Array.isArray(companies) || companies.length === 0 || !subsidyId) {
      return res.status(400).json({
        error: 'Array of companies and subsidy ID are required'
      });
    }
    
    // バッチジョブを作成
    const jobs = await Promise.all(
      companies.map(company =>
        dnaQueue.add('batch-evolution', {
          companyProfile: company,
          subsidyId,
          ...evolutionSettings,
          batchId: `batch_${Date.now()}`
        })
      )
    );
    
    res.status(202).json({
      message: 'Batch evolution jobs queued',
      batchId: jobs[0].data.batchId,
      jobIds: jobs.map(j => j.id),
      totalJobs: jobs.length
    });
  } catch (error) {
    logger.error('Batch evolution error:', error);
    res.status(500).json({
      error: 'Failed to queue batch evolution'
    });
  }
});

/**
 * ワーカープロセス
 */
const dnaWorker = new Worker(
  'dna-generation',
  async (job) => {
    const { 
      companyProfile, 
      subsidyId, 
      targetFitness, 
      maxGenerations 
    } = job.data;
    
    try {
      // 進化プロセスの開始
      await job.updateProgress(5);
      
      // 進化状態を定期的に更新するコールバック
      const updateEvolution = async (generation: number, bestFitness: number) => {
        const progress = Math.min((generation / maxGenerations) * 90 + 5, 95);
        await job.updateProgress(progress);
        
        // 進化状態をRedisに保存
        await redis.set(
          `evolution:${job.id}`,
          JSON.stringify({
            generation,
            bestFitness,
            populationSize: 100,
            mutationRate: 0.01
          }),
          'EX',
          300 // 5分間保持
        );
      };
      
      // モンキーパッチで進化状態を監視（実際の実装では適切なコールバックを使用）
      const originalEvaluate = dnaGenerator['evaluateFitness'];
      let currentGeneration = 0;
      let bestFitnessYet = 0;
      
      dnaGenerator['evaluateFitness'] = async function(...args: any[]) {
        const result = await originalEvaluate.apply(dnaGenerator, args);
        
        currentGeneration++;
        const currentBest = Math.max(...result.map((r: any) => r.fitness));
        if (currentBest > bestFitnessYet) {
          bestFitnessYet = currentBest;
        }
        
        await updateEvolution(currentGeneration, bestFitnessYet);
        
        return result;
      };
      
      // 遺伝的文書生成を実行
      const evolvedDocument = await dnaGenerator.generateEvolutionaryDocument(
        companyProfile,
        subsidyId,
        targetFitness,
        maxGenerations
      );
      
      // 元の関数を復元
      dnaGenerator['evaluateFitness'] = originalEvaluate;
      
      await job.updateProgress(95);
      
      // 結果を保存
      const { data: savedDoc } = await supabase
        .from('generated_documents')
        .insert({
          company_id: companyProfile.id,
          subsidy_id: subsidyId,
          content: evolvedDocument.content,
          fitness: evolvedDocument.fitness,
          dna_id: evolvedDocument.dna.id,
          metadata: {
            generation: evolvedDocument.dna.generation,
            mutations: evolvedDocument.dna.mutations.length,
            adaptations: evolvedDocument.adaptations,
            phenotype: evolvedDocument.phenotype
          }
        })
        .select()
        .single();
      
      await job.updateProgress(100);
      
      return {
        ...evolvedDocument,
        documentId: savedDoc?.id
      };
    } catch (error) {
      logger.error('DNA generation worker error:', error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // DNA生成は重いので同時実行数を制限
    limiter: {
      max: 50,
      duration: 60000 // 1分間に50ジョブまで
    }
  }
);

// ワーカーイベントハンドラ
dnaWorker.on('completed', (job) => {
  logger.info(`DNA generation job ${job.id} completed`);
});

dnaWorker.on('failed', (job, err) => {
  logger.error(`DNA generation job ${job?.id} failed:`, err);
});

dnaWorker.on('progress', (job, progress) => {
  logger.debug(`Job ${job.id} progress: ${progress}%`);
});

/**
 * グレースフルシャットダウン
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing DNA generation service...');
  
  await dnaQueue.close();
  await dnaWorker.close();
  await redis.quit();
  
  process.exit(0);
});

// サービス起動
const PORT = process.env.DNA_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  logger.info(`DNA Generation Service running on port ${PORT}`);
});