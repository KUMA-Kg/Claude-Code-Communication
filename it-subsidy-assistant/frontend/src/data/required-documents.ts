// 補助金ごとの必要書類定義

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'company' | 'financial' | 'project' | 'other';
  format?: string;
  notes?: string;
}

export const requiredDocuments: Record<string, RequiredDocument[]> = {
  'it-donyu': [
    // 会社関連書類
    {
      id: 'it-1',
      name: '履歴事項全部証明書',
      description: '法務局で発行される会社の登記簿謄本（3ヶ月以内）',
      required: true,
      category: 'company',
      format: 'PDF',
      notes: '法務局で取得可能'
    },
    {
      id: 'it-2',
      name: '決算書（直近2期分）',
      description: '貸借対照表、損益計算書、製造原価報告書、販売管理費明細、個別注記表',
      required: true,
      category: 'financial',
      format: 'PDF'
    },
    {
      id: 'it-3',
      name: '納税証明書',
      description: '法人税、消費税、地方消費税の納税証明書',
      required: true,
      category: 'financial',
      format: 'PDF',
      notes: '税務署で取得可能'
    },
    // プロジェクト関連書類
    {
      id: 'it-4',
      name: 'IT導入計画書',
      description: '導入するITツール・システムの詳細計画',
      required: true,
      category: 'project',
      format: 'Word/PDF'
    },
    {
      id: 'it-5',
      name: '見積書',
      description: 'IT導入支援事業者からの見積書',
      required: true,
      category: 'project',
      format: 'PDF',
      notes: 'IT導入支援事業者から取得'
    },
    {
      id: 'it-6',
      name: '事業計画書',
      description: '3年間の事業計画と収支計画',
      required: true,
      category: 'project',
      format: 'Excel/PDF'
    },
    {
      id: 'it-7',
      name: '労働生産性向上計画',
      description: 'IT導入による労働生産性向上の具体的計画',
      required: true,
      category: 'project',
      format: 'Word/PDF'
    },
    // その他
    {
      id: 'it-8',
      name: '誓約書',
      description: '補助金申請に関する誓約書',
      required: true,
      category: 'other',
      format: 'PDF',
      notes: '所定様式あり'
    }
  ],
  
  'monozukuri': [
    // 会社関連書類
    {
      id: 'mono-1',
      name: '履歴事項全部証明書',
      description: '法務局で発行される会社の登記簿謄本（3ヶ月以内）',
      required: true,
      category: 'company',
      format: 'PDF'
    },
    {
      id: 'mono-2',
      name: '決算書（直近2期分）',
      description: '貸借対照表、損益計算書、製造原価報告書、販売管理費明細、個別注記表',
      required: true,
      category: 'financial',
      format: 'PDF'
    },
    {
      id: 'mono-3',
      name: '納税証明書',
      description: '法人税、消費税、地方消費税の納税証明書',
      required: true,
      category: 'financial',
      format: 'PDF'
    },
    // プロジェクト関連書類
    {
      id: 'mono-4',
      name: '事業計画書',
      description: '革新的な製品・サービス開発の詳細計画',
      required: true,
      category: 'project',
      format: 'Word/PDF'
    },
    {
      id: 'mono-5',
      name: '技術導入計画書',
      description: '導入する設備・技術の詳細と革新性の説明',
      required: true,
      category: 'project',
      format: 'Word/PDF'
    },
    {
      id: 'mono-6',
      name: '見積書（設備・システム）',
      description: '機械装置・システム構築費の見積書（2社以上）',
      required: true,
      category: 'project',
      format: 'PDF',
      notes: '相見積もり必須'
    },
    {
      id: 'mono-7',
      name: '収益計画書',
      description: '5年間の収益計画と投資回収計画',
      required: true,
      category: 'project',
      format: 'Excel/PDF'
    },
    {
      id: 'mono-8',
      name: '付加価値向上計画',
      description: '付加価値額・労働生産性の向上計画',
      required: true,
      category: 'project',
      format: 'Word/PDF'
    },
    // その他
    {
      id: 'mono-9',
      name: '認定支援機関確認書',
      description: '認定経営革新等支援機関による確認書',
      required: true,
      category: 'other',
      format: 'PDF',
      notes: '認定支援機関から取得'
    },
    {
      id: 'mono-10',
      name: '賃金引上げ計画表',
      description: '事業場内最低賃金の引上げ計画（該当者のみ）',
      required: false,
      category: 'other',
      format: 'Excel/PDF'
    }
  ],
  
  'jizokuka': [
    // 会社関連書類
    {
      id: 'jizo-1',
      name: '開業届または履歴事項全部証明書',
      description: '個人事業主は開業届、法人は登記簿謄本',
      required: true,
      category: 'company',
      format: 'PDF'
    },
    {
      id: 'jizo-2',
      name: '確定申告書（直近分）',
      description: '個人事業主は所得税、法人は法人税の確定申告書',
      required: true,
      category: 'financial',
      format: 'PDF'
    },
    {
      id: 'jizo-3',
      name: '納税証明書',
      description: '所得税または法人税の納税証明書',
      required: true,
      category: 'financial',
      format: 'PDF'
    },
    // プロジェクト関連書類
    {
      id: 'jizo-4',
      name: '経営計画書',
      description: '補助事業の具体的内容と実施方法',
      required: true,
      category: 'project',
      format: 'Word/PDF',
      notes: '様式4使用'
    },
    {
      id: 'jizo-5',
      name: '補助事業計画書',
      description: '販路開拓等の取組内容と効果',
      required: true,
      category: 'project',
      format: 'Word/PDF',
      notes: '様式2使用'
    },
    {
      id: 'jizo-6',
      name: '見積書',
      description: '補助対象経費の見積書（税抜10万円以上）',
      required: true,
      category: 'project',
      format: 'PDF'
    },
    {
      id: 'jizo-7',
      name: '売上高等の推移表',
      description: '直近3年間の売上高・営業利益の推移',
      required: true,
      category: 'financial',
      format: 'Excel/PDF'
    },
    // その他
    {
      id: 'jizo-8',
      name: '商工会・商工会議所の推薦書',
      description: '地域の商工会等からの事業支援計画書',
      required: true,
      category: 'other',
      format: 'PDF',
      notes: '商工会等で作成'
    },
    {
      id: 'jizo-9',
      name: '従業員名簿',
      description: '従業員数を証明する書類',
      required: false,
      category: 'other',
      format: 'Excel/PDF'
    }
  ]
};

// カテゴリ名の日本語マッピング
export const documentCategoryLabels: Record<string, string> = {
  company: '会社関連書類',
  financial: '財務関連書類',
  project: '事業計画関連書類',
  other: 'その他の書類'
};