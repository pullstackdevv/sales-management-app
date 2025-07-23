import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { FaCrown, FaUser, FaBoxOpen } from "react-icons/fa";

export default function Analyzer() {
    const chartOptions = {
        title: { text: null },
        xAxis: { categories: ["1", "2", "3", "4", "5", "6", "7"] },
        yAxis: { title: null },
        series: [
            { name: "Penjualan Item", data: [10, 20, 15, 30, 25, 40, 50] },
        ],
    };

    const bestSellers = [
        { name: "Pot Bunga Hijau", value: "140.863" },
        { name: "Kursi Antik Kayu Jati", value: "22.612" },
        { name: "Lukisan Abstract", value: "1.612" },
    ];

    const bestCustomers = [
        { name: "Juneid Kasturi Mulyajaya", value: "357.462" },
        { name: "Kevin Obana", value: "132.000" },
        { name: "Mulyajaya", value: "1.992" },
    ];

    // Dummy summary data
    const summary = {
        totalSales: "Rp 500.000",
        totalCustomers: 120,
        totalProducts: 45,
    };

    return (
        <DashboardLayout>
            <h1 className="text-xl font-bold mb-6">Analyzer</h1>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center bg-gradient-to-r from-green-100 to-green-50 rounded shadow p-4">
                    <FaBoxOpen className="text-green-500 text-2xl mr-3" />
                    <div>
                        <div className="text-xs text-gray-500">
                            Total Penjualan
                        </div>
                        <div className="font-bold text-lg">
                            {summary.totalSales}
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
                            {summary.totalCustomers}
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
                            {summary.totalProducts}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <FaCrown className="text-yellow-500" /> Penjualan
                        Terbaik
                    </h2>
                    <ul className="text-sm text-gray-700 space-y-1">
                        {bestSellers.map((item, i) => (
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
                        {bestCustomers.map((item, i) => (
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
        </DashboardLayout>
    );
}
