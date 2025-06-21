# データベース詳細設計書

## 1. 設計思想

### データ再利用の最大化
- 一度入力されたデータは全ての場面で再利用
- 質問と回答を抽象化して、異なる補助金間でも共通利用
- 企業の成長に合わせてデータを蓄積・更新

## 2. テーブル定義

### 2.1 ユーザー・企業関連

```sql
-- ユーザーテーブル（Supabase Auth と連携）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企業マスター
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- 基本情報
    company_name VARCHAR(255) NOT NULL,
    company_name_kana VARCHAR(255),
    corporate_number VARCHAR(13), -- 法人番号
    established_date DATE,
    capital INTEGER,
    -- 分類
    industry_code VARCHAR(10),
    industry_name VARCHAR(100),
    company_size VARCHAR(20), -- small, medium, large
    -- 所在地
    postal_code VARCHAR(8),
    prefecture VARCHAR(20),
    city VARCHAR(100),
    address VARCHAR(255),
    -- 連絡先
    phone_number VARCHAR(20),
    fax_number VARCHAR(20),
    website_url VARCHAR(255),
    -- メタデータ
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企業の詳細プロファイル（年度ごとに管理）
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    -- 従業員情報
    employee_count INTEGER,
    fulltime_employee_count INTEGER,
    parttime_employee_count INTEGER,
    -- 財務情報
    annual_revenue BIGINT,
    operating_profit BIGINT,
    net_profit BIGINT,
    total_assets BIGINT,
    -- 事業情報
    main_business TEXT,
    business_description TEXT,
    -- R&D情報
    rd_investment BIGINT,
    rd_employee_count INTEGER,
    patents_count INTEGER,
    -- その他の構造化データ
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, fiscal_year)
);
```

### 2.2 質問管理システム

```sql
-- マスター質問定義
CREATE TABLE master_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- COMPANY_EMPLOYEE_COUNT
    category VARCHAR(50) NOT NULL, -- company_info, financial, business_plan
    subcategory VARCHAR(50),
    question_text TEXT NOT NULL,
    question_help TEXT, -- ヘルプテキスト
    input_type VARCHAR(30) NOT NULL, -- text, number, select, multiselect, date, file
    -- 入力制約
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    options JSONB, -- selectの場合の選択肢
    -- UI制御
    display_order INTEGER,
    depends_on VARCHAR(100), -- 他の質問への依存
    show_condition JSONB, -- 表示条件
    -- メタデータ
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 補助金ごとの質問マッピング
CREATE TABLE subsidy_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subsidy_id UUID REFERENCES subsidies(id) ON DELETE CASCADE,
    master_question_id UUID REFERENCES master_questions(id),
    -- この補助金での扱い
    is_required BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 100, -- 質問の優先順位
    group_name VARCHAR(100), -- 質問のグループ（画面表示用）
    -- カスタマイズ
    custom_question_text TEXT, -- この補助金用の質問文
    custom_help_text TEXT,
    custom_validation JSONB,
    -- 自動入力のためのマッピング
    auto_fill_from VARCHAR(100), -- どのフィールドから自動入力するか
    transform_rule JSONB, -- データ変換ルール
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subsidy_id, master_question_id)
);
```

### 2.3 補助金関連

```sql
-- 補助金マスター
CREATE TABLE subsidies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255), -- 実施機関
    description TEXT,
    purpose TEXT,
    -- 補助内容
    min_amount BIGINT,
    max_amount BIGINT,
    subsidy_rate DECIMAL(5,2), -- 補助率（%）
    -- 申請期間
    application_start_date DATE,
    application_end_date DATE,
    -- 対象条件
    target_company_size VARCHAR(50)[],
    target_industries VARCHAR(100)[],
    target_regions VARCHAR(50)[],
    eligibility_conditions JSONB,
    -- ドキュメント
    required_documents JSONB,
    official_url VARCHAR(500),
    guideline_url VARCHAR(500),
    -- ステータス
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 補助金の評価基準
CREATE TABLE subsidy_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subsidy_id UUID REFERENCES subsidies(id) ON DELETE CASCADE,
    criteria_name VARCHAR(255),
    description TEXT,
    weight INTEGER, -- 重要度
    evaluation_points JSONB, -- 評価ポイント
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 申請・回答管理

```sql
-- 検索セッション
CREATE TABLE search_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    -- セッション情報
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    -- 結果
    matched_subsidies UUID[], -- マッチした補助金ID
    match_scores JSONB, -- 各補助金のマッチスコア
    -- 回答データのスナップショット
    answers_snapshot JSONB
);

-- 申請管理
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    subsidy_id UUID REFERENCES subsidies(id),
    -- ステータス
    status VARCHAR(50) DEFAULT 'draft', -- draft, in_progress, submitted, approved, rejected
    -- 日付
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    deadline DATE,
    -- 進捗
    completion_rate DECIMAL(5,2),
    last_saved_at TIMESTAMP,
    -- メタデータ
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 統一回答ストレージ
CREATE TABLE answer_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    question_code VARCHAR(100) NOT NULL,
    -- 回答データ
    answer_value JSONB NOT NULL,
    answer_type VARCHAR(30), -- 回答の型
    -- コンテキスト
    source_type VARCHAR(50), -- search, application, manual
    source_id UUID, -- search_session_id or application_id
    -- バージョン管理
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT true,
    -- メタデータ
    confidence_score DECIMAL(3,2), -- AIが生成した場合の信頼度
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- 回答履歴インデックス
CREATE INDEX idx_answer_storage_lookup 
ON answer_storage(company_id, question_code, is_latest);
```

### 2.5 ドキュメント生成

```sql
-- ドキュメントテンプレート
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subsidy_id UUID REFERENCES subsidies(id),
    document_name VARCHAR(255),
    document_type VARCHAR(50), -- application_form, business_plan, financial_statement
    file_format VARCHAR(20), -- pdf, excel, word
    -- テンプレート定義
    template_data JSONB, -- テンプレートの構造
    field_mappings JSONB, -- 質問とフィールドのマッピング
    -- バージョン管理
    version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生成されたドキュメント
CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    template_id UUID REFERENCES document_templates(id),
    -- ファイル情報
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    -- 生成情報
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id),
    -- ステータス
    status VARCHAR(50), -- draft, final, submitted
    notes TEXT
);
```

### 2.6 学習・最適化

```sql
-- 質問の回答パターン学習
CREATE TABLE answer_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    question_code VARCHAR(100),
    -- パターン分析
    common_values JSONB, -- よく使われる値
    last_used_value JSONB, -- 最後に使用した値
    usage_count INTEGER DEFAULT 0,
    -- 予測用データ
    context_patterns JSONB, -- どのような文脈で使用されたか
    confidence_score DECIMAL(3,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 申請成功率トラッキング
CREATE TABLE application_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id),
    subsidy_id UUID REFERENCES subsidies(id),
    company_id UUID REFERENCES companies(id),
    -- 結果
    outcome VARCHAR(50), -- approved, rejected, withdrawn
    approved_amount BIGINT,
    rejection_reasons JSONB,
    -- 分析用データ
    answer_quality_scores JSONB,
    document_quality_scores JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. ビューとマテリアライズドビュー

```sql
-- 最新の企業情報統合ビュー
CREATE VIEW company_current_profile AS
SELECT 
    c.*,
    cp.fiscal_year,
    cp.employee_count,
    cp.annual_revenue,
    cp.main_business
FROM companies c
LEFT JOIN company_profiles cp ON c.id = cp.company_id
WHERE cp.fiscal_year = (
    SELECT MAX(fiscal_year) 
    FROM company_profiles 
    WHERE company_id = c.id
);

-- 回答の最新値ビュー
CREATE VIEW latest_answers AS
SELECT DISTINCT ON (company_id, question_code)
    company_id,
    question_code,
    answer_value,
    source_type,
    created_at,
    confidence_score
FROM answer_storage
WHERE is_latest = true
ORDER BY company_id, question_code, created_at DESC;
```

## 4. インデックス戦略

```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_companies_user ON companies(user_id);
CREATE INDEX idx_subsidy_status ON subsidies(status, application_end_date);
CREATE INDEX idx_applications_status ON applications(company_id, status);
CREATE INDEX idx_answer_storage_source ON answer_storage(source_type, source_id);
```

## 5. データ整合性とトリガー

```sql
-- 回答が更新されたら以前のバージョンのis_latestをfalseに
CREATE OR REPLACE FUNCTION update_answer_version()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE answer_storage
    SET is_latest = false
    WHERE company_id = NEW.company_id
    AND question_code = NEW.question_code
    AND id != NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_answer_version
AFTER INSERT ON answer_storage
FOR EACH ROW
EXECUTE FUNCTION update_answer_version();
```