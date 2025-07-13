"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "flowbite-react";
import DashboardLayout from "../Layouts/DashboardLayout";

export default function ExpensePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [date, setDate] = useState("2025-06-15");
    const [price, setPrice] = useState(0);
    const [qty, setQty] = useState(0);
    const [notes, setNotes] = useState("");

    const subtotal = price * qty;

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Expense</h1>

                <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <select className="border text-sm px-3 py-2 rounded-md">
                            <option>By Date</option>
                        </select>
                        <input
                            type="date"
                            className="border text-sm px-3 py-2 rounded-md"
                            defaultValue="2025-06-01"
                        />
                        <input
                            type="date"
                            className="border text-sm px-3 py-2 rounded-md"
                            defaultValue="2025-06-15"
                        />
                        <button className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100">
                            <Icon icon="mdi:magnify" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <Button className="text-sm border border-blue-600 text-blue-600">
                            <Icon
                                icon="mdi:download"
                                className="text-lg mr-1"
                            />
                            Unduh Excel
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white"
                        >
                            <Icon icon="ic:baseline-add" className="mr-1" />
                            Tambah Pengeluaran
                        </Button>
                    </div>
                </div>

                <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-sm mb-4">
                    <p className="font-semibold text-red-800">
                        Total Pengeluaran
                    </p>
                    <p className="text-red-600">
                        Ini adalah total pengeluaran dari list daftar
                        pengeluaran yang ada.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-blue-100 text-gray-700">
                            <tr>
                                <th className="px-4 py-3">No</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Nama Pengeluaran</th>
                                <th className="px-4 py-3">Harga / Biaya</th>
                                <th className="px-4 py-3">Jumlah</th>
                                <th className="px-4 py-3">Subtotal</th>
                                <th className="px-4 py-3">
                                    <Icon icon="mdi:cog" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td
                                    colSpan="7"
                                    className="text-center py-4 text-gray-500"
                                >
                                    Belum ada data pengeluaran.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">
                                Tambah Pengeluaran
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <Icon icon="mdi:close" className="text-2xl" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Nama Pengeluaran
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Tulis nama..."
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Tanggal
                                    </label>
                                    <input
                                        type="text"
                                        value={date}
                                        readOnly
                                        className="w-full border bg-gray-100 rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Biaya
                                    </label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) =>
                                            setPrice(Number(e.target.value))
                                        }
                                        placeholder="Rp 0"
                                        className="w-full border rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) =>
                                            setQty(Number(e.target.value))
                                        }
                                        placeholder="0"
                                        className="w-full border rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Keterangan
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Tulis keterangan pengeluaran..."
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    rows={3}
                                />
                            </div>

                            <div className="text-right font-semibold text-sm">
                                Subtotal:{" "}
                                <span className="text-blue-700">
                                    Rp{subtotal.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => alert("Disimpan!")}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
