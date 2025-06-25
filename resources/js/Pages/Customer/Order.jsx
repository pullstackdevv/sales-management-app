import OrderCard from '../../components/ui/card/OrderCard';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { useState } from 'react';

export default function Order() {
  const [orders] = useState([
    {
      id: '#67916',
      channel: 'Whatsapp',
      date: 'Rabu, 11 Jun 2025 14:11:17',
      customer: 'Indri',
      admin: 'saleparfum',
      status: 'Paid',
      total: 1199000,
      bank: 'Mandiri (11 Jun 2025)',
      courier: 'GrabExpress Instant',
      resi: '',
      products: ['MFK Hair Mist 70ml Amyris Femme (1x)'],
    },
    {
      id: '#67915',
      channel: 'Website Lain',
      date: 'Senin, 9 Jun 2025 18:42:28',
      customer: 'Irma Bajumi',
      admin: 'saleparfum',
      status: 'Paid',
      total: 545000,
      bank: 'BCA (9 Jun 2025)',
      courier: 'Tiki - ONS',
      resi: '660092977099',
      products: ['FW Gold Fame Women Edp 80ml Product (1x)', 'Zimaya By Afnan Fatima (1x)'],
    },
  ]);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Title */}
        <div className="text-xl font-semibold mb-4">Order</div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            'Semua Order',
            'Belum Bayar',
            'Belum Lunas',
            'Belum Diproses',
            'Belum Ada Resi',
            'Pengiriman Dalam Proses',
            'Pengiriman Berhasil',
          ].map((label, idx) => (
            <button
              key={idx}
              className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Top Bar */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex gap-2">
            <select className="border text-sm px-3 py-2 rounded-md">
              <option>Order ID</option>
            </select>
            <input
              type="text"
              className="border text-sm px-3 py-2 rounded-md"
              placeholder="Pencarian..."
            />
          </div>
          <div className="flex gap-2">
            <button className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100">Filter</button>
            <button className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100">Download</button>
            <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Tambah Order
            </button>
          </div>
        </div>

        {/* Orders */}
        {orders.map((order, idx) => (
          <OrderCard key={idx} order={order} />
        ))}
      </div>
    </DashboardLayout>
  );
}
