-- 診断セッションテーブル
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    company_info JSONB,
    diagnosis_data JSONB,
    matched_subsidies JSONB,
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 診断回答履歴テーブル
CREATE TABLE IF NOT EXISTS diagnosis_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    question_key VARCHAR(255) NOT NULL,
    answer JSONB NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, question_key)
);

-- 必要書類判定結果テーブル
CREATE TABLE IF NOT EXISTS document_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    subsidy_id UUID REFERENCES subsidies(id),
    document_type VARCHAR(255) NOT NULL,
    is_required BOOLEAN DEFAULT true,
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- フォームデータ保存テーブル
CREATE TABLE IF NOT EXISTS form_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    form_type VARCHAR(100) NOT NULL,
    form_data JSONB NOT NULL,
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 生成書類テーブル
CREATE TABLE IF NOT EXISTS generated_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_data BYTEA,
    metadata JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_diagnosis_sessions_user_id ON diagnosis_sessions(user_id);
CREATE INDEX idx_diagnosis_sessions_status ON diagnosis_sessions(status);
CREATE INDEX idx_diagnosis_sessions_created_at ON diagnosis_sessions(created_at);
CREATE INDEX idx_diagnosis_answers_session_id ON diagnosis_answers(session_id);
CREATE INDEX idx_document_requirements_session_id ON document_requirements(session_id);
CREATE INDEX idx_form_data_session_id ON form_data(session_id);
CREATE INDEX idx_form_data_user_id ON form_data(user_id);
CREATE INDEX idx_generated_documents_session_id ON generated_documents(session_id);
CREATE INDEX idx_generated_documents_user_id ON generated_documents(user_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- diagnosis_sessionsのRLSポリシー
CREATE POLICY "Users can view their own diagnosis sessions" ON diagnosis_sessions
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create diagnosis sessions" ON diagnosis_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own diagnosis sessions" ON diagnosis_sessions
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- diagnosis_answersのRLSポリシー
CREATE POLICY "Users can view answers for their sessions" ON diagnosis_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM diagnosis_sessions 
            WHERE diagnosis_sessions.id = diagnosis_answers.session_id 
            AND (diagnosis_sessions.user_id = auth.uid() OR diagnosis_sessions.user_id IS NULL)
        )
    );

CREATE POLICY "Users can create answers for their sessions" ON diagnosis_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM diagnosis_sessions 
            WHERE diagnosis_sessions.id = diagnosis_answers.session_id 
            AND (diagnosis_sessions.user_id = auth.uid() OR diagnosis_sessions.user_id IS NULL)
        )
    );

-- document_requirementsのRLSポリシー
CREATE POLICY "Users can view document requirements for their sessions" ON document_requirements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM diagnosis_sessions 
            WHERE diagnosis_sessions.id = document_requirements.session_id 
            AND (diagnosis_sessions.user_id = auth.uid() OR diagnosis_sessions.user_id IS NULL)
        )
    );

-- form_dataのRLSポリシー
CREATE POLICY "Users can view their own form data" ON form_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own form data" ON form_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form data" ON form_data
    FOR UPDATE USING (auth.uid() = user_id);

-- generated_documentsのRLSポリシー
CREATE POLICY "Users can view their own generated documents" ON generated_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated documents" ON generated_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- トリガー関数：updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
CREATE TRIGGER update_diagnosis_sessions_updated_at BEFORE UPDATE ON diagnosis_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_data_updated_at BEFORE UPDATE ON form_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();