#!/bin/bash

# IT補助金アシストツール起動スクリプト

echo "🚀 IT補助金アシストツールを起動します..."

# バックエンドの起動
echo "📦 バックエンドサーバーを起動しています..."
cd backend

# 依存関係のインストール（初回のみ）
if [ ! -d "node_modules" ]; then
    echo "📥 バックエンドの依存関係をインストールしています..."
    npm install
fi

# ts-nodeのパス設定
export NODE_OPTIONS="-r tsconfig-paths/register"

# バックエンドをバックグラウンドで起動
npm run dev &
BACKEND_PID=$!

echo "✅ バックエンドが起動しました (PID: $BACKEND_PID)"

# フロントエンドの起動
echo "🎨 フロントエンドサーバーを起動しています..."
cd ../frontend

# 依存関係のインストール（初回のみ）
if [ ! -d "node_modules" ]; then
    echo "📥 フロントエンドの依存関係をインストールしています..."
    npm install
fi

# フロントエンドを起動
echo "✅ フロントエンドを起動します..."
npm run dev

# Ctrl+Cでの終了時にバックエンドも停止
trap "echo '⏹️  サービスを停止しています...'; kill $BACKEND_PID; exit" INT TERM
wait