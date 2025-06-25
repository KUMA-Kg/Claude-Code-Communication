# Phase 1 セキュリティ実装ガイド

## 🔒 実装済みセキュリティ機能

### 1. 基本セキュリティミドルウェア
- **場所**: `backend/src/middleware/basicSecurityMiddleware.ts`
- **機能**:
  - Helmetによるセキュリティヘッダー設定
  - JWT認証
  - CSRF対策
  - SQLインジェクション対策
  - XSS対策
  - 基本的なレート制限

### 2. 認証システム
- **場所**: `backend/src/routes/auth-basic.ts`
- **エンドポイント**:
  - `POST /api/auth/register` - ユーザー登録
  - `POST /api/auth/login` - ログイン
  - `GET /api/auth/csrf-token` - CSRFトークン取得

### 3. セキュリティヘルパー
- **場所**: `backend/src/utils/security-helpers.ts`
- **ユーティリティ**:
  - パスワード強度チェック
  - メールアドレス検証
  - セキュアなトークン生成
  - 入力サニタイゼーション

## 🚀 起動方法

### バックエンドサーバー（Phase 1モード）
```bash
cd backend

# 環境変数設定
cp .env.phase1 .env

# 依存関係インストール
npm install

# Phase 1サーバー起動
npm run dev:phase1
```

### セキュリティテスト実行
```bash
cd tests/security
npm test basic-security.test.js
```

## 🛡️ セキュリティ機能詳細

### 1. セキュリティヘッダー
```javascript
// Helmetによる自動設定
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: 基本的なCSP設定
```

### 2. JWT認証
```javascript
// トークン生成
const token = generateToken({
  id: user.id,
  email: user.email,
  role: user.role
});

// 保護されたルートでの使用
app.use('/api/protected', verifyToken, (req, res) => {
  // req.user でユーザー情報にアクセス
});
```

### 3. CSRF対策
```javascript
// トークン取得
GET /api/auth/csrf-token

// リクエストヘッダーに含める
headers: {
  'X-CSRF-Token': csrfToken
}
```

### 4. SQLインジェクション対策
- 全ての文字列入力を自動サニタイズ
- 危険な文字（シングルクォート、セミコロン等）をエスケープ
- SQLコメントを除去

### 5. XSS対策
- レスポンスのHTMLエンティティを自動エスケープ
- 危険なタグ（<script>等）を無効化

### 6. レート制限
- IPアドレスベースで1分間に100リクエストまで
- 制限超過時は429エラーとRetry-Afterヘッダーを返却

## 📝 使用例

### フロントエンドからの認証フロー
```javascript
// 1. ログイン
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const { token, csrfToken } = await loginResponse.json();

// 2. 認証が必要なAPIコール
const response = await fetch('http://localhost:3001/api/protected-endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ data: 'example' }),
});
```

## ⚠️ Phase 1の制限事項

1. **メモリベースのユーザーストア**
   - サーバー再起動でユーザーデータが失われる
   - 本番環境では必ずデータベースに移行すること

2. **簡易的なCSRF実装**
   - メモリベースのトークン管理
   - 本番環境ではRedis等での管理を推奨

3. **基本的なレート制限**
   - IPアドレスベースのみ
   - 本番環境では分散環境対応が必要

## 🔧 トラブルシューティング

### bcryptインストールエラー
```bash
# node-gypエラーの場合
npm install --save bcryptjs  # 純粋なJavaScript実装を使用
```

### JWTトークンエラー
```bash
# .envファイルを確認
JWT_SECRET=最低32文字以上の安全な文字列
```

### CORS エラー
```bash
# .envファイルでフロントエンドURLを設定
FRONTEND_URL=http://localhost:3000
```

## 📚 参考資料
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)