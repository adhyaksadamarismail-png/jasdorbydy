import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Outlet } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get('brandSlug');
    const brandId = searchParams.get('brandId');

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('outlets').select('*');

        if (brandId) {
          query = query.eq('brand_id', brandId);
        } else if (brandSlug) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('id')
            .eq('slug', brandSlug)
            .single();

          if (brandData) {
            query = query.eq('brand_id', brandData.id);
          }
        }

        const { data, error: supaErr } = await query;
        if (!supaErr && data) {
          return NextResponse.json({ success: true, outlets: data });
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/outlets GET failed:', err);
      }
    }

    // Fallback to SQLite
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
    const targetId = id || `out_${Date.now()}`;
    const outletStatus = status || 'ON';
    const lat = latitude || 0;
    const lng = longitude || 0;

    // 1. Sync SQLite
    if (id) {
      db.prepare(`
        UPDATE outlets
        SET brand_id = ?, outlet_name = ?, address = ?, city = ?, latitude = ?, longitude = ?, status = ?
        WHERE id = ?
      `).run(brand_id, outlet_name, address, city, lat, lng, outletStatus, id);
    } else {
      db.prepare(`
        INSERT INTO outlets (id, brand_id, outlet_name, address, city, latitude, longitude, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(targetId, brand_id, outlet_name, address, city, lat, lng, outletStatus);
    }

    // 2. Sync Supabase Single Source of Truth
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('outlets')
          .upsert(
            {
              id: targetId,
              brand_id,
              outlet_name,
              address,
              city,
              latitude: lat,
              longitude: lng,
              status: outletStatus,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
      } catch (supaErr) {
        console.error('Failed syncing outlet to Supabase:', supaErr);
      }
    }

    let outlets: Outlet[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('outlets').select('*');
      if (data) outlets = data as Outlet[];
    }

    if (outlets.length === 0) {
      outlets = db.prepare('SELECT * FROM outlets').all() as Outlet[];
    }

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

    // 1. Delete SQLite
    db.prepare('DELETE FROM outlets WHERE id = ?').run(id);

    // 2. Delete Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('outlets').delete().eq('id', id);
      } catch (supaErr) {
        console.error('Failed deleting outlet in Supabase:', supaErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
