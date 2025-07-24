// resources/js/Pages/Order/AddOrder.jsx
import React from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";

export default function AddOrder() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:arrow-left-outline" className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tambah Order</h1>
                        <p className="text-gray-600 mt-1">
                            Buat order baru untuk customer Anda
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Sidebar */}
                    <div className="space-y-4 xl:col-span-1">
                        {/* Customer */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Pemesan
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Cari customer"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <button className="bg-gray-100 px-3 py-2 rounded-lg border text-sm">
                                    + Customer
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dikirim Kepada
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Cari customer"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <button className="bg-gray-100 px-3 py-2 rounded-lg border text-sm">
                                    + Customer
                                </button>
                            </div>
                        </div>

                        {/* Shipment */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pengiriman Dari
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option>SP | Kemayoran Kota Jakarta Pusat</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Order
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sales Channel
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option>Pilih custom sales channel</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note
                                </label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" />
                                <label className="text-sm">Add To Print Label</label>
                            </div>
                        </div>
                    </div>

                    {/* Product & Summary */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Product Search */}
                        <div className="bg-white p-4 rounded-lg border">
                            <input
                                type="text"
                                placeholder="Cari produk"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
                            <div className="flex flex-col items-center">
                                <img
                                    src="https://www.citypng.com/public/uploads/preview/vector-package-delivery-box-parcel-icon-701751695035959yrzugpsfim.png"
                                    alt="No product"
                                    className="w-24 h-24"
                                />
                                <p className="mt-2">Belum ada produk ditambahkan</p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-700">Subtotal</span>
                                <span className="text-sm font-medium">Rp0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-700">
                                    Ongkos Kirim <button className="text-blue-500 underline ml-2 text-xs">Ubah kurir</button>
                                </span>
                                <span className="text-sm font-medium">Rp0</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full border">
                                    + Diskon order
                                </span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full border">
                                    + Biaya lain
                                </span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full border">
                                    + Asuransi
                                </span>
                            </div>
                            <div className="flex justify-between pt-4 border-t font-semibold text-lg">
                                <span>TOTAL</span>
                                <span>Rp0</span>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Pembayaran
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option>Belum bayar</option>
                                <option>Sudah bayar</option>
                            </select>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-4">
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">
                                Simpan dan tambah order baru
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                                Simpan order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
