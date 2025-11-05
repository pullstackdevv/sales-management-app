import React, { useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight, Search, AlertCircle } from 'lucide-react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { formatCurrency } from '@/utils/helpers';
import axios from 'axios';

const TrackOrders = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Menunggu' },
            paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Lunas' },
            processing: { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Diproses' },
            shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Dikirim' },
            delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Selesai' },
            cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Dibatalkan' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchQuery.trim()) {
            setError('Masukkan nomor pesanan, email, atau nomor HP');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.post('/track-orders/search', {
                search_query: searchQuery
            });

            if (response.data.status === 'success') {
                setOrders(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total
                });
                setSearched(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mencari pesanan');
            setOrders([]);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = async (page) => {
        try {
            setLoading(true);
            const response = await axios.post('/track-orders/search', {
                search_query: searchQuery,
                page
            });

            if (response.data.status === 'success') {
                setOrders(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total
                });
            }
        } catch (err) {
            setError('Gagal memuat halaman');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lacak Pesanan</h1>
                        <p className="text-gray-600">Cari pesanan Anda menggunakan nomor pesanan, email, atau nomor HP</p>
                    </div>

                    {/* Search Form */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <form onSubmit={handleSearch}>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Nomor pesanan, email, atau nomor HP..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {loading ? 'Mencari...' : 'Cari'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Results */}
                    {searched && (
                        <>
                            {orders.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h3>
                                    <p className="text-gray-600">Silakan periksa kembali nomor pesanan, email, atau nomor HP Anda</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Ditemukan {pagination.total} pesanan
                                    </p>
                                    
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-6">
                                                {/* Order Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {order.order_number}
                                                            </h3>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(order.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 sm:mt-0 text-right">
                                                        <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                                                        <p className="text-xl font-bold text-blue-600">
                                                            {formatCurrency(order.total_price)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Customer Info */}
                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Email:</span> {order.customer_email}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">HP:</span> {order.customer_phone}
                                                    </p>
                                                </div>

                                                {/* Order Items */}
                                                <div className="space-y-3 mb-4">
                                                    {order.items && order.items.slice(0, 2).map((item, index) => (
                                                        <div key={index} className="flex items-center gap-4">
                                                            <img
                                                                src={item.product_variant?.product?.image 
                                                                    ? (item.product_variant.product.image.startsWith('http') 
                                                                        ? item.product_variant.product.image 
                                                                        : `/storage/${item.product_variant.product.image}`)
                                                                    : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg'
                                                                }
                                                                alt={item.product_name_snapshot}
                                                                className="w-16 h-16 object-cover rounded-lg"
                                                            />
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-gray-900 text-sm">
                                                                    {item.product_name_snapshot}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {item.quantity} × {formatCurrency(item.price)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {order.items && order.items.length > 2 && (
                                                        <p className="text-sm text-gray-500 ml-20">
                                                            +{order.items.length - 2} produk lainnya
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="mt-8 flex justify-center items-center space-x-4">
                                    <button
                                        onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                                        disabled={pagination.current_page === 1 || loading}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Sebelumnya
                                    </button>

                                    <span className="text-sm text-gray-500">
                                        Halaman {pagination.current_page} dari {pagination.last_page}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                                        disabled={pagination.current_page === pagination.last_page || loading}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Selanjutnya →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
};

export default TrackOrders;