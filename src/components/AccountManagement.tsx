/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, 
  Key, 
  Check, 
  AlertCircle, 
  Building, 
  Mail, 
  Phone, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  PenTool, 
  Trash2, 
  Clock, 
  Eye, 
  EyeOff,
  UserPlus,
  Users,
  Search,
  Filter,
  ArrowRightLeft,
  Edit3,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Briefcase,
  Layers,
  RefreshCw,
  Info,
  LogOut
} from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { User } from '../types';

interface AccountManagementProps {
  currentUser: { id_user: number; nama_user: string; username: string; role: string };
  onUpdateUser: (updatedUser: { id_user: number; nama_user: string; username: string; role: string }) => void;
  onSwitchUser?: (targetUser: { id_user: number; nama_user: string; username: string; role: string }) => void;
  onLogout?: () => void;
}

export default function AccountManagement({ currentUser, onUpdateUser, onSwitchUser, onLogout }: AccountManagementProps) {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<'users_list' | 'rbac_matrix' | 'profile' | 'security' | 'signature'>('users_list');

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Users Management State
  const [users, setUsers] = useState<User[]>(() => OfficeInventoryDb.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Petugas' | 'Peminjam'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Aktif' | 'Nonaktif'>('All');

  // Modal States for User CRUD
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State for Add / Edit User
  const [formData, setFormData] = useState<{
    nama_user: string;
    username: string;
    password: string;
    role: 'Admin' | 'Petugas' | 'Peminjam';
    status: 'Aktif' | 'Nonaktif';
    nip_nik: string;
    email: string;
    nomor_telepon: string;
    instansi: string;
  }>({
    nama_user: '',
    username: '',
    password: '',
    role: 'Petugas',
    status: 'Aktif',
    nip_nik: '',
    email: '',
    nomor_telepon: '',
    instansi: 'Balai Pelestarian Kebudayaan Banten',
  });

  // Reset Password Modal State
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Personal Profile Form States
  const [namaUser, setNamaUser] = useState(currentUser.nama_user);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instansi, setInstansi] = useState('Balai Pelestarian Kebudayaan Banten');
  const [nipNik, setNipNik] = useState('');

  // Personal Security Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Sangat Lemah', color: 'bg-rose-500' });

  // Digital Signature Canvas States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  // Load latest users from storage
  const reloadUsers = () => {
    const list = OfficeInventoryDb.getUsers();
    setUsers(list);
  };

  // Synchronize on mount and when currentUser changes
  useEffect(() => {
    reloadUsers();
    setNamaUser(currentUser.nama_user);
    setUsername(currentUser.username);

    // Look for extended profile in local storage or current user object
    const storedProfile = localStorage.getItem(`profile_ext_${currentUser.id_user}`);
    const foundUser = OfficeInventoryDb.getUsers().find(u => u.id_user === currentUser.id_user);

    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setEmail(parsed.email || foundUser?.email || '');
        setPhone(parsed.phone || foundUser?.nomor_telepon || '');
        setInstansi(parsed.instansi || foundUser?.instansi || 'Balai Pelestarian Kebudayaan Banten');
        setNipNik(parsed.nipNik || foundUser?.nip_nik || '');
      } catch (e) {
        // Fallback
      }
    } else if (foundUser) {
      setEmail(foundUser.email || '');
      setPhone(foundUser.nomor_telepon || '');
      setInstansi(foundUser.instansi || 'Balai Pelestarian Kebudayaan Banten');
      setNipNik(foundUser.nip_nik || '');
    }

    // Load signature
    const storedSig = localStorage.getItem(`signature_${currentUser.id_user}`);
    if (storedSig) {
      setSavedSignature(storedSig);
    } else {
      setSavedSignature(null);
    }
  }, [currentUser]);

  // Password strength calculator
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, label: 'Belum diisi', color: 'bg-gray-200' });
      return;
    }

    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    let label = 'Sangat Lemah';
    let color = 'bg-rose-500';

    if (score >= 4) {
      label = 'Sangat Kuat 🔥';
      color = 'bg-emerald-600';
    } else if (score === 3) {
      label = 'Kuat 💪';
      color = 'bg-emerald-500';
    } else if (score === 2) {
      label = 'Sedang ⚠️';
      color = 'bg-amber-500';
    } else if (score === 1) {
      label = 'Lemah';
      color = 'bg-rose-400';
    }

    setPasswordStrength({ score, label, color });
  }, [newPassword]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper generator for secure random passwords
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = 'Pass#';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.nama_user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nip_nik && u.nip_nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // User statistics
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(u => u.role === 'Admin').length;
    const petugasCount = users.filter(u => u.role === 'Petugas').length;
    const peminjamCount = users.filter(u => u.role === 'Peminjam').length;
    const aktifCount = users.filter(u => u.status === 'Aktif').length;
    const nonaktifCount = users.filter(u => u.status === 'Nonaktif').length;
    return { total, adminCount, petugasCount, peminjamCount, aktifCount, nonaktifCount };
  }, [users]);

  // Open Add User Modal
  const handleOpenAddModal = () => {
    setFormData({
      nama_user: '',
      username: '',
      password: generateRandomPassword(),
      role: 'Petugas',
      status: 'Aktif',
      nip_nik: '',
      email: '',
      nomor_telepon: '',
      instansi: 'Balai Pelestarian Kebudayaan Banten',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add User
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_user.trim() || !formData.username.trim() || !formData.password.trim()) {
      showNotification('error', 'Nama lengkap, username, dan kata sandi wajib diisi!');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '_');

    // Check username uniqueness
    const isExists = users.some(u => u.username.toLowerCase() === cleanUsername);
    if (isExists) {
      showNotification('error', `Username "@${cleanUsername}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    const currentList = OfficeInventoryDb.getUsers();
    const nextId = currentList.length > 0 ? Math.max(...currentList.map(u => u.id_user)) + 1 : 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newUser: User = {
      id_user: nextId,
      nama_user: formData.nama_user.trim(),
      username: cleanUsername,
      password: formData.password,
      role: formData.role,
      status: formData.status,
      nip_nik: formData.nip_nik.trim() || undefined,
      email: formData.email.trim() || undefined,
      nomor_telepon: formData.nomor_telepon.trim() || undefined,
      instansi: formData.instansi.trim() || 'Balai Pelestarian Kebudayaan Banten',
      last_login: undefined,
      created_at: nowStr,
    };

    const updated = [...currentList, newUser];
    OfficeInventoryDb.saveUsers(updated);
    setUsers(updated);

    // Save extended profile
    localStorage.setItem(`profile_ext_${nextId}`, JSON.stringify({
      email: newUser.email || '',
      phone: newUser.nomor_telepon || '',
      instansi: newUser.instansi || '',
      nipNik: newUser.nip_nik || '',
    }));

    OfficeInventoryDb.logActivity(currentUser.id_user, `Menambahkan akun pengguna baru: "${newUser.nama_user}" (@${newUser.username}) [Role: ${newUser.role}]`);
    showNotification('success', `Pengguna baru "${newUser.nama_user}" berhasil didaftarkan!`);
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      nama_user: user.nama_user,
      username: user.username,
      password: user.password || '',
      role: user.role,
      status: user.status,
      nip_nik: user.nip_nik || '',
      email: user.email || '',
      nomor_telepon: user.nomor_telepon || '',
      instansi: user.instansi || 'Balai Pelestarian Kebudayaan Banten',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit User
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!formData.nama_user.trim() || !formData.username.trim()) {
      showNotification('error', 'Nama lengkap dan username tidak boleh kosong.');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '_');

    // Check unique username except for self
    const isExists = users.some(u => u.id_user !== selectedUser.id_user && u.username.toLowerCase() === cleanUsername);
    if (isExists) {
      showNotification('error', `Username "@${cleanUsername}" telah digunakan oleh akun lain.`);
      return;
    }

    // Protection: Prevent non-admin or demoting the last active admin
    if (selectedUser.id_user === currentUser.id_user && formData.role !== currentUser.role && currentUser.role === 'Admin') {
      const otherAdmins = users.filter(u => u.id_user !== currentUser.id_user && u.role === 'Admin' && u.status === 'Aktif');
      if (otherAdmins.length === 0) {
        showNotification('error', 'Tidak dapat mengubah role akun sendiri karena Anda adalah satu-satunya Admin aktif.');
        return;
      }
    }

    const currentList = OfficeInventoryDb.getUsers();
    const updatedList = currentList.map(u => {
      if (u.id_user === selectedUser.id_user) {
        return {
          ...u,
          nama_user: formData.nama_user.trim(),
          username: cleanUsername,
          role: formData.role,
          status: formData.status,
          nip_nik: formData.nip_nik.trim() || undefined,
          email: formData.email.trim() || undefined,
          nomor_telepon: formData.nomor_telepon.trim() || undefined,
          instansi: formData.instansi.trim() || undefined,
        };
      }
      return u;
    });

    OfficeInventoryDb.saveUsers(updatedList);
    setUsers(updatedList);

    // Update extended profile
    localStorage.setItem(`profile_ext_${selectedUser.id_user}`, JSON.stringify({
      email: formData.email.trim(),
      phone: formData.nomor_telepon.trim(),
      instansi: formData.instansi.trim(),
      nipNik: formData.nip_nik.trim(),
    }));

    // If editing logged-in user, update App state
    if (selectedUser.id_user === currentUser.id_user) {
      onUpdateUser({
        ...currentUser,
        nama_user: formData.nama_user.trim(),
        username: cleanUsername,
        role: formData.role,
      });
      setNamaUser(formData.nama_user.trim());
      setUsername(cleanUsername);
    }

    OfficeInventoryDb.logActivity(currentUser.id_user, `Memperbarui data akun pengguna: "${formData.nama_user}" (@${cleanUsername})`);
    showNotification('success', `Perubahan data akun "${formData.nama_user}" berhasil disimpan!`);
    setIsEditModalOpen(false);
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = (user: User) => {
    if (user.id_user === currentUser.id_user) {
      showNotification('error', 'Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan saat ini.');
      return;
    }

    const newStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const currentList = OfficeInventoryDb.getUsers();
    const updatedList = currentList.map(u => {
      if (u.id_user === user.id_user) {
        return { ...u, status: newStatus as 'Aktif' | 'Nonaktif' };
      }
      return u;
    });

    OfficeInventoryDb.saveUsers(updatedList);
    setUsers(updatedList);
    OfficeInventoryDb.logActivity(currentUser.id_user, `Mengubah status akun "${user.nama_user}" menjadi: ${newStatus}`);
    showNotification('info', `Status akun ${user.nama_user} diubah menjadi ${newStatus}`);
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (user: User) => {
    setSelectedUser(user);
    const generated = generateRandomPassword();
    setNewResetPassword(generated);
    setConfirmResetPassword(generated);
    setIsResetPassModalOpen(true);
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (newResetPassword.length < 6) {
      showNotification('error', 'Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      showNotification('error', 'Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const currentList = OfficeInventoryDb.getUsers();
    const updatedList = currentList.map(u => {
      if (u.id_user === selectedUser.id_user) {
        return { ...u, password: newResetPassword };
      }
      return u;
    });

    OfficeInventoryDb.saveUsers(updatedList);
    setUsers(updatedList);
    OfficeInventoryDb.logActivity(currentUser.id_user, `Reset kata sandi untuk akun pengguna: "${selectedUser.nama_user}" (@${selectedUser.username})`);
    showNotification('success', `Kata sandi akun ${selectedUser.nama_user} berhasil direset! Sandi baru: ${newResetPassword}`);
    setIsResetPassModalOpen(false);
  };

  // Open Delete User Confirmation Modal
  const handleOpenDeleteModal = (user: User) => {
    if (user.id_user === currentUser.id_user) {
      showNotification('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (user.id_user === 1) {
      showNotification('error', 'Akun Administrator Utama sistem (ID 1) dilindungi dan tidak dapat dihapus.');
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete User
  const handleConfirmDelete = () => {
    if (!selectedUser) return;

    const currentList = OfficeInventoryDb.getUsers();
    const updatedList = currentList.filter(u => u.id_user !== selectedUser.id_user);

    OfficeInventoryDb.saveUsers(updatedList);
    setUsers(updatedList);
    localStorage.removeItem(`profile_ext_${selectedUser.id_user}`);
    localStorage.removeItem(`signature_${selectedUser.id_user}`);

    OfficeInventoryDb.logActivity(currentUser.id_user, `Menghapus akun pengguna: "${selectedUser.nama_user}" (@${selectedUser.username})`);
    showNotification('success', `Akun ${selectedUser.nama_user} telah berhasil dihapus dari sistem.`);
    setIsDeleteModalOpen(false);
  };

  // Handle Switch / Impersonate User
  const handleSwitchToUser = (user: User) => {
    if (user.id_user === currentUser.id_user) {
      showNotification('info', `Anda sudah sedang aktif sebagai ${user.nama_user}.`);
      return;
    }

    if (user.status === 'Nonaktif') {
      showNotification('error', `Tidak dapat beralih ke akun yang berstatus Nonaktif.`);
      return;
    }

    if (onSwitchUser) {
      onSwitchUser({
        id_user: user.id_user,
        nama_user: user.nama_user,
        username: user.username,
        role: user.role,
      });
      OfficeInventoryDb.logActivity(user.id_user, `Beralih sesi login ke pengguna: "${user.nama_user}" (${user.role})`);
      showNotification('success', `Berhasil beralih sesi login ke: ${user.nama_user} (${user.role})`);
    }
  };

  // Personal Profile Update
  const handleUpdatePersonalProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaUser.trim() || !username.trim()) {
      showNotification('error', 'Nama Lengkap dan Username tidak boleh kosong.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');

    // Save extended details to localStorage
    const profileExt = { email, phone, instansi, nipNik };
    localStorage.setItem(`profile_ext_${currentUser.id_user}`, JSON.stringify(profileExt));

    // Update in users table
    const dbUsers = OfficeInventoryDb.getUsers();
    const matchIdx = dbUsers.findIndex(u => u.id_user === currentUser.id_user);
    if (matchIdx !== -1) {
      dbUsers[matchIdx] = {
        ...dbUsers[matchIdx],
        nama_user: namaUser.trim(),
        username: cleanUsername,
        email: email.trim() || undefined,
        nomor_telepon: phone.trim() || undefined,
        instansi: instansi.trim() || undefined,
        nip_nik: nipNik.trim() || undefined,
      };
      OfficeInventoryDb.saveUsers(dbUsers);
      setUsers(dbUsers);
    }

    // Fire callback to main app state
    onUpdateUser({
      ...currentUser,
      nama_user: namaUser.trim(),
      username: cleanUsername,
    });

    OfficeInventoryDb.logActivity(currentUser.id_user, `Memperbarui profil informasi akun pribadi`);
    showNotification('success', 'Profil pribadi berhasil diperbarui!');
  };

  // Personal Password Change
  const handleChangePersonalPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      showNotification('error', 'Silakan masukkan kata sandi lama Anda.');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('error', 'Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('error', 'Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    const dbUsers = OfficeInventoryDb.getUsers();
    const matchIdx = dbUsers.findIndex(u => u.id_user === currentUser.id_user);
    if (matchIdx !== -1) {
      dbUsers[matchIdx] = {
        ...dbUsers[matchIdx],
        password: newPassword,
      };
      OfficeInventoryDb.saveUsers(dbUsers);
      setUsers(dbUsers);
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    OfficeInventoryDb.logActivity(currentUser.id_user, `Mengubah kata sandi keamanan akun pribadi`);
    showNotification('success', 'Kata sandi pribadi berhasil diperbarui dengan aman!');
  };

  // Canvas drawing handlers for Digital Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Deep blue ink
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignatureImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty
    const context = canvas.getContext('2d');
    if (!context) return;
    const buffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const isEmpty = !buffer.some(color => color !== 0);

    if (isEmpty) {
      showNotification('error', 'Coretan tanda tangan masih kosong.');
      return;
    }

    const dataUrl = canvas.toDataURL();
    setSavedSignature(dataUrl);
    localStorage.setItem(`signature_${currentUser.id_user}`, dataUrl);
    OfficeInventoryDb.logActivity(currentUser.id_user, `Memperbarui specimen tanda tangan digital dinas`);
    showNotification('success', 'Specimen tanda tangan digital dinas berhasil disimpan!');
  };

  const deleteSignatureImage = () => {
    setSavedSignature(null);
    localStorage.removeItem(`signature_${currentUser.id_user}`);
    clearCanvas();
    OfficeInventoryDb.logActivity(currentUser.id_user, `Menghapus specimen tanda tangan digital`);
    showNotification('info', 'Tanda tangan digital berhasil dihapus.');
  };

  // Recent user logs
  const recentLogs = useMemo(() => {
    return OfficeInventoryDb.getAuditLog()
      .filter(log => log.id_user === currentUser.id_user)
      .slice(0, 5);
  }, [currentUser]);

  // RBAC Permission Modules Matrix data
  const rbacMatrix = [
    {
      module: 'Dashboard Statistik & Status Inventaris',
      admin: 'Penuh (Real-time & Ekspor Grafik)',
      petugas: 'Penuh (Real-time Statistik Barang)',
      peminjam: 'Ringkasan Terbatas (Statistik Umum)',
    },
    {
      module: 'Master Data Barang (BMN)',
      admin: 'Penuh (Tambah, Edit, Hapus, Print Label QR)',
      petugas: 'Penuh (Tambah, Edit, Update Stok, Print Label)',
      peminjam: 'Hanya Lihat Katalog (Ketersediaan Barang)',
    },
    {
      module: 'Master Kategori Barang',
      admin: 'Penuh (Tambah, Edit, Hapus Kategori)',
      petugas: 'Penuh (Tambah, Edit Kategori)',
      peminjam: 'Hanya Lihat Daftar Kategori',
    },
    {
      module: 'Master Data Peminjam (Pegawai/Unit)',
      admin: 'Penuh (Kelola Seluruh Data Pegawai)',
      petugas: 'Penuh (Pendaftaran & Pembaruan Peminjam)',
      peminjam: 'Hanya Profil Pribadi Sendiri',
    },
    {
      module: 'Pencatatan Peminjaman (Multi-Item)',
      admin: 'Penuh (Input, Verifikasi, Batalkan Transaksi)',
      petugas: 'Penuh (Penerbitan Bukti Pinjam & Cetak Nota)',
      peminjam: 'Input Permohonan Pinjam Barang Sendiri',
    },
    {
      module: 'Pengembalian Parsial & Cek Kondisi Fisik',
      admin: 'Penuh (Validasi Pengembalian & Penalti)',
      petugas: 'Penuh (Pemeriksaan Fisik Baik/Rusak/Hilang)',
      peminjam: 'Tidak Memiliki Hak Akses Modul Ini',
    },
    {
      module: 'Berita Acara Serah Terima (BAST BMN)',
      admin: 'Penuh (Penerbitan, Edit, Cetak Berkas BAST)',
      petugas: 'Penuh (Penerbitan BAST Resmi & Tanda Tangan)',
      peminjam: 'Hanya Melihat Berkas BAST yang Berkaitan',
    },
    {
      module: 'Historis Pemeliharaan & Perbaikan Barang',
      admin: 'Penuh (Input Vendor, Biaya & Rekapitulasi)',
      petugas: 'Penuh (Pencatatan Servis & Kondisi Setelah)',
      peminjam: 'Tidak Memiliki Hak Akses Modul Ini',
    },
    {
      module: 'Laporan Rekonsiliasi & Ekspor (Excel/CSV/PDF)',
      admin: 'Penuh (Semua Laporan & Rekap Finansial BMN)',
      petugas: 'Laporan Sirkulasi Barang & Peminjaman',
      peminjam: 'Hanya Riwayat Peminjaman Pribadi',
    },
    {
      module: 'Jejak Rekam Audit Log (Audit Trail)',
      admin: 'Penuh (Investigasi Seluruh Aktivitas & IP)',
      petugas: 'Hanya Sesi Pribadi Terakhir',
      peminjam: 'Hanya Sesi Pribadi Terakhir',
    },
    {
      module: 'Backup & Restore Basis Data',
      admin: 'Penuh (Cadangkan Snapshot & Pulihkan Data)',
      petugas: 'Tidak Memiliki Hak Akses Modul Ini',
      peminjam: 'Tidak Memiliki Hak Akses Modul Ini',
    },
    {
      module: 'Manajemen Akun, User & Hak Akses (RBAC)',
      admin: 'Penuh (Tambah User, Reset Sandi, Ubah Role)',
      petugas: 'Hanya Profil & Sandi Akun Sendiri',
      peminjam: 'Hanya Profil & Sandi Akun Sendiri',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sistem Manajemen Akun & Pengguna
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Pusat kendali akun pengguna, hak akses berbasis peran (RBAC), pengaturan keamanan profil, dan specimen tanda tangan dinas
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
              <span className="text-gray-500 font-medium">Sesi Aktif:</span>
              <span className="font-bold text-slate-800">{currentUser.nama_user}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                currentUser.role === 'Admin' ? 'bg-blue-600 text-white' :
                currentUser.role === 'Petugas' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
              }`}>
                {currentUser.role}
              </span>
            </div>

            {onLogout && (
              <button
                id="btn-account-logout"
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                title="Keluar dari sesi akun ini"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className={`mt-4 p-3.5 rounded-xl flex items-center gap-2.5 animate-fade-in ${
            notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 
            notification.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
            {notification.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
            {notification.type === 'info' && <Info className="h-4 w-4 shrink-0 text-blue-600" />}
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-150 mt-6 overflow-x-auto">
          <button
            id="tab-user-list"
            onClick={() => setActiveTab('users_list')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users_list'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" /> Kelola Seluruh Pengguna ({users.length})
          </button>

          <button
            id="tab-rbac-matrix"
            onClick={() => setActiveTab('rbac_matrix')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'rbac_matrix'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Matriks Hak Akses (RBAC)
          </button>

          <button
            id="tab-my-profile"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <UserIcon className="h-4 w-4" /> Profil Pribadi Saya
          </button>

          <button
            id="tab-my-security"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Key className="h-4 w-4" /> Keamanan & Ganti Sandi
          </button>

          <button
            id="tab-my-signature"
            onClick={() => setActiveTab('signature')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'signature'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <PenTool className="h-4 w-4" /> Tanda Tangan Digital
          </button>
        </div>
      </div>

      {/* TAB 1: KELOLA SELURUH PENGGUNA (USERS LIST & CRUD) */}
      {activeTab === 'users_list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Pengguna</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
              <span className="text-[10px] text-gray-500 font-medium">Terdaftar di sistem</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-150 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Administrator</span>
              <div className="text-xl font-extrabold text-blue-700 mt-1">{stats.adminCount}</div>
              <span className="text-[10px] text-blue-500 font-medium">Hak akses penuh</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-150 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Petugas Logistik</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">{stats.petugasCount}</div>
              <span className="text-[10px] text-emerald-500 font-medium">Pengelola barang</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Peminjam / Pegawai</span>
              <div className="text-xl font-extrabold text-slate-800 mt-1">{stats.peminjamCount}</div>
              <span className="text-[10px] text-slate-500 font-medium">Akses permohonan</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Status Aktif</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">{stats.aktifCount}</div>
              <span className="text-[10px] text-emerald-500 font-medium">Bisa login</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Nonaktif</span>
              <div className="text-xl font-extrabold text-rose-600 mt-1">{stats.nonaktifCount}</div>
              <span className="text-[10px] text-rose-400 font-medium">Akses dibekukan</span>
            </div>
          </div>

          {/* Controls Bar: Search, Filters, and Add User Button */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pengguna, @username, NIP, atau email..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Role */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">Semua Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Petugas">Petugas</option>
                  <option value="Peminjam">Peminjam</option>
                </select>

                {/* Filter Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">Semua Status</option>
                  <option value="Aktif">Status: Aktif</option>
                  <option value="Nonaktif">Status: Nonaktif</option>
                </select>
              </div>
            </div>

            {/* Add User Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <UserPlus className="h-4 w-4" /> Tambah Akun Pengguna
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Pengguna & NIP</th>
                    <th className="py-3.5 px-4">Username & Kontak</th>
                    <th className="py-3.5 px-4">Hak Akses (Role)</th>
                    <th className="py-3.5 px-4">Status Akun</th>
                    <th className="py-3.5 px-4">Terakhir Login</th>
                    <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                        Tidak ada data akun pengguna yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isCurrent = user.id_user === currentUser.id_user;
                      const initial = user.nama_user.charAt(0).toUpperCase();

                      return (
                        <tr key={user.id_user} className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-blue-50/30' : ''}`}>
                          {/* Nama & NIP */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 ${
                                user.role === 'Admin' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                user.role === 'Petugas' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {initial}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {user.nama_user}
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 bg-blue-600 text-[9px] text-white font-extrabold rounded">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono">
                                  NIP: {user.nip_nik || '-'}
                                </div>
                                {user.instansi && (
                                  <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                    {user.instansi}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Username & Kontak */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 font-mono text-[11px]">
                                @{user.username}
                              </div>
                              {user.email && (
                                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-gray-400" />
                                  <span className="truncate max-w-[180px]">{user.email}</span>
                                </div>
                              )}
                              {user.nomor_telepon && (
                                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span>{user.nomor_telepon}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              user.role === 'Admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              user.role === 'Petugas' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {user.role === 'Admin' && <Shield className="h-3 w-3 text-blue-600" />}
                              {user.role === 'Petugas' && <Briefcase className="h-3 w-3 text-emerald-600" />}
                              {user.role === 'Peminjam' && <UserIcon className="h-3 w-3 text-slate-600" />}
                              {user.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              title="Klik untuk ubah status akun"
                              disabled={isCurrent}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                                user.status === 'Aktif' 
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              {user.status}
                            </button>
                          </td>

                          {/* Last Login */}
                          <td className="py-3.5 px-4">
                            <div className="text-gray-600 text-[11px] space-y-0.5">
                              <div>{user.last_login || 'Belum pernah login'}</div>
                              {user.created_at && (
                                <div className="text-[10px] text-gray-400">Dibuat: {user.created_at.substring(0, 10)}</div>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Switch / Impersonate Button */}
                              <button
                                onClick={() => handleSwitchToUser(user)}
                                title={`Beralih Sesi Login sebagai ${user.nama_user}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isCurrent 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white hover:bg-blue-50 text-blue-600 border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                title="Edit Data Pengguna"
                                className="p-1.5 bg-white hover:bg-slate-100 text-gray-600 hover:text-slate-900 rounded-lg border border-gray-200 transition"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              {/* Reset Password Button */}
                              <button
                                onClick={() => handleOpenResetModal(user)}
                                title="Reset Kata Sandi Pengguna"
                                className="p-1.5 bg-white hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-lg border border-gray-200 hover:border-amber-300 transition"
                              >
                                <Key className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleOpenDeleteModal(user)}
                                disabled={isCurrent || user.id_user === 1}
                                title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : user.id_user === 1 ? 'Akun Admin Utama dilindungi' : 'Hapus Pengguna'}
                                className={`p-1.5 rounded-lg border transition ${
                                  isCurrent || user.id_user === 1
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 border-gray-200 hover:border-rose-300'
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIKS HAK AKSES (RBAC MATRIX) */}
      {activeTab === 'rbac_matrix' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Struktur Kewenangan Hak Akses (Role-Based Access Control)
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Sistem menerapkan prinsip <em>Least Privilege</em> dan pembagian tugas operasional (Separation of Duties) untuk menjaga integritas data dan keamanan barang milik negara (BMN).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-150 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-1/4">Modul / Fitur Aplikasi</th>
                    <th className="py-3.5 px-4 w-1/4 text-blue-700 bg-blue-50/40">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-blue-600" /> Administrator
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-1/4 text-emerald-700 bg-emerald-50/40">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-600" /> Petugas Logistik
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-1/4 text-slate-700 bg-slate-50">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-slate-600" /> Peminjam / Pegawai
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {rbacMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full shrink-0" />
                        {item.module}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-800 bg-blue-50/20">
                        {item.admin}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800 bg-emerald-50/20">
                        {item.petugas}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.peminjam}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFIL PRIBADI SAYA */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left 2 Cols: Form Profil */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleUpdatePersonalProfile} className="bg-white rounded-xl border border-gray-150 p-6 shadow-xs space-y-5">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-600" /> Informasi Data Personal
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Informasi ini digunakan sebagai identitas penanggung jawab dalam nota peminjaman dan bukti BAST
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NIP / NIK */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">NIP / NIK Resmi</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={nipNik}
                      onChange={(e) => setNipNik(e.target.value)}
                      placeholder="Contoh: 19850312..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Nama Lengkap & Gelar</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={namaUser}
                      onChange={(e) => setNamaUser(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-gray-800"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Username Login</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-xs text-gray-400">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Instansi Unit Kerja */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Instansi & Unit Kerja</label>
                  <input
                    type="text"
                    required
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Alamat Email Resmi</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@kemdikbud.go.id"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium font-mono"
                    />
                  </div>
                </div>

                {/* Nomor HP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Nomor HP / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-150">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition duration-150 flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Simpan Informasi Profil
                </button>
              </div>
            </form>
          </div>

          {/* Right 1 Col: Account Info Card & Logs */}
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700/50 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest">Identitas Logged-In</h4>
                  <p className="text-sm font-bold text-white leading-snug truncate max-w-[160px]">{namaUser}</p>
                </div>
              </div>

              <div className="divide-y divide-slate-800 text-xs pt-1">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Username</span>
                  <span className="font-semibold text-white">@{username}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Hak Akses</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-extrabold rounded text-white">{currentUser.role}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">NIP/NIK Resmi</span>
                  <span className="font-semibold text-slate-300 font-mono">{nipNik || '-'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Tanda Tangan</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${savedSignature ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {savedSignature ? 'Teregistrasi' : 'Belum Ada'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Specific Audit History */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" /> Sesi Aktivitas Terakhir
              </h3>

              {recentLogs.length > 0 ? (
                <div className="relative border-l border-gray-200 pl-4 space-y-4 ml-2">
                  {recentLogs.map((log) => (
                    <div key={log.id_log} className="space-y-0.5 text-xs relative">
                      <div className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 bg-blue-500 border-2 border-white rounded-full" />
                      <p className="text-slate-800 font-semibold leading-snug">{log.aktivitas}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                        <span>{log.tanggal}</span>
                        <span>•</span>
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-4">Belum ada riwayat aktivitas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KEAMANAN & GANTI SANDI PRIBADI */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white rounded-xl border border-gray-150 p-6 shadow-xs space-y-6 animate-fade-in">
          <div className="border-b border-gray-150 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Key className="h-4 w-4 text-rose-500" /> Perbarui Kata Sandi Akun Pribadi
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Gunakan kata sandi yang kuat untuk melindungi akun inventaris Anda dari akses tanpa izin
            </p>
          </div>

          <form onSubmit={handleChangePersonalPassword} className="space-y-4">
            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Kata Sandi Lama</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Ketik password lama Anda..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter kombinasi huruf & angka..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                    <span>Kekuatan Kata Sandi:</span>
                    <span className="text-slate-700">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 transition-colors ${
                          level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi pengetikan kata sandi baru Anda..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition duration-150 flex items-center gap-1.5"
              >
                <Key className="h-4 w-4" /> Perbarui Kata Sandi Saya
              </button>
            </div>
          </form>

          {/* Sesi Login Aktif & Logout */}
          {onLogout && (
            <div className="mt-6 pt-5 border-t border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Sesi Pengguna Sedang Berjalan
                </div>
                <p className="text-[11px] text-gray-500">
                  Anda login sebagai <span className="font-semibold text-slate-800">{currentUser.nama_user}</span> (@{currentUser.username}). Ingin mengakhiri sesi dan keluar dari sistem?
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TANDA TANGAN DIGITAL DINAS */}
      {activeTab === 'signature' && (
        <div className="max-w-2xl bg-white rounded-xl border border-gray-150 p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-gray-150 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-blue-600" /> Tanda Tangan Digital Dinas (Specimen)
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Specimen tanda tangan ini dilekatkan secara otomatis pada cetak nota bukti peminjaman dan berita acara serah terima (BAST) BMN
            </p>
          </div>

          {savedSignature ? (
            <div className="p-6 bg-slate-50 border border-gray-200 rounded-xl flex flex-col items-center space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Specimen Tanda Tangan Aktif Anda</span>
              <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-white shadow-xs">
                <img src={savedSignature} alt="Specimen Tanda Tangan" className="max-h-28 object-contain" />
              </div>
              <button
                type="button"
                onClick={deleteSignatureImage}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus & Buat Ulang Tanda Tangan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full max-w-[480px] h-40 bg-white cursor-crosshair mx-auto block"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <p className="text-[11px] text-center text-gray-400 font-medium">
                Bubuhkan tanda tangan Anda pada kanvas putih di atas menggunakan jari atau mouse
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition"
                >
                  Bersihkan Kanvas
                </button>
                <button
                  type="button"
                  onClick={saveSignatureImage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" /> Simpan Specimen Tanda Tangan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH PENGGUNA BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Tambah Akun Pengguna Baru</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_user}
                    onChange={(e) => setFormData({ ...formData, nama_user: e.target.value })}
                    placeholder="Contoh: Budi Santoso, S.T."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Username Login *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="budi_santoso"
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Password Awal */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Kata Sandi Awal *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Hak Akses (Role) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Admin">Admin (Akses Penuh)</option>
                    <option value="Petugas">Petugas (Kelola Logistik)</option>
                    <option value="Peminjam">Peminjam (Pegawai Umum)</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Status Akun *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Dibekukan)</option>
                  </select>
                </div>

                {/* NIP / NIK */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">NIP / NIK Resmi</label>
                  <input
                    type="text"
                    value={formData.nip_nik}
                    onChange={(e) => setFormData({ ...formData, nip_nik: e.target.value })}
                    placeholder="1985..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                {/* Nomor HP */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.nomor_telepon}
                    onChange={(e) => setFormData({ ...formData, nomor_telepon: e.target.value })}
                    placeholder="0812..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Email Kerja</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@kemdikbud.go.id"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                {/* Instansi */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Instansi / Unit Kerja</label>
                  <input
                    type="text"
                    value={formData.instansi}
                    onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Daftarkan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PENGGUNA */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Edit3 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Perbarui Data Akun: {selectedUser.nama_user}</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_user}
                    onChange={(e) => setFormData({ ...formData, nama_user: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Username Login *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Hak Akses (Role) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Admin">Admin (Akses Penuh)</option>
                    <option value="Petugas">Petugas (Kelola Logistik)</option>
                    <option value="Peminjam">Peminjam (Pegawai Umum)</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Status Akun *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Dibekukan)</option>
                  </select>
                </div>

                {/* NIP / NIK */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">NIP / NIK Resmi</label>
                  <input
                    type="text"
                    value={formData.nip_nik}
                    onChange={(e) => setFormData({ ...formData, nip_nik: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                {/* Nomor HP */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.nomor_telepon}
                    onChange={(e) => setFormData({ ...formData, nomor_telepon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Email Kerja</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                {/* Instansi */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Instansi / Unit Kerja</label>
                  <input
                    type="text"
                    value={formData.instansi}
                    onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Simpan Pembaruan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD PENGGUNA */}
      {isResetPassModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Key className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Reset Kata Sandi Akun</h3>
              </div>
              <button onClick={() => setIsResetPassModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-800">Target Akun:</span>
              <div className="text-amber-900 font-semibold">{selectedUser.nama_user} (@{selectedUser.username})</div>
              <p className="text-[10px] text-amber-700">Admin dapat menetapkan kata sandi baru secara manual atau membuat sandi acak yang aman.</p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Kata Sandi Baru</label>
                  <button
                    type="button"
                    onClick={() => {
                      const pass = generateRandomPassword();
                      setNewResetPassword(pass);
                      setConfirmResetPassword(pass);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Buat Sandi Acak
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Konfirmasi Kata Sandi Baru</label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsResetPassModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Key className="h-4 w-4" /> Tetapkan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS PENGGUNA */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-scale-in text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Hapus Akun Pengguna?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">{selectedUser.nama_user}</span> (@{selectedUser.username})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
