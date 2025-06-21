#!/bin/bash

echo "🚀 IT補助金アシストツールを起動します..."
echo ""

# 既存のプロセスをクリーンアップ
echo "🧹 既存のプロセスをクリーンアップ中..."
pkill -f "node.*backend" || true
pkill -f "vite" || true
sleep 2

# バックエンドを起動（新しいターミナルで）
echo "📦 バックエンドを起動中..."
osascript -e 'tell app "Terminal" to do script "cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend && echo \"🔵 バックエンドサーバー起動中...\" && npm run dev"'

# 少し待つ
echo "⏳ バックエンドの起動を待機中..."
sleep 5

# フロントエンドを起動（新しいターミナルで）
echo "🎨 フロントエンドを起動中..."
osascript -e 'tell app "Terminal" to do script "cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/frontend && echo \"🟢 フロントエンドサーバー起動中...\" && npm run dev"'

echo ""
echo "✅ 起動完了！"
echo ""
echo "📱 アクセスURL:"
echo "   フロントエンド: http://localhost:5173"
echo "   バックエンドAPI: http://localhost:3001"
echo ""
echo "🔍 確認事項:"
echo "   1. 両方のターミナルウィンドウでエラーがないか確認"
echo "   2. バックエンドで「Server running on port 3001」が表示されるか確認"
echo "   3. フロントエンドで「Local: http://localhost:5173」が表示されるか確認"
echo ""
echo "⚠️  もしエラーが出た場合:"
echo "   - バックエンド: .envファイルが正しく設定されているか確認"
echo "   - フロントエンド: node_modulesが正しくインストールされているか確認"