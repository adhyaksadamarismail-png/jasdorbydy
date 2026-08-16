'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Send, Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { CartItem, Brand, WebsiteSettings } from '@/types';
import ClosedPage from '@/components/ClosedPage';

export default function CheckoutPage() {
  const urlParams = useParams();
  const brandSlug = (urlParams?.brandSlug as string) || 'kopi-kenangan';
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [outletName, setOutletName] = useState('');
  const [pickupType, setPickupType] = useState<'Sekarang' | 'Dijadwalkan'>('Sekarang');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Error validation states
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadCheckoutData() {
      try {
        const [resBrands, resSettings] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/settings'),
        ]);

        const dataBrands = await resBrands.json();
        const dataSettings = await resSettings.json();

        if (dataSettings.success) setSettings(dataSettings.settings);
        if (dataBrands.success) {
          const matchedBrand = dataBrands.brands.find((b: Brand) => b.slug === brandSlug);
          if (matchedBrand) setBrand(matchedBrand);
        }

        // Restore Cart from sessionStorage
        const savedCart = sessionStorage.getItem(`jasdor_cart_${brandSlug}`);
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (e) {}
        }

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setScheduledDate(today);
        setScheduledTime('12:00');
      } catch (err) {
        console.error('Failed loading checkout:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCheckoutData();
  }, [brandSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#e84393] border-t-transparent"></div>
      </div>
    );
  }

  // Priority check: Website OFF
  if (settings && settings.website_status === 'OFF') {
    return <ClosedPage settings={settings} />;
  }

  // Priority check: Order OFF or Brand OFF
  if ((settings && settings.order_status === 'OFF') || (brand && brand.status === 'OFF')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="soft-card-cute p-6 w-full max-w-xs flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Layanan Ditutup</h2>
          <p className="text-sm text-gray-500 mb-5">Order untuk brand ini sedang tidak menerima pesanan.</p>
          <Link href="/" className="cute-pill-btn w-full">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="soft-card-cute p-6 w-full max-w-xs flex flex-col items-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">Keranjang Kosong</h2>
          <p className="text-xs text-gray-500 mb-5">Silakan pilih menu terlebih dahulu sebelum checkout.</p>
          <Link href={`/order/${brandSlug}/menu`} className="cute-pill-btn w-full">
            Pilih Menu
          </Link>
        </div>
      </div>
    );
  }

  const totalCartPrice = cart.reduce((sum, item) => sum + item.total_price, 0);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Mohon isi Nama Anda.');
      return;
    }

    if (!outletName.trim()) {
      setErrorMessage('Mohon tulis Nama Outlet tujuan.');
      return;
    }

    let pickupInfo = 'Sekarang';
    if (pickupType === 'Dijadwalkan') {
      if (!scheduledDate || !scheduledTime) {
        setErrorMessage('Mohon lengkapi Tanggal dan Jam Pick Up.');
        return;
      }
      pickupInfo = `${scheduledDate} jam ${scheduledTime}`;
    }

    // Format WhatsApp Message exactly as requested
    let menuTextLines = '';
    cart.forEach((item) => {
      menuTextLines += `• ${item.name} x ${item.qty} — Rp${item.total_price.toLocaleString('id-ID')}\n`;
      
      const cust = item.selected_customization;
      const detailsList: string[] = [];
      if (cust.suhu) detailsList.push(`Suhu: ${cust.suhu}`);
      if (cust.ukuran) detailsList.push(`Ukuran: ${cust.ukuran.name}`);
      if (cust.es) detailsList.push(`Es: ${cust.es}`);
      if (cust.gula) detailsList.push(`Gula: ${cust.gula}`);
      if (cust.beans) detailsList.push(`Beans: ${cust.beans.name}`);
      if (cust.syrup) detailsList.push(`Syrup: ${cust.syrup.map((s) => s.name).join(', ')}`);
      if (cust.topping) detailsList.push(`Topping: ${cust.topping.map((t) => t.name).join(', ')}`);
      if (cust.notes) detailsList.push(`Catatan: ${cust.notes}`);

      if (detailsList.length > 0) {
        menuTextLines += `  (${detailsList.join(', ')})\n`;
      }
    });

    const brandName = brand ? brand.name : 'Kopi Kenangan';
    const waText = `Format Order

Brand : ${brandName}
Nama : ${customerName.trim()}
Outlet : ${outletName.trim()}
Pick up : ${pickupInfo}

Menu :

${menuTextLines.trim()}

Total : Rp${totalCartPrice.toLocaleString('id-ID')}

Mohon konfirmasinya terimakasih`;

    // Save Order to SQLite DB
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brand ? brand.id : 'brand_kopi_kenangan',
          customer_name: customerName.trim(),
          outlet_name: outletName.trim(),
          pickup_type: pickupType,
          pickup_time_info: pickupInfo,
          items_json: JSON.stringify(cart),
          total_price: totalCartPrice,
        }),
      });
    } catch (e) {
      console.error('Failed saving order log:', e);
    }

    // Open WhatsApp
    const adminNumber = settings && settings.wa_admin_number ? settings.wa_admin_number.replace(/[^0-9]/g, '') : '6285124356993';
    const waUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(waText)}`;

    // Clear cart
    sessionStorage.removeItem(`jasdor_cart_${brandSlug}`);

    // Redirect to WhatsApp
    window.location.href = waUrl;
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-4 pb-28">
      {/* Top Header Nav */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/order/${brandSlug}/menu`}
          className="p-2 rounded-full bg-white shadow-xs border border-pink-100 text-gray-700 hover:text-[#e84393]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Checkout Pesanan</h1>
          <p className="text-xs text-pink-600 font-semibold">{brand ? brand.name : 'Kopi Kenangan'}</p>
        </div>
      </div>

      <form onSubmit={handleConfirmOrder} className="space-y-4 flex-1">
        {/* CUSTOMER INFORMATION CARD */}
        <div className="soft-card-cute p-4 space-y-3.5">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-pink-100 pb-2">
            <User className="w-4 h-4 text-[#e84393]" />
            Informasi Pemesan & Outlet
          </h2>

          {/* 1. Nama Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              Nama Pemesan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan nama Anda…"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-xs font-semibold text-gray-800 outline-none focus:border-[#e84393] bg-pink-50/20"
            />
          </div>

          {/* 2. Nama Outlet Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              Nama Outlet Kopi Kenangan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Tulis nama outlet di sini…"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-xs font-semibold text-gray-800 outline-none focus:border-[#e84393] bg-pink-50/20"
            />
            <p className="text-[11px] text-gray-400 font-medium">
              Contoh: Kopi Kenangan Summarecon Mall Bekasi / Grand Indonesia / Apotik Roxy Depok
            </p>
          </div>

          {/* 3. Pick Up Options */}
          <div className="space-y-2 border-t border-pink-100/60 pt-3">
            <label className="block text-xs font-bold text-gray-700">
              Pick Up Option <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPickupType('Sekarang')}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                  pickupType === 'Sekarang'
                    ? 'bg-[#e84393] border-[#e84393] text-white shadow-xs'
                    : 'bg-white border-pink-100 text-gray-700 hover:bg-pink-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => setPickupType('Dijadwalkan')}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                  pickupType === 'Dijadwalkan'
                    ? 'bg-[#e84393] border-[#e84393] text-white shadow-xs'
                    : 'bg-white border-pink-100 text-gray-700 hover:bg-pink-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Dijadwalkan</span>
              </button>
            </div>

            {/* Scheduled Date & Time Pickers */}
            {pickupType === 'Dijadwalkan' && (
              <div className="grid grid-cols-2 gap-2 pt-2 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Pilih Tanggal</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-pink-200 text-xs font-semibold text-gray-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Pilih Jam</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-pink-200 text-xs font-semibold text-gray-800 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ORDER SUMMARY CARD */}
        <div className="soft-card-cute p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-800 border-b border-pink-100 pb-2">
            Ringkasan Pesanan ({cart.reduce((s, i) => s + i.qty, 0)} Item)
          </h2>

          <div className="space-y-2.5 divide-y divide-pink-100/60">
            {cart.map((item) => {
              const cust = item.selected_customization;
              const detailsList: string[] = [];
              if (cust.suhu) detailsList.push(cust.suhu);
              if (cust.ukuran) detailsList.push(`Ukuran: ${cust.ukuran.name}`);
              if (cust.es) detailsList.push(`Es: ${cust.es}`);
              if (cust.gula) detailsList.push(`Gula: ${cust.gula}`);
              if (cust.beans) detailsList.push(`Beans: ${cust.beans.name}`);
              if (cust.syrup) cust.syrup.forEach((s) => detailsList.push(s.name));
              if (cust.topping) cust.topping.forEach((t) => detailsList.push(t.name));
              if (cust.notes) detailsList.push(`Catatan: ${cust.notes}`);

              return (
                <div key={item.cart_item_id} className="pt-2 flex justify-between items-start text-xs gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-gray-900">{item.name}</span>
                    <span className="text-rose-500 font-bold ml-1.5">× {item.qty}</span>
                    {detailsList.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed font-medium">
                        {detailsList.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="font-extrabold text-gray-900 shrink-0">
                    Rp{item.total_price.toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-pink-200 pt-3 flex items-center justify-between text-sm">
            <span className="font-bold text-gray-700">Total Biaya</span>
            <span className="font-black text-lg text-[#e84393]">
              Rp{totalCartPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Send className="w-4 h-4" />
          <span>Konfirmasi via WhatsApp</span>
        </button>
      </form>
    </div>
  );
}
