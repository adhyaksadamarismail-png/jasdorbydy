import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get('brandSlug');
    const brandId = searchParams.get('brandId');

    let products: Product[] = [];
    if (brandSlug) {
      const brand = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brandSlug) as { id: string } | undefined;
      const targetBrandId = brand ? brand.id : 'brand_kopi_kenangan';
      products = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(targetBrandId) as Product[];
      if (products.length === 0) {
        products = db.prepare('SELECT * FROM products').all() as Product[];
      }
    } else if (brandId) {
      products = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(brandId) as Product[];
      if (products.length === 0) {
        products = db.prepare('SELECT * FROM products').all() as Product[];
      }
    } else {
      products = db.prepare('SELECT * FROM products').all() as Product[];
    }

    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, brand_id, name, image, description, price, category, availability } = body;

    if (id) {
      db.prepare(`
        UPDATE products
        SET brand_id = ?, name = ?, image = ?, description = ?, price = ?, category = ?, availability = ?
        WHERE id = ?
      `).run(brand_id, name, image, description || '', price, category || 'Coffees', availability || 'ON', id);
    } else {
      const newId = `prod_${Date.now()}`;
      db.prepare(`
        INSERT INTO products (id, brand_id, name, image, description, price, category, availability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, brand_id, name, image || '/coffee-latte.svg', description || '', price, category || 'Coffees', availability || 'ON');
    }

    const products = db.prepare('SELECT * FROM products').all() as Product[];
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
