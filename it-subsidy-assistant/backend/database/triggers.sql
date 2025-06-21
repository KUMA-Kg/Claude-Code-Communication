-- IT補助金アシストツール SQLトリガー定義
-- 書類判定の自動化とデータ整合性の維持

-- 申請作成時に必要書類を自動判定・登録するトリガー
CREATE OR REPLACE FUNCTION auto_create_document_requirements()
RETURNS TRIGGER AS $$
DECLARE
    v_required_docs TEXT[];
    v_doc_code TEXT;
BEGIN
    -- 申請枠に基づいて必要書類を取得
    SELECT required_documents INTO v_required_docs
    FROM eligibility_rules
    WHERE subsidy_id = NEW.subsidy_id
        AND frame_code = NEW.application_frame
        AND is_active = true;

    -- 必要書類が見つからない場合は通常枠の書類を使用
    IF v_required_docs IS NULL THEN
        SELECT required_documents INTO v_required_docs
        FROM eligibility_rules
        WHERE subsidy_id = NEW.subsidy_id
            AND frame_code = 'normal'
            AND is_active = true;
    END IF;

    -- 各必要書類に対してレコードを作成
    IF v_required_docs IS NOT NULL THEN
        FOREACH v_doc_code IN ARRAY v_required_docs
        LOOP
            INSERT INTO application_documents (
                application_id,
                document_code,
                status,
                created_at
            ) VALUES (
                NEW.id,
                v_doc_code,
                'pending',
                NOW()
            ) ON CONFLICT (application_id, document_code) DO NOTHING;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 申請フレーム変更時に必要書類を再判定するトリガー
CREATE OR REPLACE FUNCTION update_document_requirements_on_frame_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old_docs TEXT[];
    v_new_docs TEXT[];
    v_doc_code TEXT;
BEGIN
    -- フレームが変更された場合のみ処理
    IF OLD.application_frame IS DISTINCT FROM NEW.application_frame THEN
        -- 古い書類リストを取得
        SELECT ARRAY_AGG(document_code) INTO v_old_docs
        FROM application_documents
        WHERE application_id = NEW.id
            AND status = 'pending';

        -- 新しい必要書類を取得
        SELECT required_documents INTO v_new_docs
        FROM eligibility_rules
        WHERE subsidy_id = NEW.subsidy_id
            AND frame_code = NEW.application_frame
            AND is_active = true;

        -- 不要になった書類を削除（ただしアップロード済みは残す）
        DELETE FROM application_documents
        WHERE application_id = NEW.id
            AND document_code = ANY(v_old_docs)
            AND document_code != ALL(v_new_docs)
            AND status = 'pending';

        -- 新しく必要になった書類を追加
        IF v_new_docs IS NOT NULL THEN
            FOREACH v_doc_code IN ARRAY v_new_docs
            LOOP
                INSERT INTO application_documents (
                    application_id,
                    document_code,
                    status,
                    created_at
                ) VALUES (
                    NEW.id,
                    v_doc_code,
                    'pending',
                    NOW()
                ) ON CONFLICT (application_id, document_code) DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 申請ステータス自動更新トリガー
CREATE OR REPLACE FUNCTION auto_update_application_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_required INTEGER;
    v_total_uploaded INTEGER;
    v_total_approved INTEGER;
    v_has_rejected BOOLEAN;
BEGIN
    -- 申請に関連する書類の統計を取得
    SELECT 
        COUNT(*) FILTER (WHERE rd.is_required = true),
        COUNT(*) FILTER (WHERE ad.status = 'uploaded' AND rd.is_required = true),
        COUNT(*) FILTER (WHERE ad.status = 'approved' AND rd.is_required = true),
        EXISTS(SELECT 1 WHERE ad.status = 'rejected' AND rd.is_required = true)
    INTO v_total_required, v_total_uploaded, v_total_approved, v_has_rejected
    FROM application_documents ad
    JOIN required_documents rd ON rd.document_code = ad.document_code
    WHERE ad.application_id = NEW.application_id;

    -- リジェクトされた書類がある場合
    IF v_has_rejected THEN
        UPDATE applications
        SET status = 'under_review'
        WHERE id = NEW.application_id
            AND status NOT IN ('rejected', 'approved', 'completed');
    -- すべての必須書類が承認された場合
    ELSIF v_total_approved = v_total_required AND v_total_required > 0 THEN
        UPDATE applications
        SET status = 'submitted',
            submission_date = NOW()
        WHERE id = NEW.application_id
            AND status = 'draft';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 企業の中小企業判定自動化トリガー
CREATE OR REPLACE FUNCTION auto_check_sme_status()
RETURNS TRIGGER AS $$
DECLARE
    v_capital_limit INTEGER;
    v_employee_limit INTEGER;
BEGIN
    -- 業種コードに基づいて中小企業の基準を設定
    CASE 
        -- 製造業・建設業・運輸業
        WHEN NEW.industry_code ~ '^[DE]' THEN
            v_capital_limit := 30000;  -- 3億円
            v_employee_limit := 300;
        -- 卸売業
        WHEN NEW.industry_code ~ '^I' THEN
            v_capital_limit := 10000;  -- 1億円
            v_employee_limit := 100;
        -- 小売業
        WHEN NEW.industry_code ~ '^J' THEN
            v_capital_limit := 5000;   -- 5千万円
            v_employee_limit := 50;
        -- サービス業・その他
        ELSE
            v_capital_limit := 5000;   -- 5千万円
            v_employee_limit := 100;
    END CASE;

    -- 中小企業判定（資本金または従業員数のいずれかが基準以下）
    NEW.is_sme := (
        COALESCE(NEW.capital_amount, 0) <= v_capital_limit OR
        COALESCE(NEW.employee_count, 0) <= v_employee_limit
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 申請金額の妥当性チェックトリガー
CREATE OR REPLACE FUNCTION validate_application_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_min_amount INTEGER;
    v_max_amount INTEGER;
    v_subsidy_rate DECIMAL(3,2);
BEGIN
    -- 申請枠の金額制限を取得
    SELECT min_amount, max_amount, subsidy_rate
    INTO v_min_amount, v_max_amount, v_subsidy_rate
    FROM eligibility_rules
    WHERE subsidy_id = NEW.subsidy_id
        AND frame_code = NEW.application_frame
        AND is_active = true;

    -- 申請金額のチェック
    IF NEW.requested_amount IS NOT NULL THEN
        IF NEW.requested_amount < v_min_amount THEN
            RAISE EXCEPTION '申請金額が最小金額（%円）を下回っています', v_min_amount;
        END IF;
        
        IF NEW.requested_amount > v_max_amount THEN
            RAISE EXCEPTION '申請金額が最大金額（%円）を超えています', v_max_amount;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの適用
-- 申請作成時
CREATE TRIGGER trg_auto_create_document_requirements
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_document_requirements();

-- 申請フレーム変更時
CREATE TRIGGER trg_update_document_requirements
    AFTER UPDATE OF application_frame ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_document_requirements_on_frame_change();

-- 書類ステータス更新時
CREATE TRIGGER trg_auto_update_application_status
    AFTER INSERT OR UPDATE OF status ON application_documents
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_application_status();

-- 企業情報更新時の中小企業判定
CREATE TRIGGER trg_auto_check_sme_status
    BEFORE INSERT OR UPDATE OF capital_amount, employee_count, industry_code ON companies
    FOR EACH ROW
    EXECUTE FUNCTION auto_check_sme_status();

-- 申請金額の妥当性チェック
CREATE TRIGGER trg_validate_application_amount
    BEFORE INSERT OR UPDATE OF requested_amount, application_frame ON applications
    FOR EACH ROW
    EXECUTE FUNCTION validate_application_amount();

-- 申請書類管理テーブル（トリガー用）
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_code VARCHAR(50) NOT NULL REFERENCES required_documents(document_code),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected')),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(application_id, document_code)
);

-- インデックスの作成
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_status ON application_documents(status);
CREATE INDEX idx_application_documents_document_code ON application_documents(document_code);