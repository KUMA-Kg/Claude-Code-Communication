-- モックデータ投入スクリプト
-- 3つの主要補助金（IT導入・持続化・事業再構築）のサンプルデータ

-- 既存データをクリア（開発環境用）
DELETE FROM deadline_alerts WHERE TRUE;
DELETE FROM subsidy_schedules WHERE TRUE;
DELETE FROM question_conditions WHERE TRUE;
DELETE FROM questions WHERE TRUE;
DELETE FROM question_sets WHERE TRUE;
DELETE FROM subsidy_industries WHERE TRUE;
DELETE FROM subsidy_regions WHERE TRUE;
DELETE FROM subsidies WHERE TRUE;

-- IT導入補助金2025
INSERT INTO subsidies (
    id, name, description, category, organizer, subsidy_type, status,
    subsidy_amount_min, subsidy_amount_max, subsidy_rate,
    eligible_companies, eligible_expenses,
    application_start, application_end,
    requirements, application_flow,
    contact_phone, contact_email, contact_website,
    priority, metadata
) VALUES (
    'it-donyu-2025',
    'IT導入補助金2025',
    '中小企業・小規模事業者等が自社の課題やニーズに合ったITツールを導入する経費の一部を補助',
    'デジタル化支援',
    '独立行政法人中小企業基盤整備機構',
    'it-donyu',
    'active',
    300000, 4500000, 0.50,
    ARRAY['中小企業', '小規模事業者'],
    ARRAY['ソフトウェア費', 'クラウド利用料', '導入関連費'],
    '2025-04-01 00:00:00+09',
    '2025-12-28 23:59:59+09',
    ARRAY['IT導入支援事業者との連携必須', '交付決定後の発注・契約・支払', '効果報告書の提出（3年間）'],
    ARRAY['IT導入支援事業者の選定', '申請書類の準備', 'gBizIDプライム取得', '電子申請', '審査', '交付決定', '事業実施', '実績報告'],
    '03-1234-5678',
    'info@it-hojo.jp',
    'https://www.it-hojo.jp',
    100,
    '{"renewal_date": "2025-03-15", "popular_tools": ["会計ソフト", "ECサイト", "予約システム"]}'::jsonb
);

-- 小規模事業者持続化補助金
INSERT INTO subsidies (
    id, name, description, category, organizer, subsidy_type, status,
    subsidy_amount_min, subsidy_amount_max, subsidy_rate,
    eligible_companies, eligible_expenses,
    application_start, application_end,
    requirements, application_flow,
    contact_phone, contact_email, contact_website,
    priority, metadata
) VALUES (
    'jizokuka-2025',
    '小規模事業者持続化補助金＜一般型＞',
    '小規模事業者が経営計画を策定して取り組む販路開拓等を支援',
    '販路開拓支援',
    '日本商工会議所',
    'jizokuka',
    'active',
    500000, 2000000, 0.67,
    ARRAY['小規模事業者'],
    ARRAY['機械装置等費', '広報費', 'ウェブサイト関連費', '展示会等出展費', '旅費', '外注費'],
    '2025-03-15 00:00:00+09',
    '2025-06-30 23:59:59+09',
    ARRAY['商工会・商工会議所の支援を受けて経営計画書作成', '補助事業終了後の実績報告', '事業効果報告（1年後）'],
    ARRAY['商工会・商工会議所へ相談', '経営計画書・補助事業計画書作成', '電子申請または郵送', '審査', '採択通知', '交付申請', '事業実施', '実績報告'],
    '03-2222-3333',
    'jizokuka@jcci.or.jp',
    'https://r3.jizokukahojokin.info',
    90,
    '{"special_frame": ["賃金引上げ枠", "インボイス枠"], "base_amount": 500000}'::jsonb
);

-- 事業再構築補助金
INSERT INTO subsidies (
    id, name, description, category, organizer, subsidy_type, status,
    subsidy_amount_min, subsidy_amount_max, subsidy_rate,
    eligible_companies, eligible_expenses,
    application_start, application_end,
    requirements, application_flow,
    contact_phone, contact_email, contact_website,
    priority, metadata
) VALUES (
    'saikouchiku-2025',
    '事業再構築補助金',
    'ポストコロナ・ウィズコロナ時代の経済社会の変化に対応するための事業再構築を支援',
    '事業転換支援',
    '中小企業庁',
    'jigyou-saikouchiku',
    'upcoming',
    1000000, 100000000, 0.50,
    ARRAY['中小企業', '中堅企業'],
    ARRAY['建物費', '機械装置・システム構築費', '技術導入費', '専門家経費', '運搬費', '外注費'],
    '2025-05-01 00:00:00+09',
    '2025-07-31 23:59:59+09',
    ARRAY['事業再構築指針に沿った事業計画', '認定経営革新等支援機関と策定した事業計画', '付加価値額の年率3%以上増加'],
    ARRAY['事業計画策定', '認定支援機関の確認', 'GビズIDプライム取得', '電子申請', '審査', '採択発表', '交付申請', '事業実施'],
    '03-3333-4444',
    'saikouchiku@meti.go.jp',
    'https://jigyou-saikouchiku.go.jp',
    95,
    '{"application_round": 12, "success_rate": 0.45, "avg_amount": 30000000}'::jsonb
);

-- ものづくり補助金（締切済の例）
INSERT INTO subsidies (
    id, name, description, category, organizer, subsidy_type, status,
    subsidy_amount_min, subsidy_amount_max, subsidy_rate,
    eligible_companies, eligible_expenses,
    application_start, application_end,
    requirements, application_flow,
    contact_phone, contact_email, contact_website,
    priority, metadata
) VALUES (
    'monozukuri-2024',
    'ものづくり・商業・サービス生産性向上促進補助金',
    '革新的サービス開発・試作品開発・生産プロセスの改善を支援',
    '設備投資支援',
    '全国中小企業団体中央会',
    'monozukuri',
    'closed',
    1000000, 30000000, 0.50,
    ARRAY['中小企業', '小規模事業者'],
    ARRAY['機械装置・システム構築費', '技術導入費', '専門家経費', '運搬費', 'クラウドサービス利用費'],
    '2024-11-01 00:00:00+09',
    '2025-02-28 23:59:59+09',
    ARRAY['付加価値額年率3%以上増加', '給与支給総額年率1.5%以上増加', '事業場内最低賃金が地域別最低賃金+30円以上'],
    ARRAY['事業計画書作成', '電子申請', '審査', '採択通知', '交付申請', '設備導入', '実績報告', '事業化状況報告（5年間）'],
    '03-4444-5555',
    'monozukuri@chuokai.or.jp',
    'https://portal.monodukuri-hojo.jp',
    80,
    '{"deadline_round": 20, "digital_frame": true, "green_frame": true}'::jsonb
);

-- 地域との関連付け
INSERT INTO subsidy_regions (subsidy_id, region_code) VALUES
('it-donyu-2025', '001'),     -- 北海道
('it-donyu-2025', '013'),     -- 東京都
('it-donyu-2025', '014'),     -- 神奈川県
('it-donyu-2025', '023'),     -- 愛知県
('it-donyu-2025', '027'),     -- 大阪府
('it-donyu-2025', '040'),     -- 福岡県
('jizokuka-2025', '001'),
('jizokuka-2025', '013'),
('jizokuka-2025', '027'),
('saikouchiku-2025', '013'),
('saikouchiku-2025', '027'),
('monozukuri-2024', '013');

-- 業種との関連付け
INSERT INTO subsidy_industries (subsidy_id, industry_code) VALUES
('it-donyu-2025', 'IT'),
('it-donyu-2025', 'MFG'),
('it-donyu-2025', 'RTL'),
('it-donyu-2025', 'SVC'),
('jizokuka-2025', 'RTL'),
('jizokuka-2025', 'SVC'),
('saikouchiku-2025', 'MFG'),
('saikouchiku-2025', 'SVC'),
('monozukuri-2024', 'MFG');

-- スケジュール情報
INSERT INTO subsidy_schedules (
    subsidy_id, schedule_type, round_number, round_name,
    start_date, end_date, notification_date, status,
    auto_update_enabled, source_url
) VALUES
-- IT導入補助金のスケジュール
('it-donyu-2025', 'application', 1, '第1次締切',
 '2025-04-01 00:00:00+09', '2025-05-15 17:00:00+09', '2025-06-01 00:00:00+09',
 'open', true, 'https://www.it-hojo.jp/schedule/'),
('it-donyu-2025', 'application', 2, '第2次締切',
 '2025-05-16 00:00:00+09', '2025-07-15 17:00:00+09', '2025-08-01 00:00:00+09',
 'scheduled', true, 'https://www.it-hojo.jp/schedule/'),
('it-donyu-2025', 'application', 3, '第3次締切',
 '2025-07-16 00:00:00+09', '2025-09-30 17:00:00+09', '2025-10-15 00:00:00+09',
 'scheduled', true, 'https://www.it-hojo.jp/schedule/'),

-- 持続化補助金のスケジュール
('jizokuka-2025', 'application', 15, '第15回締切',
 '2025-03-15 00:00:00+09', '2025-06-30 23:59:59+09', '2025-08-01 00:00:00+09',
 'open', true, 'https://r3.jizokukahojokin.info/'),

-- 事業再構築補助金のスケジュール
('saikouchiku-2025', 'application', 12, '第12回公募',
 '2025-05-01 00:00:00+09', '2025-07-31 18:00:00+09', '2025-09-30 00:00:00+09',
 'scheduled', true, 'https://jigyou-saikouchiku.go.jp/');

-- 質問セット（IT導入補助金用）
INSERT INTO question_sets (id, name, description, subsidy_type, version) VALUES
('qs-it-donyu-001', 'IT導入補助金申請質問セット', 'IT導入補助金申請に必要な情報を収集', 'it-donyu', 1),
('qs-jizokuka-001', '持続化補助金申請質問セット', '持続化補助金申請に必要な情報を収集', 'jizokuka', 1);

-- IT導入補助金の質問
INSERT INTO questions (
    question_set_id, question_code, question_text, question_type,
    input_config, validation_rules, help_text, sort_order, is_required
) VALUES
('qs-it-donyu-001', 'company_type', '事業形態を選択してください', 'select',
 '{"options": [{"value": "corporation", "label": "法人"}, {"value": "individual", "label": "個人事業主"}]}'::jsonb,
 '{"required": true}'::jsonb,
 '法人または個人事業主を選択してください', 10, true),

('qs-it-donyu-001', 'employee_count', '従業員数を入力してください', 'number',
 '{"min": 0, "max": 9999}'::jsonb,
 '{"min": 0, "max": 9999}'::jsonb,
 '正社員の人数を入力してください（パート・アルバイトは含みません）', 20, true),

('qs-it-donyu-001', 'it_investment_purpose', 'IT導入の目的を選択してください（複数選択可）', 'multi-select',
 '{"options": [
   {"value": "efficiency", "label": "業務効率化"},
   {"value": "sales", "label": "売上向上"},
   {"value": "customer", "label": "顧客満足度向上"},
   {"value": "telework", "label": "テレワーク対応"}
 ]}'::jsonb,
 '{"minItems": 1}'::jsonb,
 'IT導入の主な目的を選択してください', 30, true),

('qs-it-donyu-001', 'has_it_support', 'IT導入支援事業者は決まっていますか？', 'boolean',
 '{}'::jsonb,
 '{"required": true}'::jsonb,
 'IT導入支援事業者との連携は必須です', 40, true),

('qs-it-donyu-001', 'it_support_name', 'IT導入支援事業者名を入力してください', 'text',
 '{"maxLength": 100}'::jsonb,
 '{"maxLength": 100}'::jsonb,
 '連携するIT導入支援事業者の名称を入力してください', 50, false);

-- 条件分岐（IT導入支援事業者名は「はい」の場合のみ表示）
INSERT INTO question_conditions (
    question_id, condition_type, depends_on_question_code,
    condition_operator, condition_value
) VALUES
((SELECT id FROM questions WHERE question_code = 'it_support_name'),
 'show_if', 'has_it_support', 'equals', 'true'::jsonb),
((SELECT id FROM questions WHERE question_code = 'it_support_name'),
 'required_if', 'has_it_support', 'equals', 'true'::jsonb);

-- サンプルユーザーのアラート設定
-- （実際の運用では認証されたユーザーIDを使用）
-- INSERT INTO deadline_alerts (
--     user_id, subsidy_id, alert_type, days_before
-- ) VALUES
-- ('test-user-001', 'it-donyu-2025', 'email', ARRAY[30, 14, 7, 1]),
-- ('test-user-001', 'jizokuka-2025', 'both', ARRAY[30, 7]);

-- 統計情報更新
ANALYZE subsidies;
ANALYZE subsidy_schedules;
ANALYZE question_sets;
ANALYZE questions;