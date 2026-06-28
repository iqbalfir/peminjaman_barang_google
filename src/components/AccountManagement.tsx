/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, Key, Check, AlertCircle, Building, Mail, Phone, Shield, Sparkles, PenTool, Trash2, Clock, Eye, EyeOff } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';

interface AccountManagementProps {
  currentUser: { id_user: number; nama_user: string; username: string; role: string };
  onUpdateUser: (updatedUser: { id_user: number; nama_user: string; username: string; role: string }) => void;
}

export default function AccountManagement({ currentUser, onUpdateUser }: AccountManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'signature'>('profile');

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile Form States
  const [namaUser, setNamaUser] = useState(currentUser.nama_user);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instansi, setInstansi] = useState('Balai Pelestarian Kebudayaan Banten');
  const [nipNik, setNipNik] = useState('');

  // Security Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Sangat Lemah', color: 'bg-rose-500' });

  // Signature States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  // Load profile data from localStorage or mock DB
  useEffect(() => {
    setNamaUser(currentUser.nama_user);
    setUsername(currentUser.username);

    // Look for extended profile in local storage
    const storedProfile = localStorage.getItem(`profile_ext_${currentUser.id_user}`);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        setInstansi(parsed.instansi || 'Balai Pelestarian Kebudayaan Banten');
        setNipNik(parsed.nipNik || '');
      } catch (e) {
        // Fallback
      }
    } else {
      // Default initial mock placeholders based on role
      if (currentUser.role === 'Admin') {
        setEmail('heri.santoso@kemdikbud.go.id');
        setPhone('081299887766');
        setNipNik('197612052003021002');
      } else if (currentUser.role === 'Petugas') {
        setEmail('aris.munandar@kemdikbud.go.id');
        setPhone('085611223344');
        setNipNik('198405102009121001');
      } else {
        setEmail('budi.setiawan@gmail.com');
        setPhone('081977665544');
        setNipNik('3604021208940003');
      }
    }

    // Load signature
    const storedSig = localStorage.getItem(`signature_${currentUser.id_user}`);
    if (storedSig) {
      setSavedSignature(storedSig);
    } else {
      setSavedSignature(null);
    }
  }, [currentUser]);

  // Handle password strength estimation
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaUser.trim() || !username.trim()) {
      showNotification('error', 'Nama Lengkap dan Username tidak boleh kosong.');
      return;
    }

    // Save extended details to localStorage
    const profileExt = { email, phone, instansi, nipNik };
    localStorage.setItem(`profile_ext_${currentUser.id_user}`, JSON.stringify(profileExt));

    // Update simulation users list in dbMock if applicable
    const dbUsers = OfficeInventoryDb.getUsers();
    const matchIdx = dbUsers.findIndex(u => u.id_user === currentUser.id_user);
    if (matchIdx !== -1) {
      dbUsers[matchIdx] = {
        ...dbUsers[matchIdx],
        nama_user: namaUser.trim(),
        username: username.trim()
      };
      OfficeInventoryDb.saveUsers(dbUsers);
    }

    // Fire callback to main app state
    onUpdateUser({
      ...currentUser,
      nama_user: namaUser.trim(),
      username: username.trim()
    });

    OfficeInventoryDb.logActivity(currentUser.id_user, `Update Profil & Informasi Akun Pribadi`);
    showNotification('success', 'Profil akun berhasil diperbarui secara lokal!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      showNotification('error', 'Silakan masukkan password lama Anda.');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('error', 'Password baru minimal harus berukuran 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('error', 'Konfirmasi password baru tidak cocok.');
      return;
    }

    // Update mock users DB password
    const dbUsers = OfficeInventoryDb.getUsers();
    const matchIdx = dbUsers.findIndex(u => u.id_user === currentUser.id_user);
    if (matchIdx !== -1) {
      dbUsers[matchIdx] = {
        ...dbUsers[matchIdx],
        password: newPassword
      };
      OfficeInventoryDb.saveUsers(dbUsers);
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    OfficeInventoryDb.logActivity(currentUser.id_user, `Mengubah password keamanan akun`);
    showNotification('success', 'Password akun berhasil diubah dengan aman!');
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
    ctx.strokeStyle = '#1e3a8a'; // Deep blue Government color ink
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prevent scrolling when drawing on mobile touch devices
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
    
    // Support Touch Events
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    // Support Mouse Events
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
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
    const isEmpty = isCanvasBlank(canvas);
    if (isEmpty) {
      showNotification('error', 'Coretan tanda tangan masih kosong.');
      return;
    }

    const dataUrl = canvas.toDataURL();
    setSavedSignature(dataUrl);
    localStorage.setItem(`signature_${currentUser.id_user}`, dataUrl);
    OfficeInventoryDb.logActivity(currentUser.id_user, `Memperbarui Specimen Tanda Tangan Digital`);
    showNotification('success', 'Tanda tangan digital berhasil diregistrasikan!');
  };

  const deleteSignatureImage = () => {
    setSavedSignature(null);
    localStorage.removeItem(`signature_${currentUser.id_user}`);
    clearCanvas();
    OfficeInventoryDb.logActivity(currentUser.id_user, `Menghapus specimen tanda tangan digital`);
    showNotification('success', 'Tanda tangan digital berhasil dihapus.');
  };

  const isCanvasBlank = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    if (!context) return true;
    const buffer = new Uint32Array(
      context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !buffer.some(color => color !== 0);
  };

  // Get specific logs for current user
  const recentLogs = OfficeInventoryDb.getAuditLog()
    .filter(log => log.id_user === currentUser.id_user)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" /> Manajemen Akun Pengguna
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Kelola profil pribadi, keamanan login, dan tanda tangan dinas digital Anda
          </p>
        </div>
        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start">
          <Shield className="h-3.5 w-3.5 text-blue-600" /> Peran Akun: {currentUser.role}
        </span>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-2.5 animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-rose-50 border border-rose-100 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span className="text-xs font-semibold leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-150">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'profile'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <User className="h-4 w-4" /> Informasi Profil
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'security'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Key className="h-4 w-4" /> Keamanan & Sandi
        </button>
        <button
          onClick={() => setActiveSubTab('signature')}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'signature'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <PenTool className="h-4 w-4" /> Tanda Tangan Digital
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Dynamic Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: Profile Tab */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5 animate-fade-in">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" /> Detail Personal Pegawai
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NIP/NIK */}
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
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
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
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Alamat Email Kerja</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition duration-150 flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Simpan Informasi Profil
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Security Tab */}
          {activeSubTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5 animate-fade-in">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-rose-500" /> Ganti Sandi Keamanan Akun
                </h3>

                <div className="space-y-4">
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
                        placeholder="Minimal 6 karakter dengan huruf & angka..."
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
                          <span>Kekuatan Password:</span>
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
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition duration-150 flex items-center gap-1.5"
                >
                  <Key className="h-4 w-4" /> Perbarui Kata Sandi
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Signature Tab */}
          {activeSubTab === 'signature' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="h-4 w-4 text-blue-600" /> Tanda Tangan Dinas Digital (Specimen)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Tanda tangan ini akan dilekatkan secara otomatis pada cetak nota transaksi peminjaman barang dan berkas laporan serah terima BMN di Balai Pelestarian Kebudayaan Banten.
                  </p>
                </div>

                {savedSignature ? (
                  <div className="p-4 bg-white border border-gray-150 rounded-xl flex flex-col items-center space-y-4">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tanda Tangan Terdaftar Anda</p>
                    <div className="border border-dashed border-gray-200 rounded-lg p-2 bg-slate-50">
                      <img src={savedSignature} alt="Signature Specimen" className="max-h-24 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={deleteSignatureImage}
                      className="px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus & Rekam Ulang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-inner">
                      {/* Signature canvas */}
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
                    <p className="text-[10px] text-center text-gray-400 font-medium">Gunakan jari / mouse Anda untuk membubuhkan coretan tanda tangan di atas canvas putih</p>
                    
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition"
                      >
                        Bersihkan Canvas
                      </button>
                      <button
                        type="button"
                        onClick={saveSignatureImage}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Simpan Tanda Tangan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right side panel: Account Info / Audit Trails */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700/50 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <User className="h-5 w-5" />
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
          <div className="p-5 border border-gray-150 rounded-2xl space-y-4">
            <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" /> Sesi Aktivitas Terakhir
            </h3>

            {recentLogs.length > 0 ? (
              <div className="relative border-l border-gray-200 pl-4 space-y-4 ml-2">
                {recentLogs.map((log) => (
                  <div key={log.id_log} className="space-y-0.5 text-xs relative">
                    {/* Circle bullet indicator */}
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
    </div>
  );
}
