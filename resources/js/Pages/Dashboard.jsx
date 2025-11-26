import DashboardLayout from "../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { useState, useEffect } from "react";
import api from '@/api/axios';

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState({
        summaryCards: [],
        salesChart: {
            categories: [],
            data: [],
            title: '',
            ordersCount: []
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/dashboard');
                
                if (response.data.success) {
                    setDashboardData(response.data.data);

                } else {
                    setError('Gagal mengambil data dashboard');
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Terjadi kesalahan saat mengambil data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            const response = await api.get('/dashboard');
            if (response.data.success) {
                setDashboardData(response.data.data);
                setError(null);
            }
        } catch (err) {
            console.error('Error refreshing dashboard data:', err);
            setError('Terjadi kesalahan saat memperbarui data');
        } finally {
            setRefreshing(false);
        }
    };

    const formatNumber = (value) => {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('id-ID').format(value);
        }
        return value;
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

    const salesChartOptions = {
        chart: {
            type: "line",
            height: 320,
        },
        title: {
            text: dashboardData.salesChart.title || "Grafik Penjualan Mingguan",
        },
        xAxis: {
            categories: dashboardData.salesChart.categories,
        },
        yAxis: {
            title: {
                text: "Total Penjualan (Rp)",
            },
        },
        tooltip: {
            shared: true,
            formatter: function() {
                const val = this.points ? this.points[0].y : this.y;
                const idx = this.points ? this.points[0].point.index : this.point.index;
                const orders = (dashboardData.salesChart.ordersCount || [])[idx] ?? 0;
                return `Order: ${new Intl.NumberFormat('id-ID').format(orders)}<br/>Pendapatan: ${formatCurrency(val)}<br/>`;
            }
        },
        series: [
            {
                name: "Pendapatan Harian",
                data: dashboardData.salesChart.data,
            },
        ],
    };
    return (
        <DashboardLayout>
            <div className="text-gray-800" style={{maxWidth: '99%'}}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className={`px-3 py-2 rounded-md text-sm font-medium border ${refreshing || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                    >
                        {refreshing ? 'Memuat...' : 'Refresh'}
                    </button>
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

                {/* Summary Cards */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {dashboardData.summaryCards && dashboardData.summaryCards.length > 0 ? (
                            dashboardData.summaryCards.map((item, i) => (
                                <div
                                    key={i}
                                    className={`rounded-lg p-4 ${item.color} flex items-center justify-between shadow`}
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {item.label}
                                        </div>
                                        <div className="text-xl font-bold">
                                            {formatNumber(item.value)}
                                        </div>
                                    </div>
                                    <Icon icon={item.icon || 'solar:chart-outline'} width={32} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-4 bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-600">
                                Tidak ada data ringkasan.
                            </div>
                        )}
                    </div>
                )}

                {/* Chart */}
                {!loading && !error && (
                    <div className="bg-white rounded-lg shadow p-6">
                        {dashboardData.salesChart && (dashboardData.salesChart.categories?.length || 0) > 0 ? (
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={salesChartOptions}
                            />
                        ) : (
                            <div className="text-center text-gray-600 py-8">Grafik belum memiliki data.</div>
                        )}
                    </div>
                )}

                {!loading && !error && dashboardData.activity && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Order Hari Ini</h2>
                                    {dashboardData.activity.todayOrders?.summary && (
                                        <div className="text-sm text-gray-600">
                                            Total: {formatNumber(dashboardData.activity.todayOrders.summary.total)} • Pendapatan: Rp {formatNumber(dashboardData.activity.todayOrders.summary.total_revenue)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-600">
                                            <th className="px-6 py-3 text-left">Order</th>
                                            <th className="px-6 py-3 text-left">Customer</th>
                                            <th className="px-6 py-3 text-left">Status</th>
                                            <th className="px-6 py-3 text-left">Total</th>
                                            <th className="px-6 py-3 text-left">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dashboardData.activity.todayOrders?.list?.length ? (
                                            dashboardData.activity.todayOrders.list.map((o) => (
                                                <tr key={o.id} className="text-sm">
                                                    <td className="px-6 py-3 font-medium text-gray-900">{o.order_number}</td>
                                                    <td className="px-6 py-3 text-gray-700">{o.customer_name || '-'}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">Rp {formatNumber(o.total_price || 0)}</td>
                                                    <td className="px-6 py-3 text-gray-600">{new Date(o.created_at).toLocaleTimeString('id-ID')}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-6 text-center text-gray-600">Belum ada order hari ini.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Stok Masuk Hari Ini</h2>
                                    {dashboardData.activity.todayStockIn?.summary && (
                                        <div className="text-sm text-gray-600">
                                            Total Masuk: {formatNumber(dashboardData.activity.todayStockIn.summary.total_added)} • Transaksi: {formatNumber(dashboardData.activity.todayStockIn.summary.records)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-600">
                                            <th className="px-6 py-3 text-left">Produk</th>
                                            <th className="px-6 py-3 text-left">Variant</th>
                                            <th className="px-6 py-3 text-left">SKU</th>
                                            <th className="px-6 py-3 text-left">Qty</th>
                                            <th className="px-6 py-3 text-left">Oleh</th>
                                            <th className="px-6 py-3 text-left">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dashboardData.activity.todayStockIn?.list?.length ? (
                                            dashboardData.activity.todayStockIn.list.map((m) => (
                                                <tr key={m.id} className="text-sm">
                                                    <td className="px-6 py-3 font-medium text-gray-900">{m.product || '-'}</td>
                                                    <td className="px-6 py-3 text-gray-700">{m.variant || '-'}</td>
                                                    <td className="px-6 py-3 text-gray-700">{m.sku || '-'}</td>
                                                    <td className="px-6 py-3 text-gray-900">{formatNumber(m.quantity || 0)}</td>
                                                    <td className="px-6 py-3 text-gray-700">{m.created_by || 'System'}</td>
                                                    <td className="px-6 py-3 text-gray-600">{new Date(m.created_at).toLocaleTimeString('id-ID')}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-6 text-center text-gray-600">Belum ada stok masuk hari ini.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
