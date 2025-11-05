import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight, Search } from 'lucide-react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { formatCurrency } from '@/utils/helpers';

const MyOrders = ({ orders: initialOrders }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const orders = initialOrders.data || [];
    const pagination = {
        current_page: initialOrders.current_page,
        last_page: initialOrders.last_page,
        total: initialOrders.total
    };

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

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/orders', { 
            search: searchQuery,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }, {
            preserveState: true
        });
    };

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        router.get('/orders', { 
            status: status !== 'all' ? status : undefined,
            search: searchQuery || undefined
        }, {
            preserveState: true
        });
    };

    const handlePageChange = (page) => {
        router.get('/orders', { 
            page,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: searchQuery || undefined
        }, {
            preserveState: true
        });
    };

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Saya</h1>
                        <p className="text-gray-600">Kelola dan pantau status pesanan Anda</p>
                    </div>

                    {/* Search and Filter */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Cari nomor pesanan..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </form>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="paid">Lunas</option>
                                <option value="processing">Diproses</option>
                                <option value="shipped">Dikirim</option>
                                <option value="delivered">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>
                    </div>

                    {/* Orders List */}
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pesanan</h3>
                            <p className="text-gray-600 mb-6">Anda belum memiliki pesanan. Mulai berbelanja sekarang!</p>
                            <Link
                                href="/"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Mulai Belanja
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
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

                                        {/* Actions */}
                                        <div className="flex justify-end">
                                            <Link
                                                href={`/orders/${order.order_number}`}
                                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Lihat Detail
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Link>
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
                                disabled={pagination.current_page === 1}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Sebelumnya
                            </button>

                            <span className="text-sm text-gray-500">
                                Halaman {pagination.current_page} dari {pagination.last_page}
                            </span>

                            <button
                                onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
};

export default MyOrders;