'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, MessageCircle, Star } from 'lucide-react';
import { WebsiteSettings, Brand } from '@/types';
import ClosedPage from '@/components/ClosedPage';
import TestimonialModal from '@/components/TestimonialModal';
import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';

import { useRealtimeSettings } from '@/hooks/useRealtimeSettings';

export default function Homepage() {
  const { settings, loading: settingsLoading } = useRealtimeSettings();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [isTestiOpen, setIsTestiOpen] = useState(false);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const resBrands = await fetch('/api/brands');
        const dataBrands = await resBrands.json();
        if (dataBrands.success) setBrands(dataBrands.brands);
      } catch (err) {
        console.error('Failed to load brands', err);
      } finally {
        setLoadingBrands(false);
      }
    }
    fetchBrands();
  }, []);

  const loading = settingsLoading || loadingBrands;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#e84393] border-t-transparent"></div>
      </div>
    );
  }

  // 1. Prioritas Status Check: If Website Status is OFF, display Fullscreen CLOSED Page
  if (settings && settings.website_status === 'OFF') {
    return <ClosedPage settings={settings} />;
  }

  const siteName = settings?.site_name || 'Jasdorbydy';
  const logoUrl = settings?.logo_url || '/logo-store.png';
  const isOrderGloballyOn = settings?.order_status === 'ON';

  // Map hero illustration assets for brand cards matching reference image
  const getHeroIllustration = (slug: string) => {
    if (slug === 'kopi-kenangan') return '/cup-kopi-kenangan.svg';
    if (slug === 'tomoro-coffee') return '/cup-tomoro.svg';
    return '/ticket-voucher.svg';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 pt-2 pb-0">
      <div className="w-full flex flex-col items-center">
        {/* TOP HEADER NAV WITH HAMBURGER & WA BUTTON */}
        <HeaderNav settings={settings} onOpenTesti={() => setIsTestiOpen(true)} />

        {/* NAMA BRAND & SUBTITLE */}
        <div className="text-center my-3">
          <h1 className="text-3xl font-black text-[#e84393] tracking-tight cute-title mb-1.5">
            {siteName}
          </h1>
          <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
            <span>Pesan favoritmu lebih praktis!</span>
            <span className="text-amber-400">✨</span>
          </p>
        </div>

        {/* SIDE-BY-SIDE PILL NAVIGATION BUTTONS */}
        <div className="grid grid-cols-2 gap-3 w-full my-5">
          <a
            href={settings?.wa_group_url || 'https://chat.whatsapp.com/LOuCM1OUNNBEbuq894AJ0Q?s=cl&p=a&ilr=4'}
            target="_blank"
            rel="noopener noreferrer"
            className="cute-pill-btn"
          >
            <MessageCircle className="w-4 h-4 text-[#e84393] shrink-0" />
            <span className="truncate">Gabung Grup WhatsApp</span>
          </a>

          <button
            onClick={() => setIsTestiOpen(true)}
            className="cute-pill-btn"
          >
            <Star className="w-4 h-4 text-[#e84393] shrink-0" />
            <span>Testimoni</span>
          </button>
        </div>

        {/* BRAND SERVICE CARDS SECTION */}
        <div className="w-full space-y-4 mb-6">
          {brands.map((brand) => {
            const isBrandActive = isOrderGloballyOn && brand.status === 'ON';
            const heroImg = getHeroIllustration(brand.slug);

            if (isBrandActive) {
              return (
                <Link
                  key={brand.id}
                  href={brand.slug === 'kopi-kenangan' ? '/order/kopi-kenangan/menu' : `/order/${brand.slug}/outlet`}
                  className="soft-card-cute p-4 flex items-center justify-between gap-2 group block"
                >
                  {/* Left: Circular Brand Logo Badge */}
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-pink-200 shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={52}
                      height={52}
                      className="object-contain"
                    />
                  </div>

                  {/* Middle: Brand Name */}
                  <div className="flex-1 min-w-0 px-2">
                    <h3 className="font-extrabold text-[#e84393] text-lg leading-tight group-hover:text-[#d63031] transition">
                      {brand.name}
                    </h3>
                  </div>

                  {/* Right: Hero Drink Cup / Ticket Illustration */}
                  <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
                    <Image
                      src={heroImg}
                      alt={brand.name}
                      width={80}
                      height={80}
                      className="object-contain transform group-hover:scale-105 transition"
                    />
                  </div>

                  {/* Rightmost: Circular Pink Arrow Button */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-300 to-[#f8a5c2] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#e84393] transition">
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </Link>
              );
            } else {
              return (
                <div
                  key={brand.id}
                  className="soft-card-cute p-4 flex items-center justify-between gap-2 opacity-60 bg-gray-50/90 cursor-not-allowed select-none"
                >
                  {/* Left: Circular Brand Logo Badge */}
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center p-1 overflow-hidden shrink-0 filter grayscale">
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={52}
                      height={52}
                      className="object-contain opacity-70"
                    />
                  </div>

                  {/* Middle: Brand Name & Status */}
                  <div className="flex-1 min-w-0 px-2">
                    <h3 className="font-extrabold text-gray-600 text-lg leading-tight">
                      {brand.name}
                    </h3>
                    <span className="text-[10px] font-black tracking-wider text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      TUTUP SEMENTARA
                    </span>
                  </div>

                  {/* Right: Hero Drink Cup Illustration */}
                  <div className="w-20 h-20 shrink-0 relative flex items-center justify-center filter grayscale opacity-80">
                    <Image
                      src={heroImg}
                      alt={brand.name}
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </div>

                  {/* Rightmost: Circular Arrow Button */}
                  <div className="w-9 h-9 rounded-full bg-pink-200 text-white flex items-center justify-center shrink-0 opacity-70">
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* CUTE SCALLOPED WAVE FOOTER */}
      <Footer
        siteName={siteName}
        logoUrl={logoUrl}
        waAdminNumber={settings?.wa_admin_number || '6281234567890'}
      />

      {/* TESTIMONIAL MODAL */}
      <TestimonialModal isOpen={isTestiOpen} onClose={() => setIsTestiOpen(false)} />
    </div>
  );
}
