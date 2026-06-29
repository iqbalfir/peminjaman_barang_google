/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Eye, Calendar, User, FileText, CheckCircle, Clock, FileDown, Printer, X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { SerahTerima, DetailSerahTerima, Barang, Peminjam, User as AppUser } from '../types';

interface SerahTerimaBarangProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

interface ItemRowInput {
  id_barang: number;
  jumlah_serah: number;
  kondisi_serah: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
}

export default function SerahTerimaBarang({ currentUser }: SerahTerimaBarangProps) {
  const [bastList, setBastList] = useState<SerahTerima[]>([]);
  const [detailList, setDetailList] = useState<DetailSerahTerima[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Diserahkan' | 'Dikembalikan'>('Semua');

  // Form Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBastNo, setNewBastNo] = useState('');
  const [selectedPeminjamId, setSelectedPeminjamId] = useState('');
  const [tanggalSerah, setTanggalSerah] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [itemRows, setItemRows] = useState<ItemRowInput[]>([{ id_barang: 0, jumlah_serah: 1, kondisi_serah: 'Baik' }]);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail Modal States
  const [selectedBast, setSelectedBast] = useState<SerahTerima | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<DetailSerahTerima[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<Peminjam | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBastList(OfficeInventoryDb.getSerahTerima());
    setDetailList(OfficeInventoryDb.getDetailSerahTerima());
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
    setUsersList(OfficeInventoryDb.getUsers());
  };

  const handleOpenCreateModal = () => {
    setNewBastNo(OfficeInventoryDb.generateBastCode());
    setTanggalSerah(new Date().toISOString().substring(0, 10));
    setSelectedPeminjamId('');
    setKeperluan('');
    setKeterangan('');
    setItemRows([{ id_barang: 0, jumlah_serah: 1, kondisi_serah: 'Baik' }]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleAddRow = () => {
    setItemRows([...itemRows, { id_barang: 0, jumlah_serah: 1, kondisi_serah: 'Baik' }]);
  };

  const handleRemoveRow = (idx: number) => {
    if (itemRows.length === 1) return;
    const updated = itemRows.filter((_, i) => i !== idx);
    setItemRows(updated);
  };

  const handleRowChange = (idx: number, field: keyof ItemRowInput, value: any) => {
    const updated = [...itemRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setItemRows(updated);
  };

  const handleSaveBast = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPeminjamId) {
      setFormError('Silakan pilih data pegawai / peminjam.');
      return;
    }

    if (!keperluan.trim()) {
      setFormError('Silakan masukkan keperluan serah terima barang.');
      return;
    }

    // Validate rows
    const selectedBarangIds = new Set<number>();
    for (let i = 0; i < itemRows.length; i++) {
      const r = itemRows[i];
      if (r.id_barang === 0) {
        setFormError(`Silakan pilih barang pada baris ke-${i + 1}.`);
        return;
      }
      if (selectedBarangIds.has(r.id_barang)) {
        setFormError(`Barang yang sama dipilih lebih dari sekali pada baris ke-${i + 1}.`);
        return;
      }
      selectedBarangIds.add(r.id_barang);

      const targetBarang = barangList.find(b => b.id_barang === r.id_barang);
      if (!targetBarang) {
        setFormError(`Barang pada baris ke-${i + 1} tidak valid.`);
        return;
      }
      if (targetBarang.stok < r.jumlah_serah) {
        setFormError(`Stok barang "${targetBarang.nama_barang}" tidak mencukupi (Tersedia: ${targetBarang.stok}, Diminta: ${r.jumlah_serah}).`);
        return;
      }
      if (r.jumlah_serah <= 0) {
        setFormError(`Jumlah serah pada baris ke-${i + 1} harus lebih dari 0.`);
        return;
      }
    }

    // Process Handover
    const basts = OfficeInventoryDb.getSerahTerima();
    const currentDetailList = OfficeInventoryDb.getDetailSerahTerima();
    const currentBarangList = OfficeInventoryDb.getBarang();

    const id_serah_terima = basts.length > 0 ? Math.max(...basts.map(b => b.id_serah_terima)) + 1 : 1;
    const newBast: SerahTerima = {
      id_serah_terima,
      nomor_bast: newBastNo,
      tanggal_serah: tanggalSerah,
      id_peminjam: Number(selectedPeminjamId),
      keperluan,
      keterangan: keterangan || '-',
      status: 'Diserahkan',
      created_by: currentUser?.id_user || 1,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // Save details and adjust goods stock / status
    let detailId = currentDetailList.length > 0 ? Math.max(...currentDetailList.map(d => d.id_detail_bast)) + 1 : 1;
    const addedDetails: DetailSerahTerima[] = [];

    const updatedBarang = currentBarangList.map(b => {
      const match = itemRows.find(r => r.id_barang === b.id_barang);
      if (match) {
        const newStok = b.stok - match.jumlah_serah;
        const newStatus = newStok === 0 ? 'Dipinjam' : b.status_ketersediaan;
        
        // Push detail
        addedDetails.push({
          id_detail_bast: detailId++,
          id_serah_terima,
          id_barang: b.id_barang,
          jumlah_serah: match.jumlah_serah,
          jumlah_kembali: 0,
          kondisi_serah: match.kondisi_serah,
          kondisi_kembali: ''
        });

        return {
          ...b,
          stok: newStok,
          status_ketersediaan: newStatus,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return b;
    });

    // Write back to mock DB
    basts.unshift(newBast);
    OfficeInventoryDb.saveSerahTerima(basts);
    OfficeInventoryDb.saveDetailSerahTerima([...currentDetailList, ...addedDetails]);
    OfficeInventoryDb.saveBarang(updatedBarang);

    // Log Audit
    const peminjamObj = peminjamList.find(p => p.id_peminjam === Number(selectedPeminjamId));
    OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Serah Terima Barang ${newBastNo} kepada ${peminjamObj?.nama_lengkap || 'Unknown'}`);

    // Clean up
    setIsCreateModalOpen(false);
    loadData();
  };

  const handleOpenDetail = (bast: SerahTerima) => {
    const details = detailList.filter(d => d.id_serah_terima === bast.id_serah_terima);
    const borrower = peminjamList.find(p => p.id_peminjam === bast.id_peminjam) || null;
    setSelectedBast(bast);
    setSelectedDetails(details);
    setSelectedBorrower(borrower);
  };

  const handleKembalikanBarang = (bast: SerahTerima) => {
    if (!window.confirm(`Apakah Anda yakin ingin memproses pengembalian seluruh barang untuk BAST ${bast.nomor_bast}?`)) {
      return;
    }

    const basts = OfficeInventoryDb.getSerahTerima();
    const currentDetailList = OfficeInventoryDb.getDetailSerahTerima();
    const currentBarangList = OfficeInventoryDb.getBarang();

    // Update BAST status
    const updatedBasts = basts.map(b => {
      if (b.id_serah_terima === bast.id_serah_terima) {
        return {
          ...b,
          status: 'Dikembalikan' as const,
          tanggal_kembali: new Date().toISOString().substring(0, 10)
        };
      }
      return b;
    });

    // Find details for this BAST to restore stock
    const bastDetails = currentDetailList.filter(d => d.id_serah_terima === bast.id_serah_terima);
    const updatedDetails = currentDetailList.map(d => {
      if (d.id_serah_terima === bast.id_serah_terima) {
        return {
          ...d,
          jumlah_kembali: d.jumlah_serah,
          kondisi_kembali: d.kondisi_serah // Default to same condition
        };
      }
      return d;
    });

    // Update barang stock and availability
    const updatedBarang = currentBarangList.map(b => {
      const detailMatch = bastDetails.find(d => d.id_barang === b.id_barang);
      if (detailMatch) {
        const restoredStok = b.stok + detailMatch.jumlah_serah;
        const restoredStatus = restoredStok > 0 ? ('Tersedia' as const) : b.status_ketersediaan;
        return {
          ...b,
          stok: restoredStok,
          status_ketersediaan: restoredStatus,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return b;
    });

    // Write back
    OfficeInventoryDb.saveSerahTerima(updatedBasts);
    OfficeInventoryDb.saveDetailSerahTerima(updatedDetails);
    OfficeInventoryDb.saveBarang(updatedBarang);

    // Audit Log
    const peminjamObj = peminjamList.find(p => p.id_peminjam === bast.id_peminjam);
    OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Proses Pengembalian Barang BAST ${bast.nomor_bast} dari ${peminjamObj?.nama_lengkap || 'Unknown'}`);

    // Update current UI states if detail modal is open
    if (selectedBast && selectedBast.id_serah_terima === bast.id_serah_terima) {
      setSelectedBast(prev => prev ? { ...prev, status: 'Dikembalikan', tanggal_kembali: new Date().toISOString().substring(0, 10) } : null);
      setSelectedDetails(prev => prev.map(d => ({ ...d, jumlah_kembali: d.jumlah_serah, kondisi_kembali: d.kondisi_serah })));
    }

    loadData();
  };

  // Filter List
  const filteredBasts = bastList.filter(b => {
    const borrower = peminjamList.find(p => p.id_peminjam === b.id_peminjam);
    const matchesSearch = b.nomor_bast.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (borrower?.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.keperluan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Upper Action/Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Berita Acara Serah Terima (BAST)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen dokumen penyerahan & serah terima BMN fisik langsung kepada pegawai.
          </p>
        </div>
        <button 
          id="btn-create-bast"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Serah Terima Baru
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari nomor BAST, nama pegawai, atau keperluan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['Semua', 'Diserahkan', 'Dikembalikan'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                statusFilter === status 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              <th className="py-4 px-4 w-12 text-center">No</th>
              <th className="py-4 px-4">No. BAST</th>
              <th className="py-4 px-4">Tanggal Serah</th>
              <th className="py-4 px-4">Pegawai Penerima</th>
              <th className="py-4 px-4">Keperluan / Penyerahan</th>
              <th className="py-4 px-4 text-center">Status</th>
              <th className="py-4 px-4 text-center w-48">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredBasts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                  Tidak ditemukan riwayat serah terima barang.
                </td>
              </tr>
            ) : (
              filteredBasts.map((b, idx) => {
                const borrower = peminjamList.find(p => p.id_peminjam === b.id_peminjam);
                const itemsCount = detailList.filter(d => d.id_serah_terima === b.id_serah_terima).reduce((sum, d) => sum + d.jumlah_serah, 0);

                return (
                  <tr key={b.id_serah_terima} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-4 px-4 text-center text-gray-400 font-bold">{idx + 1}</td>
                    <td className="py-4 px-4 font-mono font-extrabold text-blue-700 tracking-wide">{b.nomor_bast}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {b.tanggal_serah}
                      {b.tanggal_kembali && (
                        <div className="text-[10px] text-emerald-600 font-mono mt-0.5">Kembali: {b.tanggal_kembali}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-950">{borrower?.nama_lengkap || 'Unknown Staff'}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{borrower?.instansi_unit_kerja}</div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <span className="font-bold text-slate-800 block truncate" title={b.keperluan}>{b.keperluan}</span>
                      <span className="text-[10px] text-gray-400 block truncate font-medium">Total: {itemsCount} Unit barang BMN</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-flex items-center gap-1 ${
                        b.status === 'Dikembalikan' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          b.status === 'Dikembalikan' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenDetail(b)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 text-[11px] font-bold rounded-xl transition duration-150 flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail & Cetak
                        </button>
                        
                        {b.status === 'Diserahkan' && (
                          <button 
                            onClick={() => handleKembalikanBarang(b)}
                            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Kembalikan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE HANDOVER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-fade-in">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-extrabold text-slate-950">Buat Berita Acara Serah Terima (BAST)</h3>
                <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                  {newBastNo}
                </span>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBast} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Borrower Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Pegawai Penerima (Peminjam)</label>
                  <select
                    value={selectedPeminjamId}
                    onChange={(e) => setSelectedPeminjamId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="">-- Pilih Pegawai Penerima --</option>
                    {peminjamList.map(p => (
                      <option key={p.id_peminjam} value={p.id_peminjam}>
                        {p.nama_lengkap} - {p.instansi_unit_kerja}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Handover Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Tanggal Penyerahan Fisik</label>
                  <input
                    type="date"
                    value={tanggalSerah}
                    onChange={(e) => setTanggalSerah(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                {/* Keperluan */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Maksud Keperluan Serah Terima</label>
                  <input
                    type="text"
                    placeholder="Contoh: Penyerahan Laptop Inventaris BMN guna menunjang tugas kedinasan di Bidang Pelestarian..."
                    value={keperluan}
                    onChange={(e) => setKeperluan(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                {/* Keterangan */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Keterangan / Catatan Tambahan (Opsional)</label>
                  <textarea
                    placeholder="Masukkan catatan pendukung serah terima..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

              </div>

              {/* Items Section */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                    Daftar Barang BMN yang Diserahkan
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Barang
                  </button>
                </div>

                <div className="space-y-3">
                  {itemRows.map((row, idx) => {
                    const selectedBarang = barangList.find(b => b.id_barang === row.id_barang);
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row items-end gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
                        
                        {/* Select Goods */}
                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Barang BMN</label>
                          <select
                            value={row.id_barang}
                            onChange={(e) => handleRowChange(idx, 'id_barang', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                          >
                            <option value={0}>-- Pilih Barang --</option>
                            {barangList.map(b => (
                              <option key={b.id_barang} value={b.id_barang} disabled={b.stok <= 0}>
                                {b.nama_barang} ({b.kode_barang}) - [Stok: {b.stok}] {b.stok <= 0 ? '(HABIS)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-full sm:w-28 space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Jumlah Serah</label>
                          <input
                            type="number"
                            min={1}
                            max={selectedBarang ? selectedBarang.stok : undefined}
                            value={row.jumlah_serah}
                            onChange={(e) => handleRowChange(idx, 'jumlah_serah', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-800 font-mono"
                          />
                        </div>

                        {/* Condition */}
                        <div className="w-full sm:w-40 space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Kondisi Serah</label>
                          <select
                            value={row.kondisi_serah}
                            onChange={(e) => handleRowChange(idx, 'kondisi_serah', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Rusak Ringan">Rusak Ringan</option>
                            <option value="Rusak Berat">Rusak Berat</option>
                          </select>
                        </div>

                        {/* Remove Row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={itemRows.length === 1}
                          className="p-2 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg disabled:opacity-40 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>
                    );
                  })}
                </div>
              </div>

            </form>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveBast}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Simpan & Rekam BAST
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DETAIL & PRINTABLE BAST MODAL */}
      {selectedBast && selectedBorrower && (() => {
        const creatorUser = usersList.find(u => u.id_user === selectedBast.created_by) || currentUser;
        const creatorExtRaw = creatorUser ? localStorage.getItem(`profile_ext_${creatorUser.id_user}`) : null;
        let creatorNip = '';
        if (creatorExtRaw) {
          try {
            const ext = JSON.parse(creatorExtRaw);
            creatorNip = ext.nipNik || '';
          } catch (e) {}
        }
        if (!creatorNip && creatorUser) {
          if (creatorUser.role === 'Admin') creatorNip = '197612052003021002';
          else if (creatorUser.role === 'Petugas') creatorNip = '198405102009121001';
        }
        const creatorSignature = creatorUser ? localStorage.getItem(`signature_${creatorUser.id_user}`) : null;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            {/* Print css encapsulation */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                }
                #root, .fixed, .bg-black\\/60 {
                  visibility: hidden !important;
                }
                #printable-bast-invoice, #printable-bast-invoice * {
                  visibility: visible !important;
                }
                #printable-bast-invoice {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 1.5cm !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                }
                #close-bast-detail, button, footer, header {
                  display: none !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
              }
            `}} />

            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-fade-in">
              
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Nota Berita Acara Serah Terima</h3>
                  <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {selectedBast.nomor_bast}
                  </span>
                </div>
                <button 
                  id="close-bast-detail"
                  onClick={() => setSelectedBast(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Printable segment */}
              <div id="printable-bast-invoice" className="p-8 space-y-6 overflow-y-auto flex-1 bg-white">
                
                {/* Header Letterhead */}
                <div className="border-b-4 border-double border-slate-800 pb-5 text-center space-y-1 relative">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">Serah Terima Barang BMN</h2>
                  <h3 className="text-sm font-bold text-slate-700 uppercase">Balai Pelestarian Kebudayaan Banten</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono tracking-wider">Jl. Letnan Jidun No. 2, Serang, Banten | bpk.banten@kemdikbud.go.id</p>
                  
                  <div className="absolute right-2 top-0 text-[9px] font-mono font-bold text-slate-400 border border-slate-300 rounded-md px-2 py-1 uppercase tracking-widest select-none bg-slate-50">
                    BMN-BAST
                  </div>
                </div>

                {/* Sub-Title */}
                <div className="text-center">
                  <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-widest">BERITA ACARA SERAH TERIMA FISIK BARANG MILIK NEGARA</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">NOMOR: {selectedBast.nomor_bast}</p>
                </div>

                {/* Grid Metadata */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  
                  {/* Left block - BAST Detail */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-600" /> DETAIL BAST
                    </div>
                    <div className="space-y-1 font-medium text-slate-700">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-400">No. BAST:</span>
                        <span className="col-span-2 font-bold font-mono text-slate-950">{selectedBast.nomor_bast}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-400">Tgl Serah:</span>
                        <span className="col-span-2 font-bold text-slate-800">{selectedBast.tanggal_serah}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-400">Status:</span>
                        <span className="col-span-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            selectedBast.status === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {selectedBast.status}
                          </span>
                        </span>
                      </div>
                      {selectedBast.tanggal_kembali && (
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-slate-400">Tgl Kembali:</span>
                          <span className="col-span-2 font-bold text-emerald-700">{selectedBast.tanggal_kembali}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right block - Pegawai Penerima */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-blue-600" /> PEGAWAI PENERIMA
                    </div>
                    <div className="space-y-1 font-medium text-slate-700">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-400">Nama:</span>
                        <span className="col-span-2 font-bold text-slate-950">{selectedBorrower.nama_lengkap}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-400">Jabatan:</span>
                        <span className="col-span-2 font-bold text-slate-800">{selectedBorrower.jabatan}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-400">Unit Kerja:</span>
                        <span className="col-span-2 font-semibold text-slate-700">{selectedBorrower.instansi_unit_kerja}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Keperluan */}
                <div className="text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="font-extrabold text-slate-900 tracking-wider text-[10px] uppercase block">Maksud Penyerahan</span>
                  <p className="text-slate-800 font-medium leading-relaxed">{selectedBast.keperluan}</p>
                  {selectedBast.keterangan && selectedBast.keterangan !== '-' && (
                    <p className="text-gray-400 text-[11px] mt-2 italic pt-1.5 border-t border-slate-100">Catatan: {selectedBast.keterangan}</p>
                  )}
                </div>

                {/* Table of items */}
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-900 tracking-wider text-[10px] uppercase block">Daftar Barang BMN Fisik yang Diserahkan</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                          <th className="p-3 w-12 text-center border-r border-slate-200">No</th>
                          <th className="p-3 w-32 border-r border-slate-200">Kode Barang</th>
                          <th className="p-3 border-r border-slate-200">Nama Barang / Spesifikasi</th>
                          <th className="p-3 text-center border-r border-slate-200 w-28">Jumlah</th>
                          <th className="p-3 text-center border-r border-slate-200 w-32">Kondisi Serah</th>
                          <th className="p-3 text-center w-32">Status Kembali</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-850">
                        {selectedDetails.map((det, index) => {
                          const bItem = barangList.find(b => b.id_barang === det.id_barang);
                          return (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="p-3 text-center text-gray-400 font-bold border-r border-slate-200">{index + 1}</td>
                              <td className="p-3 font-mono font-bold text-blue-800 border-r border-slate-200">{bItem?.kode_barang || 'BRG-??????'}</td>
                              <td className="p-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">{bItem?.nama_barang || 'Barang Terhapus'}</div>
                                <div className="text-[10px] text-gray-400">{bItem?.merk_tipe || '-'}</div>
                              </td>
                              <td className="p-3 text-center font-bold font-mono border-r border-slate-200 text-slate-900">{det.jumlah_serah} Unit</td>
                              <td className="p-3 text-center border-r border-slate-200">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                  {det.kondisi_serah}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold text-slate-600 font-mono">
                                {det.jumlah_kembali === det.jumlah_serah ? (
                                  <span className="text-emerald-600">Lengkap</span>
                                ) : (
                                  <span className="text-amber-600">Diserahkan</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-xs">
                  
                  {/* Left Column - Borrower */}
                  <div className="text-center flex flex-col justify-between h-48 border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[9px] mb-1.5">Pegawai Penerima Barang</span>
                      <span className="text-slate-500 text-[11px]">Dengan ini menyatakan telah menerima fisik BMN</span>
                    </div>
                    <div className="flex items-center justify-center h-20">
                      <span className="text-[10px] text-gray-300 italic font-mono">( Tanda Tangan Fisik )</span>
                    </div>
                    <div>
                      <span className="font-bold block border-b border-gray-400 mx-6 pb-1 text-slate-900">{selectedBorrower.nama_lengkap}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">Jabatan: {selectedBorrower.jabatan}</span>
                    </div>
                  </div>

                  {/* Right Column - Officer */}
                  <div className="text-center flex flex-col justify-between h-48 border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 relative overflow-hidden">
                    <div className="absolute right-3 bottom-14 text-[42px] font-black text-blue-900/5 select-none font-sans leading-none pointer-events-none uppercase">
                      BPK
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[9px] mb-1.5">Yang Menyerahkan (Petugas BMN)</span>
                      <span className="text-slate-500 text-[11px]">Balai Pelestarian Kebudayaan Banten</span>
                    </div>

                    <div className="flex items-center justify-center h-20 relative">
                      {creatorSignature ? (
                        <div className="relative">
                          <img 
                            src={creatorSignature} 
                            alt="Digital Signature Specimen" 
                            className="max-h-16 max-w-full object-contain mix-blend-multiply transition-transform" 
                          />
                          <div className="absolute -bottom-1 -right-3 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-mono font-bold scale-90 flex items-center gap-0.5 shadow-sm">
                            <CheckCircle className="h-2 w-2 text-white" /> VERIFIED
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[10px] text-amber-500 italic font-semibold">Tanda Tangan Belum Registrasi</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="font-bold block border-b border-gray-400 mx-6 pb-1 text-slate-900">{creatorUser?.nama_user || 'Petugas Administrasi'}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">NIP: {creatorNip}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                <button 
                  onClick={() => setSelectedBast(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    window.print();
                    OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Cetak BAST Serah Terima: ${selectedBast.nomor_bast}`);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Cetak BAST
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
