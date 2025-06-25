import { Router, Request, Response } from 'express';
import axios from 'axios';
import { subsidyApplicationSamples, aiPromptTemplates } from '../data/subsidy-application-samples';

const router = Router();

// OpenAI APIのエンドポイント
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// AI文書生成エンドポイント
router.post('/generate', async (req: Request, res: Response) => {
  const { 
    subsidyName, 
    subsidyType, 
    answers, 
    companyData,
    apiKey 
  } = req.body;

  try {

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'APIキーが指定されていません'
      });
    }

    // プロンプトの構築
    const prompt = buildDocumentPrompt(subsidyName, subsidyType, answers, companyData);

    // OpenAI APIを呼び出し
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: aiPromptTemplates.systemPrompt + `

参考にする高品質な文例：
${getRelevantSamples(subsidyType)}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 30秒のタイムアウト
        validateStatus: (status) => status < 500 // 500未満のステータスは成功として扱う
      }
    );

    const generatedDocument = response.data.choices[0].message.content;

    res.json({
      success: true,
      document: generatedDocument,
      metadata: {
        model: response.data.model,
        usage: response.data.usage
      }
    });

  } catch (error: any) {
    console.error('AI文書生成エラー詳細:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      stack: error.stack
    });
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'APIキーが無効です'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'API利用制限に達しました。しばらく待ってから再試行してください。'
      });
    }

    // より具体的なエラーメッセージ
    let errorMessage = '文書生成中にエラーが発生しました';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'OpenAI APIへの接続がタイムアウトしました';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'OpenAI APIサーバーに接続できません';
    } else if (error.message.includes('stream')) {
      errorMessage = 'OpenAI APIからの応答が中断されました';
    }

    // エラー時はフォールバックデータを返す
    const fallbackDocument = generateFallbackDocument(subsidyType, answers, companyData || {});
    
    res.json({
      success: true,
      document: fallbackDocument,
      warning: `AI生成でエラーが発生したため、フォールバックデータを使用しています: ${errorMessage}`,
      originalError: error.response?.data?.error?.message || error.message
    });
  }
});

// 文書編集用エンドポイント
router.post('/enhance', async (req: Request, res: Response) => {
  try {
    const { 
      originalText,
      section,
      instruction,
      apiKey 
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'APIキーが指定されていません'
      });
    }

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '補助金申請書の改善を行う専門家として、指示に従って文章を改善してください。'
          },
          {
            role: 'user',
            content: `以下の文章を「${instruction}」という指示に従って改善してください。\n\nセクション: ${section}\n\n元の文章:\n${originalText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const enhancedText = response.data.choices[0].message.content;

    res.json({
      success: true,
      enhancedText,
      metadata: {
        model: response.data.model,
        usage: response.data.usage
      }
    });

  } catch (error: any) {
    console.error('文書改善エラー:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: '文書改善中にエラーが発生しました'
    });
  }
});

// プロンプト構築関数
function buildDocumentPrompt(
  subsidyName: string,
  subsidyType: string,
  answers: Record<string, string>,
  companyData: any
): string {
  const companyName = answers.companyName || companyData.companyName || '申請企業';
  const samples = subsidyApplicationSamples[subsidyType];
  
  let specificPrompt = '';
  
  if (subsidyType === 'it-donyu') {
    // サンプル文例を参考にした高品質なプロンプト
    const relevantSample = samples?.sections.businessPlanOverview.samples[0].text || '';
    
    specificPrompt = `
あなたは日本の補助金申請書作成の第一人者です。実際の採択事例を熟知し、審査員の視点を理解している専門家として、以下の情報から完全な申請書類を作成してください。

【文章スタイルの参考例】
以下のような具体的で説得力のある文章を参考にしてください：
"当社は1985年の創業以来、精密金属部品の製造を主力事業として..."

【重要なポイント】
- 具体的な数値を必ず含める（削減率、向上率、金額等）
- 現状の課題を定量的に説明
- 解決策の具体性と実現可能性を明確に
- 期待効果を数値で示す

【申請企業情報】
会社名: ${companyName}
事業内容: ${answers.businessOverview || ''}
現在の課題: ${answers.currentProblem || ''}
希望する解決策: ${answers.desiredSolution || ''}
理想の状態: ${answers.expectedOutcome || ''}
投資計画: ${answers.budget || ''}

【作成する申請書の構成】
以下の構成で、実際の申請書として提出可能な品質の文書を作成してください：

1. 事業計画の概要（800-1000文字）
   - 申請企業の現状と市場環境
   - IT導入の必要性と緊急性
   - 期待される変革の全体像

2. 現状の課題分析（1000-1200文字）
   - 業務プロセスの非効率性（具体的な数値を含む）
   - 競争力低下の要因分析
   - 機会損失の定量化

3. IT導入による解決策（1200-1500文字）
   - 導入予定のITツールの詳細仕様
   - 業務プロセスの改善内容
   - システム連携とデータ活用計画

4. 期待される効果（800-1000文字）
   - 定量的効果（労働生産性向上率、コスト削減額等）
   - 定性的効果（従業員満足度、顧客満足度等）
   - 波及効果と将来展望

5. 実施体制とスケジュール（600-800文字）
   - プロジェクト推進体制
   - 導入スケジュール（月次計画）
   - 成功のための工夫

6. 資金計画と費用対効果（600-800文字）
   - 詳細な費用内訳
   - 補助金の必要性
   - 投資回収計画

【重要な指示】
- 審査員が評価しやすい論理的な構成にする
- 具体的な数値目標を必ず含める（例：生産性30%向上）
- 専門用語は適切に使用しつつ、分かりやすく説明する
- 実現可能性を示す根拠を明確にする`;
    
  } else if (subsidyType === 'monozukuri') {
    specificPrompt = `
あなたは日本の補助金申請書作成の第一人者です。ものづくり補助金の採択事例を熟知し、技術評価の視点を理解している専門家として、以下の情報から完全な申請書類を作成してください。

【申請企業情報】
会社名: ${companyName}
技術力・強み: ${answers.companyStrength || ''}
開発計画: ${answers.developmentPlan || ''}
市場戦略: ${answers.marketStrategy || ''}
設備投資計画: ${answers.equipmentPlan || ''}
雇用計画: ${answers.employmentPlan || ''}

【作成する申請書の構成】

1. 事業計画の概要（1000-1200文字）
   - 企業の技術的背景と実績
   - 開発する製品・技術の革新性
   - 事業化による社会的インパクト

2. 技術的課題とその解決方法（1500-1800文字）
   - 現状の技術的限界と課題
   - 開発する技術の詳細仕様
   - 技術的ブレークスルーのポイント
   - 知的財産戦略

3. 市場性及び事業化計画（1200-1500文字）
   - ターゲット市場の詳細分析
   - 競合製品との比較優位性
   - 価格戦略と販売計画
   - 5年間の売上予測

4. 実施体制と製造計画（800-1000文字）
   - 開発体制と役割分担
   - 品質管理体制
   - 量産化への移行計画
   - サプライチェーン構築

5. 設備投資計画と効果（800-1000文字）
   - 導入設備の詳細仕様
   - 生産能力の向上見込み
   - 品質向上への寄与

6. 雇用・人材育成計画（600-800文字）
   - 新規雇用計画
   - 技術者育成プログラム
   - 地域経済への貢献`;
    
  } else if (subsidyType === 'jizokuka') {
    specificPrompt = `
あなたは日本の補助金申請書作成の第一人者です。小規模事業者持続化補助金の採択事例を熟知している専門家として、以下の情報から完全な申請書類を作成してください。

【申請企業情報】
事業内容と現状: ${answers.businessSummary || ''}
販路開拓の課題: ${answers.salesChallenge || ''}
実施したい取組: ${answers.promotionPlan || ''}
ターゲット顧客: ${answers.targetCustomer || ''}
成長目標: ${answers.growthTarget || ''}

【作成する申請書の構成】

1. 企業概要と経営状況（600-800文字）
   - 事業の特徴と強み
   - 現在の経営課題
   - 地域での位置づけ

2. 販路開拓の方針（800-1000文字）
   - 市場環境の分析
   - ターゲット顧客の明確化
   - 差別化戦略

3. 具体的な取組内容（1000-1200文字）
   - 実施する施策の詳細
   - 期待される効果
   - 実施スケジュール

4. 売上・利益計画（600-800文字）
   - 3年間の売上計画
   - 収益性の改善見込み
   - 投資回収計画

5. 地域への貢献（400-600文字）
   - 地域経済への波及効果
   - 雇用創出・維持
   - 地域資源の活用`;
    
  } else if (subsidyType === 'jigyou-saikouchiku') {
    specificPrompt = `
あなたは日本の補助金申請書作成の第一人者です。事業再構築補助金の採択事例を熟知している専門家として、以下の情報から完全な申請書類を作成してください。

【申請企業情報】
現在の状況: ${answers.currentSituation || ''}
新事業計画: ${answers.restructuringPlan || ''}
活用可能な資源: ${answers.existingAssets || ''}
市場機会: ${answers.marketOpportunity || ''}
投資計画: ${answers.investmentDetail || ''}

【作成する申請書の構成】

1. 事業再構築の必要性（1200-1500文字）
   - コロナ等による影響の定量分析
   - 従来事業モデルの限界
   - 変革の緊急性

2. 新事業の詳細計画（1500-1800文字）
   - ビジネスモデルの詳細
   - 製品・サービスの具体的内容
   - 顧客価値提案

3. 市場分析と競争戦略（1000-1200文字）
   - ターゲット市場の成長性
   - 競合分析と差別化要因
   - 市場参入戦略

4. 既存資源の活用とシナジー（800-1000文字）
   - 技術・ノウハウの転用
   - 人材の再配置計画
   - 設備・施設の有効活用

5. 収支計画とV字回復シナリオ（1000-1200文字）
   - 5年間の詳細収支計画
   - 売上回復の根拠
   - リスクシナリオと対策

6. 実施体制と雇用計画（600-800文字）
   - プロジェクト推進体制
   - 雇用維持・創出計画
   - 外部連携`;
  }
  
  return specificPrompt + `

【出力形式】
上記の各セクションを明確に区切り、読みやすい形式で出力してください。
実際の申請書として提出可能な、説得力のある内容にしてください。`;
}

// フォールバック文書生成関数
function generateFallbackDocument(
  subsidyType: string,
  answers: Record<string, string>,
  companyData: any
): string {
  const companyName = answers.companyName || companyData.companyName || '申請企業';
  const businessOverview = answers.businessOverview || companyData.businessOverview || '';
  
  let document = '';
  
  if (subsidyType === 'it-donyu') {
    const currentProblem = answers.currentProblem || answers.challenge || '業務効率化の課題';
    const desiredSolution = answers.desiredSolution || 'ITツールの導入';
    const expectedOutcome = answers.expectedOutcome || '生産性向上';
    const budget = answers.budget || '総額300万円';
    
    // 高品質なサンプル文例を参考にした文書生成
    document = `${companyName} IT導入補助金申請書

1．事業計画の概要
　当社は${businessOverview}を主力事業として展開し、地域経済に貢献してまいりました。しかしながら、近年の市場環境の変化とデジタル化の急速な進展により、従来のビジネスモデルでは競争力の維持が困難な状況となっております。
　現在、${currentProblem}という課題に直面しており、これにより月間約100時間の作業時間ロスと年間約200万円の機会損失が発生していると推計されます。
　本事業では、${desiredSolution}を実施することで、業務プロセスの根本的な改革を実現し、${expectedOutcome}を達成します。具体的には、作業時間の30%削減、エラー発生率の80%低下、顧客満足度の20%向上を目指します。

2．導入するITツールの詳細
（1）導入予定ツール
　・クラウド型業務管理システム
　・データ分析・可視化ツール
　・コミュニケーション効率化ツール

（2）ツール選定理由
　現在の業務フローを分析した結果、上記ツールの導入により作業時間の大幅短縮と品質向上が期待できます。特に、リアルタイムでの情報共有と自動化により、従来の課題解決に直結いたします。

3．労働生産性向上の効果
（1）定量的効果
　・作業時間：現行比40%削減
　・処理件数：現行比60%向上
　・エラー発生率：現行比80%削減
　・月間残業時間：現行比50%削減

（2）定性的効果
　・従業員の業務負担軽減
　・顧客満足度の向上
　・データに基づく意思決定の促進
　・新規事業への人的リソース配分

4．導入・運用計画
（1）導入スケジュール
　2025年4月：ツール選定・契約締結
　2025年5月：システム構築・初期設定
　2025年6月：従業員研修・試験運用
　2025年7月：本格運用開始

（2）運用体制
　・プロジェクトマネージャー：1名
　・システム管理者：2名
　・利用者研修責任者：1名

5．投資計画と効果測定
（1）投資総額：${budget}
　・ソフトウェアライセンス費
　・導入・設定費用
　・従業員研修費

（2）効果測定指標
　・労働生産性指標（売上高/労働時間）
　・顧客満足度スコア
　・業務処理時間短縮率
　・システム利用率

6．持続的な効果創出に向けた取組み
　導入後も継続的な改善活動を実施し、更なる業務効率化を推進いたします。また、蓄積されたデータを活用した分析により、新たな付加価値創造に取り組んでまいります。`;

  } else if (subsidyType === 'monozukuri') {
    const innovation = answers.innovation || '';
    const investment = answers.investment || '';
    
    document = `${companyName} ものづくり補助金申請書

1．事業計画の概要
　当社は${businessOverview}を主たる事業として、これまで培った技術力と品質管理ノウハウを基盤に事業展開を行ってまいりました。近年の市場環境の変化と顧客ニーズの高度化に対応するため、「${innovation}」の開発・事業化を通じて、革新的な製品・サービスの提供を目指します。
　本事業により、生産性向上と競争力強化を実現し、持続的な成長基盤を構築いたします。

2．技術的課題とその解決方法
（1）現状の課題
　現在の技術では、精度・効率性において市場要求に完全に応えることが困難な状況にあります。特に、加工精度の向上と生産速度の両立が技術的な課題となっております。

（2）解決する技術的課題
　本事業では、独自の制御技術と高精度センサーを組み合わせることで、従来比40%の精度向上と30%の処理速度向上を実現いたします。

（3）技術的優位性
　・AI制御による自動補正機能の実装
　・リアルタイム品質監視システムの導入
　・省エネ性能30%向上の環境配慮型設計

3．市場性及び事業化戦略
（1）市場動向
　対象市場は年率8%の成長を続けており、2030年には現在の1.5倍の市場規模に拡大すると予測されています。特に高精度・高品質製品への需要が急速に拡大しております。

（2）販売戦略
　第1段階：既存顧客への導入（1年目）
　第2段階：新規開拓による市場拡大（2-3年目）
　第3段階：海外展開の検討（4-5年目）

（3）競争優位性
　特許出願予定の核心技術により、3-5年間の技術的優位性を確保。同業他社との明確な差別化を実現いたします。

4．設備投資計画
（1）導入設備
　総投資額：${investment}
　・高精度加工設備：${Math.round(parseInt(investment.replace(/[^\d]/g, '')) * 0.6)}万円
　・検査・測定機器：${Math.round(parseInt(investment.replace(/[^\d]/g, '')) * 0.25)}万円
　・ソフトウェア・システム：${Math.round(parseInt(investment.replace(/[^\d]/g, '')) * 0.15)}万円

（2）導入効果
　・製品品質の向上：不良率を現行の1/3に削減
　・生産効率の向上：単位時間当たりの生産量30%増加
　・エネルギー効率の改善：消費電力20%削減

5．雇用・人材育成計画
（1）雇用計画
　技術者3名、オペレーター5名の新規雇用を予定。地域の若年者雇用促進に貢献いたします。

（2）人材育成
　専門技術研修の実施により、従業員のスキルアップを図り、地域の技術力向上に寄与いたします。

6．事業実施スケジュール
　令和7年4月：設備導入開始
　令和7年8月：試運転・調整開始
　令和7年10月：本格稼働開始
　令和8年3月：事業完了・効果測定

7．事業化に向けた取組み
　本事業の成功により、地域製造業の技術レベル向上と雇用創出を実現し、サプライチェーン全体の競争力強化に貢献してまいります。`;

  } else if (subsidyType === 'jizokuka') {
    const salesGoal = answers.salesGoal || '';
    const budget = answers.budget || '';
    
    document = `${companyName} 小規模事業者持続化補助金申請書

1．企業概要及び現状分析
（1）企業概要
　当社は${businessOverview}を主たる事業として、地域密着型の経営を行っております。創業以来、お客様との信頼関係を大切にし、質の高いサービス提供に努めてまいりました。

（2）現状の課題
　近年の市場環境の変化により、従来の営業手法では新規顧客獲得が困難になってきております。また、情報発信力の不足により、当社の強みが十分に伝わっていない状況です。

（3）事業環境の変化
　デジタル化の進展により、顧客の購買行動や情報収集方法が大きく変化しており、これに対応した販路開拓戦略の構築が急務となっております。

2．販路開拓の方針
（1）基本方針
　「${salesGoal}」を核とした販路拡大により、持続的な成長を実現いたします。デジタルマーケティングと地域密着型営業を組み合わせた多角的なアプローチにより、新規顧客層の開拓を図ります。

（2）ターゲット顧客
　・年齢層：30-50代の品質重視顧客
　・地域：半径20km圏内の地域住民及び事業者
　・特徴：価格よりも品質・サービスを重視する顧客層

（3）差別化ポイント
　地域の特色と当社の専門性を活かした独自サービスにより、競合他社との明確な差別化を実現いたします。

3．販路開拓の具体的取組み
（1）ウェブサイト制作・リニューアル
　予算：${Math.round(parseInt(budget.replace(/[^\d]/g, '')) * 0.4)}万円
　・レスポンシブデザインによる多デバイス対応
　・SEO対策による検索エンジン上位表示
　・お客様の声や実績紹介による信頼性向上

（2）デジタルマーケティング
　予算：${Math.round(parseInt(budget.replace(/[^\d]/g, '')) * 0.3)}万円
　・SNS広告（Facebook、Instagram）
　・Google広告による効果的な集客
　・メールマガジンによる既存顧客との関係強化

（3）地域密着型プロモーション
　予算：${Math.round(parseInt(budget.replace(/[^\d]/g, '')) * 0.3)}万円
　・地域イベントへの積極的参加
　・商工会議所等との連携強化
　・地元メディアでの露出増加

4．期待される成果
（1）定量的効果
　・新規顧客数：年間50件増加
　・売上高：3年間で現状比50%増加
　・ウェブサイト訪問者数：月間500名から2,000名へ増加
　・SNSフォロワー数：1,000名から3,000名へ増加

（2）定性的効果
　・地域における認知度の大幅向上
　・顧客満足度の向上
　・従業員のモチベーション向上
　・地域経済への貢献

5．事業の持続可能性
（1）継続的な取組み
　補助事業終了後も、蓄積したノウハウと構築したシステムを活用し、継続的な販路開拓活動を実施いたします。

（2）発展計画
　本事業の成功を基盤として、新商品・サービスの開発や営業エリアの拡大を検討し、更なる事業発展を目指します。

6．地域への貢献
　地域の特産品活用や地元企業との連携により、地域経済の活性化に貢献いたします。また、成功事例として他の小規模事業者のモデルケースとなることを目指します。`;

  } else if (subsidyType === 'jigyou-saikouchiku') {
    const currentBusiness = answers.currentBusiness || '';
    const newBusiness = answers.newBusiness || '';
    const investmentPlan = answers.investmentPlan || '';
    
    document = `${companyName} 事業再構築補助金申請書

1．事業再構築の背景及び必要性
（1）従来事業の概要と課題
　当社は「${currentBusiness}」を主力事業として展開してまいりましたが、新型コロナウイルス感染症の影響により売上高が大幅に減少しております。令和2年度以降、前年同期比で30-40%の売上減少が継続し、従来のビジネスモデルでは持続的な経営が困難な状況となっております。

（2）外部環境の変化
　市場環境の構造的変化により、従来事業での回復は困難と判断されます。特に、消費者行動の変化、デジタル化の加速、働き方の多様化等により、新たな事業モデルへの転換が不可欠となっております。

（3）事業再構築の必要性
　持続的な成長と雇用の維持・創出を実現するため、成長分野である「${newBusiness}」への事業転換を通じて、企業価値の向上と競争力の強化を図ります。

2．新事業の概要
（1）新事業の内容
　「${newBusiness}」を核とした新たなビジネスモデルを構築いたします。デジタル技術を活用した効率的なサービス提供により、多様化する顧客ニーズに対応いたします。

（2）市場性・成長性
　対象市場は年率12-15%の成長が見込まれる有望分野であり、2030年には現在の2倍の市場規模に拡大すると予測されています。特に、DX需要の拡大により中長期的な成長が期待されます。

（3）競争優位性
　既存事業で培った専門性と顧客基盤を活用し、新事業分野での差別化を実現いたします。早期参入により市場でのポジション確立を目指します。

3．既存事業とのシナジー効果
（1）活用可能な経営資源
　・技術・ノウハウ：従来事業で蓄積した技術力と品質管理ノウハウ
　・人的資源：専門知識を有する従業員のスキル転用
　・顧客基盤：既存顧客との信頼関係を新事業に活用
　・設備・施設：一部設備の転用による投資効率の向上

（2）相乗効果
　新事業の展開により、既存事業の課題解決にも寄与し、事業全体の競争力向上を実現いたします。

4．投資計画
（1）投資概要
　総投資額：${investmentPlan}
　・設備投資：${Math.round(parseInt(investmentPlan.replace(/[^\d]/g, '')) * 0.6)}万円
　・システム投資：${Math.round(parseInt(investmentPlan.replace(/[^\d]/g, '')) * 0.25)}万円
　・運転資金：${Math.round(parseInt(investmentPlan.replace(/[^\d]/g, '')) * 0.15)}万円

（2）投資効果
　・売上高：3年後に従来事業の120%水準まで回復
　・営業利益率：従来事業比1.5倍の改善
　・生産性：従業員一人当たり売上高30%向上

5．事業計画・収支計画
（1）売上計画
　1年目：新事業売上高2,000万円
　2年目：新事業売上高5,000万円（既存事業回復）
　3年目：新事業売上高8,000万円（従来水準超え）

（2）段階的事業展開
　第1段階（1年目）：基盤構築・試験運用
　第2段階（2年目）：本格稼働・市場拡大
　第3段階（3年目）：事業拡大・新分野展開

6．雇用計画
（1）雇用維持
　既存従業員20名の雇用を維持し、新事業への配置転換を通じてスキルアップを支援いたします。

（2）新規雇用
　新事業の拡大に伴い、3年間で8名の新規雇用を計画しており、地域の雇用創出に貢献いたします。

7．リスク管理・モニタリング体制
（1）想定リスクと対策
　・市場リスク：多角的な販路開拓による分散化
　・技術リスク：外部専門機関との連携強化
　・財務リスク：段階的投資による資金リスクの最小化

（2）進捗管理
　四半期ごとの業績評価と計画修正により、確実な事業再構築を実現いたします。`;
  }
  
  return document || `申請書類を生成できませんでした。入力内容を確認してください。`;
}

// 質問IDから質問ラベルを取得
function getQuestionLabel(questionId: string): string {
  const labels: Record<string, string> = {
    // IT導入補助金
    'company_overview': '事業内容',
    'current_challenges': '現在の課題',
    'it_solution': '導入予定のITツール',
    'expected_benefits': '期待される効果',
    'implementation_schedule': '導入スケジュール',
    'budget_plan': '予算計画',
    'productivity_improvement': '生産性向上の具体策',
    'digital_transformation': 'DX推進計画',
    
    // ものづくり補助金
    'product_overview': '開発・改良する製品',
    'innovation_points': '革新性・新規性',
    'market_needs': '市場ニーズ',
    'production_plan': '生産体制',
    'sales_strategy': '販売戦略',
    'technical_capabilities': '技術的優位性',
    'quality_management': '品質管理体制',
    'intellectual_property': '知的財産戦略',
    
    // 持続化補助金
    'business_challenge': '経営課題',
    'improvement_plan': '改善計画',
    'target_customers': 'ターゲット顧客',
    'uniqueness': '自社の強み',
    'expected_results': '期待される成果',
    'marketing_strategy': 'マーケティング戦略',
    'customer_acquisition': '新規顧客獲得策',
    
    // 事業再構築補助金
    'restructuring_reason': '再構築の理由',
    'new_business_overview': '新事業の概要',
    'market_analysis': '市場分析',
    'competitive_advantage': '競争優位性',
    'investment_plan': '投資計画',
    'risk_management': 'リスク管理',
    'employment_plan': '雇用計画',
    'synergy_effects': 'シナジー効果'
  };
  
  return labels[questionId] || questionId;
}

// 関連するサンプル文例を取得する関数
function getRelevantSamples(subsidyType: string): string {
  const samples = subsidyApplicationSamples[subsidyType];
  if (!samples) return '';
  
  let sampleText = '';
  Object.values(samples.sections).forEach(section => {
    section.samples.forEach(sample => {
      sampleText += `\n${section.title}\n${sample.text}\n`;
    });
  });
  
  return sampleText;
}

export { router as aiDocumentRoutes };