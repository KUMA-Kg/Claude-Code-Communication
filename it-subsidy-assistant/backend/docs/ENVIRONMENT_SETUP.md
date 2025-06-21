# 環境設定ガイド

## 概要
このドキュメントでは、IT補助金アシストツールのバックエンドの環境設定について説明します。

## 環境変数の管理

### 開発環境
1. `.env`ファイルをコピーして設定
   ```bash
   cp .env.example .env
   ```

2. 必要な値を設定（Supabaseの認証情報など）

### 本番環境
1. セキュアなシークレットを生成
   ```bash
   npm run generate:secrets
   ```

2. `.env.production`を作成
   ```bash
   cp .env.production.example .env.production
   ```

3. 生成されたシークレットと本番環境の値を設定

## 環境変数の優先順位
環境変数は以下の優先順位で読み込まれます：

1. `.env.{NODE_ENV}.local` （gitで追跡されない）
2. `.env.{NODE_ENV}` （環境固有の設定）
3. `.env.local` （gitで追跡されない）
4. `.env` （デフォルト設定）

## セキュリティベストプラクティス

### 開発環境
- 開発用の一時的なシークレットを使用
- 本番環境の認証情報を含めない

### 本番環境
- 強力なランダムシークレットを使用（64文字以上推奨）
- 環境変数は環境変数管理サービスで管理
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault
- 定期的にシークレットをローテーション（90日ごと推奨）
- アクセスログを有効化

### Git管理
`.gitignore`に以下のファイルが含まれていることを確認：
- `.env`
- `.env.local`
- `.env.*.local`
- `.env.production`

## トラブルシューティング

### 環境変数が読み込まれない場合
1. ファイルの存在確認
   ```bash
   ls -la .env*
   ```

2. ファイルの権限確認
   ```bash
   chmod 600 .env
   ```

3. エンコーディング確認（UTF-8であること）
   ```bash
   file .env
   ```

4. 改行コードの確認（LFであること）

### nodemonで環境変数が読み込まれない場合
`nodemon.json`が正しく設定されているか確認してください。

## 環境別の起動方法

### 開発環境
```bash
npm run dev
```

### 本番環境
```bash
npm run build
NODE_ENV=production npm start
```

### ステージング環境
```bash
NODE_ENV=staging npm start
```