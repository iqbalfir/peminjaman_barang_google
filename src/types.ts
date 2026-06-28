/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Kategori {
  id_kategori: number;
  nama_kategori: string;
  keterangan: string;
}

export interface Barang {
  id_barang: number;
  kode_barang: string;
  nama_barang: string;
  id_kategori: number;
  merk_tipe: string;
  lokasi_penyimpanan: string;
  stok: number;
  stok_minimum: number;
  kondisi_barang: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  foto_barang: string; // Base64 or URL placeholder
  status_ketersediaan: 'Tersedia' | 'Dipinjam' | 'Tidak Aktif';
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface Peminjam {
  id_peminjam: number;
  nip_nik: string;
  nama_lengkap: string;
  instansi_unit_kerja: string;
  jabatan: string;
  nomor_telepon: string;
  email: string;
  alamat: string;
}

export interface User {
  id_user: number;
  nama_user: string;
  username: string;
  password?: string; // stored as plain for demo/mock but hashed or hidden in PHP
  role: 'Admin' | 'Petugas' | 'Peminjam';
  last_login?: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Peminjaman {
  id_peminjaman: number;
  nomor_peminjaman: string;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  id_peminjam: number;
  keperluan: string;
  keterangan: string;
  dokumen_pendukung: string; // Name of file or base64
  status: 'Dipinjam' | 'Sebagian Kembali' | 'Selesai';
  created_by: number; // id_user
  created_at: string;
}

export interface DetailPeminjaman {
  id_detail: number;
  id_peminjaman: number;
  id_barang: number;
  jumlah_pinjam: number;
  jumlah_kembali: number;
  kondisi_pinjam: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  kondisi_kembali: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang' | '';
  keterangan: string;
}

export interface Pengembalian {
  id_pengembalian: number;
  id_peminjaman: number;
  tanggal_pengembalian: string;
  catatan: string;
  created_by: number; // id_user
}

export interface AuditLog {
  id_log: number;
  tanggal: string;
  id_user: number;
  aktivitas: string;
  ip_address: string;
}
