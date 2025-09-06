import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import axios from 'axios';

const PaymentMethodCheckout = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);

  useEffect(() => {
    // Ambil data checkout dari session
    const data = checkoutSession.get();
    if (!data || !data.product || !data.customer) {
      // Jika tidak ada data yang diperlukan, redirect ke halaman utama
      router.visit(route('marketplace.index'));
      return;
    }
    
    setCheckoutData(data);
    setLoading(false);
  }, []);

console.log('Checkout data:', checkoutData);

  // Handle lanjut ke step berikutnya - Direct payment with xendit
  const handleContinue = async () => {
    setSubmitting(true);
    
    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        alert('Anda perlu login terlebih dahulu');
        setSubmitting(false);
        return;
      }

      // Debug checkout data
      console.log('Checkout data:', checkoutData);
      console.log('Product quantity:', checkoutData.product.quantity);
      console.log('Product data:', checkoutData.product);

      // Prepare order data with correct customer_id field
      const orderData = {
        customer_id: checkoutData.customer.customer_id, // Use customer_id instead of id
        address_id: checkoutData.customer.address_id || 1,
        sales_channel_id: 1, // Default sales channel
        items: [{
          product_variant_id: checkoutData.product.variant?.id || checkoutData.product.id,
          quantity: parseInt(checkoutData.product.quantity) || 1, // Ensure quantity is a number
          price: checkoutData.product.price || (checkoutData.product.subtotal / checkoutData.product.quantity)
        }],
        shipping_cost: 0, // Default shipping cost
        notes: 'Order dari marketplace - Payment via Xendit'
      };

      console.log('Creating order with data:', orderData);
      console.log('Items array:', orderData.items);

      // Create order
      const orderResponse = await axios.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (orderResponse.data.status === 'success' && orderResponse.data.data.order_number) {
        const orderNumber = orderResponse.data.data.order_number;
        
        // Create payment with xendit
        const paymentResponse = await axios.post(`http://127.0.0.1:8000/api/payment/create/${orderNumber}`, {
          payment_gateway: 'xendit'
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (paymentResponse.data.status === 'success') {
          // Save payment info to session
          const success = checkoutSession.updateStep('paymentMethod', {
            payment_gateway: 'xendit',
            order_number: orderNumber,
            payment_data: paymentResponse.data.data
          });
          
          if (success) {
            // Redirect ke payment_url dari response
            const paymentUrl = paymentResponse.data.data.order?.payment_url || paymentResponse.data.data.invoice_url;
            if (paymentUrl) {
              window.location.href = paymentUrl;
            } else {
              alert('Payment URL tidak ditemukan dalam response.');
              setSubmitting(false);
            }
          } else {
            alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
            setSubmitting(false);
          }
        } else {
          alert('Gagal membuat pembayaran: ' + (paymentResponse.data.message || 'Unknown error'));
          setSubmitting(false);
        }
      } else {
        alert('Gagal membuat order: ' + (orderResponse.data.message || 'Unknown error'));
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error during payment process:', error);
      if (error.response) {
        // Show detailed error information
        const errorData = error.response.data;
        let errorMessage = errorData?.message || `Error ${error.response.status}: ${error.response.statusText}`;
        
        // Show validation errors if available
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map(err => err.message).join(', ');
          errorMessage += ` - ${validationErrors}`;
        }
        
        alert(`Terjadi kesalahan: ${errorMessage}`);
      } else {
        alert('Terjadi kesalahan jaringan. Silakan coba lagi.');
      }
      setSubmitting(false);
    }
  };

  // Handle kembali ke step sebelumnya
  const handleBack = () => {
    router.visit(route('checkout.customer-data'));
  };



  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat metode pembayaran...</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (!checkoutData) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Data checkout tidak ditemukan</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

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
              Kembali ke Data Diri
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Konfirmasi Pembayaran</h1>
            <p className="text-gray-600 mt-2">Konfirmasi pesanan Anda untuk melanjutkan ke pembayaran</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Konfirmasi Produk</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-green-600 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Data Diri</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-blue-600 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Pembayaran</span>
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
            {/* Payment Gateway Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Gateway Pembayaran</h2>
                
                <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Xendit Payment Gateway</h3>
                      <p className="text-gray-600 mt-1">Pembayaran aman melalui berbagai metode:</p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• Virtual Account (BCA, BNI, BRI, Mandiri, dll)</li>
                        <li>• E-Wallet (OVO, DANA, LinkAja, ShopeePay)</li>
                        <li>• Kartu Kredit/Debit</li>
                        <li>• QRIS</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Catatan:</strong> Setelah mengklik "Lanjutkan ke Pembayaran", Anda akan diarahkan ke halaman pembayaran Xendit untuk memilih metode pembayaran yang diinginkan.
                  </p>
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
                    <span className="font-medium">{checkoutData.product.name}</span>
                  </div>
                  {/* Tampilkan semua varian yang dipilih */}
                {checkoutData.product.selectedVariants && Object.keys(checkoutData.product.selectedVariants).length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-gray-600 text-sm font-medium">Varian yang dipilih:</span>
                      {Object.values(checkoutData.product.selectedVariants).map(({ variant, quantity }) => (
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
                  ) : checkoutData.product.variant ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Varian</span>
                      <span className="font-medium">{checkoutData.product.variant.variant_label}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Produk tanpa varian
                    </div>
                  )}

                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {checkoutData.product.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">Rp {checkoutData.product.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4 mb-6">
                  <h4 className="font-medium mb-2">Data Pemesan</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{checkoutData.customer.name}</p>
                    <p>{checkoutData.customer.whatsapp}</p>
                    <p className="text-xs">{checkoutData.customer.address}, {checkoutData.customer.city}</p>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    'Memproses...'
                  ) : (
                    <>
                      Lanjutkan ke Pembayaran
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default PaymentMethodCheckout;