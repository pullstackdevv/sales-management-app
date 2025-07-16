import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";

export default function CustomerData() {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        api.get("/customers").then((response) => {
            setCustomers(response.data.data.data); // Adjust if nesting differs
        });
    }, []);

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

                    {customers.map((customer, idx) => {
                        const defaultAddress = customer.addresses?.find(
                            (a) => a.is_default
                        );
                        const addressDisplay = defaultAddress
                            ? `${defaultAddress.address_detail}, ${defaultAddress.district}, ${defaultAddress.city}, ${defaultAddress.province} - ${defaultAddress.postal_code}`
                            : "-";

                        const phoneNumber = customer.phone?.replace(/^0/, "62");
                        const waLink = `https://wa.me/${phoneNumber}`;

                        return (
                            <div
                                key={customer.id}
                                className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                            >
                                <div className="col-span-2 flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-white"
                                        style={{
                                            backgroundColor: getColor(idx),
                                        }}
                                    >
                                        {getInitials(customer.name)}
                                    </div>
                                    <span className="font-medium text-gray-700">
                                        {customer.name}
                                    </span>
                                </div>

                                <div className="col-span-2">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        Customer
                                    </span>
                                </div>

                                <div className="col-span-2 flex items-center gap-1 text-green-600">
                                    <Icon icon="ic:baseline-whatsapp" />
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                    >
                                        {customer.phone}
                                    </a>
                                </div>

                                <div className="col-span-5 text-gray-600 text-sm whitespace-pre-line truncate">
                                    {addressDisplay}
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
                        );
                    })}
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
