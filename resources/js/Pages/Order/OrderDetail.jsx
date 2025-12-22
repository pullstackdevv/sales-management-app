import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout.jsx';
import { ChevronLeft, MessageCircle, Copy, Settings, Eye, Truck, ExternalLink, RefreshCw, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';
import { useAuth } from '@/contexts/AuthContext';
import PaymentHistoryModal from '../../components/ui/modal/PaymentHistoryModal';
import OrderHistoryModal from '../../components/ui/modal/OrderHistoryModal';

export default function OrderDetail({ auth, order }) {
    const { isOwner, user } = useAuth();
    const formatRupiah = (value) => {
        const num = typeof value === 'number' ? value : parseFloat(value || 0);
        return num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    };
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
                console.log(result.data)
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
Alamat: ${orderData.address.address_detail || '-'}, ${orderData.address.district || '-'}, ${orderData.address.city || '-'}, ${orderData.address.province || '-'}
Telp: ${orderData.customer?.phone || '-'}

Produk:
${orderData.items?.map(item =>
            `- ${item.product_name_snapshot || item.product_variant?.product?.name} ${item.variant_label ? `(${item.variant_label})` : ''}
  ${item.quantity} x Rp${formatRupiah(item.price)} = Rp${formatRupiah(item.subtotal)}`
        ).join('\n') || 'Tidak ada produk'}
Ongkir: Rp${formatRupiah(orderData.shipping_cost)}
Total: Rp${formatRupiah(orderData.total_price)}

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
            router.visit(`/cms/order/manage/${orderData.id}`);
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

    const totalSellingPrice = orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const voucherDiscountAmount = orderData?.voucher?.type === 'percentage'
        ? Math.floor(totalSellingPrice * ((orderData?.voucher?.value || 0) / 100))
        : (orderData?.voucher?.value || 0);
    const manualDiscount = orderData?.discount_amount || 0;
    const netSales = Math.max(totalSellingPrice - voucherDiscountAmount - manualDiscount, 0);
    const totalProductCost = orderData.items?.reduce((sum, item) => sum + ((item.base_price || 0) * item.quantity), 0) || 0;
    const grossProfit = netSales - totalProductCost;
    let paidAmount = orderData.payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
    if (isWebOrder() && orderData.payment_status === 'paid') {
        paidAmount = orderData.total_price || 0;
    }
    const receivable = Math.max((orderData.total_price || 0) - paidAmount, 0);
    const canViewFinance = isOwner || (user?.id === orderData?.user_id);

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

                                    <button
                                        onClick={handleCopyOrderDetails}
                                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>Salin Detail</span>
                                    </button>

                                    <button
                                        onClick={() => setShowPaymentHistory(true)}
                                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        <span>Riwayat Pembayaran</span>
                                    </button>
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
                                                            {orderData.payments?.[0]?.amount_paid && (
                                                                <div className="text-xs text-gray-600">Dibayar: Rp{formatRupiah(orderData.payments[0].amount_paid)}</div>
                                                            )}
                                                            {orderData.payments?.[0]?.paid_at && (
                                                                <div className="text-xs text-gray-600">Tanggal Bayar: {new Date(orderData.payments[0].paid_at).toLocaleString('id-ID')}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500">Payment Gateway</div>
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
                                        <p className="text-lg font-bold mt-2">Rp{formatRupiah(orderData.total_price)}</p>
                                        {orderData.sales_channel?.name && (
                                            <p className="text-xs text-gray-500 mt-1">Sumber Order: {orderData.sales_channel.name}</p>
                                        )}
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
                                        <p className="font-medium">{orderData.shipping?.courier?.name || 'Kurir'} - {orderData.shipping?.service_type || orderData.shipping?.courierRate?.service_type || 'Reguler'}</p>
                                        <p className="text-sm text-gray-600">Resi: {orderData.shipping?.tracking_number || '-'}</p>
                                        {orderData.shipping?.courierRate?.estimated_days && (
                                            <p className="text-xs text-gray-500">ETA {orderData.shipping.courierRate.estimated_days} hari</p>
                                        )}
                                        {orderData.shipping?.weight && (
                                            <p className="text-xs text-gray-500">Berat: {orderData.shipping.weight} kg</p>
                                        )}
                                    </div>
                                    <div className="ml-auto">
                                        <p className="font-bold">Rp{formatRupiah(orderData.shipping_cost)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Dikirim Ke</h3>
                                <div className="space-y-2">
                                    {orderData.address ? (
                                        <>
                                            <p className="font-medium">{orderData.address.recipient_name || orderData.customer?.name || '-'}</p>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{orderData.address.address_detail}</p>
                                                <p>{orderData.address.district}, {orderData.address.city}, {orderData.address.province} {orderData.address.postal_code}</p>
                                                <p>Telp: {orderData.address.phone || orderData.customer?.phone || '-'}</p>
                                                {orderData.address.is_dropship && (<p className="text-xs text-gray-500">Dropship</p>)}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-medium">{orderData.customer?.name || '-'}</p>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{orderData.shipping_address || '-'}</p>
                                                <p>Telp: {orderData.customer?.phone || '-'}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Catatan</h3>
                                <p className="text-sm text-gray-600">{orderData.notes || '-'}</p>
                                {/* <div className="mt-4">
                                    <p className="text-sm text-gray-600">Admin: {orderData.created_by?.name || '-'}</p>
                                </div> */}
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
                                            <p className="text-sm text-gray-600">{item.quantity} x Rp{formatRupiah(item.price)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">Rp{formatRupiah(item.subtotal)}</p>
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
                                        <span>Subtotal Produk</span>
                                        <span>Rp{formatRupiah(totalSellingPrice)}</span>
                                    </div>
                                    {canViewFinance && (
                                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-3">Ringkasan Finansial</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span>Pendapatan</span><span>Rp{formatRupiah(orderData.total_price)}</span></div>
                                                <div className="flex justify-between"><span>Penjualan Kotor</span><span>Rp{formatRupiah(totalSellingPrice)}</span></div>
                                                <div className="flex justify-between"><span>Penjualan Bersih</span><span>Rp{formatRupiah(netSales)}</span></div>
                                                <div className="flex justify-between"><span>HPP</span><span>Rp{formatRupiah(totalProductCost)}</span></div>
                                                <div className="flex justify-between"><span>Laba Kotor</span><span>Rp{formatRupiah(grossProfit)}</span></div>
                                                <div className="flex justify-between"><span>Piutang</span><span>Rp{formatRupiah(receivable)}</span></div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span>{orderData.shipping?.courier?.name || 'Kurir'} - {orderData.shipping?.service_type || 'Reguler'}</span>
                                        <span>Rp{formatRupiah(orderData.shipping_cost)}</span>
                                    </div>
                                    {orderData.voucher?.code ? (
                                        <div className="flex justify-between text-sm">
                                            <span>Voucher {orderData.voucher.code}</span>
                                            <span>{orderData.voucher.type === 'percentage' ? `${orderData.voucher.value}%` : `Rp${formatRupiah(orderData.voucher.value)}`}</span>
                                        </div>
                                    ) : orderData.discount_amount > 0 ? (
                                        <div className="flex justify-between text-sm">
                                            <span>Diskon Manual</span>
                                            <span>- Rp{formatRupiah(orderData.discount_amount)}</span>
                                        </div>
                                    ) : null}
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>TOTAL</span>
                                        <span>Rp{formatRupiah(orderData.total_price)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Briefcase className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm text-gray-700">Biaya Produk</span>
                                    </div>
                                    <span className="font-medium">Rp{formatRupiah(totalProductCost)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm text-gray-700">Profit</span>
                                    </div>
                                    <span className="font-semibold">Rp{formatRupiah(profit)}</span>
                                </div>
                            </div> */}
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
