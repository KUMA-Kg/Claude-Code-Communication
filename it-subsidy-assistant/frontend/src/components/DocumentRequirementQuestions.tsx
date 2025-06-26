import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DocumentRequirementQuestionsProps {
  subsidyType: string;
  subsidyName: string;
  onComplete?: (requiredDocuments: any[]) => void;
}

interface RequirementAnswer {
  [key: string]: string | boolean;
}

const DocumentRequirementQuestions: React.FC<DocumentRequirementQuestionsProps> = ({ subsidyType, subsidyName, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<RequirementAnswer>({});

  // 補助金ごとの資料判定設問
  const questionsBySubsidy: Record<string, Array<{
    id: string;
    question: string;
    type: 'radio' | 'select';
    options: Array<{ value: string; label: string }>;
    required: boolean;
  }>> = {
    'it-donyu': [
      {
        id: 'application_type',
        question: '申請予定の枠を選択してください',
        type: 'select',
        options: [
          { value: 'normal', label: '通常枠（A・B類型） - 業務効率化・売上向上のITツール導入' },
          { value: 'security', label: 'セキュリティ対策推進枠 - サイバーセキュリティ対策強化' },
          { value: 'digital', label: 'デジタル化基盤導入枠 - 会計・受発注・決済・EC機能' },
          { value: 'complex', label: '複数社連携IT導入枠 - 複数社が連携したIT導入' }
        ],
        required: true
      },
      {
        id: 'business_duration',
        question: '創業からの年数を教えてください',
        type: 'radio',
        options: [
          { value: 'under_1year', label: '1年未満' },
          { value: '1_2years', label: '1年以上2年未満' },
          { value: '2_3years', label: '2年以上3年未満' },
          { value: 'over_3years', label: '3年以上' }
        ],
        required: true
      },
      {
        id: 'it_tool_type',
        question: '導入予定のITツールの種類を選択してください',
        type: 'select',
        options: [
          { value: 'software', label: 'ソフトウェア（クラウドサービス含む）' },
          { value: 'hardware', label: 'ハードウェア' },
          { value: 'both', label: 'ソフトウェア＋ハードウェア' },
          { value: 'consulting', label: 'ITコンサルティング' }
        ],
        required: true
      },
      {
        id: 'it_vendor_selected',
        question: 'IT導入支援事業者は決定していますか？',
        type: 'radio',
        options: [
          { value: 'yes', label: 'はい（決定済み）' },
          { value: 'considering', label: '検討中' },
          { value: 'no', label: 'いいえ（未定）' }
        ],
        required: true
      },
      {
        id: 'labor_productivity_plan',
        question: '労働生産性向上の具体的な計画はありますか？',
        type: 'radio',
        options: [
          { value: 'detailed', label: '詳細な計画あり' },
          { value: 'rough', label: '概要レベルの計画あり' },
          { value: 'none', label: 'これから策定' }
        ],
        required: true
      }
    ],
    'monozukuri': [
      {
        id: 'application_type',
        question: '申請予定の枠を選択してください',
        type: 'select',
        options: [
          { value: 'normal', label: '通常枠 - 一般的な設備投資や新商品開発' },
          { value: 'digital', label: 'デジタル枠 - DX推進、デジタル技術活用' },
          { value: 'green', label: 'グリーン枠 - 脱炭素、環境対応の取組' },
          { value: 'joint', label: '共同申請枠 - 複数事業者での共同事業' }
        ],
        required: true
      },
      {
        id: 'business_duration',
        question: '創業からの年数を教えてください',
        type: 'radio',
        options: [
          { value: 'under_3years', label: '3年未満' },
          { value: '3_5years', label: '3年以上5年未満' },
          { value: '5_10years', label: '5年以上10年未満' },
          { value: 'over_10years', label: '10年以上' }
        ],
        required: true
      },
      {
        id: 'innovation_type',
        question: '実施予定の革新的取組を選択してください',
        type: 'select',
        options: [
          { value: 'new_product', label: '新商品（試作品）開発' },
          { value: 'new_service', label: '新サービス開発' },
          { value: 'new_process', label: '生産プロセス改善' },
          { value: 'new_delivery', label: '新たな提供方式の導入' }
        ],
        required: true
      },
      {
        id: 'support_organization',
        question: '認定経営革新等支援機関との連携状況は？',
        type: 'radio',
        options: [
          { value: 'contracted', label: '既に契約済み' },
          { value: 'negotiating', label: '交渉中' },
          { value: 'searching', label: '探している' },
          { value: 'unknown', label: '支援機関について知らない' }
        ],
        required: true
      },
      {
        id: 'wage_increase_plan',
        question: '賃金引上げ計画はありますか？',
        type: 'radio',
        options: [
          { value: 'yes_documented', label: 'あり（文書化済み）' },
          { value: 'yes_planning', label: 'あり（計画中）' },
          { value: 'considering', label: '検討中' },
          { value: 'no', label: 'なし' }
        ],
        required: true
      },
      {
        id: 'funding_method',
        question: '事業資金の調達方法は？',
        type: 'select',
        options: [
          { value: 'self_funded', label: '自己資金のみ' },
          { value: 'bank_loan', label: '金融機関からの借入予定' },
          { value: 'combined', label: '自己資金＋借入' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      }
    ],
    'jizokuka': [
      {
        id: 'business_type',
        question: '事業形態を選択してください',
        type: 'radio',
        options: [
          { value: 'corporation', label: '法人' },
          { value: 'individual', label: '個人事業主' }
        ],
        required: true
      },
      {
        id: 'employee_count',
        question: '従業員数を選択してください（小規模事業者の定義確認）',
        type: 'radio',
        options: [
          { value: '0', label: '0人（事業主のみ）' },
          { value: '1_5', label: '1〜5人' },
          { value: '6_20', label: '6〜20人' },
          { value: 'over_20', label: '21人以上' }
        ],
        required: true
      },
      {
        id: 'business_duration',
        question: '創業からの年数を教えてください',
        type: 'radio',
        options: [
          { value: 'under_1year', label: '1年未満（創業枠対象）' },
          { value: '1_3years', label: '1年以上3年未満' },
          { value: '3_10years', label: '3年以上10年未満' },
          { value: 'over_10years', label: '10年以上' }
        ],
        required: true
      },
      {
        id: 'chamber_membership',
        question: '商工会・商工会議所の会員ですか？',
        type: 'radio',
        options: [
          { value: 'member', label: '会員である' },
          { value: 'applying', label: '入会申請中' },
          { value: 'non_member', label: '非会員' }
        ],
        required: true
      },
      {
        id: 'application_frame',
        question: '申請予定の枠を選択してください',
        type: 'select',
        options: [
          { value: 'general', label: '一般型 - 販路開拓・業務効率化の一般的な取組' },
          { value: 'startup', label: '創業枠 - 創業間もない事業者の販路開拓' },
          { value: 'succession', label: '事業承継枠 - 事業承継を控えた経営者の新たな取組' },
          { value: 'disaster', label: '災害枠 - 自然災害等の被災事業者の事業再建' }
        ],
        required: true
      },
      {
        id: 'business_plan_status',
        question: '事業支援計画書（様式6）の作成状況は？',
        type: 'radio',
        options: [
          { value: 'completed', label: '商工会・商工会議所で作成済み' },
          { value: 'in_progress', label: '商工会・商工会議所で作成中' },
          { value: 'scheduled', label: '商工会・商工会議所に相談予約済み' },
          { value: 'not_started', label: '未着手' }
        ],
        required: true
      },
      {
        id: 'sales_channel_type',
        question: '販路開拓の主な取組内容は？',
        type: 'select',
        options: [
          { value: 'website', label: 'ウェブサイト制作・改修' },
          { value: 'advertising', label: '広告・宣伝（チラシ・看板等）' },
          { value: 'exhibition', label: '展示会・商談会出展' },
          { value: 'new_product', label: '新商品・新サービス開発' },
          { value: 'equipment', label: '機械装置等の導入' },
          { value: 'renovation', label: '店舗改装・レイアウト変更' },
          { value: 'multiple', label: '複数の方法を組み合わせ' }
        ],
        required: true
      },
      {
        id: 'expense_amount',
        question: '総事業費（補助対象経費）の予定額は？',
        type: 'select',
        options: [
          { value: 'under_50', label: '50万円未満' },
          { value: '50_100', label: '50万円以上100万円未満' },
          { value: '100_150', label: '100万円以上150万円未満' },
          { value: 'over_150', label: '150万円以上' }
        ],
        required: true
      }
    ],
    'jigyou-saikouchiku': [
      {
        id: 'application_frame',
        question: '申請予定の事業類型を選択してください',
        type: 'radio',
        options: [
          { value: 'growth_normal', label: '成長枠（通常類型） - 新市場進出、事業転換等の一般的な再構築' },
          { value: 'growth_gx', label: '成長枠（グリーン成長類型） - 脱炭素・環境分野での事業再構築' },
          { value: 'covid_recovery', label: 'コロナ回復加速化枠 - コロナの影響からの回復を目指す事業者' },
          { value: 'graduation', label: '卒業促進上乗せ措置 - 中小企業から中堅企業への成長' }
        ],
        required: true
      },
      {
        id: 'value_added_plan',
        question: '付加価値額の増加計画について',
        type: 'radio',
        options: [
          { value: '3percent', label: '年率3%以上の増加を計画' },
          { value: '4percent', label: '年率4%以上の増加を計画' },
          { value: '5percent', label: '年率5%以上の増加を計画' },
          { value: 'uncertain', label: '達成可能か不確実' }
        ],
        required: true
      },
      {
        id: 'support_organization',
        question: '認定経営革新等支援機関との連携状況は？',
        type: 'radio',
        options: [
          { value: 'confirmed', label: '確認書を取得済み' },
          { value: 'in_progress', label: '事業計画を策定中' },
          { value: 'searching', label: '支援機関を探している' },
          { value: 'not_started', label: 'まだ何もしていない' }
        ],
        required: true
      },
      {
        id: 'financial_institution',
        question: '金融機関（メインバンク等）の確認状況は？',
        type: 'radio',
        options: [
          { value: 'confirmed', label: '確認書を取得済み' },
          { value: 'discussing', label: '相談・協議中' },
          { value: 'scheduled', label: '相談予定あり' },
          { value: 'not_yet', label: 'まだ相談していない' }
        ],
        required: true
      }
    ]
  };

  const questions = questionsBySubsidy[subsidyType] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // 必要書類判定ロジック
  const determineRequiredDocuments = (subsidyType: string, answers: RequirementAnswer) => {
    const baseDocuments = {
      'it-donyu': [
        // A. 申請基本書類
        { id: 'A1', name: '交付申請書', required: true, category: 'application' },
        { id: 'A2', name: '事業計画書', required: true, category: 'project' },
        { id: 'A3', name: '宣誓書', required: true, category: 'other' },
        { id: 'A4', name: '法人/個人確認書類', required: true, category: 'company' },
        // B. 財務関係書類
        { id: 'B1', name: '直近2期分の決算書', required: true, category: 'financial' },
        { id: 'B2', name: '納税証明書', required: true, category: 'financial' },
        // C. ITツール関連
        { id: 'C1', name: 'IT導入支援事業者との共同事業体契約書', required: true, category: 'project' },
        { id: 'C2', name: 'ITツール見積書', required: true, category: 'quotation' },
        { id: 'C3', name: 'ITツール機能要件適合証明書', required: true, category: 'project' },
        { id: 'C4', name: '導入計画書', required: true, category: 'project' }
      ],
      'monozukuri': [
        // A. 事業計画関連
        { id: 'A1', name: '事業計画書（システム入力＋別紙Word）', required: true, category: 'project' },
        // B. 誓約・加点様式
        { id: 'B1', name: '補助対象経費誓約書【様式1】', required: true, category: 'other' },
        { id: 'B2', name: '賃金引上げ計画の誓約書【様式2】', required: true, category: 'other' },
        // C. 現況確認資料
        { id: 'C1', name: '履歴事項全部証明書（法人）', required: true, category: 'company' },
        { id: 'C2', name: '直近期の決算書一式', required: true, category: 'financial' },
        { id: 'C3', name: '従業員数確認資料', required: true, category: 'company' },
        { id: 'C4', name: '労働者名簿', required: true, category: 'company' },
        // D. 見積・仕様関係
        { id: 'D1', name: '見積書（原則2社以上）', required: true, category: 'quotation' },
        { id: 'D2', name: 'カタログ・仕様書', required: true, category: 'quotation' },
        // E. 税・反社・資金調達
        { id: 'E1', name: '納税証明書（法人税／消費税）', required: true, category: 'financial' },
        { id: 'E2', name: '暴力団排除等に関する誓約書', required: true, category: 'other' }
      ],
      'jizokuka': [
        // A. 申請様式（必須）
        { id: 'A1', name: '様式1 小規模事業者持続化補助金事業に係る申請書', required: true, category: 'application' },
        { id: 'A2', name: '様式2 経営計画書', required: true, category: 'application' },
        { id: 'A3', name: '様式3 補助事業計画書', required: true, category: 'application' },
        { id: 'A4', name: '様式4 補助金交付申請書', required: true, category: 'application' },
        // B. 現況確認資料
        { id: 'B1', name: '直近の確定申告書（写し）', required: true, category: 'financial' },
        { id: 'B2', name: '履歴事項全部証明書（法人のみ）', required: false, category: 'corporate' },
        { id: 'B3', name: '開業届（個人事業主で創業1年未満）', required: false, category: 'corporate' },
        // C. 見積・価格関係（条件付き）
        { id: 'C1', name: '見積書（税抜50万円以上の経費）', required: false, category: 'quotation' },
        { id: 'C2', name: 'カタログ・仕様書', required: false, category: 'quotation' },
        { id: 'C3', name: '図面・レイアウト図', required: false, category: 'quotation' },
        // D. 商工会議所・商工会関係
        { id: 'D1', name: '事業支援計画書（様式6）', required: true, category: 'support' },
        { id: 'D2', name: '商工会議所・商工会の会員証明', required: false, category: 'support' },
        // E. 加点要素書類（任意）
        { id: 'E1', name: '事業継続力強化計画認定書', required: false, category: 'other' },
        { id: 'E4', name: '賃金引上げ表明書（様式7）', required: false, category: 'other' },
        // F. 申請枠別の追加書類
        { id: 'F1', name: '創業計画書（創業枠申請者）', required: false, category: 'other' },
        { id: 'F2', name: '事業承継診断書（事業承継枠）', required: false, category: 'other' },
        { id: 'F3', name: '災害証明書（災害枠）', required: false, category: 'other' }
      ],
      'jigyou-saikouchiku': [
        // A. 申請基本書類（必須）
        { id: 'A1', name: '事業計画書（表紙）', required: true, category: 'application' },
        { id: 'A2', name: '認定経営革新等支援機関による確認書', required: true, category: 'application' },
        { id: 'A3', name: '金融機関による確認書', required: true, category: 'application' },
        { id: 'A4', name: '電子申請入力項目', required: true, category: 'application' },
        // B. 財務関係書類
        { id: 'B1', name: '決算書（直近2年間）', required: true, category: 'financial' },
        { id: 'B2', name: '法人税納税証明書', required: true, category: 'financial' },
        { id: 'B3', name: '消費税納税証明書', required: true, category: 'financial' },
        // C. 事業計画関連
        { id: 'C1', name: '事業再構築の必要性を説明する書類', required: true, category: 'project' },
        { id: 'C2', name: '事業再構築の具体的内容を説明する書類', required: true, category: 'project' },
        { id: 'C3', name: '将来の展望を説明する書類', required: true, category: 'project' },
        { id: 'C4', name: '実施体制・スケジュール', required: true, category: 'project' },
        // D. 企業情報
        { id: 'D1', name: '履歴事項全部証明書', required: true, category: 'company' },
        { id: 'D2', name: '従業員数を示す書類', required: true, category: 'company' },
        { id: 'D3', name: '労働者名簿', required: true, category: 'company' },
        // E. 見積・投資計画
        { id: 'E1', name: '建物費の見積書・図面', required: false, category: 'quotation' },
        { id: 'E2', name: '機械装置・システム費の見積書', required: false, category: 'quotation' },
        { id: 'E3', name: '経費明細表', required: true, category: 'quotation' },
        // F. 枠別追加書類
        { id: 'F1', name: '市場拡大要件を説明する書類（成長枠）', required: false, category: 'other' },
        { id: 'F2', name: 'グリーン成長戦略の課題解決を説明する書類（GX枠）', required: false, category: 'other' },
        { id: 'F3', name: '賃金引上計画書（大規模賃金引上枠）', required: false, category: 'other' },
        { id: 'F4', name: '成長に係る事業計画書（卒業促進枠）', required: false, category: 'other' }
      ]
    };

    let documents = [...(baseDocuments[subsidyType as keyof typeof baseDocuments] || [])];

    // 回答に基づく追加書類の判定
    if (subsidyType === 'it-donyu') {
      // 創業2年未満の場合
      if (answers.business_duration === 'under_1year' || answers.business_duration === '1_2years') {
        documents.push({ id: 'F1', name: '創業2年未満の場合の追加書類', required: true, category: 'other' });
      }
      
      // 労働保険加入企業
      if (answers.business_duration === 'over_3years') {
        documents.push({ id: 'B3', name: '労働保険料納付証明書', required: false, category: 'financial' });
      }
      
      // 加点要素（任意）
      documents.push({ id: 'D1', name: '事業継続力強化計画認定書', required: false, category: 'other' });
      documents.push({ id: 'D3', name: '賃上げ計画表明書', required: false, category: 'other' });
    }

    if (subsidyType === 'monozukuri') {
      // 申請枠に応じた追加書類
      if (answers.application_type === 'digital') {
        documents.push({ id: 'F3', name: 'DX推進自己診断結果', required: true, category: 'other' });
      }
      if (answers.application_type === 'green') {
        documents.push({ id: 'B4', name: '炭素生産性向上計画書', required: true, category: 'other' });
      }
      if (answers.application_type === 'joint') {
        documents.push({ id: 'G1', name: '共同事業契約書＋共同事業者全員分の登記・決算書', required: true, category: 'other' });
      }
      
      // 資金調達方法に応じた追加書類
      if (answers.funding_method === 'bank_loan' || answers.funding_method === 'combined') {
        documents.push({ id: 'E3', name: '資金調達確認書【様式5】', required: true, category: 'financial' });
      }
      
      // 支援機関の状況に応じた追加書類
      if (answers.support_organization === 'contracted') {
        documents.push({ id: 'F1', name: '認定経営革新等支援機関確認書', required: false, category: 'support' });
      }
      
      // 大幅賃上げの場合
      if (answers.wage_increase_plan === 'yes_documented') {
        documents.push({ id: 'B3', name: '大幅賃上げ計画書【様式4】', required: false, category: 'other' });
      }
      
      // 必要に応じて追加される可能性のある書類
      documents.push({ id: 'A2', name: '会社全体の事業計画書（任意様式）', required: false, category: 'project' });
      documents.push({ id: 'D3', name: '図面・レイアウト図', required: false, category: 'quotation' });
    }

    if (subsidyType === 'jizokuka') {
      // 従業員数確認
      if (answers.employee_count === 'over_20') {
        documents.push({ id: 'employee_verification', name: '小規模事業者要件確認書', required: true, category: 'company' });
      }
      
      // 法人の場合の履歴事項全部証明書は既にbaseDocumentsに含まれているが、法人の場合のみrequired:trueに変更
      const corpDocIndex = documents.findIndex(doc => doc.id === 'B2');
      if (corpDocIndex !== -1 && answers.business_type === 'corporation') {
        documents[corpDocIndex].required = true;
      }
      
      // 創業1年未満の場合
      if (answers.business_duration === 'under_1year' && answers.business_type === 'individual') {
        documents.push({ id: 'B3', name: '開業届（個人事業主で創業1年未満）', required: true, category: 'corporate' });
        if (answers.application_frame === 'startup') {
          documents.push({ id: 'F1', name: '創業計画書（創業枠申請者）', required: true, category: 'other' });
        }
      }
      
      // 申請枠別の追加書類
      if (answers.application_frame === 'succession') {
        documents.push({ id: 'F2', name: '事業承継診断書（事業承継枠）', required: true, category: 'other' });
      }
      if (answers.application_frame === 'disaster') {
        documents.push({ id: 'F3', name: '災害証明書（災害枠）', required: true, category: 'other' });
      }
      
      // 会員状況
      if (answers.chamber_membership === 'member') {
        documents.push({ id: 'D2', name: '商工会議所・商工会の会員証明', required: false, category: 'support' });
      }
      
      // 事業支援計画書の状況（これは注意事項として表示するものなので削除）
    }

    if (subsidyType === 'jigyou-saikouchiku') {
      // 申請枠に応じた追加書類
      if (answers.application_frame === 'growth_normal') {
        documents.push({ id: 'F1', name: '市場拡大要件を説明する書類（成長枠）', required: true, category: 'other' });
      }
      if (answers.application_frame === 'growth_gx') {
        documents.push({ id: 'F2', name: 'グリーン成長戦略の課題解決を説明する書類（GX枠）', required: true, category: 'other' });
      }
      if (answers.application_frame === 'wage_increase') {
        documents.push({ id: 'F3', name: '賃金引上計画書（大規模賃金引上枠）', required: true, category: 'other' });
      }
      if (answers.application_frame === 'graduation') {
        documents.push({ id: 'F4', name: '成長に係る事業計画書（卒業促進枠）', required: true, category: 'other' });
      }
      
      // 支援機関の確認書状況
      if (answers.support_organization !== 'confirmed') {
        documents.push({ id: 'support_urgent', name: '【重要】認定支援機関の確認書が必要です', required: true, category: 'alert' });
      }
      
      // 金融機関の確認書状況
      if (answers.financial_institution !== 'confirmed') {
        documents.push({ id: 'financial_urgent', name: '【重要】金融機関の確認書が必要です', required: true, category: 'alert' });
      }
      
      // 建物・設備投資がある場合
      documents.push({ id: 'E1', name: '建物費の見積書・図面', required: true, category: 'quotation' });
      documents.push({ id: 'E2', name: '機械装置・システム費の見積書', required: true, category: 'quotation' });
      
      // 経費額に応じた見積書（既にbaseDocumentsに含まれているので、条件に応じてrequiredを変更）
      const quotationDocIndex = documents.findIndex(doc => doc.id === 'C1');
      if (quotationDocIndex !== -1 && (answers.expense_amount === '50_100' || answers.expense_amount === '100_150' || answers.expense_amount === 'over_150')) {
        documents[quotationDocIndex].required = true;
      }
      
      // 取組内容に応じた追加書類（既にbaseDocumentsに含まれているので、条件に応じてrequiredを変更）
      const catalogDocIndex = documents.findIndex(doc => doc.id === 'C2');
      if (catalogDocIndex !== -1 && answers.sales_channel_type === 'equipment') {
        documents[catalogDocIndex].required = true;
      }
      const layoutDocIndex = documents.findIndex(doc => doc.id === 'C3');
      if (layoutDocIndex !== -1 && answers.sales_channel_type === 'renovation') {
        documents[layoutDocIndex].required = true;
      }
      
      // 加点要素は既にbaseDocumentsに含まれているので追加しない
    }

    return documents;
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 回答を保存して次の画面へ
      const finalAnswers = { ...answers, [currentQuestion.id]: value };
      sessionStorage.setItem('documentRequirements', JSON.stringify(finalAnswers));
      
      // 必要書類を判定
      const requiredDocuments = determineRequiredDocuments(subsidyType, finalAnswers);
      
      if (onComplete) {
        onComplete(requiredDocuments);
      } else {
        navigate('/input-form');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/subsidy-results');
    }
  };

  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p>この補助金の設問が見つかりません</p>
        <button onClick={() => navigate('/subsidy-list')}>戻る</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
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
            onClick={() => navigate('/minimal-form/' + subsidyType)}
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

      <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{subsidyName}</h2>
      <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
        必要書類を判定するための質問にお答えください
      </p>
      
      {/* 進捗バー */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
          <div
            style={{
              backgroundColor: '#2563eb',
              height: '100%',
              borderRadius: '4px',
              width: `${progress}%`,
              transition: 'width 0.3s'
            }}
          />
        </div>
        <p style={{ textAlign: 'center', marginTop: '8px', color: '#6b7280' }}>
          質問 {currentStep + 1} / {questions.length}
        </p>
      </div>

      {/* 質問カード */}
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '22px', marginBottom: '24px' }}>
          {currentQuestion.question}
        </h3>

        {currentQuestion.type === 'radio' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQuestion.options.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  border: '2px solid',
                  borderColor: answers[currentQuestion.id] === option.value ? '#2563eb' : '#e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={(e) => handleAnswer(e.target.value)}
                  style={{ marginRight: '12px', width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '16px' }}>{option.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <select
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">選択してください</option>
            {currentQuestion.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button
          onClick={handleBack}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {currentStep === 0 ? '補助金選択に戻る' : '前の質問へ'}
        </button>
        
        {currentStep === questions.length - 1 && answers[currentQuestion.id] && (
          <button
            onClick={() => handleAnswer(answers[currentQuestion.id] as string)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            申請書作成へ進む
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentRequirementQuestions;