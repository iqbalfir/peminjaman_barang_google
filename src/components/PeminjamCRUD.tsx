/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, Users, ShieldAlert, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjam } from '../types';
import * as XLSX from 'xlsx';

interface PeminjamCRUDProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function PeminjamCRUD({ currentUser }: PeminjamCRUDProps) {
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form states
  const [nipNik, setNipNik] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [instansiUnitKerja, setInstansiUnitKerja] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [alamat, setAlamat] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Excel Import states for Peminjam
  const [modalTab, setModalTab] = useState<'manual' | 'excel'>('manual');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPeminjamList(OfficeInventoryDb.getPeminjam());
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
    setNipNik('');
    setNamaLengkap('');
    setInstansiUnitKerja('');
    setJabatan('');
    setNomorTelepon('');
    setEmail('');
    setAlamat('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Peminjam) => {
    setEditId(p.id_peminjam);
    setModalTab('manual');
    setParsedItems([]);
    setExcelFileName('');
    setNipNik(p.nip_nik);
    setNamaLengkap(p.nama_lengkap);
    setInstansiUnitKerja(p.instansi_unit_kerja);
    setJabatan(p.jabatan);
    setNomorTelepon(p.nomor_telepon);
    setEmail(p.email);
    setAlamat(p.alamat);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nipNik.trim() || !namaLengkap.trim()) {
      showNotification('error', 'NIP/NIK dan Nama Lengkap wajib diisi.');
      return;
    }

    const currentList = [...peminjamList];

    // Check unique NIP/NIK
    const duplicate = currentList.find(p => p.nip_nik === nipNik && p.id_peminjam !== editId);
    if (duplicate) {
      showNotification('error', `Pegawai dengan NIP/NIK "${nipNik}" sudah terdaftar.`);
      return;
    }

    if (editId !== null) {
      // Edit
      const index = currentList.findIndex(p => p.id_peminjam === editId);
      if (index !== -1) {
        currentList[index] = {
          ...currentList[index],
          nip_nik: nipNik,
          nama_lengkap: namaLengkap,
          instansi_unit_kerja: instansiUnitKerja,
          jabatan: jabatan,
          nomor_telepon: nomorTelepon,
          email: email,
          alamat: alamat
        };
        OfficeInventoryDb.savePeminjam(currentList);
        OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Edit Peminjam: "${namaLengkap}" (NIP: ${nipNik})`);
        showNotification('success', 'Data peminjam berhasil diperbarui!');
      }
    } else {
      // Add
      const nextId = currentList.length > 0 ? Math.max(...currentList.map(p => p.id_peminjam)) + 1 : 1;
      const newPeminjam: Peminjam = {
        id_peminjam: nextId,
        nip_nik: nipNik,
        nama_lengkap: namaLengkap,
        instansi_unit_kerja: instansiUnitKerja,
        jabatan: jabatan,
        nomor_telepon: nomorTelepon,
        email: email,
        alamat: alamat
      };
      currentList.push(newPeminjam);
      OfficeInventoryDb.savePeminjam(currentList);
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Tambah Peminjam Baru: "${namaLengkap}" (NIP: ${nipNik})`);
      showNotification('success', 'Peminjam baru berhasil terdaftar!');
    }

    loadData();
    setIsModalOpen(false);
  };

  // Download template import peminjam Excel
  const downloadTemplate = () => {
    const templateData = [
      {
        "NIP NIK": "199208242019031002",
        "Nama Lengkap": "Dr. Ir. H. Ahmad Fauzi, M.T.",
        "Instansi Unit Kerja": "Biro Perencanaan & Logistik",
        "Jabatan": "Kepala Bidang Sarana Prasarana",
        "Nomor Telepon": "081234567890",
        "Email": "ahmad.fauzi@kantor.go.id",
        "Alamat": "Jl. Kenanga No. 45, Kebayoran Baru, Jakarta Selatan"
      },
      {
        "NIP NIK": "199507112022012003",
        "Nama Lengkap": "Rina Amalia, S.E.",
        "Instansi Unit Kerja": "Bagian Keuangan",
        "Jabatan": "Analisis Pengelolaan Keuangan APBN",
        "Nomor Telepon": "085678901234",
        "Email": "rina.amalia@kantor.go.id",
        "Alamat": "Komplek Melati Indah Blok C No. 12, Bekasi"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Peminjam");
    XLSX.writeFile(workbook, "template_import_peminjam.xlsx");
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

        const currentPeminjamList = OfficeInventoryDb.getPeminjam();

        const mapped = json.map((row, idx) => {
          const rawNip = row['NIP NIK'] || row['NIP'] || row['NIK'] || row['nip_nik'] || row['nip'] || row['nik'] || '';
          const rawNama = row['Nama Lengkap'] || row['Nama'] || row['nama_lengkap'] || row['nama'] || '';
          const rawInstansi = row['Instansi Unit Kerja'] || row['Instansi'] || row['Unit Kerja'] || row['instansi'] || row['unit_kerja'] || '';
          const rawJabatan = row['Jabatan'] || row['jabatan'] || '';
          const rawTelepon = row['Nomor Telepon'] || row['Telepon'] || row['No Telp'] || row['No HP'] || row['nomor_telepon'] || row['telepon'] || '';
          const rawEmail = row['Email'] || row['email'] || '';
          const rawAlamat = row['Alamat'] || row['alamat'] || '';

          const errors: string[] = [];
          if (!rawNip.toString().trim()) {
            errors.push('NIP/NIK wajib diisi');
          }
          if (!rawNama.toString().trim()) {
            errors.push('Nama Lengkap wajib diisi');
          }

          // Check duplicate NIP in DB
          const nipStr = rawNip.toString().trim();
          const isDupInDb = currentPeminjamList.some(p => p.nip_nik === nipStr);
          if (isDupInDb) {
            errors.push('NIP/NIK sudah terdaftar di database');
          }

          return {
            key: idx,
            nip_nik: nipStr,
            nama_lengkap: rawNama.toString().trim(),
            instansi_unit_kerja: rawInstansi.toString().trim() || 'Kantor Pusat',
            jabatan: rawJabatan.toString().trim() || 'Staf',
            nomor_telepon: rawTelepon.toString().trim() || '-',
            email: rawEmail.toString().trim() || '-',
            alamat: rawAlamat.toString().trim() || '-',
            isValid: errors.length === 0,
            errorMessage: errors.join(', ')
          };
        });

        // Check duplicates within the Excel itself
        mapped.forEach((item, index) => {
          if (item.isValid) {
            const dupIndex = mapped.findIndex((m, idx) => idx < index && m.nip_nik === item.nip_nik && m.isValid);
            if (dupIndex !== -1) {
              item.isValid = false;
              item.errorMessage = 'Duplikat NIP/NIK dalam file Excel ini';
            }
          }
        });

        setParsedItems(mapped);
        showNotification('success', `Berhasil membaca ${mapped.length} data peminjam dari file Excel.`);
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

    const currentList = [...peminjamList];
    let nextId = currentList.length > 0 ? Math.max(...currentList.map(p => p.id_peminjam)) + 1 : 1;

    const importedPeminjamList: Peminjam[] = validItems.map(item => {
      return {
        id_peminjam: nextId++,
        nip_nik: item.nip_nik,
        nama_lengkap: item.nama_lengkap,
        instansi_unit_kerja: item.instansi_unit_kerja,
        jabatan: item.jabatan,
        nomor_telepon: item.nomor_telepon,
        email: item.email,
        alamat: item.alamat
      };
    });

    const newList = [...currentList, ...importedPeminjamList];
    OfficeInventoryDb.savePeminjam(newList);
    OfficeInventoryDb.logActivity(
      currentUser?.id_user || 1, 
      `Bulk Import ${importedPeminjamList.length} Peminjam dari Excel (${excelFileName})`
    );
    showNotification('success', `${importedPeminjamList.length} peminjam baru berhasil diimport dari Excel!`);
    
    loadData();
    setIsModalOpen(false);
    setParsedItems([]);
    setExcelFileName('');
  };

  const handleDelete = (id: number, name: string, nip: string) => {
    if (currentUser?.role !== 'Admin') {
      showNotification('error', 'Hanya administrator yang memiliki wewenang menghapus peminjam.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus peminjam "${name}" (${nip})?\nTindakan ini juga menghapus riwayat transaksinya.`)) {
      const filtered = peminjamList.filter(p => p.id_peminjam !== id);
      OfficeInventoryDb.savePeminjam(filtered);
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Hapus Peminjam: "${name}" (${nip})`);
      showNotification('success', 'Data peminjam berhasil dihapus.');
      loadData();
    }
  };

  const filteredPeminjam = peminjamList.filter(p => 
    p.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nip_nik.includes(searchTerm) ||
    p.instansi_unit_kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6 animate-fade-in">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" /> Master Data Peminjam
          </h2>
          <p className="text-sm text-gray-500">Kelola database pegawai/peminjam yang berhak meminjam barang inventaris</p>
        </div>
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
          <button 
            id="add-peminjam-btn"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition flex items-center gap-1.5 self-start text-sm"
          >
            <Plus className="h-4 w-4" /> Registrasi Peminjam
          </button>
        )}
      </div>

      {/* Alert Banner for notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        <input 
          id="search-peminjam-input"
          type="text" 
          placeholder="Cari NIP, nama lengkap, unit kerja, atau jabatan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">NIP / NIK</th>
              <th className="py-3 px-4">Nama Lengkap</th>
              <th className="py-3 px-4">Instansi / Unit Kerja</th>
              <th className="py-3 px-4">Jabatan</th>
              <th className="py-3 px-4">Kontak</th>
              <th className="py-3 px-4 text-center">Alamat</th>
              {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-sm">
            {filteredPeminjam.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                  Tidak ada peminjam yang terdaftar atau cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredPeminjam.map((p) => (
                <tr key={p.id_peminjam} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-xs text-blue-700">{p.nip_nik}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{p.nama_lengkap}</td>
                  <td className="py-3 px-4 font-medium text-gray-600">{p.instansi_unit_kerja}</td>
                  <td className="py-3 px-4 text-gray-500 font-medium">{p.jabatan}</td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-semibold text-gray-800">{p.nomor_telepon}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{p.email}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 max-w-xs truncate text-xs">{p.alamat}</td>
                  {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          id={`edit-peminjam-${p.id_peminjam}`}
                          onClick={() => handleOpenEditModal(p)}
                          title="Ubah Profil Peminjam"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {currentUser?.role === 'Admin' && (
                          <button 
                            id={`delete-peminjam-${p.id_peminjam}`}
                            onClick={() => handleDelete(p.id_peminjam, p.nama_lengkap, p.nip_nik)}
                            title="Hapus Peminjam"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Add / Edit Peminjam */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className={`bg-white rounded-2xl w-full ${modalTab === 'excel' && editId === null ? 'max-w-4xl' : 'max-w-xl'} shadow-xl border border-gray-100 flex flex-col my-8 transition-all duration-300`}>
            
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editId !== null ? 'Ubah Data Peminjam' : 'Registrasi Peminjam Baru'}
              </h3>
              <button 
                id="close-peminjam-modal"
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
                  id="tab-excel-peminjam-btn"
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
              <form onSubmit={handleSave}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* NIP / NIK */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NIP / NIK Pegawai</label>
                    <input 
                      id="peminjam-nip-input"
                      type="text" 
                      required
                      placeholder="Contoh: 19850312..."
                      value={nipNik}
                      onChange={(e) => setNipNik(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold"
                    />
                  </div>

                  {/* Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap & Gelar</label>
                    <input 
                      id="peminjam-name-input"
                      type="text" 
                      required
                      placeholder="Contoh: Drs. Heru Prasetyo"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800"
                    />
                  </div>

                  {/* Instansi / Unit Kerja */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instansi / Unit Kerja</label>
                    <input 
                      id="peminjam-instansi-input"
                      type="text" 
                      required
                      placeholder="Contoh: Biro Hubungan Masyarakat"
                      value={instansiUnitKerja}
                      onChange={(e) => setInstansiUnitKerja(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Jabatan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan Fungsional/Struktural</label>
                    <input 
                      id="peminjam-jabatan-input"
                      type="text" 
                      required
                      placeholder="Contoh: Kepala Bidang Humas"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Nomor Telepon */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomor Telepon / WhatsApp</label>
                    <input 
                      id="peminjam-phone-input"
                      type="tel" 
                      required
                      placeholder="Contoh: 0812XXXXXXXX"
                      value={nomorTelepon}
                      onChange={(e) => setNomorTelepon(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat Email Instansi</label>
                    <input 
                      id="peminjam-email-input"
                      type="email" 
                      required
                      placeholder="Contoh: pegawai@kantor.go.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    />
                  </div>

                  {/* Alamat Rumah */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat Domisili Lengkap</label>
                    <textarea 
                      id="peminjam-address-input"
                      rows={3}
                      placeholder="Tuliskan nama jalan, blok, RT/RW, kelurahan, kecamatan, kota..."
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                  <button 
                    id="cancel-peminjam-btn"
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition text-sm"
                  >
                    Batal
                  </button>
                  <button 
                    id="save-peminjam-btn"
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-sm"
                  >
                    {editId !== null ? 'Simpan Perubahan' : 'Registrasi Peminjam'}
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
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">NIP NIK</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Nama Lengkap</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Instansi Unit Kerja</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Jabatan</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Nomor Telepon</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Email</span>,{' '}
                        <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Alamat</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      id="download-peminjam-template-btn"
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
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">NIP / NIK</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Nama Lengkap</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Instansi / Unit Kerja</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Jabatan</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Nomor Telepon</th>
                              <th className="py-2.5 px-3 text-gray-500 font-semibold">Email</th>
                              <th className="py-2.5 px-3 text-center text-gray-500 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {parsedItems.map((item, idx) => (
                              <tr key={item.key} className={item.isValid ? 'hover:bg-gray-50/50' : 'bg-rose-50/30 hover:bg-rose-50/50'}>
                                <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-mono font-semibold text-xs text-blue-700">{item.nip_nik || <span className="text-rose-500 italic">Kosong</span>}</td>
                                <td className="py-2 px-3 font-semibold text-gray-900">{item.nama_lengkap || <span className="text-rose-500 italic">Kosong</span>}</td>
                                <td className="py-2 px-3 text-gray-600">{item.instansi_unit_kerja}</td>
                                <td className="py-2 px-3 text-gray-500">{item.jabatan}</td>
                                <td className="py-2 px-3 text-gray-600">{item.nomor_telepon}</td>
                                <td className="py-2 px-3 text-gray-500">{item.email}</td>
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
                    id="cancel-excel-peminjam-btn"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition text-sm"
                  >
                    Batal
                  </button>
                  <button
                    id="save-excel-peminjam-import-btn"
                    type="button"
                    disabled={parsedItems.length === 0 || parsedItems.filter(x => x.isValid).length === 0}
                    onClick={handleBulkImportSave}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Import {parsedItems.filter(x => x.isValid).length} Peminjam
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

