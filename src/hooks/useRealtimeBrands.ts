'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brand } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useRealtimeBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        const { data, error: supaErr } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true });

        if (!supaErr && data && data.length > 0) {
          setBrands(data as Brand[]);
          setLoading(false);
          return;
        }
      }

      // Fallback to API endpoint
      const res = await fetch('/api/brands');
      const json = await res.json();
      if (json.success) {
        setBrands(json.brands);
      }
    } catch (err: any) {
      console.error('Failed to fetch brands:', err);
      setError('Gagal memuat data brand.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_brands')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'brands' },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const newBrand = payload.new as Brand;
              setBrands((prev) => {
                if (prev.some((b) => b.id === newBrand.id)) return prev;
                return [...prev, newBrand];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedBrand = payload.new as Brand;
              setBrands((prev) =>
                prev.map((b) => (b.id === updatedBrand.id ? updatedBrand : b))
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setBrands((prev) => prev.filter((b) => b.id !== deletedId));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchBrands]);

  return { brands, setBrands, loading, error, refetchBrands: fetchBrands };
}
