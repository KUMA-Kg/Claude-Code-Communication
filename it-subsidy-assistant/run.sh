#!/bin/bash

echo "🚀 IT補助金アシストツールを起動します..."
echo ""

# フロントエンドを起動（新しいターミナルウィンドウで）
echo "🎨 フロントエンドを起動中..."
osascript -e 'tell app "Terminal" to do script "cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/frontend && npm run dev"'

# バックエンドを起動（現在のターミナルで）
echo "📦 バックエンドを起動中..."
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend
npm run dev