// 補助金ごとの必要書類定義

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: string;
  format?: string;
  notes?: string;
  examples?: string[];
}

export const requiredDocuments: Record<string, RequiredDocument[]> = {
  'it-donyu': [
    // A. 申請基本書類
    {
      id: 'A1',
      name: '交付申請書',
      description: 'IT導入補助金の電子申請システムで作成・提出',
      required: true,
      category: 'application',
      format: 'online',
      notes: 'gBizIDプライムアカウントが必須。事前に取得が必要'
    },
    {
      id: 'A2',
      name: '事業計画書',
      description: '導入するITツールの活用による生産性向上計画',
      required: true,
      category: 'project',
      format: 'word/pdf',
      notes: '3年間の数値目標（労働生産性向上率等）の記載が必須'
    },
    {
      id: 'A3',
      name: '宣誓書',
      description: '補助金交付規程の遵守等を宣誓',
      required: true,
      category: 'other',
      format: 'pdf',
      notes: '代表者の自署または記名押印が必要'
    },
    {
      id: 'A4',
      name: '法人/個人確認書類',
      description: '法人：履歴事項全部証明書、個人：本人確認書類',
      required: true,
      category: 'company',
      format: 'pdf',
      notes: '発行から3ヶ月以内のもの'
    },
    // B. 財務関係書類
    {
      id: 'B1',
      name: '決算書（直近2期分）',
      description: '貸借対照表、損益計算書、販売費及び一般管理費内訳書等',
      required: true,
      category: 'financial',
      format: 'pdf',
      notes: '税務署の受付印または電子申告の受信通知が必要'
    },
    {
      id: 'B2',
      name: '納税証明書',
      description: '法人税・消費税の納税証明書（その1）',
      required: true,
      category: 'financial',
      format: 'pdf',
      notes: '直近の事業年度のもの。税務署で発行'
    },
    // C. ITツール関連
    {
      id: 'C1',
      name: 'IT導入支援事業者との共同事業体契約書',
      description: 'IT導入支援事業者との契約関係を証明',
      required: true,
      category: 'project',
      format: 'pdf',
      notes: '事前にIT導入支援事業者の選定が必要'
    },
    {
      id: 'C2',
      name: 'ITツール見積書',
      description: '導入予定のITツールの詳細見積',
      required: true,
      category: 'quotation',
      format: 'pdf',
      notes: 'IT導入支援事業者が作成。ツール名・機能・価格の明記が必要'
    },
    {
      id: 'C3',
      name: 'ITツール機能要件適合証明書',
      description: '補助対象となる機能要件を満たすことの証明',
      required: true,
      category: 'project',
      format: 'pdf',
      notes: 'IT導入支援事業者が作成'
    },
    {
      id: 'C4',
      name: '導入計画書',
      description: 'ITツールの導入スケジュールと体制',
      required: true,
      category: 'project',
      format: 'word',
      notes: '導入後のサポート体制も明記'
    }
  ],
  
  'monozukuri': [
    // A. 事業計画関連
    {
      id: 'A1',
      name: '事業計画書（システム入力＋別紙Word）',
      description: '採択審査の評価対象。記載要領は公募要領別紙を参照',
      required: true,
      category: 'project',
      format: 'word',
      notes: '10ページ程度で具体的に記載'
    },
    // B. 誓約・加点様式
    {
      id: 'B1',
      name: '補助対象経費誓約書【様式1】',
      description: '補助対象経費の適正な申請を誓約',
      required: true,
      category: 'other',
      format: 'word',
      notes: '公募要領の様式を使用'
    },
    {
      id: 'B2',
      name: '賃金引上げ計画の誓約書【様式2】',
      description: '地域別最低賃金＋30円以上等を誓約',
      required: true,
      category: 'other',
      format: 'word',
      notes: '必須要件。未達成時は補助金返還'
    },
    // C. 現況確認資料
    {
      id: 'C1',
      name: '履歴事項全部証明書（法人）',
      description: '法務局で発行される登記簿謄本',
      required: true,
      category: 'company',
      format: 'pdf',
      notes: '3ヶ月以内に発行されたもの'
    },
    {
      id: 'C2',
      name: '直近期の決算書一式',
      description: '貸借対照表、損益計算書、製造原価報告書、販売費及び一般管理費明細書、個別注記表',
      required: true,
      category: 'financial',
      format: 'pdf',
      notes: '税務署の収受印があるもの'
    },
    {
      id: 'C3',
      name: '従業員数確認資料',
      description: '法人事業概況説明書、労働保険概算・確定保険料申告書等',
      required: true,
      category: 'company',
      format: 'pdf',
      notes: '申請時点の常勤従業員数を証明'
    },
    {
      id: 'C4',
      name: '労働者名簿',
      description: '正規雇用の従業員一覧',
      required: true,
      category: 'company',
      format: 'excel',
      notes: '雇用形態・雇用期間を明記'
    },
    // D. 見積・仕様関係
    {
      id: 'D1',
      name: '見積書（原則2社以上）',
      description: '機械装置・システム構築費等の相見積もり',
      required: true,
      category: 'quotation',
      format: 'pdf',
      notes: '単価50万円(税抜)以上は相見積もり必須'
    },
    {
      id: 'D2',
      name: 'カタログ・仕様書',
      description: '機械装置・システムの機能や性能を示す資料',
      required: true,
      category: 'quotation',
      format: 'pdf',
      notes: '該当設備の仕様が明確に分かるもの'
    },
    // E. 税・反社・資金調達
    {
      id: 'E1',
      name: '納税証明書（法人税／消費税）',
      description: '税務署発行の「その3の3」',
      required: true,
      category: 'financial',
      format: 'pdf',
      notes: '直近の納税状況を確認'
    },
    {
      id: 'E2',
      name: '暴力団排除等に関する誓約書',
      description: '反社会的勢力でないことを誓約',
      required: true,
      category: 'other',
      format: 'pdf',
      notes: '役員全員の氏名・生年月日記載'
    }
  ],
  
  'jizokuka': [
    // A. 申請様式（必須）
    {
      id: 'A1',
      name: '様式1 小規模事業者持続化補助金事業に係る申請書',
      description: '申請の意思表示と基本情報を記載',
      required: true,
      category: 'application',
      format: 'word',
      examples: [],
      notes: '商工会議所・商工会の確認印が必要'
    },
    {
      id: 'A2',
      name: '様式2 経営計画書',
      description: '企業概要、顧客ニーズと市場動向、自社の強み等を記載',
      required: true,
      category: 'application',
      format: 'word',
      examples: [],
      notes: '4ページ以内（A4サイズ）が目安'
    },
    {
      id: 'A3',
      name: '様式3 補助事業計画書',
      description: '販路開拓等の取組内容、業務効率化の取組内容等を記載',
      required: true,
      category: 'application',
      format: 'word',
      examples: [],
      notes: '6ページ以内（A4サイズ）が目安'
    },
    {
      id: 'A4',
      name: '様式4 補助金交付申請書',
      description: '補助対象経費の内訳、資金調達方法等を記載',
      required: true,
      category: 'application',
      format: 'word',
      examples: [],
      notes: '経費の積算根拠を明確に記載'
    },
    // B. 現況確認資料
    {
      id: 'B1',
      name: '直近の確定申告書（写し）',
      description: '法人：決算書一式、個人：確定申告書第一表・第二表',
      required: true,
      category: 'financial',
      format: 'pdf',
      examples: [],
      notes: '税務署の受付印があるもの。e-Taxの場合は受信通知'
    },
    {
      id: 'B2',
      name: '履歴事項全部証明書（法人のみ）',
      description: '法人登記の証明書',
      required: false,
      category: 'corporate',
      format: 'pdf',
      examples: [],
      notes: '申請日から3ヶ月以内に発行されたもの'
    },
    // D. 商工会議所・商工会関係
    {
      id: 'D1',
      name: '事業支援計画書（様式6）',
      description: '商工会議所・商工会が作成する支援計画',
      required: true,
      category: 'support',
      format: 'word',
      examples: [],
      notes: '申請前に商工会議所・商工会での相談が必須'
    },
    // C. 見積・価格関係（条件付き）
    {
      id: 'C1',
      name: '見積書（税抜50万円以上の経費）',
      description: '機械装置、広報費、展示会出展費等の見積書',
      required: false,
      category: 'quotation',
      format: 'pdf',
      examples: [],
      notes: '原則として2社以上の相見積もりが必要'
    },
    {
      id: 'C2',
      name: 'カタログ・仕様書',
      description: '機械装置等の性能が確認できる資料',
      required: false,
      category: 'quotation',
      format: 'pdf',
      examples: [],
      notes: '機械装置等を購入する場合に必要'
    },
    {
      id: 'C3',
      name: '図面・レイアウト図',
      description: '店舗改装等の内容が確認できる資料',
      required: false,
      category: 'quotation',
      format: 'pdf',
      examples: [],
      notes: '店舗改装・レイアウト変更を行う場合に必要'
    },
    // E. 加点要素書類（任意）
    {
      id: 'E1',
      name: '事業継続力強化計画認定書',
      description: '経済産業大臣の認定を受けた計画書',
      required: false,
      category: 'other',
      format: 'pdf',
      examples: [],
      notes: '加点項目（任意提出）'
    },
    {
      id: 'E4',
      name: '賃金引上げ表明書（様式7）',
      description: '賃金引上げを表明する書類',
      required: false,
      category: 'other',
      format: 'word',
      examples: [],
      notes: '加点項目（任意提出）'
    },
    // F. 申請枠別の追加書類
    {
      id: 'F1',
      name: '創業計画書（創業枠申請者）',
      description: '創業枠で申請する場合の事業計画',
      required: false,
      category: 'other',
      format: 'word',
      examples: [],
      notes: '創業枠申請時のみ必要'
    },
    {
      id: 'F2',
      name: '事業承継診断書（事業承継枠）',
      description: '事業承継枠で申請する場合の診断書',
      required: false,
      category: 'other',
      format: 'pdf',
      examples: [],
      notes: '事業承継枠申請時のみ必要'
    },
    {
      id: 'F3',
      name: '災害証明書（災害枠）',
      description: '災害枠で申請する場合の被災証明',
      required: false,
      category: 'other',
      format: 'pdf',
      examples: [],
      notes: '災害枠申請時のみ必要'
    },
    {
      id: 'B3',
      name: '開業届（個人事業主で創業1年未満）',
      description: '税務署に提出した開業届の控え',
      required: false,
      category: 'corporate',
      format: 'pdf',
      examples: [],
      notes: '個人事業主で創業1年未満の場合に必要'
    },
    {
      id: 'D2',
      name: '商工会議所・商工会の会員証明',
      description: '会員であることを証明する書類',
      required: false,
      category: 'support',
      format: 'pdf',
      examples: [],
      notes: '会員の場合は加点要素'
    }
  ]
};

// カテゴリ名の日本語マッピング
export const documentCategoryLabels: Record<string, string> = {
  company: '会社関連書類',
  financial: '財務関連書類',
  project: '事業計画関連書類',
  other: 'その他の書類',
  application: '申請様式',
  corporate: '法人関連書類',
  support: '支援機関関連書類',
  quotation: '見積・価格関係書類'
};