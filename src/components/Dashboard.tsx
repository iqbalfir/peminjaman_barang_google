/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, ArrowUpRight, Users, AlertTriangle, Clock, History, TrendingUp, HelpCircle, Database, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Barang, Peminjaman, AuditLog, Peminjam, DetailPeminjaman } from '../types';

interface DashboardProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
  setActiveTab: (tab: string) => void;
  triggerSync?: () => Promise<boolean>;
  isSyncingManual?: boolean;
  setIsSyncingManual?: (val: boolean) => void;
  lastSyncTime?: string;
}

export default function Dashboard({ 
  currentUser, 
  setActiveTab, 
  triggerSync, 
  isSyncingManual, 
  setIsSyncingManual, 
  lastSyncTime = 'Sesaat yang lalu' 
}: DashboardProps) {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [detailPeminjamanList, setDetailPeminjamanList] = useState<DetailPeminjaman[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamanList(OfficeInventoryDb.getPeminjaman());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
    setDetailPeminjamanList(OfficeInventoryDb.getDetailPeminjaman());
    setAuditLogs(OfficeInventoryDb.getAuditLog().slice(0, 5));
  }, []);

  const handleManualSync = async () => {
    if (setIsSyncingManual) {
      setIsSyncingManual(true);
    }
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      if (triggerSync) {
        const ok = await triggerSync();
        if (ok) {
          setSyncStatus('success');
          // Reload internal state from LocalStorage after sync completes successfully
          setBarangList(OfficeInventoryDb.getBarang());
          setPeminjamanList(OfficeInventoryDb.getPeminjaman());
          setPeminjamList(OfficeInventoryDb.getPeminjam());
          setDetailPeminjamanList(OfficeInventoryDb.getDetailPeminjaman());
          setAuditLogs(OfficeInventoryDb.getAuditLog().slice(0, 5));
        } else {
          setSyncStatus('error');
        }
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      if (setIsSyncingManual) {
        setIsSyncingManual(false);
      }
    }
  };

  // Calculations
  const totalBarang = barangList.length;
  const barangTersedia = barangList.filter(b => b.stok > 0 && b.status_ketersediaan !== 'Tidak Aktif').length;
  const barangDipinjam = barangList.filter(b => b.stok === 0 || b.status_ketersediaan === 'Dipinjam').length;
  const totalPeminjam = peminjamList.length;
  const transaksiAktif = peminjamanList.filter(p => p.status === 'Dipinjam' || p.status === 'Sebagian Kembali').length;
  const barangRusak = barangList.filter(b => b.kondisi_barang !== 'Baik').length;

  // Damaged items with pagination (maksimal 10 unit per halaman)
  const rusakItems = barangList.filter(b => b.kondisi_barang !== 'Baik');
  const itemsPerPage = 10;
  const totalPages = Math.ceil(rusakItems.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRusakItems = rusakItems.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  const startItem = rusakItems.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, rusakItems.length);

  // Limited visible page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, safeCurrentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  // Late borrowings (tanggal_rencana_kembali is past 2026-06-28 and status is not 'Selesai')
  const currentDate = new Date('2026-06-28');
  const lateBorrowings = peminjamanList.filter(p => {
    const rDate = new Date(p.tanggal_rencana_kembali);
    return rDate < currentDate && p.status !== 'Selesai';
  });

  // Find the year dynamically based on available loans or default to current local year
  const currentYear = (() => {
    if (peminjamanList.length === 0) return new Date().getFullYear();
    const years = peminjamanList
      .map(p => {
        if (!p.tanggal_pinjam) return 0;
        const parts = p.tanggal_pinjam.split('-');
        return parts.length > 0 ? parseInt(parts[0], 10) : 0;
      })
      .filter(y => !isNaN(y) && y > 0);
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  })();

  // Year selector state (defaults to calculated currentYear)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Available years from the data
  const availableYears = (() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear()); // Always allow current year
    peminjamanList.forEach(p => {
      if (p.tanggal_pinjam) {
        const parts = p.tanggal_pinjam.split('-');
        if (parts.length > 0) {
          const y = parseInt(parts[0], 10);
          if (!isNaN(y) && y > 0) {
            yearsSet.add(y);
          }
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  })();

  // Synchronize selectedYear when currentYear or availableYears changes
  useEffect(() => {
    if (availableYears.includes(currentYear)) {
      setSelectedYear(currentYear);
    } else if (availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [peminjamanList, currentYear]);

  // Chart 1: Monthly loan counts calculated dynamically
  const getMonthlyLoanCount = (monthNum: number, yearNum: number) => {
    return peminjamanList.filter(p => {
      if (!p.tanggal_pinjam) return false;
      const dateParts = p.tanggal_pinjam.split('-');
      if (dateParts.length < 2) return false;
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      return year === yearNum && month === monthNum;
    }).length;
  };

  const monthlyData = [
    { month: 'Jan', count: getMonthlyLoanCount(1, selectedYear) },
    { month: 'Feb', count: getMonthlyLoanCount(2, selectedYear) },
    { month: 'Mar', count: getMonthlyLoanCount(3, selectedYear) },
    { month: 'Apr', count: getMonthlyLoanCount(4, selectedYear) },
    { month: 'Mei', count: getMonthlyLoanCount(5, selectedYear) },
    { month: 'Jun', count: getMonthlyLoanCount(6, selectedYear) },
    { month: 'Jul', count: getMonthlyLoanCount(7, selectedYear) },
    { month: 'Agt', count: getMonthlyLoanCount(8, selectedYear) },
    { month: 'Sep', count: getMonthlyLoanCount(9, selectedYear) },
    { month: 'Okt', count: getMonthlyLoanCount(10, selectedYear) },
    { month: 'Nov', count: getMonthlyLoanCount(11, selectedYear) },
    { month: 'Des', count: getMonthlyLoanCount(12, selectedYear) },
  ];

  // Chart 2: Most Borrowed Goods calculated dynamically from detailPeminjamanList
  const barangCounts: { [key: number]: number } = {};
  detailPeminjamanList.forEach(dp => {
    barangCounts[dp.id_barang] = (barangCounts[dp.id_barang] || 0) + dp.jumlah_pinjam;
  });

  const sortedBarang = Object.keys(barangCounts)
    .map(idStr => {
      const id = parseInt(idStr, 10);
      const barang = barangList.find(b => b.id_barang === id);
      return {
        name: barang ? barang.nama_barang : `Barang ID ${id}`,
        count: barangCounts[id]
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topBorrowed = sortedBarang.length > 0 ? sortedBarang : [
    { name: 'Belum ada data peminjaman', count: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat Datang Kembali, {currentUser?.nama_user}!</h1>
          <p className="text-blue-100 mt-1">Sistem Informasi Peminjaman Barang & Inventaris Kantor Direktorat SI. Anda login sebagai <span className="font-semibold px-2 py-0.5 bg-blue-600 rounded text-xs tracking-wide">{currentUser?.role.toUpperCase()}</span></p>
        </div>
        <div className="flex gap-2">
          <button 
            id="quick-pinjam-btn"
            onClick={() => setActiveTab('peminjaman')}
            className="px-4 py-2 bg-white text-blue-800 rounded-xl font-medium shadow hover:bg-blue-50 transition text-sm flex items-center gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4" /> Tambah Peminjaman
          </button>
          <button 
            id="quick-kembali-btn"
            onClick={() => setActiveTab('pengembalian')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow hover:bg-blue-500 transition text-sm flex items-center gap-1.5 border border-blue-500"
          >
            <History className="h-4 w-4" /> Catat Pengembalian
          </button>
        </div>
      </div>

      {/* Real-time Cloud SQL Sync Status Widget */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-3.5 rounded-2xl ${isSyncing ? 'bg-blue-600/25 text-blue-400' : 'bg-emerald-600/25 text-emerald-400'} border border-slate-700/50 shrink-0`}>
            {isSyncing ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <Database className="h-6 w-6 text-emerald-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Koneksi PostgreSQL Cloud SQL</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Terhubung
              </span>
              {syncStatus === 'success' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                  Sinkronisasi Berhasil
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Gagal Sinkronisasi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Sistem menyinkronkan data secara otomatis. Klik tombol di kanan untuk memaksa pembaruan data instan antar perangkat/browser.
            </p>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 flex-wrap">
              <span>Status: <strong className="text-slate-300">Auto-Polling (8 Detik)</strong></span>
              <span>•</span>
              <span>Terakhir Sinkron: <strong className="text-blue-400 font-mono">{lastSyncTime}</strong></span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
          <button
            id="btn-trigger-sync"
            disabled={isSyncing}
            onClick={handleManualSync}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto ${
              isSyncing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-95'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </button>
        </div>
      </div>

      {/* Overdue Warnings if any */}
      {lateBorrowings.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>Pemberitahuan Keterlambatan Pengembalian ({lateBorrowings.length} Transaksi)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-amber-700 pl-7">
            {lateBorrowings.map(b => {
              const borrower = peminjamList.find(p => p.id_peminjam === b.id_peminjam);
              const diffTime = Math.abs(currentDate.getTime() - new Date(b.tanggal_rencana_kembali).getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return (
                <div key={b.id_peminjaman} className="bg-white/60 p-2 rounded border border-amber-200/50 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{b.nomor_peminjaman}</span> - {borrower?.nama_lengkap}
                    <div className="text-xs text-amber-600">Jatuh tempo: {b.tanggal_rencana_kembali}</div>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                    Terlambat {diffDays} Hari
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Barang */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Barang</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{totalBarang}</h3>
            <p className="text-xs text-gray-400 mt-1">Barang Terdaftar</p>
          </div>
        </div>

        {/* Barang Tersedia */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tersedia</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-emerald-600">{barangTersedia}</h3>
            <p className="text-xs text-emerald-500 mt-1">Kondisi Baik</p>
          </div>
        </div>

        {/* Barang Dipinjam */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dipinjam</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-indigo-600">{barangDipinjam}</h3>
            <p className="text-xs text-indigo-500 mt-1">Sedang Diluar</p>
          </div>
        </div>

        {/* Total Peminjam */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Peminjam</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{totalPeminjam}</h3>
            <p className="text-xs text-teal-600 mt-1">Pegawai Aktif</p>
          </div>
        </div>

        {/* Transaksi Aktif */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trans Aktif</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-violet-700">{transaksiAktif}</h3>
            <p className="text-xs text-violet-500 mt-1">Belum Kembali</p>
          </div>
        </div>

        {/* Barang Rusak */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Barang Rusak</span>
            <div className={`p-2 rounded-xl ${barangRusak > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold ${barangRusak > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{barangRusak}</h3>
            <p className="text-xs text-rose-500 mt-1">Butuh Perbaikan</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Peminjaman per Bulan */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                Grafik Peminjaman Barang
              </h2>
              <p className="text-xs text-gray-500">Volume transaksi peminjaman per bulan (Tahun {selectedYear})</p>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Year Selector Dropdown */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1 text-xs font-semibold border border-gray-200 rounded-lg text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp className="h-3.5 w-3.5" /> Berjalan Dinamis
              </div>
            </div>
          </div>

          {/* Chart Workspace Area */}
          <div className="h-64 w-full relative border border-slate-50 rounded-xl bg-slate-50/20 p-4 flex flex-col justify-between">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pt-6 px-4">
              <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
              <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
              <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
              <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
            </div>

            {monthlyData.some(m => m.count > 0) ? (
              <div className="h-full w-full flex items-end justify-between pt-4 px-1 gap-1 z-10">
                {monthlyData.map((d, index) => {
                  const maxVal = Math.max(...monthlyData.map(m => m.count)) || 1;
                  const percentage = (d.count / maxVal) * 80; // Scale to 80% max height
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      {d.count > 0 && (
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-950 text-white text-[10px] sm:text-xs px-2 py-1 rounded shadow-md pointer-events-none z-20 font-mono whitespace-nowrap">
                          {d.count} Transaksi
                        </div>
                      )}
                      {/* Bar */}
                      <div 
                        style={{ height: `${Math.max(percentage, d.count > 0 ? 6 : 0)}%` }}
                        className={`w-3.5 sm:w-6 md:w-8 lg:w-10 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xs sm:rounded-t-md group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-300 shadow-xs ${
                          d.count > 0 ? 'opacity-100 scale-x-100' : 'opacity-15 bg-slate-300'
                        }`}
                      ></div>
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-2 z-10 px-0.5 rounded-sm bg-white/80 backdrop-blur-xs">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 z-10">
                <History className="h-10 w-10 text-slate-300 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Transaksi Peminjaman</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                  Tidak ditemukan data peminjaman barang untuk tahun {selectedYear}. Silakan tambah transaksi baru di modul peminjaman.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Top Borrowed Items */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-1">Barang Paling Sering Dipinjam</h2>
          <p className="text-xs text-gray-500 mb-4">Peringkat inventaris dengan utilitas tertinggi</p>

          <div className="space-y-4">
            {topBorrowed.map((item, idx) => {
              const maxVal = topBorrowed[0]?.count || 1;
              const widthPct = (item.count / maxVal) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="text-gray-500 font-mono">{item.count} Kali</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        idx === 0 ? 'from-blue-600 to-blue-500' :
                        idx === 1 ? 'from-indigo-600 to-indigo-500' :
                        idx === 2 ? 'from-purple-600 to-purple-500' :
                        'from-teal-600 to-teal-500'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warnings & Audit Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Damaged Items Watch */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Pemantauan Barang Rusak</h2>
              <p className="text-xs text-gray-500">Daftar inventaris dengan kondisi rusak ringan/berat</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
              {barangRusak} Unit Rusak
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 font-semibold">Kode</th>
                  <th className="py-2.5 font-semibold">Nama Barang</th>
                  <th className="py-2.5 font-semibold text-center">Lokasi</th>
                  <th className="py-2.5 font-semibold text-center">Kondisi</th>
                  <th className="py-2.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rusakItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                      Seluruh barang dalam kondisi Baik.
                    </td>
                  </tr>
                ) : (
                  paginatedRusakItems.map(item => (
                    <tr key={item.id_barang} className="hover:bg-gray-50/50 transition">
                      <td className="py-2.5 font-mono text-xs text-blue-600 font-semibold">{item.kode_barang}</td>
                      <td className="py-2.5 font-medium text-gray-900">{item.nama_barang}</td>
                      <td className="py-2.5 text-center text-gray-500 font-mono text-xs">{item.lokasi_penyimpanan}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.kondisi_barang === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.kondisi_barang}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status_ketersediaan === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {item.status_ketersediaan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {rusakItems.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
              <span className="text-xs text-gray-500 font-medium">
                Menampilkan <strong className="text-gray-900">{startItem}</strong> - <strong className="text-gray-900">{endItem}</strong> dari <strong className="text-gray-900">{rusakItems.length}</strong> unit
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="btn-damaged-prev"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {visiblePages.map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-all ${
                        safeCurrentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  id="btn-damaged-next"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                  title="Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Activity Log (Audit Log) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Aktivitas Sistem Terkini (Audit Log)</h2>
              <p className="text-xs text-gray-500">Mencatat riwayat login, logout, dan transaksi user</p>
            </div>
            <button 
              id="view-all-logs-btn"
              onClick={() => setActiveTab('audit')} 
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {auditLogs.map((log) => (
              <div key={log.id_log} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg mt-0.5 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 break-words">{log.aktivitas}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="font-medium text-gray-500">{log.tanggal}</span>
                    <span>•</span>
                    <span className="font-mono bg-gray-100 text-gray-600 px-1 rounded text-[10px]">{log.ip_address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
