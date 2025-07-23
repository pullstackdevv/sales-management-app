// resources/js/Pages/Voucher/VoucherData.jsx
import React, { useState } from "react";
import { voucherData, formatRupiah, formatDate } from "../../data/voucherData";
import { Icon } from "@iconify/react";
import VoucherCard from "../../components/ui/card/VoucherCard";

const VoucherData = () => {
    const [vouchers, setVouchers] = useState(voucherData);
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

    // Filter vouchers berdasarkan type, status, dan search term
    const filteredVouchers = vouchers.filter((voucher) => {
        const matchesType = filterType === "all" || voucher.type === filterType;
        const matchesStatus =
            filterStatus === "all" || voucher.status === filterStatus;
        const matchesSearch =
            voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voucher.code.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesType && matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
        if (status === "active") {
            return `${baseClasses} bg-green-100 text-green-800`;
        } else if (status === "expired") {
            return `${baseClasses} bg-red-100 text-red-800`;
        } else {
            return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getTypeBadge = (type) => {
        const baseClasses = "px-2 py-1 text-xs font-medium rounded";
        if (type === "percentage") {
            return `${baseClasses} bg-blue-100 text-blue-800`;
        } else {
            return `${baseClasses} bg-purple-100 text-purple-800`;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Data Voucher
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Kelola voucher dan promosi untuk pelanggan
                    </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Icon icon="solar:add-circle-outline" className="w-5 h-5" />
                    Tambah Voucher
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Total Voucher
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {vouchers.length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Icon
                                icon="solar:ticket-outline"
                                className="w-6 h-6 text-blue-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Voucher Aktif
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {
                                    vouchers.filter(
                                        (v) => v.status === "active"
                                    ).length
                                }
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <Icon
                                icon="solar:check-circle-outline"
                                className="w-6 h-6 text-green-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Voucher Persentase
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {
                                    vouchers.filter(
                                        (v) => v.type === "percentage"
                                    ).length
                                }
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Icon
                                icon="solar:percent-outline"
                                className="w-6 h-6 text-blue-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Voucher Fixed
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {
                                    vouchers.filter((v) => v.type === "fixed")
                                        .length
                                }
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Icon
                                icon="solar:dollar-outline"
                                className="w-6 h-6 text-purple-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Icon
                                icon="solar:magnifer-outline"
                                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Cari voucher berdasarkan nama atau kode..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="percentage">Persentase</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="expired">Expired</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode("table")}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${
                                    viewMode === "table"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                                title="Tampilan Tabel"
                            >
                                <Icon
                                    icon="solar:list-outline"
                                    className="w-4 h-4"
                                />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${
                                    viewMode === "grid"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                                title="Tampilan Grid"
                            >
                                <Icon
                                    icon="solar:grid-outline"
                                    className="w-4 h-4"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voucher Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Voucher
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe & Nilai
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Syarat
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Periode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVouchers.map((voucher) => (
                                <tr
                                    key={voucher.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {voucher.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Kode: {voucher.code}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {voucher.description}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={getTypeBadge(
                                                    voucher.type
                                                )}
                                            >
                                                {voucher.type === "percentage"
                                                    ? "Persentase"
                                                    : "Fixed"}
                                            </span>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {voucher.type === "percentage"
                                                    ? `${voucher.value}%`
                                                    : formatRupiah(
                                                          voucher.value
                                                      )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            Min:{" "}
                                            {formatRupiah(voucher.min_purchase)}
                                        </div>
                                        {voucher.max_discount && (
                                            <div className="text-sm text-gray-500">
                                                Max:{" "}
                                                {formatRupiah(
                                                    voucher.max_discount
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {voucher.used_count} /{" "}
                                            {voucher.usage_limit}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${
                                                        (voucher.used_count /
                                                            voucher.usage_limit) *
                                                        100
                                                    }%`,
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(voucher.start_date)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(voucher.end_date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={getStatusBadge(
                                                voucher.status
                                            )}
                                        >
                                            {voucher.status === "active"
                                                ? "Aktif"
                                                : "Expired"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="Edit"
                                            >
                                                <Icon
                                                    icon="solar:pen-outline"
                                                    className="w-4 h-4"
                                                />
                                            </button>
                                            <button
                                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                                title="View"
                                            >
                                                <Icon
                                                    icon="solar:eye-outline"
                                                    className="w-4 h-4"
                                                />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                                title="Delete"
                                            >
                                                <Icon
                                                    icon="solar:trash-bin-minimalistic-outline"
                                                    className="w-4 h-4"
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredVouchers.length === 0 && (
                    <div className="text-center py-12">
                        <Icon
                            icon="solar:ticket-outline"
                            className="w-12 h-12 text-gray-400 mx-auto mb-4"
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Tidak ada voucher ditemukan
                        </h3>
                        <p className="text-gray-500">
                            Coba ubah filter atau kata kunci pencarian
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoucherData;
