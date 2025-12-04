import OrderCard from '../../components/ui/card/OrderCard';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../contexts/AuthContext';

export default function Order() {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua Order');
  const [sourceFilter, setSourceFilter] = useState('Semua Sumber');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('Order ID');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateQuick, setDateQuick] = useState('Semua');
  const [paymentBanks, setPaymentBanks] = useState([]);

  useEffect(() => {
    // Initial fetch when component mounts
    fetchOrders();
    fetchPaymentBanksOnce();
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(1);
  }, [activeFilter, sourceFilter, searchTerm, startDate, endDate]);
  
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
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
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
      
      // For normal filters, filter by status.
      // For "Diproses", we ignore status and only filter by printed_at (see below).
      if (activeFilter !== 'Semua Order' && activeFilter !== 'Diproses' && statusMap[activeFilter]) {
        params.append('status', statusMap[activeFilter]);
      }

      // Special case: filter "Diproses" should show ALL printed orders regardless of status
      if (activeFilter === 'Diproses') {
        params.append('printed', '1');
      }
      
      if (sourceFilter !== 'Semua Sumber') {
        params.append('source', sourceFilter);
      }
      
      const queryString = params.toString();
      const url = `/orders?${queryString}`;
      
      const response = await api.get(url);
      const responseData = response.data.data;
      const ordersData = responseData.data || [];
      // console.log(ordersData)
      
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
          channel: order.sales_channel?.name || 'Website Resmi',
          date: order.date, // Use pre-formatted WIB date from backend
          ordered_at: order.ordered_at, // Add raw date for PaymentHistoryModal
          customer: order.customer?.name || 'N/A',
          recipient_name: order.address?.recipient_name || order.customer?.name || 'N/A',
          admin: 'Admin', // Default admin name
          status: getStatusLabel(order.status),
          raw_status: order.status, // Add raw status for timeline logic
          total: parseFloat(order.total_price),
          bank: bankInfo,
          courier: order.shipping?.courier?.name || 'N/A',
          service_type: order.shipping?.service_type || order.shipping?.courier?.service_type || 'N/A',
          resi: order.shipping?.tracking_number || '',
          products: order.items?.map(item => 
            `${item.product_name_snapshot} ${item.variant_label} (${item.quantity}x)`
          ) || [],
          // Add fields needed for order source detection
          payment_url: order.payment_url,
          payment_status: order.payment_status, // Add payment status for display
          sales_channel: order.sales_channel?.code || 'WEBSITE',
          // Add shipping object with ID for update operations
          shipping: order.shipping,
          is_dropship: order.address?.is_dropship,
          // Add payment bank details for detailed display
          payment_bank: paymentBank,
          // Add printed_at for print status tracking
          printed_at: order.printed_at
        };
      });
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentBanksOnce = async () => {
    try {
      const response = await api.get('/payment-banks');
      const banksData = response.data?.data?.data || response.data?.data || [];
      const activeBanks = Array.isArray(banksData) ? banksData.filter(b => b.is_active) : [];
      setPaymentBanks(activeBanks);
    } catch (e) {
      setPaymentBanks([]);
    }
  };

  const applyQuickRange = (range) => {
    setDateQuick(range);
    const today = new Date();
    const toISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    if (range === 'Semua') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (range === 'Hari Ini') {
      const iso = toISO(today);
      setStartDate(iso);
      setEndDate(iso);
      return;
    }
    if (range === '7 Hari') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      setStartDate(toISO(start));
      setEndDate(toISO(today));
      return;
    }
    if (range === '30 Hari') {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      setStartDate(toISO(start));
      setEndDate(toISO(today));
      return;
    }
  };

  const handleDateChange = (which, value) => {
    if (which === 'start') {
      setStartDate(value);
      if (endDate && value && value > endDate) {
        setEndDate(value);
      }
    } else {
      setEndDate(value);
      if (startDate && value && value < startDate) {
        setStartDate(value);
      }
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

  // Handle checkbox selection
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const paidOrders = orders.filter(order => order.raw_status === 'paid');
    if (selectedOrders.length === paidOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paidOrders.map(order => order.id));
    }
  };

  // Handle print and update status to processing
  const handlePrintOrders = async () => {
    if (selectedOrders.length === 0) return;

    try {
      setIsPrinting(true);
      
      // Update status to processing for selected orders
      const updatePromises = selectedOrders.map(orderId =>
        api.put(`/orders/${orderId}/status`, { status: 'processing' })
      );
      
      await Promise.all(updatePromises);
      
      // Open print window with selected orders
      const printUrl = `/cms/order/print?orders=${selectedOrders.join(',')}`;
      window.open(printUrl, '_blank');
      
      // Clear selection and refresh
      setSelectedOrders([]);
      await fetchOrders(currentPage);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `${selectedOrders.length} order berhasil diprint dan diproses`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error printing orders:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat memproses print'
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="text-xl font-semibold mb-4">Order</div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="border text-sm px-3 py-2 rounded-md"
            aria-label="Status"
          >
            <option value="Semua Order">Semua Order</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Dibayar">Dibayar</option>
            <option value="Diproses">Diproses</option>
            <option value="Dikirim">Dikirim</option>
            <option value="Diterima">Diterima</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border text-sm px-3 py-2 rounded-md"
            aria-label="Sumber"
          >
            <option value="Semua Sumber">Semua Sumber</option>
            <option value="Manual">Manual</option>
            <option value="Web Order">Web Order</option>
          </select>

          <select
            value={dateQuick}
            onChange={(e) => applyQuickRange(e.target.value)}
            className="border text-sm px-3 py-2 rounded-md"
            aria-label="Rentang Cepat"
          >
            <option value="Semua">Semua</option>
            <option value="Hari Ini">Hari Ini</option>
            <option value="7 Hari">7 Hari</option>
            <option value="30 Hari">30 Hari</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="border text-sm px-3 py-2 rounded-md"
            aria-label="Dari"
          />
          <span className="text-xs text-gray-500">–</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="border text-sm px-3 py-2 rounded-md"
            aria-label="Sampai"
          />
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
              <option value="Product">Product Name</option>
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
            {/* {hasPermission('orders.export') && (
              <button className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100">Download</button>
            )} */}
            {hasPermission('orders.create') && (
              <Link
                href={route('cms.orders.create')}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tambah Order
              </Link>
            )}
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
              <OrderCard key={idx} order={order} paymentBanks={paymentBanks} onOrderUpdate={() => fetchOrders(currentPage)} />
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
