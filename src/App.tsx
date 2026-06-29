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
  ArrowRightLeft,
  Wrench,
  Lock,
  LogIn
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
import SerahTerimaBarang from './components/SerahTerimaBarang';
import PerbaikanCRUD from './components/PerbaikanCRUD';

import { initAuth } from './googleAuth';
import { initGlobalSync, getGlobalSyncState, exportToGoogleSheets } from './googleSheetsSync';
import { registerOnDataWrite } from './dbMock';

// Mock users for simulation
const MOCK_ROLES = [
  { id_user: 1, nama_user: 'Heri Santoso', username: 'admin_heri', role: 'Admin' },
  { id_user: 2, nama_user: 'Aris Munandar', username: 'petugas_aris', role: 'Petugas' },
  { id_user: 3, nama_user: 'Budi Setiawan', username: 'peminjam_budi', role: 'Peminjam' }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('inv_is_logged_in') === 'true';
  });

  const [activeUser, setActiveUser] = useState(() => {
    const savedUser = localStorage.getItem('inv_active_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return MOCK_ROLES[0]; // default Admin
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'barang' | 'kategori' | 'peminjam' | 'transaksi' | 'pengembalian' | 'riwayat' | 'laporan' | 'audit' | 'backup' | 'php' | 'account' | 'serah_terima' | 'perbaikan'>(() => {
    const loggedIn = localStorage.getItem('inv_is_logged_in') === 'true';
    return loggedIn ? 'dashboard' : 'transaksi';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Login Modal & Form States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<'dashboard' | 'barang' | 'kategori' | 'peminjam' | 'transaksi' | 'pengembalian' | 'riwayat' | 'laporan' | 'audit' | 'backup' | 'php' | 'account' | 'serah_terima' | 'perbaikan'>('dashboard');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Initialize Google sheets background sync
  useEffect(() => {
    // Register local storage write observer
    registerOnDataWrite(() => {
      const syncState = getGlobalSyncState();
      if (syncState.autoSync && syncState.token && syncState.id) {
        exportToGoogleSheets(syncState.token, syncState.id).catch(err => {
          console.error('Background Google Sheets Sync failed:', err);
        });
      }
    });

    // Listen to Google authentication status
    const unsubscribe = initAuth(
      (user, token) => {
        const savedSheet = localStorage.getItem('inv_g_spreadsheet');
        const autoSyncEnabled = localStorage.getItem('inv_auto_sync') !== 'false'; // default to true
        let sheetId = '';
        if (savedSheet) {
          try {
            sheetId = JSON.parse(savedSheet).id;
          } catch (e) {}
        }
        initGlobalSync(token, sheetId, autoSyncEnabled);
      },
      () => {
        initGlobalSync(null, null, false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      localStorage.setItem('inv_active_user', JSON.stringify(found));
      OfficeInventoryDb.logActivity(found.id_user, `Simulasi Ganti Role Akses ke: "${found.nama_user}" (${found.role})`);
      
      // If Peminjam tries to stay on Admin-only tab, revert them to dashboard
      if (found.role === 'Peminjam' && (activeTab === 'backup' || activeTab === 'audit')) {
        setActiveTab('dashboard');
      }
    }
  };

  const handleTabClick = (tab: typeof activeTab) => {
    if (tab === 'transaksi') {
      setActiveTab(tab);
      return;
    }

    if (!isLoggedIn) {
      setPendingTab(tab);
      setIsLoginModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    // Check credentials against db users
    const dbUsers = OfficeInventoryDb.getUsers();
    const foundUser = dbUsers.find(
      u => u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
           u.password === loginPassword
    );

    if (foundUser) {
      // Find corresponding role mapping from MOCK_ROLES
      const mockRoleMatch = MOCK_ROLES.find(r => r.role === foundUser.role);
      const userToSet = mockRoleMatch 
        ? { ...mockRoleMatch, nama_user: foundUser.nama_user, username: foundUser.username } 
        : { id_user: foundUser.id_user, nama_user: foundUser.nama_user, username: foundUser.username, role: foundUser.role };
      
      setActiveUser(userToSet);
      setIsLoggedIn(true);
      setLoginSuccess(`Selamat datang kembali, ${foundUser.nama_user}!`);
      
      localStorage.setItem('inv_is_logged_in', 'true');
      localStorage.setItem('inv_active_user', JSON.stringify(userToSet));
      
      OfficeInventoryDb.logActivity(foundUser.id_user, `User berhasil masuk ke sistem dengan peran ${foundUser.role}`);

      setTimeout(() => {
        setIsLoginModalOpen(false);
        setActiveTab(pendingTab);
        setLoginUsername('');
        setLoginPassword('');
        setLoginSuccess('');
      }, 1000);
    } else {
      setLoginError('Username atau password yang Anda masukkan salah.');
    }
  };

  const handleQuickLogin = (role: 'Admin' | 'Petugas' | 'Peminjam') => {
    let username = '';
    let password = '';
    if (role === 'Admin') {
      username = 'admin';
      password = 'adminpassword';
    } else if (role === 'Petugas') {
      username = 'petugas';
      password = 'petugaspassword';
    } else {
      username = 'budi';
      password = 'peminjampassword';
    }
    setLoginUsername(username);
    setLoginPassword(password);
    
    // Attempt auto login
    const dbUsers = OfficeInventoryDb.getUsers();
    const foundUser = dbUsers.find(u => u.username === username && u.password === password);
    if (foundUser) {
      const mockRoleMatch = MOCK_ROLES.find(r => r.role === foundUser.role);
      const userToSet = mockRoleMatch 
        ? { ...mockRoleMatch, nama_user: foundUser.nama_user, username: foundUser.username } 
        : { id_user: foundUser.id_user, nama_user: foundUser.nama_user, username: foundUser.username, role: foundUser.role };
      
      setActiveUser(userToSet);
      setIsLoggedIn(true);
      setLoginSuccess(`Selamat datang kembali, ${foundUser.nama_user}!`);
      
      localStorage.setItem('inv_is_logged_in', 'true');
      localStorage.setItem('inv_active_user', JSON.stringify(userToSet));
      
      OfficeInventoryDb.logActivity(foundUser.id_user, `User berhasil masuk (Quick Login) sebagai ${foundUser.role}`);

      setTimeout(() => {
        setIsLoginModalOpen(false);
        setActiveTab(pendingTab);
        setLoginUsername('');
        setLoginPassword('');
        setLoginSuccess('');
      }, 800);
    }
  };

  const handleLogout = () => {
    OfficeInventoryDb.logActivity(activeUser.id_user, `User ${activeUser.nama_user} keluar dari sistem`);
    setIsLoggedIn(false);
    localStorage.removeItem('inv_is_logged_in');
    localStorage.removeItem('inv_active_user');
    setActiveTab('transaksi');
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

        {/* Current Active Simulation User Profile or Guest login trigger */}
        {!isLoggedIn ? (
          <div className="p-4 mx-4 my-3 bg-slate-800/40 border border-slate-800/80 rounded-xl text-xs space-y-2.5 transition-all">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-white uppercase tracking-wider text-[10px]">Akses Publik BMN</div>
                <div className="text-[10px] text-blue-300 font-medium">Sesi Tamu Aktif</div>
              </div>
            </div>
            <button
              id="sidebar-login-btn"
              onClick={() => { setPendingTab('dashboard'); setIsLoginModalOpen(true); }}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <LogIn className="h-3.5 w-3.5" /> Masuk Aplikasi
            </button>
          </div>
        ) : (
          <div 
            onClick={() => handleTabClick('account')}
            className="p-4 mx-4 my-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs space-y-1.5 cursor-pointer transition-all group animate-fade-in"
            title="Buka Manajemen Akun"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-white truncate max-w-[110px] group-hover:text-blue-400 transition-colors">{activeUser.nama_user}</div>
                  <div className="text-[10px] text-gray-400 font-medium italic">@{activeUser.username}</div>
                </div>
              </div>
              <button 
                id="btn-logout"
                title="Log out dari sistem"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="p-1 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
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
        )}

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
          
          {/* Dashboard menu */}
          <div className="space-y-1">
            <button
              id="menu-dashboard"
              onClick={() => handleTabClick('dashboard')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard Utama
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>
          </div>

          {/* Master data */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">MASTER REGISTRASI</span>
            
            {/* Master Barang */}
            <button
              id="menu-barang"
              onClick={() => handleTabClick('barang')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'barang' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="h-4 w-4 shrink-0" /> Master Barang
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>

            {/* Master Kategori */}
            <button
              id="menu-kategori"
              onClick={() => handleTabClick('kategori')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'kategori' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Tag className="h-4 w-4 shrink-0" /> Master Kategori
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>

            {/* Master Peminjam */}
            <button
              id="menu-peminjam"
              onClick={() => handleTabClick('peminjam')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'peminjam' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0" /> Master Peminjam
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>
          </div>

          {/* Transactions */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">MODUL TRANSAKSI</span>
            
            {/* Transaksi Peminjaman (Selalu Terbuka / Publik) */}
            <button
              id="menu-transaksi"
              onClick={() => handleTabClick('transaksi')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'transaksi' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" /> Transaksi Peminjaman
            </button>

            {/* Pengembalian Barang */}
            {(!isLoggedIn || activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
              <button
                id="menu-pengembalian"
                onClick={() => handleTabClick('pengembalian')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'pengembalian' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <RefreshCw className="h-4 w-4 shrink-0" /> Catat Pengembalian
                </span>
                {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
              </button>
            )}

            {/* Riwayat Transaksi */}
            <button
              id="menu-riwayat"
              onClick={() => handleTabClick('riwayat')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'riwayat' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ArrowRightLeft className="h-4 w-4 shrink-0" /> Riwayat Transaksi
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>

            {/* Serah Terima Barang (BAST) */}
            {(!isLoggedIn || activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
              <button
                id="menu-serah-terima"
                onClick={() => handleTabClick('serah_terima')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'serah_terima' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ArrowRightLeft className="h-4 w-4 shrink-0 text-amber-500" /> Serah Terima (BAST)
                </span>
                {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
              </button>
            )}
          </div>

          {/* Reports */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">LAPORAN REKONSILIASI</span>
            
            <button
              id="menu-laporan"
              onClick={() => handleTabClick('laporan')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'laporan' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 shrink-0" /> Laporan Ekspor
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>

            <button
              id="menu-perbaikan"
              onClick={() => handleTabClick('perbaikan')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'perbaikan' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Wrench className="h-4 w-4 shrink-0 text-blue-500" /> Historis Perbaikan BMN
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>
          </div>

          {/* Admin Utilities */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">UTILITAS KEAMANAN</span>
            
            {/* Audit Log (Admin Only) */}
            {(!isLoggedIn || activeUser.role === 'Admin') && (
              <button
                id="menu-audit"
                onClick={() => handleTabClick('audit')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'audit' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ClipboardList className="h-4 w-4 shrink-0" /> Jejak Audit Log
                </span>
                {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
              </button>
            )}

            {/* Backup (Admin Only) */}
            {(!isLoggedIn || activeUser.role === 'Admin') && (
              <button
                id="menu-backup"
                onClick={() => handleTabClick('backup')}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === 'backup' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Database className="h-4 w-4 shrink-0" /> Backup & Restor Database
                </span>
                {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
              </button>
            )}

            {/* Manajemen Akun */}
            <button
              id="menu-account"
              onClick={() => handleTabClick('account')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'account' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <UserIcon className="h-4 w-4 shrink-0" /> Manajemen Akun
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>

            {/* PHP Source Code templates explorer */}
            <button
              id="menu-php"
              onClick={() => handleTabClick('php')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'php' ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Server className="h-4 w-4 shrink-0" /> Backend PHP MVC Code
              </span>
              {!isLoggedIn && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>
          </div>

          {/* Dedicated Logout Menu for Logged In Session */}
          {isLoggedIn && (
            <div className="pt-4 border-t border-slate-800/60 mt-4 space-y-1">
              <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sesi Pengguna</span>
              <button
                id="menu-logout"
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/20 transition duration-150"
              >
                <LogOut className="h-4 w-4 shrink-0 text-rose-400" /> Keluar (Logout)
              </button>
            </div>
          )}

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

            {/* Guest vs Logged In Mobile Header / Swapper */}
            {!isLoggedIn ? (
              <div className="my-4 bg-slate-800 p-3 rounded-xl text-xs space-y-2">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Akses Terbatas (Tamu)</div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setPendingTab('dashboard');
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-1"
                >
                  <LogIn className="h-3.5 w-3.5" /> Masuk Aplikasi
                </button>
              </div>
            ) : (
              /* Swapper shown only when logged in */
              <div className="my-4 bg-slate-800 p-3 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Simulasi Akun:</span>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-rose-400 hover:text-rose-300 font-bold text-[10px] uppercase flex items-center gap-0.5"
                  >
                    <LogOut className="h-3 w-3" /> Keluar
                  </button>
                </div>
                <select
                  id="mob-role-swap"
                  value={activeUser.id_user}
                  onChange={(e) => handleRoleChange(Number(e.target.value))}
                  className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-bold"
                >
                  {MOCK_ROLES.map(r => (
                    <option key={r.id_user} value={r.id_user}>{r.nama_user} ({r.role})</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex-1 space-y-3 font-medium text-xs text-slate-400">
              <button 
                onClick={() => { handleTabClick('dashboard'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-blue-500" /> Dashboard Utama
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('barang'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" /> Master Barang
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('kategori'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-500" /> Master Kategori
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('peminjam'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> Master Peminjam
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('transaksi'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center gap-2 text-white font-bold"
              >
                <ShoppingBag className="h-4 w-4 text-blue-500" /> Transaksi Peminjaman
              </button>

              {(!isLoggedIn || activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
                <button 
                  onClick={() => { handleTabClick('pengembalian'); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left py-1.5 flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" /> Catat Pengembalian
                  </span>
                  {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
                </button>
              )}

              <button 
                onClick={() => { handleTabClick('riwayat'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" /> Riwayat Transaksi
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              {(!isLoggedIn || activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
                <button 
                  onClick={() => { handleTabClick('serah_terima'); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left py-1.5 flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-amber-500" /> Serah Terima (BAST)
                  </span>
                  {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
                </button>
              )}

              <button 
                onClick={() => { handleTabClick('laporan'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" /> Laporan Ekspor
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('perbaikan'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" /> Historis Perbaikan
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('account'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-500" /> Manajemen Akun
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              <button 
                onClick={() => { handleTabClick('php'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" /> Template Backend PHP
                </span>
                {!isLoggedIn && <Lock className="h-3 w-3 text-slate-500" />}
              </button>

              {isLoggedIn && (
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left py-2.5 flex items-center gap-2 text-rose-400 font-bold border-t border-slate-700/50 mt-3 pt-3"
                >
                  <LogOut className="h-4 w-4 text-rose-400" /> Keluar (Logout)
                </button>
              )}
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
          {isLoggedIn ? (
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
              <button 
                id="header-logout-btn"
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-250 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                title="Log out dari sistem"
              >
                <LogOut className="h-3.5 w-3.5" /> Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1.5 bg-amber-50 text-amber-700 text-[10px] uppercase font-bold tracking-wider rounded-lg border border-amber-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Mode Tamu Terbatas
              </span>
              <button 
                onClick={() => { setPendingTab('dashboard'); setIsLoginModalOpen(true); }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-blue-500/15"
              >
                <LogIn className="h-3.5 w-3.5" /> Masuk Aplikasi
              </button>
            </div>
          )}

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

          {activeTab === 'serah_terima' && (
            <SerahTerimaBarang currentUser={activeUser} />
          )}

          {activeTab === 'laporan' && (
            <Laporan currentUser={activeUser} />
          )}

          {activeTab === 'perbaikan' && (
            <PerbaikanCRUD currentUser={activeUser} />
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
        
        {/* LOGIN MODAL */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white relative">
                <button 
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setLoginUsername('');
                    setLoginPassword('');
                    setLoginError('');
                    setLoginSuccess('');
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                  title="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Otentikasi Pengguna</h3>
                    <p className="text-xs text-slate-400">Silakan login untuk mengakses modul terproteksi</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                
                {loginError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                    {loginError}
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                    {loginSuccess}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Username</label>
                  <input 
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
                    placeholder="Masukkan username"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Password</label>
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
                    placeholder="Masukkan password"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginModalOpen(false);
                      setLoginUsername('');
                      setLoginPassword('');
                      setLoginError('');
                      setLoginSuccess('');
                    }}
                    className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="h-4 w-4" /> Masuk
                  </button>
                </div>

                {/* Quick Simulator Accounts */}
                <div className="pt-4 border-t border-gray-100 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Akses Cepat (Developer Bypass)</span>
                    <p className="text-[10px] text-gray-400">Klik salah satu akun simulasi di bawah untuk login instan:</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('Admin')}
                      className="p-2 border border-gray-150 hover:bg-slate-50 hover:border-blue-300 rounded-xl text-left transition space-y-0.5 group"
                    >
                      <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider block group-hover:text-blue-700">ADMIN</span>
                      <span className="text-[8px] text-gray-500 block font-mono">u: admin</span>
                      <span className="text-[8px] text-gray-500 block font-mono">p: admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('Petugas')}
                      className="p-2 border border-gray-150 hover:bg-slate-50 hover:border-emerald-300 rounded-xl text-left transition space-y-0.5 group"
                    >
                      <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider block group-hover:text-emerald-700">PETUGAS</span>
                      <span className="text-[8px] text-gray-500 block font-mono">u: petugas</span>
                      <span className="text-[8px] text-gray-500 block font-mono">p: petugas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('Peminjam')}
                      className="p-2 border border-gray-150 hover:bg-slate-50 hover:border-amber-300 rounded-xl text-left transition space-y-0.5 group"
                    >
                      <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider block group-hover:text-amber-700">PEMINJAM</span>
                      <span className="text-[8px] text-gray-500 block font-mono">u: budi</span>
                      <span className="text-[8px] text-gray-500 block font-mono">p: budi</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
