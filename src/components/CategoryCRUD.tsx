/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, Tag } from 'lucide-react';
import { OfficeInventoryDb } from '../dbMock';
import { Kategori } from '../types';

interface CategoryCRUDProps {
  currentUser: { id_user: number; nama_user: string; role: string } | null;
}

export default function CategoryCRUD({ currentUser }: CategoryCRUDProps) {
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form states
  const [namaKategori, setNamaKategori] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setCategories(OfficeInventoryDb.getKategori());
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditId(null);
    setNamaKategori('');
    setKeterangan('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Kategori) => {
    setEditId(cat.id_kategori);
    setNamaKategori(cat.nama_kategori);
    setKeterangan(cat.keterangan);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaKategori.trim()) {
      showNotification('error', 'Nama kategori wajib diisi.');
      return;
    }

    const currentList = [...categories];

    if (editId !== null) {
      // Edit
      const index = currentList.findIndex(c => c.id_kategori === editId);
      if (index !== -1) {
        currentList[index] = {
          ...currentList[index],
          nama_kategori: namaKategori,
          keterangan: keterangan
        };
        OfficeInventoryDb.saveKategori(currentList);
        OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Edit Kategori: "${namaKategori}"`);
        showNotification('success', 'Kategori berhasil diperbarui!');
      }
    } else {
      // Add
      const nextId = currentList.length > 0 ? Math.max(...currentList.map(c => c.id_kategori)) + 1 : 1;
      const newCat: Kategori = {
        id_kategori: nextId,
        nama_kategori: namaKategori,
        keterangan: keterangan
      };
      currentList.push(newCat);
      OfficeInventoryDb.saveKategori(currentList);
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Tambah Kategori Baru: "${namaKategori}"`);
      showNotification('success', 'Kategori baru berhasil ditambahkan!');
    }

    loadCategories();
    setIsModalOpen(false);
  };

  const handleDelete = (id: number, name: string) => {
    // Only Admin can delete
    if (currentUser?.role !== 'Admin') {
      showNotification('error', 'Hanya administrator yang memiliki wewenang menghapus kategori.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?\nTindakan ini juga dapat memengaruhi barang dengan kategori terkait.`)) {
      const filtered = categories.filter(c => c.id_kategori !== id);
      OfficeInventoryDb.saveKategori(filtered);
      OfficeInventoryDb.logActivity(currentUser?.id_user || 1, `Hapus Kategori: "${name}"`);
      showNotification('success', 'Kategori berhasil dihapus.');
      loadCategories();
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(cat => 
    cat.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.keterangan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" /> Master Kategori Barang
          </h2>
          <p className="text-sm text-gray-500">Kelola kategori klasifikasi inventaris barang kantor</p>
        </div>
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
          <button 
            id="add-category-btn"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition flex items-center gap-1.5 self-start text-sm"
          >
            <Plus className="h-4 w-4" /> Tambah Kategori
          </button>
        )}
      </div>

      {/* Notification banner */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
            <Check className="h-3 w-3" />
          </div>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search Filter bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        <input 
          id="search-category-input"
          type="text" 
          placeholder="Cari nama kategori atau keterangan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Responsive table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-16">ID</th>
              <th className="py-3 px-4">Nama Kategori</th>
              <th className="py-3 px-4">Keterangan</th>
              {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                <th className="py-3 px-4 text-center w-32">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-sm">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400 text-xs">
                  Tidak ada kategori yang cocok dengan pencarian Anda.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr key={cat.id_kategori} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">{cat.id_kategori}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{cat.nama_kategori}</td>
                  <td className="py-3 px-4 text-gray-600 line-clamp-1 max-w-md">{cat.keterangan || '-'}</td>
                  {(currentUser?.role === 'Admin' || currentUser?.role === 'Petugas') && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          id={`edit-category-${cat.id_kategori}`}
                          onClick={() => handleOpenEditModal(cat)}
                          title="Ubah Kategori"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {currentUser?.role === 'Admin' && (
                          <button 
                            id={`delete-category-${cat.id_kategori}`}
                            onClick={() => handleDelete(cat.id_kategori, cat.nama_kategori)}
                            title="Hapus Kategori"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editId !== null ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button 
                id="close-category-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="p-5 space-y-4">
                
                {/* Nama Kategori */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Kategori</label>
                  <input 
                    id="category-name-input"
                    type="text" 
                    required
                    placeholder="Contoh: Alat Jaringan & IT"
                    value={namaKategori}
                    onChange={(e) => setNamaKategori(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Keterangan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan / Deskripsi</label>
                  <textarea 
                    id="category-desc-input"
                    rows={4}
                    placeholder="Deskripsikan klasifikasi barang-barang yang termasuk kategori ini..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button 
                  id="cancel-category-btn"
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition text-sm"
                >
                  Batal
                </button>
                <button 
                  id="save-category-btn"
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition text-sm"
                >
                  {editId !== null ? 'Simpan Perubahan' : 'Tambahkan Kategori'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
