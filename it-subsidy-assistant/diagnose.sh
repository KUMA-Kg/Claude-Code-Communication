#!/bin/bash

echo "🔍 システム診断を開始します..."
echo ""

# プロセスの確認
echo "📋 Node.jsプロセスの確認:"
ps aux | grep -E "(node|ts-node)" | grep -v grep || echo "  ❌ Node.jsプロセスが見つかりません"
echo ""

# ポートの確認
echo "🔌 ポート使用状況:"
echo "  Port 3001 (Backend):"
lsof -i :3001 || echo "    ❌ ポート3001は使用されていません"
echo "  Port 5173 (Frontend):"
lsof -i :5173 || echo "    ❌ ポート5173は使用されていません"
echo ""

# バックエンドディレクトリの確認
echo "📁 バックエンドディレクトリの確認:"
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend
echo "  現在のディレクトリ: $(pwd)"
echo "  .envファイル: $([ -f .env ] && echo '✅ 存在します' || echo '❌ 存在しません')"
echo "  node_modules: $([ -d node_modules ] && echo '✅ 存在します' || echo '❌ 存在しません')"
echo ""

# 環境変数の確認（値は隠す）
echo "🔐 環境変数の確認:"
if [ -f .env ]; then
    echo "  SUPABASE_URL: $(grep -q '^SUPABASE_URL=' .env && echo '✅ 設定済み' || echo '❌ 未設定')"
    echo "  SUPABASE_ANON_KEY: $(grep -q '^SUPABASE_ANON_KEY=' .env && echo '✅ 設定済み' || echo '❌ 未設定')"
    echo "  JWT_SECRET: $(grep -q '^JWT_SECRET=' .env && echo '✅ 設定済み' || echo '❌ 未設定')"
fi
echo ""

# 簡易的な起動テスト
echo "🧪 バックエンドの起動テスト:"
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend
timeout 10 npm run dev 2>&1 | head -20
echo ""

echo "✅ 診断完了"