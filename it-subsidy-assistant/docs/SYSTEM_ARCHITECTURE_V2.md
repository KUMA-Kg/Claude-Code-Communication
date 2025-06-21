# IT補助金申請アシスタント システムアーキテクチャ v2.0

## 1. プロセスフロー（恒久的）

```mermaid
graph LR
    A[①6問の基礎質問] --> B[②補助金選択判定・選択画面]
    B --> C[③必要書類判定質問]
    C --> D[④書類内容の入力フォーム]
    D --> E[⑤Web上で書類・スケジュール確認]
    E --> F[⑥Excel書類へアウトプット]
```

## 2. チーム構成と責任範囲

### 2.1 フロントエンド担当（Worker1）
- **担当**: UI/UX設計、画面実装
- **ツール**: Figma MCP、React、TypeScript、Playwright
- **責任範囲**:
  - Figmaでの画面デザイン
  - 質問フロー画面の実装
  - 入力フォームの構築
  - レスポンシブ対応

### 2.2 バックエンド担当（Worker2）
- **担当**: API、データベース、ビジネスロジック
- **ツール**: Supabase MCP、Node.js、Express、Jest
- **責任範囲**:
  - データベース設計
  - API エンドポイント実装
  - Excel読み書き機能
  - 書類生成ロジック

### 2.3 品質管理・セキュリティ担当（Worker3）
- **担当**: テスト、セキュリティ、パフォーマンス
- **ツール**: Playwright、セキュリティ監査ツール
- **責任範囲**:
  - E2Eテスト
  - セキュリティ監査
  - パフォーマンス最適化
  - データ保護

## 3. データ構造

### 3.1 補助金別必要書類分岐表
```typescript
interface SubsidyDocumentBranch {
  subsidyType: 'it-donyu' | 'monozukuri' | 'jizokuka';
  conditions: {
    question: string;
    options: {
      value: string;
      requiredDocuments: string[];
      nextQuestion?: string;
    }[];
  }[];
}
```

### 3.2 データベーススキーマ（Supabase）
```sql
-- 診断セッション
CREATE TABLE diagnosis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  basic_answers JSONB,
  selected_subsidy TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 必要書類判定結果
CREATE TABLE required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES diagnosis_sessions,
  document_type TEXT,
  is_required BOOLEAN,
  condition_met TEXT
);

-- 入力データ
CREATE TABLE form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES diagnosis_sessions,
  field_name TEXT,
  field_value TEXT,
  excel_cell_reference TEXT
);

-- 生成書類
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES diagnosis_sessions,
  document_type TEXT,
  file_path TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. 各ステップの詳細仕様

### ①6問の基礎質問
1. 事業形態（法人/個人事業主/NPO）
2. 従業員数（範囲選択）
3. 年間売上高（範囲選択）
4. 主な事業分野（業種）
5. 投資目的（IT導入/設備投資/販路開拓）
6. 投資予算規模（範囲選択）

### ②補助金選択判定ロジック
```typescript
function determineSubsidy(answers: BasicAnswers): SubsidyRecommendation[] {
  const scores = {
    'it-donyu': calculateITScore(answers),
    'monozukuri': calculateMonozukuriScore(answers),
    'jizokuka': calculateJizokukaScore(answers)
  };
  
  return Object.entries(scores)
    .filter(([_, score]) => score >= 50)
    .sort(([_, a], [__, b]) => b - a)
    .map(([type, score]) => ({ type, score, compatibility: getCompatibilityLevel(score) }));
}
```

### ③必要書類判定質問（動的生成）
- 選択された補助金に基づいて分岐表から質問を生成
- 条件に応じて必要書類リストを更新

### ④書類内容の入力フォーム
- Excel書類から必要項目を抽出
- 動的フォーム生成
- バリデーション実装

### ⑤Web上での確認画面
- 入力内容のプレビュー
- 必要書類チェックリスト
- 申請スケジュール表示
- 進捗状況の可視化

### ⑥Excel書類へのアウトプット
- ExcelJSを使用した書き込み
- セルマッピング設定
- 正式フォーマット維持

## 5. 実装優先順位

### Phase 1（1週間目）
- [ ] 基本アーキテクチャ構築
- [ ] データベース設計（Supabase）
- [ ] 6問の基礎質問UI（Figma → React）
- [ ] 補助金選択判定ロジック

### Phase 2（2週間目）
- [ ] 必要書類分岐表の実装
- [ ] 動的質問生成システム
- [ ] Excel読み取り機能
- [ ] 入力フォーム自動生成

### Phase 3（3週間目）
- [ ] 確認画面の実装
- [ ] Excel書き込み機能
- [ ] E2Eテスト実装
- [ ] セキュリティ監査

### Phase 4（4週間目）
- [ ] パフォーマンス最適化
- [ ] ユーザビリティテスト
- [ ] 本番環境デプロイ
- [ ] ドキュメント整備

## 6. 技術スタック

### フロントエンド
- React + TypeScript
- Tailwind CSS
- Vite
- React Hook Form
- Zod (バリデーション)

### バックエンド
- Node.js + Express
- Supabase (Database + Auth)
- ExcelJS
- Joi (APIバリデーション)

### インフラ・ツール
- Docker
- GitHub Actions (CI/CD)
- Playwright (E2E)
- Jest (Unit/Integration)

## 7. セキュリティ要件
- Supabase Row Level Security
- 入力値サニタイゼーション
- ファイルアップロード制限
- HTTPS必須
- 定期的な依存関係更新