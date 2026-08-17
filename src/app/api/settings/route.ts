import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { WebsiteSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;

    // Overlay Supabase website_status if Supabase is active
    if (isSupabaseConfigured) {
      try {
        const { data: supaData } = await supabase
          .from('site_settings')
          .select('*')
          .eq('setting_key', 'website_status')
          .single();

        if (supaData && supaData.setting_value) {
          const rawVal = String(supaData.setting_value).toUpperCase();
          const supaStatus: 'ON' | 'OFF' = rawVal === 'OFF' || rawVal === 'OFFLINE' ? 'OFF' : 'ON';
          if (settings) {
            settings = { ...settings, website_status: supaStatus };
          }
        }
      } catch (err) {
        console.warn('Supabase fetch inside /api/settings GET failed:', err);
      }
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
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
    } = body;

    db.prepare(`
      UPDATE website_settings
      SET 
        site_name = COALESCE(?, site_name),
        logo_url = COALESCE(?, logo_url),
        theme_color = COALESCE(?, theme_color),
        wa_group_url = COALESCE(?, wa_group_url),
        wa_admin_number = COALESCE(?, wa_admin_number),
        testimonial_url = COALESCE(?, testimonial_url),
        website_status = COALESCE(?, website_status),
        order_status = COALESCE(?, order_status),
        closed_title = COALESCE(?, closed_title),
        closed_desc = COALESCE(?, closed_desc),
        closed_button_text = COALESCE(?, closed_button_text)
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

    // Sync website_status to Supabase site_settings table
    if (website_status && isSupabaseConfigured) {
      try {
        await supabase
          .from('site_settings')
          .upsert(
            { id: '1', setting_key: 'website_status', setting_value: String(website_status).toUpperCase(), updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
          );
      } catch (supaErr) {
        console.error('Failed syncing website_status to Supabase in POST /api/settings:', supaErr);
      }
    }

    const updated = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;
    
    // Ensure response reflects latest website_status
    if (website_status) {
      updated.website_status = String(website_status).toUpperCase() as 'ON' | 'OFF';
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
