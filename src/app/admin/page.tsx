'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Coffee,
  Store,
  ShoppingBag,
  ListOrdered,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  LogOut,
  Power,
  RefreshCw,
} from 'lucide-react';
import { WebsiteSettings, Brand, Outlet, Product, Order } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'brands' | 'outlets' | 'products' | 'orders'>('settings');

  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Editing forms state
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandSlug, setNewBrandSlug] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('/kopi-kenangan-logo.svg');

  const [selectedBrandForFilter, setSelectedBrandForFilter] = useState<string>('all');

  // Outlet form
  const [editingOutlet, setEditingOutlet] = useState<Partial<Outlet> | null>(null);
  // Product form
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [resSet, resB, resO, resP, resOrd] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/brands'),
        fetch('/api/outlets'),
        fetch('/api/products'),
        fetch('/api/orders'),
      ]);

      const dataSet = await resSet.json();
      const dataB = await resB.json();
      const dataO = await resO.json();
      const dataP = await resP.json();
      const dataOrd = await resOrd.json();

      if (dataSet.success) setSettings(dataSet.settings);
      if (dataB.success) setBrands(dataB.brands);
      if (dataO.success) setOutlets(dataO.outlets);
      if (dataP.success) setProducts(dataP.products);
      if (dataOrd.success) setOrders(dataOrd.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const flashMessage = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // 1. Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        flashMessage('Pengaturan website berhasil disimpan!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Toggle Brand status
  const handleToggleBrandStatus = async (brand: Brand) => {
    const nextStatus = brand.status === 'ON' ? 'OFF' : 'ON';
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...brand, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands);
        flashMessage(`Status Brand ${brand.name} diubah ke ${nextStatus}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Add New Brand
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newBrandSlug.trim()) return;

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBrandName.trim(),
          slug: newBrandSlug.trim(),
          logo_url: newBrandLogo.trim() || '/coffee-latte.svg',
          status: 'ON',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands);
        setNewBrandName('');
        setNewBrandSlug('');
        flashMessage('Brand baru berhasil ditambahkan!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Save/Edit Outlet
  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutlet || !editingOutlet.outlet_name) return;

    try {
      const res = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOutlet),
      });
      const data = await res.json();
      if (data.success) {
        setOutlets(data.outlets);
        setEditingOutlet(null);
        flashMessage('Outlet berhasil disimpan!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOutlet = async (id: string) => {
    if (!confirm('Hapus outlet ini?')) return;
    try {
      const res = await fetch(`/api/outlets?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadAllAdminData();
        flashMessage('Outlet dihapus!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Save/Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.price) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setEditingProduct(null);
        flashMessage('Produk berhasil disimpan!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadAllAdminData();
        flashMessage('Produk dihapus!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#b84d6b] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 pb-12">
      {/* Top Admin Navigation Bar */}
      <div className="bg-[#8b2942] text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-pink-300" />
          <h1 className="font-extrabold text-base tracking-wide">Admin JasDor</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-semibold">
            Lihat Website
          </Link>
        </div>
      </div>

      {/* Admin Tab Buttons Navigation */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-xs">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
            activeTab === 'settings' ? 'bg-[#b84d6b] text-white' : 'text-gray-600 hover:bg-pink-50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Website</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
            activeTab === 'brands' ? 'bg-[#b84d6b] text-white' : 'text-gray-600 hover:bg-pink-50'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Brand</span>
        </button>

        <button
          onClick={() => setActiveTab('outlets')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
            activeTab === 'outlets' ? 'bg-[#b84d6b] text-white' : 'text-gray-600 hover:bg-pink-50'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Outlet</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
            activeTab === 'products' ? 'bg-[#b84d6b] text-white' : 'text-gray-600 hover:bg-pink-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Produk</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
            activeTab === 'orders' ? 'bg-[#b84d6b] text-white' : 'text-gray-600 hover:bg-pink-50'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Pesanan</span>
        </button>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB CONTENT AREA */}
      <div className="p-4 flex-1">
        {/* -------------------- TAB 1: SETTINGS -------------------- */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Website Status & Order Control */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="font-extrabold text-sm text-[#8b2942] border-b border-gray-100 pb-2">
                Kontrol Utama Website
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-pink-50/40">
                  <label className="block text-xs font-bold text-gray-700 mb-2">Status Website</label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        website_status: settings.website_status === 'ON' ? 'OFF' : 'ON',
                      })
                    }
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition ${
                      settings.website_status === 'ON'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>🟢 WEBSITE {settings.website_status}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-pink-50/40">
                  <label className="block text-xs font-bold text-gray-700 mb-2">Status Order</label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        order_status: settings.order_status === 'ON' ? 'OFF' : 'ON',
                      })
                    }
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition ${
                      settings.order_status === 'ON'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>☕ ORDER {settings.order_status}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-sm text-[#8b2942] border-b border-gray-100 pb-2">
                Informasi &amp; Kontak Admin
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Website</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp Admin</label>
                <input
                  type="text"
                  placeholder="Contoh: 6281234567890"
                  value={settings.wa_admin_number}
                  onChange={(e) => setSettings({ ...settings, wa_admin_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Gunakan kode negara (62). Nomor ini akan menerima format order pesanan.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Link Grup WhatsApp</label>
                <input
                  type="text"
                  value={settings.wa_group_url}
                  onChange={(e) => setSettings({ ...settings, wa_group_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800"
                />
              </div>
            </div>

            {/* Closed Page Settings */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-sm text-[#8b2942] border-b border-gray-100 pb-2">
                Tampilan Halaman CLOSED (Website OFF)
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul CLOSED</label>
                <input
                  type="text"
                  value={settings.closed_title}
                  onChange={(e) => setSettings({ ...settings, closed_title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi CLOSED</label>
                <textarea
                  rows={2}
                  value={settings.closed_desc}
                  onChange={(e) => setSettings({ ...settings, closed_desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teks Tombol</label>
                <input
                  type="text"
                  value={settings.closed_button_text}
                  onChange={(e) => setSettings({ ...settings, closed_button_text: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#b84d6b] hover:bg-[#9c3c56] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </form>
        )}

        {/* -------------------- TAB 2: BRANDS -------------------- */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            {/* Add Brand Form */}
            <form onSubmit={handleAddBrand} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-sm text-[#8b2942] border-b border-gray-100 pb-2">
                Tambah Brand Baru
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Brand</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tomoro Coffee"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Slug URL</label>
                  <input
                    type="text"
                    placeholder="tomoro-coffee"
                    value={newBrandSlug}
                    onChange={(e) => setNewBrandSlug(e.target.value)}
                    className="w-full p-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#b84d6b] text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Brand</span>
              </button>
            </form>

            {/* Brands List */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2">
                Daftar Brand ({brands.length})
              </h2>

              <div className="space-y-2">
                {brands.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white p-1 border border-gray-200 flex items-center justify-center overflow-hidden">
                        <Image src={b.logo_url} alt={b.name} width={32} height={32} className="object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{b.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono">/{b.slug}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleBrandStatus(b)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        b.status === 'ON'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      {b.status === 'ON' ? '🟢 ON' : '🔴 OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 3: OUTLETS -------------------- */}
        {activeTab === 'outlets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setEditingOutlet({
                    brand_id: brands[0]?.id || 'brand_kopi_kenangan',
                    outlet_name: '',
                    address: '',
                    city: 'Jakarta',
                    status: 'ON',
                  })
                }
                className="py-2.5 px-4 rounded-xl bg-[#b84d6b] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Outlet Baru</span>
              </button>
            </div>

            {/* Editing Outlet Form */}
            {editingOutlet && (
              <form onSubmit={handleSaveOutlet} className="bg-white p-5 rounded-2xl border border-pink-200 shadow-md space-y-3">
                <h3 className="font-extrabold text-sm text-[#8b2942] border-b border-pink-100 pb-2">
                  {editingOutlet.id ? 'Edit Outlet' : 'Tambah Outlet Baru'}
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Brand</label>
                  <select
                    value={editingOutlet.brand_id || ''}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, brand_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Outlet</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kopi Kenangan - Mall XYZ"
                    value={editingOutlet.outlet_name || ''}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, outlet_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Alamat</label>
                    <input
                      type="text"
                      placeholder="Jl. Contoh No. 123"
                      value={editingOutlet.address || ''}
                      onChange={(e) => setEditingOutlet({ ...editingOutlet, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kota</label>
                    <input
                      type="text"
                      placeholder="Jakarta"
                      value={editingOutlet.city || ''}
                      onChange={(e) => setEditingOutlet({ ...editingOutlet, city: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Availability</label>
                  <select
                    value={editingOutlet.status || 'ON'}
                    onChange={(e) => setEditingOutlet({ ...editingOutlet, status: e.target.value as 'ON' | 'OFF' })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                  >
                    <option value="ON">🟢 ON (Tersedia)</option>
                    <option value="OFF">🔴 OFF (Tutup)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#b84d6b] text-white font-bold text-xs"
                  >
                    Simpan Outlet
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOutlet(null)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Outlets Listing */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2">
                Daftar Outlet ({outlets.length})
              </h2>

              <div className="space-y-3">
                {outlets.map((out) => (
                  <div key={out.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs">{out.outlet_name}</h4>
                      <p className="text-[11px] text-gray-500">{out.address}, {out.city}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        out.status === 'ON' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {out.status === 'ON' ? '🟢 Tersedia' : '🔴 Tutup'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingOutlet(out)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOutlet(out.id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 4: PRODUCTS -------------------- */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setEditingProduct({
                    brand_id: brands[0]?.id || 'brand_kopi_kenangan',
                    name: '',
                    image: '/coffee-latte.svg',
                    description: '',
                    price: 20000,
                    category: 'Coffees',
                    availability: 'ON',
                  })
                }
                className="py-2.5 px-4 rounded-xl bg-[#b84d6b] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>

            {/* Editing Product Form */}
            {editingProduct && (
              <form onSubmit={handleSaveProduct} className="bg-white p-5 rounded-2xl border border-pink-200 shadow-md space-y-3">
                <h3 className="font-extrabold text-sm text-[#8b2942] border-b border-pink-100 pb-2">
                  {editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Brand</label>
                  <select
                    value={editingProduct.brand_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kopi Kenangan Mantan"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      placeholder="20000"
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                    <input
                      type="text"
                      placeholder="Coffees"
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Foto / Path Gambar</label>
                  <input
                    type="text"
                    placeholder="/coffee-latte.svg"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat produk"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Availability</label>
                  <select
                    value={editingProduct.availability || 'ON'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, availability: e.target.value as 'ON' | 'OFF' })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                  >
                    <option value="ON">🟢 ON (Tersedia)</option>
                    <option value="OFF">🔴 OFF (Habis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipe Menu (Rules Minimum Order)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, is_single_item: false })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        !editingProduct.is_single_item
                          ? 'bg-[#b84d6b] border-[#b84d6b] text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>📦 Menu Reguler (Min. 2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, is_single_item: true })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        editingProduct.is_single_item
                          ? 'bg-[#b84d6b] border-[#b84d6b] text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>⚡ Menu Satuan (Bisa 1)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#b84d6b] text-white font-bold text-xs"
                  >
                    Simpan Produk
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Product List */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2">
                Daftar Produk ({products.length})
              </h2>

              <div className="space-y-3">
                {products.map((prod) => (
                  <div key={prod.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        <Image src={prod.image} alt={prod.name} width={36} height={36} className="object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{prod.name}</h4>
                        <span className="font-extrabold text-[#b84d6b] text-xs">Rp{prod.price.toLocaleString('id-ID')}</span>
                        <span className={`ml-2 inline-block text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          prod.availability === 'ON' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {prod.availability === 'ON' ? 'Tersedia' : 'Habis'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingProduct(prod)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 5: ORDERS LOG -------------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-[#8b2942]">Riwayat Order Masuk ({orders.length})</h2>
              <button onClick={loadAllAdminData} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-gray-200 text-gray-400 text-xs font-semibold">
                Belum ada pesanan tersimpan.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => {
                  let itemsList: any[] = [];
                  try {
                    itemsList = JSON.parse(ord.items_json);
                  } catch (e) {}

                  return (
                    <div key={ord.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div>
                          <span className="font-mono text-[10px] text-gray-400 block">{ord.id}</span>
                          <h4 className="font-bold text-gray-800 text-xs">{ord.customer_name}</h4>
                        </div>
                        <span className="font-extrabold text-[#b84d6b] text-sm">
                          Rp{ord.total_price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600">
                        <span className="font-semibold text-gray-500">Outlet: </span>
                        <span className="font-bold text-gray-800">{ord.outlet_name}</span>
                      </div>

                      <div className="bg-pink-50/50 p-2.5 rounded-xl space-y-1 text-xs">
                        <span className="font-bold text-gray-500 block text-[11px] mb-1">Detail Item:</span>
                        {itemsList.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-gray-700">
                            <span>{it.name} x {it.qty}</span>
                            <span className="font-bold">Rp{(it.price * it.qty).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-gray-400 text-right pt-1">
                        {ord.created_at || 'Baru saja'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
