import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function ProductData() {
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [pagination, setPagination] = useState(null);

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
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
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
            <Link href="/product/add">
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
            <div className="col-span-4">Produk & Harga</div>
            <div className="col-span-1">Stok</div>
            <div className="col-span-1">Varian</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-2">Status</div>
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

              return (
                <div key={product.id}>
                  <div className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-gray-50">
                    <div className="col-span-4">
                      <p className="text-blue-600 font-medium">{product.name}</p>
                      <p className="text-gray-600">
                        {product.variants?.length > 0 ? formatCurrency(minPrice) : 'Belum ada harga'}
                      </p>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1">{product.description}</p>
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
                    <div className="col-span-2">
                      <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded">
                        Aktif
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
                      <Link href={`/product/edit/${product.id}`}>
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
                              <th className="px-3 py-2">Nama Varian</th>
                              <th className="px-3 py-2">SKU</th>
                              <th className="px-3 py-2">Harga</th>
                              <th className="px-3 py-2">Stok</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((variant) => (
                              <tr key={variant.id} className="border-b">
                                <td className="px-3 py-2">{variant.name || variant.variant_label}</td>
                                <td className="px-3 py-2 font-mono text-xs">{variant.sku}</td>
                                <td className="px-3 py-2">{formatCurrency(variant.price)}</td>
                                <td className="px-3 py-2">
                                  <span className={`font-semibold ${
                                    variant.stock === 0 ? 'text-red-500' : 'text-green-600'
                                  }`}>
                                    {variant.stock}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  {variant.is_active ? (
                                    <span className="text-green-600 text-xs">Aktif</span>
                                  ) : (
                                    <span className="text-gray-500 text-xs">Nonaktif</span>
                                  )}
                                </td>
                              </tr>
                            ))}
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
    </DashboardLayout>
  );
}
