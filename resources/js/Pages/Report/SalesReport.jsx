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
    data: [],
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
  const [dailyMetric, setDailyMetric] = React.useState('orders');

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
    title: {
      text: null
    },
    xAxis: {
      categories: reportData.categories,
      title: {
        text: 'Periode'
      }
    },
    yAxis: {
      title: {
        text: 'Total Penjualan (Rp)'
      },
      labels: {
        formatter: function () {
          return 'Rp ' + Highcharts.numberFormat(this.value, 0, ',', '.');
        }
      }
    },
    tooltip: {
      formatter: function () {
        const idx = this.point.index;
        const orders = (reportData.orders || [])[idx] || 0;
        const category = reportData.categories[idx] || '';
        return category + '<br>' +
          'Transaksi: ' + Highcharts.numberFormat(orders, 0, ',', '.') + '<br>' +
          'Total: Rp ' + Highcharts.numberFormat(this.y, 0, ',', '.');
      }
    },
    series: [{
      name: "Penjualan",
      data: reportData.data,
      color: '#3b82f6'
    }],
    credits: {
      enabled: false
    }
  };

  const dailySeriesData = dailyMetric === 'orders' ? dailyReport.orders :
    dailyMetric === 'items' ? dailyReport.items : dailyReport.data;

  const dailyYAxisTitle = dailyMetric === 'revenue' ? 'Total Penjualan (Rp)' :
    dailyMetric === 'orders' ? 'Jumlah Transaksi' : 'Jumlah Item Terjual';

  const dailyChartOptions = {
    chart: {
      type: 'column'
    },
    title: {
      text: null
    },
    xAxis: {
      categories: dailyReport.categories,
      title: {
        text: 'Tanggal'
      }
    },
    yAxis: {
      title: {
        text: dailyYAxisTitle
      },
      labels: {
        formatter: function () {
          if (dailyMetric === 'revenue') {
            return 'Rp ' + Highcharts.numberFormat(this.value, 0, ',', '.');
          }
          return Highcharts.numberFormat(this.value, 0, ',', '.');
        }
      }
    },
    tooltip: {
      formatter: function () {
        const date = dailyReport.categories[this.point.index];
        if (dailyMetric === 'revenue') {
          return date + '<br>Total: Rp ' + Highcharts.numberFormat(this.y, 0, ',', '.');
        }
        const label = dailyMetric === 'orders' ? 'Transaksi' : 'Item';
        return date + '<br>' + label + ': ' + Highcharts.numberFormat(this.y, 0, ',', '.');
      }
    },
    series: [{
      name: dailyYAxisTitle,
      data: dailySeriesData,
      color: '#f59e0b'
    }],
    credits: {
      enabled: false
    }
  };

  const handleExportSales = async () => {
    try {
      const payload = {};
      if (dailyStartDate && dailyEndDate) {
        payload.start_date = dailyStartDate;
        payload.end_date = dailyEndDate;
      } else if (dailyMonth) {
        payload.month = dailyMonth;
      }
      const response = await api.post('/reports/export-sales', payload);
      if (response.data?.status === 'success') {
        const url = response.data?.data?.url;
        if (url) window.open(url, '_blank');
      }
    } catch (e) { }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
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
                  value={dailyMonth}
                  onChange={(e) => setDailyMonth(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                  className="bg-amber-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors duration-200 whitespace-nowrap"
                >
                  Tampilkan Bulan
                </button>
                <button
                  onClick={handleExportSales}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 whitespace-nowrap"
                >
                  Unduh Excel
                </button>
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={dailyStartDate}
                  onChange={(e) => setDailyStartDate(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Tanggal Mulai"
                />
                <input
                  type="date"
                  value={dailyEndDate}
                  onChange={(e) => setDailyEndDate(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Tanggal Akhir"
                />
                <button
                  onClick={() => {
                    fetchDailySalesData({ start_date: dailyStartDate, end_date: dailyEndDate });
                    if (dailyStartDate && dailyEndDate) {
                      fetchSalesData(dailyStartDate, dailyEndDate);
                    }
                  }}
                  className="bg-amber-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors duration-200 whitespace-nowrap"
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

          {!loading && !error && (
            <>
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {/* Pendapatan */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Total Penjualan</span>
                      <span className="text-xs text-gray-400">(Termasuk Ongkos Kirim & Diskon)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.total_revenue || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Total Penjualan */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Pendapatan</span>
                      <span className="text-xs text-gray-400">(Total Penjualan - ongkir)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.total_order_amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Penjualan Kotor */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Penjualan Kotor</span>
                      <span className="text-xs text-gray-400">(Termasuk Ongkos Kirim & Diskon)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.gross_sales || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Penjualan Bersih */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Penjualan Bersih</span>
                      <span className="text-xs text-gray-400">(Penjualan kotor - ongkir)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.net_sales || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Ongkos Kirim */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Ongkos Kirim</span>
                      <span className="text-xs text-gray-400">(Total Ongkos Kirim)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.shipping_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Diskon */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Diskon</span>
                      <span className="text-xs text-gray-400">(Total Diskon)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.discounts_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Biaya Tambahan */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Biaya Tambahan Lainnya</span>
                      <span className="text-xs text-gray-400">(Total Biaya Tambahan Lainnya)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.other_fees || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* HPP */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Harga Pokok Penjualan (HPP)</span>
                      <span className="text-xs text-gray-400">(Total Harga Pokok Penjualan)</span>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.hpp_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Laba Kotor */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Laba Kotor</span>
                      <span className="text-xs text-gray-400">(Penjualan Bersih - HPP)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.gross_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Biaya Operasional */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Biaya Operasional</span>
                      <span className="text-xs text-gray-400">(Total Pengeluaran)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.operational_cost || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Laba Bersih */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Laba Bersih</span>
                      <span className="text-xs text-gray-400">(Laba Kotor - Biaya Operasional)</span>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    Rp {(dailyReport.summary.net_profit || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Piutang */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Piutang</span>
                      <span className="text-xs text-gray-400">(Total Biaya Belum Terbayarkan)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.receivables_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Transaksi */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Transaksi</span>
                      <span className="text-xs text-gray-400">(Total Transaksi Terbayarkan)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    {dailyReport.summary.total_orders || 0}
                  </div>
                </div>

                {/* Item Terjual */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Item Terjual</span>
                      <span className="text-xs text-gray-400">(Total Item Terjual)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    {dailyReport.summary.total_items || 0}
                  </div>
                </div>

                {/* Nilai Produk */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Nilai Produk ({dailyReport.summary.current_stock_total || 0} stok produk)</span>
                      <span className="text-xs text-gray-400">(Total Nilai Produk Stok Saat Ini)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.product_value_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Nilai Modal */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Nilai Modal ({dailyReport.summary.current_stock_total || 0} stok produk)</span>
                      <span className="text-xs text-gray-400">(Total Nilai Modal Stok Saat Ini)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
                    Rp {(dailyReport.summary.modal_value_total || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Monthly Chart */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Grafik Penjualan Bulanan</h2>
                  <div className="w-full overflow-x-auto">
                    <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                  </div>
                </div>

                {/* Daily Chart */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Grafik Harian Penjualan</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDailyMetric('orders')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${dailyMetric === 'orders' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                      >
                        Transaksi
                      </button>
                      <button
                        onClick={() => setDailyMetric('items')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${dailyMetric === 'items' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                      >
                        Item
                      </button>
                      <button
                        onClick={() => setDailyMetric('revenue')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${dailyMetric === 'revenue' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                      >
                        Revenue
                      </button>
                    </div>
                  </div>

                  {dailyLoading && (
                    <div className="text-center py-8 text-gray-600">Memuat data harian...</div>
                  )}

                  {dailyError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{dailyError}</p>
                    </div>
                  )}

                  {!dailyLoading && !dailyError && (
                    <div className="w-full overflow-x-auto">
                      <HighchartsReact highcharts={Highcharts} options={dailyChartOptions} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesReport;
