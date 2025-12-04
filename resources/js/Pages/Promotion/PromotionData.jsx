import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";

const PromotionData = () => {
    const { hasPermission } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterStorefront, setFilterStorefront] = useState("all");

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/promotions");

            let promotionsData = [];
            if (response.data.data && response.data.data.data) {
                promotionsData = Array.isArray(response.data.data.data) ? response.data.data.data : [];
            } else if (Array.isArray(response.data.data)) {
                promotionsData = response.data.data;
            }

            setPromotions(promotionsData);
            setError(null);
        } catch (err) {
            setError("Gagal memuat data promosi");
            console.error("Error fetching promotions:", err);
        } finally {
            setLoading(false);
        }
    };

    const saveOrder = async (ordered) => {
        try {
            const ids = ordered.map(p => p.id);
            await axios.post('/api/promotions/reorder', { ids });
        } catch (err) {
            console.error('Error reordering promotions:', err);
            Swal.fire('Error!', 'Gagal menyimpan urutan promosi.', 'error');
            await fetchPromotions();
        }
    };

    const handleMove = async (id, direction) => {
        const list = [...promotions];
        const index = list.findIndex(p => p.id === id);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        const temp = list[targetIndex];
        list[targetIndex] = list[index];
        list[index] = temp;

        setPromotions(list);
        await saveOrder(list);
        Swal.fire('Berhasil!', 'Urutan promosi diperbarui.', 'success');
    };

    const handleAddPromotion = () => {
        router.visit('/cms/promotion/create');
    };

    const handleEditPromotion = (id) => {
        router.visit(`/cms/promotion/edit/${id}`);
    };

    const deletePromotion = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Apakah Anda yakin?',
                text: 'Promosi yang dihapus tidak dapat dikembalikan',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Ya, hapus',
                cancelButtonText: 'Batal'
            });

            if (result.isConfirmed) {
                await axios.delete(`/api/promotions/${id}`);
                fetchPromotions();
                Swal.fire('Terhapus!', 'Promosi berhasil dihapus.', 'success');
            }
        } catch (err) {
            console.error('Error deleting promotion:', err);
            Swal.fire('Error!', 'Gagal menghapus promosi.', 'error');
        }
    };

    const toggleStatus = async (id) => {
        try {
            await axios.post(`/api/promotions/${id}/toggle-status`);
            fetchPromotions();
            Swal.fire('Berhasil!', 'Status promosi berhasil diubah.', 'success');
        } catch (err) {
            console.error('Error toggling status:', err);
            Swal.fire('Error!', 'Gagal mengubah status promosi.', 'error');
        }
    };

    const toggleStorefront = async (id) => {
        try {
            await axios.post(`/api/promotions/${id}/toggle-storefront`);
            fetchPromotions();
            Swal.fire('Berhasil!', 'Status storefront berhasil diubah.', 'success');
        } catch (err) {
            console.error('Error toggling storefront:', err);
            Swal.fire('Error!', 'Gagal mengubah status storefront.', 'error');
        }
    };

    const filteredPromotions = promotions.filter((promotion) => {
        const matchesSearch = promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (promotion.description && promotion.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && promotion.is_active) ||
            (filterStatus === "inactive" && !promotion.is_active);

        const matchesStorefront = filterStorefront === "all" ||
            (filterStorefront === "yes" && promotion.is_storefront) ||
            (filterStorefront === "no" && !promotion.is_storefront);

        return matchesSearch && matchesStatus && matchesStorefront;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Icon icon="line-md:loading-loop" className="text-4xl text-blue-500" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Daftar Promosi</h1>
                    <p className="text-gray-600">Kelola promosi dan informasi diskon</p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Cari promosi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Tidak Aktif</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filterStorefront}
                                onChange={(e) => setFilterStorefront(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Semua Storefront</option>
                                <option value="yes">Tampil di Storefront</option>
                                <option value="no">Tidak Tampil</option>
                            </select>
                        </div>
                        {hasPermission('promotions.create') && (
                            <div>
                                <button
                                    onClick={handleAddPromotion}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Icon icon="solar:add-circle-outline" className="text-xl" />
                                    Tambah Promosi
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Judul
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deskripsi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Periode
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Urutan
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Storefront
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPromotions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data promosi
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPromotions.map((promotion) => (
                                        <tr key={promotion.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {promotion.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 line-clamp-2">
                                                    {promotion.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>{formatDate(promotion.start_date)}</div>
                                                <div className="text-xs text-gray-500">s/d</div>
                                                <div>{formatDate(promotion.end_date)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {hasPermission('promotions.edit') && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleMove(promotion.id, 'up')}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                            title="Naik"
                                                            disabled={promotions.findIndex(p => p.id === promotion.id) === 0}
                                                        >
                                                            <Icon icon="solar:arrow-up-outline" className="text-lg" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMove(promotion.id, 'down')}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                            title="Turun"
                                                            disabled={promotions.findIndex(p => p.id === promotion.id) === promotions.length - 1}
                                                        >
                                                            <Icon icon="solar:arrow-down-outline" className="text-lg" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {hasPermission('promotions.toggle_status') ? (
                                                    <button
                                                        onClick={() => toggleStatus(promotion.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${promotion.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {promotion.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </button>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${promotion.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {promotion.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {hasPermission('promotions.toggle_storefront') ? (
                                                    <button
                                                        onClick={() => toggleStorefront(promotion.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${promotion.is_storefront
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {promotion.is_storefront ? 'Ya' : 'Tidak'}
                                                    </button>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${promotion.is_storefront
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {promotion.is_storefront ? 'Ya' : 'Tidak'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {hasPermission('promotions.edit') && (
                                                        <button
                                                            onClick={() => handleEditPromotion(promotion.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Icon icon="solar:pen-outline" className="text-xl" />
                                                        </button>
                                                    )}
                                                    {hasPermission('promotions.edit') && (
                                                        <button
                                                            onClick={() => deletePromotion(promotion.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Icon icon="solar:trash-bin-minimalistic-outline" className="text-xl" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-4 text-sm text-gray-600">
                    Menampilkan {filteredPromotions.length} dari {promotions.length} promosi
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PromotionData;
