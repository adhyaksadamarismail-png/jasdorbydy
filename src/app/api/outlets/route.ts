import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Outlet } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get('brandSlug');
    const brandId = searchParams.get('brandId');

    let outlets: Outlet[] = [];
    if (brandSlug) {
      const brand = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brandSlug) as { id: string } | undefined;
      if (brand) {
        outlets = db.prepare('SELECT * FROM outlets WHERE brand_id = ?').all(brand.id) as Outlet[];
      }
    } else if (brandId) {
      outlets = db.prepare('SELECT * FROM outlets WHERE brand_id = ?').all(brandId) as Outlet[];
    } else {
      outlets = db.prepare('SELECT * FROM outlets').all() as Outlet[];
    }

    return NextResponse.json({ success: true, outlets });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, brand_id, outlet_name, address, city, latitude, longitude, status } = body;

    if (id) {
      db.prepare(`
        UPDATE outlets
        SET brand_id = ?, outlet_name = ?, address = ?, city = ?, latitude = ?, longitude = ?, status = ?
        WHERE id = ?
      `).run(brand_id, outlet_name, address, city, latitude || 0, longitude || 0, status, id);
    } else {
      const newId = `out_${Date.now()}`;
      db.prepare(`
        INSERT INTO outlets (id, brand_id, outlet_name, address, city, latitude, longitude, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, brand_id, outlet_name, address, city, latitude || 0, longitude || 0, status || 'ON');
    }

    const outlets = db.prepare('SELECT * FROM outlets').all() as Outlet[];
    return NextResponse.json({ success: true, outlets });
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

    db.prepare('DELETE FROM outlets WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
