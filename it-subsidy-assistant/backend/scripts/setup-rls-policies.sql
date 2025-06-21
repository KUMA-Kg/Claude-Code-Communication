-- IT補助金アシストツール RLS (Row Level Security) ポリシー設定
-- このスクリプトはSupabaseのSQLエディタで実行してください

-- ========================================
-- 1. RLSを有効化
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. ヘルパー関数の作成
-- ========================================

-- 現在のユーザーIDを取得
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS UUID AS $$
  SELECT auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ユーザーのロールを取得
CREATE OR REPLACE FUNCTION auth.user_role() 
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ユーザーが所属する企業IDを取得
CREATE OR REPLACE FUNCTION auth.user_company_id() 
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ========================================
-- 3. Users テーブルのポリシー
-- ========================================

-- 自分のプロフィールは誰でも閲覧可能
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.user_id());

-- 管理者は全ユーザーを閲覧可能
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.user_role() = 'admin');

-- 自分のプロフィールは更新可能
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- ========================================
-- 4. Companies テーブルのポリシー
-- ========================================

-- 企業ユーザーは自社の情報を閲覧可能
CREATE POLICY "Company users can view own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.user_id()
    )
  );

-- 管理者とコンサルタントは全企業を閲覧可能
CREATE POLICY "Admins and consultants can view all companies" ON companies
  FOR SELECT USING (
    auth.user_role() IN ('admin', 'consultant')
  );

-- 企業管理者は自社情報を更新可能
CREATE POLICY "Company admins can update own company" ON companies
  FOR UPDATE USING (
    id = auth.user_company_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.user_id() 
      AND company_id = companies.id 
      AND is_company_admin = true
    )
  );

-- 管理者は企業を作成可能
CREATE POLICY "Admins can create companies" ON companies
  FOR INSERT WITH CHECK (auth.user_role() = 'admin');

-- ========================================
-- 5. Applications テーブルのポリシー
-- ========================================

-- 企業ユーザーは自社の申請を閲覧可能
CREATE POLICY "Company users can view own applications" ON applications
  FOR SELECT USING (
    company_id = auth.user_company_id()
  );

-- 管理者とコンサルタントは全申請を閲覧可能
CREATE POLICY "Admins and consultants can view all applications" ON applications
  FOR SELECT USING (
    auth.user_role() IN ('admin', 'consultant')
  );

-- 企業ユーザーは自社の申請を作成可能
CREATE POLICY "Company users can create applications" ON applications
  FOR INSERT WITH CHECK (
    company_id = auth.user_company_id()
  );

-- 企業ユーザーは下書き状態の申請のみ更新可能
CREATE POLICY "Company users can update draft applications" ON applications
  FOR UPDATE USING (
    company_id = auth.user_company_id() AND
    status = 'draft'
  );

-- 管理者は全申請を更新可能
CREATE POLICY "Admins can update all applications" ON applications
  FOR UPDATE USING (auth.user_role() = 'admin');

-- ========================================
-- 6. Documents テーブルのポリシー
-- ========================================

-- 申請に関連する書類は申請者が閲覧可能
CREATE POLICY "Users can view own application documents" ON documents
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM applications 
      WHERE company_id = auth.user_company_id()
    )
  );

-- 管理者とコンサルタントは全書類を閲覧可能
CREATE POLICY "Admins and consultants can view all documents" ON documents
  FOR SELECT USING (
    auth.user_role() IN ('admin', 'consultant')
  );

-- 申請者は自社の申請に書類をアップロード可能
CREATE POLICY "Users can upload documents for own applications" ON documents
  FOR INSERT WITH CHECK (
    application_id IN (
      SELECT id FROM applications 
      WHERE company_id = auth.user_company_id()
      AND status IN ('draft', 'submitted')
    )
  );

-- 申請者は未確認の書類のみ削除可能
CREATE POLICY "Users can delete unverified documents" ON documents
  FOR DELETE USING (
    application_id IN (
      SELECT id FROM applications 
      WHERE company_id = auth.user_company_id()
    ) AND status = 'pending'
  );

-- ========================================
-- 7. Subsidies テーブルのポリシー
-- ========================================

-- 補助金情報は全員が閲覧可能
CREATE POLICY "Anyone can view active subsidies" ON subsidies
  FOR SELECT USING (is_active = true);

-- 管理者のみ補助金情報を管理可能
CREATE POLICY "Only admins can manage subsidies" ON subsidies
  FOR ALL USING (auth.user_role() = 'admin');

-- ========================================
-- 8. Application Logs テーブルのポリシー
-- ========================================

-- 自社の申請ログは閲覧可能
CREATE POLICY "Users can view own application logs" ON application_logs
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM applications 
      WHERE company_id = auth.user_company_id()
    )
  );

-- 管理者は全ログを閲覧可能
CREATE POLICY "Admins can view all logs" ON application_logs
  FOR SELECT USING (auth.user_role() = 'admin');

-- システムのみがログを作成可能（サービスロールキー使用）
CREATE POLICY "System can create logs" ON application_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

-- ========================================
-- 9. セキュリティ関数の作成
-- ========================================

-- データ暗号化用の関数（機密情報保護）
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 実装では適切な暗号化ライブラリを使用
  -- ここではプレースホルダー
  RETURN encode(digest(data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 10. 監査トリガーの作成
-- ========================================

-- 変更履歴を記録する関数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    user_id,
    changed_data,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.user_id(),
    to_jsonb(NEW),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重要テーブルに監査トリガーを設定
CREATE TRIGGER audit_applications
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ========================================
-- 11. インデックスの作成（パフォーマンス最適化）
-- ========================================

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_application_logs_application_id ON application_logs(application_id);

-- ========================================
-- 実行完了メッセージ
-- ========================================
-- RLSポリシーの設定が完了しました。
-- 各テーブルに適切なアクセス制御が適用されています。