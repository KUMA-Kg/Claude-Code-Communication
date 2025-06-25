import { createClient } from '@supabase/supabase-js';
import natural from 'natural';
import { Redis } from 'ioredis';

interface SuggestionContext {
  documentType: string;
  currentSection: string;
  previousText: string;
  userProfile: {
    industry: string;
    companySize: string;
    previousApplications: number;
  };
}

interface SmartSuggestion {
  text: string;
  confidence: number;
  reasoning: string;
  source: 'pattern' | 'ai' | 'template' | 'hybrid';
  completionTime: number;
}

export class DocumentMagicStudio {
  private tfidf: natural.TfIdf;
  private sentimentAnalyzer: natural.SentimentAnalyzer;
  private tokenizer: natural.WordTokenizer;
  private redis: Redis;
  private successPatterns: Map<string, string[]> = new Map();
  private contextCache: Map<string, any> = new Map();
  
  constructor(private supabase: ReturnType<typeof createClient>) {
    this.tfidf = new natural.TfIdf();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('Japanese', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      keyPrefix: 'magic-studio:'
    });
    
    this.initializePatterns();
  }
  
  /**
   * AI駆動の文章自動補完エンジン - 100ms以内の応答を実現
   */
  async getSmartSuggestions(
    context: SuggestionContext,
    maxSuggestions: number = 5
  ): Promise<SmartSuggestion[]> {
    const startTime = Date.now();
    
    // キャッシュチェック（超高速レスポンス）
    const cacheKey = this.generateCacheKey(context);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 並列処理で複数の補完戦略を実行
    const [
      patternSuggestions,
      aiSuggestions,
      templateSuggestions,
      contextualSuggestions
    ] = await Promise.all([
      this.getPatternBasedSuggestions(context),
      this.getAISuggestions(context),
      this.getTemplateSuggestions(context),
      this.getContextualSuggestions(context)
    ]);
    
    // 全提案を統合・スコアリング
    const allSuggestions = [
      ...patternSuggestions,
      ...aiSuggestions,
      ...templateSuggestions,
      ...contextualSuggestions
    ];
    
    // 重複除去と信頼度でソート
    const uniqueSuggestions = this.deduplicateAndRank(allSuggestions);
    const topSuggestions = uniqueSuggestions.slice(0, maxSuggestions);
    
    // 応答時間を記録
    topSuggestions.forEach(suggestion => {
      suggestion.completionTime = Date.now() - startTime;
    });
    
    // キャッシュに保存（TTL: 5分）
    await this.redis.set(cacheKey, JSON.stringify(topSuggestions), 'EX', 300);
    
    return topSuggestions;
  }
  
  /**
   * コンテキスト認識型のスマートサジェスト
   */
  async getContextualSuggestions(context: SuggestionContext): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    
    // 文脈から次に来るべき内容を予測
    const contextVector = await this.generateContextVector(context);
    
    // Supabase Edge Functionで高速推論
    const { data: predictions } = await this.supabase.functions.invoke('predict-next-content', {
      body: {
        vector: contextVector,
        documentType: context.documentType,
        section: context.currentSection
      }
    });
    
    if (predictions?.suggestions) {
      predictions.suggestions.forEach((pred: any) => {
        suggestions.push({
          text: pred.text,
          confidence: pred.score,
          reasoning: `文脈分析により${context.currentSection}に最適な内容を提案`,
          source: 'ai'
        } as SmartSuggestion);
      });
    }
    
    return suggestions;
  }
  
  /**
   * 成功申請書パターンの学習と適用
   */
  private async getPatternBasedSuggestions(
    context: SuggestionContext
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    
    // 類似の成功申請書を検索
    const { data: successfulDocs } = await this.supabase
      .from('successful_applications')
      .select('content, approval_score')
      .eq('document_type', context.documentType)
      .eq('industry', context.userProfile.industry)
      .gte('approval_score', 0.85)
      .limit(20);
    
    if (successfulDocs) {
      // パターンマイニング
      const patterns = this.extractSuccessPatterns(successfulDocs, context.currentSection);
      
      patterns.forEach(pattern => {
        if (this.isPatternApplicable(pattern, context.previousText)) {
          suggestions.push({
            text: pattern.suggestion,
            confidence: pattern.confidence,
            reasoning: `${pattern.occurrences}件の成功事例で使用されたパターン`,
            source: 'pattern'
          } as SmartSuggestion);
        }
      });
    }
    
    return suggestions.slice(0, 3);
  }
  
  /**
   * AI駆動の創造的な提案
   */
  private async getAISuggestions(context: SuggestionContext): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    
    // GPT-3.5 Turbo相当のモデルで生成（Edge Function経由）
    const { data: aiGenerated } = await this.supabase.functions.invoke('generate-content', {
      body: {
        prompt: this.buildAIPrompt(context),
        temperature: 0.7,
        maxTokens: 150
      }
    });
    
    if (aiGenerated?.suggestions) {
      aiGenerated.suggestions.forEach((suggestion: any) => {
        suggestions.push({
          text: suggestion.text,
          confidence: suggestion.confidence || 0.75,
          reasoning: 'AI分析による創造的な提案',
          source: 'ai'
        } as SmartSuggestion);
      });
    }
    
    return suggestions;
  }
  
  /**
   * テンプレートベースの提案
   */
  private async getTemplateSuggestions(
    context: SuggestionContext
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    
    // セクション別のテンプレートを取得
    const templates = await this.getTemplatesForSection(
      context.documentType,
      context.currentSection
    );
    
    templates.forEach(template => {
      const customized = this.customizeTemplate(template, context.userProfile);
      suggestions.push({
        text: customized,
        confidence: 0.85,
        reasoning: 'ベストプラクティステンプレート',
        source: 'template'
      } as SmartSuggestion);
    });
    
    return suggestions;
  }
  
  /**
   * 重複除去と統合スコアリング
   */
  private deduplicateAndRank(suggestions: SmartSuggestion[]): SmartSuggestion[] {
    const uniqueMap = new Map<string, SmartSuggestion>();
    
    suggestions.forEach(suggestion => {
      const key = this.normalizeText(suggestion.text);
      const existing = uniqueMap.get(key);
      
      if (!existing || suggestion.confidence > existing.confidence) {
        uniqueMap.set(key, suggestion);
      } else if (existing && suggestion.source !== existing.source) {
        // 異なるソースから同じ提案が出た場合、信頼度を上げる
        existing.confidence = Math.min(existing.confidence * 1.2, 1.0);
        existing.source = 'hybrid';
        existing.reasoning += ` + ${suggestion.reasoning}`;
      }
    });
    
    return Array.from(uniqueMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 文脈ベクトルの生成
   */
  private async generateContextVector(context: SuggestionContext): Promise<number[]> {
    const features: number[] = [];
    
    // テキスト特徴
    const tokens = this.tokenizer.tokenize(context.previousText) || [];
    const sentiment = this.sentimentAnalyzer.getSentiment(tokens);
    features.push(sentiment);
    
    // セクション特徴
    const sectionFeatures = this.encodeSectionType(context.currentSection);
    features.push(...sectionFeatures);
    
    // ユーザープロファイル特徴
    const profileFeatures = this.encodeUserProfile(context.userProfile);
    features.push(...profileFeatures);
    
    // TF-IDF特徴
    this.tfidf.addDocument(context.previousText);
    const tfidfVector = this.tfidf.listTerms(0).slice(0, 20).map(term => term.tfidf);
    features.push(...tfidfVector);
    
    // 正規化
    return this.normalizeVector(features);
  }
  
  /**
   * パターン抽出アルゴリズム
   */
  private extractSuccessPatterns(
    documents: any[],
    targetSection: string
  ): Array<{
    suggestion: string;
    confidence: number;
    occurrences: number;
  }> {
    const patterns: Map<string, number> = new Map();
    
    documents.forEach(doc => {
      const sections = this.splitIntoSections(doc.content);
      const targetContent = sections.find(s => s.includes(targetSection));
      
      if (targetContent) {
        const sentences = targetContent.split(/[。！？\n]/);
        sentences.forEach(sentence => {
          if (sentence.length > 20) {
            const normalized = this.normalizePattern(sentence);
            patterns.set(normalized, (patterns.get(normalized) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(patterns.entries())
      .filter(([_, count]) => count >= 2)
      .map(([pattern, count]) => ({
        suggestion: this.denormalizePattern(pattern),
        confidence: Math.min(count * 0.15, 0.95),
        occurrences: count
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  // ヘルパーメソッド群
  private initializePatterns(): void {
    // 成功パターンの初期化
    this.successPatterns.set('事業概要', [
      '弊社は{industry}において{years}年の実績を持ち',
      '主要事業として{service}を展開しており',
      '従業員{employees}名体制で'
    ]);
    
    this.successPatterns.set('導入目的', [
      'DX推進による業務効率化を図るため',
      '競争力強化と生産性向上を目的として',
      '顧客満足度の向上と収益拡大のため'
    ]);
  }
  
  private generateCacheKey(context: SuggestionContext): string {
    return `suggest:${context.documentType}:${context.currentSection}:${
      this.hashText(context.previousText.slice(-100))
    }`;
  }
  
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }
  
  private splitIntoSections(content: string): string[] {
    return content.split(/(?=【[^】]+】)/);
  }
  
  private normalizePattern(text: string): string {
    return text
      .replace(/\d+/g, '{number}')
      .replace(/20\d{2}年/g, '{year}')
      .replace(/[０-９]+/g, '{number}');
  }
  
  private denormalizePattern(pattern: string): string {
    return pattern
      .replace(/{number}/g, '○○')
      .replace(/{year}/g, '○○年');
  }
  
  private isPatternApplicable(pattern: any, previousText: string): boolean {
    // パターンの適用可能性をチェック
    const lastSentence = previousText.split(/[。！？]/).pop() || '';
    return !pattern.suggestion.startsWith(lastSentence.slice(0, 10));
  }
  
  private buildAIPrompt(context: SuggestionContext): string {
    return `
申請書類の${context.currentSection}セクションの続きを提案してください。
業種: ${context.userProfile.industry}
企業規模: ${context.userProfile.companySize}
これまでの文章: ${context.previousText.slice(-200)}

簡潔で説得力のある文章を3つ提案してください。
`;
  }
  
  private encodeSectionType(section: string): number[] {
    const sectionTypes = ['事業概要', '導入目的', '期待効果', '実施計画', '予算計画'];
    const encoding = new Array(sectionTypes.length).fill(0);
    const index = sectionTypes.indexOf(section);
    if (index !== -1) encoding[index] = 1;
    return encoding;
  }
  
  private encodeUserProfile(profile: any): number[] {
    const features: number[] = [];
    
    // 業種エンコーディング
    const industries = ['IT', '製造業', 'サービス業', '小売業', 'その他'];
    const industryIndex = industries.indexOf(profile.industry);
    features.push(industryIndex !== -1 ? industryIndex / industries.length : 0.5);
    
    // 企業規模エンコーディング
    const sizeMap: Record<string, number> = {
      '小規模': 0.2,
      '中規模': 0.5,
      '大規模': 0.8
    };
    features.push(sizeMap[profile.companySize] || 0.5);
    
    // 申請経験
    features.push(Math.min(profile.previousApplications / 10, 1));
    
    return features;
  }
  
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }
  
  private async getTemplatesForSection(
    documentType: string,
    section: string
  ): Promise<string[]> {
    const templates = this.successPatterns.get(section) || [];
    return templates.slice(0, 2);
  }
  
  private customizeTemplate(template: string, profile: any): string {
    return template
      .replace('{industry}', profile.industry)
      .replace('{employees}', '○○')
      .replace('{years}', '○○')
      .replace('{service}', '○○サービス');
  }
}