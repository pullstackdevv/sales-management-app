import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import api from "../api/axios";
import Swal from "sweetalert2";

export default function AddressManager({ customerId, addresses, onAddressesChange, isEditing = false }) {
    const [localAddresses, setLocalAddresses] = useState(addresses || []);
    const [activeAddressIndex, setActiveAddressIndex] = useState(0);
    const [cities, setCities] = useState([]);
    const [cityQuery, setCityQuery] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [errors, setErrors] = useState({});
    const cityDropdownRef = useRef(null);
    const cityInputRef = useRef(null);

    // Load all regions on component mount
    useEffect(() => {
        const loadRegions = async () => {
            try {
                const response = await api.get('/regions');
                setCities(response.data);
            } catch (error) {
                console.error('Error loading regions:', error);
            }
        };
        loadRegions();
    }, []);

    // Update local addresses when prop changes
    useEffect(() => {
        setLocalAddresses(addresses || []);
        if (addresses && addresses.length > 0) {
            const defaultIndex = addresses.findIndex(addr => addr.is_default);
            setActiveAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
            
            const activeAddress = addresses[defaultIndex >= 0 ? defaultIndex : 0];
            if (activeAddress && activeAddress.city) {
                setCityQuery(activeAddress.city);
            }
        }
    }, [addresses]);

    // Debounced city search
    const debouncedCitySearch = useCallback(
        debounce((query) => {
            if (query.length >= 2) {
                setIsLoadingCities(true);
                const filteredCities = cities.filter(city => 
                    city.city_name.toLowerCase().includes(query.toLowerCase()) ||
                    city.district_name.toLowerCase().includes(query.toLowerCase())
                );
                setCities(filteredCities);
                setIsLoadingCities(false);
                setShowCityDropdown(true);
            } else {
                setShowCityDropdown(false);
            }
        }, 300),
        [cities]
    );

    useEffect(() => {
        debouncedCitySearch(cityQuery);
    }, [cityQuery, debouncedCitySearch]);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAddressChange = (field, value) => {
        const newAddresses = [...localAddresses];
        newAddresses[activeAddressIndex] = {
            ...newAddresses[activeAddressIndex],
            [field]: value
        };
        setLocalAddresses(newAddresses);
        onAddressesChange(newAddresses);
        
        // Clear specific field error
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const addAddress = () => {
        const newAddress = {
            id: null,
            label: `Alamat ${localAddresses.length + 1}`,
            recipient_name: '',
            recipient_phone: '',
            city: '',
            district: '',
            province: '',
            postal_code: '',
            address_detail: '',
            is_default: localAddresses.length === 0
        };
        
        const newAddresses = [...localAddresses, newAddress];
        setLocalAddresses(newAddresses);
        setActiveAddressIndex(newAddresses.length - 1);
        setCityQuery('');
        onAddressesChange(newAddresses);
    };

    const removeAddress = (index) => {
        if (localAddresses.length <= 1) {
            Swal.fire({
                title: 'Peringatan',
                text: 'Minimal harus ada satu alamat',
                icon: 'warning'
            });
            return;
        }

        Swal.fire({
            title: 'Konfirmasi',
            text: 'Apakah Anda yakin ingin menghapus alamat ini?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                const newAddresses = localAddresses.filter((_, i) => i !== index);
                
                // If removed address was default, set first address as default
                if (localAddresses[index].is_default && newAddresses.length > 0) {
                    newAddresses[0].is_default = true;
                }
                
                setLocalAddresses(newAddresses);
                
                // Adjust active index
                if (activeAddressIndex >= newAddresses.length) {
                    setActiveAddressIndex(newAddresses.length - 1);
                } else if (activeAddressIndex === index && index > 0) {
                    setActiveAddressIndex(index - 1);
                }
                
                onAddressesChange(newAddresses);
            }
        });
    };

    const setDefaultAddress = (index) => {
        const newAddresses = localAddresses.map((addr, i) => ({
            ...addr,
            is_default: i === index
        }));
        setLocalAddresses(newAddresses);
        onAddressesChange(newAddresses);
    };

    const selectCity = (city) => {
        handleAddressChange('city', city.city_name);
        handleAddressChange('district', city.district_name);
        handleAddressChange('province', city.province_name);
        setCityQuery(city.city_name);
        setShowCityDropdown(false);
    };

    const validateAddresses = () => {
        const newErrors = {};
        let hasErrors = false;

        localAddresses.forEach((address, index) => {
            if (!address.city.trim()) {
                newErrors[`city_${index}`] = 'Kota/Kecamatan wajib diisi';
                if (index === activeAddressIndex) newErrors.city = 'Kota/Kecamatan wajib diisi';
                hasErrors = true;
            }
            
            if (!address.postal_code.trim()) {
                newErrors[`postal_code_${index}`] = 'Kode pos wajib diisi';
                if (index === activeAddressIndex) newErrors.postal_code = 'Kode pos wajib diisi';
                hasErrors = true;
            } else if (!/^[0-9]{5}$/.test(address.postal_code)) {
                newErrors[`postal_code_${index}`] = 'Kode pos harus 5 digit angka';
                if (index === activeAddressIndex) newErrors.postal_code = 'Kode pos harus 5 digit angka';
                hasErrors = true;
            }
            
            if (!address.address_detail.trim()) {
                newErrors[`address_detail_${index}`] = 'Alamat lengkap wajib diisi';
                if (index === activeAddressIndex) newErrors.address_detail = 'Alamat lengkap wajib diisi';
                hasErrors = true;
            }
        });

        setErrors(newErrors);
        return !hasErrors;
    };

    if (!localAddresses || localAddresses.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Kelola Alamat</h3>
                    <button
                        onClick={addAddress}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Icon icon="mdi:plus" className="w-4 h-4" />
                        Tambah Alamat
                    </button>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Icon icon="mdi:map-marker-off" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Belum ada alamat</p>
                    <p className="text-sm">Klik "Tambah Alamat" untuk menambah alamat baru</p>
                </div>
            </div>
        );
    }

    const currentAddress = localAddresses[activeAddressIndex] || {};

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Kelola Alamat</h3>
                <button
                    onClick={addAddress}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    Tambah Alamat
                </button>
            </div>

            {/* Address Tabs */}
            {localAddresses.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4 border-b">
                    {localAddresses.map((address, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setActiveAddressIndex(index);
                                setCityQuery(address.city || '');
                            }}
                            className={`px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                                activeAddressIndex === index
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            {address.label || `Alamat ${index + 1}`}
                            {address.is_default && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Default
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Address Form */}
            <div className="space-y-4">
                {/* Address Label and Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex-1 mr-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label Alamat
                        </label>
                        <input
                            type="text"
                            value={currentAddress.label || ''}
                            onChange={(e) => handleAddressChange('label', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="Contoh: Rumah, Kantor, dll"
                        />
                    </div>
                    <div className="flex gap-2">
                        {!currentAddress.is_default && (
                            <button
                                onClick={() => setDefaultAddress(activeAddressIndex)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                                Set Default
                            </button>
                        )}
                        {localAddresses.length > 1 && (
                            <button
                                onClick={() => removeAddress(activeAddressIndex)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                                <Icon icon="mdi:delete" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Recipient Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Penerima
                    </label>
                    <input
                        type="text"
                        value={currentAddress.recipient_name || ''}
                        onChange={(e) => handleAddressChange('recipient_name', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Nama penerima"
                    />
                </div>

                {/* Recipient Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        No. HP Penerima
                    </label>
                    <input
                        type="text"
                        value={currentAddress.recipient_phone || ''}
                        onChange={(e) => handleAddressChange('recipient_phone', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="08xxxxxxxxxx"
                    />
                </div>

                {/* City Search */}
                <div className="relative" ref={cityDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kota/Kecamatan *
                    </label>
                    <input
                        ref={cityInputRef}
                        type="text"
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        onFocus={() => cityQuery.length >= 2 && setShowCityDropdown(true)}
                        className={`w-full border rounded px-3 py-2 text-sm ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ketik untuk mencari kota/kecamatan"
                    />
                    {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                    
                    {showCityDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
                            {isLoadingCities ? (
                                <div className="p-3 text-center text-gray-500">
                                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin inline mr-2" />
                                    Mencari...
                                </div>
                            ) : cities.length > 0 ? (
                                cities.map((city, index) => (
                                    <div
                                        key={index}
                                        onClick={() => selectCity(city)}
                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="font-medium text-sm">{city.city_name}</div>
                                        <div className="text-xs text-gray-500">
                                            {city.district_name}, {city.province_name}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-gray-500 text-sm">
                                    Tidak ada hasil ditemukan
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Postal Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kode Pos *
                    </label>
                    <input
                        type="text"
                        value={currentAddress.postal_code || ''}
                        onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                        className={`w-full border rounded px-3 py-2 text-sm ${
                            errors.postal_code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12345"
                        maxLength={5}
                    />
                    {errors.postal_code && (
                        <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>
                    )}
                </div>

                {/* Address Detail */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat Lengkap *
                    </label>
                    <textarea
                        value={currentAddress.address_detail || ''}
                        onChange={(e) => handleAddressChange('address_detail', e.target.value)}
                        className={`w-full border rounded px-3 py-2 text-sm ${
                            errors.address_detail ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows={3}
                        placeholder="Jalan, nomor rumah, RT/RW, dll"
                    />
                    {errors.address_detail && (
                        <p className="text-red-500 text-xs mt-1">{errors.address_detail}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}