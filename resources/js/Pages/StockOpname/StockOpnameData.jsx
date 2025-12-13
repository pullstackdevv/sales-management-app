import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Link, router } from "@inertiajs/react";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function StockOpnamePage() {
    const [stockOpnames, setStockOpnames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        date_from: '',
        date_to: '',
        warehouse: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStockOpname, setSelectedStockOpname] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchStockOpnames();
    }, [searchTerm, filters, pagination.current_page]);

    const fetchStockOpnames = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                per_page: pagination.per_page,
                search: searchTerm,
                ...filters
            };
            
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });
            
            const response = await api.get('/stock-opnames', { params });
            const data = response.data.data;
            setStockOpnames(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 10,
                total: data.total || 0
            });
        } catch (error) {
            console.error('Error fetching stock opnames:', error);
            setStockOpnames([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            date_from: '',
            date_to: '',
            warehouse: ''
        });
        setSearchTerm('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Stok Opname?',
            text: 'Data yang dihapus tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/stock-opnames/${id}`);
                Swal.fire('Berhasil!', 'Stok opname berhasil dihapus.', 'success');
                fetchStockOpnames(pagination.current_page);
            } catch (error) {
                console.error('Error deleting stock opname:', error);
                Swal.fire('Error!', 'Gagal menghapus stok opname.', 'error');
            }
        }
    };

    const handleFinalize = async (id) => {
        const result = await Swal.fire({
            title: 'Finalisasi Stock Opname?',
            text: 'Stock opname yang sudah difinalisasi tidak dapat diubah lagi!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Finalisasi!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/stock-opnames/${id}/finalize`);
                Swal.fire('Berhasil!', 'Stock opname berhasil difinalisasi.', 'success');
                fetchStockOpnames(pagination.current_page);
            } catch (error) {
                console.error('Error finalizing stock opname:', error);
                Swal.fire('Error!', 'Gagal memfinalisasi stock opname.', 'error');
            }
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const fetchStockOpnameDetail = async (id) => {
        try {
            setDetailLoading(true);
            const response = await api.get(`/stock-opnames/${id}`);
            setSelectedStockOpname(response.data.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching stock opname detail:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Gagal memuat detail stock opname',
                icon: 'error'
            });
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedStockOpname(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
            finalized: { color: 'bg-green-100 text-green-800', text: 'Finalized' }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Stok Opname</h1>

                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <div className="flex gap-2 flex-1">
                        <input
                            type="text"
                            placeholder="Cari keterangan stok opname..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="border text-sm px-4 py-2 rounded-md w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {(searchTerm || Object.values(filters).some(f => f)) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm border px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-1 text-gray-600"
                            >
                                <Icon icon="material-symbols:clear" className="text-lg" />
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`text-sm border px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-1 ${
                                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
                            }`}
                        >
                            <Icon
                                icon="material-symbols:filter-alt-outline"
                                className="text-lg"
                            />
                            Filter
                        </button>
                        <Link href="/cms/stock-opname/add">
                            <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1">
                                <Icon
                                    icon="material-symbols:add"
                                    className="text-lg"
                                />
                                Buat Baru
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="finalized">Finalized</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gudang</label>
                                <select
                                    value={filters.warehouse}
                                    onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Semua Gudang</option>
                                    <option value="Gudang Utama">Gudang Utama</option>
                                    <option value="Gudang Cabang">Gudang Cabang</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Dari</label>
                                <input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Sampai</label>
                                <input
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-md shadow-sm divide-y overflow-auto">
                    <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                        <div className="col-span-2">Tanggal Stok Opname</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Dibuat Oleh</div>
                        <div className="col-span-2">Jumlah Produk</div>
                        <div className="col-span-2">Keterangan</div>
                        <div className="col-span-1">Aksi</div>
                    </div>

                    {loading ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Icon icon="eos-icons:loading" className="text-2xl mx-auto mb-2" />
                            Memuat data...
                        </div>
                    ) : stockOpnames.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            Tidak ada data stok opname
                        </div>
                    ) : (
                        stockOpnames.map((item) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-gray-50"
                            >
                                <div className="col-span-2">
                                    {formatDate(item.opname_date)}
                                </div>
                                <div className="col-span-2">
                                    {getStatusBadge(item.status)}
                                </div>
                                <div className="col-span-3">
                                    {item.created_by?.name || 'N/A'}
                                </div>
                                <div className="col-span-2">
                                    {item.details?.length || 0} produk
                                </div>
                                <div className="col-span-2 text-gray-700">
                                    {item.note || '-'}
                                </div>
                                <div className="col-span-1">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchStockOpnameDetail(item.id)}
                                            disabled={detailLoading}
                                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                            title="Lihat Detail"
                                        >
                                            <Icon icon="material-symbols:visibility" className="text-lg" />
                                        </button>
                                        
                                        {item.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => handleFinalize(item.id)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Finalisasi Stock Opname"
                                                >
                                                    <Icon icon="material-symbols:check-circle" className="text-lg" />
                                                </button>
                                                
                                                <Link href={`/cms/stock-opname/edit/${item.id}`}>
                                                    <button
                                                        className="text-yellow-600 hover:text-yellow-800"
                                                        title="Edit Stock Opname"
                                                    >
                                                        <Icon icon="material-symbols:edit" className="text-lg" />
                                                    </button>
                                                </Link>
                                                
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Hapus Stock Opname"
                                                >
                                                    <Icon icon="material-symbols:delete" className="text-lg" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                            Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1} sampai {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page <= 1}
                                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                const page = pagination.current_page <= 3 
                                    ? i + 1 
                                    : pagination.current_page + i - 2;
                                
                                if (page > pagination.last_page) return null;
                                
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 text-sm border rounded-md ${
                                            page === pagination.current_page
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page >= pagination.last_page}
                                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail Produk */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Detail Produk Stock Opname #{selectedStockOpname?.id}
                            </h3>
                            <button
                                onClick={closeDetailModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icon icon="material-symbols:close" className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {/* Info Stock Opname */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Tanggal</label>
                                    <p className="text-sm text-gray-900">{formatDate(selectedStockOpname?.opname_date)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedStockOpname?.status)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Dibuat Oleh</label>
                                    <p className="text-sm text-gray-900">{selectedStockOpname?.created_by?.name || 'N/A'}</p>
                                </div>
                                {selectedStockOpname?.note && (
                                    <div className="md:col-span-3">
                                        <label className="text-sm font-medium text-gray-600">Keterangan</label>
                                        <p className="text-sm text-gray-900">{selectedStockOpname.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* Detail Produk */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Detail Produk ({selectedStockOpname?.details?.length || 0} item)</h4>
                                
                                <div className="bg-white border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-12 px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                                        <div className="col-span-3">Produk</div>
                                        <div className="col-span-2">Varian</div>
                                        <div className="col-span-2">Stok Sistem</div>
                                        <div className="col-span-2">Stok Fisik</div>
                                        <div className="col-span-2">Selisih</div>
                                        <div className="col-span-1">Status</div>
                                    </div>
                                    
                                    {selectedStockOpname?.details?.map((detail, index) => (
                                        <div key={index} className="grid grid-cols-12 px-4 py-3 text-sm border-b last:border-b-0 hover:bg-gray-50">
                                            <div className="col-span-3">
                                                <p className="font-medium text-gray-900">{detail.product_variant?.product?.name}</p>
                                                <p className="text-xs text-gray-500">SKU: {detail.product_variant?.sku}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-900">{detail.product_variant?.variant_label || 'Default'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-900">{detail.system_stock}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-900">{detail.real_stock}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className={`font-medium ${
                                                    detail.difference > 0 ? 'text-green-600' : 
                                                    detail.difference < 0 ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                    {detail.difference > 0 ? '+' : ''}{detail.difference}
                                                </p>
                                            </div>
                                            <div className="col-span-1">
                                                {detail.difference === 0 ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Sesuai
                                                    </span>
                                                ) : detail.difference > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Lebih
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Kurang
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end p-6 border-t bg-gray-50">
                            <button
                                onClick={closeDetailModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
