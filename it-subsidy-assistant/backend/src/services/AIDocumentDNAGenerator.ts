import { supabase } from '../config/supabase';
import natural from 'natural';

interface DocumentGene {
  id: string;
  sequence: string[];
  fitness: number;
  traits: {
    clarity: number;
    persuasiveness: number;
    completeness: number;
    innovation: number;
  };
}

interface DocumentDNA {
  genes: DocumentGene[];
  generation: number;
  mutationRate: number;
  crossoverPoints: number[];
}

export class AIDocumentDNAGenerator {
  private tokenizer = new natural.WordTokenizer();
  private tfidf = new natural.TfIdf();
  private successfulDocumentPool: DocumentDNA[] = [];
  
  /**
   * 成功した申請書類からDNAを抽出し、新しい書類を生成
   */
  async generateEvolutionaryDocument(
    companyProfile: any,
    subsidyId: string,
    generation: number = 1
  ): Promise<{
    document: string;
    dna: DocumentDNA;
    fitness: number;
    mutations: string[];
  }> {
    // 成功した申請書類のDNAプールを読み込み
    await this.loadSuccessfulDocumentGenes(subsidyId);
    
    // 最適な親DNAを選択（トーナメント選択）
    const parents = this.selectParentDocuments(2);
    
    // 交叉（クロスオーバー）による新しいDNA生成
    const offspringDNA = this.crossover(parents[0], parents[1]);
    
    // 企業固有の突然変異を適用
    const mutatedDNA = this.applyMutations(offspringDNA, companyProfile);
    
    // DNAから実際の文書を生成
    const document = await this.expressGenesToDocument(mutatedDNA, companyProfile);
    
    // 適応度（フィットネス）を計算
    const fitness = this.calculateFitness(document, subsidyId);
    
    // 進化の記録を保存
    await this.saveEvolutionRecord(mutatedDNA, fitness);
    
    return {
      document,
      dna: mutatedDNA,
      fitness,
      mutations: mutatedDNA.genes.map(g => g.id).filter(id => id.includes('mutation'))
    };
  }
  
  /**
   * 成功した書類からDNAプールを構築
   */
  private async loadSuccessfulDocumentGenes(subsidyId: string): Promise<void> {
    const { data: successfulApplications } = await supabase
      .from('applications')
      .select('document_content, success_score')
      .eq('subsidy_id', subsidyId)
      .eq('status', 'approved')
      .gte('success_score', 0.8)
      .order('success_score', { ascending: false })
      .limit(50);
    
    this.successfulDocumentPool = [];
    
    for (const app of successfulApplications || []) {
      const dna = this.extractDocumentDNA(app.document_content, app.success_score);
      this.successfulDocumentPool.push(dna);
    }
  }
  
  /**
   * 文書からDNAを抽出
   */
  private extractDocumentDNA(content: string, successScore: number): DocumentDNA {
    const sections = this.splitIntoSections(content);
    const genes: DocumentGene[] = [];
    
    sections.forEach((section, index) => {
      const tokens = this.tokenizer.tokenize(section);
      const gene: DocumentGene = {
        id: `gene_${index}_${Date.now()}`,
        sequence: tokens || [],
        fitness: successScore,
        traits: this.analyzeTextTraits(section)
      };
      genes.push(gene);
    });
    
    return {
      genes,
      generation: 1,
      mutationRate: 0.1,
      crossoverPoints: this.identifyCrossoverPoints(genes)
    };
  }
  
  /**
   * トーナメント選択による親の選定
   */
  private selectParentDocuments(count: number): DocumentDNA[] {
    const selected: DocumentDNA[] = [];
    const tournamentSize = 3;
    
    for (let i = 0; i < count; i++) {
      const tournament: DocumentDNA[] = [];
      
      // ランダムにトーナメント参加者を選択
      for (let j = 0; j < tournamentSize; j++) {
        const randomIndex = Math.floor(Math.random() * this.successfulDocumentPool.length);
        tournament.push(this.successfulDocumentPool[randomIndex]);
      }
      
      // 最も適応度の高い個体を選択
      const winner = tournament.reduce((best, current) => {
        const currentFitness = this.calculateDNAFitness(current);
        const bestFitness = this.calculateDNAFitness(best);
        return currentFitness > bestFitness ? current : best;
      });
      
      selected.push(winner);
    }
    
    return selected;
  }
  
  /**
   * 交叉による新しいDNA生成
   */
  private crossover(parent1: DocumentDNA, parent2: DocumentDNA): DocumentDNA {
    const offspring: DocumentDNA = {
      genes: [],
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      mutationRate: (parent1.mutationRate + parent2.mutationRate) / 2,
      crossoverPoints: []
    };
    
    // 二点交叉
    const crossPoint1 = Math.floor(Math.random() * Math.min(parent1.genes.length, parent2.genes.length));
    const crossPoint2 = Math.floor(Math.random() * Math.min(parent1.genes.length, parent2.genes.length));
    const [start, end] = [crossPoint1, crossPoint2].sort((a, b) => a - b);
    
    // 遺伝子の組み合わせ
    for (let i = 0; i < Math.max(parent1.genes.length, parent2.genes.length); i++) {
      if (i < start || i >= end) {
        offspring.genes.push(parent1.genes[i] || this.createEmptyGene());
      } else {
        offspring.genes.push(parent2.genes[i] || this.createEmptyGene());
      }
    }
    
    offspring.crossoverPoints = [start, end];
    
    return offspring;
  }
  
  /**
   * 企業固有の突然変異を適用
   */
  private applyMutations(dna: DocumentDNA, companyProfile: any): DocumentDNA {
    const mutatedDNA = { ...dna };
    
    mutatedDNA.genes = dna.genes.map(gene => {
      if (Math.random() < dna.mutationRate) {
        // 突然変異を適用
        const mutatedGene = { ...gene };
        mutatedGene.id = `mutation_${gene.id}`;
        
        // 企業固有の情報を注入
        const companyTokens = this.extractCompanyTokens(companyProfile);
        const insertPosition = Math.floor(Math.random() * mutatedGene.sequence.length);
        
        mutatedGene.sequence.splice(
          insertPosition,
          0,
          ...companyTokens.slice(0, 3)
        );
        
        // 特性を再計算
        mutatedGene.traits = this.mutateTraits(gene.traits);
        
        return mutatedGene;
      }
      return gene;
    });
    
    return mutatedDNA;
  }
  
  /**
   * DNAから文書を生成
   */
  private async expressGenesToDocument(
    dna: DocumentDNA,
    companyProfile: any
  ): Promise<string> {
    const sections: string[] = [];
    
    for (const gene of dna.genes) {
      // 遺伝子配列を自然な文章に変換
      const section = await this.reconstructSection(gene, companyProfile);
      sections.push(section);
    }
    
    // セクションを結合して完全な文書を作成
    return this.assembleDocument(sections, companyProfile);
  }
  
  /**
   * 適応度の計算
   */
  private calculateFitness(document: string, subsidyId: string): number {
    let fitness = 0;
    
    // 文書の完全性
    const requiredSections = ['事業概要', '導入目的', '期待効果', '実施計画', '予算計画'];
    const presentSections = requiredSections.filter(section => 
      document.includes(section)
    ).length;
    fitness += (presentSections / requiredSections.length) * 0.3;
    
    // 説得力のあるキーワードの使用
    const persuasiveKeywords = ['革新的', '効率化', '生産性向上', 'DX推進', '競争力強化'];
    const keywordCount = persuasiveKeywords.filter(keyword =>
      document.includes(keyword)
    ).length;
    fitness += (keywordCount / persuasiveKeywords.length) * 0.2;
    
    // 具体的な数値の使用
    const numberMatches = document.match(/\d+[%％]|\d+倍|\d+時間|\d+円/g);
    fitness += numberMatches ? Math.min(numberMatches.length * 0.05, 0.25) : 0;
    
    // 文書の長さ（適切な詳細度）
    const idealLength = 3000;
    const lengthRatio = Math.min(document.length / idealLength, 1);
    fitness += lengthRatio * 0.25;
    
    return Math.min(fitness, 1);
  }
  
  // ヘルパーメソッド群
  private splitIntoSections(content: string): string[] {
    return content.split(/\n\n+/).filter(section => section.trim().length > 50);
  }
  
  private analyzeTextTraits(text: string): DocumentGene['traits'] {
    return {
      clarity: this.measureClarity(text),
      persuasiveness: this.measurePersuasiveness(text),
      completeness: this.measureCompleteness(text),
      innovation: this.measureInnovation(text)
    };
  }
  
  private measureClarity(text: string): number {
    const sentences = text.split(/[。\.\!！\?？]/);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    return avgLength < 50 ? 0.9 : avgLength < 100 ? 0.7 : 0.5;
  }
  
  private measurePersuasiveness(text: string): number {
    const persuasiveWords = ['必要', '重要', '効果的', '革新的', '最適'];
    const count = persuasiveWords.filter(word => text.includes(word)).length;
    return Math.min(count * 0.2, 1);
  }
  
  private measureCompleteness(text: string): number {
    const requiredElements = ['目的', '方法', '効果', '計画'];
    const present = requiredElements.filter(elem => text.includes(elem)).length;
    return present / requiredElements.length;
  }
  
  private measureInnovation(text: string): number {
    const innovativeWords = ['AI', 'IoT', 'DX', 'クラウド', '自動化'];
    const count = innovativeWords.filter(word => text.includes(word)).length;
    return Math.min(count * 0.25, 1);
  }
  
  private identifyCrossoverPoints(genes: DocumentGene[]): number[] {
    const points: number[] = [];
    for (let i = 1; i < genes.length - 1; i++) {
      if (genes[i].fitness > 0.7) {
        points.push(i);
      }
    }
    return points;
  }
  
  private calculateDNAFitness(dna: DocumentDNA): number {
    return dna.genes.reduce((sum, gene) => sum + gene.fitness, 0) / dna.genes.length;
  }
  
  private createEmptyGene(): DocumentGene {
    return {
      id: `empty_${Date.now()}`,
      sequence: [],
      fitness: 0.5,
      traits: { clarity: 0.5, persuasiveness: 0.5, completeness: 0.5, innovation: 0.5 }
    };
  }
  
  private extractCompanyTokens(companyProfile: any): string[] {
    const tokens: string[] = [];
    if (companyProfile.name) tokens.push(companyProfile.name);
    if (companyProfile.industry) tokens.push(companyProfile.industry);
    if (companyProfile.strengths) tokens.push(...companyProfile.strengths);
    return tokens;
  }
  
  private mutateTraits(traits: DocumentGene['traits']): DocumentGene['traits'] {
    return {
      clarity: Math.min(traits.clarity + (Math.random() - 0.5) * 0.1, 1),
      persuasiveness: Math.min(traits.persuasiveness + (Math.random() - 0.5) * 0.1, 1),
      completeness: Math.min(traits.completeness + (Math.random() - 0.5) * 0.1, 1),
      innovation: Math.min(traits.innovation + (Math.random() - 0.5) * 0.1, 1)
    };
  }
  
  private async reconstructSection(gene: DocumentGene, companyProfile: any): Promise<string> {
    // 遺伝子配列から文章を再構築（簡易版）
    const baseText = gene.sequence.join(' ');
    const enhanced = baseText
      .replace(/\s+/g, ' ')
      .replace(/([。、])\s/g, '$1')
      .trim();
    
    return enhanced;
  }
  
  private assembleDocument(sections: string[], companyProfile: any): string {
    const header = `【申請企業】${companyProfile.name}\n【申請日】${new Date().toLocaleDateString('ja-JP')}\n\n`;
    const body = sections.join('\n\n');
    const footer = `\n\n以上、ご審査のほどよろしくお願いいたします。`;
    
    return header + body + footer;
  }
  
  private async saveEvolutionRecord(dna: DocumentDNA, fitness: number): Promise<void> {
    await supabase.from('document_evolution').insert({
      dna_snapshot: JSON.stringify(dna),
      fitness_score: fitness,
      generation: dna.generation,
      created_at: new Date().toISOString()
    });
  }
}