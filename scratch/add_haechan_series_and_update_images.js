const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../data/jasdor.db');
const db = new Database(dbPath);

console.log('--- Updating Product Data & Database ---');

// Ensure is_single_item column exists
try {
  db.exec('ALTER TABLE products ADD COLUMN is_single_item INTEGER DEFAULT 0;');
} catch (e) {
  // Column already exists
}

// 1. Read existing products file
const productsFilePath = path.join(__dirname, '../src/lib/kopi_kenangan_products_data.ts');
let fileContent = fs.readFileSync(productsFilePath, 'utf8');
let jsonStr = fileContent.replace('export const KOPI_KENANGAN_PRODUCTS = ', '').replace(/;\s*$/, '');
let products = JSON.parse(jsonStr);

// 2. Define Image Updates for Existing Products
const imageUpdates = [
  { namePattern: /Salt Bread|Saltbread/i, newImage: 'https://iili.io/Cs9eR5B.jpg' },
  { namePattern: /Vanilla Choux Puff|Choux/i, newImage: 'https://iili.io/Cs9etrx.jpg' },
  { namePattern: /Canele Aren/i, newImage: 'https://iili.io/Cs961qP.jpg' },
  { namePattern: /Blueberry Muffin/i, newImage: 'https://iili.io/Cs96rkG.jpg' },
  { namePattern: /Choco Muffin/i, newImage: 'https://iili.io/Cs9Pw8u.jpg' },
  { namePattern: /^Kopi Kenangan Mantan$/i, newImage: 'https://iili.io/CsAJ6x4.jpg' },
  { namePattern: /Sandwich Chicken|Adam Ayam/i, newImage: 'https://iili.io/CsAf3H7.jpg' },
  { namePattern: /Butterscotch.*Frappe/i, newImage: 'https://iili.io/Cs9sTgt.jpg' },
];

// Update existing items in array
products = products.map((p) => {
  for (const update of imageUpdates) {
    if (update.namePattern.test(p.name)) {
      p.image = update.newImage;
    }
  }
  return p;
});

// 3. New Haechan Series Products & Frappes
const newItems = [
  {
    id: 'kk_prod_301',
    brand_id: 'brand_kopi_kenangan',
    name: 'Korean Banana Latte',
    image: 'https://iili.io/Cs9ZyyF.jpg',
    description: 'Seri HAECHAN A SIP OF SUNSHINE - Korean Banana Latte segar manis pisang khas Korea.',
    price: 19000,
    category: 'Haechan Series',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: true, has_ukuran: true, has_es: true, has_gula: true, has_beans: true, has_syrup: true, has_topping: true }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_302',
    brand_id: 'brand_kopi_kenangan',
    name: 'Banana Americano',
    image: 'https://iili.io/Cs9tSoJ.jpg',
    description: 'Seri HAECHAN A SIP OF SUNSHINE - Espresso berkombinasi rasa pisang manis menyegarkan.',
    price: 18000,
    category: 'Haechan Series',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: true, has_ukuran: true, has_es: true, has_gula: true, has_beans: true, has_syrup: true, has_topping: true }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_303',
    brand_id: 'brand_kopi_kenangan',
    name: 'Banana Choco',
    image: 'https://iili.io/Cs9D3Ne.jpg',
    description: 'Seri HAECHAN A SIP OF SUNSHINE - Cokelat kaya rasa berpadu dengan aroma rasa pisang manis.',
    price: 19000,
    category: 'Haechan Series',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: true, has_ukuran: true, has_es: true, has_gula: true, has_beans: true, has_syrup: true, has_topping: true }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_304',
    brand_id: 'brand_kopi_kenangan',
    name: 'Oatmeal Raisin Soft Baked Cookie',
    image: 'https://iili.io/Cs9gGgs.jpg',
    description: 'Seri HAECHAN A SIP OF SUNSHINE - Soft baked cookie lembut dengan kismis dan oat bernutrisi.',
    price: 17000,
    category: 'Haechan Series',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: false, has_ukuran: false, has_es: false, has_gula: false, has_beans: false, has_syrup: false, has_topping: false }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_305',
    brand_id: 'brand_kopi_kenangan',
    name: 'Bananachoco Soft Baked Cookie',
    image: 'https://iili.io/Cs9rHIp.jpg',
    description: 'Seri HAECHAN A SIP OF SUNSHINE - Soft baked cookie manis perpaduan cokelat & pisang.',
    price: 17000,
    category: 'Haechan Series',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: false, has_ukuran: false, has_es: false, has_gula: false, has_beans: false, has_syrup: false, has_topping: false }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_306',
    brand_id: 'brand_kopi_kenangan',
    name: 'Sweet Honey Soft Baked Cookie',
    image: 'https://iili.io/Cs943wQ.jpg',
    description: 'Seri HAECHAN A SIP OF SUNSHINE - Soft baked cookie dengan sentuhan madu manis harum.',
    price: 17000,
    category: 'Haechan Series',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: false, has_ukuran: false, has_es: false, has_gula: false, has_beans: false, has_syrup: false, has_topping: false }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_307',
    brand_id: 'brand_kopi_kenangan',
    name: 'Coffeeberry Frappe',
    image: 'https://iili.io/Cs9Q5xf.jpg',
    description: 'Sensasi kelezatan frappe kopi berpadu dengan keharuman buah berry.',
    price: 24000,
    category: 'Frappe',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: false, has_ukuran: true, has_es: true, has_gula: true, has_beans: false, has_syrup: true, has_topping: true }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_308',
    brand_id: 'brand_kopi_kenangan',
    name: 'Chocoberry Frappe',
    image: 'https://iili.io/Cs9Q4Wv.jpg',
    description: 'Kelezatan frappe cokelat berpadu sempurna dengan keharuman manis buah berry.',
    price: 24000,
    category: 'Frappe',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: false, has_ukuran: true, has_es: true, has_gula: true, has_beans: false, has_syrup: true, has_topping: true }),
    is_single_item: 0,
  },
  {
    id: 'kk_prod_309',
    brand_id: 'brand_kopi_kenangan',
    name: 'Blueberry Frappe',
    image: 'https://iili.io/Cs9Q5xf.jpg',
    description: 'Kelezatan frappe rasa blueberry menyegarkan.',
    price: 24000,
    category: 'Frappe',
    availability: 'ON',
    customization_json: JSON.stringify({ has_suhu: false, has_ukuran: true, has_es: true, has_gula: true, has_beans: false, has_syrup: true, has_topping: true }),
    is_single_item: 0,
  },
];

// Add new items if they don't already exist in products array
for (const item of newItems) {
  if (!products.some((p) => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase())) {
    products.push(item);
  }
}

// 4. Save updated products to kopi_kenangan_products_data.ts files
const updatedTsCode = `export const KOPI_KENANGAN_PRODUCTS = ${JSON.stringify(products, null, 2)};\n`;
fs.writeFileSync(productsFilePath, updatedTsCode);
fs.writeFileSync(path.join(__dirname, 'kopi_kenangan_products_data.ts'), updatedTsCode);

console.log('Saved', products.length, 'products to TS files.');

// 5. Update SQLite Database
const upsertStmt = db.prepare(`
  INSERT INTO products (id, brand_id, name, image, description, price, category, availability, customization_json, is_single_item)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    image = excluded.image,
    description = excluded.description,
    price = excluded.price,
    category = excluded.category,
    availability = excluded.availability,
    customization_json = excluded.customization_json,
    is_single_item = excluded.is_single_item
`);

const transaction = db.transaction((itemArray) => {
  for (const item of itemArray) {
    upsertStmt.run(
      item.id,
      item.brand_id,
      item.name,
      item.image,
      item.description,
      item.price,
      item.category,
      item.availability,
      item.customization_json,
      item.is_single_item ? 1 : 0
    );
  }
});

transaction(products);
console.log('Successfully upserted all products into SQLite DB!');
