import DashboardLayout from "../../Layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import api from "../../api/axios";
import Swal from "sweetalert2";

export default function AddCustomer() {
    const [loading, setLoading] = useState(false);
    const [searchingCity, setSearchingCity] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        line_id: "",
        other_contact: "",
        category: "Pelanggan"
    });
    
    // Address states
    const [addressData, setAddressData] = useState({
        label: "Rumah",
        recipient_name: "",
        phone: "",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        address_detail: "",
        is_default: true
    });
    
    // City search states
    const [cityQuery, setCityQuery] = useState("");
    const [cityResults, setCityResults] = useState([]);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [cachedRegencies, setCachedRegencies] = useState([]);
    
    // Validation errors
    const [errors, setErrors] = useState({});
    
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
        setAddressData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };
    
    // Load all regencies on component mount
     useEffect(() => {
         const loadAllRegencies = async () => {
             if (cachedRegencies.length > 0) return; // Already loaded
             
             try {
                 const provincesResponse = await fetch('https://wilayah.id/api/provinces.json');
                 const provinces = await provincesResponse.json();
                 
                 let allRegencies = [];
                 
                 // Get regencies from all provinces
                 for (const province of provinces.data) {
                     try {
                         const regenciesResponse = await fetch(`https://wilayah.id/api/regencies/${province.code}.json`);
                         const regenciesData = await regenciesResponse.json();
                         
                         if (regenciesData.data) {
                             const regenciesWithProvince = regenciesData.data.map(regency => ({
                                 ...regency,
                                 province_name: province.name,
                                 province_code: province.code
                             }));
                             allRegencies = [...allRegencies, ...regenciesWithProvince];
                         }
                     } catch (error) {
                         console.error(`Error fetching regencies for province ${province.code}:`, error);
                     }
                 }
                 
                 setCachedRegencies(allRegencies);
             } catch (error) {
                 console.error('Error loading regencies:', error);
             }
         };
         
         loadAllRegencies();
     }, [cachedRegencies.length]);
     
     // City search with cached data
     const handleCitySearch = async (e) => {
         const query = e.target.value;
         setCityQuery(query);
         
         if (query.length < 2) {
             setCityResults([]);
             setShowCityDropdown(false);
             return;
         }
         
         setSearchingCity(true);
         
         // Use cached data for faster search
         setTimeout(() => {
             try {
                 // Filter regencies based on query
                 const filtered = cachedRegencies
                     .filter(regency => 
                         regency.name.toLowerCase().includes(query.toLowerCase())
                     )
                     .slice(0, 10); // Limit to 10 results
                 
                 const enrichedResults = filtered.map(regency => ({
                     name: regency.name,
                     type: 'Kabupaten/Kota',
                     regency_name: regency.name,
                     province_name: regency.province_name,
                     code: regency.code
                 }));
                 
                 setCityResults(enrichedResults);
                 setShowCityDropdown(true);
             } catch (error) {
                 console.error('Error searching cities:', error);
                 setCityResults([]);
             } finally {
                 setSearchingCity(false);
             }
         }, 300); // Add small delay for better UX
     };
    
    // Select city from dropdown
    const selectCity = (city) => {
        setCityQuery(`${city.name}, ${city.regency_name}`);
        setAddressData(prev => ({
            ...prev,
            city: city.name,
            district: city.name,
            province: city.province_name
        }));
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
        if (!formData.name.trim()) {
            newErrors.name = 'Nama lengkap wajib diisi';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Nomor telepon wajib diisi';
        } else if (!/^08[0-9]{8,11}$/.test(formData.phone)) {
            newErrors.phone = 'Format nomor telepon tidak valid (contoh: 081234567890)';
        }
        
        if (!addressData.city.trim()) {
            newErrors.city = 'Kota/Kecamatan wajib diisi';
        }
        
        if (!addressData.postal_code.trim()) {
            newErrors.postal_code = 'Kode pos wajib diisi';
        } else if (!/^[0-9]{5}$/.test(addressData.postal_code)) {
            newErrors.postal_code = 'Kode pos harus 5 digit angka';
        }
        
        if (!addressData.address_detail.trim()) {
            newErrors.address_detail = 'Alamat lengkap wajib diisi';
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
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone,
                line_id: formData.line_id || null,
                other_contact: formData.other_contact || null,
                category: formData.category,
                address: {
                    label: addressData.label,
                    recipient_name: addressData.recipient_name || formData.name,
                    phone: addressData.phone || formData.phone,
                    province: addressData.province,
                    city: addressData.city,
                    district: addressData.district,
                    postal_code: addressData.postal_code,
                    address_detail: addressData.address_detail,
                    is_default: addressData.is_default
                }
            };
            
            const response = await api.post('/customers', customerData);
            
            if (response.data.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Customer berhasil ditambahkan',
                    confirmButtonColor: '#3B82F6'
                });
                
                // Redirect to customer list or reset form
                window.location.href = '/customer';
            } else {
                throw new Error(response.data.message || 'Gagal menambahkan customer');
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            
            let errorMessage = 'Terjadi kesalahan saat menambahkan customer';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                // Handle validation errors from backend
                const backendErrors = error.response.data.errors;
                setErrors(backendErrors);
                errorMessage = 'Mohon periksa kembali data yang Anda masukkan';
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

                    <h1 className="text-2xl font-semibold">Tambah Customer</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-3/4 bg-white p-6 rounded-lg shadow-sm">
                        <form onSubmit={handleSubmit}>
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
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.name}
                                        onChange={(e) => {
                                            handleInputChange('name', e.target.value);
                                            setAddressData(prev => ({ ...prev, recipient_name: e.target.value }));
                                        }}
                                        placeholder="Masukkan nama lengkap"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                                    )}
                                </div>

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
                                        value={addressData.postal_code}
                                        onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                                        placeholder="Masukkan kode pos"
                                    />
                                    {errors.postal_code && (
                                        <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>
                                    )}
                                </div>

                                <div className="relative">
                                    <label className="text-sm font-medium">
                                        No. HP / Telepon <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="tel"
                                        className={`w-full mt-1 border rounded px-3 py-2 text-sm pl-10 ${
                                            errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.phone}
                                        onChange={(e) => {
                                            handleInputChange('phone', e.target.value);
                                            setAddressData(prev => ({ ...prev, phone: e.target.value }));
                                        }}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                    <Icon
                                        icon="ph:phone-light"
                                        className="absolute left-3 top-9 text-gray-400"
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
                                        placeholder="email@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        ID Line
                                    </label>
                                    <input 
                                        type="text"
                                        className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                        value={formData.line_id}
                                        onChange={(e) => handleInputChange('line_id', e.target.value)}
                                        placeholder="ID Line"
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

                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">
                                        Alamat Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        className={`w-full mt-1 border rounded px-3 py-2 text-sm min-h-[80px] ${
                                            errors.address_detail ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={addressData.address_detail}
                                        onChange={(e) => handleAddressChange('address_detail', e.target.value)}
                                        placeholder="Masukkan alamat lengkap (nama jalan, nomor rumah, RT/RW, dll)"
                                    />
                                    {errors.address_detail && (
                                        <p className="text-red-500 text-xs mt-1">{errors.address_detail}</p>
                                    )}
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
                                {loading ? 'Menyimpan...' : 'Simpan Customer'}
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
                                Alamat akan otomatis tersimpan sebagai alamat default customer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
