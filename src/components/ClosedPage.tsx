'use client';

import React from 'react';
import Image from 'next/image';
import { MessageCircle, Coffee } from 'lucide-react';
import { WebsiteSettings } from '@/types';

interface ClosedPageProps {
  settings: WebsiteSettings;
}

export default function ClosedPage({ settings }: ClosedPageProps) {
  const handleChatAdmin = () => {
    const cleanNumber = settings.wa_admin_number.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent('Halo admin, mau tanya kapan pesanan dibuka kembali?')}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#fedfe7] via-[#fff0f5] to-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-width-[400px] bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-pink-100 flex flex-col items-center">
        {/* Animated Coffee / Store Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center border-4 border-white shadow-md">
            <Image
              src={settings.logo_url || '/logo-store.svg'}
              alt={settings.site_name}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#b84d6b] text-white p-2 rounded-full shadow-md">
            <Coffee className="w-5 h-5" />
          </div>
        </div>

        {/* Closed Title */}
        <h1 className="text-2xl font-black text-[#8b2942] mb-3 tracking-wide">
          {settings.closed_title || 'LAGI ISTIRAHAT DULU'}
        </h1>

        {/* Closed Description */}
        <p className="text-gray-600 font-medium text-sm leading-relaxed mb-8 max-w-xs">
          {settings.closed_desc || 'Pesanan sedang ditutup sementara. Silakan kembali lagi nanti.'}
        </p>

        {/* Chat Admin Button */}
        <button
          onClick={handleChatAdmin}
          className="w-full py-3.5 px-6 rounded-full bg-[#b84d6b] hover:bg-[#9c3c56] text-white font-bold text-base shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{settings.closed_button_text || 'Chat Admin'}</span>
        </button>
      </div>
    </div>
  );
}
