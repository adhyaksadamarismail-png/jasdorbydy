import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Brand } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isSupabaseConfigured) {
      try {
        const { data, error: supaErr } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true });

        if (!supaErr && data && data.length > 0) {
          return NextResponse.json({ success: true, brands: data });
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/brands GET failed:', err);
      }
    }

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
    const targetId = id || `brand_${Date.now()}`;
    const logoUrl = logo_url || '/coffee-latte.svg';
    const brandStatus = status || 'ON';

    // 1. Sync to SQLite
    if (id) {
      db.prepare(`
        UPDATE brands
        SET name = ?, slug = ?, logo_url = ?, status = ?
        WHERE id = ?
      `).run(name, slug, logoUrl, brandStatus, id);
    } else {
      db.prepare(`
        INSERT INTO brands (id, name, slug, logo_url, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(targetId, name, slug, logoUrl, brandStatus);
    }

    // 2. Sync to Supabase Single Source of Truth
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('brands')
          .upsert(
            { id: targetId, name, slug, logo_url: logoUrl, status: brandStatus, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
          );
      } catch (supaErr) {
        console.error('Failed syncing brand to Supabase:', supaErr);
      }
    }

    let brands: Brand[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('brands').select('*').order('name', { ascending: true });
      if (data && data.length > 0) brands = data as Brand[];
    }

    if (brands.length === 0) {
      brands = db.prepare('SELECT * FROM brands').all() as Brand[];
    }

    return NextResponse.json({ success: true, brands });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
