const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

// v1 APIのヘルスチェック
app.get('/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'API v1 is running!' });
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
