import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import axios from 'axios';

const PaymentMethodCheckout = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
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
    
    // Jika sudah ada payment method yang dipilih, set sebagai default
    if (data.paymentMethod) {
      setSelectedMethod(data.paymentMethod);
    }
    
    // Fetch payment methods dari API
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/payment-banks');
      const banks = response.data.data.data || [];
      
      // Transform bank data to payment method format
      const transformedMethods = banks
        .filter(bank => bank.is_active)
        .map(bank => ({
          id: bank.id,
          name: bank.bank_name,
          type: 'bank_transfer',
          description: `Transfer ke rekening ${bank.account_name} - ${bank.account_number}`,
          icon: 'Building2',
          fee: 0,
          is_active: bank.is_active,
          account_name: bank.account_name,
          account_number: bank.account_number,
          bank_name: bank.bank_name
        }));
      
      setPaymentMethods(transformedMethods);
    } catch (error) {
      console.error('Error fetching payment banks:', error);
      // Fallback payment methods jika API gagal
      setPaymentMethods([
        {
          id: 'bank_transfer_fallback',
          name: 'Transfer Bank',
          type: 'bank_transfer',
          description: 'Transfer melalui ATM, Internet Banking, atau Mobile Banking',
          icon: 'Building2',
          fee: 0,
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pemilihan metode pembayaran
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  // Handle lanjut ke step berikutnya
  const handleContinue = () => {
    if (!selectedMethod) {
      alert('Silakan pilih metode pembayaran terlebih dahulu');
      return;
    }
    
    setSubmitting(true);
    
    // Simpan payment method ke session
    const success = checkoutSession.updateStep('paymentMethod', selectedMethod);
    
    if (success) {
      // Redirect ke halaman payment process
      router.visit(route('checkout.payment-process'));
    } else {
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  // Handle kembali ke step sebelumnya
  const handleBack = () => {
    router.visit(route('checkout.customer-data'));
  };

  // Get icon component
  const getIconComponent = (iconName) => {
    const icons = {
      CreditCard,
      Smartphone,
      Building2,
      Wallet
    };
    return icons[iconName] || CreditCard;
  };

  // Calculate total dengan fee
  const calculateTotal = () => {
    if (!checkoutData || !selectedMethod) return 0;
    return checkoutData.product.subtotal + (selectedMethod.fee || 0);
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
            <h1 className="text-3xl font-bold text-gray-900">Metode Pembayaran</h1>
            <p className="text-gray-600 mt-2">Pilih metode pembayaran yang Anda inginkan</p>
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
            {/* Payment Methods */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Pilih Metode Pembayaran</h2>
                
                <div className="space-y-4">
                  {paymentMethods.filter(method => method.is_active).map((method) => {
                    const IconComponent = getIconComponent(method.icon);
                    const isSelected = selectedMethod?.id === method.id;
                    
                    return (
                      <div
                        key={method.id}
                        onClick={() => handleMethodSelect(method)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-lg ${
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{method.name}</h3>
                              <p className="text-sm text-gray-600">{method.description}</p>
                              {method.account_name && method.account_number && (
                                <div className="text-sm text-blue-600 mt-1">
                                  <p>a.n. {method.account_name}</p>
                                  <p className="font-mono">{method.account_number}</p>
                                </div>
                              )}
                              {method.fee > 0 && (
                                <p className="text-sm text-orange-600 mt-1">
                                  Biaya admin: Rp {method.fee.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {paymentMethods.filter(method => method.is_active).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada metode pembayaran yang tersedia</p>
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
                  
                  {selectedMethod && selectedMethod.fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya Admin</span>
                      <span className="font-medium">Rp {selectedMethod.fee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
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
                  disabled={!selectedMethod || submitting}
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