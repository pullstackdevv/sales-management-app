import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, X, User, MapPin, Phone, Mail, UserPlus, Search } from 'lucide-react';
import MarketplaceLayout from '../../Layouts/MarketplaceLayout';
import checkoutSession from '../../utils/checkoutSession';
import axios from 'axios';
import Swal from 'sweetalert2';
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
  
  // Phone verification for existing customer
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState('');
  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [phoneVerificationError, setPhoneVerificationError] = useState('');

  // Address management for existing customer
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddressData, setNewAddressData] = useState({
    label: 'Rumah',
    recipient_name: '',
    recipient_phone: '',
    address_detail: '',
    city: '',
    district: '',
    province: '',
    postal_code: '',
    is_default: false
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);

  // City search for new customer
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchingCity, setSearchingCity] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [errors, setErrors] = useState({});

  // Mask phone number to show only the last 4 digits
  const maskPhone = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const maskedPrefixLength = Math.max(0, digits.length - 4);
    return `${'*'.repeat(maskedPrefixLength)}${last4}`;
  };

  useEffect(() => {
    // Ambil data produk dari session
    const checkoutData = checkoutSession.get();
    if (!checkoutData || !checkoutData.product) {
      // Jika tidak ada data produk, redirect ke halaman utama
      router.visit(route('marketplace.home'));
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

  // Handle customer selection - show phone verification first
  const handleCustomerSelect = (customer) => {
    setPendingCustomer(customer);
    setVerificationPhone('');
    setPhoneVerificationError('');
    setShowPhoneVerification(true);
    setCustomers([]);
  };

  // Handle phone verification
  const handlePhoneVerification = async () => {
    if (!verificationPhone.trim()) {
      setPhoneVerificationError('Nomor HP wajib diisi');
      return;
    }

    // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (phone) => {
      return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+62/, '0').replace(/^62/, '0');
    };

    const customerPhone = normalizePhone(pendingCustomer.phone || '');
    const inputPhone = normalizePhone(verificationPhone);

    if (customerPhone !== inputPhone) {
      setPhoneVerificationError('Nomor HP tidak sesuai dengan data customer');
      return;
    }

    // Phone verified, proceed with customer selection
    setSelectedCustomer(pendingCustomer);
    setSearchTerm(pendingCustomer.name);
    setShowPhoneVerification(false);

    // Fetch customer addresses
    try {
      const response = await api.get(`/customers/${pendingCustomer.id}/addresses`);
      if (response.data.status === 'success') {
        setCustomerAddresses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      setCustomerAddresses([]);
    }
  };

  // Cancel phone verification
  const handleCancelVerification = () => {
    setShowPhoneVerification(false);
    setPendingCustomer(null);
    setVerificationPhone('');
    setPhoneVerificationError('');
  };

  // Add new customer address
  const addCustomerAddress = async (customerId, addressData) => {
    try {
      const response = await api.post(`/customers/${customerId}/addresses`, addressData);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Gagal menambah alamat');
      }
    } catch (error) {
      console.error('Error adding customer address:', error);
      
      let errorMessage = 'Gagal menambah alamat';
      
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        
        if (Array.isArray(apiErrors)) {
          const specificError = apiErrors.find(err => err.message);
          if (specificError) {
            errorMessage = specificError.message;
          } else {
            errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
          }
        } else {
          errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // Update customer address
  const updateCustomerAddress = async (customerId, addressId, addressData) => {
    try {
      const response = await api.put(`/customers/${customerId}/addresses/${addressId}`, addressData);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Gagal mengupdate alamat');
      }
    } catch (error) {
      console.error('Error updating customer address:', error);
      
      let errorMessage = 'Gagal memperbarui alamat';
      
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        
        if (Array.isArray(apiErrors)) {
          const specificError = apiErrors.find(err => err.message);
          if (specificError) {
            errorMessage = specificError.message;
          } else {
            errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
          }
        } else {
          errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // Update customer with addresses array (for bulk update)
  const updateCustomerWithAddresses = async (customerId, customerData) => {
    try {
      const response = await api.put(`/customers/${customerId}`, customerData);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Gagal mengupdate customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      
      let errorMessage = 'Gagal memperbarui customer';
      
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        
        if (Array.isArray(apiErrors)) {
          const specificError = apiErrors.find(err => err.message);
          if (specificError) {
            errorMessage = specificError.message;
          } else {
            errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
          }
        } else {
          errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // Handle show add address form
  const handleShowAddAddressForm = () => {
    setEditingAddress(null);
    setNewAddressData({
      label: 'Rumah',
      recipient_name: selectedCustomer?.name || '',
      recipient_phone: selectedCustomer?.phone || '',
      address_detail: '',
      city: '',
      province: '',
      postal_code: '',
      is_default: false
    });
    setAddressFormErrors({});
    setShowAddressForm(true);
  };

  // Handle edit address
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddressData({
      label: address.label || 'Rumah',
      recipient_name: address.recipient_name || '',
      recipient_phone: address.recipient_phone || '',
      address_detail: address.address_detail || '',
      city: address.city || '',
      province: address.province || '',
      postal_code: address.postal_code || '',
      is_default: address.is_default || false
    });
    setAddressFormErrors({});
    setShowAddressForm(true);
  };

  // Handle address form input change
  const handleAddressFormChange = (field, value) => {
    setNewAddressData(prev => ({ ...prev, [field]: value }));
    if (addressFormErrors[field]) {
      setAddressFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate address form
  const validateAddressForm = () => {
    const errors = {};
    
    if (!newAddressData.recipient_name.trim()) {
      errors.recipient_name = 'Nama penerima wajib diisi';
    }
    
    if (!newAddressData.recipient_phone.trim()) {
      errors.recipient_phone = 'Nomor HP penerima wajib diisi';
    }
    
    if (!newAddressData.address_detail.trim()) {
      errors.address_detail = 'Alamat lengkap wajib diisi';
    }
    
    if (!newAddressData.city.trim()) {
      errors.city = 'Kota wajib diisi';
    }
    
    if (!newAddressData.province.trim()) {
      errors.province = 'Provinsi wajib diisi';
    }
    
    if (!newAddressData.postal_code.trim()) {
      errors.postal_code = 'Kode pos wajib diisi';
    }
    
    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save address
  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      return;
    }

    // Validate that we have a selected customer
    console.log('selectedCustomer:', selectedCustomer);
    if (!selectedCustomer || !selectedCustomer.id) {
      console.error('No selected customer or customer ID missing');
      Swal.fire({
        icon: 'warning',
        title: 'Customer Belum Dipilih',
        text: 'Silakan pilih customer terlebih dahulu',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setSavingAddress(true);

    try {
      const addressPayload = {
        label: newAddressData.label || 'Rumah',
        recipient_name: newAddressData.recipient_name || selectedCustomer?.name || 'Penerima',
        recipient_phone: newAddressData.recipient_phone || selectedCustomer?.phone || '08123456789',
        address_detail: newAddressData.address_detail || 'Alamat tidak diketahui',
        city: newAddressData.city || 'Kota tidak diketahui',
        district: newAddressData.district || 'Kecamatan tidak diketahui',
        province: newAddressData.province || 'Provinsi tidak diketahui',
        postal_code: newAddressData.postal_code || '00000',
        is_default: newAddressData.is_default,
        is_primary: newAddressData.is_default || false
      };

      let successMessage = '';
      if (editingAddress) {
        // Update existing address using customer endpoint with addresses array
        const updatedAddresses = customerAddresses.map(addr => {
          if (addr.id === editingAddress.id) {
            return { ...addr, ...addressPayload };
          }
          // Ensure consistent field naming for existing addresses
          const normalizedAddr = { ...addr };
          if (normalizedAddr.phone && !normalizedAddr.recipient_phone) {
            normalizedAddr.recipient_phone = normalizedAddr.phone;
            delete normalizedAddr.phone;
          }
          return normalizedAddr;
        });
        
        const customerPayload = {
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          category: selectedCustomer.category || 'Pelanggan',
          line_id: selectedCustomer.line_id,
          other_contact: selectedCustomer.other_contact,
          addresses: updatedAddresses
        };
        
        await updateCustomerWithAddresses(selectedCustomer.id, customerPayload);
        successMessage = 'Alamat berhasil diperbarui';
      } else {
        // Add new address using customer endpoint with addresses array
        // Normalize existing addresses to use consistent field naming
        const normalizedExistingAddresses = customerAddresses.map(addr => {
          const normalizedAddr = { ...addr };
          if (normalizedAddr.phone && !normalizedAddr.recipient_phone) {
            normalizedAddr.recipient_phone = normalizedAddr.phone;
            delete normalizedAddr.phone;
          }
          return normalizedAddr;
        });
        
        const newAddresses = [...normalizedExistingAddresses, { ...addressPayload, id: null }];
        
        const customerPayload = {
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          category: selectedCustomer.category || 'Pelanggan',
          line_id: selectedCustomer.line_id,
          other_contact: selectedCustomer.other_contact,
          addresses: newAddresses
        };
        
        await updateCustomerWithAddresses(selectedCustomer.id, customerPayload);
        successMessage = 'Alamat baru berhasil ditambahkan';
      }

      // Refresh customer addresses
      const response = await api.get(`/customers/${selectedCustomer.id}/addresses`);
      if (response.data.status === 'success') {
        setCustomerAddresses(response.data.data || []);
        
        // If this is a new address and no address is selected, select this one
        if (!editingAddress && !selectedAddressId && response.data.data.length > 0) {
          const newAddress = response.data.data[response.data.data.length - 1];
          setSelectedAddressId(newAddress.id);
        }
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      
      // Reset form data
      setNewAddressData({
        label: '',
        recipient_name: '',
        address_detail: '',
        city: '',
        province: '',
        postal_code: '',
        recipient_phone: '',
        is_default: false
      });
      setAddressFormErrors({});
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: successMessage,
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error saving address:', error);
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan alamat';
      
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        
        if (Array.isArray(apiErrors)) {
          const specificError = apiErrors.find(err => err.message);
          if (specificError) {
            errorMessage = specificError.message;
          } else {
            errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
          }
        } else {
          setAddressFormErrors(apiErrors);
          errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: errorMessage,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle cancel address form
  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setNewAddressData({
      label: 'Rumah',
      recipient_name: '',
      recipient_phone: '',
      address_detail: '',
      city: '',
      province: '',
      postal_code: '',
      is_default: false
    });
    setAddressFormErrors({});
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
  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let customerData;

      if (customerType === 'new') {
        // Create new customer via API
        const newCustomerData = {
          name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          line_id: formData.line_id || null,
          other_contact: formData.other_contact || null,
          category: formData.category || 'Pelanggan',
          addresses: [{
            label: addressData.label || 'Rumah',
            address_detail: addressData.address_detail || 'Alamat tidak diketahui',
            city: addressData.city || 'Kota tidak diketahui',
            district: addressData.district || 'Kecamatan tidak diketahui',
            province: addressData.province || 'Provinsi tidak diketahui',
            postal_code: addressData.postal_code || '00000',
            recipient_name: addressData.recipient_name || formData.full_name,
            recipient_phone: addressData.recipient_phone || formData.phone,
            is_default: true
          }]
        };

        const csrfToken = document.querySelector('meta[name="csrf-token"]');

        // Get auth token from localStorage or session
        const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken.getAttribute('content') }),
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          },
          body: JSON.stringify(newCustomerData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(`Gagal membuat customer baru: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        
        if (!result.data) {
          throw new Error('Response data is missing');
        }
        
        const createdCustomer = result.data;
        
        if (!createdCustomer.addresses || createdCustomer.addresses.length === 0) {
          throw new Error('No addresses found in created customer');
        }
        
        const primaryAddress = createdCustomer.addresses.find(addr => addr.is_default) || createdCustomer.addresses[0];

        // Format data from database response
        customerData = {
          customer_id: createdCustomer.id,
          name: createdCustomer.name,
          email: createdCustomer.email,
          whatsapp: createdCustomer.phone,
          address_id: primaryAddress?.id || null,
          address: primaryAddress?.address_detail || '',
          city: primaryAddress?.city || '',
          province: primaryAddress?.province || '',
          postal_code: primaryAddress?.postal_code || '',
          recipient_name: primaryAddress?.recipient_name || createdCustomer.name,
          recipient_phone: primaryAddress?.phone || createdCustomer.phone
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
        throw new Error('Gagal menyimpan data ke session');
      }
    } catch (error) {
      console.error('Error in handleContinue:', error);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: error.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
        confirmButtonColor: '#3b82f6'
      });
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
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${customerType === 'new'
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
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${customerType === 'existing'
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.full_name ? 'border-red-500' : 'border-gray-300'
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'
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
                            className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${errors.province ? 'border-red-500' : 'border-gray-300'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.postal_code ? 'border-red-500' : 'border-gray-300'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.address_detail ? 'border-red-500' : 'border-gray-300'
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
                          className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customer ? 'border-red-500' : 'border-gray-300'
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
                              <div className="text-sm text-gray-500">{maskPhone(customer.phone)}</div>
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
                            <p className="text-sm text-blue-700">{maskPhone(selectedCustomer.phone)}</p>
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
                    {selectedCustomer && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Pilih Alamat Pengiriman *
                          </label>
                          {selectedCustomer && selectedCustomer.id && (
                            <button
                              type="button"
                              onClick={handleShowAddAddressForm}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Tambah Alamat Baru
                            </button>
                          )}
                        </div>
                        
                        {customerAddresses.length > 0 ? (
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
                                      <button
                                        type="button"
                                        onClick={() => handleEditAddress(address)}
                                        className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                                      >
                                        Edit
                                      </button>
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
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada alamat tersimpan</p>
                            <p className="text-sm">Klik "Tambah Alamat Baru" untuk menambahkan alamat</p>
                          </div>
                        )}
                        
                        {errors.address_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.address_id}</p>
                        )}
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

                  {/* Tampilkan semua varian yang dipilih */}
                  {productData.selectedVariants && Object.keys(productData.selectedVariants).length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-gray-600 text-sm font-medium">Varian yang dipilih:</span>
                      {Object.values(productData.selectedVariants).map(({ variant, quantity }) => (
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
                  ) : productData.variant ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Varian</span>
                      <span className="font-medium">{productData.variant.variant_label}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Produk tanpa varian
                    </div>
                  )}



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

      {/* Phone Verification Modal */}
      {showPhoneVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Verifikasi Nomor HP</h3>
            <p className="text-gray-600 mb-4">
              Untuk keamanan, silakan masukkan nomor HP yang terdaftar untuk customer <strong>{pendingCustomer?.name}</strong>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor HP *
              </label>
              <input
                 type="tel"
                 value={verificationPhone}
                 onChange={(e) => {
                   setVerificationPhone(e.target.value);
                   setPhoneVerificationError('');
                 }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handlePhoneVerification();
                   } else if (e.key === 'Escape') {
                     handleCancelVerification();
                   }
                 }}
                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                   phoneVerificationError ? 'border-red-500' : 'border-gray-300'
                 }`}
                 placeholder="Contoh: 08123456789"
                 autoFocus
               />
              {phoneVerificationError && (
                <p className="text-red-500 text-sm mt-1">{phoneVerificationError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelVerification}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePhoneVerification}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label Alamat *
                  </label>
                  <input
                    type="text"
                    value={newAddressData.label}
                    onChange={(e) => handleAddressFormChange('label', e.target.value)}
                    placeholder="Rumah, Kantor, dll"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressFormErrors.label ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {addressFormErrors.label && (
                    <p className="text-red-500 text-sm mt-1">{addressFormErrors.label}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Penerima *
                  </label>
                  <input
                    type="text"
                    value={newAddressData.recipient_name}
                    onChange={(e) => handleAddressFormChange('recipient_name', e.target.value)}
                    placeholder="Nama lengkap penerima"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressFormErrors.recipient_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {addressFormErrors.recipient_name && (
                    <p className="text-red-500 text-sm mt-1">{addressFormErrors.recipient_name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap *
                </label>
                <textarea
                  value={newAddressData.address_detail}
                  onChange={(e) => handleAddressFormChange('address_detail', e.target.value)}
                  placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    addressFormErrors.address_detail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {addressFormErrors.address_detail && (
                  <p className="text-red-500 text-sm mt-1">{addressFormErrors.address_detail}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota *
                  </label>
                  <input
                    type="text"
                    value={newAddressData.city}
                    onChange={(e) => handleAddressFormChange('city', e.target.value)}
                    placeholder="Nama kota"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressFormErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {addressFormErrors.city && (
                    <p className="text-red-500 text-sm mt-1">{addressFormErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    value={newAddressData.province}
                    onChange={(e) => handleAddressFormChange('province', e.target.value)}
                    placeholder="Nama provinsi"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressFormErrors.province ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {addressFormErrors.province && (
                    <p className="text-red-500 text-sm mt-1">{addressFormErrors.province}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Pos *
                  </label>
                  <input
                    type="text"
                    value={newAddressData.postal_code}
                    onChange={(e) => handleAddressFormChange('postal_code', e.target.value)}
                    placeholder="12345"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressFormErrors.postal_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {addressFormErrors.postal_code && (
                    <p className="text-red-500 text-sm mt-1">{addressFormErrors.postal_code}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP *
                </label>
                <input
                  type="tel"
                  value={newAddressData.recipient_phone}
                  onChange={(e) => handleAddressFormChange('recipient_phone', e.target.value)}
                  placeholder="081234567890"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    addressFormErrors.recipient_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {addressFormErrors.recipient_phone && (
                  <p className="text-red-500 text-sm mt-1">{addressFormErrors.recipient_phone}</p>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAddressData.is_default}
                  onChange={(e) => handleAddressFormChange('is_default', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Jadikan sebagai alamat utama
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCancelAddressForm}
                disabled={savingAddress}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingAddress ? 'Menyimpan...' : (editingAddress ? 'Update' : 'Simpan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MarketplaceLayout>
  );
};

export default CustomerDataCheckout;