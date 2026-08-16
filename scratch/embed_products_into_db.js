const fs = require('fs');
const path = require('path');

const MENU = [
  // ── 15 MENU SATUAN (MAKSIMAL 1 CUP PER ORDER) ──
  { id: 101, cat: "Kopi", name: "Kopi Kenangan Mantan", img: "https://i.ibb.co.com/0yQbyxDQ/Frame-1410112838.png", origPrice: 21000, salePrice: 14500, isSingle: true },
  { id: 102, cat: "Kopi", name: "Spanish Latte", img: "https://i.ibb.co.com/DHVVbdkX/Frame-1410112842.png", origPrice: 19000, salePrice: 14500, isSingle: true },
  { id: 103, cat: "Kopi", name: "Butterscotch Aren Latte", img: "https://i.ibb.co.com/BVvpZ7hR/Frame-1410112854.png", origPrice: 25000, salePrice: 15000, isSingle: true },
  { id: 104, cat: "Kopi", name: "Americano", img: "https://i.ibb.co.com/Z6KK2CYy/Frame-1410112853.png", origPrice: 17000, salePrice: 13500, isSingle: true },
  { id: 105, cat: "Kopi", name: "Blueberry Americano", img: "https://i.ibb.co.com/Z6KK2CYy/Frame-1410112853.png", origPrice: 24000, salePrice: 19000, isSingle: true },
  { id: 106, cat: "Kopi", name: "Pistachio Aren Latte", img: "https://i.ibb.co.com/8Hyvm5b/Frame-1410112862.png", origPrice: 19000, salePrice: 14500, isSingle: true },
  { id: 107, cat: "Kopi", name: "Toffee Nut Latte", img: "https://i.ibb.co.com/zVbBCRkY/Frame-1410112861.png", origPrice: 19000, salePrice: 14500, isSingle: true },
  { id: 108, cat: "Non-Kopi", name: "OG Thai Tea", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 19000, salePrice: 14500, noBeans: true, noHot: true, isSingle: true },
  { id: 109, cat: "Non-Kopi", name: "Babycino", img: "https://i.ibb.co.com/XkSQgfyS/Frame-1410112886.png", origPrice: 19000, salePrice: 14500, noBeans: true, noHot: true, isSingle: true },
  { id: 110, cat: "Non-Kopi", name: "Raspberry Hibiscus", img: "https://i.ibb.co.com/99wF5vh5/Frame-1410112874.png", origPrice: 20000, salePrice: 15000, noBeans: true, noHot: true, isSingle: true },
  { id: 111, cat: "Kopi", name: "Banana Americano", img: "https://i.ibb.co.com/Z6KK2CYy/Frame-1410112853.png", origPrice: 20000, salePrice: 14500, isSingle: true },
  { id: 112, cat: "Non-Kopi", name: "Fresh Lemonade", img: "https://i.ibb.co.com/FqHmjmM4/Frame-1410112870.png", origPrice: 17000, salePrice: 13500, noBeans: true, noHot: true, isSingle: true },
  { id: 113, cat: "Non-Kopi", name: "Lemon Black Tea", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 17000, salePrice: 13500, noBeans: true, isSingle: true },
  { id: 114, cat: "Non-Kopi", name: "Choco Caramel", img: "https://i.ibb.co.com/YFz0B2vk/Frame-1410112869.png", origPrice: 28000, salePrice: 14500, noBeans: true, isSingle: true },
  { id: 115, cat: "Non-Kopi", name: "Air Mineral (Pristine)", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 7000, salePrice: 5000, noBeans: true, noHot: true, isSingle: true },

  // ── KOPI REGULER (MINIMAL 2 ITEM PER ORDER) ──
  { id: 1, cat: "Kopi", name: "Kopi Kenangan Mantan", img: "https://i.ibb.co.com/0yQbyxDQ/Frame-1410112838.png", origPrice: 21000, salePrice: 13000 },
  { id: 2, cat: "Kopi", name: "Latte", img: "https://i.ibb.co.com/nMPfxRc3/Frame-1410112855.png", origPrice: 22000, salePrice: 15000 },
  { id: 3, cat: "Kopi", name: "Cappuccino", img: "https://i.ibb.co.com/wZ6ySXyR/Frame-1410112852.png", origPrice: 22000, salePrice: 15000 },
  { id: 5, cat: "Kopi", name: "Vanilla Latte", img: "https://i.ibb.co.com/spKHQyYj/Frame-1410112841.png", origPrice: 26000, salePrice: 17000 },
  { id: 6, cat: "Kopi", name: "Hazelnut Latte", img: "https://i.ibb.co.com/Fky0GJzH/Frame-1410112846.png", origPrice: 26000, salePrice: 18000 },
  { id: 7, cat: "Kopi", name: "Caramel Latte", img: "https://i.ibb.co.com/PvFsvH97/Frame-1410112847.png", origPrice: 26000, salePrice: 18000 },
  { id: 8, cat: "Kopi", name: "Cafe Malt Latte", img: "https://i.ibb.co.com/3yzHQLNQ/Frame-1410112848.png", origPrice: 23000, salePrice: 15500 },
  { id: 9, cat: "Kopi", name: "Caramel Macchiato", img: "https://i.ibb.co.com/3YhzGVh0/Frame-1410112845.png", origPrice: 28000, salePrice: 18000 },
  { id: 10, cat: "Kopi", name: "Mocha Latte", img: "https://i.ibb.co.com/0yQbyxDQ/Frame-1410112838.png", origPrice: 28000, salePrice: 18000 },
  { id: 11, cat: "Kopi", name: "Kopi Susu Black Aren", img: "https://i.ibb.co.com/0yQbyxDQ/Frame-1410112838.png", origPrice: 21000, salePrice: 14500 },
  { id: 13, cat: "Kopi", name: "Toffee Nut Latte", img: "https://i.ibb.co.com/vC66ngqh/Frame-1410112859.png", origPrice: 21000, salePrice: 14000 },
  { id: 14, cat: "Kopi", name: "Tiramisu Latte", img: "https://i.ibb.co.com/6cXLXLqv/Frame-1410112860.png", origPrice: 20000, salePrice: 14000 },
  { id: 15, cat: "Kopi", name: "Tiramisu Mocha Latte", img: "https://i.ibb.co.com/KkFbMRd/Frame-1410112863.png", origPrice: 25000, salePrice: 16500 },
  { id: 17, cat: "Kopi", name: "Creamy Aren Latte", img: "https://i.ibb.co.com/JRPdckcj/Frame-1410112856.png", origPrice: 22000, salePrice: 15000 },
  { id: 19, cat: "Kopi", name: "Pistachio Aren Latte", img: "https://i.ibb.co.com/8Hyvm5b/Frame-1410112862.png", origPrice: 19000, salePrice: 14000 },
  { id: 20, cat: "Kopi", name: "Matcha Espresso", img: "https://i.ibb.co.com/yFq7sPD7/Frame-1410112839.png", origPrice: 26000, salePrice: 17000 },
  { id: 21, cat: "Kopi", name: "Avocado Coffee", img: "https://i.ibb.co.com/5PXyL5H/Frame-1410112843.png", origPrice: 28000, salePrice: 18000 },
  { id: 46, cat: "Kopi", name: "Salted Caramel Macchiato", img: "https://i.ibb.co.com/3YhzGVh0/Frame-1410112845.png", origPrice: 28000, salePrice: 18000 },

  // ── NON-KOPI REGULER ──
  { id: 22, cat: "Non-Kopi", name: "Matcha Latte", img: "https://i.ibb.co.com/BvcbFLH/Frame-1410112878.png", origPrice: 25000, salePrice: 17500, noBeans: true },
  { id: 23, cat: "Oatside", name: "Oatside Matcha Latte", img: "https://i.ibb.co.com/FLz7TCqr/Frame-1410112866.png", origPrice: 25000, salePrice: 17500, noBeans: true },
  { id: 24, cat: "Non-Kopi", name: "Dutch Chocolate", img: "https://i.ibb.co.com/WNXkfp4Q/Frame-1410112840.png", origPrice: 26000, salePrice: 18000, noBeans: true },
  { id: 25, cat: "Non-Kopi", name: "Hazelnut Dutch Choco", img: "https://i.ibb.co.com/zT1QrgSS/Frame-1410112868.png", origPrice: 28000, salePrice: 18000, noBeans: true },
  { id: 26, cat: "Non-Kopi", name: "Mocha Caramel", img: "https://i.ibb.co.com/YFz0B2vk/Frame-1410112869.png", origPrice: 28000, salePrice: 18000, noBeans: true },
  { id: 27, cat: "Non-Kopi", name: "Avocado Milk", img: "https://i.ibb.co.com/4ZvNd6WQ/Frame-1410112867.png", origPrice: 24000, salePrice: 16000, noBeans: true, noHot: true },
  { id: 28, cat: "Non-Kopi", name: "Avocado Caramel", img: "https://i.ibb.co.com/8CwcZdH/Frame-1410112871.png", origPrice: 28000, salePrice: 18000, noBeans: true, noHot: true },
  { id: 30, cat: "Non-Kopi", name: "Hazelnut Choco Milk Tea", img: "https://i.ibb.co.com/qY3c3bPT/Frame-1410112872.png", origPrice: 22000, salePrice: 15000, noBeans: true },
  { id: 33, cat: "Non-Kopi", name: "Thai Tea", img: "https://i.ibb.co.com/Zp4Nwdk2/Frame-1410112877.png", origPrice: 22000, salePrice: 15000, noBeans: true },
  { id: 34, cat: "Non-Kopi", name: "Milk Oreo Crumble", img: "https://i.ibb.co.com/gMBR7mX6/Frame-1410112875.png", origPrice: 26000, salePrice: 18000, noBeans: true, noHot: true },
  { id: 35, cat: "Non-Kopi", name: "Toffee Nut Choco Macchiato", img: "https://i.ibb.co.com/TM0ykDKY/Frame-1410112884.png", origPrice: 22000, salePrice: 15000, noBeans: true },
  { id: 36, cat: "Non-Kopi", name: "Susu Grass Jelly", img: "https://i.ibb.co.com/nMKJY7gj/Frame-1410112876.png", origPrice: 24000, salePrice: 16000, noBeans: true, noHot: true },
  { id: 48, cat: "Non-Kopi", name: "Caramel Dutch Choco", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 28000, salePrice: 19000, noBeans: true, noHot: true },
  { id: 50, cat: "Non-Kopi", name: "Kenangan Milk Tea", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 21000, salePrice: 14500, noBeans: true },
  { id: 51, cat: "Non-Kopi", name: "Milo Dinosaurus", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 23000, salePrice: 16500, noBeans: true, noHot: true },
  { id: 52, cat: "Non-Kopi", name: "Oreo Shake", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 26000, salePrice: 18000, noBeans: true, noHot: true },
  { id: 54, cat: "Non-Kopi", name: "Butterscotch Sea Salt Crumble", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 22000, salePrice: 16000, noBeans: true, noLarge: true },
  { id: 56, cat: "Non-Kopi", name: "Air Mineral (Pristine)", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 7000, salePrice: 5000, noBeans: true, noHot: true },

  // ── FRAPPE REGULER ──
  { id: 65, cat: "Frappe", name: "Pistachio Frappe", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 32000, salePrice: 20000, noBeans: true, noHot: true },
  { id: 66, cat: "Frappe", name: "Butterscotch Kenangan Frappe", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 30000, salePrice: 20000, noBeans: true, noHot: true },
  { id: 38, cat: "Frappe", name: "Tiramisu Frappe", img: "https://i.ibb.co.com/vxfBjc1m/Frame-1410112873.png", origPrice: 28000, salePrice: 18000, noBeans: true, noHot: true },
  { id: 39, cat: "Frappe", name: "Matcha Kenangan Frappe", img: "https://i.ibb.co.com/0RPp1jCJ/Frame-1410112888.png", origPrice: 32000, salePrice: 21000, noBeans: true, noHot: true },
  { id: 40, cat: "Frappe", name: "Dutch Choco Kenangan Frappe", img: "https://i.ibb.co.com/PsZWwjjR/Frame-1410112882.png", origPrice: 29000, salePrice: 18500, noBeans: true, noHot: true },
  { id: 41, cat: "Frappe", name: "Kopi Kenangan Mantan Frappe", img: "https://i.ibb.co.com/9HNKVYM4/Frame-1410112881.png", origPrice: 27000, salePrice: 18500, noHot: true },
  { id: 42, cat: "Frappe", name: "Vanilla Kenangan Frappe", img: "https://i.ibb.co.com/nqWWZDnP/Frame-1410112887.png", origPrice: 25000, salePrice: 17500, noBeans: true, noHot: true },

  // ── FOOD REGULER ──
  { id: 140, cat: "Food", name: "Thai Chicken Spaghetti", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 22000, salePrice: 15000, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 100, cat: "Food", name: "Croissant Abon", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 17000, salePrice: 12500, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 101, cat: "Food", name: "Pasta Mentai", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 24000, salePrice: 16000, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 102, cat: "Food", name: "Salt Bread Beef & Cheese", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 14000, salePrice: 11000, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 116, cat: "Food", name: "Sugar Donut", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 10000, salePrice: 9000, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 117, cat: "Food", name: "Roti Coklat Klasik", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 9000, salePrice: 7000, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 112, cat: "Food", name: "Butter Croissant", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 15000, salePrice: 11500, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 122, cat: "Food", name: "Toast Cokelat Keju", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 18000, salePrice: 14500, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 123, cat: "Food", name: "Adam Ayam Toast", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 19000, salePrice: 14500, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 126, cat: "Food", name: "Wahyu Sapi Toast", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 19000, salePrice: 14500, noBeans: true, noHot: true, noLarge: true, isFood: true },
  { id: 135, cat: "Food", name: "Choco Mocha Swirl Toast", img: "https://i.ibb.co.com/LdNYD0sW/Frame-1410112879.png", origPrice: 17000, salePrice: 14500, noBeans: true, noHot: true, noLarge: true, isFood: true }
];

const formattedProducts = MENU.map(item => {
  const isFood = !!item.isFood;
  const config = isFood
    ? {}
    : {
        has_suhu: !item.noHot,
        has_ukuran: !item.noLarge,
        has_es: true,
        has_gula: true,
        has_beans: !item.noBeans,
        has_syrup: true,
        has_topping: true,
      };

  return {
    id: `kk_prod_${item.id}`,
    brand_id: 'brand_kopi_kenangan',
    name: item.name,
    image: item.img,
    description: isFood ? `${item.name} lezat khas Kopi Kenangan.` : `${item.name} segar dan nikmat khas Kopi Kenangan.`,
    price: item.salePrice,
    category: item.cat,
    availability: 'ON',
    customization_json: JSON.stringify(config),
    is_single_item: item.isSingle ? 1 : 0
  };
});

const code = `export const KOPI_KENANGAN_PRODUCTS = ${JSON.stringify(formattedProducts, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, 'kopi_kenangan_products_data.ts'), code);
console.log('Successfully generated kopi_kenangan_products_data.ts with', formattedProducts.length, 'products!');
