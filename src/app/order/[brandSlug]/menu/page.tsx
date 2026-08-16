'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Plus, Search, Trash2, Edit3, ArrowRight, AlertCircle, Sparkles, X, Info } from 'lucide-react';
import { Product, Brand, WebsiteSettings, CartItem } from '@/types';
import ClosedPage from '@/components/ClosedPage';
import ProductDetailModal from '@/components/ProductDetailModal';

export default function MenuPage() {
  const urlParams = useParams();
  const brandSlug = (urlParams?.brandSlug as string) || 'kopi-kenangan';
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State (stored in sessionStorage)
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal Customization State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Minimum Order Toast Modal State
  const [showMinOrderModal, setShowMinOrderModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [resProducts, resBrands, resSettings] = await Promise.all([
          fetch(`/api/products?brandSlug=${brandSlug}`),
          fetch('/api/brands'),
          fetch('/api/settings'),
        ]);

        const dataProducts = await resProducts.json();
        const dataBrands = await resBrands.json();
        const dataSettings = await resSettings.json();

        if (dataProducts.success) setProducts(dataProducts.products);
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
      } catch (err) {
        console.error('Failed loading menu data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [brandSlug]);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    sessionStorage.setItem(`jasdor_cart_${brandSlug}`, JSON.stringify(updatedCart));
  };

  const handleOpenProductModal = (product: Product) => {
    setSelectedProduct(product);
    setEditingCartItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditCartModal = (cartItem: CartItem) => {
    const product = products.find((p) => p.id === cartItem.product_id);
    if (product) {
      setSelectedProduct(product);
      setEditingCartItem(cartItem);
      setIsModalOpen(true);
    }
  };

  const handleAddToCart = (item: CartItem) => {
    let updatedCart: CartItem[] = [];
    const index = cart.findIndex((c) => c.cart_item_id === item.cart_item_id);

    if (index >= 0) {
      updatedCart = [...cart];
      updatedCart[index] = item;
    } else {
      updatedCart = [...cart, item];
    }
    saveCartToStorage(updatedCart);
  };

  const handleRemoveFromCart = (cart_item_id: string) => {
    const updatedCart = cart.filter((c) => c.cart_item_id !== cart_item_id);
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

  // Unique categories list
  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];

  // Minimum Order Validation Logic
  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const hasSingleItemInCart = cart.some((item) => item.is_single_item);
  const isValidMinOrder = hasSingleItemInCart || totalCartQty >= 2;

  const handleCheckoutClick = () => {
    if (!isValidMinOrder) {
      setShowMinOrderModal(true);
      return;
    }
    router.push(`/order/${brandSlug}/checkout`);
  };

  // Filter products by search query
  const searchFilteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Categorized items
  const regularProducts = searchFilteredProducts.filter((p) => !p.is_single_item && (activeCategory === 'Semua' || p.category === activeCategory));
  const singleItemProducts = searchFilteredProducts.filter((p) => p.is_single_item && (activeCategory === 'Semua' || p.category === activeCategory));

  const totalCartPrice = cart.reduce((sum, item) => sum + item.total_price, 0);

  // Helper render card
  const renderProductCard = (product: Product) => {
    const isAvailable = product.availability === 'ON';
    const isSingle = !!product.is_single_item;

    return (
      <div
        key={product.id}
        onClick={() => isAvailable && handleOpenProductModal(product)}
        className={`soft-card-cute p-2.5 flex flex-col justify-between transition cursor-pointer relative overflow-hidden bg-white ${
          !isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-pink-300 active:scale-[0.98]'
        }`}
      >
        {/* Badge Single Item */}
        {isSingle && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 shadow-2xs">
            ⚡ Satuan
          </span>
        )}

        {/* Product Photo */}
        <div className="w-full h-28 rounded-2xl bg-pink-50/70 p-2 flex items-center justify-center border border-pink-100/50 relative overflow-hidden mb-2">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/coffee-latte.svg';
            }}
            className="w-full h-full object-contain drop-shadow-xs"
          />
        </div>

        {/* Product Name (Max 2 lines) */}
        <div className="flex-1 flex flex-col justify-between">
          <h3 className="font-bold text-xs text-gray-800 line-clamp-2 leading-snug min-h-[32px]">
            {product.name}
          </h3>

          {/* Price & Compact Add Button */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-pink-50">
            <span className="font-black text-xs text-[#e84393]">
              Rp{product.price.toLocaleString('id-ID')}
            </span>

            {isAvailable ? (
              <button
                type="button"
                className="px-2.5 py-1 rounded-full bg-pink-50 hover:bg-[#e84393] text-[#e84393] hover:text-white font-extrabold text-[11px] transition shadow-2xs flex items-center gap-0.5"
              >
                <span>+</span>
                <span>Tambah</span>
              </button>
            ) : (
              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                Habis
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-4 pb-36 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-full bg-white shadow-xs border border-pink-100 text-gray-700 hover:text-[#e84393]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-800">{brand ? brand.name : 'Kopi Kenangan'}</h1>
            <p className="text-xs text-pink-600 font-semibold">Pilih Menu Favoritmu ☕</p>
          </div>
        </div>
      </div>

      {/* Sticky Search Bar */}
      <div className="sticky top-2 z-20 mb-3">
        <div className="relative flex items-center bg-white rounded-full border border-pink-200 shadow-xs overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
          <input
            type="search"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-[#e84393] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-pink-100 hover:bg-pink-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SECTION 1: MENU REGULER / FAVORIT (2 COLUMNS GRID MOBILE) */}
      {regularProducts.length > 0 && (
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#e84393]" />
              {activeCategory === 'Semua' ? 'Menu Favorit' : `Menu ${activeCategory}`}
            </h2>
            <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full">
              Min. 2 Item
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {regularProducts.map((p) => renderProductCard(p))}
          </div>
        </div>
      )}

      {/* SECTION 2: MENU SATUAN (2 COLUMNS GRID MOBILE) */}
      {singleItemProducts.length > 0 && (
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between pt-2 border-t border-pink-100">
            <h2 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Menu Satuan
            </h2>
            <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
              Bisa 1 Item
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {singleItemProducts.map((p) => renderProductCard(p))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {regularProducts.length === 0 && singleItemProducts.length === 0 && (
        <div className="text-center py-10 soft-card-cute p-6">
          <p className="text-xs font-bold text-gray-500">Tidak ada produk yang cocok dengan pencarian Anda.</p>
        </div>
      )}

      {/* CART SUMMARY SECTION IF ITEMS IN CART */}
      {cart.length > 0 && (
        <div className="mt-6 mb-4 space-y-2 border-t border-pink-200/60 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#e84393]" />
              Item di Keranjang ({totalCartQty})
            </h3>
            {!isValidMinOrder && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full animate-pulse">
                ⚠️ Min. 2 Item
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cart.map((item) => {
              const cust = item.selected_customization;
              const detailsList: string[] = [];

              if (cust.suhu) detailsList.push(cust.suhu);
              if (cust.ukuran) detailsList.push(`${cust.ukuran.name} (+Rp${cust.ukuran.price.toLocaleString('id-ID')})`);
              if (cust.es) detailsList.push(cust.es);
              if (cust.gula) detailsList.push(cust.gula);
              if (cust.beans) detailsList.push(`${cust.beans.name} (+Rp${cust.beans.price.toLocaleString('id-ID')})`);
              if (cust.syrup) cust.syrup.forEach((s) => detailsList.push(s.name));
              if (cust.topping) cust.topping.forEach((t) => detailsList.push(t.name));
              if (cust.notes) detailsList.push(`Catatan: ${cust.notes}`);

              return (
                <div
                  key={item.cart_item_id}
                  className="bg-white rounded-2xl p-3 border border-pink-100 flex items-start justify-between gap-3 text-xs shadow-xs"
                >
                  <div className="flex-1 min-w-0" onClick={() => handleOpenEditCartModal(item)}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-gray-900">{item.name}</span>
                      <span className="text-rose-500 font-bold">× {item.qty}</span>
                      {item.is_single_item && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold">
                          Satuan
                        </span>
                      )}
                    </div>
                    {detailsList.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1 leading-snug font-medium">
                        {detailsList.join(' · ')}
                      </p>
                    )}
                    <span className="font-bold text-[#e84393] block mt-1">
                      Rp{item.total_price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditCartModal(item)}
                      className="p-1.5 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.cart_item_id)}
                      className="p-1.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-0 right-0 max-w-[480px] mx-auto px-4 z-40 animate-in slide-in-from-bottom duration-250">
          <div className="bg-[#1A1614] text-white rounded-2xl p-3 pl-4 shadow-2xl flex items-center justify-between border-2 border-pink-500/30">
            <div>
              <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider block">
                {totalCartQty} Item Ditambahkan
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-black text-base text-white">
                  Rp{totalCartPrice.toLocaleString('id-ID')}
                </span>
                {!isValidMinOrder && (
                  <span className="text-[10px] text-rose-400 font-bold">
                    (Min. 2 item)
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className={`py-2.5 px-4 rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 transition ${
                isValidMinOrder
                  ? 'bg-[#e84393] hover:bg-[#d63031] text-white active:scale-95'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>Lanjut Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MINIMUM ORDER WARNING TOAST MODAL POPUP */}
      {showMinOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-gray-800 mb-1">Minimal Order 2 Item</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Pesanan minimal terdiri dari 2 item.<br />
              Bisa berupa: <span className="font-bold text-pink-600">2 cup</span> atau <span className="font-bold text-pink-600">1 cup + 1 food</span>.
            </p>
            <button
              onClick={() => setShowMinOrderModal(false)}
              className="cute-pill-btn w-full py-2.5 text-xs shadow-md"
            >
              + Tambah Menu Lain
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL & CUSTOMIZATION POPUP MODAL */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
        initialCartItem={editingCartItem}
      />
    </div>
  );
}
