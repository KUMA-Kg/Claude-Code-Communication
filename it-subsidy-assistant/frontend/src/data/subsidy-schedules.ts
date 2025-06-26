// 補助金のスケジュール情報

export interface Milestone {
  id: string;
  title: string;
  description: string;
  daysBeforeDeadline: number;
  icon: string;
  type: 'preparation' | 'submission' | 'review';
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  link?: string;
  linkText?: string;
}

export interface ApplicationLink {
  title: string;
  url: string;
  description: string;
  isPrimary?: boolean;
}

export interface SubsidySchedule {
  deadline: string;
  preparationDays: number;
  milestones: Milestone[];
  nextActions: NextAction[];
  applicationLinks: ApplicationLink[];
}

export const subsidySchedules: Record<string, SubsidySchedule> = {
  'it-donyu': {
    deadline: '2025-07-18',
    preparationDays: 30,
    milestones: [
      {
        id: 'gbiz-id',
        title: 'gBizIDプライム取得',
        description: '申請に2-3週間かかるため早めに準備',
        daysBeforeDeadline: 30,
        icon: '🔐',
        type: 'preparation'
      },
      {
        id: 'security-action',
        title: 'SECURITY ACTION宣言',
        description: 'オンラインで即日完了可能',
        daysBeforeDeadline: 21,
        icon: '🛡️',
        type: 'preparation'
      },
      {
        id: 'vendor-selection',
        title: 'IT導入支援事業者選定',
        description: '複数社と相談して最適な事業者を選定',
        daysBeforeDeadline: 14,
        icon: '🤝',
        type: 'preparation'
      },
      {
        id: 'application-draft',
        title: '申請書作成',
        description: '事業計画を具体的に記載',
        daysBeforeDeadline: 7,
        icon: '📝',
        type: 'submission'
      },
      {
        id: 'final-check',
        title: '最終確認・申請',
        description: '書類の最終チェックと電子申請',
        daysBeforeDeadline: 1,
        icon: '✅',
        type: 'submission'
      }
    ],
    nextActions: [
      {
        id: 'create-gbizid',
        title: 'gBizIDプライムアカウントを作成',
        description: '電子申請に必須のアカウントです。印鑑証明書が必要です。',
        icon: '🔐',
        link: 'https://gbiz-id.go.jp/',
        linkText: 'gBizIDサイトへ'
      },
      {
        id: 'select-vendor',
        title: 'IT導入支援事業者を探す',
        description: '認定事業者の中から、導入したいITツールを提供している事業者を選びます。',
        icon: '🔍',
        link: 'https://www.it-hojo.jp/vendor/',
        linkText: '事業者検索へ'
      },
      {
        id: 'prepare-plan',
        title: '事業計画を準備',
        description: '導入するITツールでどのように生産性を向上させるか具体的に計画します。',
        icon: '📋'
      },
      {
        id: 'submit-application',
        title: 'jGrantsで電子申請',
        description: '全ての書類が揃ったら、jGrantsで申請を行います。',
        icon: '💻',
        link: 'https://www.jgrants-portal.go.jp/',
        linkText: 'jGrantsへ'
      }
    ],
    applicationLinks: [
      {
        title: 'jGrants（電子申請システム）',
        url: 'https://www.jgrants-portal.go.jp/',
        description: 'IT導入補助金の申請はこちらから',
        isPrimary: true
      },
      {
        title: 'IT導入補助金公式サイト',
        url: 'https://www.it-hojo.jp/',
        description: '最新情報・公募要領はこちら'
      },
      {
        title: 'IT導入支援事業者・ITツール検索',
        url: 'https://www.it-hojo.jp/vendor/',
        description: '認定事業者とITツールを検索'
      },
      {
        title: 'よくある質問（FAQ）',
        url: 'https://www.it-hojo.jp/faq/',
        description: '申請に関する疑問はこちら'
      }
    ]
  },
  'monozukuri': {
    deadline: '2025-07-25',
    preparationDays: 45,
    milestones: [
      {
        id: 'support-organization',
        title: '認定支援機関に相談',
        description: '事業計画の妥当性確認と支援を受ける',
        daysBeforeDeadline: 45,
        icon: '🏆',
        type: 'preparation'
      },
      {
        id: 'business-plan',
        title: '事業計画書作成',
        description: '10ページ以内で具体的な計画を作成',
        daysBeforeDeadline: 30,
        icon: '📊',
        type: 'preparation'
      },
      {
        id: 'wage-plan',
        title: '賃金引上げ計画策定',
        description: '必須要件の賃金引上げ計画を具体化',
        daysBeforeDeadline: 21,
        icon: '💰',
        type: 'preparation'
      },
      {
        id: 'document-collection',
        title: '必要書類収集',
        description: '決算書、登記簿謄本等を準備',
        daysBeforeDeadline: 14,
        icon: '📁',
        type: 'preparation'
      },
      {
        id: 'gbizid-prime',
        title: 'gBizIDプライム取得',
        description: '電子申請用アカウントの準備',
        daysBeforeDeadline: 14,
        icon: '🔐',
        type: 'preparation'
      },
      {
        id: 'application-submit',
        title: '申請書提出',
        description: 'jGrantsで電子申請を実施',
        daysBeforeDeadline: 3,
        icon: '🚀',
        type: 'submission'
      }
    ],
    nextActions: [
      {
        id: 'find-support',
        title: '認定経営革新等支援機関を探す',
        description: '商工会議所、金融機関、税理士など、認定を受けた支援機関に相談します。',
        icon: '🏢',
        link: 'https://www.chusho.meti.go.jp/keiei/kakushin/nintei/kikan.htm',
        linkText: '認定支援機関検索'
      },
      {
        id: 'create-plan',
        title: '事業計画書を作成',
        description: '革新的な製品・サービス開発の計画を10ページ以内でまとめます。',
        icon: '📝'
      },
      {
        id: 'prepare-wage',
        title: '賃金引上げ計画を準備',
        description: '給与支給総額と事業場内最低賃金の引上げ計画を策定します。',
        icon: '📈'
      },
      {
        id: 'apply-jgrants',
        title: 'jGrantsで申請',
        description: 'gBizIDプライムでログインし、電子申請を行います。',
        icon: '💻',
        link: 'https://www.jgrants-portal.go.jp/',
        linkText: 'jGrantsへ'
      }
    ],
    applicationLinks: [
      {
        title: 'jGrants（電子申請システム）',
        url: 'https://www.jgrants-portal.go.jp/',
        description: 'ものづくり補助金の申請はこちらから',
        isPrimary: true
      },
      {
        title: 'ものづくり補助金公式サイト',
        url: 'https://portal.monodukuri-hojo.jp/',
        description: '公募要領・最新情報はこちら'
      },
      {
        title: '認定経営革新等支援機関検索',
        url: 'https://www.chusho.meti.go.jp/keiei/kakushin/nintei/kikan.htm',
        description: '支援機関を地域から検索'
      },
      {
        title: '申請サポートセンター',
        url: 'https://portal.monodukuri-hojo.jp/contact.html',
        description: '申請に関するお問い合わせ'
      }
    ]
  },
  'jizokuka': {
    deadline: '2025-06-13',
    preparationDays: 30,
    milestones: [
      {
        id: 'chamber-join',
        title: '商工会・商工会議所に入会',
        description: '会員でない場合は入会手続きを開始',
        daysBeforeDeadline: 30,
        icon: '🤝',
        type: 'preparation'
      },
      {
        id: 'consultation',
        title: '経営相談・計画相談',
        description: '商工会・商工会議所で計画作成支援を受ける',
        daysBeforeDeadline: 21,
        icon: '💭',
        type: 'preparation'
      },
      {
        id: 'plan-creation',
        title: '経営計画書作成',
        description: '販路開拓の具体的な計画を作成',
        daysBeforeDeadline: 14,
        icon: '📄',
        type: 'preparation'
      },
      {
        id: 'support-plan',
        title: '支援計画書取得',
        description: '商工会・商工会議所から支援計画書を受領',
        daysBeforeDeadline: 7,
        icon: '🏛️',
        type: 'preparation'
      },
      {
        id: 'submission',
        title: '申請書提出',
        description: '必要書類を揃えて申請',
        daysBeforeDeadline: 1,
        icon: '📮',
        type: 'submission'
      }
    ],
    nextActions: [
      {
        id: 'join-chamber',
        title: '商工会・商工会議所への入会',
        description: '会員でない場合は、まず地域の商工会・商工会議所に入会します。',
        icon: '🏢',
        link: 'https://www.shokokai.or.jp/',
        linkText: '商工会検索'
      },
      {
        id: 'get-support',
        title: '経営計画作成支援を受ける',
        description: '商工会・商工会議所の経営指導員から無料でサポートを受けられます。',
        icon: '👥'
      },
      {
        id: 'create-plan',
        title: '経営計画書・補助事業計画書を作成',
        description: '様式に従って、販路開拓の具体的な計画を記載します。',
        icon: '📝'
      },
      {
        id: 'submit-docs',
        title: '申請書類を提出',
        description: '商工会・商工会議所経由で申請書類を提出します。',
        icon: '📤'
      }
    ],
    applicationLinks: [
      {
        title: '日本商工会議所',
        url: 'https://www.jcci.or.jp/',
        description: '商工会議所の情報はこちら',
        isPrimary: true
      },
      {
        title: '全国商工会連合会',
        url: 'https://www.shokokai.or.jp/',
        description: '商工会の情報はこちら'
      },
      {
        title: '持続化補助金事務局',
        url: 'https://r3.jizokukahojokin.info/',
        description: '公募要領・様式ダウンロード'
      },
      {
        title: '申請の手引き',
        url: 'https://r3.jizokukahojokin.info/doc/r3i_tebiki.pdf',
        description: '申請書作成の詳細ガイド'
      }
    ]
  }
};