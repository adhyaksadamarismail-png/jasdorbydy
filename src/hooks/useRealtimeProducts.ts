'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { seedSupabaseIfEmpty } from '@/lib/seedSupabase';

export function useRealtimeProducts(brandSlug?: string, brandId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        let query = supabase.from('products').select('*');

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

        let { data, error: supaErr } = await query;

        // Auto-seed if Supabase products table is empty
        if (!supaErr && (!data || data.length === 0)) {
          await seedSupabaseIfEmpty();
          const retryRes = await query;
          data = retryRes.data;
          supaErr = retryRes.error;
        }

        if (!supaErr && data && data.length > 0) {
          setProducts(data as Product[]);
          setLoading(false);
          return;
        }
      }

      // Fallback to API endpoint
      const params = new URLSearchParams();
      if (brandSlug) params.set('brandSlug', brandSlug);
      if (brandId) params.set('brandId', brandId);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.products);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  }, [brandSlug, brandId]);

  useEffect(() => {
    fetchProducts();

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const newProduct = payload.new as Product;
              setProducts((prev) => {
                if (prev.some((p) => p.id === newProduct.id)) return prev;
                return [...prev, newProduct];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedProduct = payload.new as Product;
              setProducts((prev) =>
                prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  return { products, setProducts, loading, error, refetchProducts: fetchProducts };
}
