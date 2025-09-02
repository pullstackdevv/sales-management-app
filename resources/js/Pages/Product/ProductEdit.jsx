import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function ProductEdit() {
  const [product, setProduct] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    base_price: 0,
    variants: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [productId, setProductId] = useState(null);

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
        router.visit('/product/data');
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
        name: productData.name || '',
        sku: productData.sku || '',
        category: productData.category || '',
        description: productData.description || '',
        base_price: productData.base_price || 0,
        variants: productData.variants || []
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data produk'
      }).then(() => {
        router.visit('/product/data');
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Add new variant
  const addVariant = () => {
    setProduct({
      ...product,
      variants: [
        ...product.variants,
        {
          variant_label: "",
          sku: "",
          price: 0,
          weight: 0,
          stock: 0,
          is_active: true
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await api.put(`/products/${productId}`, product);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Produk berhasil diperbarui!',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        router.visit('/product/data');
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
                      onChange={(e) => setProduct({ ...product, sku: e.target.value })}
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
                    <textarea
                      rows="4"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Deskripsi produk..."
                      value={product.description}
                      onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    ></textarea>
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Harga Dasar*</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.base_price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan harga dasar..."
                      value={product.base_price}
                      onChange={(e) => setProduct({ ...product, base_price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    {errors.base_price && (
                      <p className="text-red-500 text-xs mt-1">{errors.base_price[0]}</p>
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
                              className={`w-full border px-3 py-2 rounded-md text-sm ${
                                errors[`variants.${index}.sku`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Contoh: PRD-001-M"
                              value={variant.sku || ''}
                              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                              required
                            />
                            {errors[`variants.${index}.sku`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.sku`][0]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Harga*</label>
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
                            <input
                              type="number"
                              className={`w-full border px-3 py-2 rounded-md text-sm ${
                                errors[`variants.${index}.stock`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              value={variant.stock || 0}
                              onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                              min="0"
                              required
                            />
                            {errors[`variants.${index}.stock`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.stock`][0]}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
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
    </DashboardLayout>
  );
}