-- Worker1要求準拠 セッション管理テーブル
-- Phase 1: 統合用

-- UUID拡張を有効化（必要な場合）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  generated_documents JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- Row Level Security (RLS) 有効化
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ポリシー：ユーザーは自分のセッションのみアクセス可能
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 開発用サンプルデータ（オプション）
-- INSERT INTO sessions (user_id, name, answers, recommendations) VALUES
-- ('00000000-0000-0000-0000-000000000000', 'サンプルセッション', 
--  '{"q1": "回答1", "q2": "回答2"}', 
--  '[{"subsidy": "IT導入補助金", "score": 0.85}]');