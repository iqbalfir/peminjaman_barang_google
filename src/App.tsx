/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Tag, 
  Package, 
  Users, 
  ShieldCheck, 
  ShoppingBag, 
  RefreshCw, 
  FileText, 
  ClipboardList, 
  Database, 
  Server, 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon, 
  Clock, 
  Calendar,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

// DB Mock & Utilities
import { OfficeInventoryDb } from './dbMock';

// Subcomponents
import Dashboard from './components/Dashboard';
import CategoryCRUD from './components/CategoryCRUD';
import BarangCRUD from './components/BarangCRUD';
import PeminjamCRUD from './components/PeminjamCRUD';
import TransaksiForm from './components/TransaksiForm';
import PengembalianForm from './components/PengembalianForm';
import RiwayatTransaksi from './components/RiwayatTransaksi';
import Laporan from './components/Laporan';
import AuditLogView from './components/AuditLogView';
import DbBackupView from './components/DbBackupView';
import PhpCodeExplorer from './components/PhpCodeExplorer';
import AccountManagement from './components/AccountManagement';

// Mock users for simulation
const MOCK_ROLES = [
  { id_user: 1, nama_user: 'Heri Santoso', username: 'admin_heri', role: 'Admin' },
  { id_user: 2, nama_user: 'Aris Munandar', username: 'petugas_aris', role: 'Petugas' },
  { id_user: 3, nama_user: 'Budi Setiawan', username: 'peminjam_budi', role: 'Peminjam' }
];

export default function App() {
  const [activeUser, setActiveUser] = useState(MOCK_ROLES[0]); // default Admin
  const [activeTab, setActiveTab] = useState<'dashboard' | 'barang' | 'kategori' | 'peminjam' | 'transaksi' | 'pengembalian' | 'riwayat' | 'laporan' | 'audit' | 'backup' | 'php' | 'account'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRoleChange = (userId: number) => {
    const found = MOCK_ROLES.find(r => r.id_user === userId);
    if (found) {
      setActiveUser(found);
      OfficeInventoryDb.logActivity(found.id_user, `Simulasi Ganti Role Akses ke: "${found.nama_user}" (${found.role})`);
      
      // If Peminjam tries to stay on Admin-only tab, revert them to dashboard
      if (found.role === 'Peminjam' && (activeTab === 'backup' || activeTab === 'audit')) {
        setActiveTab('dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-gray-800 selection:bg-blue-600 selection:text-white">
      
      {/* SIDEBAR NAVIGATION - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white uppercase tracking-wider leading-tight">SINVENT OFFICE</h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Inventory MVC v1.0</p>
          </div>
        </div>

        {/* Current Active Simulation User Profile */}
        <div 
          onClick={() => setActiveTab('account')}
          className="p-4 mx-4 my-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs space-y-1.5 cursor-pointer transition-all group"
          title="Buka Manajemen Akun"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white truncate max-w-[130px] group-hover:text-blue-400 transition-colors">{activeUser.nama_user}</div>
              <div className="text-[10px] text-gray-400 font-medium italic">@{activeUser.username}</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Status Akses</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              activeUser.role === 'Admin' ? 'bg-blue-600 text-white' :
              activeUser.role === 'Petugas' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
            }`}>
              {activeUser.role}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
          
          {/* Dashboard menu */}
          <div className="space-y-1">
            <button
              id="menu-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard Utama
            </button>
          </div>

          {/* Master data */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">MASTER REGISTRASI</span>
            
            {/* Master Barang */}
            <button
              id="menu-barang"
              onClick={() => setActiveTab('barang')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'barang' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="h-4 w-4 shrink-0" /> Master Barang
            </button>

            {/* Master Kategori */}
            <button
              id="menu-kategori"
              onClick={() => setActiveTab('kategori')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'kategori' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="h-4 w-4 shrink-0" /> Master Kategori
            </button>

            {/* Master Peminjam */}
            <button
              id="menu-peminjam"
              onClick={() => setActiveTab('peminjam')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'peminjam' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" /> Master Peminjam
            </button>
          </div>

          {/* Transactions */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">MODUL TRANSAKSI</span>
            
            {/* Transaksi Peminjaman */}
            {(activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
              <button
                id="menu-transaksi"
                onClick={() => setActiveTab('transaksi')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                  activeTab === 'transaksi' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="h-4 w-4 shrink-0" /> Transaksi Peminjaman
              </button>
            )}

            {/* Pengembalian Barang */}
            {(activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
              <button
                id="menu-pengembalian"
                onClick={() => setActiveTab('pengembalian')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                  activeTab === 'pengembalian' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="h-4 w-4 shrink-0" /> Catat Pengembalian
              </button>
            )}

            {/* Riwayat Transaksi */}
            <button
              id="menu-riwayat"
              onClick={() => setActiveTab('riwayat')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'riwayat' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4 shrink-0" /> Riwayat Transaksi
            </button>
          </div>

          {/* Reports */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">LAPORAN REKONSILIASI</span>
            
            <button
              id="menu-laporan"
              onClick={() => setActiveTab('laporan')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'laporan' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" /> Pusat Laporan Ekspor
            </button>
          </div>

          {/* Admin Utilities */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">UTILITAS KEAMANAN</span>
            
            {/* Audit Log (Admin Only) */}
            {activeUser.role === 'Admin' && (
              <button
                id="menu-audit"
                onClick={() => setActiveTab('audit')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                  activeTab === 'audit' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="h-4 w-4 shrink-0" /> Jejak Audit Log
              </button>
            )}

            {/* Backup (Admin Only) */}
            {activeUser.role === 'Admin' && (
              <button
                id="menu-backup"
                onClick={() => setActiveTab('backup')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                  activeTab === 'backup' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="h-4 w-4 shrink-0" /> Backup Database SQL
              </button>
            )}

            {/* Manajemen Akun */}
            <button
              id="menu-account"
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'account' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="h-4 w-4 shrink-0" /> Manajemen Akun
            </button>

            {/* PHP Source Code templates explorer */}
            <button
              id="menu-php"
              onClick={() => setActiveTab('php')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'php' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="h-4 w-4 shrink-0" /> Backend PHP MVC Code
            </button>
          </div>

        </nav>

        {/* Corporate Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-semibold uppercase tracking-wider">
          © 2026 Kementerian RI
        </div>
      </aside>

      {/* MOBILE BAR HEADER */}
      <header className="md:hidden bg-slate-900 text-slate-300 p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-500" />
          <span className="font-extrabold text-xs text-white uppercase tracking-wider">SINVENT OFFICE</span>
        </div>
        <button 
          id="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* MOBILE DRAWER DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex">
          <div className="bg-slate-900 w-64 p-5 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider text-sm">Navigasi Sistem</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Swapper */}
            <div className="my-4 bg-slate-800 p-3 rounded-lg text-xs">
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">User Swapper:</span>
              <select
                id="mob-role-swap"
                value={activeUser.id_user}
                onChange={(e) => handleRoleChange(Number(e.target.value))}
                className="w-full p-1 bg-slate-900 border rounded text-white"
              >
                {MOCK_ROLES.map(r => (
                  <option key={r.id_user} value={r.id_user}>{r.nama_user} ({r.role})</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 space-y-3 font-medium text-xs text-slate-400">
              <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-blue-500" /> Dashboard Utama
              </button>
              <button onClick={() => { setActiveTab('barang'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" /> Master Barang
              </button>
              <button onClick={() => { setActiveTab('kategori'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-500" /> Master Kategori
              </button>
              <button onClick={() => { setActiveTab('peminjam'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> Master Peminjam
              </button>
              <button onClick={() => { setActiveTab('riwayat'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-500" /> Riwayat Transaksi
              </button>
              <button onClick={() => { setActiveTab('laporan'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" /> Laporan Ekspor
              </button>
              <button onClick={() => { setActiveTab('account'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-blue-500" /> Manajemen Akun
              </button>
              <button onClick={() => { setActiveTab('php'); setIsMobileMenuOpen(false); }} className="w-full text-left py-1.5 flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" /> Template Backend PHP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS BAR HEADER (Desktop Only role swap & clocks) */}
        <header className="hidden md:flex bg-white border-b border-gray-150 px-6 py-3.5 items-center justify-between shrink-0">
          
          {/* Metadata system clocks */}
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Hari Ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
              <Clock className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="font-mono">{currentTime}</span>
            </div>
          </div>

          {/* Simulation controller widget (Role Switcher) */}
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[9px]">Ganti Hak Akses Akun</span>
              <span className="text-gray-600 font-medium">Beralih peran simulasi sistem</span>
            </div>
            <select 
              id="desktop-role-swap"
              value={activeUser.id_user}
              onChange={(e) => handleRoleChange(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-700"
            >
              {MOCK_ROLES.map(r => (
                <option key={r.id_user} value={r.id_user}>
                  Simulasi: {r.nama_user} ({r.role})
                </option>
              ))}
            </select>
          </div>

        </header>

        {/* WORKSPACE CONTENT MAIN COMPONENT MOUNT */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-[1440px] w-full mx-auto">
          
          {/* TAB BINDER SWITCH MOUNT */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              currentUser={activeUser}
              setActiveTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'barang' && (
            <BarangCRUD currentUser={activeUser} />
          )}

          {activeTab === 'kategori' && (
            <CategoryCRUD currentUser={activeUser} />
          )}

          {activeTab === 'peminjam' && (
            <PeminjamCRUD currentUser={activeUser} />
          )}

          {activeTab === 'transaksi' && (
            <TransaksiForm 
              currentUser={activeUser}
              onSuccess={() => setActiveTab('riwayat')}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'pengembalian' && (
            <PengembalianForm 
              currentUser={activeUser}
              onSuccess={() => setActiveTab('riwayat')}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'riwayat' && (
            <RiwayatTransaksi currentUser={activeUser} />
          )}

          {activeTab === 'laporan' && (
            <Laporan currentUser={activeUser} />
          )}

          {activeTab === 'audit' && (
            <AuditLogView currentUser={activeUser} />
          )}

          {activeTab === 'backup' && (
            <DbBackupView currentUser={activeUser} />
          )}

          {activeTab === 'php' && (
            <PhpCodeExplorer />
          )}

          {activeTab === 'account' && (
            <AccountManagement 
              currentUser={activeUser}
              onUpdateUser={(updatedUser) => setActiveUser(updatedUser)}
            />
          )}

        </main>

      </div>

    </div>
  );
}
