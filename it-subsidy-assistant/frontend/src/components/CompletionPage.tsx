import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle, Calendar, ExternalLink, Printer, FileSignature, Eye } from 'lucide-react';
import '../styles/modern-ui.css';

interface CompletionPageProps {
  selectedSubsidy: string;
  formData: any;
  requiredDocuments: any[];
}

interface DocumentDownload {
  id: string;
  name: string;
  description: string;
  fileType: 'excel' | 'word' | 'pdf';
  category: 'template' | 'filled' | 'reference';
  downloadUrl?: string;
  size?: string;
}

export const CompletionPage: React.FC<CompletionPageProps> = ({
  selectedSubsidy,
  formData,
  requiredDocuments
}) => {
  const [downloadLinks, setDownloadLinks] = useState<DocumentDownload[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<any>(null);
  const [isEditingApplicant, setIsEditingApplicant] = useState(false);
  const [applicantData, setApplicantData] = useState<any>(null);
  const [editedApplicantData, setEditedApplicantData] = useState<any>(null);

  // 申請者プロファイルデータを読み込む
  useEffect(() => {
    const profileData = localStorage.getItem('applicantProfile');
    if (profileData) {
      const parsed = JSON.parse(profileData);
      setApplicantData(parsed);
      setEditedApplicantData(parsed);
    }
  }, []);

  // 補助金別のダウンロード書類を設定
  useEffect(() => {
    const generateDownloadLinks = () => {
      let documents: DocumentDownload[] = [];

      switch (selectedSubsidy) {
        case 'it-donyu':
          documents = [
            {
              id: 'it_filled_application',
              name: '入力済み申請書一式',
              description: 'お客様の情報が入力された申請書類',
              fileType: 'excel',
              category: 'filled',
              size: '2.1MB'
            },
            {
              id: 'it_wage_report',
              name: '賃金報告書',
              description: '賃上げ計画の詳細書類',
              fileType: 'excel',
              category: 'filled',
              size: '856KB'
            },
            {
              id: 'it_implementation_plan',
              name: '実施内容説明書',
              description: 'IT導入計画の詳細',
              fileType: 'excel',
              category: 'filled',
              size: '1.2MB'
            },
            {
              id: 'it_price_breakdown',
              name: '価格説明書',
              description: '導入費用の詳細内訳',
              fileType: 'excel',
              category: 'filled',
              size: '945KB'
            },
            {
              id: 'it_template_blank',
              name: '空白テンプレート一式',
              description: '記入前のオリジナル書類（参考用）',
              fileType: 'excel',
              category: 'template',
              size: '1.8MB'
            },
            {
              id: 'it_application_guide',
              name: 'IT導入補助金申請ガイド',
              description: '申請手順と注意事項',
              fileType: 'pdf',
              category: 'reference',
              size: '3.4MB'
            }
          ];
          break;

        case 'monozukuri':
          documents = [
            {
              id: 'mono_A1_business_plan',
              name: '【A1】事業計画書（入力済み）',
              description: 'システム入力内容＋別紙Word形式',
              fileType: 'word',
              category: 'filled',
              size: '2.5MB'
            },
            {
              id: 'mono_B1_expense_pledge',
              name: '【B1】補助対象経費誓約書【様式1】',
              description: '記入済み・押印箇所あり',
              fileType: 'pdf',
              category: 'filled',
              size: '456KB'
            },
            {
              id: 'mono_B2_wage_pledge',
              name: '【B2】賃金引上げ計画の誓約書【様式2】',
              description: '必須要件・記入済み',
              fileType: 'pdf',
              category: 'filled',
              size: '512KB'
            },
            {
              id: 'mono_D1_quotations',
              name: '【D1】見積書まとめ（Excel管理表）',
              description: '相見積もり比較表・発注予定先マーク済み',
              fileType: 'excel',
              category: 'filled',
              size: '1.2MB'
            },
            {
              id: 'mono_checklist',
              name: 'ものづくり補助金 申請前チェックリスト',
              description: '全カテゴリA〜Gの必要書類確認用',
              fileType: 'excel',
              category: 'reference',
              size: '856KB'
            },
            {
              id: 'mono_application_guide',
              name: 'ものづくり補助金 完全申請ガイド2025年版',
              description: '公募要領・記載例・審査ポイント解説',
              fileType: 'pdf',
              category: 'reference',
              size: '5.8MB'
            }
          ];
          break;

        case 'jizokuka':
          documents = [
            {
              id: 'jizoku_application_form',
              name: '様式1 申請書（入力済み）',
              description: '基本情報が入力された申請書',
              fileType: 'word',
              category: 'filled',
              size: '756KB'
            },
            {
              id: 'jizoku_business_plan',
              name: '様式2 経営計画書（入力済み）',
              description: '経営方針と課題が記載された計画書',
              fileType: 'word',
              category: 'filled',
              size: '1.1MB'
            },
            {
              id: 'jizoku_project_plan',
              name: '様式3 補助事業計画書（入力済み）',
              description: '販路開拓計画の詳細',
              fileType: 'excel',
              category: 'filled',
              size: '1.3MB'
            },
            {
              id: 'jizoku_checklist',
              name: '申請チェックリスト',
              description: '提出前の最終確認用',
              fileType: 'excel',
              category: 'reference',
              size: '423KB'
            },
            {
              id: 'jizoku_application_guide',
              name: '持続化補助金申請ガイド',
              description: '小規模事業者向け申請マニュアル',
              fileType: 'pdf',
              category: 'reference',
              size: '2.8MB'
            }
          ];
          break;

        default:
          documents = [];
      }

      // ダウンロードURLを生成
      documents.forEach(doc => {
        doc.downloadUrl = `http://localhost:3001/api/excel-download/download/${doc.id}?subsidyType=${selectedSubsidy}&sessionId=${Date.now()}`;
      });

      setDownloadLinks(documents);
    };

    generateDownloadLinks();
  }, [selectedSubsidy]);

  const handleGenerateDocuments = async () => {
    setIsGenerating(true);
    try {
      // Excel生成APIを呼び出し
      const response = await fetch('http://localhost:3001/api/excel-download/complete-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: formData,
          selectedSubsidy: selectedSubsidy
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Documents generated:', result);
        // 成功時の処理
      }
    } catch (error) {
      console.error('Document generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (doc: DocumentDownload) => {
    // デモ用のダウンロード処理
    const demoData = {
      filename: `${doc.name}.${doc.fileType === 'excel' ? 'xlsx' : doc.fileType === 'word' ? 'docx' : 'pdf'}`,
      content: generateDemoContent(doc),
      type: doc.fileType
    };

    // ダウンロードをシミュレート
    console.log('ダウンロード開始:', demoData.filename);
    
    // 実際のダウンロードの代わりにアラートを表示
    alert(`📥 ダウンロード準備完了！\n\nファイル名: ${demoData.filename}\nサイズ: ${doc.size || '準備中'}\n\n実際の環境では、このファイルがダウンロードされます。`);
  };

  const generateDemoContent = (doc: DocumentDownload) => {
    // デモ用のコンテンツ生成
    return {
      subsidyType: selectedSubsidy,
      documentId: doc.id,
      documentName: doc.name,
      formData: formData,
      generatedAt: new Date().toISOString()
    };
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'excel': return '📊';
      case 'word': return '📝';
      case 'pdf': return '📄';
      default: return '📁';
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'filled': return {
        background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
        color: '#22543d',
        border: '1px solid rgba(72, 187, 120, 0.2)'
      };
      case 'template': return {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        color: '#2c5282',
        border: '1px solid rgba(102, 126, 234, 0.2)'
      };
      case 'reference': return {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--bg-tertiary)'
      };
      default: return {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--bg-tertiary)'
      };
    }
  };

  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金'
  };

  // 追加で必要な書類の情報
  const getAdditionalDocuments = (subsidyType: string) => {
    const commonDocs = [
      {
        name: '登記簿謄本（履歴事項全部証明書）',
        icon: '🏢',
        description: '法人の場合は必須。発行から3ヶ月以内のもの',
        location: '法務局（オンライン申請可）',
        note: 'オンライン申請の場合は「登記ねっと」を利用可能'
      },
      {
        name: '納税証明書',
        icon: '🧾',
        description: '直近3期分の法人税・消費税・固定資産税の納税証明書',
        location: '管轄税務署または市区町村役場',
        note: '未納がある場合は申請不可'
      },
      {
        name: '決算書類',
        icon: '📊',
        description: '直近2期分の財務諸表（財務諸表、損益計算書、製造原価報告書等）',
        location: '自社で保管',
        note: '税理士の押印が必要な場合あり'
      }
    ];

    const subsidySpecificDocs: Record<string, any[]> = {
      'it-donyu': [
        ...commonDocs,
        {
          name: '身分証明書（運転免許証等）',
          icon: '🆔',
          description: '代表者の本人確認書類',
          location: '運転免許証は警察署、マイナンバーカードは市区町村役場',
          note: '有効期限内のもの'
        },
        {
          name: 'SECURITY ACTION自己宣言',
          icon: '🔐',
          description: 'IPAのSECURITY ACTIONの宣言証明',
          location: 'IPAウェブサイトでオンライン宣言',
          note: '申請前に必ず宣言が必要'
        }
      ],
      'monozukuri': [
        ...commonDocs,
        {
          name: '認定経営革新等支援機関による確認書',
          icon: '🏆',
          description: '事業計画の確認書',
          location: '認定支援機関（商工会議所、金融機関等）',
          note: '事前に支援機関との相談が必要'
        },
        {
          name: '従業員数を証明する書類',
          icon: '👥',
          description: '雇用保険被保険者資格取得等確認通知書等',
          location: 'ハローワークまたは年金事務所',
          note: '直近のもの'
        }
      ],
      'jizokuka': [
        ...commonDocs,
        {
          name: '商工会議所・商工会の会員証明',
          icon: '🤝',
          description: '会員であることの証明書',
          location: '所属する商工会議所・商工会',
          note: '非会員の場合は入会が必要'
        },
        {
          name: '開業届控え（個人事業主の場合）',
          icon: '📝',
          description: '税務署に提出した開業届の控え',
          location: '自社で保管（税務署提出済み）',
          note: '開業から1年未満の場合は開業届で代替可'
        }
      ]
    };

    return subsidySpecificDocs[subsidyType] || commonDocs;
  };

  // オンライン申請情報
  const getOnlineSubmissionInfo = (subsidyType: string) => {
    const info: Record<string, any> = {
      'it-donyu': {
        description: 'IT導入支援事業者と連携して、専用ポータルから申請します。電子申請にはgBizIDプライムの取得が必要です。',
        url: 'https://www.it-hojo.jp/',
        buttonText: 'IT導入補助金申請ポータルへ'
      },
      'monozukuri': {
        description: '電子申請システムを利用して申請します。GBizIDプライムの取得が必要です。',
        url: 'https://portal.monodukuri-hojo.jp/',
        buttonText: 'ものづくり補助金電子申請システムへ'
      },
      'jizokuka': {
        description: '商工会議所・商工会経由での申請が基本ですが、一部電子申請も可能です。',
        url: 'https://www.jizokukahojokin.info/',
        buttonText: '持続化補助金公式サイトへ'
      }
    };
    return info[subsidyType] || info['it-donyu'];
  };

  // 郵送申請情報
  const getPostalSubmissionInfo = (subsidyType: string) => {
    const info: Record<string, string> = {
      'it-donyu': '原則として電子申請のみ。郵送申請は受け付けていません。',
      'monozukuri': '紙媒体での申請も可能ですが、電子申請が推奨されています。詳細は公募要領をご確認ください。',
      'jizokuka': '所属する商工会議所・商工会に申請書類を提出してください。提出先は各地域の商工会議所・商工会です。'
    };
    return info[subsidyType] || '詳細は各補助金の公募要領をご確認ください。';
  };

  // AI生成書類のプレビューコンテンツ生成
  const generateDocumentPreviews = (subsidyType: string, formData: any) => {
    const companyName = formData?.companyName || formData?.company_name || '貴社';
    const businessDescription = formData?.businessDescription || formData?.industry || '事業内容';
    const employeeCount = formData?.employeeCount || formData?.employee_count || '10';
    const annualRevenue = formData?.annualRevenue || formData?.annual_revenue || '5000';
    
    switch (subsidyType) {
      case 'jizokuka':
        return [
          {
            type: 'business_plan',
            title: '経営計画書',
            description: '現状分析から将来ビジョンまで、AIが貴社の強みを最大限に表現した経営計画',
            content: generateJizokukaBusinessPlan(formData)
          },
          {
            type: 'sales_plan',
            title: '販路開拓計画書',
            description: '具体的な販売戦略と実現可能な売上増加プランをAIが策定',
            content: generateJizokukaSalesPlan(formData)
          },
          {
            type: 'expected_effect',
            title: '事業効果説明書',
            description: '補助金活用による定量的・定性的効果をAIが分析・予測',
            content: generateJizokukaExpectedEffect(formData)
          }
        ];
      case 'it-donyu':
        return [
          {
            type: 'it_implementation',
            title: 'IT導入計画書',
            description: 'DX推進に向けた具体的なIT活用戦略とロードマップ',
            content: generateITImplementationPlan(formData)
          },
          {
            type: 'productivity_plan',
            title: '生産性向上計画書',
            description: 'IT導入による業務効率化と生産性向上の定量的分析',
            content: generateProductivityPlan(formData)
          },
          {
            type: 'wage_increase',
            title: '賃金引上げ計画書',
            description: '生産性向上に伴う従業員への還元計画',
            content: generateWageIncreasePlan(formData)
          }
        ];
      case 'monozukuri':
        return [
          {
            type: 'technical_plan',
            title: '技術開発計画書',
            description: '革新的な技術開発と市場競争力強化の詳細プラン',
            content: generateMonozukuriTechnicalPlan(formData)
          },
          {
            type: 'market_strategy',
            title: '市場戦略書',
            description: '新製品・サービスの市場分析と販売戦略',
            content: generateMonozukuriMarketStrategy(formData)
          },
          {
            type: 'investment_plan',
            title: '設備投資計画書',
            description: '必要設備の詳細と投資効果の分析',
            content: generateMonozukuriInvestmentPlan(formData)
          }
        ];
      default:
        return [];
    }
  };

  // 小規模事業者持続化補助金 - 経営計画書生成
  const generateJizokukaBusinessPlan = (formData: any) => {
    const companyName = formData?.companyName || '株式会社〇〇';
    const businessDescription = formData?.businessDescription || '小売業';
    const employeeCount = formData?.employeeCount || '3';
    const establishYear = new Date().getFullYear() - 10; // 仮の創業年
    
    return {
      sections: [
        {
          title: '1. 企業概要',
          content: `${companyName}は、${establishYear}年の創業以来、地域に根ざした${businessDescription}として事業を展開してまいりました。現在、従業員${employeeCount}名の小規模事業者として、地域経済の活性化に貢献しております。`
        },
        {
          title: '2. 経営方針',
          content: `当社は「顧客第一主義」を経営理念に掲げ、地域のお客様に愛される企業を目指しています。小規模事業者の強みである機動力と柔軟性を活かし、大手企業では対応できないきめ細やかなサービスを提供することで、差別化を図っております。`
        },
        {
          title: '3. 現状分析（SWOT分析）',
          content: `【強み（Strengths）】
・地域密着型の事業展開により、顧客との信頼関係が構築されている
・小回りの利く経営体制により、顧客ニーズへの迅速な対応が可能
・経験豊富な従業員による高品質なサービス提供

【弱み（Weaknesses）】
・販売チャネルが限定的で、新規顧客開拓が課題
・デジタル化の遅れにより、業務効率に改善の余地がある
・マーケティング活動が不十分で、認知度向上が必要

【機会（Opportunities）】
・地域のデジタル化推進により、新たな顧客層の開拓が可能
・コロナ禍を経て、地元志向の消費者が増加
・行政による小規模事業者支援策の充実

【脅威（Threats）】
・大手企業の地域進出による競争激化
・人口減少による地域市場の縮小
・原材料価格の高騰による収益圧迫`
        },
        {
          title: '4. 経営課題',
          content: `当社が直面する主要な経営課題は以下の通りです：

1. 販路拡大の必要性
現在の売上は既存顧客に依存しており、新規顧客開拓が急務となっています。

2. 業務効率化の推進
手作業による業務処理が多く、生産性向上の余地が大きいです。

3. 情報発信力の強化
SNSやウェブサイトを活用した情報発信が不十分で、潜在顧客へのアプローチが限定的です。`
        },
        {
          title: '5. 今後の経営戦略',
          content: `上記の課題を解決し、持続的な成長を実現するため、以下の戦略を実行します：

【短期戦略（1年以内）】
・補助金を活用した販路開拓事業の実施
・デジタルツールの導入による業務効率化
・SNSを活用した情報発信の開始

【中期戦略（3年以内）】
・オンライン販売チャネルの確立
・新商品・サービスの開発
・地域連携による共同事業の推進

【長期戦略（5年以内）】
・事業承継を見据えた組織体制の整備
・地域のリーディングカンパニーとしての地位確立
・持続可能な経営モデルの構築`
        }
      ]
    };
  };

  // 小規模事業者持続化補助金 - 販路開拓計画書生成
  const generateJizokukaSalesPlan = (formData: any) => {
    const targetCustomer = formData?.targetCustomer || '地域の個人顧客';
    const salesChannelPlan = formData?.salesChannelPlan || 'SNSマーケティングとECサイト構築';
    
    return {
      sections: [
        {
          title: '1. 販路開拓の目的',
          content: `本事業では、${targetCustomer}をメインターゲットとして、${salesChannelPlan}を通じた新規顧客獲得を目指します。これにより、売上の安定化と事業の持続的発展を図ります。`
        },
        {
          title: '2. ターゲット市場分析',
          content: `【ターゲット顧客層】
・主要ターゲット：${targetCustomer}
・年齢層：30〜50代を中心とした購買力のある層
・地域：事業所から半径10km圏内
・ニーズ：品質重視、地元企業への愛着、利便性

【市場規模と成長性】
・推定市場規模：年間約5,000万円
・成長率：年率3〜5%（地域のデジタル化進展により）
・当社シェア目標：現在の5%から10%へ拡大`
        },
        {
          title: '3. 具体的な販路開拓施策',
          content: `【施策1：デジタルマーケティングの強化】
・自社ウェブサイトのリニューアル（スマートフォン対応）
・SNS（Instagram、Facebook）での定期的な情報発信
・Google My Businessを活用した地域検索対策
・実施期間：補助事業採択後3ヶ月以内
・投資額：50万円

【施策2：ECサイトの構築】
・使いやすいECプラットフォームの導入
・決済システムの多様化（クレジットカード、電子マネー対応）
・配送体制の整備
・実施期間：補助事業採択後6ヶ月以内
・投資額：80万円

【施策3：地域連携による共同販促】
・地域の他事業者との共同イベント開催
・相互送客システムの構築
・地域ポイントカードへの参加
・実施期間：補助事業採択後4ヶ月以内
・投資額：20万円`
        },
        {
          title: '4. 実施スケジュール',
          content: `【第1四半期】
・ウェブサイトリニューアルの企画・設計
・SNSアカウントの開設と運用開始
・ECサイト構築業者の選定

【第2四半期】
・ウェブサイトの公開
・ECサイトの構築・テスト運用
・地域連携パートナーとの協議

【第3四半期】
・ECサイトの本格運用開始
・共同販促イベントの実施
・中間評価と改善点の洗い出し

【第4四半期】
・年間成果の評価
・次年度計画の策定
・継続的な改善活動`
        },
        {
          title: '5. 期待される成果',
          content: `【定量的成果】
・新規顧客獲得数：年間100名（前年比200%増）
・売上高：前年比30%増（1,500万円→1,950万円）
・ECサイト売上比率：全体の15%
・SNSフォロワー数：1,000名

【定性的成果】
・ブランド認知度の向上
・顧客満足度の向上（リピート率20%向上）
・従業員のデジタルスキル向上
・地域における企業イメージの向上`
        }
      ]
    };
  };

  // 小規模事業者持続化補助金 - 事業効果説明書生成
  const generateJizokukaExpectedEffect = (formData: any) => {
    const expectedSalesIncrease = formData?.expectedSalesIncrease || '30';
    const totalBudget = formData?.totalBudget || '2000000';
    
    return {
      sections: [
        {
          title: '1. 補助事業の投資対効果',
          content: `本補助事業への総投資額${parseInt(totalBudget).toLocaleString()}円に対し、売上高${expectedSalesIncrease}%増加を見込んでおります。投資回収期間は約2年を想定しており、その後は継続的な収益向上が期待できます。`
        },
        {
          title: '2. 売上・利益への影響',
          content: `【売上高への影響】
・現在の年間売上高：1,500万円
・補助事業実施後の売上高：1,950万円（30%増）
・増加額：450万円

【利益への影響】
・売上総利益率：40%
・売上増加による利益増加：180万円
・経費増加分：50万円
・純利益増加：130万円

【キャッシュフローへの影響】
・初年度：投資により一時的にマイナス
・2年目以降：年間130万円のプラス
・5年間累計：500万円以上のプラス効果`
        },
        {
          title: '3. 地域経済への波及効果',
          content: `【雇用創出効果】
・パートタイム従業員1名の新規雇用
・既存従業員の労働時間適正化による雇用の質向上
・地域の雇用機会創出への貢献

【地域内取引の活性化】
・地元業者への発注増加（年間50万円増）
・地域内での資金循環促進
・関連事業者への波及効果

【地域ブランド向上への貢献】
・地域特産品の販売促進
・観光客への情報発信強化
・地域イメージの向上`
        },
        {
          title: '4. 社会的効果',
          content: `【デジタルデバイド解消への貢献】
・高齢者向けのECサイト利用支援
・デジタル活用による買い物弱者支援
・地域のIT活用促進

【環境負荷軽減】
・ペーパーレス化による紙使用量削減（年間30%減）
・効率的な配送による CO2排出量削減
・エコ包装の導入

【働き方改革への寄与】
・業務効率化による残業時間削減（月平均10時間減）
・テレワーク対応による柔軟な働き方実現
・従業員満足度の向上`
        },
        {
          title: '5. 持続可能性の確保',
          content: `【事業の継続性】
・補助事業で構築したシステムの自立運営
・継続的な改善サイクルの確立
・次世代への事業承継準備

【財務的持続性】
・売上増加による財務基盤強化
・投資回収後の再投資サイクル確立
・リスク分散による経営安定化

【人材育成効果】
・デジタルスキルを持つ人材の育成
・若手従業員のモチベーション向上
・組織全体の生産性向上`
        }
      ]
    };
  };

  // IT導入補助金 - IT導入計画書生成
  const generateITImplementationPlan = (formData: any) => {
    const itToolName = formData?.itToolName || 'クラウド型業務管理システム';
    const itToolPurpose = formData?.itToolPurpose || '業務効率化と顧客管理の強化';
    
    return {
      sections: [
        {
          title: '1. IT導入の背景と目的',
          content: `当社では、${itToolPurpose}を目的として、${itToolName}の導入を計画しています。現在、業務の多くが手作業やExcelでの管理に依存しており、業務効率の低下や人的ミスのリスクが課題となっています。本IT導入により、これらの課題を解決し、生産性の大幅な向上を実現します。`
        },
        {
          title: '2. 導入するITツールの詳細',
          content: `【ツール名】${itToolName}

【主要機能】
・顧客情報の一元管理
・見積書・請求書の自動作成
・在庫管理のリアルタイム化
・売上分析・レポート機能
・モバイル対応による外出先での業務対応

【選定理由】
・中小企業向けに最適化された機能
・導入実績が豊富で信頼性が高い
・サポート体制が充実
・費用対効果が高い
・既存システムとの連携が容易`
        },
        {
          title: '3. 導入計画とスケジュール',
          content: `【フェーズ1：準備期間（1〜2ヶ月目）】
・現状業務フローの詳細分析
・要件定義の確定
・データ移行計画の策定
・社内プロジェクトチームの編成

【フェーズ2：導入期間（3〜4ヶ月目）】
・システムの初期設定
・マスターデータの登録
・既存データの移行作業
・カスタマイズ設定

【フェーズ3：テスト運用（5ヶ月目）】
・並行運用によるテスト
・不具合の洗い出しと修正
・運用マニュアルの作成
・従業員向け研修の実施

【フェーズ4：本格運用（6ヶ月目〜）】
・全面的な本番運用開始
・定期的な効果測定
・継続的な改善活動
・追加機能の検討`
        },
        {
          title: '4. 期待される効果',
          content: `【業務効率化】
・事務作業時間：50%削減（月160時間→80時間）
・書類作成時間：70%削減
・データ入力ミス：90%削減

【売上・利益向上】
・顧客対応時間の増加による売上10%向上
・業務効率化による人件費削減：年間100万円
・ペーパーレス化による経費削減：年間20万円

【顧客満足度向上】
・レスポンスタイムの短縮（平均2日→即日）
・正確な在庫情報による欠品率低下
・きめ細やかな顧客フォローの実現`
        },
        {
          title: '5. 投資計画と費用対効果',
          content: `【初期投資】
・ソフトウェアライセンス：100万円
・導入支援・カスタマイズ：50万円
・ハードウェア（タブレット等）：30万円
・研修費用：20万円
合計：200万円

【ランニングコスト】
・月額利用料：5万円
・年間保守費用：60万円

【ROI（投資収益率）】
・初年度：効率化による削減効果120万円
・2年目以降：年間180万円の効果
・投資回収期間：約1.5年
・5年間累計効果：800万円`
        }
      ]
    };
  };

  // IT導入補助金 - 生産性向上計画書生成
  const generateProductivityPlan = (formData: any) => {
    const employeeCount = formData?.employeeCount || '20';
    const annualRevenue = formData?.annualRevenue || '10000';
    
    return {
      sections: [
        {
          title: '1. 現状の生産性分析',
          content: `【現在の生産性指標】
・従業員一人当たり売上高：${(parseInt(annualRevenue) / parseInt(employeeCount)).toFixed(0)}万円
・労働生産性：業界平均を下回る水準
・付加価値額：売上高の35%

【生産性を阻害する要因】
・手作業による非効率な業務プロセス
・情報共有の不足による重複作業
・データ分析不足による意思決定の遅れ
・顧客情報の分散による営業効率の低下`
        },
        {
          title: '2. IT導入による生産性向上施策',
          content: `【業務自動化による効率化】
・定型業務の自動化率：現在10%→導入後60%
・RPA活用による単純作業の削減
・AIチャットボットによる問い合わせ対応自動化

【情報共有の最適化】
・クラウド型グループウェアの導入
・リアルタイムでの情報共有体制構築
・ナレッジマネジメントシステムの活用

【データ駆動型経営の実現】
・BIツールによる経営ダッシュボード構築
・売上予測・需要予測の精度向上
・顧客分析による営業戦略の最適化`
        },
        {
          title: '3. 生産性向上の数値目標',
          content: `【短期目標（1年以内）】
・労働生産性：15%向上
・従業員一人当たり売上高：10%増加
・残業時間：30%削減

【中期目標（3年以内）】
・労働生産性：30%向上
・従業員一人当たり売上高：25%増加
・付加価値率：35%→45%へ向上

【長期目標（5年以内）】
・労働生産性：50%向上
・業界トップクラスの生産性実現
・働き方改革の完全実現`
        },
        {
          title: '4. 実施体制と推進計画',
          content: `【推進体制】
・経営層：プロジェクトオーナー
・IT推進責任者：プロジェクトマネージャー
・各部門責任者：推進メンバー
・外部専門家：アドバイザー

【推進計画】
第1段階：基盤整備（0〜6ヶ月）
・IT環境の整備
・従業員のITリテラシー向上
・業務プロセスの標準化

第2段階：本格展開（7〜12ヶ月）
・主要業務のデジタル化
・データ活用体制の構築
・継続的改善サイクルの確立

第3段階：高度化（13ヶ月〜）
・AI・IoT等の先端技術活用
・ビジネスモデルの変革
・新たな価値創造`
        },
        {
          title: '5. 生産性向上による経営改善効果',
          content: `【財務面の改善】
・売上高営業利益率：5%→8%へ改善
・ROE（自己資本利益率）：10%→15%へ向上
・キャッシュフロー：年間20%改善

【組織面の改善】
・従業員満足度：20ポイント向上
・離職率：50%削減
・採用競争力の向上

【競争力の強化】
・新サービス開発期間：50%短縮
・顧客満足度：15ポイント向上
・市場シェア：5%拡大`
        }
      ]
    };
  };

  // IT導入補助金 - 賃金引上げ計画書生成
  const generateWageIncreasePlan = (formData: any) => {
    return {
      sections: [
        {
          title: '1. 賃金引上げの基本方針',
          content: `当社は、IT導入による生産性向上の成果を従業員に適切に還元し、持続的な企業成長と従業員の生活向上の両立を目指します。生産性向上により創出された付加価値の一定割合を、計画的な賃金引上げに充当することで、優秀な人材の確保と従業員のモチベーション向上を実現します。`
        },
        {
          title: '2. 賃金引上げ計画',
          content: `【第1年度】
・平均賃金引上げ率：3.0%
・最低賃金：時給1,100円（地域最低賃金+10%）
・対象者：全従業員
・実施時期：2025年4月

【第2年度】
・平均賃金引上げ率：3.5%
・最低賃金：時給1,150円
・業績連動賞与の導入
・実施時期：2026年4月

【第3年度】
・平均賃金引上げ率：4.0%
・最低賃金：時給1,200円
・スキル手当の新設
・実施時期：2027年4月`
        },
        {
          title: '3. 原資の確保',
          content: `【生産性向上による原資創出】
・IT導入による人件費削減効果：年間200万円
・売上増加による粗利益増加：年間300万円
・業務効率化による残業代削減：年間100万円
合計：年間600万円

【賃金引上げ必要額】
・第1年度：450万円
・第2年度：525万円
・第3年度：600万円

【収支計画】
各年度において、生産性向上効果が賃金引上げ原資を上回ることを確認済み`
        },
        {
          title: '4. 人材育成との連動',
          content: `【スキルアップ支援】
・IT関連資格取得支援制度の創設
・外部研修への参加支援（年間予算100万円）
・社内勉強会の定期開催

【キャリアパス明確化】
・スキルレベルに応じた等級制度導入
・昇進・昇格基準の明確化
・個人別育成計画の策定

【評価制度の改善】
・生産性向上への貢献度評価
・多面評価制度の導入
・フィードバック面談の充実`
        },
        {
          title: '5. 期待される効果と持続可能性',
          content: `【従業員への効果】
・生活水準の向上
・モチベーション向上による生産性のさらなる改善
・スキルアップによるキャリア形成

【企業への効果】
・優秀な人材の確保・定着
・企業イメージの向上
・持続的な競争力強化

【地域社会への効果】
・地域経済の活性化
・雇用の質向上
・消費拡大への貢献

【持続可能性の確保】
・継続的な生産性向上施策の実施
・定期的な賃金水準の見直し
・労使協調による改善活動`
        }
      ]
    };
  };

  // ものづくり補助金 - 技術開発計画書生成
  const generateMonozukuriTechnicalPlan = (formData: any) => {
    const projectTitle = formData?.projectTitle || '革新的製造プロセスの開発';
    const technicalContent = formData?.technicalContent || '最新技術を活用した生産性向上';
    
    return {
      sections: [
        {
          title: '1. 技術開発の概要',
          content: `本事業では「${projectTitle}」をテーマに、${technicalContent}を実現します。これにより、従来の製造方法では不可能だった高品質・低コスト・短納期の同時実現を目指します。`
        },
        {
          title: '2. 技術的課題と解決方法',
          content: `【現状の技術的課題】
・加工精度の限界（現状±0.1mm→目標±0.01mm）
・生産効率の頭打ち（稼働率65%）
・品質のばらつき（不良率3%）
・熟練技術者への依存

【革新的な解決方法】
・AI画像認識による自動検査システム導入
・IoTセンサーによるリアルタイム品質管理
・ロボットによる自動化ライン構築
・デジタルツイン技術による最適化`
        },
        {
          title: '3. 技術開発の実施計画',
          content: `【開発フェーズ1：基礎研究（1〜3ヶ月）】
・技術要素の詳細検討
・プロトタイプ設計
・シミュレーション実施

【開発フェーズ2：試作開発（4〜6ヶ月）】
・試作機の製作
・性能評価試験
・改良設計

【開発フェーズ3：実証試験（7〜9ヶ月）】
・量産試作
・耐久性試験
・品質安定性確認

【開発フェーズ4：量産準備（10〜12ヶ月）】
・量産設備の導入
・作業標準書作成
・品質保証体制構築`
        },
        {
          title: '4. 技術的優位性',
          content: `【独自技術の特徴】
・業界初の〇〇技術採用
・特許出願予定（3件）
・競合他社比30%の生産性向上

【技術的障壁】
・開発に3年以上必要
・設備投資額が参入障壁
・ノウハウの蓄積が必須

【持続的競争優位】
・継続的な改良開発
・知的財産戦略
・産学連携による技術深化`
        },
        {
          title: '5. 事業化計画',
          content: `【製品化スケジュール】
・1年目：量産体制確立
・2年目：本格的市場投入
・3年目：シェア10%獲得

【想定顧客】
・大手製造業（自動車、電機）
・中堅部品メーカー
・海外市場（アジア、欧州）

【収益計画】
・1年目：5,000万円
・2年目：1.5億円
・3年目：3億円
・投資回収期間：2.5年`
        }
      ]
    };
  };

  // ものづくり補助金 - 市場戦略書生成
  const generateMonozukuriMarketStrategy = (formData: any) => {
    return {
      sections: [
        {
          title: '1. 市場環境分析',
          content: `【市場規模と成長性】
・国内市場規模：500億円（年率5%成長）
・海外市場規模：2,000億円（年率8%成長）
・当社ターゲット市場：50億円

【市場トレンド】
・環境規制強化による省エネ需要増
・デジタル化による高精度化ニーズ
・サプライチェーン最適化の要求
・カーボンニュートラルへの対応`
        },
        {
          title: '2. 競合分析',
          content: `【主要競合他社】
・A社：市場シェア30%、価格競争力
・B社：市場シェア25%、技術力
・C社：市場シェア20%、サービス力

【当社の差別化要因】
・独自技術による高品質
・カスタマイズ対応力
・短納期対応
・アフターサービス充実`
        },
        {
          title: '3. マーケティング戦略',
          content: `【製品戦略】
・高付加価値製品へシフト
・環境対応製品ラインナップ拡充
・モジュール化による柔軟性向上

【価格戦略】
・価値提案型価格設定
・初期導入コスト低減プラン
・トータルコスト削減提案

【販売戦略】
・直販体制強化
・パートナー企業との協業
・オンライン商談活用`
        },
        {
          title: '4. 販売計画',
          content: `【販売目標】
・1年目：100台（5,000万円）
・2年目：300台（1.5億円）
・3年目：600台（3億円）

【重点顧客開拓】
・既存顧客深耕：売上の60%
・新規顧客開拓：売上の30%
・海外展開：売上の10%

【営業体制】
・営業人員：5名→8名へ増強
・技術営業の育成
・デジタルマーケティング強化`
        },
        {
          title: '5. 顧客価値提案',
          content: `【提供価値】
・生産性30%向上
・不良率80%削減
・エネルギー消費25%削減
・投資回収2年以内

【サポート体制】
・24時間サポート
・予防保全サービス
・アップグレード対応
・トレーニング提供`
        }
      ]
    };
  };

  // ものづくり補助金 - 設備投資計画書生成
  const generateMonozukuriInvestmentPlan = (formData: any) => {
    const totalBudget = formData?.totalBudget || '30000000';
    
    return {
      sections: [
        {
          title: '1. 設備投資の概要',
          content: `本事業では、総額${parseInt(totalBudget).toLocaleString()}円の設備投資を行い、革新的な生産体制を構築します。最新鋭の生産設備と検査装置を導入することで、品質と生産性の飛躍的向上を実現します。`
        },
        {
          title: '2. 導入設備の詳細',
          content: `【主要生産設備】
・5軸マシニングセンター：1,500万円
 - 加工精度：±0.005mm
 - 加工速度：従来比2倍
 - 自動工具交換機能

・レーザー加工機：800万円
 - 切断精度：±0.01mm
 - 材料対応：金属、樹脂、複合材
 - CAD/CAM連携

【検査・測定装置】
・3次元測定機：500万円
 - 測定精度：0.001mm
 - 自動測定プログラム
 - データ解析機能

【付帯設備】
・搬送ロボット：200万円
・環境制御装置：100万円
・安全装置一式：100万円`
        },
        {
          title: '3. 投資効果分析',
          content: `【生産能力向上】
・生産能力：200%向上
・稼働率：65%→85%
・段取り時間：70%削減

【品質向上】
・不良率：3%→0.5%
・検査時間：50%削減
・トレーサビリティ確立

【コスト削減】
・製造原価：25%削減
・人件費：30%削減
・エネルギー：20%削減`
        },
        {
          title: '4. 資金計画',
          content: `【資金調達】
・自己資金：1,000万円
・金融機関借入：1,000万円
・補助金：1,000万円

【投資回収計画】
・年間増収効果：1,500万円
・年間コスト削減：500万円
・投資回収期間：3年

【キャッシュフロー】
・1年目：△1,000万円
・2年目：+500万円
・3年目：+1,000万円`
        },
        {
          title: '5. リスク管理',
          content: `【技術リスク】
・導入研修の徹底
・メーカーサポート契約
・段階的導入計画

【市場リスク】
・複数市場への展開
・製品多様化
・長期契約確保

【財務リスク】
・適正在庫管理
・与信管理強化
・保険活用`
        }
      ]
    };
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* AI申請書作成プロモーション */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                かんたん10問でAI申請書作成
              </h3>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.95, lineHeight: '1.6' }}>
                質問に答えるだけで、専門知識不要！<br/>
                AIが最適な申請書を自動作成します。作成時間を<strong>90%削減</strong>できます。
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/minimal-form'}
              style={{
                padding: '12px 28px',
                backgroundColor: 'white',
                color: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              今すぐ申請書を作成 →
            </button>
          </div>
        </div>

        {/* ページ説明 */}
        <div style={{ 
          backgroundColor: '#e0f2fe', 
          padding: '16px 20px', 
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #0284c7'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#0c4a6e' }}>
            📌 <strong>このページでは補助金提出までの工程・スケジュールの確認と補助金資料の作成ができるよ</strong>
          </p>
        </div>

        {/* 完了ヒーロー */}
        <div className="completion-hero" style={{ marginBottom: '40px' }}>
          <div className="completion-icon">
            🎉
          </div>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            申請書類作成完了！
          </h1>
          <p style={{ 
            fontSize: '20px',
            opacity: 0.9,
            marginBottom: '24px'
          }}>
            {subsidyNames[selectedSubsidy as keyof typeof subsidyNames]} の申請書類をすべて準備いたしました
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '16px 32px',
            borderRadius: '100px',
            fontSize: '18px'
          }}>
            💡 あとは書類をダウンロードして提出するだけです
          </div>
        </div>

        {/* AI生成書類プレビューセクション */}
        <div className="card-modern" style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileSignature size={24} />
              AI生成済み申請書類
            </h2>
            <span style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              color: '#065f46',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} />
              あなたの情報で自動作成済み
            </span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
            border: '1px solid rgba(79, 172, 254, 0.2)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {generateDocumentPreviews(selectedSubsidy, formData).map((doc, index) => (
                <div key={index} style={{
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--border-radius)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onClick={() => {
                  setSelectedDocument(doc.type);
                  
                  // 保存済みの編集内容があるか確認
                  const storageKey = `editedDocument_${selectedSubsidy}_${doc.type}`;
                  const savedContent = localStorage.getItem(storageKey);
                  
                  if (savedContent) {
                    // 保存済みの内容がある場合はそれを使用
                    const parsedContent = JSON.parse(savedContent);
                    setGeneratedContent(parsedContent);
                    setEditedContent(parsedContent);
                  } else {
                    // 保存済みの内容がない場合は元のコンテンツを使用
                    setGeneratedContent(doc.content);
                    setEditedContent(doc.content);
                  }
                  
                  setShowDocumentPreview(true);
                  setIsEditMode(false);
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {doc.title}
                    </h3>
                    <Eye size={20} style={{ color: 'var(--primary-color)' }} />
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                    lineHeight: '1.6'
                  }}>
                    {doc.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    <CheckCircle size={14} style={{ color: 'var(--success-color)' }} />
                    AI分析完了 • クリックして内容確認
                    {(() => {
                      const storageKey = `editedDocument_${selectedSubsidy}_${doc.type}`;
                      const savedContent = localStorage.getItem(storageKey);
                      return savedContent ? (
                        <span style={{
                          padding: '2px 8px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          編集済み
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginTop: '16px'
          }}>
            💡 各書類をクリックすると、AIが生成した内容をプレビューできます
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="card-modern">
          {/* 申請情報サマリー */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={20} />
              申請情報サマリー
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>申請者情報</h3>
                  <button
                    onClick={() => {
                      if (isEditingApplicant) {
                        // 保存処理
                        setApplicantData(editedApplicantData);
                        localStorage.setItem('applicantProfile', JSON.stringify(editedApplicantData));
                      }
                      setIsEditingApplicant(!isEditingApplicant);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      background: isEditingApplicant ? '#10b981' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isEditingApplicant ? '💾 保存' : '✏️ 編集'}
                  </button>
                </div>
                {isEditingApplicant ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <input
                      type="text"
                      value={editedApplicantData?.companyName || ''}
                      onChange={(e) => setEditedApplicantData({
                        ...editedApplicantData,
                        companyName: e.target.value
                      })}
                      placeholder="会社名"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="text"
                      value={editedApplicantData?.address || ''}
                      onChange={(e) => setEditedApplicantData({
                        ...editedApplicantData,
                        address: e.target.value
                      })}
                      placeholder="住所"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="text"
                      value={editedApplicantData?.businessDescription || ''}
                      onChange={(e) => setEditedApplicantData({
                        ...editedApplicantData,
                        businessDescription: e.target.value
                      })}
                      placeholder="事業内容"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                      <strong>会社名:</strong> {applicantData?.companyName || formData?.companyName || formData?.company_name || '未設定'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                      <strong>住所:</strong> {applicantData?.address || '未設定'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <strong>事業内容:</strong> {applicantData?.businessDescription || formData?.businessDescription || formData?.industry || '未設定'}
                    </p>
                  </>
                )}
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>申請内容</h3>
                {isEditingApplicant ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <input
                      type="text"
                      value={editedApplicantData?.representativeName || ''}
                      onChange={(e) => setEditedApplicantData({
                        ...editedApplicantData,
                        representativeName: e.target.value
                      })}
                      placeholder="代表者名"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="text"
                      value={editedApplicantData?.contactPhone || ''}
                      onChange={(e) => setEditedApplicantData({
                        ...editedApplicantData,
                        contactPhone: e.target.value
                      })}
                      placeholder="電話番号"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="email"
                      value={editedApplicantData?.contactEmail || ''}
                      onChange={(e) => setEditedApplicantData({
                        ...editedApplicantData,
                        contactEmail: e.target.value
                      })}
                      placeholder="メールアドレス"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                      <strong>代表者:</strong> {applicantData?.representativeName || '未設定'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                      <strong>電話番号:</strong> {applicantData?.contactPhone || '未設定'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                      <strong>メール:</strong> {applicantData?.contactEmail || '未設定'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                      <strong>従業員数:</strong> {applicantData?.employeeCount || formData?.employeeCount || formData?.employee_count || 'N/A'}名
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <strong>年間売上:</strong> {applicantData?.annualRevenue || formData?.annualRevenue || formData?.annual_revenue || 'N/A'}万円
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ダウンロードセクション */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Download size={20} />
                申請書類ダウンロード
              </h2>
              <button
                onClick={handleGenerateDocuments}
                disabled={isGenerating}
                className="btn-gradient"
                style={{
                  opacity: isGenerating ? 0.7 : 1,
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {isGenerating ? '生成中...' : '書類を最新状態で再生成'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {downloadLinks.map((doc) => (
                <div
                  key={doc.id}
                  className="download-card"
                >
                  <div className="download-icon">{getFileIcon(doc.fileType)}</div>
                  <div className="download-content">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>{doc.name}</h3>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        borderRadius: '100px',
                        fontWeight: '600',
                        background: getCategoryStyle(doc.category).background,
                        color: getCategoryStyle(doc.category).color,
                        border: getCategoryStyle(doc.category).border
                      }}>
                        {doc.category === 'filled' ? '入力済み' : 
                         doc.category === 'template' ? 'テンプレート' : '参考資料'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>{doc.description}</p>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)'
                    }}>ファイルサイズ: {doc.size}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="download-button"
                  >
                    <Download size={16} />
                    ダウンロード
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 次のステップ */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '32px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Calendar size={20} />
              次のステップ
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              {[
                { num: '1', title: '書類の最終確認', desc: 'ダウンロードした書類の内容に誤りがないか確認してください' },
                { num: '2', title: '添付書類の準備', desc: '決算書、登記簿謄本などの添付書類をご準備ください' },
                { num: '3', title: '電子申請または郵送', desc: '各補助金の公式サイトから電子申請、または郵送で提出してください' }
              ].map((step) => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    minWidth: '32px',
                    height: '32px',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>{step.title}</h3>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6'
                    }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 追加で必要な書類 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%)',
            border: '1px solid rgba(250, 112, 154, 0.2)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '32px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📄 追加で必要な書類と取得場所
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                background: 'rgba(250, 112, 154, 0.1)',
                padding: '12px',
                borderRadius: 'var(--border-radius)',
                borderLeft: '4px solid var(--warning-color)'
              }}>
                ⚠️ 以下の書類は別途ご用意いただく必要があります。申請時に必須となりますので、事前にご準備ください。
              </p>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {getAdditionalDocuments(selectedSubsidy).map((doc, index) => (
                  <div key={index} style={{
                    background: 'var(--bg-primary)',
                    padding: '20px',
                    borderRadius: 'var(--border-radius)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      fontSize: '32px',
                      minWidth: '48px',
                      textAlign: 'center'
                    }}>
                      {doc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                      }}>
                        {doc.name}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                      }}>
                        {doc.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: 'var(--primary-color)'
                      }}>
                        📍 取得場所: <strong>{doc.location}</strong>
                      </div>
                      {doc.note && (
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          ※ {doc.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 提出方法 */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🚀 申請書類の提出方法
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid rgba(79, 172, 254, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💻 オンライン申請（推奨）
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px'
                }}>
                  {getOnlineSubmissionInfo(selectedSubsidy).description}
                </p>
                <a 
                  href={getOnlineSubmissionInfo(selectedSubsidy).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--primary-color)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  <ExternalLink size={16} />
                  {getOnlineSubmissionInfo(selectedSubsidy).buttonText}
                </a>
              </div>
              
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--bg-tertiary)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📨 郵送申請
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}>
                  {getPostalSubmissionInfo(selectedSubsidy)}
                </p>
              </div>
            </div>
          </div>

          {/* 有用なリンク */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ExternalLink size={20} />
              参考リンク
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>公式サイト</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <a href="https://gbiz-id.go.jp/" target="_blank" rel="noopener noreferrer"
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    <ExternalLink size={14} />
                    GBizID（電子申請用）
                  </a>
                  <a href="https://www.nta.go.jp/taxes/nozei/nozei-shomei/01.htm" target="_blank" rel="noopener noreferrer"
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    <ExternalLink size={14} />
                    国税庁 - 納税証明書の取得方法
                  </a>
                  <a href="https://www.touki-kyoutaku-online.moj.go.jp/" target="_blank" rel="noopener noreferrer"
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    <ExternalLink size={14} />
                    登記ねっと（登記簿謄本オンライン申請）
                  </a>
                </div>
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>サポート</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="mailto:support@subsidy-assistant.com" 
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    📧 サポートセンター
                  </a>
                  <button 
                    onClick={() => window.print()}
                    style={{
                      color: 'var(--primary-color)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all var(--transition-fast)',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    <Printer size={14} />
                    このページを印刷
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--bg-tertiary)'
          }}>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              IT補助金アシスタント - あなたの補助金申請を最後までサポートします
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  color: 'var(--primary-color)',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                新しい申請を開始
              </button>
              <span style={{ color: 'var(--bg-tertiary)' }}>|</span>
              <button
                style={{
                  color: 'var(--primary-color)',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                onClick={() => window.history.back()}
              >
                前の画面に戻る
              </button>
            </div>
          </div>
        </div>

        {/* AI生成書類プレビューモーダル */}
        {showDocumentPreview && generatedContent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDocumentPreview(false);
            }
          }}>
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--border-radius-lg)',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--bg-tertiary)'
            }}>
              {/* ヘッダー */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid var(--bg-tertiary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    marginBottom: '4px'
                  }}>
                    AI生成書類プレビュー
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    {selectedDocument === 'business_plan' && '経営計画書'}
                    {selectedDocument === 'sales_plan' && '販路開拓計画書'}
                    {selectedDocument === 'expected_effect' && '事業効果説明書'}
                    {selectedDocument === 'it_implementation' && 'IT導入計画書'}
                    {selectedDocument === 'productivity_plan' && '生産性向上計画書'}
                    {selectedDocument === 'wage_increase' && '賃金引上げ計画書'}
                    {selectedDocument === 'technical_plan' && '技術開発計画書'}
                    {selectedDocument === 'market_strategy' && '市場戦略書'}
                    {selectedDocument === 'investment_plan' && '設備投資計画書'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      // ダウンロード用の内容を準備
                      const contentToDownload = isEditMode ? editedContent : generatedContent;
                      const docType = {
                        'business_plan': '経営計画書',
                        'sales_plan': '販路開拓計画書',
                        'expected_effect': '事業効果説明書',
                        'it_implementation': 'IT導入計画書',
                        'productivity_plan': '生産性向上計画書',
                        'wage_increase': '賃金引上げ計画書',
                        'technical_plan': '技術開発計画書',
                        'market_strategy': '市場戦略書',
                        'investment_plan': '設備投資計画書'
                      }[selectedDocument] || 'AI生成書類';
                      
                      // ファイル内容を作成
                      let fileContent = `${docType}\n${'='.repeat(50)}\n\n`;
                      
                      contentToDownload.sections.forEach((section: any, index: number) => {
                        fileContent += `${index + 1}. ${section.title}\n${'-'.repeat(30)}\n`;
                        fileContent += `${section.content}\n\n`;
                      });
                      
                      fileContent += `\n${'='.repeat(50)}\n生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
                      
                      // ダウンロード実行
                      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${selectedSubsidy}_${selectedDocument}_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Download size={14} />
                    ダウンロード
                  </button>
                  <button
                    onClick={() => {
                      if (isEditMode) {
                        // 編集モードを終了して保存
                        setGeneratedContent(editedContent);
                        setIsEditMode(false);
                        
                        // 編集した内容をローカルストレージに保存
                        const storageKey = `editedDocument_${selectedSubsidy}_${selectedDocument}`;
                        localStorage.setItem(storageKey, JSON.stringify(editedContent));
                        
                        // 保存完了のフィードバック
                        alert('編集内容を保存しました。次回アクセス時も編集内容が維持されます。');
                      } else {
                        // 編集モードに入る
                        setIsEditMode(true);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: isEditMode ? '#10b981' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isEditMode ? '✓ 保存' : '✏️ 編集'}
                  </button>
                  <button
                  onClick={() => {
                    setShowDocumentPreview(false);
                    setIsEditMode(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  ×
                </button>
                </div>
              </div>

              {/* コンテンツ */}
              <div style={{
                padding: '24px',
                overflow: 'auto',
                maxHeight: 'calc(90vh - 120px)'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
                  border: '1px solid rgba(79, 172, 254, 0.2)',
                  borderRadius: 'var(--border-radius)',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <FileSignature size={16} style={{ color: 'var(--primary-color)' }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--primary-color)'
                    }}>
                      AIが貴社の情報を基に自動生成した内容です
                    </span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}>
                    この内容は参考として活用し、必要に応じて修正・加筆してください。
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '32px',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid #e5e7eb'
                }}>
                  {generatedContent.sections.map((section: any, index: number) => (
                    <div key={index} style={{
                      marginBottom: index < generatedContent.sections.length - 1 ? '32px' : '0'
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '16px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #e5e7eb'
                      }}>
                        {section.title}
                      </h3>
                      {isEditMode ? (
                        <textarea
                          value={editedContent.sections[index].content}
                          onChange={(e) => {
                            const newContent = { ...editedContent };
                            newContent.sections[index].content = e.target.value;
                            setEditedContent(newContent);
                          }}
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '12px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            lineHeight: '1.8',
                            color: '#374151',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                          }}
                        />
                      ) : (
                        <div style={{
                          fontSize: '14px',
                          lineHeight: '1.8',
                          color: '#374151',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {section.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isEditMode && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    💡 編集モードです。各セクションの内容を自由に編集できます。編集が完了したら「保存」ボタンをクリックしてください。
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={() => {
                      // 編集した内容を含めて印刷
                      const contentToPrint = isEditMode ? editedContent : generatedContent;
                      // 一時的に編集モードを解除して印刷
                      if (isEditMode) {
                        setIsEditMode(false);
                        setTimeout(() => {
                          window.print();
                          setIsEditMode(true);
                        }, 100);
                      } else {
                        window.print();
                      }
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--bg-tertiary)',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                  >
                    <Printer size={16} />
                    印刷
                  </button>
                  <button
                    onClick={() => setShowDocumentPreview(false)}
                    className="btn-gradient"
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletionPage;