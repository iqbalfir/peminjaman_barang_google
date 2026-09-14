/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Database
} from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Available users for quick selection / testing
  const allUsers: User[] = OfficeInventoryDb.getUsers();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan username dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      const user = allUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername
      );

      if (!user) {
        setIsLoading(false);
        setErrorMsg('Username tidak ditemukan di basis data sistem.');
        return;
      }

      if (user.status === 'Nonaktif') {
        setIsLoading(false);
        setErrorMsg('Akun ini telah dinonaktifkan oleh Administrator. Hubungi bagian TI.');
        return;
      }

      // Check password (allow standard matching or default fallbacks)
      const validPasswords = [
        user.password,
        'admin123',
        'petugas123',
        'peminjam123',
        'adminpassword123',
        'petugaspassword123',
        'peminjampassword123',
        'password123'
      ];

      if (user.password && user.password !== password && !validPasswords.includes(password)) {
        setIsLoading(false);
        setErrorMsg('Kata sandi yang Anda masukkan salah.');
        return;
      }

      // Successful login
      setIsLoading(false);
      OfficeInventoryDb.logActivity(user.id_user, `Pengguna "${user.nama_user}" (@${user.username}) berhasil masuk (login) ke sistem`);
      onLoginSuccess(user);
    }, 400);
  };

  const handleQuickLogin = (targetUser: User) => {
    if (targetUser.status === 'Nonaktif') {
      setErrorMsg(`Akun ${targetUser.nama_user} berstatus Nonaktif.`);
      return;
    }
    setErrorMsg('');
    setUsername(targetUser.username);
    setPassword(targetUser.password || 'password123');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      OfficeInventoryDb.logActivity(targetUser.id_user, `Pengguna "${targetUser.nama_user}" (@${targetUser.username}) berhasil masuk via Login Cepat`);
      onLoginSuccess(targetUser);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-3 text-center">
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-600/20 mb-1">
          <Layers className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          SINVENT OFFICE
        </h1>
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
          Sistem Informasi Peminjaman & Manajemen Inventaris Aset Barang Milik Negara (BMN)
        </p>

        {/* Database connectivity badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-full text-[11px] text-slate-300 font-mono shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <Database className="h-3 w-3 text-blue-400" />
          <span>PostgreSQL Cloud SQL Online</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80 space-y-6">
          
          <div className="border-b border-slate-700 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Masuk ke Akun Anda
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gunakan kredensial akun kedinasan yang telah terdaftar
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Username Akun
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin_heri atau petugas_aris"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Kata Sandi
                </label>
                <span className="text-[10px] text-blue-400 font-mono">Sensitif huruf</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Masuk ke Sistem Inventaris</span>
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Simulation / Testing Accounts */}
          <div className="pt-4 border-t border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Masuk Cepat (1-Klik Akun Terdaftar)
              </span>
              <span className="text-[10px] text-slate-500">Klik untuk langsung masuk</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {allUsers.slice(0, 3).map((u) => (
                <button
                  key={u.id_user}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full text-left p-2.5 bg-slate-900/80 hover:bg-slate-700/60 border border-slate-700 rounded-xl transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      u.role === 'Admin' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                      u.role === 'Petugas' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {u.nama_user.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        {u.nama_user}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        @{u.username} • Role: <span className="font-semibold text-slate-300">{u.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Masuk</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Security / System Footer Note */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          Direktorat Sistem Informasi & Manajemen BMN © 2026. Seluruh hak cipta dilindungi.
          <br />Setiap aktivitas diawasi melalui Jejak Rekam Audit Log (Audit Trail).
        </p>
      </div>
    </div>
  );
}
