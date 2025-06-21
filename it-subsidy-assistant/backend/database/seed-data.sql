-- IT補助金アシストツール サンプルデータ

-- 必要書類マスターデータ
INSERT INTO required_documents (document_code, name, description, category, file_format, is_template_available, is_required, applicable_frames, sort_order) VALUES
-- 基本書類
('DOC001', '事業概要説明書', '申請企業の事業内容や経営状況を説明する書類', '基本書類', ARRAY['PDF', 'Word'], true, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 1),
('DOC002', '登記簿謄本', '法人の場合は履歴事項全部証明書（3ヶ月以内）', '基本書類', ARRAY['PDF'], false, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 2),
('DOC003', '決算書（直近2期分）', '貸借対照表、損益計算書、販売費及び一般管理費明細', '財務書類', ARRAY['PDF', 'Excel'], false, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 3),
('DOC004', '納税証明書', '法人税、消費税、地方税の納税証明書', '基本書類', ARRAY['PDF'], false, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 4),

-- 事業計画関連
('DOC005', 'IT導入計画書', 'IT化による業務改善計画と期待効果', '事業計画書類', ARRAY['PDF', 'Word'], true, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 5),
('DOC006', '投資計画書', 'IT投資の詳細計画と資金計画', '事業計画書類', ARRAY['Excel'], true, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 6),
('DOC007', '業務フロー図（現状・改善後）', '業務プロセスの可視化と改善ポイント', '事業計画書類', ARRAY['PDF', 'PowerPoint'], true, true, ARRAY['電子化枠'], 7),

-- 枠別特有書類
('DOC008', 'セキュリティ対策計画書', '情報セキュリティ対策の具体的計画', '枠別書類', ARRAY['PDF', 'Word'], true, true, ARRAY['セキュリティ枠'], 8),
('DOC009', 'インボイス対応計画書', 'インボイス制度への対応計画', '枠別書類', ARRAY['PDF', 'Word'], true, true, ARRAY['インボイス枠'], 9),
('DOC010', '複数社連携計画書', '複数企業での共同IT導入計画', '枠別書類', ARRAY['PDF', 'Word'], true, true, ARRAY['複数社枠'], 10),

-- 見積・契約関連
('DOC011', 'IT導入費用見積書', 'IT導入にかかる費用の詳細見積', '見積書類', ARRAY['PDF', 'Excel'], false, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 11),
('DOC012', 'ITベンダー会社概要', 'IT導入支援事業者の会社情報', 'ベンダー書類', ARRAY['PDF'], false, true, ARRAY['通常枠', '電子化枠', 'セキュリティ枠', 'インボイス枠'], 12),

-- 任意提出書類
('DOC013', '既存システム構成図', '現在利用中のITシステムの構成', '任意書類', ARRAY['PDF', 'PowerPoint'], false, false, ARRAY['通常枠', '電子化枠', 'セキュリティ枠'], 13),
('DOC014', '従業員教育計画書', 'IT導入に伴う従業員教育の計画', '任意書類', ARRAY['PDF', 'Word'], true, false, ARRAY['通常枠', '電子化枠'], 14),
('DOC015', '情報セキュリティポリシー', '既存の情報セキュリティ規程', '任意書類', ARRAY['PDF', 'Word'], false, false, ARRAY['セキュリティ枠'], 15);

-- IT導入補助金2024の申請枠判定ルール
INSERT INTO eligibility_rules (subsidy_id, frame_code, frame_name, description, min_amount, max_amount, subsidy_rate, priority, conditions, required_documents) VALUES
-- 通常枠
('it-donyu-2024', 'normal', '通常枠', 'ITツール導入による生産性向上を目的とした基本的な申請枠', 300000, 4500000, 0.50, 100,
'{
  "min_employees": 1,
  "it_investment_purpose": ["productivity", "efficiency"],
  "excluded_purposes": ["digitization_only", "security_only", "invoice_only"]
}',
ARRAY['DOC001', 'DOC002', 'DOC003', 'DOC004', 'DOC005', 'DOC006', 'DOC011', 'DOC012']),

-- 電子化枠
('it-donyu-2024', 'digitization', '電子化枠', '紙業務の電子化・ペーパーレス化を主目的とした申請枠', 300000, 3500000, 0.67, 90,
'{
  "has_paper_process": true,
  "digitization_targets": ["invoice", "contract", "report", "application"],
  "digitization_ratio": 0.5,
  "conditions": {
    "or": [
      {"equals": {"q_digitization_purpose": "main"}},
      {"and": [
        {"equals": {"q_has_paper_workflow": true}},
        {"gte": {"q_paper_reduction_target": 50}}
      ]}
    ]
  }
}',
ARRAY['DOC001', 'DOC002', 'DOC003', 'DOC004', 'DOC005', 'DOC006', 'DOC007', 'DOC011', 'DOC012']),

-- セキュリティ枠
('it-donyu-2024', 'security', 'セキュリティ枠', 'サイバーセキュリティ対策を主目的とした申請枠', 300000, 3000000, 0.50, 80,
'{
  "security_investment": true,
  "security_tools": ["firewall", "antivirus", "edr", "siem"],
  "has_security_incident": false,
  "conditions": {
    "or": [
      {"equals": {"q_security_purpose": "main"}},
      {"and": [
        {"equals": {"q_has_security_investment": true}},
        {"in": {"q_security_tool_type": ["firewall", "edr", "siem"]}}
      ]}
    ]
  }
}',
ARRAY['DOC001', 'DOC002', 'DOC003', 'DOC004', 'DOC005', 'DOC006', 'DOC008', 'DOC011', 'DOC012', 'DOC015']),

-- インボイス枠
('it-donyu-2024', 'invoice', 'インボイス枠', 'インボイス制度対応を主目的とした申請枠', 300000, 3500000, 0.67, 70,
'{
  "invoice_support": true,
  "is_taxable_business": true,
  "invoice_registration": "pending",
  "conditions": {
    "and": [
      {"equals": {"q_invoice_purpose": true}},
      {"equals": {"q_is_taxable_business": true}},
      {"in": {"q_invoice_status": ["not_registered", "planning_to_register"]}}
    ]
  }
}',
ARRAY['DOC001', 'DOC002', 'DOC003', 'DOC004', 'DOC005', 'DOC006', 'DOC009', 'DOC011', 'DOC012']),

-- 複数社枠
('it-donyu-2024', 'multiple', '複数社枠', '複数の中小企業が連携してIT導入を行う申請枠', 3000000, 30000000, 0.67, 60,
'{
  "min_companies": 3,
  "max_companies": 10,
  "has_consortium": true,
  "shared_system": true,
  "conditions": {
    "and": [
      {"gte": {"q_participating_companies": 3}},
      {"equals": {"q_shared_system": true}},
      {"equals": {"q_has_consortium_agreement": true}}
    ]
  }
}',
ARRAY['DOC001', 'DOC002', 'DOC003', 'DOC004', 'DOC005', 'DOC006', 'DOC010', 'DOC011', 'DOC012']);

-- 申請枠自動判定用の関数
CREATE OR REPLACE FUNCTION determine_application_frame(
    p_subsidy_id VARCHAR(50),
    p_answers JSONB
) RETURNS TABLE (
    frame_code VARCHAR(50),
    frame_name VARCHAR(100),
    description TEXT,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.frame_code,
        er.frame_name,
        er.description,
        CASE 
            WHEN jsonb_path_match(p_answers, er.conditions->'conditions') THEN er.priority
            ELSE 0
        END as match_score
    FROM eligibility_rules er
    WHERE er.subsidy_id = p_subsidy_id
        AND er.is_active = true
    ORDER BY match_score DESC, er.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- 必要書類自動抽出関数
CREATE OR REPLACE FUNCTION get_required_documents(
    p_subsidy_id VARCHAR(50),
    p_frame_code VARCHAR(50)
) RETURNS TABLE (
    document_code VARCHAR(50),
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    is_required BOOLEAN,
    is_template_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        rd.document_code,
        rd.name,
        rd.description,
        rd.category,
        rd.is_required,
        rd.is_template_available
    FROM required_documents rd
    WHERE rd.document_code = ANY(
        SELECT unnest(er.required_documents)
        FROM eligibility_rules er
        WHERE er.subsidy_id = p_subsidy_id
            AND er.frame_code = p_frame_code
            AND er.is_active = true
    )
    ORDER BY rd.sort_order, rd.category, rd.name;
END;
$$ LANGUAGE plpgsql;