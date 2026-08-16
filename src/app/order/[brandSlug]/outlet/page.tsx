'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, ChevronRight, Store, Search, X, Check, ArrowRight, AlertCircle, Clock, Navigation } from 'lucide-react';
import { Outlet, Brand, WebsiteSettings } from '@/types';
import ClosedPage from '@/components/ClosedPage';

export default function SelectOutletPage() {
  const urlParams = useParams();
  const brandSlug = (urlParams?.brandSlug as string) || 'kopi-kenangan';
  const router = useRouter();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Geolocation state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);
  const [locMessage, setLocMessage] = useState('');

  // Confirmation state when outlet is chosen
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  useEffect(() => {
    async function loadOutletData() {
      try {
        const [resOutlets, resBrands, resSettings] = await Promise.all([
          fetch(`/api/outlets?brandSlug=${brandSlug}`),
          fetch('/api/brands'),
          fetch('/api/settings'),
        ]);

        const dataOutlets = await resOutlets.json();
        const dataBrands = await resBrands.json();
        const dataSettings = await resSettings.json();

        if (dataOutlets.success) setOutlets(dataOutlets.outlets);
        if (dataSettings.success) setSettings(dataSettings.settings);
        if (dataBrands.success) {
          const matchedBrand = dataBrands.brands.find((b: Brand) => b.slug === brandSlug);
          if (matchedBrand) setBrand(matchedBrand);
        }
      } catch (err) {
        console.error('Failed loading outlet data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOutletData();
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
          <p className="text-sm text-gray-500 mb-5">Order untuk layanan ini sedang tidak menerima pesanan.</p>
          <Link href="/" className="cute-pill-btn w-full">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // Geolocation detection handler
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocMessage('Fitur GPS tidak didukung di browser ini.');
      return;
    }

    setIsDetectingLoc(true);
    setLocMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLoc(false);
        setLocMessage('📍 Lokasi berhasil dideteksi!');
        // Filter or highlight nearest outlets (e.g. Jakarta/Depok/Surabaya)
        setSearchQuery('Jakarta');
      },
      (error) => {
        setIsDetectingLoc(false);
        setLocMessage('Gagal mengambil lokasi. Silakan cari nama kota/outlet manual.');
      },
      { timeout: 8000 }
    );
  };

  // Real-time search filtering on outlet_name, address, city (case-insensitive)
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredOutlets = outlets.filter((out) => {
    if (!trimmedQuery) return true;
    return (
      out.outlet_name.toLowerCase().includes(trimmedQuery) ||
      out.address.toLowerCase().includes(trimmedQuery) ||
      out.city.toLowerCase().includes(trimmedQuery)
    );
  });

  const handleSelectOutlet = (outlet: Outlet) => {
    if (outlet.status !== 'ON') return;
    setSelectedOutlet(outlet);
  };

  const handleConfirmAndProceed = () => {
    if (!selectedOutlet) return;
    sessionStorage.setItem('jasdor_selected_outlet', JSON.stringify(selectedOutlet));
    router.push(`/order/${brandSlug}/menu?outletId=${selectedOutlet.id}`);
  };

  const quickSearchSuggestions = ['Summarecon', 'Grand Indonesia', 'Aeon Mall', 'Jakarta', 'Surabaya', 'Bekasi', 'Depok', 'Bandung'];

  return (
    <div className="min-h-screen flex flex-col px-4 pt-4 pb-28">
      {/* Top Header Nav */}
      <div className="flex items-center gap-3 mb-3">
        <Link href="/" className="p-2.5 rounded-full bg-white shadow-xs border border-pink-100 text-gray-700 hover:text-[#e84393] transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#1A1614]">Pilih Outlet</h1>
          <p className="text-xs text-[#A08972] font-medium">
            Data real-time {brand ? brand.name : 'Kopi Kenangan'} · <strong className="text-rose-600">{outlets.length} outlet</strong> tersinkron
          </p>
        </div>
      </div>

      <p className="text-[11px] text-[#A08972] mb-3 leading-relaxed">
        Hanya outlet yang sedang buka. Pesanan aplikasi ditutup 30 menit sebelum jam tutup outlet.
      </p>

      {/* Gunakan Lokasi Saya Button */}
      <div className="mb-3">
        <button
          type="button"
          onClick={detectUserLocation}
          disabled={isDetectingLoc}
          className="w-full bg-[#1A1614] hover:bg-[#2A221C] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm"
        >
          <Navigation className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>{isDetectingLoc ? 'Mendeteksi Lokasi...' : 'Gunakan Lokasi Saya'}</span>
        </button>
        {locMessage && <p className="text-[11px] text-amber-600 font-semibold text-center mt-1.5">{locMessage}</p>}
      </div>

      {/* Prominent Sticky Search Bar */}
      <div className="sticky top-2 z-20 mb-3">
        <div className="relative flex items-center bg-white rounded-2xl border-2 border-[#eadfce] focus-within:border-[#e84393] shadow-sm overflow-hidden transition">
          <Search className="w-5 h-5 text-[#A08972] absolute left-3.5" />
          <input
            type="search"
            placeholder="Cari nama outlet atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm font-semibold text-[#1A1614] placeholder:text-gray-400 outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-gray-400 hover:text-rose-500 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      {!searchQuery && (
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#A08972] block mb-1.5">Pencarian populer:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickSearchSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setSearchQuery(suggestion)}
                className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#6B4423] border border-[#eadfce] hover:bg-[#e84393] hover:text-white transition whitespace-nowrap shadow-2xs"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outlets List */}
      <div className="space-y-3 flex-1">
        {filteredOutlets.length === 0 ? (
          /* NO RESULTS STATE */
          <div className="bg-white rounded-2xl border-2 border-[#eadfce] p-8 text-center flex flex-col items-center justify-center my-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <Search className="w-7 h-7 text-[#A08972]" />
            </div>
            <h3 className="font-bold text-base text-[#1A1614] mb-1">Outlet tidak ditemukan</h3>
            <p className="text-xs text-[#5C4A3A] font-medium max-w-xs">
              “Coba cari dengan nama mall atau area lainnya.”
            </p>
          </div>
        ) : (
          filteredOutlets.map((outlet) => {
            const isAvailable = outlet.status === 'ON';
            const isSelected = selectedOutlet?.id === outlet.id;

            return (
              <div
                key={outlet.id}
                onClick={() => handleSelectOutlet(outlet)}
                className={`bg-white rounded-2xl border-2 p-4 flex gap-3 transition cursor-pointer ${
                  isSelected
                    ? 'border-[#e84393] bg-pink-50/40 shadow-sm'
                    : 'border-[#eadfce] hover:border-pink-300'
                }`}
              >
                {/* Outlet Default Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#FAF6F0] shrink-0 overflow-hidden flex items-center justify-center p-2.5">
                  <Image
                    src="/kopi-kenangan-logo.svg"
                    alt={outlet.outlet_name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>

                {/* Outlet Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm text-[#1A1614]">{outlet.outlet_name}</h3>
                    <span className="text-[10px] bg-[#1A1614] text-white px-2 py-0.5 rounded-full font-medium">
                      Buka
                    </span>
                  </div>

                  <p className="text-xs text-[#5C4A3A] mt-1 line-clamp-2 leading-relaxed">
                    {outlet.address}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#6B4423]">
                      <Clock className="w-3 h-3 text-[#A08972]" />
                      {outlet.opening_hours || '10:00 - 21:30 WIB'}
                    </span>
                  </div>
                </div>

                {/* Selection Check Icon */}
                <div className="shrink-0 flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected
                        ? 'border-[#e84393] bg-[#e84393]'
                        : 'border-[#d4c2a8] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMATION DRAWER WHEN OUTLET IS SELECTED */}
      {selectedOutlet && (
        <div className="fixed bottom-3 left-0 right-0 max-w-[480px] mx-auto px-4 z-40 animate-in slide-in-from-bottom duration-250">
          <div className="bg-[#1A1614] text-white rounded-3xl p-4 shadow-2xl border-2 border-amber-500/30 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-[#F59E0B] bg-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#F59E0B]" />
                Outlet dipilih
              </span>
              <button
                onClick={() => setSelectedOutlet(null)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Ganti
              </button>
            </div>

            <h4 className="font-bold text-sm text-white mb-3 truncate">
              {selectedOutlet.outlet_name}
            </h4>

            <button
              onClick={handleConfirmAndProceed}
              className="w-full py-3 rounded-full bg-[#e84393] hover:bg-[#d63031] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <span>Lanjut Pilih Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
