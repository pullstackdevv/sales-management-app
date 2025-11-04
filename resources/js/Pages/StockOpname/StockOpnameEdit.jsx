import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function StockOpnameEdit({ stockOpname }) {
  console.log('StockOpname data received:', stockOpname);
  
  const [formData, setFormData] = useState({
    warehouse: 'Gudang Utama',
    date: stockOpname?.opname_date ? new Date(stockOpname.opname_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: stockOpname?.note || ''
  });

  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    products: false,
    submitting: false,
    stockOpname: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load existing stock opname details
  useEffect(() => {
    if (stockOpname) {
      // Update form data
      setFormData({
        warehouse: 'Gudang Utama',
        date: stockOpname.opname_date ? new Date(stockOpname.opname_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: stockOpname.note || ''
      });
      
      // Load details if available
      if (stockOpname.details && stockOpname.details.length > 0) {
        const existingRows = stockOpname.details.map((detail, index) => ({
          id: detail.id || index,
          product_variant_id: detail.product_variant_id,
          product_name: detail.product_variant?.product?.name || '',
          variant_name: detail.product_variant?.variant_label || 'Default',
          system_stock: detail.system_stock,
          physical_stock: detail.real_stock,
          difference: detail.real_stock - detail.system_stock
        }));
        setRows(existingRows);
      }
    }
  }, [stockOpname]);

  const fetchProducts = async (search = '') => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await api.get('/products', {
        params: {
          search,
          per_page: 20,
          with_variants: true
        }
      });
      setProducts(response.data.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchProducts(searchTerm);
      } else {
        setProducts([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);



  const removeRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'physical_stock') {
          updatedRow.difference = value - row.system_stock;
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.notes.trim()) {
      Swal.fire('Error!', 'Keterangan harus diisi.', 'error');
      return;
    }

    const validRows = rows.filter(row => row.product_variant_id);
    if (validRows.length === 0) {
      Swal.fire('Error!', 'Minimal harus ada satu produk yang dipilih.', 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, submitting: true }));
      
      const payload = {
        opname_date: formData.date,
        note: formData.notes,
        details: validRows.map(row => ({
          product_variant_id: row.product_variant_id,
          system_stock: row.system_stock,
          real_stock: row.physical_stock
        }))
      };

      await api.put(`/stock-opnames/${stockOpname.id}`, payload);
      
      Swal.fire({
        title: 'Berhasil!',
        text: 'Stok opname berhasil diperbarui.',
        icon: 'success'
      }).then(() => {
        router.visit('/cms/stock-opname/data');
      });
    } catch (error) {
      console.error('Error updating stock opname:', error);
      Swal.fire('Error!', 'Gagal memperbarui stok opname.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleAddProduct = (product, variant) => {
    // Check if product variant already exists
    const existingRow = rows.find(row => row.product_variant_id === variant.id);
    if (existingRow) {
      Swal.fire('Info!', 'Produk sudah ditambahkan.', 'info');
      return;
    }

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
    
    // Clear search
    setSearchTerm('');
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
            <h1 className="text-2xl font-bold text-gray-800">Edit Stok Opname</h1>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading.submitting || stockOpname?.status === 'finalized'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Icon icon={loading.submitting ? "eos-icons:loading" : "material-symbols:save"} className="w-5 h-5" />
            {loading.submitting ? 'Menyimpan...' : 'Update Stok Opname'}
          </button>
        </div>

        {/* Status Warning */}
        {stockOpname?.status === 'finalized' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:warning" className="text-yellow-600" />
              <span className="text-yellow-800 font-medium">Stok opname ini sudah diselesaikan dan tidak dapat diedit.</span>
            </div>
          </div>
        )}

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
                disabled={stockOpname?.status === 'finalized'}
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
                  disabled={stockOpname?.status === 'finalized'}
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
              disabled={stockOpname?.status === 'finalized'}
            />
          </div>
        </div>

        {/* Product Search */}
        {stockOpname?.status !== 'finalized' && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h3 className="font-semibold mb-4">Cari Produk</h3>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari produk..."
                className="w-full border px-4 py-2 rounded-md"
              />
              
              {searchTerm && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                  {loading.products ? (
                    <div className="p-4 text-center text-gray-500">
                      <Icon icon="eos-icons:loading" className="text-xl mx-auto mb-2" />
                      Mencari produk...
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Tidak ada produk ditemukan
                    </div>
                  ) : (
                    products.map(product => (
                      <div key={product.id} className="border-b last:border-b-0">
                        <div className="p-3 font-medium text-gray-800">{product.name}</div>
                        {product.variants?.map(variant => (
                          <div
                            key={variant.id}
                            onClick={() => handleAddProduct(product, variant)}
                            className="p-3 pl-6 hover:bg-gray-50 cursor-pointer border-t"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm text-gray-600">
                                  {variant.variant_label || 'Default'}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  SKU: {variant.sku}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                Stok: {variant.stock || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Table */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Daftar Produk Stok Opname</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Varian</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stok Sistem</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stok Fisik</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Selisih</th>
                  {stockOpname?.status !== 'finalized' && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={stockOpname?.status === 'finalized' ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                      Belum ada produk ditambahkan
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{row.product_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{row.variant_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{row.system_stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.physical_stock}
                          onChange={(e) => updateRow(row.id, 'physical_stock', parseInt(e.target.value) || 0)}
                          className="w-20 border px-2 py-1 rounded text-sm"
                          min="0"
                          disabled={stockOpname?.status === 'finalized'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          row.difference > 0 ? 'text-green-600' : 
                          row.difference < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {row.difference > 0 ? '+' : ''}{row.difference}
                        </span>
                      </td>
                      {stockOpname?.status !== 'finalized' && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <Icon icon="material-symbols:delete" className="text-lg" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}