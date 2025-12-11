import * as React from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from '@/api/axios';

const SalesReport = () => {
    const [reportData, setReportData] = React.useState({
        categories: [],
        data: [],
        summary: {}
    });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');

    const [dailyReport, setDailyReport] = React.useState({
        categories: [],
        data: [], // revenue
        orders: [],
        items: [],
        summary: {}
    });
    const [dailyLoading, setDailyLoading] = React.useState(true);
    const [dailyError, setDailyError] = React.useState(null);
    const [dailyMonth, setDailyMonth] = React.useState(() => {
        const d = new Date();
        return d.toISOString().slice(0, 7);
    });
    const [dailyStartDate, setDailyStartDate] = React.useState('');
    const [dailyEndDate, setDailyEndDate] = React.useState('');
    const [dailyMetric, setDailyMetric] = React.useState('orders'); // 'orders' | 'items' | 'revenue'

    React.useEffect(() => {
        fetchSalesData();
    }, []);

    React.useEffect(() => {
        fetchDailySalesData({ month: dailyMonth });
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

    const fetchDailySalesData = async ({ start_date = '', end_date = '', month = '' } = {}) => {
        try {
            setDailyLoading(true);

            const params = {};
            if (month) params.month = month;
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const response = await api.get('/reports/sales/daily', { params });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setDailyReport({
                    categories: data.labels,
                    data: data.data,
                    orders: data.orders || [],
                    items: data.items || [],
                    summary: data.summary
                });
                setDailyError(null);
            } else {
                setDailyError('Gagal mengambil data laporan harian');
            }
        } catch (err) {
            console.error('Error fetching daily sales data:', err);
            setDailyError('Terjadi kesalahan saat mengambil data harian');
        } finally {
            setDailyLoading(false);
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

    const dailySeriesData = dailyMetric === 'orders'
        ? dailyReport.orders
        : dailyMetric === 'items'
            ? dailyReport.items
            : dailyReport.data;

    const dailyYAxisTitle = dailyMetric === 'revenue'
        ? 'Total Penjualan (Rp)'
        : dailyMetric === 'orders'
            ? 'Jumlah Transaksi'
            : 'Jumlah Item Terjual';

    const dailyChartOptions = {
        chart: { type: 'column' },
        title: { text: null },
        xAxis: {
            categories: dailyReport.categories,
            title: { text: 'Tanggal' }
        },
        yAxis: {
            title: { text: dailyYAxisTitle },
            labels: {
                formatter: function() {
                    if (dailyMetric === 'revenue') {
                        return 'Rp ' + Highcharts.numberFormat(this.value, 0, ',', '.');
                    }
                    return Highcharts.numberFormat(this.value, 0, ',', '.');
                }
            }
        },
        tooltip: {
            formatter: function() {
                if (dailyMetric === 'revenue') {
                    return 'Total: Rp ' + Highcharts.numberFormat(this.y, 0, ',', '.');
                }
                const label = dailyMetric === 'orders' ? 'Transaksi' : 'Item';
                return label + ': ' + Highcharts.numberFormat(this.y, 0, ',', '.');
            }
        },
        series: [{ name: dailyYAxisTitle, data: dailySeriesData, color: '#f59e0b' }],
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

                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Grafik Harian Penjualan</h2>
                                <p className="text-sm text-gray-600 mt-1">Filter berdasarkan bulan atau rentang tanggal</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="month"
                                    value={dailyMonth}
                                    onChange={(e) => setDailyMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <button
                                    onClick={() => fetchDailySalesData({ month: dailyMonth })}
                                    className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors duration-200"
                                >
                                    Tampilkan Bulan
                                </button>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => setDailyMetric('orders')}
                                        className={`px-3 py-2 rounded text-sm ${dailyMetric === 'orders' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                                    >Transaksi</button>
                                    <button
                                        onClick={() => setDailyMetric('items')}
                                        className={`px-3 py-2 rounded text-sm ${dailyMetric === 'items' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                                    >Item</button>
                                    <button
                                        onClick={() => setDailyMetric('revenue')}
                                        className={`px-3 py-2 rounded text-sm ${dailyMetric === 'revenue' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                                    >Revenue</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="date"
                                value={dailyStartDate}
                                onChange={(e) => setDailyStartDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                placeholder="Tanggal Mulai"
                            />
                            <input
                                type="date"
                                value={dailyEndDate}
                                onChange={(e) => setDailyEndDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                placeholder="Tanggal Akhir"
                            />
                            <button
                                onClick={() => fetchDailySalesData({ start_date: dailyStartDate, end_date: dailyEndDate })}
                                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors duration-200"
                            >
                                Cari Laporan Harian
                            </button>
                        </div>

                        {dailyLoading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="text-gray-600">Memuat data harian...</div>
                            </div>
                        )}

                        {dailyError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                                {dailyError}
                            </div>
                        )}

                        {!dailyLoading && !dailyError && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <HighchartsReact highcharts={Highcharts} options={dailyChartOptions} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
export default SalesReport;
