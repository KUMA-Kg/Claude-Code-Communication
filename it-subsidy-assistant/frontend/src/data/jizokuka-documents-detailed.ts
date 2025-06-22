// 小規模事業者持続化補助金の詳細な必要書類リスト

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

export const jizokukaDocumentCategories: DocumentCategory[] = [
  {
    id: 'A',
    name: 'A. 申請様式（必須）',
    description: '全申請者が提出必須の基本様式',
    documents: [
      {
        id: 'A1',
        name: '様式1 小規模事業者持続化補助金事業に係る申請書',
        format: 'word',
        required: true,
        description: '申請の意思表示と基本情報を記載',
        notes: '商工会議所・商工会の確認印が必要'
      },
      {
        id: 'A2',
        name: '様式2 経営計画書',
        format: 'word',
        required: true,
        description: '企業概要、顧客ニーズと市場動向、自社の強み等を記載',
        notes: '4ページ以内（A4サイズ）が目安'
      },
      {
        id: 'A3',
        name: '様式3 補助事業計画書',
        format: 'word',
        required: true,
        description: '販路開拓等の取組内容、業務効率化の取組内容等を記載',
        notes: '6ページ以内（A4サイズ）が目安'
      },
      {
        id: 'A4',
        name: '様式4 補助金交付申請書',
        format: 'word',
        required: true,
        description: '補助対象経費の内訳、資金調達方法等を記載',
        notes: '経費の積算根拠を明確に記載'
      }
    ]
  },
  {
    id: 'B',
    name: 'B. 現況確認資料',
    description: '事業者の現況を証明する書類',
    documents: [
      {
        id: 'B1',
        name: '直近の確定申告書（写し）',
        format: 'pdf',
        required: true,
        description: '法人：決算書一式、個人：確定申告書第一表・第二表',
        notes: '税務署の受付印があるもの。e-Taxの場合は受信通知'
      },
      {
        id: 'B2',
        name: '履歴事項全部証明書（法人のみ）',
        format: 'pdf',
        required: true,
        description: '法人登記の証明書',
        notes: '申請日から3ヶ月以内に発行されたもの'
      },
      {
        id: 'B3',
        name: '開業届（個人事業主で創業1年未満）',
        format: 'pdf',
        required: false,
        description: '税務署に提出した開業届の控え',
        notes: '創業から1年未満で確定申告書がない場合に提出'
      }
    ]
  },
  {
    id: 'C',
    name: 'C. 見積・価格関係',
    description: '補助対象経費の根拠となる書類',
    documents: [
      {
        id: 'C1',
        name: '見積書（税抜50万円以上の経費）',
        format: 'pdf',
        required: true,
        description: '機械装置、広報費、展示会出展費等の見積書',
        notes: '原則として2社以上の相見積もりが必要'
      },
      {
        id: 'C2',
        name: 'カタログ・仕様書',
        format: 'pdf',
        required: false,
        description: '購入予定の機器・サービスの詳細',
        notes: '機械装置等を購入する場合は必須'
      },
      {
        id: 'C3',
        name: '図面・レイアウト図',
        format: 'pdf',
        required: false,
        description: '店舗改装、看板設置等の場合',
        notes: '外装・内装工事を行う場合は必須'
      }
    ]
  },
  {
    id: 'D',
    name: 'D. 商工会議所・商工会関係',
    description: '地域の商工会議所・商工会との連携書類',
    documents: [
      {
        id: 'D1',
        name: '事業支援計画書（様式6）',
        format: 'word',
        required: true,
        description: '商工会議所・商工会が作成する支援計画',
        notes: '申請前に商工会議所・商工会での相談が必須'
      },
      {
        id: 'D2',
        name: '商工会議所・商工会の会員証明',
        format: 'pdf',
        required: false,
        description: '会員の場合は会員証のコピー',
        notes: '非会員でも申請可能だが、会員は審査で有利になる可能性'
      }
    ]
  },
  {
    id: 'E',
    name: 'E. 加点要素書類',
    description: '審査時に加点となる可能性がある書類',
    documents: [
      {
        id: 'E1',
        name: '事業継続力強化計画認定書',
        format: 'pdf',
        required: false,
        description: '経済産業大臣の認定を受けた計画書',
        notes: '加点項目。BCP策定の証明'
      },
      {
        id: 'E2',
        name: '経営力向上計画認定書',
        format: 'pdf',
        required: false,
        description: '主務大臣の認定を受けた計画書',
        notes: '加点項目。経営力向上の取組証明'
      },
      {
        id: 'E3',
        name: '地域未来牽引企業選定証',
        format: 'pdf',
        required: false,
        description: '経済産業省の選定証',
        notes: '加点項目。地域経済への貢献度証明'
      },
      {
        id: 'E4',
        name: '賃金引上げ表明書（様式7）',
        format: 'word',
        required: false,
        description: '従業員の賃金引上げを表明',
        notes: '加点項目。事業場内最低賃金引上げ'
      }
    ]
  },
  {
    id: 'F',
    name: 'F. 特定事業者向け',
    description: '特定の条件に該当する事業者のみ提出',
    documents: [
      {
        id: 'F1',
        name: '創業計画書（創業枠申請者）',
        format: 'word',
        required: false,
        description: '創業して間もない事業者向けの詳細計画',
        notes: '創業枠で申請する場合は必須'
      },
      {
        id: 'F2',
        name: '事業承継診断書（事業承継枠）',
        format: 'pdf',
        required: false,
        description: '事業承継の状況を証明する書類',
        notes: '事業承継枠で申請する場合は必須'
      },
      {
        id: 'F3',
        name: '災害証明書（災害枠）',
        format: 'pdf',
        required: false,
        description: '自然災害による被害証明',
        notes: '災害枠で申請する場合は必須'
      },
      {
        id: 'F4',
        name: '共同事業に関する協定書',
        format: 'pdf',
        required: false,
        description: '複数事業者での共同申請の場合',
        notes: '共同申請の場合は各事業者の書類も必要'
      }
    ]
  }
];

// 書類チェックリスト生成用のヘルパー関数
export function generateJizokukaChecklist(selectedCategories: string[] = ['A', 'B', 'C', 'D']): Document[] {
  const checklist: Document[] = [];
  
  jizokukaDocumentCategories.forEach(category => {
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
export const jizokukaApplicationTypeCategories = {
  '一般型': ['A', 'B', 'C', 'D'],
  '創業枠': ['A', 'B', 'C', 'D', 'F'],
  '事業承継枠': ['A', 'B', 'C', 'D', 'F'],
  '災害枠': ['A', 'B', 'C', 'D', 'F']
};