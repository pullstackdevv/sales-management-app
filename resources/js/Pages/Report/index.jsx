import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from '@/api/axios';

export default function Report() {
    const [reportData, setReportData] = useState({
        salesChart: {
            categories: [],
            data: []
        },
        profitChart: {
            categories: [],
            series: []
        },
        bankTransactions: [],
        courierData: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async (start_date = '', end_date = '') => {
        try {
            setLoading(true);

            const params = {};
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const response = await api.get('/reports', { params });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setReportData({
                    salesChart: {
                        categories: data.salesChart.labels,
                        data: data.salesChart.data
                    },
                    profitChart: {
                        categories: data.profitChart.labels,
                        series: [{
                            name: 'Profit',
                            data: data.profitChart.data
                        }]
                    },
                    bankTransactions: data.bankTransactions.banks,
                    courierData: data.courierData.couriers
                });
            } else {
                setError('Gagal mengambil data laporan');
            }
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const salesChartOptions = {
        title: { text: null },
        xAxis: { categories: reportData.salesChart.categories },
        yAxis: { title: null },
        series: [{ name: "Penjualan Item", data: reportData.salesChart.data }],
    };

    const profitChartOptions = {
        title: { text: null },
        xAxis: { categories: reportData.profitChart.categories },
        yAxis: { title: null },
        series: reportData.profitChart.series,
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Laporan</h1>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-1 text-sm" 
                        placeholder="Tanggal Mulai"
                    />
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded p-1 text-sm" 
                        placeholder="Tanggal Akhir"
                    />
                    <button 
                        onClick={() => fetchReportData(startDate, endDate)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        Cari Laporan
                    </button>
                </div>
            </div>

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

            {/* Charts */}
            {!loading && !error && (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded shadow p-4">
                        <h2 className="font-semibold mb-3">Grafik Penjualan</h2>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={salesChartOptions}
                        />
                    </div>

                    <div className="bg-white rounded shadow p-4">
                        <h2 className="font-semibold mb-3">Grafik Keuntungan</h2>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={profitChartOptions}
                        />
                    </div>
                </div>
            )}

            {/* Data Tables */}
            {!loading && !error && (
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white rounded shadow p-4">
                        <h2 className="font-semibold mb-3">Data Transaksi Bank</h2>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {reportData.bankTransactions.map((transaction, i) => (
                                <li
                                    key={i}
                                    className="flex justify-between border-b py-1"
                                >
                                    <span>{transaction.bank_name}</span>
                                    <span>Rp {transaction.total_amount.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded shadow p-4">
                        <h2 className="font-semibold mb-3">Ekspedisi</h2>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {reportData.courierData.map((courier, i) => (
                                <li
                                    key={i}
                                    className="flex justify-between border-b py-1"
                                >
                                    <span>{courier.courier_name}</span>
                                    <span>
                                        {courier.percentage}% - Rp {courier.total_cost.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
