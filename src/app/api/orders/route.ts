import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Order } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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

    db.prepare(`
      INSERT INTO orders (id, brand_id, customer_name, outlet_name, items_json, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, brand_id || 'brand_kopi_kenangan', customer_name, outlet_name, itemsJson, total_price);

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
