/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Calendar, FileText, ArrowLeft, Clipboard, Save } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjaman, DetailPeminjaman, Barang, Peminjam } from '../types';

interface PengembalianFormProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ReturnRowInput {
  id_detail: number;
  id_barang: number;
  nama_barang: string;
  kode_barang: string;
  jumlah_pinjam: number;
  jumlah_kembali_sebelumnya: number;
  jumlah_kembali_sekarang: number;
  kondisi_kembali: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
}

export default function PengembalianForm({ currentUser, onSuccess, onCancel }: PengembalianFormProps) {
  const [activeLoans, setActiveLoans] = useState<Peminjaman[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [loanHeader, setLoanHeader] = useState<Peminjaman | null>(null);
  const [borrowerInfo, setBorrowerInfo] = useState<Peminjam | null>(null);

  // Rows of items being processed for return
  const [returnItems, setReturnItems] = useState<ReturnRowInput[]>([]);

  // Form states
  const [tanggalPengembalian, setTanggalPengembalian] = useState('');
  const [catatan, setCatatan] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch only borrowings that are active (Dipinjam or Sebagian Kembali)
    const active = OfficeInventoryDb.getPeminjaman().filter(p => p.status === 'Dipinjam' || p.status === 'Sebagian Kembali');
    setActiveLoans(active);

    const today = new Date().toISOString().substring(0, 10);
    setTanggalPengembalian(today);
  }, []);

  // Fetch loan details when loanId changes
  useEffect(() => {
    if (!selectedLoanId) {
      setLoanHeader(null);
      setBorrowerInfo(null);
      setReturnItems([]);
      return;
    }

    const loanIdNum = Number(selectedLoanId);
    const loans = OfficeInventoryDb.getPeminjaman();
    const foundHeader = loans.find(l => l.id_peminjaman === loanIdNum) || null;
    setLoanHeader(foundHeader);

    if (foundHeader) {
      const bObj = OfficeInventoryDb.getPeminjam().find(p => p.id_peminjam === foundHeader.id_peminjam) || null;
      setBorrowerInfo(bObj);

      // Fetch corresponding items in detail table
      const details = OfficeInventoryDb.getDetailPeminjaman().filter(d => d.id_peminjaman === loanIdNum);
      const barangList = OfficeInventoryDb.getBarang();

      // Filter detail items that still have pending balances
      const rows: ReturnRowInput[] = details
        .filter(d => d.jumlah_pinjam > d.jumlah_kembali)
        .map(d => {
          const b = barangList.find(x => x.id_barang === d.id_barang);
          return {
            id_detail: d.id_detail,
            id_barang: d.id_barang,
            nama_barang: b?.nama_barang || 'Barang Terhapus',
            kode_barang: b?.kode_barang || 'BRG-??????',
            jumlah_pinjam: d.jumlah_pinjam,
            jumlah_kembali_sebelumnya: d.jumlah_kembali,
            jumlah_kembali_sekarang: d.jumlah_pinjam - d.jumlah_kembali, // Default to returning all sisa
            kondisi_kembali: 'Baik'
          };
        });

      setReturnItems(rows);
    }
  }, [selectedLoanId]);

  const handleQtyChange = (idx: number, val: number) => {
    const updated = [...returnItems];
    const maxVal = updated[idx].jumlah_pinjam - updated[idx].jumlah_kembali_sebelumnya;
    updated[idx].jumlah_kembali_sekarang = Math.min(maxVal, Math.max(0, val));
    setReturnItems(updated);
  };

  const handleKondisiChange = (idx: number, val: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang') => {
    const updated = [...returnItems];
    updated[idx].kondisi_kembali = val;
    setReturnItems(updated);
  };

  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLoanId) {
      setErrorMsg('Pilih nomor peminjaman terlebih dahulu.');
      return;
    }

    const totalToReturn = returnItems.reduce((sum, item) => sum + item.jumlah_kembali_sekarang, 0);
    if (totalToReturn === 0) {
      setErrorMsg('Anda harus mengisi jumlah kembali minimal 1 unit pada salah satu barang.');
      return;
    }

    if (!tanggalPengembalian) {
      setErrorMsg('Tanggal pengembalian wajib diisi.');
      return;
    }

    // Call storage transaction
    const res = OfficeInventoryDb.savePengembalian(
      Number(selectedLoanId),
      tanggalPengembalian,
      catatan || 'Pengembalian barang inventaris',
      returnItems.filter(item => item.jumlah_kembali_sekarang > 0).map(item => ({
        id_detail: item.id_detail,
        jumlah_kembali: item.jumlah_kembali_sekarang,
        kondisi_kembali: item.kondisi_kembali
      })),
      currentUser?.id_user || 2
    );

    if (res.success) {
      setSuccessMsg(res.message);
      setErrorMsg(null);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Back & Title */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <button 
          id="back-list-btn"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" /> Catat Pengembalian Barang
          </h2>
          <p className="text-xs text-gray-500">Proses pengembalian penuh atau sebagian dari transaksi peminjaman aktif beserta grading kondisi barang</p>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Action Form */}
      <form onSubmit={handleSaveReturn} className="space-y-6">
        
        {/* Loan Selection Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          
          {/* Active Loan Selection */}
          <div className="space-y-1 md:col-span-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Pilih Transaksi Peminjaman</label>
            <select 
              id="return-loan-select"
              required
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              <option value="">-- Cari Nomor Peminjaman --</option>
              {activeLoans.map(p => {
                const b = OfficeInventoryDb.getPeminjam().find(x => x.id_peminjam === p.id_peminjam);
                return (
                  <option key={p.id_peminjaman} value={p.id_peminjaman}>
                    {p.nomor_peminjaman} - {b?.nama_lengkap || 'Staff'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tanggal Pengembalian */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Tanggal Pengembalian</label>
            <input 
              id="return-date-input"
              type="date" 
              required
              value={tanggalPengembalian}
              onChange={(e) => setTanggalPengembalian(e.target.value)}
              className="w-full px-3.5 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
            />
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Catatan Tambahan</label>
            <input 
              id="return-note-input"
              type="text" 
              placeholder="cth: Seluruh barang kembali dengan aman..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3.5 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

        </div>

        {/* Borrower Detail Card if Selected */}
        {loanHeader && borrowerInfo && (
          <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100 text-xs text-blue-900 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="font-semibold text-blue-700 uppercase">NIP / NIK Peminjam</span>
              <p className="font-mono mt-0.5 text-gray-800 font-bold">{borrowerInfo.nip_nik}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-700 uppercase">Nama Pegawai</span>
              <p className="mt-0.5 text-gray-800 font-bold">{borrowerInfo.nama_lengkap}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-700 uppercase">Instansi / Unit Kerja</span>
              <p className="mt-0.5 text-gray-800 font-medium">{borrowerInfo.instansi_unit_kerja}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-700 uppercase">Rencana Kembali</span>
              <p className="font-mono mt-0.5 text-rose-600 font-bold">{loanHeader.tanggal_rencana_kembali}</p>
            </div>
          </div>
        )}

        {/* LIST OF BORROWED ITEMS IN SELECTION */}
        {selectedLoanId ? (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tentukan Jumlah & Kondisi Barang Yang Dikembalikan</h4>
            
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-28">Kode Barang</th>
                    <th className="py-2.5 px-4">Nama Barang</th>
                    <th className="py-2.5 px-4 text-center">Jumlah Pinjam</th>
                    <th className="py-2.5 px-4 text-center">Sudah Kembali</th>
                    <th className="py-2.5 px-4 text-center">Sisa Pinjaman</th>
                    <th className="py-2.5 px-4 text-center w-36">Jumlah Kembali Sekarang</th>
                    <th className="py-2.5 px-4 text-center w-48">Kondisi Saat Kembali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm">
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400 text-xs">
                        Seluruh barang dalam transaksi ini sudah berhasil dikembalikan sepenuhnya.
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, index) => {
                      const sisa = item.jumlah_pinjam - item.jumlah_kembali_sebelumnya;
                      return (
                        <tr key={item.id_detail} className="hover:bg-gray-50/50 transition">
                          {/* Code */}
                          <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">{item.kode_barang}</td>
                          
                          {/* Name */}
                          <td className="py-3 px-4 font-semibold text-gray-900">{item.nama_barang}</td>
                          
                          {/* Qty Borrowed */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-gray-600">{item.jumlah_pinjam}</td>
                          
                          {/* Qty Already Returned */}
                          <td className="py-3 px-4 text-center font-mono text-emerald-600 font-semibold">{item.jumlah_kembali_sebelumnya}</td>
                          
                          {/* Sisa */}
                          <td className="py-3 px-4 text-center font-mono text-rose-600 font-bold">{sisa}</td>
                          
                          {/* Input returns now */}
                          <td className="py-3 px-4 text-center">
                            <input 
                              id={`qty-return-${index}`}
                              type="number"
                              min={0}
                              max={sisa}
                              value={item.jumlah_kembali_sekarang}
                              onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                              className="w-24 px-2 py-1 border rounded-lg text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Condition Grade */}
                          <td className="py-3 px-4">
                            <select
                              id={`condition-return-${index}`}
                              value={item.kondisi_kembali}
                              onChange={(e) => handleKondisiChange(index, e.target.value as any)}
                              className="w-full px-2.5 py-1 border rounded-lg text-xs font-semibold bg-white focus:outline-none"
                            >
                              <option value="Baik">Baik (Stok Bertambah)</option>
                              <option value="Rusak Ringan">Rusak Ringan (Stok Bertambah)</option>
                              <option value="Rusak Berat">Rusak Berat (Stok Bertambah)</option>
                              <option value="Hilang">Hilang (Stok Mati)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-gray-100 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <Clipboard className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Pilih nomor peminjaman di atas terlebih dahulu untuk memproses pengembalian barang.</p>
          </div>
        )}

        {/* Submit action panel */}
        {selectedLoanId && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button 
              id="cancel-return-form-btn"
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border rounded-xl font-semibold text-gray-600 hover:bg-gray-150 transition text-sm"
            >
              Batal
            </button>
            <button 
              id="save-return-form-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition text-sm flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" /> Simpan Pengembalian
            </button>
          </div>
        )}

      </form>

    </div>
  );
}
