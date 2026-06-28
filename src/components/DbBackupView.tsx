/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Download, FileCode, ShieldAlert, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';

interface DbBackupViewProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function DbBackupView({ currentUser }: DbBackupViewProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" /> Utilitas Backup & Cadangan Database
        </h2>
        <p className="text-sm text-gray-500">Menu khusus administrator untuk mendownload snapshot backup SQL database relasional (Skema + Data terbaru)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: Information & Security */}
        <div className="border border-slate-150 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500" /> Tindakan Pengamanan Data
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Menjaga keselamatan data inventaris kantor adalah kewajiban sistem. Disarankan melakukan backup basis data secara berkala sebelum melakukan upgrade script, migrasi server, atau pergantian petugas pengelola barang.
          </p>

          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Skema MySQL 8+ Full PDO Compliant
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Menyimpan Data User, Kategori, Barang & Transaksi terkini
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Siap di-import langsung via phpMyAdmin / MySQL CLI
            </div>
          </div>
        </div>

        {/* Right Card: Core Actions */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4">
          <Database className="h-12 w-12 text-blue-600 animate-bounce" />
          
          <div>
            <h4 className="text-sm font-bold text-gray-800">Ekstrak Berkas SQL Terkini</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1">Menggabungkan data active session local storage ke dalam query INSERT standar MySQL</p>
          </div>

          {currentUser?.role === 'Admin' ? (
            <button 
              id="download-backup-btn"
              onClick={handleGenerateBackup}
              disabled={isBackingUp}
              className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 ${
                isBackingUp ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Sedang Mengompres Database...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Cadangkan & Unduh Berkas .SQL
                </>
              )}
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Akses Ditolak: Hanya Akun Administrator yang Diizinkan Mengambil Backup.
            </div>
          )}

          {backupSuccess && (
            <div className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl animate-pulse">
              ✓ Database berhasil dicadangkan dan didownload!
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
