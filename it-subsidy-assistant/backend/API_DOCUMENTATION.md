# IT補助金アシストツール バックエンドAPI ドキュメント

## 概要

IT補助金アシストツールのバックエンドAPIは、補助金申請プロセスを効率化するための包括的なRESTful APIを提供します。

### ベースURL
```
開発環境: http://localhost:3001/v1
本番環境: https://api.it-subsidy-assistant.com/v1
```

### 認証
すべてのAPIエンドポイント（認証エンドポイントを除く）はJWT Bearer Token認証が必要です。

```
Authorization: Bearer <your-jwt-token>
```

## エンドポイント一覧

### 1. 認証 API

#### ユーザー登録
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "山田太郎"
}
```

#### ログイン
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### トークンリフレッシュ
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### 2. 企業情報 API

#### 企業一覧取得
```http
GET /companies
Authorization: Bearer <token>
```

#### 企業詳細取得
```http
GET /companies/:id
Authorization: Bearer <token>
```

#### 企業登録
```http
POST /companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "株式会社サンプル",
  "corporate_number": "1234567890123",
  "postal_code": "100-0001",
  "prefecture": "東京都",
  "city": "千代田区",
  "address": "千代田1-1-1",
  "phone": "03-1234-5678",
  "representative_name": "代表太郎",
  "capital_amount": 10000,
  "employee_count": 50,
  "industry_code": "G"
}
```

#### 企業情報更新
```http
PUT /companies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee_count": 55,
  "annual_revenue": 500000
}
```

#### 法人番号で検索
```http
GET /companies/search/corporate-number/:number
Authorization: Bearer <token>
```

### 3. 申請枠判定 API

#### 簡易判定（3つの質問）
```http
POST /eligibility/subsidies/:subsidyId/check-eligibility-simple
Authorization: Bearer <token>
Content-Type: application/json

{
  "hasDigitization": true,
  "hasSecurityInvestment": false,
  "isInvoiceRequired": true
}
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "recommended_frame": {
      "frame_code": "digitization",
      "frame_name": "電子化枠",
      "description": "紙業務の電子化・ペーパーレス化を主目的とした申請枠",
      "match_score": 90,
      "min_amount": 300000,
      "max_amount": 3500000,
      "subsidy_rate": 0.67,
      "is_eligible": true,
      "required_documents": ["DOC001", "DOC002", "DOC003", "DOC004", "DOC005", "DOC006", "DOC007", "DOC011", "DOC012"]
    },
    "questions_asked": {
      "hasDigitization": true,
      "hasSecurityInvestment": false,
      "isInvoiceRequired": true
    }
  }
}
```

#### 詳細判定
```http
POST /eligibility/subsidies/:subsidyId/check-eligibility
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": {
    "q_digitization_purpose": "main",
    "q_has_paper_workflow": true,
    "q_paper_reduction_target": 70,
    "q_security_purpose": "none",
    "q_invoice_purpose": true,
    "q_is_taxable_business": true,
    "q_invoice_status": "not_registered"
  }
}
```

#### 申請枠一覧取得
```http
GET /eligibility/subsidies/:subsidyId/frames
Authorization: Bearer <token>
```

#### 申請枠詳細取得
```http
GET /eligibility/subsidies/:subsidyId/frames/:frameCode
Authorization: Bearer <token>
```

#### 判定用質問取得
```http
GET /eligibility/subsidies/:subsidyId/eligibility-questions
Authorization: Bearer <token>
```

### 4. 必要書類自動抽出 API

#### 申請枠別必要書類取得
```http
GET /required-documents/subsidies/:subsidyId/frames/:frameCode/documents
Authorization: Bearer <token>
```

#### カテゴリ別必要書類取得
```http
GET /required-documents/subsidies/:subsidyId/frames/:frameCode/documents/by-category
Authorization: Bearer <token>
```

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "category": "基本書類",
      "documents": [
        {
          "document_code": "DOC001",
          "name": "事業概要説明書",
          "description": "申請企業の事業内容や経営状況を説明する書類",
          "is_required": true,
          "is_template_available": true,
          "file_format": ["PDF", "Word"]
        }
      ]
    }
  ],
  "total_documents": 12
}
```

#### 自動書類抽出（3つの質問から）
```http
POST /required-documents/subsidies/:subsidyId/documents/auto-extract
Authorization: Bearer <token>
Content-Type: application/json

{
  "hasDigitization": true,
  "hasSecurityInvestment": false,
  "isInvoiceRequired": false
}
```

#### 書類詳細取得
```http
GET /required-documents/documents/:documentCode
Authorization: Bearer <token>
```

#### 申請書類チェックリスト生成
```http
GET /required-documents/applications/:applicationId/document-checklist
Authorization: Bearer <token>
```

### 5. リアルタイム API

#### WebSocket接続情報取得
```http
GET /realtime/connection-info
Authorization: Bearer <token>
```

#### 接続状態確認
```http
GET /realtime/status
Authorization: Bearer <token>
```

#### メッセージブロードキャスト
```http
POST /realtime/applications/:applicationId/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "comment",
  "content": "書類をアップロードしました"
}
```

#### SSEサブスクリプション
```http
GET /realtime/subscribe/applications/:companyId
Authorization: Bearer <token>
Accept: text/event-stream
```

## データモデル

### Company（企業情報）
```typescript
{
  id: string;
  user_id: string;
  corporate_number?: string;
  name: string;
  name_kana?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;
  representative_name?: string;
  representative_title?: string;
  established_date?: string;
  capital_amount?: number;  // 万円単位
  employee_count?: number;
  annual_revenue?: number;  // 万円単位
  fiscal_year_end?: string;
  industry_code?: string;
  is_sme?: boolean;  // 中小企業判定
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}
```

### Application（申請情報）
```typescript
{
  id: string;
  company_id: string;
  subsidy_id: string;
  application_frame: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  submission_date?: string;
  approval_date?: string;
  rejection_reason?: string;
  application_data: object;
  answers: object;
  requested_amount?: number;
  approved_amount?: number;
  created_at: string;
  updated_at: string;
}
```

### RequiredDocument（必要書類）
```typescript
{
  id?: string;
  document_code: string;
  name: string;
  description?: string;
  category: string;
  file_format?: string[];
  is_template_available?: boolean;
  template_url?: string;
  sample_url?: string;
  max_file_size?: number;
  is_required?: boolean;
  applicable_frames?: string[];
  conditions?: object;
  sort_order?: number;
}
```

### EligibilityRule（申請枠判定ルール）
```typescript
{
  id: string;
  subsidy_id: string;
  frame_code: string;
  frame_name: string;
  description?: string;
  min_amount?: number;
  max_amount?: number;
  subsidy_rate?: number;
  priority?: number;
  conditions: object;
  required_documents?: string[];
  is_active?: boolean;
}
```

## エラーレスポンス

すべてのエラーレスポンスは以下の形式で返されます：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの詳細説明",
    "details": []  // バリデーションエラーの場合
  }
}
```

### 一般的なエラーコード

- `UNAUTHORIZED`: 認証が必要です
- `FORBIDDEN`: アクセス権限がありません
- `NOT_FOUND`: リソースが見つかりません
- `VALIDATION_ERROR`: 入力値が不正です
- `INTERNAL_ERROR`: サーバー内部エラー
- `RATE_LIMIT_EXCEEDED`: レート制限を超過しました

## レート制限

- 一般API: 1000 requests/hour
- 検索API: 100 requests/minute
- 資料生成API: 10 requests/hour

## 革新的な機能

### 1. SQLトリガーによる自動化
- 申請作成時に必要書類を自動判定・登録
- 申請枠変更時に必要書類を自動更新
- 企業情報から中小企業判定を自動実行

### 2. リアルタイムサブスクリプション
- 申請ステータスの変更をリアルタイムで通知
- 書類アップロード状況の即時反映
- 複数ユーザーの同時編集をサポート

### 3. RLSによるセキュリティ
- 企業間のデータ完全分離
- ユーザーは自社のデータのみアクセス可能
- 管理者権限による統合ビュー

### 4. Edge Functionsとの連携
- 高速レスポンスの実現
- サーバーレスアーキテクチャ
- 自動スケーリング