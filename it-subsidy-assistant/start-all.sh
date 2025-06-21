#!/bin/bash

echo "🚀 IT補助金アシストツールを起動します..."

# バックエンドを起動
echo "📦 バックエンドを起動中..."
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend
npm run dev &
BACKEND_PID=$!
echo "バックエンドPID: $BACKEND_PID"

# 少し待つ
sleep 3

# フロントエンドを起動
echo "🎨 フロントエンドを起動中..."
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/frontend
npm run dev &
FRONTEND_PID=$!
echo "フロントエンドPID: $FRONTEND_PID"

echo ""
echo "✅ 起動完了！"
echo ""
echo "📱 アクセスURL:"
echo "   フロントエンド: http://localhost:5173"
echo "   バックエンドAPI: http://localhost:3001"
echo ""
echo "🛑 停止するには:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "ログを確認中... (Ctrl+C で終了)"

# ログを表示
wait