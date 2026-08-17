-- ========================================================
-- SUPABASE MIGRATION SCHEMA: site_settings & Realtime
-- ========================================================

-- 1. Create table site_settings for global site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert initial website_status record if not exists
INSERT INTO public.site_settings (id, setting_key, setting_value, updated_at)
VALUES ('1', 'website_status', 'ON', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Public Read Access for Customer & Admin
CREATE POLICY "Allow public read site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Insert/Update Access for Admin / Public
CREATE POLICY "Allow public insert site_settings"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update site_settings"
  ON public.site_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Enable Supabase Realtime for site_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
