import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function StockMovement() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState(null);

  // Fetch stock movements from API
  const fetchMovements = async (searchTerm = "", type = "", page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 15,
        ...(searchTerm && { search: searchTerm }),
        ...(type && { type: type })
      };
      
      const response = await api.get("/stock-movements", { params });
      setMovements(response.data.data.data);
      setPagination(response.data.data);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data riwayat stok'
      });
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    fetchMovements(searchTerm, typeFilter);
  };

  // Type filter handler
  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    fetchMovements(search, type);
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const badges = {
      'in': 'bg-green-100 text-green-600',
      'out': 'bg-red-100 text-red-600',
      'adjustment': 'bg-blue-100 text-blue-600'
    };
    
    const labels = {
      'in': 'Masuk',
      'out': 'Keluar',
      'adjustment': 'Penyesuaian'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${badges[type] || 'bg-gray-100 text-gray-600'}`}>
        {labels[type] || type}
      </span>
    );
  };

  // Pagination handler
  const handlePageChange = (page) => {
    fetchMovements(search, typeFilter, page);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Riwayat Stok</h1>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama produk, SKU, atau catatan..."
              className="w-full border px-4 py-2 rounded-md text-sm"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeFilter("")}
              className={`px-3 py-2 text-sm rounded-md border ${
                typeFilter === "" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => handleTypeFilter("in")}
              className={`px-3 py-2 text-sm rounded-md border ${
                typeFilter === "in" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => handleTypeFilter("out")}
              className={`px-3 py-2 text-sm rounded-md border ${
                typeFilter === "out" ? "bg-red-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Keluar
            </button>
            <button
              onClick={() => handleTypeFilter("adjustment")}
              className={`px-3 py-2 text-sm rounded-md border ${
                typeFilter === "adjustment" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Penyesuaian
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Varian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catatan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat Oleh
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      <Icon icon="eos-icons:loading" className="text-2xl mx-auto mb-2" />
                      <p>Memuat data riwayat stok...</p>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      <Icon icon="material-symbols:inventory-2-outline" className="text-4xl mx-auto mb-2" />
                      <p>Tidak ada data riwayat stok</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(movement.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {movement.product_variant?.product?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {movement.product_variant?.sku || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.product_variant?.variant_label || 'Default'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getTypeBadge(movement.type)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          movement.type === 'in' ? 'text-green-600' : 
                          movement.type === 'out' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {movement.note || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.created_by?.name || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{pagination.from}</span> to{' '}
                      <span className="font-medium">{pagination.to}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon icon="material-symbols:chevron-left" />
                      </button>
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.current_page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon icon="material-symbols:chevron-right" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}