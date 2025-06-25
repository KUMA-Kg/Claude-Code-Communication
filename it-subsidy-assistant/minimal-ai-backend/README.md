# Minimal AI Backend

最小構成で動作するAI文書生成バックエンドシステムです。

## 特徴

- ✅ **ゼロ依存設計**: Express.jsとOpenAI APIのみで構築
- ✅ **シンプルな構成**: 単一ファイルで完結
- ✅ **CORS完全対応**: localhost:3000からのアクセスを許可
- ✅ **堅牢なエラーハンドリング**: 詳細なエラーメッセージ
- ✅ **ヘルスチェック機能**: システム状態の確認が可能

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルに以下を設定:
```
OPENAI_API_KEY=your_api_key_here
PORT=3001
```

### 3. サーバーの起動

```bash
npm start
```

## API エンドポイント

### ヘルスチェック
```
GET /health
```

レスポンス例:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "minimal-ai-backend",
  "port": 3001
}
```

### 文書生成
```
POST /api/generate
```

リクエストボディ:
```json
{
  "businessDescription": "IT関連のコンサルティング事業",
  "requestAmount": 1000000,
  "usagePurpose": "新しいシステム開発のための機材購入"
}
```

レスポンス例:
```json
{
  "success": true,
  "document": "生成された申請書...",
  "metadata": {
    "wordCount": 3500,
    "processingTime": "2500ms",
    "model": "gpt-4-turbo-preview",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## テスト方法

### cURL でのテスト

```bash
# ヘルスチェック
curl http://localhost:3001/health

# 文書生成
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessDescription": "IT関連のコンサルティング事業",
    "requestAmount": 1000000,
    "usagePurpose": "新しいシステム開発のための機材購入"
  }'
```

## トラブルシューティング

### ポート競合エラー
```
Error: listen EADDRINUSE: address already in use :::3001
```
解決方法:
```bash
# 使用中のプロセスを確認
lsof -i :3001
# プロセスを終了
kill -9 [PID]
```

### CORS エラー
フロントエンドからアクセスできない場合、`server.js`のCORS設定を確認してください。

## 技術スタック

- Node.js
- Express.js 4.18.2
- OpenAI API 4.20.0
- CORS 2.8.5
- dotenv 16.3.1