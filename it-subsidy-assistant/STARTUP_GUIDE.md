# IT補助金アシストツール - 起動ガイド

## 🚀 クイックスタート

### 方法1: デバッグ起動スクリプト（推奨）
```bash
# プロジェクトのルートディレクトリで実行
./debug-start.sh
```

このスクリプトは以下を自動的に行います：
- 環境変数の確認
- 依存関係のインストール
- バックエンドとフロントエンドの起動
- ヘルスチェック

### 方法2: 手動起動

#### 1. バックエンドの起動
```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール（初回のみ）
npm install

# TypeScriptパス解決の設定
export NODE_OPTIONS="-r tsconfig-paths/register"

# 開発サーバーの起動
npm run dev
```

#### 2. フロントエンドの起動（別のターミナルで）
```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーの起動
npm run dev
```

## 📋 アクセス情報

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **APIヘルスチェック**: http://localhost:3001/health

## 🔧 トラブルシューティング

### バックエンドが起動しない場合

1. **環境変数の確認**
   ```bash
   cd backend
   cat .env
   ```
   以下の変数が設定されていることを確認：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`

2. **ログの確認**
   ```bash
   # バックエンドのログディレクトリ
   ls -la backend/logs/
   cat backend/logs/app.log
   ```

3. **ポートの競合確認**
   ```bash
   # ポート3001が使用されていないか確認
   lsof -i :3001
   ```

### フロントエンドのエラー

1. **正しいコマンドを使用**
   ```bash
   # ❌ 間違い
   npm run de
   
   # ✅ 正しい
   npm run dev
   ```

2. **Viteのポート確認**
   フロントエンドは通常ポート5173で起動します（package.jsonの設定による）

## 🛠️ 開発コマンド

### バックエンド
```bash
npm run dev       # 開発サーバー起動
npm run build     # TypeScriptビルド
npm run test      # テスト実行
npm run lint      # Lintチェック
```

### フロントエンド
```bash
npm run dev       # 開発サーバー起動
npm run build     # プロダクションビルド
npm run lint      # Lintチェック
npm run preview   # ビルドのプレビュー
```