-- ====================================================================
-- FULL SUPABASE DATABASE SCHEMA & REALTIME CONFIGURATION FOR JASDORBYDY
-- ====================================================================

-- 1. website_settings TABLE
CREATE TABLE IF NOT EXISTS public.website_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'Jasdorbydy',
  logo_url TEXT DEFAULT '/logo-store.png',
  theme_color TEXT DEFAULT '#b84d6b',
  wa_group_url TEXT DEFAULT 'https://chat.whatsapp.com/LOuCM1OUNNBEbuq894AJ0Q?s=cl&p=a&ilr=4',
  wa_admin_number TEXT DEFAULT '6285124356993',
  testimonial_url TEXT DEFAULT '#testimonials',
  website_status TEXT DEFAULT 'ON',
  order_status TEXT DEFAULT 'ON',
  closed_title TEXT DEFAULT 'LAGI ISTIRAHAT DULU',
  closed_desc TEXT DEFAULT 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.',
  closed_button_text TEXT DEFAULT 'Chat Admin',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. site_settings TABLE (Compatibility Key-Value Table)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. brands TABLE
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT NOT NULL,
  status TEXT DEFAULT 'ON',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. outlets TABLE
CREATE TABLE IF NOT EXISTS public.outlets (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  outlet_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude NUMERIC DEFAULT 0,
  longitude NUMERIC DEFAULT 0,
  opening_hours TEXT DEFAULT '10:00 - 22:00 WIB',
  status TEXT DEFAULT 'ON',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. products TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT DEFAULT 'Kopi',
  availability TEXT DEFAULT 'ON',
  customization_json TEXT DEFAULT '{}',
  is_single_item INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. orders TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  outlet_name TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INITIAL SEED DATA
-- ====================================================================
INSERT INTO public.website_settings (id, site_name, logo_url, theme_color, wa_group_url, wa_admin_number, testimonial_url, website_status, order_status, closed_title, closed_desc, closed_button_text)
VALUES (1, 'Jasdorbydy', '/logo-store.png', '#b84d6b', 'https://chat.whatsapp.com/LOuCM1OUNNBEbuq894AJ0Q?s=cl&p=a&ilr=4', '6285124356993', '#testimonials', 'ON', 'ON', 'LAGI ISTIRAHAT DULU', 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.', 'Chat Admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_settings (id, setting_key, setting_value, updated_at)
VALUES ('1', 'website_status', 'ON', NOW())
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.brands (id, name, slug, logo_url, status)
VALUES 
  ('brand_kopi_kenangan', 'Kopi Kenangan', 'kopi-kenangan', '/kopi-kenangan-logo.svg', 'ON'),
  ('brand_tomoro', 'Tomoro Coffee', 'tomoro-coffee', '/tomoro-logo.svg', 'OFF'),
  ('brand_voucher', 'Voucher & Promo', 'voucher-promo', '/voucher-logo.svg', 'OFF')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all website_settings" ON public.website_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all outlets" ON public.outlets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- SUPABASE REALTIME PUBLICATION ENABLEMENT
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outlets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
