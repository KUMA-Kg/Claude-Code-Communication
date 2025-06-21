// 必要書類判定のためのフローロジック

export interface Answer {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuestionOption extends Answer {}

export interface QuestionFlow {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: QuestionOption[];
  required?: boolean;
  description?: string;
  hint?: string;
  condition?: (answers: Record<string, Answer>) => boolean;
}

export interface RequiredDocumentResult {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'common' | 'company_type' | 'frame_specific' | 'conditional' | 'optional';
  format?: string;
  notes?: string;
  reason: string;
  templateQuestions?: string[];
}

// 必要書類の判定ロジック
export const determineRequiredDocuments = (
  subsidyType: 'it_donyu' | 'monozukuri' | 'jizokuka',
  answers: Record<string, Answer>
): RequiredDocumentResult[] => {
  const documents: RequiredDocumentResult[] = [];

  // IT導入補助金の場合
  if (subsidyType === 'it_donyu') {
    // 共通書類
    documents.push({
      id: 'it_common_1',
      name: '履歴事項全部証明書',
      description: '法務局で発行される会社の登記簿謄本（3ヶ月以内）',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '全申請者に必要な基本書類',
      notes: '法務局で取得可能'
    });

    documents.push({
      id: 'it_common_2',
      name: '納税証明書（その1・その2）',
      description: '法人税、消費税、地方消費税の納税証明書',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '全申請者に必要な基本書類',
      notes: '税務署で取得可能'
    });

    documents.push({
      id: 'it_common_3',
      name: '決算書（直近2期分）',
      description: '貸借対照表、損益計算書、製造原価報告書、販売管理費明細、個別注記表',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '財務状況確認のため必要'
    });

    documents.push({
      id: 'it_common_4',
      name: '労働者名簿',
      description: '従業員の氏名、生年月日、住所等を記載した名簿',
      required: true,
      category: 'common',
      format: 'Excel/PDF',
      reason: '従業員数確認のため必要'
    });

    // 企業形態別書類
    if (answers.company_type?.value === 'corporation') {
      documents.push({
        id: 'it_corp_1',
        name: '法人税確定申告書別表一',
        description: '直近の法人税確定申告書の別表一',
        required: true,
        category: 'company_type',
        format: 'PDF',
        reason: '法人の申請に必要'
      });

      if (answers.business_years?.value === 'less_than_1' || answers.business_years?.value === '1_to_3') {
        documents.push({
          id: 'it_corp_2',
          name: '役員名簿',
          description: 'みなし大企業確認用の役員一覧',
          required: true,
          category: 'company_type',
          format: 'Excel/PDF',
          reason: '創業3年未満の法人に必要'
        });
      }
    } else if (answers.company_type?.value === 'individual') {
      documents.push({
        id: 'it_ind_1',
        name: '所得税確定申告書第一表',
        description: '直近の所得税確定申告書',
        required: true,
        category: 'company_type',
        format: 'PDF',
        reason: '個人事業主の申請に必要'
      });

      documents.push({
        id: 'it_ind_2',
        name: '青色申告決算書',
        description: '直近の青色申告決算書（白色申告の場合は収支内訳書）',
        required: true,
        category: 'company_type',
        format: 'PDF',
        reason: '個人事業主の財務状況確認に必要'
      });
    }

    // 申請枠別書類
    const frame = answers.application_frame?.value;
    
    if (frame === 'normal' || frame === 'digital' || frame === 'security') {
      documents.push({
        id: 'it_frame_1',
        name: '実施内容説明書',
        description: 'ITツールの導入内容と効果を説明する書類',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: `${answers.application_frame?.label}の申請に必要`,
        templateQuestions: [
          '導入するITツールの詳細',
          '現在の業務課題',
          '期待される効果',
          '利用予定ユーザー数'
        ]
      });

      documents.push({
        id: 'it_frame_2',
        name: '価格説明書',
        description: 'ITツールの価格詳細を説明する書類',
        required: true,
        category: 'frame_specific',
        format: 'Excel/PDF',
        reason: `${answers.application_frame?.label}の申請に必要`,
        templateQuestions: [
          'ツール使用料',
          '導入・設定費用',
          '保守・サポート費用',
          '補助金申請額'
        ]
      });
    }

    if (frame === 'digital') {
      documents.push({
        id: 'it_digital_1',
        name: '電子化対象業務説明書',
        description: '現在の紙業務と電子化後の業務フローを説明',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: '電子化枠の申請に必要',
        templateQuestions: [
          '電子化対象の業務プロセス',
          '現状の課題',
          '電子化による改善効果'
        ]
      });

      documents.push({
        id: 'it_digital_2',
        name: '現状業務フロー図',
        description: '電子化前の業務フローを図示した資料',
        required: true,
        category: 'frame_specific',
        format: 'PowerPoint/PDF',
        reason: '電子化枠の申請に必要'
      });
    }

    if (frame === 'security') {
      documents.push({
        id: 'it_security_1',
        name: 'セキュリティ診断結果',
        description: '現在のセキュリティ状況の診断結果',
        required: true,
        category: 'frame_specific',
        format: 'PDF',
        reason: 'セキュリティ枠の申請に必要'
      });

      documents.push({
        id: 'it_security_2',
        name: '対策計画書',
        description: 'セキュリティ強化の具体的な対策計画',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: 'セキュリティ枠の申請に必要',
        templateQuestions: [
          '実施するセキュリティ対策',
          '導入スケジュール',
          '期待される効果'
        ]
      });

      documents.push({
        id: 'it_security_3',
        name: 'SECURITY ACTION宣言書',
        description: 'IPAのSECURITY ACTION制度への参加宣言',
        required: false,
        category: 'optional',
        format: 'PDF',
        reason: '加点対象となる任意書類',
        notes: 'IPA（情報処理推進機構）のWebサイトから申請'
      });
    }

    if (frame === 'multi') {
      documents.push({
        id: 'it_multi_1',
        name: '連携体制説明書',
        description: '複数企業での連携体制と役割分担を説明',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: '複数社枠の申請に必要',
        templateQuestions: [
          '参加企業の概要',
          '各社の役割分担',
          '連携による相乗効果'
        ]
      });

      documents.push({
        id: 'it_multi_2',
        name: '各社の同意書',
        description: '連携する全企業からの参加同意書',
        required: true,
        category: 'frame_specific',
        format: 'PDF',
        reason: '複数社枠の申請に必要',
        notes: '所定様式あり'
      });

      if (answers.partner_count?.value !== '1') {
        documents.push({
          id: 'it_multi_3',
          name: '幹事社証明書',
          description: '幹事社としての役割を証明する書類',
          required: true,
          category: 'frame_specific',
          format: 'PDF',
          reason: '複数社連携の幹事社に必要'
        });
      }
    }

    // 条件付き書類
    if (answers.wage_increase?.value === 'yes') {
      documents.push({
        id: 'it_wage_1',
        name: '賃金報告書',
        description: '賃上げ計画と実施状況を報告',
        required: false,
        category: 'optional',
        format: 'Excel/PDF',
        reason: '賃上げ加点を受けるために必要',
        templateQuestions: [
          '現在の賃金水準',
          '賃上げ率と対象人数',
          '実施時期'
        ]
      });
    }

    if (answers.business_years?.value === 'less_than_1' || answers.business_years?.value === '1_to_3') {
      documents.push({
        id: 'it_startup_1',
        name: '創業計画書',
        description: '今後の事業計画と成長戦略',
        required: true,
        category: 'conditional',
        format: 'Word/PDF',
        reason: '創業3年未満の事業者に必要',
        templateQuestions: [
          '事業コンセプト',
          '市場分析',
          '3年間の成長計画'
        ]
      });
    }

  // ものづくり補助金の場合
  } else if (subsidyType === 'monozukuri') {
    // 共通書類
    documents.push({
      id: 'mono_common_1',
      name: '事業計画書',
      description: '革新的な取組みの事業計画を記載',
      required: true,
      category: 'common',
      format: 'Word/PDF',
      reason: '全申請者に必要な基本書類',
      templateQuestions: [
        '事業計画名',
        '革新性の内容',
        '競合優位性',
        '市場分析',
        '設備投資計画',
        '付加価値額の向上計画'
      ]
    });

    documents.push({
      id: 'mono_common_2',
      name: '決算書（直近2期分）',
      description: '貸借対照表、損益計算書等の財務諸表',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '財務状況確認のため必要'
    });

    documents.push({
      id: 'mono_common_3',
      name: '賃金台帳',
      description: '従業員の賃金支払い状況を示す台帳',
      required: true,
      category: 'common',
      format: 'Excel/PDF',
      reason: '賃金水準確認のため必要'
    });

    documents.push({
      id: 'mono_common_4',
      name: '労働者名簿',
      description: '従業員の詳細情報を記載した名簿',
      required: true,
      category: 'common',
      format: 'Excel/PDF',
      reason: '従業員数確認のため必要'
    });

    // 投資額による追加書類
    if (answers.investment_amount?.value === 'more_than_3000') {
      documents.push({
        id: 'mono_amount_1',
        name: '認定支援機関確認書',
        description: '認定経営革新等支援機関による事業計画の確認書',
        required: true,
        category: 'conditional',
        format: 'PDF',
        reason: '3,000万円以上の投資に必要',
        notes: '認定支援機関から取得'
      });
    }

    // 事業類型による書類
    if (answers.project_type?.value === 'service' || answers.project_type?.value === 'both') {
      documents.push({
        id: 'mono_service_1',
        name: '補助事業計画書（サービス開発）',
        description: '革新的サービスの開発計画',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: 'サービス開発の申請に必要',
        templateQuestions: [
          'サービスの概要',
          '革新性の説明',
          '顧客ニーズ分析',
          '収益モデル'
        ]
      });
    }

    if (answers.project_type?.value === 'product' || answers.project_type?.value === 'both') {
      documents.push({
        id: 'mono_product_1',
        name: '試作開発計画書',
        description: '新製品の試作開発に関する詳細計画',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: 'ものづくりの申請に必要',
        templateQuestions: [
          '開発する製品の概要',
          '技術的な革新性',
          '生産プロセス',
          '品質管理体制'
        ]
      });

      documents.push({
        id: 'mono_product_2',
        name: '技術的課題説明書',
        description: '克服すべき技術的課題と解決方法',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: 'ものづくりの申請に必要'
      });
    }

    // 見積書関連
    documents.push({
      id: 'mono_quote_1',
      name: '見積書（2社以上）',
      description: '機械装置・システム構築費の相見積もり',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '適正価格確認のため必要',
      notes: '税抜50万円以上の設備は相見積もり必須'
    });

    documents.push({
      id: 'mono_quote_2',
      name: 'カタログ・仕様書',
      description: '導入予定設備のカタログや仕様書',
      required: true,
      category: 'frame_specific',
      format: 'PDF',
      reason: '設備の詳細確認のため必要'
    });

    // 資金調達関連
    if (answers.funding_method?.value === 'external') {
      documents.push({
        id: 'mono_fund_1',
        name: '資金調達に係る確認書',
        description: '外部資金の調達計画と返済計画',
        required: true,
        category: 'conditional',
        format: 'Word/PDF',
        reason: '外部資金調達時に必要',
        templateQuestions: [
          '調達予定額',
          '調達方法（借入/出資等）',
          '調達先',
          '返済計画'
        ]
      });
    }

  // 小規模事業者持続化補助金の場合
  } else if (subsidyType === 'jizokuka') {
    // 共通書類
    documents.push({
      id: 'jizo_common_1',
      name: '様式1（申請書）',
      description: '補助金申請の基本情報を記載',
      required: true,
      category: 'common',
      format: 'Word/PDF',
      reason: '全申請者に必要な基本書類',
      notes: '所定様式を使用'
    });

    documents.push({
      id: 'jizo_common_2',
      name: '様式2（経営計画書）',
      description: '企業概要、顧客ニーズ、競合分析等を記載',
      required: true,
      category: 'common',
      format: 'Word/PDF',
      reason: '全申請者に必要な基本書類',
      templateQuestions: [
        '企業概要',
        '顧客ニーズと市場動向',
        '自社の強み',
        '経営方針・目標と今後のプラン'
      ]
    });

    documents.push({
      id: 'jizo_common_3',
      name: '様式3（補助事業計画書）',
      description: '補助事業の内容と効果を記載',
      required: true,
      category: 'common',
      format: 'Word/PDF',
      reason: '全申請者に必要な基本書類',
      templateQuestions: [
        '補助事業の内容',
        '販路開拓等の取組内容',
        '補助事業の効果'
      ]
    });

    // 企業形態による書類
    if (answers.company_type?.value === 'corporation') {
      documents.push({
        id: 'jizo_corp_1',
        name: '貸借対照表・損益計算書',
        description: '直近1期分の決算書',
        required: true,
        category: 'company_type',
        format: 'PDF',
        reason: '法人の財務状況確認に必要'
      });

      // 従業員数チェック
      if (answers.employee_count?.value === 'more_than_20') {
        documents.push({
          id: 'jizo_corp_2',
          name: '株主名簿',
          description: 'みなし大企業に該当しないことの確認用',
          required: true,
          category: 'company_type',
          format: 'Excel/PDF',
          reason: '従業員20人超の法人に必要'
        });
      }
    } else if (answers.company_type?.value === 'individual') {
      documents.push({
        id: 'jizo_ind_1',
        name: '所得税青色申告決算書または収支内訳書',
        description: '直近の確定申告時の決算書',
        required: true,
        category: 'company_type',
        format: 'PDF',
        reason: '個人事業主の財務状況確認に必要'
      });

      if (answers.business_years?.value === 'less_than_1') {
        documents.push({
          id: 'jizo_ind_2',
          name: '開業届',
          description: '税務署に提出した開業届の控え',
          required: true,
          category: 'company_type',
          format: 'PDF',
          reason: '開業1年未満の個人事業主に必要'
        });
      }
    }

    // 申請目的による書類
    if (answers.application_purpose?.value === 'wage') {
      documents.push({
        id: 'jizo_wage_1',
        name: '様式8（賃金引上げ枠申請書）',
        description: '賃金引上げ計画を記載',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: '賃金引上げ枠の申請に必要',
        templateQuestions: [
          '現在の賃金状況',
          '賃上げ計画（率・人数）',
          '対象従業員',
          '賃上げの根拠'
        ]
      });

      documents.push({
        id: 'jizo_wage_2',
        name: '賃金台帳',
        description: '直近1ヶ月分の賃金台帳',
        required: true,
        category: 'frame_specific',
        format: 'Excel/PDF',
        reason: '現在の賃金水準確認に必要'
      });

      documents.push({
        id: 'jizo_wage_3',
        name: '労働保険料申告書',
        description: '労働保険の加入を証明する書類',
        required: false,
        category: 'optional',
        format: 'PDF',
        reason: '加点対象となる任意書類'
      });
    }

    if (answers.application_purpose?.value === 'succession') {
      documents.push({
        id: 'jizo_succ_1',
        name: '様式9（事業承継診断票）',
        description: '事業承継の準備状況を診断',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: '後継者支援枠の申請に必要',
        notes: '商工会・商工会議所で作成支援'
      });

      documents.push({
        id: 'jizo_succ_2',
        name: '後継者の経歴書',
        description: '後継予定者の経歴と事業承継計画',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: '後継者支援枠の申請に必要'
      });

      documents.push({
        id: 'jizo_succ_3',
        name: '事業承継計画書',
        description: '具体的な承継スケジュールと方法',
        required: false,
        category: 'optional',
        format: 'Word/PDF',
        reason: '加点対象となる任意書類'
      });
    }

    if (answers.application_purpose?.value === 'startup') {
      documents.push({
        id: 'jizo_start_1',
        name: '様式7（創業支援証明書）',
        description: '認定市区町村や商工会等からの創業支援証明',
        required: true,
        category: 'frame_specific',
        format: 'PDF',
        reason: '創業枠の申請に必要',
        notes: '創業支援機関から取得'
      });

      documents.push({
        id: 'jizo_start_2',
        name: '創業計画書',
        description: '創業の経緯と今後の事業計画',
        required: true,
        category: 'frame_specific',
        format: 'Word/PDF',
        reason: '創業枠の申請に必要',
        templateQuestions: [
          '創業の動機',
          '事業の独自性',
          'ターゲット市場',
          '3年間の事業計画'
        ]
      });
    }

    // 代表者年齢による書類
    if (answers.ceo_age?.value === 'over_60') {
      documents.push({
        id: 'jizo_age_1',
        name: '様式9（事業承継診断票）',
        description: '60歳以上の代表者は事業承継診断が必要',
        required: true,
        category: 'conditional',
        format: 'Word/PDF',
        reason: '代表者が60歳以上のため必要',
        templateQuestions: [
          '事業承継の予定',
          '後継者の有無',
          '承継準備状況',
          '承継支援の必要性'
        ]
      });
    }

    // 見積書
    documents.push({
      id: 'jizo_quote_1',
      name: '見積書',
      description: '補助対象経費の見積書（税抜10万円以上）',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '経費の妥当性確認に必要',
      notes: '複数の見積もりがある場合は全て提出'
    });

    // 支援機関書類
    documents.push({
      id: 'jizo_support_1',
      name: '様式6（支援機関確認書）',
      description: '商工会・商工会議所からの事業支援計画書',
      required: true,
      category: 'common',
      format: 'PDF',
      reason: '支援機関の確認が必要',
      notes: '地域の商工会・商工会議所で作成'
    });

    // 任意書類
    if (answers.employee_count?.value !== '0') {
      documents.push({
        id: 'jizo_opt_1',
        name: '従業員名簿',
        description: '従業員数を証明する名簿',
        required: false,
        category: 'optional',
        format: 'Excel/PDF',
        reason: '従業員数の証明（任意）'
      });
    }
  }

  return documents;
};