import { Router, Request, Response } from 'express';
import { DocumentMagicStudio } from '../services/DocumentMagicStudio';
import { LiveCollaborationHub } from '../services/LiveCollaborationHub';
import { EnhancedAIMatchingEngine } from '../services/EnhancedAIMatchingEngine';
import { authenticateToken } from '../middleware/auth-jwt';
import { createClient } from '@supabase/supabase-js';
import { Server as SocketIOServer } from 'socket.io';

const router = Router();

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// サービスインスタンス
let documentMagicStudio: DocumentMagicStudio;
let aiMatchingEngine: EnhancedAIMatchingEngine;
let liveCollaborationHub: LiveCollaborationHub;

// 初期化関数
export function initializeEnhancedServices(io: SocketIOServer) {
  documentMagicStudio = new DocumentMagicStudio(supabase);
  aiMatchingEngine = new EnhancedAIMatchingEngine(supabase);
  liveCollaborationHub = new LiveCollaborationHub(io, supabase);
}

/**
 * Document Magic Studio API
 */

// 文章自動補完エンドポイント
router.post('/api/v1/document-magic/suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      documentType,
      currentSection,
      previousText,
      maxSuggestions = 5
    } = req.body;
    
    const userProfile = {
      industry: req.user?.company?.industry || 'その他',
      companySize: req.user?.company?.size || '中規模',
      previousApplications: req.user?.stats?.applications || 0
    };
    
    const suggestions = await documentMagicStudio.getSmartSuggestions(
      {
        documentType,
        currentSection,
        previousText,
        userProfile
      },
      maxSuggestions
    );
    
    res.json({
      success: true,
      suggestions,
      metadata: {
        responseTime: suggestions[0]?.completionTime || 0,
        cacheHit: suggestions[0]?.completionTime < 10
      }
    });
  } catch (error) {
    console.error('Document Magic error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// 文書テンプレート取得
router.get('/api/v1/document-magic/templates/:documentType', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { documentType } = req.params;
    const { section } = req.query;
    
    // テンプレート取得ロジック
    const templates = await supabase
      .from('document_templates')
      .select('*')
      .eq('document_type', documentType)
      .eq('section', section || null);
    
    res.json({
      success: true,
      templates: templates.data || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * Enhanced AI Matching API
 */

// AIマッチング実行
router.post('/api/v1/ai-matching/match', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyProfile = {
      id: req.user?.companyId || 'unknown',
      name: req.body.companyName || req.user?.company?.name,
      industry: req.body.industry || req.user?.company?.industry,
      employeeCount: req.body.employeeCount || req.user?.company?.employeeCount,
      annualRevenue: req.body.annualRevenue || req.user?.company?.revenue,
      businessNeeds: req.body.businessNeeds || [],
      techStack: req.body.techStack || [],
      previousProjects: req.body.previousProjects || [],
      region: req.body.region || req.user?.company?.region,
      businessStage: req.body.businessStage || '成長期'
    };
    
    const options = {
      topK: req.body.topK || 10,
      minScore: req.body.minScore || 0.5,
      includeReasons: req.body.includeReasons !== false
    };
    
    const matches = await aiMatchingEngine.performEnhancedMatching(
      companyProfile,
      options
    );
    
    res.json({
      success: true,
      matches,
      metadata: {
        totalFound: matches.length,
        averageScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform matching'
    });
  }
});

// Edge Function高速マッチング
router.post('/api/v1/ai-matching/edge-match', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await aiMatchingEngine.edgeFunctionInterface({
      companyId: req.user?.companyId || req.body.companyId,
      filters: req.body.filters
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Edge function matching failed'
    });
  }
});

/**
 * Live Collaboration API
 */

// コラボレーションセッション情報
router.get('/api/v1/collaboration/session/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Redisからセッション情報を取得
    const sessionInfo = await liveCollaborationHub['redis'].get(`session:${sessionId}`);
    
    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session: JSON.parse(sessionInfo)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session info'
    });
  }
});

// パフォーマンスメトリクス
router.get('/api/v1/collaboration/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const metrics = await liveCollaborationHub.getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

/**
 * 統合エンドポイント
 */

// AIアシスト付き文書作成セッション開始
router.post('/api/v1/integrated/start-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subsidyId, documentType } = req.body;
    
    // 1. 補助金情報取得
    const { data: subsidy } = await supabase
      .from('subsidies')
      .select('*')
      .eq('id', subsidyId)
      .single();
    
    if (!subsidy) {
      return res.status(404).json({
        success: false,
        error: 'Subsidy not found'
      });
    }
    
    // 2. 新しいドキュメント作成
    const { data: document } = await supabase
      .from('documents')
      .insert({
        subsidy_id: subsidyId,
        company_id: req.user?.companyId,
        type: documentType,
        status: 'draft',
        content: '',
        created_by: req.user?.id
      })
      .select()
      .single();
    
    // 3. コラボレーションセッション作成
    const session = await liveCollaborationHub['createSession'](document.id);
    
    // 4. 初期AI提案を生成
    const initialSuggestions = await documentMagicStudio.getSmartSuggestions({
      documentType: subsidy.name,
      currentSection: '事業概要',
      previousText: '',
      userProfile: {
        industry: req.user?.company?.industry || 'その他',
        companySize: req.user?.company?.size || '中規模',
        previousApplications: req.user?.stats?.applications || 0
      }
    });
    
    res.json({
      success: true,
      session: {
        id: session.id,
        documentId: document.id,
        subsidyId: subsidy.id,
        subsidyName: subsidy.name
      },
      initialSuggestions,
      subsidy
    });
  } catch (error) {
    console.error('Integrated session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start integrated session'
    });
  }
});

// ヘルスチェック
router.get('/api/v1/enhanced/health', async (req: Request, res: Response) => {
  const services = {
    documentMagic: !!documentMagicStudio,
    aiMatching: !!aiMatchingEngine,
    collaboration: !!liveCollaborationHub,
    supabase: !!supabase
  };
  
  const allHealthy = Object.values(services).every(status => status === true);
  
  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    services,
    timestamp: new Date().toISOString()
  });
});

export default router;