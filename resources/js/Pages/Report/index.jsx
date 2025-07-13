import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function Report() {
    const salesChartOptions = {
        title: { text: null },
        xAxis: { categories: ["1", "2", "3", "4", "5", "6", "7"] },
        yAxis: { title: null },
        series: [{ name: "Penjualan Item", data: [5, 20, 10, 30, 50, 40, 70] }],
    };

    const profitChartOptions = {
        title: { text: null },
        xAxis: { categories: ["1", "2", "3", "4", "5", "6", "7"] },
        yAxis: { title: null },
        series: [
            { name: "Laba Kotor", data: [1, 2, 3, 4, 3, 5, 6] },
            { name: "Penjualan Bersih", data: [0.5, 1.5, 2, 2.5, 2, 3.5, 4] },
        ],
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Laporan</h1>
                <div className="flex items-center gap-3">
                    <input type="date" className="border rounded p-1 text-sm" />
                    <input type="date" className="border rounded p-1 text-sm" />
                    <button className="bg-gray-100 px-3 py-1 rounded text-sm">
                        Cari Laporan
                    </button>
                </div>
            </div>

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

            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-3">Data Transaksi Bank</h2>
                    <ul className="text-sm text-gray-700 space-y-1">
                        {[
                            ["BNI", "Rp 7.000.000.000"],
                            ["Mandiri", "Rp 4.000"],
                            ["BCA", "Rp 7.000.000"],
                        ].map(([bank, nominal], i) => (
                            <li
                                key={i}
                                className="flex justify-between border-b py-1"
                            >
                                <span>{bank}</span>
                                <span>{nominal}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-3">Ekspedisi</h2>
                    <ul className="text-sm text-gray-700 space-y-1">
                        {[
                            ["JNE", "5%", "Rp 50.000"],
                            ["J&T", "12%", "Rp 120.000"],
                            ["SICEPAT", "10%", "Rp 100.000"],
                        ].map(([name, percent, total], i) => (
                            <li
                                key={i}
                                className="flex justify-between border-b py-1"
                            >
                                <span>{name}</span>
                                <span>
                                    {percent} - {total}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
