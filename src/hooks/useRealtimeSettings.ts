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
      // 1. Fetch from local API
      const res = await fetch('/api/settings');
      const data = await res.json();
      let currentSettings: WebsiteSettings | null = data.success ? data.settings : null;

      // 2. Fetch from Supabase if configured
      if (isSupabaseConfigured) {
        try {
          const { data: supaSet } = await supabase
            .from('website_settings')
            .select('*')
            .eq('id', 1)
            .single();

          if (supaSet) {
            currentSettings = { ...currentSettings, ...supaSet };
          }
        } catch (supaFetchErr) {
          console.warn('Could not fetch website_settings directly from Supabase:', supaFetchErr);
        }
      }

      if (currentSettings) {
        currentSettings.website_status = String(currentSettings.website_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
        currentSettings.order_status = String(currentSettings.order_status).toUpperCase() === 'OFF' ? 'OFF' : 'ON';
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

    // 3. Supabase Realtime Subscriptions for website_settings and site_settings
    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_website_settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'website_settings' },
          (payload: any) => {
            if (payload.new) {
              const updatedWebStatus = String(payload.new.website_status || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';
              const updatedOrdStatus = String(payload.new.order_status || 'ON').toUpperCase() === 'OFF' ? 'OFF' : 'ON';
              
              setSettings((prev) => {
                if (!prev) return { ...payload.new, website_status: updatedWebStatus, order_status: updatedOrdStatus };
                return { ...prev, ...payload.new, website_status: updatedWebStatus, order_status: updatedOrdStatus };
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'site_settings' },
          (payload: any) => {
            if (payload.new && payload.new.setting_key === 'website_status') {
              const rawVal = String(payload.new.setting_value).toUpperCase();
              const newStatus: 'ON' | 'OFF' = rawVal === 'OFF' || rawVal === 'OFFLINE' ? 'OFF' : 'ON';
              setSettings((prev) => (prev ? { ...prev, website_status: newStatus } : prev));
            }
            if (payload.new && payload.new.setting_key === 'order_status') {
              const rawVal = String(payload.new.setting_value).toUpperCase();
              const newStatus: 'ON' | 'OFF' = rawVal === 'OFF' || rawVal === 'OFFLINE' ? 'OFF' : 'ON';
              setSettings((prev) => (prev ? { ...prev, order_status: newStatus } : prev));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchSettings]);

  return { settings, setSettings, loading, error, refetchSettings: fetchSettings };
}
