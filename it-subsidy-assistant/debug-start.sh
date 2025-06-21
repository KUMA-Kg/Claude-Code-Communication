#!/bin/bash

# デバッグ用起動スクリプト

echo "🔍 IT補助金アシストツールのデバッグ起動を開始します..."

# 現在のディレクトリを保存
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# バックエンドのデバッグ
echo ""
echo "📦 バックエンドのデバッグ..."
cd "$SCRIPT_DIR/backend"

# 環境変数の確認
echo "🔎 環境変数を確認しています..."
if [ -f .env ]; then
    echo "✅ .envファイルが見つかりました"
    # 必要な環境変数をチェック
    source .env
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$JWT_SECRET" ]; then
        echo "❌ 必要な環境変数が設定されていません"
        echo "   以下の環境変数を.envファイルに設定してください:"
        echo "   - SUPABASE_URL"
        echo "   - SUPABASE_ANON_KEY"
        echo "   - JWT_SECRET"
        exit 1
    fi
else
    echo "❌ .envファイルが見つかりません"
    exit 1
fi

# 依存関係の確認
if [ ! -d "node_modules" ]; then
    echo "📥 バックエンドの依存関係をインストールしています..."
    npm install
fi

# TypeScriptのパス設定
export NODE_OPTIONS="-r tsconfig-paths/register"

echo ""
echo "🚀 バックエンドを起動しています..."
echo "   ポート: 3001"
echo "   環境: development"
echo ""

# バックエンドを起動（フォアグラウンドで実行してログを表示）
npm run dev &
BACKEND_PID=$!

# バックエンドの起動を待つ
echo "⏳ バックエンドの起動を待っています..."
sleep 5

# バックエンドの状態確認
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ バックエンドが正常に起動しました"
    
    # ヘルスチェック
    echo "🏥 ヘルスチェックを実行しています..."
    curl -s http://localhost:3001/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ バックエンドAPIが正常に応答しています"
        echo ""
        curl http://localhost:3001/health | python3 -m json.tool 2>/dev/null || curl http://localhost:3001/health
        echo ""
    else
        echo "⚠️  バックエンドAPIに接続できません"
    fi
else
    echo "❌ バックエンドの起動に失敗しました"
    echo "   詳細なエラーログを確認してください"
    exit 1
fi

# フロントエンドの起動
echo ""
echo "🎨 フロントエンドを起動しています..."
cd "$SCRIPT_DIR/frontend"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
    echo "📥 フロントエンドの依存関係をインストールしています..."
    npm install
fi

echo ""
echo "✅ 起動準備が完了しました"
echo ""
echo "📌 アクセス情報:"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンドAPI: http://localhost:3001"
echo "   APIヘルスチェック: http://localhost:3001/health"
echo ""
echo "🛑 終了するには Ctrl+C を押してください"
echo ""

# フロントエンドを起動
npm run dev

# 終了時の処理
trap "echo ''; echo '⏹️  サービスを停止しています...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM