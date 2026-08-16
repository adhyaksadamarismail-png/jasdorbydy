'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, MessageCircle, X, Home, Coffee, Star, Lock, ChevronRight } from 'lucide-react';
import { WebsiteSettings } from '@/types';

interface HeaderNavProps {
  settings: WebsiteSettings | null;
  onOpenTesti?: () => void;
}

export default function HeaderNav({ settings, onOpenTesti }: HeaderNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const siteName = settings?.site_name || 'JasdorByDy';
  const logoUrl = settings?.logo_url || '/logo-store.png';
  const cleanNumber = settings?.wa_admin_number
    ? settings.wa_admin_number.replace(/\D/g, '')
    : '6281234567890';

  const handleOpenWaAdmin = () => {
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between py-3 px-1 mb-2 relative z-30">
        {/* Left: Hamburger Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-pink-100 flex items-center justify-center text-rose-500 hover:bg-pink-50 active:scale-95 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Top Center: Logo Container with Bow Ribbon on top */}
        <div className="relative pt-3 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white p-1 border-2 border-pink-200 shadow-md flex items-center justify-center overflow-hidden">
            <Image
              src={logoUrl}
              alt={siteName}
              width={72}
              height={72}
              className="rounded-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Right: Direct WhatsApp Chat Shortcut */}
        <button
          onClick={handleOpenWaAdmin}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-pink-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 active:scale-95 transition"
          aria-label="Contact Admin WhatsApp"
        >
          <MessageCircle className="w-5 h-5 fill-emerald-50 text-emerald-500" />
        </button>
      </div>

      {/* Slide-out Menu Drawer Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-start">
          <div className="w-4/5 max-w-xs h-full bg-white p-5 flex flex-col shadow-2xl animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-pink-100 mb-4">
              <div className="flex items-center gap-2">
                <Image src={logoUrl} alt={siteName} width={32} height={32} className="rounded-full" />
                <span className="font-extrabold text-base text-[#e84393]">{siteName}</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-pink-50 text-gray-400 hover:text-rose-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-2 flex-1">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-100/60 font-bold text-sm text-gray-800 transition"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-[#e84393]" />
                  <span>Beranda</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/order/kopi-kenangan/outlet"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-100/60 font-bold text-sm text-gray-800 transition"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-4 h-4 text-[#e84393]" />
                  <span>Order Kopi Kenangan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              {onOpenTesti && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTesti();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-100/60 font-bold text-sm text-gray-800 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-[#e84393]" />
                    <span>Testimoni Pelanggan</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}

              <a
                href={settings?.wa_group_url || 'https://chat.whatsapp.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-100/60 font-bold text-sm text-gray-800 transition"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#e84393]" />
                  <span>Grup WhatsApp</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </a>
            </div>

            {/* Admin Login Link at bottom */}
            <div className="pt-4 border-t border-pink-100">
              <Link
                href="/admin/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-pink-100/70 text-[#e84393] font-bold text-xs hover:bg-[#e84393] hover:text-white transition"
              >
                <Lock className="w-4 h-4" />
                <span>Admin Dashboard Login</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
