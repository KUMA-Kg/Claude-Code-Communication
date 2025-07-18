# IT補助金アシストツール - 開発TODO

## 🚀 優先度：高

### 1. Excel/PDFエクスポート機能の実装
**担当: Worker1（フロントエンド）**
- ExcelJSを使用してExcelファイル生成
- jsPDFを使用してPDFファイル生成
- 申請書フォーマットに合わせたレイアウト実装
- ダウンロード機能の実装

**実装内容:**
```typescript
// src/utils/exportUtils.ts
- generateExcelFile(data, subsidyType)
- generatePDFFile(data, subsidyType)
- formatDataForExport(data)
```

---

## 📌 優先度：中

### 2. 申請書テンプレート機能の実装
**担当: Worker2（バックエンド）**
- 各補助金の公式テンプレートフォーマット管理
- テンプレートのバージョン管理
- カスタムテンプレート作成機能

**実装内容:**
- `/templates/` ディレクトリ構造の設計
- テンプレートエンジンの実装
- プレビュー機能

### 3. AIによる申請書記入支援機能
**担当: Worker1 + Worker2共同**
- 事業計画の自動文章生成
- 入力内容の改善提案
- 類似事例の参照機能

**実装内容:**
- AI APIとの連携
- プロンプトテンプレートの作成
- レスポンスの整形とUI表示

### 4. 申請進捗管理ダッシュボード
**担当: Worker1（フロントエンド）**
- 申請ステータスの可視化
- タスクリスト機能
- 進捗率の表示
- カレンダービュー

**実装内容:**
- ダッシュボードコンポーネント
- 進捗計算ロジック
- ステータス更新機能

### 5. 申請期限リマインダー機能
**担当: Worker3（品質管理）**
- メール通知機能
- ブラウザ通知
- 期限管理システム

---

## 📋 優先度：低

### 6. 複数申請の一括管理機能
**担当: Worker2（バックエンド）**
- 複数プロジェクトの並行管理
- 一括ステータス更新
- 比較ビュー機能

### 7. オフライン対応機能
**担当: Worker1（フロントエンド）**
- Service Workerの実装
- ローカルストレージの最適化
- オフライン時の自動同期

---

## 🔧 技術的改善事項

### セキュリティ対策（Worker3担当）
- 入力値のバリデーション強化
- XSS対策
- データ暗号化
- セキュアな通信の実装

### パフォーマンス最適化（Worker3担当）
- コード分割の実装
- 遅延ローディング
- キャッシュ戦略の最適化
- バンドルサイズの削減

### テスト実装（Worker3担当）
- 単体テスト（Jest）
- 統合テスト
- E2Eテスト（Playwright）
- テストカバレッジ80%以上を目標

---

## 📝 実装済み機能

- ✅ 基本的な質問フロー（アキネーター方式）
- ✅ 補助金マッチング機能
- ✅ 補助金ごとの動的フォーム生成
- ✅ 申請書プレビュー機能
- ✅ ログイン・マイページ機能
- ✅ プロジェクト保存機能

---

## 🎯 次のスプリント目標

1. **Excel/PDFエクスポート機能を完成させる**
2. **基本的なテンプレート機能を実装**
3. **セキュリティ監査の実施**

---

## 📊 進捗状況

全体進捗: 40% 完了

- フロントエンド基盤: 80% ✓
- バックエンド連携: 20% 
- UI/UX: 60% ✓
- セキュリティ: 30% 
- テスト: 10% 