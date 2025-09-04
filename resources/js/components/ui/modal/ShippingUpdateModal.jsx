import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const ShippingUpdateModal = ({ isOpen, onClose, order, onUpdate }) => {
    const [formData, setFormData] = useState({
        courier_id: '',
        tracking_number: ''
    });
    const [couriers, setCouriers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Fetch couriers when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCouriers();
            // Initialize form with existing data
            if (order?.shipping) {
                setFormData({
                    courier_id: order.shipping.courier_id || '',
                    tracking_number: order.shipping.tracking_number || ''
                });
            }
        }
    }, [isOpen, order]);

    const fetchCouriers = async () => {
        try {
            const response = await axios.get('/api/couriers');
            if (response.data.status === 'success') {
                // Handle paginated response structure
                const couriersData = response.data.data?.data || response.data.data || [];
                const activeCouriers = Array.isArray(couriersData) ? couriersData.filter(courier => courier.is_active) : [];
                setCouriers(activeCouriers);
            }
        } catch (error) {
            console.error('Error fetching couriers:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.courier_id) {
            newErrors.courier_id = 'Kurir harus dipilih';
        }
        
        if (!formData.tracking_number.trim()) {
            newErrors.tracking_number = 'Nomor resi harus diisi';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(`/api/orders/${order.id}/shipping`, formData);
            
            if (response.data.status === 'success') {
                // Call onUpdate callback to refresh parent component
                if (onUpdate) {
                    onUpdate(response.data.data);
                }
                onClose();
                // Reset form
                setFormData({ courier_id: '', tracking_number: '' });
                setErrors({});
            }
        } catch (error) {
            console.error('Error updating shipping:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'Terjadi kesalahan saat memperbarui data pengiriman' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ courier_id: '', tracking_number: '' });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Update Informasi Pengiriman
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
                    </button>
                </div>

                {/* Order Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        Order: <span className="font-medium">{order?.number}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Customer: <span className="font-medium">{order?.customer}</span>
                    </p>
                </div>

                {errors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Courier Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kurir *
                        </label>
                        <select
                            name="courier_id"
                            value={formData.courier_id}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.courier_id ? 'border-red-300' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        >
                            <option value="">Pilih Kurir</option>
                            {couriers.map(courier => (
                                <option key={courier.id} value={courier.id}>
                                    {courier.name}
                                </option>
                            ))}
                        </select>
                        {errors.courier_id && (
                            <p className="text-red-500 text-xs mt-1">{errors.courier_id}</p>
                        )}
                    </div>

                    {/* Tracking Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nomor Resi *
                        </label>
                        <input
                            type="text"
                            name="tracking_number"
                            value={formData.tracking_number}
                            onChange={handleInputChange}
                            placeholder="Masukkan nomor resi"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.tracking_number ? 'border-red-300' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        />
                        {errors.tracking_number && (
                            <p className="text-red-500 text-xs mt-1">{errors.tracking_number}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Icon icon="solar:loading-outline" className="w-4 h-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShippingUpdateModal;