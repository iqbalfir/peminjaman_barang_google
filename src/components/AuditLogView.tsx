/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Eye, ClipboardList, ShieldAlert, Trash2, Shield, Calendar, Terminal } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { AuditLog, User } from '../types';

interface AuditLogViewProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function AuditLogView({ currentUser }: AuditLogViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLogs(OfficeInventoryDb.getAuditLogs().reverse()); // Show newest first
    setUsers(OfficeInventoryDb.getUsers());
  };

  const handleClearLogs = () => {
    if (currentUser?.role !== 'Admin') {
      alert('Hanya administrator yang berwenang membersihkan jejak audit.');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh log audit aktivitas?\nTindakan ini permanen dan tidak dapat dibatalkan.')) {
      OfficeInventoryDb.saveAuditLogs([]);
      OfficeInventoryDb.logActivity(currentUser.id_user, 'Membersihkan seluruh jejak audit aktivitas (Clear logs)');
      loadData();
    }
  };

  const filteredLogs = logs.filter(l => {
    const u = users.find(x => x.id_user === l.id_user);
    const userDisplay = u ? `${u.nama_user} (${u.username})` : 'System User';
    return l.aktivitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.tanggal_log.includes(searchTerm);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" /> Jejak Audit Aktivitas (Audit Log)
          </h2>
          <p className="text-sm text-gray-500">Log pencatatan otomatis seluruh operasi write/delete data demi keamanan audit instansi</p>
        </div>
        {currentUser?.role === 'Admin' && (
          <button 
            id="clear-logs-btn"
            onClick={handleClearLogs}
            className="px-4 py-2 border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition text-xs flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> Kosongkan Log Audit
          </button>
        )}
      </div>

      {/* Info Warning */}
      <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 flex gap-3 text-xs text-blue-900 font-medium">
        <Terminal className="h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <span className="font-bold">Keamanan Jejak Digital:</span> Setiap aktivitas login, entry inventaris, qr scanning, modifikasi profile user, override password, dan checkout pinjaman secara otomatis di-timestamp secara realtime dan dikunci. Log tidak dapat disunting manual.
        </div>
      </div>

      {/* Filter search */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        <input 
          id="search-log-input"
          type="text" 
          placeholder="Cari kata kunci aktivitas, nama operator, atau tanggal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Logs interactive stream */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-2.5 px-4 w-12 text-center">No</th>
              <th className="py-2.5 px-4 w-48">Waktu & Tanggal</th>
              <th className="py-2.5 px-4 w-52">Operator Akun</th>
              <th className="py-2.5 px-4">Aktivitas Operasi Kerja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 font-mono text-xs text-gray-600">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400 text-xs font-sans">
                  Tidak ada catatan log aktivitas yang terekam atau cocok.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                const u = users.find(x => x.id_user === log.id_user);
                return (
                  <tr key={log.id_log} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 text-blue-700 font-semibold">{log.tanggal_log}</td>
                    <td className="py-3 px-4">
                      {u ? (
                        <div>
                          <span className="font-bold text-gray-800">{u.nama_user}</span>
                          <span className="text-[10px] text-gray-400 block">@{u.username} ({u.role})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-bold italic">Sistem Otomatis</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      <span className={`px-1.5 py-0.5 rounded-lg mr-2 font-bold uppercase text-[9px] ${
                        log.aktivitas.toLowerCase().includes('hapus') || log.aktivitas.toLowerCase().includes('bersihkan') ? 'bg-rose-100 text-rose-800' :
                        log.aktivitas.toLowerCase().includes('tambah') || log.aktivitas.toLowerCase().includes('registrasi') ? 'bg-emerald-100 text-emerald-800' :
                        log.aktivitas.toLowerCase().includes('edit') || log.aktivitas.toLowerCase().includes('reset') ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.aktivitas.toLowerCase().includes('hapus') ? 'DELETE' :
                         log.aktivitas.toLowerCase().includes('tambah') ? 'CREATE' :
                         log.aktivitas.toLowerCase().includes('edit') ? 'UPDATE' : 'ACTION'}
                      </span>
                      {log.aktivitas}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
