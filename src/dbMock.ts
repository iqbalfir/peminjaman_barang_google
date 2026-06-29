/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kategori, Barang, Peminjam, User, Peminjaman, DetailPeminjaman, Pengembalian, AuditLog, SerahTerima, DetailSerahTerima, Perbaikan } from './types';

const STORAGE_KEYS = {
  KATEGORI: 'inv_kategori',
  BARANG: 'inv_barang',
  PEMINJAM: 'inv_peminjam',
  USERS: 'inv_users',
  PEMINJAMAN: 'inv_peminjaman',
  DETAIL_PEMINJAMAN: 'inv_detail_peminjaman',
  PENGEMBALIAN: 'inv_pengembalian',
  AUDIT_LOG: 'inv_audit_log',
  SERAH_TERIMA: 'inv_serah_terima',
  DETAIL_SERAH_TERIMA: 'inv_detail_serah_terima',
  PERBAIKAN: 'inv_perbaikan',
};

// Initial Data
const INITIAL_PERBAIKAN: Perbaikan[] = [
  {
    id_perbaikan: 1,
    id_barang: 1,
    tanggal_perbaikan: '2026-05-10',
    deskripsi_perbaikan: 'Pembersihan kipas internal & ganti thermal paste prosessor',
    biaya: 150000,
    teknisi_vendor: 'Asus Service Center Mangga Dua',
    status_perbaikan: 'Selesai',
    kondisi_setelah_perbaikan: 'Baik'
  },
  {
    id_perbaikan: 2,
    id_barang: 2,
    tanggal_perbaikan: '2026-04-15',
    deskripsi_perbaikan: 'Pelumasan hidrolik kursi & pengencangan sandaran punggung',
    biaya: 75000,
    teknisi_vendor: 'Teknisi Logistik internal',
    status_perbaikan: 'Selesai',
    kondisi_setelah_perbaikan: 'Baik'
  },
  {
    id_perbaikan: 3,
    id_barang: 3,
    tanggal_perbaikan: '2026-03-20',
    deskripsi_perbaikan: 'Penggantian lampu utama proyektor (OEM Epson Lamp)',
    biaya: 1200000,
    teknisi_vendor: 'Epson Authorized Service',
    status_perbaikan: 'Selesai',
    kondisi_setelah_perbaikan: 'Baik'
  },
  {
    id_perbaikan: 4,
    id_barang: 7,
    tanggal_perbaikan: '2026-06-02',
    deskripsi_perbaikan: 'Perbaikan roda papan tulis lipat yang patah & pembersihan noda spidol permanen',
    biaya: 100000,
    teknisi_vendor: 'Bengkel Mebel Sakura',
    status_perbaikan: 'Selesai',
    kondisi_setelah_perbaikan: 'Baik'
  }
];

const INITIAL_KATEGORI: Kategori[] = [
  { id_kategori: 1, nama_kategori: 'Elektronik & IT', keterangan: 'Laptop, Router, Switch, Tablet, dan aksesoris IT lainnya' },
  { id_kategori: 2, nama_kategori: 'Furniture & Mebel', keterangan: 'Meja kerja, kursi ergonomis, lemari berkas, dan sekat ruang' },
  { id_kategori: 3, nama_kategori: 'Alat Presentasi', keterangan: 'Proyektor, pointer, layar proyektor, dan sound system portable' },
  { id_kategori: 4, nama_kategori: 'Alat Tulis Kantor', keterangan: 'Paper shredder, laminating machine, stapler besar' },
  { id_kategori: 5, nama_kategori: 'Kendaraan Dinas', keterangan: 'Mobil operasional, sepeda motor dinas untuk kurir dan patroli' }
];

const INITIAL_BARANG: Barang[] = [
  {
    id_barang: 1,
    kode_barang: 'BRG-000001',
    nup: '0001',
    nama_barang: 'Laptop Asus ExpertBook B5',
    id_kategori: 1,
    merk_tipe: 'Asus B5402C',
    lokasi_penyimpanan: 'Lemari A, Lab IT',
    stok: 1,
    stok_minimum: 1,
    kondisi_barang: 'Baik',
    foto_barang: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200&q=80',
    status_ketersediaan: 'Tersedia',
    qr_code: 'BRG-000001',
    created_at: '2026-05-01 08:30:00',
    updated_at: '2026-06-20 14:20:00'
  },
  {
    id_barang: 2,
    kode_barang: 'BRG-000002',
    nup: '0002',
    nama_barang: 'Kursi Kerja Ergonomis Jaring',
    id_kategori: 2,
    merk_tipe: 'Ergohuman Gen-2',
    lokasi_penyimpanan: 'Ruang Logistik Lantai 2',
    stok: 1,
    stok_minimum: 1,
    kondisi_barang: 'Baik',
    foto_barang: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=200&q=80',
    status_ketersediaan: 'Tersedia',
    qr_code: 'BRG-000002',
    created_at: '2026-05-02 09:15:00',
    updated_at: '2026-05-02 09:15:00'
  },
  {
    id_barang: 3,
    kode_barang: 'BRG-000003',
    nup: '0003',
    nama_barang: 'Proyektor Epson EB-X500 XGA',
    id_kategori: 3,
    merk_tipe: 'Epson EB-X500',
    lokasi_penyimpanan: 'Lemari B, Ruang Rapat Utama',
    stok: 1,
    stok_minimum: 1,
    kondisi_barang: 'Baik',
    foto_barang: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=200&q=80',
    status_ketersediaan: 'Tersedia',
    qr_code: 'BRG-000003',
    created_at: '2026-05-05 11:00:00',
    updated_at: '2026-06-18 10:45:00'
  },
  {
    id_barang: 4,
    kode_barang: 'BRG-000004',
    nup: '0004',
    nama_barang: 'Kamera DSLR Canon EOS 200D II',
    id_kategori: 1,
    merk_tipe: 'Canon EOS 200D II Kit 18-55mm',
    lokasi_penyimpanan: 'Brankas Kecil, Ruang Humas',
    stok: 1,
    stok_minimum: 1,
    kondisi_barang: 'Baik',
    foto_barang: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80',
    status_ketersediaan: 'Tersedia',
    qr_code: 'BRG-000004',
    created_at: '2026-05-10 13:20:00',
    updated_at: '2026-05-10 13:20:00'
  },
  {
    id_barang: 5,
    kode_barang: 'BRG-000005',
    nup: '0005',
    nama_barang: 'Printer HP LaserJet Pro M404dn',
    id_kategori: 1,
    merk_tipe: 'HP Laser M404dn',
    lokasi_penyimpanan: 'Meja Administrasi Umum',
    stok: 1,
    stok_minimum: 1,
    kondisi_barang: 'Baik',
    foto_barang: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&q=80',
    status_ketersediaan: 'Tersedia',
    qr_code: 'BRG-000005',
    created_at: '2026-05-12 14:00:00',
    updated_at: '2026-05-12 14:00:00'
  },
  {
    id_barang: 6,
    kode_barang: 'BRG-000006',
    nup: '0006',
    nama_barang: 'Mobil Toyota Avanza Veloz (Dinas)',
    id_kategori: 5,
    merk_tipe: 'Toyota Avanza 1.5 Q CVT',
    lokasi_penyimpanan: 'Gedung Parkir B-1',
    stok: 1,
    stok_minimum: 1,
    kondisi_barang: 'Baik',
    foto_barang: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&q=80',
    status_ketersediaan: 'Tersedia',
    qr_code: 'BRG-000006',
    created_at: '2026-05-15 08:00:00',
    updated_at: '2026-06-25 09:30:00'
  },
  {
    id_barang: 7,
    kode_barang: 'BRG-000007',
    nup: '0007',
    nama_barang: 'Papan Tulis Mobile Magnetic',
    id_kategori: 3,
    merk_tipe: 'Sakura 120x240 Dual-Side',
    lokasi_penyimpanan: 'Ruang Rapat Kecil Lantai 3',
    stok: 0,
    stok_minimum: 1,
    kondisi_barang: 'Rusak Ringan',
    foto_barang: 'https://images.unsplash.com/photo-1571844307560-f40a4af14cd9?w=200&q=80',
    status_ketersediaan: 'Dipinjam',
    qr_code: 'BRG-000007',
    created_at: '2026-05-20 10:10:00',
    updated_at: '2026-06-22 11:15:00'
  }
];

const INITIAL_PEMINJAM: Peminjam[] = [
  {
    id_peminjam: 1,
    nip_nik: '198503122010121003',
    nama_lengkap: 'Budi Hartono, S.Kom',
    instansi_unit_kerja: 'Direktorat Sistem Informasi',
    jabatan: 'Senior System Administrator',
    nomor_telepon: '081234567890',
    email: 'budi.hartono@kantor.go.id',
    alamat: 'Jl. Melati No. 45, Kebayoran Baru, Jakarta Selatan'
  },
  {
    id_peminjam: 2,
    nip_nik: '199008242015032001',
    nama_lengkap: 'Siti Rahmawati, M.M',
    instansi_unit_kerja: 'Divisi Sumber Daya Manusia (HRD)',
    jabatan: 'Kepala Bidang Pelatihan & Rekrutmen',
    nomor_telepon: '085712345678',
    email: 'siti.rahma@kantor.go.id',
    alamat: 'Perumahan Griya Asri Blok C/12, Depok'
  },
  {
    id_peminjam: 3,
    nip_nik: '3173051408930004',
    nama_lengkap: 'Ahmad Fauzi',
    instansi_unit_kerja: 'Bagian Hubungan Masyarakat & Protokol',
    jabatan: 'Pranata Humas Ahli Pertama',
    nomor_telepon: '081987654321',
    email: 'ahmad.fauzi@kantor.go.id',
    alamat: 'Apartemen Kalibata City Tower C Lantai 8, Jakarta Selatan'
  },
  {
    id_peminjam: 4,
    nip_nik: '198205112008011002',
    nama_lengkap: 'Hendra Setiawan, S.E',
    instansi_unit_kerja: 'Biro Keuangan & Akuntansi',
    jabatan: 'Analis Keuangan Madya',
    nomor_telepon: '081122334455',
    email: 'hendra.s@kantor.go.id',
    alamat: 'Jl. Dahlia Indah No. 18, Bekasi Barat'
  }
];

const INITIAL_USERS: User[] = [
  { id_user: 1, nama_user: 'Administrator Utama', username: 'admin', password: 'adminpassword', role: 'Admin', last_login: '2026-06-28 10:15:00', status: 'Aktif' },
  { id_user: 2, nama_user: 'Rahmat Hidayat (Petugas)', username: 'petugas', password: 'petugaspassword', role: 'Petugas', last_login: '2026-06-28 08:30:22', status: 'Aktif' },
  { id_user: 3, nama_user: 'Budi Hartono (Peminjam)', username: 'budi', password: 'peminjampassword', role: 'Peminjam', last_login: '2026-06-27 15:45:00', status: 'Aktif' }
];

const INITIAL_PEMINJAMAN: Peminjaman[] = [
  {
    id_peminjaman: 1,
    nomor_peminjaman: 'PJM-20260610-0001',
    tanggal_pinjam: '2026-06-10',
    tanggal_rencana_kembali: '2026-06-15',
    id_peminjam: 1, // Budi Hartono
    keperluan: 'Maintenance Server Cabang Bandung & Audit Jaringan',
    keterangan: 'Membawa Laptop Asus & Switch Router',
    dokumen_pendukung: 'Surat_Tugas_Bandung.pdf',
    status: 'Selesai',
    created_by: 2, // Petugas Rahmat
    created_at: '2026-06-10 09:00:00'
  },
  {
    id_peminjaman: 2,
    nomor_peminjaman: 'PJM-20260618-0002',
    tanggal_pinjam: '2026-06-18',
    tanggal_rencana_kembali: '2026-06-22',
    id_peminjam: 2, // Siti Rahmawati
    keperluan: 'In-House Training Pegawai Baru Tahap II',
    keterangan: 'Menggunakan Proyektor & Papan Tulis',
    dokumen_pendukung: 'Nota_Dinas_Diklat.pdf',
    status: 'Sebagian Kembali',
    created_by: 2,
    created_at: '2026-06-18 10:15:00'
  },
  {
    id_peminjaman: 3,
    nomor_peminjaman: 'PJM-20260625-0003',
    tanggal_pinjam: '2026-06-25',
    tanggal_rencana_kembali: '2026-06-27', // Keterlambatan Terdeteksi! (Today is 2026-06-28)
    id_peminjam: 3, // Ahmad Fauzi
    keperluan: 'Dokumentasi & Kunjungan Lapangan Menteri',
    keterangan: 'Kamera DSLR Canon & Mobil Avanza Dinas',
    dokumen_pendukung: 'Agenda_Kunjungan_RI.pdf',
    status: 'Dipinjam',
    created_by: 2,
    created_at: '2026-06-25 08:30:00'
  }
];

const INITIAL_DETAIL_PEMINJAMAN: DetailPeminjaman[] = [
  // PJM-20260610-0001 details (Selesai)
  {
    id_detail: 1,
    id_peminjaman: 1,
    id_barang: 1, // Laptop Asus
    jumlah_pinjam: 1,
    jumlah_kembali: 1,
    kondisi_pinjam: 'Baik',
    kondisi_kembali: 'Baik',
    keterangan: 'Selesai digunakan'
  },
  // PJM-20260618-0002 details (Sebagian Kembali)
  {
    id_detail: 2,
    id_peminjaman: 2,
    id_barang: 3, // Proyektor
    jumlah_pinjam: 1,
    jumlah_kembali: 1, // Sudah kembali
    kondisi_pinjam: 'Baik',
    kondisi_kembali: 'Baik',
    keterangan: 'Proyektor dikembalikan tepat waktu'
  },
  {
    id_detail: 3,
    id_peminjaman: 2,
    id_barang: 7, // Papan Tulis Mobile
    jumlah_pinjam: 1,
    jumlah_kembali: 0, // Belum dikembalikan
    kondisi_pinjam: 'Baik',
    kondisi_kembali: '',
    keterangan: 'Masih digunakan di ruang diklat lantai 3'
  },
  // PJM-20260625-0003 details (Dipinjam / Terlambat)
  {
    id_detail: 4,
    id_peminjaman: 3,
    id_barang: 4, // Kamera Canon
    jumlah_pinjam: 1,
    jumlah_kembali: 0,
    kondisi_pinjam: 'Baik',
    kondisi_kembali: '',
    keterangan: 'Untuk dokumentasi'
  },
  {
    id_detail: 5,
    id_peminjaman: 3,
    id_barang: 6, // Mobil Avanza Dinas
    jumlah_pinjam: 1,
    jumlah_kembali: 0,
    kondisi_pinjam: 'Baik',
    kondisi_kembali: '',
    keterangan: 'Perjalanan dinas ke Bogor'
  }
];

const INITIAL_PENGEMBALIAN: Pengembalian[] = [
  {
    id_pengembalian: 1,
    id_peminjaman: 1,
    tanggal_pengembalian: '2026-06-15',
    catatan: 'Seluruh barang kembali dalam kondisi sangat baik.',
    created_by: 2
  },
  {
    id_pengembalian: 2,
    id_peminjaman: 2,
    tanggal_pengembalian: '2026-06-22',
    catatan: 'Baru mengembalikan Proyektor. Papan tulis mobile masih dipinjam.',
    created_by: 2
  }
];

const INITIAL_AUDIT_LOG: AuditLog[] = [
  { id_log: 1, tanggal: '2026-06-25 08:30:00', id_user: 2, aktivitas: 'Tambah Peminjaman PJM-20260625-0003 (Ahmad Fauzi)', ip_address: '192.168.1.15' },
  { id_log: 2, tanggal: '2026-06-25 09:30:00', id_user: 1, aktivitas: 'Edit Barang: Mobil Toyota Avanza Veloz (Dinas) - Update Lokasi Penyimpanan', ip_address: '192.168.1.10' },
  { id_log: 3, tanggal: '2026-06-26 17:00:00', id_user: 2, aktivitas: 'Logout Petugas Rahmat', ip_address: '192.168.1.15' },
  { id_log: 4, tanggal: '2026-06-28 08:30:22', id_user: 2, aktivitas: 'Login Petugas Rahmat Hidayat', ip_address: '192.168.1.15' },
  { id_log: 5, tanggal: '2026-06-28 10:15:00', id_user: 1, aktivitas: 'Login Administrator Utama', ip_address: '192.168.1.10' }
];

// Load and save functions
export function getDbData<T>(key: string, initial: T[]): T[] {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

let onDataWriteCallback: (() => void) | null = null;

export function registerOnDataWrite(callback: () => void) {
  onDataWriteCallback = callback;
}

export function saveDbData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
  if (onDataWriteCallback) {
    onDataWriteCallback();
  }
}

// Global DB class for clean mock operations
export class OfficeInventoryDb {
  static getKategori(): Kategori[] { return getDbData(STORAGE_KEYS.KATEGORI, INITIAL_KATEGORI); }
  static saveKategori(data: Kategori[]) { saveDbData(STORAGE_KEYS.KATEGORI, data); }

  static getBarang(): Barang[] {
    const list = getDbData(STORAGE_KEYS.BARANG, INITIAL_BARANG);
    let adjusted = false;
    const newList = list.map(b => {
      // All items should have a maximum stock of 1 (or 0 if currently borrowed)
      const targetStok = b.status_ketersediaan === 'Dipinjam' ? 0 : 1;
      if (b.stok !== targetStok) {
        b.stok = targetStok;
        adjusted = true;
      }
      if (b.stok_minimum !== 1) {
        b.stok_minimum = 1;
        adjusted = true;
      }
      return b;
    });
    if (adjusted) {
      this.saveBarang(newList);
    }
    return newList;
  }
  static saveBarang(data: Barang[]) { saveDbData(STORAGE_KEYS.BARANG, data); }

  static getPeminjam(): Peminjam[] { return getDbData(STORAGE_KEYS.PEMINJAM, INITIAL_PEMINJAM); }
  static savePeminjam(data: Peminjam[]) { saveDbData(STORAGE_KEYS.PEMINJAM, data); }

  static getUsers(): User[] { return getDbData(STORAGE_KEYS.USERS, INITIAL_USERS); }
  static saveUsers(data: User[]) { saveDbData(STORAGE_KEYS.USERS, data); }

  static getPeminjaman(): Peminjaman[] { return getDbData(STORAGE_KEYS.PEMINJAMAN, INITIAL_PEMINJAMAN); }
  static savePeminjaman(data: Peminjaman[]) { saveDbData(STORAGE_KEYS.PEMINJAMAN, data); }

  static getDetailPeminjaman(): DetailPeminjaman[] { return getDbData(STORAGE_KEYS.DETAIL_PEMINJAMAN, INITIAL_DETAIL_PEMINJAMAN); }
  static saveDetailPeminjaman(data: DetailPeminjaman[]) { saveDbData(STORAGE_KEYS.DETAIL_PEMINJAMAN, data); }

  static getPengembalian(): Pengembalian[] { return getDbData(STORAGE_KEYS.PENGEMBALIAN, INITIAL_PENGEMBALIAN); }
  static savePengembalianList(data: Pengembalian[]) { saveDbData(STORAGE_KEYS.PENGEMBALIAN, data); }

  static getAuditLog(): AuditLog[] { return getDbData(STORAGE_KEYS.AUDIT_LOG, INITIAL_AUDIT_LOG); }
  static saveAuditLog(data: AuditLog[]) { saveDbData(STORAGE_KEYS.AUDIT_LOG, data); }

  static getAuditLogs(): AuditLog[] { return this.getAuditLog(); }
  static saveAuditLogs(data: AuditLog[]) { this.saveAuditLog(data); }

  static getSerahTerima(): SerahTerima[] { return getDbData(STORAGE_KEYS.SERAH_TERIMA, []); }
  static saveSerahTerima(data: SerahTerima[]) { saveDbData(STORAGE_KEYS.SERAH_TERIMA, data); }

  static getDetailSerahTerima(): DetailSerahTerima[] { return getDbData(STORAGE_KEYS.DETAIL_SERAH_TERIMA, []); }
  static saveDetailSerahTerima(data: DetailSerahTerima[]) { saveDbData(STORAGE_KEYS.DETAIL_SERAH_TERIMA, data); }

  static getPerbaikan(): Perbaikan[] { return getDbData(STORAGE_KEYS.PERBAIKAN, INITIAL_PERBAIKAN); }
  static savePerbaikan(data: Perbaikan[]) { saveDbData(STORAGE_KEYS.PERBAIKAN, data); }

  static generateBastCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`; // YYYYMMDD
    
    const bast = this.getSerahTerima();
    const prefix = `BAST-${dateStr}-`;
    const todayTrans = bast.filter(p => p.nomor_bast.startsWith(prefix));
    
    if (todayTrans.length === 0) return `${prefix}0001`;
    
    const numbers = todayTrans.map(p => {
      const parts = p.nomor_bast.split('-');
      return parts.length === 3 ? parseInt(parts[2]) : 0;
    });
    
    const nextNum = Math.max(...numbers) + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  static getRiwayatBarang(id_barang: number): any[] {
    const details = this.getDetailPeminjaman().filter(d => d.id_barang === id_barang);
    const peminjamanList = this.getPeminjaman();
    const peminjamList = this.getPeminjam();

    return details.map(d => {
      const p = peminjamanList.find(x => x.id_peminjaman === d.id_peminjaman);
      const borrower = p ? peminjamList.find(x => x.id_peminjam === p.id_peminjam) : null;
      return {
        nomor_peminjaman: p?.nomor_peminjaman || 'PJM-??????',
        tanggal_pinjam: p?.tanggal_pinjam || '-',
        nama_lengkap: borrower?.nama_lengkap || 'Unknown Staff',
        jumlah_pinjam: d.jumlah_pinjam,
        status: p?.status || 'Dipinjam'
      };
    });
  }

  // Logging utility
  static logActivity(idUser: number, aktivitas: string) {
    const logs = this.getAuditLog();
    const newLog: AuditLog = {
      id_log: logs.length > 0 ? Math.max(...logs.map(l => l.id_log)) + 1 : 1,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 19),
      id_user: idUser,
      aktivitas,
      ip_address: '192.168.1.' + Math.floor(Math.random() * 254 + 1)
    };
    logs.unshift(newLog); // Prepend to show latest first
    this.saveAuditLog(logs);
  }

  // Generate Auto-increment codes
  static generateBarangCode(): string {
    const barang = this.getBarang();
    if (barang.length === 0) return 'BRG-000001';
    const numbers = barang.map(b => {
      const match = b.kode_barang.match(/BRG-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNum = Math.max(...numbers) + 1;
    return 'BRG-' + String(nextNum).padStart(6, '0');
  }

  static generatePeminjamanCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`; // YYYYMMDD
    
    const peminjaman = this.getPeminjaman();
    const prefix = `PJM-${dateStr}-`;
    const todayTrans = peminjaman.filter(p => p.nomor_peminjaman.startsWith(prefix));
    
    if (todayTrans.length === 0) return `${prefix}0001`;
    
    const numbers = todayTrans.map(p => {
      const parts = p.nomor_peminjaman.split('-');
      return parts.length === 3 ? parseInt(parts[2]) : 0;
    });
    
    const nextNum = Math.max(...numbers) + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  // Create borrowing transaction
  static createPeminjaman(
    idPeminjam: number,
    tanggalPinjam: string,
    tanggalKembali: string,
    keperluan: string,
    keterangan: string,
    dokumenPendukung: string,
    items: { id_barang: number; jumlah_pinjam: number; kondisi_pinjam: 'Baik' | 'Rusak Ringan' | 'Rusak Berat'; keterangan: string }[],
    idUser: number,
    tandaTangan?: string
  ): { success: boolean; message: string; nomor?: string } {
    
    const barangList = this.getBarang();
    const updatedBarang = [...barangList];

    // Validation
    for (const item of items) {
      const brg = updatedBarang.find(b => b.id_barang === item.id_barang);
      if (!brg) {
        return { success: false, message: `Barang dengan ID ${item.id_barang} tidak ditemukan.` };
      }
      if (brg.stok < item.jumlah_pinjam) {
        return { success: false, message: `Stok barang "${brg.nama_barang}" tidak mencukupi (Tersedia: ${brg.stok}, Diminta: ${item.jumlah_pinjam}). Transaksi ditolak.` };
      }
    }

    // Deduct stock
    for (const item of items) {
      const brg = updatedBarang.find(b => b.id_barang === item.id_barang)!;
      brg.stok -= item.jumlah_pinjam;
      if (brg.stok === 0) {
        brg.status_ketersediaan = 'Dipinjam';
      }
      brg.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    // Save goods
    this.saveBarang(updatedBarang);

    // Create loan record
    const peminjamanList = this.getPeminjaman();
    const id_peminjaman = peminjamanList.length > 0 ? Math.max(...peminjamanList.map(p => p.id_peminjaman)) + 1 : 1;
    const nomor_peminjaman = this.generatePeminjamanCode();

    const newPeminjaman: Peminjaman = {
      id_peminjaman,
      nomor_peminjaman,
      tanggal_pinjam: tanggalPinjam,
      tanggal_rencana_kembali: tanggalKembali,
      id_peminjam: idPeminjam,
      keperluan,
      keterangan,
      dokumen_pendukung: dokumenPendukung || 'Tidak_ada_dokumen.pdf',
      status: 'Dipinjam',
      created_by: idUser,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tanda_tangan: tandaTangan
    };

    peminjamanList.unshift(newPeminjaman);
    this.savePeminjaman(peminjamanList);

    // Save details
    const detailList = this.getDetailPeminjaman();
    let detailId = detailList.length > 0 ? Math.max(...detailList.map(d => d.id_detail)) + 1 : 1;

    for (const item of items) {
      const newDetail: DetailPeminjaman = {
        id_detail: detailId++,
        id_peminjaman,
        id_barang: item.id_barang,
        jumlah_pinjam: item.jumlah_pinjam,
        jumlah_kembali: 0,
        kondisi_pinjam: item.kondisi_pinjam,
        kondisi_kembali: '',
        keterangan: item.keterangan
      };
      detailList.push(newDetail);
    }
    this.saveDetailPeminjaman(detailList);

    // Audit Log
    const peminjamObj = this.getPeminjam().find(p => p.id_peminjam === idPeminjam);
    this.logActivity(idUser, `Tambah Peminjaman ${nomor_peminjaman} (${peminjamObj?.nama_lengkap || 'Unknown'})`);

    return { success: true, message: `Transaksi Peminjaman ${nomor_peminjaman} berhasil disimpan.`, nomor: nomor_peminjaman };
  }

  // Create return transaction
  static savePengembalian(
    idPeminjaman: number,
    tanggalPengembalian: string,
    catatan: string,
    itemReturns: { id_detail: number; jumlah_kembali: number; kondisi_kembali: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang' }[],
    idUser: number
  ): { success: boolean; message: string } {
    
    const peminjamanList = this.getPeminjaman();
    const pjmIndex = peminjamanList.findIndex(p => p.id_peminjaman === idPeminjaman);
    if (pjmIndex === -1) {
      return { success: false, message: 'Transaksi peminjaman tidak ditemukan.' };
    }

    const detailList = this.getDetailPeminjaman();
    const barangList = this.getBarang();
    
    // Process items returning
    for (const ret of itemReturns) {
      const detIndex = detailList.findIndex(d => d.id_detail === ret.id_detail);
      if (detIndex === -1) continue;
      
      const det = detailList[detIndex];
      const maxToReturn = det.jumlah_pinjam - det.jumlah_kembali;
      
      if (ret.jumlah_kembali > maxToReturn) {
        return { success: false, message: `Jumlah kembali (${ret.jumlah_kembali}) melebihi sisa barang yang dipinjam (${maxToReturn}).` };
      }

      // Update detail
      det.jumlah_kembali += ret.jumlah_kembali;
      det.kondisi_kembali = ret.kondisi_kembali;

      // Update barang stock unless it is "Hilang" (lost)
      const brg = barangList.find(b => b.id_barang === det.id_barang);
      if (brg) {
        if (ret.kondisi_kembali !== 'Hilang') {
          brg.stok += ret.jumlah_kembali;
        }
        // If condition changes, we can update current condition
        if (ret.kondisi_kembali === 'Rusak Berat' || ret.kondisi_kembali === 'Rusak Ringan') {
          brg.kondisi_barang = ret.kondisi_kembali;
        }
        
        // Revise available status if stock > 0
        if (brg.stok > 0 && brg.status_ketersediaan === 'Dipinjam') {
          brg.status_ketersediaan = 'Tersedia';
        }
        brg.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
    }

    // Determine aggregate status of borrowing
    const relevantDetails = detailList.filter(d => d.id_peminjaman === idPeminjaman);
    const totalBorrowed = relevantDetails.reduce((sum, d) => sum + d.jumlah_pinjam, 0);
    const totalReturned = relevantDetails.reduce((sum, d) => sum + d.jumlah_kembali, 0);

    let finalStatus: 'Dipinjam' | 'Sebagian Kembali' | 'Selesai' = 'Dipinjam';
    if (totalReturned === totalBorrowed) {
      finalStatus = 'Selesai';
    } else if (totalReturned > 0) {
      finalStatus = 'Sebagian Kembali';
    }

    peminjamanList[pjmIndex].status = finalStatus;

    // Save lists
    this.savePeminjaman(peminjamanList);
    this.saveDetailPeminjaman(detailList);
    this.saveBarang(barangList);

    // Record Return table
    const pengembalianList = this.getPengembalian();
    const id_pengembalian = pengembalianList.length > 0 ? Math.max(...pengembalianList.map(r => r.id_pengembalian)) + 1 : 1;
    
    const newPengembalian: Pengembalian = {
      id_pengembalian,
      id_peminjaman: idPeminjaman,
      tanggal_pengembalian: tanggalPengembalian,
      catatan,
      created_by: idUser
    };
    pengembalianList.unshift(newPengembalian);
    this.savePengembalianList(pengembalianList);

    // Audit Log
    const pjm = peminjamanList[pjmIndex];
    this.logActivity(idUser, `Pengembalian Barang untuk Peminjaman ${pjm.nomor_peminjaman} (${finalStatus === 'Selesai' ? 'Penuh' : 'Sebagian'})`);

    return { success: true, message: `Pengembalian barang berhasil dicatat. Status transaksi kini: "${finalStatus}".` };
  }

  // Database Backup generator (.sql)
  static generateBackupSql(): string {
    const kategori = this.getKategori();
    const barang = this.getBarang();
    const peminjam = this.getPeminjam();
    const users = this.getUsers();
    const peminjaman = this.getPeminjaman();
    const detail = this.getDetailPeminjaman();
    const pengembalian = this.getPengembalian();
    const auditLog = this.getAuditLog();

    let sql = `-- ========================================================\n`;
    sql += `-- BACKUP DATABASE INVENTARIS PEMINJAMAN KANTOR\n`;
    sql += `-- Generated on: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n`;
    sql += `-- Format: MySQL 8+ / MariaDB\n`;
    sql += `-- ========================================================\n\n`;

    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 1. tabel_kategori
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_kategori\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_kategori;\n`;
    sql += `CREATE TABLE tabel_kategori (\n`;
    sql += `  id_kategori int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  nama_kategori varchar(100) NOT NULL,\n`;
    sql += `  keterangan text DEFAULT NULL,\n`;
    sql += `  PRIMARY KEY (id_kategori)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_kategori\n`;
    kategori.forEach(k => {
      sql += `INSERT INTO tabel_kategori (id_kategori, nama_kategori, keterangan) VALUES (${k.id_kategori}, '${k.nama_kategori.replace(/'/g, "''")}', '${k.keterangan.replace(/'/g, "''")}');\n`;
    });
    sql += `\n`;

    // 2. tabel_barang
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_barang\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_barang;\n`;
    sql += `CREATE TABLE tabel_barang (\n`;
    sql += `  id_barang int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  kode_barang varchar(20) NOT NULL,\n`;
    sql += `  nup varchar(50) DEFAULT NULL,\n`;
    sql += `  id_kategori int(11) NOT NULL,\n`;
    sql += `  nama_barang varchar(255) NOT NULL,\n`;
    sql += `  merk_tipe varchar(150) DEFAULT NULL,\n`;
    sql += `  lokasi_penyimpanan varchar(150) DEFAULT NULL,\n`;
    sql += `  stok int(11) NOT NULL DEFAULT 0,\n`;
    sql += `  stok_minimum int(11) NOT NULL DEFAULT 1,\n`;
    sql += `  kondisi_barang enum('Baik','Rusak Ringan','Rusak Berat') NOT NULL DEFAULT 'Baik',\n`;
    sql += `  foto_barang text DEFAULT NULL,\n`;
    sql += `  status_ketersediaan enum('Tersedia','Dipinjam','Tidak Aktif') NOT NULL DEFAULT 'Tersedia',\n`;
    sql += `  qr_code varchar(255) DEFAULT NULL,\n`;
    sql += `  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (id_barang),\n`;
    sql += `  FOREIGN KEY (id_kategori) REFERENCES tabel_kategori(id_kategori) ON DELETE CASCADE\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_barang\n`;
    barang.forEach(b => {
      sql += `INSERT INTO tabel_barang (id_barang, kode_barang, nup, id_kategori, nama_barang, merk_tipe, lokasi_penyimpanan, stok, stok_minimum, kondisi_barang, foto_barang, status_ketersediaan, qr_code, created_at, updated_at) VALUES (${b.id_barang}, '${b.kode_barang}', ${b.nup ? `'${b.nup}'` : 'NULL'}, ${b.id_kategori}, '${b.nama_barang.replace(/'/g, "''")}', '${b.merk_tipe.replace(/'/g, "''")}', '${b.lokasi_penyimpanan?.replace(/'/g, "''") || ''}', ${b.stok}, ${b.stok_minimum}, '${b.kondisi_barang}', '${b.foto_barang}', '${b.status_ketersediaan}', '${b.qr_code}', '${b.created_at}', '${b.updated_at}');\n`;
    });
    sql += `\n`;

    // 3. tabel_peminjam
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_peminjam\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_peminjam;\n`;
    sql += `CREATE TABLE tabel_peminjam (\n`;
    sql += `  id_peminjam int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  nip_nik varchar(50) NOT NULL UNIQUE,\n`;
    sql += `  nama_lengkap varchar(200) NOT NULL,\n`;
    sql += `  instansi_unit_kerja varchar(200) DEFAULT NULL,\n`;
    sql += `  jabatan varchar(150) DEFAULT NULL,\n`;
    sql += `  nomor_telepon varchar(20) DEFAULT NULL,\n`;
    sql += `  email varchar(150) DEFAULT NULL,\n`;
    sql += `  alamat text DEFAULT NULL,\n`;
    sql += `  PRIMARY KEY (id_peminjam)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_peminjam\n`;
    peminjam.forEach(p => {
      sql += `INSERT INTO tabel_peminjam (id_peminjam, nip_nik, nama_lengkap, instansi_unit_kerja, jabatan, nomor_telepon, email, alamat) VALUES (${p.id_peminjam}, '${p.nip_nik}', '${p.nama_lengkap.replace(/'/g, "''")}', '${p.instansi_unit_kerja.replace(/'/g, "''")}', '${p.jabatan.replace(/'/g, "''")}', '${p.nomor_telepon}', '${p.email}', '${p.alamat.replace(/'/g, "''")}');\n`;
    });
    sql += `\n`;

    // 4. tabel_users
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_users\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_users;\n`;
    sql += `CREATE TABLE tabel_users (\n`;
    sql += `  id_user int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  nama_user varchar(150) NOT NULL,\n`;
    sql += `  username varchar(100) NOT NULL UNIQUE,\n`;
    sql += `  password varchar(255) NOT NULL,\n`;
    sql += `  role enum('Admin','Petugas','Peminjam') NOT NULL,\n`;
    sql += `  last_login timestamp NULL DEFAULT NULL,\n`;
    sql += `  status enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',\n`;
    sql += `  PRIMARY KEY (id_user)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_users\n`;
    users.forEach(u => {
      const hash = '$2y$10$Y1rXscZInP6FasNqCOz0lOf/7.C7ZszrSgVj3b0iSgUby.ZOn790a'; // Default hash for demo "adminpassword", "petugaspassword", etc in bcrypt
      sql += `INSERT INTO tabel_users (id_user, nama_user, username, password, role, last_login, status) VALUES (${u.id_user}, '${u.nama_user.replace(/'/g, "''")}', '${u.username}', '${hash}', '${u.role}', ${u.last_login ? `'${u.last_login}'` : 'NULL'}, '${u.status}');\n`;
    });
    sql += `\n`;

    // 5. tabel_peminjaman
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_peminjaman\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_peminjaman;\n`;
    sql += `CREATE TABLE tabel_peminjaman (\n`;
    sql += `  id_peminjaman int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  nomor_peminjaman varchar(50) NOT NULL UNIQUE,\n`;
    sql += `  tanggal_pinjam date NOT NULL,\n`;
    sql += `  tanggal_rencana_kembali date NOT NULL,\n`;
    sql += `  id_peminjam int(11) NOT NULL,\n`;
    sql += `  keperluan text DEFAULT NULL,\n`;
    sql += `  keterangan text DEFAULT NULL,\n`;
    sql += `  dokumen_pendukung varchar(255) DEFAULT NULL,\n`;
    sql += `  status enum('Dipinjam','Sebagian Kembali','Selesai') NOT NULL DEFAULT 'Dipinjam',\n`;
    sql += `  created_by int(11) NOT NULL,\n`;
    sql += `  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  PRIMARY KEY (id_peminjaman),\n`;
    sql += `  FOREIGN KEY (id_peminjam) REFERENCES tabel_peminjam(id_peminjam) ON DELETE CASCADE,\n`;
    sql += `  FOREIGN KEY (created_by) REFERENCES tabel_users(id_user)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_peminjaman\n`;
    peminjaman.forEach(p => {
      sql += `INSERT INTO tabel_peminjaman (id_peminjaman, nomor_peminjaman, tanggal_pinjam, tanggal_rencana_kembali, id_peminjam, keperluan, keterangan, dokumen_pendukung, status, created_by, created_at) VALUES (${p.id_peminjaman}, '${p.nomor_peminjaman}', '${p.tanggal_pinjam}', '${p.tanggal_rencana_kembali}', ${p.id_peminjam}, '${p.keperluan.replace(/'/g, "''")}', '${p.keterangan.replace(/'/g, "''")}', '${p.dokumen_pendukung}', '${p.status}', ${p.created_by}, '${p.created_at}');\n`;
    });
    sql += `\n`;

    // 6. tabel_detail_peminjaman
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_detail_peminjaman\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_detail_peminjaman;\n`;
    sql += `CREATE TABLE tabel_detail_peminjaman (\n`;
    sql += `  id_detail int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  id_peminjaman int(11) NOT NULL,\n`;
    sql += `  id_barang int(11) NOT NULL,\n`;
    sql += `  jumlah_pinjam int(11) NOT NULL DEFAULT 1,\n`;
    sql += `  jumlah_kembali int(11) NOT NULL DEFAULT 0,\n`;
    sql += `  kondisi_pinjam enum('Baik','Rusak Ringan','Rusak Berat') NOT NULL DEFAULT 'Baik',\n`;
    sql += `  kondisi_kembali enum('Baik','Rusak Ringan','Rusak Berat','Hilang','') NOT NULL DEFAULT '',\n`;
    sql += `  keterangan text DEFAULT NULL,\n`;
    sql += `  PRIMARY KEY (id_detail),\n`;
    sql += `  FOREIGN KEY (id_peminjaman) REFERENCES tabel_peminjaman(id_peminjaman) ON DELETE CASCADE,\n`;
    sql += `  FOREIGN KEY (id_barang) REFERENCES tabel_barang(id_barang) ON DELETE CASCADE\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_detail_peminjaman\n`;
    detail.forEach(d => {
      sql += `INSERT INTO tabel_detail_peminjaman (id_detail, id_peminjaman, id_barang, jumlah_pinjam, jumlah_kembali, kondisi_pinjam, kondisi_kembali, keterangan) VALUES (${d.id_detail}, ${d.id_peminjaman}, ${d.id_barang}, ${d.jumlah_pinjam}, ${d.jumlah_kembali}, '${d.kondisi_pinjam}', '${d.kondisi_kembali}', '${d.keterangan.replace(/'/g, "''")}');\n`;
    });
    sql += `\n`;

    // 7. tabel_pengembalian
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_pengembalian\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_pengembalian;\n`;
    sql += `CREATE TABLE tabel_pengembalian (\n`;
    sql += `  id_pengembalian int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  id_peminjaman int(11) NOT NULL,\n`;
    sql += `  tanggal_pengembalian date NOT NULL,\n`;
    sql += `  catatan text DEFAULT NULL,\n`;
    sql += `  created_by int(11) NOT NULL,\n`;
    sql += `  PRIMARY KEY (id_pengembalian),\n`;
    sql += `  FOREIGN KEY (id_peminjaman) REFERENCES tabel_peminjaman(id_peminjaman) ON DELETE CASCADE,\n`;
    sql += `  FOREIGN KEY (created_by) REFERENCES tabel_users(id_user)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_pengembalian\n`;
    pengembalian.forEach(p => {
      sql += `INSERT INTO tabel_pengembalian (id_pengembalian, id_peminjaman, tanggal_pengembalian, catatan, created_by) VALUES (${p.id_pengembalian}, ${p.id_peminjaman}, '${p.tanggal_pengembalian}', '${p.catatan.replace(/'/g, "''")}', ${p.created_by});\n`;
    });
    sql += `\n`;

    // 8. tabel_audit_log
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table tabel_audit_log\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS tabel_audit_log;\n`;
    sql += `CREATE TABLE tabel_audit_log (\n`;
    sql += `  id_log int(11) NOT NULL AUTO_INCREMENT,\n`;
    sql += `  tanggal timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  id_user int(11) DEFAULT NULL,\n`;
    sql += `  aktivitas varchar(255) NOT NULL,\n`;
    sql += `  ip_address varchar(50) DEFAULT NULL,\n`;
    sql += `  PRIMARY KEY (id_log),\n`;
    sql += `  FOREIGN KEY (id_user) REFERENCES tabel_users(id_user) ON DELETE SET NULL\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Dumping data for table tabel_audit_log\n`;
    auditLog.forEach(l => {
      sql += `INSERT INTO tabel_audit_log (id_log, tanggal, id_user, aktivitas, ip_address) VALUES (${l.id_log}, '${l.tanggal}', ${l.id_user}, '${l.aktivitas.replace(/'/g, "''")}', '${l.ip_address}');\n`;
    });
    sql += `\n`;

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    return sql;
  }
}
