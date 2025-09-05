import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, User, MapPin, Phone, Mail, Search, UserPlus } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import api from '../../api/axios';

const CustomerDataCheckout = () => {
  // Toggle between new and existing customer
  const [customerType, setCustomerType] = useState('new'); // 'new' or 'existing'
  
  // New customer form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    line_id: '',
    other_contact: '',
    category: 'Pelanggan'
  });
  
  // Address data
  const [addressData, setAddressData] = useState({
    label: 'Rumah',
    recipient_name: '',
    recipient_phone: '',
    province: '',
    city: '',
    district: '',
    postal_code: '',
    address_detail: ''
  });
  
  // Existing customer search
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // City search for new customer
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchingCity, setSearchingCity] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Ambil data produk dari session
    const checkoutData = checkoutSession.get();
    if (!checkoutData || !checkoutData.product) {
      // Jika tidak ada data produk, redirect ke halaman utama
      router.visit(route('marketplace.index'));
      return;
    }
    
    setProductData(checkoutData.product);
    
    // Jika sudah ada data customer, isi form
    if (checkoutData.customer) {
      if (checkoutData.customer.customer_id) {
        // Existing customer
        setCustomerType('existing');
        setSelectedCustomer(checkoutData.customer);
      } else {
        // New customer
        setCustomerType('new');
        setFormData({
          full_name: checkoutData.customer.name || '',
          email: checkoutData.customer.email || '',
          phone: checkoutData.customer.whatsapp || '',
          line_id: '',
          other_contact: '',
          category: 'Pelanggan'
        });
        setAddressData({
          label: 'Rumah',
          recipient_name: checkoutData.customer.name || '',
          recipient_phone: checkoutData.customer.whatsapp || '',
          province: checkoutData.customer.province || '',
          city: checkoutData.customer.city || '',
          district: '',
          postal_code: checkoutData.customer.postal_code || '',
          address_detail: checkoutData.customer.address || ''
        });
      }
    }
  }, []);

  // Fetch customers for search
  const fetchCustomers = async (search = '') => {
    try {
      setSearchLoading(true);
      const response = await api.get('/customers', {
        params: {
          search: search,
          per_page: 10
        }
      });
      
      if (response.data.status === 'success') {
        setCustomers(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Handle customer search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && customerType === 'existing') {
        fetchCustomers(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, customerType]);
  
  // Handle customer selection
  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setCustomers([]);
    
    // Fetch customer addresses
    try {
      const response = await api.get(`/customers/${customer.id}/addresses`);
      if (response.data.status === 'success') {
        setCustomerAddresses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      setCustomerAddresses([]);
    }
  };
  
  // Handle input changes for new customer
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-fill recipient name and phone
    if (field === 'full_name') {
      setAddressData(prev => ({ ...prev, recipient_name: value }));
    }
    if (field === 'phone') {
      setAddressData(prev => ({ ...prev, recipient_phone: value }));
    }
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Handle address changes
  const handleAddressChange = (field, value) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // City search with debouncing
  const debouncedCitySearch = useCallback(async (query) => {
    if (query.length < 2) {
      setCityResults([]);
      setShowCityDropdown(false);
      return;
    }
    
    setSearchingCity(true);
    
    try {
      const response = await api.get('/wilayah/search-regencies', {
        params: { q: query }
      });
      
      if (response.data.status === 'success') {
        const enrichedResults = response.data.data.map(regency => ({
          name: regency.name,
          type: 'Kabupaten/Kota',
          regency_name: regency.name,
          province_name: regency.province_name,
          code: regency.code
        }));
        
        setCityResults(enrichedResults);
        setShowCityDropdown(true);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setCityResults([]);
    } finally {
      setSearchingCity(false);
    }
  }, []);
  
  // Handle city search
  const handleCitySearch = (e) => {
    const query = e.target.value;
    setCityQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      debouncedCitySearch(query);
    }, 300);
  };
  
  // Select city
  const selectCity = (city) => {
    setCityQuery(city.name);
    setAddressData(prev => ({
      ...prev,
      city: city.regency_name,
      province: city.province_name
    }));
    setShowCityDropdown(false);
    setCityResults([]);
  };

  // Validasi form
  const validateForm = () => {
    const newErrors = {};
    
    if (customerType === 'new') {
      // Validate new customer form
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Nama lengkap wajib diisi';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Nomor telepon wajib diisi';
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
      }
      
      // Validate address
      if (!addressData.city.trim()) {
        newErrors.city = 'Kota wajib diisi';
      }
      
      if (!addressData.province.trim()) {
        newErrors.province = 'Provinsi wajib diisi';
      }
      
      if (!addressData.postal_code.trim()) {
        newErrors.postal_code = 'Kode pos wajib diisi';
      }
      
      if (!addressData.address_detail.trim()) {
        newErrors.address_detail = 'Alamat lengkap wajib diisi';
      }
    } else {
      // Validate existing customer
      if (!selectedCustomer) {
        newErrors.customer = 'Pilih customer terlebih dahulu';
      }
      
      if (!selectedAddressId) {
        newErrors.address_id = 'Pilih alamat pengiriman';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle lanjut ke step berikutnya
  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    let customerData;
    
    if (customerType === 'new') {
      // Format data for new customer
      customerData = {
        name: formData.full_name,
        email: formData.email,
        whatsapp: formData.phone,
        address: addressData.address_detail,
        city: addressData.city,
        province: addressData.province,
        postal_code: addressData.postal_code,
        recipient_name: addressData.recipient_name,
        recipient_phone: addressData.recipient_phone
      };
    } else {
      // Format data for existing customer
      const selectedAddress = customerAddresses.find(addr => addr.id == selectedAddressId);
      customerData = {
        customer_id: selectedCustomer.id,
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        whatsapp: selectedCustomer.phone,
        address_id: selectedAddressId,
        address: selectedAddress?.address_detail || '',
        city: selectedAddress?.city || '',
        province: selectedAddress?.province || '',
        postal_code: selectedAddress?.postal_code || '',
        recipient_name: selectedAddress?.recipient_name || '',
        recipient_phone: selectedAddress?.recipient_phone || ''
      };
    }
    
    // Simpan data customer ke session
    const success = checkoutSession.updateStep('customer', customerData);
    
    if (success) {
      // Redirect ke halaman payment method
      router.visit(route('checkout.payment-method'));
    } else {
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
      setLoading(false);
    }
  };

  // Handle kembali ke step sebelumnya
  const handleBack = () => {
    if (productData) {
      router.visit(route('checkout.product'));
    }
  };

  if (!productData) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
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
              Kembali ke Konfirmasi Produk
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Data Diri & Pengiriman</h1>
            <p className="text-gray-600 mt-2">Isi data diri dan alamat pengiriman Anda</p>
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
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Data Diri</span>
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
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Informasi Pemesan</h2>
                
                {/* Customer Type Toggle */}
                <div className="mb-6">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setCustomerType('new')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        customerType === 'new'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      Pengguna Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('existing')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        customerType === 'existing'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      Cari Customer
                    </button>
                  </div>
                </div>

                {/* New Customer Form */}
                {customerType === 'new' && (
                  <div className="space-y-6">
                    {/* Data Diri */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-1" />
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.full_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Masukkan nama lengkap"
                        />
                        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Nomor HP/Telepon *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Contoh: 08123456789"
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email (Opsional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="email@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Alamat Pengiriman */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">
                        <MapPin className="w-5 h-5 inline mr-2" />
                        Alamat Pengiriman
                      </h3>
                      
                      <div className="space-y-4">
                        {/* City Search */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kota/Kabupaten *
                          </label>
                          <input
                            type="text"
                            value={cityQuery}
                            onChange={handleCitySearch}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Cari kota/kabupaten..."
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                          )}
                          
                          {/* City Dropdown */}
                          {showCityDropdown && cityResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {cityResults.map((city, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => selectCity(city)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                >
                                  <div className="font-medium">{city.name}</div>
                                  <div className="text-sm text-gray-500">{city.province_name}</div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {searchingCity && (
                            <div className="absolute right-3 top-9 text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>

                        {/* Province (Auto-filled) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provinsi *
                          </label>
                          <input
                            type="text"
                            value={addressData.province}
                            readOnly
                            className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${
                              errors.province ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Provinsi akan terisi otomatis"
                          />
                          {errors.province && (
                            <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                          )}
                        </div>

                        {/* Postal Code */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Pos *
                          </label>
                          <input
                            type="text"
                            value={addressData.postal_code}
                            onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.postal_code ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="12345"
                            maxLength={5}
                          />
                          {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>}
                        </div>

                        {/* Address Detail */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alamat Lengkap *
                          </label>
                          <textarea
                            value={addressData.address_detail}
                            onChange={(e) => handleAddressChange('address_detail', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.address_detail ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                          />
                          {errors.address_detail && <p className="text-red-500 text-sm mt-1">{errors.address_detail}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Customer Search */}
                {customerType === 'existing' && (
                  <div className="space-y-4">
                    {/* Customer Search */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cari Customer *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.customer ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Ketik nama atau nomor telepon customer..."
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        {searchLoading && (
                          <div className="absolute right-3 top-2.5 text-gray-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {errors.customer && (
                        <p className="text-red-500 text-sm mt-1">{errors.customer}</p>
                      )}
                      
                      {/* Customer Search Results */}
                      {customers.length > 0 && searchTerm && !selectedCustomer && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {customers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleCustomerSelect(customer)}
                              className="w-full px-3 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.phone}</div>
                              {customer.email && (
                                <div className="text-sm text-gray-500">{customer.email}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Customer Info */}
                    {selectedCustomer && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900">{selectedCustomer.name}</h4>
                            <p className="text-sm text-blue-700">{selectedCustomer.phone}</p>
                            {selectedCustomer.email && (
                              <p className="text-sm text-blue-700">{selectedCustomer.email}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setSearchTerm('');
                              setCustomerAddresses([]);
                              setSelectedAddressId('');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Ganti
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Address Selection */}
                    {selectedCustomer && customerAddresses.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pilih Alamat Pengiriman *
                        </label>
                        <div className="space-y-2">
                          {customerAddresses.map((address) => (
                            <label
                              key={address.id}
                              className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedAddressId == address.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name="address"
                                value={address.id}
                                checked={selectedAddressId == address.id}
                                onChange={(e) => setSelectedAddressId(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{address.label}</span>
                                    {address.is_default && (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {address.recipient_name} - {address.recipient_phone}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {address.address_detail}, {address.city}, {address.province} {address.postal_code}
                                  </p>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  selectedAddressId == address.id
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedAddressId == address.id && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                        {errors.address_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.address_id}</p>
                        )}
                      </div>
                    )}

                    {/* No addresses found */}
                    {selectedCustomer && customerAddresses.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p>Customer ini belum memiliki alamat tersimpan.</p>
                        <p className="text-sm">Silakan gunakan opsi "Pengguna Baru" untuk menambah alamat.</p>
                      </div>
                    )}
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
                    <span className="font-medium">{productData.name}</span>
                  </div>
                  
                  {productData.variant && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Varian</span>
                      <span className="font-medium">{productData.variant.name}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah</span>
                    <span className="font-medium">{productData.quantity}</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span className="text-blue-600">Rp {productData.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
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

export default CustomerDataCheckout;