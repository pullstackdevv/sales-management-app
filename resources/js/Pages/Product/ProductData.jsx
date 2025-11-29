import { useEffect, useState, useRef } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import { useAuth } from "../../contexts/AuthContext";
import Swal from "sweetalert2";
import StockHistoryModal from "@/components/StockHistoryModal";
import StockAdjustmentModal from "@/components/StockAdjustmentModal";

export default function ProductData() {
  const { hasPermission, isOwner } = useAuth();
  const canViewBasePrice = isOwner;
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [pagination, setPagination] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [importJobId, setImportJobId] = useState(null);
  const fileInputRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

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

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const startPollingImportStatus = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/products/import-status/${jobId}`);
        const status = res.data.data?.status;
        const message = res.data.data?.message;
        const lastId = res.data.data?.last_variant_id;
        const lastAction = res.data.data?.last_action;
        const lastSku = res.data.data?.last_sku;
        const lastSkipReason = res.data.data?.last_skip_reason;
        const importedCount = res.data.data?.imported;
        const skippedCount = res.data.data?.skipped;
        setImportStatus(message || "");
        if (lastId || lastAction || lastSku) {
          console.log("Status impor produk", {
            jobId,
            status,
            message,
            last_variant_id: lastId,
            last_action: lastAction,
            last_sku: lastSku,
            last_skip_reason: lastSkipReason,
            imported: importedCount,
            skipped: skippedCount,
          });
        } else {
          console.log("Status impor produk", { jobId, status, message });
        }
        if (status === "completed") {
          clearInterval(interval);
          setImporting(false);
          setImportJobId(null);
          console.log("Impor produk selesai", { jobId, imported: importedCount, skipped: skippedCount });
          if (skippedCount && skippedCount > 0) {
            Swal.fire({
              icon: "warning",
              title: "Selesai dengan peringatan",
              html: `Imported: ${importedCount || 0}<br/>Skipped: ${skippedCount}<br/>${lastSkipReason ? `Alasan terakhir: ${lastSkipReason}` : ''}`,
              confirmButtonColor: "#3b82f6"
            });
          } else {
            Swal.fire({ icon: "success", title: "Berhasil", text: `Impor produk selesai. Imported: ${importedCount || 0}` });
          }
          fetchProducts(search, category);
        } else if (status === "failed") {
          clearInterval(interval);
          setImporting(false);
          setImportJobId(null);
          console.log("Impor produk gagal", { jobId, message });
          Swal.fire({ icon: "error", title: "Gagal", text: message || "Impor produk gagal" });
        }
      } catch (err) {
        clearInterval(interval);
        setImporting(false);
        setImportJobId(null);
        console.log("Gagal memeriksa status impor", { jobId, error: err?.message });
        Swal.fire({ icon: "error", title: "Gagal", text: "Tidak dapat memeriksa status impor" });
      }
    }, 2000);
  };

  const submitImport = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      setImporting(true);
      setImportStatus("Mengirim file impor...");
      const res = await api.post("/products/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const jobId = res.data.data?.job_id;
      setImportJobId(jobId);
      console.log("Upload impor produk dikirim", { jobId, fileName: importFile?.name });
      setImportStatus("File dikirim. Memproses...");
      setShowImportModal(false);
      setImportFile(null);
      startPollingImportStatus(jobId);
    } catch (error) {
      setImporting(false);
      setImportJobId(null);
      console.log("Gagal mengirim file impor", { error: error?.message });
      Swal.fire({ icon: "error", title: "Error", text: "Gagal mengirim file impor" });
    }
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
            {hasPermission('products.import') && (
              <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100" onClick={handleImportClick} disabled={importing}>
                {importing ? "Mengimpor..." : "Impor Produk"}
              </button>
            )}
            {hasPermission('products.export') && (
              <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
                Download
              </button>
            )}
            {hasPermission('products.create') && (
              <Link href="/cms/product/add">
                <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                  <Icon icon="material-symbols:add" className="text-lg" />
                  Tambah Produk
                </button>
              </Link>
            )}
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
                        {canViewBasePrice && minBasePrice > 0 && (
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
                        className={`text-xs font-semibold ${totalStock === 0 ? "text-red-500" : "text-green-600"
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
                      {Array.isArray(product.categories) && product.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.categories.map((c) => (
                            <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {product.category || 'Tanpa kategori'}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded">
                        Aktif
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-xs px-2 py-1 rounded ${product.is_storefront
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {product.is_storefront ? 'Ya' : 'Tidak'}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 text-lg text-gray-500">
                      {hasPermission('products.view') && (
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
                      )}
                      {hasPermission('products.edit') && (
                        <Link href={`/cms/product/edit/${product.id}`}>
                          <button className="hover:text-blue-600 transition-colors" title="Edit produk">
                            <Icon icon="mdi:pencil-outline" />
                          </button>
                        </Link>
                      )}
                      {hasPermission('products.delete') && (
                        <button
                          className="hover:text-red-600 transition-colors"
                          onClick={() => deleteProduct(product.id)}
                          title="Hapus produk"
                        >
                          <Icon icon="mdi:trash-outline" />
                        </button>
                      )}
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
                              {canViewBasePrice && (<th className="px-3 py-2">Harga Modal</th>)}
                              <th className="px-3 py-2">Harga Jual</th>
                              {canViewBasePrice && (<th className="px-3 py-2">Margin</th>)}
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
                                  {canViewBasePrice && (
                                    <td className="px-3 py-2 text-gray-600">
                                      {variant.base_price > 0 ? formatCurrency(variant.base_price) : '-'}
                                    </td>
                                  )}
                                  <td className="px-3 py-2 font-medium">{formatCurrency(variant.price)}</td>
                                  {canViewBasePrice && (
                                    <td className="px-3 py-2">
                                      {variant.base_price > 0 ? (
                                        <span className={`text-xs px-2 py-1 rounded ${profitMargin >= 30 ? 'bg-green-100 text-green-800' :
                                            profitMargin >= 15 ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                          }`}>
                                          +{profitMargin}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                      )}
                                    </td>
                                  )}
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => openStockHistoryModal({ ...variant, product })}
                                      className={`font-semibold hover:underline cursor-pointer ${variant.stock === 0 ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'
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
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Impor Produk</h3>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="text-gray-400 hover:text-gray-600">
                <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="w-full" />
                <p className="text-xs text-gray-500 mt-1">Format yang didukung: Excel (.xlsx, .xls) atau CSV (.csv)</p>
              </div>
              <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-3">
                <p className="text-sm text-gray-700">Unduh template impor produk (Excel)</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get('/products/import-template', { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'product_import_template.xlsx';
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat mengunduh template' });
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download Template
                </button>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50">
                <p className="font-medium text-sm mb-2">Format File yang Diharapkan:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>Header: baris pertama berisi judul kolom</li>
                  <li>Kolom: Nama Produk, Kategori Produk, Deskripsi Produk</li>
                  <li>Kolom: Produk Aktif, Tampil di etalase, Harga Modal</li>
                  <li>Kolom: Nama Varian, Harga Varian, Harga Modal Varian, Harga Diskon Varian</li>
                  <li>Kolom: Berat Varian, Stok Varian, Varian Aktif, Varian Tampil di Etalase</li>
                  <li>Ukuran maksimal file 10MB</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="px-4 py-2 border rounded-md">Batal</button>
              <button onClick={submitImport} disabled={!importFile || importing} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">Import</button>
            </div>
          </div>
        </div>
      )}

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
