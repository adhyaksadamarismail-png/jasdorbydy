'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Info, Check, Sparkles } from 'lucide-react';
import { Product, CartItem, SelectedCustomization, CustomizationConfig } from '@/types';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  initialCartItem?: CartItem | null;
}

const UKURAN_OPTIONS = [
  { name: 'Normal', price: 0 },
  { name: 'Large', price: 5000 },
];

const BEANS_OPTIONS = [
  { name: 'Kenangan Blend', price: 0 },
  { name: 'Juwara Beans', price: 3000 },
];

const SYRUP_OPTIONS = [
  { name: 'Vanilla Syrup', price: 6000 },
  { name: 'Hazelnut Syrup', price: 6000 },
  { name: 'Caramel Syrup', price: 6000 },
  { name: 'Salted Caramel Sauce', price: 6000 },
];

const TOPPING_OPTIONS = [
  { name: 'Espresso Shot', price: 6000 },
  { name: 'Golden Boba', price: 6000 },
  { name: 'Grass Jelly', price: 6000 },
  { name: 'Oreo', price: 6000 },
  { name: 'Whipped Cream', price: 6000 },
];

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  initialCartItem,
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  let config: CustomizationConfig = {};
  try {
    config = product.customization_json ? JSON.parse(product.customization_json) : {};
  } catch (e) {}

  // State for selections
  const [suhu, setSuhu] = useState<string>('Ice');
  const [ukuran, setUkuran] = useState<{ name: string; price: number }>(UKURAN_OPTIONS[0]);
  const [es, setEs] = useState<string>('Normal');
  const [gula, setGula] = useState<string>('Normal');
  const [beans, setBeans] = useState<{ name: string; price: number }>(BEANS_OPTIONS[0]);
  const [syrups, setSyrups] = useState<{ name: string; price: number }[]>([]);
  const [toppings, setToppings] = useState<{ name: string; price: number }[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    if (initialCartItem) {
      const cust = initialCartItem.selected_customization;
      if (cust.suhu) setSuhu(cust.suhu);
      if (cust.ukuran) setUkuran(cust.ukuran);
      if (cust.es) setEs(cust.es);
      if (cust.gula) setGula(cust.gula);
      if (cust.beans) setBeans(cust.beans);
      if (cust.syrup) setSyrups(cust.syrup);
      if (cust.topping) setToppings(cust.topping);
      if (cust.notes) setNotes(cust.notes);
      setQty(initialCartItem.qty);
    } else {
      // Reset defaults
      setSuhu('Ice');
      setUkuran(UKURAN_OPTIONS[0]);
      setEs('Normal');
      setGula('Normal');
      setBeans(BEANS_OPTIONS[0]);
      setSyrups([]);
      setToppings([]);
      setNotes('');
      setQty(1);
    }
  }, [initialCartItem, product]);

  const toggleSyrup = (option: { name: string; price: number }) => {
    setSyrups((prev) => {
      const exists = prev.some((s) => s.name === option.name);
      if (exists) return prev.filter((s) => s.name !== option.name);
      return [...prev, option];
    });
  };

  const toggleTopping = (option: { name: string; price: number }) => {
    setToppings((prev) => {
      const exists = prev.some((t) => t.name === option.name);
      if (exists) return prev.filter((t) => t.name !== option.name);
      return [...prev, option];
    });
  };

  // Calculate dynamic pricing
  const extraUkuran = config.has_ukuran ? ukuran.price : 0;
  const extraBeans = config.has_beans ? beans.price : 0;
  const extraSyrups = config.has_syrup ? syrups.reduce((acc, s) => acc + s.price, 0) : 0;
  const extraToppings = config.has_topping ? toppings.reduce((acc, t) => acc + t.price, 0) : 0;

  const unitExtraCost = extraUkuran + extraBeans + extraSyrups + extraToppings;
  const unitPrice = product.price + unitExtraCost;
  const totalPrice = unitPrice * qty;

  const handleAdd = () => {
    const selected_customization: SelectedCustomization = {};
    if (config.has_suhu) selected_customization.suhu = suhu;
    if (config.has_ukuran) selected_customization.ukuran = ukuran;
    if (config.has_es) selected_customization.es = es;
    if (config.has_gula) selected_customization.gula = gula;
    if (config.has_beans) selected_customization.beans = beans;
    if (config.has_syrup && syrups.length > 0) selected_customization.syrup = syrups;
    if (config.has_topping && toppings.length > 0) selected_customization.topping = toppings;
    if (notes.trim()) selected_customization.notes = notes.trim();

    const isSingle = !!product.is_single_item;
    const cartItem: CartItem = {
      cart_item_id: initialCartItem?.cart_item_id || `item_${Date.now()}_${Math.random()}`,
      product_id: product.id,
      name: product.name,
      image: product.image,
      base_price: product.price,
      qty,
      selected_customization,
      unit_price: unitPrice,
      total_price: totalPrice,
      is_single_item: isSingle,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-pink-100 flex items-center justify-between z-20">
          <h3 className="font-extrabold text-base text-[#8b2942] truncate">Detail Produk</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-50 text-gray-400 hover:text-rose-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* FOTO PRODUK */}
          <div className="w-full h-56 rounded-2xl bg-pink-50/70 p-4 flex items-center justify-center border border-pink-100/60 relative">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/coffee-latte.svg';
              }}
              className="object-contain max-h-48 drop-shadow-md w-auto h-auto max-w-full"
            />
          </div>

          {/* INFORMASI PRODUK */}
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">{product.name}</h2>
            <span className="text-lg font-black text-[#e84393] block mt-1">
              Rp{product.price.toLocaleString('id-ID')}
            </span>
            {product.description && (
              <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1.5">
                {product.description}
              </p>
            )}

            {/* Info Box */}
            <div className="mt-3.5 p-3 rounded-xl bg-pink-50/80 border border-pink-200/70 flex items-start gap-2 text-xs text-rose-700 font-medium">
              <Info className="w-4 h-4 text-[#e84393] shrink-0 mt-0.5" />
              <span>
                Pick up only — Jika menu di store kosong, kami akan informasikan. Tidak ada biaya tambahan apapun.
              </span>
            </div>
          </div>

          {/* PILIHAN CUSTOMIZATION SECTIONS */}
          
          {/* 1. SUHU */}
          {config.has_suhu && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                SUHU <span className="text-xs font-normal text-gray-400 lowercase">(pilih 1)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Ice', 'Hot'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSuhu(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      suhu === opt
                        ? 'bg-[#e84393] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. UKURAN */}
          {config.has_ukuran && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                UKURAN <span className="text-xs font-normal text-gray-400 lowercase">(pilih 1)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {UKURAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setUkuran(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      ukuran.name === opt.name
                        ? 'bg-[#e84393] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {opt.name} {opt.price > 0 && `+Rp${opt.price.toLocaleString('id-ID')}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. ES */}
          {config.has_es && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                ES <span className="text-xs font-normal text-gray-400 lowercase">(pilih 1)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Normal', 'Less Ice', 'No Ice'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEs(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      es === opt
                        ? 'bg-[#e84393] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. GULA */}
          {config.has_gula && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                GULA <span className="text-xs font-normal text-gray-400 lowercase">(pilih 1)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Normal', 'Less Sugar', 'No Sugar'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGula(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      gula === opt
                        ? 'bg-[#e84393] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. BEANS */}
          {config.has_beans && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                BEANS <span className="text-xs font-normal text-gray-400 lowercase">(pilih 1)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BEANS_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setBeans(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      beans.name === opt.name
                        ? 'bg-[#e84393] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {opt.name} {opt.price > 0 && `+Rp${opt.price.toLocaleString('id-ID')}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. SYRUP (Optional - Multi Select) */}
          {config.has_syrup && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                SYRUP <span className="text-xs font-medium text-[#e84393] font-sans lowercase">· Optional (bisa pilih lebih dari 1)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYRUP_OPTIONS.map((opt) => {
                  const isSelected = syrups.some((s) => s.name === opt.name);
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => toggleSyrup(opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                        isSelected
                          ? 'bg-pink-50 border-[#e84393] text-[#e84393]'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-pink-50/50'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className="font-extrabold text-[11px]">+Rp{opt.price.toLocaleString('id-ID')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. TOPPING (Optional - Multi Select) */}
          {config.has_topping && (
            <div className="space-y-2 border-t border-pink-100/60 pt-4">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                TOPPING <span className="text-xs font-medium text-[#e84393] font-sans lowercase">· Optional (bisa pilih lebih dari 1)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TOPPING_OPTIONS.map((opt) => {
                  const isSelected = toppings.some((t) => t.name === opt.name);
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => toggleTopping(opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                        isSelected
                          ? 'bg-pink-50 border-[#e84393] text-[#e84393]'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-pink-50/50'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className="font-extrabold text-[11px]">+Rp{opt.price.toLocaleString('id-ID')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. CATATAN */}
          <div className="space-y-1.5 border-t border-pink-100/60 pt-4">
            <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
              CATATAN
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan (opsional)…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none focus:border-[#e84393] bg-pink-50/20 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="sticky bottom-0 bg-white border-t border-pink-100 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-3 bg-pink-50 border border-pink-200 rounded-full p-1.5">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-white text-[#e84393] shadow-xs flex items-center justify-center hover:bg-[#e84393] hover:text-white transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-sm text-[#8b2942] min-w-[16px] text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-7 h-7 rounded-full bg-[#e84393] text-white shadow-xs flex items-center justify-center hover:bg-[#d63031] transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dynamic Total Price Breakdown */}
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Subtotal Item</span>
              <span className="font-black text-lg text-[#e84393]">
                Rp{totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3.5 rounded-full bg-[#e84393] hover:bg-[#d63031] text-white font-black text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
          >
            <span>+ Tambah ke Keranjang</span>
          </button>
        </div>

      </div>
    </div>
  );
}
