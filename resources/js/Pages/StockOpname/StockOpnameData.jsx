import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";
import api from "@/api/axios";

export default function StockOpnamePage() {
    const [stockOpnames, setStockOpnames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStockOpnames();
    }, []);

    const fetchStockOpnames = async () => {
        try {
            setLoading(true);
            const response = await api.get('/stock-opnames');
            setStockOpnames(response.data.data.data || []);
        } catch (error) {
            console.error('Error fetching stock opnames:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
            completed: { color: 'bg-green-100 text-green-800', text: 'Selesai' },
            cancelled: { color: 'bg-red-100 text-red-800', text: 'Dibatalkan' }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

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
                        <div className="col-span-2">Tanggal Stok Opname</div>
                        <div className="col-span-2">ID Stok Opname</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Dibuat Oleh</div>
                        <div className="col-span-2">Detail Produk</div>
                        <div className="col-span-2">Keterangan</div>
                    </div>

                    {loading ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Icon icon="eos-icons:loading" className="text-2xl mx-auto mb-2" />
                            Memuat data...
                        </div>
                    ) : stockOpnames.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            Tidak ada data stok opname
                        </div>
                    ) : (
                        stockOpnames.map((item) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-gray-50"
                            >
                                <div className="col-span-2">
                                    {formatDate(item.opname_date)}
                                </div>
                                <div className="col-span-2 font-semibold">
                                    #{item.id}
                                </div>
                                <div className="col-span-2">
                                    {getStatusBadge(item.status)}
                                </div>
                                <div className="col-span-2">
                                    {item.created_by?.name || 'N/A'}
                                </div>
                                <div className="col-span-2">
                                    {item.details?.length || 0} produk
                                </div>
                                <div className="col-span-2 text-gray-700">
                                    {item.note || '-'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
