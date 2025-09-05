import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';

const ProductCheckout = () => {
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Load data dari session storage saat komponen dimount
  useEffect(() => {
    const checkoutData = checkoutSession.get();
    console.log('Checkout data from session storage:', checkoutData);
    
    if (checkoutData && checkoutData.product) {
      const productData = checkoutData.product;
      console.log('Product data:', productData);
      
      // Reconstruct product object dengan variants jika ada
      const productObj = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        image: productData.image,
        variants: productData.variant ? [productData.variant] : [],
        description: productData.description || ''
      };
      
      console.log('Reconstructed product object:', productObj);
      setProduct(productObj);
      setSelectedVariant(productData.variant);
      setQuantity(productData.quantity || 1);
      setLoading(false);
    } else {
      // Jika tidak ada data di session storage, redirect ke marketplace
      console.log('No checkout data found, redirecting to marketplace');
      router.visit(route('marketplace.index'));
    }
  }, []);

  // Hitung subtotal
  const getPrice = () => {
    if (!product) return 0;
    return selectedVariant ? selectedVariant.price : (product.price || 0);
  };

  const subtotal = getPrice() * quantity;

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

  // Handle perubahan varian
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  // Handle perubahan quantity
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // Handle lanjut ke step berikutnya
  const handleContinue = () => {
    setLoading(true);
    
    // Update data produk di session dengan perubahan terbaru
    const success = checkoutSession.initWithProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    }, selectedVariant, quantity);
    
    if (success) {
      // Redirect ke halaman customer data
      router.visit(route('checkout.customer-data'));
    } else {
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
      setLoading(false);
    }
  };

  // Handle kembali ke product detail
  const handleBack = () => {
    if (product && product.id) {
      router.visit(route('marketplace.product.detail', { id: product.id }));
    } else {
      router.visit(route('marketplace.index'));
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
              <div className="flex-1 mx-4 h-1 bg-gray-200 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <span className="ml-2 text-sm text-gray-500">Selesai</span>
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
                      src={product.image || '/assets/images/no-image.png'}
                      alt={product.name || 'Product'}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name || 'Nama Produk'}</h3>
                    <p className="text-gray-600 mb-4">{product.description || 'Deskripsi produk tidak tersedia'}</p>

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pilih Varian
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {product.variants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => handleVariantChange(variant)}
                              className={`p-3 border rounded-lg text-left transition-colors ${
                                selectedVariant?.id === variant.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-medium">{variant.name}</div>
                              <div className="text-sm text-gray-500">
                                Rp {variant.price.toLocaleString('id-ID')}
                              </div>
                              <div className="text-xs text-gray-400">
                                Stok: {variant.stock}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="w-20 text-center border border-gray-300 rounded-lg py-2"
                          min="1"
                        />
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-2xl font-bold text-blue-600">
                      Rp {getPrice().toLocaleString('id-ID')}
                    </div>
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
                    <span className="font-medium">{product.name || 'Nama Produk'}</span>
                  </div>
                  
                  {selectedVariant && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Varian</span>
                      <span className="font-medium">{selectedVariant.name}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga Satuan</span>
                    <span className="font-medium">Rp {getPrice().toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span className="text-blue-600">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={loading || (!selectedVariant && product.variants?.length > 0)}
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
                
                {(!selectedVariant && product.variants?.length > 0) && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Silakan pilih varian terlebih dahulu
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