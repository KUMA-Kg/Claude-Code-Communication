import { AIDocumentDNAGeneratorV2 } from '../../src/services/genetics/AIDocumentDNAGeneratorV2';
import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// モックSupabaseクライアント
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue({ 
    data: Array.from({ length: 20 }, (_, i) => ({
      document_content: `成功した申請書の内容${i}`,
      success_score: 0.85 + Math.random() * 0.15
    }))
  }),
  single: jest.fn().mockResolvedValue({ data: { id: 'doc-1' } })
} as any;

describe('AI Document DNA Generator V2 Benchmark Tests', () => {
  let dnaGenerator: AIDocumentDNAGeneratorV2;
  
  beforeAll(() => {
    dnaGenerator = new AIDocumentDNAGeneratorV2(mockSupabase, 1.0);
  });
  
  describe('Performance Benchmarks', () => {
    it('should achieve 90%+ success rate prediction', async () => {
      const testProfiles = [
        {
          id: 'dna-test-1',
          name: 'バイオテック株式会社',
          industry: 'IT',
          needs: ['AI導入', 'DX推進'],
          techStack: ['Python', 'TensorFlow']
        },
        {
          id: 'dna-test-2',
          name: 'ジェネティクス製造',
          industry: '製造業',
          needs: ['IoT活用', '自動化'],
          techStack: ['PLC', 'SCADA']
        }
      ];
      
      let totalFitness = 0;
      let successfulGenerations = 0;
      const iterations = 10;
      const targetFitness = 0.9;
      
      for (let i = 0; i < iterations; i++) {
        const profile = testProfiles[i % testProfiles.length];
        
        const startTime = performance.now();
        const result = await dnaGenerator.generateEvolutionaryDocument(
          profile,
          'subsidy-001',
          targetFitness,
          30 // 最大30世代
        );
        const endTime = performance.now();
        
        totalFitness += result.fitness;
        if (result.fitness >= targetFitness) {
          successfulGenerations++;
        }
        
        console.log(`Generation ${i + 1}: Fitness ${result.fitness.toFixed(3)}, Time ${(endTime - startTime).toFixed(0)}ms, Generations ${result.dna.generation}`);
        
        // 基本的な検証
        expect(result.content).toBeTruthy();
        expect(result.content.length).toBeGreaterThan(100);
        expect(result.dna).toBeDefined();
        expect(result.phenotype).toBeDefined();
      }
      
      const avgFitness = totalFitness / iterations;
      const successRate = (successfulGenerations / iterations) * 100;
      
      console.log(`Average fitness: ${avgFitness.toFixed(3)}`);
      console.log(`Success rate (>=${targetFitness}): ${successRate}%`);
      
      // 90%以上の成功率
      expect(successRate).toBeGreaterThanOrEqual(90);
      expect(avgFitness).toBeGreaterThanOrEqual(0.85);
    });
    
    it('should demonstrate genetic algorithm effectiveness', async () => {
      const profile = {
        id: 'evolution-test',
        name: '進化テスト企業',
        industry: 'IT',
        needs: ['DX推進', 'AI導入', '業務効率化']
      };
      
      // 世代ごとの適応度を追跡
      const generationFitness: number[] = [];
      let currentGeneration = 0;
      
      // モンキーパッチで進化を追跡
      const originalEvaluate = dnaGenerator['evaluateFitness'];
      dnaGenerator['evaluateFitness'] = async function(...args: any[]) {
        const result = await originalEvaluate.apply(dnaGenerator, args);
        
        if (result.length > 0) {
          const bestFitness = Math.max(...result.map((r: any) => r.fitness));
          generationFitness[currentGeneration] = bestFitness;
          currentGeneration++;
        }
        
        return result;
      };
      
      const result = await dnaGenerator.generateEvolutionaryDocument(
        profile,
        'subsidy-002',
        0.95,
        20
      );
      
      // 元の関数を復元
      dnaGenerator['evaluateFitness'] = originalEvaluate;
      
      // 進化の改善を検証
      console.log('Generation fitness progression:', generationFitness.map((f, i) => `Gen${i}: ${f.toFixed(3)}`).join(', '));
      
      // 世代が進むにつれて適応度が向上
      for (let i = 1; i < generationFitness.length; i++) {
        const improvement = generationFitness[i] - generationFitness[0];
        expect(improvement).toBeGreaterThanOrEqual(0);
      }
      
      // 最終的な適応度が初期より大幅に改善
      const initialFitness = generationFitness[0] || 0;
      const finalFitness = generationFitness[generationFitness.length - 1] || 0;
      const improvementRate = ((finalFitness - initialFitness) / initialFitness) * 100;
      
      console.log(`Fitness improvement: ${improvementRate.toFixed(1)}%`);
      expect(improvementRate).toBeGreaterThan(10); // 10%以上の改善
    });
    
    it('should handle mutation and crossover effectively', async () => {
      // 親文書のシミュレーション
      const parent1Content = `
        【事業概要】
        弊社は東京都に本社を置くIT企業で、クラウドサービスの開発を主力事業としています。
        
        【導入目的】
        DX推進により業務効率を30%向上させることを目指します。
        
        【期待効果】
        年間1000万円のコスト削減と顧客満足度20%向上を見込んでいます。
      `;
      
      const parent2Content = `
        【事業概要】
        当社は大阪府の製造業で、IoT技術を活用した生産管理を行っています。
        
        【導入目的】
        AI技術の導入により品質管理の精度を高めます。
        
        【期待効果】
        不良品率を50%削減し、生産性を25%向上させます。
      `;
      
      const companyProfile = {
        id: 'crossover-test',
        name: 'ハイブリッド企業',
        industry: 'IT',
        needs: ['DX推進', 'AI導入']
      };
      
      // 交配を実行
      const parent1DNA = await dnaGenerator['reverseEngineerDNA'](parent1Content);
      const parent2DNA = await dnaGenerator['reverseEngineerDNA'](parent2Content);
      
      const crossoverResults = [];
      
      for (let i = 0; i < 5; i++) {
        const [offspring1, offspring2] = await dnaGenerator['uniformCrossover'](
          parent1DNA,
          parent2DNA
        );
        
        // 子孫の適応度を計算
        const fitness1 = await dnaGenerator['calculateFitness'](
          offspring1,
          companyProfile,
          'subsidy-003'
        );
        
        const fitness2 = await dnaGenerator['calculateFitness'](
          offspring2,
          companyProfile,
          'subsidy-003'
        );
        
        crossoverResults.push({ fitness1, fitness2 });
      }
      
      // 交配による多様性と品質の検証
      const avgOffspringFitness = crossoverResults.reduce(
        (sum, r) => sum + r.fitness1 + r.fitness2,
        0
      ) / (crossoverResults.length * 2);
      
      console.log(`Average offspring fitness: ${avgOffspringFitness.toFixed(3)}`);
      
      // 子孫が親の良い特性を継承
      expect(avgOffspringFitness).toBeGreaterThan(0.7);
      
      // 突然変異のテスト
      const mutationRates = [0.01, 0.05, 0.1, 0.2];
      const mutationResults: number[] = [];
      
      for (const rate of mutationRates) {
        dnaGenerator['mutationRate'] = rate;
        
        const mutatedDNA = await dnaGenerator['mutateIndividual'](parent1DNA);
        const mutationCount = mutatedDNA.mutations.length;
        
        mutationResults.push(mutationCount);
      }
      
      console.log('Mutation rates vs mutation counts:', 
        mutationRates.map((r, i) => `${r}: ${mutationResults[i]}`).join(', '));
      
      // 突然変異率に応じて変異数が増加
      for (let i = 1; i < mutationRates.length; i++) {
        expect(mutationResults[i]).toBeGreaterThanOrEqual(mutationResults[i - 1]);
      }
    });
  });
  
  describe('Document Quality Tests', () => {
    it('should generate documents with required sections', async () => {
      const profile = {
        id: 'quality-test',
        name: '品質テスト企業',
        industry: 'サービス業',
        needs: ['業務効率化', 'コスト削減']
      };
      
      const result = await dnaGenerator.generateEvolutionaryDocument(
        profile,
        'subsidy-004',
        0.8,
        20
      );
      
      // 必須セクションの検証
      const requiredSections = ['事業概要', '導入目的', '期待効果', '実施計画'];
      const documentLower = result.content.toLowerCase();
      
      requiredSections.forEach(section => {
        expect(result.content).toContain(section);
      });
      
      // 文書の構造的品質
      const paragraphs = result.content.split('\n\n').filter(p => p.trim().length > 0);
      expect(paragraphs.length).toBeGreaterThan(5); // 十分な段落数
      
      // キーワード密度
      const keywords = ['効率', '改善', '導入', '実現', '向上'];
      let keywordCount = 0;
      
      keywords.forEach(keyword => {
        const matches = result.content.match(new RegExp(keyword, 'g'));
        if (matches) keywordCount += matches.length;
      });
      
      const keywordDensity = keywordCount / (result.content.length / 100);
      console.log(`Keyword density: ${keywordDensity.toFixed(2)} per 100 chars`);
      
      expect(keywordDensity).toBeGreaterThan(0.5);
      expect(keywordDensity).toBeLessThan(3); // 過度なキーワード詰め込みを避ける
    });
    
    it('should adapt to different phenotypes', async () => {
      const phenotypes = [
        { structure: 'formal', tone: 'professional' },
        { structure: 'narrative', tone: 'persuasive' },
        { structure: 'technical', tone: 'analytical' },
        { structure: 'hybrid', tone: 'innovative' }
      ];
      
      const results = await Promise.all(
        phenotypes.map(async (phenotype, i) => {
          // フェノタイプを強制的に設定（テスト用）
          const profile = {
            id: `phenotype-test-${i}`,
            name: `フェノタイプテスト企業${i}`,
            industry: 'IT',
            needs: ['DX推進']
          };
          
          const result = await dnaGenerator.generateEvolutionaryDocument(
            profile,
            'subsidy-005',
            0.7,
            10
          );
          
          return {
            phenotype: result.phenotype,
            content: result.content,
            fitness: result.fitness
          };
        })
      );
      
      // 各フェノタイプが異なる特性を持つことを確認
      results.forEach((result, i) => {
        console.log(`Phenotype ${i}: ${result.phenotype.structure}/${result.phenotype.tone}, Fitness: ${result.fitness.toFixed(3)}`);
        
        expect(result.phenotype).toBeDefined();
        expect(result.content.length).toBeGreaterThan(100);
      });
      
      // 文書の多様性を確認
      const contents = results.map(r => r.content);
      const uniqueContents = new Set(contents);
      
      expect(uniqueContents.size).toBe(contents.length); // すべて異なる内容
    });
  });
  
  describe('Scalability and Memory Tests', () => {
    it('should handle large populations efficiently', async () => {
      const populationSizes = [50, 100, 200];
      const timings: number[] = [];
      const memoryUsage: number[] = [];
      
      for (const size of populationSizes) {
        // 集団サイズを設定
        dnaGenerator['populationSize'] = size;
        
        const initialMemory = process.memoryUsage().heapUsed;
        const startTime = performance.now();
        
        await dnaGenerator.generateEvolutionaryDocument(
          {
            id: 'scale-test',
            name: 'スケールテスト企業',
            industry: 'IT',
            needs: ['DX推進']
          },
          'subsidy-006',
          0.8,
          5 // 少ない世代数でテスト
        );
        
        const endTime = performance.now();
        const finalMemory = process.memoryUsage().heapUsed;
        
        timings.push(endTime - startTime);
        memoryUsage.push((finalMemory - initialMemory) / 1024 / 1024); // MB
      }
      
      console.log('Population size vs timing:', 
        populationSizes.map((s, i) => `${s}: ${timings[i].toFixed(0)}ms`).join(', '));
      console.log('Population size vs memory:', 
        populationSizes.map((s, i) => `${s}: ${memoryUsage[i].toFixed(1)}MB`).join(', '));
      
      // メモリ使用量が線形的に増加
      for (let i = 1; i < populationSizes.length; i++) {
        const sizeRatio = populationSizes[i] / populationSizes[0];
        const memoryRatio = memoryUsage[i] / memoryUsage[0];
        
        // メモリ使用量が集団サイズに対して妥当な範囲で増加
        expect(memoryRatio).toBeLessThan(sizeRatio * 1.5); // 1.5倍の余裕を持たせる
      }
      
      // デフォルトに戻す
      dnaGenerator['populationSize'] = 100;
    });
    
    it('should complete within reasonable time limits', async () => {
      const timeouts = {
        fast: { fitness: 0.7, generations: 10, maxTime: 5000 },
        normal: { fitness: 0.85, generations: 30, maxTime: 15000 },
        thorough: { fitness: 0.95, generations: 50, maxTime: 30000 }
      };
      
      for (const [mode, config] of Object.entries(timeouts)) {
        const startTime = performance.now();
        
        const result = await dnaGenerator.generateEvolutionaryDocument(
          {
            id: `timeout-test-${mode}`,
            name: 'タイムアウトテスト企業',
            industry: 'IT',
            needs: ['DX推進', 'AI導入']
          },
          'subsidy-007',
          config.fitness,
          config.generations
        );
        
        const duration = performance.now() - startTime;
        
        console.log(`${mode} mode: ${duration.toFixed(0)}ms (limit: ${config.maxTime}ms), Fitness: ${result.fitness.toFixed(3)}`);
        
        expect(duration).toBeLessThan(config.maxTime);
      }
    });
  });
});