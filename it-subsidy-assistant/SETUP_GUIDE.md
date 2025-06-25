# IT補助金アシスタント セットアップガイド

## 📋 目次
1. [前提条件](#前提条件)
2. [クイックスタート](#クイックスタート)
3. [詳細セットアップ手順](#詳細セットアップ手順)
4. [トラブルシューティング](#トラブルシューティング)
5. [開発ワークフロー](#開発ワークフロー)

## 前提条件

### 必要なソフトウェア
- **Node.js**: v18.0.0 以上（推奨: v20.x）
- **npm**: v9.0.0 以上
- **Git**: v2.0.0 以上

### 推奨環境
- **OS**: macOS, Linux, Windows (WSL2推奨)
- **メモリ**: 8GB以上
- **ディスク容量**: 2GB以上の空き容量

## クイックスタート

```bash
# 1. リポジトリのクローン
git clone https://github.com/your-org/it-subsidy-assistant.git
cd it-subsidy-assistant

# 2. 自動セットアップスクリプトの実行
./scripts/setup.sh

# 3. 開発サーバーの起動
npm run dev
```

## 詳細セットアップ手順

### 1. 環境準備

#### Node.jsのインストール確認
```bash
node --version  # v18.0.0以上であることを確認
npm --version   # v9.0.0以上であることを確認
```

#### 必須ツールのインストール
```bash
# macOS (Homebrew使用)
brew install node git

# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm git

# Windows (Chocolatey使用)
choco install nodejs git
```

### 2. プロジェクトのセットアップ

#### リポジトリのクローンと初期設定
```bash
# リポジトリをクローン
git clone https://github.com/your-org/it-subsidy-assistant.git
cd it-subsidy-assistant

# ビルド前検証の実行
./scripts/pre-build-validation.sh
```

#### 依存関係のインストール
```bash
# ルートディレクトリの依存関係
npm ci

# フロントエンドの依存関係
cd frontend
npm ci

# バックエンドの依存関係
cd ../backend
npm ci
```

### 3. 環境変数の設定

#### バックエンド環境変数
```bash
cd backend
cp .env.example .env
```

`.env`ファイルを編集し、以下の値を設定：
```env
# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT設定
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars

# その他の設定（デフォルト値で開始可能）
NODE_ENV=development
PORT=3001
```

### 4. データベースセットアップ

#### Supabaseプロジェクトの作成
1. [Supabase](https://supabase.io)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から接続情報を取得

#### スキーマの適用
```bash
# データベーススキーマの適用
cd backend
npm run db:migrate

# 初期データの投入（開発環境のみ）
npm run db:seed
```

### 5. ビルドと起動

#### 開発環境での起動
```bash
# プロジェクトルートから
npm run dev

# または個別に起動
# フロントエンド（新しいターミナル）
cd frontend
npm run dev

# バックエンド（新しいターミナル）
cd backend
npm run dev
```

#### 本番ビルド
```bash
# フロントエンドのビルド
cd frontend
npm run build

# バックエンドのビルド
cd backend
npm run build
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. `npm ci`が失敗する
```bash
# package-lock.jsonを削除して再生成
rm package-lock.json
npm install

# それでも失敗する場合
rm -rf node_modules
npm cache clean --force
npm install
```

#### 2. TypeScriptエラーが発生する
```bash
# 型定義の再インストール
npm install --save-dev @types/node @types/react @types/express

# TypeScriptのバージョン確認
npx tsc --version  # 5.0.0以上であることを確認
```

#### 3. ポートが既に使用されている
```bash
# 使用中のポートを確認
lsof -i :3000  # フロントエンド
lsof -i :3001  # バックエンド

# プロセスを終了
kill -9 <PID>

# または環境変数でポートを変更
PORT=3002 npm run dev
```

#### 4. Supabase接続エラー
- `.env`ファイルの設定を確認
- Supabaseダッシュボードでプロジェクトが稼働していることを確認
- ファイアウォール設定を確認

#### 5. ビルドエラー
```bash
# 依存関係の整合性チェック
./scripts/dependency-check.js

# クリーンビルド
rm -rf frontend/dist backend/dist
npm run build
```

### エラーメッセージ別対処法

| エラーメッセージ | 原因 | 解決方法 |
|-----------------|------|----------|
| `Cannot find module 'react'` | 依存関係の不足 | `cd frontend && npm ci` |
| `Type error: ...` | TypeScript型エラー | 該当ファイルの型定義を修正 |
| `EADDRINUSE` | ポート使用中 | 別のポートを使用するか、既存プロセスを停止 |
| `Invalid token` | JWT設定エラー | `.env`のJWT_SECRETを確認 |
| `Network error` | API接続失敗 | バックエンドが起動していることを確認 |

### デバッグモード

#### 詳細ログの有効化
```bash
# フロントエンド
DEBUG=* npm run dev

# バックエンド
LOG_LEVEL=debug npm run dev
```

#### 開発ツール
- React Developer Tools
- Redux DevTools（状態管理デバッグ用）
- Postman（API テスト用）

## 開発ワークフロー

### 1. 新機能開発前のチェック
```bash
# 最新のmainブランチを取得
git checkout main
git pull origin main

# 依存関係と型チェック
./scripts/pre-build-validation.sh
```

### 2. 開発中の品質チェック
```bash
# ESLint実行
npm run lint

# TypeScriptチェック
npm run typecheck

# テスト実行
npm test

# セキュリティ監査
npm audit
```

### 3. コミット前の確認
```bash
# 統合チェック
npm run pre-commit

# または手動で
npm run lint && npm run typecheck && npm test
```

### 4. CI/CD パイプライン
プッシュ時に自動実行される項目：
- 依存関係検証
- コード品質チェック
- セキュリティスキャン
- 単体テスト
- 統合テスト
- E2Eテスト

## 📚 追加リソース

- [アーキテクチャドキュメント](./docs/architecture.md)
- [API仕様書](./docs/api-spec.md)
- [コーディング規約](./docs/coding-standards.md)
- [セキュリティガイドライン](./docs/security-guidelines.md)

## 🆘 サポート

問題が解決しない場合：
1. [Issue](https://github.com/your-org/it-subsidy-assistant/issues)を作成
2. Slackチャンネル: #it-subsidy-assistant-dev
3. メール: dev-support@example.com

---
最終更新: 2024年6月