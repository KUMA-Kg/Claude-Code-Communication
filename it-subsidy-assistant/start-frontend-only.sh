#!/bin/bash

echo "🎨 フロントエンドを起動します..."
echo ""

# フロントエンドディレクトリに移動
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/frontend

# 既存のViteプロセスを停止
pkill -f vite || true
sleep 1

# フロントエンドを起動
echo "📦 依存関係を確認..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modulesが見つかりません。インストール中..."
    npm install
fi

echo ""
echo "🚀 Viteサーバーを起動..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ フロントエンドPID: $FRONTEND_PID"
echo ""
echo "⏳ 起動を待っています..."
sleep 3

# 接続テスト
echo ""
echo "🔍 接続テスト..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ フロントエンドが正常に起動しました！"
    echo ""
    echo "📱 ブラウザで以下にアクセス："
    echo "   http://localhost:5173"
    echo ""
    echo "🛑 停止する場合: kill $FRONTEND_PID"
else
    echo "❌ フロントエンドの起動に失敗しました"
    echo "エラーログを確認してください"
fi