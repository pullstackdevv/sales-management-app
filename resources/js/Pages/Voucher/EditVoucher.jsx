// resources/js/Pages/Voucher/EditVoucher.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { router } from "@inertiajs/react";

const EditVoucher = ({ voucherId }) => {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const voucherType = watch("type", "percentage");

    // Load voucher data
    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                const response = await axios.get(`/api/vouchers/${voucherId}`);
                const voucher = response.data.data;
                
                // Set form values
                setValue('code', voucher.code);
                setValue('name', voucher.name);
                setValue('description', voucher.description);
                setValue('type', voucher.type);
                setValue('value', voucher.value);
                setValue('minimum_amount', voucher.minimum_amount);
                setValue('maximum_discount', voucher.maximum_discount);
                setValue('usage_limit', voucher.usage_limit);
                // Format tanggal untuk input type="date" (YYYY-MM-DD)
                const formatDateForInput = (dateString) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return date.toISOString().split('T')[0];
                };
                
                setValue('valid_from', formatDateForInput(voucher.start_date));
                setValue('valid_until', formatDateForInput(voucher.end_date));
                setValue('is_active', voucher.is_active);
                
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching voucher:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Gagal memuat data voucher',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
                router.visit('/cms/cms/voucher/data');
            }
        };

        if (voucherId) {
            fetchVoucher();
        }
    }, [voucherId, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        console.log("Form Data:", data);

        try {
            // Convert field names to match API expectations
            const apiData = {
                ...data,
                start_date: data.valid_from,
                end_date: data.valid_until,
                is_active: data.is_active || true
            };
            
            // Remove the old field names
            delete apiData.valid_from;
            delete apiData.valid_until;
            
            const response = await axios.put(`/api/vouchers/${voucherId}`, apiData);

            if (response.data.status === 'success') {
                await Swal.fire({
                    title: 'Berhasil!',
                    text: 'Voucher berhasil diperbarui!',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
                
                // Redirect to voucher list
                router.visit('/cms/voucher/data');
            }
        } catch (error) {
            console.error('Error updating voucher:', error);
            
            let errorMessage = 'Gagal memperbarui voucher';
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                errorMessage = Object.values(errors).flat().join(', ');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            await Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateVoucherCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setValue("code", result);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Icon icon="solar:loading-outline" className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p>Memuat data voucher...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Edit Voucher
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Perbarui informasi voucher diskon
                        </p>
                    </div>
                    <button
                        onClick={() => router.visit('/cms/voucher/data')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Icon icon="solar:arrow-left-outline" className="w-4 h-4" />
                        Kembali
                    </button>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Informasi Dasar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kode Voucher *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            {...register("code", {
                                                required: "Kode voucher harus diisi",
                                                pattern: {
                                                    value: /^[A-Z0-9]+$/,
                                                    message: "Kode hanya boleh huruf kapital dan angka"
                                                }
                                            })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                                            placeholder="VOUCHER123"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={generateVoucherCode}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            title="Generate kode otomatis"
                                        >
                                            <Icon icon="solar:refresh-outline" className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {errors.code && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.code.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Voucher *
                                    </label>
                                    <input
                                        type="text"
                                        {...register("name", {
                                            required: "Nama voucher harus diisi",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Diskon Hari Raya"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        {...register("description")}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Deskripsi singkat tentang voucher ini..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Voucher Type & Value */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Tipe & Nilai Diskon
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipe Voucher *
                                    </label>
                                    <select
                                        {...register("type", {
                                            required: "Tipe voucher harus dipilih",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Pilih tipe voucher</option>
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="fixed">Nominal Tetap (Rp)</option>
                                    </select>
                                    {errors.type && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.type.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nilai Diskon *
                                    </label>
                                    <div className="relative">
                                        {voucherType === "fixed" && (
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                Rp
                                            </span>
                                        )}
                                        {voucherType === "percentage" && (
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                %
                                            </span>
                                        )}
                                        <input
                                            type="number"
                                            {...register("value", {
                                                required: "Nilai diskon harus diisi",
                                                min: {
                                                    value: 1,
                                                    message: "Nilai harus lebih dari 0",
                                                },
                                                max:
                                                    voucherType === "percentage"
                                                        ? {
                                                              value: 100,
                                                              message: "Persentase maksimal 100%",
                                                          }
                                                        : undefined,
                                            })}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                voucherType === "fixed" ? "pl-8" : "pr-8"
                                            }`}
                                            placeholder={
                                                voucherType === "percentage" ? "10" : "50000"
                                            }
                                        />
                                    </div>
                                    {errors.value && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.value.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Conditions */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Syarat & Ketentuan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimal Pembelian (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        {...register("minimum_amount", {
                                            required: "Minimal pembelian harus diisi",
                                            min: {
                                                value: 0,
                                                message: "Minimal pembelian tidak boleh negatif",
                                            },
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="100000"
                                    />
                                    {errors.minimum_amount && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.minimum_amount.message}
                                        </p>
                                    )}
                                </div>

                                {voucherType === "percentage" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maksimal Diskon (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            {...register("maximum_discount", {
                                                min: {
                                                    value: 0,
                                                    message: "Maksimal diskon tidak boleh negatif",
                                                },
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="500000"
                                        />
                                        {errors.maximum_discount && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.maximum_discount.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                            Kosongkan jika tidak ada batas maksimal
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Batas Penggunaan *
                                    </label>
                                    <input
                                        type="number"
                                        {...register("usage_limit", {
                                            required: "Batas penggunaan harus diisi",
                                            min: {
                                                value: 1,
                                                message: "Batas penggunaan minimal 1",
                                            },
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="100"
                                    />
                                    {errors.usage_limit && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.usage_limit.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Validity Period */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Periode Berlaku
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Berlaku Dari *
                                    </label>
                                    <input
                                        type="date"
                                        {...register("valid_from", {
                                            required: "Tanggal mulai berlaku harus diisi",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.valid_from && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.valid_from.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Berlaku Sampai *
                                    </label>
                                    <input
                                        type="date"
                                        {...register("valid_until", {
                                            required: "Tanggal berakhir harus diisi",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.valid_until && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.valid_until.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Status
                            </h3>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    {...register("is_active")}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    id="is_active"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Voucher aktif dan dapat digunakan
                                </label>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t">
                            <button
                                type="button"
                            onClick={() => router.visit('/cms/voucher/data')}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icon icon="solar:loading-outline" className="w-4 h-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:diskette-outline" className="w-4 h-4" />
                                        Perbarui Voucher
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditVoucher;