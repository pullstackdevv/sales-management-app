import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import api from "@/api/axios";
import { formatCurrency, formatDate } from "@/utils/helpers";

export default function StockHistoryModal({ 
  isOpen, 
  onClose, 
  variant 
}) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  const [initialRunning, setInitialRunning] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  });

  const fetchMovements = async (page = 1) => {
    if (!variant?.id) return;
    
    try {
      setLoading(true);
      
      const params = {
        page,
        per_page: pagination.per_page,
        product_variant_id: variant.id,
        sort_by: 'created_at',
        sort_direction: 'asc',
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search })
      };
      
      const response = await api.get('/stock-movements', { params });
      
      // Handle Laravel paginated response structure
      const paginatedData = response.data.data;
      setMovements(paginatedData.data || []);
      setPagination({
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || 10,
        total: paginatedData.total || 0
      });

      // Compute initial running from previous page (if any)
      if ((paginatedData.current_page || 1) > 1) {
        const prevParams = {
          ...params,
          page: (paginatedData.current_page || 1) - 1
        };
        try {
          const prevResp = await api.get('/stock-movements', { params: prevParams });
          const prevData = prevResp.data.data?.data || [];
          const finalPrevRunning = computeFinalRunning(prevData);
          setInitialRunning(finalPrevRunning);
        } catch (e) {
          setInitialRunning(0);
        }
      } else {
        setInitialRunning(0);
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && variant?.id) {
      fetchMovements(1);
    }
  }, [isOpen, variant?.id, filters]);

  const handlePageChange = (page) => {
    fetchMovements(page);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'in':
        return 'Masuk';
      case 'out':
        return 'Keluar';
      case 'adjustment':
        return 'Penyesuaian';
      default:
        return type;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'in':
        return 'material-symbols:trending-up';
      case 'out':
        return 'material-symbols:trending-down';
      case 'adjustment':
        return 'material-symbols:tune';
      default:
        return 'material-symbols:swap-horiz';
    }
  };

  const handleOrderClick = (orderId) => {
    if (orderId) {
      router.visit(`/cms/order/detail/${orderId}`);
    }
  };

  const renderNote = (movement) => {
    if (!movement.order_id) {
      return movement.note || 'Tidak ada catatan';
    }
    
    return (
      <button
        onClick={() => handleOrderClick(movement.order_id)}
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
      >
        {movement.note || `Order #${movement.order?.order_number}`}
      </button>
    );
  };

  const getDescription = (movement) => {
    const isIn = movement.type === 'in';
    const isOut = movement.type === 'out';
    const isAdj = movement.type === 'adjustment';

    if (isIn) {
      if (movement.order) {
        const noteText = (movement.note || '').toLowerCase();
        if (noteText.includes('cancel')) {
          return `Cancel Order #${movement.order.order_number}`;
        }
        return `Retur Order #${movement.order.order_number}`;
      }
      return movement.note || 'Barang Masuk/Tambah Stok';
    }

    if (isOut) {
      if (movement.order) {
        return `Order #${movement.order.order_number}`;
      }
      return movement.note || 'Pengurangan Stok';
    }

    if (isAdj) {
      const noteText = (movement.note || '').toLowerCase();
      if (noteText.includes('increase')) {
        return 'Penyesuaian (Tambah)';
      }
      if (noteText.includes('decrease')) {
        return 'Penyesuaian (Kurang)';
      }
      return 'Penyesuaian Stok';
    }

    return movement.note || '-';
  };

  const computeRowsWithRunning = (list) => {
    let running = initialRunning || 0;
    return list.map((m) => {
      const isAdj = m.type === 'adjustment';
      let stockIn = 0;
      let stockOut = 0;
      if (isAdj) {
        const noteText = (m.note || '').toLowerCase();
        if (noteText.includes('increase')) {
          stockIn = m.quantity;
          running += m.quantity;
        } else if (noteText.includes('decrease')) {
          stockOut = m.quantity;
          running -= m.quantity;
        } else {
          running = m.quantity;
        }
      } else if (m.type === 'in') {
        stockIn = m.quantity;
        running += m.quantity;
      } else if (m.type === 'out') {
        stockOut = m.quantity;
        running -= m.quantity;
      }
      return {
        ...m,
        stockIn,
        stockOut,
        running,
      };
    });
  };

  const computeFinalRunning = (list) => {
    let running = 0;
    for (const m of list) {
      const isAdj = m.type === 'adjustment';
      if (isAdj) {
        const noteText = (m.note || '').toLowerCase();
        if (noteText.includes('increase')) {
          running += m.quantity;
        } else if (noteText.includes('decrease')) {
          running -= m.quantity;
        } else {
          running = m.quantity;
        }
      } else if (m.type === 'in') {
        running += m.quantity;
      } else if (m.type === 'out') {
        running -= m.quantity;
      }
    }
    return running;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">Riwayat Pergerakan Stok</h3>
            {variant && (
              <div className="mt-1">
                <p className="text-sm text-gray-600">
                  {variant.product?.name || 'Produk'} - {variant.variant_label || 'Default'}
                </p>
                <p className="text-xs text-gray-500">
                  SKU: {variant.sku} | Stok saat ini: <span className="font-semibold">{variant.stock}</span>
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon icon="material-symbols:close" className="text-xl" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari berdasarkan catatan..."
                className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <select
                className="border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Semua Jenis</option>
                <option value="in">Masuk</option>
                <option value="out">Keluar</option>
                <option value="adjustment">Penyesuaian</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon icon="eos-icons:loading" className="text-2xl text-blue-600" />
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="material-symbols:inventory-2-outline" className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Belum ada riwayat pergerakan stok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="px-3 py-2">Tanggal</th>
                    <th className="px-3 py-2">Deskripsi</th>
                    <th className="px-3 py-2">Stock In</th>
                    <th className="px-3 py-2">Stock Out</th>
                    <th className="px-3 py-2">Running Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {computeRowsWithRunning(movements).map((m) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(m.created_at)}</td>
                      <td className="px-3 py-2">{getDescription(m)}</td>
                      <td className="px-3 py-2 text-green-600 font-semibold">{m.stockIn || ''}</td>
                      <td className="px-3 py-2 text-red-600 font-semibold">{m.stockOut || ''}</td>
                      <td className="px-3 py-2 font-semibold">{m.running}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1 || loading}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="material-symbols:chevron-left" />
                </button>
                
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  const page = i + Math.max(1, pagination.current_page - 2);
                  if (page > pagination.last_page) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className={`px-3 py-1 border rounded text-sm disabled:cursor-not-allowed ${
                        page === pagination.current_page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page || loading}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="material-symbols:chevron-right" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
