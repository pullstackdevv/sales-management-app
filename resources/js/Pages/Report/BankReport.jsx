import { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from '@/api/axios';
import { Icon } from "@iconify/react";

export default function BankReport() {
    const [reportData, setReportData] = useState({
        banks: [],
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
        fetchBankData(startDate, endDate);
    }, []);

    const handleMonthFilter = () => {
        if (!currentMonth) return;
        const { start, end } = getMonthDateRange(currentMonth);
        
        setStartDate(start);
        setEndDate(end);
        fetchBankData(start, end);
    };

    const handleDateRangeFilter = () => {
        fetchBankData(startDate, endDate);
    };

    const fetchBankData = async (start_date = '', end_date = '') => {
        try {
            setLoading(true);

            const params = {};
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const response = await api.get('/reports/bank-transactions', { params });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setReportData({
                    banks: data.banks,
                    summary: data.summary
                });
            } else {
                setError('Gagal mengambil data transaksi bank');
            }
        } catch (err) {
            console.error('Error fetching bank data:', err);
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Data Transaksi Bank</h1>
                    <p className="text-sm text-gray-600 mt-1">Laporan transaksi berdasarkan bank</p>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                        Filter Periode
                    </h2>

                    {/* Month Filter */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="month"
                                value={currentMonth}
                                onChange={(e) => setCurrentMonth(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={handleMonthFilter}
                                className="bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors duration-200 whitespace-nowrap"
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
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Tanggal Mulai"
                            />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Tanggal Akhir"
                            />
                            <button 
                                onClick={handleDateRangeFilter}
                                className="bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors duration-200 whitespace-nowrap"
                            >
                                Terapkan Rentang
                            </button>
                        </div>
                    </div>
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
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                            <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {reportData.summary.total_transactions || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-800">
                                Rp {(reportData.summary.total_amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                            <p className="text-sm text-gray-600 mb-1">Bank Aktif</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {reportData.summary.active_banks || 0}
                            </p>
                        </div>
                    </div>

                    {/* Bank List */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Detail Transaksi per Bank</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bank
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            No. Rekening
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama Rekening
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jumlah Transaksi
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Persentase
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.banks.length > 0 ? (
                                        reportData.banks.map((bank, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Icon icon="solar:card-outline" className="w-5 h-5 text-indigo-500 mr-2" />
                                                        <span className="text-sm font-medium text-gray-900">{bank.bank_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {bank.account_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {bank.account_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {bank.transaction_count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    Rp {bank.total_amount.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        {bank.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                                                Tidak ada data transaksi bank
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
