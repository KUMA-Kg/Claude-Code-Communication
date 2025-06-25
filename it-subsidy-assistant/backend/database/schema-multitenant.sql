-- マルチテナント対応 企業向けIT補助金アシスタント データベーススキーマ
-- Worker2実装: エンタープライズレベル マルチテナント・AI-インテリジェンスシステム

-- ==================================================
-- 1. 企業・テナント管理システム
-- ==================================================

-- 企業・組織管理テーブル（マルチテナント対応）
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) UNIQUE NOT NULL, -- テナント識別子
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    legal_name VARCHAR(255),
    business_registration_number VARCHAR(50), -- 法人登録番号
    industry_code VARCHAR(20), -- 業種コード
    industry_name VARCHAR(100),
    employee_count INTEGER,
    annual_revenue BIGINT, -- 年間売上
    established_date DATE,
    postal_code VARCHAR(20),
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url VARCHAR(500),
    -- AI マッチング用プロファイル
    business_profile JSONB DEFAULT '{}', -- 事業内容詳細
    it_maturity_level INTEGER CHECK (it_maturity_level BETWEEN 1 AND 5), -- ITレベル
    subsidy_history JSONB DEFAULT '[]', -- 過去の補助金履歴
    matching_preferences JSONB DEFAULT '{}', -- マッチング設定
    -- 権限・設定
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    max_users INTEGER DEFAULT 10,
    features_enabled JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーテーブル（マルチテナント対応）
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    auth_user_id UUID, -- Supabase Authのuser_id
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    department VARCHAR(100),
    position VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 2. AI補助金インテリジェンス システム
-- ==================================================

-- AI マッチングプロファイル
CREATE TABLE IF NOT EXISTS ai_matching_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_type VARCHAR(50) DEFAULT 'company', -- company, project, application
    entity_id UUID, -- 企業ID、プロジェクトID等
    -- AI分析用特徴量
    feature_vector JSONB NOT NULL DEFAULT '{}', -- 特徴ベクトル
    keywords TEXT[], -- キーワードリスト
    business_categories VARCHAR(100)[], -- 事業カテゴリ
    technology_stack JSONB DEFAULT '{}', -- 技術スタック
    investment_capacity INTEGER, -- 投資可能額
    urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5),
    -- スコアリング履歴
    last_analysis_at TIMESTAMP WITH TIME ZONE,
    analysis_version VARCHAR(20),
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI マッチングスコア履歴
CREATE TABLE IF NOT EXISTS ai_matching_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES ai_matching_profiles(id),
    subsidy_id VARCHAR(50) NOT NULL,
    -- マッチングスコア詳細
    overall_score DECIMAL(5,4) NOT NULL, -- 総合スコア (0-1)
    category_scores JSONB NOT NULL DEFAULT '{}', -- カテゴリ別スコア
    reason_codes VARCHAR(50)[], -- マッチング理由コード
    explanation TEXT, -- AI説明テキスト
    recommended_actions JSONB DEFAULT '[]', -- 推奨アクション
    -- メタデータ
    algorithm_version VARCHAR(20),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- リアルタイム補助金監視設定
CREATE TABLE IF NOT EXISTS subsidy_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    monitor_name VARCHAR(255) NOT NULL,
    -- 監視条件
    keywords TEXT[],
    industry_filters VARCHAR(100)[],
    amount_range_min BIGINT,
    amount_range_max BIGINT,
    deadline_alert_days INTEGER[] DEFAULT ARRAY[30, 14, 7, 3, 1],
    -- 通知設定
    notification_channels JSONB DEFAULT '{}', -- email, slack, webhook等
    notification_frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly
    min_score_threshold DECIMAL(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 3. リアルタイム通信・通知システム
-- ==================================================

-- リアルタイム通知テーブル
CREATE TABLE IF NOT EXISTS realtime_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id),
    notification_type VARCHAR(50) NOT NULL, -- match_found, deadline_alert, system_update
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    channels VARCHAR(50)[] DEFAULT ARRAY['in_app'], -- in_app, email, push, slack
    -- 状態管理
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WebSocket セッション管理
CREATE TABLE IF NOT EXISTS websocket_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    connection_data JSONB DEFAULT '{}',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 4. セキュリティ・監査システム
-- ==================================================

-- セキュリティ監査ログ
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES tenant_users(id),
    session_id VARCHAR(255),
    -- イベント詳細
    event_type VARCHAR(50) NOT NULL, -- login, access, data_export, admin_action
    resource_type VARCHAR(50), -- subsidy, application, user_data
    resource_id VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- read, write, delete, export
    -- セキュリティ情報
    ip_address INET,
    user_agent TEXT,
    risk_score DECIMAL(3,2), -- 0-1のリスクスコア
    threat_indicators JSONB DEFAULT '{}',
    geo_location JSONB DEFAULT '{}',
    -- 結果
    result VARCHAR(20) CHECK (result IN ('success', 'failed', 'blocked', 'suspicious')),
    failure_reason TEXT,
    compliance_flags VARCHAR(50)[], -- gdpr, sox, pci等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- データ処理記録（GDPR対応）
CREATE TABLE IF NOT EXISTS data_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    data_subject_id UUID, -- データ主体（ユーザー）のID
    processing_type VARCHAR(50) NOT NULL, -- collection, usage, sharing, deletion
    data_categories VARCHAR(100)[] NOT NULL, -- personal, financial, behavioral
    purpose VARCHAR(255) NOT NULL,
    legal_basis VARCHAR(100) NOT NULL, -- consent, contract, legitimate_interest
    retention_period INTERVAL,
    third_party_sharing JSONB DEFAULT '{}',
    user_consent_id UUID,
    processor_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 5. パフォーマンス・分析テーブル
-- ==================================================

-- システムメトリクス
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    metric_type VARCHAR(50) NOT NULL, -- api_response, db_query, ai_processing
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 6. インデックス（パフォーマンス最適化）
-- ==================================================

-- 基本インデックス
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_org_id ON tenant_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_auth_user_id ON tenant_users(auth_user_id);

-- AI関連インデックス
CREATE INDEX IF NOT EXISTS idx_ai_matching_profiles_org_id ON ai_matching_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_matching_scores_org_id ON ai_matching_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_matching_scores_subsidy_id ON ai_matching_scores(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_ai_matching_scores_score ON ai_matching_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_subsidy_monitoring_org_id ON subsidy_monitoring(organization_id);

-- 通知・リアルタイム関連
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_org_id ON realtime_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_user_id ON realtime_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_status ON realtime_notifications(status);
CREATE INDEX IF NOT EXISTS idx_websocket_sessions_org_id ON websocket_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_websocket_sessions_session_id ON websocket_sessions(session_id);

-- セキュリティ・監査関連
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_org_id ON security_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_org_id ON data_processing_logs(organization_id);

-- 複合インデックス（高速検索用）
CREATE INDEX IF NOT EXISTS idx_ai_scores_org_subsidy ON ai_matching_scores(organization_id, subsidy_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_status_created ON realtime_notifications(organization_id, status, created_at);

-- ==================================================
-- 7. Row Level Security (RLS) 設定
-- ==================================================

-- 全テーブルでRLS有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matching_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matching_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidy_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- テナント分離ポリシー
CREATE POLICY "Organizations access own data" ON organizations FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', true)
    OR EXISTS (
        SELECT 1 FROM tenant_users 
        WHERE auth_user_id = auth.uid() 
        AND organization_id = organizations.id
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "Users access own organization" ON tenant_users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = tenant_users.organization_id 
        AND tenant_id = current_setting('app.current_tenant', true)
    )
    OR auth_user_id = auth.uid()
);

-- AI・分析データアクセス
CREATE POLICY "AI profiles tenant isolation" ON ai_matching_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = ai_matching_profiles.organization_id 
        AND tenant_id = current_setting('app.current_tenant', true)
    )
);

CREATE POLICY "AI scores tenant isolation" ON ai_matching_scores FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = ai_matching_scores.organization_id 
        AND tenant_id = current_setting('app.current_tenant', true)
    )
);

-- 通知・リアルタイムデータ
CREATE POLICY "Notifications tenant isolation" ON realtime_notifications FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = realtime_notifications.organization_id 
        AND tenant_id = current_setting('app.current_tenant', true)
    )
);

-- セキュリティログ（管理者のみ）
CREATE POLICY "Security logs admin only" ON security_audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tenant_users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
        AND organization_id = security_audit_logs.organization_id
    )
);

-- ==================================================
-- 8. 初期データ・サンプル
-- ==================================================

-- サンプル組織データ
INSERT INTO organizations (tenant_id, name, display_name, industry_code, industry_name, employee_count, annual_revenue, business_profile, it_maturity_level) VALUES
('demo-company-001', 'デモ株式会社', 'Demo Corporation', '39', '情報通信業', 50, 500000000, 
 '{"description": "中小企業向けSaaSソリューション開発", "main_services": ["Web開発", "モバイルアプリ開発"], "target_customers": ["中小企業", "スタートアップ"]}', 3),
('demo-manufacturing-002', 'サンプル製造業株式会社', 'Sample Manufacturing Co.', '09', '製造業', 120, 1200000000,
 '{"description": "産業機械部品製造", "main_products": ["精密部品", "自動化装置"], "certifications": ["ISO9001", "ISO14001"]}', 2)
ON CONFLICT (tenant_id) DO NOTHING;

-- ==================================================
-- 9. トリガー・関数
-- ==================================================

-- 組織作成時の自動設定
CREATE OR REPLACE FUNCTION setup_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- デフォルトAIプロファイル作成
    INSERT INTO ai_matching_profiles (organization_id, profile_type, feature_vector)
    VALUES (NEW.id, 'company', '{"initialized": true}');
    
    -- デフォルト監視設定作成
    INSERT INTO subsidy_monitoring (organization_id, monitor_name, keywords)
    VALUES (NEW.id, 'デフォルト監視', ARRAY['IT導入', '効率化', 'デジタル化']);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER setup_new_organization_trigger
AFTER INSERT ON organizations
FOR EACH ROW EXECUTE FUNCTION setup_new_organization();

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに更新日時トリガー適用
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_matching_profiles_updated_at BEFORE UPDATE ON ai_matching_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- セキュリティ監査ログ自動記録
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_logs (
        organization_id, user_id, event_type, resource_type, 
        resource_id, action, ip_address, result
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        current_setting('app.current_user_id', true)::uuid,
        TG_TABLE_NAME,
        'data_access',
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        inet(current_setting('app.client_ip', true)),
        'success'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 重要テーブルに監査ログトリガー適用
CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE FUNCTION log_security_event();
CREATE TRIGGER audit_ai_matching_scores AFTER INSERT OR UPDATE OR DELETE ON ai_matching_scores FOR EACH ROW EXECUTE FUNCTION log_security_event();