import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { router, usePage } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";

const PromotionEdit = () => {
    const { promotion: initialPromotion } = usePage().props;
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        is_active: true,
        is_storefront: false,
        start_date: "",
        end_date: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialPromotion) {
            setFormData({
                title: initialPromotion.title || "",
                description: initialPromotion.description || "",
                is_active: initialPromotion.is_active || false,
                is_storefront: initialPromotion.is_storefront || false,
                start_date: initialPromotion.start_date ? formatDateForInput(initialPromotion.start_date) : "",
                end_date: initialPromotion.end_date ? formatDateForInput(initialPromotion.end_date) : "",
            });
        }
    }, [initialPromotion]);

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await axios.put(`/api/promotions/${initialPromotion.id}`, {
                title: formData.title,
                description: formData.description,
                is_active: formData.is_active,
                is_storefront: formData.is_storefront,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
            });

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Promosi berhasil diupdate',
                showConfirmButton: false,
                timer: 1500
            });

            router.visit('/cms/promotion/data');
        } catch (err) {
            console.error('Error updating promotion:', err);
            
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: err.response?.data?.message || 'Gagal mengupdate promosi'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.visit('/cms/promotion/data');
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <Icon icon="solar:arrow-left-outline" className="text-xl" />
                        Kembali
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Promosi</h1>
                    <p className="text-gray-600">Ubah informasi promosi</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Judul Promosi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan judul promosi"
                                required
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-500">{errors.title[0]}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan deskripsi promosi"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">{errors.description[0]}</p>
                            )}
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Mulai
                                </label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.start_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.start_date && (
                                    <p className="mt-1 text-sm text-red-500">{errors.start_date[0]}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Berakhir
                                </label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.end_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.end_date && (
                                    <p className="mt-1 text-sm text-red-500">{errors.end_date[0]}</p>
                                )}
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Aktifkan promosi
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_storefront"
                                    checked={formData.is_storefront}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Tampilkan di storefront
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Icon icon="line-md:loading-loop" className="text-xl" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:check-circle-outline" className="text-xl" />
                                        Update Promosi
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default PromotionEdit;
