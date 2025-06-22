// 書類の詳細ガイダンス情報

export interface DocumentGuide {
  id: string;
  name: string;
  icon: string;
  description: string;
  location: string;
  note?: string;
  processingTime?: string;
  fee?: string;
  category: 'common' | 'subsidy-specific' | 'conditional';
  subsidyTypes?: string[];
}

// 共通書類のガイダンス
export const commonDocumentGuides: DocumentGuide[] = [
  {
    id: 'tax_certificate',
    name: '納税証明書',
    icon: '🧾',
    description: '直近3期分の法人税・消費税・固定資産税の納税証明書',
    location: '管轄税務署または市区町村役場',
    note: '未納がある場合は申請不可。オンライン申請も可能です',
    processingTime: '即日〜1週間',
    fee: '1通あたり400円',
    category: 'common'
  },
  {
    id: 'corporate_register',
    name: '履歴事項全部証明書（登記簿謄本）',
    icon: '📋',
    description: '法人の場合は必須。発行から3ヶ月以内のもの',
    location: '法務局（オンライン申請可）',
    note: 'オンライン申請の場合は「登記ねっと」を利用可能。手数料が安くなります',
    processingTime: 'オンライン：即日、窓口：1〜3日',
    fee: 'オンライン：480円、窓口：600円',
    category: 'common'
  },
  {
    id: 'financial_statements',
    name: '決算書類',
    icon: '📊',
    description: '直近2期分の財務諸表（貸借対照表、損益計算書、製造原価報告書等）',
    location: '自社で保管',
    note: '税理士の押印が必要な場合あり。税務署の受付印も確認してください',
    category: 'common'
  },
  {
    id: 'business_plan',
    name: '事業計画書',
    icon: '📝',
    description: '補助事業の内容と効果を記載した計画書',
    location: '自社で作成',
    note: '専門家のアドバイスを受けることで採択率が上がります',
    category: 'common'
  }
];

// IT導入補助金特有の書類
export const itDonyuDocumentGuides: DocumentGuide[] = [
  {
    id: 'personal_id',
    name: '身分証明書（運転免許証等）',
    icon: '🆔',
    description: '代表者の本人確認書類。運転免許証、マイナンバーカード、パスポートなど',
    location: '運転免許証は警察署、マイナンバーカードは市区町村役場',
    note: '有効期限内のものをご用意ください。顔写真付きの公的証明書が必要です',
    processingTime: '運転免許証：即日〜2週間、マイナンバーカード：1ヶ月程度',
    category: 'subsidy-specific',
    subsidyTypes: ['it-donyu']
  },
  {
    id: 'gbizid_prime',
    name: 'gBizIDプライム',
    icon: '🔐',
    description: '電子申請に必要なアカウント。事前取得が必須',
    location: 'gBizIDウェブサイトでオンライン申請',
    note: '取得に2〜3週間かかるため、早めの申請が必要です。印鑑証明書も必要',
    processingTime: '2〜3週間',
    fee: '無料（印鑑証明書は別途必要）',
    category: 'subsidy-specific',
    subsidyTypes: ['it-donyu']
  },
  {
    id: 'security_action',
    name: 'SECURITY ACTION自己宣言',
    icon: '🛡️',
    description: 'IPAのSECURITY ACTIONの宣言証明',
    location: 'IPAウェブサイトでオンライン宣言',
    note: '申請前に必ず宣言が必要。★一つ星または★★二つ星を選択',
    processingTime: '即時（オンライン）',
    fee: '無料',
    category: 'subsidy-specific',
    subsidyTypes: ['it-donyu']
  }
];

// ものづくり補助金特有の書類
export const monozukuriDocumentGuides: DocumentGuide[] = [
  {
    id: 'certified_support',
    name: '認定経営革新等支援機関による確認書',
    icon: '🏆',
    description: '事業計画の妥当性を認定支援機関が確認した書類',
    location: '認定支援機関（商工会議所、金融機関、税理士等）',
    note: '事前に支援機関との相談が必要。計画書作成のサポートも受けられます',
    processingTime: '1〜2週間',
    fee: '支援機関により異なる（無料〜数万円）',
    category: 'subsidy-specific',
    subsidyTypes: ['monozukuri']
  },
  {
    id: 'employee_certificate',
    name: '従業員数を証明する書類',
    icon: '👥',
    description: '雇用保険被保険者資格取得等確認通知書、健康保険・厚生年金保険被保険者標準報酬決定通知書等',
    location: 'ハローワークまたは年金事務所',
    note: '直近のもの。従業員数によって補助上限額が変わります',
    processingTime: '即日〜1週間',
    category: 'subsidy-specific',
    subsidyTypes: ['monozukuri']
  },
  {
    id: 'wage_increase_plan',
    name: '賃金引上げ計画の表明書',
    icon: '💰',
    description: '給与支給総額と事業場内最低賃金の引上げ計画',
    location: '自社で作成（様式あり）',
    note: '必須要件。未達成の場合は補助金返還の可能性あり',
    category: 'subsidy-specific',
    subsidyTypes: ['monozukuri']
  }
];

// 持続化補助金特有の書類
export const jizokukaDocumentGuides: DocumentGuide[] = [
  {
    id: 'chamber_membership',
    name: '商工会議所・商工会の会員証明',
    icon: '🤝',
    description: '会員であることの証明書',
    location: '所属する商工会議所・商工会',
    note: '非会員の場合は入会が必要。年会費が必要になります',
    processingTime: '即日〜1週間',
    fee: '証明書発行は無料（年会費は別途）',
    category: 'subsidy-specific',
    subsidyTypes: ['jizokuka']
  },
  {
    id: 'business_notification',
    name: '開業届控え（個人事業主の場合）',
    icon: '📄',
    description: '税務署に提出した開業届の控え（受付印付き）',
    location: '自社で保管（税務署提出済み）',
    note: '開業から1年未満の場合は開業届で代替可。紛失した場合は再発行可能',
    processingTime: '再発行の場合：1週間程度',
    category: 'subsidy-specific',
    subsidyTypes: ['jizokuka']
  },
  {
    id: 'local_support_letter',
    name: '地域支援機関の支援計画書',
    icon: '📋',
    description: '商工会議所・商工会が作成する支援計画',
    location: '所属する商工会議所・商工会',
    note: '申請書作成のアドバイスも受けられます',
    processingTime: '1〜2週間',
    category: 'subsidy-specific',
    subsidyTypes: ['jizokuka']
  }
];

// 条件付き書類のガイダンス
export const conditionalDocumentGuides: DocumentGuide[] = [
  {
    id: 'business_succession_diagnosis',
    name: '事業承継診断票',
    icon: '👴',
    description: '代表者が60歳以上の場合に必要',
    location: '商工会議所・商工会、または認定支援機関',
    note: '後継者の有無や承継計画について記載',
    processingTime: '1週間程度',
    category: 'conditional',
    subsidyTypes: ['jizokuka']
  },
  {
    id: 'disaster_certificate',
    name: '被災証明書',
    icon: '🌊',
    description: '自然災害等の被災事業者の場合',
    location: '市区町村役場',
    note: '罹災証明書でも可。災害の種類により発行機関が異なる場合あり',
    processingTime: '1〜2週間',
    category: 'conditional'
  },
  {
    id: 'joint_application',
    name: '共同申請における連携体参加承諾書',
    icon: '🤝',
    description: '複数事業者での共同申請の場合',
    location: '各参加事業者で作成',
    note: '全参加事業者の押印が必要',
    category: 'conditional',
    subsidyTypes: ['it-donyu', 'jizokuka']
  }
];

// すべての書類ガイドを統合
export const allDocumentGuides = [
  ...commonDocumentGuides,
  ...itDonyuDocumentGuides,
  ...monozukuriDocumentGuides,
  ...jizokukaDocumentGuides,
  ...conditionalDocumentGuides
];

// 補助金タイプ別に書類を取得
export const getDocumentGuidesBySubsidyType = (subsidyType: string): DocumentGuide[] => {
  const guides: DocumentGuide[] = [...commonDocumentGuides];
  
  switch (subsidyType) {
    case 'it-donyu':
      guides.push(...itDonyuDocumentGuides.filter(d => !d.subsidyTypes || d.subsidyTypes.includes('it-donyu')));
      break;
    case 'monozukuri':
      guides.push(...monozukuriDocumentGuides.filter(d => !d.subsidyTypes || d.subsidyTypes.includes('monozukuri')));
      break;
    case 'jizokuka':
      guides.push(...jizokukaDocumentGuides.filter(d => !d.subsidyTypes || d.subsidyTypes.includes('jizokuka')));
      break;
  }
  
  // 条件付き書類も追加（該当する補助金タイプのみ）
  guides.push(...conditionalDocumentGuides.filter(d => 
    !d.subsidyTypes || d.subsidyTypes.includes(subsidyType)
  ));
  
  return guides;
};