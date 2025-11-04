import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import Swal from 'sweetalert2';

const MultiProductCheckout = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data dari session storage saat komponen dimount
  useEffect(() => {
    const checkoutData = checkoutSession.get();
    console.log('Checkout data from session storage:', checkoutData);
    
    if (checkoutData && checkoutData.products) {
      console.log('Multiple products from cart:', checkoutData.products);
      setProducts(checkoutData.products);
      setLoading(false);
    } else {
      // Jika tidak ada data di session storage, redirect ke marketplace
      console.log('No checkout data found, redirecting to marketplace');
      router.visit(route('marketplace.home'));
    }
  }, []);

  // Hitung subtotal untuk semua produk
  const calculateSubtotal = () => {
    if (!products || products.length === 0) return 0;
    
    return products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  // Early return jika sedang loading atau products tidak ada
  if (loading || !products || products.length === 0) {
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

  // Handle quantity change for a product
  const handleQuantityChange = (productIndex, newQuantity) => {
    const product = products[productIndex];
    const maxStock = product.stock || 99;
    
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setProducts(prev => {
        const updated = [...prev];
        updated[productIndex] = { ...updated[productIndex], quantity: newQuantity };
        return updated;
      });
    } else if (newQuantity > maxStock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stok Tidak Mencukupi',
        text: `Maksimal ${maxStock} item untuk produk ini.`,
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Handle remove product
  const handleRemoveProduct = (productIndex) => {
    setProducts(prev => prev.filter((_, index) => index !== productIndex));
  };

  // Handle lanjut belanja (add more products)
  const handleAddMoreProducts = () => {
    // Save current checkout data before redirecting
    const checkoutData = {
      products: products,
      subtotal: subtotal
    };
    
    const success = checkoutSession.save(checkoutData);
    
    if (success) {
      router.visit(route('marketplace.home'));
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Handle lanjut ke step berikutnya (customer data)
  const handleContinue = () => {
    setLoading(true);
    
    // Convert products to the format expected by existing checkout system
    // Create a combined product object that represents all products
    const combinedProduct = {
      id: 'multi-product',
      name: `${products.length} Produk`,
      price: 0, // Will be calculated from products
      image: products[0]?.image || null,
      description: `Checkout untuk ${products.length} produk`,
      variants: [],
      selectedVariants: {},
      subtotal: subtotal,
      // Add products array for multi-product handling
      multiProducts: products,
      // Add total weight for shipping calculation
      totalWeight: calculateTotalWeight()
    };
    
    // Format data untuk disimpan ke session (compatible with existing system)
    const productData = {
      product: combinedProduct
    };
    
    const success = checkoutSession.save(productData);
    
    if (success) {
      // Redirect ke halaman customer data yang sudah ada
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

  // Function to calculate total weight from multiple products
  const calculateTotalWeight = () => {
    if (!products || products.length === 0) return 0;
    
    return products.reduce((totalWeight, product) => {
      // Get weight from product data, default to 0.5kg if not specified
      const weight = product.weight || 0.5;
      const quantity = product.quantity || 1;
      
      return totalWeight + (weight * quantity);
    }, 0);
  };
  // Handle kembali ke marketplace
  const handleBack = () => {
    router.visit(route('marketplace.home'));
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
              Kembali ke Marketplace
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Konfirmasi Pesanan</h1>
            <p className="text-gray-600 mt-2">Pastikan produk dan jumlah yang Anda pilih sudah benar ({products.length} produk)</p>
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
            {/* Products Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Produk dalam Pesanan ({products.length})</h2>
                  <button
                    onClick={handleAddMoreProducts}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    + Lanjut Belanja
                  </button>
                </div>
                
                {/* Display all products */}
                <div className="space-y-6">
                  {products.map((product, productIndex) => (
                    <div key={`${product.product_id}-${product.variant_id}-${productIndex}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Product Image */}
                        <div className="md:w-1/4">
                          <img
                            src={(() => {
                              // Check multiple possible image sources
                              const imageUrl = product?.image || product?.product_image || product?.images?.[0]?.image_url;
                              
                              if (!imageUrl) {
                                return 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg';
                              }
                              
                              // If it's already a full URL, use it
                              if (imageUrl.startsWith('http')) {
                                return imageUrl;
                              }
                              
                              // If it starts with storage/, use it as is
                              if (imageUrl.startsWith('storage/')) {
                                return `/${imageUrl}`;
                              }
                              
                              // Otherwise, prepend /storage/
                              return `/storage/${imageUrl}`;
                            })()}
                            alt={product.name || 'Product Image'}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="md:w-3/4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                            {products.length > 1 && (
                              <button
                                onClick={() => handleRemoveProduct(productIndex)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          
                          {product.variant_label && (
                            <p className="text-gray-600 mb-2 text-sm">Varian: {product.variant_label}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-blue-600">
                              Rp {(product.price || 0).toLocaleString('id-ID')}
                            </div>
                            
                            {/* Quantity controls */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleQuantityChange(productIndex, product.quantity - 1)}
                                disabled={product.quantity <= 1}
                                className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{product.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(productIndex, product.quantity + 1)}
                                disabled={product.quantity >= (product.stock || 99)}
                                className={`w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 ${
                                  product.quantity >= (product.stock || 99)
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                                    : ''
                                }`}
                                title={product.quantity >= (product.stock || 99) ? `Maksimal ${product.stock || 99} item` : 'Tambah quantity'}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 mt-2">
                            Stok: {product.stock || '—'} | Subtotal: Rp {(product.price * product.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Produk</span>
                    <span className="font-medium">{products.length} produk</span>
                  </div>
                  
                  {/* Tampilkan semua produk */}
                  <div className="space-y-3">
                    {products.map((product, productIndex) => (
                      <div key={`summary-${product.product_id}-${product.variant_id}-${productIndex}`} className="border-l-2 border-blue-200 pl-3">
                        <div className="font-medium text-sm text-gray-800">{product.name}</div>
                        {product.variant_label && (
                          <div className="text-xs text-gray-500">{product.variant_label}</div>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs text-gray-500">
                            Rp {product.price.toLocaleString('id-ID')} × {product.quantity}
                          </div>
                          <div className="text-sm font-medium">
                            Rp {(product.price * product.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Berat</span>
                    <span className="font-medium">{calculateTotalWeight().toFixed(1)} kg</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span className="text-blue-600">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    *Ongkos kirim akan dihitung berdasarkan alamat tujuan
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={loading || products.length === 0}
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
                
                {products.length === 0 && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Belum ada produk dalam pesanan
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

export default MultiProductCheckout;
