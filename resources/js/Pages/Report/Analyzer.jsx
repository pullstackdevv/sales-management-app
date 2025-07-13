import DashboardLayout from "../../Layouts/DashboardLayout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

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

    return (
        <DashboardLayout>
            <h1 className="text-xl font-bold mb-6">Analyzer</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-3">Penjualan Terbaik</h2>
                    <ul className="text-sm text-gray-700 space-y-1">
                        {bestSellers.map((item, i) => (
                            <li
                                key={i}
                                className="flex justify-between border-b py-1"
                            >
                                <span>
                                    {i + 1}. {item.name}
                                </span>
                                <span>{item.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-3">Pelanggan Terbaik</h2>
                    <ul className="text-sm text-gray-700 space-y-1">
                        {bestCustomers.map((item, i) => (
                            <li
                                key={i}
                                className="flex justify-between border-b py-1"
                            >
                                <span>
                                    {i + 1}. {item.name}
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
                    options={chartOptions}
                />
            </div>
        </DashboardLayout>
    );
}
