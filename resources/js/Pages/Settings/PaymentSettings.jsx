import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import api from '@/api/axios';
import Swal from 'sweetalert2';

export default function PaymentSettings() {
  const [paymentBanks, setPaymentBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});

  // Fetch payment banks
  const fetchPaymentBanks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment-banks');
      if (response.data.status === 'success') {
        setPaymentBanks(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payment banks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data bank pembayaran'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentBanks();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.bank_name.trim()) newErrors.bank_name = 'Nama bank wajib diisi';
    if (!formData.account_name.trim()) newErrors.account_name = 'Nama akun wajib diisi';
    if (!formData.account_number.trim()) newErrors.account_number = 'Nomor rekening wajib diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingBank) {
        // Update existing bank
        const response = await api.put(`/payment-banks/${editingBank.id}`, formData);
        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Bank pembayaran berhasil diperbarui'
          });
        }
      } else {
        // Create new bank
        const response = await api.post('/payment-banks', formData);
        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Bank pembayaran berhasil ditambahkan'
          });
        }
      }
      
      // Reset form and refresh data
      resetForm();
      fetchPaymentBanks();
    } catch (error) {
      console.error('Error saving payment bank:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: editingBank ? 'Gagal memperbarui bank pembayaran' : 'Gagal menambahkan bank pembayaran'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_name: '',
      account_number: '',
      is_active: true
    });
    setEditingBank(null);
    setShowForm(false);
    setErrors({});
  };

  // Handle edit
  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name,
      account_name: bank.account_name,
      account_number: bank.account_number,
      is_active: bank.is_active
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (bank) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus bank ${bank.bank_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/payment-banks/${bank.id}`);
        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Bank pembayaran berhasil dihapus'
          });
          fetchPaymentBanks();
        }
      } catch (error) {
        console.error('Error deleting payment bank:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal menghapus bank pembayaran'
        });
      }
    }
  };

  // Toggle bank status
  const toggleBankStatus = async (bank) => {
    try {
      const response = await api.put(`/payment-banks/${bank.id}`, {
        ...bank,
        is_active: !bank.is_active
      });
      if (response.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: `Bank pembayaran berhasil ${!bank.is_active ? 'diaktifkan' : 'dinonaktifkan'}`
        });
        fetchPaymentBanks();
      }
    } catch (error) {
      console.error('Error toggling bank status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengubah status bank pembayaran'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan Payment Bank</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon icon="mdi:plus" className="w-4 h-4" />
          Tambah Bank
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingBank ? 'Edit Bank Pembayaran' : 'Tambah Bank Pembayaran'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bank *
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    errors.bank_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: Bank Central Asia (BCA)"
                />
                {errors.bank_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.bank_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Akun *
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    errors.account_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: PT Sales Management"
                />
                {errors.account_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.account_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 text-sm ${
                    errors.account_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: 1234567890"
                />
                {errors.account_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.account_number}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Aktif</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingBank ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Banks List */}
      <div className="bg-white rounded-lg shadow">
        {paymentBanks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Belum ada bank pembayaran yang terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Akun
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomor Rekening
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat Oleh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentBanks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bank.bank_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bank.account_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bank.account_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleBankStatus(bank)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bank.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {bank.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bank.created_by?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(bank)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Icon icon="mdi:pencil" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bank)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
