/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, Package, QrCode, Printer, Image, Eye, History, Camera, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Barang, Kategori } from '../types';
import * as XLSX from 'xlsx';

interface BarangCRUDProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function BarangCRUD({ currentUser }: BarangCRUDProps) {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // QR Code Print states
  const [qrPrintItem, setQrPrintItem] = useState<Barang | null>(null);

  // Scan simulation states
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanResultItem, setScanResultItem] = useState<Barang | null>(null);

  // Item history states
  const [historyItem, setHistoryItem] = useState<Barang | null>(null);
  const [itemHistory, setItemHistory] = useState<any[]>([]);

  // Form states
  const [kodeBarang, setKodeBarang] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [idKategori, setIdKategori] = useState<number>(1);
  const [merkTipe, setMerkTipe] = useState('');
  const [lokasiPenyimpanan, setLokasiPenyimpanan] = useState('');
  const [stok, setStok] = useState<number>(1);
  const [stokMinimum, setStokMinimum] = useState<number>(1);
  const [kondisiBarang, setKondisiBarang] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [fotoBarang, setFotoBarang] = useState<string>('');
  const [statusKetersediaan, setStatusKetersediaan] = useState<'Tersedia' | 'Dipinjam' | 'Tidak Aktif'>('Tersedia');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Excel Import states
  const [modalTab, setModalTab] = useState<'manual' | 'excel'>('manual');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBarangList(OfficeInventoryDb.getBarang());
    setCategories(OfficeInventoryDb.getKategori());
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditId(null);
    setModalTab('manual');
    setParsedItems([]);
    setExcelFileName('');
    setKodeBarang(OfficeInventoryDb.generateBarangCode());
    setNamaBarang('');
    if (categories.length > 0) {
      setIdKategori(categories[0].id_kategori);
    }
    setMerkTipe('');
    setLokasiPenyimpanan('');
    setStok(1);
    setStokMinimum(1);
    setKondisiBarang('Baik');
    setFotoBarang('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&q=80'); // Generic box default
    setStatusKetersediaan('Tersedia');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Barang) => {
    setEditId(b.id_barang);
    setModalTab('manual');
    setParsedItems([]);
    setExcelFileName('');
    setKodeBarang(b.kode_barang);
    setNamaBarang(b.nama_barang);
    setIdKategori(b.id_kategori);
    setMerkTipe(b.merk_tipe);
    setLokasiPenyimpanan(b.lokasi_penyimpanan);
    setStok(b.stok);
    setStokMinimum(b.stok_minimum);
    setKondisiBarang(b.kondisi_barang);
    setFotoBarang(b.foto_barang);
    setStatusKetersediaan(b.status_ketersediaan);
    setIsModalOpen(true);
  };

  // Convert uploaded image to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500kb limit for localStorage
        showNotification('error', 'Ukuran gambar terlalu besar. Maksimal 500 KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBarang(reader.result as string);
        showNotification('success', 'Gambar berhasil diunggah.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaBarang.trim()) {
      showNotification('error', 'Nama barang wajib diisi.');
      return;
    }

    const currentList = [...barangList];

    if (editId !== null) {
      // Edit mode
      const index = currentList.findIndex(b => b.id_barang === editId);
      if (index !== -1) {
        currentList[index] = {
          ...currentList[index],
          nama_barang: namaBarang,
          id_kategori: Number(idKategori),
          merk_tipe: merkTipe,
          lokasi_penyimpanan: lokasiPenyimpanan,
          stok: Number(stok),
          stok_minimum: Number(stokMinimum),
          kondisi_barang: kondisiBarang,
          foto_barang: fotoBarang,
          status_ketersediaan: statusKetersediaan,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        OfficeInventoryDb.saveBarang(currentList);
        OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Edit Barang: "${namaBarang}" (${kodeBarang})`);
        showNotification('success', 'Data barang berhasil diperbarui!');
      }
    } else {
      // Create mode
      const generatedCode = OfficeInventoryDb.generateBarangCode();
      const nextId = currentList.length > 0 ? Math.max(...currentList.map(b => b.id_barang)) + 1 : 1;
      
      const newBarang: Barang = {
        id_barang: nextId,
        kode_barang: generatedCode,
        nama_barang: namaBarang,
        id_kategori: Number(idKategori),
        merk_tipe: merkTipe,
        lokasi_penyimpanan: lokasiPenyimpanan,
        stok: Number(stok),
        stok_minimum: Number(stokMinimum),
        kondisi_barang: kondisiBarang,
        foto_barang: fotoBarang,
        status_ketersediaan: Number(stok) > 0 ? 'Tersedia' : 'Dipinjam',
        qr_code: generatedCode,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      currentList.push(newBarang);
      OfficeInventoryDb.saveBarang(currentList);
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Tambah Barang Baru: "${namaBarang}" (${generatedCode})`);
      showNotification('success', `Barang baru berhasil ditambahkan dengan Kode: ${generatedCode}`);
    }

    loadData();
    setIsModalOpen(false);
  };

  // Download template import barang Excel
  const downloadTemplate = () => {
    const templateData = [
      {
        "Nama Barang": "Laptop Lenovo ThinkPad L14",
        "Kategori": "Elektronik & IT",
        "Merk Tipe": "ThinkPad L14 Gen 3",
        "Lokasi Penyimpanan": "Lemari IT, Gedung A",
        "Stok": 5,
        "Stok Minimum": 1,
        "Kondisi": "Baik"
      },
      {
        "Nama Barang": "Meja Rapat Kayu Jati",
        "Kategori": "Furniture & Mebel",
        "Merk Tipe": "Custom Jati 120x240",
        "Lokasi Penyimpanan": "Ruang Rapat Utama",
        "Stok": 1,
        "Stok Minimum": 1,
        "Kondisi": "Baik"
      },
      {
        "Nama Barang": "Paper Shredder Secure",
        "Kategori": "Alat Tulis Kantor",
        "Merk Tipe": "Secure Easy S",
        "Lokasi Penyimpanan": "Ruang Logistik",
        "Stok": 2,
        "Stok Minimum": 1,
        "Kondisi": "Baik"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template_import_barang.xlsx");
  };

  // Parse uploaded Excel / CSV
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (json.length === 0) {
          showNotification('error', 'File Excel kosong atau tidak memiliki data.');
          return;
        }

        const mapped = json.map((row, idx) => {
          const rawNama = row['Nama Barang'] || row['Nama'] || row['nama_barang'] || row['nama'] || '';
          const rawKategori = row['Kategori'] || row['Kategori Barang'] || row['id_kategori'] || row['kategori'] || '';
          const rawMerk = row['Merk Tipe'] || row['Merk'] || row['Tipe'] || row['merk_tipe'] || row['merk'] || '';
          const rawLokasi = row['Lokasi Penyimpanan'] || row['Lokasi'] || row['lokasi_penyimpanan'] || row['lokasi'] || '';
          const rawStok = row['Stok'] || row['Jumlah'] || row['stok'] || row['jumlah'] || 1;
          const rawStokMin = row['Stok Minimum'] || row['Stok Min'] || row['stok_minimum'] || row['stok_min'] || 1;
          const rawKondisi = row['Kondisi'] || row['Kondisi Barang'] || row['kondisi'] || 'Baik';

          const errors: string[] = [];
          if (!rawNama.toString().trim()) {
            errors.push('Nama Barang wajib diisi');
          }
          if (!rawLokasi.toString().trim()) {
            errors.push('Lokasi Penyimpanan wajib diisi');
          }

          let categoryId = categories[0]?.id_kategori || 1;
          let categoryName = categories[0]?.nama_kategori || 'Kategori';
          if (rawKategori) {
            const num = Number(rawKategori);
            if (!isNaN(num)) {
              const matchedCat = categories.find(c => c.id_kategori === num);
              if (matchedCat) {
                categoryId = matchedCat.id_kategori;
                categoryName = matchedCat.nama_kategori;
              }
            } else {
              const matchedCat = categories.find(c => 
                c.nama_kategori.toLowerCase().includes(rawKategori.toString().toLowerCase()) ||
                rawKategori.toString().toLowerCase().includes(c.nama_kategori.toLowerCase())
              );
              if (matchedCat) {
                categoryId = matchedCat.id_kategori;
                categoryName = matchedCat.nama_kategori;
              }
            }
          }

          let kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' = 'Baik';
          const condStr = rawKondisi.toString().toLowerCase();
          if (condStr.includes('ringan') || condStr.includes('rusak ringan')) {
            kondisi = 'Rusak Ringan';
          } else if (condStr.includes('berat') || condStr.includes('rusak berat')) {
            kondisi = 'Rusak Berat';
          }

          return {
            key: idx,
            nama_barang: rawNama.toString().trim(),
            id_kategori: categoryId,
            nama_kategori: categoryName,
            merk_tipe: rawMerk.toString().trim(),
            lokasi_penyimpanan: rawLokasi.toString().trim() || 'Gudang Utama',
            stok: isNaN(Number(rawStok)) ? 1 : Number(rawStok),
            stok_minimum: isNaN(Number(rawStokMin)) ? 1 : Number(rawStokMin),
            kondisi_barang: kondisi,
            isValid: errors.length === 0,
            errorMessage: errors.join(', ')
          };
        });

        setParsedItems(mapped);
        showNotification('success', `Berhasil membaca ${mapped.length} data dari file Excel.`);
      } catch (err) {
        console.error(err);
        showNotification('error', 'Gagal membaca file Excel. Pastikan format file benar.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Bulk Save parsed Excel items
  const handleBulkImportSave = () => {
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) {
      showNotification('error', 'Tidak ada data valid yang bisa diimport.');
      return;
    }

    const currentList = [...barangList];
    let nextId = currentList.length > 0 ? Math.max(...currentList.map(b => b.id_barang)) + 1 : 1;

    const numbers = currentList.map(b => {
      const match = b.kode_barang.match(/BRG-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    let nextNum = Math.max(...numbers, 0) + 1;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const importedBarangList: Barang[] = validItems.map(item => {
      const generatedCode = 'BRG-' + String(nextNum++).padStart(6, '0');
      return {
        id_barang: nextId++,
        kode_barang: generatedCode,
        nama_barang: item.nama_barang,
        id_kategori: item.id_kategori,
        merk_tipe: item.merk_tipe,
        lokasi_penyimpanan: item.lokasi_penyimpanan,
        stok: item.stok,
        stok_minimum: item.stok_minimum,
        kondisi_barang: item.kondisi_barang,
        foto_barang: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&q=80',
        status_ketersediaan: item.stok > 0 ? 'Tersedia' : 'Dipinjam',
        qr_code: generatedCode,
        created_at: timestamp,
        updated_at: timestamp
      };
    });

    const newList = [...currentList, ...importedBarangList];
    OfficeInventoryDb.saveBarang(newList);
    OfficeInventoryDb.logActivity(
      currentUser?.id_user || 1, 
      `Bulk Import ${importedBarangList.length} Barang dari Excel (${excelFileName})`
    );
    showNotification('success', `${importedBarangList.length} barang baru berhasil diimport dari Excel!`);
    
    loadData();
    setIsModalOpen(false);
    setParsedItems([]);
    setExcelFileName('');
  };

  const handleDelete = (id: number, name: string, code: string) => {
    if (currentUser?.role !== 'Admin') {
      showNotification('error', 'Hanya administrator yang memiliki hak menghapus data barang.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${name}" (${code})?\nTindakan ini bersifat permanen.`)) {
      const filtered = barangList.filter(b => b.id_barang !== id);
      OfficeInventoryDb.saveBarang(filtered);
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Hapus Barang: "${name}" (${code})`);
      showNotification('success', 'Barang berhasil dihapus.');
      loadData();
    }
  };

  // Open item loan history
  const handleOpenHistory = (item: Barang) => {
    const hist = OfficeInventoryDb.getRiwayatBarang(item.id_barang);
    setHistoryItem(item);
    setItemHistory(hist);
  };

  // Simulated QR scanner lookup
  const handleSimulateScan = () => {
    if (!scannedCode.trim()) {
      showNotification('error', 'Masukkan Kode QR Barang untuk disimulasikan.');
      return;
    }
    const found = barangList.find(b => b.kode_barang.toLowerCase() === scannedCode.trim().toLowerCase() || b.qr_code.toLowerCase() === scannedCode.trim().toLowerCase());
    if (found) {
      setScanResultItem(found);
      showNotification('success', 'Kode QR terdeteksi dengan sukses!');
    } else {
      setScanResultItem(null);
      showNotification('error', 'Barang dengan Kode QR tersebut tidak ditemukan.');
    }
  };

  // Quick select scan
  const handleQuickSelectScan = (code: string) => {
    setScannedCode(code);
    const found = barangList.find(b => b.kode_barang === code);
    if (found) {
      setScanResultItem(found);
    }
  };

  // Filter items
  const filteredBarang = barangList.filter(b => {
    const matchesSearch = b.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.kode_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.merk_tipe.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.lokasi_penyimpanan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || b.id_kategori === Number(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" /> Master Data Inventaris Barang
            </h2>
            <p className="text-sm text-gray-500">Manajemen data barang, generate barcode QR, upload foto, dan monitoring stok</p>
          </div>
          <div className="flex gap-2 self-start">
            <button 
              id="scan-qr-btn"
              onClick={() => {
                setIsScanOpen(true);
                setScannedCode('');
                setScanResultItem(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition flex items-center gap-1.5 text-sm"
            >
              <Camera className="h-4 w-4" /> Scan QR Code
            </button>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
              <button 
                id="add-barang-btn"
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition flex items-center gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" /> Tambah Barang
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input 
              id="search-barang-input"
              type="text" 
              placeholder="Cari kode, nama, merk, atau lokasi penyimpanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-full md:w-64">
            <select 
              id="category-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id_kategori} value={c.id_kategori}>{c.nama_kategori}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-28 text-center">Foto</th>
                <th className="py-3 px-4">Kode Barang</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori / Merk</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
                <th className="py-3 px-4 text-center">Stok / Min</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-sm">
              {filteredBarang.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400 text-xs">
                    Tidak ada inventaris barang yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredBarang.map((b) => {
                  const categoryName = categories.find(c => c.id_kategori === b.id_kategori)?.nama_kategori || 'Kategori Lain';
                  const isLowStock = b.stok <= b.stok_minimum;
                  return (
                    <tr key={b.id_barang} className="hover:bg-gray-50/50 transition">
                      {/* Image */}
                      <td className="py-3 px-4 text-center">
                        <img 
                          src={b.foto_barang} 
                          alt={b.nama_barang} 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-150 mx-auto bg-gray-50"
                          referrerPolicy="no-referrer"
                        />
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">
                        {b.kode_barang}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{b.nama_barang}</div>
                        <div className="text-xs text-gray-400 font-mono">{b.merk_tipe}</div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {categoryName}
                        </span>
                      </td>

                      {/* Storage Location */}
                      <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                        {b.lokasi_penyimpanan}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.kondisi_barang === 'Baik' ? 'bg-emerald-100 text-emerald-800' :
                          b.kondisi_barang === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {b.kondisi_barang}
                        </span>
                      </td>

                      {/* Stock / Minimum */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`font-bold ${isLowStock ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>
                          {b.stok}
                        </span>
                        <span className="text-gray-400 text-xs"> / {b.stok_minimum}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status_ketersediaan === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          b.status_ketersediaan === 'Dipinjam' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {b.status_ketersediaan}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* QR Trigger */}
                          <button 
                            id={`qr-barang-${b.id_barang}`}
                            onClick={() => setQrPrintItem(b)}
                            title="Cetak QR Code"
                            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          {/* History Log */}
                          <button 
                            id={`hist-barang-${b.id_barang}`}
                            onClick={() => handleOpenHistory(b)}
                            title="Riwayat Peminjaman"
                            className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {/* Edit / Delete */}
                          {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                            <button 
                              id={`edit-barang-${b.id_barang}`}
                              onClick={() => handleOpenEditModal(b)}
                              title="Ubah Barang"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {currentUser?.role === 'Admin' && (
                            <button 
                              id={`delete-barang-${b.id_barang}`}
                              onClick={() => handleDelete(b.id_barang, b.nama_barang, b.kode_barang)}
                              title="Hapus Barang"
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>

      {/* MODAL: Add / Edit Barang */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className={`bg-white rounded-2xl w-full ${modalTab === 'excel' && editId === null ? 'max-w-4xl' : 'max-w-2xl'} shadow-xl border border-gray-100 flex flex-col my-8 transition-all duration-300`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editId !== null ? `Ubah Data Barang: ${kodeBarang}` : 'Tambah Barang Inventaris Baru'}
              </h3>
              <button 
                id="close-barang-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs for Add Mode */}
            {editId === null && (
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setModalTab('manual')}
                  className={`flex-1 py-3 text-center font-semibold text-sm transition-colors border-b-2 ${
                    modalTab === 'manual'
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  Input Manual
                </button>
                <button
                  type="button"
                  id="tab-excel-btn"
                  onClick={() => setModalTab('excel')}
                  className={`flex-1 py-3 text-center font-semibold text-sm transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                    modalTab === 'excel'
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" /> Import Excel
                </button>
              </div>
            )}

            {/* Modal Body */}
            {(editId !== null || modalTab === 'manual') ? (
              <form onSubmit={handleSave} className="overflow-y-auto">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Kode Barang */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode Barang</label>
                  <input 
                    type="text" 
                    disabled
                    value={kodeBarang}
                    className="w-full px-3.5 py-2 border border-gray-200 bg-gray-50 text-gray-500 font-mono rounded-xl text-sm font-semibold"
                  />
                  <p className="text-[10px] text-gray-400">Kode barang digenerate secara otomatis oleh sistem</p>
                </div>

                {/* Nama Barang */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Barang</label>
                  <input 
                    id="barang-name-input"
                    type="text" 
                    required
                    placeholder="Contoh: Laptop Asus ZenBook 14"
                    value={namaBarang}
                    onChange={(e) => setNamaBarang(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</label>
                  <select 
                    id="barang-category-select"
                    value={idKategori}
                    onChange={(e) => setIdKategori(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id_kategori} value={c.id_kategori}>{c.nama_kategori}</option>
                    ))}
                  </select>
                </div>

                {/* Merk / Tipe */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Merk / Tipe Spesifik</label>
                  <input 
                    id="barang-brand-input"
                    type="text" 
                    placeholder="Contoh: UX3402 Intel Core i7"
                    value={merkTipe}
                    onChange={(e) => setMerkTipe(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Lokasi Penyimpanan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi Penyimpanan</label>
                  <input 
                    id="barang-location-input"
                    type="text" 
                    required
                    placeholder="Contoh: Lemari IT - Gedung B Lantai 2"
                    value={lokasiPenyimpanan}
                    onChange={(e) => setLokasiPenyimpanan(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Kondisi Barang */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kondisi Barang</label>
                  <select 
                    id="barang-condition-select"
                    value={kondisiBarang}
                    onChange={(e) => setKondisiBarang(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="Baik">Baik (Sangat Layak Pakai)</option>
                    <option value="Rusak Ringan">Rusak Ringan (Butuh Servis Minor)</option>
                    <option value="Rusak Berat">Rusak Berat (Tidak Layak Pakai)</option>
                  </select>
                </div>

                {/* Stok */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Tersedia</label>
                  <input 
                    id="barang-stock-input"
                    type="number" 
                    min={0}
                    required
                    value={stok}
                    onChange={(e) => setStok(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>

                {/* Stok Minimum */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Minimum Peringatan</label>
                  <input 
                    id="barang-minstock-input"
                    type="number" 
                    min={0}
                    required
                    value={stokMinimum}
                    onChange={(e) => setStokMinimum(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>

                {/* Status Ketersediaan (only visible on edit) */}
                {editId !== null && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Ketersediaan</label>
                    <select 
                      id="barang-status-select"
                      value={statusKetersediaan}
                      onChange={(e) => setStatusKetersediaan(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-semibold"
                    >
                      <option value="Tersedia">Tersedia (Siap Dipinjam)</option>
                      <option value="Dipinjam">Dipinjam (Sedang Dipakai / Stok Kosong)</option>
                      <option value="Tidak Aktif">Tidak Aktif (Diarsipkan / Dihapus dari Unit Kerja)</option>
                    </select>
                  </div>
                )}

                {/* Foto Barang Upload / URL */}
                <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-4 flex flex-col md:flex-row gap-4 items-center">
                  <img 
                    src={fotoBarang} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded-xl border bg-gray-50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Unggah Foto Inventaris</label>
                    
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button 
                        id="choose-image-btn"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                      >
                        <Upload className="h-3.5 w-3.5" /> Pilih File Gambar (Max 500KB)
                      </button>
                      <button 
                        id="reset-image-btn"
                        type="button"
                        onClick={() => setFotoBarang('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&q=80')}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                      >
                        Gunakan Default Box
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">Direkomendasikan foto ratio 1:1 format JPG/PNG</p>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                <button 
                  id="cancel-barang-btn"
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition text-sm"
                >
                  Batal
                </button>
                <button 
                  id="save-barang-btn"
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-sm"
                >
                  {editId !== null ? 'Simpan Perubahan' : 'Tambahkan Barang'}
                </button>
              </div>
            </form>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[70vh]">
                  {/* Instructions and Download Template */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                        <FileSpreadsheet className="h-4 w-4" /> Petunjuk Import Data via Excel
                      </h4>
                      <p className="text-xs text-blue-700 leading-relaxed font-normal">
                        Format file harus berupa <strong className="font-semibold">.xlsx, .xls, atau .csv</strong> dengan susunan kolom:
                        <br />
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Nama Barang</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Kategori</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Merk Tipe</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Lokasi Penyimpanan</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Stok</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Stok Minimum</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Kondisi</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      id="download-template-btn"
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                    >
                      <Download className="h-3.5 w-3.5" /> Unduh Template Excel
                    </button>
                  </div>

                  {/* Drag and Drop Zone / File Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pilih File Excel</label>
                    <input
                      type="file"
                      ref={excelFileInputRef}
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelUpload}
                      className="hidden"
                    />
                    
                    {excelFileName ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <FileSpreadsheet className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{excelFileName}</p>
                            <p className="text-xs text-gray-500">{parsedItems.length} baris data ditemukan</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => excelFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Ganti File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExcelFileName('');
                              setParsedItems([]);
                            }}
                            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => excelFileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
                      >
                        <div className="p-3 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 text-slate-500 rounded-2xl transition">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Klik atau seret file Excel ke sini</p>
                          <p className="text-xs text-gray-400 mt-1">Mendukung format .xlsx, .xls, atau .csv (Max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Excel Parsed Table Preview */}
                  {parsedItems.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview Data Excel</h4>
                        <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                          {parsedItems.filter(x => x.isValid).length} Valid / {parsedItems.filter(x => !x.isValid).length} Invalid
                        </span>
                      </div>

                      <div className="border border-gray-150 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-gray-50 border-b border-gray-150 sticky top-0 z-10">
                            <tr className="font-semibold text-gray-500 uppercase tracking-wider">
                              <th className="py-2.5 px-3 w-10 text-center text-gray-500 font-semibold">No</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Nama Barang</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Kategori</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Merk/Tipe</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Lokasi</th>
                              <th className="py-2.5 px-3 text-center text-gray-500 font-semibold">Stok (Min)</th>
                              <th className="py-2.5 px-3 text-center text-gray-500 font-semibold">Kondisi</th>
                              <th className="py-2.5 px-3 text-center text-gray-500 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {parsedItems.map((item, idx) => (
                              <tr key={item.key} className={item.isValid ? 'hover:bg-gray-50/50' : 'bg-rose-50/30 hover:bg-rose-50/50'}>
                                <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-gray-900">{item.nama_barang || <span className="text-rose-500 italic">Kosong</span>}</td>
                                <td className="py-2 px-3 text-gray-600">{item.nama_kategori}</td>
                                <td className="py-2 px-3 text-gray-500">{item.merk_tipe || '-'}</td>
                                <td className="py-2 px-3 text-gray-600">{item.lokasi_penyimpanan}</td>
                                <td className="py-2 px-3 text-center font-mono text-gray-700">{item.stok} ({item.stok_minimum})</td>
                                <td className="py-2 px-3 text-center animate-fade-in">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    item.kondisi_barang === 'Baik' ? 'bg-emerald-100 text-emerald-800' :
                                    item.kondisi_barang === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {item.kondisi_barang}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {item.isValid ? (
                                    <span className="text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                                      <Check className="h-3 w-3" /> Valid
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold" title={item.errorMessage}>
                                      Error: {item.errorMessage}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Excel Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                  <button
                    id="cancel-excel-btn"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition text-sm"
                  >
                    Batal
                  </button>
                  <button
                    id="save-excel-import-btn"
                    type="button"
                    disabled={parsedItems.length === 0 || parsedItems.filter(x => x.isValid).length === 0}
                    onClick={handleBulkImportSave}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Import {parsedItems.filter(x => x.isValid).length} Barang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: QR Code Detail & Print */}
      {qrPrintItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 border flex flex-col items-center text-center space-y-4">
            <div className="w-full flex justify-between items-center border-b pb-3 text-gray-900">
              <h3 className="font-bold">Cetak Label QR Code</h3>
              <button 
                id="close-qr-modal"
                onClick={() => setQrPrintItem(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border p-4 bg-white rounded-xl shadow-inner">
              {/* QR Image using server API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrPrintItem.kode_barang}`}
                alt={qrPrintItem.kode_barang} 
                className="w-40 h-40"
              />
              <div className="mt-2 font-mono font-bold text-sm tracking-widest text-gray-800">
                {qrPrintItem.kode_barang}
              </div>
              <div className="text-xs font-semibold text-gray-500">
                {qrPrintItem.nama_barang}
              </div>
            </div>

            <div className="text-xs text-gray-400 bg-slate-50 p-2.5 rounded-lg w-full">
              Pindai kode QR di atas untuk melakukan checkout peminjaman instan atau pelacakan riwayat barang.
            </div>

            <button 
              id="print-qr-btn"
              onClick={() => {
                window.print();
                OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Cetak Barcode QR: ${qrPrintItem.kode_barang}`);
              }}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <Printer className="h-4 w-4" /> Cetak Label Barcode (Print)
            </button>
          </div>
        </div>
      )}

      {/* MODAL: QR Code Scanner Simulation */}
      {isScanOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 border flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                <Camera className="h-5 w-5 text-blue-600" /> Pemindai QR Code Inventaris
              </h3>
              <button 
                id="close-scan-modal"
                onClick={() => setIsScanOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulating camera view */}
            <div className="bg-slate-900 h-52 rounded-xl border-2 border-dashed border-blue-500 relative flex flex-col items-center justify-center text-center p-4 overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 to-transparent pointer-events-none"></div>
              
              {/* Animated laser line */}
              <div className="w-full h-0.5 bg-blue-500 absolute top-1/2 left-0 shadow-[0_0_8px_#3b82f6] animate-pulse"></div>

              <QrCode className="h-16 w-16 text-blue-400/50 mb-2" />
              <p className="text-xs text-blue-300 font-semibold">Mendekatkan QR Code ke arah kamera perangkat...</p>
              <p className="text-[10px] text-slate-500 mt-1">Gunakan simulasi input kode di bawah untuk trigger scan</p>
            </div>

            {/* Simulated scan selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pilih Barang untuk Simulasi Scan</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {barangList.slice(0, 4).map(b => (
                  <button 
                    key={b.id_barang}
                    onClick={() => handleQuickSelectScan(b.kode_barang)}
                    className="p-2 border bg-gray-50 hover:bg-blue-50 hover:border-blue-300 rounded-lg text-left truncate transition"
                  >
                    <span className="font-bold block font-mono text-blue-600">{b.kode_barang}</span>
                    {b.nama_barang}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct code entry trigger */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Atau Input Kode QR Secara Manual</label>
              <div className="flex gap-2">
                <input 
                  id="scan-manual-input"
                  type="text"
                  placeholder="Contoh: BRG-000001"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="flex-1 px-3.5 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold"
                />
                <button 
                  id="scan-trigger-btn"
                  onClick={handleSimulateScan}
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition"
                >
                  Pindai
                </button>
              </div>
            </div>

            {/* Scan Results */}
            {scanResultItem && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-sm">
                <img 
                  src={scanResultItem.foto_barang} 
                  alt={scanResultItem.nama_barang} 
                  className="w-14 h-14 object-cover rounded-lg border bg-white shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 truncate">{scanResultItem.nama_barang}</div>
                  <div className="font-mono text-xs text-blue-600 font-bold">{scanResultItem.kode_barang}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Kondisi: <span className="font-bold text-gray-700">{scanResultItem.kondisi_barang}</span> | 
                    Stok: <span className="font-bold text-emerald-600">{scanResultItem.stok}</span> | 
                    Lokasi: <span className="font-medium text-gray-700">{scanResultItem.lokasi_penyimpanan}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                id="close-scan-panel-btn"
                onClick={() => setIsScanOpen(false)}
                className="px-4 py-2 border rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-150 transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Riwayat Peminjaman Barang */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl p-6 border flex flex-col space-y-4 max-h-[85vh]">
            
            <div className="flex justify-between items-center border-b pb-3 text-gray-900">
              <div>
                <h3 className="font-bold text-lg">Riwayat Peminjaman Barang</h3>
                <p className="text-xs text-gray-500">{historyItem.nama_barang} ({historyItem.kode_barang})</p>
              </div>
              <button 
                id="close-history-modal"
                onClick={() => setHistoryItem(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">No. Transaksi</th>
                    <th className="py-2.5 px-4">Tanggal Pinjam</th>
                    <th className="py-2.5 px-4">Peminjam</th>
                    <th className="py-2.5 px-4 text-center">Jumlah</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {itemHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                        Belum pernah ada transaksi peminjaman untuk barang ini.
                      </td>
                    </tr>
                  ) : (
                    itemHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-xs text-blue-600">{h.nomor_peminjaman}</td>
                        <td className="py-2.5 px-4 text-gray-600">{h.tanggal_pinjam}</td>
                        <td className="py-2.5 px-4 font-semibold text-gray-900">{h.nama_lengkap}</td>
                        <td className="py-2.5 px-4 text-center font-bold font-mono text-gray-800">{h.jumlah_pinjam}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                            h.status === 'Sebagian Kembali' ? 'bg-amber-100 text-amber-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button 
                id="close-history-panel-btn"
                onClick={() => setHistoryItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
