# IT補助金アシスタント システム仕様書

## 1. システム概要

### 1.1 プロジェクト名
IT補助金アシスタント（IT Subsidy Assistant）

### 1.2 目的
中小企業が各種補助金（IT導入補助金、ものづくり補助金、持続化補助金、事業再構築補助金）の申請を効率的に行えるよう支援するWebアプリケーション

### 1.3 主要機能
- 補助金診断機能
- AI申請書自動生成
- 必要書類チェックリスト
- 申請スケジュール管理
- リアルタイム進捗管理

## 2. システム構成

### 2.1 技術スタック
#### フロントエンド
- **フレームワーク**: React 18.3.1 + TypeScript 5.5.3
- **ビルドツール**: Vite 5.4.2
- **スタイリング**: CSS Modules + Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect)
- **ルーティング**: React Router v6
- **アイコン**: Lucide React
- **HTTP通信**: Axios

#### バックエンド
- **ランタイム**: Node.js + TypeScript
- **フレームワーク**: Express.js
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **AI連携**: OpenAI API (GPT-3.5-turbo)
- **リアルタイム**: Socket.io
- **セキュリティ**: Helmet, CORS, Rate Limiting

### 2.2 インフラストラクチャ
- **ホスティング**: Vercel (フロントエンド) / Railway (バックエンド)
- **データベース**: Supabase (PostgreSQL)
- **CDN**: Cloudflare
- **モニタリング**: Sentry, Google Analytics

## 3. 機能仕様

### 3.1 補助金診断機能
#### 3.1.1 診断フロー
1. **業種選択**
   - 製造業、サービス業、小売業、IT業、その他から選択
   - アイコン付きの選択UI

2. **従業員数入力**
   - 1-5名、6-20名、21-50名、51-100名、101名以上から選択

3. **課題・ニーズ選択**（複数選択可）
   - 業務効率化・自動化
   - 新商品・サービス開発
   - 販路拡大・マーケティング強化
   - 設備投資・生産性向上
   - 事業転換・新分野進出

4. **診断結果表示**
   - マッチ度スコア（0-100%）
   - 補助金ごとの適合度表示
   - 推奨理由の説明

#### 3.1.2 スコアリングアルゴリズム
```typescript
// スコア計算ロジック
calculateScore(businessType, employeeCount, challenges) {
  let score = 0;
  
  // 業種別の基礎スコア
  if (subsidyType === 'it-donyu' && challenges.includes('efficiency')) {
    score += 40;
  }
  
  // 従業員数による調整
  if (employeeCount <= 20 && subsidyType === 'jizokuka') {
    score += 30;
  }
  
  // 課題マッチング
  challenges.forEach(challenge => {
    if (subsidyRelevantChallenges[subsidyType].includes(challenge)) {
      score += 10;
    }
  });
  
  return Math.min(score, 100);
}
```

### 3.2 AI申請書生成機能
#### 3.2.1 簡易フォーム（3問）
1. **プロジェクト概要**
   - 実施したい内容を簡潔に記載（200文字以内）
   
2. **期待される効果**
   - 改善される業務や削減される時間（200文字以内）
   
3. **成功イメージ**
   - プロジェクト成功後の理想的な状態（200文字以内）

#### 3.2.2 AI文書生成
- **使用モデル**: OpenAI GPT-3.5-turbo
- **プロンプト設計**:
```typescript
const prompt = `
以下の情報を基に、${subsidyName}の申請書類を作成してください。

【申請者情報】
${applicantInfo}

【プロジェクト概要】
${projectOverview}

【期待される効果】
${expectedOutcome}

【成功イメージ】
${successImage}

以下の形式で、プロフェッショナルな申請書を生成してください：
1. 事業計画書
2. 実施体制
3. 実施スケジュール
4. 期待される効果（数値目標含む）
5. 収支計画

具体的な数値目標を含め、説得力のある内容にしてください。
`;
```

#### 3.2.3 生成される文書
- **事業計画書**: 背景、目的、実施内容を含む詳細な計画
- **効果測定指標**: 
  - 業務時間削減率（例：35%削減）
  - コスト削減額（例：年間252万円）
  - 生産性向上率（例：1.5倍）
- **実施スケジュール**: 月次のガントチャート形式
- **予算計画**: 項目別の詳細な費用内訳

### 3.3 必要書類管理機能
#### 3.3.1 書類チェックリスト
**共通書類**
- 納税証明書
- 履歴事項全部証明書（登記簿謄本）
- 決算書類（直近2期分）
- 事業計画書

**補助金別必要書類**
- IT導入補助金:
  - gBizIDプライム
  - SECURITY ACTION自己宣言
  - 身分証明書
  
- ものづくり補助金:
  - 認定経営革新等支援機関の確認書
  - 賃金引上げ計画の表明書
  - 従業員数証明書類

#### 3.3.2 書類準備ガイド
- 取得場所の案内（税務署、法務局など）
- 取得にかかる日数
- 手数料情報
- オンライン申請可否
- 準備のポイント

### 3.4 スケジュール管理機能
#### 3.4.1 タイムライン表示
- 締切までの残日数カウントダウン
- マイルストーン管理
  - 書類準備期間
  - 申請書作成期間
  - 最終確認期間
- 進捗状況の可視化

#### 3.4.2 次のアクションガイド
- 書類準備完了後の具体的なステップ
- 電子申請システム（jGrants）への導線
- チェックリスト形式での進捗管理

### 3.5 申請者情報管理
#### 3.5.1 企業プロフィール
- 会社名
- 代表者名
- 所在地
- 設立年月日
- 資本金
- 従業員数
- 事業内容

#### 3.5.2 データ永続化
- LocalStorageによる一時保存
- セッション間でのデータ保持
- エクスポート機能（PDF/CSV）

## 4. UI/UXデザイン

### 4.1 デザインシステム
#### カラーパレット
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
}
```

#### コンポーネント設計
- **カード型UI**: 情報の整理と視認性向上
- **プログレスバー**: 進捗の可視化
- **モーダル**: 詳細情報の表示
- **トースト通知**: 操作フィードバック

### 4.2 レスポンシブデザイン
- モバイルファースト設計
- ブレークポイント:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### 4.3 アクセシビリティ
- WCAG 2.1 Level AA準拠
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 高コントラストモード

## 5. セキュリティ仕様

### 5.1 認証・認可
- Supabase Authによる認証
- JWTトークンベース認証
- セッション管理（有効期限: 24時間）

### 5.2 データ保護
- HTTPS通信の強制
- 入力値検証とサニタイゼーション
- SQLインジェクション対策
- XSS対策（React自動エスケープ）
- CSRF対策

### 5.3 API保護
- Rate Limiting（1IP: 100req/15min）
- CORS設定
- APIキー管理（環境変数）

## 6. パフォーマンス仕様

### 6.1 ページロード目標
- First Contentful Paint: < 1.5秒
- Time to Interactive: < 3秒
- Largest Contentful Paint: < 2.5秒

### 6.2 最適化施策
- コード分割（React.lazy）
- 画像最適化（WebP形式）
- CDN利用
- ブラウザキャッシュ活用
- Gzip圧縮

## 7. データモデル

### 7.1 主要エンティティ
```sql
-- ユーザー
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 診断結果
CREATE TABLE diagnosis_results (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_type VARCHAR(50),
  employee_count VARCHAR(20),
  challenges TEXT[],
  scores JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 申請書類
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subsidy_type VARCHAR(50),
  content JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 書類チェックリスト
CREATE TABLE document_checklists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subsidy_type VARCHAR(50),
  checked_documents JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 8. API仕様

### 8.1 エンドポイント一覧
```typescript
// 診断関連
POST   /api/diagnosis/start         // 診断開始
POST   /api/diagnosis/complete      // 診断完了・結果保存

// AI文書生成
POST   /api/ai/generate-document    // AI申請書生成
POST   /api/ai/enhance-text         // テキスト改善

// 書類管理
GET    /api/documents/checklist/:subsidyType  // チェックリスト取得
PUT    /api/documents/checklist/:subsidyType  // チェックリスト更新

// 申請管理
GET    /api/applications            // 申請一覧取得
POST   /api/applications            // 新規申請作成
PUT    /api/applications/:id        // 申請更新
DELETE /api/applications/:id        // 申請削除

// ユーザー管理
GET    /api/users/profile           // プロフィール取得
PUT    /api/users/profile           // プロフィール更新
```

### 8.2 レスポンス形式
```typescript
// 成功時
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "metadata": {
    "timestamp": "2024-01-15T10:00:00Z",
    "version": "1.0"
  }
}

// エラー時
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

## 9. デプロイメント

### 9.1 環境構成
- **開発環境**: localhost
- **ステージング環境**: staging.it-subsidy-assistant.com
- **本番環境**: it-subsidy-assistant.com

### 9.2 CI/CD
- GitHub Actions
- 自動テスト実行
- 自動デプロイ（main branch）

### 9.3 監視・運用
- エラー監視: Sentry
- パフォーマンス監視: Google Analytics
- ログ管理: CloudWatch
- バックアップ: 日次自動バックアップ

## 10. 今後の拡張予定

### 10.1 Phase 2機能
- 複数ユーザー対応（チーム機能）
- 申請書バージョン管理
- コメント・レビュー機能
- 外部連携（会計ソフト等）

### 10.2 Phase 3機能
- モバイルアプリ開発
- 多言語対応
- 高度なAI分析機能
- 申請代行サービス連携

## 11. 制約事項

### 11.1 技術的制約
- ブラウザ対応: Chrome, Firefox, Safari, Edge（最新2バージョン）
- JavaScript有効必須
- 画面解像度: 最小320px

### 11.2 運用制約
- 同時接続数: 最大1000ユーザー
- データ保存期間: 1年間
- ファイルアップロード: 最大10MB/ファイル

## 12. 用語集

| 用語 | 説明 |
|------|------|
| gBizID | 法人・個人事業主向け共通認証システム |
| jGrants | 補助金電子申請システム |
| 認定経営革新等支援機関 | 中小企業の経営相談を行う国認定機関 |
| SECURITY ACTION | 情報セキュリティ対策自己宣言制度 |

---

**文書情報**
- バージョン: 1.0.0
- 作成日: 2024-01-15
- 最終更新日: 2024-01-15
- 作成者: IT補助金アシスタント開発チーム