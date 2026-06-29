/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, FileSpreadsheet, Printer, TrendingUp, AlertTriangle, Search, BookOpen, Clock, Wrench, Plus, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjaman, DetailPeminjaman, Barang, Peminjam, Perbaikan } from '../types';

interface LaporanProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function Laporan({ currentUser }: LaporanProps) {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [detailList, setDetailList] = useState<DetailPeminjaman[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [perbaikanList, setPerbaikanList] = useState<Perbaikan[]>([]);

  // Selected report type
  const [reportType, setReportType] = useState<'peminjaman' | 'terbanyak' | 'keterlambatan' | 'rekonsiliasi'>('peminjaman');

  // Filters for Report 1
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Filters for Report 4 (Reconciliation)
  const [reconSearch, setReconSearch] = useState('');
  const [reconCondition, setReconCondition] = useState<'Semua' | 'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Semua');

  // Add repair record modal state
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [selectedBarangForRepair, setSelectedBarangForRepair] = useState<Barang | null>(null);
  const [repairDate, setRepairDate] = useState('2026-06-28');
  const [repairDesc, setRepairDesc] = useState('');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [repairVendor, setRepairVendor] = useState('');
  const [repairStatus, setRepairStatus] = useState<'Dalam Proses' | 'Selesai'>('Selesai');
  const [repairConditionAfter, setRepairConditionAfter] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');

  // Error/Success state
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setPeminjamanList(OfficeInventoryDb.getPeminjaman());
    setDetailList(OfficeInventoryDb.getDetailPeminjaman());
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
    setPerbaikanList(OfficeInventoryDb.getPerbaikan());
  }, []);

  // Report 1: Peminjaman General Filtered by date range
  const getFilteredPeminjamanReport = () => {
    return peminjamanList.filter(p => {
      const pDate = new Date(p.tanggal_pinjam);
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      return pDate >= sDate && pDate <= eDate;
    });
  };

  // Report 2: Most Borrowed Goods
  const getMostBorrowedReport = () => {
    // Count items based on historical details
    const counts: { [key: number]: number } = {};
    detailList.forEach(d => {
      counts[d.id_barang] = (counts[d.id_barang] || 0) + d.jumlah_pinjam;
    });

    return barangList.map(b => ({
      kode_barang: b.kode_barang,
      nama_barang: b.nama_barang,
      merk_tipe: b.merk_tipe,
      total_dipinjam: counts[b.id_barang] || 0
    })).sort((a, b) => b.total_dipinjam - a.total_dipinjam);
  };

  // Report 3: Late Returns
  const getOverdueReport = () => {
    const today = new Date('2026-06-28');
    return peminjamanList
      .filter(p => p.status !== 'Selesai' && new Date(p.tanggal_rencana_kembali) < today)
      .map(p => {
        const borrower = peminjamList.find(b => b.id_peminjam === p.id_peminjam);
        const details = detailList.filter(d => d.id_peminjaman === p.id_peminjaman);
        const goodsNames = details.map(d => {
          const b = barangList.find(x => x.id_barang === d.id_barang);
          return `${b?.nama_barang || 'Barang'} (${d.jumlah_pinjam - d.jumlah_kembali} unit)`;
        }).join(', ');

        const diffTime = Math.abs(today.getTime() - new Date(p.tanggal_rencana_kembali).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          nomor_peminjaman: p.nomor_peminjaman,
          peminjam: borrower?.nama_lengkap || 'Unknown Staff',
          jabatan: borrower?.jabatan || '-',
          tanggal_pinjam: p.tanggal_pinjam,
          tanggal_rencana_kembali: p.tanggal_rencana_kembali,
          barang: goodsNames,
          hari_terlambat: diffDays
        };
      });
  };

  // Simulate Excel/CSV Export
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = "laporan.csv";

    if (reportType === 'peminjaman') {
      filename = `Laporan_Peminjaman_${startDate}_to_${endDate}.csv`;
      csvContent += "No;Nomor Peminjaman;Tanggal Pinjam;Tanggal Kembali;Peminjam;Barang;Jumlah;Status\n";
      
      const data = getFilteredPeminjamanReport();
      data.forEach((p, index) => {
        const borrower = peminjamList.find(b => b.id_peminjam === p.id_peminjam);
        const details = detailList.filter(d => d.id_peminjaman === p.id_peminjaman);
        details.forEach(d => {
          const bObj = barangList.find(x => x.id_barang === d.id_barang);
          csvContent += `${index + 1};${p.nomor_peminjaman};${p.tanggal_pinjam};${p.tanggal_rencana_kembali};${borrower?.nama_lengkap || 'Staff'};${bObj?.nama_barang || 'Barang'};${d.jumlah_pinjam};${p.status}\n`;
        });
      });
    } else if (reportType === 'terbanyak') {
      filename = "Laporan_Barang_Terbanyak_Dipinjam.csv";
      csvContent += "No;Kode Barang;Nama Barang;Merk Tipe;Total Dipinjam\n";
      
      const data = getMostBorrowedReport();
      data.forEach((b, index) => {
        csvContent += `${index + 1};${b.kode_barang};${b.nama_barang};${b.merk_tipe};${b.total_dipinjam}\n`;
      });
    } else if (reportType === 'keterlambatan') {
      filename = "Laporan_Keterlambatan_Pengembalian.csv";
      csvContent += "No;Nomor Peminjaman;Nama Peminjam;Jabatan;Barang;Jatuh Tempo;Hari Terlambat\n";
      
      const data = getOverdueReport();
      data.forEach((o, index) => {
        csvContent += `${index + 1};${o.nomor_peminjaman};${o.peminjam};${o.jabatan};"${o.barang}";${o.tanggal_rencana_kembali};${o.hari_terlambat}\n`;
      });
    } else {
      filename = "Laporan_Rekonsiliasi_Dan_Perbaikan_Barang.csv";
      csvContent += "No;Kode Barang;Nama Barang;Merk Tipe;Kondisi;Status;Jumlah Perbaikan;Total Biaya Perbaikan\n";
      
      barangList.forEach((b, index) => {
        const repairs = perbaikanList.filter(p => p.id_barang === b.id_barang);
        const totalCost = repairs.reduce((sum, r) => sum + r.biaya, 0);
        csvContent += `${index + 1};${b.kode_barang};${b.nama_barang};${b.merk_tipe};${b.kondisi_barang};${b.status_ketersediaan};${repairs.length};${totalCost}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Export Excel Laporan: "${reportType}"`);
  };

  // Save new repair log
  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarangForRepair) return;

    try {
      const repairs = [...perbaikanList];
      const newId = repairs.length > 0 ? Math.max(...repairs.map(r => r.id_perbaikan)) + 1 : 1;
      
      const newRepair: Perbaikan = {
        id_perbaikan: newId,
        id_barang: selectedBarangForRepair.id_barang,
        tanggal_perbaikan: repairDate,
        deskripsi_perbaikan: repairDesc,
        biaya: Number(repairCost) || 0,
        teknisi_vendor: repairVendor || 'Teknisi Internal',
        status_perbaikan: repairStatus,
        kondisi_setelah_perbaikan: repairConditionAfter
      };

      repairs.unshift(newRepair);
      OfficeInventoryDb.savePerbaikan(repairs);
      setPerbaikanList(repairs);

      // Update condition of item if repair is marked "Selesai"
      if (repairStatus === 'Selesai') {
        const updatedBarang = barangList.map(b => {
          if (b.id_barang === selectedBarangForRepair.id_barang) {
            return {
              ...b,
              kondisi_barang: repairConditionAfter,
              updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
          }
          return b;
        });
        OfficeInventoryDb.saveBarang(updatedBarang);
        setBarangList(updatedBarang);
      }

      // Log activity
      OfficeInventoryDb.logActivity(
        currentUser?.id_user || 1, 
        `Tambah Historis Perbaikan Barang: ${selectedBarangForRepair.nama_barang} (${repairDesc})`
      );

      // Show success
      setFormSuccess('Historis perbaikan barang berhasil ditambahkan!');
      setTimeout(() => setFormSuccess(''), 3000);
      setIsRepairModalOpen(false);
      
      // Clear inputs
      setRepairDesc('');
      setRepairCost(0);
      setRepairVendor('');
      setSelectedBarangForRepair(null);
    } catch (err) {
      setFormError('Gagal menyimpan historis perbaikan.');
      setTimeout(() => setFormError(''), 3000);
    }
  };

  // Filter goods for Reconciliation & Repair History Report
  const getFilteredReconGoods = () => {
    return barangList.filter(b => {
      const matchSearch = 
        b.nama_barang.toLowerCase().includes(reconSearch.toLowerCase()) ||
        b.kode_barang.toLowerCase().includes(reconSearch.toLowerCase()) ||
        (b.merk_tipe && b.merk_tipe.toLowerCase().includes(reconSearch.toLowerCase())) ||
        (b.lokasi_penyimpanan && b.lokasi_penyimpanan.toLowerCase().includes(reconSearch.toLowerCase()));
      
      const matchCondition = 
        reconCondition === 'Semua' || b.kondisi_barang === reconCondition;
        
      return matchSearch && matchCondition;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" /> Pusat Laporan & Ekspor Data
          </h2>
          <p className="text-sm text-gray-500">Unduh dokumen laporan inventaris, statistika kegunaan, dan pemantauan denda keterlambatan</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="print-report-btn"
            onClick={() => {
              window.print();
              OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Cetak Printer Laporan: "${reportType}"`);
            }}
            className="px-4 py-2 border rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
          <button 
            id="excel-report-btn"
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex border-b border-gray-150">
        <button 
          id="tab-pjm-report"
          onClick={() => setReportType('peminjaman')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            reportType === 'peminjaman' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Laporan Peminjaman
        </button>
        <button 
          id="tab-top-report"
          onClick={() => setReportType('terbanyak')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            reportType === 'terbanyak' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Barang Terbanyak Dipinjam
        </button>
        <button 
          id="tab-late-report"
          onClick={() => setReportType('keterlambatan')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            reportType === 'keterlambatan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Laporan Keterlambatan
        </button>
        <button 
          id="tab-rekonsiliasi-report"
          onClick={() => setReportType('rekonsiliasi')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            reportType === 'rekonsiliasi' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Laporan Rekonsiliasi & Perbaikan
        </button>
      </div>

      {/* Active Tab Filter Form */}
      {reportType === 'peminjaman' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Awal</label>
            <input 
              id="report-start-date"
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Akhir</label>
            <input 
              id="report-end-date"
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
            />
          </div>
          <div className="flex items-end text-xs text-slate-500 pb-2 italic">
            Menyaring seluruh aktivitas transaksi berdasarkan range tanggal pinjam.
          </div>
        </div>
      )}

      {reportType === 'rekonsiliasi' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Cari Barang / BMN</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                id="recon-search-input"
                type="text" 
                placeholder="Nama / Kode / Tipe..."
                value={reconSearch}
                onChange={(e) => setReconSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Saring Kondisi BMN</label>
            <select 
              id="recon-condition-select"
              value={reconCondition}
              onChange={(e) => setReconCondition(e.target.value as any)}
              className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 bg-white"
            >
              <option value="Semua">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>
          <div className="flex items-end text-xs text-slate-500 pb-2 italic">
            Memantau kesesuaian fisik BMN, kondisi kerusakan, serta mencatat riwayat pemeliharaan berkala.
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Report 1 (General Borrowings) */}
      {reportType === 'peminjaman' && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hasil Rekapitulasi Peminjaman</h3>
          
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">No. Transaksi</th>
                  <th className="py-2.5 px-4">Tanggal Pinjam</th>
                  <th className="py-2.5 px-4">Peminjam</th>
                  <th className="py-2.5 px-4">Barang & Tipe</th>
                  <th className="py-2.5 px-4 text-center">Jumlah</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getFilteredPeminjamanReport().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                      Tidak ada transaksi peminjaman dalam range tanggal tersebut.
                    </td>
                  </tr>
                ) : (
                  getFilteredPeminjamanReport().map((p, idx) => {
                    const borrower = peminjamList.find(b => b.id_peminjam === p.id_peminjam);
                    const details = detailList.filter(d => d.id_peminjaman === p.id_peminjaman);
                    
                    return details.map((d, dIdx) => {
                      const bObj = barangList.find(x => x.id_barang === d.id_barang);
                      return (
                        <tr key={`${p.id_peminjaman}-${d.id_detail}`} className="hover:bg-gray-50/50 transition">
                          {dIdx === 0 ? (
                            <>
                              <td rowSpan={details.length} className="py-2.5 px-4 text-center text-gray-400 font-medium border-r border-gray-100">{idx + 1}</td>
                              <td rowSpan={details.length} className="py-2.5 px-4 font-mono font-bold text-xs text-blue-700 border-r border-gray-100">{p.nomor_peminjaman}</td>
                              <td rowSpan={details.length} className="py-2.5 px-4 font-semibold text-gray-800 border-r border-gray-100">{p.tanggal_pinjam}</td>
                              <td rowSpan={details.length} className="py-2.5 px-4 font-bold text-gray-900 border-r border-gray-100">{borrower?.nama_lengkap || 'Staff'}</td>
                            </>
                          ) : null}
                          <td className="py-2.5 px-4 font-medium text-slate-800">
                            {bObj?.nama_barang || 'Barang Terhapus'}
                            <span className="text-[10px] text-gray-400 font-mono block">{bObj?.merk_tipe}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold font-mono text-gray-700">{d.jumlah_pinjam} Unit</td>
                          {dIdx === 0 ? (
                            <td rowSpan={details.length} className="py-2.5 px-4 text-center border-l border-gray-100">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                p.status === 'Sebagian Kembali' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Report 2 (Most Borrowed Goods) */}
      {reportType === 'terbanyak' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Peringkat Inventaris Terpopuler</h3>
            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Diurutkan dari frekuensi tertinggi
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-16 text-center">Ranking</th>
                  <th className="py-2.5 px-4">Kode Barang</th>
                  <th className="py-2.5 px-4">Nama Inventaris Barang</th>
                  <th className="py-2.5 px-4">Merk / Model Spesifik</th>
                  <th className="py-2.5 px-4 text-center">Total Frekuensi Dipinjam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getMostBorrowedReport().map((b, idx) => (
                  <tr key={b.kode_barang} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' :
                        idx === 1 ? 'bg-slate-200 text-slate-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">{b.kode_barang}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{b.nama_barang}</td>
                    <td className="py-3 px-4 font-medium text-gray-500 font-mono">{b.merk_tipe}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-blue-50 text-blue-800 font-extrabold font-mono px-3 py-1 rounded-xl text-xs">
                        {b.total_dipinjam} Kali
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Report 3 (Overdue / Late) */}
      {reportType === 'keterlambatan' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pemantauan Pengembalian Terlambat</h3>
            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Deteksi Denda Otomatis
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">No. Peminjaman</th>
                  <th className="py-2.5 px-4">Nama Peminjam</th>
                  <th className="py-2.5 px-4">Inventaris Dipinjam</th>
                  <th className="py-2.5 px-4">Tanggal Pinjam</th>
                  <th className="py-2.5 px-4">Jatuh Tempo</th>
                  <th className="py-2.5 px-4 text-center">Durasi Terlambat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getOverdueReport().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                      Sempurna! Seluruh pengembalian inventaris tepat waktu. Tidak ada keterlambatan hari ini.
                    </td>
                  </tr>
                ) : (
                  getOverdueReport().map((o, idx) => (
                    <tr key={o.nomor_peminjaman} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 text-center text-gray-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">{o.nomor_peminjaman}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{o.peminjam}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">Jabatan: {o.jabatan}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 max-w-xs break-words">{o.barang}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500 font-medium">{o.tanggal_pinjam}</td>
                      <td className="py-3 px-4 font-mono text-xs text-rose-600 font-bold">{o.tanggal_rencana_kembali}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-extrabold shadow-xs">
                          {o.hari_terlambat} Hari
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Report 4 (Reconciliation & Repair History) */}
      {reportType === 'rekonsiliasi' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Laporan Rekonsiliasi Kondisi Fisik & Riwayat Perbaikan BMN</h3>
              <p className="text-xs text-gray-400">Daftar inventaris dengan rincian pemeliharaan, servis, dan tindakan perbaikan berkala.</p>
            </div>
            <div className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-center">
              Total: <span className="font-bold text-blue-600">{getFilteredReconGoods().length}</span> BMN terpantau
            </div>
          </div>

          {/* Form success / error messages */}
          {formSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {formSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {getFilteredReconGoods().length === 0 ? (
              <div className="bg-gray-50 border border-dashed rounded-2xl py-12 text-center text-gray-400 text-xs">
                Tidak ada barang yang cocok dengan kriteria pencarian atau saringan kondisi.
              </div>
            ) : (
              getFilteredReconGoods().map((item) => {
                const itemRepairs = perbaikanList.filter(p => p.id_barang === item.id_barang);
                const totalRepairCost = itemRepairs.reduce((sum, r) => sum + r.biaya, 0);

                return (
                  <div key={item.id_barang} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-xs hover:shadow-sm transition p-5 flex flex-col md:flex-row gap-6 justify-between">
                    
                    {/* Left: Goods details */}
                    <div className="md:w-5/12 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                            {item.kode_barang}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            item.kondisi_barang === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.kondisi_barang === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.kondisi_barang}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            item.status_ketersediaan === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                            item.status_ketersediaan === 'Dipinjam' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status_ketersediaan}
                          </span>
                        </div>
                        
                        <h4 className="text-base font-bold text-gray-900 leading-tight">
                          {item.nama_barang}
                        </h4>
                        
                        <p className="text-xs text-gray-500 font-medium">
                          Merk/Model: <span className="font-mono text-gray-700">{item.merk_tipe || '-'}</span>
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          Lokasi: <span className="text-gray-700">{item.lokasi_penyimpanan || '-'}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-4">
                        <div className="text-xs">
                          <div className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Total Servis</div>
                          <div className="font-bold text-gray-800 font-mono text-xs">{itemRepairs.length} Kali</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Total Biaya</div>
                          <div className="font-extrabold text-amber-600 font-mono text-xs">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalRepairCost)}
                          </div>
                        </div>
                        {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                          <button
                            id={`add-repair-btn-${item.id_barang}`}
                            onClick={() => {
                              setSelectedBarangForRepair(item);
                              setIsRepairModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-xl font-bold text-xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Catat Perbaikan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Repair timeline/logs */}
                    <div className="md:w-7/12 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-start">
                      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5 text-blue-500" /> Historis Perbaikan & Pemeliharaan
                      </h5>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {itemRepairs.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                            Belum pernah diperbaiki / pemeliharaan rutin berjalan lancar.
                          </div>
                        ) : (
                          itemRepairs.map((repair) => (
                            <div key={repair.id_perbaikan} className="bg-slate-50 border border-slate-100/80 rounded-xl p-3 text-xs relative hover:bg-slate-100/50 transition">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span className="font-mono text-gray-500 font-semibold flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-400" /> {repair.tanggal_perbaikan}
                                </span>
                                <div className="flex gap-1 items-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    repair.status_perbaikan === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {repair.status_perbaikan}
                                  </span>
                                  {repair.status_perbaikan === 'Selesai' && (
                                    <span className="text-[9px] text-gray-400">
                                      → Kondisi: <strong className="text-slate-700">{repair.kondisi_setelah_perbaikan}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-800 font-medium leading-relaxed">
                                {repair.deskripsi_perbaikan}
                              </p>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[10px] text-gray-500">
                                <div>
                                  Vendor: <strong className="text-gray-700">{repair.teknisi_vendor}</strong>
                                </div>
                                <div className="font-mono font-bold text-amber-700">
                                  Biaya: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(repair.biaya)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Repair Entry Form Modal */}
      {isRepairModalOpen && selectedBarangForRepair && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">Catat Perbaikan Barang</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedBarangForRepair.kode_barang}</p>
                </div>
              </div>
              <button 
                id="close-repair-modal"
                onClick={() => setIsRepairModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <span className="text-[9px] font-bold text-blue-500 uppercase block">Barang Target</span>
                <span className="font-bold text-slate-800 text-sm block leading-snug">{selectedBarangForRepair.nama_barang}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Kondisi Saat Ini: <strong>{selectedBarangForRepair.kondisi_barang}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Perbaikan</label>
                  <input 
                    type="date"
                    required
                    value={repairDate}
                    onChange={(e) => setRepairDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Biaya Perbaikan (Rp)</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={repairCost}
                    onChange={(e) => setRepairCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Teknisi / Vendor Pemeliharaan</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Asus Service Center, Bengkel Sakura"
                  value={repairVendor}
                  onChange={(e) => setRepairVendor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Tindakan / Deskripsi Kerusakan & Perbaikan</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Deskripsikan kerusakan dan tindakan perbaikan..."
                  value={repairDesc}
                  onChange={(e) => setRepairDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800 leading-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Status Perbaikan</label>
                  <select 
                    value={repairStatus}
                    onChange={(e) => setRepairStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 bg-white"
                  >
                    <option value="Selesai">Selesai</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Kondisi Setelah Servis</label>
                  <select 
                    value={repairConditionAfter}
                    disabled={repairStatus !== 'Selesai'}
                    onChange={(e) => setRepairConditionAfter(e.target.value as any)}
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
                  id="cancel-repair-btn"
                  onClick={() => setIsRepairModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-repair-btn"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition cursor-pointer"
                >
                  Simpan Historis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
