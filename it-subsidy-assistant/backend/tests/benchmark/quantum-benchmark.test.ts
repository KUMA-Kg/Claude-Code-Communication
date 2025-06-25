import { QuantumMatchingEngineV2 } from '../../src/services/quantum/QuantumMatchingEngineV2';
import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// モックSupabaseクライアント
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue({ data: [] }),
  rpc: jest.fn().mockResolvedValue({ data: [] })
} as any;

describe('Quantum Matching Engine V2 Benchmark Tests', () => {
  let quantumEngine: QuantumMatchingEngineV2;
  
  beforeAll(() => {
    quantumEngine = new QuantumMatchingEngineV2(mockSupabase, 3);
  });
  
  afterAll(() => {
    // TensorFlowのメモリをクリーンアップ
    if (global.gc) {
      global.gc();
    }
  });
  
  describe('Performance Benchmarks', () => {
    it('should achieve 99%+ accuracy in matching', async () => {
      // テスト用の企業プロファイル
      const testCompanies = [
        {
          id: 'quantum-test-1',
          name: 'QuantumTech株式会社',
          industry: 'IT',
          scale: 100,
          needs: ['DX推進', 'AI導入', 'クラウド化'],
          region: '東京'
        },
        {
          id: 'quantum-test-2',
          name: '量子製造株式会社',
          industry: '製造業',
          scale: 500,
          needs: ['IoT活用', '生産性向上', 'スマートファクトリー'],
          region: '大阪'
        }
      ];
      
      // テスト用の補助金候補
      const subsidyCandidates = Array.from({ length: 100 }, (_, i) => ({
        id: `subsidy-${i}`,
        name: `補助金プログラム${i}`,
        targetIndustries: i % 2 === 0 ? ['IT'] : ['製造業'],
        maxAmount: 1000000 * (i + 1),
        requirements: ['従業員50名以上', '年商1億円以上'],
        successRate: 0.6 + (i % 4) * 0.1
      }));
      
      // モックRPCレスポンス
      mockSupabase.rpc.mockResolvedValue({
        data: subsidyCandidates.slice(0, 20).map(s => ({
          ...s,
          similarity: 0.7 + Math.random() * 0.3,
          vector: Array(64).fill(0).map(() => Math.random())
        }))
      });
      
      let totalAccuracy = 0;
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const company = testCompanies[i % testCompanies.length];
        
        const startTime = performance.now();
        const results = await quantumEngine.performQuantumMatching(
          company,
          subsidyCandidates,
          {
            measurementShots: 100,
            parallelUniverses: 5
          }
        );
        const endTime = performance.now();
        
        // 結果の検証
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
        
        // 精度の計算（業界マッチングの正確性）
        const topMatch = results[0];
        const expectedIndustry = company.industry;
        const matchedCorrectly = subsidyCandidates
          .find(s => s.id === topMatch.particleId)
          ?.targetIndustries.includes(expectedIndustry);
        
        if (matchedCorrectly) {
          totalAccuracy += 1;
        }
        
        console.log(`Iteration ${i + 1}: ${endTime - startTime}ms, Matched: ${matchedCorrectly}`);
      }
      
      const accuracy = (totalAccuracy / iterations) * 100;
      console.log(`Overall accuracy: ${accuracy}%`);
      
      // 99%以上の精度を達成
      expect(accuracy).toBeGreaterThanOrEqual(99);
    });
    
    it('should process 100万件/時 throughput', async () => {
      const targetThroughput = 1000000; // 100万件/時
      const testDuration = 1000; // 1秒間のテスト
      
      // 簡易な企業プロファイル
      const simpleProfile = {
        id: 'throughput-test',
        vector: Array(64).fill(0).map(() => Math.random())
      };
      
      let processedCount = 0;
      const startTime = performance.now();
      
      // 1秒間処理を実行
      while (performance.now() - startTime < testDuration) {
        await quantumEngine.quantumVectorSearch(simpleProfile.vector, 5);
        processedCount++;
      }
      
      const actualDuration = performance.now() - startTime;
      const throughputPerSecond = processedCount / (actualDuration / 1000);
      const throughputPerHour = throughputPerSecond * 3600;
      
      console.log(`Processed ${processedCount} requests in ${actualDuration}ms`);
      console.log(`Throughput: ${throughputPerHour.toFixed(0)} requests/hour`);
      
      // 100万件/時以上の処理能力
      expect(throughputPerHour).toBeGreaterThanOrEqual(targetThroughput);
    });
    
    it('should maintain low latency under load', async () => {
      const concurrentRequests = 100;
      const latencies: number[] = [];
      
      // 並行リクエストのシミュレーション
      const requests = Array.from({ length: concurrentRequests }, async (_, i) => {
        const profile = {
          id: `concurrent-${i}`,
          industry: i % 2 === 0 ? 'IT' : '製造業',
          scale: 50 + i,
          needs: ['DX推進'],
          region: '東京'
        };
        
        const startTime = performance.now();
        await quantumEngine.performQuantumMatching(
          profile,
          [],
          { measurementShots: 10, parallelUniverses: 2 }
        );
        const endTime = performance.now();
        
        const latency = endTime - startTime;
        latencies.push(latency);
        
        return latency;
      });
      
      await Promise.all(requests);
      
      // レイテンシ統計
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
      const p99Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];
      
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`P95 latency: ${p95Latency.toFixed(2)}ms`);
      console.log(`P99 latency: ${p99Latency.toFixed(2)}ms`);
      
      // レイテンシ要件（10ms以下）
      expect(avgLatency).toBeLessThan(10);
      expect(p95Latency).toBeLessThan(15);
      expect(p99Latency).toBeLessThan(20);
    });
  });
  
  describe('Quantum Algorithm Verification', () => {
    it('should demonstrate quantum advantage', async () => {
      const profile = {
        id: 'quantum-advantage-test',
        industry: 'IT',
        scale: 100,
        needs: ['AI導入', 'DX推進', 'クラウド化', 'セキュリティ強化'],
        region: '東京'
      };
      
      const subsidies = Array.from({ length: 50 }, (_, i) => ({
        id: `subsidy-${i}`,
        name: `補助金${i}`,
        targetIndustries: ['IT', '製造業', 'サービス業'][i % 3],
        requirements: [],
        maxAmount: 1000000 * i
      }));
      
      const results = await quantumEngine.performQuantumMatching(
        profile,
        subsidies,
        { parallelUniverses: 10 }
      );
      
      // 量子優位性の検証
      results.forEach(result => {
        expect(result.quantumAdvantage).toBeGreaterThan(1); // 古典的手法より優れている
        expect(result.entanglementStrength).toBeGreaterThan(0); // 量子もつれが存在
        expect(result.phase).toBeDefined(); // 位相情報が保持されている
      });
      
      const avgQuantumAdvantage = results.reduce((sum, r) => sum + r.quantumAdvantage, 0) / results.length;
      console.log(`Average quantum advantage: ${avgQuantumAdvantage.toFixed(2)}x`);
      
      expect(avgQuantumAdvantage).toBeGreaterThan(5); // 5倍以上の優位性
    });
    
    it('should maintain quantum coherence', async () => {
      // 量子コヒーレンスのテスト
      const testStates = 10;
      let totalCoherence = 0;
      
      for (let i = 0; i < testStates; i++) {
        const state = await quantumEngine['prepareQuantumState']({
          vector: Array(64).fill(0).map(() => Math.random())
        });
        
        totalCoherence += state.coherence;
      }
      
      const avgCoherence = totalCoherence / testStates;
      console.log(`Average coherence: ${avgCoherence.toFixed(4)}`);
      
      // 高いコヒーレンスを維持（0.8以上）
      expect(avgCoherence).toBeGreaterThan(0.8);
    });
  });
  
  describe('Scalability Tests', () => {
    it('should scale linearly with input size', async () => {
      const sizes = [10, 50, 100, 500];
      const timings: number[] = [];
      
      for (const size of sizes) {
        const subsidies = Array.from({ length: size }, (_, i) => ({
          id: `scale-${i}`,
          name: `補助金${i}`,
          targetIndustries: ['IT'],
          requirements: []
        }));
        
        const startTime = performance.now();
        await quantumEngine.performQuantumMatching(
          { id: 'scale-test', industry: 'IT', needs: [] },
          subsidies,
          { measurementShots: 10, parallelUniverses: 2 }
        );
        const endTime = performance.now();
        
        timings.push(endTime - startTime);
      }
      
      // 線形性の検証（O(n)に近い）
      for (let i = 1; i < sizes.length; i++) {
        const expectedRatio = sizes[i] / sizes[0];
        const actualRatio = timings[i] / timings[0];
        const deviation = Math.abs(actualRatio - expectedRatio) / expectedRatio;
        
        console.log(`Size ${sizes[i]}: Expected ratio ${expectedRatio}, Actual ratio ${actualRatio.toFixed(2)}, Deviation ${(deviation * 100).toFixed(1)}%`);
        
        // 20%以内の偏差で線形スケーリング
        expect(deviation).toBeLessThan(0.2);
      }
    });
  });
});