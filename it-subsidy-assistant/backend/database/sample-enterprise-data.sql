-- エンタープライズサンプルデータ投入
-- Worker2実装: 企業向けIT補助金アシスタント動作確認用データ

-- ==================================================
-- 1. 組織・テナントサンプルデータ
-- ==================================================

-- サンプル組織（既存データを更新・拡張）
INSERT INTO organizations (tenant_id, name, display_name, legal_name, business_registration_number, industry_code, industry_name, employee_count, annual_revenue, established_date, postal_code, address, contact_email, contact_phone, website_url, business_profile, it_maturity_level, subscription_plan, max_users, features_enabled) VALUES

-- デモ企業1: 中規模IT企業
('demo-tech-001', 'テックイノベーション株式会社', 'TechInnovation Corp.', '株式会社テックイノベーション', '1234567890123', '39', '情報通信業', 85, 750000000, '2018-04-01', '150-0001', '東京都渋谷区神宮前1-1-1 テックビル5F', 'contact@techinnovation.co.jp', '03-1234-5678', 'https://techinnovation.co.jp', 
 '{"description": "AI・IoTソリューション開発企業", "main_services": ["AI開発", "IoTシステム構築", "クラウド移行支援"], "target_customers": ["製造業", "小売業", "医療機関"], "technology_stack": ["Python", "TensorFlow", "AWS", "React", "Node.js"], "certifications": ["ISO27001", "プライバシーマーク"], "recent_projects": [{"name": "製造業向けAI品質管理システム", "year": 2023}, {"name": "小売業向け在庫最適化IoT", "year": 2024}]}', 4, 'enterprise', 50, 
 '{"ai_matching": true, "realtime_notifications": true, "advanced_analytics": true, "priority_support": true, "custom_branding": true}'),

-- デモ企業2: 製造業（IT導入希望）
('demo-manufacturing-002', '精密機械工業株式会社', 'Precision Machinery Inc.', '株式会社精密機械工業', '2345678901234', '25', '製造業（精密機械器具）', 150, 2800000000, '1985-06-15', '444-0001', '愛知県岡崎市中田町1-2-3 工業団地内', 'info@precision-mfg.co.jp', '0564-12-3456', 'https://precision-mfg.co.jp',
 '{"description": "自動車部品・産業機械部品製造", "main_products": ["エンジン部品", "トランスミッション部品", "産業用ロボット部品"], "production_capacity": "月産50万個", "quality_certifications": ["ISO9001", "TS16949", "ISO14001"], "automation_level": "部分的", "it_challenges": ["生産管理システム老朽化", "IoT導入未実施", "データ活用不足"], "digitalization_goals": ["予知保全システム導入", "生産データ可視化", "品質管理AI化"]}', 2, 'professional', 30,
 '{"ai_matching": true, "realtime_notifications": true, "basic_analytics": true, "email_support": true}'),

-- デモ企業3: スタートアップ
('demo-startup-003', 'グリーンテック株式会社', 'GreenTech Startup', '株式会社グリーンテック', '3456789012345', '39', '情報通信業', 12, 80000000, '2022-01-10', '150-0013', '東京都渋谷区恵比寿2-1-1 スタートアップハブ301', 'hello@greentech-startup.jp', '03-9876-5432', 'https://greentech-startup.jp',
 '{"description": "環境tech・サステナビリティソリューション", "main_services": ["CO2排出量管理SaaS", "再生エネルギー最適化", "ESG経営支援"], "target_customers": ["中小企業", "自治体"], "funding_stage": "シリーズA", "investors": ["グリーンVC", "環境投資ファンド"], "growth_goals": ["ユーザー数10倍", "海外展開", "AI機能強化"], "technology_focus": ["機械学習", "IoTセンサー", "ブロックチェーン"]}', 5, 'startup', 20,
 '{"ai_matching": true, "realtime_notifications": true, "startup_benefits": true, "mentor_support": true}')

ON CONFLICT (tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  business_profile = EXCLUDED.business_profile,
  it_maturity_level = EXCLUDED.it_maturity_level,
  features_enabled = EXCLUDED.features_enabled,
  updated_at = NOW();

-- ==================================================
-- 2. ユーザーサンプルデータ
-- ==================================================

-- 各組織のサンプルユーザー
INSERT INTO tenant_users (organization_id, email, full_name, role, department, position, permissions, preferences) 
SELECT 
  o.id,
  users_data.email,
  users_data.full_name,
  users_data.role,
  users_data.department,
  users_data.position,
  users_data.permissions,
  users_data.preferences
FROM organizations o
CROSS JOIN (
  VALUES 
  -- テックイノベーション社のユーザー
  ('admin@techinnovation.co.jp', '田中 太郎', 'admin', '経営企画部', 'CTO', '{"manage_all": true, "view_analytics": true, "export_data": true}', '{"notifications": {"email": true, "push": true}, "dashboard_layout": "advanced", "ai_suggestions": true}'),
  ('manager@techinnovation.co.jp', '佐藤 花子', 'manager', '事業開発部', 'マネージャー', '{"manage_subsidies": true, "view_team_data": true, "approve_applications": true}', '{"notifications": {"email": true}, "ai_suggestions": true}'),
  ('dev@techinnovation.co.jp', '鈴木 次郎', 'user', '技術部', 'エンジニア', '{"view_subsidies": true, "apply_subsidies": true}', '{"notifications": {"push": true}, "dashboard_layout": "simple"}'),
  
  -- 精密機械工業のユーザー  
  ('president@precision-mfg.co.jp', '山田 三郎', 'admin', '代表取締役', '社長', '{"manage_all": true, "view_analytics": true, "strategic_planning": true}', '{"notifications": {"email": true}, "language": "ja", "reports": "monthly"}'),
  ('it@precision-mfg.co.jp', '伊藤 美咲', 'manager', '情報システム部', '部長', '{"manage_subsidies": true, "it_infrastructure": true}', '{"notifications": {"email": true, "push": true}, "technical_alerts": true}'),
  ('factory@precision-mfg.co.jp', '高橋 健一', 'user', '製造部', '主任', '{"view_subsidies": true, "operational_data": true}', '{"notifications": {"email": true}, "dashboard_focus": "production"}'),
  
  -- グリーンテックのユーザー
  ('ceo@greentech-startup.jp', '中村 杏', 'admin', '経営陣', 'CEO', '{"manage_all": true, "fundraising": true, "strategic_partnerships": true}', '{"notifications": {"email": true, "slack": true}, "startup_mode": true, "growth_metrics": true}'),
  ('cto@greentech-startup.jp', '小林 大輔', 'manager', '技術部', 'CTO', '{"manage_subsidies": true, "technical_decisions": true, "team_management": true}', '{"notifications": {"slack": true, "push": true}, "ai_suggestions": true, "dev_tools": true}')
) AS users_data(email, full_name, role, department, position, permissions, preferences)
WHERE 
  (o.tenant_id = 'demo-tech-001' AND users_data.email LIKE '%techinnovation%') OR
  (o.tenant_id = 'demo-manufacturing-002' AND users_data.email LIKE '%precision-mfg%') OR
  (o.tenant_id = 'demo-startup-003' AND users_data.email LIKE '%greentech-startup%')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  preferences = EXCLUDED.preferences,
  updated_at = NOW();

-- ==================================================
-- 3. AI マッチング用サンプルデータ
-- ==================================================

-- AI マッチングプロファイル
INSERT INTO ai_matching_profiles (organization_id, profile_type, feature_vector, keywords, business_categories, technology_stack, investment_capacity, urgency_level, analysis_version, confidence_score)
SELECT 
  o.id,
  'company',
  profiles_data.feature_vector,
  profiles_data.keywords,
  profiles_data.business_categories,
  profiles_data.technology_stack,
  profiles_data.investment_capacity,
  profiles_data.urgency_level,
  'v2.1',
  profiles_data.confidence_score
FROM organizations o
CROSS JOIN (
  VALUES 
  -- テックイノベーション社のプロファイル
  ('demo-tech-001', '{"industry": [0.9, 0.1, 0.0], "size": [0.7, 0.3], "tech": [0.9, 0.8, 0.7], "needs": [0.8, 0.9, 0.6]}', ARRAY['AI', 'IoT', 'クラウド', 'DX', '自動化', 'データ分析'], ARRAY['ソフトウェア開発', 'システム構築', 'コンサルティング'], '{"languages": ["Python", "JavaScript", "Java"], "cloud": ["AWS", "Azure"], "ai_ml": ["TensorFlow", "PyTorch"], "databases": ["PostgreSQL", "MongoDB"]}', 5000000, 4, 0.95),
  
  -- 精密機械工業のプロファイル  
  ('demo-manufacturing-002', '{"industry": [0.1, 0.9, 0.0], "size": [0.8, 0.2], "tech": [0.3, 0.4, 0.5], "needs": [0.9, 0.8, 0.9]}', ARRAY['製造DX', 'IoT', '予知保全', '品質管理', '生産性向上', 'AI活用'], ARRAY['精密機械製造', '自動車部品', '産業機械'], '{"erp": ["SAP"], "cad": ["SolidWorks"], "manufacturing": ["MES未導入"], "automation": ["PLC", "SCADA"]}', 15000000, 3, 0.88),
  
  -- グリーンテックのプロファイル
  ('demo-startup-003', '{"industry": [0.8, 0.1, 0.1], "size": [0.2, 0.8], "tech": [0.9, 0.7, 0.8], "needs": [0.7, 0.8, 0.9]}', ARRAY['ESG', '環境tech', 'サステナビリティ', 'CO2削減', '再生エネルギー', 'ブロックチェーン'], ARRAY['環境ソリューション', 'SaaS', 'コンサルティング'], '{"languages": ["Python", "React", "Node.js"], "blockchain": ["Ethereum", "Hyperledger"], "iot": ["Arduino", "Raspberry Pi"], "analytics": ["Tableau", "PowerBI"]}', 2000000, 5, 0.92)
) AS profiles_data(tenant_id, feature_vector, keywords, business_categories, technology_stack, investment_capacity, urgency_level, confidence_score)
WHERE o.tenant_id = profiles_data.tenant_id
ON CONFLICT (organization_id, profile_type) DO UPDATE SET
  feature_vector = EXCLUDED.feature_vector,
  keywords = EXCLUDED.keywords,
  business_categories = EXCLUDED.business_categories,
  technology_stack = EXCLUDED.technology_stack,
  updated_at = NOW();

-- ==================================================
-- 4. リアルタイム補助金監視設定
-- ==================================================

-- 補助金監視設定
INSERT INTO subsidy_monitoring (organization_id, monitor_name, keywords, industry_filters, amount_range_min, amount_range_max, deadline_alert_days, notification_channels, min_score_threshold)
SELECT 
  o.id,
  monitoring_data.monitor_name,
  monitoring_data.keywords,
  monitoring_data.industry_filters,
  monitoring_data.amount_range_min,
  monitoring_data.amount_range_max,
  monitoring_data.deadline_alert_days,
  monitoring_data.notification_channels,
  monitoring_data.min_score_threshold
FROM organizations o
CROSS JOIN (
  VALUES 
  -- テックイノベーション社の監視設定
  ('demo-tech-001', 'AI・IoT技術監視', ARRAY['AI', 'IoT', '機械学習', 'DX', 'クラウド'], ARRAY['情報通信業'], 1000000, 50000000, ARRAY[30, 14, 7, 3, 1], '{"email": true, "slack": true, "push": true}', 0.7),
  ('demo-tech-001', '研究開発補助金監視', ARRAY['研究開発', 'R&D', 'イノベーション', '新技術'], ARRAY['情報通信業'], 5000000, 100000000, ARRAY[45, 30, 14, 7], '{"email": true, "slack": true}', 0.6),
  
  -- 精密機械工業の監視設定
  ('demo-manufacturing-002', '製造業DX監視', ARRAY['製造DX', 'スマートファクトリー', 'IoT', '自動化'], ARRAY['製造業'], 5000000, 200000000, ARRAY[30, 14, 7, 3], '{"email": true, "push": true}', 0.8),
  ('demo-manufacturing-002', '省エネ・環境監視', ARRAY['省エネ', '環境', 'CO2削減', 'カーボンニュートラル'], ARRAY['製造業'], 1000000, 50000000, ARRAY[21, 14, 7], '{"email": true}', 0.6),
  
  -- グリーンテックの監視設定  
  ('demo-startup-003', 'スタートアップ支援監視', ARRAY['スタートアップ', 'ベンチャー', '起業', '新事業'], ARRAY['情報通信業'], 500000, 10000000, ARRAY[30, 14, 7, 3, 1], '{"email": true, "slack": true, "push": true}', 0.5),
  ('demo-startup-003', 'グリーンテック監視', ARRAY['環境', 'グリーン', 'サステナビリティ', 'ESG', 'カーボンニュートラル'], ARRAY['情報通信業'], 1000000, 30000000, ARRAY[30, 14, 7], '{"email": true, "slack": true}', 0.7)
) AS monitoring_data(tenant_id, monitor_name, keywords, industry_filters, amount_range_min, amount_range_max, deadline_alert_days, notification_channels, min_score_threshold)
WHERE o.tenant_id = monitoring_data.tenant_id
ON CONFLICT (organization_id, monitor_name) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  notification_channels = EXCLUDED.notification_channels,
  min_score_threshold = EXCLUDED.min_score_threshold,
  updated_at = NOW();

-- ==================================================
-- 5. サンプル補助金データ（拡張）
-- ==================================================

-- 実在に近い補助金データ
INSERT INTO subsidies (id, name, description, eligibility_criteria, amount_min, amount_max, application_start, application_end, status, target_industries, target_company_size, requirements, website_url, contact_info, subsidy_type, priority, metadata) VALUES

-- IT導入補助金2024（実在ベース）
('it-donya-2024-a', 'IT導入補助金2024 通常枠(A類型)', 'ITツール導入による業務効率化・売上向上を支援', ARRAY['中小企業・小規模事業者', '従業員300名以下', '資本金3億円以下'], 30, 1500000, '2024-03-01', '2024-12-25', 'active', ARRAY['全業種'], ARRAY['small', 'medium'], ARRAY['労働生産性向上', 'ITツール導入計画'], 'https://it-hojo.jp/', '{"phone": "03-1234-5678", "email": "info@it-hojo.jp"}', 'it-donyu', 90, '{"application_rounds": 8, "selection_rate": "約50%", "past_adoptions": 15000}'),

-- 事業再構築補助金（実在ベース）
('jigyou-saikouchiku-2024', '事業再構築補助金 第12回', '新分野展開・業態転換等の事業再構築を支援', ARRAY['中小企業等', '売上減少要件', '事業再構築要件'], 1000000, 100000000, '2024-02-15', '2024-05-31', 'active', ARRAY['全業種'], ARRAY['small', 'medium'], ARRAY['売上減少10%以上', '新分野展開計画', '認定経営革新等支援機関サポート'], 'https://jigyou-saikouchiku.jp/', '{"phone": "03-2345-6789", "email": "info@jigyou-saikouchiku.jp"}', 'jigyou-saikouchiku', 100, '{"application_rounds": 12, "budget": "約5000億円", "adoption_rate": "約30%"}'),

-- ものづくり補助金（実在ベース）  
('monozukuri-2024-1', 'ものづくり・商業・サービス生産性向上促進補助金 通常枠', '革新的サービス開発・試作品開発・生産プロセス改善を支援', ARRAY['中小企業・小規模事業者', '3-5年の事業計画策定'], 1000000, 12500000, '2024-01-10', '2024-04-19', 'active', ARRAY['製造業', '商業・サービス業'], ARRAY['small', 'medium'], ARRAY['革新性', '技術面', '事業化面', '政策面'], 'https://monozukuri-hojo.jp/', '{"phone": "03-3456-7890", "email": "info@monozukuri-hojo.jp"}', 'monozukuri', 95, '{"application_rounds": 17, "complementary_rate": "1/2", "past_projects": 25000}'),

-- 小規模事業者持続化補助金（実在ベース）
('jizokuka-2024-1', '小規模事業者持続化補助金 一般型', '小規模事業者の販路開拓等を支援', ARRAY['小規模事業者', '従業員20名以下(商業・サービス業は5名以下)'], 50000, 500000, '2024-02-01', '2024-06-03', 'active', ARRAY['全業種'], ARRAY['small'], ARRAY['経営計画書作成', '補助事業計画書作成'], 'https://jizokuka-r1.jp/', '{"phone": "03-4567-8901", "email": "info@jizokuka-r1.jp"}', 'jizokuka', 85, '{"application_rounds": 4, "complementary_rate": "2/3", "special_additions": ["賃金引上げ", "卒業枠", "後継者支援枠"]}'),

-- 環境・グリーン関連補助金
('green-dx-2024', 'グリーンDX推進補助金', '脱炭素・デジタル技術活用による事業変革を支援', ARRAY['中小企業等', 'CO2削減目標設定', 'DX取組み実績'], 2000000, 50000000, '2024-03-15', '2024-07-31', 'active', ARRAY['製造業', '情報通信業', 'サービス業'], ARRAY['small', 'medium'], ARRAY['CO2削減計画', 'デジタル技術活用', '3年間の事業計画'], 'https://green-dx.go.jp/', '{"phone": "03-5678-9012", "email": "info@green-dx.go.jp"}', 'general', 80, '{"focus_areas": ["AI・IoT活用", "省エネシステム", "再エネ導入"], "expected_co2_reduction": "30%以上"}'),

-- AI・先端技術特化補助金
('ai-innovation-2024', 'AI活用イノベーション創出補助金', 'AI技術活用による革新的事業創出を支援', ARRAY['技術力を有する中小企業', 'AI・機械学習の活用計画'], 3000000, 80000000, '2024-04-01', '2024-09-30', 'active', ARRAY['情報通信業', '製造業', '医療・福祉'], ARRAY['small', 'medium'], ARRAY['AI技術者確保', '実証実験計画', '事業化戦略'], 'https://ai-innovation.go.jp/', '{"phone": "03-6789-0123", "email": "ai-support@innovation.go.jp"}', 'general', 88, '{"technology_focus": ["機械学習", "深層学習", "自然言語処理", "画像認識"], "collaboration_required": "大学・研究機関との連携推奨"}'）

ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount_min = EXCLUDED.amount_min,
  amount_max = EXCLUDED.amount_max,
  application_end = EXCLUDED.application_end,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ==================================================
-- 6. サンプル AI マッチングスコア（実行結果例）
-- ==================================================

-- 高スコアマッチング結果のサンプル
INSERT INTO ai_matching_scores (organization_id, subsidy_id, overall_score, category_scores, reason_codes, explanation, recommended_actions, algorithm_version, expires_at)
SELECT 
  o.id,
  scores_data.subsidy_id,
  scores_data.overall_score,
  scores_data.category_scores,
  scores_data.reason_codes,
  scores_data.explanation,
  scores_data.recommended_actions,
  'v2.1',
  NOW() + INTERVAL '30 days'
FROM organizations o
CROSS JOIN (
  VALUES 
  -- テックイノベーション社の高スコアマッチ
  ('demo-tech-001', 'ai-innovation-2024', 0.94, '{"industry_match": 1.0, "size_match": 0.9, "needs_match": 0.95, "technical_fit": 1.0, "historical_success": 0.8}', ARRAY['perfect_industry_match', 'high_needs_alignment', 'technical_capability_match'], 'AI技術活用補助金との完璧な適合。御社のAI・IoT開発実績と技術力が要件に完全一致しています。', ARRAY['即座に申請準備を開始することを強く推奨', '過去の開発実績資料を準備', 'AI技術者の経歴書を整備', '実証実験計画書の詳細化']),
  
  ('demo-tech-001', 'it-donya-2024-a', 0.82, '{"industry_match": 1.0, "size_match": 0.8, "needs_match": 0.7, "technical_fit": 0.9, "historical_success": 0.9}', ARRAY['perfect_industry_match', 'proven_track_record'], '情報通信業として完全適合。過去のIT導入実績により高い成功確率が見込まれます。', ARRAY['申請書類の準備を開始', 'ITツール導入計画の具体化', '労働生産性向上の数値目標設定']),
  
  -- 精密機械工業の高スコアマッチ
  ('demo-manufacturing-002', 'monozukuri-2024-1', 0.91, '{"industry_match": 1.0, "size_match": 0.95, "needs_match": 0.9, "technical_fit": 0.8, "historical_success": 0.7}', ARRAY['perfect_industry_match', 'ideal_company_size', 'high_needs_alignment'], '製造業向けものづくり補助金との高度適合。企業規模・業種が完全一致し、生産性向上ニーズと合致。', ARRAY['認定支援機関との連携開始', '革新的な生産プロセス改善計画の策定', '3-5年事業計画の詳細作成', '技術面での優位性資料準備']),
  
  ('demo-manufacturing-002', 'green-dx-2024', 0.87, '{"industry_match": 0.9, "size_match": 0.9, "needs_match": 0.95, "technical_fit": 0.7, "historical_success": 0.6}', ARRAY['high_needs_alignment', 'environmental_focus_match'], 'グリーンDX補助金との高適合。CO2削減とDXの両立ニーズに対応。', ARRAY['CO2削減目標の具体的数値設定', 'DX推進計画の策定', '省エネ効果の定量的試算', '環境経営方針の文書化']),
  
  -- グリーンテックの高スコアマッチ  
  ('demo-startup-003', 'green-dx-2024', 0.96, '{"industry_match": 0.9, "size_match": 0.85, "needs_match": 1.0, "technical_fit": 0.95, "historical_success": 0.8}', ARRAY['perfect_needs_match', 'technical_capability_match', 'innovation_potential'], '環境techスタートアップとして最適なマッチング。事業内容とグリーンDX推進が完全に一致。', ARRAY['⚠️ 申請締切まで残り120日 - 最優先で対応', '環境技術の特許・知財資料準備', 'CO2削減効果の詳細試算書作成', 'ESG投資家からの推薦状取得', '技術実証データの整備']),
  
  ('demo-startup-003', 'jigyou-saikouchiku-2024', 0.78, '{"industry_match": 0.8, "size_match": 0.9, "needs_match": 0.8, "technical_fit": 0.7, "historical_success": 0.6}', ARRAY['startup_growth_potential', 'new_business_model'], '事業再構築補助金でのスケールアップ可能性。新分野展開として適合。', ARRAY['売上減少要件の確認（コロナ影響等）', '新分野展開計画の詳細化', '認定経営革新等支援機関の選定・相談', '5年間の事業計画書作成'])
) AS scores_data(tenant_id, subsidy_id, overall_score, category_scores, reason_codes, explanation, recommended_actions)
WHERE o.tenant_id = scores_data.tenant_id
ON CONFLICT (organization_id, subsidy_id) DO UPDATE SET
  overall_score = EXCLUDED.overall_score,
  category_scores = EXCLUDED.category_scores,
  explanation = EXCLUDED.explanation,
  recommended_actions = EXCLUDED.recommended_actions,
  algorithm_version = EXCLUDED.algorithm_version,
  expires_at = EXCLUDED.expires_at;

-- ==================================================
-- 7. リアルタイム通知サンプル
-- ==================================================

-- サンプル通知データ
INSERT INTO realtime_notifications (organization_id, notification_type, title, message, data, priority, channels, status)
SELECT 
  o.id,
  notifications_data.notification_type,
  notifications_data.title,
  notifications_data.message,
  notifications_data.data,
  notifications_data.priority,
  notifications_data.channels,
  'delivered'
FROM organizations o
CROSS JOIN (
  VALUES 
  -- 高スコアマッチ通知
  ('demo-tech-001', 'high_match_subsidy', '🎯 新しい高適合補助金を発見', 'AI活用イノベーション創出補助金で94%の適合度を記録しました', '{"subsidy_id": "ai-innovation-2024", "score": 0.94, "deadline_days": 152}', 'high', ARRAY['in_app', 'email', 'push'], 'delivered'),
  
  -- 締切アラート通知
  ('demo-startup-003', 'deadline_alert', '⚠️ 申請締切アラート', 'グリーンDX推進補助金の申請締切まで30日となりました', '{"subsidy_id": "green-dx-2024", "days_remaining": 30, "match_score": 0.96}', 'urgent', ARRAY['in_app', 'email', 'push', 'slack'], 'delivered'),
  
  -- 新補助金情報通知
  ('demo-manufacturing-002', 'new_subsidy_match', '📢 新着補助金情報', '製造業向けの新しい補助金が公開されました', '{"subsidy_id": "monozukuri-2024-1", "estimated_score": 0.85, "amount_max": 12500000}', 'normal', ARRAY['in_app', 'email'], 'delivered'),
  
  -- システム更新通知
  ('demo-tech-001', 'system_update', '🔄 AI マッチングシステム更新', 'AIマッチングアルゴリズムがv2.1に更新され、精度が向上しました', '{"version": "v2.1", "improvements": ["業界適合精度向上", "技術要件分析強化"]}', 'low', ARRAY['in_app'], 'delivered')
) AS notifications_data(tenant_id, notification_type, title, message, data, priority, channels, status)
WHERE o.tenant_id = notifications_data.tenant_id;

-- ==================================================
-- 8. システムメトリクスサンプル
-- ==================================================

-- パフォーマンスメトリクスのサンプルデータ
INSERT INTO system_metrics (organization_id, metric_type, metric_name, value, unit, tags)
SELECT 
  o.id,
  metrics_data.metric_type,
  metrics_data.metric_name,
  metrics_data.value,
  metrics_data.unit,
  metrics_data.tags
FROM organizations o
CROSS JOIN (
  VALUES 
  ('demo-tech-001', 'ai_processing', 'matching_score_calculation_time', 1.24, 'seconds', '{"algorithm_version": "v2.1", "company_size": "medium"}'),
  ('demo-tech-001', 'api_response', 'subsidy_search_response_time', 0.18, 'seconds', '{"endpoint": "/api/subsidies/search", "result_count": 15}'),
  ('demo-manufacturing-002', 'ai_processing', 'feature_vector_generation_time', 0.95, 'seconds', '{"profile_complexity": "high", "data_sources": 5}'),
  ('demo-startup-003', 'notification', 'delivery_success_rate', 98.5, 'percentage', '{"channel": "email", "period": "24h"}')
) AS metrics_data(tenant_id, metric_type, metric_name, value, unit, tags)
WHERE o.tenant_id = metrics_data.tenant_id;

-- ==================================================
-- 9. データ統計情報出力
-- ==================================================

-- 投入されたデータの統計情報
DO $$
BEGIN
  RAISE NOTICE '====== エンタープライズサンプルデータ投入完了 ======';
  RAISE NOTICE '組織数: %', (SELECT COUNT(*) FROM organizations);
  RAISE NOTICE 'ユーザー数: %', (SELECT COUNT(*) FROM tenant_users);
  RAISE NOTICE 'AIプロファイル数: %', (SELECT COUNT(*) FROM ai_matching_profiles);
  RAISE NOTICE 'マッチングスコア数: %', (SELECT COUNT(*) FROM ai_matching_scores);
  RAISE NOTICE '監視設定数: %', (SELECT COUNT(*) FROM subsidy_monitoring);
  RAISE NOTICE '補助金数: %', (SELECT COUNT(*) FROM subsidies);
  RAISE NOTICE '通知数: %', (SELECT COUNT(*) FROM realtime_notifications);
  RAISE NOTICE 'メトリクス数: %', (SELECT COUNT(*) FROM system_metrics);
  RAISE NOTICE '===================================================';
END $$;