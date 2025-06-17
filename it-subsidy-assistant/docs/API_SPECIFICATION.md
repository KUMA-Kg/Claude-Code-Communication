# IT補助金アシストツール API仕様書

## 概要
IT補助金検索・資料作成アシストツールのREST API仕様書

**Version**: 1.0.0  
**Base URL**: `https://api.it-subsidy-assistant.com/v1`  
**Authentication**: Bearer Token (JWT)

## 認証

### POST /auth/login
ユーザーログイン

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "山田太郎",
      "role": "user"
    }
  },
  "message": "Login successful"
}
```

### POST /auth/refresh
トークンリフレッシュ

**Headers**:
```
Authorization: Bearer <refresh_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "expiresIn": 3600
  }
}
```

## 補助金検索 API

### GET /subsidies/search
補助金検索

**Query Parameters**:
- `companySize` (string): 企業規模 (小規模事業者|中小企業|中堅企業)
- `industry` (string): 業種コード
- `investmentAmount` (number): 投資予定額
- `region` (string): 地域コード
- `deadline` (string): 申請期限フィルター
- `subsidyRate` (number): 最低補助率
- `page` (number): ページ番号 (default: 1)
- `limit` (number): 取得件数 (default: 20, max: 100)

**Request Example**:
```
GET /subsidies/search?companySize=中小企業&industry=IT&investmentAmount=5000000&page=1&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "subsidies": [
      {
        "id": "subsidy_001",
        "name": "IT導入補助金2025",
        "category": "デジタル化支援",
        "subsidyAmount": {
          "min": 300000,
          "max": 4500000
        },
        "subsidyRate": 0.5,
        "eligibleCompanies": ["中小企業", "小規模事業者"],
        "applicationPeriod": {
          "start": "2025-04-01T00:00:00Z",
          "end": "2025-12-28T23:59:59Z"
        },
        "requirements": [
          "IT導入支援事業者との連携必須",
          "交付決定後の発注・契約・支払"
        ],
        "matchScore": 0.95
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### GET /subsidies/{id}
補助金詳細取得

**Path Parameters**:
- `id` (string): 補助金ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "subsidy_001",
    "name": "IT導入補助金2025",
    "description": "中小企業・小規模事業者等のITツール導入を支援",
    "category": "デジタル化支援",
    "organizer": "独立行政法人中小企業基盤整備機構",
    "subsidyAmount": {
      "min": 300000,
      "max": 4500000
    },
    "subsidyRate": 0.5,
    "eligibleCompanies": ["中小企業", "小規模事業者"],
    "eligibleExpenses": [
      "ソフトウェア費",
      "クラウド利用料",
      "導入関連費"
    ],
    "applicationPeriod": {
      "start": "2025-04-01T00:00:00Z",
      "end": "2025-12-28T23:59:59Z"
    },
    "requirements": [
      "IT導入支援事業者との連携必須",
      "交付決定後の発注・契約・支払",
      "効果報告書の提出"
    ],
    "applicationFlow": [
      "事業計画書作成",
      "電子申請",
      "審査",
      "交付決定",
      "事業実施",
      "実績報告"
    ],
    "contactInfo": {
      "phone": "03-1234-5678",
      "email": "info@subsidy.go.jp",
      "website": "https://subsidy.go.jp"
    }
  }
}
```

### POST /subsidies/{id}/favorite
お気に入り追加

**Path Parameters**:
- `id` (string): 補助金ID

**Response**:
```json
{
  "success": true,
  "message": "Added to favorites"
}
```

### DELETE /subsidies/{id}/favorite
お気に入り削除

**Response**:
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

### GET /subsidies/favorites
お気に入り一覧

**Response**:
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "subsidy_001",
        "name": "IT導入補助金2025",
        "subsidyAmount": {
          "min": 300000,
          "max": 4500000
        },
        "addedAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

## 資料作成 API

### GET /documents/templates
テンプレート一覧

**Response**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_001",
        "name": "事業計画書テンプレート",
        "description": "IT導入補助金申請用事業計画書",
        "subsidyTypes": ["IT導入補助金"],
        "requiredFields": [
          "companyInfo",
          "businessPlan",
          "itInvestmentPlan"
        ],
        "estimatedTime": 30
      }
    ]
  }
}
```

### POST /documents/generate
資料生成

**Request Body**:
```json
{
  "templateId": "template_001",
  "subsidyId": "subsidy_001",
  "companyInfo": {
    "name": "株式会社テスト",
    "representative": "山田太郎",
    "address": "東京都千代田区1-1-1",
    "phone": "03-1234-5678",
    "email": "info@test.co.jp",
    "establishedDate": "2020-04-01",
    "employeeCount": 50,
    "capital": 10000000,
    "industry": "IT・情報通信業"
  },
  "businessPlan": {
    "currentChallenges": "業務効率化が課題",
    "solutionApproach": "ITツール導入による自動化",
    "expectedEffects": "作業時間50%削減"
  },
  "itInvestmentPlan": {
    "targetSoftware": "業務管理システム",
    "investmentAmount": 5000000,
    "implementationSchedule": "2025年6月〜8月",
    "expectedROI": "投資回収期間2年"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "documentId": "doc_001",
    "status": "generated",
    "downloadUrl": "https://api.example.com/documents/doc_001/download",
    "previewUrl": "https://api.example.com/documents/doc_001/preview",
    "expiresAt": "2025-01-22T23:59:59Z"
  }
}
```

### GET /documents/{id}
生成済み資料取得

**Path Parameters**:
- `id` (string): ドキュメントID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "doc_001",
    "templateId": "template_001",
    "subsidyId": "subsidy_001",
    "status": "completed",
    "createdAt": "2025-01-15T14:30:00Z",
    "downloadUrl": "https://api.example.com/documents/doc_001/download",
    "previewUrl": "https://api.example.com/documents/doc_001/preview"
  }
}
```

### GET /documents/{id}/download
資料ダウンロード

**Path Parameters**:
- `id` (string): ドキュメントID

**Response**: PDF file (application/pdf)

## エラーレスポンス

すべてのエラーレスポンスは以下の形式に従います：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データに誤りがあります",
    "details": [
      {
        "field": "companySize",
        "message": "企業規模は必須項目です"
      }
    ]
  },
  "requestId": "req_12345"
}
```

### エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| VALIDATION_ERROR | 入力値検証エラー | 400 |
| UNAUTHORIZED | 認証エラー | 401 |
| FORBIDDEN | 権限不足 | 403 |
| NOT_FOUND | リソースが見つからない | 404 |
| RATE_LIMIT_EXCEEDED | レート制限超過 | 429 |
| INTERNAL_SERVER_ERROR | サーバー内部エラー | 500 |
| SERVICE_UNAVAILABLE | サービス利用不可 | 503 |

## レート制限

- **一般API**: 1000 requests/hour per user
- **検索API**: 100 requests/minute per user
- **資料生成API**: 10 requests/hour per user

制限に達した場合、以下のヘッダーが返されます：
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642694400
Retry-After: 3600
```

## セキュリティ

### HTTPS必須
すべてのAPI通信はHTTPS必須です。

### CSRFプロテクション
状態を変更するAPIには CSRFトークンが必要です。

### データ保護
- 個人情報は暗号化保存
- GDPR準拠
- 監査ログ記録

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | 初版リリース |