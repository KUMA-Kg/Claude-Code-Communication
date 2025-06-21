# IT補助金アシストツール - Figmaデザイン構造

## プロジェクト構成

### 1. デザインシステム
- **カラーパレット**
  - Primary (Blue): #2196F3をベースにした10段階
  - Secondary (Beige): #DAA660をベースにした10段階
  - Neutral (Gray): 10段階のグレースケール
  - Semantic Colors: Success, Warning, Error, Info

- **タイポグラフィ**
  - Font Family: Noto Sans JP (日本語), Inter (英数字)
  - Font Sizes: 12px〜48px (8段階)
  - Font Weights: 400, 500, 600, 700
  - Line Heights: 1.25, 1.5, 1.75

- **スペーシング**
  - 4px, 8px, 16px, 24px, 32px, 48px, 64px

- **シャドウ**
  - xs, sm, md, lg, xl の5段階

### 2. コンポーネントライブラリ

#### 基本コンポーネント
- **Buttons**
  - Primary, Secondary, Outline, Ghost
  - Sizes: Small, Medium, Large
  - States: Default, Hover, Active, Disabled, Loading

- **Form Elements**
  - Input Field
  - Textarea
  - Select Dropdown
  - Radio Button
  - Checkbox
  - Toggle Switch

- **Cards**
  - Basic Card
  - Subsidy Card (補助金カード)
  - Stat Card (統計カード)
  - Document Card (書類カード)

- **Navigation**
  - Header/Navbar
  - Progress Bar
  - Wizard Steps
  - Breadcrumbs

- **Feedback**
  - Alert Messages
  - Toast Notifications
  - Loading Spinner
  - Progress Indicator

### 3. 画面デザイン

#### A. 基礎質問画面（6問）
- **構成要素**
  - プログレスバー（上部）
  - 質問番号インジケーター
  - 質問文（大きく表示）
  - 選択肢ボタン（縦並び）
  - 戻るボタン（左下）

- **特徴**
  - 1問1画面形式
  - アニメーション付き遷移
  - 選択後自動で次へ進む

#### B. 補助金選択画面
- **構成要素**
  - ヘッダー「あなたにおすすめの補助金」
  - 補助金カード（3種類）
    - IT導入補助金（青系）
    - ものづくり補助金（緑系）
    - 持続化補助金（オレンジ系）
  - 各カードに含まれる情報
    - マッチ度スコア（％表示）
    - 補助金名
    - 概要説明
    - 最大補助額
    - 補助率
    - 「詳細を見る」ボタン

#### C. 必要書類判定の動的質問画面
- **構成要素**
  - 選択した補助金名の表示
  - 条件分岐質問フロー
  - チェックボックス形式の選択
  - 「次へ」「戻る」ボタン
  - サイドバーに必要書類リスト（リアルタイム更新）

#### D. 入力フォーム画面
- **構成要素**
  - セクション分けされたフォーム
    - 基本情報
    - 事業内容
    - 申請内容
    - 添付書類
  - 各セクションは折りたたみ可能
  - 必須項目の明示（赤いアスタリスク）
  - ヘルプアイコン付きツールチップ
  - 自動保存インジケーター

#### E. 確認・プレビュー画面
- **構成要素**
  - 申請書プレビュー（A4サイズ）
  - 編集ボタン（各セクション）
  - ダウンロードオプション
    - PDF形式
    - Excel形式
  - 提出前チェックリスト
  - 「申請する」ボタン

### 4. レスポンシブ対応
- **ブレークポイント**
  - Mobile: 375px〜
  - Tablet: 768px〜
  - Desktop: 1024px〜
  - Large Desktop: 1440px〜

- **対応方針**
  - Mobile First設計
  - タッチフレンドリーなUI
  - 横スクロールの排除
  - 適切なタップターゲットサイズ（最小44px）

### 5. アクセシビリティ
- **カラーコントラスト**
  - WCAG AA準拠（4.5:1以上）
  - 重要な情報は色だけに依存しない

- **キーボード操作**
  - Tab順序の最適化
  - フォーカス状態の明示
  - Escキーでモーダル閉じる

- **スクリーンリーダー対応**
  - 適切なaria-label
  - セマンティックなHTML構造
  - エラーメッセージの読み上げ

### 6. インタラクション
- **トランジション**
  - 基本: 200ms ease-in-out
  - ページ遷移: 300ms
  - ローディング: 無限ループ

- **マイクロインタラクション**
  - ボタンホバー効果
  - フォームフィールドフォーカス
  - 成功/エラーフィードバック
  - プログレス表示

### 7. ダークモード対応
- 自動切り替え（システム設定連動）
- 手動切り替えトグル
- カラーパレットの調整
- コントラスト維持