import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const OrderHistoryModal = ({ isOpen, onClose, orderId }) => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchAuditHistory();
        }
    }, [isOpen, orderId]);

    const fetchAuditHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/orders/${orderId}/audit-history`);
            setAuditLogs(response.data.data || []);
        } catch (err) {
            console.error('Error fetching audit history:', err);
            setError('Gagal memuat riwayat order');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'created':
                return 'mdi:plus-circle';
            case 'updated':
                return 'mdi:pencil';
            case 'status_changed':
                return 'mdi:swap-horizontal';
            case 'shipping_updated':
                return 'mdi:truck';
            default:
                return 'mdi:information';
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'created':
                return 'text-green-600';
            case 'updated':
                return 'text-blue-600';
            case 'status_changed':
                return 'text-orange-600';
            case 'shipping_updated':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'created':
                return 'Order Dibuat';
            case 'updated':
                return 'Order Diperbarui';
            case 'status_changed':
                return 'Status Berubah';
            case 'shipping_updated':
                return 'Pengiriman Diperbarui';
            default:
                return action;
        }
    };

    const formatFieldName = (fieldName) => {
        const fieldLabels = {
            'status': 'Status',
            'shipping_cost': 'Biaya Pengiriman',
            'courier_id': 'Kurir',
            'tracking_number': 'Nomor Resi',
            'notes': 'Catatan',
            'total': 'Total'
        };
        return fieldLabels[fieldName] || fieldName;
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) {
            return '-';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        // Format angka dengan ribuan tanpa desimal
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
            return parseFloat(value).toLocaleString('id-ID', { maximumFractionDigits: 0 });
        }
        return String(value);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Riwayat Order #{orderId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Icon icon="mdi:loading" className="animate-spin text-blue-600" width="32" />
                            <span className="ml-2 text-gray-600">Memuat riwayat...</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <Icon icon="mdi:alert-circle" className="text-red-500 mx-auto mb-2" width="48" />
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={fetchAuditHistory}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    {!loading && !error && auditLogs.length === 0 && (
                        <div className="text-center py-8">
                            <Icon icon="mdi:history" className="text-gray-400 mx-auto mb-2" width="48" />
                            <p className="text-gray-500">Belum ada riwayat perubahan</p>
                        </div>
                    )}

                    {!loading && !error && auditLogs.length > 0 && (
                        <div className="space-y-4">
                            {auditLogs.map((log, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start space-x-3">
                                        <div className={`flex-shrink-0 ${getActionColor(log.action)}`}>
                                            <Icon icon={getActionIcon(log.action)} width="20" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    {getActionLabel(log.action)}
                                                </h4>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>
                                            
                                            {log.field_name && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">{formatFieldName(log.field_name)}</span>
                                                    </p>
                                                    <div className="mt-1 flex items-center space-x-2 text-sm">
                                                        {log.old_value && (
                                                            <>
                                                                <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                                                                    {formatValue(log.old_value)}
                                                                </span>
                                                                <Icon icon="mdi:arrow-right" className="text-gray-400" width="16" />
                                                            </>
                                                        )}
                                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                                                            {formatValue(log.new_value)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                <span className="flex items-center space-x-1">
                                                    <Icon icon="mdi:account" width="12" />
                                                    <span>{log.user?.name || 'System'}</span>
                                                </span>
                                                {log.ip_address && (
                                                    <span className="flex items-center space-x-1">
                                                        <Icon icon="mdi:ip" width="12" />
                                                        <span>{log.ip_address}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
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
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderHistoryModal;