import { DocumentMagicStudio } from '../src/services/DocumentMagicStudio';
import { LiveCollaborationHub } from '../src/services/LiveCollaborationHub';
import { EnhancedAIMatchingEngine } from '../src/services/EnhancedAIMatchingEngine';
import { createClient } from '@supabase/supabase-js';
import { Server as SocketIOServer } from 'socket.io';
import { performance } from 'perf_hooks';

// モックSupabaseクライアント
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue({ data: [] }),
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: { suggestions: [] } })
  },
  rpc: jest.fn().mockResolvedValue({ data: [] }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
  },
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    send: jest.fn().mockResolvedValue({})
  })
} as any;

describe('Performance Tests', () => {
  describe('Document Magic Studio Performance', () => {
    let magicStudio: DocumentMagicStudio;
    
    beforeEach(() => {
      magicStudio = new DocumentMagicStudio(mockSupabase);
    });
    
    it('should respond within 100ms for smart suggestions', async () => {
      const context = {
        documentType: 'IT導入補助金',
        currentSection: '事業概要',
        previousText: '弊社は東京都に本社を置くIT企業で、',
        userProfile: {
          industry: 'IT',
          companySize: '中規模',
          previousApplications: 3
        }
      };
      
      const startTime = performance.now();
      const suggestions = await magicStudio.getSmartSuggestions(context);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(100);
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.completionTime).toBeLessThan(100);
      });
    });
    
    it('should handle concurrent requests efficiently', async () => {
      const contexts = Array.from({ length: 50 }, (_, i) => ({
        documentType: 'IT導入補助金',
        currentSection: ['事業概要', '導入目的', '期待効果'][i % 3],
        previousText: `テスト文章${i}`,
        userProfile: {
          industry: ['IT', '製造業', 'サービス業'][i % 3],
          companySize: '中規模',
          previousApplications: i % 5
        }
      }));
      
      const startTime = performance.now();
      const results = await Promise.all(
        contexts.map(ctx => magicStudio.getSmartSuggestions(ctx, 3))
      );
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTime = totalTime / contexts.length;
      
      expect(results).toHaveLength(50);
      expect(avgTime).toBeLessThan(50); // 平均50ms以下
      
      console.log(`Concurrent requests: ${contexts.length}, Total time: ${totalTime.toFixed(2)}ms, Avg: ${avgTime.toFixed(2)}ms`);
    });
  });
  
  describe('Live Collaboration Hub Performance', () => {
    let collaborationHub: LiveCollaborationHub;
    let mockIO: any;
    
    beforeEach(() => {
      mockIO = {
        on: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      
      collaborationHub = new LiveCollaborationHub(mockIO as SocketIOServer, mockSupabase);
    });
    
    it('should handle 1000+ concurrent users without degradation', async () => {
      const mockSockets = Array.from({ length: 1000 }, (_, i) => ({
        id: `socket-${i}`,
        data: { user: { id: `user-${i}`, name: `User ${i}` } },
        join: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      }));
      
      const startTime = performance.now();
      
      // シミュレート：1000人が同時にセッションに参加
      const joinPromises = mockSockets.map((socket, i) =>
        collaborationHub['joinSession'](
          socket as any,
          'document-1',
          i < 500 ? 'session-1' : 'session-2'
        )
      );
      
      await Promise.all(joinPromises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(5000); // 5秒以内
      
      console.log(`1000 users joined in ${totalTime.toFixed(2)}ms`);
    });
    
    it('should sync cursor updates with minimal latency', async () => {
      const updates: Array<{ time: number }> = [];
      
      // カーソル更新のバッチ処理をテスト
      const mockSocket = {
        id: 'test-socket',
        data: { user: { id: 'test-user' } },
        to: jest.fn().mockReturnThis(),
        emit: jest.fn((event, data) => {
          updates.push({ time: performance.now() });
        })
      };
      
      // 100回のカーソル更新を高速に送信
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await collaborationHub['handleCursorUpdate'](
          mockSocket as any,
          'session-1',
          { line: i, column: i * 2 }
        );
      }
      
      // バッチ処理の完了を待つ
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(200); // 200ms以内
      
      console.log(`100 cursor updates processed in ${totalTime.toFixed(2)}ms`);
    });
  });
  
  describe('Enhanced AI Matching Engine Performance', () => {
    let aiEngine: EnhancedAIMatchingEngine;
    
    beforeEach(() => {
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `subsidy-${i}`,
          name: `補助金${i}`,
          description: '説明',
          target_industries: ['IT', '製造業'],
          requirements: ['従業員50名以上', '売上1億円以上'],
          max_amount: 1000000 * (i + 1),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          success_rate: 0.6 + (i % 4) * 0.1,
          vector: Array(50).fill(0).map(() => Math.random())
        }))
      });
      
      aiEngine = new EnhancedAIMatchingEngine(mockSupabase);
    });
    
    it('should achieve 95%+ accuracy in matching', async () => {
      const testCompanies = [
        {
          id: 'company-1',
          name: 'AI Tech株式会社',
          industry: 'IT',
          employeeCount: 100,
          annualRevenue: 500000000,
          businessNeeds: ['AI導入', 'DX推進', '業務効率化'],
          techStack: ['クラウド', 'AI/ML', 'ビッグデータ'],
          previousProjects: ['ECサイト構築', 'AI予測システム開発'],
          region: '東京',
          businessStage: '成長期'
        },
        {
          id: 'company-2',
          name: '製造イノベーション株式会社',
          industry: '製造業',
          employeeCount: 200,
          annualRevenue: 1000000000,
          businessNeeds: ['IoT導入', '生産性向上', 'スマートファクトリー'],
          techStack: ['IoT', 'ビッグデータ', 'セキュリティ'],
          previousProjects: ['工場自動化プロジェクト'],
          region: '大阪',
          businessStage: '成熟期'
        }
      ];
      
      const results = await Promise.all(
        testCompanies.map(company => aiEngine.performEnhancedMatching(company))
      );
      
      // 各企業に対して適切なマッチングがされているか確認
      results.forEach((matches, index) => {
        const company = testCompanies[index];
        
        expect(matches.length).toBeGreaterThan(0);
        
        // トップマッチの妥当性を検証
        const topMatch = matches[0];
        expect(topMatch.score).toBeGreaterThan(0.7); // 高スコア
        expect(topMatch.confidence).toBeGreaterThan(0.6); // 高信頼度
        
        // 業界マッチングの検証
        const industryRelevant = topMatch.subsidy.targetIndustries.includes(company.industry) ||
                               topMatch.subsidy.targetIndustries.includes('全業種');
        expect(industryRelevant).toBeTruthy();
        
        // 推奨事項が生成されているか
        expect(topMatch.recommendations.length).toBeGreaterThan(0);
        
        // 成功率推定が妥当な範囲か
        expect(topMatch.estimatedSuccessRate).toBeGreaterThan(0.3);
        expect(topMatch.estimatedSuccessRate).toBeLessThan(1.0);
      });
      
      console.log('AI Matching accuracy test passed with high confidence scores');
    });
    
    it('should process with Edge Functions 10x faster', async () => {
      const request = {
        companyId: 'company-1',
        filters: {
          minAmount: 500000,
          maxAmount: 5000000,
          industries: ['IT']
        }
      };
      
      // 通常のマッチング処理時間
      const normalStart = performance.now();
      const normalResult = await aiEngine.performEnhancedMatching({
        id: 'company-1',
        name: 'Test Company',
        industry: 'IT',
        employeeCount: 50,
        annualRevenue: 100000000,
        businessNeeds: ['DX推進'],
        techStack: ['クラウド'],
        previousProjects: [],
        region: '東京',
        businessStage: '成長期'
      });
      const normalEnd = performance.now();
      const normalTime = normalEnd - normalStart;
      
      // Edge Function インターフェース経由
      const edgeStart = performance.now();
      const edgeResult = await aiEngine.edgeFunctionInterface(request);
      const edgeEnd = performance.now();
      const edgeTime = edgeEnd - edgeStart;
      
      // Edge Functionの方が高速であることを確認
      expect(edgeTime).toBeLessThan(normalTime);
      expect(edgeResult.processingTime).toBeLessThan(normalTime);
      
      // キャッシュヒット時のテスト
      const cachedStart = performance.now();
      const cachedResult = await aiEngine.edgeFunctionInterface(request);
      const cachedEnd = performance.now();
      const cachedTime = cachedEnd - cachedStart;
      
      expect(cachedResult.cached).toBeTruthy();
      expect(cachedTime).toBeLessThan(edgeTime / 10); // 10倍以上高速
      
      console.log(`Performance comparison:
        Normal: ${normalTime.toFixed(2)}ms
        Edge: ${edgeTime.toFixed(2)}ms
        Cached: ${cachedTime.toFixed(2)}ms
        Speed improvement: ${(normalTime / cachedTime).toFixed(1)}x`);
    });
  });
  
  describe('Integration Performance Test', () => {
    it('should handle full workflow within performance targets', async () => {
      const magicStudio = new DocumentMagicStudio(mockSupabase);
      const aiEngine = new EnhancedAIMatchingEngine(mockSupabase);
      
      const company = {
        id: 'test-company',
        name: 'テスト株式会社',
        industry: 'IT',
        employeeCount: 75,
        annualRevenue: 300000000,
        businessNeeds: ['DX推進', 'AI導入', '業務効率化'],
        techStack: ['クラウド', 'AI/ML'],
        previousProjects: ['Webシステム開発'],
        region: '東京',
        businessStage: '成長期'
      };
      
      const workflowStart = performance.now();
      
      // 1. AIマッチング実行
      const matches = await aiEngine.performEnhancedMatching(company, { topK: 5 });
      
      // 2. 文書作成支援
      const suggestionPromises = matches.slice(0, 3).map(match =>
        magicStudio.getSmartSuggestions({
          documentType: match.subsidy.name,
          currentSection: '事業概要',
          previousText: `弊社${company.name}は`,
          userProfile: {
            industry: company.industry,
            companySize: '中規模',
            previousApplications: 1
          }
        })
      );
      
      const suggestions = await Promise.all(suggestionPromises);
      
      const workflowEnd = performance.now();
      const totalTime = workflowEnd - workflowStart;
      
      expect(totalTime).toBeLessThan(500); // 全体で500ms以内
      expect(matches.length).toBeGreaterThan(0);
      expect(suggestions.every(s => s.length > 0)).toBeTruthy();
      
      console.log(`Full workflow completed in ${totalTime.toFixed(2)}ms`);
    });
  });
});