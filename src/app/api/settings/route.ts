import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { WebsiteSettings } from '@/types';
import { supabase, isSupabaseConfigured, safeSupabaseQuery } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;

    if (!settings) {
      settings = {
        id: 1,
        site_name: 'Jasdorbydy',
        logo_url: '/logo-store.png',
        theme_color: '#b84d6b',
        wa_group_url: 'https://chat.whatsapp.com/GrupJasDorExample',
        wa_admin_number: '6281234567890',
        testimonial_url: '#testimonials',
        website_status: 'ON',
        order_status: 'ON',
        closed_title: 'LAGI ISTIRAHAT DULU',
        closed_desc: 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.',
        closed_button_text: 'Chat Admin',
      };
    }

    // Try reading site_settings key-value pairs from SQLite
    try {
      const rows = db.prepare('SELECT * FROM site_settings').all() as any[];
      if (rows && rows.length > 0) {
        const webRow = rows.find((r) => r.setting_key === 'website_status');
        const ordRow = rows.find((r) => r.setting_key === 'order_status');
        if (webRow) settings.website_status = webRow.setting_value;
        if (ordRow) settings.order_status = ordRow.setting_value;
      }
    } catch (e) {}

    // Safely try reading site_settings key-value pairs from Supabase if configured & reachable
    if (isSupabaseConfigured) {
      try {
        const supaRes: any = await safeSupabaseQuery(
          supabase.from('site_settings').select('*')
        );

        if (supaRes && supaRes.data && supaRes.data.length > 0) {
          const supaRows = supaRes.data;
          const webRow = supaRows.find((r: any) => r.setting_key === 'website_status');
          const ordRow = supaRows.find((r: any) => r.setting_key === 'order_status');

          if (webRow && webRow.setting_value) {
            settings.website_status = String(webRow.setting_value).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
          }
          if (ordRow && ordRow.setting_value) {
            settings.order_status = String(ordRow.setting_value).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
          }
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/settings GET failed:', err);
      }
    }

    // Normalize status values
    settings.website_status = String(settings.website_status || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';
    settings.order_status = String(settings.order_status || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let current = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;
    if (!current) {
      current = {
        id: 1,
        site_name: 'Jasdorbydy',
        logo_url: '/logo-store.png',
        theme_color: '#b84d6b',
        wa_group_url: 'https://chat.whatsapp.com/GrupJasDorExample',
        wa_admin_number: '6281234567890',
        testimonial_url: '#testimonials',
        website_status: 'ON',
        order_status: 'ON',
        closed_title: 'LAGI ISTIRAHAT DULU',
        closed_desc: 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.',
        closed_button_text: 'Chat Admin',
      };
    }

    const website_status = body.website_status !== undefined
      ? (String(body.website_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON')
      : current.website_status;

    const order_status = body.order_status !== undefined
      ? (String(body.order_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON')
      : current.order_status;

    const site_name = body.site_name !== undefined ? body.site_name : current.site_name;
    const logo_url = body.logo_url !== undefined ? body.logo_url : current.logo_url;
    const theme_color = body.theme_color !== undefined ? body.theme_color : current.theme_color;
    const wa_group_url = body.wa_group_url !== undefined ? body.wa_group_url : current.wa_group_url;
    const wa_admin_number = body.wa_admin_number !== undefined ? body.wa_admin_number : current.wa_admin_number;
    const testimonial_url = body.testimonial_url !== undefined ? body.testimonial_url : current.testimonial_url;
    const closed_title = body.closed_title !== undefined ? body.closed_title : current.closed_title;
    const closed_desc = body.closed_desc !== undefined ? body.closed_desc : current.closed_desc;
    const closed_button_text = body.closed_button_text !== undefined ? body.closed_button_text : current.closed_button_text;

    // 1. Update SQLite site_settings table (key-value)
    try {
      db.prepare(`
        INSERT INTO site_settings (id, setting_key, setting_value, updated_at)
        VALUES ('1', 'website_status', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
      `).run(website_status);

      db.prepare(`
        INSERT INTO site_settings (id, setting_key, setting_value, updated_at)
        VALUES ('2', 'order_status', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
      `).run(order_status);
    } catch (e) {
      console.warn('SQLite site_settings update warning:', e);
    }

    // 2. Update SQLite website_settings table
    db.prepare(`
      UPDATE website_settings
      SET 
        site_name = ?, logo_url = ?, theme_color = ?, wa_group_url = ?,
        wa_admin_number = ?, testimonial_url = ?, website_status = ?,
        order_status = ?, closed_title = ?, closed_desc = ?, closed_button_text = ?
      WHERE id = 1
    `).run(
      site_name, logo_url, theme_color, wa_group_url,
      wa_admin_number, testimonial_url, website_status,
      order_status, closed_title, closed_desc, closed_button_text
    );

    const updatedSettings: WebsiteSettings = {
      ...current,
      site_name,
      logo_url,
      theme_color,
      wa_group_url,
      wa_admin_number,
      testimonial_url,
      website_status,
      order_status,
      closed_title,
      closed_desc,
      closed_button_text,
    };

    // 3. Safely sync to Supabase site_settings table by setting_key
    if (isSupabaseConfigured) {
      try {
        safeSupabaseQuery(
          supabase.from('site_settings').upsert(
            { id: '1', setting_key: 'website_status', setting_value: website_status, updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
          )
        );

        safeSupabaseQuery(
          supabase.from('site_settings').upsert(
            { id: '2', setting_key: 'order_status', setting_value: order_status, updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
          )
        );
      } catch (supaErr) {
        console.error('[ADMIN SUPABASE UPDATE ERROR]', supaErr);
      }
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error('Error in /api/settings POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
