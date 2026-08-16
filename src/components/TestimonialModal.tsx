'use client';

import React from 'react';
import { X, Star, CheckCircle, Heart } from 'lucide-react';

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dummyTestimonials = [
  {
    id: 1,
    name: 'Adhyaksa D.',
    date: 'Kemarin',
    rating: 5,
    comment: 'Order Kopi Kenangan via JasDor super cepat & dapet promo potongan mantap! Admin ramah bgt ❤️',
  },
  {
    id: 2,
    name: 'Siti Rahma',
    date: '3 hari lalu',
    rating: 5,
    comment: 'Praktis banget gak perlu antre di outlet. Tinggal pick up langsung ambil. Best service!',
  },
  {
    id: 3,
    name: 'Budi Pratama',
    date: '1 minggu lalu',
    rating: 5,
    comment: 'Awalnya ragu tapi ternyata pesanannya persis sesuai pesanan & gercep banget konfirmasinya.',
  },
];

export default function TestimonialModal({ isOpen, onClose }: TestimonialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-pink-100 mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
            <h3 className="text-lg font-bold text-[#8b2942]">Testimoni Pelanggan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {dummyTestimonials.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100/60">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-sm">{t.name}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" />
                </div>
                <span className="text-xs text-gray-400">{t.date}</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">{t.comment}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#b84d6b] text-white font-semibold text-sm shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
