#!/bin/bash

echo "🔄 サーバーを再起動します..."
echo ""

# 1. 全プロセスを停止
echo "🛑 既存のプロセスを停止..."
pkill -f "test-server" || true
pkill -f "vite" || true
sleep 2

# 2. バックエンド（テストサーバー）を起動
echo "📦 バックエンドを起動..."
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend
node test-server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "バックエンドPID: $BACKEND_PID"
sleep 2

# 3. フロントエンドを起動（IPv4を強制）
echo "🎨 フロントエンドを起動..."
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/frontend

# Viteの設定を一時的に変更
cat > vite.config.temp.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',  // IPv4を強制
    port: 5173,
    strictPort: true
  }
})
EOF

# 元の設定をバックアップ
cp vite.config.ts vite.config.ts.bak 2>/dev/null || true
cp vite.config.temp.ts vite.config.ts

# フロントエンドを起動
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "フロントエンドPID: $FRONTEND_PID"

echo ""
echo "⏳ サーバーの起動を待っています..."
sleep 5

# 4. 接続テスト
echo ""
echo "🔍 接続テスト..."
echo "バックエンド (3001):"
curl -s http://127.0.0.1:3001/health || echo "❌ 接続できません"

echo ""
echo "フロントエンド (5173):"
curl -s -I http://127.0.0.1:5173 | head -1 || echo "❌ 接続できません"

echo ""
echo "✅ 完了！"
echo ""
echo "📱 以下のURLでアクセスしてください："
echo "   http://127.0.0.1:5173"
echo "   または"
echo "   http://localhost:5173"
echo ""
echo "🛑 停止: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📋 ログ確認:"
echo "   バックエンド: tail -f backend/backend.log"
echo "   フロントエンド: tail -f frontend.log"