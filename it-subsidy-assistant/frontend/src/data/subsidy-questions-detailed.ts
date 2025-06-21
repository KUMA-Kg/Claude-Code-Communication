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
    // 1. 企業基本情報の詳細
    {
      id: 'incorporation_type',
      question: '法人格の種類を選択してください',
      type: 'select',
      options: [
        { value: 'kabushiki', label: '株式会社' },
        { value: 'godo', label: '合同会社' },
        { value: 'yugen', label: '有限会社' },
        { value: 'individual', label: '個人事業主' },
        { value: 'npo', label: 'NPO法人' },
        { value: 'other', label: 'その他法人' }
      ],
      required: true,
      category: '企業情報'
    },
    {
      id: 'main_industry',
      question: '主たる事業の業種を選択してください（日本標準産業分類）',
      type: 'select',
      options: [
        { value: 'A', label: '農業、林業' },
        { value: 'B', label: '漁業' },
        { value: 'C', label: '鉱業、採石業、砂利採取業' },
        { value: 'D', label: '建設業' },
        { value: 'E', label: '製造業' },
        { value: 'F', label: '電気・ガス・熱供給・水道業' },
        { value: 'G', label: '情報通信業' },
        { value: 'H', label: '運輸業、郵便業' },
        { value: 'I', label: '卸売業、小売業' },
        { value: 'J', label: '金融業、保険業' },
        { value: 'K', label: '不動産業、物品賃貸業' },
        { value: 'L', label: '学術研究、専門・技術サービス業' },
        { value: 'M', label: '宿泊業、飲食サービス業' },
        { value: 'N', label: '生活関連サービス業、娯楽業' },
        { value: 'O', label: '教育、学習支援業' },
        { value: 'P', label: '医療、福祉' },
        { value: 'Q', label: '複合サービス事業' },
        { value: 'R', label: 'サービス業（他に分類されないもの）' }
      ],
      required: true,
      category: '企業情報',
      hint: '複数の事業を行っている場合は、売上高が最も大きい事業を選択'
    },
    
    // 2. 財務状況の詳細
    {
      id: 'last_fiscal_year_end',
      question: '直近の決算期を入力してください',
      type: 'date',
      required: true,
      category: '財務情報'
    },
    {
      id: 'last_year_revenue',
      question: '直近決算期の売上高（千円単位）',
      type: 'number',
      required: true,
      category: '財務情報',
      validation: { min: 0 }
    },
    {
      id: 'last_year_operating_profit',
      question: '直近決算期の営業利益（千円単位）',
      type: 'number',
      required: true,
      category: '財務情報',
      hint: '赤字の場合はマイナスで入力'
    },
    {
      id: 'last_year_ordinary_profit',
      question: '直近決算期の経常利益（千円単位）',
      type: 'number',
      required: true,
      category: '財務情報'
    },
    
    // 3. IT導入の現状と課題
    {
      id: 'current_it_systems',
      question: '現在利用しているITシステム・ツールを選択してください',
      type: 'multiselect',
      options: [
        { value: 'accounting', label: '会計システム' },
        { value: 'sales', label: '販売管理システム' },
        { value: 'inventory', label: '在庫管理システム' },
        { value: 'crm', label: '顧客管理システム（CRM）' },
        { value: 'hr', label: '人事・給与システム' },
        { value: 'groupware', label: 'グループウェア' },
        { value: 'ec', label: 'ECサイト' },
        { value: 'pos', label: 'POSレジ' },
        { value: 'none', label: '特になし' }
      ],
      required: true,
      category: 'IT活用状況'
    },
    {
      id: 'it_challenges',
      question: '現在のIT活用における課題を選択してください',
      type: 'multiselect',
      options: [
        { value: 'manual_work', label: '手作業が多く効率が悪い' },
        { value: 'data_sharing', label: '部門間でのデータ共有ができていない' },
        { value: 'duplicate_entry', label: '同じデータを複数システムに入力している' },
        { value: 'realtime', label: 'リアルタイムでの情報把握ができない' },
        { value: 'analysis', label: 'データ分析・活用ができていない' },
        { value: 'customer_management', label: '顧客情報の一元管理ができていない' },
        { value: 'remote_work', label: 'テレワーク対応ができていない' },
        { value: 'security', label: 'セキュリティに不安がある' }
      ],
      required: true,
      category: 'IT活用状況'
    },
    
    // 4. IT導入計画の詳細
    {
      id: 'it_implementation_purpose',
      question: 'IT導入の主な目的を選択してください',
      type: 'select',
      options: [
        { value: 'efficiency', label: '業務効率化・生産性向上' },
        { value: 'cost_reduction', label: 'コスト削減' },
        { value: 'sales_increase', label: '売上拡大' },
        { value: 'customer_satisfaction', label: '顧客満足度向上' },
        { value: 'data_utilization', label: 'データ活用・見える化' },
        { value: 'work_style_reform', label: '働き方改革' }
      ],
      required: true,
      category: 'IT導入計画'
    },
    {
      id: 'target_business_process',
      question: '改善対象の業務プロセスを選択してください',
      type: 'multiselect',
      options: [
        { value: 'sales_process', label: '営業・販売プロセス' },
        { value: 'customer_service', label: '顧客対応・サービス' },
        { value: 'inventory_logistics', label: '在庫・物流管理' },
        { value: 'accounting_finance', label: '経理・財務' },
        { value: 'hr_payroll', label: '人事・給与' },
        { value: 'production', label: '生産・製造' },
        { value: 'marketing', label: 'マーケティング' },
        { value: 'management', label: '経営管理' }
      ],
      required: true,
      category: 'IT導入計画'
    },
    {
      id: 'expected_efficiency_improvement',
      question: '業務効率化により削減される作業時間の見込み（月間）',
      type: 'number',
      required: true,
      category: 'IT導入計画',
      hint: '時間単位で入力（例：80時間）',
      validation: { min: 1, max: 9999 }
    },
    {
      id: 'implementation_schedule',
      question: 'IT導入完了予定時期',
      type: 'select',
      options: [
        { value: '1month', label: '1ヶ月以内' },
        { value: '3months', label: '3ヶ月以内' },
        { value: '6months', label: '6ヶ月以内' },
        { value: '1year', label: '1年以内' }
      ],
      required: true,
      category: 'IT導入計画'
    },
    
    // 5. 労働生産性向上計画
    {
      id: 'productivity_improvement_rate',
      question: '3年後の労働生産性向上目標（％）',
      type: 'number',
      required: true,
      category: '生産性向上計画',
      hint: '現在を100とした場合の3年後の目標値（例：110）',
      validation: { min: 101, max: 200 }
    },
    {
      id: 'productivity_measures',
      question: '労働生産性向上のための具体的な取り組みを選択',
      type: 'multiselect',
      options: [
        { value: 'automation', label: '定型業務の自動化' },
        { value: 'paperless', label: 'ペーパーレス化' },
        { value: 'data_integration', label: 'データ連携・一元化' },
        { value: 'mobile', label: 'モバイル活用' },
        { value: 'cloud', label: 'クラウド化' },
        { value: 'ai_utilization', label: 'AI・機械学習の活用' },
        { value: 'process_improvement', label: '業務プロセスの見直し' }
      ],
      required: true,
      category: '生産性向上計画'
    },
    
    // 6. 資金計画
    {
      id: 'total_it_investment',
      question: 'IT導入に係る総投資額（千円）',
      type: 'number',
      required: true,
      category: '資金計画',
      validation: { min: 300, max: 4500 }
    },
    {
      id: 'subsidy_request_amount',
      question: '補助金申請希望額（千円）',
      type: 'number',
      required: true,
      category: '資金計画',
      hint: '総投資額の1/2〜3/4の範囲で入力'
    },
    {
      id: 'self_funding_source',
      question: '自己負担分の資金調達方法',
      type: 'select',
      options: [
        { value: 'cash', label: '自己資金' },
        { value: 'bank_loan', label: '金融機関借入' },
        { value: 'lease', label: 'リース・割賦' },
        { value: 'combined', label: '複合的な調達' }
      ],
      required: true,
      category: '資金計画'
    }
  ],
  
  'monozukuri': [
    // 1. 企業の技術基盤
    {
      id: 'core_technology',
      question: '貴社の中核となる技術分野を選択してください',
      type: 'multiselect',
      options: [
        { value: 'machining', label: '機械加工技術' },
        { value: 'molding', label: '成形加工技術' },
        { value: 'surface_treatment', label: '表面処理技術' },
        { value: 'assembly', label: '組立・実装技術' },
        { value: 'measurement', label: '計測・検査技術' },
        { value: 'material', label: '材料・素材技術' },
        { value: 'software', label: 'ソフトウェア開発' },
        { value: 'electronics', label: '電子・電気技術' },
        { value: 'biotechnology', label: 'バイオ技術' },
        { value: 'environmental', label: '環境・エネルギー技術' }
      ],
      required: true,
      category: '技術基盤'
    },
    {
      id: 'certification_standards',
      question: '取得している認証・規格を選択してください',
      type: 'multiselect',
      options: [
        { value: 'iso9001', label: 'ISO9001（品質）' },
        { value: 'iso14001', label: 'ISO14001（環境）' },
        { value: 'iso45001', label: 'ISO45001（労働安全）' },
        { value: 'iatf16949', label: 'IATF16949（自動車）' },
        { value: 'jisq9100', label: 'JISQ9100（航空宇宙）' },
        { value: 'iso13485', label: 'ISO13485（医療機器）' },
        { value: 'fssc22000', label: 'FSSC22000（食品安全）' },
        { value: 'none', label: '特になし' }
      ],
      required: true,
      category: '技術基盤'
    },
    
    // 2. 革新的な事業計画の詳細
    {
      id: 'innovation_type_detail',
      question: '実施する革新的な取り組みの具体的内容',
      type: 'select',
      options: [
        { value: 'new_product_development', label: '従来にない新商品の開発' },
        { value: 'product_improvement', label: '既存製品の大幅な性能向上' },
        { value: 'new_production_method', label: '革新的な生産方法の導入' },
        { value: 'new_service_model', label: '新たなサービス提供方式の開発' },
        { value: 'new_supply_method', label: '新たな販売・供給方式の導入' }
      ],
      required: true,
      category: '事業計画'
    },
    {
      id: 'target_market',
      question: '主要なターゲット市場を選択してください',
      type: 'multiselect',
      options: [
        { value: 'automotive', label: '自動車産業' },
        { value: 'electronics', label: '電子・電気機器' },
        { value: 'medical', label: '医療・ヘルスケア' },
        { value: 'aerospace', label: '航空宇宙' },
        { value: 'construction', label: '建設・インフラ' },
        { value: 'food', label: '食品・飲料' },
        { value: 'chemical', label: '化学・素材' },
        { value: 'energy', label: 'エネルギー・環境' },
        { value: 'consumer', label: '一般消費者向け' }
      ],
      required: true,
      category: '事業計画'
    },
    {
      id: 'competitive_advantage',
      question: '競合他社と比較した優位性',
      type: 'multiselect',
      options: [
        { value: 'quality', label: '品質・性能の優位性' },
        { value: 'cost', label: 'コスト競争力' },
        { value: 'delivery', label: '納期・供給力' },
        { value: 'technology', label: '独自技術・特許' },
        { value: 'customization', label: 'カスタマイズ対応力' },
        { value: 'service', label: 'アフターサービス' },
        { value: 'brand', label: 'ブランド力' }
      ],
      required: true,
      category: '事業計画'
    },
    
    // 3. 投資計画の詳細
    {
      id: 'equipment_investment_details',
      question: '導入予定の主要設備・システムの種類',
      type: 'multiselect',
      options: [
        { value: 'cnc_machine', label: 'CNC工作機械' },
        { value: '3d_printer', label: '3Dプリンター' },
        { value: 'robot', label: '産業用ロボット' },
        { value: 'inspection', label: '検査・測定装置' },
        { value: 'software_system', label: '生産管理システム' },
        { value: 'iot_system', label: 'IoTシステム' },
        { value: 'ai_system', label: 'AI・画像認識システム' },
        { value: 'special_equipment', label: '専用加工設備' }
      ],
      required: true,
      category: '投資計画'
    },
    {
      id: 'productivity_improvement_rate',
      question: '導入による生産性向上見込み（％）',
      type: 'number',
      required: true,
      category: '投資計画',
      hint: '現在の生産性を100とした場合の向上率',
      validation: { min: 10, max: 500 }
    },
    {
      id: 'quality_improvement_metrics',
      question: '品質向上の定量的目標',
      type: 'select',
      options: [
        { value: 'defect_rate_reduction', label: '不良率の削減（50%以上）' },
        { value: 'precision_improvement', label: '加工精度の向上（2倍以上）' },
        { value: 'durability_improvement', label: '耐久性の向上（1.5倍以上）' },
        { value: 'performance_improvement', label: '性能向上（30%以上）' }
      ],
      required: true,
      category: '投資計画'
    },
    
    // 4. 付加価値向上計画
    {
      id: 'value_added_increase_rate',
      question: '3年後の付加価値額増加目標（％）',
      type: 'number',
      required: true,
      category: '付加価値計画',
      hint: '年率3%以上の向上が必要',
      validation: { min: 9, max: 100 }
    },
    {
      id: 'employment_plan',
      question: '事業実施に伴う雇用計画',
      type: 'select',
      options: [
        { value: 'maintain', label: '現状維持' },
        { value: 'increase_1_2', label: '1〜2名増員' },
        { value: 'increase_3_5', label: '3〜5名増員' },
        { value: 'increase_over_5', label: '6名以上増員' }
      ],
      required: true,
      category: '付加価値計画'
    },
    
    // 5. 資金計画
    {
      id: 'total_project_cost_breakdown',
      question: '事業総額の内訳（最も金額が大きい費目）',
      type: 'select',
      options: [
        { value: 'machinery', label: '機械装置・システム構築費' },
        { value: 'technology_introduction', label: '技術導入費' },
        { value: 'expert_expenses', label: '専門家経費' },
        { value: 'outsourcing', label: '外注費' }
      ],
      required: true,
      category: '資金計画'
    },
    {
      id: 'roi_payback_period',
      question: '投資回収期間の見込み',
      type: 'select',
      options: [
        { value: '2years', label: '2年以内' },
        { value: '3years', label: '3年以内' },
        { value: '5years', label: '5年以内' },
        { value: 'over5years', label: '5年超' }
      ],
      required: true,
      category: '資金計画'
    }
  ],
  
  'jizokuka': [
    // 1. 事業者の詳細情報
    {
      id: 'business_category',
      question: '事業者の詳細区分を選択してください',
      type: 'select',
      options: [
        { value: 'corporation_small', label: '小規模法人（従業員20名以下）' },
        { value: 'corporation_micro', label: '小規模法人（従業員5名以下）' },
        { value: 'individual_employee', label: '個人事業主（従業員あり）' },
        { value: 'individual_solo', label: '個人事業主（従業員なし）' }
      ],
      required: true,
      category: '事業者情報'
    },
    {
      id: 'business_location_type',
      question: '事業所の立地を選択してください',
      type: 'select',
      options: [
        { value: 'shopping_street', label: '商店街' },
        { value: 'residential_area', label: '住宅地' },
        { value: 'business_district', label: 'オフィス街' },
        { value: 'industrial_area', label: '工業地域' },
        { value: 'rural_area', label: '農村地域' },
        { value: 'tourist_area', label: '観光地' }
      ],
      required: true,
      category: '事業者情報'
    },
    
    // 2. 現在の経営課題の詳細
    {
      id: 'sales_trend',
      question: '過去3年間の売上高の推移',
      type: 'select',
      options: [
        { value: 'increasing', label: '増加傾向' },
        { value: 'stable', label: '横ばい' },
        { value: 'decreasing_slight', label: '微減傾向（10%未満）' },
        { value: 'decreasing_moderate', label: '減少傾向（10-30%）' },
        { value: 'decreasing_severe', label: '大幅減少（30%以上）' }
      ],
      required: true,
      category: '経営状況'
    },
    {
      id: 'customer_issues',
      question: '顧客に関する主な課題を選択してください',
      type: 'multiselect',
      options: [
        { value: 'customer_decrease', label: '顧客数の減少' },
        { value: 'customer_aging', label: '顧客の高齢化' },
        { value: 'low_repeat_rate', label: 'リピート率が低い' },
        { value: 'low_unit_price', label: '客単価が低い' },
        { value: 'narrow_customer_base', label: '顧客層が狭い' },
        { value: 'low_recognition', label: '認知度が低い' }
      ],
      required: true,
      category: '経営状況'
    },
    {
      id: 'competitive_environment',
      question: '競合環境について',
      type: 'select',
      options: [
        { value: 'increasing_competition', label: '競合が増加している' },
        { value: 'stable_competition', label: '競合状況は安定' },
        { value: 'decreasing_competition', label: '競合が減少している' },
        { value: 'large_competitor', label: '大手企業との競合' },
        { value: 'online_competition', label: 'ネット通販との競合' }
      ],
      required: true,
      category: '経営状況'
    },
    
    // 3. 販路開拓の具体的計画
    {
      id: 'target_customer_expansion',
      question: '新たに開拓したい顧客層',
      type: 'multiselect',
      options: [
        { value: 'young_generation', label: '若年層（20-30代）' },
        { value: 'senior_generation', label: 'シニア層（60代以上）' },
        { value: 'female_customers', label: '女性顧客' },
        { value: 'family_customers', label: 'ファミリー層' },
        { value: 'business_customers', label: '法人顧客' },
        { value: 'tourist_customers', label: '観光客' },
        { value: 'foreign_customers', label: '外国人顧客' }
      ],
      required: true,
      category: '販路開拓計画'
    },
    {
      id: 'sales_channel_strategy',
      question: '実施予定の販路開拓手法の詳細',
      type: 'multiselect',
      options: [
        { value: 'new_website', label: '新規ホームページ制作' },
        { value: 'ec_site', label: 'ECサイト構築' },
        { value: 'sns_marketing', label: 'SNSマーケティング' },
        { value: 'web_advertising', label: 'Web広告' },
        { value: 'print_advertising', label: 'チラシ・新聞広告' },
        { value: 'exhibition', label: '展示会・商談会出展' },
        { value: 'new_product_development', label: '新商品・サービス開発' },
        { value: 'store_renovation', label: '店舗改装' }
      ],
      required: true,
      category: '販路開拓計画'
    },
    {
      id: 'digital_transformation_level',
      question: '現在のデジタル活用状況',
      type: 'select',
      options: [
        { value: 'none', label: 'ほとんど活用していない' },
        { value: 'basic_website', label: 'ホームページのみ' },
        { value: 'sns_active', label: 'SNSを活用中' },
        { value: 'ec_operating', label: 'EC販売実施中' },
        { value: 'digital_marketing', label: 'デジタルマーケティング実施中' }
      ],
      required: true,
      category: '販路開拓計画'
    },
    
    // 4. 期待される効果
    {
      id: 'expected_new_customer_rate',
      question: '新規顧客獲得の目標（年間）',
      type: 'select',
      options: [
        { value: 'under_10', label: '10名未満' },
        { value: '10_50', label: '10〜50名' },
        { value: '50_100', label: '50〜100名' },
        { value: '100_500', label: '100〜500名' },
        { value: 'over_500', label: '500名以上' }
      ],
      required: true,
      category: '期待効果'
    },
    {
      id: 'expected_sales_increase',
      question: '売上増加の見込み（年間）',
      type: 'select',
      options: [
        { value: 'under_5', label: '5%未満' },
        { value: '5_10', label: '5〜10%' },
        { value: '10_20', label: '10〜20%' },
        { value: '20_30', label: '20〜30%' },
        { value: 'over_30', label: '30%以上' }
      ],
      required: true,
      category: '期待効果'
    },
    
    // 5. 経費計画
    {
      id: 'main_expense_category',
      question: '最も金額が大きい経費項目',
      type: 'select',
      options: [
        { value: 'advertising', label: '広報費（チラシ・Web広告等）' },
        { value: 'website', label: 'ウェブサイト関連費' },
        { value: 'exhibition', label: '展示会等出展費' },
        { value: 'development', label: '開発費' },
        { value: 'equipment', label: '機械装置等費' },
        { value: 'outsourcing', label: '委託・外注費' }
      ],
      required: true,
      category: '経費計画'
    },
    {
      id: 'cost_effectiveness',
      question: '費用対効果の見込み',
      type: 'select',
      options: [
        { value: '1year', label: '1年以内に投資回収' },
        { value: '2years', label: '2年以内に投資回収' },
        { value: '3years', label: '3年以内に投資回収' },
        { value: 'longterm', label: '長期的な効果を期待' }
      ],
      required: true,
      category: '経費計画'
    }
  ]
};