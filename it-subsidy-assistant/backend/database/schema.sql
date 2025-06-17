-- IT補助金アシストツール データベーススキーマ
-- PostgreSQL / Supabase

-- ユーザー管理テーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- リフレッシュトークン管理
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT false
);

-- 補助金情報テーブル
CREATE TABLE subsidies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    subsidy_amount_min INTEGER NOT NULL,
    subsidy_amount_max INTEGER NOT NULL,
    subsidy_rate DECIMAL(3,2) NOT NULL CHECK (subsidy_rate > 0 AND subsidy_rate <= 1),
    eligible_companies TEXT[] NOT NULL,
    eligible_expenses TEXT[] NOT NULL,
    application_start TIMESTAMP WITH TIME ZONE NOT NULL,
    application_end TIMESTAMP WITH TIME ZONE NOT NULL,
    requirements TEXT[] NOT NULL,
    application_flow TEXT[] NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    contact_website VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 地域・業種マスタ
CREATE TABLE regions (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_code VARCHAR(10) REFERENCES regions(code)
);

CREATE TABLE industries (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_code VARCHAR(10) REFERENCES industries(code)
);

-- 補助金と地域・業種の関連
CREATE TABLE subsidy_regions (
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
    region_code VARCHAR(10) NOT NULL REFERENCES regions(code),
    PRIMARY KEY (subsidy_id, region_code)
);

CREATE TABLE subsidy_industries (
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
    industry_code VARCHAR(10) NOT NULL REFERENCES industries(code),
    PRIMARY KEY (subsidy_id, industry_code)
);

-- お気に入り管理
CREATE TABLE user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, subsidy_id)
);

-- 資料テンプレート管理
CREATE TABLE document_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subsidy_types TEXT[] NOT NULL,
    required_fields JSONB NOT NULL,
    template_content JSONB NOT NULL,
    estimated_time INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 生成済み資料管理
CREATE TABLE generated_documents (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id VARCHAR(50) NOT NULL REFERENCES document_templates(id),
    subsidy_id VARCHAR(50) REFERENCES subsidies(id),
    input_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_path VARCHAR(500),
    download_url VARCHAR(500),
    preview_url VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 検索ログ（分析用）
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    search_params JSONB NOT NULL,
    result_count INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レート制限管理
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

CREATE INDEX idx_subsidies_active ON subsidies(is_active);
CREATE INDEX idx_subsidies_category ON subsidies(category);
CREATE INDEX idx_subsidies_application_period ON subsidies(application_start, application_end);
CREATE INDEX idx_subsidies_amount ON subsidies(subsidy_amount_min, subsidy_amount_max);
CREATE INDEX idx_subsidies_rate ON subsidies(subsidy_rate);
CREATE INDEX idx_subsidies_search ON subsidies USING GIN (to_tsvector('japanese', name || ' ' || description));

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at);

CREATE INDEX idx_document_templates_active ON document_templates(is_active);
CREATE INDEX idx_generated_documents_user_id ON generated_documents(user_id);
CREATE INDEX idx_generated_documents_status ON generated_documents(status);
CREATE INDEX idx_generated_documents_expires ON generated_documents(expires_at);

CREATE INDEX idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);

CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- トリガー（更新日時自動設定）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subsidies_updated_at BEFORE UPDATE ON subsidies
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_generated_documents_updated_at BEFORE UPDATE ON generated_documents
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 初期データ投入
INSERT INTO regions (code, name) VALUES
('001', '北海道'),
('013', '東京都'),
('014', '神奈川県'),
('023', '愛知県'),
('027', '大阪府'),
('040', '福岡県');

INSERT INTO industries (code, name) VALUES
('IT', 'IT・情報通信業'),
('MFG', '製造業'),
('RTL', '小売業'),
('SVC', 'サービス業'),
('CON', '建設業'),
('TRP', '運輸業');

-- サンプル補助金データ
INSERT INTO subsidies (
    id, name, description, category, organizer,
    subsidy_amount_min, subsidy_amount_max, subsidy_rate,
    eligible_companies, eligible_expenses,
    application_start, application_end,
    requirements, application_flow,
    contact_phone, contact_email, contact_website
) VALUES (
    'subsidy_001',
    'IT導入補助金2025',
    '中小企業・小規模事業者等のITツール導入を支援',
    'デジタル化支援',
    '独立行政法人中小企業基盤整備機構',
    300000, 4500000, 0.50,
    ARRAY['中小企業', '小規模事業者'],
    ARRAY['ソフトウェア費', 'クラウド利用料', '導入関連費'],
    '2025-04-01 00:00:00+09',
    '2025-12-28 23:59:59+09',
    ARRAY['IT導入支援事業者との連携必須', '交付決定後の発注・契約・支払', '効果報告書の提出'],
    ARRAY['事業計画書作成', '電子申請', '審査', '交付決定', '事業実施', '実績報告'],
    '03-1234-5678',
    'info@subsidy.go.jp',
    'https://subsidy.go.jp'
);

-- サンプルテンプレート
INSERT INTO document_templates (
    id, name, description, subsidy_types, required_fields, template_content, estimated_time
) VALUES (
    'template_001',
    '事業計画書テンプレート',
    'IT導入補助金申請用事業計画書',
    ARRAY['IT導入補助金'],
    '{"companyInfo": ["required"], "businessPlan": ["required"], "itInvestmentPlan": ["required"]}'::jsonb,
    '{"sections": [{"title": "会社概要", "fields": ["name", "representative", "address"]}, {"title": "事業計画", "fields": ["currentChallenges", "solutionApproach"]}]}'::jsonb,
    30
);

-- 権限設定（Row Level Security）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ユーザー自身のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own tokens" ON refresh_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tokens" ON refresh_tokens FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own documents" ON generated_documents FOR ALL USING (auth.uid() = user_id);

-- 分析データは自身のもののみ
CREATE POLICY "Users can view own search logs" ON search_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own rate limits" ON rate_limits FOR SELECT USING (auth.uid() = user_id);

-- 補助金情報は全ユーザー読み取り可能
CREATE POLICY "All users can view active subsidies" ON subsidies FOR SELECT USING (is_active = true);
CREATE POLICY "All users can view regions" ON regions FOR SELECT USING (true);
CREATE POLICY "All users can view industries" ON industries FOR SELECT USING (true);
CREATE POLICY "All users can view subsidy regions" ON subsidy_regions FOR SELECT USING (true);
CREATE POLICY "All users can view subsidy industries" ON subsidy_industries FOR SELECT USING (true);
CREATE POLICY "All users can view active templates" ON document_templates FOR SELECT USING (is_active = true);

COMMENT ON TABLE users IS 'ユーザー管理テーブル';
COMMENT ON TABLE subsidies IS '補助金情報マスタ';
COMMENT ON TABLE user_favorites IS 'ユーザーお気に入り管理';
COMMENT ON TABLE generated_documents IS '生成済み資料管理';
COMMENT ON TABLE search_logs IS '検索ログ（分析用）';
COMMENT ON TABLE rate_limits IS 'API レート制限管理';