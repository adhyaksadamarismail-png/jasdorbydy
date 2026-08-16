'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, KeyRound, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
      } else {
        setErrorMsg(data.message || 'Login gagal');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#fedfe7] to-[#fff0f5]">
      <div className="w-full max-w-sm soft-card p-8 shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4 border-2 border-white shadow-md">
          <Lock className="w-8 h-8 text-[#b84d6b]" />
        </div>

        <h1 className="text-xl font-black text-[#8b2942] mb-1">Admin Dashboard</h1>
        <p className="text-xs text-gray-500 font-medium mb-6">Masuk untuk mengelola JasDor</p>

        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Username admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#b84d6b] outline-none text-sm font-semibold text-gray-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#b84d6b] outline-none text-sm font-semibold text-gray-800"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-full bg-[#b84d6b] hover:bg-[#9c3c56] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Memproses...' : 'Masuk Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
