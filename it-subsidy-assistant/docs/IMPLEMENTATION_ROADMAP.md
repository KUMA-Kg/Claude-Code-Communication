# 実装ロードマップ

## Phase 1: 基礎機能実装（2週間）

### Week 1: データベースと基本CRUD

#### Day 1-2: データベース構築
- [ ] Supabaseでテーブル作成
- [ ] マスターデータ投入（サンプル補助金3つ）
- [ ] 基本的なマイグレーションスクリプト

#### Day 3-5: 企業情報管理
- [ ] 企業情報登録API
- [ ] 企業情報編集画面
- [ ] 企業プロファイル表示

### Week 2: 補助金検索の基本実装

#### Day 6-8: 検索フロー
- [ ] 固定質問での補助金検索
- [ ] マッチング結果表示
- [ ] 検索履歴保存

#### Day 9-10: 申請開始
- [ ] 申請作成API
- [ ] 申請一覧画面
- [ ] 基本的なステータス管理

---

## Phase 2: スマート機能（3週間）

### Week 3: 動的質問システム

```typescript
// 実装する質問エンジン
interface QuestionEngine {
  // 次の質問を決定
  getNextQuestion(
    answeredQuestions: Answer[],
    targetSubsidy: Subsidy
  ): Question | null;
  
  // 既存データから自動入力
  autoFillAnswers(
    companyId: string,
    questions: Question[]
  ): PrefilledAnswers;
}
```

### Week 4: データ再利用システム

#### 実装項目
1. 回答ストレージの最適化
2. 過去データからの自動入力
3. 類似質問の自動マッピング

### Week 5: ドキュメント生成

#### 基本テンプレート（3種類）
1. 事業計画書
2. 収支計画書
3. 申請書

---

## Phase 3: UI/UX改善（2週間）

### Week 6: 入力体験の最適化

#### プログレッシブ入力UI
```tsx
// 実装イメージ
<SmartFormWizard>
  <AutoSaveForm />
  <ProgressIndicator />
  <AIAssistant />
</SmartFormWizard>
```

### Week 7: ダッシュボード強化

- 申請進捗の可視化
- 期限管理
- 書類チェックリスト

---

## 実装の優先順位（MVP向け）

### 🔴 最優先（必須）

1. **企業基本情報の登録・編集**
   ```typescript
   // 最小限の企業情報
   interface CompanyBasicInfo {
     companyName: string;
     employeeCount: number;
     industry: string;
     establishedDate: Date;
   }
   ```

2. **シンプルな補助金検索**
   - 5-6個の固定質問
   - ハードコードされたマッチングロジック

3. **基本的な申請管理**
   - 申請の作成・保存
   - 進捗管理

### 🟡 優先（あると良い）

1. **データの自動入力**
   - 前回の入力値を記憶
   - 類似項目の自動補完

2. **PDF生成**
   - 基本的なテンプレート1種類

3. **検索履歴**
   - 過去の検索結果を表示

### 🟢 後回し（将来的に）

1. **AI統合**
2. **高度な文書生成**
3. **分析・レポート機能**

---

## 技術的な実装順序

### Step 1: バックエンドAPI拡張
```bash
backend/
├── src/
│   ├── models/
│   │   ├── company.model.ts
│   │   ├── subsidy.model.ts
│   │   └── application.model.ts
│   ├── services/
│   │   ├── company.service.ts
│   │   ├── search.service.ts
│   │   └── document.service.ts
│   └── routes/
│       ├── company.routes.ts
│       └── search.routes.ts
```

### Step 2: フロントエンド画面追加
```bash
frontend/
├── src/
│   ├── pages/
│   │   ├── CompanyProfilePage.tsx
│   │   ├── SubsidySearchWizard.tsx
│   │   └── ApplicationFormPage.tsx
│   ├── components/
│   │   ├── forms/
│   │   │   ├── CompanyInfoForm.tsx
│   │   │   └── SmartQuestionForm.tsx
│   │   └── wizards/
│   │       └── SearchWizard.tsx
```

### Step 3: Supabaseセットアップ
```sql
-- 1. 基本テーブルから作成
CREATE TABLE companies ...
CREATE TABLE subsidies ...

-- 2. サンプルデータ投入
INSERT INTO subsidies (code, name, ...) VALUES
  ('IT_DONYU_2024', 'IT導入補助金2024', ...),
  ('MONOZUKURI_2024', 'ものづくり補助金', ...),
  ('JIZOKUKA_2024', '事業再構築補助金', ...);

-- 3. RLSポリシー設定
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

---

## 開発タスクの見積もり

### MVP完成まで: 4-6週間

| フェーズ | 期間 | 主な成果物 |
|---------|------|-----------|
| Phase 1 | 2週間 | 基本的な企業情報管理と検索 |
| Phase 2 | 3週間 | スマート機能の実装 |
| Phase 3 | 1週間 | UI/UX改善とテスト |

### リソース配分

- **バックエンド開発**: 40%
- **フロントエンド開発**: 40%
- **データベース・インフラ**: 20%

---

## 次のアクション

1. **データベーススキーマをSupabaseに実装**
2. **企業情報管理APIの作成**
3. **企業プロファイル画面の実装**
4. **サンプル補助金データの準備**