import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Order } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Try Supabase first if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error: supaErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!supaErr && data && data.length > 0) {
          return NextResponse.json({ success: true, orders: data });
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/orders GET failed:', err);
      }
    }

    // 2. Fallback to SQLite DB
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Order[];
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal memuat pesanan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand_id, customer_name, outlet_name, items, items_json, total_price } = body;

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ success: false, error: 'Nama Pemesan wajib diisi' }, { status: 400 });
    }

    if (!outlet_name || !outlet_name.trim()) {
      return NextResponse.json({ success: false, error: 'Nama Outlet wajib diisi' }, { status: 400 });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let itemsJsonStr = '[]';
    if (typeof items_json === 'string') {
      itemsJsonStr = items_json;
    } else if (items) {
      itemsJsonStr = typeof items === 'string' ? items : JSON.stringify(items);
    }

    const brandId = brand_id || 'brand_kopi_kenangan';
    const createdAt = new Date().toISOString();
    const numericPrice = Number(total_price) || 0;
    const custName = customer_name.trim();
    const outName = outlet_name.trim();

    // 1. Save to SQLite Primary/Fallback Storage
    try {
      db.prepare(`
        INSERT INTO orders (id, brand_id, customer_name, outlet_name, items_json, total_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, brandId, custName, outName, itemsJsonStr, numericPrice, createdAt);
    } catch (dbErr: any) {
      db.prepare(`
        INSERT INTO orders (id, brand_id, customer_name, outlet_name, items_json, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, brandId, custName, outName, itemsJsonStr, numericPrice);
    }

    // 2. Sync to Supabase Single Source of Truth if configured
    if (isSupabaseConfigured) {
      try {
        const { error: supaErr } = await supabase
          .from('orders')
          .insert({
            id: orderId,
            brand_id: brandId,
            customer_name: custName,
            outlet_name: outName,
            items_json: itemsJsonStr,
            total_price: numericPrice,
            created_at: createdAt,
          });

        if (supaErr) {
          console.error('Supabase orders insert warning:', supaErr);
        }
      } catch (supaErr) {
        console.error('Failed syncing order to Supabase:', supaErr);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('Error in /api/orders POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal menyimpan pesanan ke database' }, { status: 500 });
  }
}
