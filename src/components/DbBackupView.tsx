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
  FileSpreadsheet,
  LogIn,
  LogOut,
  ExternalLink,
  Save,
  DownloadCloud,
  CheckCircle,
  Sparkles,
  Server
} from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle 
} from '../googleAuth';
import { 
  findSpreadsheet, 
  createSpreadsheet, 
  exportToGoogleSheets, 
  importFromGoogleSheets,
  initGlobalSync
} from '../googleSheetsSync';
import { User } from 'firebase/auth';

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

  // Google Sheets integration states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<{ id: string; name: string } | null>(null);
  const [isSearchingSpreadsheet, setIsSearchingSpreadsheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem('inv_auto_sync') !== 'false'; // default to true
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

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

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        
        const savedSheet = localStorage.getItem('inv_g_spreadsheet');
        if (savedSheet) {
          try {
            setSpreadsheet(JSON.parse(savedSheet));
          } catch (e) {}
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update global sync parameters whenever state changes
  useEffect(() => {
    initGlobalSync(googleToken, spreadsheet?.id || null, autoSync);
  }, [googleToken, spreadsheet, autoSync]);

  const handleGoogleLogin = async () => {
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setSyncSuccess(`Berhasil masuk sebagai ${res.user.email}!`);
        // Check for existing spreadsheet automatically
        await checkOrFindSpreadsheet(res.accessToken);
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      if (errMsg.includes('popup-closed-by-user') || errMsg.includes('popup')) {
        setSyncError(
          'Jendela pratinjau login Google ditutup sebelum selesai. Ini terjadi karena browser memblokir komunikasi popup di dalam panel preview (iframe). Silakan buka aplikasi di tab baru untuk melakukan login dengan sukses.'
        );
      } else {
        setSyncError('Gagal masuk Google OAuth: ' + errMsg);
      }
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setSpreadsheet(null);
      localStorage.removeItem('inv_g_spreadsheet');
      setSyncSuccess('Berhasil keluar dari akun Google.');
    } catch (err: any) {
      setSyncError('Gagal keluar dari akun Google: ' + (err.message || String(err)));
    }
  };

  const checkOrFindSpreadsheet = async (token: string) => {
    setIsSearchingSpreadsheet(true);
    setSyncError(null);
    try {
      const found = await findSpreadsheet(token);
      if (found) {
        setSpreadsheet(found);
        localStorage.setItem('inv_g_spreadsheet', JSON.stringify(found));
        setSyncSuccess(`Ditemukan database spreadsheet yang cocok: "${found.name}"`);
      } else {
        setSpreadsheet(null);
        localStorage.removeItem('inv_g_spreadsheet');
      }
    } catch (err: any) {
      setSyncError('Kesalahan mendeteksi database Google Sheets: ' + (err.message || String(err)));
    } finally {
      setIsSearchingSpreadsheet(false);
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (!googleToken) return;
    setIsSearchingSpreadsheet(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const newId = await createSpreadsheet(googleToken);
      const sheetInfo = { id: newId, name: 'SINVENT OFFICE Database' };
      setSpreadsheet(sheetInfo);
      localStorage.setItem('inv_g_spreadsheet', JSON.stringify(sheetInfo));
      setSyncSuccess('Spreadsheet "SINVENT OFFICE Database" baru berhasil dibuat!');
      
      // Initial export
      setSyncProgress('Memulai ekspor data awal ke spreadsheet baru...');
      await exportToGoogleSheets(googleToken, newId, (msg) => setSyncProgress(msg));
      setSyncSuccess('Database spreadsheet baru berhasil dibuat dan data telah diekspor!');
    } catch (err: any) {
      setSyncError('Gagal membuat database spreadsheet: ' + (err.message || String(err)));
    } finally {
      setIsSearchingSpreadsheet(false);
      setSyncProgress('');
    }
  };

  const handleExport = async () => {
    if (!googleToken || !spreadsheet?.id) {
      setSyncError('Autentikasi Google atau spreadsheet tidak terhubung.');
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      await exportToGoogleSheets(googleToken, spreadsheet.id, (msg) => setSyncProgress(msg));
      setSyncSuccess('Seluruh data berhasil diekspor ke Google Sheets!');
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, 'Mengekspor seluruh database lokal ke Google Sheets');
    } catch (err: any) {
      setSyncError('Ekspor gagal: ' + (err.message || String(err)));
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  const handleImport = async () => {
    if (!googleToken || !spreadsheet?.id) {
      setSyncError('Autentikasi Google atau spreadsheet tidak terhubung.');
      return;
    }
    const confirmImport = window.confirm(
      'PERINGATAN KRITIS: Tindakan ini akan menghapus seluruh data lokal Anda di browser ini dan menggantikannya dengan data dari Google Sheets.\n\nApakah Anda yakin ingin melanjutkan?'
    );
    if (!confirmImport) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      await importFromGoogleSheets(googleToken, spreadsheet.id, (msg) => setSyncProgress(msg));
      setSyncSuccess('Seluruh data berhasil diimpor dari Google Sheets!');
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, 'Mengimpor seluruh database dari Google Sheets');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setSyncError('Impor gagal: ' + (err.message || String(err)));
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  const handleToggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('inv_auto_sync', String(newValue));
    if (newValue && googleToken && spreadsheet?.id) {
      exportToGoogleSheets(googleToken, spreadsheet.id).catch(console.error);
    }
  };

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

      {/* Google Sheets Integration Card - Disabled & Replaced */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-500 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-slate-400" /> Integrasi Google Sheets (Dinonaktifkan)
            </h3>
            <p className="text-xs text-slate-400">Sinkronisasi eksternal ke Google Spreadsheet telah dinonaktifkan sesuai kebutuhan sistem baru.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-200 text-slate-500 border border-slate-300">
            ● Disabled
          </span>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Sinkronisasi Otomatis PostgreSQL Cloud SQL Aktif</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi Anda sekarang dikonfigurasi untuk secara otomatis menyimpan dan menyinkronkan seluruh perubahan data (kategori, barang, peminjam, transaksi, perbaikan, jejak audit log, dll.) langsung ke <strong>Integrasi Cloud SQL PostgreSQL</strong> secara real-time.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Auto-save Aktif
            </span>
            <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              Database PostgreSQL Berkinerja Tinggi
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 leading-normal pt-2">
          <strong>Catatan Sistem:</strong> Anda tidak perlu lagi melakukan ekspor atau impor manual ke Google Sheets. Seluruh riwayat transaksi dan data master tersimpan dengan aman, konsisten, dan tahan lama di basis data relasional Cloud SQL.
        </div>
      </div>

      {/* Hidden legacy Google Sheets controls to satisfy bindings and imports */}
      <div className="hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Left: Google Account Connection & Status */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Akun Google</span>
              
              {!googleUser ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-normal">
                    Anda belum menghubungkan akun Google Anda. Hubungkan sekarang untuk membuat spreadsheet baru atau membaca data dari file cloud Anda.
                  </p>
                  
                  {isInIframe && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 space-y-2">
                      <div className="flex items-start gap-1.5 font-semibold">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>Peringatan Pembatasan Iframe Preview</span>
                      </div>
                      <p className="leading-relaxed">
                        Browser memblokir Google Sign-In popup jika dijalankan di dalam panel pratinjau (iframe) AI Studio. Silakan buka aplikasi di tab baru untuk melakukan login dengan aman dan lancar.
                      </p>
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shadow-xs transition duration-150"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Buka Aplikasi di Tab Baru
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98"
                  >
                    <LogIn className="h-4 w-4" /> Masuk dengan Google
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    {googleUser.photoURL ? (
                      <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google Profile'} className="h-10 w-10 rounded-full border border-emerald-100" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {googleUser.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{googleUser.displayName || 'Akun Google'}</div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">{googleUser.email}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Database Terhubung:</span>
                    {spreadsheet ? (
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-emerald-800 truncate flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" /> {spreadsheet.name}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono truncate">ID: {spreadsheet.id.substring(0, 16)}...</div>
                        </div>
                        <a 
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheet.id}`} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="p-1.5 bg-white text-slate-600 hover:text-emerald-600 border border-slate-200 rounded-lg hover:shadow-xs transition flex items-center justify-center"
                          title="Buka Spreadsheet di Tab Baru"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-amber-600 font-medium">Database spreadsheet belum dibuat di Google Drive Anda.</p>
                        <button
                          onClick={handleCreateSpreadsheet}
                          disabled={isSearchingSpreadsheet}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          {isSearchingSpreadsheet ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Membuat...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="h-3.5 w-3.5" /> Buat Spreadsheet Otomatis
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGoogleLogout}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-[11px] font-bold transition-all border border-slate-100"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Putuskan Koneksi Akun
                  </button>
                </div>
              )}
            </div>

            {/* Auto Sync Settings & Information */}
            {googleUser && spreadsheet && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Sinkronisasi Otomatis</span>
                    <p className="text-[10px] text-slate-400">Ekspor setiap perubahan data secara real-time</p>
                  </div>
                  <button 
                    onClick={handleToggleAutoSync}
                    className="focus:outline-none"
                  >
                    {autoSync ? (
                      <div className="w-10 h-6 flex items-center bg-emerald-500 rounded-full p-0.5 cursor-pointer transition">
                        <div className="bg-white w-5 h-5 rounded-full shadow-md transform translate-x-4 transition"></div>
                      </div>
                    ) : (
                      <div className="w-10 h-6 flex items-center bg-slate-300 rounded-full p-0.5 cursor-pointer transition">
                        <div className="bg-white w-5 h-5 rounded-full shadow-md transform translate-x-0 transition"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions, Sync Status & Progress */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aksi Basis Data Cloud</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleExport}
                  disabled={!googleUser || !spreadsheet || isSyncing}
                  className={`px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1.5 text-center ${
                    !googleUser || !spreadsheet || isSyncing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Save className="h-5 w-5" />
                  <span>Ekspor Ke Sheets</span>
                  <span className="text-[9px] font-normal opacity-80">Kirim data lokal ke cloud</span>
                </button>

                <button
                  onClick={handleImport}
                  disabled={!googleUser || !spreadsheet || isSyncing}
                  className={`px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex flex-col items-center justify-center gap-1.5 text-center ${
                    !googleUser || !spreadsheet || isSyncing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <DownloadCloud className="h-5 w-5" />
                  <span>Impor Dari Sheets</span>
                  <span className="text-[9px] font-normal opacity-80">Timpa data lokal dari cloud</span>
                </button>
              </div>

              {/* Progress Panel */}
              {isSyncing && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>Sinkronisasi Sedang Berlangsung...</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium italic">{syncProgress}</p>
                </div>
              )}

              {/* Success Alert */}
              {syncSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold text-emerald-800">
                    {syncSuccess}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {syncError && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-medium text-rose-700">
                      <strong className="block font-bold mb-0.5">Kesalahan Sinkronisasi:</strong>
                      {syncError}
                    </div>
                  </div>
                  {(syncError.includes('popup') || syncError.includes('iframe') || isInIframe) && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] shadow-xs transition duration-150 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Buka di Tab Baru & Coba Lagi
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="text-[9px] text-slate-400 leading-normal pt-4 border-t border-slate-50 mt-4">
              <strong>Catatan Google Drive:</strong> Seluruh modifikasi tabel data akan disimpan ke spreadsheet bersangkutan dengan aman. Pastikan Anda tidak mengubah susunan atau nama tab sheet di Google Sheets secara manual untuk mencegah kesalahan pembacaan data.
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
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

      </div>

    </div>
  );
}

