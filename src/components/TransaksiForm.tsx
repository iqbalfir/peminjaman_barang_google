/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, FileText, CheckCircle, AlertCircle, ShoppingBag, PlusCircle, ArrowLeft, Paperclip } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjam, Barang } from '../types';

interface TransaksiFormProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface SelectedItem {
  id_barang: number;
  nama_barang: string;
  kode_barang: string;
  stok_tersedia: number;
  jumlah_pinjam: number;
  kondisi_pinjam: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  keterangan: string;
}

export default function TransaksiForm({ currentUser, onSuccess, onCancel }: TransaksiFormProps) {
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);

  // Generated document code
  const [nomorPeminjaman, setNomorPeminjaman] = useState('');

  // Form states
  const [idPeminjam, setIdPeminjam] = useState<string>('');
  const [tanggalPinjam, setTanggalPinjam] = useState('');
  const [tanggalRencanaKembali, setTanggalRencanaKembali] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [dokumenPendukung, setDokumenPendukung] = useState<string>('');

  // Dynamic rows state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Current adding item dropdown selected
  const [currentBarangId, setCurrentBarangId] = useState<string>('');
  const [currentJml, setCurrentJml] = useState<number>(1);
  const [currentKondisi, setCurrentKondisi] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [currentKet, setCurrentKet] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setPeminjamList(OfficeInventoryDb.getPeminjam());
    const availableGoods = OfficeInventoryDb.getBarang().filter(b => b.stok > 0 && b.status_ketersediaan === 'Tersedia');
    setBarangList(availableGoods);

    // Default dates
    const today = new Date().toISOString().substring(0, 10);
    setTanggalPinjam(today);
    
    // Default return date is today + 5 days
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 5);
    setTanggalRencanaKembali(returnDate.toISOString().substring(0, 10));

    // Generate code
    setNomorPeminjaman(OfficeInventoryDb.generatePeminjamanCode());
  }, []);

  // Set default quantities when selecting item
  useEffect(() => {
    if (currentBarangId) {
      const b = barangList.find(x => x.id_barang === Number(currentBarangId));
      if (b) {
        setCurrentKondisi(b.kondisi_barang);
      }
    }
  }, [currentBarangId, barangList]);

  // Handler: Add Row to Items Table
  const handleAddItemRow = () => {
    if (!currentBarangId) {
      setErrorMsg('Pilih barang terlebih dahulu.');
      return;
    }

    const bId = Number(currentBarangId);
    const selectedGoods = barangList.find(x => x.id_barang === bId);
    if (!selectedGoods) return;

    // Check duplicate
    if (selectedItems.some(item => item.id_barang === bId)) {
      setErrorMsg(`Barang "${selectedGoods.nama_barang}" sudah ada di daftar pinjam. Anda tidak boleh memilih barang yang sama dua kali.`);
      return;
    }

    // Check stock
    if (currentJml <= 0) {
      setErrorMsg('Jumlah pinjam harus minimal 1 unit.');
      return;
    }

    if (currentJml > selectedGoods.stok) {
      setErrorMsg(`Jumlah pinjam (${currentJml}) melebihi stok yang tersedia (${selectedGoods.stok}) untuk barang "${selectedGoods.nama_barang}".`);
      return;
    }

    const newItem: SelectedItem = {
      id_barang: bId,
      nama_barang: selectedGoods.nama_barang,
      kode_barang: selectedGoods.kode_barang,
      stok_tersedia: selectedGoods.stok,
      jumlah_pinjam: currentJml,
      kondisi_pinjam: currentKondisi,
      keterangan: currentKet || 'Digunakan sesuai keperluan'
    };

    setSelectedItems([...selectedItems, newItem]);
    setErrorMsg(null);

    // Reset current row builders
    setCurrentBarangId('');
    setCurrentJml(1);
    setCurrentKet('');
  };

  const handleRemoveItemRow = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDokumenPendukung(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idPeminjam) {
      setErrorMsg('Pilih peminjam terlebih dahulu.');
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMsg('Anda harus menambahkan minimal satu barang ke daftar peminjaman.');
      return;
    }

    if (!tanggalPinjam || !tanggalRencanaKembali) {
      setErrorMsg('Tanggal pinjam dan tanggal rencana kembali wajib diisi.');
      return;
    }

    if (new Date(tanggalRencanaKembali) < new Date(tanggalPinjam)) {
      setErrorMsg('Tanggal rencana kembali tidak boleh mendahului tanggal pinjam.');
      return;
    }

    // Call DB Mock Transaction
    const response = OfficeInventoryDb.createPeminjaman(
      Number(idPeminjam),
      tanggalPinjam,
      tanggalRencanaKembali,
      keperluan || 'Keperluan dinas internal',
      keterangan || '-',
      dokumenPendukung || 'Surat_Tugas_Pegawai.pdf',
      selectedItems.map(item => ({
        id_barang: item.id_barang,
        jumlah_pinjam: item.jumlah_pinjam,
        kondisi_pinjam: item.kondisi_pinjam,
        keterangan: item.keterangan
      })),
      currentUser?.id_user || 2 // Default to active petugas/user
    );

    if (response.success) {
      setSuccessMsg(response.message);
      setErrorMsg(null);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setErrorMsg(response.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Back button & Title */}
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
            <ShoppingBag className="h-5 w-5 text-blue-600" /> Transaksi Peminjaman Multi-Item
          </h2>
          <p className="text-xs text-gray-500">Formulir check-out peminjaman barang kantor sekaligus banyak item dengan verifikasi stok real-time</p>
        </div>
      </div>

      {/* Alert Error / Success */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Checkout Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Row 1: General Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          
          {/* No. Peminjaman */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">No. Peminjaman</label>
            <input 
              type="text" 
              disabled 
              value={nomorPeminjaman}
              className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-500 font-mono font-bold text-sm"
            />
          </div>

          {/* Peminjam Selector (Select2 simulation) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Peminjam (Pegawai)</label>
            <select 
              id="loan-borrower-select"
              required
              value={idPeminjam}
              onChange={(e) => setIdPeminjam(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              <option value="">-- Pilih Pegawai --</option>
              {peminjamList.map(p => (
                <option key={p.id_peminjam} value={p.id_peminjam}>{p.nama_lengkap} ({p.nip_nik})</option>
              ))}
            </select>
          </div>

          {/* Tanggal Pinjam */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tanggal Pinjam</label>
            <input 
              id="loan-date-input"
              type="date" 
              required
              value={tanggalPinjam}
              onChange={(e) => setTanggalPinjam(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
            />
          </div>

          {/* Tanggal Rencana Kembali */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rencana Pengembalian</label>
            <input 
              id="loan-duedate-input"
              type="date" 
              required
              value={tanggalRencanaKembali}
              onChange={(e) => setTanggalRencanaKembali(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
            />
          </div>

        </div>

        {/* Row 2: Keperluan / Lampiran */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Keperluan / Keterangan Tugas</label>
            <input 
              id="loan-purpose-input"
              type="text"
              required
              placeholder="Contoh: Liputan dokumentasi lapangan menteri di Gedung Merdeka"
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Document attachment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dokumen Pendukung (Surat Tugas)</label>
            <div className="relative border border-dashed border-gray-200 rounded-xl p-1 bg-white hover:bg-gray-50 transition">
              <input 
                type="file" 
                id="doc-attachment"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="p-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  {dokumenPendukung ? dokumenPendukung : 'Lampirkan Surat Tugas (PDF/JPG)'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION: Tambah Barang Row Builder (Select2 Dynamic Row) */}
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 space-y-3">
          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4 text-blue-600" /> Tambah Item Barang Ke Daftar Pinjam
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            
            {/* Barang Selector */}
            <div className="space-y-1 md:col-span-4">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Pilih Barang</label>
              <select 
                id="row-barang-select"
                value={currentBarangId}
                onChange={(e) => setCurrentBarangId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-700"
              >
                <option value="">-- Cari Barang Tersedia --</option>
                {barangList.map(b => (
                  <option key={b.id_barang} value={b.id_barang}>
                    {b.nama_barang} [{b.kode_barang}] - Stok: {b.stok} ({b.kondisi_barang})
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah Pinjam */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Jumlah Pinjam</label>
              <input 
                id="row-qty-input"
                type="number"
                min={1}
                value={currentJml}
                onChange={(e) => setCurrentJml(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
              />
            </div>

            {/* Kondisi saat pinjam (read-only / static based on selected item, or selectable) */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Kondisi</label>
              <select
                id="row-condition-select"
                value={currentKondisi}
                onChange={(e) => setCurrentKondisi(e.target.value as any)}
                className="w-full px-3 py-1.5 border rounded-xl bg-gray-50 focus:outline-none text-sm font-semibold"
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>

            {/* Keterangan Item */}
            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Catatan / Keterangan</label>
              <input 
                id="row-desc-input"
                type="text"
                placeholder="cth: Untuk presenter / lab..."
                value={currentKet}
                onChange={(e) => setCurrentKet(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Action button */}
            <div className="md:col-span-1">
              <button 
                id="add-row-item-btn"
                type="button"
                onClick={handleAddItemRow}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex justify-center items-center gap-1 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>

          </div>
        </div>

        {/* SECTION: Dynamic Table Rows */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Daftar Barang Yang Akan Di-Checkout ({selectedItems.length} Item)</label>
          
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-28">Kode Barang</th>
                  <th className="py-2.5 px-4">Nama Barang</th>
                  <th className="py-2.5 px-4 text-center">Stok Tersedia</th>
                  <th className="py-2.5 px-4 text-center w-32">Jumlah Pinjam</th>
                  <th className="py-2.5 px-4 text-center">Kondisi Pinjam</th>
                  <th className="py-2.5 px-4">Keterangan</th>
                  <th className="py-2.5 px-4 text-center w-20">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                      Belum ada barang yang ditambahkan ke keranjang checkout. Gunakan form builder di atas.
                    </td>
                  </tr>
                ) : (
                  selectedItems.map((item, index) => (
                    <tr key={item.id_barang} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">{item.kode_barang}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{item.nama_barang}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">{item.stok_media || item.stok_tersedia}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl font-bold font-mono text-xs">
                          {item.jumlah_pinjam} Unit
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {item.kondisi_pinjam}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium max-w-xs truncate">{item.keterangan}</td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          id={`remove-loan-row-${index}`}
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button 
            id="cancel-loan-form-btn"
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border rounded-xl font-semibold text-gray-600 hover:bg-gray-150 transition text-sm"
          >
            Batal
          </button>
          <button 
            id="save-loan-form-btn"
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition text-sm flex items-center gap-1.5"
          >
            <CheckCircle className="h-4 w-4" /> Simpan Transaksi Peminjaman
          </button>
        </div>

      </form>

    </div>
  );
}
