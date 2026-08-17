'use client';

import { useState, useEffect, useCallback } from 'react';
import { WebsiteSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useRealtimeSettings() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      // 1. Fetch baseline settings from API (local DB + fallback)
      const res = await fetch('/api/settings');
      const data = await res.json();
      let currentSettings: WebsiteSettings = data.success && data.settings ? data.settings : {
        id: 1,
        site_name: 'Jasdorbydy',
        logo_url: '/logo-store.png',
        theme_color: '#b84d6b',
        wa_group_url: 'https://chat.whatsapp.com/LOuCM1OUNNBEbuq894AJ0Q?s=cl&p=a&ilr=4',
        wa_admin_number: '6285124356993',
        testimonial_url: '#testimonials',
        website_status: 'ON',
        order_status: 'ON',
        closed_title: 'LAGI ISTIRAHAT DULU',
        closed_desc: 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.',
        closed_button_text: 'Chat Admin',
      };

      // 2. Fetch site_settings from Supabase (Single Source of Truth)
      if (isSupabaseConfigured) {
        try {
          const { data: supaRows, error: supaErr } = await supabase
            .from('site_settings')
            .select('*');

          if (!supaErr && supaRows && supaRows.length > 0) {
            const webRow = supaRows.find((r: any) => r.setting_key === 'website_status');
            const ordRow = supaRows.find((r: any) => r.setting_key === 'order_status');

            if (webRow && webRow.setting_value) {
              currentSettings.website_status = String(webRow.setting_value).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
            }
            if (ordRow && ordRow.setting_value) {
              currentSettings.order_status = String(ordRow.setting_value).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
            }
          }
        } catch (supaFetchErr) {
          console.warn('[CUSTOMER FETCH WARNING] Could not fetch site_settings from Supabase:', supaFetchErr);
        }
      }

      // Ensure normalized values
      currentSettings.website_status = String(currentSettings.website_status || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';
      currentSettings.order_status = String(currentSettings.order_status || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';

      console.log('[CUSTOMER SETTINGS INITIAL FETCH]', {
        website_status: currentSettings.website_status,
        order_status: currentSettings.order_status,
      });

      setSettings(currentSettings);
    } catch (err: any) {
      console.error('Failed to load website settings:', err);
      setError('Gagal memuat pengaturan website.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // 3. Supabase Realtime Subscription for site_settings key-value changes
    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_site_settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'site_settings' },
          (payload: any) => {
            console.log('[REALTIME EVENT RECEIVED]', {
              eventType: payload.eventType,
              setting_key: payload.new?.setting_key,
              setting_value: payload.new?.setting_value,
            });

            if (payload.new && payload.new.setting_key) {
              const key = payload.new.setting_key;
              const val = String(payload.new.setting_value || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';

              setSettings((prev) => {
                if (!prev) return prev;
                const updated = { ...prev };
                if (key === 'website_status') updated.website_status = val;
                if (key === 'order_status') updated.order_status = val;

                console.log('[CUSTOMER REALTIME UPDATED STATE]', {
                  website_status: updated.website_status,
                  order_status: updated.order_status,
                });

                return updated;
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to Supabase Realtime site_settings');
          }
        });
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchSettings]);

  return { settings, setSettings, loading, error, refetchSettings: fetchSettings };
}
