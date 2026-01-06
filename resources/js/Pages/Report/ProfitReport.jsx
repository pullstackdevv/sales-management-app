import { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from '@/api/axios';

export default function ProfitReport() {
    const [reportData, setReportData] = useState({
        categories: [],
        dates: [],
        grossProfit: [],
        netProfit: [],
        summary: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Helper untuk mendapatkan bulan saat ini dalam format YYYY-MM (Local Time)
    const getCurrentMonth = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const getMonthDateRange = (monthStr) => {
        if (!monthStr) return { start: '', end: '' };
        const [yearStr, monthStrPart] = monthStr.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStrPart, 10);
        const lastDay = new Date(year, month, 0).getDate();
        
        return {
            start: `${yearStr}-${monthStrPart}-01`,
            end: `${yearStr}-${monthStrPart}-${String(lastDay).padStart(2, '0')}`
        };
    };

    // Initialize state with consistent local time values
    const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
    const [startDate, setStartDate] = useState(() => getMonthDateRange(getCurrentMonth()).start);
    const [endDate, setEndDate] = useState(() => getMonthDateRange(getCurrentMonth()).end);

    useEffect(() => {
        fetchProfitData(startDate, endDate);
    }, []);

    const handleMonthFilter = () => {
        if (!currentMonth) return;
        const { start, end } = getMonthDateRange(currentMonth);
        
        setStartDate(start);
        setEndDate(end);
        fetchProfitData(start, end);
    };

    const handleDateRangeFilter = () => {
        fetchProfitData(startDate, endDate);
    };

    const fetchProfitData = async (start_date = '', end_date = '') => {
        try {
            setLoading(true);

            const params = {};
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const response = await api.get('/reports/profit', { params });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setReportData({
                    categories: data.labels,
                    dates: data.dates || [],
                    grossProfit: data.gross_profit || data.data, // fallback untuk kompatibilitas
                    netProfit: data.net_profit || [],
                    summary: data.summary,
                    calculation: data.calculation_explanation || {}
                });
            } else {
                setError('Gagal mengambil data laporan keuntungan');
            }
        } catch (err) {
            console.error('Error fetching profit data:', err);
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        chart: {
            type: 'line',
            height: 400
        },
        title: { text: null },
        xAxis: { 
            categories: reportData.categories,
            title: { text: 'Periode' }
        },
        yAxis: { 
            title: { text: 'Keuntungan (Rp)' },
            labels: {
                formatter: function() {
                    return 'Rp ' + Highcharts.numberFormat(this.value, 0, ',', '.');
                }
            },
            plotLines: [{
                value: 0,
                color: '#666',
                width: 1,
                zIndex: 4,
                label: {
                    text: 'Break Even',
                    align: 'right',
                    style: {
                        color: '#666',
                        fontSize: '10px'
                    }
                }
            }]
        },
        tooltip: {
            shared: true,
            formatter: function() {
                const index = this.points[0].point.index;
                const dateLabel = reportData.dates && reportData.dates[index] ? reportData.dates[index] : this.x;
                
                let tooltip = '<b>' + dateLabel + '</b><br/>';
                this.points.forEach(point => {
                    const color = point.color;
                    const value = Highcharts.numberFormat(point.y, 0, ',', '.');
                    tooltip += `<span style="color:${color}">●</span> ${point.series.name}: <b>Rp ${value}</b><br/>`;
                });
                return tooltip;
            }
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    radius: 4
                },
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 3
                    }
                }
            }
        },
        series: [
            { 
                name: "Laba Kotor", 
                data: reportData.grossProfit,
                color: '#3b82f6',
                marker: {
                    symbol: 'circle'
                }
            },
            { 
                name: "Laba Bersih", 
                data: reportData.netProfit,
                color: '#22c55e',
                marker: {
                    symbol: 'circle'
                }
            }
        ],
        credits: { enabled: false },
        legend: {
            enabled: true,
            align: 'center',
            verticalAlign: 'top',
            layout: 'horizontal'
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Keuntungan</h1>
                        <p className="text-sm text-gray-600 mt-1">Grafik laba kotor dan laba bersih berdasarkan periode</p>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                            Filter terpusat untuk kartu ringkasan dan grafik harian
                        </h2>

                        {/* Month Filter */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="month"
                                    value={currentMonth}
                                    onChange={(e) => setCurrentMonth(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <button
                                    onClick={handleMonthFilter}
                                    className="bg-green-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200 whitespace-nowrap"
                                >
                                    Tampilkan Bulan
                                </button>
                            </div>

                            {/* Date Range Filter */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                    placeholder="Tanggal Mulai"
                                />
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                    placeholder="Tanggal Akhir"
                                />
                                <button 
                                    onClick={handleDateRangeFilter}
                                    className="bg-green-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200 whitespace-nowrap"
                                >
                                    Terapkan Rentang
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="text-gray-600">Memuat data...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
                                    <p className="text-sm text-gray-600 mb-1">Total Laba Kotor</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Rp {(reportData.summary.total_gross_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Gross Profit</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
                                    <p className="text-sm text-gray-600 mb-1">Total Laba Bersih</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Rp {(reportData.summary.total_net_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Net Profit</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-indigo-500">
                                    <p className="text-sm text-gray-600 mb-1">Rata-rata Laba Kotor</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Rp {(reportData.summary.average_monthly_gross_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Per Bulan</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-emerald-500">
                                    <p className="text-sm text-gray-600 mb-1">Rata-rata Laba Bersih</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Rp {(reportData.summary.average_monthly_net_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Per Bulan</p>
                                </div>
                            </div>

                            {/* Calculation Info */}
                            {reportData.calculation && Object.keys(reportData.calculation).length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Rumus Perhitungan:</h3>
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <p>• <strong>Penjualan Kotor:</strong> {reportData.calculation.penjualan_kotor}</p>
                                        <p>• <strong>Penjualan Bersih:</strong> {reportData.calculation.penjualan_bersih}</p>
                                        <p>• <strong>Laba Kotor:</strong> {reportData.calculation.laba_kotor}</p>
                                        <p>• <strong>Laba Bersih:</strong> {reportData.calculation.laba_bersih}</p>
                                    </div>
                                </div>
                            )}

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 gap-6 mb-6">
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Grafik Keuntungan</h2>
                                    <div className="w-full overflow-x-auto">
                                        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                                    </div>
                                </div>
                            </div>

                            {/* Legend Explanation */}
                            <div className="bg-gray-50 rounded-lg p-4 mt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Keterangan:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span><strong>Laba Kotor:</strong> Penjualan - HPP</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                        <span><strong>Laba Bersih:</strong> Laba Kotor - Biaya Operasional</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}