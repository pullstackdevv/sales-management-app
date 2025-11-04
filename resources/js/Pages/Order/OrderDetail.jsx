import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout.jsx';
import { ChevronLeft, MessageCircle, Copy, Settings, Eye, Truck, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';
import PaymentHistoryModal from '../../components/ui/modal/PaymentHistoryModal';
import OrderHistoryModal from '../../components/ui/modal/OrderHistoryModal';

export default function OrderDetail({ auth, order }) {
    const [orderData, setOrderData] = useState(order || null);
    const [loading, setLoading] = useState(!order);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);

    useEffect(() => {
        if (!order && window.location.pathname.includes('/order/detail/')) {
            const orderId = window.location.pathname.split('/').pop();
            fetchOrderDetail(orderId);
        }
    }, [order]);

    const fetchOrderDetail = async (orderId) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                setOrderData(result.data); // API returns data in result.data
            } else {
                toast.error('Gagal memuat detail order');
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = () => {
        toast.info('Fitur kirim pesan akan segera tersedia');
    };

    const handleCopyOrderDetails = () => {
        if (!orderData) return;
        
        const orderDetails = `
Order #${orderData.order_number || orderData.id}
Tanggal: ${new Date(orderData.created_at).toLocaleDateString('id-ID')}
Customer: ${orderData.customer?.name || '-'}
Alamat: ${orderData.shipping_address || '-'}
Telp: ${orderData.customer?.phone || '-'}

Produk:
${orderData.items?.map(item => 
    `- ${item.product_name_snapshot || item.product_variant?.product?.name} ${item.variant_label ? `(${item.variant_label})` : ''}
  ${item.quantity} x Rp${item.price?.toLocaleString('id-ID', { maximumFractionDigits: 0 })} = Rp${item.subtotal?.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
).join('\n') || 'Tidak ada produk'}
Ongkir: Rp${orderData.shipping_cost?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}
Total: Rp${orderData.total_price?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}

Status: ${getStatusLabel(orderData.payment_status)}
Kurir: ${orderData.shipping?.courier?.name || 'Kurir'} - ${orderData.shipping?.service_type || 'Reguler'}
Resi: ${orderData.shipping?.tracking_number || '-'}
        `;
        
        navigator.clipboard.writeText(orderDetails).then(() => {
            toast.success('Detail order berhasil disalin!');
        }).catch(() => {
            toast.error('Gagal menyalin detail order');
        });
    };

    const handleManageOrder = () => {
        if (orderData?.id) {
            router.visit(`/order/manage/${orderData.id}`);
        }
    };

    const handleCheckPaymentStatus = async () => {
        if (!orderData?.payment_url) return;
        
        setCheckingPayment(true);
        try {
            const response = await api.post(`/orders/${orderData.id}/check-payment`);
            if (response.data.success) {
                setOrderData(prev => ({
                    ...prev,
                    payment_status: response.data.payment_status
                }));
                toast.success('Status pembayaran berhasil diperbarui');
            }
        } catch (error) {
            console.error('Error checking payment:', error);
            toast.error('Gagal mengecek status pembayaran');
        } finally {
            setCheckingPayment(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid':
                return 'Lunas';
            case 'pending':
                return 'Menunggu';
            case 'failed':
                return 'Gagal';
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return 'Tidak Diketahui';
        }
    };

    const isWebOrder = () => {
        return orderData?.payment_url && orderData?.payment_url.trim() !== '';
    };

    if (loading) {
        return (
            <DashboardLayout user={auth.user}>
                <Head title="Detail Order" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Memuat detail order...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!orderData) {
        return (
            <DashboardLayout user={auth.user}>
                <Head title="Detail Order" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-gray-600">Order tidak ditemukan</p>
                        <Link href="/cms/order/data" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                            Kembali ke daftar order
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Calculate totals with base_price from order_items table
    const totalSellingPrice = orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const totalProductCost = orderData.items?.reduce((sum, item) => sum + ((item.base_price || 0) * item.quantity), 0) || 0;
    const profit = totalSellingPrice - totalProductCost;

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`Order #${orderData.order_number || orderData.id}`} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white shadow-sm rounded-lg mb-6">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Link href="/cms/order/data" className="text-gray-600 hover:text-gray-800">
                                        <ChevronLeft className="w-6 h-6" />
                                    </Link>
                                    <h1 className="text-2xl font-bold text-gray-900">Order</h1>
                                </div>
                                
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowOrderHistory(true)}
                                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Riwayat Order</span>
                                    </button>
                                    
                                    <button
                                        onClick={handleManageOrder}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Atur Order</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <span className="text-2xl">💰</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total harga jual produk</p>
                                    <p className="text-xl font-bold">Rp{totalSellingPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <span className="text-2xl">💼</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total harga modal produk</p>
                                    <p className="text-xl font-bold">Rp{totalProductCost.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <span className="text-2xl">📈</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Profit</p>
                                    <p className="text-xl font-bold">Rp{profit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Order Information */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Order ID #{orderData.order_number || orderData.id}</h3>
                                        <p className="text-sm text-gray-600">{new Date(orderData.created_at).toLocaleDateString('id-ID', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Status bayar & Total Bayar</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderData.payment_status)}`}>
                                                    {getStatusLabel(orderData.payment_status)}
                                                </span>
                                                <div className="text-sm text-gray-600">
                                                    <div>{new Date(orderData.created_at).toLocaleDateString('id-ID')}</div>
                                                    {orderData.payments?.[0]?.payment_bank ? (
                                                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                                                            <div className="font-semibold text-gray-800">{orderData.payments[0].payment_bank.bank_name}</div>
                                                            <div className="text-xs text-gray-600">No. Rekening: {orderData.payments[0].payment_bank.account_number}</div>
                                                            <div className="text-xs text-gray-600">Atas Nama: {orderData.payments[0].payment_bank.account_name}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500">Manual Transfer</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {isWebOrder() && (
                                                    <>
                                                        <button 
                                                            onClick={handleCheckPaymentStatus}
                                                            disabled={checkingPayment}
                                                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
                                                        >
                                                            <RefreshCw className={`w-4 h-4 ${checkingPayment ? 'animate-spin' : ''}`} />
                                                            <span>{checkingPayment ? 'Mengecek...' : 'Cek Status'}</span>
                                                        </button>
                                                        <a 
                                                            href={orderData.payment_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            <span>Payment URL</span>
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold mt-2">Rp{orderData.total_price?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</p>
                                        {isWebOrder() && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                                <p className="text-xs text-blue-700">
                                                    <span className="font-medium">Web Order:</span> Order ini dibuat melalui website dengan payment gateway
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Courier Information */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Kurir</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Truck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{orderData.shipping?.courier?.name || 'Kurir'} - {orderData.shipping?.service_type || 'Reguler'}</p>
                                        <p className="text-sm text-gray-600">Resi: {orderData.shipping?.tracking_number || '-'}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <p className="font-bold">Rp{orderData.shipping_cost?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Dikirim Ke</h3>
                                <div className="space-y-2">
                                    <p className="font-medium">{orderData.customer?.name || '-'}</p>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>{orderData.shipping_address || '-'}</p>
                                        <p>Telp: {orderData.customer?.phone || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Catatan</h3>
                                <p className="text-sm text-gray-600">{orderData.notes || '-'}</p>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">Admin: {orderData.created_by?.name || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Products */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Produk</h3>
                                <p className="text-sm text-gray-600">Total Produk: {orderData.items?.length || 0}</p>
                            </div>
                            
                            <div className="space-y-4">
                                {orderData.items?.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                            {item.product_variant?.product?.image ? (
                                                <img 
                                                    src={`/storage/${item.product_variant.product.image}`} 
                                                    alt={item.product_variant.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-xs">No Image</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.product_name_snapshot || item.product_variant?.product?.name || '-'}</h4>
                                            <p className="text-sm text-gray-600">{item.variant_label && `(${item.variant_label})`}</p>
                                            <p className="text-sm text-gray-600">{item.quantity} x Rp{item.price?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">Rp{item.subtotal?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</p>
                                        </div>
                                    </div>
                                )) || (
                                    <div className="text-center py-8 text-gray-500">
                                        Tidak ada produk
                                    </div>
                                )}
                            </div>
                            
                            {/* Total Section */}
                            <div className="mt-6 pt-4 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{orderData.shipping?.courier?.name || 'Kurir'} - {orderData.shipping?.service_type || 'Reguler'}</span>
                                        <span>Rp{orderData.shipping_cost?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>TOTAL</span>
                                        <span>Rp{orderData.total_price?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History Modal */}
            {orderData && (
                <PaymentHistoryModal
                    isOpen={showPaymentHistory}
                    onClose={() => setShowPaymentHistory(false)}
                    order={{
                        id: orderData.id,
                        number: orderData.order_number,
                        date: orderData.ordered_at,
                        status: orderData.status,
                        payment_url: orderData.payment_url,
                        payment_bank: orderData.payments?.[0]?.payment_bank,
                        courier: orderData.shipping?.courier?.name || 'N/A',
                        resi: orderData.shipping?.tracking_number || ''
                    }}
                />
            )}

            {/* Order History Modal */}
            {orderData && (
                <OrderHistoryModal
                    isOpen={showOrderHistory}
                    onClose={() => setShowOrderHistory(false)}
                    orderId={orderData.id}
                />
            )}
        </DashboardLayout>
    );
}