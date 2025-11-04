import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import API_ROUTES from "../../api/routes";
import Swal from "sweetalert2";

export default function CourierSettings() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch couriers from API
  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.couriers.index);
      const couriersData = response.data.data?.data || response.data.data || [];
      setCouriers(Array.isArray(couriersData) ? couriersData : []);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data courier");
      console.error("Error fetching couriers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle add courier
  const handleAddCourier = () => {
    setEditingCourier(null);
    setFormData({ name: "", cost: "", is_active: true });
    setFormErrors({});
    setShowModal(true);
  };

  // Handle edit courier
  const handleEditCourier = (courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      cost: courier.cost || "",
      is_active: courier.is_active
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      if (editingCourier) {
        // Update courier
        await api.put(API_ROUTES.couriers.update(editingCourier.id), formData);
        Swal.fire('Berhasil!', 'Courier berhasil diperbarui.', 'success');
      } else {
        // Create courier
        await api.post(API_ROUTES.couriers.store, formData);
        Swal.fire('Berhasil!', 'Courier berhasil ditambahkan.', 'success');
      }
      setShowModal(false);
      fetchCouriers();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        Swal.fire('Error!', 'Gagal menyimpan courier.', 'error');
      }
    }
  };

  // Handle delete courier
  const handleDeleteCourier = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Courier yang dihapus tidak dapat dikembalikan',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        await api.delete(API_ROUTES.couriers.destroy(id));
        fetchCouriers();
        Swal.fire('Terhapus!', 'Courier berhasil dihapus.', 'success');
      }
    } catch (err) {
      console.error('Error deleting courier:', err);
      Swal.fire('Error!', 'Gagal menghapus courier.', 'error');
    }
  };

  // Handle view courier rates
  const handleViewRates = (courier) => {
    // Navigate to courier rates page with courier filter
    window.location.href = `/cms/settings/courier-rates?courier_id=${courier.id}`;
  };

  // Filter couriers based on search term
  const filteredCouriers = Array.isArray(couriers) ? couriers.filter((courier) =>
    courier.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  useEffect(() => {
    fetchCouriers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Courier</h2>
          <p className="text-gray-600 mt-1">Kelola data courier untuk pengiriman</p>
        </div>
        <button
          onClick={handleAddCourier}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Icon icon="solar:add-circle-outline" className="w-5 h-5" />
          Tambah Courier
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-medium">Error!</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Courier</p>
                  <p className="text-2xl font-bold text-gray-900">{couriers.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Icon icon="solar:delivery-outline" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Courier Aktif</p>
                  <p className="text-2xl font-bold text-green-600">
                    {couriers.filter(c => c.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Icon icon="solar:check-circle-outline" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Courier Nonaktif</p>
                  <p className="text-2xl font-bold text-red-600">
                    {couriers.filter(c => !c.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Icon icon="solar:close-circle-outline" className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="relative">
              <Icon
                icon="solar:magnifer-outline"
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari courier berdasarkan nama..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Couriers Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Courier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Biaya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dibuat Oleh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Dibuat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCouriers.map((courier) => (
                    <tr key={courier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {courier.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {courier.cost ? `Rp ${Number(courier.cost).toLocaleString('id-ID')}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            courier.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {courier.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {courier.created_by?.name || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {courier.created_by?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(courier.created_at).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(courier.created_at).toLocaleTimeString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {courier.name.toLowerCase().includes('tiki') && (
                            <button
                              onClick={() => handleViewRates(courier)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Lihat Tarif"
                            >
                              <Icon icon="solar:list-check-outline" className="w-4 h-4" />
                            </button>
                          )}
                          {!courier.name.toLowerCase().includes('tiki') && (
                            <button
                              onClick={() => handleEditCourier(courier)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Edit"
                            >
                              <Icon icon="solar:pen-outline" className="w-4 h-4" />
                            </button>
                          )}
                          {!courier.name.toLowerCase().includes('tiki') && (
                            <button
                              onClick={() => handleDeleteCourier(courier.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Hapus"
                            >
                              <Icon icon="solar:trash-bin-minimalistic-outline" className="w-4 h-4" />
                            </button>
                          )}
                          {courier.name.toLowerCase().includes('tiki') && (
                            <span className="text-gray-400 text-xs px-2 py-1 bg-gray-100 rounded">
                              Tidak dapat diedit/hapus
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCouriers.length === 0 && (
              <div className="text-center py-12">
                <Icon
                  icon="solar:delivery-outline"
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada courier ditemukan
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? "Coba ubah kata kunci pencarian" : "Belum ada data courier"}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal for Add/Edit Courier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourier ? "Edit Courier" : "Tambah Courier"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Courier *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Masukkan nama courier"
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biaya
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.cost ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Masukkan biaya courier"
                />
                {formErrors.cost && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cost[0]}</p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCourier ? "Perbarui" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
