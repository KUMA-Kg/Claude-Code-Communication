// Document Magic AI Service
// AI駆動の文書作成支援サービス

interface DocumentContext {
  subsidyType: string;
  companyType: string;
  industry: string;
  currentContent: string;
  blockType: string;
}

interface AISuggestion {
  text: string;
  confidence: number;
  category: string;
  reasoning?: string;
}

interface TemplatePattern {
  pattern: RegExp;
  templateId: string;
  confidence: number;
}

export class DocumentMagicAIService {
  private static instance: DocumentMagicAIService;
  
  // テンプレートパターン認識
  private templatePatterns: TemplatePattern[] = [
    {
      pattern: /IT.*効率化|デジタル.*変革|システム.*導入/i,
      templateId: 'it-efficiency',
      confidence: 0.9
    },
    {
      pattern: /製造.*革新|生産.*改善|ものづくり/i,
      templateId: 'manufacturing-innovation',
      confidence: 0.9
    },
    {
      pattern: /販路.*開拓|顧客.*拡大|マーケティング/i,
      templateId: 'sales-expansion',
      confidence: 0.85
    }
  ];

  // 業界別の専門用語辞書
  private industryTerms = {
    it: ['DX', 'クラウド化', 'AI活用', 'RPA', 'IoT', 'ビッグデータ', 'セキュリティ強化'],
    manufacturing: ['生産性向上', '品質改善', 'リードタイム短縮', '在庫最適化', '自動化'],
    retail: ['顧客体験', 'オムニチャネル', 'EC強化', 'POSシステム', '在庫管理'],
    service: ['業務効率化', '顧客満足度', 'サービス品質', 'スタッフ生産性']
  };

  private constructor() {}

  static getInstance(): DocumentMagicAIService {
    if (!DocumentMagicAIService.instance) {
      DocumentMagicAIService.instance = new DocumentMagicAIService();
    }
    return DocumentMagicAIService.instance;
  }

  // スマート補完の生成
  async generateCompletion(context: DocumentContext): Promise<string> {
    // シミュレーション用の遅延
    await this.delay(800);

    switch (context.blockType) {
      case 'title':
        return this.generateTitle(context);
      case 'section':
        return this.generateSection(context);
      case 'text':
        return this.generateParagraph(context);
      case 'list':
        return this.generateList(context);
      case 'table':
        return this.generateTable(context);
      default:
        return context.currentContent;
    }
  }

  // AI提案の生成
  async generateSuggestions(context: DocumentContext): Promise<AISuggestion[]> {
    await this.delay(500);

    const suggestions: AISuggestion[] = [];

    // コンテキストに基づいた提案を生成
    if (context.subsidyType === 'it-donyu') {
      suggestions.push(
        {
          text: 'クラウド型の統合業務管理システムを導入し、リアルタイムでの情報共有を実現',
          confidence: 0.95,
          category: 'システム提案',
          reasoning: 'IT導入補助金では具体的なシステム名と効果の明記が重要です'
        },
        {
          text: 'AIを活用した需要予測システムにより、在庫回転率を30%改善',
          confidence: 0.88,
          category: 'AI活用提案'
        },
        {
          text: 'RPAツールの導入で定型業務を自動化し、年間1,200時間の削減を実現',
          confidence: 0.92,
          category: '自動化提案'
        }
      );
    } else if (context.subsidyType === 'monozukuri') {
      suggestions.push(
        {
          text: '最新のCAD/CAMシステムと3Dプリンターを活用した試作品開発プロセスの革新',
          confidence: 0.90,
          category: '技術革新'
        },
        {
          text: 'IoTセンサーを活用した予知保全システムの構築により、設備稼働率を95%に向上',
          confidence: 0.87,
          category: '生産性向上'
        }
      );
    }

    return suggestions;
  }

  // テンプレート認識
  async recognizeTemplate(content: string): Promise<{ templateId: string; confidence: number } | null> {
    await this.delay(300);

    for (const pattern of this.templatePatterns) {
      if (pattern.pattern.test(content)) {
        return {
          templateId: pattern.templateId,
          confidence: pattern.confidence
        };
      }
    }

    return null;
  }

  // セクション自動生成
  async generateSections(subsidyType: string, companyInfo: any): Promise<any[]> {
    await this.delay(1000);

    const sections = [];

    switch (subsidyType) {
      case 'it-donyu':
        sections.push(
          {
            type: 'section',
            content: '1. 導入の背景と現状の課題',
            aiGenerated: true
          },
          {
            type: 'text',
            content: this.generateBackgroundText(companyInfo),
            aiGenerated: true
          },
          {
            type: 'section',
            content: '2. 導入するITツールの概要',
            aiGenerated: true
          },
          {
            type: 'list',
            content: this.generateToolList(companyInfo),
            aiGenerated: true
          },
          {
            type: 'section',
            content: '3. 期待される効果と成果指標',
            aiGenerated: true
          },
          {
            type: 'table',
            content: this.generateEffectTable(),
            aiGenerated: true
          }
        );
        break;

      case 'monozukuri':
        sections.push(
          {
            type: 'section',
            content: '1. 事業の革新性',
            aiGenerated: true
          },
          {
            type: 'section',
            content: '2. 実施スケジュール',
            aiGenerated: true
          },
          {
            type: 'section',
            content: '3. 投資計画と資金調達',
            aiGenerated: true
          }
        );
        break;

      default:
        sections.push(
          {
            type: 'section',
            content: '1. 事業計画概要',
            aiGenerated: true
          }
        );
    }

    return sections;
  }

  // 品質スコアの計算
  calculateQualityScore(content: string, requirements: string[]): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // 必須要件のチェック
    requirements.forEach(req => {
      if (contentLower.includes(req.toLowerCase())) {
        score += 20;
      }
    });

    // 具体性のチェック
    const hasNumbers = /\d+/.test(content);
    const hasPercentage = /%/.test(content);
    const hasSpecificTerms = this.checkSpecificTerms(content);

    if (hasNumbers) score += 10;
    if (hasPercentage) score += 10;
    if (hasSpecificTerms) score += 10;

    // 文字数チェック
    if (content.length > 100) score += 10;
    if (content.length > 300) score += 10;

    return Math.min(100, score);
  }

  // プライベートメソッド
  private generateTitle(context: DocumentContext): string {
    const titles = {
      'it-donyu': 'デジタル変革による業務効率化と競争力強化計画',
      'monozukuri': '革新的製造プロセスの導入による生産性向上計画',
      'jizokuka': '持続的成長を実現する販路開拓・業務改善計画'
    };

    return titles[context.subsidyType as keyof typeof titles] || '事業計画書';
  }

  private generateSection(context: DocumentContext): string {
    const currentText = context.currentContent.toLowerCase();
    
    if (currentText.includes('背景') || currentText.includes('現状')) {
      return '導入の背景と現状の課題';
    } else if (currentText.includes('効果') || currentText.includes('成果')) {
      return '期待される効果と成果指標';
    } else if (currentText.includes('計画') || currentText.includes('スケジュール')) {
      return '実施計画とスケジュール';
    }

    return context.currentContent;
  }

  private generateParagraph(context: DocumentContext): string {
    const templates = {
      'it-donyu': `当社では、${this.getIndustryChallenge(context.industry)}という課題に直面しています。
この課題を解決するため、${this.getITSolution()}を導入し、
業務効率を大幅に改善することを計画しています。
具体的には、${this.getSpecificImprovement()}を実現し、
年間${this.getRandomNumber(20, 50)}%のコスト削減を目指します。`,
      
      'monozukuri': `製造プロセスにおける${this.getManufacturingChallenge()}を改善するため、
最新の${this.getManufacturingTechnology()}を導入します。
これにより、生産性を${this.getRandomNumber(30, 60)}%向上させ、
リードタイムを${this.getRandomNumber(20, 40)}%短縮することが可能となります。`,
      
      'jizokuka': `新たな販路開拓として、${this.getSalesChannel()}を活用し、
顧客基盤を${this.getRandomNumber(150, 300)}%拡大する計画です。
また、${this.getMarketingStrategy()}により、
売上高を年間${this.getRandomNumber(20, 50)}%増加させることを目標としています。`
    };

    return templates[context.subsidyType as keyof typeof templates] || '';
  }

  private generateList(context: DocumentContext): string[] {
    if (context.subsidyType === 'it-donyu') {
      return [
        '導入予定のシステム・ツール',
        '• クラウド型ERP（統合業務管理システム）',
        '• AI搭載の需要予測ツール',
        '• RPA（業務自動化ツール）',
        '• BI（ビジネスインテリジェンス）ツール',
        '• セキュリティ強化ソリューション'
      ];
    } else if (context.subsidyType === 'monozukuri') {
      return [
        '導入予定の設備・技術',
        '• 最新型CNCマシニングセンタ',
        '• 3次元測定器',
        '• IoTセンサーシステム',
        '• 生産管理システム'
      ];
    }

    return ['項目1', '項目2', '項目3'];
  }

  private generateTable(context: DocumentContext): any {
    return {
      headers: ['指標', '現状', '導入後', '改善率'],
      rows: [
        ['処理時間', '120分/件', '30分/件', '75%削減'],
        ['ミス発生率', '5.0%', '0.5%', '90%削減'],
        ['月間処理件数', '500件', '2,000件', '300%増加'],
        ['必要人員', '10名', '6名', '40%削減'],
        ['顧客満足度', '70%', '95%', '35%向上']
      ]
    };
  }

  private generateBackgroundText(companyInfo: any): string {
    return `当社は創業以来、${companyInfo.industry || '製造業'}において事業を展開してまいりました。
近年、市場競争の激化とデジタル化の波により、従来の業務プロセスでは限界を感じています。
特に、手作業による業務処理の非効率性や、データの一元管理ができていないことが大きな課題となっています。`;
  }

  private generateToolList(companyInfo: any): string[] {
    return [
      '導入予定のITツール一覧',
      '• 統合型クラウドERP - 全社的な業務プロセスの統合と可視化',
      '• AI需要予測システム - 過去データから最適な在庫量を自動算出',
      '• RPA業務自動化ツール - 定型業務の自動化で人的ミスを削減',
      '• モバイル営業支援アプリ - 外出先でもリアルタイムで情報共有'
    ];
  }

  private generateEffectTable(): any {
    return {
      headers: ['改善項目', '現状値', '目標値', '期待効果'],
      rows: [
        ['受注処理時間', '3時間/件', '30分/件', '業務効率90%向上'],
        ['在庫回転率', '年6回', '年12回', '在庫コスト50%削減'],
        ['納期遵守率', '85%', '99%', '顧客満足度向上'],
        ['月次決算', '10営業日', '3営業日', '経営判断の迅速化']
      ]
    };
  }

  private getIndustryChallenge(industry: string): string {
    const challenges = {
      manufacturing: '手作業による生産管理の限界',
      retail: '在庫管理の非効率性',
      service: '顧客情報の分散管理',
      it: 'プロジェクト管理の属人化'
    };
    return challenges[industry as keyof typeof challenges] || '業務の非効率性';
  }

  private getITSolution(): string {
    const solutions = [
      'クラウド型の統合業務管理システム',
      'AI搭載の自動化ソリューション',
      'リアルタイム情報共有プラットフォーム',
      'データ分析基盤'
    ];
    return solutions[Math.floor(Math.random() * solutions.length)];
  }

  private getSpecificImprovement(): string {
    const improvements = [
      '処理時間を1/4に短縮',
      'ヒューマンエラーを90%削減',
      'リアルタイムでの情報共有',
      'データドリブンな意思決定'
    ];
    return improvements[Math.floor(Math.random() * improvements.length)];
  }

  private getManufacturingChallenge(): string {
    const challenges = [
      '品質のばらつき',
      '設備稼働率の低下',
      '段取り時間の長さ',
      '不良品率の高さ'
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  private getManufacturingTechnology(): string {
    const technologies = [
      'IoTセンサーと予知保全システム',
      'AI画像認識による品質検査システム',
      '自動化生産ライン',
      'デジタルツイン技術'
    ];
    return technologies[Math.floor(Math.random() * technologies.length)];
  }

  private getSalesChannel(): string {
    const channels = [
      'ECサイトとSNSマーケティング',
      'オンライン展示会とウェビナー',
      'デジタル広告とコンテンツマーケティング',
      'インフルエンサーマーケティング'
    ];
    return channels[Math.floor(Math.random() * channels.length)];
  }

  private getMarketingStrategy(): string {
    const strategies = [
      'データ分析に基づくターゲティング広告',
      'CRMを活用した既存顧客の深耕',
      'オムニチャネル戦略の実施',
      'カスタマージャーニーの最適化'
    ];
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private checkSpecificTerms(content: string): boolean {
    const specificTerms = [
      'クラウド', 'AI', 'IoT', 'RPA', 'DX',
      '効率化', '自動化', '最適化', '削減', '向上',
      '%', '時間', '円', '件'
    ];
    
    return specificTerms.some(term => content.includes(term));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DocumentMagicAIService;