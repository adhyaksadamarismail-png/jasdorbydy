'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // 1. Fetch from local API endpoint
      const res = await fetch('/api/orders');
      const json = await res.json();
      let fetchedOrders: Order[] = json.success ? json.orders : [];

      // 2. Overlay from Supabase if configured and available
      if (isSupabaseConfigured) {
        try {
          const { data, error: supaErr } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (!supaErr && data && data.length > 0) {
            fetchedOrders = data as Order[];
          }
        } catch (supaErr) {
          console.warn('Could not fetch orders directly from Supabase:', supaErr);
        }
      }

      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError('Gagal memuat data pesanan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as Order;
              setOrders((prev) => {
                if (prev.some((o) => o.id === newOrder.id)) return prev;
                return [newOrder, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedOrder = payload.new as Order;
              setOrders((prev) =>
                prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setOrders((prev) => prev.filter((o) => o.id !== deletedId));
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
  }, [fetchOrders]);

  return { orders, setOrders, loading, error, refetchOrders: fetchOrders };
}
