# タスク割り当て表 - IT補助金アシストツール

## 🎯 現在の進捗状況
- ✅ 基本フロー完成（診断→補助金選択→入力→出力）
- ✅ Excel/PDFエクスポート機能実装済み
- 🔄 申請進捗管理ダッシュボード実装中

---

## 👥 Worker1（フロントエンド担当）のタスク

### 1. 申請進捗管理ダッシュボード 【実装中】
```typescript
// src/components/Dashboard/ProgressDashboard.tsx
interface ProgressDashboard {
  // 進捗ステータス表示
  currentStep: number;
  totalSteps: number;
  completionRate: number;
  
  // タスクリスト
  tasks: Task[];
  
  // カレンダービュー
  deadlines: Deadline[];
}
```

**実装項目:**
- プログレスバーコンポーネント
- タスクチェックリスト
- 期限カレンダー表示
- ステータス更新機能

### 2. オフライン対応機能
- Service Workerの実装
- キャッシュ戦略の設計
- オフライン時のUI表示

---

## 👥 Worker2（バックエンド担当）のタスク

### 1. 申請書テンプレート機能
```typescript
// src/templates/subsidy-templates.ts
interface SubsidyTemplate {
  id: string;
  subsidyType: string;
  version: string;
  sections: TemplateSection[];
  requiredFields: string[];
}
```

**実装項目:**
- テンプレート管理システム
- バージョン管理
- テンプレートのインポート/エクスポート

### 2. AIによる申請書記入支援機能
```typescript
// src/services/ai-assistant.ts
interface AIAssistant {
  generateBusinessPlan(context: any): Promise<string>;
  suggestImprovements(text: string): Promise<Suggestion[]>;
  findSimilarCases(industry: string): Promise<Case[]>;
}
```

**実装項目:**
- OpenAI API連携
- プロンプトテンプレート作成
- レスポンス整形処理

---

## 👥 Worker3（品質管理担当）のタスク

### 1. セキュリティ対策
```typescript
// src/utils/security.ts
- 入力値バリデーション強化
- XSS対策の実装
- CSRFトークン実装
- データ暗号化処理
```

### 2. パフォーマンス最適化
- コード分割の実装
- 遅延ローディング設定
- バンドルサイズ最適化
- キャッシュ戦略

### 3. テスト実装
```typescript
// __tests__/
- 単体テスト（Jest）
- 統合テスト
- E2Eテスト（Playwright）
- カバレッジ80%目標
```

---

## 📋 共同作業タスク

### Worker1 + Worker2: 申請期限リマインダー機能
- フロントエンド：通知UI
- バックエンド：スケジューラー実装
- メール通知システム

### 全員: コードレビューとドキュメント整備
- APIドキュメント作成
- コンポーネントドキュメント
- 使用マニュアル作成

---

## 🚀 今週の目標

1. **月曜日〜火曜日**
   - Worker1: ダッシュボード基本機能完成
   - Worker2: テンプレート管理システム実装
   - Worker3: セキュリティ監査実施

2. **水曜日〜木曜日**
   - Worker1: オフライン対応開始
   - Worker2: AI支援機能のプロトタイプ
   - Worker3: パフォーマンステスト実施

3. **金曜日**
   - 統合テスト
   - バグ修正
   - 次週計画策定

---

## 📝 コミュニケーション

- 毎朝10:00 - デイリースタンドアップ
- 進捗はGitHub Projectsで管理
- ブロッカーは即座にSlackで共有
- コードレビューは必須（最低1名）

---

## ⚠️ 注意事項

- マージ前に必ずテストを実行
- TypeScriptの型定義を厳密に
- コミットメッセージは明確に
- ドキュメントの同時更新を忘れずに