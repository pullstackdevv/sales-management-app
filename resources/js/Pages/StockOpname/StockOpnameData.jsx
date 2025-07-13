import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";

const stockOpnames = [
    {
        date: "11 Jun 25 - 13:38",
        id: "585731",
        productCount: 1,
        warehouse: "Gudang Utama",
        note: "barang hilang",
    },
];

export default function StockOpnamePage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Stok Opname</h1>

                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <input
                        type="text"
                        placeholder="Cari nomor stok opname ..."
                        className="border text-sm px-4 py-2 rounded-md w-full md:w-64"
                    />
                    <div className="flex gap-2">
                        <button className="text-sm border px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-1">
                            <Icon
                                icon="material-symbols:upload"
                                className="text-lg"
                            />
                            Import Stok
                        </button>
                        <button className="text-sm border px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-1">
                            <Icon
                                icon="material-symbols:filter-alt-outline"
                                className="text-lg"
                            />
                            Filter
                        </button>
                        <Link href="/stock-opname/add">
                            <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1">
                                <Icon
                                    icon="material-symbols:add"
                                    className="text-lg"
                                />
                                Buat Baru
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow-sm divide-y overflow-auto">
                    <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                        <div className="col-span-3">Tanggal Stok Opname</div>
                        <div className="col-span-3">ID Stok Opname</div>
                        <div className="col-span-2">Produk</div>
                        <div className="col-span-2">Gudang</div>
                        <div className="col-span-2">Keterangan</div>
                    </div>

                    {stockOpnames.map((item, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-12 px-4 py-3 text-sm"
                        >
                            <div className="col-span-3">{item.date}</div>
                            <div className="col-span-3 font-semibold">
                                {item.id}
                            </div>
                            <div className="col-span-2">
                                {item.productCount}
                            </div>
                            <div className="col-span-2">{item.warehouse}</div>
                            <div className="col-span-2 text-gray-700">
                                {item.note}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
