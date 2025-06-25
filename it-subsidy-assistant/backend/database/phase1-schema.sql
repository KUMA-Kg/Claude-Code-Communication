-- Phase 1 データ永続化スキーマ
-- 実用レベルのIT補助金アシスタント用

-- ==================================================
-- 1. ユーザー管理テーブル
-- ==================================================

-- ユーザー基本情報（Supabase Auth連携）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Supabase Auth のユーザーID
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 2. 診断セッション管理
-- ==================================================

-- 診断セッション
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 診断回答データ
CREATE TABLE IF NOT EXISTS diagnosis_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    question_code VARCHAR(100) NOT NULL,
    question_text TEXT,
    answer_value TEXT,
    answer_type VARCHAR(50), -- text, number, boolean, select, multi-select
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, question_code)
);

-- ==================================================
-- 3. 補助金推薦結果
-- ==================================================

-- 推薦結果
CREATE TABLE IF NOT EXISTS subsidy_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    subsidy_id VARCHAR(50) NOT NULL,
    subsidy_name VARCHAR(255),
    match_score DECIMAL(5,4), -- 0.0000 ~ 1.0000
    match_reasons JSONB DEFAULT '[]',
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 4. 生成文書管理
-- ==================================================

-- 生成文書
CREATE TABLE IF NOT EXISTS generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- application_form, business_plan, etc
    document_name VARCHAR(255),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    file_url VARCHAR(500),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 5. インデックス（パフォーマンス最適化）
-- ==================================================

-- ユーザー検索用
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- セッション検索用
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_user_id ON diagnosis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_code ON diagnosis_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_status ON diagnosis_sessions(status);

-- 回答データ検索用
CREATE INDEX IF NOT EXISTS idx_diagnosis_answers_session_id ON diagnosis_answers(session_id);

-- 推薦結果検索用
CREATE INDEX IF NOT EXISTS idx_subsidy_recommendations_session_id ON subsidy_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_recommendations_score ON subsidy_recommendations(match_score DESC);

-- 文書検索用
CREATE INDEX IF NOT EXISTS idx_generated_documents_user_id ON generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_session_id ON generated_documents(session_id);

-- ==================================================
-- 6. Row Level Security (RLS)
-- ==================================================

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidy_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can manage own sessions" ON diagnosis_sessions FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can manage own answers" ON diagnosis_answers FOR ALL USING (
    session_id IN (
        SELECT id FROM diagnosis_sessions 
        WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "Users can view own recommendations" ON subsidy_recommendations FOR SELECT USING (
    session_id IN (
        SELECT id FROM diagnosis_sessions 
        WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "Users can manage own documents" ON generated_documents FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- ==================================================
-- 7. トリガー関数
-- ==================================================

-- 更新日時自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガー適用
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_sessions_updated_at BEFORE UPDATE ON diagnosis_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 8. サンプルデータ（開発用）
-- ==================================================

-- テストユーザー
INSERT INTO users (email, name, company_name, role) VALUES
('test@example.com', 'テストユーザー', 'テスト株式会社', 'user'),
('admin@example.com', '管理者', 'IT補助金サポート', 'admin')
ON CONFLICT (email) DO NOTHING;