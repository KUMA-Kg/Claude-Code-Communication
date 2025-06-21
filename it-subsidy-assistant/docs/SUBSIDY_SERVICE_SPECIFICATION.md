# IT補助金アシスタントサービス仕様書

## 1. サービス概要

### 1.1 目的
中小企業・小規模事業者が最適な補助金を見つけ、申請書類を自動生成できるWebサービスを提供する。

### 1.2 主要機能
1. **アキネーター風診断** - 6つの質問で最適な補助金を判定
2. **補助金マッチング** - ユーザー情報と補助金要件の自動マッチング
3. **書類自動生成** - 正式フォーマットでの申請書類自動作成
4. **進捗管理** - 申請プロセスの可視化と管理

## 2. 技術スタック

### 2.1 フロントエンド
- **Framework**: React + TypeScript
- **State Management**: Zustand
- **UI Design**: Figma MCP連携
- **Testing**: Playwright MCP
- **Styling**: TailwindCSS + shadcn/ui

### 2.2 バックエンド
- **Runtime**: Node.js + Express
- **Database**: Supabase (MCP連携)
- **Testing**: Jest
- **API**: RESTful + WebSocket (リアルタイム更新)

### 2.3 インフラ・ツール
- **PDF生成**: jsPDF / PDFKit
- **認証**: Supabase Auth
- **ファイル管理**: Supabase Storage
- **監視**: カスタムパフォーマンスモニター

## 3. アキネーター風質問フロー（6問）

### 質問1: 事業ステータス
```typescript
{
  "question": "あなたの事業の現在の状況を教えてください",
  "options": [
    { "value": "existing", "label": "既に事業を運営している" },
    { "value": "planning", "label": "これから創業予定" },
    { "value": "startup", "label": "創業して3年以内" }
  ]
}
```

### 質問2: 従業員規模
```typescript
{
  "question": "従業員数（パート・アルバイト含む）を教えてください",
  "options": [
    { "value": "solo", "label": "1人（個人事業主）" },
    { "value": "micro", "label": "2〜5人" },
    { "value": "small", "label": "6〜20人" },
    { "value": "medium", "label": "21〜100人" },
    { "value": "large", "label": "101人以上" }
  ]
}
```

### 質問3: 業種
```typescript
{
  "question": "主な事業分野を教えてください",
  "options": [
    { "value": "manufacturing", "label": "製造業" },
    { "value": "retail", "label": "小売業" },
    { "value": "service", "label": "サービス業" },
    { "value": "it", "label": "情報通信業" },
    { "value": "construction", "label": "建設業" },
    { "value": "other", "label": "その他" }
  ]
}
```

### 質問4: 投資目的
```typescript
{
  "question": "今回の投資で実現したいことは？（最も重要なもの）",
  "options": [
    { "value": "digital", "label": "業務のデジタル化・効率化" },
    { "value": "sales", "label": "売上拡大・新規顧客開拓" },
    { "value": "product", "label": "新製品・サービス開発" },
    { "value": "facility", "label": "設備投資・生産性向上" },
    { "value": "security", "label": "セキュリティ強化" }
  ]
}
```

### 質問5: 投資予算
```typescript
{
  "question": "想定している投資予算を教えてください",
  "options": [
    { "value": "under50", "label": "50万円未満" },
    { "value": "50to100", "label": "50万円〜100万円" },
    { "value": "100to500", "label": "100万円〜500万円" },
    { "value": "500to1000", "label": "500万円〜1000万円" },
    { "value": "over1000", "label": "1000万円以上" }
  ]
}
```

### 質問6: 実施時期
```typescript
{
  "question": "いつから取り組みを開始したいですか？",
  "options": [
    { "value": "asap", "label": "すぐに開始したい（1ヶ月以内）" },
    { "value": "quarter", "label": "3ヶ月以内" },
    { "value": "half", "label": "半年以内" },
    { "value": "year", "label": "1年以内" }
  ]
}
```

## 4. 補助金マッチングロジック

### 4.1 スコアリングアルゴリズム
```typescript
interface SubsidyScore {
  itSubsidy: number;      // IT導入補助金
  monozukuri: number;     // ものづくり補助金
  jizokuka: number;       // 持続化補助金
}

function calculateScores(answers: UserAnswers): SubsidyScore {
  let scores = { itSubsidy: 0, monozukuri: 0, jizokuka: 0 };
  
  // 事業ステータスによる基礎点
  // 従業員規模による加点
  // 業種適合性による加点
  // 投資目的との整合性
  // 予算規模の適合性
  // 実施時期の緊急度
  
  return scores;
}
```

### 4.2 適合度判定
- **高適合**: 70点以上
- **中適合**: 50点以上
- **低適合**: 30点以上
- **不適合**: 30点未満

## 5. 書類自動生成機能

### 5.1 生成プロセス
1. **データ収集**: ユーザー情報 + 診断結果
2. **テンプレート選択**: 補助金・申請枠別
3. **データマッピング**: 入力値を正式フォーマットに変換
4. **PDF生成**: 公式様式に準拠したPDF出力

### 5.2 必要書類リスト
```typescript
interface RequiredDocuments {
  mandatory: Document[];      // 必須書類
  conditional: Document[];    // 条件付き書類
  optional: Document[];       // 任意書類
}
```

### 5.3 自動入力対応項目
- 企業基本情報
- 事業計画概要
- 投資計画
- 期待効果
- 実施スケジュール

## 6. データベース設計（Supabase）

### 6.1 主要テーブル
```sql
-- ユーザー企業情報
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  employee_count INTEGER,
  industry VARCHAR(100),
  capital INTEGER,
  established_date DATE
);

-- 診断セッション
CREATE TABLE diagnosis_sessions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  answers JSONB,
  matched_subsidies JSONB,
  created_at TIMESTAMP
);

-- 申請書類
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES diagnosis_sessions(id),
  subsidy_type VARCHAR(50),
  status VARCHAR(50),
  documents JSONB,
  submitted_at TIMESTAMP
);
```

## 7. セキュリティ要件

### 7.1 認証・認可
- Supabase Auth による認証
- Row Level Security (RLS) によるデータアクセス制御
- JWTトークンベースのセッション管理

### 7.2 データ保護
- 機密情報の暗号化
- HTTPSによる通信暗号化
- 定期的なセキュリティ監査

## 8. UI/UXデザイン（Figma MCP連携）

### 8.1 デザインシステム
- カラーパレット: ブランドカラー + 補助金別アクセントカラー
- タイポグラフィ: 視認性重視のフォント選定
- コンポーネント: 再利用可能なUIパーツ

### 8.2 レスポンシブ対応
- モバイルファースト設計
- タブレット・デスクトップ最適化
- プログレッシブWebアプリ（PWA）対応

## 9. テスト戦略

### 9.1 フロントエンド（Playwright）
- E2Eテスト: 診断フロー全体
- ビジュアルリグレッションテスト
- クロスブラウザテスト

### 9.2 バックエンド（Jest）
- ユニットテスト: ビジネスロジック
- 統合テスト: API エンドポイント
- パフォーマンステスト

## 10. 実装ロードマップ

### Phase 1: 基本機能（2週間）
- [ ] アキネーター風質問フロー実装
- [ ] 補助金マッチングロジック
- [ ] 基本的なUI実装

### Phase 2: 書類生成（2週間）
- [ ] PDFテンプレート作成
- [ ] 自動入力機能
- [ ] プレビュー機能

### Phase 3: 高度な機能（1週間）
- [ ] 進捗管理ダッシュボード
- [ ] 通知機能
- [ ] 申請履歴管理

### Phase 4: 最適化（1週間）
- [ ] パフォーマンス改善
- [ ] セキュリティ強化
- [ ] ユーザビリティテスト

## 11. 成功指標（KPI）

1. **診断完了率**: 80%以上
2. **書類生成成功率**: 95%以上
3. **ユーザー満足度**: 4.5/5.0以上
4. **平均診断時間**: 3分以内
5. **書類生成時間**: 30秒以内

## 12. 今後の拡張計画

1. **AI活用**: 事業計画書の文章自動生成
2. **外部連携**: 会計ソフト・銀行APIとの連携
3. **多言語対応**: 英語・中国語対応
4. **補助金拡充**: 他の補助金への対応拡大
5. **専門家マッチング**: 認定支援機関の紹介機能