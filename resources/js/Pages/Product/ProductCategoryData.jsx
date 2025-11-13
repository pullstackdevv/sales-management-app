import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import api from '@/api/axios';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function ProductCategoryData() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterActive, setFilterActive] = useState('all');

    useEffect(() => {
        fetchCategories();
    }, [currentPage, searchTerm, filterActive]);

    const fetchCategories = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page);
            
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            if (filterActive !== 'all') {
                params.append('is_active', filterActive === 'active');
            }

            const response = await api.get(`/product-categories?${params.toString()}`);
            const data = response.data.data;

            setCategories(data.data || []);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
                from: data.from,
                to: data.to
            });
            setCurrentPage(data.current_page);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Gagal memuat kategori produk');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: 'Hapus Kategori?',
            text: `Apakah Anda yakin ingin menghapus kategori "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/product-categories/${id}`);
                toast.success('Kategori berhasil dihapus');
                fetchCategories(currentPage);
            } catch (error) {
                console.error('Error deleting category:', error);
                if (error.response?.data?.message) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error('Gagal menghapus kategori');
                }
            }
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await api.patch(`/product-categories/${id}`, {
                is_active: !currentStatus
            });
            toast.success('Status kategori berhasil diubah');
            fetchCategories(currentPage);
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Gagal mengubah status kategori');
        }
    };

    return (
        <DashboardLayout>
            <Head title="Kategori Produk" />
            
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Kategori Produk</h1>
                            <p className="text-gray-600 mt-1">Kelola kategori produk Anda</p>
                        </div>
                        <Link
                            href="/cms/product/category/add"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Icon icon="solar:add-circle-outline" width="20" />
                            Tambah Kategori
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cari Kategori
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nama atau deskripsi..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={filterActive}
                                    onChange={(e) => {
                                        setFilterActive(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Tidak Aktif</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Memuat kategori...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-8 text-center">
                                <Icon icon="solar:folder-outline" width="48" className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Tidak ada kategori ditemukan</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                    Nama Kategori
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                    Deskripsi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                    Dibuat Oleh
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {categories.map((category) => (
                                                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {category.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {category.slug}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-600 line-clamp-2">
                                                            {category.description || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleToggleActive(category.id, category.is_active)}
                                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                                                category.is_active
                                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            <Icon
                                                                icon={category.is_active ? 'solar:check-circle-outline' : 'solar:close-circle-outline'}
                                                                width="14"
                                                            />
                                                            {category.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {category.created_by?.name || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={`/cms/product/category/edit/${category.id}`}
                                                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Icon icon="solar:pen-outline" width="18" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(category.id, category.name)}
                                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Icon icon="solar:trash-bin-outline" width="18" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination && pagination.last_page > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Menampilkan {pagination.from} hingga {pagination.to} dari {pagination.total} kategori
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Sebelumnya
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-blue-600 text-white'
                                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                                disabled={currentPage === pagination.last_page}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Berikutnya
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
