import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const OrderHistoryModal = ({ isOpen, onClose, orderId }) => {
    const [auditHistory, setAuditHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchAuditHistory();
        }
    }, [isOpen, orderId]);

    const fetchAuditHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/orders/${orderId}/audit-history`);
            setAuditHistory(response.data.data || []);
        } catch (err) {
            console.error('Error fetching audit history:', err);
            setError('Gagal memuat riwayat perubahan order');
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action) => {
        const actionLabels = {
            'created': 'Order Dibuat',
            'updated': 'Order Diperbarui',
            'status_changed': 'Status Diubah',
            'payment_updated': 'Pembayaran Diperbarui',
            'shipping_updated': 'Pengiriman Diperbarui'
        };
        return actionLabels[action] || action;
    };

    const getFieldLabel = (fieldName) => {
        const fieldLabels = {
            'status': 'Status',
            'payment_status': 'Status Pembayaran',
            'total_amount': 'Total Amount',
            'discount_amount': 'Diskon',
            'shipping_cost': 'Biaya Kirim',
            'courier_id': 'Kurir',
            'tracking_number': 'Nomor Resi',
            'voucher_id': 'Voucher',
            'notes': 'Catatan'
        };
        return fieldLabels[fieldName] || fieldName;
    };

    const formatDateTime = (dateTime) => {
        try {
            return format(new Date(dateTime), 'dd MMM yyyy, HH:mm', { locale: id });
        } catch (error) {
            return dateTime;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Riwayat Perubahan Order
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Memuat riwayat...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-600 mb-2">{error}</div>
                            <button
                                onClick={fetchAuditHistory}
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : auditHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada riwayat perubahan untuk order ini
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auditHistory.map((log, index) => (
                                <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {getActionLabel(log.action)}
                                                </span>
                                                {log.field_name && (
                                                    <span className="text-sm text-gray-600">
                                                        • {getFieldLabel(log.field_name)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {log.field_name && (log.old_value !== null || log.new_value !== null) && (
                                                <div className="text-sm text-gray-700 mt-2">
                                                    {log.old_value !== null && (
                                                        <div className="mb-1">
                                                            <span className="font-medium text-red-600">Dari:</span>
                                                            <span className="ml-2">{log.old_value || '-'}</span>
                                                        </div>
                                                    )}
                                                    {log.new_value !== null && (
                                                        <div>
                                                            <span className="font-medium text-green-600">Ke:</span>
                                                            <span className="ml-2">{log.new_value || '-'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-right text-sm text-gray-500 ml-4">
                                            <div className="font-medium">
                                                {log.user?.name || 'System'}
                                            </div>
                                            <div>
                                                {formatDateTime(log.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderHistoryModal;