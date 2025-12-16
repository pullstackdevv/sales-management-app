import * as React from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from '@/api/axios';

const SalesReport = () => {
    const [reportData, setReportData] = React.useState({
        categories: [],
        data: [],
        orders: [],
        summary: {}
    });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    

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
                    orders: data.orders || [],
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
                const idx = this.point.index;
                const orders = (reportData.orders || [])[idx] || 0;
                return 'Transaksi: ' + Highcharts.numberFormat(orders, 0, ',', '.') + '<br/><br/>' +
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
            <div className="max-w-screen mx-auto px-4 overflow-x-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
                    <p className="text-sm text-gray-600 mt-1">Filter terpusat untuk kartu ringkasan dan grafik harian</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={dailyMonth}
                        onChange={(e) => setDailyMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <button
                        onClick={() => {
                            fetchDailySalesData({ month: dailyMonth });
                            const [yearStr, monthStr] = dailyMonth.split('-');
                            const year = parseInt(yearStr, 10);
                            const month = parseInt(monthStr, 10);
                            const daysInMonth = new Date(year, month, 0).getDate();
                            const start_date = `${yearStr}-${monthStr.padStart(2, '0')}-01`;
                            const end_date = `${yearStr}-${monthStr.padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
                            fetchSalesData(start_date, end_date);
                        }}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors duration-200"
                    >
                        Tampilkan Bulan
                    </button>
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
                        onClick={() => {
                            fetchDailySalesData({ start_date: dailyStartDate, end_date: dailyEndDate });
                            if (dailyStartDate && dailyEndDate) {
                                fetchSalesData(dailyStartDate, dailyEndDate);
                            }
                        }}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors duration-200"
                    >
                        Terapkan Rentang
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

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Pendapatan</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.total_revenue || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Total Penjualan</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.total_order_amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Penjualan Kotor</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.gross_sales || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Penjualan Bersih</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.net_sales || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Ongkos Kirim</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.shipping_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Diskon</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.discounts_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Biaya Tambahan Lainnya</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.other_fees || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Harga Pokok Penjualan (HPP)</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.hpp_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Laba Kotor</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.gross_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Biaya Operasional</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.operational_cost || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Laba Bersih</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.net_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Piutang</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.receivables_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Transaksi</p>
                            <p className="text-2xl font-bold text-gray-800">{dailyReport.summary.total_orders || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Item Terjual</p>
                            <p className="text-2xl font-bold text-gray-800">{dailyReport.summary.total_items || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Nilai Produk</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.product_value_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Nilai Modal</p>
                            <p className="text-2xl font-bold text-gray-800">Rp {(dailyReport.summary.modal_value_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Grafik Penjualan Bulanan</h2>
                        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Grafik Harian Penjualan</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setDailyMetric('orders')} className={`px-3 py-2 rounded text-sm ${dailyMetric === 'orders' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Transaksi</button>
                                <button onClick={() => setDailyMetric('items')} className={`px-3 py-2 rounded text-sm ${dailyMetric === 'items' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Item</button>
                                <button onClick={() => setDailyMetric('revenue')} className={`px-3 py-2 rounded text-sm ${dailyMetric === 'revenue' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Revenue</button>
                            </div>
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
            </div>
        </DashboardLayout>
    );
}
export default SalesReport;
