/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, FileText, CheckCircle, AlertCircle, ShoppingBag, PlusCircle, ArrowLeft, Paperclip, Eraser, PenTool, Search } from 'lucide-react';
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

  // Peminjam autocomplete states
  const [searchPeminjamTerm, setSearchPeminjamTerm] = useState<string>('');
  const [showPeminjamSuggestions, setShowPeminjamSuggestions] = useState<boolean>(false);

  // Barang autocomplete states
  const [showBarangSuggestions, setShowBarangSuggestions] = useState<boolean>(false);

  // Signature related states
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

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
  const [searchBarangTerm, setSearchBarangTerm] = useState<string>('');
  const [currentJml, setCurrentJml] = useState<number>(1);
  const [currentKondisi, setCurrentKondisi] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [currentKet, setCurrentKet] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredBarangList = barangList.filter(b => 
    b.nama_barang.toLowerCase().includes(searchBarangTerm.toLowerCase()) ||
    b.kode_barang.toLowerCase().includes(searchBarangTerm.toLowerCase())
  );

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

  // Initialize canvas size and fill background with white
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || 500;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle drawing on canvas
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e3a8a'; // Deep blue pen color
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    canvas.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

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
    setSearchBarangTerm('');
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

    // Require digital signature
    if (!hasSigned) {
      setErrorMsg('Tanda tangan digital peminjam wajib diisi sebagai bukti verifikasi transaksi peminjaman.');
      return;
    }

    const signatureBase64 = canvasRef.current?.toDataURL('image/png') || '';

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
      currentUser?.id_user || 2, // Default to active petugas/user
      signatureBase64
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

          {/* Peminjam Selector (Search as you type autocomplete) */}
          <div className="space-y-1 relative">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Peminjam (Pegawai)</label>
            <div className="relative">
              <input 
                id="loan-borrower-search"
                type="text" 
                required
                placeholder="Ketik nama pegawai..."
                value={searchPeminjamTerm}
                onChange={(e) => {
                  setSearchPeminjamTerm(e.target.value);
                  setShowPeminjamSuggestions(true);
                  if (idPeminjam) {
                    setIdPeminjam(''); // reset selection if they continue typing
                  }
                }}
                onFocus={() => setShowPeminjamSuggestions(true)}
                className="w-full px-3 py-2 pl-9 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800 placeholder:text-gray-400 placeholder:font-normal"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Search className="h-4 w-4" />
              </div>

              {idPeminjam && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">Terpilih</span>
                </div>
              )}
            </div>

            {/* Suggestions list under the input */}
            {showPeminjamSuggestions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowPeminjamSuggestions(false)} 
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-20 divide-y divide-slate-100">
                  {peminjamList.filter(p => 
                    p.nama_lengkap.toLowerCase().includes(searchPeminjamTerm.toLowerCase()) ||
                    p.instansi_unit_kerja.toLowerCase().includes(searchPeminjamTerm.toLowerCase())
                  ).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      Pegawai tidak ditemukan. Silakan daftarkan di Master Peminjam.
                    </div>
                  ) : (
                    peminjamList.filter(p => 
                      p.nama_lengkap.toLowerCase().includes(searchPeminjamTerm.toLowerCase()) ||
                      p.instansi_unit_kerja.toLowerCase().includes(searchPeminjamTerm.toLowerCase())
                    ).map(p => (
                      <button
                        key={p.id_peminjam}
                        type="button"
                        onClick={() => {
                          setIdPeminjam(String(p.id_peminjam));
                          setSearchPeminjamTerm(p.nama_lengkap);
                          setShowPeminjamSuggestions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50/50 transition text-xs flex flex-col gap-0.5"
                      >
                        <span className="font-bold text-slate-800">{p.nama_lengkap}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{p.instansi_unit_kerja} • {p.jabatan}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
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
            
            {/* Barang Selector with Autocomplete */}
            <div className="space-y-1 md:col-span-5 relative">
              <label className="text-[10px] font-bold text-blue-800 uppercase block">Cari & Pilih Barang</label>
              <div className="relative">
                <input 
                  id="row-barang-autocomplete"
                  type="text" 
                  placeholder="Ketik nama atau kode barang..."
                  value={searchBarangTerm}
                  onChange={(e) => {
                    setSearchBarangTerm(e.target.value);
                    setShowBarangSuggestions(true);
                    if (currentBarangId) {
                      setCurrentBarangId('');
                    }
                  }}
                  onFocus={() => setShowBarangSuggestions(true)}
                  className="w-full px-3 py-1.5 pl-9 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800 placeholder:text-gray-400 placeholder:font-normal"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Search className="h-3.5 w-3.5" />
                </div>

                {currentBarangId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-wider">Terpilih</span>
                  </div>
                )}
              </div>

              {/* Suggestions list under the input */}
              {showBarangSuggestions && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowBarangSuggestions(false)} 
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-20 divide-y divide-slate-100">
                    {filteredBarangList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 italic">
                        Barang tidak ditemukan atau stok habis.
                      </div>
                    ) : (
                      filteredBarangList.map(b => (
                        <button
                          key={b.id_barang}
                          type="button"
                          onClick={() => {
                            setCurrentBarangId(String(b.id_barang));
                            setSearchBarangTerm(`${b.nama_barang} [${b.kode_barang}]`);
                            setShowBarangSuggestions(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-blue-50/50 transition text-xs flex flex-col gap-0.5"
                        >
                          <span className="font-bold text-slate-800">{b.nama_barang} <span className="font-mono text-gray-400 text-[9px] font-medium">[{b.kode_barang}]</span></span>
                          <span className="text-[10px] text-slate-400 font-medium">Stok Tersedia: {b.stok} • Kondisi: {b.kondisi_barang}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Jumlah Pinjam */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Jumlah</label>
              <input 
                id="row-qty-input"
                type="number"
                min={1}
                value={currentJml}
                onChange={(e) => setCurrentJml(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold font-mono"
              />
            </div>

            {/* Kondisi saat pinjam */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Kondisi</label>
              <select
                id="row-condition-select"
                value={currentKondisi}
                onChange={(e) => setCurrentKondisi(e.target.value as any)}
                className="w-full px-3 py-1.5 border rounded-xl bg-gray-50 focus:outline-none text-sm font-semibold text-slate-700"
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

        {/* SECTION: Tanda Tangan Digital */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-blue-600" /> Tanda Tangan Digital Peminjam
              </h4>
              <p className="text-[11px] text-gray-500">Gunakan mouse, trackpad, atau layar sentuh untuk menggambar tanda tangan di area putih di bawah</p>
            </div>
            <div>
              {hasSigned ? (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tanda Tangan Terbaca
                </span>
              ) : (
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Belum Ditandatangani
                </span>
              )}
            </div>
          </div>
          
          <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className="w-full h-40 cursor-crosshair bg-white touch-none"
              style={{ display: 'block' }}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 italic">Kolom di atas merupakan dokumen bukti serah terima resmi</span>
            <button
              type="button"
              onClick={clearSignature}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-slate-300 rounded-xl transition font-bold flex items-center gap-1 shadow-xs text-xs"
            >
              <Eraser className="h-3.5 w-3.5" /> Bersihkan Area
            </button>
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
