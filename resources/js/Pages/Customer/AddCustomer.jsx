import DashboardLayout from "../../Layouts/DashboardLayout";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";

export default function AddCustomer() {
    const [category, setCategory] = useState("Pelanggan");

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Judul dan Back */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => window.history.back()}
                    >
                        <Icon icon="material-symbols:arrow-back" width={24} />
                    </button>

                    <h1 className="text-2xl font-semibold">Tambah Customer</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Form Utama */}
                    <div className="w-full lg:w-3/4 bg-white p-6 rounded-lg shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Kategori & Nama */}
                            <div>
                                <label className="text-sm font-medium">
                                    Kategori Customer
                                </label>
                                <select
                                    className="w-full mt-1 border rounded px-3 py-2 text-sm"
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                >
                                    <option value="Pelanggan">Pelanggan</option>
                                    <option value="Reseller">Reseller</option>
                                    <option value="Dropshipper">
                                        Dropshipper
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Nama Lengkap
                                </label>
                                <input className="w-full mt-1 border rounded px-3 py-2 text-sm" />
                            </div>

                            {/* Kota & Kode Pos */}
                            <div className="relative">
                                <label className="text-sm font-medium">
                                    Kota/kecamatan
                                </label>
                                <input
                                    className="w-full mt-1 border rounded px-3 py-2 text-sm pr-10"
                                    placeholder="Cari Kota/kecamatan..."
                                />
                                <Icon
                                    icon="mdi:magnify"
                                    className="absolute right-3 top-9 text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Kode Pos
                                </label>
                                <input className="w-full mt-1 border rounded px-3 py-2 text-sm" />
                            </div>

                            {/* Telepon */}
                            <div className="relative">
                                <label className="text-sm font-medium">
                                    No. HP / Telepon
                                </label>
                                <input className="w-full mt-1 border rounded px-3 py-2 text-sm pl-10" />
                                <Icon
                                    icon="ph:phone-light"
                                    className="absolute left-3 top-9 text-gray-400"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-sm font-medium">
                                    Email
                                </label>
                                <input className="w-full mt-1 border rounded px-3 py-2 text-sm" />
                            </div>

                            {/* ID Line */}
                            <div>
                                <label className="text-sm font-medium">
                                    ID Line
                                </label>
                                <input className="w-full mt-1 border rounded px-3 py-2 text-sm" />
                            </div>

                            {/* Other Contact */}
                            <div>
                                <label className="text-sm font-medium">
                                    Other Contact
                                </label>
                                <input className="w-full mt-1 border rounded px-3 py-2 text-sm" />
                            </div>

                            {/* Alamat */}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">
                                    Alamat Lengkap
                                </label>
                                <textarea className="w-full mt-1 border rounded px-3 py-2 text-sm min-h-[80px]" />
                            </div>
                        </div>

                        {/* Tombol Simpan */}
                        <div className="mt-6">
                            <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                Simpan!
                            </button>
                        </div>
                    </div>

                    {/* Keterangan Kategori */}
                    <div className="lg:w-1/4 bg-white p-4 rounded-lg shadow-sm text-sm">
                        <p className="font-bold mb-2">Kategori Customer:</p>
                        <p>
                            <strong>Pelanggan</strong>, customer toko yang
                            mendapatkan harga normal.
                        </p>
                        <p className="mt-2">
                            <strong>Reseller</strong>, customer yang mendapatkan
                            potongan harga.
                        </p>
                        <p className="mt-2">
                            <strong>Dropshipper</strong>, customer mendapatkan
                            harga normal, yang disertai alamat pengiriman pada
                            resi melekat pada customer dropship tersebut.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
