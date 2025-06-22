// IT導入補助金2025の詳細な必要書類リスト

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

export const itDonyuDocumentCategories: DocumentCategory[] = [
  {
    id: 'A',
    name: 'A. 申請基本書類',
    description: '全申請者が提出必須の基本申請書類',
    documents: [
      {
        id: 'A1',
        name: '交付申請書',
        format: 'online',
        required: true,
        description: 'IT導入補助金の電子申請システムで作成・提出',
        notes: 'gBizIDプライムアカウントが必須。事前に取得が必要'
      },
      {
        id: 'A2',
        name: '事業計画書',
        format: 'word/pdf',
        required: true,
        description: '導入するITツールの活用による生産性向上計画',
        notes: '3年間の数値目標（労働生産性向上率等）の記載が必須'
      },
      {
        id: 'A3',
        name: '宣誓書',
        format: 'pdf',
        required: true,
        description: '補助金交付規程の遵守等を宣誓',
        notes: '代表者の自署または記名押印が必要'
      },
      {
        id: 'A4',
        name: '法人/個人確認書類',
        format: 'pdf',
        required: true,
        description: '法人：履歴事項全部証明書、個人：本人確認書類',
        notes: '発行から3ヶ月以内のもの'
      }
    ]
  },
  {
    id: 'B',
    name: 'B. 財務関係書類',
    description: '事業者の財務状況を証明する書類',
    documents: [
      {
        id: 'B1',
        name: '直近2期分の決算書',
        format: 'pdf',
        required: true,
        description: '貸借対照表、損益計算書、販売費及び一般管理費内訳書等',
        notes: '税務署の受付印または電子申告の受信通知が必要'
      },
      {
        id: 'B2',
        name: '納税証明書',
        format: 'pdf',
        required: true,
        description: '法人税・消費税の納税証明書（その1）',
        notes: '直近の事業年度のもの。税務署で発行'
      },
      {
        id: 'B3',
        name: '労働保険料納付証明書',
        format: 'pdf',
        required: false,
        description: '労働保険料の未納がないことの証明',
        notes: '従業員を雇用している場合は提出推奨'
      }
    ]
  },
  {
    id: 'C',
    name: 'C. ITツール関連',
    description: 'IT導入支援事業者とITツールに関する書類',
    documents: [
      {
        id: 'C1',
        name: 'IT導入支援事業者との共同事業体契約書',
        format: 'pdf',
        required: true,
        description: 'IT導入支援事業者との契約関係を証明',
        notes: '事前にIT導入支援事業者の選定が必要'
      },
      {
        id: 'C2',
        name: 'ITツール見積書',
        format: 'pdf',
        required: true,
        description: '導入予定のITツールの詳細見積',
        notes: 'IT導入支援事業者が作成。ツール名・機能・価格の明記が必要'
      },
      {
        id: 'C3',
        name: 'ITツール機能要件適合証明書',
        format: 'pdf',
        required: true,
        description: '補助対象となる機能要件を満たすことの証明',
        notes: 'IT導入支援事業者が作成'
      },
      {
        id: 'C4',
        name: '導入計画書',
        format: 'word',
        required: true,
        description: 'ITツールの導入スケジュールと体制',
        notes: '導入後のサポート体制も明記'
      }
    ]
  },
  {
    id: 'D',
    name: 'D. 加点項目書類',
    description: '審査時に加点となる可能性がある追加書類',
    documents: [
      {
        id: 'D1',
        name: '事業継続力強化計画認定書',
        format: 'pdf',
        required: false,
        description: '経済産業大臣の認定を受けた計画書',
        notes: '加点対象。BCP策定の証明'
      },
      {
        id: 'D2',
        name: 'サイバーセキュリティお助け隊サービス利用証明',
        format: 'pdf',
        required: false,
        description: 'IPA推奨のセキュリティサービス利用証明',
        notes: '加点対象。セキュリティ対策の実施証明'
      },
      {
        id: 'D3',
        name: '賃上げ計画表明書',
        format: 'word',
        required: false,
        description: '事業計画期間中の賃上げ計画',
        notes: '加点対象。給与支給総額または最低賃金の引上げ表明'
      },
      {
        id: 'D4',
        name: '女性活躍推進法に基づく認定証',
        format: 'pdf',
        required: false,
        description: 'えるぼし認定、くるみん認定等',
        notes: '加点対象。働きやすい職場環境の証明'
      }
    ]
  },
  {
    id: 'E',
    name: 'E. 枠別必要書類',
    description: '申請枠によって異なる追加書類',
    documents: [
      {
        id: 'E1',
        name: 'デジタル化基盤導入枠 追加書類',
        format: 'various',
        required: false,
        description: 'インボイス対応、電子帳簿保存法対応の証明等',
        notes: 'デジタル化基盤導入枠で申請する場合は必須'
      },
      {
        id: 'E2',
        name: 'セキュリティ対策推進枠 追加書類',
        format: 'pdf',
        required: false,
        description: 'セキュリティ診断結果、対策計画書等',
        notes: 'セキュリティ対策推進枠で申請する場合は必須'
      },
      {
        id: 'E3',
        name: '複数社連携IT導入枠 追加書類',
        format: 'pdf',
        required: false,
        description: '連携体構成員一覧、連携協定書等',
        notes: '複数社連携で申請する場合は必須'
      }
    ]
  },
  {
    id: 'F',
    name: 'F. その他状況別書類',
    description: '特定の状況に該当する事業者が提出する書類',
    documents: [
      {
        id: 'F1',
        name: '創業2年未満の場合の追加書類',
        format: 'pdf',
        required: false,
        description: '創業計画書、資金計画書等',
        notes: '決算書が2期分ない場合に提出'
      },
      {
        id: 'F2',
        name: '事業承継・引継ぎを行った場合',
        format: 'pdf',
        required: false,
        description: '事業承継計画書、承継の事実を証明する書類',
        notes: '過去3年以内に事業承継を行った場合'
      },
      {
        id: 'F3',
        name: '被災事業者の場合',
        format: 'pdf',
        required: false,
        description: '罹災証明書、被災状況説明書',
        notes: '自然災害による被災事業者の特例措置適用時'
      }
    ]
  }
];

// 書類チェックリスト生成用のヘルパー関数
export function generateItDonyuChecklist(selectedCategories: string[] = ['A', 'B', 'C']): Document[] {
  const checklist: Document[] = [];
  
  itDonyuDocumentCategories.forEach(category => {
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

// 申請枠別の必要書類カテゴリ
export const itDonyuApplicationTypeCategories = {
  '通常枠': ['A', 'B', 'C'],
  'デジタル化基盤導入枠': ['A', 'B', 'C', 'E'],
  'セキュリティ対策推進枠': ['A', 'B', 'C', 'E'],
  '複数社連携IT導入枠': ['A', 'B', 'C', 'E']
};