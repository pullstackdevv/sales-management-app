import { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from '@/api/axios';
import { Icon } from "@iconify/react";

export default function CourierReport() {
    const [reportData, setReportData] = useState({
        couriers: [],
        summary: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchCourierData();
    }, []);

    const fetchCourierData = async (start_date = '', end_date = '') => {
        try {
            setLoading(true);

            const params = {};
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const response = await api.get('/reports/courier-data', { params });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setReportData({
                    couriers: data.couriers,
                    summary: data.summary
                });
            } else {
                setError('Gagal mengambil data ekspedisi');
            }
        } catch (err) {
            console.error('Error fetching courier data:', err);
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Ekspedisi</h1>
                    <p className="text-sm text-gray-600 mt-1">Laporan penggunaan ekspedisi</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                        placeholder="Tanggal Mulai"
                    />
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                        placeholder="Tanggal Akhir"
                    />
                    <button 
                        onClick={() => fetchCourierData(startDate, endDate)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2"
                    >
                        <span>Cari Laporan</span>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="text-gray-600">Memuat data...</div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Data */}
            {!loading && !error && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                            <p className="text-sm text-gray-600 mb-1">Total Order</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {reportData.summary.total_orders || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
                            <p className="text-sm text-gray-600 mb-1">Total Biaya Kirim</p>
                            <p className="text-2xl font-bold text-gray-800">
                                Rp {(reportData.summary.total_cost || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-600 mb-1">Ekspedisi Aktif</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {reportData.summary.active_couriers || 0}
                            </p>
                        </div>
                    </div>

                    {/* Courier List */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Detail Penggunaan per Ekspedisi</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ekspedisi
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jumlah Order
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Biaya
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Persentase
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.couriers.length > 0 ? (
                                        reportData.couriers.map((courier, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Icon icon="solar:box-outline" className="w-5 h-5 text-orange-500 mr-2" />
                                                        <span className="text-sm font-medium text-gray-900">{courier.courier_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {courier.order_count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    Rp {courier.total_cost.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-orange-500 h-2 rounded-full" 
                                                                style={{ width: `${courier.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            {courier.percentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                                                Tidak ada data ekspedisi
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
