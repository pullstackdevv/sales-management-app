import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

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
                [name]: null
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        router.post('/change-password', formData, {
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Password berhasil diubah',
                    timer: 2000,
                    showConfirmButton: false
                });
                setFormData({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: ''
                });
                onClose();
            },
            onError: (errors) => {
                setErrors(errors);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: 'Terjadi kesalahan saat mengubah password'
                });
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleClose = () => {
        setFormData({
            current_password: '',
            new_password: '',
            new_password_confirmation: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Ganti Password
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Icon icon="mdi:close" className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password Saat Ini
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    name="current_password"
                                    value={formData.current_password}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                                        errors.current_password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan password saat ini"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Icon 
                                        icon={showPasswords.current ? 'mdi:eye-off' : 'mdi:eye'} 
                                        className="w-5 h-5" 
                                    />
                                </button>
                            </div>
                            {errors.current_password && (
                                <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>
                            )}
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                                        errors.new_password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan password baru"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Icon 
                                        icon={showPasswords.new ? 'mdi:eye-off' : 'mdi:eye'} 
                                        className="w-5 h-5" 
                                    />
                                </button>
                            </div>
                            {errors.new_password && (
                                <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    name="new_password_confirmation"
                                    value={formData.new_password_confirmation}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                                        errors.new_password_confirmation ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Konfirmasi password baru"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Icon 
                                        icon={showPasswords.confirm ? 'mdi:eye-off' : 'mdi:eye'} 
                                        className="w-5 h-5" 
                                    />
                                </button>
                            </div>
                            {errors.new_password_confirmation && (
                                <p className="text-red-500 text-sm mt-1">{errors.new_password_confirmation}</p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            disabled={isLoading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                            )}
                            <span>{isLoading ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;