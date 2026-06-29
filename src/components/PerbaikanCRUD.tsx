/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  FileText,
  User,
  Package,
  ArrowRight
} from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Barang, Perbaikan } from '../types';

interface PerbaikanCRUDProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function PerbaikanCRUD({ currentUser }: PerbaikanCRUDProps) {
  const [perbaikanList, setPerbaikanList] = useState<Perbaikan[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Dalam Proses' | 'Selesai'>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Perbaikan | null>(null);

  // Form Fields
  const [idBarang, setIdBarang] = useState<number>(0);
  const [tanggalPerbaikan, setTanggalPerbaikan] = useState('2026-06-28');
  const [deskripsiPerbaikan, setDeskripsiPerbaikan] = useState('');
  const [biaya, setBiaya] = useState<number>(0);
  const [teknisiVendor, setTeknisiVendor] = useState('');
  const [statusPerbaikan, setStatusPerbaikan] = useState<'Dalam Proses' | 'Selesai'>('Selesai');
  const [kondisiSetelahPerbaikan, setKondisiSetelahPerbaikan] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setPerbaikanList(OfficeInventoryDb.getPerbaikan());
    setBarangList(OfficeInventoryDb.getBarang());
  }, []);

  const refreshData = () => {
    setPerbaikanList(OfficeInventoryDb.getPerbaikan());
    setBarangList(OfficeInventoryDb.getBarang());
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditItem(null);
    const availableBarang = barangList.filter(b => b.status_ketersediaan !== 'Tidak Aktif');
    setIdBarang(availableBarang.length > 0 ? availableBarang[0].id_barang : 0);
    setTanggalPerbaikan('2026-06-28');
    setDeskripsiPerbaikan('');
    setBiaya(0);
    setTeknisiVendor('');
    setStatusPerbaikan('Selesai');
    setKondisiSetelahPerbaikan('Baik');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item: Perbaikan) => {
    setEditItem(item);
    setIdBarang(item.id_barang);
    setTanggalPerbaikan(item.tanggal_perbaikan);
    setDeskripsiPerbaikan(item.deskripsi_perbaikan);
    setBiaya(item.biaya);
    setTeknisiVendor(item.teknisi_vendor);
    setStatusPerbaikan(item.status_perbaikan);
    setKondisiSetelahPerbaikan(item.kondisi_setelah_perbaikan);
    setIsModalOpen(true);
  };

  // Save or Update Perbaikan Record
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idBarang) {
      setErrorMsg('Pilih barang yang diperbaiki terlebih dahulu.');
      return;
    }

    try {
      const repairs = [...perbaikanList];
      const targetBarang = barangList.find(b => b.id_barang === idBarang);
      if (!targetBarang) return;

      if (editItem) {
        // Edit Mode
        const updated = repairs.map(r => {
          if (r.id_perbaikan === editItem.id_perbaikan) {
            return {
              ...r,
              id_barang: idBarang,
              tanggal_perbaikan: tanggalPerbaikan,
              deskripsi_perbaikan: deskripsiPerbaikan,
              biaya: Number(biaya) || 0,
              teknisi_vendor: teknisiVendor,
              status_perbaikan: statusPerbaikan,
              kondisi_setelah_perbaikan: kondisiSetelahPerbaikan
            };
          }
          return r;
        });

        OfficeInventoryDb.savePerbaikan(updated);

        // If marked as Selesai, update the main goods condition
        if (statusPerbaikan === 'Selesai') {
          const updatedBarang = barangList.map(b => {
            if (b.id_barang === idBarang) {
              return {
                ...b,
                kondisi_barang: kondisiSetelahPerbaikan,
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              };
            }
            return b;
          });
          OfficeInventoryDb.saveBarang(updatedBarang);
        }

        OfficeInventoryDb.logActivity(
          currentUser?.id_user || 1, 
          `Update Historis Perbaikan #${editItem.id_perbaikan} untuk: ${targetBarang.nama_barang}`
        );

        setSuccessMsg('Historis perbaikan berhasil diubah!');
      } else {
        // Add Mode
        const newId = repairs.length > 0 ? Math.max(...repairs.map(r => r.id_perbaikan)) + 1 : 1;
        const newRecord: Perbaikan = {
          id_perbaikan: newId,
          id_barang: idBarang,
          tanggal_perbaikan: tanggalPerbaikan,
          deskripsi_perbaikan: deskripsiPerbaikan,
          biaya: Number(biaya) || 0,
          teknisi_vendor: teknisiVendor || 'Teknisi Internal',
          status_perbaikan: statusPerbaikan,
          kondisi_setelah_perbaikan: kondisiSetelahPerbaikan
        };

        repairs.unshift(newRecord);
        OfficeInventoryDb.savePerbaikan(repairs);

        // Update item condition if status is Selesai
        if (statusPerbaikan === 'Selesai') {
          const updatedBarang = barangList.map(b => {
            if (b.id_barang === idBarang) {
              return {
                ...b,
                kondisi_barang: kondisiSetelahPerbaikan,
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              };
            }
            return b;
          });
          OfficeInventoryDb.saveBarang(updatedBarang);
        }

        OfficeInventoryDb.logActivity(
          currentUser?.id_user || 1, 
          `Tambah Historis Perbaikan Barang: ${targetBarang.nama_barang} (${deskripsiPerbaikan})`
        );

        setSuccessMsg('Historis perbaikan berhasil ditambahkan!');
      }

      refreshData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Gagal menyimpan data perbaikan.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Delete Record
  const handleDelete = (idPerbaikan: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan historis perbaikan ini?')) {
      return;
    }

    try {
      const repairs = perbaikanList.filter(r => r.id_perbaikan !== idPerbaikan);
      OfficeInventoryDb.savePerbaikan(repairs);
      
      OfficeInventoryDb.logActivity(
        currentUser?.id_user || 1, 
        `Hapus Historis Perbaikan #${idPerbaikan}`
      );

      setSuccessMsg('Catatan historis perbaikan berhasil dihapus!');
      refreshData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Gagal menghapus catatan perbaikan.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Filter List
  const filteredRepairs = perbaikanList.filter(r => {
    const barang = barangList.find(b => b.id_barang === r.id_barang);
    const namaBarang = barang ? barang.nama_barang.toLowerCase() : '';
    const kodeBarang = barang ? barang.kode_barang.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase();

    const matchSearch = 
      namaBarang.includes(searchLower) ||
      kodeBarang.includes(searchLower) ||
      r.deskripsi_perbaikan.toLowerCase().includes(searchLower) ||
      r.teknisi_vendor.toLowerCase().includes(searchLower);

    const matchStatus = 
      statusFilter === 'Semua' || r.status_perbaikan === statusFilter;

    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalRepairs = perbaikanList.length;
  const activeRepairs = perbaikanList.filter(r => r.status_perbaikan === 'Dalam Proses').length;
  const completedRepairs = perbaikanList.filter(r => r.status_perbaikan === 'Selesai').length;
  const totalExpenses = perbaikanList.reduce((sum, r) => sum + r.biaya, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Historis Perbaikan BMN
            </h2>
            <p className="text-sm text-gray-500">Pemantauan riwayat pemeliharaan, servis suku cadang, dan perbaikan barang kantor</p>
          </div>
        </div>

        {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
          <button
            id="add-repair-log-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Tambah Catatan Servis
          </button>
        )}
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Tindakan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">{totalRepairs}</span>
            <span className="text-xs text-slate-400 font-medium">Laporan</span>
          </div>
        </div>

        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Dalam Proses</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-700 font-mono">{activeRepairs}</span>
            <span className="text-xs text-amber-500 font-medium">Unit Servis</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Selesai Perbaikan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono">{completedRepairs}</span>
            <span className="text-xs text-emerald-500 font-medium">Sukses</span>
          </div>
        </div>

        <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/50 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Akumulasi Biaya</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-extrabold text-blue-800 font-mono">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="repair-search-input"
            type="text"
            placeholder="Cari berdasarkan nama barang, kode BMN, deskripsi perbaikan, atau vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          id="repair-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-xl text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Semua">Semua Status</option>
          <option value="Dalam Proses">Status: Dalam Proses</option>
          <option value="Selesai">Status: Selesai</option>
        </select>
      </div>

      {/* Repair Timeline List */}
      <div className="space-y-4">
        {filteredRepairs.length === 0 ? (
          <div className="bg-gray-50 border border-dashed rounded-2xl py-12 text-center text-gray-400 text-xs italic">
            Tidak ada catatan historis perbaikan yang sesuai dengan kriteria saringan.
          </div>
        ) : (
          filteredRepairs.map((repair) => {
            const barang = barangList.find(b => b.id_barang === repair.id_barang);
            return (
              <div 
                key={repair.id_perbaikan}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xs transition p-5 flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Left Area: Goods Context */}
                <div className="md:w-4/12 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      {barang ? barang.kode_barang : 'BMN-UNKNOWN'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      repair.status_perbaikan === 'Selesai' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {repair.status_perbaikan}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">
                    {barang ? barang.nama_barang : 'Barang tidak ditemukan'}
                  </h4>

                  {barang && (
                    <div className="text-[11px] text-gray-500 space-y-0.5 font-medium">
                      <p>Kategori: <strong className="text-gray-700">{barang.nama_kategori}</strong></p>
                      <p>Merk/Model: <strong className="text-gray-700">{barang.merk_tipe || '-'}</strong></p>
                      <p>Lokasi Simpan: <strong className="text-gray-700">{barang.lokasi_penyimpanan || '-'}</strong></p>
                    </div>
                  )}
                </div>

                {/* Center Area: Action Taken */}
                <div className="md:w-5/12 space-y-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500 font-bold">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" /> {repair.tanggal_perbaikan}
                  </div>
                  <p className="text-xs text-gray-800 font-medium leading-relaxed">
                    {repair.deskripsi_perbaikan}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-1.5 text-[11px] text-gray-500">
                    <div>
                      Teknisi/Vendor: <strong className="text-gray-700">{repair.teknisi_vendor}</strong>
                    </div>
                    {repair.status_perbaikan === 'Selesai' && (
                      <div className="flex items-center gap-1">
                        Kondisi Akhir: 
                        <span className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] ${
                          repair.kondisi_setelah_perbaikan === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          repair.kondisi_setelah_perbaikan === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {repair.kondisi_setelah_perbaikan}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Finance & Action buttons */}
                <div className="md:w-3/12 flex flex-col justify-between items-end gap-3 text-right">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Biaya Perbaikan</span>
                    <span className="text-sm font-extrabold text-amber-600 font-mono">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(repair.biaya)}
                    </span>
                  </div>

                  {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(repair)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition cursor-pointer"
                        title="Edit Log Perbaikan"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(repair.id_perbaikan)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Repair Entry / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-400 animate-bounce" />
                <div>
                  <h3 className="font-bold text-sm">{editItem ? 'Edit Catatan Perbaikan' : 'Catat Tindakan Perbaikan'}</h3>
                  <p className="text-[10px] text-slate-400">Pencatatan rincian pemeliharaan aset BMN</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Pilih Barang BMN Target</label>
                <select
                  value={idBarang}
                  disabled={!!editItem}
                  onChange={(e) => setIdBarang(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value={0}>-- Pilih Barang BMN --</option>
                  {barangList.map(b => (
                    <option key={b.id_barang} value={b.id_barang}>
                      {b.nama_barang} [{b.kode_barang}] - Kondisi: {b.kondisi_barang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Tindakan</label>
                  <input 
                    type="date"
                    required
                    value={tanggalPerbaikan}
                    onChange={(e) => setTanggalPerbaikan(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Biaya Perbaikan (Rp)</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={biaya}
                    onChange={(e) => setBiaya(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Teknisi / Vendor Pelaksana</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Authorized Service Center, Teknisi Logistik, dsb."
                  value={teknisiVendor}
                  onChange={(e) => setTeknisiVendor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Detail Masalah & Rincian Perbaikan</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Deskripsikan gejala kerusakan, penggantian suku cadang, dan rincian servis..."
                  value={deskripsiPerbaikan}
                  onChange={(e) => setDeskripsiPerbaikan(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800 leading-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Status Perbaikan</label>
                  <select 
                    value={statusPerbaikan}
                    onChange={(e) => setStatusPerbaikan(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 bg-white"
                  >
                    <option value="Selesai">Selesai</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Kondisi Hasil Akhir</label>
                  <select 
                    value={kondisiSetelahPerbaikan}
                    disabled={statusPerbaikan !== 'Selesai'}
                    onChange={(e) => setKondisiSetelahPerbaikan(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-repair-log-btn"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition cursor-pointer"
                >
                  {editItem ? 'Simpan Perubahan' : 'Catat Servis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
