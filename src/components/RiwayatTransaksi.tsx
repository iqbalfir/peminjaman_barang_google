/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Eye, Calendar, User, FileText, CheckCircle, Clock, FileDown, Printer, X, ShoppingBag, Edit, Save, Plus, Trash2, Camera } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjaman, DetailPeminjaman, Barang, Peminjam, User as AppUser } from '../types';

interface RiwayatTransaksiProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function RiwayatTransaksi({ currentUser }: RiwayatTransaksiProps) {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [detailList, setDetailList] = useState<DetailPeminjaman[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected for View Modal
  const [selectedLoan, setSelectedLoan] = useState<Peminjaman | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<Peminjam | null>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editedLoan, setEditedLoan] = useState<Peminjaman | null>(null);
  const [editedDetails, setEditedDetails] = useState<any[]>([]);
  const [editedBorrower, setEditedBorrower] = useState<Peminjam | null>(null);

  // New Item States for Edit Mode
  const [newItemId, setNewItemId] = useState<number | ''>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemKondisi, setNewItemKondisi] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPeminjamanList(OfficeInventoryDb.getPeminjaman());
    setDetailList(OfficeInventoryDb.getDetailPeminjaman());
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
    setUsersList(OfficeInventoryDb.getUsers());
  };

  const handleOpenDetail = (pjm: Peminjaman) => {
    const bObj = peminjamList.find(x => x.id_peminjam === pjm.id_peminjam) || null;
    setSelectedBorrower(bObj);

    // Join with goods
    const jointDetails = detailList
      .filter(d => d.id_peminjaman === pjm.id_peminjaman)
      .map(d => {
        const b = barangList.find(x => x.id_barang === d.id_barang);
        return {
          ...d,
          nama_barang: b?.nama_barang || 'Barang Terhapus',
          kode_barang: b?.kode_barang || 'BRG-??????',
          merk_tipe: b?.merk_tipe || '-'
        };
      });

    setSelectedDetails(jointDetails);
    setSelectedLoan(pjm);
    OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Melihat Detail Transaksi ${pjm.nomor_peminjaman}`);
  };

  const handleCloseDetail = () => {
    setSelectedLoan(null);
    setIsEditing(false);
    setEditedLoan(null);
    setEditedDetails([]);
    setEditedBorrower(null);
    setNewItemId('');
    setNewItemQty(1);
    setNewItemKondisi('Baik');
  };

  const handleAddNewItemRow = () => {
    if (!newItemId) {
      alert('Silakan pilih barang terlebih dahulu.');
      return;
    }

    const b = barangList.find(x => x.id_barang === newItemId);
    if (!b) return;

    // Check if item is already added to editedDetails
    if (editedDetails.some(ed => ed.id_barang === b.id_barang)) {
      alert('Barang ini sudah ada di daftar pinjam!');
      return;
    }

    if (newItemQty > b.jumlah_bagus) {
      const confirmAdd = window.confirm(`Peringatan: Stok barang bagus hanya ada ${b.jumlah_bagus}. Tetap tambahkan?`);
      if (!confirmAdd) return;
    }

    const newRow = {
      id_detail: 0, // 0 indicates a newly added item row
      id_peminjaman: editedLoan?.id_peminjaman || 0,
      id_barang: b.id_barang,
      nama_barang: b.nama_barang,
      kode_barang: b.kode_barang,
      merk_tipe: b.merk_tipe,
      jumlah_pinjam: newItemQty,
      jumlah_kembali: 0,
      kondisi_pinjam: newItemKondisi,
      kondisi_kembali: '',
      keterangan: ''
    };

    setEditedDetails(prev => [...prev, newRow]);
    
    // Reset inputs
    setNewItemId('');
    setNewItemQty(1);
    setNewItemKondisi('Baik');
  };

  const handleSaveChanges = () => {
    if (!editedLoan) return;

    if (editedDetails.length === 0) {
      alert('Harus ada minimal satu barang yang dipinjam!');
      return;
    }

    try {
      // 1. Update main loan
      const currentLoans = OfficeInventoryDb.getPeminjaman();
      const updatedLoans = currentLoans.map(l => l.id_peminjaman === editedLoan.id_peminjaman ? editedLoan : l);
      OfficeInventoryDb.savePeminjaman(updatedLoans);

      // 1.5. Update borrower details if edited
      if (editedBorrower) {
        const currentPeminjamList = OfficeInventoryDb.getPeminjam();
        const updatedPeminjamList = currentPeminjamList.map(p => 
          p.id_peminjam === editedBorrower.id_peminjam ? editedBorrower : p
        );
        OfficeInventoryDb.savePeminjam(updatedPeminjamList);
        setSelectedBorrower(editedBorrower);
      }

      // 2. Update/insert/delete detail list for this specific loan
      const currentDetails = OfficeInventoryDb.getDetailPeminjaman();
      const otherDetails = currentDetails.filter(d => d.id_peminjaman !== editedLoan.id_peminjaman);

      let nextDetailId = currentDetails.length > 0 ? Math.max(...currentDetails.map(d => d.id_detail)) + 1 : 1;

      const isStatusDipinjam = editedLoan.status === 'Dipinjam';

      const newDetailsWithIds = editedDetails.map(ed => {
        const j_kembali = isStatusDipinjam ? 0 : ed.jumlah_kembali;
        // If it was already an existing detail, preserve its ID and only update values
        if (ed.id_detail > 0) {
          const existing = currentDetails.find(d => d.id_detail === ed.id_detail);
          return {
            ...existing,
            id_detail: ed.id_detail,
            id_peminjaman: editedLoan.id_peminjaman,
            id_barang: ed.id_barang,
            jumlah_pinjam: ed.jumlah_pinjam,
            kondisi_pinjam: ed.kondisi_pinjam,
            jumlah_kembali: j_kembali,
            kondisi_kembali: isStatusDipinjam ? '' : (ed.kondisi_kembali || ''),
            keterangan: ed.keterangan || ''
          };
        } else {
          // This is a new detail
          return {
            id_detail: nextDetailId++,
            id_peminjaman: editedLoan.id_peminjaman,
            id_barang: ed.id_barang,
            jumlah_pinjam: ed.jumlah_pinjam,
            kondisi_pinjam: ed.kondisi_pinjam,
            jumlah_kembali: 0,
            kondisi_kembali: '',
            keterangan: ''
          };
        }
      });

      const finalDetails = [...otherDetails, ...newDetailsWithIds];
      OfficeInventoryDb.saveDetailPeminjaman(finalDetails);

      // 3. Log Activity
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Mengedit Transaksi & Item Peminjaman: ${editedLoan.nomor_peminjaman}`);

      // 4. Update parent / local states
      setSelectedLoan(editedLoan);
      setSelectedDetails(newDetailsWithIds.map(ed => {
        const b = barangList.find(x => x.id_barang === ed.id_barang);
        return {
          ...ed,
          nama_barang: b?.nama_barang || 'Barang Terhapus',
          kode_barang: b?.kode_barang || 'BRG-??????',
          merk_tipe: b?.merk_tipe || '-'
        };
      }));
      setIsEditing(false);

      // 5. Reload the main list data
      loadData();

      alert('Data peminjaman berhasil diperbarui!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  // Filter List
  const filteredLoans = peminjamanList.filter(p => {
    const borrower = peminjamList.find(b => b.id_peminjam === p.id_peminjam);
    const details = detailList.filter(d => d.id_peminjaman === p.id_peminjaman);
    const goodsNames = details.map(d => {
      const b = barangList.find(x => x.id_barang === d.id_barang);
      return b?.nama_barang.toLowerCase() || '';
    }).join(' ');

    const matchesSearch = p.nomor_peminjaman.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          borrower?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.keperluan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          goodsNames.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-600" /> Riwayat Transaksi Peminjaman
        </h2>
        <p className="text-sm text-gray-500">Daftar rekonsiliasi peminjaman barang kantor lengkap dengan pencarian multi-parameter dan cetak nota</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            id="search-loan-input"
            type="text" 
            placeholder="Cari nomor peminjaman, nama peminjam, nama barang, keperluan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-56">
          <select 
            id="status-loan-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="Dipinjam">Dipinjam (Belum Kembali)</option>
            <option value="Sebagian Kembali">Sebagian Kembali</option>
            <option value="Selesai">Selesai (Sudah Kembali)</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              <th className="py-3.5 px-4">No. Peminjaman</th>
              <th className="py-3.5 px-4">Tanggal Pinjam</th>
              <th className="py-3.5 px-4">Nama Peminjam</th>
              <th className="py-3.5 px-4">Keperluan / Keterangan</th>
              <th className="py-3.5 px-4 text-center">Jumlah Item</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                  Tidak ditemukan riwayat peminjaman barang.
                </td>
              </tr>
            ) : (
              filteredLoans.map((p, idx) => {
                const borrower = peminjamList.find(x => x.id_peminjam === p.id_peminjam);
                const itemsCount = detailList.filter(d => d.id_peminjaman === p.id_peminjaman).reduce((sum, d) => sum + d.jumlah_pinjam, 0);
                return (
                  <tr key={p.id_peminjaman} className="hover:bg-slate-50/50 transition duration-150 group">
                    <td className="py-3.5 px-4 text-center text-gray-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-blue-700 tracking-wide">{p.nomor_peminjaman}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{p.tanggal_pinjam}</div>
                      <div className="text-[10px] text-rose-500 font-bold mt-0.5">Jatuh Tempo: {p.tanggal_rencana_kembali}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-950">{borrower?.nama_lengkap || 'Unknown'}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{borrower?.instansi_unit_kerja}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-slate-800 block truncate" title={p.keperluan}>{p.keperluan}</span>
                      <span className="text-[10px] text-gray-400 block truncate">{p.keterangan || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono font-bold rounded-lg text-[11px]">
                        {itemsCount} Unit
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-flex items-center gap-1 ${
                        p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        p.status === 'Sebagian Kembali' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          p.status === 'Selesai' ? 'bg-emerald-500' :
                          p.status === 'Sebagian Kembali' ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center">
                        <button 
                          id={`view-detail-${p.id_peminjaman}`}
                          onClick={() => handleOpenDetail(p)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 text-[11px] font-bold rounded-xl transition duration-150 flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL with printable layout */}
      {selectedLoan && selectedBorrower && (() => {
        // Look up who created the transaction to get their signature & registration info
        const creatorUser = usersList.find(u => u.id_user === selectedLoan.created_by) || currentUser;
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

        const isDipinjam = (isEditing ? editedLoan?.status : selectedLoan.status) === 'Dipinjam';

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            {/* Inject dynamic @media print styles to guarantee a clean, isolated physical printout of ONLY the receipt */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                }
                /* Hide everything in the root viewport and external backgrounds */
                #root, .fixed, .bg-black\\/60 {
                  visibility: hidden !important;
                }
                #printable-loan-invoice, #printable-loan-invoice * {
                  visibility: visible !important;
                }
                #printable-loan-invoice {
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
                /* Hide scrollbars & buttons when printing */
                #close-loan-detail, button, footer, header {
                  display: none !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
              }
            `}} />

            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-fade-in">
              
              {/* Modal Header (Screen Only) */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Nota Resmi Bukti Peminjaman</h3>
                  <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {isEditing ? (editedLoan?.nomor_peminjaman || '') : selectedLoan.nomor_peminjaman}
                  </span>
                </div>
                <button 
                  id="close-loan-detail"
                  onClick={handleCloseDetail}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content - Printable Segment */}
              <div id="printable-loan-invoice" className="p-8 space-y-6 overflow-y-auto flex-1 bg-white">
                
                {/* Header Letterhead */}
                <div className="border-b-4 border-double border-slate-800 pb-5 text-center space-y-1 relative">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">Peminjaman Barang BMN</h2>
                  <h3 className="text-sm font-bold text-slate-700 uppercase">Balai Pelestarian Kebudayaan Banten</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono tracking-wider">Jl. Letnan Jidun No. 2, Serang, Banten | bpk.banten@kemdikbud.go.id</p>
                  
                  {/* Clean official seal / marker */}
                  <div className="absolute right-2 top-0 text-[9px] font-mono font-bold text-slate-400 border border-slate-300 rounded-md px-2 py-1 uppercase tracking-widest select-none bg-slate-50">
                    BMN-SYSTEM
                  </div>
                </div>

                {/* Sub-Title */}
                <div className="text-center">
                  <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-widest">SURAT BUKTI PINJAM PAKAI BARANG MILIK NEGARA</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    NOMOR: {isEditing ? (editedLoan?.nomor_peminjaman || '') : selectedLoan.nomor_peminjaman}
                  </p>
                </div>

                {/* Transaction Metadata Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  
                  {/* Left block - Loan detail */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-600" /> DETAIL NOTA PEMINJAMAN
                    </div>
                    <div className="space-y-1 font-medium text-slate-700">
                      <div className="grid grid-cols-3 gap-1 items-center">
                        <span className="text-slate-400">No. Nota:</span>
                        <span className="col-span-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedLoan?.nomor_peminjaman || ''}
                              onChange={(e) => setEditedLoan(prev => prev ? { ...prev, nomor_peminjaman: e.target.value } : null)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-white font-mono font-bold text-slate-950"
                            />
                          ) : (
                            <span className="font-bold font-mono text-slate-950">{selectedLoan.nomor_peminjaman}</span>
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 items-center">
                        <span className="text-slate-400">Tgl Pinjam:</span>
                        <span className="col-span-2 font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editedLoan?.tanggal_pinjam || ''}
                              onChange={(e) => setEditedLoan(prev => prev ? { ...prev, tanggal_pinjam: e.target.value } : null)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-white"
                            />
                          ) : (
                            selectedLoan.tanggal_pinjam
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 items-center">
                        <span className="text-slate-400">Tgl Kembali:</span>
                        <span className="col-span-2 font-bold text-rose-600 font-mono">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editedLoan?.tanggal_rencana_kembali || ''}
                              onChange={(e) => setEditedLoan(prev => prev ? { ...prev, tanggal_rencana_kembali: e.target.value } : null)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-white font-mono text-rose-600 font-bold"
                            />
                          ) : (
                            selectedLoan.tanggal_rencana_kembali
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 items-center">
                        <span className="text-slate-400">Status:</span>
                        <span className="col-span-2">
                          {isEditing ? (
                            <select
                              value={editedLoan?.status || ''}
                              onChange={(e) => setEditedLoan(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none font-bold w-full"
                            >
                              <option value="Dipinjam">Dipinjam</option>
                              <option value="Sebagian Kembali">Sebagian Kembali</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              selectedLoan.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                              selectedLoan.status === 'Sebagian Kembali' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedLoan.status}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right block - Borrower info */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-blue-600" /> DATA PEGAWAI (PEMINJAM)
                    </div>
                    <div className="space-y-1 font-medium text-slate-700">
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-3 gap-1.5 items-center">
                            <span className="text-slate-400">Pilih Pegawai:</span>
                            <span className="col-span-2">
                              <select
                                value={editedLoan?.id_peminjam || ''}
                                onChange={(e) => {
                                  const pid = parseInt(e.target.value) || 0;
                                  setEditedLoan(prev => prev ? { ...prev, id_peminjam: pid } : null);
                                  const b = peminjamList.find(x => x.id_peminjam === pid) || null;
                                  setEditedBorrower(b ? { ...b } : null);
                                }}
                                className="px-2 py-1 border border-slate-300 rounded text-[11px] bg-white focus:ring-1 focus:ring-blue-500 outline-none font-bold w-full"
                              >
                                {peminjamList.map(p => (
                                  <option key={p.id_peminjam} value={p.id_peminjam}>
                                    {p.nama_lengkap} ({p.jabatan})
                                  </option>
                                ))}
                              </select>
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 items-center pt-1.5 border-t border-slate-150 mt-1.5">
                            <span className="text-slate-400">Nama Lengkap:</span>
                            <span className="col-span-2">
                              <input
                                type="text"
                                value={editedBorrower?.nama_lengkap || ''}
                                onChange={(e) => setEditedBorrower(prev => prev ? { ...prev, nama_lengkap: e.target.value } : null)}
                                className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-white font-bold text-slate-900"
                              />
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 items-center">
                            <span className="text-slate-400">Instansi:</span>
                            <span className="col-span-2">
                              <input
                                type="text"
                                value={editedBorrower?.instansi_unit_kerja || ''}
                                onChange={(e) => setEditedBorrower(prev => prev ? { ...prev, instansi_unit_kerja: e.target.value } : null)}
                                className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-white font-semibold text-slate-800"
                              />
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 items-center">
                            <span className="text-slate-400">Jabatan:</span>
                            <span className="col-span-2">
                              <input
                                type="text"
                                value={editedBorrower?.jabatan || ''}
                                onChange={(e) => setEditedBorrower(prev => prev ? { ...prev, jabatan: e.target.value } : null)}
                                className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-white font-semibold text-slate-700"
                              />
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-400">Nama:</span>
                            <span className="col-span-2 font-bold text-slate-950">{selectedBorrower?.nama_lengkap || '-'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-400">Instansi:</span>
                            <span className="col-span-2 font-bold text-slate-800">{selectedBorrower?.instansi_unit_kerja || '-'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-400">Unit Kerja:</span>
                            <span className="col-span-2 font-semibold text-slate-700">{selectedBorrower?.instansi_unit_kerja || '-'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-400">Jabatan:</span>
                            <span className="col-span-2 font-semibold text-slate-600">{selectedBorrower?.jabatan || '-'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* Purposes */}
                <div className="text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="font-extrabold text-slate-900 tracking-wider text-[10px] uppercase block">Keperluan Tugas</span>
                  {isEditing ? (
                    <textarea
                      value={editedLoan?.keperluan || ''}
                      onChange={(e) => setEditedLoan(prev => prev ? { ...prev, keperluan: e.target.value } : null)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-800"
                      rows={2}
                    />
                  ) : (
                    <p className="text-slate-800 font-medium leading-relaxed">{selectedLoan.keperluan}</p>
                  )}
                  {isEditing ? (
                    <div className="pt-2">
                      <span className="font-bold text-slate-500 block mb-1 text-[10px] uppercase">Catatan / Keterangan Tambahan:</span>
                      <input
                        type="text"
                        value={editedLoan?.keterangan || ''}
                        onChange={(e) => setEditedLoan(prev => prev ? { ...prev, keterangan: e.target.value } : null)}
                        className="w-full p-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-800"
                      />
                    </div>
                  ) : (
                    selectedLoan.keterangan && selectedLoan.keterangan !== '-' && (
                      <div className="text-[11px] text-gray-400 pt-2 border-t border-slate-200 mt-2 italic">
                        <span className="font-bold not-italic text-slate-500">Catatan/Keterangan Tambahan:</span> {selectedLoan.keterangan}
                      </div>
                    )
                  )}
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 tracking-wider text-[10px] uppercase block">Daftar Barang BMN yang Dipinjam</span>
                    {currentUser?.role !== 'Peminjam' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setIsEditing(false);
                            setEditedBorrower(null);
                          } else {
                            setIsEditing(true);
                            setEditedLoan({ ...selectedLoan });
                            setEditedDetails(selectedDetails.map(d => ({ ...d })));
                            setEditedBorrower(selectedBorrower ? { ...selectedBorrower } : null);
                          }
                        }}
                        className="px-3 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition select-none cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        {isEditing ? 'Batal Edit' : 'Edit Data'}
                      </button>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                          <th className="p-3 w-12 text-center border-r border-slate-200">No</th>
                          <th className="p-3 w-32 border-r border-slate-200">Kode Barang</th>
                          <th className="p-3 border-r border-slate-200">Nama Barang / Merk Tipe</th>
                          <th className="p-3 text-center border-r border-slate-200 w-24">Jumlah Pinjam</th>
                          <th className="p-3 text-center border-r border-slate-200 w-28">Kondisi Pinjam</th>
                          {!isDipinjam && (
                            <>
                              <th className="p-3 text-center border-r border-slate-200 w-28">Jumlah Kembali</th>
                              <th className="p-3 text-center border-r border-slate-200 w-20">Sisa</th>
                            </>
                          )}
                          {isEditing && <th className="p-3 text-center w-16 text-rose-600">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-850">
                        {(isEditing ? editedDetails : selectedDetails).map((det, index) => {
                          const sisa = det.jumlah_pinjam - det.jumlah_kembali;
                          return (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="p-3 text-center text-gray-400 font-bold border-r border-slate-200">{index + 1}</td>
                              <td className="p-3 font-mono font-bold text-blue-800 border-r border-slate-200">{det.kode_barang}</td>
                              <td className="p-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">{det.nama_barang}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{det.merk_tipe}</div>
                              </td>
                              <td className="p-3 text-center font-bold font-mono border-r border-slate-200 text-slate-900">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={det.jumlah_pinjam}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setEditedDetails(prev => prev.map((d, i) => i === index ? { ...d, jumlah_pinjam: val } : d));
                                    }}
                                    className="w-16 px-1.5 py-1 border border-slate-300 rounded font-mono text-center text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                  />
                                ) : (
                                  det.jumlah_pinjam
                                )}
                              </td>
                              <td className="p-3 text-center border-r border-slate-200">
                                {isEditing ? (
                                  <select
                                    value={det.kondisi_pinjam}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditedDetails(prev => prev.map((d, i) => i === index ? { ...d, kondisi_pinjam: val } : d));
                                    }}
                                    className="px-1.5 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800"
                                  >
                                    <option value="Baik">Baik</option>
                                    <option value="Rusak Ringan">Rusak Ringan</option>
                                    <option value="Rusak Berat">Rusak Berat</option>
                                  </select>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                    {det.kondisi_pinjam}
                                  </span>
                                )}
                              </td>
                              {!isDipinjam && (
                                <>
                                  <td className="p-3 text-center font-bold font-mono text-emerald-600 border-r border-slate-200">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max={det.jumlah_pinjam}
                                        value={det.jumlah_kembali}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          setEditedDetails(prev => prev.map((d, i) => i === index ? { ...d, jumlah_kembali: val } : d));
                                        }}
                                        className="w-16 px-1.5 py-1 border border-slate-300 rounded font-mono text-center text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white text-emerald-600"
                                      />
                                    ) : (
                                      det.jumlah_kembali
                                    )}
                                  </td>
                                  <td className={`p-3 text-center font-bold font-mono ${isEditing ? 'border-r border-slate-200' : ''} ${sisa > 0 ? 'text-rose-600 bg-rose-50/30' : 'text-slate-500'}`}>{sisa}</td>
                                </>
                              )}
                              {isEditing && (
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditedDetails(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center justify-center mx-auto"
                                    title="Hapus barang"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tambah Barang BMN Form */}
                  {isEditing && (
                    <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-3 mt-3 animate-fade-in">
                      <div className="font-extrabold text-blue-950 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="h-4 w-4 text-blue-600 animate-pulse" /> Tambah Barang BMN Baru ke Daftar Pinjam
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Pilih Barang BMN</label>
                          <select
                            value={newItemId}
                            onChange={(e) => {
                              const id = parseInt(e.target.value) || '';
                              setNewItemId(id);
                              if (id && newItemQty <= 0) {
                                setNewItemQty(1);
                              }
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          >
                            <option value="">-- Pilih Barang BMN --</option>
                            {barangList
                              .filter(b => b.stok > 0 && b.status_ketersediaan === 'Tersedia' && !editedDetails.some(ed => ed.id_barang === b.id_barang))
                              .map(b => (
                                <option key={b.id_barang} value={b.id_barang}>
                                  {b.kode_barang} - {b.nama_barang} ({b.merk_tipe}) [Stok: {b.stok}]
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block text-center">Jumlah</label>
                          <input
                            type="number"
                            min="1"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800 font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Kondisi</label>
                          <select
                            value={newItemKondisi}
                            onChange={(e) => setNewItemKondisi(e.target.value as any)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Rusak Ringan">Rusak Ringan</option>
                            <option value="Rusak Berat">Rusak Berat</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddNewItemRow}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" /> Tambah
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto Bukti Peminjaman (Jika Ada) */}
                {selectedLoan.foto_peminjaman && (
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-fade-in print:break-inside-avoid">
                    <span className="font-extrabold text-slate-900 tracking-wider text-[10px] uppercase block flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-blue-600" /> FOTO BUKTI PEMINJAMAN / SERAH TERIMA BARANG BMN
                    </span>
                    <div className="flex justify-center bg-white border border-slate-200 rounded-xl p-2.5 overflow-hidden shadow-inner max-h-64">
                      <img 
                        src={selectedLoan.foto_peminjaman} 
                        alt="Foto Serah Terima" 
                        className="max-h-56 max-w-full object-contain rounded-lg" 
                      />
                    </div>
                  </div>
                )}

                {/* Signatures with Specimen Integration */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-xs">
                  {/* Left Signature Column - Borrower */}
                  <div className="text-center flex flex-col justify-between h-48 border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[9px] mb-1.5">Pegawai Penerima (Peminjam)</span>
                      <span className="text-slate-500 text-[11px]">Dengan penuh tanggung jawab atas keutuhan BMN</span>
                    </div>
                    <div className="flex items-center justify-center h-20 relative">
                      {selectedLoan.tanda_tangan ? (
                        <div className="relative">
                          <img 
                            src={selectedLoan.tanda_tangan} 
                            alt="Tanda Tangan Peminjam" 
                            className="max-h-16 max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105" 
                          />
                          <div className="absolute -bottom-1 -right-3 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-mono font-bold scale-90 flex items-center gap-0.5 shadow-sm">
                            <CheckCircle className="h-2 w-2 text-white" /> SIGNED
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 italic font-mono">( Tanda Tangan Fisik )</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold block border-b border-gray-400 mx-6 pb-1 text-slate-900">{selectedBorrower.nama_lengkap}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">Jabatan: {selectedBorrower.jabatan}</span>
                    </div>
                  </div>

                  {/* Right Signature Column - Officer with registered digital signature */}
                  <div className="text-center flex flex-col justify-between h-48 border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 relative overflow-hidden">
                    {/* BPK seal background element */}
                    <div className="absolute right-3 bottom-14 text-[42px] font-black text-blue-900/5 select-none font-sans leading-none pointer-events-none uppercase">
                      BPK
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[9px] mb-1.5">Petugas Pengelola BMN</span>
                      <span className="text-slate-500 text-[11px]">Balai Pelestarian Kebudayaan Banten</span>
                    </div>

                    <div className="flex items-center justify-center h-20 relative">
                      {creatorSignature ? (
                        <div className="relative">
                          <img 
                            src={creatorSignature} 
                            alt="Digital Signature Specimen" 
                            className="max-h-16 max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105" 
                          />
                          {/* Checked/Verified label badge */}
                          <div className="absolute -bottom-1 -right-3 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-mono font-bold scale-90 flex items-center gap-0.5 shadow-sm">
                            <CheckCircle className="h-2 w-2 text-white" /> VERIFIED
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[10px] text-amber-500 italic font-semibold">Tanda Tangan Belum Registrasi</span>
                          <span className="text-[9px] text-gray-400">Dapat didaftarkan di menu Manajemen Akun</span>
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
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedLoan(null);
                        setEditedDetails([]);
                      }}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSaveChanges}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" /> Simpan Perubahan
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      id="close-loan-detail-btn"
                      onClick={handleCloseDetail}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button 
                      id="print-invoice-btn"
                      onClick={() => {
                        window.print();
                        OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Cetak Nota Peminjaman: ${selectedLoan.nomor_peminjaman}`);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" /> Cetak Nota Peminjaman
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
