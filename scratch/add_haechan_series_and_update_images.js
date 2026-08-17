const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../data/jasdor.db');
const db = new Database(dbPath);

console.log('--- Fixing Banana Americano & Updating Menu Baru ---');

// 1. Read existing products file
const productsFilePath = path.join(__dirname, '../src/lib/kopi_kenangan_products_data.ts');
let fileContent = fs.readFileSync(productsFilePath, 'utf8');
let jsonStr = fileContent.replace('export const KOPI_KENANGAN_PRODUCTS = ', '').replace(/;\s*$/, '');
let products = JSON.parse(jsonStr);

// 2. Fix Banana Americano & Haechan items
products = products.map((p) => {
  if (p.name.toLowerCase() === 'banana americano') {
    p.category = 'Menu Baru';
    p.is_single_item = 0;
    p.price = 18000;
    p.image = 'https://iili.io/Cs9tSoJ.jpg';
    p.description = 'Seri HAECHAN A SIP OF SUNSHINE - Espresso berkombinasi rasa pisang manis menyegarkan.';
  }
  if (p.id === 'kk_prod_301' || p.name.toLowerCase() === 'korean banana latte') {
    p.category = 'Menu Baru';
    p.is_single_item = 0;
    p.price = 19000;
    p.image = 'https://iili.io/Cs9ZyyF.jpg';
  }
  if (p.id === 'kk_prod_303' || p.name.toLowerCase() === 'banana choco') {
    p.category = 'Menu Baru';
    p.is_single_item = 0;
    p.price = 19000;
    p.image = 'https://iili.io/Cs9D3Ne.jpg';
  }
  if (p.id === 'kk_prod_304' || p.name.toLowerCase().includes('oatmeal raisin')) {
    p.category = 'Menu Baru';
    p.is_single_item = 0;
    p.price = 17000;
    p.image = 'https://iili.io/Cs9gGgs.jpg';
  }
  if (p.id === 'kk_prod_305' || p.name.toLowerCase().includes('bananachoco soft')) {
    p.category = 'Menu Baru';
    p.is_single_item = 0;
    p.price = 17000;
    p.image = 'https://iili.io/Cs9rHIp.jpg';
  }
  if (p.id === 'kk_prod_306' || p.name.toLowerCase().includes('sweet honey soft')) {
    p.category = 'Menu Baru';
    p.is_single_item = 0;
    p.price = 17000;
    p.image = 'https://iili.io/Cs943wQ.jpg';
  }
  return p;
});

// Remove any duplicate Banana Americano entries if both kk_prod_211 and kk_prod_302 exist
const seenNames = new Set();
products = products.filter((p) => {
  const key = p.name.toLowerCase();
  if (seenNames.has(key)) return false;
  seenNames.add(key);
  return true;
});

// 3. Save updated products to TS files
const updatedTsCode = `export const KOPI_KENANGAN_PRODUCTS = ${JSON.stringify(products, null, 2)};\n`;
fs.writeFileSync(productsFilePath, updatedTsCode);
fs.writeFileSync(path.join(__dirname, 'kopi_kenangan_products_data.ts'), updatedTsCode);

console.log('Saved', products.length, 'products to TS files.');

// 4. Update SQLite Database
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

// Also clean up SQLite database if duplicate Banana Americano existed
db.prepare("UPDATE products SET category = 'Menu Baru', is_single_item = 0, price = 18000, image = 'https://iili.io/Cs9tSoJ.jpg' WHERE LOWER(name) = 'banana americano'").run();

console.log('Successfully fixed Banana Americano in SQLite DB!');
