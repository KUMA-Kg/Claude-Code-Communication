#!/bin/bash

echo "🔧 クイック修正を実行します..."
echo ""

# 1. 全プロセスを停止
echo "1️⃣ 既存のプロセスを停止..."
pkill -f "node.*backend" || true
pkill -f "vite" || true
sleep 2

# 2. シンプルなテストサーバーを作成
echo "2️⃣ シンプルなテストサーバーを作成..."
cd /Users/apple/Desktop/claudecode_cursor_demo/Claude-Code-Communication/it-subsidy-assistant/backend

cat > test-server.js << 'EOF'
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

// テスト用のログインエンドポイント
app.post('/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({
      success: true,
      data: {
        token: 'test-token-123',
        refreshToken: 'test-refresh-123',
        user: {
          id: '1',
          email: email,
          name: 'テストユーザー'
        }
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: { message: 'メールアドレスとパスワードが必要です' }
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ テストサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`🔍 ヘルスチェック: http://localhost:${PORT}/health`);
});
EOF

# 3. テストサーバーを起動
echo "3️⃣ テストサーバーを起動..."
node test-server.js &
SERVER_PID=$!
echo "サーバーPID: $SERVER_PID"

sleep 2

# 4. 接続テスト
echo ""
echo "4️⃣ 接続テスト..."
curl -s http://localhost:3001/health | jq . || echo "❌ 接続できません"

echo ""
echo "✅ 修正完了！"
echo ""
echo "📱 ブラウザで http://localhost:5173 にアクセスしてください"
echo "🛑 停止する場合: kill $SERVER_PID"
echo ""
echo "⚠️  これは一時的なテストサーバーです。"
echo "   本来のバックエンドを修正する必要があります。"