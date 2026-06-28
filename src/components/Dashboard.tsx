/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, ArrowUpRight, Users, AlertTriangle, Clock, History, TrendingUp, HelpCircle } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Barang, Peminjaman, AuditLog, Peminjam } from '../types';

interface DashboardProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ currentUser, setActiveTab }: DashboardProps) {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamanList(OfficeInventoryDb.getPeminjaman());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
    setAuditLogs(OfficeInventoryDb.getAuditLog().slice(0, 5));
  }, []);

  // Calculations
  const totalBarang = barangList.length;
  const barangTersedia = barangList.filter(b => b.stok > 0 && b.status_ketersediaan !== 'Tidak Aktif').length;
  const barangDipinjam = barangList.filter(b => b.stok === 0 || b.status_ketersediaan === 'Dipinjam').length;
  const totalPeminjam = peminjamList.length;
  const transaksiAktif = peminjamanList.filter(p => p.status === 'Dipinjam' || p.status === 'Sebagian Kembali').length;
  const stokMenipis = barangList.filter(b => b.stok <= b.stok_minimum).length;

  // Stock warning items
  const lowStockItems = barangList.filter(b => b.stok <= b.stok_minimum);

  // Late borrowings (tanggal_rencana_kembali is past 2026-06-28 and status is not 'Selesai')
  const currentDate = new Date('2026-06-28');
  const lateBorrowings = peminjamanList.filter(p => {
    const rDate = new Date(p.tanggal_rencana_kembali);
    return rDate < currentDate && p.status !== 'Selesai';
  });

  // Chart 1: Monthly loan counts (Jan - Jun 2026)
  const monthlyData = [
    { month: 'Jan', count: 5 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 12 },
    { month: 'Apr', count: 14 },
    { month: 'May', count: 19 },
    { month: 'Jun', count: 26 }, // High activity month
  ];

  // Chart 2: Most Borrowed Goods
  const topBorrowed = [
    { name: 'Laptop Asus', count: 18 },
    { name: 'Proyektor Epson', count: 15 },
    { name: 'Kamera DSLR', count: 12 },
    { name: 'Mobil Avanza', count: 9 },
    { name: 'Kursi Jaring', count: 7 },
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

        {/* Stok Menipis */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Kritis</span>
            <div className={`p-2 rounded-xl ${stokMenipis > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold ${stokMenipis > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{stokMenipis}</h3>
            <p className="text-xs text-rose-500 mt-1">Di Bawah Min</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Peminjaman per Bulan */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Grafik Peminjaman Barang</h2>
              <p className="text-xs text-gray-500">Volume transaksi peminjaman per bulan (Semester I 2026)</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5" /> +28% Bulan Ini
            </div>
          </div>
          {/* Responsive SVG Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between pt-4 px-2">
            {monthlyData.map((d, index) => {
              const maxVal = Math.max(...monthlyData.map(m => m.count));
              const percentage = (d.count / maxVal) * 80; // Scale to 80% max height
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-950 text-white text-xs px-2 py-1 rounded shadow-md pointer-events-none z-10 font-mono">
                    {d.count} Transaksi
                  </div>
                  {/* Bar */}
                  <div 
                    style={{ height: `${percentage}%` }}
                    className="w-8 sm:w-12 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-300 shadow-sm"
                  ></div>
                  <span className="text-xs font-semibold text-gray-600 mt-2">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Top Borrowed Items */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-1">Barang Paling Sering Dipinjam</h2>
          <p className="text-xs text-gray-500 mb-4">Peringkat inventaris dengan utilitas tertinggi</p>

          <div className="space-y-4">
            {topBorrowed.map((item, idx) => {
              const maxVal = topBorrowed[0].count;
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
        
        {/* Low Stock Watch */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Peringatan Stok Menipis</h2>
              <p className="text-xs text-gray-500">Daftar barang dengan stok di bawah nilai minimum</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
              {stokMenipis} Barang Kritis
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 font-semibold">Kode</th>
                  <th className="py-2.5 font-semibold">Nama Barang</th>
                  <th className="py-2.5 font-semibold text-center">Stok</th>
                  <th className="py-2.5 font-semibold text-center">Minimum</th>
                  <th className="py-2.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                      Seluruh barang memiliki stok aman.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map(item => (
                    <tr key={item.id_barang} className="hover:bg-gray-50/50 transition">
                      <td className="py-2.5 font-mono text-xs text-blue-600 font-semibold">{item.kode_barang}</td>
                      <td className="py-2.5 font-medium text-gray-900">{item.nama_barang}</td>
                      <td className="py-2.5 text-center font-bold text-rose-600">{item.stok}</td>
                      <td className="py-2.5 text-center text-gray-500 font-mono">{item.stok_minimum}</td>
                      <td className="py-2.5 text-center">
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {item.stok === 0 ? 'HABIS' : 'KRITIS'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
