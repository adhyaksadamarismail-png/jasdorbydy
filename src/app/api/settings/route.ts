import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { WebsiteSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

    if (isSupabaseConfigured) {
      try {
        const { data: supaSet } = await supabase
          .from('website_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (supaSet) {
          settings = { ...settings, ...supaSet };
        } else {
          // Check site_settings compatibility table for website_status
          const { data: statusData } = await supabase
            .from('site_settings')
            .select('*')
            .eq('setting_key', 'website_status')
            .single();

          if (statusData && statusData.setting_value) {
            const rawVal = String(statusData.setting_value).toUpperCase();
            settings.website_status = rawVal === 'OFF' || rawVal === 'OFFLINE' ? 'OFF' : 'ON';
          }
        }
      } catch (err) {
        console.warn('Supabase fetch in /api/settings GET failed:', err);
      }
    }

    // Normalize statuses to uppercase ON or OFF
    settings.website_status = String(settings.website_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
    settings.order_status = String(settings.order_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON';

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Fetch existing settings first
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

    const site_name = body.site_name !== undefined ? body.site_name : current.site_name;
    const logo_url = body.logo_url !== undefined ? body.logo_url : current.logo_url;
    const theme_color = body.theme_color !== undefined ? body.theme_color : current.theme_color;
    const wa_group_url = body.wa_group_url !== undefined ? body.wa_group_url : current.wa_group_url;
    const wa_admin_number = body.wa_admin_number !== undefined ? body.wa_admin_number : current.wa_admin_number;
    const testimonial_url = body.testimonial_url !== undefined ? body.testimonial_url : current.testimonial_url;
    const closed_title = body.closed_title !== undefined ? body.closed_title : current.closed_title;
    const closed_desc = body.closed_desc !== undefined ? body.closed_desc : current.closed_desc;
    const closed_button_text = body.closed_button_text !== undefined ? body.closed_button_text : current.closed_button_text;

    // Explicit Status Normalization
    const website_status = body.website_status !== undefined
      ? (String(body.website_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON')
      : current.website_status;

    const order_status = body.order_status !== undefined
      ? (String(body.order_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON')
      : current.order_status;

    // 1. Update SQLite DB
    db.prepare(`
      UPDATE website_settings
      SET 
        site_name = ?,
        logo_url = ?,
        theme_color = ?,
        wa_group_url = ?,
        wa_admin_number = ?,
        testimonial_url = ?,
        website_status = ?,
        order_status = ?,
        closed_title = ?,
        closed_desc = ?,
        closed_button_text = ?
      WHERE id = 1
    `).run(
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
      closed_button_text
    );

    const updated = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;

    // 2. Sync Supabase Single Source of Truth if configured
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('website_settings')
          .upsert(
            {
              ...updated,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        await supabase
          .from('site_settings')
          .upsert(
            { id: '1', setting_key: 'website_status', setting_value: website_status, updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
          );

        await supabase
          .from('site_settings')
          .upsert(
            { id: '2', setting_key: 'order_status', setting_value: order_status, updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
          );
      } catch (supaErr) {
        console.error('Failed syncing website_settings to Supabase:', supaErr);
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error in /api/settings POST:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
