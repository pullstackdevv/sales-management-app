import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import Swal from "sweetalert2";
import StockHistoryModal from "@/Components/StockHistoryModal";
import StockAdjustmentModal from "@/Components/StockAdjustmentModal";

export default function ProductData() {
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [pagination, setPagination] = useState(null);
  
  // Modal states
  const [stockHistoryModal, setStockHistoryModal] = useState({ isOpen: false, variant: null });
  const [stockAdjustmentModal, setStockAdjustmentModal] = useState({ isOpen: false, variant: null });

  // Fetch products from API
  const fetchProducts = async (searchTerm = "", categoryFilter = "", page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      };
      
      const response = await api.get("/products", { params });
      setProducts(response.data.data.data);
      setPagination(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data produk akan dihapus permanen!',
      icon: 'warning',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/products/${productId}`);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Produk berhasil dihapus!',
          showConfirmButton: false,
          timer: 1500
        });
        fetchProducts(search, category); // Refresh data
      } catch (error) {
        console.error("Error deleting product:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal menghapus produk'
        });
      }
    }
  };

  // Search handler
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);
    fetchProducts(searchTerm, category);
  };

  // Modal handlers
  const openStockHistoryModal = (variant) => {
    setStockHistoryModal({ isOpen: true, variant });
  };

  const closeStockHistoryModal = () => {
    setStockHistoryModal({ isOpen: false, variant: null });
  };

  const openStockAdjustmentModal = (variant) => {
    setStockAdjustmentModal({ isOpen: true, variant });
  };

  const closeStockAdjustmentModal = () => {
    setStockAdjustmentModal({ isOpen: false, variant: null });
  };

  const handleStockAdjustmentSuccess = () => {
    fetchProducts(search, category); // Refresh data
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Produk</h1>

          <div className="flex gap-2">
            <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
              Impor & Ekspor
            </button>
            <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
              Filter
            </button>
            <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
              Download
            </button>
            <Link href="/cms/product/add">
              <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                <Icon icon="material-symbols:add" className="text-lg" />
                Tambah Produk
              </button>
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari nama, SKU, atau scan barcode..."
            className="w-full border px-4 py-2 rounded-md text-sm"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="bg-white rounded-md shadow-sm divide-y">
          <div className="grid grid-cols-12 items-center px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
            <div className="col-span-1">Gambar</div>
            <div className="col-span-3">Produk & Harga</div>
            <div className="col-span-1">Stok</div>
            <div className="col-span-1">Varian</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Storefront</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Icon icon="eos-icons:loading" className="text-2xl mx-auto mb-2" />
              <p>Memuat data produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p>Tidak ada data produk</p>
            </div>
          ) : (
            products.map((product) => {
              const totalStock = product.variants?.reduce(
                (sum, v) => sum + v.stock,
                0
              );
              const minPrice = product.variants?.length > 0 
                ? Math.min(...product.variants.map(v => v.price))
                : 0;
              const maxPrice = product.variants?.length > 0 
                ? Math.max(...product.variants.map(v => v.price))
                : 0;
              const minBasePrice = product.variants?.length > 0 
                ? Math.min(...product.variants.map(v => v.base_price || 0))
                : 0;
              const maxBasePrice = product.variants?.length > 0 
                ? Math.max(...product.variants.map(v => v.base_price || 0))
                : 0;

              return (
                <div key={product.id}>
                  <div className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-gray-50">
                    <div className="col-span-1">
                      {product.image ? (
                        <img 
                          src={`/storage/${product.image}`} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-md"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center ${product.image ? 'hidden' : 'flex'}`}
                      >
                        <Icon icon="mdi:image-outline" className="text-gray-400" />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="text-blue-600 font-medium">{product.name}</p>
                      <div className="space-y-1">
                        <p className="text-gray-800 font-medium">
                          {product.variants?.length > 0 ? (
                            minPrice === maxPrice 
                              ? formatCurrency(minPrice)
                              : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                          ) : 'Belum ada harga'}
                        </p>
                        {minBasePrice > 0 && (
                          <p className="text-gray-500 text-xs">
                            Modal: {minBasePrice === maxBasePrice 
                              ? formatCurrency(minBasePrice)
                              : `${formatCurrency(minBasePrice)} - ${formatCurrency(maxBasePrice)}`
                            }
                          </p>
                        )}
                      </div>
                      {product.description && (
                        <div 
                          className="text-xs text-gray-500 mt-1 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      )}
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`text-xs font-semibold ${
                          totalStock === 0 ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {totalStock === 0
                          ? "Stok habis"
                          : `${totalStock} stok`}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {product.variants?.length || 0} varian
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {product.category || 'Tanpa kategori'}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded">
                        Aktif
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.is_storefront 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.is_storefront ? 'Ya' : 'Tidak'}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 text-lg text-gray-500">
                      <button
                        className="hover:text-blue-600 transition-colors"
                        onClick={() =>
                          setExpandedProduct(
                            expandedProduct === product.id ? null : product.id
                          )
                        }
                        title="Lihat detail"
                      >
                        <Icon icon="mdi:eye-outline" />
                      </button>
                      <Link href={`/cms/product/edit/${product.id}`}>
                        <button className="hover:text-blue-600 transition-colors" title="Edit produk">
                          <Icon icon="mdi:pencil-outline" />
                        </button>
                      </Link>
                      <button 
                        className="hover:text-red-600 transition-colors"
                        onClick={() => deleteProduct(product.id)}
                        title="Hapus produk"
                      >
                        <Icon icon="mdi:trash-outline" />
                      </button>
                    </div>
                  </div>

                  {expandedProduct === product.id && (
                    <div className="px-8 py-4 bg-gray-50 text-sm">
                      <h4 className="font-medium mb-3">Detail Varian Produk</h4>
                      {product.variants?.length > 0 ? (
                        <table className="w-full text-left border mt-2 text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2">Gambar</th>
                              <th className="px-3 py-2">Nama Varian</th>
                              <th className="px-3 py-2">SKU</th>
                              <th className="px-3 py-2">Harga Jual</th>
                              <th className="px-3 py-2">Harga Modal</th>
                              <th className="px-3 py-2">Margin</th>
                              <th className="px-3 py-2">Stok</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((variant) => {
                              const profitMargin = variant.base_price > 0 
                                ? (((variant.price - variant.base_price) / variant.base_price) * 100).toFixed(1)
                                : 0;
                              
                              return (
                                <tr key={variant.id} className="border-b">
                                  <td className="px-3 py-2">
                                    {variant.image ? (
                                      <img 
                                        src={`/storage/${variant.image}`} 
                                        alt={variant.variant_label}
                                        className="w-10 h-10 object-cover rounded border"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className={`w-10 h-10 bg-gray-200 rounded border flex items-center justify-center ${variant.image ? 'hidden' : 'flex'}`}
                                    >
                                      <Icon icon="mdi:image-outline" className="text-gray-400 text-sm" />
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">{variant.name || variant.variant_label}</td>
                                  <td className="px-3 py-2 font-mono text-xs">{variant.sku}</td>
                                  <td className="px-3 py-2 font-medium">{formatCurrency(variant.price)}</td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {variant.base_price > 0 ? formatCurrency(variant.base_price) : '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {variant.base_price > 0 ? (
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        profitMargin >= 30 ? 'bg-green-100 text-green-800' :
                                        profitMargin >= 15 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        +{profitMargin}%
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => openStockHistoryModal({ ...variant, product })}
                                      className={`font-semibold hover:underline cursor-pointer ${
                                        variant.stock === 0 ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'
                                      }`}
                                      title="Klik untuk melihat riwayat stok"
                                    >
                                      {variant.stock}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2">
                                    {variant.is_active ? (
                                      <span className="text-green-600 text-xs">Aktif</span>
                                    ) : (
                                      <span className="text-gray-500 text-xs">Nonaktif</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => openStockAdjustmentModal({ ...variant, product })}
                                      className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                                      title="Tambah/Kurangi Stok"
                                    >
                                      <Icon icon="material-symbols:inventory" className="inline mr-1" />
                                      Stok
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Belum ada varian untuk produk ini</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Stock History Modal */}
      <StockHistoryModal
        isOpen={stockHistoryModal.isOpen}
        onClose={closeStockHistoryModal}
        variant={stockHistoryModal.variant}
      />
      
      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={stockAdjustmentModal.isOpen}
        onClose={closeStockAdjustmentModal}
        variant={stockAdjustmentModal.variant}
        onSuccess={handleStockAdjustmentSuccess}
      />
    </DashboardLayout>
  );
}
