import DashboardLayout from "../../Layouts/DashboardLayout";
import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import api from "../../api/axios";
import Swal from "sweetalert2";

export default function EditCustomer({ customerId }) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [searchingCity, setSearchingCity] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        line_id: "",
        other_contact: "",
        category: "Pelanggan"
    });
    
    // Address states
    const [addresses, setAddresses] = useState([{
        label: "Rumah",
        recipient_name: "",
        phone: "",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        address_detail: "",
        is_default: true
    }]);
    const [activeAddressIndex, setActiveAddressIndex] = useState(0);
    
    // City search states
    const [cityQuery, setCityQuery] = useState("");
    const [cityResults, setCityResults] = useState([]);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [cachedRegencies, setCachedRegencies] = useState([]);
    
    // Validation errors
    const [errors, setErrors] = useState({});
    
    // Load customer data
    useEffect(() => {
        const loadCustomer = async () => {
            try {
                const response = await api.get(`/customers/${customerId}`);
                if (response.data.status === 'success') {
                    const customerData = response.data.data;
                    
                    // Set form data
                    setFormData({
                        full_name: customerData.name || "",
                        email: customerData.email || "",
                        phone: customerData.phone || "",
                        line_id: customerData.line_id || "",
                        other_contact: customerData.other_contact || "",
                        category: customerData.category || "Pelanggan"
                    });
                    
                    // Set address data if exists
                    if (customerData.addresses && customerData.addresses.length > 0) {
                        const mappedAddresses = customerData.addresses.map(address => ({
                            id: address.id,
                            label: address.label || "Rumah",
                            recipient_name: address.recipient_name || customerData.name,
                            recipient_phone: address.phone || customerData.phone,
                            province: address.province || "",
                            city: address.city || "",
                            district: address.district || "",
                            postal_code: address.postal_code || "",
                            address_detail: address.address_detail || "",
                            is_default: address.is_default || false
                        }));
                        setAddresses(mappedAddresses);
                        
                        // Set active address to default or first address
                        const defaultIndex = mappedAddresses.findIndex(addr => addr.is_default);
                        setActiveAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
                        setCityQuery(mappedAddresses[defaultIndex >= 0 ? defaultIndex : 0]?.city || "");
                    }
                }
            } catch (error) {
                console.error('Error loading customer:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: 'Gagal memuat data customer',
                    confirmButtonColor: '#3B82F6'
                });
            } finally {
                setLoadingData(false);
            }
        };
        
        if (customerId) {
            loadCustomer();
        }
    }, [customerId]);
    
    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };
    
    // Handle address changes
    const handleAddressChange = (field, value) => {
        setAddresses(prev => {
            const newAddresses = [...prev];
            newAddresses[activeAddressIndex] = {
                ...newAddresses[activeAddressIndex],
                [field]: value
            };
            return newAddresses;
        });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const addAddress = () => {
        const newAddress = {
            label: `Alamat ${addresses.length + 1}`,
            recipient_name: formData.full_name || '',
            recipient_phone: formData.phone || '',
            address_detail: '',
            city: '',
            district: '',
            province: '',
            postal_code: '',
            is_default: addresses.length === 0 // Set as default if it's the first address
        };
        setAddresses(prev => [...prev, newAddress]);
        setActiveAddressIndex(addresses.length);
    };

    const removeAddress = (index) => {
        if (addresses.length <= 1) {
            alert('Minimal harus ada satu alamat');
            return;
        }
        
        const addressToRemove = addresses[index];
        const newAddresses = addresses.filter((_, i) => i !== index);
        
        // If removing default address, set first address as default
        if (addressToRemove.is_default && newAddresses.length > 0) {
            newAddresses[0].is_default = true;
        }
        
        setAddresses(newAddresses);
        
        // Adjust active address index
        if (activeAddressIndex >= newAddresses.length) {
            setActiveAddressIndex(newAddresses.length - 1);
        } else if (activeAddressIndex > index) {
            setActiveAddressIndex(activeAddressIndex - 1);
        }
    };

    const setDefaultAddress = (index) => {
        setAddresses(prev => 
            prev.map((addr, i) => ({
                ...addr,
                is_default: i === index
            }))
        );
    };
    
    // Load all regencies on component mount
     useEffect(() => {
         const loadAllRegencies = async () => {
             if (cachedRegencies.length > 0) return; // Already loaded
             
             try {
                 const response = await api.get('/wilayah/regencies');
                 
                 if (response.data.status === 'success') {
                     setCachedRegencies(response.data.data);
                 } else {
                     console.error('Error loading regencies:', response.data.message);
                 }
             } catch (error) {
                 console.error('Error loading regencies:', error);
             }
         };
         
         loadAllRegencies();
     }, [cachedRegencies.length]);
     
     // Debounced city search
    const searchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    
    const debouncedCitySearch = useCallback(async (query) => {
        if (query.length < 2) {
            setCityResults([]);
            setShowCityDropdown(false);
            return;
        }
        
        setSearchingCity(true);
        
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        try {
            const response = await api.get('/wilayah/search-regencies', {
                params: { q: query },
                signal: abortControllerRef.current.signal
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
            } else {
                console.error('Error searching cities:', response.data.message);
                setCityResults([]);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error searching cities:', error);
                setCityResults([]);
            }
        } finally {
            setSearchingCity(false);
        }
    }, []);
    
    // City search with debouncing
    const handleCitySearch = (e) => {
        const query = e.target.value;
        setCityQuery(query);
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Set new timeout for debouncing
        searchTimeoutRef.current = setTimeout(() => {
            debouncedCitySearch(query);
        }, 300); // 300ms delay
    };
    
    // Select city from dropdown
    const selectCity = (city) => {
        setCityQuery(`${city.name}, ${city.regency_name}`);
        setAddresses(prev => {
            const newAddresses = [...prev];
            newAddresses[activeAddressIndex] = {
                ...newAddresses[activeAddressIndex],
                city: city.name,
                district: city.name,
                province: city.province_name
            };
            return newAddresses;
        });
        setShowCityDropdown(false);
        setCityResults([]);
        
        // Clear city error
        if (errors.city) {
            setErrors(prev => ({ ...prev, city: null }));
        }
    };
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.city-search-container')) {
                setShowCityDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Form validation
    const validateForm = () => {
        const newErrors = {};
        
        // Required fields validation
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Nama lengkap wajib diisi';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Nomor telepon wajib diisi';
        } else if (!/^08[0-9]{8,11}$/.test(formData.phone)) {
            newErrors.phone = 'Format nomor telepon tidak valid (contoh: 081234567890)';
        }
        
        // Validate all addresses
        let hasAddressErrors = false;
        addresses.forEach((address, index) => {
            if (!address.city.trim()) {
                newErrors[`city_${index}`] = 'Kota/Kecamatan wajib diisi';
                if (index === activeAddressIndex) newErrors.city = 'Kota/Kecamatan wajib diisi';
                hasAddressErrors = true;
            }
            
            if (!address.postal_code.trim()) {
                newErrors[`postal_code_${index}`] = 'Kode pos wajib diisi';
                if (index === activeAddressIndex) newErrors.postal_code = 'Kode pos wajib diisi';
                hasAddressErrors = true;
            } else if (!/^[0-9]{5}$/.test(address.postal_code)) {
                newErrors[`postal_code_${index}`] = 'Kode pos harus 5 digit angka';
                if (index === activeAddressIndex) newErrors.postal_code = 'Kode pos harus 5 digit angka';
                hasAddressErrors = true;
            }
            
            if (!address.address_detail.trim()) {
                newErrors[`address_detail_${index}`] = 'Alamat lengkap wajib diisi';
                if (index === activeAddressIndex) newErrors.address_detail = 'Alamat lengkap wajib diisi';
                hasAddressErrors = true;
            }
        });
        
        // Ensure at least one address is set as default
        const hasDefaultAddress = addresses.some(addr => addr.is_default);
        if (!hasDefaultAddress && addresses.length > 0) {
            addresses[0].is_default = true;
        }
        
        // Email validation (optional but must be valid if provided)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            Swal.fire({
                icon: 'error',
                title: 'Validasi Gagal',
                text: 'Mohon periksa kembali data yang Anda masukkan',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }
        
        setLoading(true);
        
        try {
            const customerData = {
                name: formData.full_name,
                email: formData.email || null,
                phone: formData.phone,
                line_id: formData.line_id || null,
                other_contact: formData.other_contact || null,
                category: formData.category,
                addresses: addresses.map(addr => ({
                     id: addr.id || null,
                     label: addr.label,
                     recipient_name: addr.recipient_name || formData.full_name,
                     recipient_phone: addr.recipient_phone || formData.phone,
                     province: addr.province,
                     city: addr.city,
                     district: addr.district,
                     postal_code: addr.postal_code,
                     address_detail: addr.address_detail,
                     is_default: addr.is_default
                 }))
            };
            
            const response = await api.put(`/customers/${customerId}`, customerData);
            
            if (response.data.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Customer berhasil diperbarui',
                    confirmButtonColor: '#3B82F6'
                });
                
                // Redirect to customer list
                window.location.href = '/cms/customer/data';
            } else {
                throw new Error(response.data.message || 'Gagal memperbarui customer');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            
            let errorMessage = 'Terjadi kesalahan saat memperbarui customer';
            
            // Check errors array first for specific messages
             if (error.response?.data?.errors) {
                // Handle specific error format from API
                const apiErrors = error.response.data.errors;
                
                if (Array.isArray(apiErrors)) {
                    // Handle array format errors
                    const specificError = apiErrors.find(err => err.message);
                    if (specificError) {
                        errorMessage = specificError.message;
                    } else {
                        errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
                    }
                } else {
                    // Handle object format validation errors
                    setErrors(apiErrors);
                    errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
                 }
             } else if (error.response?.data?.message) {
                 errorMessage = error.response.data.message;
             }
            
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: errorMessage,
                confirmButtonColor: '#3B82F6'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3">
                            <Icon icon="mdi:loading" className="animate-spin text-2xl text-blue-600" />
                            <span className="text-lg">Memuat data customer...</span>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => window.history.back()}
                    >
                        <Icon icon="material-symbols:arrow-back" width={24} />
                    </button>

                    <h1 className="text-2xl font-semibold">Edit Customer</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-3/4 bg-white p-6 rounded-lg shadow-sm">
                        <form onSubmit={handleSubmit}>
                            {/* Customer Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Customer</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">
                                            Kategori Customer <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                                                errors.category ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                        >
                                            <option value="Pelanggan">Pelanggan</option>
                                            <option value="Reseller">Reseller</option>
                                            <option value="Dropshipper">Dropshipper</option>
                                        </select>
                                        {errors.category && (
                                            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text"
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                                                errors.full_name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={formData.full_name}
                                             onChange={(e) => {
                                                 handleInputChange('full_name', e.target.value);
                                                 setAddresses(prev => {
                                                     const newAddresses = [...prev];
                                                     newAddresses[activeAddressIndex] = {
                                                         ...newAddresses[activeAddressIndex],
                                                         recipient_name: e.target.value
                                                     };
                                                     return newAddresses;
                                                 });
                                             }}
                                            placeholder="Masukkan nama lengkap"
                                        />
                                        {errors.full_name && (
                                             <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                                         )}
                                    </div>

                                    <div className="relative">
                                        <label className="text-sm font-medium">
                                            No. HP / Telepon <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="tel"
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                                                errors.phone ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={formData.phone}
                                            onChange={(e) => {
                                                handleInputChange('phone', e.target.value);
                                                setAddresses(prev => {
                                                     const newAddresses = [...prev];
                                                     newAddresses[activeAddressIndex] = {
                                                         ...newAddresses[activeAddressIndex],
                                                         recipient_phone: e.target.value
                                                     };
                                                     return newAddresses;
                                                 });
                                            }}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Email
                                        </label>
                                        <input 
                                            type="email"
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="customer@email.com"
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Line ID
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                            value={formData.line_id}
                                            onChange={(e) => handleInputChange('line_id', e.target.value)}
                                            placeholder="Line ID"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">
                                            Other Contact
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                            value={formData.other_contact}
                                            onChange={(e) => handleInputChange('other_contact', e.target.value)}
                                            placeholder="Kontak lainnya"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Kelola Alamat</h3>
                                    <button
                                        type="button"
                                        onClick={addAddress}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tambah Alamat
                                    </button>
                                </div>

                                {/* Address Tabs */}
                                {addresses.length > 1 && (
                                    <div className="flex space-x-1 mb-4 border-b border-gray-200">
                                        {addresses.map((address, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setActiveAddressIndex(index)}
                                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                                                    activeAddressIndex === index
                                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {address.label}
                                                {address.is_default && (
                                                    <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Address Controls */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={addresses[activeAddressIndex]?.label || ''}
                                            onChange={(e) => handleAddressChange('label', e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                                            placeholder="Label alamat"
                                        />
                                        {!addresses[activeAddressIndex]?.is_default && (
                                            <button
                                                type="button"
                                                onClick={() => setDefaultAddress(activeAddressIndex)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors duration-200"
                                            >
                                                Jadikan Default
                                            </button>
                                        )}
                                    </div>
                                    {addresses.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAddress(activeAddressIndex)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors duration-200"
                                        >
                                            Hapus Alamat
                                        </button>
                                    )}
                                </div>

                                {/* Recipient Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Penerima
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={addresses[activeAddressIndex]?.recipient_name || ''}
                                            onChange={(e) => handleAddressChange('recipient_name', e.target.value)}
                                            placeholder="Nama penerima"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            No. HP Penerima
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={addresses[activeAddressIndex]?.recipient_phone || ''}
                                            onChange={(e) => handleAddressChange('recipient_phone', e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="relative city-search-container">
                                        <label className="text-sm font-medium">
                                            Kota/Kecamatan <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm pr-10 ${
                                                errors.city ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Cari Kota/Kecamatan..."
                                            value={cityQuery}
                                            onChange={handleCitySearch}
                                            onFocus={() => setShowCityDropdown(true)}
                                        />
                                        {searchingCity ? (
                                            <Icon
                                                icon="mdi:loading"
                                                className="absolute right-3 top-9 text-gray-400 animate-spin"
                                            />
                                        ) : (
                                            <Icon
                                                icon="mdi:magnify"
                                                className="absolute right-3 top-9 text-gray-400"
                                            />
                                        )}
                                        
                                        {/* City dropdown */}
                                        {showCityDropdown && cityResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {cityResults.map((city, index) => (
                                                    <div
                                                        key={index}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                        onClick={() => selectCity(city)}
                                                    >
                                                        <div className="font-medium">{city.name}</div>
                                                        <div className="text-gray-500 text-xs">
                                                            {city.type}, {city.regency_name}, {city.province_name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.city && (
                                            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium">
                                            Kode Pos <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text"
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                                                errors.postal_code ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={addresses[activeAddressIndex]?.postal_code || ''}
                                            onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                                            placeholder="Masukkan kode pos"
                                        />
                                        {errors.postal_code && (
                                            <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium">
                                            Alamat Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <textarea 
                                            className={`w-full mt-1 border rounded px-3 py-2 text-sm min-h-[80px] ${
                                                errors.address_detail ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            value={addresses[activeAddressIndex]?.address_detail || ''}
                                            onChange={(e) => handleAddressChange('address_detail', e.target.value)}
                                            placeholder="Masukkan alamat lengkap (nama jalan, nomor rumah, RT/RW, dll)"
                                        />
                                        {errors.address_detail && (
                                            <p className="text-red-500 text-xs mt-1">{errors.address_detail}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="mt-6 flex gap-3">
                            <button 
                                type="submit"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && (
                                    <Icon icon="mdi:loading" className="animate-spin" />
                                )}
                                {loading ? 'Menyimpan...' : 'Perbarui Customer'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                            >
                                Batal
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-1/4 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm text-sm">
                            <p className="font-bold mb-2">Kategori Customer:</p>
                            <p>
                                <strong>Pelanggan</strong>, customer toko yang
                                mendapatkan harga normal.
                            </p>
                            <p className="mt-2">
                                <strong>Reseller</strong>, customer yang mendapatkan
                                potongan harga.
                            </p>
                            <p className="mt-2">
                                <strong>Dropshipper</strong>, customer mendapatkan
                                harga normal, yang disertai alamat pengiriman pada
                                resi melekat pada customer dropship tersebut.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg text-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="mdi:information" className="text-blue-600" />
                                <p className="font-medium text-blue-800">Informasi</p>
                            </div>
                            <p className="text-blue-700">
                                Field yang bertanda <span className="text-red-500">*</span> wajib diisi.
                                Perubahan alamat akan memperbarui alamat default customer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}