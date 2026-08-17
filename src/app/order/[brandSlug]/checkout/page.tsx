'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Send, Clock, User, AlertCircle, Trash2, Plus, Minus } from 'lucide-react';
import { CartItem, Brand, WebsiteSettings } from '@/types';
import ClosedPage from '@/components/ClosedPage';

import { useRealtimeSettings } from '@/hooks/useRealtimeSettings';
import { useRealtimeBrands } from '@/hooks/useRealtimeBrands';

export default function CheckoutPage() {
  const urlParams = useParams();
  const brandSlug = (urlParams?.brandSlug as string) || 'kopi-kenangan';
  const router = useRouter();

  const { settings, loading: settingsLoading } = useRealtimeSettings();
  const { brands, loading: brandsLoading } = useRealtimeBrands();
  const [cart, setCart] = useState<CartItem[]>([]);

  const matchedBrand = brands.find((b) => b.slug === brandSlug) || null;
  const brand = matchedBrand;

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [outletName, setOutletName] = useState('');
  const [pickupType, setPickupType] = useState<'Sekarang' | 'Dijadwalkan'>('Sekarang');
  const [scheduledTime, setScheduledTime] = useState('12:00');

  // Error validation states
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Restore Cart from sessionStorage
    const savedCart = sessionStorage.getItem(`jasdor_cart_${brandSlug}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, [brandSlug]);

  const loading = settingsLoading || brandsLoading;

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    sessionStorage.setItem(`jasdor_cart_${brandSlug}`, JSON.stringify(updatedCart));
  };

  const handleUpdateQty = (cart_item_id: string, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.cart_item_id === cart_item_id) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            qty: newQty,
            total_price: item.unit_price * newQty,
          };
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);

    saveCartToStorage(updatedCart);
  };

  const handleRemoveItem = (cart_item_id: string) => {
    const updatedCart = cart.filter((item) => item.cart_item_id !== cart_item_id);
    saveCartToStorage(updatedCart);
  };

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

  // Minimum Order & Order Type Validation Calculations
  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.total_price, 0);
  const cartHasSingleItem = cart.some((item) => item.is_single_item);
  const isValidMinOrder = cartHasSingleItem ? totalCartQty === 1 : totalCartQty >= 2;

  // EMPTY CART STATE ON CHECKOUT
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="soft-card-cute p-8 w-full flex flex-col items-center shadow-lg bg-white border border-pink-100 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-[#e84393] flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-gray-800 mb-1">Keranjang masih kosong</h2>
          <p className="text-xs font-semibold text-gray-500 mb-6">Yuk pilih menu favoritmu ☕</p>
          <Link href={`/order/${brandSlug}/menu`} className="cute-pill-btn w-full py-3 text-xs shadow-md">
            Pilih Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (settings && settings.website_status === 'OFF') {
      setErrorMessage('Website sedang ditutup. Pesanan tidak dapat diproses.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Mohon isi Nama Pemesan.');
      return;
    }

    if (!outletName.trim()) {
      setErrorMessage('Mohon tulis Nama Outlet tujuan.');
      return;
    }

    if (!isValidMinOrder) {
      if (cartHasSingleItem) {
        setErrorMessage('Menu Satuan hanya dapat dipesan maksimal 1 cup per order.');
      } else {
        setErrorMessage('Minimal order 2 item. Pesanan minimal terdiri dari 2 item (bisa 2 cup atau 1 cup + 1 food).');
      }
      return;
    }

    let pickupInfo = 'Sekarang';
    if (pickupType === 'Dijadwalkan') {
      if (!scheduledTime) {
        setErrorMessage('Mohon pilih Jam Pick Up.');
        return;
      }
      pickupInfo = `Jam ${scheduledTime} WIB`;
    }

    // Format WhatsApp Message with strict customization diff rules
    let menuTextLines = '';
    cart.forEach((item) => {
      const cust = item.selected_customization;
      const diffs: string[] = [];

      if (cust) {
        if (cust.suhu && cust.suhu !== 'Ice') {
          diffs.push(`(${cust.suhu})`);
        }
        if (cust.ukuran && cust.ukuran.name && cust.ukuran.name !== 'Normal') {
          diffs.push(`(${cust.ukuran.name})`);
        }
        if (cust.es && cust.es !== 'Normal') {
          diffs.push(`(${cust.es})`);
        }
        if (cust.gula && cust.gula !== 'Normal') {
          diffs.push(`(${cust.gula})`);
        }
        if (cust.beans && cust.beans.name && cust.beans.name !== 'Kenangan Blend') {
          diffs.push(`(${cust.beans.name})`);
        }
        if (cust.syrup && cust.syrup.length > 0) {
          cust.syrup.forEach((s) => diffs.push(`(${s.name})`));
        }
        if (cust.topping && cust.topping.length > 0) {
          cust.topping.forEach((t) => diffs.push(`(${t.name})`));
        }
        if (cust.notes && cust.notes.trim()) {
          diffs.push(`(Catatan: ${cust.notes.trim()})`);
        }
      }

      const diffsSuffix = diffs.length > 0 ? ` ${diffs.join(' ')}` : '';
      menuTextLines += `• ${item.name} x ${item.qty} — Rp${item.total_price.toLocaleString('id-ID')}${diffsSuffix}\n`;
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

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brand ? brand.id : 'brand_kopi_kenangan',
          customer_name: customerName.trim(),
          outlet_name: outletName.trim(),
          pickup_type: pickupType,
          pickup_time_info: pickupInfo,
          items: cart,
          items_json: JSON.stringify(cart),
          total_price: totalCartPrice,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menyimpan pesanan ke database.');
      }

      // Clear cart ONLY AFTER SUCCESSFUL Persistence
      sessionStorage.removeItem(`jasdor_cart_${brandSlug}`);

      // Open WhatsApp
      const adminNumber = settings && settings.wa_admin_number ? settings.wa_admin_number.replace(/[^0-9]/g, '') : '6285124356993';
      const waUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(waText)}`;
      window.location.href = waUrl;
    } catch (e: any) {
      console.error('Failed saving order:', e);
      setErrorMessage(`Gagal memproses pesanan: ${e.message || 'Silakan coba lagi.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-5 pt-4 pb-28 max-w-md mx-auto">
      {/* Top Header Nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/order/${brandSlug}/menu`}
            className="p-2 rounded-full bg-white shadow-xs border border-pink-100 text-gray-700 hover:text-[#e84393]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-gray-800">Checkout Pesanan</h1>
            <p className="text-xs text-pink-600 font-semibold">{brand ? brand.name : 'Kopi Kenangan'}</p>
          </div>
        </div>

        {/* Button Kembali Pilih Menu */}
        <Link
          href={`/order/${brandSlug}/menu`}
          className="px-3 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-[#e84393] font-bold text-xs border border-pink-200/60 flex items-center gap-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Menu</span>
        </Link>
      </div>

      <form onSubmit={handleConfirmOrder} className="space-y-4 flex-1">
        {/* CUSTOMER INFORMATION CARD */}
        <div className="soft-card-cute p-4 space-y-3.5 bg-white border border-pink-100 rounded-3xl shadow-sm">
          <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-pink-100 pb-2">
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
            <p className="text-[11px] text-gray-400 font-medium leading-tight">
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
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
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
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                  pickupType === 'Dijadwalkan'
                    ? 'bg-[#e84393] border-[#e84393] text-white shadow-xs'
                    : 'bg-white border-pink-100 text-gray-700 hover:bg-pink-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Dijadwalkan</span>
              </button>
            </div>

            {/* Scheduled Time Picker */}
            {pickupType === 'Dijadwalkan' && (
              <div className="pt-2 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Pilih Jam Pick Up <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-pink-200 text-xs font-semibold text-gray-800 bg-white outline-none focus:border-[#e84393]"
                />
              </div>
            )}
          </div>
        </div>

        {/* ORDER SUMMARY CARD WITH ITEM DELETION AND QTY CONTROLS */}
        <div className="soft-card-cute p-4 space-y-3 bg-white border border-pink-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between border-b border-pink-100 pb-2">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Ringkasan Pesanan ({totalCartQty} Item)
            </h2>
            <Link
              href={`/order/${brandSlug}/menu`}
              className="text-[11px] font-bold text-[#e84393] hover:underline flex items-center gap-0.5"
            >
              <span>+ Tambah Menu</span>
            </Link>
          </div>

          {/* ITEM LIST WITH DELETION AND QTY MODIFIERS */}
          <div className="space-y-3 divide-y divide-pink-100/60">
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
                <div key={item.cart_item_id} className="pt-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-gray-900">{item.name}</span>
                        {item.is_single_item && (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold">
                            Satuan
                          </span>
                        )}
                      </div>
                      {detailsList.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed font-medium">
                          {detailsList.join(' · ')}
                        </p>
                      )}
                      <span className="font-black text-xs text-[#e84393] block mt-1">
                        Rp{item.total_price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Trash Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                      className="p-1.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition shrink-0"
                      title="Hapus menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Modifier Buttons */}
                  <div className="flex items-center justify-between bg-pink-50/40 p-1.5 px-3 rounded-xl border border-pink-100/60">
                    <span className="text-[11px] font-bold text-gray-600">Jumlah:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.cart_item_id, -1)}
                        className="w-6 h-6 rounded-full bg-white border border-pink-200 text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-pink-100 active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-xs text-gray-900 w-4 text-center">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.cart_item_id, 1)}
                        className="w-6 h-6 rounded-full bg-white border border-pink-200 text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-pink-100 active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
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

        {/* MINIMUM ORDER WARNING BANNER IF INVALID */}
        {!isValidMinOrder && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-2 text-center animate-in fade-in">
            <div className="flex items-center justify-center gap-2 font-black text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Minimal Order 2 Item</span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed">
              Pesanan minimal terdiri dari 2 item (bisa 2 cup atau 1 cup + 1 food). Silakan tambah menu favoritmu lagi!
            </p>
            <Link
              href={`/order/${brandSlug}/menu`}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs hover:bg-rose-700 transition w-full"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Menu Lagi</span>
            </Link>
          </div>
        )}

        {/* ERROR MESSAGE BANNER */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValidMinOrder || isSubmitting}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition ${
              isSubmitting
                ? 'bg-pink-400 text-white cursor-wait opacity-80'
                : isValidMinOrder
                ? 'bg-[#e84393] hover:bg-[#d63031] text-white active:scale-[0.99]'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-75'
            }`}
          >
            <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'MEMPROSES ORDER...' : 'Konfirmasi via WhatsApp'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
