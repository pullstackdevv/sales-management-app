import DashboardLayout from "../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";

const summaryCards = [
  {
    label: "Total Order",
    icon: "mdi:cart-outline",
    value: 1280,
    color: "bg-blue-100 text-blue-800",
  },
  {
    label: "Pelanggan",
    icon: "mdi:account-group-outline",
    value: 642,
    color: "bg-green-100 text-green-800",
  },
  {
    label: "Produk Aktif",
    icon: "mdi:package-variant",
    value: 320,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    label: "Penjualan Bulan Ini",
    icon: "mdi:cash-multiple",
    value: "Rp 48.500.000",
    color: "bg-purple-100 text-purple-800",
  },
];

const salesChartOptions = {
  chart: {
    type: "line",
  },
  title: {
    text: "Grafik Penjualan Mingguan",
  },
  xAxis: {
    categories: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  },
  yAxis: {
    title: {
      text: "Jumlah Penjualan",
    },
  },
  series: [
    {
      name: "Item Terjual",
      data: [12, 19, 14, 20, 23, 17, 30],
    },
  ],
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="text-gray-800">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((item, i) => (
            <div
              key={i}
              className={`rounded-lg p-4 ${item.color} flex items-center justify-between shadow`}
            >
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xl font-bold">{item.value}</div>
              </div>
              <Icon icon={item.icon} width={32} />
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <HighchartsReact highcharts={Highcharts} options={salesChartOptions} />
        </div>
      </div>
    </DashboardLayout>
  );
}
