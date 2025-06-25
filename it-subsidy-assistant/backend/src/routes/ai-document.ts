import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

// APIキーの安全な管理（環境変数から取得することを推奨）
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface AIGenerateRequest {
  subsidyType: string;
  subsidyName: string;
  answers: Record<string, string>;
  commonData: Record<string, string>;
}

// 補助金タイプ別のプロンプトテンプレート
const promptTemplates: Record<string, string> = {
  'it-donyu': `
あなたはIT導入補助金の申請書作成専門家です。以下の情報から完全な申請書類を作成してください。

【評価基準】
1. 労働生産性の向上（必須）
2. ITツールの具体性と適合性
3. 実現可能性と計画の妥当性
4. 費用対効果

【重要ポイント】
- 数値目標を明確に（労働生産性3%以上向上等）
- ITツールの具体的な機能と効果を詳述
- 導入スケジュールの現実性
- セキュリティ対策への言及
`,
  'monozukuri': `
あなたはものづくり補助金の申請書作成専門家です。以下の情報から革新的な事業計画書を作成してください。

【評価基準】
1. 技術的革新性・新規性
2. 事業化の確実性
3. 市場性と成長性
4. 波及効果

【重要ポイント】
- 技術的課題と解決方法の具体性
- 競合他社との差別化要因
- 特許や知的財産への言及
- 生産性向上の定量的効果
`,
  'jizokuka': `
あなたは小規模事業者持続化補助金の申請書作成専門家です。以下の情報から説得力のある経営計画書を作成してください。

【評価基準】
1. 販路開拓の具体性
2. 事業の実現可能性
3. 地域への貢献
4. 持続可能性

【重要ポイント】
- 小規模事業者の強みを活かした計画
- 地域密着型のアプローチ
- 具体的な販路開拓手法
- 売上向上の根拠と計画
`,
  'jigyou-saikouchiku': `
あなたは事業再構築補助金の申請書作成専門家です。以下の情報から大胆かつ実現可能な事業再構築計画を作成してください。

【評価基準】
1. 事業再構築の必要性と緊急性
2. 新事業の成長性と実現可能性
3. 既存事業とのシナジー
4. 雇用への貢献

【重要ポイント】
- コロナ等の影響の具体的数値
- 新分野展開の市場分析
- 既存リソースの活用方法
- V字回復のシナリオ
`
};

// AI文書生成エンドポイント
router.post('/generate', async (req: Request, res: Response) => {
  const { subsidyType, subsidyName, answers, commonData }: AIGenerateRequest = req.body;
  
  try {

    // プロンプトの構築
    const systemPrompt = promptTemplates[subsidyType] || promptTemplates['it-donyu'];
    const userPrompt = buildUserPrompt(subsidyType, subsidyName, answers, commonData);

    // OpenAI APIの呼び出し
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const generatedContent = completion.choices[0].message.content || '';
    const structuredDocument = parseGeneratedContent(generatedContent, subsidyType);

    res.json({
      success: true,
      document: structuredDocument,
      rawContent: generatedContent
    });

  } catch (error: any) {
    console.error('AI生成エラー:', error);
    
    // エラーハンドリング
    if ((error as any).status === 401) {
      res.status(401).json({
        success: false,
        error: 'APIキーが無効です'
      });
    } else if ((error as any).status === 429) {
      res.status(429).json({
        success: false,
        error: 'API利用制限に達しました。しばらく待ってから再試行してください。'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'AI生成中にエラーが発生しました',
        fallback: generateFallbackDocument(subsidyType, answers, commonData)
      });
    }
  }
});

// ユーザープロンプトの構築
function buildUserPrompt(
  subsidyType: string,
  subsidyName: string,
  answers: Record<string, string>,
  commonData: Record<string, string>
): string {
  let prompt = `【申請補助金】${subsidyName}\n\n`;
  
  prompt += `【企業基本情報】\n`;
  prompt += `企業名: ${commonData.companyName || '株式会社サンプル'}\n`;
  prompt += `事業内容: ${commonData.businessOverview || '情報サービス業'}\n`;
  prompt += `従業員数: ${commonData.employeeCount || '10名'}\n`;
  prompt += `年間売上: ${commonData.annualRevenue || '5000万円'}\n\n`;
  
  prompt += `【申請者の回答】\n`;
  Object.entries(answers).forEach(([key, value]) => {
    if (value && key !== 'companyName' && key !== 'businessOverview') {
      prompt += `${key}: ${value}\n`;
    }
  });
  
  prompt += `\n【作成指示】\n`;
  prompt += `上記の情報を基に、以下の構成で申請書類を作成してください：\n`;
  prompt += `\n1. 事業計画名（キャッチーで具体的なタイトル）\n`;
  prompt += `2. 事業の背景と課題（現状分析）\n`;
  prompt += `3. 事業内容（具体的な実施内容）\n`;
  prompt += `4. 期待される効果（定量的・定性的効果）\n`;
  prompt += `5. 実施体制とスケジュール\n`;
  prompt += `6. 必要な投資と資金計画\n`;
  prompt += `7. リスクと対策\n`;
  prompt += `8. 将来展望（3-5年後のビジョン）\n`;
  prompt += `\n各セクションは具体的で説得力のある内容にしてください。`;
  
  return prompt;
}

// 生成されたコンテンツの構造化
function parseGeneratedContent(content: string, subsidyType: string): any {
  // セクションごとに分割
  const sections = content.split(/\n(?=\d+\.)/);
  
  const document: any = {
    projectTitle: '',
    background: '',
    businessPlan: '',
    expectedEffects: '',
    implementation: '',
    investment: '',
    risks: '',
    vision: '',
    fullDocument: content
  };
  
  // セクションの解析
  sections.forEach(section => {
    if (section.includes('事業計画名')) {
      document.projectTitle = extractContent(section);
    } else if (section.includes('背景') || section.includes('課題')) {
      document.background = extractContent(section);
    } else if (section.includes('事業内容')) {
      document.businessPlan = extractContent(section);
    } else if (section.includes('効果')) {
      document.expectedEffects = extractContent(section);
    } else if (section.includes('体制') || section.includes('スケジュール')) {
      document.implementation = extractContent(section);
    } else if (section.includes('投資') || section.includes('資金')) {
      document.investment = extractContent(section);
    } else if (section.includes('リスク')) {
      document.risks = extractContent(section);
    } else if (section.includes('展望') || section.includes('ビジョン')) {
      document.vision = extractContent(section);
    }
  });
  
  return document;
}

// セクションからコンテンツを抽出
function extractContent(section: string): string {
  const lines = section.split('\n');
  return lines.slice(1).join('\n').trim();
}

// フォールバック文書の生成
function generateFallbackDocument(
  subsidyType: string,
  answers: Record<string, string>,
  commonData: Record<string, string>
): any {
  const companyName = commonData.companyName || '貴社';
  
  const templates: Record<string, any> = {
    'it-donyu': {
      projectTitle: 'DX推進による業務効率化プロジェクト',
      background: `${companyName}では、${answers.challenge || '業務効率化'}が急務となっています。`,
      businessPlan: `${answers.solution || 'クラウドシステム'}を導入し、業務プロセスを革新します。`,
      expectedEffects: '労働生産性30%向上、コスト20%削減を見込みます。',
      investment: `投資額：${answers.budget || '200万円'}（補助率2/3を活用）`
    },
    'monozukuri': {
      projectTitle: '革新的製品開発プロジェクト',
      background: `市場ニーズの変化により、${answers.innovation || '新製品開発'}が必要です。`,
      businessPlan: '最新技術を活用した革新的な製品を開発します。',
      expectedEffects: '市場シェア拡大と売上30%増を目指します。',
      investment: '設備投資と開発費で総額1000万円を計画'
    }
  };
  
  return templates[subsidyType] || templates['it-donyu'];
}

// プロンプト改善エンドポイント（ユーザーフィードバック用）
router.post('/improve-prompt', async (req: Request, res: Response) => {
  const { subsidyType, feedback, improvedContent } = req.body;
  
  // フィードバックを記録（将来的な改善のため）
  console.log('プロンプト改善フィードバック:', {
    subsidyType,
    feedback,
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    message: 'フィードバックを受け付けました'
  });
});

export { router as aiDocumentRoutes };