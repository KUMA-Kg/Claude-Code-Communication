-- IT補助金アシストツール 追加スキーマ
-- companies, applications, required_documents, eligibility_rules テーブルの追加

-- 企業情報マスターテーブル
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    corporate_number VARCHAR(13), -- 法人番号（13桁）
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    postal_code VARCHAR(8),
    prefecture VARCHAR(10),
    city VARCHAR(100),
    address VARCHAR(255),
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(500),
    email VARCHAR(255),
    representative_name VARCHAR(100),
    representative_title VARCHAR(50),
    established_date DATE,
    capital_amount INTEGER, -- 資本金（万円単位）
    employee_count INTEGER,
    annual_revenue INTEGER, -- 年商（万円単位）
    fiscal_year_end VARCHAR(4), -- 決算月（MM/DD形式）
    industry_code VARCHAR(10) REFERENCES industries(code),
    is_sme BOOLEAN DEFAULT true, -- 中小企業判定
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, corporate_number)
);

-- 申請情報管理テーブル
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id),
    application_frame VARCHAR(50), -- 申請枠（電子化枠、セキュリティ枠など）
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed')),
    submission_date TIMESTAMP WITH TIME ZONE,
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    application_data JSONB NOT NULL DEFAULT '{}', -- 申請時の全データ
    answers JSONB NOT NULL DEFAULT '{}', -- 質問への回答データ
    requested_amount INTEGER, -- 申請金額（円）
    approved_amount INTEGER, -- 承認金額（円）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 必要書類マスターテーブル
CREATE TABLE IF NOT EXISTS required_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 基本書類、財務書類、事業計画書類など
    file_format VARCHAR(20)[], -- 受付可能なファイル形式（PDF, Excel, Word等）
    is_template_available BOOLEAN DEFAULT false, -- テンプレート提供有無
    template_url VARCHAR(500),
    sample_url VARCHAR(500),
    max_file_size INTEGER DEFAULT 10485760, -- 最大ファイルサイズ（バイト）
    is_required BOOLEAN DEFAULT true, -- 必須/任意
    applicable_frames TEXT[], -- 適用される申請枠
    conditions JSONB, -- 表示条件（JSONで条件を定義）
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スケジュール管理テーブル
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL, -- 'deadline', 'meeting', 'submission', 'review', 'notification'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'postponed'
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_minutes INTEGER DEFAULT 1440, -- デフォルト24時間前
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- リマインダー管理テーブル
CREATE TABLE IF NOT EXISTS schedule_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'email', 'push', 'in_app'
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 申請枠判定ルールテーブル
CREATE TABLE IF NOT EXISTS eligibility_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id),
    frame_code VARCHAR(50) NOT NULL, -- 申請枠コード
    frame_name VARCHAR(100) NOT NULL, -- 申請枠名
    description TEXT,
    min_amount INTEGER, -- 最小申請額
    max_amount INTEGER, -- 最大申請額
    subsidy_rate DECIMAL(3,2), -- 補助率
    priority INTEGER DEFAULT 0, -- 判定優先順位
    conditions JSONB NOT NULL, -- 判定条件（JSON形式）
    required_documents TEXT[], -- この枠で必要な書類コード配列
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subsidy_id, frame_code)
);

-- インデックスの作成
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_corporate_number ON companies(corporate_number);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_subsidy_id ON applications(subsidy_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_required_documents_category ON required_documents(category);
CREATE INDEX idx_required_documents_applicable_frames ON required_documents(applicable_frames);
CREATE INDEX idx_eligibility_rules_subsidy_id ON eligibility_rules(subsidy_id);
CREATE INDEX idx_eligibility_rules_frame_code ON eligibility_rules(frame_code);

-- 更新日時自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_required_documents_updated_at BEFORE UPDATE ON required_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eligibility_rules_updated_at BEFORE UPDATE ON eligibility_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS（Row Level Security）の基本設定
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_reminders ENABLE ROW LEVEL SECURITY;

-- 企業情報は自社のみ参照・更新可能
CREATE POLICY companies_select_policy ON companies
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY companies_insert_policy ON companies
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY companies_update_policy ON companies
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY companies_delete_policy ON companies
    FOR DELETE
    USING (user_id = auth.uid());

-- スケジュールは作成者または関連する申請の所有者のみ参照可能
CREATE POLICY schedules_select_policy ON schedules
    FOR SELECT
    USING (
        created_by = auth.uid() OR
        application_id IN (
            SELECT a.id FROM applications a
            JOIN companies c ON c.id = a.company_id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY schedules_insert_policy ON schedules
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        application_id IN (
            SELECT a.id FROM applications a
            JOIN companies c ON c.id = a.company_id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY schedules_update_policy ON schedules
    FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY schedules_delete_policy ON schedules
    FOR DELETE
    USING (created_by = auth.uid());

-- リマインダーはスケジュールの所有者のみ参照可能
CREATE POLICY schedule_reminders_select_policy ON schedule_reminders
    FOR SELECT
    USING (
        schedule_id IN (
            SELECT id FROM schedules WHERE created_by = auth.uid()
        )
    );

-- 申請情報は自社のみ参照・更新可能
CREATE POLICY applications_select_policy ON applications
    FOR SELECT
    USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

CREATE POLICY applications_insert_policy ON applications
    FOR INSERT
    WITH CHECK (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

CREATE POLICY applications_update_policy ON applications
    FOR UPDATE
    USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

CREATE POLICY applications_delete_policy ON applications
    FOR DELETE
    USING (company_id IN (
        SELECT id FROM companies WHERE user_id = auth.uid()
    ));

-- 申請枠判定用ビューの作成
CREATE OR REPLACE VIEW v_eligibility_check AS
SELECT 
    er.id,
    er.subsidy_id,
    s.name as subsidy_name,
    er.frame_code,
    er.frame_name,
    er.description,
    er.min_amount,
    er.max_amount,
    er.subsidy_rate,
    er.conditions,
    er.required_documents
FROM eligibility_rules er
JOIN subsidies s ON s.id = er.subsidy_id
WHERE er.is_active = true AND s.is_active = true
ORDER BY er.priority;

-- 申請状況ダッシュボード用ビュー
CREATE OR REPLACE VIEW v_application_dashboard AS
SELECT 
    a.id,
    a.status,
    a.submission_date,
    a.requested_amount,
    a.approved_amount,
    c.name as company_name,
    s.name as subsidy_name,
    a.application_frame,
    er.frame_name
FROM applications a
JOIN companies c ON c.id = a.company_id
JOIN subsidies s ON s.id = a.subsidy_id
LEFT JOIN eligibility_rules er ON er.subsidy_id = a.subsidy_id AND er.frame_code = a.application_frame;

-- スケジュール管理ビュー
CREATE OR REPLACE VIEW v_schedule_dashboard AS
SELECT
    s.id,
    s.schedule_type,
    s.title,
    s.description,
    s.scheduled_date,
    s.location,
    s.status,
    s.reminder_enabled,
    s.reminder_minutes,
    a.id as application_id,
    a.status as application_status,
    c.name as company_name,
    sub.name as subsidy_name,
    s.created_at,
    s.updated_at
FROM schedules s
JOIN applications a ON a.id = s.application_id
JOIN companies c ON c.id = a.company_id
JOIN subsidies sub ON sub.id = a.subsidy_id
ORDER BY s.scheduled_date ASC;

-- インデックスの追加
CREATE INDEX idx_schedules_application_id ON schedules(application_id);
CREATE INDEX idx_schedules_scheduled_date ON schedules(scheduled_date);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_created_by ON schedules(created_by);
CREATE INDEX idx_schedule_reminders_schedule_id ON schedule_reminders(schedule_id);
CREATE INDEX idx_schedule_reminders_status ON schedule_reminders(status);

-- コメント追加
COMMENT ON TABLE companies IS '企業情報マスターテーブル';
COMMENT ON TABLE applications IS '補助金申請情報管理テーブル';
COMMENT ON TABLE required_documents IS '必要書類マスターテーブル';
COMMENT ON TABLE eligibility_rules IS '申請枠判定ルールテーブル';
COMMENT ON COLUMN companies.is_sme IS '中小企業基本法に基づく中小企業判定';
COMMENT ON COLUMN applications.application_data IS '申請時点の全データスナップショット（JSON形式）';
COMMENT ON COLUMN eligibility_rules.conditions IS '判定条件をJSON形式で定義（例: {"min_employees": 10, "has_security_investment": true}）';
COMMENT ON TABLE schedules IS 'スケジュール管理テーブル';
COMMENT ON TABLE schedule_reminders IS 'スケジュールリマインダー管理テーブル';
COMMENT ON COLUMN schedules.schedule_type IS 'スケジュールの種類（締切、面談、提出、審査、通知など）';
COMMENT ON COLUMN schedules.reminder_minutes IS 'スケジュール時刻の何分前にリマインダーを送信するか';