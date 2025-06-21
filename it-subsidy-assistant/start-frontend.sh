#!/bin/bash

echo "🚀 IT補助金アシストツール フロントエンド起動スクリプト"
echo "==========================================="

# フロントエンドディレクトリに移動
cd frontend

# 既存のプロセスを終了
echo "既存のプロセスを終了中..."
pkill -f vite || true
pkill -f "python.*http.server" || true

# ポートが空いているか確認
echo "ポート5173の状態を確認中..."
lsof -i :5173 || echo "✅ ポート5173は利用可能です"

# Viteを起動
echo "Viteサーバーを起動中..."
npm run dev

echo "==========================================="
echo "📌 以下のURLでアクセスしてください:"
echo "   http://localhost:5173/"
echo "   http://localhost:5173/flow (申請フロー)"
echo "==========================================="