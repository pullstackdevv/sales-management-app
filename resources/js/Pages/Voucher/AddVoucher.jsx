// resources/js/Pages/Voucher/AddVoucher.jsx
import React, { useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { router } from "@inertiajs/react";

const AddVoucher = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const voucherType = watch("type", "percentage");

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        console.log("Form Data:", data);

        try {
            const response = await axios.post('/api/vouchers', {
                ...data,
                is_active: data.is_active || true
            });

            if (response.data.status === 'success') {
                await Swal.fire({
                    title: 'Berhasil!',
                    text: 'Voucher berhasil ditambahkan!',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
                
                // Redirect to voucher list
                router.visit('/cms/voucher/data');
            }
        } catch (error) {
            console.error('Error creating voucher:', error);
            
            let errorMessage = 'Gagal menambahkan voucher';
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
        const prefix = voucherType === "percentage" ? "DISC" : "SAVE";
        const randomNum = Math.floor(Math.random() * 10000);
        return `${prefix}${randomNum}`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Icon
                            icon="solar:arrow-left-outline"
                            className="w-5 h-5"
                        />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Tambah Voucher Baru
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Buat voucher promosi untuk pelanggan
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="p-6 space-y-6"
                    >
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Informasi Dasar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Voucher *
                                    </label>
                                    <input
                                        type="text"
                                        {...register("name", {
                                            required:
                                                "Nama voucher harus diisi",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Contoh: Diskon Akhir Tahun"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kode Voucher *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            {...register("code", {
                                                required:
                                                    "Kode voucher harus diisi",
                                            })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: DISC2024"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const code =
                                                    generateVoucherCode();
                                                document.querySelector(
                                                    'input[name="code"]'
                                                ).value = code;
                                            }}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                                            title="Generate kode otomatis"
                                        >
                                            <Icon
                                                icon="solar:refresh-outline"
                                                className="w-4 h-4"
                                            />
                                        </button>
                                    </div>
                                    {errors.code && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.code.message}
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
                                            required:
                                                "Tipe voucher harus dipilih",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="percentage">
                                            Diskon Persentase (%)
                                        </option>
                                        <option value="fixed">
                                            Potongan Harga Tetap (Rp)
                                        </option>
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
                                        {voucherType === "percentage" && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 text-sm">
                                                    %
                                                </span>
                                            </div>
                                        )}
                                        {voucherType === "fixed" && (
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 text-sm">
                                                    Rp
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            type="number"
                                            {...register("value", {
                                                required:
                                                    "Nilai diskon harus diisi",
                                                min: {
                                                    value: 1,
                                                    message:
                                                        "Nilai harus lebih dari 0",
                                                },
                                                max:
                                                    voucherType === "percentage"
                                                        ? {
                                                              value: 100,
                                                              message:
                                                                  "Persentase maksimal 100%",
                                                          }
                                                        : undefined,
                                            })}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                voucherType === "fixed"
                                                    ? "pl-8"
                                                    : "pr-8"
                                            }`}
                                            placeholder={
                                                voucherType === "percentage"
                                                    ? "10"
                                                    : "50000"
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
                                        {...register("min_purchase", {
                                            required:
                                                "Minimal pembelian harus diisi",
                                            min: {
                                                value: 0,
                                                message:
                                                    "Nilai tidak boleh negatif",
                                            },
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="100000"
                                    />
                                    {errors.min_purchase && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.min_purchase.message}
                                        </p>
                                    )}
                                </div>

                                {voucherType === "percentage" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maksimal Potongan (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            {...register("max_discount", {
                                                min: {
                                                    value: 0,
                                                    message:
                                                        "Nilai tidak boleh negatif",
                                                },
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="50000"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Kosongkan jika tidak ada batas
                                            maksimal
                                        </p>
                                        {errors.max_discount && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.max_discount.message}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Batas Penggunaan *
                                    </label>
                                    <input
                                        type="number"
                                        {...register("usage_limit", {
                                            required:
                                                "Batas penggunaan harus diisi",
                                            min: {
                                                value: 1,
                                                message:
                                                    "Minimal 1 kali penggunaan",
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

                        {/* Period */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Periode Berlaku
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tanggal Mulai *
                                    </label>
                                    <input
                                        type="date"
                                        {...register("start_date", {
                                            required:
                                                "Tanggal mulai harus diisi",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.start_date && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.start_date.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tanggal Berakhir *
                                    </label>
                                    <input
                                        type="date"
                                        {...register("end_date", {
                                            required:
                                                "Tanggal berakhir harus diisi",
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.end_date && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.end_date.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && (
                                    <Icon
                                        icon="solar:loading-line-duotone"
                                        className="w-4 h-4 animate-spin"
                                    />
                                )}
                                {isSubmitting
                                    ? "Menyimpan..."
                                    : "Simpan Voucher"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddVoucher;
