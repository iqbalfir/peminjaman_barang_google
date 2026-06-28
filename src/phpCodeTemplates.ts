/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PhpFile {
  path: string;
  name: string;
  category: string;
  content: string;
}

export const PHP_CODEBASE: PhpFile[] = [
  {
    path: 'config/Database.php',
    name: 'Database.php',
    category: 'Configuration',
    content: `<?php
/**
 * Konfigurasi Database PDO - PHP Native MVC
 * File: /config/Database.php
 */

class Database {
    private $host = "localhost";
    private $db_name = "inventaris_kantor";
    private $username = "root";
    private $password = "";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch(PDOException $exception) {
            echo "Koneksi Database Gagal: " . $exception->getMessage();
            die();
        }
        return $this->conn;
    }
}
?>`
  },
  {
    path: 'helpers/AuthHelper.php',
    name: 'AuthHelper.php',
    category: 'Helpers',
    content: `<?php
/**
 * Helper Otentikasi, Hak Akses (RBAC), XSS, & CSRF Protection
 * File: /helpers/AuthHelper.php
 */

class AuthHelper {
    public static function startSession() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function checkLogin() {
        self::startSession();
        if (!isset($_SESSION['user_id'])) {
            header("Location: /auth/login");
            exit();
        }
    }

    public static function checkRole($allowed_roles = []) {
        self::checkLogin();
        if (!in_array($_SESSION['role'], $allowed_roles)) {
            header("Location: /dashboard?error=access_denied");
            exit();
        }
    }

    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    // CSRF Protection
    public static function generateCSRF() {
        self::startSession();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function validateCSRF($token) {
        self::startSession();
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }

    // XSS Filtering
    public static function filterInput($data) {
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
}
?>`
  },
  {
    path: 'models/BarangModel.php',
    name: 'BarangModel.php',
    category: 'Models',
    content: `<?php
/**
 * Model Data Barang & QR Code Generator Integration
 * File: /models/BarangModel.php
 */

class BarangModel {
    private $db;
    private $table = "tabel_barang";

    public function __construct($db_connection) {
        $this->db = $db_connection;
    }

    public function getAll($search = '', $start = 0, $length = 10) {
        $query = "SELECT b.*, k.nama_kategori 
                  FROM " . $this->table . " b
                  LEFT JOIN tabel_kategori k ON b.id_kategori = k.id_kategori ";
        
        if (!empty($search)) {
            $query .= "WHERE b.kode_barang LIKE :search 
                       OR b.nama_barang LIKE :search 
                       OR b.merk_tipe LIKE :search ";
        }
        $query .= "ORDER BY b.kode_barang ASC LIMIT :start, :length";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        if (!empty($search)) {
            $stmt->bindValue(':search', "%$search%", PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function countAll($search = '') {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " b ";
        if (!empty($search)) {
            $query .= "WHERE b.kode_barang LIKE :search OR b.nama_barang LIKE :search";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':search', "%$search%", PDO::PARAM_STR);
        } else {
            $stmt = $this->db->prepare($query);
        }
        $stmt->execute();
        $row = $stmt->fetch();
        return $row['total'];
    }

    public function getById($id) {
        $query = "SELECT b.*, k.nama_kategori 
                  FROM " . $this->table . " b
                  LEFT JOIN tabel_kategori k ON b.id_kategori = k.id_kategori 
                  WHERE b.id_barang = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function generateKode() {
        $query = "SELECT MAX(id_barang) as max_id FROM " . $this->table;
        $stmt = $this->db->query($query);
        $row = $stmt->fetch();
        $nextId = ($row['max_id'] ?? 0) + 1;
        return "BRG-" . str_pad($nextId, 6, "0", STR_PAD_LEFT);
    }

    public function insert($data) {
        $query = "INSERT INTO " . $this->table . " 
                  (kode_barang, id_kategori, nama_barang, merk_tipe, lokasi_penyimpanan, stok, stok_minimum, kondisi_barang, foto_barang, status_ketersediaan, qr_code, created_at, updated_at) 
                  VALUES (:kode, :id_kat, :nama, :merk, :lokasi, :stok, :stok_min, :kondisi, :foto, :status, :qr, NOW(), NOW())";
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':kode' => $data['kode_barang'],
            ':id_kat' => $data['id_kategori'],
            ':nama' => $data['nama_barang'],
            ':merk' => $data['merk_tipe'],
            ':lokasi' => $data['lokasi_penyimpanan'],
            ':stok' => $data['stok'],
            ':stok_min' => $data['stok_minimum'],
            ':kondisi' => $data['kondisi_barang'],
            ':foto' => $data['foto_barang'],
            ':status' => $data['status_ketersediaan'],
            ':qr' => $data['qr_code']
        ]);
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table . " SET 
                  id_kategori = :id_kat, nama_barang = :nama, merk_tipe = :merk, 
                  lokasi_penyimpanan = :lokasi, stok = :stok, stok_minimum = :stok_min, 
                  kondisi_barang = :kondisi, status_ketersediaan = :status, foto_barang = :foto,
                  updated_at = NOW() 
                  WHERE id_barang = :id";
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':id' => $id,
            ':id_kat' => $data['id_kategori'],
            ':nama' => $data['nama_barang'],
            ':merk' => $data['merk_tipe'],
            ':lokasi' => $data['lokasi_penyimpanan'],
            ':stok' => $data['stok'],
            ':stok_min' => $data['stok_minimum'],
            ':kondisi' => $data['kondisi_barang'],
            ':status' => $data['status_ketersediaan'],
            ':foto' => $data['foto_barang']
        ]);
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id_barang = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':id' => $id]);
    }

    public function getRiwayatBarang($id_barang) {
        $query = "SELECT p.nomor_peminjaman, p.tanggal_pinjam, pjm.nama_lengkap, d.jumlah_pinjam, p.status
                  FROM tabel_detail_peminjaman d
                  JOIN tabel_peminjaman p ON d.id_peminjaman = p.id_peminjaman
                  JOIN tabel_peminjam pjm ON p.id_peminjam = pjm.id_peminjam
                  WHERE d.id_barang = :id_barang
                  ORDER BY p.tanggal_pinjam DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id_barang' => $id_barang]);
        return $stmt->fetchAll();
    }
}
?>`
  },
  {
    path: 'models/PeminjamanModel.php',
    name: 'PeminjamanModel.php',
    category: 'Models',
    content: `<?php
/**
 * Model Transaksi Peminjaman Multi-Item & Stok Management
 * File: /models/PeminjamanModel.php
 */

class PeminjamanModel {
    private $db;

    public function __construct($db_connection) {
        $this->db = $db_connection;
    }

    public function generateNomor() {
        $dateStr = date('Ymd');
        $prefix = "PJM-" . $dateStr . "-";
        
        $query = "SELECT MAX(SUBSTRING(nomor_peminjaman, 14, 4)) as max_num 
                  FROM tabel_peminjaman 
                  WHERE nomor_peminjaman LIKE :prefix";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':prefix' => $prefix . '%']);
        $row = $stmt->fetch();
        
        $nextId = ($row['max_num'] ?? 0) + 1;
        return $prefix . str_pad($nextId, 4, "0", STR_PAD_LEFT);
    }

    public function createTransaction($header, $items, $id_user) {
        try {
            $this->db->beginTransaction();

            // 1. Simpan Header Peminjaman
            $nomor_pjm = $this->generateNomor();
            $queryHeader = "INSERT INTO tabel_peminjaman 
                            (nomor_peminjaman, tanggal_pinjam, tanggal_rencana_kembali, id_peminjam, keperluan, keterangan, dokumen_pendukung, status, created_by, created_at)
                            VALUES (:nomor, :tgl_pinjam, :tgl_kembali, :id_peminjam, :keperluan, :keterangan, :dokumen, 'Dipinjam', :created_by, NOW())";
            
            $stmtHeader = $this->db->prepare($queryHeader);
            $stmtHeader->execute([
                ':nomor' => $nomor_pjm,
                ':tgl_pinjam' => $header['tanggal_pinjam'],
                ':tgl_kembali' => $header['tanggal_rencana_kembali'],
                ':id_peminjam' => $header['id_peminjam'],
                ':keperluan' => $header['keperluan'],
                ':keterangan' => $header['keterangan'],
                ':dokumen' => $header['dokumen_pendukung'],
                ':created_by' => $id_user
            ]);

            $id_peminjaman = $this->db->lastInsertId();

            // 2. Simpan Detail Peminjaman & Kurangi Stok Barang
            foreach ($items as $item) {
                // Validasi Stok Tersedia saat ini
                $queryStok = "SELECT nama_barang, stok, status_ketersediaan FROM tabel_barang WHERE id_barang = :id FOR UPDATE";
                $stmtStok = $this->db->prepare($queryStok);
                $stmtStok->execute([':id' => $item['id_barang']]);
                $barang = $stmtStok->fetch();

                if (!$barang || $barang['stok'] < $item['jumlah_pinjam']) {
                    throw new Exception("Stok untuk '" . ($barang['nama_barang'] ?? 'Barang') . "' tidak mencukupi untuk dipinjam.");
                }

                // Insert Detail
                $queryDetail = "INSERT INTO tabel_detail_peminjaman 
                                (id_peminjaman, id_barang, jumlah_pinjam, jumlah_kembali, kondisi_pinjam, kondisi_kembali, keterangan)
                                VALUES (:id_pjm, :id_brg, :jml, 0, :kondisi, '', :ket)";
                $stmtDetail = $this->db->prepare($queryDetail);
                $stmtDetail->execute([
                    ':id_pjm' => $id_peminjaman,
                    ':id_brg' => $item['id_barang'],
                    ':jml' => $item['jumlah_pinjam'],
                    ':kondisi' => $item['kondisi_pinjam'],
                    ':ket' => $item['keterangan']
                ]);

                // Kurangi Stok Barang
                $newStok = $barang['stok'] - $item['jumlah_pinjam'];
                $newStatus = ($newStok == 0) ? 'Dipinjam' : 'Tersedia';

                $queryUpdateStok = "UPDATE tabel_barang SET stok = :stok, status_ketersediaan = :status, updated_at = NOW() WHERE id_barang = :id";
                $stmtUpdate = $this->db->prepare($queryUpdateStok);
                $stmtUpdate->execute([
                    ':stok' => $newStok,
                    ':status' => $newStatus,
                    ':id' => $item['id_barang']
                ]);
            }

            // 3. Catat Audit Log
            $logAct = "Tambah Peminjaman " . $nomor_pjm . " oleh User ID " . $id_user;
            $queryLog = "INSERT INTO tabel_audit_log (tanggal, id_user, aktivitas, ip_address) VALUES (NOW(), :user, :akt, :ip)";
            $stmtLog = $this->db->prepare($queryLog);
            $stmtLog->execute([
                ':user' => $id_user,
                ':akt' => $logAct,
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            $this->db->commit();
            return ['success' => true, 'nomor' => $nomor_pjm];

        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
?>`
  },
  {
    path: 'controllers/PeminjamanController.php',
    name: 'PeminjamanController.php',
    category: 'Controllers',
    content: `<?php
/**
 * Controller Transaksi AJAX Multi-Item Peminjaman
 * File: /controllers/PeminjamanController.php
 */

require_once 'config/Database.php';
require_once 'models/PeminjamanModel.php';
require_once 'helpers/AuthHelper.php';

class PeminjamanController {
    private $db;
    private $model;

    public function __construct() {
        AuthHelper::checkLogin(); // Hak Akses minimal login
        $database = new Database();
        $this->db = $database->getConnection();
        $this->model = new PeminjamanModel($this->db);
    }

    public function formTambah() {
        AuthHelper::checkRole(['Admin', 'Petugas']);
        
        // Ambil Data Kategori & Barang untuk dropdown Select2
        $stmtPeminjam = $this->db->query("SELECT id_peminjam, nip_nik, nama_lengkap FROM tabel_peminjam ORDER BY nama_lengkap ASC");
        $peminjam = $stmtPeminjam->fetchAll();

        $stmtBarang = $this->db->query("SELECT id_barang, kode_barang, nama_barang, stok FROM tabel_barang WHERE status_ketersediaan = 'Tersedia' AND stok > 0 ORDER BY nama_barang ASC");
        $barang = $stmtBarang.fetchAll();

        // Load View Peminjaman Form
        require_once 'views/peminjaman/tambah.php';
    }

    public function simpanAJAX() {
        header('Content-Type: application/json');
        
        // Cek CSRF
        if (!isset($_POST['csrf_token']) || !AuthHelper::validateCSRF($_POST['csrf_token'])) {
            echo json_encode(['success' => false, 'message' => 'Validasi CSRF Token Gagal.']);
            exit();
        }

        // Ambil parameter data
        $id_peminjam = (int)$_POST['id_peminjam'];
        $tanggal_pinjam = $_POST['tanggal_pinjam'];
        $tanggal_rencana_kembali = $_POST['tanggal_rencana_kembali'];
        $keperluan = AuthHelper::filterInput($_POST['keperluan']);
        $keterangan = AuthHelper::filterInput($_POST['keterangan']);
        
        // Penanganan Upload Dokumen Pendukung
        $dokumen_name = 'Tidak_ada_dokumen.pdf';
        if (isset($_FILES['dokumen_pendukung']) && $_FILES['dokumen_pendukung']['error'] == UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['dokumen_pendukung']['name'], PATHINFO_EXTENSION);
            $new_name = "PJM_" . date('Ymd_His') . "_" . rand(100, 999) . "." . $ext;
            $upload_path = 'uploads/dokumen/' . $new_name;
            if (move_uploaded_file($_FILES['dokumen_pendukung']['tmp_name'], $upload_path)) {
                $dokumen_name = $new_name;
            }
        }

        // Ambil Items dari dynamic table
        $items = isset($_POST['items']) ? $_POST['items'] : [];
        if (empty($items)) {
            echo json_encode(['success' => false, 'message' => 'Anda harus memilih minimal satu barang untuk dipinjam.']);
            exit();
        }

        // Check duplicate items in list
        $selected_ids = array_column($items, 'id_barang');
        if (count($selected_ids) !== count(array_unique($selected_ids))) {
            echo json_encode(['success' => false, 'message' => 'Barang yang sama tidak boleh dimasukkan dua kali dalam satu form transaksi.']);
            exit();
        }

        $header = [
            'id_peminjam' => $id_peminjam,
            'tanggal_pinjam' => $tanggal_pinjam,
            'tanggal_rencana_kembali' => $tanggal_rencana_kembali,
            'keperluan' => $keperluan,
            'keterangan' => $keterangan,
            'dokumen_pendukung' => $dokumen_name
        ];

        // Jalankan transaksi di Model
        $res = $this->model->createTransaction($header, $items, $_SESSION['user_id']);
        echo json_encode($res);
    }
}
?>`
  },
  {
    path: 'controllers/PengembalianController.php',
    name: 'PengembalianController.php',
    category: 'Controllers',
    content: `<?php
/**
 * Controller Pengembalian Barang (Sebagian / Penuh) & Update Status
 * File: /controllers/PengembalianController.php
 */

require_once 'config/Database.php';
require_once 'helpers/AuthHelper.php';

class PengembalianController {
    private $db;

    public function __construct() {
        AuthHelper::checkLogin();
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function formPengembalian() {
        AuthHelper::checkRole(['Admin', 'Petugas']);

        // Ambil data Peminjaman yang belum lunas (status Dipinjam atau Sebagian Kembali)
        $stmtPjm = $this->db->query("SELECT p.id_peminjaman, p.nomor_peminjaman, pj.nama_lengkap 
                                    FROM tabel_peminjaman p
                                    JOIN tabel_peminjam pj ON p.id_peminjam = pj.id_peminjam
                                    WHERE p.status IN ('Dipinjam', 'Sebagian Kembali')
                                    ORDER BY p.nomor_peminjaman DESC");
        $peminjaman_aktif = $stmtPjm->fetchAll();

        require_once 'views/pengembalian/form.php';
    }

    public function getPeminjamanDetail() {
        header('Content-Type: application/json');
        $id_pjm = (int)$_GET['id_peminjaman'];

        // Ambil header peminjaman
        $stmtHeader = $this->db->prepare("SELECT p.*, pj.nama_lengkap, pj.nip_nik, pj.instansi_unit_kerja 
                                          FROM tabel_peminjaman p
                                          JOIN tabel_peminjam pj ON p.id_peminjam = pj.id_peminjam
                                          WHERE p.id_peminjaman = :id");
        $stmtHeader->execute([':id' => $id_pjm]);
        $header = $stmtHeader->fetch();

        // Ambil barang-barang detail yang masih tersisa dipinjam (jumlah_pinjam > jumlah_kembali)
        $stmtDetail = $this->db->prepare("SELECT d.*, b.nama_barang, b.kode_barang 
                                          FROM tabel_detail_peminjaman d
                                          JOIN tabel_barang b ON d.id_barang = b.id_barang
                                          WHERE d.id_peminjaman = :id AND (d.jumlah_pinjam - d.jumlah_kembali) > 0");
        $stmtDetail->execute([':id' => $id_pjm]);
        $details = $stmtDetail->fetchAll();

        echo json_encode(['header' => $header, 'details' => $details]);
    }

    public function simpanPengembalian() {
        header('Content-Type: application/json');
        
        try {
            $this->db->beginTransaction();

            $id_pjm = (int)$_POST['id_peminjaman'];
            $tgl_kembali = $_POST['tanggal_pengembalian'];
            $catatan = AuthHelper::filterInput($_POST['catatan']);
            $items = $_POST['items']; // Array contains id_detail, jumlah_kembali, kondisi_kembali

            if (empty($items)) {
                throw new Exception("Tidak ada barang yang dipilih untuk dikembalikan.");
            }

            // 1. Simpan Header Pengembalian
            $stmtInsert = $this->db->prepare("INSERT INTO tabel_pengembalian (id_peminjaman, tanggal_pengembalian, catatan, created_by)
                                              VALUES (:id_pjm, :tgl, :catatan, :user)");
            $stmtInsert->execute([
                ':id_pjm' => $id_pjm,
                ':tgl' => $tgl_kembali,
                ':catatan' => $catatan,
                ':user' => $_SESSION['user_id']
            ]);

            // 2. Loop update detail dan stok barang
            foreach ($items as $item) {
                $id_det = (int)$item['id_detail'];
                $jml_kembali = (int)$item['jumlah_kembali'];
                $kondisi = $item['kondisi_kembali']; // Baik, Rusak Ringan, Rusak Berat, Hilang

                if ($jml_kembali <= 0) continue;

                // Ambil detail peminjaman eksisting
                $stmtDet = $this->db->prepare("SELECT id_barang, jumlah_pinjam, jumlah_kembali FROM tabel_detail_peminjaman WHERE id_detail = :id_det FOR UPDATE");
                $stmtDet->execute([':id_det' => $id_det]);
                $detail = $stmtDet->fetch();

                if (!$detail) throw new Exception("Detail barang peminjaman tidak ditemukan.");

                $sisa = $detail['jumlah_pinjam'] - $detail['jumlah_kembali'];
                if ($jml_kembali > $sisa) {
                    throw new Exception("Jumlah pengembalian melebihi sisa pinjaman.");
                }

                // Update detail
                $new_kembali_tot = $detail['jumlah_kembali'] + $jml_kembali;
                $stmtUpDet = $this->db->prepare("UPDATE tabel_detail_peminjaman 
                                                 SET jumlah_kembali = :jml, kondisi_kembali = :kondisi 
                                                 WHERE id_detail = :id_det");
                $stmtUpDet->execute([
                    ':jml' => $new_kembali_tot,
                    ':kondisi' => $kondisi,
                    ':id_det' => $id_det
                ]);

                // Update stok di Master Barang (jika tidak Hilang)
                if ($kondisi !== 'Hilang') {
                    $stmtBrg = $this->db->prepare("SELECT stok FROM tabel_barang WHERE id_barang = :id FOR UPDATE");
                    $stmtBrg->execute([':id' => $detail['id_barang']]);
                    $barang = $stmtBrg->fetch();

                    if ($barang) {
                        $new_stok = $barang['stok'] + $jml_kembali;
                        
                        // Jika sebelumnya Rusak / Rusak Ringan, ganti dengan kondisi kembali terbaru
                        $kondisiUpdate = "";
                        if ($kondisi === 'Rusak Ringan' || $kondisi === 'Rusak Berat') {
                            $kondisiUpdate = ", kondisi_barang = '$kondisi'";
                        }

                        $this->db->query("UPDATE tabel_barang SET stok = $new_stok, status_ketersediaan = 'Tersedia' $kondisiUpdate, updated_at = NOW() WHERE id_barang = " . $detail['id_barang']);
                    }
                }
            }

            // 3. Update Status Header Peminjaman (Dipinjam / Sebagian / Selesai)
            $stmtCheck = $this->db->prepare("SELECT SUM(jumlah_pinjam) as tot_pinjam, SUM(jumlah_kembali) as tot_kembali 
                                             FROM tabel_detail_peminjaman 
                                             WHERE id_peminjaman = :id");
            $stmtCheck->execute([':id' => $id_pjm]);
            $tot = $stmtCheck->fetch();

            $finalStatus = 'Dipinjam';
            if ($tot['tot_kembali'] >= $tot['tot_pinjam']) {
                $finalStatus = 'Selesai';
            } else if ($tot['tot_kembali'] > 0) {
                $finalStatus = 'Sebagian Kembali';
            }

            $stmtUpPjm = $this->db->prepare("UPDATE tabel_peminjaman SET status = :status WHERE id_peminjaman = :id");
            $stmtUpPjm->execute([':status' => $finalStatus, ':id' => $id_pjm]);

            // 4. Audit Log
            $stmtPjmNo = $this->db->prepare("SELECT nomor_peminjaman FROM tabel_peminjaman WHERE id_peminjaman = :id");
            $stmtPjmNo->execute([':id' => $id_pjm]);
            $pjmRow = $stmtPjmNo->fetch();

            $logAct = "Pengembalian barang " . ($pjmRow['nomor_peminjaman'] ?? '') . " status: " . $finalStatus;
            $this->db->prepare("INSERT INTO tabel_audit_log (tanggal, id_user, aktivitas, ip_address) VALUES (NOW(), :user, :akt, :ip)")
                     ->execute([':user' => $_SESSION['user_id'], ':akt' => $logAct, ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);

            $this->db->commit();
            echo json_encode(['success' => true, 'message' => 'Pengembalian barang berhasil dicatat!']);

        } catch (Exception $e) {
            $this->db->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>`
  },
  {
    path: 'index.php',
    name: 'index.php',
    category: 'Root Router',
    content: `<?php
/**
 * Router Dispatcher Utama - PHP Native MVC
 * File: /index.php
 */

require_once 'helpers/AuthHelper.php';
AuthHelper::startSession();

// Tangkap Request URL Path
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = parse_url($request_uri, PHP_URL_PATH);

// Router Sederhana
switch ($base_path) {
    case '/':
    case '/dashboard':
        require_once 'controllers/DashboardController.php';
        $controller = new DashboardController();
        $controller->index();
        break;

    case '/auth/login':
        require_once 'controllers/AuthController.php';
        $controller = new AuthController();
        $controller->login();
        break;

    case '/auth/logout':
        require_once 'controllers/AuthController.php';
        $controller = new AuthController();
        $controller->logout();
        break;

    case '/barang':
        require_once 'controllers/BarangController.php';
        $controller = new BarangController();
        $controller->index();
        break;

    case '/peminjaman/tambah':
        require_once 'controllers/PeminjamanController.php';
        $controller = new PeminjamanController();
        $controller->formTambah();
        break;

    case '/peminjaman/simpan':
        require_once 'controllers/PeminjamanController.php';
        $controller = new PeminjamanController();
        $controller->simpanAJAX();
        break;

    case '/pengembalian':
        require_once 'controllers/PengembalianController.php';
        $controller = new PengembalianController();
        $controller->formPengembalian();
        break;

    case '/pengembalian/get-detail':
        require_once 'controllers/PengembalianController.php';
        $controller = new PengembalianController();
        $controller->getPeminjamanDetail();
        break;

    case '/pengembalian/simpan':
        require_once 'controllers/PengembalianController.php';
        $controller = new PengembalianController();
        $controller->simpanPengembalian();
        break;

    default:
        // Page Not Found (404)
        http_response_code(404);
        require_once 'views/errors/404.php';
        break;
}
?>`
  },
  {
    path: 'database/schema.sql',
    name: 'schema.sql',
    category: 'Database SQL',
    content: `-- --------------------------------------------------------
-- DATABASE SCHEMA & DUMMY DATA INVENTARIS KANTOR
-- Format: MySQL 8+ / MariaDB / PHPMyAdmin
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS \`inventaris_kantor\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE \`inventaris_kantor\`;

-- 1. tabel_kategori
CREATE TABLE \`tabel_kategori\` (
  \`id_kategori\` int(11) NOT NULL AUTO_INCREMENT,
  \`nama_kategori\` varchar(100) NOT NULL,
  \`keterangan\` text DEFAULT NULL,
  PRIMARY KEY (\`id_kategori\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. tabel_barang
CREATE TABLE \`tabel_barang\` (
  \`id_barang\` int(11) NOT NULL AUTO_INCREMENT,
  \`kode_barang\` varchar(20) NOT NULL UNIQUE,
  \`id_kategori\` int(11) NOT NULL,
  \`nama_barang\` varchar(255) NOT NULL,
  \`merk_tipe\` varchar(150) DEFAULT NULL,
  \`lokasi_penyimpanan\` varchar(150) DEFAULT NULL,
  \`stok\` int(11) NOT NULL DEFAULT 0,
  \`stok_minimum\` int(11) NOT NULL DEFAULT 1,
  \`kondisi_barang\` enum('Baik','Rusak Ringan','Rusak Berat') NOT NULL DEFAULT 'Baik',
  \`foto_barang\` text DEFAULT NULL,
  \`status_ketersediaan\` enum('Tersedia','Dipinjam','Tidak Aktif') NOT NULL DEFAULT 'Tersedia',
  \`qr_code\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id_barang\`),
  FOREIGN KEY (\`id_kategori\`) REFERENCES \`tabel_kategori\` (\`id_kategori\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. tabel_peminjam
CREATE TABLE \`tabel_peminjam\` (
  \`id_peminjam\` int(11) NOT NULL AUTO_INCREMENT,
  \`nip_nik\` varchar(50) NOT NULL UNIQUE,
  \`nama_lengkap\` varchar(200) NOT NULL,
  \`instansi_unit_kerja\` varchar(200) DEFAULT NULL,
  \`jabatan\` varchar(150) DEFAULT NULL,
  \`nomor_telepon\` varchar(20) DEFAULT NULL,
  \`email\` varchar(150) DEFAULT NULL,
  \`alamat\` text DEFAULT NULL,
  PRIMARY KEY (\`id_peminjam\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. tabel_users
CREATE TABLE \`tabel_users\` (
  \`id_user\` int(11) NOT NULL AUTO_INCREMENT,
  \`nama_user\` varchar(150) NOT NULL,
  \`username\` varchar(100) NOT NULL UNIQUE,
  \`password\` varchar(255) NOT NULL,
  \`role\` enum('Admin','Petugas','Peminjam') NOT NULL,
  \`last_login\` timestamp NULL DEFAULT NULL,
  \`status\` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (\`id_user\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. tabel_peminjaman
CREATE TABLE \`tabel_peminjaman\` (
  \`id_peminjaman\` int(11) NOT NULL AUTO_INCREMENT,
  \`nomor_peminjaman\` varchar(50) NOT NULL UNIQUE,
  \`tanggal_pinjam\` date NOT NULL,
  \`tanggal_rencana_kembali\` date NOT NULL,
  \`id_peminjam\` int(11) NOT NULL,
  \`keperluan\` text DEFAULT NULL,
  \`keterangan\` text DEFAULT NULL,
  \`dokumen_pendukung\` varchar(255) DEFAULT NULL,
  \`status\` enum('Dipinjam','Sebagian Kembali','Selesai') NOT NULL DEFAULT 'Dipinjam',
  \`created_by\` int(11) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id_peminjaman\`),
  FOREIGN KEY (\`id_peminjam\`) REFERENCES \`tabel_peminjam\` (\`id_peminjam\`) ON DELETE CASCADE,
  FOREIGN KEY (\`created_by\`) REFERENCES \`tabel_users\` (\`id_user\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. tabel_detail_peminjaman
CREATE TABLE \`tabel_detail_peminjaman\` (
  \`id_detail\` int(11) NOT NULL AUTO_INCREMENT,
  \`id_peminjaman\` int(11) NOT NULL,
  \`id_barang\` int(11) NOT NULL,
  \`jumlah_pinjam\` int(11) NOT NULL DEFAULT 1,
  \`jumlah_kembali\` int(11) NOT NULL DEFAULT 0,
  \`kondisi_pinjam\` enum('Baik','Rusak Ringan','Rusak Berat') NOT NULL DEFAULT 'Baik',
  \`kondisi_kembali\` enum('Baik','Rusak Ringan','Rusak Berat','Hilang','') NOT NULL DEFAULT '',
  \`keterangan\` text DEFAULT NULL,
  PRIMARY KEY (\`id_detail\`),
  FOREIGN KEY (\`id_peminjaman\`) REFERENCES \`tabel_peminjaman\` (\`id_peminjaman\`) ON DELETE CASCADE,
  FOREIGN KEY (\`id_barang\`) REFERENCES \`tabel_barang\` (\`id_barang\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. tabel_pengembalian
CREATE TABLE \`tabel_pengembalian\` (
  \`id_pengembalian\` int(11) NOT NULL AUTO_INCREMENT,
  \`id_peminjaman\` int(11) NOT NULL,
  \`tanggal_pengembalian\` date NOT NULL,
  \`catatan\` text DEFAULT NULL,
  \`created_by\` int(11) NOT NULL,
  PRIMARY KEY (\`id_pengembalian\`),
  FOREIGN KEY (\`id_peminjaman\`) REFERENCES \`tabel_peminjaman\` (\`id_peminjaman\`) ON DELETE CASCADE,
  FOREIGN KEY (\`created_by\`) REFERENCES \`tabel_users\` (\`id_user\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. tabel_audit_log
CREATE TABLE \`tabel_audit_log\` (
  \`id_log\` int(11) NOT NULL AUTO_INCREMENT,
  \`tanggal\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`id_user\` int(11) DEFAULT NULL,
  \`aktivitas\` varchar(255) NOT NULL,
  \`ip_address\` varchar(50) DEFAULT NULL,
  PRIMARY KEY (\`id_log\`),
  FOREIGN KEY (\`id_user\`) REFERENCES \`tabel_users\` (\`id_user\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- DATA DUMMY AWAL (DEFAULT USERS)
-- --------------------------------------------------------

-- Default passwords are encrypted using password_hash('admin', PASSWORD_DEFAULT) etc.
INSERT INTO \`tabel_users\` (\`id_user\`, \`nama_user\`, \`username\`, \`password\`, \`role\`, \`status\`) VALUES
(1, 'Administrator Utama', 'admin', '$2y$10$f.k42.n3U7bQY7mKve39AOmE3wscY07oT3h3T4z0TbyuLCSM75H7a', 'Admin', 'Aktif'),
(2, 'Rahmat Hidayat (Petugas)', 'petugas', '$2y$10$C8H9lI6W39e87KOf302X/O3.Vj.2fSg38KszXk9XbyuLCSM75H7a', 'Petugas', 'Aktif'),
(3, 'Budi Hartono (Peminjam)', 'budi', '$2y$10$Y1rXscZInP6FasNqCOz0lOf/7.C7ZszrSgVj3b0iSgUby.ZOn790a', 'Peminjam', 'Aktif');

INSERT INTO \`tabel_kategori\` (\`id_kategori\`, \`nama_kategori\`, \`keterangan\`) VALUES
(1, 'Elektronik & IT', 'Laptop, Router, Switch, Tablet, dan aksesoris IT lainnya'),
(2, 'Furniture & Mebel', 'Meja kerja, kursi ergonomis, lemari berkas, dan sekat ruang'),
(3, 'Alat Presentasi', 'Proyektor, pointer, layar proyektor, dan sound system portable'),
(4, 'Alat Tulis Kantor', 'Paper shredder, laminating machine, stapler besar'),
(5, 'Kendaraan Dinas', 'Mobil operasional, sepeda motor dinas untuk kurir dan patroli');

INSERT INTO \`tabel_peminjam\` (\`id_peminjam\`, \`nip_nik\`, \`nama_lengkap\`, \`instansi_unit_kerja\`, \`jabatan\`, \`nomor_telepon\`, \`email\`, \`alamat\`) VALUES
(1, '198503122010121003', 'Budi Hartono, S.Kom', 'Direktorat Sistem Informasi', 'Senior System Administrator', '081234567890', 'budi.hartono@kantor.go.id', 'Jl. Melati No. 45, Kebayoran Baru, Jakarta Selatan'),
(2, '199008242015032001', 'Siti Rahmawati, M.M', 'Divisi Sumber Daya Manusia (HRD)', 'Kepala Bidang Pelatihan & Rekrutmen', '085712345678', 'siti.rahma@kantor.go.id', 'Perumahan Griya Asri Blok C/12, Depok'),
(3, '3173051408930004', 'Ahmad Fauzi', 'Bagian Hubungan Masyarakat & Protokol', 'Pranata Humas Ahli Pertama', '081987654321', 'ahmad.fauzi@kantor.go.id', 'Apartemen Kalibata City Tower C Lantai 8, Jakarta Selatan');
`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'Documentation',
    content: `# PETUNJUK INSTALASI APLIKASI PEMINJAMAN INVENTARIS KANTOR

Aplikasi ini menggunakan konsep pemrograman bersih **PHP Native dengan Struktur Arsitektur MVC (Model-View-Controller)**, memanfaatkan **PDO Prepared Statements** untuk proteksi SQL Injection, filter input XSS, dan token otentikasi CSRF untuk keamanan berlapis.

## PERSYARATAN SISTEM
- XAMPP / Laragon (PHP Versi 8.0 ke atas)
- MySQL 5.7+ atau MySQL 8.0+
- Apache Web Server (mod_rewrite diaktifkan)

## LANGKAH-LANGKAH INSTALASI

1. **Ekstrak File Proyek**:
   - Salin/pindahkan folder proyek ini ke direktori root web server Anda:
     - Jika menggunakan XAMPP: \`C:/xampp/htdocs/inventaris_kantor\`
     - Jika menggunakan Laragon: \`C:/laragon/www/inventaris_kantor\`

2. **Import Database**:
   - Jalankan MySQL di control panel XAMPP Anda.
   - Buka browser dan ketik alamat: \`http://localhost/phpmyadmin\`
   - Buat database baru bernama \`inventaris_kantor\`.
   - Pilih tab **Import**, klik **Choose File** lalu pilih file \`database/schema.sql\` yang ada di folder proyek Anda.
   - Klik **Go** atau **Import** untuk mengeksekusi pembuatan tabel dan data dummy awal.

3. **Konfigurasi Database PHP**:
   - Jika kredensial database lokal Anda berbeda, edit file \`/config/Database.php\`:
     \`\`\`php
     private $host = "localhost";
     private $db_name = "inventaris_kantor";
     private $username = "root"; // sesuaikan username mysql xampp
     private $password = "";     // sesuaikan password mysql xampp
     \`\`\`

4. **Konfigurasi URL Rewrite (.htaccess)**:
   - Pastikan terdapat file \`.htaccess\` pada direktori root proyek untuk mengarahkan seluruh request ke index.php:
     \`\`\`apache
     RewriteEngine On
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^(.*)$ index.php [L,QSA]
     \`\`\`

5. **Akses Aplikasi**:
   - Buka browser favorit Anda, kunjungi url: \`http://localhost/inventaris_kantor\`
   - Login menggunakan kredensial default berikut:
     - **Akun Admin**:
       - Username: \`admin\`
       - Password: \`adminpassword\` (atau \`admin\` sesuai setting DB)
     - **Akun Petugas**:
       - Username: \`petugas\`
       - Password: \`petugaspassword\` (atau \`petugas\` sesuai setting DB)
     - **Akun Peminjam**:
       - Username: \`budi\`
       - Password: \`peminjampassword\`

## FITUR UTAMA
- **Dashboard Interaktif**: Statistik ketersediaan stok, barang kritis, dan grafik ChartJS.
- **Master Data Lengkap**: Kelola kategori, barang (inventaris), peminjam, dan pengguna sistem.
- **QR Code Tracker**: Setiap barang otomatis memiliki QR Code unik yang dapat dicetak dan dipindai menggunakan pemindai QR.
- **Transaksi Peminjaman Multi-Item**: Input AJAX untuk meminjam banyak barang sekaligus dengan validasi sisa stok.
- **Pengembalian Barang Fleksibel**: Mendukung pengembalian sebagian atau penuh dengan pengklasifikasian kondisi barang (Baik/Rusak/Hilang) dan auto-update stok.
- **Log Audit**: Riwayat log mencatat semua operasi user, alamat IP, dan aktivitas secara detail.
- **Laporan & Ekspor**: Ekspor dokumen dalam bentuk PDF (DomPDF) dan Excel (PHPSpreadsheet).
- **Database Backup**: Menu khusus Admin untuk mengunduh salinan backup skema basis data SQL kapan saja.
`
  }
];
