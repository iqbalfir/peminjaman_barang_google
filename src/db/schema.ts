/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { pgTable, serial, text, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const kategori = pgTable('tabel_kategori', {
  id_kategori: serial('id_kategori').primaryKey(),
  nama_kategori: text('nama_kategori').notNull(),
  keterangan: text('keterangan').notNull(),
});

export const barang = pgTable('tabel_barang', {
  id_barang: serial('id_barang').primaryKey(),
  kode_barang: text('kode_barang').notNull(),
  nup: text('nup'),
  nama_barang: text('nama_barang').notNull(),
  id_kategori: integer('id_kategori').notNull(),
  merk_tipe: text('merk_tipe').notNull(),
  lokasi_penyimpanan: text('lokasi_penyimpanan').notNull(),
  stok: integer('stok').notNull().default(0),
  stok_minimum: integer('stok_minimum').notNull().default(0),
  kondisi_barang: text('kondisi_barang').notNull().default('Baik'),
  foto_barang: text('foto_barang').notNull(),
  status_ketersediaan: text('status_ketersediaan').notNull().default('Tersedia'),
  qr_code: text('qr_code').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const peminjam = pgTable('tabel_peminjam', {
  id_peminjam: serial('id_peminjam').primaryKey(),
  nip_nik: text('nip_nik'),
  nama_lengkap: text('nama_lengkap').notNull(),
  instansi_unit_kerja: text('instansi_unit_kerja').notNull(),
  jabatan: text('jabatan').notNull(),
  nomor_telepon: text('nomor_telepon').notNull(),
  email: text('email').notNull(),
  alamat: text('alamat').notNull(),
});

export const users = pgTable('tabel_users', {
  id_user: serial('id_user').primaryKey(),
  nama_user: text('nama_user').notNull(),
  username: text('username').notNull().unique(),
  password: text('password'),
  role: text('role').notNull().default('Petugas'),
  last_login: text('last_login'),
  status: text('status').notNull().default('Aktif'),
  firebase_uid: text('firebase_uid'), // For pairing with Firebase Authentication
});

export const peminjaman = pgTable('tabel_peminjaman', {
  id_peminjaman: serial('id_peminjaman').primaryKey(),
  nomor_peminjaman: text('nomor_peminjaman').notNull(),
  tanggal_pinjam: text('tanggal_pinjam').notNull(),
  tanggal_rencana_kembali: text('tanggal_rencana_kembali').notNull(),
  id_peminjam: integer('id_peminjam').notNull(),
  keperluan: text('keperluan').notNull(),
  keterangan: text('keterangan').notNull(),
  dokumen_pendukung: text('dokumen_pendukung').notNull(),
  status: text('status').notNull().default('Dipinjam'),
  created_by: integer('created_by').notNull(),
  created_at: text('created_at').notNull(),
  tanda_tangan: text('tanda_tangan'),
});

export const detailPeminjaman = pgTable('tabel_detail_peminjaman', {
  id_detail: serial('id_detail').primaryKey(),
  id_peminjaman: integer('id_peminjaman').notNull(),
  id_barang: integer('id_barang').notNull(),
  jumlah_pinjam: integer('jumlah_pinjam').notNull(),
  jumlah_kembali: integer('jumlah_kembali').notNull().default(0),
  kondisi_pinjam: text('kondisi_pinjam').notNull().default('Baik'),
  kondisi_kembali: text('kondisi_kembali').notNull().default(''),
  keterangan: text('keterangan').notNull(),
});

export const pengembalian = pgTable('tabel_pengembalian', {
  id_pengembalian: serial('id_pengembalian').primaryKey(),
  id_peminjaman: integer('id_peminjaman').notNull(),
  tanggal_pengembalian: text('tanggal_pengembalian').notNull(),
  catatan: text('catatan').notNull(),
  created_by: integer('created_by').notNull(),
});

export const auditLog = pgTable('tabel_audit_log', {
  id_log: serial('id_log').primaryKey(),
  tanggal: text('tanggal').notNull(),
  id_user: integer('id_user'),
  aktivitas: text('aktivitas').notNull(),
  ip_address: text('ip_address').notNull(),
});

export const serahTerima = pgTable('tabel_serah_terima', {
  id_serah_terima: serial('id_serah_terima').primaryKey(),
  nomor_bast: text('nomor_bast').notNull(),
  tanggal_serah: text('tanggal_serah').notNull(),
  tanggal_kembali: text('tanggal_kembali'),
  id_peminjam: integer('id_peminjam').notNull(),
  keperluan: text('keperluan').notNull(),
  keterangan: text('keterangan').notNull(),
  status: text('status').notNull().default('Diserahkan'),
  created_by: integer('created_by').notNull(),
  created_at: text('created_at').notNull(),
});

export const detailSerahTerima = pgTable('tabel_detail_serah_terima', {
  id_detail_bast: serial('id_detail_bast').primaryKey(),
  id_serah_terima: integer('id_serah_terima').notNull(),
  id_barang: integer('id_barang').notNull(),
  jumlah_serah: integer('jumlah_serah').notNull(),
  jumlah_kembali: integer('jumlah_kembali').notNull().default(0),
  kondisi_serah: text('kondisi_serah').notNull().default('Baik'),
  kondisi_kembali: text('kondisi_kembali').notNull().default(''),
});

export const perbaikan = pgTable('tabel_perbaikan', {
  id_perbaikan: serial('id_perbaikan').primaryKey(),
  id_barang: integer('id_barang').notNull(),
  tanggal_perbaikan: text('tanggal_perbaikan').notNull(),
  deskripsi_perbaikan: text('deskripsi_perbaikan').notNull(),
  biaya: doublePrecision('biaya').notNull().default(0),
  teknisi_vendor: text('teknisi_vendor').notNull(),
  status_perbaikan: text('status_perbaikan').notNull().default('Selesai'),
  kondisi_setelah_perbaikan: text('kondisi_setelah_perbaikan').notNull().default('Baik'),
});
