import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { KOPI_KENANGAN_PRODUCTS } from '@/lib/kopi_kenangan_products_data';

export async function seedSupabaseIfEmpty() {
  if (!isSupabaseConfigured) return;

  try {
    // 1. Seed brands if empty
    const { data: brands, error: bErr } = await supabase.from('brands').select('id');
    if (!bErr && (!brands || brands.length === 0)) {
      console.log('Seeding initial brands to Supabase...');
      await supabase.from('brands').upsert([
        { id: 'brand_kopi_kenangan', name: 'Kopi Kenangan', slug: 'kopi-kenangan', logo_url: '/kopi-kenangan-logo.svg', status: 'ON' },
        { id: 'brand_tomoro', name: 'Tomoro Coffee', slug: 'tomoro-coffee', logo_url: '/tomoro-logo.svg', status: 'OFF' },
        { id: 'brand_voucher', name: 'Voucher & Promo', slug: 'voucher-promo', logo_url: '/voucher-logo.svg', status: 'OFF' },
      ], { onConflict: 'id' });
    }

    // 2. Seed products if empty
    const { data: products, error: pErr } = await supabase.from('products').select('id').limit(1);
    if (!pErr && (!products || products.length === 0)) {
      console.log('Seeding products to Supabase...');
      for (let i = 0; i < KOPI_KENANGAN_PRODUCTS.length; i += 50) {
        const chunk = KOPI_KENANGAN_PRODUCTS.slice(i, i + 50);
        await supabase.from('products').upsert(chunk, { onConflict: 'id' });
      }
    }

    // 3. Seed website_settings if empty
    const { data: settings, error: sErr } = await supabase.from('website_settings').select('id').limit(1);
    if (!sErr && (!settings || settings.length === 0)) {
      await supabase.from('website_settings').upsert([{
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
      }], { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Error auto seeding Supabase:', err);
  }
}
