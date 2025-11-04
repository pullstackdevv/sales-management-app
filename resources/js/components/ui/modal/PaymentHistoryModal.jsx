import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Package, Truck } from 'lucide-react';
import api from '../../../api/axios';

const PaymentHistoryModal = ({ isOpen, onClose, order }) => {
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && order) {
            fetchPaymentHistory();
        }
    }, [isOpen, order]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            // For now, we'll create mock data based on order status
            // Later this can be replaced with actual API call
            const mockHistory = generateMockHistory(order);
            setHistoryData(mockHistory);
        } catch (err) {
            setError('Gagal memuat riwayat pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const generateMockHistory = (order) => {
        const history = [];
        // Handle different date field names and validate date
        let orderDateString = order.date || order.ordered_at || order.created_at;
        let orderDate;
        
        if (orderDateString) {
            orderDate = new Date(orderDateString);
            // Check if date is valid
            if (isNaN(orderDate.getTime())) {
                console.warn('Invalid date format:', orderDateString);
                orderDate = new Date(); // Fallback to current date
            }
        } else {
            orderDate = new Date(); // Fallback to current date
        }
        
        // Order Created
        history.push({
            id: 1,
            title: 'Order Dibuat',
            description: `Order ${order.number} berhasil dibuat`,
            timestamp: orderDate,
            status: 'completed',
            icon: 'order'
        });

        // Payment Status
        if (order.payment_url) {
            // Web order with payment gateway
            const paymentDate = new Date(orderDate.getTime() + 5 * 60 * 1000); // 5 minutes after order
            history.push({
                id: 2,
                title: 'Menunggu Pembayaran',
                description: 'Link pembayaran telah dikirim ke customer',
                timestamp: paymentDate,
                status: order.status === 'pending' ? 'current' : 'completed',
                icon: 'payment'
            });

            if (order.status !== 'pending') {
                const paidDate = new Date(orderDate.getTime() + 30 * 60 * 1000); // 30 minutes after order
                history.push({
                    id: 3,
                    title: 'Pembayaran Berhasil',
                    description: 'Pembayaran telah dikonfirmasi oleh payment gateway',
                    timestamp: paidDate,
                    status: 'completed',
                    icon: 'success'
                });
            }
        } else {
            // Manual order
            const paymentDate = new Date(orderDate.getTime() + 10 * 60 * 1000); // 10 minutes after order
            history.push({
                id: 2,
                title: 'Menunggu Konfirmasi Pembayaran',
                description: order.payment_bank ? 
                    `Transfer ke ${order.payment_bank.bank_name} - ${order.payment_bank.account_number}` :
                    'Menunggu konfirmasi pembayaran manual',
                timestamp: paymentDate,
                status: order.status === 'pending' ? 'current' : 'completed',
                icon: 'payment'
            });

            if (order.status !== 'pending') {
                const confirmedDate = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after order
                history.push({
                    id: 3,
                    title: 'Pembayaran Dikonfirmasi',
                    description: 'Pembayaran telah dikonfirmasi oleh admin',
                    timestamp: confirmedDate,
                    status: 'completed',
                    icon: 'success'
                });
            }
        }

        // Processing
        if (['processing', 'shipped', 'delivered', 'completed'].includes(order.status)) {
            const processingDate = new Date(orderDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours after order
            history.push({
                id: 4,
                title: 'Order Diproses',
                description: 'Order sedang diproses dan dikemas',
                timestamp: processingDate,
                status: order.status === 'processing' ? 'current' : 'completed',
                icon: 'processing'
            });
        }

        // Shipped
        if (['shipped', 'delivered', 'completed'].includes(order.status)) {
            const shippedDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after order
            history.push({
                id: 5,
                title: 'Order Dikirim',
                description: order.resi ? 
                    `Dikirim via ${order.courier} dengan resi ${order.resi}` :
                    `Dikirim via ${order.courier}`,
                timestamp: shippedDate,
                status: order.status === 'shipped' ? 'current' : 'completed',
                icon: 'shipped'
            });
        }

        // Delivered
        if (['delivered', 'completed'].includes(order.status)) {
            const deliveredDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after order
            history.push({
                id: 6,
                title: 'Order Diterima',
                description: 'Order telah diterima oleh customer',
                timestamp: deliveredDate,
                status: 'completed',
                icon: 'delivered'
            });
        }

        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'order':
                return <Package className="w-4 h-4" />;
            case 'payment':
                return <Clock className="w-4 h-4" />;
            case 'success':
                return <CheckCircle className="w-4 h-4" />;
            case 'processing':
                return <Package className="w-4 h-4" />;
            case 'shipped':
                return <Truck className="w-4 h-4" />;
            case 'delivered':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'current':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pending':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatTimestamp = (timestamp) => {
        try {
            const date = new Date(timestamp);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Tanggal tidak valid';
            }
            return date.toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Tanggal tidak valid';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Riwayat Order
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Order #{order?.number}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Memuat riwayat...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center py-8 text-red-600">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    {historyData && (
                        <div className="space-y-4">
                            {historyData.map((item, index) => (
                                <div key={item.id} className="flex items-start space-x-4">
                                    {/* Timeline line */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusColor(item.status)}`}>
                                            {getIcon(item.icon)}
                                        </div>
                                        {index < historyData.length - 1 && (
                                            <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {item.title}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {formatTimestamp(item.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistoryModal;