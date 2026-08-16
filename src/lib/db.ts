import path from 'path';
import fs from 'fs';

let db: any;

// Memory storage state for fallback mode
const memoryStore: any = {
  website_settings: [
    {
      id: 1,
      site_name: 'Jasdorbydy',
      logo_url: '/logo-store.png',
      theme_color: '#b84d6b',
      wa_group_url: 'https://chat.whatsapp.com/GrupJasDorExample',
      wa_admin_number: '6281234567890',
      testimonial_url: '#testimonials',
      website_status: 'ON',
      order_status: 'ON',
      closed_title: 'LAGI ISTIRAHAT DULU',
      closed_desc: 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.',
      closed_button_text: 'Chat Admin',
    },
  ],
  brands: [
    { id: 'brand_kopi_kenangan', name: 'Kopi Kenangan', slug: 'kopi-kenangan', logo_url: '/kopi-kenangan-logo.svg', status: 'ON' },
    { id: 'brand_tomoro', name: 'Tomoro Coffee', slug: 'tomoro-coffee', logo_url: '/tomoro-logo.svg', status: 'OFF' },
    { id: 'brand_voucher', name: 'Voucher & Promo', slug: 'voucher-promo', logo_url: '/voucher-logo.svg', status: 'OFF' },
  ],
  outlets: [],
  products: [],
  orders: [],
};

try {
  // Try loading native better-sqlite3 module
  const Database = require('better-sqlite3');
  const isVercel = process.env.VERCEL === '1';
  const defaultDbPath = path.join(process.cwd(), 'data', 'jasdor.db');
  let dbPath = defaultDbPath;

  if (isVercel) {
    const tmpDbPath = '/tmp/jasdor.db';
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(defaultDbPath)) {
      try {
        fs.copyFileSync(defaultDbPath, tmpDbPath);
      } catch (e) {
        console.error('Failed copying database to /tmp:', e);
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      dbPath = tmpDbPath;
    }
  } else {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {}
} catch (nativeErr) {
  console.warn('better-sqlite3 native driver not available on this platform. Falling back to memory DB store:', nativeErr);

  db = {
    exec: () => {},
    pragma: () => {},
    transaction: (fn: Function) => fn,
    prepare: (sql: string) => {
      const lowerSql = sql.toLowerCase();
      return {
        get: (...params: any[]) => {
          if (lowerSql.includes('website_settings')) return memoryStore.website_settings[0];
          if (lowerSql.includes('count(*)')) return { count: 1 };
          return null;
        },
        all: (...params: any[]) => {
          if (lowerSql.includes('from website_settings')) return memoryStore.website_settings;
          if (lowerSql.includes('from brands')) return memoryStore.brands;
          if (lowerSql.includes('from outlets')) return memoryStore.outlets;
          if (lowerSql.includes('from products')) return memoryStore.products;
          if (lowerSql.includes('from orders')) return memoryStore.orders;
          return [];
        },
        run: (...params: any[]) => {
          return { changes: 1 };
        },
      };
    },
  };
}

export { db };
export default db;

// Initialize database schema and initial seed data
export function initDb() {
  if (!db.exec) return;

  try {
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

    db.prepare(`
      INSERT OR REPLACE INTO brands (id, name, slug, logo_url, status)
      VALUES 
        ('brand_kopi_kenangan', 'Kopi Kenangan', 'kopi-kenangan', '/kopi-kenangan-logo.svg', 'ON'),
        ('brand_tomoro', 'Tomoro Coffee', 'tomoro-coffee', '/tomoro-logo.svg', 'OFF'),
        ('brand_voucher', 'Voucher & Promo', 'voucher-promo', '/voucher-logo.svg', 'OFF')
    `).run();

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

    try {
      db.exec('ALTER TABLE products ADD COLUMN customization_json TEXT DEFAULT "{}"');
    } catch (e) {}

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
  } catch (err) {
    console.error('Error during initDb:', err);
  }
}
