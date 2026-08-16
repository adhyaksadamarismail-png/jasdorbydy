const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const transcriptPath = '/Users/macbook/.gemini/antigravity-ide/brain/f292b97a-fef4-4e36-ab3c-32a89b449aaa/.system_generated/logs/transcript_full.jsonl';
const transcriptText = fs.readFileSync(transcriptPath, 'utf8');

// Regex for extracting outlet labels with escaped quotes support
const nameRegex = /data-outlet-name=\\?["']([^"'\\]+)\\?["'][\s\S]*?data-outlet-address=\\?["']([^"'\\]+)\\?["']/g;
const valueRegex = /name=\\?["']outlet_radio\\?["']\s+value=\\?["'](\d+)\\?["']/g;
const hoursRegex = /([0-9]{2}:[0-9]{2}\s*-\s*[0-9]{2}:[0-9]{2}\s*WIB)/g;

const matchesName = [];
let m;
while ((m = nameRegex.exec(transcriptText)) !== null) {
  matchesName.push({
    name: m[1].trim(),
    address: m[2].trim()
  });
}

const matchesVal = [];
while ((m = valueRegex.exec(transcriptText)) !== null) {
  matchesVal.push(m[1].trim());
}

const matchesHours = [];
while ((m = hoursRegex.exec(transcriptText)) !== null) {
  matchesHours.push(m[1].trim());
}

console.log(`Found ${matchesName.length} names, ${matchesVal.length} IDs, and ${matchesHours.length} operating hours!`);

const dbPath = path.join(process.cwd(), 'data', 'jasdor.db');
const db = new Database(dbPath);

try {
  db.exec('ALTER TABLE outlets ADD COLUMN opening_hours TEXT DEFAULT "10:00 - 22:00 WIB"');
} catch (e) {}

const stmt = db.prepare(`
  INSERT OR REPLACE INTO outlets (id, brand_id, outlet_name, address, city, opening_hours, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertedOutlets = [];
const seenIds = new Set();

for (let i = 0; i < matchesName.length; i++) {
  const name = matchesName[i].name;
  const address = matchesName[i].address;
  const idVal = matchesVal[i] || `${i + 1}`;
  const hours = matchesHours[i] || '10:00 - 22:00 WIB';

  if (seenIds.has(idVal)) continue;
  seenIds.add(idVal);

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

  const item = {
    id: 'out_' + idVal,
    brand_id: 'brand_kopi_kenangan',
    outlet_name: name,
    address,
    city,
    opening_hours: hours,
    status: 'ON'
  };

  stmt.run(item.id, item.brand_id, item.outlet_name, item.address, item.city, item.opening_hours, item.status);
  insertedOutlets.push(item);
}

console.log(`Successfully stored ${insertedOutlets.length} unique real outlets into SQLite database!`);
