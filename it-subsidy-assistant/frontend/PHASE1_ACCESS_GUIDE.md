# Phase 1 - 補助金選択システム アクセスガイド

## 🚀 クイックスタート

### 1. 起動方法

```bash
# フロントエンドディレクトリに移動
cd it-subsidy-assistant/frontend

# デモ起動スクリプトを実行
./run-phase1-demo.sh
```

### 2. アクセスURL

開発サーバー起動後、以下のURLにアクセスしてください：

#### 📌 Phase 1 スタンドアロンデモ
```
http://localhost:5173/phase1-demo.html
```
- StatusBadgeコンポーネントのすべてのバリエーション
- 補助金選択画面の完全なデモ
- インタラクティブ機能の動作確認

#### 📱 統合アプリケーション
```
http://localhost:5173
```
- SubsidyFlowAppに統合されたEnhancedSubsidySelectionScreen
- 実際のユーザーフローでの動作確認

## ✨ 主要機能の確認方法

### 1. ダークモード切り替え
- 画面右上の 🌙/☀️ ボタンをクリック
- すべてのコンポーネントがテーマに対応
- 設定はローカルストレージに保存

### 2. グレーアウト機能
- 「事業再構築補助金」（準備中）をクリック
- グレーアウト表示（opacity: 0.6）
- クリック時に警告メッセージ表示（3秒間）

### 3. ホバーエフェクト
- アクティブな補助金カードにマウスオーバー
- カードが浮き上がるアニメーション
- アイコンの揺れるエフェクト

### 4. StatusBadgeの状態
- **受付中（Active）**: パルスアニメーション付き
- **準備中（Preparing）**: オレンジ色表示
- **締切済（Closed）**: 赤色表示
- **近日公開（Coming Soon）**: 青色表示

### 5. レスポンシブデザイン
- ブラウザウィンドウのサイズを変更
- モバイル、タブレット、デスクトップで最適化

## 🧪 動作確認チェックリスト

- [ ] Phase 1デモページが正常に表示される
- [ ] ダークモードの切り替えが動作する
- [ ] 準備中の補助金がグレーアウト表示される
- [ ] グレーアウトされた補助金をクリックすると警告メッセージが表示される
- [ ] アクティブな補助金にホバーすると浮き上がる
- [ ] StatusBadgeのパルスアニメーションが動作する
- [ ] レスポンシブデザインが正しく適用される
- [ ] 統合アプリケーションで補助金選択画面が表示される

## 📝 注意事項

1. **ポート競合**: デフォルトで5173ポートを使用します。他のアプリケーションが使用している場合は、異なるポートが割り当てられます。

2. **ブラウザ互換性**: 最新のChrome、Firefox、Safari、Edgeで動作確認済み。

3. **依存関係**: 初回起動時は`npm install`が自動実行されます。

## 🛠️ トラブルシューティング

### デモページが表示されない場合
```bash
# 開発サーバーを停止（Ctrl+C）して再起動
npm run dev
```

### スタイルが適用されない場合
```bash
# キャッシュをクリアしてリロード
# Chrome/Edge: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
```

### ダークモードが切り替わらない場合
```javascript
// ブラウザのコンソールで実行
localStorage.removeItem('theme');
location.reload();
```

## 📊 成果物一覧

1. **コンポーネント**
   - `/src/components/StatusBadge.tsx`
   - `/src/components/EnhancedSubsidySelectionScreen.tsx`

2. **デモページ**
   - `/public/phase1-demo.html`

3. **テスト**
   - `/tests/enhanced-subsidy-selection.spec.ts`

4. **統合**
   - SubsidyFlowApp.tsxへの組み込み完了

---

作成日: 2025年6月23日
作成者: Worker1