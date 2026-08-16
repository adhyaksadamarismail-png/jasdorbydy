import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Brand } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brands = db.prepare('SELECT * FROM brands').all() as Brand[];
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, slug, logo_url, status } = body;

    if (id) {
      // Update existing brand
      db.prepare(`
        UPDATE brands
        SET name = ?, slug = ?, logo_url = ?, status = ?
        WHERE id = ?
      `).run(name, slug, logo_url, status, id);
    } else {
      // Create new brand
      const newId = `brand_${Date.now()}`;
      db.prepare(`
        INSERT INTO brands (id, name, slug, logo_url, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(newId, name, slug, logo_url || '/coffee-latte.svg', status || 'ON');
    }

    const brands = db.prepare('SELECT * FROM brands').all() as Brand[];
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
