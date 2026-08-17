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
      // 1. Load from local API endpoint
      const res = await fetch('/api/settings');
      const data = await res.json();
      let currentSettings: WebsiteSettings | null = data.success ? data.settings : null;

      // 2. If Supabase is configured, overlay latest website_status from Supabase single source of truth
      if (isSupabaseConfigured) {
        try {
          const { data: supaData, error: supaErr } = await supabase
            .from('site_settings')
            .select('*')
            .eq('setting_key', 'website_status')
            .single();

          if (!supaErr && supaData && supaData.setting_value) {
            const rawVal = String(supaData.setting_value).toUpperCase();
            const supaStatus: 'ON' | 'OFF' = rawVal === 'OFF' || rawVal === 'OFFLINE' ? 'OFF' : 'ON';

            if (currentSettings) {
              currentSettings = { ...currentSettings, website_status: supaStatus };
            } else {
              currentSettings = {
                id: 1,
                site_name: 'Jasdorbydy',
                logo_url: '/logo-store.png',
                theme_color: '#b84d6b',
                wa_group_url: 'https://chat.whatsapp.com/LOuCM1OUNNBEbuq894AJ0Q?s=cl&p=a&ilr=4',
                wa_admin_number: '6285124356993',
                testimonial_url: '#testimonials',
                website_status: supaStatus,
                order_status: 'ON',
                closed_title: 'LAGI ISTIRAHAT DULU',
                closed_desc: 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.',
                closed_button_text: 'Chat Admin',
              };
            }
          }
        } catch (supaFetchErr) {
          console.warn('Could not fetch initial site_settings from Supabase:', supaFetchErr);
        }
      }

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

    // 3. Supabase Realtime Subscription for immediate cross-device sync
    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_site_settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'site_settings' },
          (payload: any) => {
            if (payload.new && payload.new.setting_key === 'website_status') {
              const rawVal = String(payload.new.setting_value).toUpperCase();
              const newStatus: 'ON' | 'OFF' = rawVal === 'OFF' || rawVal === 'OFFLINE' ? 'OFF' : 'ON';
              
              setSettings((prev) => (prev ? { ...prev, website_status: newStatus } : prev));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to Supabase Realtime site_settings updates');
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
