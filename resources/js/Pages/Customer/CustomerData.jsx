import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";

const customers = [
    {
        name: "Test",
        phone: "12345",
        category: "Customer",
        address:
            "Jakarta - 14450\nKec. Penjaringan, Kota Jakarta Utara - DKI JAKARTA",
    },
    {
        name: "VIOLA",
        phone: "6281932208248",
        category: "Customer",
        address:
            "Rukan Puri Niaga III, Kembangan Sel., Kec. Kembangan, Jakarta Barat, Daerah Khusus Ibukota Jakarta, 11610...",
    },
    {
        name: "Verannda",
        phone: "6281357427316",
        category: "Customer",
        address:
            "Grand Delta Sari Blok Aster No.17, KAB. SIDOARJO, WARU, JAWA TIMUR...",
    },
];

export default function CustomerData() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <Icon
                                icon="material-symbols:arrow-back"
                                width={24}
                            />
                        </button>

                        <h1 className="text-2xl font-semibold">Customer</h1>
                    </div>

                    <div className="flex gap-2">
                        <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
                            Download Excel
                        </button>
                        <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
                            Filter
                        </button>
                        <Link href={"/customer/add"}>
                            <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                                <Icon
                                    icon="material-symbols:add"
                                    className="text-lg"
                                />
                                Tambah Customer
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Cari nama, alamat, no. HP..."
                        className="w-full border px-4 py-2 rounded-md text-sm"
                    />
                </div>

                <div className="bg-white rounded-md shadow-sm divide-y">
                    <div className="grid grid-cols-12 items-center px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                        <div className="col-span-2">Nama</div>
                        <div className="col-span-2">Kategori</div>
                        <div className="col-span-2">Telepon</div>
                        <div className="col-span-5">Alamat</div>
                        <div className="col-span-1 text-right">Aksi</div>
                    </div>

                    {customers.map((customer, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                        >
                            <div className="col-span-2 flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-white"
                                    style={{ backgroundColor: getColor(idx) }}
                                >
                                    {getInitials(customer.name)}
                                </div>
                                <span className="font-medium text-gray-700">
                                    {customer.name}
                                </span>
                            </div>

                            <div className="col-span-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {customer.category}
                                </span>
                            </div>

                            <div className="col-span-2 flex items-center gap-1 text-green-600">
                                <Icon icon="ic:baseline-whatsapp" />
                                {customer.phone}
                            </div>

                            <div className="col-span-5 text-gray-600 text-sm whitespace-pre-line truncate">
                                {customer.address}
                            </div>

                            <div className="col-span-1 flex gap-2 justify-end text-lg text-gray-500">
                                <button className="hover:text-blue-600">
                                    <Icon icon="mdi:pencil-outline" />
                                </button>
                                <button className="hover:text-red-600">
                                    <Icon icon="mdi:trash-outline" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

function getInitials(name) {
    const words = name.split(" ");
    return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

function getColor(index) {
    const colors = [
        "#EF4444",
        "#3B82F6",
        "#10B981",
        "#8B5CF6",
        "#F59E0B",
        "#14B8A6",
    ];
    return colors[index % colors.length];
}
