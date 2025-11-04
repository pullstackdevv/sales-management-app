import { useState } from "react";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";
import TiptapEditor from "@/Components/TiptapEditor";

export default function ProductAdd() {
  const [product, setProduct] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    image: "",
    is_active: true,
    is_storefront: true,
    variants: [
      {
        variant_label: "Default",
        sku: "",
        price: 0,
        base_price: 0,
        weight: 0,
        stock: 0,
        is_active: true,
        is_storefront: true
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      
      // Append basic product data
      formData.append('name', product.name);
      formData.append('sku', product.sku);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('is_active', product.is_active ? '1' : '0');
      formData.append('is_storefront', product.is_storefront ? '1' : '0');
      
      // Append image file if exists
      if (product.image) {
        formData.append('image', product.image);
      }
      
      // Append variants data
      product.variants.forEach((variant, index) => {
        formData.append(`variants[${index}][variant_label]`, variant.variant_label);
        formData.append(`variants[${index}][sku]`, variant.sku);
        formData.append(`variants[${index}][price]`, variant.price);
        formData.append(`variants[${index}][base_price]`, variant.base_price);
        formData.append(`variants[${index}][weight]`, variant.weight);
        formData.append(`variants[${index}][stock]`, variant.stock);
        formData.append(`variants[${index}][is_active]`, variant.is_active ? '1' : '0');
        formData.append(`variants[${index}][is_storefront]`, variant.is_storefront ? '1' : '0');
        if (variant.image && typeof variant.image !== 'string') {
          formData.append(`variants[${index}][image]`, variant.image);
        }
      });
      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Produk berhasil ditambahkan!',
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
          text: 'Terjadi kesalahan saat menambahkan produk'
        });
      }
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-semibold">Tambah Produk</h1>
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
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      className={`w-full border px-3 py-2 rounded-md ${
                        errors.image ? 'border-red-500' : 'border-gray-300'
                      }`}
                      onChange={(e) => setProduct({ ...product, image: e.target.files[0] })}
                    />
                    {product.image && typeof product.image !== 'string' && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(product.image)}
                          alt="Preview Produk"
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Preview gambar produk</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Format yang didukung: JPEG, PNG, JPG, GIF. Maksimal 2MB.
                    </p>
                    {errors.image && (
                      <p className="text-red-500 text-xs mt-1">{errors.image[0]}</p>
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
                  {product.variants.map((variant, index) => (
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
                            value={variant.variant_label}
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
                            value={variant.sku}
                            readOnly
                            title="SKU otomatis berdasarkan SKU produk"
                          />
                          {errors[`variants.${index}.sku`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`variants.${index}.sku`][0]}</p>
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
                        {variant.image && typeof variant.image !== 'string' && (
                          <div className="mt-2">
                            <img
                              src={URL.createObjectURL(variant.image)}
                              alt="Preview Varian"
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <p className="text-xs text-gray-500 mt-1">Preview gambar varian</p>
                          </div>
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
                            value={variant.price}
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
                            value={variant.base_price}
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
                            value={variant.weight}
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
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                            min="0"
                            required
                          />
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
                              checked={variant.is_active}
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
                  ))}
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
                        Tambah Produk
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