-- マルチサイト管理テーブル
-- 各ユーザーが複数のサイト（事業）を管理できるようにする

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  site_url VARCHAR(2048),
  site_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  industry VARCHAR(100),
  target_customer TEXT,
  latest_analysis JSONB,
  strategy_confirmed BOOLEAN DEFAULT FALSE,
  strategy_confirmed_at TIMESTAMP WITH TIME ZONE,
  chat_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_sites_user_email ON sites(user_email);
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sites_strategy_confirmed ON sites(user_email, strategy_confirmed);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sites_updated_at ON sites;
CREATE TRIGGER trigger_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_sites_updated_at();
