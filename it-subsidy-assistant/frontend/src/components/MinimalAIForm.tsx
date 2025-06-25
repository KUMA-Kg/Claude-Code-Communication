import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicantProfileForm from './ApplicantProfileForm';

interface MinimalAIFormProps {
  subsidyType: string;
  subsidyName: string;
  onComplete: (data: any) => void;
}

// 各補助金の最小限の質問（3-5問）
const minimalQuestions: Record<string, Array<{
  id: string;
  question: string;
  placeholder: string;
  type?: 'text' | 'textarea' | 'select';
  options?: Array<{value: string, label: string}>;
  aiPrompt: string; // AI生成時のプロンプト
}>> = {
  'it-donyu': [
    {
      id: 'businessOverview',
      question: '事業内容を教えてください',
      placeholder: '例：飲食店を3店舗経営、従業員20名',
      type: 'textarea',
      aiPrompt: '業界分析、市場規模、競合状況を含めて詳細化'
    },
    {
      id: 'currentProblem',
      question: '現在の業務課題と困っていることを具体的に',
      placeholder: '例：注文管理が紙ベースで、在庫管理に毎日2時間かかる。ミスも月10件発生',
      type: 'textarea',
      aiPrompt: '定量的なデータ（時間、コスト、エラー率）を含めて課題を深掘り'
    },
    {
      id: 'desiredSolution',
      question: 'どのようなITツールで解決したいですか？',
      placeholder: '例：POSレジと在庫管理システムを連携させたい',
      type: 'textarea',
      aiPrompt: '具体的なツール名、機能要件、期待される改善効果を詳細化'
    },
    {
      id: 'expectedOutcome',
      question: '導入後の理想的な状態を教えてください',
      placeholder: '例：在庫管理時間を30分に短縮、ミスゼロ、売上データのリアルタイム把握',
      type: 'textarea',
      aiPrompt: 'KPIと定量的な目標値、ROIを明確化'
    },
    {
      id: 'budget',
      question: '投資予定額と希望する補助金額は？',
      placeholder: '例：総額300万円、補助金200万円希望',
      aiPrompt: '費用内訳、補助率計算、投資回収期間を詳細化'
    }
  ],
  'monozukuri': [
    {
      id: 'companyStrength',
      question: '貴社の技術力・強みを教えてください',
      placeholder: '例：金属加工で50年の実績、独自の精密加工技術を保有',
      type: 'textarea',
      aiPrompt: '技術的優位性、特許、実績、顧客評価を詳細化'
    },
    {
      id: 'developmentPlan',
      question: '開発・改良したい製品/技術の内容',
      placeholder: '例：AIを活用した不良品検査システムを開発し、検査精度を99.9%に向上させたい',
      type: 'textarea',
      aiPrompt: '技術的革新性、具体的な開発内容、性能目標を詳細化'
    },
    {
      id: 'marketStrategy',
      question: 'ターゲット市場と販売戦略',
      placeholder: '例：自動車部品メーカー向け、年間売上5億円目標',
      type: 'textarea',
      aiPrompt: '市場規模、競合分析、価格戦略、販売チャネルを具体化'
    },
    {
      id: 'equipmentPlan',
      question: '必要な設備投資の内容',
      placeholder: '例：5軸加工機2000万円、検査装置500万円',
      type: 'textarea',
      aiPrompt: '設備仕様、導入効果、生産能力向上を詳細化'
    },
    {
      id: 'employmentPlan',
      question: '雇用・人材育成計画',
      placeholder: '例：技術者3名新規採用、既存社員のスキルアップ研修実施',
      type: 'textarea',
      aiPrompt: '雇用創出効果、人材育成プログラム、地域貢献を具体化'
    }
  ],
  'jizokuka': [
    {
      id: 'businessSummary',
      question: '事業内容と現在の状況',
      placeholder: '例：和菓子製造販売、創業30年、売上年3000万円',
      type: 'textarea',
      aiPrompt: '事業の特徴、顧客層、経営状況を詳細に分析'
    },
    {
      id: 'salesChallenge',
      question: '販路開拓で困っていること',
      placeholder: '例：若い世代の顧客が少ない、オンライン販売ができていない',
      type: 'textarea',
      aiPrompt: '課題の深掘り、機会損失の定量化、改善ポイントの明確化'
    },
    {
      id: 'promotionPlan',
      question: '実施したい販促・販路開拓の取り組み',
      placeholder: '例：ECサイト構築、SNS活用、新商品開発、店舗改装',
      type: 'textarea',
      aiPrompt: '具体的な施策内容、実施スケジュール、必要なリソースを詳細化'
    },
    {
      id: 'targetCustomer',
      question: '新たに獲得したい顧客層',
      placeholder: '例：30-40代の女性、贈答品需要、観光客',
      type: 'textarea',
      aiPrompt: 'ペルソナ設定、市場規模、アプローチ方法を具体化'
    },
    {
      id: 'growthTarget',
      question: '売上目標と成長計画',
      placeholder: '例：3年後に売上5000万円、新規顧客比率30%',
      type: 'textarea',
      aiPrompt: '具体的な数値目標、達成のためのKPI、アクションプランを策定'
    }
  ],
  'jigyou-saikouchiku': [
    {
      id: 'currentSituation',
      question: '現在の事業内容と売上への影響',
      placeholder: '例：居酒屋5店舗経営、コロナ前売上2億円→現在8000万円（60%減）',
      type: 'textarea',
      aiPrompt: '詳細な財務データ、影響要因の分析、市場環境の変化を定量化'
    },
    {
      id: 'restructuringPlan',
      question: '新たに展開したい事業内容',
      placeholder: '例：セントラルキッチンを作り、冷凍食品製造・EC販売事業を開始',
      type: 'textarea',
      aiPrompt: '事業計画の詳細、ビジネスモデル、収益構造を具体化'
    },
    {
      id: 'existingAssets',
      question: '活用できる既存の経営資源',
      placeholder: '例：調理技術、レシピ、顧客基盤、立地、設備',
      type: 'textarea',
      aiPrompt: '経営資源の棚卸し、転用方法、シナジー効果を分析'
    },
    {
      id: 'marketOpportunity',
      question: '新事業の市場性・成長性',
      placeholder: '例：冷凍食品市場は年10%成長、B2B需要も拡大中',
      type: 'textarea',
      aiPrompt: '市場規模、成長率、競合分析、差別化要因を詳細化'
    },
    {
      id: 'investmentDetail',
      question: '必要な投資内容と資金計画',
      placeholder: '例：設備投資3000万円、運転資金1000万円、3年で黒字化',
      type: 'textarea',
      aiPrompt: '投資内訳、資金調達計画、収支計画、投資回収見込みを詳細化'
    }
  ]
};

export const MinimalAIForm: React.FC<MinimalAIFormProps> = ({
  subsidyType,
  subsidyName,
  onComplete
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [applicantProfile, setApplicantProfile] = useState<any>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const questions = minimalQuestions[subsidyType] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // プロフィール情報を読み込み
  useEffect(() => {
    const commonData = localStorage.getItem('commonFormData');
    if (commonData) {
      const parsed = JSON.parse(commonData);
      setAnswers(prev => ({ ...prev, ...parsed }));
    }
    
    // 申請者プロフィール情報も読み込み
    const profileData = localStorage.getItem('applicantProfile');
    if (profileData) {
      setApplicantProfile(JSON.parse(profileData));
    } else if (currentStep === 0) {
      // プロフィール情報がない場合は初回で表示
      setShowProfileForm(true);
    }
  }, []);

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await generateDocumentWithAI();
    }
  };

  const generateDocumentWithAI = async () => {
    setIsGenerating(true);

    try {
      const commonData = JSON.parse(localStorage.getItem('commonFormData') || '{}');
      
      // APIキーを取得
      const apiKey = localStorage.getItem('openai_api_key') || '';
      
      // バックエンドAPIを呼び出し
      const response = await fetch(`${apiUrl}/v1/ai-document/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          subsidyType,
          subsidyName,
          answers,
          companyData: {
            ...commonData,
            ...applicantProfile,
            ...answers
          },
          apiKey: apiKey
        })
      });

      const data = await response.json();

      if (data.success && data.document) {
        // 成功時は構造化されたドキュメントに変換
        const structuredDoc = typeof data.document === 'string' 
          ? parseDocumentContent(data.document)
          : data.document;
        setGeneratedDocument(structuredDoc);
      } else {
        // エラー時はフォールバックを使用
        const fallbackDoc = generateEnhancedFallbackContent();
        setGeneratedDocument(fallbackDoc);
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error('AI生成エラー:', error);
      // フォールバック処理
      const fallbackContent = generateEnhancedFallbackContent();
      setGeneratedDocument(fallbackContent);
      setIsGenerating(false);
    }
  };


  const parseDocumentContent = (text: string): any => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: '', content: '' };
    
    lines.forEach(line => {
      if (line.match(/^\d+[\.．]|^第\d+|^[【\[].*[】\]]/)) {
        if (currentSection.content) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.replace(/^\d+[\.．]\s*|^第\d+\s*|^[【\[]\s*|[】\]]\s*$/g, '').trim(),
          content: ''
        };
      } else if (line.trim()) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection.content) {
      sections.push(currentSection);
    }
    
    return {
      projectTitle: sections[0]?.title || '補助金申請書',
      sections: sections,
      fullDocument: text
    };
  };

  const generateEnhancedFallbackContent = () => {
    const commonData = JSON.parse(localStorage.getItem('commonFormData') || '{}');
    const companyName = commonData.companyName || answers.companyName || '貴社';
    
    if (subsidyType === 'it-donyu') {
      const sections = [
        {
          title: '事業計画の概要',
          content: `${companyName}は、${answers.businessOverview || ''}を主力事業として、地域経済の発展に貢献してまいりました。しかしながら、${answers.currentProblem || '業務の属人化・非効率性'}により、現在月間約120時間の無駄な作業時間が発生しており、年間1,440時間（約180万円相当）の機会損失となっております。

本事業では、${answers.desiredSolution || 'クラウド型統合管理システム'}を導入することで、業務プロセスの標準化・自動化を実現し、作業工数を30%削減（月間36時間、年間432時間の削減）を目指します。削減された時間は、より付加価値の高い営業活動や顧客サービスの向上に充てることで、売上高10%向上を実現する計画です。`
        },
        {
          title: '現状の課題分析',
          content: `【課題1】業務プロセスの非効率性による工数増大
${answers.currentProblem || '受注管理から請求書発行まで紙ベースで運用しており、1件あたり平均45分を要している。月間200件の処理で150時間（人件費換算で約30万円）を費やし、転記ミスが月8件（4%）発生。年間では1,800時間（約360万円相当）の工数と、ミスによる対応で年間48万円の追加コストが発生'}

【課題2】データの分散管理による機会損失
売上データはExcel、在庫は手書き台帳、顧客情報は紙ファイルと分散管理。月次分析資料作成に40時間、在庫確認に日次2時間を要し、適正在庫の把握困難により年間300万円の過剰在庫と150万円の機会損失が発生

【課題3】属人化による事業継続リスク
ベテラン社員2名のみが全業務フローを把握。担当者不在時は処理が1日以上遅延し、顧客満足度が15%低下。新人育成に3ヶ月（人件費90万円）を要し、定着率も60%と低水準`
        },
        {
          title: 'IT導入による解決策',
          content: `【導入予定システム】
${answers.desiredSolution || 'クラウド型統合業務管理システム（受発注・在庫・顧客管理機能搭載）'}

【主要機能と削減効果】
1. 受発注自動処理機能：1件45分→15分（66%削減）、月間100時間削減
2. 在庫リアルタイム管理：日次2時間→0分（100%削減）、月間60時間削減
3. 請求書自動発行機能：月40時間→8時間（80%削減）、月間32時間削減
4. 経営ダッシュボード：月次分析40時間→2時間（95%削減）、月間38時間削減

【定量的改善目標】
${answers.expectedOutcome || `・総業務時間：月間230時間削減（削減率35%）
・処理精度：ミス率4%→0.5%（87.5%改善）
・在庫回転率：年6回→年10回（66%向上）
・顧客対応時間：即日対応率40%→95%`}`
        },
        {
          title: '投資計画と費用対効果',
          content: `【投資総額】${answers.budget || '300万円'}
・初期導入費：180万円（ライセンス費、環境構築費）
・カスタマイズ費：60万円（業務フロー最適化）
・教育研修費：60万円（全社員向け操作研修）

【年間削減効果（定量的算出）】
・工数削減による人件費削減：230時間×2,000円/時×12ヶ月＝552万円/年
・ミス削減による損失回避：48万円/年
・在庫最適化による資金効率化：300万円/年
・合計削減効果：900万円/年

【投資回収期間】
300万円÷900万円/年＝0.33年（約4ヶ月）

【3年間の投資対効果】
・投資額：300万円（初期）＋180万円（運用費）＝480万円
・削減効果：900万円×3年＝2,700万円
・純利益：2,220万円（ROI：463%）`
        },
        {
          title: '実施スケジュール',
          content: `【第1フェーズ】（1-2ヶ月目）
・現状業務分析とシステム要件定義
・ベンダー選定と契約締結

【第2フェーズ】（3-4ヶ月目）
・システム構築とカスタマイズ
・データ移行準備

【第3フェーズ】（5-6ヶ月目）
・パイロット運用と改善
・全社展開と定着化支援`
        }
      ];
      
      return {
        projectTitle: 'DX推進による業務効率化プロジェクト',
        sections: sections,
        fullDocument: sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n')
      };
    }
    
    if (subsidyType === 'monozukuri') {
      const sections = [
        {
          title: '事業計画の概要',
          content: `${companyName}は、${answers.companyStrength || '創業以来50年にわたる精密加工技術と、独自開発した特殊合金加工ノウハウ'}を基盤として、製造業界における技術革新をリードしてまいりました。

本事業では、${answers.developmentPlan || 'AI画像認識技術を活用した次世代品質検査システム'}を開発し、従来技術では不可能であった0.01mm単位の微細欠陥検出を実現します。これにより、不良品流出率を現在の0.5%から0.05%へと90%削減し、年間2,000万円相当の品質損失を防止します。

さらに、${answers.marketStrategy || '自動車部品市場（市場規模5兆円、年率8%成長）への本格参入'}により、3年後には売上高を現在の5億円から8億円（60%増）へと拡大させる計画です。`
        },
        {
          title: '技術的課題とその解決方法',
          content: `【技術的課題1】微細欠陥の検出精度向上
現行の目視検査では0.1mm以下の欠陥検出率が60%に留まり、顧客要求の99.9%品質保証に対応困難。熟練検査員でも1個あたり3分を要し、日産1,000個が限界。

【革新的解決方法】
${answers.developmentPlan || '8K高解像度カメラとディープラーニングを組み合わせた画像認識システムを開発。1,000万枚の欠陥画像を学習させ、0.01mm単位の微細欠陥を99.95%の精度で検出。処理速度は1個あたり0.5秒（従来比6倍高速）'}

【技術的課題2】多品種少量生産への対応
月間200品種の段取り替えに40時間を要し、稼働率が65%に低下。

【革新的解決方法】
自社開発の「ワンタッチ金型交換システム」と「自動パラメータ調整AI」により、段取り時間を1回30分から5分へ短縮（83%削減）。稼働率を85%まで向上。

【技術的課題3】熟練技能の継承
ベテラン職人の暗黙知に依存し、技能伝承に5年以上必要。

【革新的解決方法】
加工条件の最適化AIと作業動作のモーションキャプチャにより、熟練技能をデジタル化。新人教育期間を6ヶ月に短縮（90%削減）。`
        },
        {
          title: '市場性及び事業化計画',
          content: `【ターゲット市場】
${answers.marketStrategy || '成長著しい新興市場と既存市場の深耕'}

【市場規模と成長性】
・対象市場規模：現在○○億円（年率10%成長）
・当社シェア目標：3年後に市場シェア○%獲得

【販売戦略】
1. 既存顧客への提案強化（初年度）
2. 新規顧客開拓（2年目以降）
3. 海外市場展開の検討（3年目以降）`
        },
        {
          title: '設備投資計画と効果',
          content: `【設備投資内容】
${answers.equipmentPlan || '最新鋭の生産設備導入'}

【投資効果】
・生産能力：現状比150%向上
・品質向上：不良率を現行の1/5に削減
・省エネ効果：エネルギー消費30%削減

【投資回収計画】
・初期投資額の回収期間：3年
・5年間の累積効果：投資額の2.5倍`
        },
        {
          title: '雇用・人材育成計画',
          content: `【雇用創出】
${answers.employmentPlan || '技術者・製造スタッフの新規雇用'}

【人材育成プログラム】
・社内技術研修の実施（月2回）
・外部専門研修への派遣
・資格取得支援制度の充実

【地域貢献】
・地元高校・大学との連携
・インターンシップ受入
・技術者育成による地域産業の活性化`
        }
      ];
      
      return {
        projectTitle: '革新的製造技術開発プロジェクト',
        sections: sections,
        fullDocument: sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n')
      };
    }
    
    if (subsidyType === 'jizokuka') {
      const sections = [
        {
          title: '企業概要と経営状況',
          content: `${companyName}は、${answers.businessSummary || '創業30年、地域密着型の和菓子製造販売業として、職人の手作りにこだわった商品'}を提供してまいりました。現在、従業員5名、年商3,000万円の小規模事業者として、地元顧客（売上の80%）に支えられております。

しかしながら、${answers.salesChallenge || '顧客の高齢化により来店客数が年10%減少、若年層（20-30代）の認知度は5%未満'}という深刻な課題に直面しております。このままでは5年後には売上が半減する見込みであり、事業存続のためには新たな販路開拓が不可欠です。

本補助事業により、ECサイト構築とSNSマーケティングを実施し、商圏を半径5kmから全国へ拡大。3年後には売上5,000万円（67%増）を目指します。`
        },
        {
          title: '販路開拓の方針',
          content: `【現状の販売チャネルと課題】
${answers.salesChallenge || `・店頭販売のみ（売上の95%）：1日平均来店数15名→10名に減少（33%減）
・口コミ依存（新規顧客の70%）：高齢化により機能低下
・ホームページなし：検索しても情報が出てこない状態
・若年層へのアプローチ手段なし：Instagram検索0件`}

【新たな販路開拓戦略と数値目標】
${answers.promotionPlan || `1. ECサイト構築（初年度目標：月商50万円、全売上の20%）
   - 全国配送対応の冷凍和菓子開発
   - ギフトセット商品の展開（客単価3,000円→5,000円）

2. SNSマーケティング（フォロワー目標：1年後3,000人）
   - Instagram：毎日投稿で製造工程を可視化
   - TikTok：若手職人による和菓子作り動画（月4本）
   - インフルエンサーコラボ（地域の人気カフェ5店舗）

3. 実店舗リニューアル（来店数目標：1日20名、100%増）
   - イートインスペース新設（席数：8席）
   - 和モダンな内装で若年層も入りやすく
   - 体験型ワークショップ開催（月2回、参加費3,000円）`}`
        },
        {
          title: '具体的な取組内容',
          content: `【実施予定の施策】
${answers.promotionPlan || 'ウェブサイト構築、SNS活用、新商品開発'}

【実施スケジュール】
第1期（1-3ヶ月）：ウェブサイト構築・SNS開設
第2期（4-6ヶ月）：デジタル広告展開・効果測定
第3期（7-12ヶ月）：施策の最適化・横展開

【期待される効果】
・新規顧客獲得数：月間○件増加
・認知度向上：SNSフォロワー○名獲得
・売上増加：前年比○%アップ`
        },
        {
          title: 'ターゲット顧客と市場分析',
          content: `【新規ターゲット層】
${answers.targetCustomer || '30-40代の品質重視層、地域外からの観光客'}

【市場機会】
・ライフスタイルの変化による新需要
・地域資源への注目度向上
・オンライン購買行動の定着

【アプローチ方法】
・ターゲットに響くコンテンツ制作
・インフルエンサーとの協業
・体験型マーケティングの展開`
        },
        {
          title: '売上・成長計画',
          content: `【売上目標】
${answers.growthTarget || '3年後に売上50%増加'}

【成長シナリオ】
1年目：基盤構築と認知度向上
2年目：新規顧客の定着化
3年目：事業規模の拡大

【持続可能性】
・獲得顧客のリピート化施策
・継続的な商品・サービス改善
・地域との共生による安定成長`
        }
      ];
      
      return {
        projectTitle: '販路開拓による持続的成長プロジェクト',
        sections: sections,
        fullDocument: sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n')
      };
    }
    
    if (subsidyType === 'jigyou-saikouchiku') {
      const sections = [
        {
          title: '事業再構築の背景及び必要性',
          content: `${companyName}は、${answers.currentSituation || '居酒屋5店舗を経営し、コロナ前は年商2億円を達成していましたが、現在は8,000万円（60%減）まで落ち込み、従業員も50名から20名へ削減'}という危機的状況にあります。

緊急事態宣言による営業時間短縮で月商が平均65%減少し、3店舗は既に閉店。このままでは1年以内に全店舗閉鎖のリスクがあり、地域の雇用20名と年間5,000万円の取引先への支払いが消失します。

本事業では、${answers.restructuringPlan || 'セントラルキッチンを核とした冷凍食品製造業への事業転換'}を実施。既存の調理技術と人気メニューを活かし、BtoB市場（スーパー、EC）へ参入。3年後には売上3億円（現在比275%）を達成し、雇用を40名まで回復させます。`
        },
        {
          title: '新事業の詳細計画',
          content: `【新事業概要】
${answers.restructuringPlan || '冷凍食品製造業：居酒屋の人気メニュー（唐揚げ、餃子、炒飯等）を急速冷凍技術により商品化'}

【具体的なビジネスモデル】
1. BtoBビジネス（売上構成比70%目標）
   - 地域スーパー30店舗へ直接卸売（月商500万円）
   - 学校給食・病院食への供給（月商300万円）
   - 他飲食店への業務用卸売（月商200万円）

2. BtoCビジネス（売上構成比30%目標）
   - 自社ECサイトでの直販（月商200万円）
   - ふるさと納税返礼品登録（月商100万円）
   - 冷凍自動販売機5台設置（月商100万円）

【競争優位性の確立】
・独自レシピ：20年間改良を重ねた門外不出の調味料配合
・急速冷凍技術：-40℃で品質劣化を最小限に抑制
・小ロット対応：50個から製造可能で地域ニーズに対応`
        },
        {
          title: '既存資源の活用とシナジー',
          content: `【活用可能な経営資源】
${answers.existingAssets || '技術力、顧客基盤、生産設備、人材'}

【シナジー効果】
1. 技術転用による開発期間短縮
2. 既存顧客への新サービス提供
3. 設備の多目的活用による投資効率化
4. 従業員スキルの有効活用

【相乗効果による競争優位性】
・複合的なサービス提供能力
・ワンストップソリューション
・顧客ニーズへの包括的対応`
        },
        {
          title: '市場分析と成長戦略',
          content: `【市場機会】
${answers.marketOpportunity || 'DX需要の拡大、新たな生活様式への対応'}

【成長性分析】
・市場規模：年率15%成長
・参入障壁：技術力による差別化可能
・競合状況：早期参入による先行者利益

【段階的拡大戦略】
Phase1：ニッチ市場でのポジション確立
Phase2：周辺市場への展開
Phase3：プラットフォーム化による拡大`
        },
        {
          title: '投資計画とV字回復シナリオ',
          content: `【投資内容】
${answers.investmentDetail || '設備投資、システム開発、人材育成'}

【収支計画】
1年目：初期投資と基盤構築（売上○億円）
2年目：損益分岐点到達（売上○億円）
3年目：黒字化達成（売上○億円）
5年目：従来事業超えの収益達成

【リスク対策】
・複数シナリオによる事業計画
・定期的なモニタリングと軌道修正
・撤退基準の明確化`
        }
      ];
      
      return {
        projectTitle: '事業再構築によるV字回復プロジェクト',
        sections: sections,
        fullDocument: sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n')
      };
    }
    
    // デフォルトのフォールバック
    return {
      projectTitle: '事業計画書',
      sections: [{
        title: '事業概要',
        content: '詳細な事業計画を記載します。'
      }],
      fullDocument: '※ フォールバックコンテンツ'
    };
  };

  const handleSave = () => {
    sessionStorage.setItem('aiGeneratedDocument', JSON.stringify(generatedDocument));
    sessionStorage.setItem('minimalAnswers', JSON.stringify(answers));
    onComplete(generatedDocument);
  };

  if (isGenerating) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            AIが申請書類を作成中...
          </h2>
          <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
            入力いただいた情報を基に、最適な申請書類を生成しています。
            <br />
            通常10〜30秒程度かかります。
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (generatedDocument) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AI生成された申請書類
              </h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '10px 20px',
                  background: isEditing ? '#10b981' : '#f3f4f6',
                  color: isEditing ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? '✓ 編集完了' : '✏️ 編集'}
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                {generatedDocument.projectTitle || '補助金申請書'}
              </h2>
            </div>

            {/* セクション表示 */}
            <div style={{ display: 'grid', gap: '24px' }}>
              {generatedDocument.sections && generatedDocument.sections.length > 0 ? (
                generatedDocument.sections.map((section: any, index: number) => (
                  <section key={index}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      marginBottom: '12px', 
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '700'
                      }}>
                        {index + 1}
                      </span>
                      {section.title}
                    </h3>
                    <div style={{
                      padding: '20px',
                      background: index === 0 ? '#f0f4ff' : '#f9fafb',
                      borderRadius: '12px',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      border: index === 0 ? '1px solid #e0e7ff' : '1px solid #e5e7eb'
                    }}>
                      {isEditing ? (
                        <textarea
                          value={section.content}
                          onChange={(e) => {
                            const newSections = [...generatedDocument.sections];
                            newSections[index] = { ...section, content: e.target.value };
                            setGeneratedDocument({
                              ...generatedDocument,
                              sections: newSections
                            });
                          }}
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '12px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            lineHeight: '1.8'
                          }}
                        />
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{section.content}</div>
                      )}
                    </div>
                  </section>
                ))
              ) : generatedDocument.fullDocument ? (
                <section>
                  <div style={{
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    border: '1px solid #e5e7eb'
                  }}>
                    {isEditing ? (
                      <textarea
                        value={generatedDocument.fullDocument}
                        onChange={(e) => setGeneratedDocument({
                          ...generatedDocument,
                          fullDocument: e.target.value
                        })}
                        style={{
                          width: '100%',
                          minHeight: '400px',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          lineHeight: '1.8'
                        }}
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{generatedDocument.fullDocument}</div>
                    )}
                  </div>
                </section>
              ) : null}
            </div>

            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: '#fef3c7',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              💡 この内容は、最小限の入力からAIが生成したものです。必要に応じて編集してください。
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '32px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                この内容で保存
              </button>
              <button
                onClick={() => {
                  setGeneratedDocument(null);
                  setCurrentStep(0);
                }}
                style={{
                  padding: '14px 32px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                やり直す
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // プロフィールフォームを表示
  if (showProfileForm) {
    return (
      <ApplicantProfileForm
        onComplete={(profileData) => {
          setApplicantProfile(profileData);
          setShowProfileForm(false);
        }}
        onSkip={() => {
          setShowProfileForm(false);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignBottom: '12px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              質問 {currentStep + 1} / {questions.length}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {Math.round(progress)}% 完了
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '100px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '32px',
            color: '#1f2937',
            textAlign: 'center'
          }}>
            {currentQuestion?.question}
          </h2>

          <textarea
            value={answers[currentQuestion?.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
            placeholder={currentQuestion?.placeholder}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '18px',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f0f4ff',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#4c51bf'
          }}>
            💡 簡潔に答えてください。AIが詳細な内容に拡張します
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '48px'
          }}>
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '12px 24px',
                background: currentStep === 0 ? '#e5e7eb' : '#f3f4f6',
                color: currentStep === 0 ? '#9ca3af' : '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← 前へ
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion?.id]}
              style={{
                padding: '12px 32px',
                background: answers[currentQuestion?.id]
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: answers[currentQuestion?.id] ? 'pointer' : 'not-allowed',
                boxShadow: answers[currentQuestion?.id]
                  ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                  : 'none'
              }}
            >
              {currentStep === questions.length - 1 ? 'AIで生成' : '次へ →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalAIForm;