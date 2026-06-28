/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Eye, Calendar, User, FileText, CheckCircle, Clock, FileDown, Printer, X, ShoppingBag } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjaman, DetailPeminjaman, Barang, Peminjam } from '../types';

interface RiwayatTransaksiProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function RiwayatTransaksi({ currentUser }: RiwayatTransaksiProps) {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [detailList, setDetailList] = useState<DetailPeminjaman[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected for View Modal
  const [selectedLoan, setSelectedLoan] = useState<Peminjaman | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<Peminjam | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPeminjamanList(OfficeInventoryDb.getPeminjaman());
    setDetailList(OfficeInventoryDb.getDetailPeminjaman());
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
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
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">No. Peminjaman</th>
              <th className="py-3 px-4">Tanggal Pinjam</th>
              <th className="py-3 px-4">Nama Peminjam</th>
              <th className="py-3 px-4">Keperluan / Keterangan</th>
              <th className="py-3 px-4 text-center">Jumlah Item</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-sm">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                  Tidak ditemukan riwayat peminjaman barang.
                </td>
              </tr>
            ) : (
              filteredLoans.map((p, idx) => {
                const borrower = peminjamList.find(x => x.id_peminjam === p.id_peminjam);
                const itemsCount = detailList.filter(d => d.id_peminjaman === p.id_peminjaman).reduce((sum, d) => sum + d.jumlah_pinjam, 0);
                return (
                  <tr key={p.id_peminjaman} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 text-center text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">{p.nomor_peminjaman}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{p.tanggal_pinjam}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Kembali: {p.tanggal_rencana_kembali}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{borrower?.nama_lengkap || 'Unknown'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{borrower?.nip_nik}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-xs text-gray-600 font-medium">
                      <span className="font-semibold text-gray-800 block truncate">{p.keperluan}</span>
                      {p.keterangan}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-800">
                      {itemsCount} Unit
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        p.status === 'Sebagian Kembali' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <button 
                          id={`view-detail-${p.id_peminjaman}`}
                          onClick={() => handleOpenDetail(p)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
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
      {selectedLoan && selectedBorrower && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden border flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Nota Transaksi Peminjaman</h3>
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedLoan.nomor_peminjaman}</span>
              </div>
              <button 
                id="close-loan-detail"
                onClick={() => setSelectedLoan(null)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Printable Segment */}
            <div id="printable-loan-invoice" className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Header Letterhead */}
              <div className="border-b-2 border-gray-300 pb-4 text-center space-y-1">
                <h2 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">Peminjaman Barang BMN</h2>
                <h3 className="text-sm font-bold text-slate-600 uppercase">Balai Pelestarian Kebudayaan Banten</h3>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                
                {/* Left block - Loan detail */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="font-bold text-blue-800 text-xs mb-1 uppercase tracking-wider">DETAIL PINJAMAN</div>
                  <div><span className="text-gray-400 font-medium">No PJM:</span> <span className="font-bold font-mono text-gray-800">{selectedLoan.nomor_peminjaman}</span></div>
                  <div><span className="text-gray-400 font-medium">Tanggal Pinjam:</span> <span className="font-semibold text-gray-800">{selectedLoan.tanggal_pinjam}</span></div>
                  <div><span className="text-gray-400 font-medium">Jatuh Tempo:</span> <span className="font-semibold text-rose-600 font-mono">{selectedLoan.tanggal_rencana_kembali}</span></div>
                  <div><span className="text-gray-400 font-medium">Status:</span> <span className="font-bold text-blue-700">{selectedLoan.status.toUpperCase()}</span></div>
                </div>

                {/* Right block - Borrower info */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="font-bold text-blue-800 text-xs mb-1 uppercase tracking-wider">DATA PEGAWAI (PEMINJAM)</div>
                  <div><span className="text-gray-400 font-medium">NIP / NIK:</span> <span className="font-bold font-mono text-gray-800">{selectedBorrower.nip_nik}</span></div>
                  <div><span className="text-gray-400 font-medium">Nama:</span> <span className="font-bold text-gray-800">{selectedBorrower.nama_lengkap}</span></div>
                  <div><span className="text-gray-400 font-medium">Unit Kerja:</span> <span className="font-semibold text-gray-700">{selectedBorrower.instansi_unit_kerja}</span></div>
                  <div><span className="text-gray-400 font-medium">Jabatan:</span> <span className="font-semibold text-gray-600">{selectedBorrower.jabatan}</span></div>
                </div>

              </div>

              {/* Purposes */}
              <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold text-blue-800 block mb-1 uppercase tracking-wider">Keperluan Tugas</span>
                <p className="text-gray-700 font-medium">{selectedLoan.keperluan}</p>
                {selectedLoan.keterangan && selectedLoan.keterangan !== '-' && (
                  <p className="text-gray-400 text-[11px] mt-1 italic">Catatan: {selectedLoan.keterangan}</p>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-1">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-xs block">Daftar Barang Inventaris yang Dipinjam</span>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b font-bold text-gray-600">
                        <th className="p-2 w-12 text-center">No</th>
                        <th className="p-2 w-28">Kode Barang</th>
                        <th className="p-2">Nama Barang / Merk Tipe</th>
                        <th className="p-2 text-center">Jumlah Pinjam</th>
                        <th className="p-2 text-center">Kondisi Pinjam</th>
                        <th className="p-2 text-center">Jumlah Kembali</th>
                        <th className="p-2 text-center">Sisa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {selectedDetails.map((det, index) => {
                        const sisa = det.jumlah_pinjam - det.jumlah_kembali;
                        return (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-gray-400">{index + 1}</td>
                            <td className="p-2 font-mono font-bold text-blue-700">{det.kode_barang}</td>
                            <td className="p-2 font-semibold text-gray-800">
                              {det.nama_barang}
                              <div className="text-[10px] text-gray-400 font-mono font-medium">{det.merk_tipe}</div>
                            </td>
                            <td className="p-2 text-center font-bold font-mono">{det.jumlah_pinjam}</td>
                            <td className="p-2 text-center">
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {det.kondisi_pinjam}
                              </span>
                            </td>
                            <td className="p-2 text-center font-bold font-mono text-emerald-600">{det.jumlah_kembali}</td>
                            <td className="p-2 text-center font-bold font-mono text-rose-600">{sisa}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-10 pt-10 text-xs">
                <div className="text-center">
                  <span className="text-gray-400 block mb-12">Peminjam / Penerima</span>
                  <span className="font-bold block border-b border-gray-400 mx-10 pb-0.5">{selectedBorrower.nama_lengkap}</span>
                  <span className="text-[10px] text-gray-400 font-mono">NIP: {selectedBorrower.nip_nik}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-400 block mb-12">Petugas Pengelola Inventaris</span>
                  <span className="font-bold block border-b border-gray-400 mx-10 pb-0.5">{currentUser?.nama_user || 'Petugas Administrasi'}</span>
                  <span className="text-[10px] text-gray-400">Balai Pelestarian Kebudayaan Banten</span>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button 
                id="close-loan-detail-btn"
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 border rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-150 transition"
              >
                Tutup
              </button>
              <button 
                id="print-invoice-btn"
                onClick={() => {
                  window.print();
                  OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Cetak Nota Peminjaman: ${selectedLoan.nomor_peminjaman}`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Cetak Nota Peminjaman
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
