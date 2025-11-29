import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight, Search, Phone, Mail, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { formatCurrency } from '@/utils/helpers';
import checkoutSession from '@/utils/checkoutSession';
import Swal from 'sweetalert2';
import api from '@/api/axios';
import axios from 'axios';

const MyOrders = ({ orders: initialOrders, needsCustomerData }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCustomerForm, setShowCustomerForm] = useState(needsCustomerData || false);
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    
    // Verification states
    const [showVerification, setShowVerification] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState('phone');
    const [verificationInput, setVerificationInput] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [pendingCustomer, setPendingCustomer] = useState(null);

    const [orders, setOrders] = useState(initialOrders?.data || []);
    const [pagination, setPagination] = useState({
        current_page: initialOrders?.current_page || 1,
        last_page: initialOrders?.last_page || 1,
        total: initialOrders?.total || 0
    });
    const [currentPage, setCurrentPage] = useState(initialOrders?.current_page || 1);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [checkingPaymentOrderId, setCheckingPaymentOrderId] = useState(null);

    useEffect(() => {
        // Check if customer data exists in checkout session
        const sessionData = checkoutSession.get();
        if (!sessionData || !sessionData.customer) {
            setShowCustomerForm(true);
        } else {
            setShowCustomerForm(false);
        }
    }, []);

    // Fetch orders for external user via public track-orders search
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoadingOrders(true);

                const sessionData = checkoutSession.get();
                const customer = sessionData?.customer || {};
                const searchBase = (searchQuery && searchQuery.trim().length >= 3)
                    ? searchQuery.trim()
                    : (customer.phone || customer.email || '');

                if (!searchBase || searchBase.trim().length < 3) {
                    setOrders([]);
                    setPagination({ current_page: 1, last_page: 1, total: 0 });
                    return;
                }

                const response = await axios.post(`/track-orders/search?page=${currentPage}`,
                    {
                        search_query: searchBase,
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                    },
                    { headers: { 'Accept': 'application/json' } }
                );

                if (response.data.status === 'success') {
                    const data = response.data.data;
                    setOrders(data.data || []);
                    setPagination({
                        current_page: data.current_page || 1,
                        last_page: data.last_page || 1,
                        total: data.total || 0,
                    });
                }
            } catch (error) {
                console.error('Failed to load orders history:', error);
                setOrders([]);
                setPagination({ current_page: 1, last_page: 1, total: 0 });
            } finally {
                setLoadingOrders(false);
            }
        };

        // Hanya fetch ketika form customer tidak sedang ditampilkan (customer sudah terverifikasi)
        if (!showCustomerForm) {
            fetchOrders();
        }
        
    }, [searchQuery, statusFilter, currentPage, showCustomerForm]);

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
        setCurrentPage(1);
    };

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleResetCheckoutSession = () => {
        Swal.fire({
            title: 'Logout dari Riwayat Pesanan?',
            text: 'Ini akan menghapus data customer (checkout_data) yang tersimpan di session dan Anda perlu login/pilih customer lagi.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, logout',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                checkoutSession.clear();
                window.location.reload();
            }
        });
    };

    const isWebOrder = (order) => {
        return order?.payment_url && order.payment_url.trim() !== '';
    };

    const getPaymentMethodName = (order) => {
        if (order?.payments && order.payments.length > 0) {
            return order.payments[0]?.payment_bank?.name || 'Manual Transfer';
        }
        if (isWebOrder(order)) {
            const url = order.payment_url.toLowerCase();
            if (url.includes('midtrans')) return 'Midtrans';
            if (url.includes('xendit')) return 'Xendit';
            return 'Online Payment';
        }
        return 'Manual Transfer';
    };

    const handleCheckPaymentStatus = async (order) => {
        if (!order?.order_number) return;
        try {
            setCheckingPaymentOrderId(order.id);
            const response = await api.get(`/payment/status/${order.order_number}`);
            const data = response?.data?.data || response?.data || {};
            const newStatus = data.payment_status || data.order?.payment_status || order.payment_status;

            if (newStatus) {
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: newStatus } : o));
            }
        } catch (error) {
            console.error('Failed to check payment status:', error);
        } finally {
            setCheckingPaymentOrderId(null);
        }
    };

    // Search customers by name (using same method as CustomerDataCheckout)
    const searchCustomers = async (query) => {
        if (!query || query.trim().length < 2) {
            setCustomers([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await api.get('/customers', {
                params: {
                    search: query,
                    per_page: 10
                }
            });
            if (response.data.status === 'success') {
                setCustomers(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle customer selection - show verification modal
    const handleCustomerSelect = (customer) => {
        setPendingCustomer(customer);
        setVerificationInput('');
        setVerificationError('');
        setVerificationMethod('phone'); // Default to phone
        setShowVerification(true);
        setCustomers([]);
        setSearchTerm(customer.name || customer.full_name);
    };

    const handleVerification = () => {
        setVerificationError('');

        if (!verificationInput.trim()) {
            setVerificationError(verificationMethod === 'phone' ? 'Nomor HP wajib diisi' : 'Email wajib diisi');
            return;
        }

        // Normalize phone numbers for comparison
        const normalizePhone = (phone) => {
            return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+62/, '0').replace(/^62/, '0');
        };

        if (verificationMethod === 'phone') {
            const customerPhone = normalizePhone(pendingCustomer.phone || '');
            const inputPhone = normalizePhone(verificationInput);

            if (customerPhone !== inputPhone) {
                setVerificationError('Nomor HP tidak sesuai dengan data customer');
                return;
            }
        } else {
            const customerEmail = (pendingCustomer.email || '').toLowerCase().trim();
            const inputEmail = verificationInput.toLowerCase().trim();

            if (!customerEmail) {
                setVerificationError('Customer ini tidak memiliki email terdaftar');
                return;
            }

            if (customerEmail !== inputEmail) {
                setVerificationError('Email tidak sesuai dengan data customer');
                return;
            }
        }

        // Verified, save to session
        checkoutSession.updateStep('customer', {
            phone: pendingCustomer.phone,
            email: pendingCustomer.email,
            customer_id: pendingCustomer.id
        });

        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Data berhasil diverifikasi',
            showConfirmButton: false,
            timer: 1500
        });

        setShowVerification(false);
        setShowCustomerForm(false);
        
        // Reload page to fetch orders
        router.reload();
    };

    const handleCancelVerification = () => {
        setShowVerification(false);
        setVerificationInput('');
        setVerificationError('');
        setPendingCustomer(null);
    };
console.log(orders)
    // Show customer data form if needed
    if (showCustomerForm) {
        return (
            <MarketplaceLayout>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-md mx-auto px-4">
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <div className="text-center mb-6">
                                <Package className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Cari Data Customer
                                </h2>
                                <p className="text-gray-600">
                                    Masukkan nama Anda untuk melihat riwayat pesanan
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Search Customer Input */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Search className="w-4 h-4 inline mr-1" />
                                        Nama Customer
                                    </label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            searchCustomers(e.target.value);
                                        }}
                                        placeholder="Cari berdasarkan nama..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    
                                    {/* Customer Search Results Dropdown */}
                                    {searchTerm && customers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {customers.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    onClick={() => handleCustomerSelect(customer)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="font-medium text-gray-900">
                                                        {customer.name || customer.full_name}
                                                    </div>
                                                    {customer.phone && (
                                                        <div className="text-sm text-gray-600">
                                                            HP: {customer.phone.substring(0, 4)}****{customer.phone.slice(-4)}
                                                        </div>
                                                    )}
                                                    {customer.email && (
                                                        <div className="text-sm text-gray-600">
                                                            Email: {customer.email.substring(0, 2)}****@{customer.email.split('@')[1]}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {searchLoading && (
                                        <div className="absolute right-3 top-10 text-gray-400">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                    
                                    {searchTerm && !searchLoading && customers.length === 0 && searchTerm.length >= 2 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                                            Tidak ada customer ditemukan
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 text-center">
                                    Ketik minimal 2 karakter untuk mencari
                                </p>
                            </div>
                        </div>

                        {/* Verification Modal */}
                        {showVerification && pendingCustomer && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                    <h3 className="text-lg font-semibold mb-4">Verifikasi Data Customer</h3>
                                    
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Customer Ditemukan:</p>
                                        <p className="font-medium text-gray-900">{pendingCustomer.name || pendingCustomer.full_name}</p>
                                        {pendingCustomer.phone && (
                                            <p className="text-sm text-gray-600">
                                                HP: {pendingCustomer.phone.substring(0, 4)}****{pendingCustomer.phone.slice(-4)}
                                            </p>
                                        )}
                                        {pendingCustomer.email && (
                                            <p className="text-sm text-gray-600">
                                                Email: {pendingCustomer.email.substring(0, 2)}****@{pendingCustomer.email.split('@')[1]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Verification Method Toggle */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pilih Metode Verifikasi
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVerificationMethod('phone');
                                                    setVerificationError('');
                                                }}
                                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                                    verificationMethod === 'phone'
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                                }`}
                                            >
                                                <Phone className="w-4 h-4 inline-block mr-2" />
                                                HP
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVerificationMethod('email');
                                                    setVerificationError('');
                                                }}
                                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                                    verificationMethod === 'email'
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                                }`}
                                                disabled={!pendingCustomer.email}
                                            >
                                                <Mail className="w-4 h-4 inline-block mr-2" />
                                                Email
                                            </button>
                                        </div>
                                    </div>

                                    {/* Verification Input */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {verificationMethod === 'phone' ? 'Masukkan Nomor HP *' : 'Masukkan Email *'}
                                        </label>
                                        <input
                                            type={verificationMethod === 'phone' ? 'tel' : 'email'}
                                            value={verificationInput}
                                            onChange={(e) => {
                                                setVerificationInput(e.target.value);
                                                setVerificationError('');
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleVerification();
                                                } else if (e.key === 'Escape') {
                                                    handleCancelVerification();
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                verificationError ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder={verificationMethod === 'phone' ? '08123456789' : 'email@example.com'}
                                            autoFocus
                                        />
                                        {verificationError && (
                                            <p className="text-red-500 text-sm mt-1">{verificationError}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCancelVerification}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVerification}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Verifikasi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">Pesanan Saya</h1>
                            <p className="text-gray-600">Kelola dan pantau status pesanan Anda</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetCheckoutSession}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white"
                        >
                            <LogOut className="w-4 h-4 mr-1" />
                            Logout
                        </button>
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
                    {loadingOrders ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Memuat pesanan...</p>
                        </div>
                    ) : orders.length === 0 ? (
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

                                        {/* Order Detail Summary (expand on click) */}
                                        {expandedOrderId === order.id && (
                                            <div className="space-y-4 mb-4 text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                                                {/* Informasi Order */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Order</p>
                                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                                            ID #{order.order_number}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            {order.ordered_at
                                                                ? formatDate(order.ordered_at)
                                                                : formatDate(order.created_at)}
                                                        </p>

                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status bayar & Total Bayar</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="capitalize text-gray-700">
                                                                {order.payment_status || 'Tidak diketahui'}
                                                            </span>
                                                            <span className="font-semibold text-gray-900">
                                                                {formatCurrency(order.total_price || 0)}
                                                            </span>
                                                        </div>
                                                        {order.payments && order.payments.length > 0 && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Dibayar pada: {order.payments[0].paid_at
                                                                    ? formatDate(order.payments[0].paid_at)
                                                                    : '-'}
                                                            </p>
                                                        )}
                                                        {order.voucher && (
                                                            <p className="mt-2 text-xs text-gray-500">
                                                                Voucher: <span className="font-medium">{order.voucher.code}</span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Kurir</p>
                                                        <p className="flex justify-between mb-1">
                                                            <span className="text-gray-700">
                                                                {order.shipping?.courier?.name || 'Kurir - Reguler'} - {order.shipping.courier_rate?.service_type || 'Reguler'}
                                                            </span>
                                                            <span className="font-medium">
                                                                {formatCurrency(order.shipping_cost || 0)}
                                                            </span>
                                                        </p>
                                                        {order.shipping?.tracking_number && (
                                                            <p className="flex justify-between mt-1 text-xs">
                                                                <span className="text-gray-600">Resi</span>
                                                                <span className="font-mono">{order.shipping.tracking_number}</span>
                                                            </p>
                                                        )}
                                                        <p className="mt-3 text-xs font-semibold text-gray-500 uppercase mb-1">Metode Bayar</p>
                                                        <p className="flex justify-between">
                                                            <span className="text-gray-700">{getPaymentMethodName(order)}</span>
                                                        </p>
                                                        {isWebOrder(order) && (
                                                            <div className="mt-2 flex flex-wrap gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCheckPaymentStatus(order)}
                                                                    disabled={checkingPaymentOrderId === order.id}
                                                                    className="inline-flex items-center space-x-1 text-green-600 hover:text-green-800 text-xs disabled:opacity-50"
                                                                >
                                                                    <RefreshCw className={`w-4 h-4 ${checkingPaymentOrderId === order.id ? 'animate-spin' : ''}`} />
                                                                    <span>{checkingPaymentOrderId === order.id ? 'Mengecek...' : 'Cek Status'}</span>
                                                                </button>
                                                                <a
                                                                    href={order.payment_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    <span>Payment URL</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Dikirim Ke & Catatan */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dikirim Ke</p>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {order.address?.recipient_name || order.customer?.name || '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                                                            {order.address ? (
                                                                [
                                                                    order.address.address_detail,
                                                                    order.address.district,
                                                                    `${order.address.city || ''}${order.address.city && order.address.province ? ', ' : ''}${order.address.province || ''}`,
                                                                    order.address.postal_code
                                                                ].filter(Boolean).join('\n')
                                                            ) : '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Telp: {order.address?.phone || order.customer?.phone || '-'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Catatan</p>
                                                        <p className="text-sm text-gray-700 min-h-[1.5rem]">
                                                            {order.notes || '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Admin: {order.createdBy?.name || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                {expandedOrderId === order.id ? 'Tutup Detail' : 'Lihat Detail'}
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </button>
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
