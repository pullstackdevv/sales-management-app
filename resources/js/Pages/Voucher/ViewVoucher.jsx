// resources/js/Pages/Voucher/ViewVoucher.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";
import { router } from "@inertiajs/react";

const ViewVoucher = ({ voucherId }) => {
    const [voucher, setVoucher] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                const response = await axios.get(`/api/vouchers/${voucherId}`);
                setVoucher(response.data.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching voucher:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Gagal memuat data voucher',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
                router.visit('/cms/voucher/data');
            }
        };

        if (voucherId) {
            fetchVoucher();
        }
    }, [voucherId]);

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getVoucherValue = (voucher) => {
        if (voucher.type === 'percentage') {
            return `${voucher.value}%`;
        }
        return formatRupiah(voucher.value);
    };

    const getUsagePercentage = (voucher) => {
        return Math.round((voucher.used_count / voucher.usage_limit) * 100);
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

    if (!voucher) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Icon icon="solar:file-corrupted-outline" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Voucher Tidak Ditemukan</h2>
                        <p className="text-gray-600 mb-4">Voucher yang Anda cari tidak dapat ditemukan.</p>
                        <button
                            onClick={() => router.visit('/cms/voucher/data')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Kembali ke Daftar Voucher
                        </button>
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
                            Detail Voucher
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Informasi lengkap voucher {voucher.code}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(`/voucher/edit/${voucher.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Icon icon="solar:pen-outline" className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => router.visit('/cms/voucher/data')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Icon icon="solar:arrow-left-outline" className="w-4 h-4" />
                            Kembali
                        </button>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        voucher.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        <Icon 
                            icon={voucher.is_active ? "solar:check-circle-outline" : "solar:close-circle-outline"} 
                            className="w-4 h-4 mr-1" 
                        />
                        {voucher.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                    
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        voucher.type === 'percentage' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                    }`}>
                        <Icon 
                            icon={voucher.type === 'percentage' ? "solar:percent-outline" : "solar:dollar-outline"} 
                            className="w-4 h-4 mr-1" 
                        />
                        {voucher.type === 'percentage' ? 'Persentase' : 'Nominal Tetap'}
                    </span>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Voucher Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Informasi Dasar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kode Voucher
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-mono font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                            {voucher.code}
                                        </span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(voucher.code)}
                                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                            title="Salin kode"
                                        >
                                            <Icon icon="solar:copy-outline" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Voucher
                                    </label>
                                    <p className="text-gray-900 font-medium">{voucher.name}</p>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Deskripsi
                                    </label>
                                    <p className="text-gray-600">{voucher.description || 'Tidak ada deskripsi'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Discount Information */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Informasi Diskon
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nilai Diskon
                                    </label>
                                    <p className="text-2xl font-bold text-green-600">
                                        {getVoucherValue(voucher)}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimal Pembelian
                                    </label>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {formatRupiah(voucher.minimum_amount)}
                                    </p>
                                </div>
                                
                                {voucher.maximum_discount && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Maksimal Diskon
                                        </label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatRupiah(voucher.maximum_discount)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Validity Period */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Periode Berlaku
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Berlaku Dari
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:calendar-outline" className="w-4 h-4 text-gray-500" />
                                        <p className="text-gray-900">{formatDate(voucher.start_date)}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Berlaku Sampai
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:calendar-outline" className="w-4 h-4 text-gray-500" />
                                        <p className="text-gray-900">{formatDate(voucher.end_date)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Usage Statistics */}
                    <div className="space-y-6">
                        {/* Usage Stats */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Statistik Penggunaan
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Penggunaan</span>
                                        <span className="text-sm text-gray-600">
                                            {voucher.used_count} / {voucher.usage_limit}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${getUsagePercentage(voucher)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {getUsagePercentage(voucher)}% terpakai
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{voucher.used_count}</p>
                                        <p className="text-xs text-gray-600">Digunakan</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {voucher.usage_limit - voucher.used_count}
                                        </p>
                                        <p className="text-xs text-gray-600">Tersisa</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Aksi Cepat
                            </h3>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.visit(`/voucher/edit/${voucher.id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Icon icon="solar:pen-outline" className="w-4 h-4" />
                                    Edit Voucher
                                </button>
                                
                                <button
                                    onClick={() => navigator.clipboard.writeText(voucher.code)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <Icon icon="solar:copy-outline" className="w-4 h-4" />
                                    Salin Kode
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ViewVoucher;