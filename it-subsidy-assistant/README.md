# IT補助金アシストツール 

中小企業向けのIT補助金検索・申請資料作成支援SaaSアプリケーション

## 🚀 クイックスタート

### 前提条件
- Node.js v18以上
- npm または yarn
- Supabaseアカウント（バックエンド用）

### セットアップ手順

1. **依存関係のインストール**
```bash
# ルートディレクトリで
npm install

# フロントエンドの依存関係
cd frontend && npm install

# バックエンドの依存関係
cd ../backend && npm install
```

2. **環境変数の設定**

フロントエンド用（`frontend/.env`）:
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SUPABASE_URL=https://fnoninypccdgqlzyidto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZub25pbnlwY2NkZ3FsenlpZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzODg5NDgsImV4cCI6MjA2NDk2NDk0OH0.1Kp0mXJ7wNPUFA8yrYY9Ax9bGVyEPQ8FOyVLaZ2HlpY
```

バックエンド用（`backend/.env`を作成）:
```bash
# backend/.env.exampleをコピー
cd backend
cp .env.example .env
# .envファイルを編集してSupabaseの認証情報を設定
```

3. **開発サーバーの起動**

ルートディレクトリから:
```bash
npm run dev
```

または個別に起動:
```bash
# フロントエンド（別ターミナル）
cd frontend && npm run dev

# バックエンド（別ターミナル）
cd backend && npm run dev
```

### アクセス方法
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3001

## 🛠️ 技術スタック

### フロントエンド
- React 19 + TypeScript
- Vite（ビルドツール）
- React Router（ルーティング）
- TanStack Query（データフェッチング）
- Tailwind CSS（スタイリング）
- Lucide React（アイコン）

### バックエンド
- Node.js + Express
- Supabase（認証・データベース）
- TypeScript
- Jest（テスト）

### セキュリティ・品質管理
- OWASP準拠のセキュリティ設定
- GDPR対応
- Playwright（E2Eテスト）
- ESLint + Prettier（コード品質）

## 📱 主な機能

1. **補助金検索ウィザード**
   - 質問に答えるだけで適切な補助金を提案
   - マッチスコア表示

2. **申請書類自動生成**
   - 必要情報を入力すると申請書類を自動作成
   - PDF形式でダウンロード可能

3. **ユーザー管理**
   - 無料版：1案件まで保存可能
   - 有料版：複数案件の管理

4. **ダークモード対応**
   - システム設定連動
   - ユーザー設定の保存

## 🧪 テストの実行

```bash
# 全テスト実行
npm test

# フロントエンドテストのみ
npm run test:frontend

# バックエンドテストのみ
npm run test:backend

# E2Eテスト
npm run test:e2e

# セキュリティテスト
npm run test:security
```

## 📦 ビルド

```bash
# プロダクションビルド
npm run build

# フロントエンドのみ
npm run build:frontend

# バックエンドのみ
npm run build:backend
```

## 🔧 トラブルシューティング

### ポート競合エラー
デフォルトポート（5173, 3001）が使用中の場合:
- フロントエンド: `vite.config.ts`でポート変更
- バックエンド: `.env`の`PORT`を変更

### Supabase接続エラー
- Supabaseプロジェクトの設定を確認
- APIキーが正しく設定されているか確認
- ネットワーク接続を確認

### 依存関係エラー
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📄 ライセンス
MIT License