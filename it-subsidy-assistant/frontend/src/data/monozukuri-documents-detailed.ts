// ものづくり補助金の詳細な必要書類リスト

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  format: string;
  required: boolean;
  description?: string;
  notes?: string;
  downloadUrl?: string;
  category?: string;
}

export const monozukuriDocumentCategories: DocumentCategory[] = [
  {
    id: 'A',
    name: 'A. 事業計画関連',
    description: '採択審査の評価対象となる重要書類',
    documents: [
      {
        id: 'A1',
        name: '事業計画書（システム入力＋別紙Word）',
        format: 'word',
        required: true,
        description: '採択審査の評価対象。記載要領は公募要領別紙を参照',
        notes: '10ページ程度で具体的に記載'
      },
      {
        id: 'A2',
        name: '会社全体の事業計画書（任意様式）',
        format: 'word/pdf',
        required: false,
        description: '会社全体の成長戦略を示す資料',
        notes: '任意提出だが加点要素となる可能性'
      },
      {
        id: 'A3',
        name: '補助事業計画書別紙',
        format: 'word/excel',
        required: false,
        description: '必要に応じて詳細説明を追加',
        notes: '図表・データなどを含む場合'
      }
    ]
  },
  {
    id: 'B',
    name: 'B. 誓約・加点様式',
    description: '必須の誓約書および加点申請用書類',
    documents: [
      {
        id: 'B1',
        name: '補助対象経費誓約書【様式1】',
        format: 'pdf',
        required: true,
        description: '補助対象経費の適正使用に関する誓約',
        notes: '電子申請画面でも同内容のチェックあり'
      },
      {
        id: 'B2',
        name: '賃金引上げ計画の誓約書【様式2】',
        format: 'pdf',
        required: true,
        description: '事業場内最低賃金の引上げ計画',
        notes: '必須要件。未達成の場合は補助金返還の可能性'
      },
      {
        id: 'B3',
        name: '大幅賃上げ計画書【様式4】',
        format: 'pdf',
        required: false,
        description: '大幅な賃上げを行う場合の計画書',
        notes: '該当者のみ。補助率アップの要件'
      },
      {
        id: 'B4',
        name: '炭素生産性向上計画書',
        format: 'pdf',
        required: false,
        description: 'グリーン枠申請時のみ必須',
        notes: 'CO2削減目標と実現方法を記載'
      }
    ]
  },
  {
    id: 'C',
    name: 'C. 現況確認資料',
    description: '企業の現況を証明する基本書類',
    documents: [
      {
        id: 'C1',
        name: '履歴事項全部証明書（法人）',
        format: 'pdf',
        required: true,
        description: '発行から3ヶ月以内のもの',
        notes: '法務局で取得。個人事業主は確定申告書第1表'
      },
      {
        id: 'C2',
        name: '直近期の決算書一式',
        format: 'pdf',
        required: true,
        description: '損益計算書・貸借対照表・注記等',
        notes: '2期分提出が望ましい'
      },
      {
        id: 'C3',
        name: '従業員数確認資料',
        format: 'pdf',
        required: true,
        description: '労働保険の保険料申告書等',
        notes: '直近のもの'
      },
      {
        id: 'C4',
        name: '労働者名簿',
        format: 'excel/pdf',
        required: true,
        description: '従業員の詳細情報一覧',
        notes: '雇用形態・入社日等を含む'
      }
    ]
  },
  {
    id: 'D',
    name: 'D. 見積・仕様関係',
    description: '補助対象経費の根拠となる重要書類',
    documents: [
      {
        id: 'D1',
        name: '見積書（原則2社以上）',
        format: 'pdf',
        required: true,
        description: '設備・システム等の見積書',
        notes: '相見積もりが原則。単価50万円以上は必須'
      },
      {
        id: 'D2',
        name: 'カタログ・仕様書',
        format: 'pdf',
        required: true,
        description: '購入予定設備の詳細仕様',
        notes: '型番・スペックが分かるもの'
      },
      {
        id: 'D3',
        name: '図面・レイアウト図',
        format: 'pdf',
        required: false,
        description: '設備配置や建物改修の場合',
        notes: '必要に応じて提出'
      }
    ]
  },
  {
    id: 'E',
    name: 'E. 税・反社・資金調達',
    description: 'コンプライアンス・資金計画関連',
    documents: [
      {
        id: 'E1',
        name: '納税証明書（法人税／消費税）',
        format: 'pdf',
        required: true,
        description: '直近の納税証明書',
        notes: '税務署で取得。未納がないことの証明'
      },
      {
        id: 'E2',
        name: '暴力団排除等に関する誓約書',
        format: 'システム入力',
        required: true,
        description: '反社会的勢力でないことの誓約',
        notes: '電子申請システム内で入力'
      },
      {
        id: 'E3',
        name: '資金調達確認書【様式5】',
        format: 'pdf',
        required: false,
        description: '借入予定がある場合に提出',
        notes: '交付決定後の減額リスクを避けるため重要'
      }
    ]
  },
  {
    id: 'F',
    name: 'F. 支援機関・枠別書類',
    description: '加点や特定枠の要件となる書類',
    documents: [
      {
        id: 'F1',
        name: '認定経営革新等支援機関確認書',
        format: 'pdf',
        required: false,
        description: '加点項目。事業計画の妥当性を確認',
        notes: '認定支援機関（商工会議所、金融機関等）が発行'
      },
      {
        id: 'F2',
        name: '成長加速マッチングサービス利用申請書',
        format: 'pdf',
        required: false,
        description: '加点項目',
        notes: '中小機構のサービス利用時'
      },
      {
        id: 'F3',
        name: 'DX推進自己診断結果',
        format: 'pdf',
        required: false,
        description: 'デジタル枠申請時は必須',
        notes: 'IPA等の診断ツール結果'
      }
    ]
  },
  {
    id: 'G',
    name: 'G. その他ケース別',
    description: '特定の条件に該当する場合の追加書類',
    documents: [
      {
        id: 'G1',
        name: '共同事業契約書',
        format: 'pdf',
        required: false,
        description: '共同申請枠の場合',
        notes: '共同事業者全員分の登記・決算書も必要'
      },
      {
        id: 'G2',
        name: '事業実施場所を示す賃貸借契約書',
        format: 'pdf',
        required: false,
        description: '賃貸物件で事業を実施する場合',
        notes: '所有物件の場合は登記簿謄本'
      },
      {
        id: 'G3',
        name: '海外展開関連書類',
        format: 'pdf',
        required: false,
        description: '輸出許可証・海外取引契約書など',
        notes: '海外展開を行う場合'
      }
    ]
  }
];

// 書類チェックリスト生成用のヘルパー関数
export function generateMonozukuriChecklist(selectedCategories: string[] = ['A', 'B', 'C', 'D', 'E']): Document[] {
  const checklist: Document[] = [];
  
  monozukuriDocumentCategories.forEach(category => {
    if (selectedCategories.includes(category.id)) {
      category.documents.forEach(doc => {
        if (doc.required) {
          checklist.push({
            ...doc,
            category: category.name
          });
        }
      });
    }
  });
  
  return checklist;
}

// 申請タイプ別の必要書類カテゴリ
export const applicationTypeCategories = {
  '通常枠': ['A', 'B', 'C', 'D', 'E'],
  'デジタル枠': ['A', 'B', 'C', 'D', 'E', 'F'],
  'グリーン枠': ['A', 'B', 'C', 'D', 'E', 'F'],
  '共同申請枠': ['A', 'B', 'C', 'D', 'E', 'G']
};