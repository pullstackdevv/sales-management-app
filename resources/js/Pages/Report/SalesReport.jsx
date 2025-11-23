import { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from '@/api/axios';

export default function SalesReport() {
    const [reportData, setReportData] = useState({
        categories: [],
        data: [],
        summary: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchSalesData();
    }, []);

    const fetchSalesData = async (start_date = '', end_date = '') => {
        try {
            setLoading(true);

            const params = {};
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const response = await api.get('/reports/sales', { params });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setReportData({
                    categories: data.labels,
                    data: data.data,
                    summary: data.summary
                });
            } else {
                setError('Gagal mengambil data laporan penjualan');
            }
        } catch (err) {
            console.error('Error fetching sales data:', err);
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        chart: {
            type: 'column'
        },
        title: { text: null },
        xAxis: { 
            categories: reportData.categories,
            title: { text: 'Periode' }
        },
        yAxis: { 
            title: { text: 'Total Penjualan (Rp)' },
            labels: {
                formatter: function() {
                    return 'Rp ' + Highcharts.numberFormat(this.value, 0, ',', '.');
                }
            }
        },
        tooltip: {
            formatter: function() {
                return '<b>' + this.x + '</b><br/>' +
                    'Total: Rp ' + Highcharts.numberFormat(this.y, 0, ',', '.');
            }
        },
        series: [{ 
            name: "Penjualan", 
            data: reportData.data,
            color: '#3b82f6'
        }],
        credits: { enabled: false }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
                    <p className="text-sm text-gray-600 mt-1">Grafik penjualan berdasarkan periode</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Tanggal Mulai"
                    />
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Tanggal Akhir"
                    />
                    <button 
                        onClick={() => fetchSalesData(startDate, endDate)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
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

            {/* Chart */}
            {!loading && !error && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-600 mb-1">Total Order</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {reportData.summary.total_orders || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">
                                Rp {(reportData.summary.total_revenue || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                            <p className="text-sm text-gray-600 mb-1">Rata-rata per Bulan</p>
                            <p className="text-2xl font-bold text-gray-800">
                                Rp {(reportData.summary.average_monthly || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Grafik Penjualan</h2>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={chartOptions}
                        />
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
