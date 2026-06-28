/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, FileSpreadsheet, Printer, TrendingUp, AlertTriangle, Search, BookOpen, Clock } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Peminjaman, DetailPeminjaman, Barang, Peminjam } from '../types';

interface LaporanProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function Laporan({ currentUser }: LaporanProps) {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [detailList, setDetailList] = useState<DetailPeminjaman[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);

  // Selected report type
  const [reportType, setReportType] = useState<'peminjaman' | 'terbanyak' | 'keterlambatan'>('peminjaman');

  // Filters for Report 1
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  useEffect(() => {
    setPeminjamanList(OfficeInventoryDb.getPeminjaman());
    setDetailList(OfficeInventoryDb.getDetailPeminjaman());
    setBarangList(OfficeInventoryDb.getBarang());
    setPeminjamList(OfficeInventoryDb.getPeminjam());
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
          nip: borrower?.nip_nik || '-',
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
    } else {
      filename = "Laporan_Keterlambatan_Pengembalian.csv";
      csvContent += "No;Nomor Peminjaman;Nama Peminjam;NIP;Barang;Jatuh Tempo;Hari Terlambat\n";
      
      const data = getOverdueReport();
      data.forEach((o, index) => {
        csvContent += `${index + 1};${o.nomor_peminjaman};${o.peminjam};${o.nip};"${o.barang}";${o.tanggal_rencana_kembali};${o.hari_terlambat}\n`;
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
                        <div className="text-[10px] text-gray-400 font-mono">NIP: {o.nip}</div>
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

    </div>
  );
}
