import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { WebsiteSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;

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

    // 1. Sync SQLite
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

    const updated = db.prepare('SELECT * FROM website_settings WHERE id = 1').get() as WebsiteSettings;

    // 2. Sync Supabase Single Source of Truth
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

        if (website_status) {
          await supabase
            .from('site_settings')
            .upsert(
              { id: '1', setting_key: 'website_status', setting_value: String(website_status).toUpperCase(), updated_at: new Date().toISOString() },
              { onConflict: 'setting_key' }
            );
        }
      } catch (supaErr) {
        console.error('Failed syncing website_settings to Supabase:', supaErr);
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
