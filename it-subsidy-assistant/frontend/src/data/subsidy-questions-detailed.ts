// 補助金申請書作成に必要な詳細設問

export interface DetailedQuestion {
  id: string;
  question: string;
  type: 'radio' | 'select' | 'multiselect' | 'text' | 'number' | 'date';
  options?: Array<{ value: string; label: string; subQuestions?: string[] }>;
  required: boolean;
  category: string;
  hint?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export const subsidyDetailedQuestions: Record<string, DetailedQuestion[]> = {
  'it-donyu': [
    // IT導入補助金2025 - 4つの質問（仕様書準拠）
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
      required: true,
      category: '企業情報'
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
      required: true,
      category: 'IT導入計画'
    },
    {
      id: 'support_provider',
      question: 'IT導入支援事業者は決定していますか？',
      type: 'radio',
      options: [
        { value: 'yes', label: 'はい（決定済み）' },
        { value: 'considering', label: '検討中' },
        { value: 'no', label: 'いいえ（未定）' }
      ],
      required: true,
      category: 'IT導入計画'
    },
    {
      id: 'productivity_plan',
      question: '労働生産性向上の具体的な計画はありますか？',
      type: 'radio',
      options: [
        { value: 'detailed', label: '詳細な計画あり' },
        { value: 'rough', label: '概要レベルの計画あり' },
        { value: 'none', label: 'これから策定' }
      ],
      required: true,
      category: '生産性向上計画'
    }
  ],
  
  'monozukuri': [
    // ものづくり補助金 - 6つの質問（仕様書準拠）
    {
      id: 'application_frame',
      question: '申請予定の枠を選択してください',
      type: 'select',
      options: [
        { value: 'normal', label: '通常枠' },
        { value: 'digital', label: 'デジタル枠' },
        { value: 'green', label: 'グリーン枠' },
        { value: 'joint', label: '共同申請枠' }
      ],
      required: true,
      category: '申請情報'
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
      required: true,
      category: '企業情報'
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
      required: true,
      category: '事業計画'
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
      required: true,
      category: '支援体制'
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
      required: true,
      category: '雇用計画'
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
      required: true,
      category: '資金計画'
    }
  ],
  
  'jizokuka': [
    // 小規模事業者持続化補助金 - 8つの質問（仕様書準拠）
    {
      id: 'business_type',
      question: '事業形態を選択してください',
      type: 'radio',
      options: [
        { value: 'corporation', label: '法人' },
        { value: 'individual', label: '個人事業主' }
      ],
      required: true,
      category: '事業者情報'
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
      required: true,
      category: '事業者情報'
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
      required: true,
      category: '事業者情報'
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
      required: true,
      category: '支援体制'
    },
    {
      id: 'application_frame',
      question: '申請予定の枠を選択してください',
      type: 'select',
      options: [
        { value: 'general', label: '一般型' },
        { value: 'startup', label: '創業枠' },
        { value: 'succession', label: '事業承継枠' },
        { value: 'disaster', label: '災害枠' }
      ],
      required: true,
      category: '申請情報'
    },
    {
      id: 'support_plan_status',
      question: '事業支援計画書（様式6）の作成状況は？',
      type: 'radio',
      options: [
        { value: 'completed', label: '商工会・商工会議所で作成済み' },
        { value: 'in_progress', label: '商工会・商工会議所で作成中' },
        { value: 'scheduled', label: '商工会・商工会議所に相談予約済み' },
        { value: 'not_started', label: '未着手' }
      ],
      required: true,
      category: '支援体制'
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
      required: true,
      category: '販路開拓計画'
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
      required: true,
      category: '資金計画'
    }
  ],
  
  'jigyou-saikouchiku': [
    // 事業再構築補助金 - 6つの質問（第13回公募で新規受付終了）
    {
      id: 'application_frame',
      question: '申請予定の事業類型を選択してください',
      type: 'radio',
      options: [
        { value: 'growth_normal', label: '成長枠（通常類型）- 新市場進出・市場拡大' },
        { value: 'growth_gx', label: '成長枠（グリーン成長類型）- 環境分野での成長' },
        { value: 'covid_recovery', label: 'コロナ回復加速化枠 - コロナ影響からの回復' },
        { value: 'graduation', label: '卒業促進上乗せ措置 - 中小から中堅への成長' },
        { value: 'wage_increase', label: '中長期大規模賃金引上促進上乗せ措置' }
      ],
      required: true,
      category: '申請類型',
      hint: '※第13回公募（2025年2月7日）で新規受付終了'
    },
    {
      id: 'value_added_plan',
      question: '付加価値額の増加計画について',
      type: 'radio',
      options: [
        { value: '3percent', label: '年率3%以上の増加を計画（必須要件）' },
        { value: '4percent', label: '年率4%以上の増加を計画（補助率引上げ対象）' },
        { value: '5percent', label: '年率5%以上の増加を計画（大規模賃金引上げ枠）' },
        { value: 'uncertain', label: '達成可能か不確実' }
      ],
      required: true,
      category: '事業計画要件',
      hint: '付加価値額＝営業利益＋人件費＋減価償却費'
    },
    {
      id: 'employee_scale',
      question: '従業員数（中小企業・中堅企業の判定）',
      type: 'select',
      options: [
        { value: 'small_20', label: '20人以下（小規模企業者）' },
        { value: 'medium_300', label: '21〜300人（中小企業：製造業等）' },
        { value: 'medium_100', label: '21〜100人（中小企業：サービス業等）' },
        { value: 'middle_2000', label: '301〜2,000人（中堅企業）' },
        { value: 'over_2000', label: '2,000人超（対象外）' }
      ],
      required: true,
      category: '企業規模',
      hint: '従業員数により補助上限額が異なります'
    },
    {
      id: 'support_organization',
      question: '認定経営革新等支援機関との連携状況は？',
      type: 'radio',
      options: [
        { value: 'confirmed', label: '確認書を取得済み（必須）' },
        { value: 'in_progress', label: '事業計画を策定中' },
        { value: 'searching', label: '支援機関を探している' },
        { value: 'not_started', label: 'まだ何もしていない' }
      ],
      required: true,
      category: '申請要件',
      hint: '認定支援機関の確認書は申請時の必須書類です'
    },
    {
      id: 'financial_institution',
      question: '金融機関（メインバンク等）の確認状況は？',
      type: 'radio',
      options: [
        { value: 'confirmed', label: '確認書を取得済み（必須）' },
        { value: 'discussing', label: '相談・協議中' },
        { value: 'scheduled', label: '相談予定あり' },
        { value: 'not_yet', label: 'まだ相談していない' }
      ],
      required: true,
      category: '申請要件',
      hint: '金融機関の確認書も申請時の必須書類です'
    },
    {
      id: 'target_market',
      question: '事業再構築で狙う市場は？',
      type: 'radio',
      options: [
        { value: 'growing_market', label: '成長市場への新規参入' },
        { value: 'shrinking_market', label: '縮小市場からの転換' },
        { value: 'green_market', label: 'グリーン分野への進出' },
        { value: 'digital_market', label: 'デジタル分野への転換' },
        { value: 'other', label: 'その他の市場' }
      ],
      required: true,
      category: '事業戦略'
    }
  ]
};