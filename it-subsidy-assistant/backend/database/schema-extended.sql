-- 拡張可能な補助金選択システム データベーススキーマ
-- フェーズ1: 補助金マスターデータの拡張設計

-- 補助金マスターテーブル（拡張版）
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS subsidy_type VARCHAR(50) NOT NULL DEFAULT 'general';
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'closed', 'suspended'));
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100;
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 補助金タイプマスター
CREATE TABLE IF NOT EXISTS subsidy_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    color_scheme VARCHAR(7),
    sort_order INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 補助金履歴管理テーブル
CREATE TABLE IF NOT EXISTS subsidy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id),
    version INTEGER NOT NULL,
    changed_fields JSONB NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subsidy_id, version)
);

-- 動的質問管理テーブル
CREATE TABLE IF NOT EXISTS question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subsidy_id VARCHAR(50) REFERENCES subsidies(id),
    subsidy_type VARCHAR(50) REFERENCES subsidy_types(id),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 質問定義テーブル
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    question_code VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('text', 'number', 'select', 'multi-select', 'boolean', 'date', 'file')),
    input_config JSONB DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    help_text TEXT,
    sort_order INTEGER DEFAULT 100,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_set_id, question_code)
);

-- 質問の条件分岐定義
CREATE TABLE IF NOT EXISTS question_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN ('show_if', 'hide_if', 'required_if', 'validate_if')),
    depends_on_question_code VARCHAR(100) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL CHECK (condition_operator IN ('equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in')),
    condition_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 締切日程管理テーブル
CREATE TABLE IF NOT EXISTS subsidy_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id),
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('application', 'submission', 'result', 'grant')),
    round_number INTEGER,
    round_name VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'open', 'closed', 'extended', 'cancelled')),
    auto_update_enabled BOOLEAN DEFAULT true,
    source_url VARCHAR(500),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 締切アラート設定
CREATE TABLE IF NOT EXISTS deadline_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subsidy_id VARCHAR(50) NOT NULL REFERENCES subsidies(id),
    schedule_id UUID REFERENCES subsidy_schedules(id),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('email', 'push', 'both')),
    days_before INTEGER[] NOT NULL DEFAULT ARRAY[30, 14, 7, 1],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subsidy_id, schedule_id)
);

-- 自動更新ログ
CREATE TABLE IF NOT EXISTS auto_update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    update_source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- リアルタイム更新用のチャンネル設定
CREATE TABLE IF NOT EXISTS realtime_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name VARCHAR(100) UNIQUE NOT NULL,
    channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN ('subsidy_updates', 'deadline_alerts', 'system_notifications')),
    target_entity VARCHAR(50),
    target_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_subsidies_type ON subsidies(subsidy_type);
CREATE INDEX IF NOT EXISTS idx_subsidies_status ON subsidies(status);
CREATE INDEX IF NOT EXISTS idx_subsidies_priority ON subsidies(priority);
CREATE INDEX IF NOT EXISTS idx_subsidy_versions_subsidy_id ON subsidy_versions(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_questions_code ON questions(question_code);
CREATE INDEX IF NOT EXISTS idx_question_conditions_question_id ON question_conditions(question_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_schedules_subsidy_id ON subsidy_schedules(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_schedules_dates ON subsidy_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_deadline_alerts_user_id ON deadline_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_update_logs_target ON auto_update_logs(target_table, target_id);

-- 初期データ: 補助金タイプ
INSERT INTO subsidy_types (id, name, display_name, description, color_scheme, sort_order) VALUES
('it-donyu', 'IT導入補助金', 'IT導入補助金', '中小企業・小規模事業者のITツール導入を支援', '#2563eb', 10),
('jizokuka', '持続化補助金', '小規模事業者持続化補助金', '小規模事業者の販路開拓等を支援', '#16a34a', 20),
('jigyou-saikouchiku', '事業再構築補助金', '事業再構築補助金', '新分野展開や業態転換等の事業再構築を支援', '#dc2626', 30),
('monozukuri', 'ものづくり補助金', 'ものづくり・商業・サービス生産性向上促進補助金', '革新的サービス開発・試作品開発・生産プロセスの改善を支援', '#7c3aed', 40)
ON CONFLICT (id) DO NOTHING;

-- トリガー関数: バージョン管理
CREATE OR REPLACE FUNCTION track_subsidy_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- 変更されたフィールドを検出
        changed_fields := jsonb_build_object();
        
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changed_fields := changed_fields || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            changed_fields := changed_fields || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
        END IF;
        
        IF OLD.application_end IS DISTINCT FROM NEW.application_end THEN
            changed_fields := changed_fields || jsonb_build_object('application_end', jsonb_build_object('old', OLD.application_end, 'new', NEW.application_end));
        END IF;
        
        -- 変更がある場合のみ履歴を記録
        IF changed_fields != '{}'::jsonb THEN
            NEW.version := OLD.version + 1;
            
            INSERT INTO subsidy_versions (subsidy_id, version, changed_fields, changed_by)
            VALUES (NEW.id, NEW.version, changed_fields, current_setting('app.current_user_id', true)::uuid);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_subsidy_changes_trigger
BEFORE UPDATE ON subsidies
FOR EACH ROW EXECUTE FUNCTION track_subsidy_changes();

-- 関数: 締切日程の自動更新
CREATE OR REPLACE FUNCTION update_subsidy_status()
RETURNS void AS $$
BEGIN
    -- 締切済みの補助金をクローズ
    UPDATE subsidies s
    SET status = 'closed'
    FROM subsidy_schedules ss
    WHERE s.id = ss.subsidy_id
    AND s.status = 'active'
    AND ss.schedule_type = 'application'
    AND ss.end_date < NOW()
    AND NOT EXISTS (
        SELECT 1 FROM subsidy_schedules ss2
        WHERE ss2.subsidy_id = s.id
        AND ss2.schedule_type = 'application'
        AND ss2.end_date >= NOW()
    );
    
    -- 開始前の補助金をアップカミングに
    UPDATE subsidies s
    SET status = 'upcoming'
    FROM subsidy_schedules ss
    WHERE s.id = ss.subsidy_id
    AND s.status != 'upcoming'
    AND ss.schedule_type = 'application'
    AND ss.start_date > NOW();
    
    -- ログ記録
    INSERT INTO auto_update_logs (update_type, target_table, target_id, new_data, update_source)
    SELECT 'status_update', 'subsidies', id, jsonb_build_object('status', status), 'scheduled_job'
    FROM subsidies
    WHERE updated_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- 権限設定
ALTER TABLE subsidy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidy_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_channels ENABLE ROW LEVEL SECURITY;

-- 読み取り権限
CREATE POLICY "All users can view subsidy types" ON subsidy_types FOR SELECT USING (is_active = true);
CREATE POLICY "All users can view question sets" ON question_sets FOR SELECT USING (is_active = true);
CREATE POLICY "All users can view questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "All users can view question conditions" ON question_conditions FOR SELECT USING (true);
CREATE POLICY "All users can view schedules" ON subsidy_schedules FOR SELECT USING (true);
CREATE POLICY "Users can manage own alerts" ON deadline_alerts FOR ALL USING (auth.uid() = user_id);

-- 管理者権限
CREATE POLICY "Admins can manage subsidy versions" ON subsidy_versions FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view logs" ON auto_update_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);