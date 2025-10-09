import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, X, User, MapPin, Phone, Mail, UserPlus, Search, Trash2 } from 'lucide-react';
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
  const [addressesLoading, setAddressesLoading] = useState(false);
  
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

  // Location search for new customer (districts and regencies)
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const locationSearchTimeoutRef = useRef(null);

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

  // Helper function to get customer ID consistently
  const getCustomerId = (customer) => {
    return customer?.id || customer?.customer_id;
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
        
        // Fetch customer addresses only if customer_id exists and is valid
        if (checkoutData.customer.customer_id && checkoutData.customer.customer_id !== '') {
          fetchCustomerAddressesFromSession(checkoutData.customer.customer_id);
        }
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

  // Fetch customer addresses from session (when loading existing customer from session)
  const fetchCustomerAddressesFromSession = async (customerId) => {
    try {
      setAddressesLoading(true);
      const response = await api.get(`/customers/${customerId}/addresses`);
      
      if (response.data.status === 'success') {
        const addresses = response.data.data || [];
        setCustomerAddresses(addresses);
        
        // Check if there's a selected address in session
        const checkoutData = checkoutSession.get();
        if (checkoutData.customer && checkoutData.customer.address_id) {
          setSelectedAddressId(checkoutData.customer.address_id);
        } else if (addresses.length > 0) {
          // Auto-select first address if no specific address selected
          const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching customer addresses from session:', error);
      setCustomerAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Fetch customer addresses after customer selection (from search)
  const fetchCustomerAddressesAfterSelection = async (customerId) => {
    try {
      setAddressesLoading(true);
      const response = await api.get(`/customers/${customerId}/addresses`);
      if (response.data.status === 'success') {
        const addresses = response.data.data || [];
        setCustomerAddresses(addresses);
        
        // Auto-select default address or first address
        if (addresses.length > 0) {
          const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      setCustomerAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && customerType === 'existing') {
        fetchCustomers(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, customerType]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (locationSearchTimeoutRef.current) {
        clearTimeout(locationSearchTimeoutRef.current);
      }
    };
  }, []);

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
    await fetchCustomerAddressesAfterSelection(pendingCustomer.id);
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
      district: address.district || '',
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
    
    if (!newAddressData.district.trim()) {
      errors.district = 'Kecamatan wajib diisi';
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

  // Handle delete address
  const handleDeleteAddress = async (address) => {
    // Prevent deleting if it's the only address
    if (customerAddresses.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Dapat Menghapus',
        text: 'Customer harus memiliki minimal satu alamat',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Hapus Alamat',
      text: `Apakah Anda yakin ingin menghapus alamat "${address.label}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        // Use the new delete address endpoint
        const response = await api.delete(`/customers/${getCustomerId(selectedCustomer)}/addresses/${address.id}`);
        
        if (response.data.status === 'success') {
          // Update local state with the returned addresses
          setCustomerAddresses(response.data.data || []);
          
          // If deleted address was selected, clear selection or select first available
          if (selectedAddressId == address.id) {
            const remainingAddresses = response.data.data || [];
            if (remainingAddresses.length > 0) {
              const defaultAddress = remainingAddresses.find(addr => addr.is_default) || remainingAddresses[0];
              setSelectedAddressId(defaultAddress.id);
            } else {
              setSelectedAddressId('');
            }
          }

          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: response.data.message || 'Alamat berhasil dihapus',
            timer: 2000,
            showConfirmButton: false
          });
        }

      } catch (error) {
        console.error('Error deleting address:', error);
        
        let errorMessage = 'Terjadi kesalahan saat menghapus alamat';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: errorMessage,
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  // Handle save address
  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      return;
    }

    // Validate that we have a selected customer
    if (!selectedCustomer || !getCustomerId(selectedCustomer)) {
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
        
        await updateCustomerWithAddresses(getCustomerId(selectedCustomer), customerPayload);
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
        
        await updateCustomerWithAddresses(getCustomerId(selectedCustomer), customerPayload);
        successMessage = 'Alamat baru berhasil ditambahkan';
      }

      // Refresh customer addresses
      const response = await api.get(`/customers/${getCustomerId(selectedCustomer)}/addresses`);
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

    // Clear error and validate in real-time
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Real-time validation
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Format email tidak valid' }));
    }

    if (field === 'phone') {
      // Only allow numbers and basic phone format
      const phoneValue = value.replace(/[^\d+]/g, '');
      setFormData(prev => ({ ...prev, [field]: phoneValue }));
      setAddressData(prev => ({ ...prev, recipient_phone: phoneValue }));
      
      if (phoneValue.length > 0 && phoneValue.length < 10) {
        setErrors(prev => ({ ...prev, phone: 'Nomor telepon minimal 10 digit' }));
      }
      return;
    }
  };

  // Handle address changes
  const handleAddressChange = (field, value) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Real-time validation for postal code
    if (field === 'postal_code') {
      // Only allow numbers and limit to 5 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 5);
      setAddressData(prev => ({ ...prev, [field]: numericValue }));
      
      if (numericValue.length > 0 && numericValue.length < 5) {
        setErrors(prev => ({ ...prev, postal_code: 'Kode pos harus 5 digit' }));
      }
      return;
    }

    // Real-time validation for phone numbers
    if (field === 'recipient_phone') {
      // Only allow numbers and basic phone format
      const phoneValue = value.replace(/[^\d+]/g, '');
      setAddressData(prev => ({ ...prev, [field]: phoneValue }));
      
      if (phoneValue.length > 0 && phoneValue.length < 10) {
        setErrors(prev => ({ ...prev, recipient_phone: 'Nomor telepon minimal 10 digit' }));
      }
      return;
    }
  };

  // Location search with debouncing (districts and regencies)
  const debouncedLocationSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }

    setSearchingLocation(true);

    try {
      const response = await api.get('/wilayah/search-regencies', {
        params: { q: query }
      });

      if (response.data.status === 'success') {
        setLocationResults(response.data.data);
        setShowLocationDropdown(true);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationResults([]);
    } finally {
      setSearchingLocation(false);
    }
  }, []);

  // Handle location search
  const handleLocationSearch = (e) => {
    const query = e.target.value;
    setLocationQuery(query);

    if (locationSearchTimeoutRef.current) {
      clearTimeout(locationSearchTimeoutRef.current);
    }

    locationSearchTimeoutRef.current = setTimeout(() => {
      debouncedLocationSearch(query);
    }, 300);
  };

  // Select location (district or regency)
  const selectLocation = (location) => {
    setLocationQuery(location.name);
    
    // Auto-fill all address data based on selection
    setAddressData(prev => ({
      ...prev,
      district: location.district_name || '',
      city: location.regency_name,
      province: location.province_name
    }));
    
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  // Validasi form
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [];

    if (customerType === 'new') {
      // Validate new customer form
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Nama lengkap wajib diisi';
        requiredFields.push('Nama Lengkap');
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Nomor telepon wajib diisi';
        requiredFields.push('Nomor Telepon');
      } else if (formData.phone.length < 10) {
        newErrors.phone = 'Nomor telepon minimal 10 digit';
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
      }

      // Validate recipient info (auto-filled from customer data)
      if (!addressData.recipient_name.trim()) {
        newErrors.recipient_name = 'Nama penerima wajib diisi';
        requiredFields.push('Nama Penerima');
      }

      if (!addressData.recipient_phone.trim()) {
        newErrors.recipient_phone = 'Nomor telepon penerima wajib diisi';
        requiredFields.push('Nomor Telepon Penerima');
      } else if (addressData.recipient_phone.length < 10) {
        newErrors.recipient_phone = 'Nomor telepon penerima minimal 10 digit';
      }

      // Validate address
      if (!addressData.city.trim()) {
        newErrors.city = 'Kota wajib diisi';
        requiredFields.push('Kota/Kabupaten');
      }

      if (!addressData.district.trim()) {
        newErrors.district = 'Kecamatan wajib diisi';
        requiredFields.push('Kecamatan');
      }

      if (!addressData.province.trim()) {
        newErrors.province = 'Provinsi wajib diisi';
        requiredFields.push('Provinsi');
      }

      if (!addressData.postal_code.trim()) {
        newErrors.postal_code = 'Kode pos wajib diisi';
        requiredFields.push('Kode Pos');
      } else if (addressData.postal_code.length !== 5) {
        newErrors.postal_code = 'Kode pos harus 5 digit';
      }

      if (!addressData.address_detail.trim()) {
        newErrors.address_detail = 'Alamat lengkap wajib diisi';
        requiredFields.push('Alamat Lengkap');
      }
    } else {
      // Validate existing customer
      if (!selectedCustomer) {
        newErrors.customer = 'Pilih customer terlebih dahulu';
        requiredFields.push('Customer');
      }

      if (!selectedAddressId) {
        newErrors.address_id = 'Pilih alamat pengiriman';
        requiredFields.push('Alamat Pengiriman');
      }
    }

    setErrors(newErrors);

    // Show alert if there are required fields missing
    if (requiredFields.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Field Wajib Belum Diisi',
        html: `
          <div class="text-left">
            <p class="mb-3">Mohon lengkapi field berikut:</p>
            <ul class="list-disc list-inside space-y-1">
              ${requiredFields.map(field => `<li>${field}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'OK, Saya Mengerti'
      });
    }

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
          
          // Handle validation errors (422)
          if (response.status === 422 && errorData.errors) {
            const validationErrors = {};
            Object.keys(errorData.errors).forEach(key => {
              // Convert backend field names to frontend field names
              if (key.startsWith('addresses.0.')) {
                const fieldName = key.replace('addresses.0.', '');
                if (fieldName === 'recipient_name') validationErrors.recipient_name = errorData.errors[key][0];
                else if (fieldName === 'recipient_phone') validationErrors.recipient_phone = errorData.errors[key][0];
                else validationErrors[fieldName] = errorData.errors[key][0];
              } else {
                validationErrors[key] = errorData.errors[key][0];
              }
            });
            
            setErrors(validationErrors);
            
            Swal.fire({
              icon: 'error',
              title: 'Data Tidak Lengkap',
              text: 'Mohon lengkapi semua field yang diperlukan',
              confirmButtonColor: '#3b82f6'
            });
            return;
          }
          
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
          district: primaryAddress?.district || '',
          province: primaryAddress?.province || '',
          postal_code: primaryAddress?.postal_code || '',
          recipient_name: primaryAddress?.recipient_name || createdCustomer.name,
          recipient_phone: primaryAddress?.phone || createdCustomer.phone,
          addresses: createdCustomer.addresses
        };
      } else {
        // Format data for existing customer
        const selectedAddress = customerAddresses.find(addr => addr.id == selectedAddressId);
        customerData = {
          customer_id: getCustomerId(selectedCustomer),
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          whatsapp: selectedCustomer.phone,
          address_id: selectedAddressId,
          address: selectedAddress?.address_detail || '',
          city: selectedAddress?.city || '',
          district: selectedAddress?.district || '',
          province: selectedAddress?.province || '',
          postal_code: selectedAddress?.postal_code || '',
          recipient_name: selectedAddress?.recipient_name || '',
          recipient_phone: selectedAddress?.recipient_phone || '',
          addresses: customerAddresses
        };
      }

      // Debug: Log customer data yang akan disimpan
      console.log('Saving customer data to session:', customerData);

      // Simpan data customer ke session
      const success = checkoutSession.updateStep('customer', customerData);

      if (success) {
        // Debug: Verify data saved correctly
        const savedData = checkoutSession.get();
        console.log('Verified saved checkout data:', savedData);
        
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
                        {/* Location Search (Districts & Cities) */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari Kecamatan/Kota *
                          </label>
                          <input
                            type="text"
                            value={locationQuery}
                            onChange={handleLocationSearch}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city || errors.district ? 'border-red-500' : 'border-gray-300'
                              }`}
                            placeholder="Ketik nama kecamatan atau kota..."
                          />
                          {(errors.city || errors.district) && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.district || errors.city}
                            </p>
                          )}

                          {/* Location Dropdown */}
                          {showLocationDropdown && locationResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {locationResults.map((location, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => selectLocation(location)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      location.type === 'Kecamatan' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {location.type}
                                    </span>
                                    <span className="font-medium">{location.name}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {location.type === 'Kecamatan' 
                                      ? `${location.regency_name}, ${location.province_name}`
                                      : location.province_name
                                    }
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchingLocation && (
                            <div className="absolute right-3 top-9 text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>

                        {/* Display Selected Location Info */}
                        {(addressData.district || addressData.city) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Lokasi Terpilih:</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                              {addressData.district && (
                                <div><strong>Kecamatan:</strong> {addressData.district}</div>
                              )}
                              {addressData.city && (
                                <div><strong>Kota/Kabupaten:</strong> {addressData.city}</div>
                              )}
                              {addressData.province && (
                                <div><strong>Provinsi:</strong> {addressData.province}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recipient Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nama Penerima *
                            </label>
                            <input
                              type="text"
                              value={addressData.recipient_name}
                              onChange={(e) => handleAddressChange('recipient_name', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.recipient_name ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Nama penerima paket"
                            />
                            {errors.recipient_name && (
                              <p className="text-red-500 text-sm mt-1">{errors.recipient_name}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nomor Telepon Penerima *
                            </label>
                            <input
                              type="tel"
                              value={addressData.recipient_phone}
                              onChange={(e) => handleAddressChange('recipient_phone', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.recipient_phone ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="08xxxxxxxxxx"
                            />
                            {errors.recipient_phone && (
                              <p className="text-red-500 text-sm mt-1">{errors.recipient_phone}</p>
                            )}
                          </div>
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
                            placeholder="Jalan, nomor rumah, RT/RW, kelurahan"
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
                          {selectedCustomer && getCustomerId(selectedCustomer) && (
                            <button
                              type="button"
                              onClick={handleShowAddAddressForm}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Tambah Alamat Baru
                            </button>
                          )}
                        </div>
                        
                        {addressesLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Memuat alamat...</p>
                          </div>
                        ) : customerAddresses.length > 0 ? (
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
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleDeleteAddress(address);
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 ml-2 flex items-center gap-1"
                                        title="Hapus alamat"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Hapus
                                      </button>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {address.recipient_name} - {address.recipient_phone}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {address.address_detail}, {address.district}, {address.city}, {address.province} {address.postal_code}
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
                  placeholder="Jalan, nomor rumah, RT/RW, kelurahan"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    addressFormErrors.address_detail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {addressFormErrors.address_detail && (
                  <p className="text-red-500 text-sm mt-1">{addressFormErrors.address_detail}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    value={newAddressData.district}
                    onChange={(e) => handleAddressFormChange('district', e.target.value)}
                    placeholder="Nama kecamatan"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressFormErrors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {addressFormErrors.district && (
                    <p className="text-red-500 text-sm mt-1">{addressFormErrors.district}</p>
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