import OrderCard from '../../components/ui/card/OrderCard';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Link } from '@inertiajs/react';

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua Order');
  const [sourceFilter, setSourceFilter] = useState('Semua Sumber');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('Order ID');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
    
    // Add event listener for page visibility change to refresh data
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh data
        fetchOrders(currentPage);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(1);
  }, [activeFilter, sourceFilter, searchTerm]);
  
  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Map filter to API status
      const statusMap = {
        'Belum Bayar': 'pending',
        'Dibayar': 'paid', 
        'Diproses': 'processing',
        'Dikirim': 'shipped',
        'Diterima': 'delivered',
        'Dibatalkan': 'cancelled'
      };
      
      if (activeFilter !== 'Semua Order' && statusMap[activeFilter]) {
        params.append('status', statusMap[activeFilter]);
      }
      
      if (sourceFilter !== 'Semua Sumber') {
        params.append('source', sourceFilter);
      }
      
      const queryString = params.toString();
      const url = `/orders?${queryString}`;
      
      const response = await api.get(url);
      const responseData = response.data.data;
      const ordersData = responseData.data || [];
      
      // Set pagination data
      setPagination({
        current_page: responseData.current_page,
        last_page: responseData.last_page,
        per_page: responseData.per_page,
        total: responseData.total,
        from: responseData.from,
        to: responseData.to
      });
      
      setCurrentPage(responseData.current_page);
      
      // Transform API data to match OrderCard component format
      const transformedOrders = ordersData.map(order => {
        // Get bank information from payment data
        const paymentBank = order.payments?.[0]?.payment_bank;
        let bankInfo = 'Manual Transfer';
        
        if (order.payment_url) {
          // Web order with payment gateway
          bankInfo = 'Payment Gateway';
        } else if (paymentBank) {
          // Manual order with specific bank
          bankInfo = `${paymentBank.bank_name} - ${paymentBank.account_number}`;
        }
        
        return {
          id: order.id,
          number: order.order_number,
          channel: order.sales_channel?.name || 'Website',
          date: formatDate(order.ordered_at),
          ordered_at: order.ordered_at, // Add raw date for PaymentHistoryModal
          customer: order.customer?.name || 'N/A',
          admin: 'Admin', // Default admin name
          status: getStatusLabel(order.status),
          raw_status: order.status, // Add raw status for timeline logic
          total: parseFloat(order.total_price),
          bank: bankInfo,
          courier: order.shipping?.courier?.name || 'N/A',
          resi: order.shipping?.tracking_number || '',
          products: order.items?.map(item => 
            `${item.product_name_snapshot} ${item.variant_label} (${item.quantity}x)`
          ) || [],
          // Add fields needed for order source detection
          payment_url: order.payment_url,
          payment_status: order.payment_status, // Add payment status for display
          sales_channel: order.sales_channel?.name || 'Website',
          // Add shipping object with ID for update operations
          shipping: order.shipping,
          // Add payment bank details for detailed display
          payment_bank: paymentBank
        };
      });
      
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
      'paid': 'Dibayar',
      'processing': 'Diproses',
      'shipped': 'Dikirim',
      'delivered': 'Diterima',
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
            'Dibayar',
            'Diproses',
            'Dikirim',
            'Diterima',
            'Dibatalkan',
          ].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFilter(label)}
              className={`text-sm px-3 py-1 border rounded-md transition-colors ${
                activeFilter === label
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 self-center">Filter Sumber:</span>
          {['Semua Sumber', 'Manual', 'Web Order'].map((source) => (
            <button
              key={source}
              onClick={() => setSourceFilter(source)}
              className={`text-sm px-3 py-1 rounded-md border transition-colors ${
                sourceFilter === source
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              {source}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex gap-2">
            <select 
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="border text-sm px-3 py-2 rounded-md"
            >
              <option value="Order ID">Order ID</option>
              <option value="Customer">Customer</option>
              <option value="Phone">Phone</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border text-sm px-3 py-2 rounded-md"
              placeholder={`Pencarian berdasarkan ${searchBy}...`}
            />
          </div>
          <div className="flex gap-2">
            <button className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100">Filter</button>
            <button className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100">Download</button>
            <Link
              href={route('cms.orders.create')}
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
          <>
            {orders.map((order, idx) => (
              <OrderCard key={idx} order={order} onOrderUpdate={() => fetchOrders(currentPage)} />
            ))}
            
            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Menampilkan {pagination.from} sampai {pagination.to} dari {pagination.total} hasil
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.last_page - 2) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.last_page}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
