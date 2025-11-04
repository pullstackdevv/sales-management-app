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
            data: []
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const salesChartOptions = {
        chart: {
            type: "line",
        },
        title: {
            text: "Grafik Penjualan Mingguan",
        },
        xAxis: {
            categories: dashboardData.salesChart.categories,
        },
        yAxis: {
            title: {
                text: "Jumlah Penjualan",
            },
        },
        series: [
            {
                name: "Item Terjual",
                data: dashboardData.salesChart.data,
            },
        ],
    };
    return (
        <DashboardLayout>
            <div className="text-gray-800" style={{maxWidth: '99%'}}>
                {/* Header */}
                <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

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
                        {dashboardData.summaryCards.map((item, i) => (
                            <div
                                key={i}
                                className={`rounded-lg p-4 ${item.color} flex items-center justify-between shadow`}
                            >
                                <div>
                                    <div className="text-sm font-medium">
                                        {item.label}
                                    </div>
                                    <div className="text-xl font-bold">
                                        {item.value}
                                    </div>
                                </div>
                                <Icon icon={item.icon} width={32} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Chart */}
                {!loading && !error && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={salesChartOptions}
                        />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
