const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const transcriptPath = '/Users/macbook/.gemini/antigravity-ide/brain/f292b97a-fef4-4e36-ab3c-32a89b449aaa/.system_generated/logs/transcript_full.jsonl';
const logContent = fs.readFileSync(transcriptPath, 'utf8');

// Get the last line of transcript_full.jsonl
const lines = logContent.trim().split('\n');
const lastLine = lines[lines.length - 1];

console.log('Reading transcript line length:', lastLine.length);

// Regex pattern to extract labels
const labelRegex = /<label[^>]*class="outlet-item[^"]*"[^>]*data-outlet-name="([^"]+)"[^>]*data-outlet-address="([^"]+)"[\s\S]*?value="([^"]+)"[\s\S]*?(?:([0-9]{2}:[0-9]{2}\s*-\s*[0-9]{2}:[0-9]{2}\s*WIB))?[\s\S]*?<\/label>/g;

const outlets = [];
let match;
while ((match = labelRegex.exec(lastLine)) !== null) {
  const name = match[1].trim();
  const address = match[2].trim();
  const rawId = match[3].trim();
  const hours = match[4] ? match[4].trim() : '10:00 - 22:00 WIB';

  // Infer city
  let city = 'Indonesia';
  const citiesList = [
    'Jakarta Central', 'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Jakarta',
    'Surabaya', 'Bandung', 'Bekasi', 'Depok', 'Tangerang City', 'Tangerang Selatan', 'Tangerang', 'Bogor',
    'Semarang', 'Yogyakarta', 'Lampung', 'Banjarmasin', 'Minahasa Utara', 'Malang', 'Solo', 'Medan', 'Palembang', 'Makassar', 'Bali'
  ];

  for (const c of citiesList) {
    if (address.toLowerCase().includes(c.toLowerCase()) || name.toLowerCase().includes(c.toLowerCase())) {
      city = c;
      break;
    }
  }

  outlets.push({
    id: 'out_' + rawId,
    brand_id: 'brand_kopi_kenangan',
    outlet_name: name,
    address: address,
    city: city,
    opening_hours: hours,
    status: 'ON'
  });
}

console.log(`Successfully extracted ${outlets.length} outlet records!`);

if (outlets.length > 0) {
  console.log('First outlet:', outlets[0]);
  console.log('Last outlet:', outlets[outlets.length - 1]);

  const dbPath = path.join(process.cwd(), 'data', 'jasdor.db');
  const db = new Database(dbPath);

  try {
    db.exec('ALTER TABLE outlets ADD COLUMN opening_hours TEXT DEFAULT "10:00 - 22:00 WIB"');
  } catch (e) {}

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO outlets (id, brand_id, outlet_name, address, city, opening_hours, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      stmt.run(r.id, r.brand_id, r.outlet_name, r.address, r.city, r.opening_hours, r.status);
    }
  });

  insertMany(outlets);
  console.log('Database updated with all extracted real Kopi Kenangan outlets!');
} else {
  console.error('No outlets were extracted. Checking alternative regex pattern...');
  
  // Alternative fallback regex for data-outlet-name
  const nameRegex = /data-outlet-name="([^"]+)"\s+data-outlet-address="([^"]+)"/g;
  const valueRegex = /value="(\d+)"/g;
  
  const names = [];
  let m;
  while ((m = nameRegex.exec(lastLine)) !== null) {
    names.push({ name: m[1].trim(), address: m[2].trim() });
  }

  const values = [];
  while ((m = valueRegex.exec(lastLine)) !== null) {
    values.push(m[1].trim());
  }

  console.log(`Found ${names.length} names & ${values.length} values.`);

  if (names.length > 0) {
    const dbPath = path.join(process.cwd(), 'data', 'jasdor.db');
    const db = new Database(dbPath);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO outlets (id, brand_id, outlet_name, address, city, opening_hours, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const rows = [];
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      const val = values[i] || `${i + 1}`;
      let city = 'Indonesia';
      const citiesList = [
        'Jakarta Central', 'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Jakarta',
        'Surabaya', 'Bandung', 'Bekasi', 'Depok', 'Tangerang City', 'Tangerang Selatan', 'Tangerang', 'Bogor',
        'Semarang', 'Yogyakarta', 'Lampung', 'Banjarmasin', 'Minahasa Utara', 'Malang', 'Solo', 'Medan', 'Palembang', 'Makassar', 'Bali'
      ];
      for (const c of citiesList) {
        if (n.address.toLowerCase().includes(c.toLowerCase()) || n.name.toLowerCase().includes(c.toLowerCase())) {
          city = c;
          break;
        }
      }
      rows.push({
        id: 'out_' + val,
        brand_id: 'brand_kopi_kenangan',
        outlet_name: n.name,
        address: n.address,
        city: city,
        opening_hours: '10:00 - 22:00 WIB',
        status: 'ON'
      });
    }

    const insertMany = db.transaction((items) => {
      for (const r of items) {
        stmt.run(r.id, r.brand_id, r.outlet_name, r.address, r.city, r.opening_hours, r.status);
      }
    });

    insertMany(rows);
    console.log(`Successfully inserted ${rows.length} real outlets via fallback parser!`);
  }
}
