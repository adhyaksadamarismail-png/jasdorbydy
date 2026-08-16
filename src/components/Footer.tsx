'use client';

import React from 'react';
import Image from 'next/image';

interface FooterProps {
  siteName: string;
  logoUrl: string;
  waAdminNumber: string;
}

export default function Footer({ siteName, logoUrl, waAdminNumber }: FooterProps) {
  const cleanNumber = waAdminNumber ? waAdminNumber.replace(/\D/g, '') : '6281234567890';
  const displayBrand = siteName || 'JasdorByDy';

  return (
    <footer className="w-full mt-auto relative pt-6">
      {/* Cute Scalloped Wave Top Divider */}
      <div className="w-full h-5 bg-[radial-gradient(circle_at_12px_0px,transparent_11px,#fff0f4_12px)] bg-[length:24px_24px] bg-repeat-x"></div>

      <div className="bg-[#fff0f4] px-5 pt-4 pb-6 border-t border-pink-100 flex flex-col items-center">
        {/* Mascot & Brand Description Box */}
        <div className="w-full flex items-center gap-4 mb-4">
          {/* Bear Mascot Illustration */}
          <div className="w-24 h-24 shrink-0 relative">
            <Image
              src="/cute-bear-mascot.svg"
              alt="Mascot"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xl text-[#e84393] tracking-tight mb-1">
              {displayBrand}
            </h3>
            <p className="text-xs text-rose-500/80 font-medium leading-relaxed">
              Jasa order favoritmu, cepat, mudah dan terpercaya! ♡
            </p>
          </div>
        </div>

        {/* Dotted Separator Line */}
        <div className="w-full border-t border-dashed border-pink-200/80 my-2"></div>

        {/* WhatsApp & Copyright Info */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-center text-xs text-rose-400 font-medium">
          <a
            href={`https://wa.me/${cleanNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-[#e84393] font-bold flex items-center gap-1"
          >
            <span>💬 WhatsApp Admin</span>
          </a>
          <p className="text-[11px] text-pink-400">
            &copy; 2025 {displayBrand}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
