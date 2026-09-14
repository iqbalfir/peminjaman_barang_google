/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  UserCog,
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
import LoginScreen from './components/LoginScreen';

import { registerOnDataWrite } from './dbMock';

// Mock users for simulation
const MOCK_ROLES = [
  { id_user: 1, nama_user: 'Heri Santoso', username: 'admin_heri', role: 'Admin' },
  { id_user: 2, nama_user: 'Aris Munandar', username: 'petugas_aris', role: 'Petugas' },
  { id_user: 3, nama_user: 'Budi Setiawan', username: 'peminjam_budi', role: 'Peminjam' }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('inv_is_logged_in');
    return saved !== null ? saved === 'true' : true;
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [activeUser, setActiveUser] = useState(() => {
    const savedUser = localStorage.getItem('inv_active_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return MOCK_ROLES[0]; // default Admin
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'barang' | 'kategori' | 'peminjam' | 'transaksi' | 'pengembalian' | 'riwayat' | 'laporan' | 'audit' | 'backup' | 'php' | 'account' | 'serah_terima' | 'perbaikan'>('dashboard');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // PostgreSQL Cloud SQL Auto-sync States
  const [isSyncingInitial, setIsSyncingInitial] = useState(true);
  const [syncStatusMsg, setSyncStatusMsg] = useState('Menghubungkan ke PostgreSQL Cloud SQL...');
  const [updateKey, setUpdateKey] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Sesaat yang lalu');
  const [isSyncingManual, setIsSyncingManual] = useState<boolean>(false);

  // Available users for simulation & authentication
  const availableUsers = useMemo(() => {
    const dbUsers = OfficeInventoryDb.getUsers();
    return dbUsers && dbUsers.length > 0 ? dbUsers : MOCK_ROLES;
  }, [updateKey]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<'dashboard' | 'barang' | 'kategori' | 'peminjam' | 'transaksi' | 'pengembalian' | 'riwayat' | 'laporan' | 'audit' | 'backup' | 'php' | 'account' | 'serah_terima' | 'perbaikan'>('dashboard');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Fetch initial database state from Cloud SQL on mount
  useEffect(() => {
    async function loadInitialDb() {
      try {
        setSyncStatusMsg('Memeriksa konektivitas Cloud SQL PostgreSQL...');
        const statusRes = await fetch(`/api/cloudsql/status?t=${Date.now()}`);
        if (!statusRes.ok) {
          throw new Error('Database server tidak merespons status.');
        }
        const statusData = await statusRes.json();
        
        if (statusData.status === 'Connected') {
          const counts = statusData.counts || {};
          const isDbEmpty = !counts.kategori && !counts.barang && !counts.peminjam && !counts.users;
          
          if (isDbEmpty) {
            setSyncStatusMsg('Sinkronisasi pertama kali: Mengunggah basis data lokal awal ke Cloud SQL...');
            // Cloud SQL is completely empty, so we seed it with our local default/current data
            const seedData = {
              kategori: OfficeInventoryDb.getKategori(),
              barang: OfficeInventoryDb.getBarang(),
              peminjam: OfficeInventoryDb.getPeminjam(),
              users: OfficeInventoryDb.getUsers(),
              peminjaman: OfficeInventoryDb.getPeminjaman(),
              detail_peminjaman: OfficeInventoryDb.getDetailPeminjaman(),
              pengembalian: OfficeInventoryDb.getPengembalian(),
              audit_log: OfficeInventoryDb.getAuditLog(),
              serah_terima: OfficeInventoryDb.getSerahTerima(),
              detail_serah_terima: OfficeInventoryDb.getDetailSerahTerima(),
              perbaikan: OfficeInventoryDb.getPerbaikan(),
            };
            
            const seedRes = await fetch('/api/cloudsql/export', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seedData),
            });
            if (!seedRes.ok) {
              console.error('Failed to seed empty Cloud SQL database:', await seedRes.text());
            } else {
              console.log('Successfully seeded Cloud SQL database with initial local data.');
            }
          } else {
            setSyncStatusMsg('Menyinkronkan data terbaru dari Cloud SQL PostgreSQL...');
            const importRes = await fetch(`/api/cloudsql/import?t=${Date.now()}`);
            if (importRes.ok) {
              const importedData = await importRes.json();
              
              const saveToLocal = (key: string, dataArray: any[]) => {
                if (dataArray && Array.isArray(dataArray)) {
                  localStorage.setItem(key, JSON.stringify(dataArray));
                }
              };
              
              saveToLocal('inv_kategori', importedData.kategori);
              saveToLocal('inv_barang', importedData.barang);
              saveToLocal('inv_peminjam', importedData.peminjam);
              saveToLocal('inv_users', importedData.users);
              saveToLocal('inv_peminjaman', importedData.peminjaman);
              saveToLocal('inv_detail_peminjaman', importedData.detail_peminjaman);
              saveToLocal('inv_pengembalian', importedData.pengembalian);
              saveToLocal('inv_audit_log', importedData.audit_log);
              saveToLocal('inv_serah_terima', importedData.serah_terima);
              saveToLocal('inv_detail_serah_terima', importedData.detail_serah_terima);
              saveToLocal('inv_perbaikan', importedData.perbaikan);
              
              const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setLastSyncTime(nowStr);
              console.log('Successfully imported and synchronized data from Cloud SQL PostgreSQL.');
            } else {
              console.error('Failed to import data from Cloud SQL:', await importRes.text());
            }
          }
        } else {
          console.warn('Cloud SQL is disconnected in status check. Using offline local state.');
        }
      } catch (err) {
        console.error('Initial Cloud SQL load failed, falling back to offline local storage:', err);
      } finally {
        setIsSyncingInitial(false);
      }
    }
    
    loadInitialDb();
  }, []);

  // Poll Cloud SQL PostgreSQL database for updates periodically (Real-time Background Synchronization)
  useEffect(() => {
    let pollInterval: any = null;

    async function checkAndSyncFromDb() {
      // Only poll when browser window/tab is active and visible
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        const importRes = await fetch(`/api/cloudsql/import?t=${Date.now()}`);
        if (importRes.ok) {
          const importedData = await importRes.json();
          
          let hasChanges = false;
          
          const checkAndSave = (key: string, cloudData: any[]) => {
            if (!cloudData || !Array.isArray(cloudData)) return;
            const localDataStr = localStorage.getItem(key);
            const cloudDataStr = JSON.stringify(cloudData);
            if (localDataStr !== cloudDataStr) {
              localStorage.setItem(key, cloudDataStr);
              hasChanges = true;
            }
          };
          
          checkAndSave('inv_kategori', importedData.kategori);
          checkAndSave('inv_barang', importedData.barang);
          checkAndSave('inv_peminjam', importedData.peminjam);
          checkAndSave('inv_users', importedData.users);
          checkAndSave('inv_peminjaman', importedData.peminjaman);
          checkAndSave('inv_detail_peminjaman', importedData.detail_peminjaman);
          checkAndSave('inv_pengembalian', importedData.pengembalian);
          checkAndSave('inv_audit_log', importedData.audit_log);
          checkAndSave('inv_serah_terima', importedData.serah_terima);
          checkAndSave('inv_detail_serah_terima', importedData.detail_serah_terima);
          checkAndSave('inv_perbaikan', importedData.perbaikan);
          
          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(nowStr);

          if (hasChanges) {
            console.log('Detected cloud database updates! Refreshing UI view...');
            setUpdateKey(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error('Background database poll failed:', err);
      }
    }

    // Delay start of polling to avoid overlapping with initial mount load
    const startTimeout = setTimeout(() => {
      // Poll every 8 seconds for responsive cross-device updates
      pollInterval = setInterval(checkAndSyncFromDb, 8000);
    }, 5000);

    return () => {
      clearTimeout(startTimeout);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  // Expose a manual sync trigger for the Dashboard and other components
  const triggerManualSync = async (): Promise<boolean> => {
    try {
      const importRes = await fetch(`/api/cloudsql/import?t=${Date.now()}`);
      if (importRes.ok) {
        const importedData = await importRes.json();
        
        const saveToLocal = (key: string, dataArray: any[]) => {
          if (dataArray && Array.isArray(dataArray)) {
            localStorage.setItem(key, JSON.stringify(dataArray));
          }
        };
        
        saveToLocal('inv_kategori', importedData.kategori);
        saveToLocal('inv_barang', importedData.barang);
        saveToLocal('inv_peminjam', importedData.peminjam);
        saveToLocal('inv_users', importedData.users);
        saveToLocal('inv_peminjaman', importedData.peminjaman);
        saveToLocal('inv_detail_peminjaman', importedData.detail_peminjaman);
        saveToLocal('inv_pengembalian', importedData.pengembalian);
        saveToLocal('inv_audit_log', importedData.audit_log);
        saveToLocal('inv_serah_terima', importedData.serah_terima);
        saveToLocal('inv_detail_serah_terima', importedData.detail_serah_terima);
        saveToLocal('inv_perbaikan', importedData.perbaikan);
        
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(nowStr);
        setUpdateKey(prev => prev + 1);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Manual sync failed:', err);
      return false;
    }
  };

  // Automatically sync to Cloud SQL PostgreSQL whenever write operations occur
  useEffect(() => {
    let syncTimeout: any = null;

    // Register local storage write observer
    registerOnDataWrite(() => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      syncTimeout = setTimeout(async () => {
        try {
          const data = {
            kategori: OfficeInventoryDb.getKategori(),
            barang: OfficeInventoryDb.getBarang(),
            peminjam: OfficeInventoryDb.getPeminjam(),
            users: OfficeInventoryDb.getUsers(),
            peminjaman: OfficeInventoryDb.getPeminjaman(),
            detail_peminjaman: OfficeInventoryDb.getDetailPeminjaman(),
            pengembalian: OfficeInventoryDb.getPengembalian(),
            audit_log: OfficeInventoryDb.getAuditLog(),
            serah_terima: OfficeInventoryDb.getSerahTerima(),
            detail_serah_terima: OfficeInventoryDb.getDetailSerahTerima(),
            perbaikan: OfficeInventoryDb.getPerbaikan(),
          };

          const res = await fetch('/api/cloudsql/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            console.error('Failed to auto-sync to Cloud SQL:', await res.text());
          } else {
            console.log('Automatically synchronized data to Cloud SQL PostgreSQL database.');
          }
        } catch (err) {
          console.error('Error auto-syncing to Cloud SQL:', err);
        }
      }, 1000); // 1s debounce
    });

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
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
    const allUsers = OfficeInventoryDb.getUsers();
    const found = allUsers.find(r => r.id_user === userId) || MOCK_ROLES.find(r => r.id_user === userId);
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
    setActiveTab(tab);
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
  };

  const handleQuickLogin = (role: 'Admin' | 'Petugas' | 'Peminjam') => {};

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    OfficeInventoryDb.logActivity(
      activeUser.id_user,
      `Pengguna "${activeUser.nama_user}" (${activeUser.role}) keluar (logout) dari sesi sistem`
    );
    setIsLoggedIn(false);
    localStorage.setItem('inv_is_logged_in', 'false');
    setIsLogoutModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLoginSuccess = (user: any) => {
    setActiveUser(user);
    localStorage.setItem('inv_active_user', JSON.stringify(user));
    setIsLoggedIn(true);
    localStorage.setItem('inv_is_logged_in', 'true');
    setUpdateKey(prev => prev + 1);
  };

  if (isSyncingInitial) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-600/10 text-blue-500 rounded-3xl border border-blue-500/20 animate-pulse">
              <Database className="h-12 w-12" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">SINVENT OFFICE</h1>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Sistem Inventaris Kantor & Cloud Sync</p>
          </div>
          
          <div className="p-5 bg-slate-800/50 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-slate-300">{syncStatusMsg}</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 leading-normal">
            Sistem mendeteksi database terhubung. Data disinkronkan secara real-time dengan PostgreSQL di Cloud SQL untuk memastikan konsistensi multi-user.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
                <div className="font-bold text-white truncate max-w-[140px] group-hover:text-blue-400 transition-colors">{activeUser.nama_user}</div>
                <div className="text-[10px] text-gray-400 font-medium italic">@{activeUser.username}</div>
              </div>
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
              onClick={() => handleTabClick('dashboard')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard Utama
              </span>
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
            {(activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
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
            </button>

            {/* Serah Terima Barang (BAST) */}
            {(activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
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
            </button>
          </div>

          {/* Admin Utilities */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">UTILITAS KEAMANAN</span>
            
            {/* Audit Log (Admin Only) */}
            {activeUser.role === 'Admin' && (
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
              </button>
            )}

            {/* Backup (Admin Only) */}
            {activeUser.role === 'Admin' && (
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
              </button>
            )}

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
            </button>
          </div>

          {/* User Management Section */}
          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">PENGATURAN PENGGUNA</span>
            
            {/* Manajemen Akun Pengguna */}
            <button
              id="menu-account"
              onClick={() => handleTabClick('account')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                activeTab === 'account' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <UserCog className="h-4 w-4 shrink-0 text-blue-400" /> Manajemen Akun Pengguna
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${activeTab === 'account' ? 'bg-blue-700 text-white' : 'bg-blue-500/20 text-blue-300'}`}>
                RBAC
              </span>
            </button>

            {/* Menu Keluar / Logout */}
            <button
              id="menu-logout"
              onClick={handleLogout}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition group"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="h-4 w-4 shrink-0 text-rose-400 group-hover:text-rose-300" /> Keluar dari Sistem
              </span>
              <span className="text-[10px] bg-rose-500/15 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                Logout
              </span>
            </button>
          </div>

        </nav>

        {/* Sidebar Sticky User Session Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                {activeUser.nama_user.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate leading-tight">{activeUser.nama_user}</div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium">
                  <span className="text-emerald-400">●</span> {activeUser.role}
                </div>
              </div>
            </div>
            <button
              id="sidebar-footer-logout"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition shrink-0"
              title="Keluar dari Sistem (Logout)"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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

            {/* Account Simulation Swapper */}
            <div className="my-4 bg-slate-800 p-3 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Simulasi Akun:</span>
              </div>
              <select
                id="mob-role-swap"
                value={activeUser.id_user}
                onChange={(e) => handleRoleChange(Number(e.target.value))}
                className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-bold"
              >
                {availableUsers.map(r => (
                  <option key={r.id_user} value={r.id_user}>{r.nama_user} ({r.role})</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 space-y-3 font-medium text-xs text-slate-400">
              <button 
                onClick={() => { handleTabClick('dashboard'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-blue-500" /> Dashboard Utama
                </span>
              </button>

              <button 
                onClick={() => { handleTabClick('barang'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" /> Master Barang
                </span>
              </button>

              <button 
                onClick={() => { handleTabClick('kategori'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-500" /> Master Kategori
                </span>
              </button>

              <button 
                onClick={() => { handleTabClick('peminjam'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> Master Peminjam
                </span>
              </button>

              <button 
                onClick={() => { handleTabClick('transaksi'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center gap-2 text-white font-bold"
              >
                <ShoppingBag className="h-4 w-4 text-blue-500" /> Transaksi Peminjaman
              </button>

              {(activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
                <button 
                  onClick={() => { handleTabClick('pengembalian'); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left py-1.5 flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" /> Catat Pengembalian
                  </span>
                </button>
              )}

              <button 
                onClick={() => { handleTabClick('riwayat'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" /> Riwayat Transaksi
                </span>
              </button>

              {(activeUser.role === 'Admin' || activeUser.role === 'Petugas') && (
                <button 
                  onClick={() => { handleTabClick('serah_terima'); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left py-1.5 flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-amber-500" /> Serah Terima (BAST)
                  </span>
                </button>
              )}

              <button 
                onClick={() => { handleTabClick('laporan'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" /> Laporan Ekspor
                </span>
              </button>

              <button 
                onClick={() => { handleTabClick('perbaikan'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" /> Historis Perbaikan
                </span>
              </button>

              <button 
                onClick={() => { handleTabClick('account'); setIsMobileMenuOpen(false); }} 
                className={`w-full text-left py-2 px-2.5 rounded-lg flex items-center justify-between gap-2 transition ${
                  activeTab === 'account' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UserCog className="h-4 w-4 text-blue-400" /> Manajemen Akun Pengguna
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">RBAC</span>
              </button>

              <button 
                onClick={() => { handleTabClick('php'); setIsMobileMenuOpen(false); }} 
                className="w-full text-left py-1.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" /> Template Backend PHP
                </span>
              </button>

              {/* Menu Logout Mobile Drawer */}
              <div className="pt-3 border-t border-slate-800">
                <button 
                  id="mob-logout-btn"
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} 
                  className="w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <LogOut className="h-4 w-4 text-rose-400" /> Keluar dari Sistem
                  </span>
                  <span className="text-[10px] bg-rose-500/15 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">Logout</span>
                </button>
              </div>
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

          {/* Quick Actions & Simulation controller widget (Role Switcher & Logout) */}
          <div className="flex items-center gap-3">
            {/* Manajemen Akun Pengguna Quick Access Button */}
            <button
              id="header-btn-account"
              onClick={() => handleTabClick('account')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'account' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' 
                  : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-gray-200'
              }`}
              title="Buka Manajemen Akun Pengguna & Hak Akses (RBAC)"
            >
              <UserCog className={`h-4 w-4 ${activeTab === 'account' ? 'text-white' : 'text-blue-600'}`} />
              <span>Manajemen Akun Pengguna</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                activeTab === 'account' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                RBAC
              </span>
            </button>

            <div className="h-6 w-px bg-gray-200"></div>

            <div className="flex items-center gap-2">
              <div className="text-right text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider block text-[9px]">Ganti Hak Akses Akun</span>
                <span className="text-gray-600 font-medium">Beralih peran simulasi</span>
              </div>
              <select 
                id="desktop-role-swap"
                value={activeUser.id_user}
                onChange={(e) => handleRoleChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-700"
              >
                {availableUsers.map(r => (
                  <option key={r.id_user} value={r.id_user}>
                    Simulasi: {r.nama_user} ({r.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-gray-200"></div>

            {/* Logout Header Button */}
            <button
              id="header-btn-logout"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Keluar dari sesi akun saat ini (Logout)"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span>Keluar (Logout)</span>
            </button>
          </div>

        </header>

        {/* WORKSPACE CONTENT MAIN COMPONENT MOUNT */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-[1440px] w-full mx-auto" key={updateKey}>
          
          {/* TAB BINDER SWITCH MOUNT */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              currentUser={activeUser}
              setActiveTab={(tab) => setActiveTab(tab as any)}
              triggerSync={triggerManualSync}
              isSyncingManual={isSyncingManual}
              setIsSyncingManual={setIsSyncingManual}
              lastSyncTime={lastSyncTime}
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
              onUpdateUser={(updatedUser) => {
                setActiveUser(updatedUser);
                localStorage.setItem('inv_active_user', JSON.stringify(updatedUser));
                setUpdateKey(prev => prev + 1);
              }}
              onSwitchUser={(targetUser) => {
                setActiveUser(targetUser);
                localStorage.setItem('inv_active_user', JSON.stringify(targetUser));
                setUpdateKey(prev => prev + 1);
              }}
              onLogout={handleLogout}
            />
          )}

        </main>
        


      </div>

      {/* MODAL KONFIRMASI KELUAR SISTEM (LOGOUT) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 space-y-5 animate-scale-in">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-150 flex items-center justify-center shadow-xs">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Keluar Sistem</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin mengakhiri sesi untuk akun <span className="font-bold text-slate-800">{activeUser.nama_user}</span>? Anda perlu masuk kembali untuk mengakses sistem inventaris.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-600 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Pengguna:</span>
                <span className="font-bold text-slate-800">@{activeUser.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Peran / Hak Akses:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  activeUser.role === 'Admin' ? 'bg-blue-600 text-white' :
                  activeUser.role === 'Petugas' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                }`}>
                  {activeUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Status Basis Data:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Tersimpan di Cloud SQL
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                id="btn-confirm-logout"
                type="button"
                onClick={handleLogoutConfirm}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Ya, Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
