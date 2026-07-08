/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  FileCode, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Upload, 
  Check, 
  AlertTriangle,
  Server,
  Save,
  DownloadCloud,
  CheckCircle
} from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';

interface DbBackupViewProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function DbBackupView({ currentUser }: DbBackupViewProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Restore states
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreStep, setRestoreStep] = useState<string>('');

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Reset database states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      OfficeInventoryDb.clearAllData();

      const cleanPayload = {
        kategori: [],
        barang: [],
        peminjam: [],
        users: OfficeInventoryDb.getUsers(),
        peminjaman: [],
        detail_peminjaman: [],
        pengembalian: [],
        audit_log: [
          {
            id_log: 1,
            tanggal: new Date().toISOString().replace('T', ' ').substring(0, 19),
            id_user: currentUser?.id_user || 1,
            aktivitas: 'Inisialisasi sistem: Menghapus data demo dan memulai basis data baru.',
            ip_address: '127.0.0.1'
          }
        ],
        serah_terima: [],
        detail_serah_terima: [],
        perbaikan: [],
      };

      localStorage.setItem('inv_audit_log', JSON.stringify(cleanPayload.audit_log));

      const seedRes = await fetch('/api/cloudsql/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      if (!seedRes.ok) {
        throw new Error('Gagal mereset data di Cloud SQL PostgreSQL: ' + await seedRes.text());
      }

      setIsResetModalOpen(false);
      alert('Basis data berhasil direset kembali ke keadaan bersih!');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };



  // Cloud SQL Integration States
  const [cloudSqlStatus, setCloudSqlStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [cloudSqlInfo, setCloudSqlInfo] = useState<any>(null);
  const [isCloudSqlSyncing, setIsCloudSqlSyncing] = useState(false);
  const [cloudSqlError, setCloudSqlError] = useState<string | null>(null);
  const [cloudSqlSuccess, setCloudSqlSuccess] = useState<string | null>(null);

  const checkCloudSqlStatus = async () => {
    setCloudSqlStatus('checking');
    try {
      const res = await fetch('/api/cloudsql/status');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'Connected') {
          setCloudSqlStatus('connected');
          setCloudSqlInfo(data);
          setCloudSqlError(null);
        } else {
          setCloudSqlStatus('disconnected');
          setCloudSqlError(data.error || 'Terputus dari basis data Cloud SQL.');
        }
      } else {
        setCloudSqlStatus('disconnected');
        setCloudSqlError('Server backend tidak dapat dijangkau.');
      }
    } catch (err: any) {
      setCloudSqlStatus('disconnected');
      setCloudSqlError(err.message || String(err));
    }
  };

  const handleCloudSqlExport = async () => {
    setIsCloudSqlSyncing(true);
    setCloudSqlError(null);
    setCloudSqlSuccess(null);
    try {
      const data = {
        kategori: OfficeInventoryDb.getKategori(),
        barang: OfficeInventoryDb.getBarang(),
        peminjam: OfficeInventoryDb.getPeminjam(),
        users: OfficeInventoryDb.getUsers(),
        peminjaman: OfficeInventoryDb.getPeminjaman(),
        detail_peminjaman: OfficeInventoryDb.getDetailPeminjaman(),
        pengembalian: OfficeInventoryDb.getPengembalian(),
        audit_log: OfficeInventoryDb.getAuditLog(),
        serah_terima: OfficeInventoryDb.getSerahTerima(),
        detail_serah_terima: OfficeInventoryDb.getDetailSerahTerima(),
        perbaikan: OfficeInventoryDb.getPerbaikan(),
      };

      const res = await fetch('/api/cloudsql/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setCloudSqlSuccess(result.message || 'Ekspor berhasil!');
        checkCloudSqlStatus();
      } else {
        const errData = await res.json();
        setCloudSqlError(errData.error || 'Gagal mengekspor data ke Cloud SQL.');
      }
    } catch (err: any) {
      setCloudSqlError(err.message || String(err));
    } finally {
      setIsCloudSqlSyncing(false);
    }
  };

  const handleCloudSqlImport = async () => {
    if (!window.confirm('PERINGATAN: Impor data akan menimpa seluruh database lokal Anda dengan data dari Cloud SQL. Apakah Anda yakin ingin melanjutkan?')) {
      return;
    }
    setIsCloudSqlSyncing(true);
    setCloudSqlError(null);
    setCloudSqlSuccess(null);
    try {
      const res = await fetch('/api/cloudsql/import');
      if (res.ok) {
        const data = await res.json();
        
        if (data.kategori) OfficeInventoryDb.saveKategori(data.kategori);
        if (data.barang) OfficeInventoryDb.saveBarang(data.barang);
        if (data.peminjam) OfficeInventoryDb.savePeminjam(data.peminjam);
        if (data.users) OfficeInventoryDb.saveUsers(data.users);
        if (data.peminjaman) OfficeInventoryDb.savePeminjaman(data.peminjaman);
        if (data.detail_peminjaman) OfficeInventoryDb.saveDetailPeminjaman(data.detail_peminjaman);
        if (data.pengembalian) OfficeInventoryDb.savePengembalianList(data.pengembalian);
        if (data.audit_log) OfficeInventoryDb.saveAuditLog(data.audit_log);
        if (data.serah_terima) OfficeInventoryDb.saveSerahTerima(data.serah_terima);
        if (data.detail_serah_terima) OfficeInventoryDb.saveDetailSerahTerima(data.detail_serah_terima);
        if (data.perbaikan) OfficeInventoryDb.savePerbaikan(data.perbaikan);

        setCloudSqlSuccess('Sinkronisasi selesai! Seluruh data lokal telah diperbarui dari Cloud SQL PostgreSQL.');
        checkCloudSqlStatus();
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errData = await res.json();
        setCloudSqlError(errData.error || 'Gagal mengimpor data dari Cloud SQL.');
      }
    } catch (err: any) {
      setCloudSqlError(err.message || String(err));
    } finally {
      setIsCloudSqlSyncing(false);
    }
  };

  useEffect(() => {
    checkCloudSqlStatus();
  }, []);



  const handleGenerateBackup = () => {
    if (currentUser?.role !== 'Admin') {
      alert('Hanya akun Administrator yang memiliki wewenang mengunduh file backup basis data.');
      return;
    }

    setIsBackingUp(true);
    setBackupSuccess(false);

    setTimeout(() => {
      try {
        const sqlDump = OfficeInventoryDb.generateBackupSql();
        const blob = new Blob([sqlDump], { type: 'text/sql;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        setDownloadUrl(url);
        setIsBackingUp(false);
        setBackupSuccess(true);
        OfficeInventoryDb.logActivity(currentUser.id_user, 'Melakukan backup database MySQL & mengunduh berkas SQL dump');

        // Automatic download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `office_inventory_backup_${new Date().toISOString().substring(0, 10)}.sql`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (e) {
        setIsBackingUp(false);
        alert('Gagal mengekstrak basis data: ' + e);
      }
    }, 1200);
  };

  const handleGenerateJsonBackup = () => {
    if (currentUser?.role !== 'Admin') {
      alert('Hanya akun Administrator yang memiliki wewenang mengunduh file backup basis data.');
      return;
    }

    setIsBackingUp(true);
    setBackupSuccess(false);

    setTimeout(() => {
      try {
        // Collect all localStorage keys prefixed with "inv_"
        const backupData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('inv_')) {
            const val = localStorage.getItem(key);
            if (val) {
              try {
                backupData[key] = JSON.parse(val);
              } catch {
                backupData[key] = val;
              }
            }
          }
        }

        const jsonDump = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonDump], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        setDownloadUrl(url);
        setIsBackingUp(false);
        setBackupSuccess(true);
        OfficeInventoryDb.logActivity(currentUser.id_user, 'Melakukan backup database JSON & mengunduh berkas backup state');

        // Automatic download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `office_inventory_backup_${new Date().toISOString().substring(0, 10)}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (e) {
        setIsBackingUp(false);
        alert('Gagal mengekstrak basis data JSON: ' + e);
      }
    }, 800);
  };

  // SQL parsing helper
  const parseSqlValues = (valuesStr: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inString = false;
    let i = 0;
    while (i < valuesStr.length) {
      const char = valuesStr[i];
      if (char === "'" && valuesStr[i + 1] === "'") {
        current += "'";
        i += 2;
      } else if (char === "'") {
        inString = !inString;
        i++;
      } else if (char === ',' && !inString) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    result.push(current.trim());
    return result;
  };

  const cleanVal = (v: string): string => {
    if (v === 'NULL' || v === 'null' || !v) return '';
    return v;
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentUser?.role !== 'Admin') {
      alert('Hanya akun Administrator yang diizinkan untuk memulihkan (restore) basis data.');
      return;
    }

    const confirmRestore = window.confirm(
      'PERINGATAN KRITIS: Tindakan ini akan menghapus seluruh data transaksi, barang, kategori, dan user aktif saat ini di browser Anda dan menggantikannya dengan data dari file cadangan yang Anda unggah.\n\nApakah Anda sangat yakin ingin melanjutkan?'
    );

    if (!confirmRestore) {
      e.target.value = ''; // Reset input
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(false);
    setRestoreStep('Membaca file cadangan...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File cadangan kosong atau tidak dapat dibaca.');

        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.json')) {
          setRestoreStep('Memvalidasi struktur file JSON...');
          const data = JSON.parse(text);
          
          let importedCount = 0;
          setRestoreStep('Menulis data ke Local Storage...');
          
          for (const key of Object.keys(data)) {
            if (key.startsWith('inv_')) {
              localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
              importedCount++;
            }
          }

          if (importedCount === 0) {
            // Try fallback if they just uploaded raw tables
            const keysMapping: Record<string, string> = {
              kategori: 'inv_kategori',
              barang: 'inv_barang',
              peminjam: 'inv_peminjam',
              users: 'inv_users',
              peminjaman: 'inv_peminjaman',
              detail_peminjaman: 'inv_detail_peminjaman',
              pengembalian: 'inv_pengembalian',
              audit_log: 'inv_audit_log'
            };
            for (const key of Object.keys(data)) {
              const mappedKey = keysMapping[key];
              if (mappedKey) {
                localStorage.setItem(mappedKey, JSON.stringify(data[key]));
                importedCount++;
              }
            }
          }

          if (importedCount === 0) {
            throw new Error('File JSON tidak valid atau tidak berisi kunci data inventaris yang cocok.');
          }

        } else if (fileName.endsWith('.sql')) {
          setRestoreStep('Memproses skema tabel SQL & mengurai data INSERT...');
          
          const lines = text.split('\n');
          const kategori: any[] = [];
          const barang: any[] = [];
          const peminjam: any[] = [];
          const users: any[] = [];
          const peminjaman: any[] = [];
          const detail: any[] = [];
          const pengembalian: any[] = [];
          const auditLog: any[] = [];

          const insertRegex = /INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\);/i;
          let parseCount = 0;

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('INSERT INTO')) continue;
            
            const match = trimmed.match(insertRegex);
            if (!match) continue;

            const tableName = match[1];
            const valuesStr = match[3];
            const values = parseSqlValues(valuesStr);
            parseCount++;

            // Create a dynamic mapping of column names to their parsed values
            const columns = match[2].split(',').map(c => c.trim().replace(/`/g, ''));
            const record: Record<string, string> = {};
            columns.forEach((col, idx) => {
              record[col] = values[idx] || '';
            });

            const getVal = (col: string, fallbackIdx: number): string => {
              return record[col] !== undefined ? record[col] : (values[fallbackIdx] || '');
            };

            if (tableName === 'tabel_kategori') {
              kategori.push({
                id_kategori: Number(getVal('id_kategori', 0)),
                nama_kategori: getVal('nama_kategori', 1),
                keterangan: cleanVal(getVal('keterangan', 2))
              });
            } else if (tableName === 'tabel_barang') {
              barang.push({
                id_barang: Number(getVal('id_barang', 0)),
                kode_barang: getVal('kode_barang', 1),
                nup: getVal('nup', 999) ? cleanVal(getVal('nup', 999)) : '', // nup might not be present in old backups, fallback to index 999 (which is empty)
                id_kategori: Number(getVal('id_kategori', 2)),
                nama_barang: getVal('nama_barang', 3),
                merk_tipe: cleanVal(getVal('merk_tipe', 4)),
                lokasi_penyimpanan: cleanVal(getVal('lokasi_penyimpanan', 5)),
                stok: Number(getVal('stok', 6)),
                stok_minimum: Number(getVal('stok_minimum', 7)),
                kondisi_barang: (getVal('kondisi_barang', 8) || 'Baik') as any,
                foto_barang: cleanVal(getVal('foto_barang', 9)),
                status_ketersediaan: (getVal('status_ketersediaan', 10) || 'Tersedia') as any,
                qr_code: cleanVal(getVal('qr_code', 11)),
                created_at: cleanVal(getVal('created_at', 12)),
                updated_at: cleanVal(getVal('updated_at', 13))
              });
            } else if (tableName === 'tabel_peminjam') {
              peminjam.push({
                id_peminjam: Number(getVal('id_peminjam', 0)),
                nip_nik: getVal('nip_nik', 1),
                nama_lengkap: getVal('nama_lengkap', 2),
                instansi_unit_kerja: cleanVal(getVal('instansi_unit_kerja', 3)),
                jabatan: cleanVal(getVal('jabatan', 4)),
                nomor_telepon: cleanVal(getVal('nomor_telepon', 5)),
                email: cleanVal(getVal('email', 6)),
                alamat: cleanVal(getVal('alamat', 7))
              });
            } else if (tableName === 'tabel_users') {
              const username = getVal('username', 2);
              let password = getVal('password', 3);
              if (password && password.startsWith('$2y$10$')) {
                if (username === 'admin') password = 'adminpassword';
                else if (username === 'petugas') password = 'petugaspassword';
                else if (username === 'budi') password = 'peminjampassword';
                else password = username + 'password';
              }
              users.push({
                id_user: Number(getVal('id_user', 0)),
                nama_user: getVal('nama_user', 1),
                username: username,
                password: password,
                role: (getVal('role', 4) || 'Petugas') as any,
                last_login: getVal('last_login', 5) === 'NULL' || !getVal('last_login', 5) ? null : cleanVal(getVal('last_login', 5)),
                status: (getVal('status', 6) || 'Aktif') as any
              });
            } else if (tableName === 'tabel_peminjaman') {
              peminjaman.push({
                id_peminjaman: Number(getVal('id_peminjaman', 0)),
                nomor_peminjaman: getVal('nomor_peminjaman', 1),
                tanggal_pinjam: getVal('tanggal_pinjam', 2),
                tanggal_rencana_kembali: getVal('tanggal_rencana_kembali', 3),
                id_peminjam: Number(getVal('id_peminjam', 4)),
                keperluan: cleanVal(getVal('keperluan', 5)),
                keterangan: cleanVal(getVal('keterangan', 6)),
                dokumen_pendukung: cleanVal(getVal('dokumen_pendukung', 7)),
                status: (getVal('status', 8) || 'Dipinjam') as any,
                created_by: Number(getVal('created_by', 9)),
                created_at: cleanVal(getVal('created_at', 10))
              });
            } else if (tableName === 'tabel_detail_peminjaman') {
              detail.push({
                id_detail: Number(getVal('id_detail', 0)),
                id_peminjaman: Number(getVal('id_peminjaman', 1)),
                id_barang: Number(getVal('id_barang', 2)),
                jumlah_pinjam: Number(getVal('jumlah_pinjam', 3)),
                jumlah_kembali: Number(getVal('jumlah_kembali', 4)),
                kondisi_pinjam: (getVal('kondisi_pinjam', 5) || 'Baik') as any,
                kondisi_kembali: (getVal('kondisi_kembali', 6) || '') as any,
                keterangan: cleanVal(getVal('keterangan', 7))
              });
            } else if (tableName === 'tabel_pengembalian') {
              pengembalian.push({
                id_pengembalian: Number(getVal('id_pengembalian', 0)),
                id_peminjaman: Number(getVal('id_peminjaman', 1)),
                tanggal_pengembalian: getVal('tanggal_pengembalian', 2),
                catatan: cleanVal(getVal('catatan', 3)),
                created_by: Number(getVal('created_by', 4))
              });
            } else if (tableName === 'tabel_audit_log') {
              auditLog.push({
                id_log: Number(getVal('id_log', 0)),
                tanggal: getVal('tanggal', 1),
                id_user: getVal('id_user', 2) === 'NULL' || !getVal('id_user', 2) ? null : Number(getVal('id_user', 2)),
                aktivitas: getVal('aktivitas', 3),
                ip_address: cleanVal(getVal('ip_address', 4))
              });
            }
          }

          if (parseCount === 0) {
            throw new Error('Tidak ditemukan query INSERT valid di dalam file SQL. Pastikan file ini adalah hasil export backup aplikasi SINVENT OFFICE.');
          }

          setRestoreStep('Mengimpor data ke penyimpanan lokal (Local Storage)...');

          if (kategori.length > 0) OfficeInventoryDb.saveKategori(kategori);
          if (barang.length > 0) OfficeInventoryDb.saveBarang(barang);
          if (peminjam.length > 0) OfficeInventoryDb.savePeminjam(peminjam);
          if (users.length > 0) OfficeInventoryDb.saveUsers(users);
          if (peminjaman.length > 0) OfficeInventoryDb.savePeminjaman(peminjaman);
          if (detail.length > 0) OfficeInventoryDb.saveDetailPeminjaman(detail);
          if (pengembalian.length > 0) OfficeInventoryDb.savePengembalianList(pengembalian);
          if (auditLog.length > 0) OfficeInventoryDb.saveAuditLog(auditLog);

        } else {
          throw new Error('Format file tidak didukung. Harap unggah berkas .sql atau .json saja.');
        }

        setRestoreStep('Mencatat riwayat aktivitas keamanan...');
        OfficeInventoryDb.logActivity(currentUser.id_user, `Melakukan restorasi basis data dari berkas cadangan "${file.name}"`);

        setRestoreStep('Restorasi berhasil! Menyegarkan sistem dalam 2 detik...');
        setRestoreSuccess(true);
        setIsRestoring(false);

        setTimeout(() => {
          window.location.reload();
        }, 1800);

      } catch (err: any) {
        setIsRestoring(false);
        setRestoreError(err.message || String(err));
      }
    };

    reader.onerror = () => {
      setIsRestoring(false);
      setRestoreError('Gagal membaca berkas dari sistem lokal.');
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" /> Utilitas Backup & Restor Database
        </h2>
        <p className="text-sm text-gray-500">Menu khusus administrator untuk mengunduh snapshot cadangan (SQL/JSON) atau mengunggah kembali file backup untuk memulihkan basis data.</p>
      </div>

      {/* Cloud SQL Integration Card */}
      <div className="bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-white rounded-2xl border border-blue-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-blue-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600 animate-pulse" /> Integrasi Cloud SQL PostgreSQL
            </h3>
            <p className="text-xs text-slate-500">Hubungkan data inventaris SINVENT OFFICE Anda ke basis data relasional Google Cloud SQL yang aman dan skalabel.</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            cloudSqlStatus === 'connected' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
            cloudSqlStatus === 'checking' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
            'bg-slate-100 text-slate-600'
          }`}>
            {cloudSqlStatus === 'connected' ? '● Aktif (Cloud SQL)' : 
             cloudSqlStatus === 'checking' ? '○ Memeriksa...' : 
             '● Tidak Terhubung'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Left: Cloud SQL Account Connection & Status */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status & Detail Koneksi</span>
              
              {cloudSqlStatus !== 'connected' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-normal">
                    Layanan Cloud SQL belum terhubung atau server backend belum dimulai.
                  </p>
                  <button
                    onClick={checkCloudSqlStatus}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98"
                  >
                    <RefreshCw className="h-4 w-4" /> Cek Koneksi Cloud SQL
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="font-medium text-slate-400 text-[11px]">Database Name:</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{cloudSqlInfo?.database}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="font-medium text-slate-400 text-[11px]">Host / Proxy Path:</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[180px]" title={cloudSqlInfo?.host}>{cloudSqlInfo?.host}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="font-medium text-slate-400 text-[11px]">Database User:</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{cloudSqlInfo?.user}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ringkasan Tabel Cloud SQL:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Kategori:</span>
                        <span className="font-bold text-slate-800">{cloudSqlInfo?.counts?.kategori ?? 0}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Barang / Stok:</span>
                        <span className="font-bold text-slate-800">{cloudSqlInfo?.counts?.barang ?? 0}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Peminjam:</span>
                        <span className="font-bold text-slate-800">{cloudSqlInfo?.counts?.peminjam ?? 0}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Transaksi:</span>
                        <span className="font-bold text-slate-800">{cloudSqlInfo?.counts?.peminjaman ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={checkCloudSqlStatus}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold transition-all border border-slate-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Perbarui Status Koneksi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions, Sync Status & Progress */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aksi Basis Data Cloud SQL</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleCloudSqlExport}
                  disabled={cloudSqlStatus !== 'connected' || isCloudSqlSyncing}
                  className={`px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1.5 text-center ${
                    cloudSqlStatus !== 'connected' || isCloudSqlSyncing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Save className="h-5 w-5" />
                  <span>Ekspor Ke Cloud SQL</span>
                  <span className="text-[9px] font-normal opacity-80">Kirim data lokal ke PostgreSQL</span>
                </button>

                <button
                  onClick={handleCloudSqlImport}
                  disabled={cloudSqlStatus !== 'connected' || isCloudSqlSyncing}
                  className={`px-4 py-3 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1.5 text-center ${
                    cloudSqlStatus !== 'connected' || isCloudSqlSyncing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <DownloadCloud className="h-5 w-5" />
                  <span>Impor Dari Cloud SQL</span>
                  <span className="text-[9px] font-normal opacity-80">Timpa data lokal dari PostgreSQL</span>
                </button>
              </div>

              {/* Progress Panel */}
              {isCloudSqlSyncing && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>Sinkronisasi Sedang Berlangsung...</span>
                  </div>
                </div>
              )}

              {/* Success Alert */}
              {cloudSqlSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold text-emerald-800">
                    {cloudSqlSuccess}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {cloudSqlError && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-medium text-rose-700">
                    <strong className="block font-bold mb-0.5">Kesalahan Cloud SQL:</strong>
                    {cloudSqlError}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] text-slate-400 leading-normal pt-4 border-t border-slate-50 mt-4">
              <strong>Catatan Database Relasional:</strong> Cloud SQL menggunakan mesin database PostgreSQL asli yang sepenuhnya terintegrasi. Tindakan impor akan secara otomatis me-refresh aplikasi agar seluruh perubahan data termuat dengan sempurna di layar Anda.
            </div>
          </div>

        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Information & Security */}
        <div className="border border-slate-150 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" /> Tindakan Pengamanan Data
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Menjaga keselamatan data inventaris kantor adalah kewajiban sistem. Disarankan melakukan backup basis data secara berkala sebelum melakukan upgrade script, migrasi server, atau pergantian petugas pengelola barang.
            </p>

            <div className="space-y-2 mt-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Skema MySQL 8+ Full PDO Compliant (.SQL)
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Menyimpan Data User, Kategori, Barang & Transaksi terkini
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Restorasi Cepat langsung di browser via File Upload (.SQL / .JSON)
              </div>
            </div>
          </div>

          {currentUser?.role === 'Admin' ? (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 mt-4">
              <button 
                id="download-backup-btn"
                onClick={handleGenerateBackup}
                disabled={isBackingUp || isRestoring}
                className={`flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 ${
                  isBackingUp || isRestoring ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Sedang Mengompres...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Backup .SQL
                  </>
                )}
              </button>

              <button 
                id="download-json-backup-btn"
                onClick={handleGenerateJsonBackup}
                disabled={isBackingUp || isRestoring}
                className={`flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 ${
                  isBackingUp || isRestoring ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Sedang Mengompres...
                  </>
                ) : (
                  <>
                    <FileCode className="h-4 w-4" /> Backup .JSON
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-1.5 mt-4">
              <AlertCircle className="h-4 w-4" /> Akses Ditolak: Hanya Akun Administrator yang Diizinkan Mengunduh Backup.
            </div>
          )}

          {backupSuccess && (
            <div className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl animate-pulse mt-2 text-center">
              ✓ Database berhasil dicadangkan dan didownload!
            </div>
          )}
        </div>

        {/* Right Card: Core Restore Actions */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <Upload className="h-4.5 w-4.5 text-blue-600" /> Restor & Pulihkan Database
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Memiliki file backup? Unggah file tersebut (.sql atau .json) di bawah untuk memulihkan seluruh data aplikasi. Sistem akan mendeteksi isi berkas secara cerdas dan memperbarui penyimpanan Anda secara otomatis.
            </p>
          </div>

          {currentUser?.role === 'Admin' ? (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-gray-200 hover:border-blue-400 bg-white rounded-xl p-4 transition text-center cursor-pointer group">
                <input 
                  type="file" 
                  accept=".sql,.json"
                  onChange={handleFileRestore}
                  disabled={isRestoring}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs font-bold text-slate-700">Pilih Berkas Cadangan</span>
                  <span className="text-[10px] text-slate-400">Mendukung file .SQL atau .JSON hasil export</span>
                </div>
              </div>

              {isRestoring && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-blue-800">Sedang Memproses Pemulihan...</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium italic">{restoreStep}</p>
                </div>
              )}

              {restoreSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Restorasi Sukses!</div>
                    <p className="text-[10px] text-emerald-600 font-medium">Halaman akan dimuat ulang untuk memperbarui sistem...</p>
                  </div>
                </div>
              )}

              {restoreError && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> Gagal Melakukan Restorasi
                  </div>
                  <p className="text-[10px] text-rose-600 leading-normal">{restoreError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Akses Ditolak: Hanya Akun Administrator yang Diizinkan Mengimpor Database.
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[9px] text-amber-700 leading-normal font-medium">
              <strong>PERINGATAN:</strong> Tindakan restorasi bersifat destruktif. Data aktif yang belum dicadangkan akan hilang sepenuhnya setelah berkas cadangan diimpor.
            </span>
          </div>
        </div>

        {/* Card 3: Inisialisasi & Hapus Semua Data */}
        <div className="border border-rose-100 bg-rose-50/10 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600" /> Inisialisasi Database
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              Ingin membersihkan sistem dari seluruh data demo bawaan untuk digunakan secara nyata? Fitur ini akan menghapus semua barang, transaksi, peminjam, kategori, dan log sistem secara instan.
            </p>

            <div className="space-y-2 mt-4 text-xs font-semibold text-rose-800">
              <div className="flex items-center gap-2">
                • Menghapus seluruh data master barang & kategori
              </div>
              <div className="flex items-center gap-2">
                • Mengosongkan data transaksi pinjam-kembali
              </div>
              <div className="flex items-center gap-2">
                • Mempertahankan akun login utama ('admin', 'petugas')
              </div>
            </div>
          </div>

          {currentUser?.role === 'Admin' ? (
            <div className="space-y-3">
              <button
                type="button"
                id="btn-reset-db"
                disabled={isBackingUp || isRestoring || isResetting}
                onClick={() => setIsResetModalOpen(true)}
                className={`w-full px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${
                  isBackingUp || isRestoring || isResetting
                    ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-rose-600/10 hover:shadow-lg hover:shadow-rose-600/20 active:scale-95'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Ya, Kosongkan Database
              </button>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Akses Ditolak: Hanya Akun Administrator yang Diizinkan Menginisialisasi Database.
            </div>
          )}

          <div className="bg-rose-50 border border-rose-100/30 p-2.5 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-[9px] text-rose-600 leading-normal font-medium">
              <strong>TINDAKAN SANGAT SENSITIF:</strong> Penghapusan bersifat permanen di lokal & Cloud SQL. Pastikan Anda mengunduh berkas Backup (.SQL) terlebih dahulu sebagai cadangan aman.
            </span>
          </div>
        </div>

      </div>

      {/* CONFIRM RESET DATABASE MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-6 relative">
            <div className="flex items-center gap-4 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-950">Hapus Seluruh Data Demo?</h3>
                <p className="text-xs text-rose-500 font-medium">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Anda akan menghapus seluruh data demo bawaan sistem yang mencakup:
              </p>
              <ul className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-semibold uppercase tracking-wider">
                <li>• Master Barang</li>
                <li>• Master Kategori</li>
                <li>• Master Peminjam</li>
                <li>• Transaksi Pinjam</li>
                <li>• Catatan Kembali</li>
                <li>• Historis Perbaikan</li>
              </ul>
              <p className="text-xs text-gray-400 italic">
                *Akun login default ('admin', 'petugas') akan tetap dipertahankan agar Anda tidak kehilangan akses masuk sistem.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDatabase}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus Semua'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

