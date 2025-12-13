import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import Swal from 'sweetalert2';

const ProductCheckout = () => {
  const [product, setProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data dari session storage saat komponen dimount
  useEffect(() => {
    const checkoutData = checkoutSession.get();
    console.log('Checkout data from session storage:', checkoutData);
    
    if (checkoutData && checkoutData.product) {
      const productData = checkoutData.product;
      console.log('Product data:', productData);
      console.log('Selected variants:', productData.selectedVariants);
      // Reconstruct product object dengan variants jika ada
      const productObj = {
        id: productData.id,
        name: productData.name || 'Produk Tidak Diketahui',
        price: productData.price || 0,
        image: productData.image,
        variants: productData.variants || (productData.variant ? [productData.variant] : []),
        description: productData.description || 'Deskripsi produk akan segera tersedia'
      };
      
      console.log('Reconstructed product object:', productObj);
      setProduct(productObj);
      
      // Initialize selected variants from session data
      const initialVariants = {};
      if (productData.selectedVariants) {
        // Multiple variants from session
        Object.keys(productData.selectedVariants).forEach(variantId => {
          initialVariants[variantId] = productData.selectedVariants[variantId];
        });
      } else if (productData.variant) {
        // Single variant from old format
        initialVariants[productData.variant.id] = {
          variant: productData.variant,
          quantity: productData.quantity || 1
        };
      }
      setSelectedVariants(initialVariants);
      setLoading(false);
    } else {
      // Jika tidak ada data di session storage, redirect ke marketplace
      console.log('No checkout data found, redirecting to marketplace');
      router.visit(route('marketplace.home'));
    }
  }, []);

  // Hitung subtotal untuk semua varian yang dipilih
  const calculateSubtotal = () => {
    if (!product) return 0;
    
    let total = 0;
    Object.values(selectedVariants).forEach(({ variant, quantity }) => {
      const price = variant ? variant.price : product.price;
      total += price * quantity;
    });
    
    // Jika tidak ada varian yang dipilih, tampilkan harga dasar produk
    if (Object.keys(selectedVariants).length === 0) {
      return product.price || 0;
    }
    
    return total;
  };

  const subtotal = calculateSubtotal();

  // Early return jika sedang loading atau product tidak ada
  if (loading || !product) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data produk...</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  // Handle toggle varian (pilih/hapus)
  const handleVariantToggle = (variant) => {
    setSelectedVariants(prev => {
      const newVariants = { ...prev };
      
      if (newVariants[variant.id]) {
        // Jika sudah dipilih, hapus dari selection
        delete newVariants[variant.id];
      } else {
        // Check if variant has stock before adding
        if (variant.stock <= 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Stok Habis',
            text: 'Varian ini sedang tidak tersedia (stok habis).',
            confirmButtonColor: '#3b82f6'
          });
          return prev;
        }
        
        // Jika belum dipilih, tambahkan dengan quantity 1
        newVariants[variant.id] = {
          variant: variant,
          quantity: 1
        };
      }
      
      return newVariants;
    });
  };

  // Handle perubahan quantity untuk varian tertentu
  const handleVariantQuantityChange = (variantId, newQuantity) => {
    // Find the variant to check stock
    const variant = product.variants.find(v => v.id === variantId);
    const maxStock = variant ? variant.stock : 0;
    
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setSelectedVariants(prev => ({
        ...prev,
        [variantId]: {
          ...prev[variantId],
          quantity: newQuantity
        }
      }));
    } else if (newQuantity > maxStock) {
      // Show alert when trying to exceed stock
      Swal.fire({
        icon: 'warning',
        title: 'Stok Tidak Mencukupi',
        text: `Maksimal ${maxStock} item untuk varian ini.`,
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Handle menambah varian lain dari produk yang sama
  const handleAddMoreVariants = () => {
    // Redirect kembali ke halaman detail produk untuk memilih varian lain
    if (product && product.id) {
      router.visit(route('marketplace.product.detail', { id: product.id }));
    }
  };

  // Handle lanjut ke step berikutnya
  const handleContinue = () => {
    setLoading(true);
    
    // Format data untuk disimpan ke session
    const productData = {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        variants: product.variants,
        selectedVariants: selectedVariants,
        subtotal: subtotal
      }
    };
    
    const success = checkoutSession.save(productData);
    
    if (success) {
      // Redirect ke halaman customer data
      router.visit(route('checkout.customer-data'));
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
        confirmButtonColor: '#3b82f6'
      });
      setLoading(false);
    }
  };

  // Handle kembali ke product detail
  const handleBack = () => {
    if (product && product.id) {
      router.visit(route('marketplace.product.detail', { id: product.id }));
    } else {
      router.visit(route('marketplace.home'));
    }
  };

  return (
    <MarketplaceLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali ke Detail Produk
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Konfirmasi Pesanan</h1>
            <p className="text-gray-600 mt-2">Pastikan produk dan jumlah yang Anda pilih sudah benar</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Konfirmasi Produk</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-gray-200 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm text-gray-500">Data Diri</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-gray-200 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm text-gray-500">Pembayaran</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Detail Produk</h2>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Product Image */}
                  <div className="md:w-1/3">
                    <img
                      src={product?.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg'} 
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                    {product.description && (
                      <div 
                        className="text-gray-600 mb-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    )}

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Pilih Varian (dapat memilih lebih dari satu)
                          </label>
                          <button
                            onClick={handleAddMoreVariants}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Tambah Varian Lain
                          </button>
                        </div>
                        <div className="space-y-3">
                          {product.variants.map((variant) => {
                            const isSelected = selectedVariants[variant.id];
                            return (
                              <div
                                key={variant.id}
                                className={`p-4 border rounded-lg transition-colors ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={!!isSelected}
                                      onChange={() => handleVariantToggle(variant)}
                                      disabled={variant.stock <= 0}
                                      className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                                        variant.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900">{variant.name}</div>
                                      <div className="text-sm text-gray-500">
                                        Rp {variant.price.toLocaleString('id-ID')}
                                      </div>
                                      <div className={`text-xs ${
                                        variant.stock <= 0 
                                          ? 'text-red-500 font-medium' 
                                          : variant.stock <= 5 
                                            ? 'text-orange-500 font-medium' 
                                            : 'text-gray-400'
                                      }`}>
                                        Stok: {variant.stock} {variant.stock <= 0 ? '(Habis)' : variant.stock <= 5 ? '(Terbatas)' : ''}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Quantity controls untuk varian yang dipilih */}
                                  {isSelected && (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleVariantQuantityChange(variant.id, isSelected.quantity - 1)}
                                        disabled={isSelected.quantity <= 1}
                                        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-8 text-center text-sm font-medium">{isSelected.quantity}</span>
                                      <button
                                        onClick={() => handleVariantQuantityChange(variant.id, isSelected.quantity + 1)}
                                        disabled={isSelected.quantity >= variant.stock}
                                        className={`w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 ${
                                          isSelected.quantity >= variant.stock 
                                            ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                                            : ''
                                        }`}
                                        title={isSelected.quantity >= variant.stock ? `Maksimal ${variant.stock} item` : 'Tambah quantity'}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    {Object.keys(selectedVariants).length === 0 && (
                      <div className="text-2xl font-bold text-blue-600">
                        Harga Dasar: Rp {(product.price || 0).toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produk</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  
                  {/* Tampilkan semua varian yang dipilih */}
                  {Object.keys(selectedVariants).length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-gray-600 text-sm font-medium">Varian yang dipilih:</span>
                      {Object.values(selectedVariants).map(({ variant, quantity }) => (
                        <div key={variant.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">{variant.variant_label}</div>
                              <div className="text-xs text-gray-500">
                                Rp {variant.price.toLocaleString('id-ID')} × {quantity}
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              Rp {(variant.price * quantity).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {product.variants?.length > 0 
                        ? 'Belum ada varian yang dipilih'
                        : 'Produk tanpa varian'
                      }
                    </div>
                  )}
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span className="text-blue-600">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={loading || (product.variants?.length > 0 && Object.keys(selectedVariants).length === 0)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    'Memproses...'
                  ) : (
                    <>
                      Lanjutkan ke Data Diri
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
                
                {(product.variants?.length > 0 && Object.keys(selectedVariants).length === 0) && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Silakan pilih minimal satu varian
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default ProductCheckout;