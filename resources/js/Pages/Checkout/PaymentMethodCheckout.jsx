import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import { formatCurrency } from '../../utils/helpers';
import axios from 'axios';
import Swal from 'sweetalert2';

const PaymentMethodCheckout = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [courierRates, setCourierRates] = useState([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [selectedRateIndex, setSelectedRateIndex] = useState(null);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Promotion states
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [notes, setNotes] = useState('');

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
      fetchActivePromotions();
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
      // Use selected address by address_id if available
      const addressId = checkoutData.customer.address_id;
      const addresses = checkoutData.customer.addresses || [];
      const selectedAddress = (addressId && Array.isArray(addresses))
        ? addresses.find(a => a.id === addressId)
        : null;
      const customerAddress = selectedAddress || checkoutData.customer;
      const district = customerAddress.district || checkoutData.customer.district;
      const city = customerAddress.city || checkoutData.customer.city;
      const province = customerAddress.province || checkoutData.customer.province;
      const districtCode = customerAddress.district_code || checkoutData.customer.district_code || null;
      const regencyCode = customerAddress.regency_code || checkoutData.customer.regency_code || null;
      const provinceCode = customerAddress.province_code || checkoutData.customer.province_code || null;

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

      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('per_page', '50');
      queryParams.append('sort_by', 'base_price');
      queryParams.append('sort_order', 'asc');
      if (districtCode) {
        queryParams.append('district_code', districtCode);
      } else if (district) {
        queryParams.append('district', district);
      }
      if (regencyCode) {
        queryParams.append('regency_code', regencyCode);
      } else if (city) {
        queryParams.append('city', city);
      }
      if (provinceCode) {
        queryParams.append('province_code', provinceCode);
      } else if (province) {
        queryParams.append('province', province);
      }
      queryParams.append('courier_name', 'TIKI');
      queryParams.append('origin_city', 'Jakarta');
      const response = await axios.get(`/api/courier-rates?${queryParams.toString()}`);
      console.log('Courier rates API response:', response.data);

      if (response.data && response.data.success && response.data.data && response.data.data.rates) {
        const rates = response.data.data.rates;
        console.log(`Found ${rates.length} courier rates for district: ${district}`);
        const allowed = ['ECO', 'REG', 'ONS'];
        const filtered = (rates || []).filter(r => {
          const code = r?.service?.type || r?.service_type;
          return allowed.includes((code || '').toString().toUpperCase());
        });
        setCourierRates(filtered);
        const defaultIndex = selectDefaultRateIndex(filtered);
        setSelectedRateIndex(defaultIndex);
        calculateShippingCost(filtered, district, defaultIndex);
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

  const getRoundedWeight = (totalWeight, rate) => {
    const courierName = rate?.courier?.name?.toLowerCase() || '';
    if (courierName.includes('tiki')) {
      if (totalWeight <= 1.5) return 1;
      return Math.ceil(totalWeight);
    }
    return Math.ceil(totalWeight);
  };

  // Function to calculate shipping cost based on weight and courier rates
  const calculateShippingCost = (rates, district, indexOverride = null) => {
    if (!rates || rates.length === 0) {
      console.log('No rates available for shipping calculation');
      setShippingCost(0);
      return;
    }

    const totalWeight = calculateTotalWeight();
    const idx = typeof indexOverride === 'number' ? indexOverride : (typeof selectedRateIndex === 'number' ? selectedRateIndex : 0);
    const courierRate = rates[idx];
    if (!courierRate) {
      setShippingCost(0);
      return;
    }
    const pricing = courierRate.pricing || {};
    const availability = courierRate.availability || {};
    const minW = typeof pricing.min_weight === 'number' && pricing.min_weight > 0 ? pricing.min_weight : 1;
    const maxW = typeof pricing.max_weight === 'number' && pricing.max_weight > 0 ? pricing.max_weight : null;
    const roundedWeight = getRoundedWeight(totalWeight, courierRate);
    console.log(`Calculating shipping for district "${district}": Weight=${totalWeight}kg, Rounded=${roundedWeight}kg`);
    const weightForCalc = Math.max(roundedWeight, minW);
    if (maxW && weightForCalc > maxW) {
      Swal.fire({
        icon: 'warning',
        title: 'Berat Melebihi Batas Layanan',
        text: `Total berat ${weightForCalc} kg melebihi batas maksimum layanan ini (${maxW} kg). Pilih layanan lain.`,
        confirmButtonColor: '#3b82f6'
      });
      setShippingCost(0);
      return;
    }
    if (availability.is_available === false) {
      Swal.fire({
        icon: 'info',
        title: 'Layanan Tidak Tersedia',
        text: 'Layanan kurir ini sedang tidak tersedia. Pilih layanan lain.',
        confirmButtonColor: '#3b82f6'
      });
      setShippingCost(0);
      return;
    }
    const pricePerKg = pricing.price_per_kg ?? courierRate.price_per_kg ?? 0;
    const basePrice = pricing.base_price ?? courierRate.base_price ?? 0;
    const pricingType = pricing.pricing_type || courierRate.pricing_type || 'per_kg';
    const extraWeight = Math.max(0, weightForCalc - minW);
    const calculatedCost = pricingType === 'flat' ? basePrice : basePrice + (extraWeight * pricePerKg);
    setShippingCost(calculatedCost);
  };

  const selectDefaultRateIndex = (rates) => {
    if (!rates || rates.length === 0) return null;
    const tw = calculateTotalWeight();
    let bestIdx = 0;
    let bestCost = Infinity;
    for (let i = 0; i < rates.length; i++) {
      const r = rates[i];
      const pricing = r.pricing || {};
      const availability = r.availability || {};
      const minW = typeof pricing.min_weight === 'number' && pricing.min_weight > 0 ? pricing.min_weight : 1;
      const maxW = typeof pricing.max_weight === 'number' && pricing.max_weight > 0 ? pricing.max_weight : null;
      const w = getRoundedWeight(tw, r);
      const effW = Math.max(w, minW);
      if (maxW && effW > maxW) continue;
      if (availability.is_available === false) continue;
      const ppk = pricing.price_per_kg ?? r.price_per_kg ?? 0;
      const bp = pricing.base_price ?? r.base_price ?? 0;
      const pricingType = pricing.pricing_type || r.pricing_type || 'per_kg';
      const cost = pricingType === 'flat' ? bp : bp + (Math.max(0, effW - minW) * ppk);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // Function to fetch active promotions
  const fetchActivePromotions = async () => {
    setLoadingPromotions(true);
    try {
      const response = await axios.get('/api/promotions-active');
      if (response.data.status === 'success') {
        setPromotions(response.data.data);
        console.log('Active promotions loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoadingPromotions(false);
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
        order_amount: orderAmount,
        shipping_cost: shippingCost
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

        const notifText = voucher.type === 'free_sample'
          ? `Anda mendapatkan bonus produk: ${voucher.free_product_name || 'Produk Gratis'}`
          : voucher.type === 'shipping'
            ? `Potongan ongkir ${formatCurrency(discount_amount)} telah diterapkan`
            : `Diskon ${formatCurrency(discount_amount)} telah diterapkan`;

        Swal.fire({
          icon: 'success',
          title: 'Voucher Berhasil Diterapkan!',
          text: notifText,
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




      // Calculate total quantity and prepare items
      let items = [];

      // Debug: Log the checkout data structure
      console.log('Checkout data structure:', checkoutData);
      console.log('Product data:', checkoutData.product);

      // Check if this is from MultiProductCheckout
      if (checkoutData.product.multiProducts && Array.isArray(checkoutData.product.multiProducts)) {
        items = checkoutData.product.multiProducts.map(product => ({
          product_variant_id: product.variant_id,
          quantity: parseInt(product.quantity) || 1,
          price: product.price
        })).filter(p => !!p.product_variant_id);
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
        setSubmitting(false);
        Swal.fire({
          icon: 'warning',
          title: 'Varian Produk Diperlukan',
          text: 'Silakan pilih varian produk sebelum melanjutkan ke pembayaran.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }

      const hasInvalid = items.some(i => !i.product_variant_id || Number.isNaN(Number(i.product_variant_id)));
      if (hasInvalid || items.length === 0) {
        setSubmitting(false);
        Swal.fire({
          icon: 'error',
          title: 'Produk Tidak Valid',
          text: 'Terjadi kesalahan pada data produk. Pastikan setiap produk memiliki varian yang benar.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }

      const addressId = checkoutData.customer.address_id;
      const addresses = checkoutData.customer.addresses || [];
      const selectedAddress = (addressId && Array.isArray(addresses))
        ? addresses.find(a => a.id === addressId)
        : null;

      const normalizePhone = (x) => (x || '').toString().replace(/[^0-9+]/g, '').trim();
      const guestEmail = checkoutData.customer.email || '';
      const guestPhone = normalizePhone(selectedAddress?.recipient_phone || checkoutData.customer.whatsapp || selectedAddress?.phone || checkoutData.customer.phone || '');
      const guestName = checkoutData.customer.name || selectedAddress?.recipient_name || '';

      if (!guestPhone || guestPhone.trim().length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Nomor HP Diperlukan',
          text: 'Mohon lengkapi nomor HP pemesan atau penerima sebelum melanjutkan.',
          confirmButtonColor: '#3b82f6'
        });
        setSubmitting(false);
        return;
      }

      const selectedRate = typeof selectedRateIndex === 'number' ? courierRates[selectedRateIndex] : null;
      const isDropship = !!(selectedAddress?.is_dropship);
      const webOrderData = {
        items: items.map(p => ({ product_variant_id: p.product_variant_id, quantity: p.quantity })),
        shipping_cost: shippingCost,
        voucher_id: appliedVoucher ? appliedVoucher.id : null,
        notes: (notes || '').trim() ? (notes || '').trim() : '-',
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_name: guestName,
        address_id: addressId || null,
        is_dropship: isDropship,
        courier_id: selectedRate?.courier?.id || null,
        courier_rate_id: selectedRate?.id || null,
        service_type: selectedRate?.service?.name || selectedRate?.service_type || null
      };

      if (!addressId) {
        webOrderData.address_name = (selectedAddress?.recipient_name ?? '').toString();
        webOrderData.address_phone = normalizePhone(selectedAddress?.recipient_phone || guestPhone);
        webOrderData.address_label = selectedAddress?.label || 'Alamat Web Order';
        webOrderData.address_street = selectedAddress?.address_detail || checkoutData.customer.address;
        webOrderData.address_city = selectedAddress?.city || checkoutData.customer.city;
        webOrderData.address_province = selectedAddress?.province || checkoutData.customer.province;
        webOrderData.address_district = selectedAddress?.district || checkoutData.customer.district || '';
        webOrderData.address_province_code = selectedAddress?.province_code || checkoutData.customer.province_code || null;
        webOrderData.address_regency_code = selectedAddress?.regency_code || checkoutData.customer.regency_code || null;
        webOrderData.address_district_code = selectedAddress?.district_code || checkoutData.customer.district_code || null;
        webOrderData.address_postal_code = selectedAddress?.postal_code || '';
      }

      if (!webOrderData.address_id && (!webOrderData.address_phone || webOrderData.address_phone.trim().length === 0)) {
        Swal.fire({
          icon: 'warning',
          title: 'Nomor HP Penerima Diperlukan',
          text: 'Mohon lengkapi nomor HP penerima pada alamat pengiriman.',
          confirmButtonColor: '#3b82f6'
        });
        setSubmitting(false);
        return;
      }

      console.log('Final order data being sent to API:', webOrderData);



      const orderResponse = await axios.post('/order/create', webOrderData);

      if (orderResponse.data.status === 'success' && orderResponse.data.data.order_number) {
        const orderNumber = orderResponse.data.data.order_number;

        // Create payment with xendit
        const paymentResponse = await axios.post(`/api/payment/create/${orderNumber}`, {
          payment_gateway: 'xendit'
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
                      {/* <h3 className="text-lg font-semibold text-gray-900">Xendit Payment Gateway</h3> */}
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
                    <strong>Catatan:</strong> Setelah mengklik "Lanjutkan ke Pembayaran", Anda akan diarahkan ke halaman pembayaran untuk memilih metode pembayaran yang diinginkan.
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

                  {/* Promotions Section */}
                  {promotions.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          🎉 Promosi Aktif
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {promotions.map((promo) => (
                            <div
                              key={promo.id}
                              className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg"
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-orange-600 text-sm">🏷️</span>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-orange-900 mb-1">
                                    {promo.title}
                                  </p>
                                  <p className="text-xs text-orange-800 leading-relaxed">
                                    {promo.description}
                                  </p>
                                  {(promo.start_date || promo.end_date) && (
                                    <div className="mt-2 text-xs text-orange-700">
                                      <span className="font-medium">Periode: </span>
                                      {promo.start_date && new Date(promo.start_date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                      {promo.start_date && promo.end_date && ' - '}
                                      {promo.end_date && new Date(promo.end_date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                              {appliedVoucher.type === 'shipping' && (
                                <div className="text-xs text-orange-600 font-medium mt-1">
                                  🚚 Potongan Ongkir
                                </div>
                              )}
                              {appliedVoucher.description && (
                                <div className="text-xs text-green-700 mt-1 leading-relaxed">
                                  {appliedVoucher.description}
                                </div>
                              )}
                              {appliedVoucher.type === 'free_sample' || appliedVoucher.type === 'shipping_free_sample' ? (
                                <div className="text-xs text-blue-700 font-medium mt-1">
                                  🎁 Bonus Produk: {appliedVoucher.free_product_name || 'Produk Gratis'}
                                </div>
                              ) : (
                                <div className="text-xs text-green-700 font-medium mt-1">
                                  Diskon: Rp {voucherDiscount.toLocaleString('id-ID')}
                                </div>
                              )}
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
                      <span>
                        {appliedVoucher?.type === 'shipping' ? 'Diskon Ongkir' : 'Diskon Voucher'}
                      </span>
                      <span className="font-medium">-Rp {voucherDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {/* Show shipping details if available - Compact */}
                  {courierRates.length > 0 && !loadingShipping && (
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        <div>Berat: {typeof selectedRateIndex === 'number' ? getRoundedWeight(calculateTotalWeight(), courierRates[selectedRateIndex]) : Math.ceil(calculateTotalWeight())} kg</div>
                        <div>Kurir: {typeof selectedRateIndex === 'number' ? (courierRates[selectedRateIndex]?.courier?.name || 'Standard') : 'Standard'}</div>
                      </div>
                      <div className="mb-2">
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                          value={typeof selectedRateIndex === 'number' ? selectedRateIndex : ''}
                          onChange={(e) => {
                            const idx = parseInt(e.target.value);
                            setSelectedRateIndex(idx);
                            const addressId = checkoutData.customer.address_id;
                            const addresses = checkoutData.customer.addresses || [];
                            const selectedAddress = (addressId && Array.isArray(addresses))
                              ? addresses.find(a => a.id === addressId)
                              : null;
                            const district = (selectedAddress || checkoutData.customer).district;
                            calculateShippingCost(courierRates, district, idx);
                          }}
                        >
                          <option value="" disabled>Pilih kurir & layanan</option>
                          {courierRates.map((r, i) => {
                            const w = getRoundedWeight(calculateTotalWeight(), r);
                            const pricing = r.pricing || {};
                            const availability = r.availability || {};
                            const minW = typeof pricing.min_weight === 'number' && pricing.min_weight > 0 ? pricing.min_weight : 1;
                            const maxW = typeof pricing.max_weight === 'number' && pricing.max_weight > 0 ? pricing.max_weight : null;
                            const effW = Math.max(w, minW);
                            const ppk = pricing.price_per_kg ?? r.price_per_kg ?? 0;
                            const bp = pricing.base_price ?? r.base_price ?? 0;
                            const pricingType = pricing.pricing_type || r.pricing_type || 'per_kg';
                            const cost = pricingType === 'flat' ? bp : bp + (Math.max(0, effW - minW) * ppk);
                            const eta = r?.delivery?.estimated_days ? `${r.delivery.estimated_days} hari` : '';
                            const disabled = (maxW && effW > maxW) || availability.is_available === false;
                            const label = `${r?.courier?.name || '-'} · ${r?.service?.name || '-'} · ${eta ? eta + ' · ' : ''}Rp ${cost.toLocaleString('id-ID')}${disabled ? ' (tidak tersedia)' : ''}`;
                            return (
                              <option key={r.id || i} value={i} disabled={disabled}>{label}</option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="text-xs text-gray-400">
                        Layanan: {typeof selectedRateIndex === 'number' ? (courierRates[selectedRateIndex]?.service?.name || 'Regular') : 'Regular'}
                        {typeof selectedRateIndex === 'number' && courierRates[selectedRateIndex]?.delivery?.estimated_days ? ` · ETA ${courierRates[selectedRateIndex].delivery.estimated_days} hari` : ''}
                      </div>
                      {checkoutData?.customer && (
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <div className="text-xs text-gray-400 truncate">
                            {(() => {
                              const addressId = checkoutData.customer.address_id;
                              const addresses = checkoutData.customer.addresses || [];
                              const selectedAddress = (addressId && Array.isArray(addresses))
                                ? addresses.find(a => a.id === addressId)
                                : null;
                              const dest = selectedAddress || checkoutData.customer;
                              return `Tujuan: ${dest.district}, ${dest.city}`;
                            })()}
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



                  <div className="border-t pt-3 mb-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-700">Catatan</h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Tulis catatan untuk pesanan (opsional)"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Biarkan kosong jika tidak ada</p>
                  </div>

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
                    <p>{checkoutData.customer.email}</p>
                    <p>{checkoutData.customer.whatsapp}</p>
                    {/* <p className="text-xs text-gray-500 truncate">{checkoutData.customer.address}, {checkoutData.customer.city}</p> */}
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
