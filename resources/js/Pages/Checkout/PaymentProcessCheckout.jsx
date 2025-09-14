import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import axios from 'axios';
import api from '@/api/axios';

const PaymentProcessCheckout = () => {
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    // Ambil data checkout dari session
    const data = checkoutSession.get();
    if (!data || !data.product || !data.customer || !data.paymentMethod) {
      // Jika tidak ada data yang diperlukan, redirect ke halaman utama
      router.visit(route('marketplace.home'));
      return;
    }
    
    setCheckoutData(data);
    
    // Proses pembayaran
    processPayment(data);
  }, []);

  // Countdown timer untuk expired payment
  useEffect(() => {
    if (paymentData && paymentData.expired_at && paymentStatus === 'pending') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiredTime = new Date(paymentData.expired_at).getTime();
        const timeLeft = expiredTime - now;
        
        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCountdown('00:00:00');
          setPaymentStatus('failed');
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [paymentData, paymentStatus]);

  const processPayment = async (data) => {
    try {
      setLoading(true);
      setPaymentStatus('processing');
      
      // Hitung total
      const total = data.product.subtotal + (data.paymentMethod.fee || 0);
      
      // Prepare order data
      const orderData = {
        // Product info
        product_id: data.product.id,
        product_variant_id: data.product.variant?.id || null,
        quantity: data.product.quantity,
        unit_price: data.product.price,
        subtotal: data.product.subtotal,
        
        // Customer info
        customer_name: data.customer.name,
        customer_whatsapp: data.customer.whatsapp,
        customer_email: data.customer.email || null,
        
        // Shipping info
        shipping_address: data.customer.address,
        shipping_city: data.customer.city,
        shipping_province: data.customer.province,
        shipping_postal_code: data.customer.postal_code,
        
        // Payment info
        payment_method: data.paymentMethod.id,
        payment_fee: data.paymentMethod.fee || 0,
        total_amount: total,
        
        // Notes
        notes: data.customer.notes || null
      };
      
      // Create order dan payment
      const response = await api.post('/api/orders/create-with-payment', orderData);
      
      if (response.data.success) {
        const { order, payment } = response.data.data;
        setPaymentData(payment);
        
        // Jika ada snap_token (untuk Midtrans), buka payment gateway
        if (payment.snap_token) {
          // Load Midtrans Snap
          if (window.snap) {
            window.snap.pay(payment.snap_token, {
              onSuccess: function(result) {
                handlePaymentSuccess(result, order.id);
              },
              onPending: function(result) {
                handlePaymentPending(result, order.id);
              },
              onError: function(result) {
                handlePaymentError(result, order.id);
              },
              onClose: function() {
                // User closed the popup without finishing payment
                setPaymentStatus('pending');
              }
            });
          } else {
            // Fallback jika Midtrans Snap tidak tersedia
            setPaymentStatus('pending');
          }
        } else {
          // Untuk metode pembayaran manual (bank transfer, dll)
          setPaymentStatus('pending');
        }
      } else {
        throw new Error(response.data.message || 'Gagal membuat pesanan');
      }
    } catch (error) {
      console.error('Payment process error:', error);
      setError(error.response?.data?.message || error.message || 'Terjadi kesalahan saat memproses pembayaran');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (result, orderId) => {
    try {
      // Update payment status
      await axios.post(`/api/orders/${orderId}/payment-success`, {
        transaction_id: result.transaction_id,
        payment_type: result.payment_type
      });
      
      setPaymentStatus('success');
      
      // Clear checkout session
      checkoutSession.clear();
      
      // Redirect ke halaman success setelah 3 detik
      setTimeout(() => {
        router.visit(route('marketplace.order.show', { orderNumber: orderId }));
      }, 3000);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handlePaymentPending = (result, orderId) => {
    setPaymentStatus('pending');
    // Payment masih pending, user bisa melanjutkan pembayaran nanti
  };

  const handlePaymentError = (result, orderId) => {
    setPaymentStatus('failed');
    setError('Pembayaran gagal. Silakan coba lagi.');
  };

  // Handle kembali ke step sebelumnya
  const handleBack = () => {
    if (paymentStatus === 'processing' || paymentStatus === 'success') {
      return; // Tidak bisa kembali saat sedang processing atau sudah success
    }
    router.visit(route('checkout.payment-method'));
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    if (paymentData && paymentData.snap_token && window.snap) {
      setPaymentStatus('processing');
      window.snap.pay(paymentData.snap_token, {
        onSuccess: function(result) {
          handlePaymentSuccess(result, paymentData.order_id);
        },
        onPending: function(result) {
          handlePaymentPending(result, paymentData.order_id);
        },
        onError: function(result) {
          handlePaymentError(result, paymentData.order_id);
        },
        onClose: function() {
          setPaymentStatus('pending');
        }
      });
    }
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memproses pembayaran...</p>
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
            {paymentStatus !== 'processing' && paymentStatus !== 'success' && (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali ke Metode Pembayaran
              </button>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Pembayaran</h1>
            <p className="text-gray-600 mt-2">
              {paymentStatus === 'processing' && 'Sedang memproses pembayaran...'}
              {paymentStatus === 'pending' && 'Menunggu pembayaran'}
              {paymentStatus === 'success' && 'Pembayaran berhasil!'}
              {paymentStatus === 'failed' && 'Pembayaran gagal'}
            </p>
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
              <div className="flex-1 mx-4 h-1 bg-green-600 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Pembayaran</span>
              </div>
              <div className={`flex-1 mx-4 h-1 rounded ${
                paymentStatus === 'success' ? 'bg-green-600' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Status */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Success State */}
                {paymentStatus === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
                    <p className="text-gray-600 mb-6">Terima kasih atas pembelian Anda. Pesanan sedang diproses.</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        Invoice akan dikirim ke WhatsApp: <strong>{checkoutData.customer.whatsapp}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending State */}
                {paymentStatus === 'pending' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Menunggu Pembayaran</h2>
                    <p className="text-gray-600 mb-6">
                      Silakan lakukan pembayaran sesuai dengan metode yang dipilih.
                    </p>
                    
                    {countdown && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                          Waktu pembayaran tersisa: <strong className="text-lg">{countdown}</strong>
                        </p>
                      </div>
                    )}
                    
                    {paymentData && (
                      <div className="space-y-4">
                        {/* Payment Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                          <h3 className="font-medium text-blue-900 mb-2">Instruksi Pembayaran</h3>
                          <div className="text-sm text-blue-800 space-y-2">
                            {checkoutData.paymentMethod.type === 'bank_transfer' && (
                              <div>
                                <p>1. Transfer ke rekening berikut:</p>
                                <p className="font-mono bg-white p-2 rounded border">
                                  Bank BCA: 1234567890<br />
                                  A.n. Toko Online
                                </p>
                                <p>2. Nominal: <strong>Rp {(checkoutData.product.subtotal + (checkoutData.paymentMethod.fee || 0)).toLocaleString('id-ID')}</strong></p>
                                <p>3. Kirim bukti transfer ke WhatsApp: 08123456789</p>
                              </div>
                            )}
                            {checkoutData.paymentMethod.type === 'credit_card' && (
                              <div>
                                <button
                                  onClick={handleRetryPayment}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                  <CreditCard className="w-4 h-4 inline mr-2" />
                                  Bayar Sekarang
                                </button>
                              </div>
                            )}
                            {checkoutData.paymentMethod.type === 'ewallet' && (
                              <div>
                                <button
                                  onClick={handleRetryPayment}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                  Bayar dengan {checkoutData.paymentMethod.name}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing State */}
                {paymentStatus === 'processing' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Memproses Pembayaran</h2>
                    <p className="text-gray-600">Mohon tunggu, pembayaran sedang diproses...</p>
                  </div>
                )}

                {/* Failed State */}
                {paymentStatus === 'failed' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pembayaran Gagal</h2>
                    <p className="text-gray-600 mb-6">{error || 'Terjadi kesalahan saat memproses pembayaran.'}</p>
                    <div className="space-x-4">
                      <button
                        onClick={() => router.visit('/checkout/payment-method')}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Pilih Metode Lain
                      </button>
                      {paymentData && paymentData.snap_token && (
                        <button
                          onClick={handleRetryPayment}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Coba Lagi
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                  
                  {checkoutData.product.variant && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Varian</span>
                      <span className="font-medium">{checkoutData.product.variant.name}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah</span>
                    <span className="font-medium">{checkoutData.product.quantity}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {checkoutData.product.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {checkoutData.paymentMethod.fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya Admin</span>
                      <span className="font-medium">Rp {checkoutData.paymentMethod.fee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">
                      Rp {(checkoutData.product.subtotal + (checkoutData.paymentMethod.fee || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Data Pemesan</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{checkoutData.customer.name}</p>
                    <p>{checkoutData.customer.whatsapp}</p>
                    <p className="text-xs">{checkoutData.customer.address}, {checkoutData.customer.city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default PaymentProcessCheckout;