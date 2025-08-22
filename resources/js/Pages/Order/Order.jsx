import OrderCard from '../../components/ui/card/OrderCard';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Link } from '@inertiajs/react';

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      const ordersData = response.data.data.data || [];
      
      // Transform API data to match OrderCard component format
      const transformedOrders = ordersData.map(order => ({
        id: order.id,
        number: order.order_number,
        channel: order.sales_channel?.name || 'Website',
        date: formatDate(order.ordered_at),
        customer: order.customer?.name || 'N/A',
        admin: 'Admin', // Default admin name
        status: getStatusLabel(order.status),
        total: parseFloat(order.total_price) + parseFloat(order.shipping_cost),
        bank: 'Bank Info', // Default bank info
        courier: order.shipping?.courier?.name || 'N/A',
        resi: order.shipping?.tracking_number || '',
        products: order.items?.map(item => 
          `${item.product_name_snapshot} ${item.variant_label} (${item.quantity}x)`
        ) || []
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Belum Bayar',
      'paid': 'Paid',
      'processing': 'Diproses',
      'shipped': 'Dikirim',
      'delivered': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="text-xl font-semibold mb-4">Order</div>

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
            <Link
              href={route('orders.create')}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tambah Order
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Memuat data orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Tidak ada data order</p>
          </div>
        ) : (
          orders.map((order, idx) => (
            <OrderCard key={idx} order={order} onOrderUpdate={fetchOrders} />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
