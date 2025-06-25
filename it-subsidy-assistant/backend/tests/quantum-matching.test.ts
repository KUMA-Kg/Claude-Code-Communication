import { QuantumMatchingEngine } from '../src/services/QuantumMatchingEngine';
import { AIDocumentDNAGenerator } from '../src/services/AIDocumentDNAGenerator';

describe('Quantum Matching Engine Tests', () => {
  let quantumEngine: QuantumMatchingEngine;
  
  beforeEach(() => {
    quantumEngine = new QuantumMatchingEngine();
  });
  
  describe('Quantum State Generation', () => {
    it('should create valid quantum states for companies', async () => {
      const mockCompany = {
        id: 'test-company-1',
        name: 'テスト株式会社',
        industry: 'IT',
        employeeCount: 50,
        businessNeeds: ['DX推進', '業務効率化', 'AI活用'],
        techStack: ['クラウド', 'AI', 'IoT'],
        projectTimeline: '3ヶ月以内'
      };
      
      const result = await quantumEngine.performQuantumMatching(mockCompany);
      
      expect(result).toBeDefined();
      expect(result.matches).toBeInstanceOf(Array);
      expect(result.quantumInsights).toBeInstanceOf(Array);
      
      // 量子スコアの妥当性を検証
      result.matches.forEach(match => {
        expect(match.quantumScore).toBeGreaterThanOrEqual(0);
        expect(match.quantumScore).toBeLessThanOrEqual(1);
        expect(match.probability).toBeGreaterThanOrEqual(0.5);
        expect(match.collapseReason).toBeTruthy();
      });
    });
    
    it('should discover hidden correlations through quantum entanglement', async () => {
      const mockCompany = {
        id: 'test-company-2',
        name: '革新テック',
        industry: 'IT',
        employeeCount: 30,
        businessNeeds: ['新規事業', 'AI活用', 'グローバル展開'],
        techStack: ['AI', 'ブロックチェーン', 'ビッグデータ'],
        projectTimeline: '緊急'
      };
      
      const result = await quantumEngine.performQuantumMatching(mockCompany);
      
      // 強い量子もつれが検出されるべき
      const strongMatches = result.matches.filter(m => m.quantumScore > 0.8);
      expect(strongMatches.length).toBeGreaterThan(0);
      
      // 量子的洞察が生成されるべき
      expect(result.quantumInsights.length).toBeGreaterThan(0);
      expect(result.quantumInsights.some(insight => 
        insight.includes('異常に強い') || insight.includes('隠れた成功要因')
      )).toBeTruthy();
    });
  });
  
  describe('Performance and Scalability', () => {
    it('should handle multiple companies efficiently', async () => {
      const companies = Array.from({ length: 10 }, (_, i) => ({
        id: `company-${i}`,
        name: `企業${i}`,
        industry: ['IT', '製造業', 'サービス業'][i % 3],
        employeeCount: 20 + i * 10,
        businessNeeds: ['DX推進', '業務効率化'],
        techStack: ['クラウド'],
        projectTimeline: '6ヶ月以内'
      }));
      
      const startTime = Date.now();
      const results = await Promise.all(
        companies.map(company => quantumEngine.performQuantumMatching(company))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
      
      // 各企業で異なる結果が出るべき
      const uniqueTopMatches = new Set(
        results.map(r => r.matches[0]?.subsidy?.id).filter(Boolean)
      );
      expect(uniqueTopMatches.size).toBeGreaterThan(1);
    });
  });
});

describe('AI Document DNA Generator Tests', () => {
  let dnaGenerator: AIDocumentDNAGenerator;
  
  beforeEach(() => {
    dnaGenerator = new AIDocumentDNAGenerator();
  });
  
  describe('Evolutionary Document Generation', () => {
    it('should generate evolved documents with mutations', async () => {
      const mockCompany = {
        id: 'test-company',
        name: 'イノベーション株式会社',
        industry: 'IT',
        strengths: ['技術力', '開発スピード', '顧客満足度']
      };
      
      const result = await dnaGenerator.generateEvolutionaryDocument(
        mockCompany,
        'subsidy-001',
        1
      );
      
      expect(result).toBeDefined();
      expect(result.document).toBeTruthy();
      expect(result.dna).toBeDefined();
      expect(result.fitness).toBeGreaterThan(0);
      expect(result.fitness).toBeLessThanOrEqual(1);
      
      // 突然変異が適用されているか確認
      expect(result.mutations.length).toBeGreaterThan(0);
      
      // 企業固有の情報が含まれているか確認
      expect(result.document).toContain(mockCompany.name);
    });
    
    it('should improve fitness over generations', async () => {
      const mockCompany = {
        id: 'test-company',
        name: '進化テック',
        industry: 'IT',
        strengths: ['AI技術', 'データ分析']
      };
      
      const generations = [];
      
      // 3世代分の進化をシミュレート
      for (let gen = 1; gen <= 3; gen++) {
        const result = await dnaGenerator.generateEvolutionaryDocument(
          mockCompany,
          'subsidy-002',
          gen
        );
        generations.push(result);
      }
      
      // 世代が進むにつれて適応度が向上するはず
      expect(generations[2].fitness).toBeGreaterThanOrEqual(generations[0].fitness);
      
      // DNA構造が進化しているか確認
      expect(generations[2].dna.generation).toBe(3);
    });
  });
  
  describe('DNA Analysis and Traits', () => {
    it('should extract meaningful traits from documents', async () => {
      const mockCompany = {
        id: 'test-company',
        name: 'トレイト分析社',
        industry: '製造業',
        strengths: ['品質管理', '効率化']
      };
      
      const result = await dnaGenerator.generateEvolutionaryDocument(
        mockCompany,
        'subsidy-003',
        1
      );
      
      // 各遺伝子が適切な特性を持っているか確認
      result.dna.genes.forEach(gene => {
        expect(gene.traits.clarity).toBeGreaterThan(0);
        expect(gene.traits.persuasiveness).toBeGreaterThan(0);
        expect(gene.traits.completeness).toBeGreaterThan(0);
        expect(gene.traits.innovation).toBeGreaterThan(0);
        
        // すべての特性が0-1の範囲内
        Object.values(gene.traits).forEach(trait => {
          expect(trait).toBeGreaterThanOrEqual(0);
          expect(trait).toBeLessThanOrEqual(1);
        });
      });
    });
  });
  
  describe('Document Quality Assurance', () => {
    it('should generate documents with required sections', async () => {
      const mockCompany = {
        id: 'test-company',
        name: '品質保証株式会社',
        industry: 'サービス業',
        strengths: ['顧客対応', 'スピード']
      };
      
      const result = await dnaGenerator.generateEvolutionaryDocument(
        mockCompany,
        'subsidy-004',
        1
      );
      
      // 必須セクションが含まれているか確認
      const requiredKeywords = ['申請企業', '申請日'];
      requiredKeywords.forEach(keyword => {
        expect(result.document).toContain(keyword);
      });
      
      // 文書が適切な長さを持っているか
      expect(result.document.length).toBeGreaterThan(100);
      
      // 適応度が閾値を超えているか
      expect(result.fitness).toBeGreaterThan(0.3);
    });
  });
});