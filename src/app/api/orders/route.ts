import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Order } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isSupabaseConfigured) {
      try {
        const { data, error: supaErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!supaErr && data) {
          return NextResponse.json({ success: true, orders: data });
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/orders GET failed:', err);
      }
    }

    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Order[];
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand_id, customer_name, outlet_name, items, total_price } = body;

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const itemsJson = JSON.stringify(items || []);
    const brandId = brand_id || 'brand_kopi_kenangan';
    const createdAt = new Date().toISOString();

    // 1. Sync SQLite
    db.prepare(`
      INSERT INTO orders (id, brand_id, customer_name, outlet_name, items_json, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, brandId, customer_name, outlet_name, itemsJson, Number(total_price));

    // 2. Sync Supabase Single Source of Truth
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .insert({
            id: orderId,
            brand_id: brandId,
            customer_name,
            outlet_name,
            items_json: itemsJson,
            total_price: Number(total_price),
            created_at: createdAt,
          });
      } catch (supaErr) {
        console.error('Failed syncing order to Supabase:', supaErr);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
