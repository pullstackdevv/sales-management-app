import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";
import TiptapEditor from "@/Components/TiptapEditor";
import StockHistoryModal from "@/Components/StockHistoryModal";
import StockAdjustmentModal from "@/Components/StockAdjustmentModal";

export default function ProductEdit() {
  const [product, setProduct] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    image: "",
    is_active: true,
    is_storefront: true,
    variants: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [productId, setProductId] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  
  // Modal states
  const [stockHistoryModal, setStockHistoryModal] = useState({
    isOpen: false,
    variant: null
  });
  const [stockAdjustmentModal, setStockAdjustmentModal] = useState({
    isOpen: false,
    variant: null
  });

  // Get product ID from URL
  useEffect(() => {
    // Extract product ID from URL path (e.g., /product/edit/123)
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1]; // Get the last part of the path
    if (id && id !== 'edit') {
      setProductId(id);
      fetchProduct(id);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'ID produk tidak ditemukan'
      }).then(() => {
        router.visit('/cms/product/data');
      });
    }
  }, []);

  // Fetch product data
  const fetchProduct = async (id) => {
    try {
      setLoadingData(true);
      const response = await api.get(`/products/${id}`);
      const productData = response.data.data;
      
      setProduct({
        name: productData?.name || "",
        sku: productData?.sku || "",
        category: productData?.category || "",
        description: productData?.description || "",
        // keep existing image path so it can be previewed
        image: productData?.image || "",
        is_active: productData?.is_active ?? true,
        is_storefront: productData?.is_storefront ?? true,
        variants: (productData.variants || []).map(variant => ({
          ...variant,
          is_active: variant.is_active ?? true,
          is_storefront: variant.is_storefront ?? true
        }))
      });
      // initialize preview with existing image if available
      setProductImagePreview(productData?.image ? `/storage/${productData.image}` : null);
    } catch (error) {
      console.error('Error fetching product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data produk'
      }).then(() => {
        router.visit('/cms/product/data');
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Generate auto SKU for variant
  const generateVariantSKU = (productSku, variantIndex) => {
    if (!productSku) return "";
    const paddedIndex = String(variantIndex + 1).padStart(3, '0');
    return `${productSku}-${paddedIndex}`;
  };

  // Add new variant
  const addVariant = () => {
    const newVariantIndex = product.variants.length;
    const newVariantSKU = generateVariantSKU(product.sku, newVariantIndex);
    
    setProduct({
      ...product,
      variants: [
        ...product.variants,
        {
          variant_label: "",
          sku: newVariantSKU,
          price: 0,
          base_price: 0,
          weight: 0,
          stock: 0,
          is_active: true,
          is_storefront: true
        }
      ]
    });
  };

  // Remove variant
  const removeVariant = (index) => {
    if (product.variants.length > 1) {
      const newVariants = product.variants.filter((_, i) => i !== index);
      setProduct({ ...product, variants: newVariants });
    }
  };

  // Update variant
  const updateVariant = (index, field, value) => {
    const newVariants = [...product.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProduct({ ...product, variants: newVariants });
  };

  // Update all variant SKUs when product SKU changes
  const updateProductSKU = (newSku) => {
    const updatedVariants = product.variants.map((variant, index) => ({
      ...variant,
      sku: generateVariantSKU(newSku, index)
    }));
    
    setProduct({ 
      ...product, 
      sku: newSku,
      variants: updatedVariants
    });
  };

  // Modal functions
  const openStockHistoryModal = (variant) => {
    setStockHistoryModal({
      isOpen: true,
      variant: { ...variant, product }
    });
  };

  const closeStockHistoryModal = () => {
    setStockHistoryModal({
      isOpen: false,
      variant: null
    });
  };

  const openStockAdjustmentModal = (variant) => {
    setStockAdjustmentModal({
      isOpen: true,
      variant: { ...variant, product }
    });
  };

  const closeStockAdjustmentModal = () => {
    setStockAdjustmentModal({
      isOpen: false,
      variant: null
    });
  };

  const handleStockAdjustmentSuccess = () => {
    // Refresh product data after stock adjustment
    if (productId) {
      fetchProduct(productId);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      
      // Laravel method spoofing for PUT request
      formData.append('_method', 'PUT');
      
      // Append basic product data
      formData.append('name', product.name);
      formData.append('sku', product.sku);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('is_active', product.is_active ? '1' : '0');
      formData.append('is_storefront', product.is_storefront ? '1' : '0');
      
      // Append image file if exists (only if user selected a new file)
      if (product.image && typeof product.image !== 'string') {
        formData.append('image', product.image);
      }
      
      // Append variants data
      product.variants.forEach((variant, index) => {
        if (variant.id) {
          formData.append(`variants[${index}][id]`, variant.id);
        }
        formData.append(`variants[${index}][variant_label]`, variant.variant_label);
        formData.append(`variants[${index}][sku]`, variant.sku);
        formData.append(`variants[${index}][price]`, variant.price);
        formData.append(`variants[${index}][base_price]`, variant.base_price || 0);
        formData.append(`variants[${index}][weight]`, variant.weight);
        formData.append(`variants[${index}][stock]`, variant.stock);
        formData.append(`variants[${index}][is_active]`, variant.is_active ? '1' : '0');
        formData.append(`variants[${index}][is_storefront]`, variant.is_storefront ? '1' : '0');
        if (variant.image && typeof variant.image !== 'string') {
          formData.append(`variants[${index}][image]`, variant.image);
        }
      });

      const response = await api.post(`/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Produk berhasil diperbarui!',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        router.visit('/cms/product/data');
      });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        Swal.fire({
          icon: 'warning',
          title: 'Validasi Error',
          text: 'Mohon periksa kembali data yang diinput'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Terjadi kesalahan saat memperbarui produk'
        });
      }
      console.error('Error updating product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Icon icon="eos-icons:loading" className="text-4xl text-blue-600 mb-2" />
              <p className="text-gray-600">Memuat data produk...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => window.history.back()}
          >
            <Icon icon="material-symbols:arrow-back" width={24} />
          </button>
          <h1 className="text-2xl font-semibold">Edit Produk</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Product Info */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-medium mb-4">Informasi Produk</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Produk*</label>
                    <input
                      type="text"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan nama produk..."
                      value={product.name}
                      onChange={(e) => setProduct({ ...product, name: e.target.value })}
                      required
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">SKU Produk*</label>
                    <input
                      type="text"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.sku ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan SKU produk..."
                      value={product.sku}
                      onChange={(e) => updateProductSKU(e.target.value)}
                      required
                    />
                    {errors.sku && (
                      <p className="text-red-500 text-xs mt-1">{errors.sku[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Kategori*</label>
                    <input
                      type="text"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Contoh: Perfume"
                      value={product.category}
                      onChange={(e) => setProduct({ ...product, category: e.target.value })}
                      required
                    />
                    {errors.category && (
                      <p className="text-red-500 text-xs mt-1">{errors.category[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Deskripsi</label>
                    <TiptapEditor
                      value={product.description}
                      onChange={(content) => setProduct({ ...product, description: content })}
                      error={errors.description}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Gambar Produk</label>
                    {/* Tampilkan gambar saat ini hanya jika belum ada preview terpilih */}
                    {(!productImagePreview && product.image && typeof product.image === 'string') && (
                      <div className="mb-2">
                        <img 
                          src={`/storage/${product.image}`} 
                          alt="Current product image" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <p className="text-sm text-gray-500 mt-1">Gambar saat ini</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.image ? 'border-red-500' : 'border-gray-300'
                      }`}
                      onChange={(e) => {
                        setProduct({ ...product, image: e.target.files[0] });
                        const url = URL.createObjectURL(e.target.files[0]);
                        setProductImagePreview(url);
                      }}
                    />
                    {productImagePreview && (
                      <div className="mt-2">
                        <img
                          src={productImagePreview}
                          alt="Preview Produk"
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Preview gambar produk</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Product Variants */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Varian Produk</h2>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Icon icon="material-symbols:add" />
                    Tambah Varian
                  </button>
                </div>

                <div className="space-y-4">
                  {product.variants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Icon icon="material-symbols:inventory-2-outline" className="text-4xl mb-2" />
                      <p>Belum ada varian produk</p>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="mt-2 text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Tambah Varian Pertama
                      </button>
                    </div>
                  ) : (
                    product.variants.map((variant, index) => (
                      <div key={index} className="border p-4 rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-sm">Varian {index + 1}</h3>
                          {product.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Icon icon="material-symbols:delete-outline" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Gambar Varian</label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif"
                            className="w-full border px-3 py-2 rounded-md text-sm border-gray-300"
                            onChange={(e) => updateVariant(index, 'image', e.target.files[0])}
                          />
                          {variant.image && typeof variant.image !== 'string' ? (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(variant.image)}
                                alt="Preview Varian"
                                className="w-20 h-20 object-cover rounded border"
                              />
                              <p className="text-xs text-gray-500 mt-1">Preview gambar varian</p>
                            </div>
                          ) : (
                            variant.image && typeof variant.image === 'string' && (
                              <div className="mt-2">
                                <img
                                  src={`/storage/${variant.image}`}
                                  alt="Gambar Varian Saat Ini"
                                  className="w-20 h-20 object-cover rounded border"
                                />
                                <p className="text-xs text-gray-500 mt-1">Gambar varian saat ini</p>
                              </div>
                            )
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Nama Varian*</label>
                            <input
                              type="text"
                              className={`w-full border px-3 py-2 rounded-md text-sm ${
                                errors[`variants.${index}.variant_label`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Contoh: Size M, Warna Merah"
                              value={variant.variant_label || ''}
                              onChange={(e) => updateVariant(index, 'variant_label', e.target.value)}
                              required
                            />
                            {errors[`variants.${index}.variant_label`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.variant_label`][0]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">SKU*</label>
                            <input
                              type="text"
                              className={`w-full border px-3 py-2 rounded-md text-sm bg-gray-100 ${
                                errors[`variants.${index}.sku`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Auto-generated"
                              value={variant.sku || ''}
                              readOnly
                              title="SKU otomatis berdasarkan SKU produk"
                            />
                            {errors[`variants.${index}.sku`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.sku`][0]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Harga Jual*</label>
                            <input
                              type="number"
                              className={`w-full border px-3 py-2 rounded-md text-sm ${
                                errors[`variants.${index}.price`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              value={variant.price || 0}
                              onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              required
                            />
                            {errors[`variants.${index}.price`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.price`][0]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Harga Modal*</label>
                            <input
                              type="number"
                              className={`w-full border px-3 py-2 rounded-md text-sm ${
                                errors[`variants.${index}.base_price`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              value={variant.base_price || 0}
                              onChange={(e) => updateVariant(index, 'base_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              required
                            />
                            {errors[`variants.${index}.base_price`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.base_price`][0]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Berat (kg)</label>
                            <input
                              type="number"
                              className={`w-full border px-3 py-2 rounded-md text-sm ${
                                errors[`variants.${index}.weight`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0.000"
                              value={variant.weight || 0}
                              onChange={(e) => updateVariant(index, 'weight', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.001"
                            />
                            {errors[`variants.${index}.weight`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.weight`][0]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Stok*</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                className={`w-1/2 border px-3 py-2 rounded-md text-sm ${
                                  errors[`variants.${index}.stock`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0"
                                value={variant.stock || 0}
                                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                min="0"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => openStockHistoryModal(variant)}
                                className="px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                                title="Lihat Riwayat Stok"
                              >
                                <Icon icon="material-symbols:history" className="text-lg" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openStockAdjustmentModal(variant)}
                                className="px-3 py-2 text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50 transition-colors"
                                title="Penyesuaian Stok"
                              >
                                <Icon icon="material-symbols:inventory" className="text-lg" />
                              </button>
                            </div>
                            {errors[`variants.${index}.stock`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.stock`][0]}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={variant.is_active !== false}
                                onChange={(e) => updateVariant(index, 'is_active', e.target.checked)}
                              />
                              <span className="text-sm">Varian aktif</span>
                            </label>
                          </div>
                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={variant.is_storefront !== false}
                                onChange={(e) => updateVariant(index, 'is_storefront', e.target.checked)}
                              />
                              <span className="text-sm">Tampil di etalase</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="font-medium mb-4">Pengaturan</h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={product.is_active}
                        onChange={(e) => setProduct({ ...product, is_active: e.target.checked })}
                      />
                      <span className="text-sm">Produk aktif</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Produk dapat dikelola dan dijual</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={product.is_storefront}
                        onChange={(e) => setProduct({ ...product, is_storefront: e.target.checked })}
                      />
                      <span className="text-sm">Tampil di halaman depan</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Produk akan dapat dilihat dan dibeli oleh customer</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="font-medium mb-4">Aksi</h2>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Icon icon="eos-icons:loading" className="text-lg" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Icon icon="material-symbols:save" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="font-medium mb-3">Tips</h2>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Nama produk harus unik</li>
                  <li>• SKU harus unik untuk setiap varian</li>
                  <li>• Minimal harus ada 1 varian aktif</li>
                  <li>• Harga dan stok tidak boleh negatif</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
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