/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { OfficeInventoryDb } from './dbMock';

export interface SheetConfig {
  sheetName: string;
  headers: string[];
  getData: () => any[];
  saveData: (data: any[]) => void;
  parseRow: (row: string[]) => any;
}

export const SHEET_CONFIGS: SheetConfig[] = [
  {
    sheetName: 'tabel_kategori',
    headers: ['id_kategori', 'nama_kategori', 'keterangan'],
    getData: () => OfficeInventoryDb.getKategori(),
    saveData: (data) => OfficeInventoryDb.saveKategori(data),
    parseRow: (row) => ({
      id_kategori: Number(row[0]) || 0,
      nama_kategori: row[1] || '',
      keterangan: row[2] || ''
    })
  },
  {
    sheetName: 'tabel_barang',
    headers: [
      'id_barang', 'kode_barang', 'nup', 'nama_barang', 'id_kategori', 
      'merk_tipe', 'lokasi_penyimpanan', 'stok', 'stok_minimum', 
      'kondisi_barang', 'foto_barang', 'status_ketersediaan', 'qr_code', 
      'created_at', 'updated_at'
    ],
    getData: () => OfficeInventoryDb.getBarang(),
    saveData: (data) => OfficeInventoryDb.saveBarang(data),
    parseRow: (row) => ({
      id_barang: Number(row[0]) || 0,
      kode_barang: row[1] || '',
      nup: row[2] || '',
      nama_barang: row[3] || '',
      id_kategori: Number(row[4]) || 0,
      merk_tipe: row[5] || '',
      lokasi_penyimpanan: row[6] || '',
      stok: Number(row[7]) || 0,
      stok_minimum: Number(row[8]) || 0,
      kondisi_barang: row[9] || 'Baik',
      foto_barang: row[10] || '',
      status_ketersediaan: row[11] || 'Tersedia',
      qr_code: row[12] || '',
      created_at: row[13] || '',
      updated_at: row[14] || ''
    })
  },
  {
    sheetName: 'tabel_peminjam',
    headers: ['id_peminjam', 'nip_nik', 'nama_lengkap', 'instansi_unit_kerja', 'jabatan', 'nomor_telepon', 'email', 'alamat'],
    getData: () => OfficeInventoryDb.getPeminjam(),
    saveData: (data) => OfficeInventoryDb.savePeminjam(data),
    parseRow: (row) => ({
      id_peminjam: Number(row[0]) || 0,
      nip_nik: row[1] || '',
      nama_lengkap: row[2] || '',
      instansi_unit_kerja: row[3] || '',
      jabatan: row[4] || '',
      nomor_telepon: row[5] || '',
      email: row[6] || '',
      alamat: row[7] || ''
    })
  },
  {
    sheetName: 'tabel_users',
    headers: ['id_user', 'nama_user', 'username', 'password', 'role', 'last_login', 'status'],
    getData: () => OfficeInventoryDb.getUsers(),
    saveData: (data) => OfficeInventoryDb.saveUsers(data),
    parseRow: (row) => ({
      id_user: Number(row[0]) || 0,
      nama_user: row[1] || '',
      username: row[2] || '',
      password: row[3] || '',
      role: row[4] || 'Petugas',
      last_login: row[5] || null,
      status: row[6] || 'Aktif'
    })
  },
  {
    sheetName: 'tabel_peminjaman',
    headers: [
      'id_peminjaman', 'nomor_peminjaman', 'tanggal_pinjam', 'tanggal_rencana_kembali', 
      'id_peminjam', 'keperluan', 'keterangan', 'dokumen_pendukung', 
      'status', 'created_by', 'created_at', 'tanda_tangan'
    ],
    getData: () => OfficeInventoryDb.getPeminjaman(),
    saveData: (data) => OfficeInventoryDb.savePeminjaman(data),
    parseRow: (row) => ({
      id_peminjaman: Number(row[0]) || 0,
      nomor_peminjaman: row[1] || '',
      tanggal_pinjam: row[2] || '',
      tanggal_rencana_kembali: row[3] || '',
      id_peminjam: Number(row[4]) || 0,
      keperluan: row[5] || '',
      keterangan: row[6] || '',
      dokumen_pendukung: row[7] || '',
      status: row[8] || 'Dipinjam',
      created_by: Number(row[9]) || 0,
      created_at: row[10] || '',
      tanda_tangan: row[11] || ''
    })
  },
  {
    sheetName: 'tabel_detail_peminjaman',
    headers: ['id_detail', 'id_peminjaman', 'id_barang', 'jumlah_pinjam', 'jumlah_kembali', 'kondisi_pinjam', 'kondisi_kembali', 'keterangan'],
    getData: () => OfficeInventoryDb.getDetailPeminjaman(),
    saveData: (data) => OfficeInventoryDb.saveDetailPeminjaman(data),
    parseRow: (row) => ({
      id_detail: Number(row[0]) || 0,
      id_peminjaman: Number(row[1]) || 0,
      id_barang: Number(row[2]) || 0,
      jumlah_pinjam: Number(row[3]) || 0,
      jumlah_kembali: Number(row[4]) || 0,
      kondisi_pinjam: row[5] || 'Baik',
      kondisi_kembali: row[6] || '',
      keterangan: row[7] || ''
    })
  },
  {
    sheetName: 'tabel_pengembalian',
    headers: ['id_pengembalian', 'id_peminjaman', 'tanggal_pengembalian', 'catatan', 'created_by'],
    getData: () => OfficeInventoryDb.getPengembalian(),
    saveData: (data) => OfficeInventoryDb.savePengembalianList(data),
    parseRow: (row) => ({
      id_pengembalian: Number(row[0]) || 0,
      id_peminjaman: Number(row[1]) || 0,
      tanggal_pengembalian: row[2] || '',
      catatan: row[3] || '',
      created_by: Number(row[4]) || 0
    })
  },
  {
    sheetName: 'tabel_audit_log',
    headers: ['id_log', 'tanggal', 'id_user', 'aktivitas', 'ip_address'],
    getData: () => OfficeInventoryDb.getAuditLog(),
    saveData: (data) => OfficeInventoryDb.saveAuditLog(data),
    parseRow: (row) => ({
      id_log: Number(row[0]) || 0,
      tanggal: row[1] || '',
      id_user: row[2] ? Number(row[2]) : null,
      aktivitas: row[3] || '',
      ip_address: row[4] || ''
    })
  },
  {
    sheetName: 'tabel_serah_terima',
    headers: ['id_serah_terima', 'nomor_bast', 'tanggal_serah', 'tanggal_kembali', 'id_peminjam', 'keperluan', 'keterangan', 'status', 'created_by', 'created_at'],
    getData: () => OfficeInventoryDb.getSerahTerima(),
    saveData: (data) => OfficeInventoryDb.saveSerahTerima(data),
    parseRow: (row) => ({
      id_serah_terima: Number(row[0]) || 0,
      nomor_bast: row[1] || '',
      tanggal_serah: row[2] || '',
      tanggal_kembali: row[3] || '',
      id_peminjam: Number(row[4]) || 0,
      keperluan: row[5] || '',
      keterangan: row[6] || '',
      status: row[7] || 'Diserahkan',
      created_by: Number(row[8]) || 0,
      created_at: row[9] || ''
    })
  },
  {
    sheetName: 'tabel_detail_serah_terima',
    headers: ['id_detail_bast', 'id_serah_terima', 'id_barang', 'jumlah_serah', 'jumlah_kembali', 'kondisi_serah', 'kondisi_kembali'],
    getData: () => OfficeInventoryDb.getDetailSerahTerima(),
    saveData: (data) => OfficeInventoryDb.saveDetailSerahTerima(data),
    parseRow: (row) => ({
      id_detail_bast: Number(row[0]) || 0,
      id_serah_terima: Number(row[1]) || 0,
      id_barang: Number(row[2]) || 0,
      jumlah_serah: Number(row[3]) || 0,
      jumlah_kembali: Number(row[4]) || 0,
      kondisi_serah: row[5] || 'Baik',
      kondisi_kembali: row[6] || ''
    })
  },
  {
    sheetName: 'tabel_perbaikan',
    headers: ['id_perbaikan', 'id_barang', 'tanggal_perbaikan', 'deskripsi_perbaikan', 'biaya', 'teknisi_vendor', 'status_perbaikan', 'kondisi_setelah_perbaikan'],
    getData: () => OfficeInventoryDb.getPerbaikan(),
    saveData: (data) => OfficeInventoryDb.savePerbaikan(data),
    parseRow: (row) => ({
      id_perbaikan: Number(row[0]) || 0,
      id_barang: Number(row[1]) || 0,
      tanggal_perbaikan: row[2] || '',
      deskripsi_perbaikan: row[3] || '',
      biaya: Number(row[4]) || 0,
      teknisi_vendor: row[5] || '',
      status_perbaikan: row[6] || 'Selesai',
      kondisi_setelah_perbaikan: row[7] || 'Baik'
    })
  }
];

const SPREADSHEET_NAME = 'SINVENT OFFICE Database';

/**
 * Find existing spreadsheet named SPREADSHEET_NAME in user's Drive
 */
export async function findSpreadsheet(accessToken: string): Promise<{ id: string; name: string } | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      throw new Error(`Gagal mencari file: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (error) {
    console.error('Error finding spreadsheet:', error);
    throw error;
  }
}

/**
 * Create a new spreadsheet with all required tables as individual sheets
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  const payload = {
    properties: {
      title: SPREADSHEET_NAME
    },
    sheets: SHEET_CONFIGS.map(config => ({
      properties: {
        title: config.sheetName
      }
    }))
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gagal membuat spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    return data.spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Export all local data to the Google Sheet
 */
export async function exportToGoogleSheets(
  accessToken: string, 
  spreadsheetId: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  try {
    for (const config of SHEET_CONFIGS) {
      if (onProgress) onProgress(`Mengunggah tabel ${config.sheetName}...`);
      
      const localData = config.getData();
      
      // Build rows (first row is headers)
      const rows: any[][] = [config.headers];
      
      localData.forEach(item => {
        const row = config.headers.map(header => {
          const val = (item as any)[header];
          if (val === undefined || val === null) return '';
          return String(val);
        });
        rows.push(row);
      });

      // Clear current content in the sheet by writing empty range first, 
      // then update values
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.sheetName}!A1:Z5000:clear`;
      await fetch(clearUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Update values
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.sheetName}!A1?valueInputOption=RAW`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `${config.sheetName}!A1`,
          majorDimension: 'ROWS',
          values: rows
        })
      });

      if (!updateRes.ok) {
        throw new Error(`Gagal memperbarui sheet ${config.sheetName}: ${updateRes.statusText}`);
      }
    }
    
    if (onProgress) onProgress('Ekspor sukses!');
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw error;
  }
}

let globalSyncToken: string | null = null;
let globalSpreadsheetId: string | null = null;
let globalAutoSync: boolean = false;

export function initGlobalSync(token: string | null, sheetId: string | null, autoSync: boolean) {
  globalSyncToken = token;
  globalSpreadsheetId = sheetId;
  globalAutoSync = autoSync;
}

export function getGlobalSyncState() {
  return { token: globalSyncToken, id: globalSpreadsheetId, autoSync: globalAutoSync };
}

/**
 * Import all data from the Google Sheet and overwrite local state
 */
export async function importFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  try {
    for (const config of SHEET_CONFIGS) {
      if (onProgress) onProgress(`Mengunduh tabel ${config.sheetName}...`);
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.sheetName}!A1:Z5000`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        // If the sheet isn't found, skip or create empty
        console.warn(`Sheet ${config.sheetName} tidak ditemukan. Melewati...`);
        continue;
      }

      const data = await res.json();
      const rows: string[][] = data.values || [];
      
      if (rows.length <= 1) {
        // Only headers or empty sheet
        config.saveData([]);
        continue;
      }

      // First row is headers
      const headers = rows[0].map(h => h.trim());
      const itemRows = rows.slice(1);

      // Map rows back to objects based on matching header indices
      const items = itemRows.map(row => {
        // Build a temporary row array that aligns with our config.headers
        const alignedRow = config.headers.map(targetHeader => {
          const idx = headers.indexOf(targetHeader);
          return idx !== -1 ? row[idx] : '';
        });
        return config.parseRow(alignedRow);
      });

      // Save to local storage mock
      config.saveData(items);
    }
    
    if (onProgress) onProgress('Impor sukses!');
  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    throw error;
  }
}
