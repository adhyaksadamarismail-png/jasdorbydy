'use client';

import { useState, useEffect, useCallback } from 'react';
import { Outlet } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useRealtimeOutlets(brandSlug?: string, brandId?: string) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutlets = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        let query = supabase.from('outlets').select('*');

        if (brandId) {
          query = query.eq('brand_id', brandId);
        } else if (brandSlug) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('id')
            .eq('slug', brandSlug)
            .single();

          if (brandData) {
            query = query.eq('brand_id', brandData.id);
          }
        }

        const { data, error: supaErr } = await query;
        if (!supaErr && data && data.length > 0) {
          setOutlets(data as Outlet[]);
          setLoading(false);
          return;
        }
      }

      // Fallback to API endpoint
      const params = new URLSearchParams();
      if (brandSlug) params.set('brandSlug', brandSlug);
      if (brandId) params.set('brandId', brandId);

      const res = await fetch(`/api/outlets?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOutlets(json.outlets);
      }
    } catch (err: any) {
      console.error('Failed to fetch outlets:', err);
      setError('Gagal memuat data outlet.');
    } finally {
      setLoading(false);
    }
  }, [brandSlug, brandId]);

  useEffect(() => {
    fetchOutlets();

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_outlets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'outlets' },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const newOutlet = payload.new as Outlet;
              setOutlets((prev) => {
                if (prev.some((o) => o.id === newOutlet.id)) return prev;
                return [...prev, newOutlet];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedOutlet = payload.new as Outlet;
              setOutlets((prev) =>
                prev.map((o) => (o.id === updatedOutlet.id ? updatedOutlet : o))
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setOutlets((prev) => prev.filter((o) => o.id !== deletedId));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchOutlets]);

  return { outlets, setOutlets, loading, error, refetchOutlets: fetchOutlets };
}
