# E2Eテスト実行ガイド

## 概要
Worker1が実装したフロントエンド統合機能の包括的なE2Eテストスイートです。

## テストカテゴリ

### 1. 統合デモテスト (`integrated-demo.spec.ts`)
統合デモページの全機能をテストします。
- 認証フロー（ログイン/ログアウト）
- AIマッチング機能
- データエクスポート機能  
- リアルタイム接続
- ダークモード切り替え
- レスポンシブデザイン
- 基本的なアクセシビリティ

### 2. モバイルレスポンシブテスト (`mobile-responsive.spec.ts`)
各種モバイル・タブレットデバイスでの動作を検証します。
- iPhone、Android各種デバイス
- タッチ操作とスワイプ
- モバイル最適化されたフォーム
- オフライン対応
- パフォーマンス測定

### 3. アクセシビリティテスト (`accessibility-compliance.spec.ts`)
WCAG 2.1 Level AA準拠を検証します。
- 自動アクセシビリティ検査（axe-core）
- キーボードナビゲーション
- スクリーンリーダー対応
- カラーコントラスト
- フォームのアクセシビリティ

### 4. パフォーマンステスト (`performance-metrics.spec.ts`)
Core Web Vitalsとカスタム指標を測定します。
- LCP、FID、CLS
- リソース最適化
- メモリリーク検出
- ネットワーク効率性

## テスト実行方法

### 前提条件
```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール（初回のみ）
npx playwright install
```

### 全テストの実行
```bash
npm run test:e2e
```

### カテゴリ別実行
```bash
# 統合デモテストのみ
npm run test:e2e:integrated

# モバイルテストのみ
npm run test:e2e:mobile

# アクセシビリティテストのみ
npm run test:e2e:a11y

# パフォーマンステストのみ
npm run test:e2e:perf
```

### デバッグモード
```bash
# UIモードで実行（ブラウザで結果を確認）
npm run test:e2e:ui

# デバッグモードで実行（ステップ実行）
npm run test:e2e:debug
```

### レポート表示
```bash
# テスト実行後にHTMLレポートを表示
npm run test:e2e:report
```

## 環境設定

### 環境変数
テスト実行時に以下の環境変数を設定できます：

```bash
# ベースURL変更
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e

# ヘッドレスモード無効化（ブラウザ表示）
HEADED=true npm run test:e2e

# 特定ブラウザのみでテスト
BROWSER=chromium npm run test:e2e
```

### テスト設定のカスタマイズ
`playwright.config.ts`で以下の設定が可能：
- タイムアウト値
- リトライ回数
- 並列実行数
- スクリーンショット設定

## CI/CD統合

### GitHub Actions例
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## トラブルシューティング

### よくある問題

1. **ブラウザが起動しない**
   ```bash
   npx playwright install --with-deps
   ```

2. **タイムアウトエラー**
   - ネットワーク接続を確認
   - `playwright.config.ts`でタイムアウト値を増やす

3. **要素が見つからない**
   - セレクタが正しいか確認
   - `waitForSelector`を使用して要素の出現を待つ

4. **テストが不安定**
   - `waitForLoadState('networkidle')`を使用
   - 適切な待機処理を追加

## ベストプラクティス

1. **セレクタの優先順位**
   - `data-testid`属性を最優先
   - テキストベースのセレクタは変更に弱い
   - CSSセレクタは最終手段

2. **待機処理**
   - 固定時間の`waitForTimeout`は避ける
   - `waitForSelector`や`waitForLoadState`を使用

3. **テストの独立性**
   - 各テストは独立して実行可能に
   - 前のテストの状態に依存しない

4. **アサーション**
   - 明確で具体的なアサーション
   - エラーメッセージが分かりやすいように

## 追加リソース

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Web.dev - Core Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

## フィードバック

テストに関する質問や改善提案は、プロジェクトのIssueトラッカーまでお願いします。