import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'jasdor.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema and initial seed data
export function initDb() {
  // Website Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS website_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_name TEXT DEFAULT "Jasdorbydy",
      logo_url TEXT DEFAULT "/logo-store.png",
      theme_color TEXT DEFAULT "#b84d6b",
      wa_group_url TEXT DEFAULT "https://chat.whatsapp.com/GrupJasDorExample",
      wa_admin_number TEXT DEFAULT "6281234567890",
      testimonial_url TEXT DEFAULT "#testimonials",
      website_status TEXT DEFAULT "ON",
      order_status TEXT DEFAULT "ON",
      closed_title TEXT DEFAULT "LAGI ISTIRAHAT DULU",
      closed_desc TEXT DEFAULT "Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.",
      closed_button_text TEXT DEFAULT "Chat Admin"
    );
  `);

  // Ensure default row exists
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM website_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO website_settings (id, site_name, logo_url, theme_color, wa_group_url, wa_admin_number, testimonial_url, website_status, order_status, closed_title, closed_desc, closed_button_text)
      VALUES (1, 'Jasdorbydy', '/logo-store.png', '#b84d6b', 'https://chat.whatsapp.com/GrupJasDorExample', '6281234567890', '#testimonials', 'ON', 'ON', 'LAGI ISTIRAHAT DULU', 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.', 'Chat Admin')
    `).run();
  } else {
    // Update existing row logo_url to use uploaded PNG logo
    db.prepare("UPDATE website_settings SET logo_url = '/logo-store.png', site_name = 'Jasdorbydy' WHERE id = 1").run();
  }

  // Brands Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT NOT NULL,
      status TEXT DEFAULT "ON"
    );
  `);

  // Outlets Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS outlets (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      outlet_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      opening_hours TEXT DEFAULT "10:00 - 22:00 WIB",
      status TEXT DEFAULT "ON",
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );
  `);

  // Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      category TEXT DEFAULT "Coffees",
      availability TEXT DEFAULT "ON",
      customization_json TEXT DEFAULT "{}",
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );
  `);

  // Ensure customization_json column exists
  try {
    db.exec('ALTER TABLE products ADD COLUMN customization_json TEXT DEFAULT "{}"');
  } catch (e) {}

  // Update Seed Products for Kopi Kenangan
  const fullConfig = JSON.stringify({
    has_suhu: true,
    has_ukuran: true,
    has_es: true,
    has_gula: true,
    has_beans: true,
    has_syrup: true,
    has_topping: true,
  });

  const drinkConfig = JSON.stringify({
    has_suhu: true,
    has_ukuran: true,
    has_es: true,
    has_gula: true,
    has_syrup: true,
    has_topping: true,
  });

  const snackConfig = JSON.stringify({});

  db.prepare(`
    INSERT OR REPLACE INTO products (id, brand_id, name, image, description, price, category, availability, customization_json)
    VALUES 
      ('prod_1', 'brand_kopi_kenangan', 'Kopi Kenangan Mantan', '/coffee-latte.svg', 'Espresso dengan gula aren asli yang manis gurih dan lembut.', 20000, 'Signature Coffee', 'ON', '${fullConfig}'),
      ('prod_2', 'brand_kopi_kenangan', 'Americano (Iced/Hot)', '/coffee-americano.svg', 'Espresso kaya rasa dengan air murni segar.', 15000, 'Coffee Classics', 'ON', '${fullConfig}'),
      ('prod_3', 'brand_kopi_kenangan', 'Latte Cinta Pertama', '/coffee-latte.svg', 'Espresso premium dengan susu segar pilihan.', 22000, 'Coffee Classics', 'ON', '${fullConfig}'),
      ('prod_4', 'brand_kopi_kenangan', 'Korean Banana Latte', '/coffee-avocado.svg', 'Kombinasi unik rasa pisang manis lembut dengan espresso mantap.', 16500, 'Specialty Coffee', 'ON', '${fullConfig}'),
      ('prod_5', 'brand_kopi_kenangan', 'Cokelat Kenangan', '/drink-chocolate.svg', 'Minuman cokelat creamy nan lezat manis pas.', 24000, 'Non-Coffee', 'ON', '${drinkConfig}'),
      ('prod_6', 'brand_kopi_kenangan', 'Toast Cokelat Keju', '/snack-toast.svg', 'Roti panggang empuk dengan keju melted dan cokelat.', 18000, 'Roti & Snacks', 'ON', '${snackConfig}')
  `).run();

  // Orders Log Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      outlet_name TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total_price INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initial Seed Data if empty
  const brandsCount = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
  if (brandsCount.count === 0) {
    // Seed Kopi Kenangan & Tomoro Coffee
    db.prepare(`
      INSERT OR IGNORE INTO brands (id, name, slug, logo_url, status)
      VALUES 
        ('brand_kopi_kenangan', 'Kopi Kenangan', 'kopi-kenangan', '/kopi-kenangan-logo.svg', 'ON'),
        ('brand_tomoro', 'Tomoro Coffee', 'tomoro-coffee', '/tomoro-logo.svg', 'OFF'),
        ('brand_voucher', 'Kode Voucher', 'kode-voucher', '/voucher-logo.svg', 'OFF')
    `).run();

    // Seed Outlets for Kopi Kenangan
    db.prepare(`
      INSERT OR IGNORE INTO outlets (id, brand_id, outlet_name, address, city, status)
      VALUES 
        ('out_1', 'brand_kopi_kenangan', 'Kopi Kenangan - Summarecon Mall Bekasi', 'Summarecon Mall Bekasi Lt. Dasar, Jl. Boulevard Ahmad Yani', 'Bekasi', 'ON'),
        ('out_2', 'brand_kopi_kenangan', 'Kopi Kenangan - Grand Indonesia', 'East Mall Lt. 3, Jl. MH Thamrin No. 1', 'Jakarta Central', 'ON'),
        ('out_3', 'brand_kopi_kenangan', 'Kopi Kenangan - Mall XYZ', 'Jl. Jendral Sudirman No. 123', 'Jakarta', 'ON'),
        ('out_4', 'brand_kopi_kenangan', 'Kopi Kenangan - Stasiun Gambir', 'Stasiun Gambir Pintu Utara', 'Jakarta Pusat', 'ON'),
        ('out_5', 'brand_kopi_kenangan', 'Kopi Kenangan - Central Park Mall', 'Lt. LG, Jl. Letjen S. Parman No. 28', 'Jakarta Barat', 'ON'),
        ('out_6', 'brand_kopi_kenangan', 'Kopi Kenangan - Bandung Supermall', 'Jl. Gatot Subroto No. 289', 'Bandung', 'OFF')
    `).run();

    // Seed Products for Kopi Kenangan
    db.prepare(`
      INSERT OR IGNORE INTO products (id, brand_id, name, image, description, price, category, availability)
      VALUES 
        ('prod_1', 'brand_kopi_kenangan', 'Kopi Kenangan Mantan', '/coffee-latte.svg', 'Espresso dengan gula aren asli yang manis gurih dan lembut.', 20000, 'Signature Coffee', 'ON'),
        ('prod_2', 'brand_kopi_kenangan', 'Americano (Iced/Hot)', '/coffee-americano.svg', 'Espresso kaya rasa dengan air murni segar.', 15000, 'Coffee Classics', 'ON'),
        ('prod_3', 'brand_kopi_kenangan', 'Latte Cinta Pertama', '/coffee-latte.svg', 'Espresso premium dengan susu segar pilihan.', 22000, 'Coffee Classics', 'ON'),
        ('prod_4', 'brand_kopi_kenangan', 'Avocado Coffee', '/coffee-avocado.svg', 'Perpaduan es krim alpukat legit dengan espresso.', 28000, 'Specialty Coffee', 'ON'),
        ('prod_5', 'brand_kopi_kenangan', 'Cokelat Kenangan', '/drink-chocolate.svg', 'Minuman cokelat creamy nan lezat manis pas.', 24000, 'Non-Coffee', 'ON'),
        ('prod_6', 'brand_kopi_kenangan', 'Toast Cokelat Keju', '/snack-toast.svg', 'Roti panggang empuk dengan keju melted dan cokelat.', 18000, 'Roti & Snacks', 'ON')
    `).run();
  }
}

// Call db init
initDb();

export default db;
