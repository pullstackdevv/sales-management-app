import { useState, useEffect } from "react";
import { FaBoxOpen, FaUser, FaCrown } from "react-icons/fa";
import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from '@/api/axios';

export default function Analyzer() {
    const [analyzerData, setAnalyzerData] = useState({
        totalSales: 0,
        totalCustomers: 0,
        totalProducts: 0,
        bestSellers: [],
        bestCustomers: [],
        chartData: {
            categories: [],
            data: []
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalyzerData();
    }, []);

    const fetchAnalyzerData = async () => {
        try {
            setLoading(true);

            const response = await api.get('/analyzer');

            if (response.data.success) {
                const data = response.data.data;
                setAnalyzerData({
                    totalSales: data.summary.totalSales,
                    totalCustomers: data.summary.totalCustomers,
                    totalProducts: data.summary.totalProducts,
                    bestSellers: data.bestSellers,
                    bestCustomers: data.bestCustomers,
                    chartData: data.chartData
                });
            } else {
                setError('Gagal mengambil data analyzer');
            }
        } catch (err) {
            console.error('Error fetching analyzer data:', err);
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        title: { text: null },
        xAxis: { categories: analyzerData.chartData.categories },
        yAxis: { title: null },
        series: [
            { name: "Penjualan Item", data: analyzerData.chartData.data },
        ],
    };

    return (
        <DashboardLayout>
             <div className="text-gray-800" style={{maxWidth: '99%'}}>
            <h1 className="text-xl font-bold mb-6">Analyzer</h1>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Memuat data...</div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Summary Section */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center bg-gradient-to-r from-green-100 to-green-50 rounded shadow p-4">
                        <FaBoxOpen className="text-green-500 text-2xl mr-3" />
                        <div>
                            <div className="text-xs text-gray-500">
                                Total Penjualan
                            </div>
                            <div className="font-bold text-lg">
                                {analyzerData.totalSales}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 rounded shadow p-4">
                        <FaUser className="text-blue-500 text-2xl mr-3" />
                        <div>
                            <div className="text-xs text-gray-500">
                                Total Pelanggan
                            </div>
                            <div className="font-bold text-lg">
                                {analyzerData.totalCustomers}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-50 rounded shadow p-4">
                        <FaBoxOpen className="text-yellow-500 text-2xl mr-3" />
                        <div>
                            <div className="text-xs text-gray-500">
                                Total Produk
                            </div>
                            <div className="font-bold text-lg">
                                {analyzerData.totalProducts}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded shadow p-4">
                        <h2 className="font-semibold mb-3 flex items-center gap-2">
                            <FaCrown className="text-yellow-500" /> Penjualan
                            Terbaik
                        </h2>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {analyzerData.bestSellers.map((item, i) => (
                                <li
                                    key={i}
                                    className={`flex justify-between items-center border-b py-1 transition hover:bg-yellow-50 rounded ${
                                        i === 0 ? "font-bold" : ""
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={`inline-block w-6 text-center rounded-full ${
                                                i === 0
                                                    ? "bg-yellow-400 text-white"
                                                    : i === 1
                                                    ? "bg-gray-300"
                                                    : "bg-yellow-200"
                                            }`}
                                        >
                                            {i + 1}
                                        </span>
                                        {item.name}
                                    </span>
                                    <span>{item.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded shadow p-4">
                        <h2 className="font-semibold mb-3 flex items-center gap-2">
                            <FaUser className="text-blue-500" /> Pelanggan Terbaik
                        </h2>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {analyzerData.bestCustomers.map((item, i) => (
                                <li
                                    key={i}
                                    className={`flex justify-between items-center border-b py-1 transition hover:bg-blue-50 rounded ${
                                        i === 0 ? "font-bold" : ""
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={`inline-block w-6 text-center rounded-full ${
                                                i === 0
                                                    ? "bg-blue-400 text-white"
                                                    : i === 1
                                                    ? "bg-gray-300"
                                                    : "bg-blue-200"
                                            }`}
                                        >
                                            {i + 1}
                                        </span>
                                        {item.name}
                                    </span>
                                    <span>{item.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className="mt-6 bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-3">Grafik Penjualan</h2>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={{
                            ...chartOptions,
                            chart: {
                                type: "areaspline",
                                backgroundColor: "#f9fafb",
                            },
                            colors: ["#34d399"],
                            legend: { enabled: true },
                            tooltip: { valueSuffix: " item" },
                            title: { text: "Tren Penjualan Mingguan" },
                        }}
                    />
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
