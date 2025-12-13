import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import axios from 'axios';
import Swal from 'sweetalert2';

const PaymentMethodCheckout = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [courierRates, setCourierRates] = useState([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  useEffect(() => {
    // Ambil data checkout dari session
    const data = checkoutSession.get();
    console.log('PaymentMethodCheckout - Raw session data:', data);
    
    if (!data || !data.product || !data.customer) {
      console.log('PaymentMethodCheckout - Missing required data:', {
        hasData: !!data,
        hasProduct: !!(data?.product),
        hasCustomer: !!(data?.customer)
      });
      // Jika tidak ada data yang diperlukan, redirect ke halaman utama
      router.visit(route('marketplace.home'));
      return;
    }
    
    console.log('PaymentMethodCheckout - Customer data received:', data.customer);
    setCheckoutData(data);
    setLoading(false);
  }, []);

  // Separate useEffect to fetch courier rates after checkoutData is set
  useEffect(() => {
    if (checkoutData && checkoutData.customer) {
      fetchCourierRates();
    }
  }, [checkoutData]);

  // Function to fetch courier rates from API
  const fetchCourierRates = async () => {
    if (!checkoutData || !checkoutData.customer) {
      console.log('No customer data available for shipping calculation');
      setShippingCost(0);
      return;
    }

    setLoadingShipping(true);
    try {
      // Prioritize district (kecamatan) from customer address data
      const customerAddress = checkoutData.customer.addresses?.[0] || checkoutData.customer;
      const district = customerAddress.district || checkoutData.customer.district;
      const city = customerAddress.city || checkoutData.customer.city;
      const province = customerAddress.province || checkoutData.customer.province;
      
      console.log('Shipping calculation data:', {
        district,
        city, 
        province,
        customerAddress
      });

      if (!district) {
        console.log('No district data available, cannot calculate shipping cost');
        Swal.fire({
          icon: 'warning',
          title: 'Data Alamat Tidak Lengkap',
          text: 'Data kecamatan diperlukan untuk menghitung ongkos kirim. Silakan lengkapi alamat pengiriman.',
          confirmButtonColor: '#3b82f6'
        });
        setShippingCost(0);
        return;
      }
      
      const response = await axios.get(`/api/courier-rates?page=1&per_page=10&district=${encodeURIComponent(district)}`);
      console.log('Courier rates API response:', response.data);
      
      if (response.data && response.data.success && response.data.data && response.data.data.rates) {
        const rates = response.data.data.rates;
        console.log(`Found ${rates.length} courier rates for district: ${district}`);
        setCourierRates(rates);
        // Calculate shipping cost after getting rates
        calculateShippingCost(rates, district);
      } else {
        console.log(`No courier rates found for district: ${district}`);
        
        // Show user-friendly message if no rates found
        Swal.fire({
          icon: 'info',
          title: 'Ongkos Kirim Tidak Tersedia',
          text: `Maaf, ongkos kirim untuk kecamatan ${district} belum tersedia. Silakan hubungi customer service untuk informasi lebih lanjut.`,
          confirmButtonColor: '#3b82f6'
        });
        
        setShippingCost(0);
        setCourierRates([]);
      }
    } catch (error) {
      console.error('Error fetching courier rates:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengambil Data Ongkir',
        text: 'Terjadi kesalahan saat mengambil data ongkos kirim. Silakan coba lagi.',
        confirmButtonColor: '#3b82f6'
      });
      
      setShippingCost(0);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Function to calculate total weight from products
  const calculateTotalWeight = () => {
    if (!checkoutData || !checkoutData.product) return 0;
    
    // Check if this is from MultiProductCheckout with pre-calculated weight
    if (checkoutData.product.totalWeight) {
      return checkoutData.product.totalWeight;
    }
    
    // Check if this is from MultiProductCheckout with multiProducts array
    if (checkoutData.product.multiProducts && Array.isArray(checkoutData.product.multiProducts)) {
      return checkoutData.product.multiProducts.reduce((totalWeight, product) => {
        const weight = product.weight || 0.5; // Default 0.5kg if no weight specified
        const quantity = product.quantity || 1;
        return totalWeight + (weight * quantity);
      }, 0);
    }
    
    let totalWeight = 0;
    
    if (checkoutData.product.selectedVariants && Object.keys(checkoutData.product.selectedVariants).length > 0) {
      // Multiple variants selected (single product with multiple variants)
      Object.values(checkoutData.product.selectedVariants).forEach(({ variant, quantity }) => {
        const weight = variant.weight || checkoutData.product.weight || 1; // Default 1kg if no weight
        totalWeight += weight * quantity;
      });
    } else {
      // Single product or variant
      const weight = checkoutData.product.variant?.weight || checkoutData.product.weight || 1;
      const quantity = checkoutData.product.quantity || 1;
      totalWeight += weight * quantity;
    }
    
    return totalWeight;
  };

  // Function to calculate shipping cost based on weight and courier rates
  const calculateShippingCost = (rates, district) => {
    if (!rates || rates.length === 0) {
      console.log('No rates available for shipping calculation');
      setShippingCost(0);
      return;
    }
    
    const totalWeight = calculateTotalWeight();
    // Round up weight (if 1.1kg, becomes 2kg)
    const roundedWeight = Math.ceil(totalWeight);
    
    console.log(`Calculating shipping for district "${district}": Weight=${totalWeight}kg, Rounded=${roundedWeight}kg`);
    
    // Use first available courier rate for the district
    const courierRate = rates[0];
    console.log('Using courier rate for district:', { district, courierRate });
    
    // Check for price_per_kg in the correct nested structure
    const pricePerKg = courierRate?.pricing?.price_per_kg || courierRate?.price_per_kg;
    
    if (courierRate && pricePerKg) {
      const calculatedCost = roundedWeight * pricePerKg;
      console.log(`Shipping calculation for ${district}: ${roundedWeight}kg × Rp${pricePerKg.toLocaleString('id-ID')} = Rp${calculatedCost.toLocaleString('id-ID')}`);
      setShippingCost(calculatedCost);
      
      // Show success message with shipping details
      console.log(`✅ Ongkos kirim berhasil dihitung untuk kecamatan ${district}: Rp${calculatedCost.toLocaleString('id-ID')}`);
    } else {
      console.log('No price_per_kg found in courier rate:', courierRate);
      
      Swal.fire({
        icon: 'warning',
        title: 'Data Tarif Tidak Lengkap',
        text: `Data tarif untuk kecamatan ${district} tidak lengkap. Silakan hubungi customer service.`,
        confirmButtonColor: '#3b82f6'
      });
      
      setShippingCost(0);
    }
  };

  // Calculate total including shipping and discount
  const calculateTotal = () => {
    if (!checkoutData || !checkoutData.product) return 0;
    const subtotal = checkoutData.product.subtotal + shippingCost;
    return subtotal - voucherDiscount;
  };

  // Function to validate and apply voucher
  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Kode Voucher Kosong',
        text: 'Silakan masukkan kode voucher',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setLoadingVoucher(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      const orderAmount = checkoutData.product.subtotal + shippingCost;
      
      const response = await axios.post('/api/vouchers/validate', {
        code: voucherCode,
        order_amount: orderAmount
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const { voucher, discount_amount } = response.data.data;
        setAppliedVoucher(voucher);
        setVoucherDiscount(discount_amount);
        
        Swal.fire({
          icon: 'success',
          title: 'Voucher Berhasil Diterapkan!',
          text: `Diskon Rp ${discount_amount.toLocaleString('id-ID')} telah diterapkan`,
          confirmButtonColor: '#3b82f6'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Voucher Tidak Valid',
          text: response.data.message || 'Voucher tidak dapat digunakan',
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memvalidasi Voucher',
        text: error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi voucher',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoadingVoucher(false);
    }
  };

  // Function to remove applied voucher
  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherCode('');
  };



  // Handle lanjut ke step berikutnya - Direct payment with xendit
  const handleContinue = async () => {
    setSubmitting(true);
    
    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        Swal.fire({
          icon: 'warning',
          title: 'Login Diperlukan',
          text: 'Anda perlu login terlebih dahulu',
          confirmButtonColor: '#3b82f6'
        });
        setSubmitting(false);
        return;
      }



      // Calculate total quantity and prepare items
      let items = [];
      
      // Debug: Log the checkout data structure
      console.log('Checkout data structure:', checkoutData);
      console.log('Product data:', checkoutData.product);
      
      // Check if this is from MultiProductCheckout
      if (checkoutData.product.multiProducts && Array.isArray(checkoutData.product.multiProducts)) {
        // Multi-product checkout from MultiProductCheckout
        items = checkoutData.product.multiProducts.map(product => ({
          product_variant_id: product.variant_id || product.product_id, // Use variant_id if available, otherwise product_id
          quantity: parseInt(product.quantity) || 1,
          price: product.price
        }));
      } else if (checkoutData.product.selectedVariants && Object.keys(checkoutData.product.selectedVariants).length > 0) {
        // Multiple variants selected (single product with multiple variants)
        items = Object.values(checkoutData.product.selectedVariants).map(({ variant, quantity }) => ({
          product_variant_id: variant.id,
          quantity: parseInt(quantity) || 1,
          price: variant.price
        }));
      } else if (checkoutData.product.variant) {
        // Single variant
        items = [{
          product_variant_id: checkoutData.product.variant.id,
          quantity: parseInt(checkoutData.product.quantity) || 1,
          price: checkoutData.product.variant.price
        }];
      } else {
        // No variant (base product)
        items = [{
          product_variant_id: checkoutData.product.id,
          quantity: parseInt(checkoutData.product.quantity) || 1,
          price: checkoutData.product.price
        }];
      }

      // Debug: Log the final items array
      console.log('Final items array:', items);
      
      // Prepare order data with correct customer_id field
      const orderData = {
        customer_id: checkoutData.customer.customer_id, // Use customer_id instead of id
        address_id: checkoutData.customer.address_id || 1,
        sales_channel_id: 1, // Default sales channel
        items: items,
        shipping_cost: shippingCost, // Use calculated shipping cost
        voucher_id: appliedVoucher ? appliedVoucher.id : null, // Add voucher if applied
        notes: 'Order dari marketplace - Payment via Xendit'
      };
      
      // Debug: Log the final order data
      console.log('Final order data being sent to API:', orderData);



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
        const paymentResponse = await axios.post(`/api/payment/create/${orderNumber}`, {
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
              Swal.fire({
                icon: 'error',
                title: 'Payment URL Tidak Ditemukan',
                text: 'Payment URL tidak ditemukan dalam response.',
                confirmButtonColor: '#3b82f6'
              });
              setSubmitting(false);
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Terjadi Kesalahan',
              text: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
              confirmButtonColor: '#3b82f6'
            });
            setSubmitting(false);
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Membuat Pembayaran',
            text: 'Gagal membuat pembayaran: ' + (paymentResponse.data.message || 'Unknown error'),
            confirmButtonColor: '#3b82f6'
          });
          setSubmitting(false);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membuat Order',
          text: 'Gagal membuat order: ' + (orderResponse.data.message || 'Unknown error'),
          confirmButtonColor: '#3b82f6'
        });
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
        
        Swal.fire({
          icon: 'error',
          title: 'Terjadi Kesalahan',
          text: `Terjadi kesalahan: ${errorMessage}`,
          confirmButtonColor: '#3b82f6'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Kesalahan Jaringan',
          text: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
          confirmButtonColor: '#3b82f6'
        });
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
                <h3 className="text-base font-semibold mb-3">Ringkasan Pesanan</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Produk</span>
                    <span className="text-sm font-medium text-right flex-1 ml-2 truncate">{checkoutData.product.name}</span>
                  </div>
                  {/* Tampilkan semua varian yang dipilih - Compact */}
                {checkoutData.product.selectedVariants && Object.keys(checkoutData.product.selectedVariants).length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 font-medium">Varian:</span>
                      {Object.values(checkoutData.product.selectedVariants).map(({ variant, quantity }) => (
                        <div key={variant.id} className="bg-gray-50 p-2 rounded">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{variant.variant_label}</div>
                              <div className="text-xs text-gray-500">
                                Rp {variant.price.toLocaleString('id-ID')} × {quantity}
                              </div>
                            </div>
                            <div className="text-xs font-medium ml-2">
                              Rp {(variant.price * quantity).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : checkoutData.product.variant ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Varian</span>
                      <span className="text-sm font-medium">{checkoutData.product.variant.variant_label}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Produk tanpa varian
                    </div>
                  )}

                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {checkoutData.product.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ongkos Kirim</span>
                    <span className="font-medium">
                      {loadingShipping ? (
                        <span className="text-xs text-gray-400">Menghitung...</span>
                      ) : (
                        `Rp ${shippingCost.toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>

                  {/* Voucher Section - Compact & Responsive */}
                  <div className="border-t pt-3 mt-3">
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Kode Voucher
                      </label>
                      {!appliedVoucher ? (
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            placeholder="Masukkan kode"
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loadingVoucher}
                          />
                          <button
                            onClick={applyVoucher}
                            disabled={loadingVoucher || !voucherCode.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {loadingVoucher ? 'Validasi...' : 'Gunakan'}
                          </button>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-green-800 truncate">
                                {appliedVoucher.code}
                              </div>
                              <div className="text-xs text-green-600">
                                -{appliedVoucher.name}
                              </div>
                              <div className="text-xs text-green-700 font-medium">
                                Diskon: Rp {voucherDiscount.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <button
                              onClick={removeVoucher}
                              className="text-red-600 hover:text-red-800 text-xs font-medium flex-shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show discount in summary */}
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Diskon Voucher</span>
                      <span className="font-medium">-Rp {voucherDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  {/* Show shipping details if available - Compact */}
                  {courierRates.length > 0 && !loadingShipping && (
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-1 mb-1">
                        <div>Berat: {Math.ceil(calculateTotalWeight())} kg</div>
                        <div>Kurir: {courierRates[0]?.courier?.name || 'Standard'}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Layanan: {courierRates[0]?.service?.name || 'Regular'}
                      </div>
                      {checkoutData?.customer && (
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <div className="text-xs text-gray-400 truncate">
                            Tujuan: {(checkoutData.customer.addresses?.[0] || checkoutData.customer).district}, {(checkoutData.customer.addresses?.[0] || checkoutData.customer).city}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Show message when no shipping data available - Compact */}
                  {courierRates.length === 0 && !loadingShipping && shippingCost === 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                      <div className="font-medium">⚠️ Ongkir belum tersedia</div>
                      <div className="text-xs">Perlu data kecamatan yang lengkap</div>
                    </div>
                  )}
                  
                  <hr className="my-3" />
                  
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Customer Info - Compact */}
                <div className="border-t pt-3 mb-4">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">Data Pemesan</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-medium">{checkoutData.customer.name}</p>
                    <p>{checkoutData.customer.whatsapp}</p>
                    <p className="text-xs text-gray-500 truncate">{checkoutData.customer.address}, {checkoutData.customer.city}</p>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    'Memproses...'
                  ) : (
                    <>
                      Lanjutkan ke Pembayaran
                      <ArrowRight className="w-4 h-4 ml-2" />
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