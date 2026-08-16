const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sampleHtml = `
<label class="outlet-item block cursor-pointer" data-outlet-name="Apotik Roxy Depok" data-outlet-address="Apotek Roxy Nusantara Depok (Container), Jalan Nusantara Raya, Beji, Kecamatan Beji, Kota Depok, Jawa Barat 16421">
<input type="radio" name="outlet_radio" value="683">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Adityawarman Surabaya" data-outlet-address="Adityawarman Surabaya, Unit No.1 Jl. Adityawarman No.22-24 Darmo, Kec. Wonokromo, Surabaya, Jawa Timur 60242">
<input type="radio" name="outlet_radio" value="1098">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Aeon Mall BSD" data-outlet-address="AEON Mall, Lantai 1, Jl. BSD Raya Utama, Pagedangan, Tangerang, Banten, 15345">
<input type="radio" name="outlet_radio" value="361">
<span>10:00 - 21:30 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="AEON Mall Deltamas" data-outlet-address="AEON Mall Deltamas Unit FF1 - 091, Jl. Ganesha Boulevard, Kota Deltamas, Kec. Cikarang Pusat, Kab. Bekasi, Jawa Barat 17530">
<input type="radio" name="outlet_radio" value="817">
<span>10:00 - 21:10 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="AEON Mall Jakarta Garden City" data-outlet-address="AEON MALL Jakarta Garden City, Lantai 1, Jl. Jakarta Garden City, Cakung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta, 13910">
<input type="radio" name="outlet_radio" value="575">
<span>10:00 - 21:30 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="AEON Mall Sentul Bogor" data-outlet-address="Aeon Mall Sentul City, Unit GF IC-G10, Jl. MH. Thamrin, Citaringgul, Kec. Babakan Madang, Bogor, Jawa Barat 16810">
<input type="radio" name="outlet_radio" value="804">
<span>10:00 - 21:15 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Agung Podomoro Golf View Cimanggis" data-outlet-address="Agung Podomoro Golf View Cimanggis, Podomoro Golf View, Jl. Raya Bojong Nangka, Bojong Nangka, Kec. Tapos, Kota Depok, Jawa Barat 16963">
<input type="radio" name="outlet_radio" value="761">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Agus Salim Bekasi" data-outlet-address="Agus Salim Bekasi, Jl. KH. Agus Salim No. 3a, RT 007 / RW 007, Bekasi Jaya, Kec. Bekasi Timur, Kota Bekasi, Jawa Barat 17112">
<input type="radio" name="outlet_radio" value="686">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="AH Nasution Metro Lampung" data-outlet-address="AH Nasution Metro Lampung, Jl. AH Nasution No.173, Yosodadi, Kec. Metro Tim., Kota Metro, Lampung 34111">
<input type="radio" name="outlet_radio" value="157">
<span>07:00 - 01:30 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Ahmad Dahlan Yogyakarta" data-outlet-address="Ahmad Dahlan Yogyakarta, Jl. KH. Ahmad Dahlan No.87, Notoprajan, Ngampilan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55262">
<input type="radio" name="outlet_radio" value="1004">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Ahmad Yani Banjarmasin" data-outlet-address="Ahmad Yani Banjarmasin, Jl. Ahmad Yani Km.7,4 Pemurus Luar, Kec. Banjarmasin Timur, Kota Banjarmasin, Kalimantan Selatan 70654">
<input type="radio" name="outlet_radio" value="1111">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Ahmad Yani Semarang" data-outlet-address="Ahmad Yani Semarang, Jl. Ahmad Yani No.168, Karangkidul, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50241">
<input type="radio" name="outlet_radio" value="971">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Ahmad Yani Surabaya (Drive Thru)" data-outlet-address="Jl. Ahmad Yani, Kec. Wonocolo, Surabaya, Jawa Timur 60238">
<input type="radio" name="outlet_radio" value="1107">
<span>00:01 - 23:19 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Airmadidi Minahasa Utara" data-outlet-address="Airmadidi Minahasa Utara, Sarongsong Satu, Airmadidi, North Minahasa Regency, North Sulawesi">
<input type="radio" name="outlet_radio" value="1298">
<span>08:00 - 23:00 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Alam Sutera (DT)" data-outlet-address="Alam Sutera (DT), Jl. Jalur Sutera No.Kav.22C-2 RT.002/RW.006, East Panunggangan, Pinang, Tangerang City, Banten 15143">
<input type="radio" name="outlet_radio" value="282">
<span>00:05 - 23:15 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Summarecon Mall Bekasi" data-outlet-address="Summarecon Mall Bekasi Lt. Dasar, Jl. Boulevard Ahmad Yani, Marga Mulya, Bekasi Utara, Kota Bekasi, Jawa Barat 17142">
<input type="radio" name="outlet_radio" value="442">
<span>10:00 - 22:00 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Grand Indonesia" data-outlet-address="Grand Indonesia East Mall Lt. 3, Jl. MH Thamrin No. 1, Menteng, Jakarta Pusat">
<input type="radio" name="outlet_radio" value="201">
<span>10:00 - 22:00 WIB</span>
</label>
<label class="outlet-item block cursor-pointer" data-outlet-name="Central Park Mall" data-outlet-address="Central Park Mall Lt. LG, Jl. Letjen S. Parman No. 28, Tanjung Duren, Jakarta Barat">
<input type="radio" name="outlet_radio" value="205">
<span>10:00 - 22:00 WIB</span>
</label>
`;

const itemRegex = /data-outlet-name="([^"]+)"[\s\S]*?data-outlet-address="([^"]+)"[\s\S]*?value="([^"]+)"[\s\S]*?<span>([0-9]{2}:[0-9]{2}\s*-\s*[0-9]{2}:[0-9]{2}\s*WIB)<\/span>/g;

const outlets = [];
let match;
while ((match = itemRegex.exec(sampleHtml)) !== null) {
  const name = match[1].trim();
  const address = match[2].trim();
  const id = 'out_' + match[3].trim();
  const hours = match[4].trim();

  let city = 'Indonesia';
  const citiesList = [
    'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Jakarta Central', 'Jakarta',
    'Surabaya', 'Bandung', 'Bekasi', 'Depok', 'Tangerang', 'Tangerang City', 'Tangerang Selatan', 'Bogor',
    'Semarang', 'Yogyakarta', 'Lampung', 'Banjarmasin', 'Minahasa Utara', 'Malang', 'Solo', 'Medan', 'Palembang', 'Makassar', 'Bali'
  ];

  for (const c of citiesList) {
    if (address.toLowerCase().includes(c.toLowerCase()) || name.toLowerCase().includes(c.toLowerCase())) {
      city = c;
      break;
    }
  }

  outlets.push({
    id,
    brand_id: 'brand_kopi_kenangan',
    outlet_name: name,
    address,
    city,
    opening_hours: hours,
    status: 'ON'
  });
}

console.log(`Parsed ${outlets.length} outlets!`);

// Connect to SQLite DB
const dbPath = path.join(process.cwd(), 'data', 'jasdor.db');
const db = new Database(dbPath);

try {
  db.exec('ALTER TABLE outlets ADD COLUMN opening_hours TEXT DEFAULT "10:00 - 22:00 WIB"');
} catch (e) {}

const stmt = db.prepare(`
  INSERT OR REPLACE INTO outlets (id, brand_id, outlet_name, address, city, opening_hours, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const o of outlets) {
  stmt.run(o.id, o.brand_id, o.outlet_name, o.address, o.city, o.opening_hours, o.status);
}

console.log('Successfully updated outlets table in SQLite DB!');
