import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Product } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get('brandSlug');
    const brandId = searchParams.get('brandId');

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('products').select('*');

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
          return NextResponse.json({ success: true, products: data });
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/products GET failed:', err);
      }
    }

    // Fallback to SQLite
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
    const { id, brand_id, name, image, description, price, category, availability, is_single_item, customization_json } = body;
    const isSingleVal = is_single_item ? 1 : 0;
    const targetId = id || `prod_${Date.now()}`;
    const prodImage = image || '/coffee-latte.svg';
    const prodCategory = category || 'Kopi';
    const prodAvail = availability || 'ON';
    const custJson = typeof customization_json === 'string' ? customization_json : JSON.stringify(customization_json || {});

    // Look for existing record by explicit ID or by matching brand_id and name
    let existingProd: { id: string } | undefined;
    if (id) {
      existingProd = db.prepare('SELECT id FROM products WHERE id = ?').get(id) as { id: string } | undefined;
    }
    if (!existingProd && brand_id && name) {
      existingProd = db.prepare('SELECT id FROM products WHERE brand_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) ORDER BY id DESC').get(brand_id, name) as { id: string } | undefined;
    }

    const targetId = existingProd ? existingProd.id : (id || `prod_${Date.now()}`);

    // 1. Sync to SQLite (Update in place if exists, or Insert single record)
    if (existingProd) {
      db.prepare(`
        UPDATE products
        SET brand_id = ?, name = ?, image = ?, description = ?, price = ?, category = ?, availability = ?, is_single_item = ?, customization_json = ?
        WHERE id = ?
      `).run(brand_id, name, prodImage, description || '', price, prodCategory, prodAvail, isSingleVal, custJson, targetId);
    } else {
      db.prepare(`
        INSERT INTO products (id, brand_id, name, image, description, price, category, availability, is_single_item, customization_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(targetId, brand_id, name, prodImage, description || '', price, prodCategory, prodAvail, isSingleVal, custJson);
    }

    // Purge any leftover duplicate rows in SQLite for this brand + name
    if (brand_id && name) {
      db.prepare('DELETE FROM products WHERE brand_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?').run(brand_id, name, targetId);
    }

    // 2. Sync to Supabase Single Source of Truth
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('products')
          .upsert(
            {
              id: targetId,
              brand_id,
              name,
              image: prodImage,
              description: description || '',
              price: Number(price),
              category: prodCategory,
              availability: prodAvail,
              is_single_item: isSingleVal,
              customization_json: custJson,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        // Purge duplicates in Supabase as well
        if (brand_id && name) {
          const { data: dupSupas } = await supabase
            .from('products')
            .select('id, name')
            .eq('brand_id', brand_id);
          
          if (dupSupas) {
            const dupIds = dupSupas
              .filter((p: any) => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.id !== targetId)
              .map((p: any) => p.id);
            
            if (dupIds.length > 0) {
              await supabase.from('products').delete().in('id', dupIds);
            }
          }
        }
      } catch (supaErr) {
        console.error('Failed syncing product to Supabase:', supaErr);
      }
    }

    let products: Product[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('products').select('*');
      if (data) products = data as Product[];
    }

    if (products.length === 0) {
      products = db.prepare('SELECT * FROM products').all() as Product[];
    }

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

    // 1. Delete SQLite
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    // 2. Delete Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (supaErr) {
        console.error('Failed deleting product in Supabase:', supaErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
