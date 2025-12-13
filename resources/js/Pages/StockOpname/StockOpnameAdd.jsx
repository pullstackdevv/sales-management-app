import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function StockOpnameAdd() {
  const [formData, setFormData] = useState({
    warehouse: 'Gudang Utama',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [rows, setRows] = useState([
    { id: 1, product_variant_id: null, product_name: "", variant_name: "", system_stock: 0, physical_stock: 0, difference: 0 },
  ]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    products: false,
    submitting: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Fetch products with search
  const fetchProducts = async (search = '') => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await api.get('/products', {
        params: { search, per_page: 50 }
      });
      // Handle paginated response structure
      const productsData = response.data.data?.data || response.data.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchProducts(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), product_variant_id: null, product_name: "", variant_name: "", system_stock: 0, physical_stock: 0, difference: 0 },
    ]);
  };

  const removeRow = (id) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'physical_stock') {
          updatedRow.difference = parseInt(value || 0) - updatedRow.system_stock;
        }
        return updatedRow;
      }
      return row;
    }));
  };



  const handleSubmit = async () => {
    // Validate form
    if (!formData.notes.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Keterangan harus diisi'
      });
      return;
    }

    const validRows = rows.filter(row => row.product_variant_id && row.physical_stock >= 0);
    if (validRows.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Minimal harus ada satu produk yang dipilih'
      });
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));
    try {
      const payload = {
        opname_date: formData.date,
        note: formData.notes,
        status: 'draft',
        details: validRows.map(row => ({
          product_variant_id: row.product_variant_id,
          system_stock: row.system_stock,
          real_stock: row.physical_stock
        }))
      };

      await api.post('/stock-opnames', payload);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Stok opname berhasil dibuat'
      }).then(() => {
        router.visit('/cms/stock-opname/data');
      });
    } catch (error) {
      console.error('Error creating stock opname:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data'
      });
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Handle product selection and add to row
  const handleAddProduct = (product, variant) => {
    // Check if product variant already exists
    const existingProduct = rows.find(row => row.product_variant_id === variant.id);
    if (existingProduct) {
      Swal.fire({
        icon: 'warning',
        title: 'Produk Sudah Ada',
        text: `Produk ${product.name} - ${variant.name || variant.variant_label} sudah ditambahkan ke daftar`
      });
      return;
    }

    // Find first empty row or add new row
    const emptyRowIndex = rows.findIndex(row => !row.product_variant_id);
    
    if (emptyRowIndex >= 0) {
      // Use existing empty row
      setRows(rows.map((row, index) => {
        if (index === emptyRowIndex) {
          return {
            ...row,
            product_variant_id: variant.id,
            product_name: product.name,
            variant_name: variant.name || variant.variant_label,
            system_stock: variant.stock || 0,
            difference: row.physical_stock - (variant.stock || 0)
          };
        }
        return row;
      }));
    } else {
      // Add new row
      const newRow = {
        id: Date.now(),
        product_variant_id: variant.id,
        product_name: product.name,
        variant_name: variant.name || variant.variant_label,
        system_stock: variant.stock || 0,
        physical_stock: 0,
        difference: -(variant.stock || 0)
      };
      setRows([...rows, newRow]);
    }
    
    // Clear search and hide product list
    setSearchTerm('');
    setShowProductSearch(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()}>
              <Icon icon="material-symbols:arrow-back" width={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Tambah Stok Opname</h1>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading.submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Icon icon={loading.submitting ? "eos-icons:loading" : "material-symbols:save"} className="w-5 h-5" />
            {loading.submitting ? 'Menyimpan...' : 'Buat Stok Opname'}
          </button>
        </div>

        {/* Informasi Stok Opname */}
        <div className="bg-white p-5 rounded-md shadow mb-6">
          <h2 className="font-semibold text-md mb-4">Informasi Stok Opname</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Gudang*</label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
                className="mt-1 w-full border px-4 py-2 rounded-md"
              >
                <option value="Gudang Utama">Gudang Utama</option>
                <option value="Gudang Cabang">Gudang Cabang</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Tanggal Stok Opname</label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border px-4 py-2 rounded-md"
                />
                <Icon
                  icon="material-symbols:calendar-today"
                  className="absolute right-3 top-3 text-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium">Keterangan*</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="mt-1 w-full border px-4 py-2 rounded-md" 
              rows="3"
              placeholder="Masukkan keterangan stok opname..."
              required
            />
          </div>
        </div>

        {/* Product Search */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <h3 className="font-medium mb-4">Cari Produk</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk untuk ditambahkan ke stock opname..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowProductSearch(!!e.target.value);
              }}
              onFocus={() => setShowProductSearch(!!searchTerm)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {loading.products && (
              <div className="absolute right-3 top-3">
                <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Product Results */}
          {showProductSearch && searchTerm && products.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                      <p className="text-xs text-gray-400">{product.category}</p>
                    </div>
                  </div>
                  
                  {/* Product Variants */}
                  <div className="mt-2 space-y-1">
                    {product.variants?.map((variant) => (
                      <div key={variant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{variant.name || variant.variant_label}</span>
                            {variant.sku && (
                              <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">{variant.sku}</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">Stok: {variant.stock}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddProduct(product, variant)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showProductSearch && searchTerm && products.length === 0 && !loading.products && (
            <p className="text-gray-500 text-sm mt-2">Produk tidak ditemukan</p>
          )}
        </div>

        {/* Penyesuaian Stok */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Penyesuaian Stok
            </h2>
            
          </div>

          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Produk
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Stok Sistem
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Stok Fisik
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Selisih
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      {row.product_variant_id ? (
                        <div>
                          <div className="font-medium text-gray-900">{row.product_name}</div>
                          <div className="text-sm text-gray-600">{row.variant_name}</div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">Pilih produk dari pencarian di atas</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={row.system_stock}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={row.physical_stock}
                        onChange={(e) => updateRow(row.id, 'physical_stock', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={row.difference}
                        readOnly
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 ${
                          row.difference > 0 ? 'text-green-600' : row.difference < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {row.product_variant_id && (
                          <button
                            onClick={() => {
                              updateRow(row.id, 'product_variant_id', null);
                              updateRow(row.id, 'product_name', '');
                              updateRow(row.id, 'variant_name', '');
                              updateRow(row.id, 'system_stock', 0);
                              updateRow(row.id, 'physical_stock', 0);
                              updateRow(row.id, 'difference', 0);
                            }}
                            className="text-orange-600 hover:text-orange-800"
                            title="Hapus Produk"
                          >
                            <Icon icon="material-symbols:clear" className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeRow(row.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus Baris"
                        >
                          <Icon icon="material-symbols:delete" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
