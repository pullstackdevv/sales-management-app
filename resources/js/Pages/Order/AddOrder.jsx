// resources/js/Pages/Order/AddOrder.jsx
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import api from "../../api/axios";
import Swal from "sweetalert2";

export default function AddOrder() {
    // State management untuk form order
    const [formData, setFormData] = useState({
        customer_id: '',
        address_id: '',
        sales_channel_id: '',
        origin_setting_id: '',
        shipping_cost: 0,
        manual_discount: 0,
        notes: '',
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        payment_status: 'pending',
        payment_bank_id: '',
        courier: '',
        service_type: ''
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            payment_status: prev.status === 'paid' ? 'paid' : 'pending'
        }));
    }, [formData.status]);

    const [orderItems, setOrderItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesChannels, setSalesChannels] = useState([]);
    const [paymentBanks, setPaymentBanks] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [courierRates, setCourierRates] = useState([]);
    const [selectedRateIndex, setSelectedRateIndex] = useState(null);
    const [loadingShipping, setLoadingShipping] = useState(false);
    const [origins, setOrigins] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [recipientSame, setRecipientSame] = useState(true);
    const [dropship, setDropship] = useState({
        label: "Dropship",
        recipient_name: "",
        recipient_phone: "",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        address_detail: "",
        is_dropship: true
    });
    const [dropErrors, setDropErrors] = useState({});
    const [dropCityQuery, setDropCityQuery] = useState("");
    const [dropCityResults, setDropCityResults] = useState([]);
    const [searchingDropCity, setSearchingDropCity] = useState(false);
    const [showDropCityDropdown, setShowDropCityDropdown] = useState(false);
    const [isShippingCostManuallyEdited, setIsShippingCostManuallyEdited] = useState(false);
    const formatRibuan = (num) => {
        if (!num || num === 0) return '';
        return Math.floor(num).toLocaleString('id-ID');
    };

    const parseRibuan = (str) => {
        if (!str) return 0;
        return parseInt(str.toString().replace(/\./g, '')) || 0;
    };
    
    // Loading states
    const [loading, setLoading] = useState({
        customers: false,
        products: false,
        salesChannels: false,
        paymentBanks: false,
        couriers: false,
        origins: false,
        submitting: false
    });
    
    // Search states
    const [searchTerms, setSearchTerms] = useState({
        customer: '',
        product: ''
    });
    
    // Error states
    const [errors, setErrors] = useState({});
    // const [voucherCode, setVoucherCode] = useState('');
    const [voucher, setVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherError, setVoucherError] = useState('');
    const formatIDR = (num) => {
        const n = Number(num || 0);
        return n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    };
    const getVoucherLabel = (v) => {
        const t = (v?.type || '').toString();
        if (t === 'shipping') return 'Diskon Ongkir';
        if (t === 'percentage') return 'Diskon Persentase';
        if (t === 'fixed') return 'Diskon';
        if (t === 'free_sample') return 'Gratis Sample';
        if (t === 'shipping_free_sample') return 'Diskon Ongkir + Sample';
        return 'Diskon';
    };
    const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        full_name: "",
        email: "",
        phone: "",
        line_id: "",
        other_contact: "",
        category: "Pelanggan"
    });
    const [newAddress, setNewAddress] = useState({
        label: "Rumah",
        recipient_name: "",
        recipient_phone: "",
        is_dropship: false,
        province: "",
        city: "",
        district: "",
        postal_code: "",
        address_detail: "",
        is_default: true
    });
    const [newCustErrors, setNewCustErrors] = useState({});
    const [cityQuery, setCityQuery] = useState("");
    const [cityResults, setCityResults] = useState([]);
    const [searchingCity, setSearchingCity] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Fetch customers dari API
    const fetchCustomers = async (search = '') => {
        setLoading(prev => ({ ...prev, customers: true }));
        try {
            const response = await axios.get('/api/customers', {
                params: { search, per_page: 50 }
            });
            setCustomers(response.data.data.data || []);

        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(prev => ({ ...prev, customers: false }));
        }
    };

    const hasAnyAddressData = (addr) => {
        return [addr.city, addr.district, addr.province, addr.postal_code, addr.address_detail]
            .some((v) => (v || '').toString().trim() !== '');
    };

    const validateNewCustomer = () => {
        const e = {};
        if (!newCustomer.full_name.trim()) e.full_name = 'Nama lengkap wajib diisi';
        if (!newCustomer.phone.trim()) e.phone = 'Nomor telepon wajib diisi';
        // else if (!/^08[0-9]{8,11}$/.test(newCustomer.phone)) e.phone = 'Format nomor telepon tidak valid (contoh: 081234567890)';
        if (hasAnyAddressData(newAddress)) {
            if (!newAddress.district?.trim() || !newAddress.city?.trim() || !newAddress.province?.trim()) {
                e.city = 'Silakan cari dan pilih kecamatan dari dropdown';
                e.district = 'Silakan cari dan pilih kecamatan dari dropdown';
                e.province = 'Silakan cari dan pilih kecamatan dari dropdown';
            }
            if (!newAddress.address_detail?.trim()) e.address_detail = 'Alamat lengkap wajib diisi';
            if (newAddress.postal_code?.trim() && !/^[0-9]{5}$/.test(newAddress.postal_code)) e.postal_code = 'Kode pos harus 5 digit angka';
        }
        setNewCustErrors(e);
        return Object.keys(e).length === 0;
    };

    const submitNewCustomer = async () => {
        if (!validateNewCustomer()) return;
        const isExemptPhone = (newCustomer.phone || '').replace(/\s/g, '') === '085000000000';
        const basePayload = {
            name: newCustomer.full_name,
            email: newCustomer.email || null,
            phone: newCustomer.phone,
            line_id: newCustomer.line_id || null,
            other_contact: newCustomer.other_contact || null,
            category: newCustomer.category,
            addresses: [{
                label: newAddress.label,
                recipient_name: newAddress.recipient_name || newCustomer.full_name,
                recipient_phone: newAddress.recipient_phone || newCustomer.phone,
                is_dropship: !!newAddress.is_dropship,
                province: newAddress.province,
                city: newAddress.city,
                district: newAddress.district,
                postal_code: newAddress.postal_code || null,
                address_detail: newAddress.address_detail,
                is_default: true
            }]
        };
        const handleSuccess = (cust) => {
            setCustomers(prev => [cust, ...prev]);
            setSelectedCustomer(cust);
            setFormData(prev => ({ ...prev, customer_id: cust.id }));
            const addrs = cust.addresses || [];
            setCustomerAddresses(addrs);
            const def = addrs.find(a => a.is_default) || addrs[0];
            if (def) setFormData(prev => ({ ...prev, address_id: def.id }));
            setSearchTerms(prev => ({ ...prev, customer: cust.name }));
            setAddCustomerModalOpen(false);
            setNewCustomer({ full_name: "", email: "", phone: "", line_id: "", other_contact: "", category: "Pelanggan" });
            setNewAddress({ label: "Rumah", recipient_name: "", recipient_phone: "", is_dropship: false, province: "", city: "", district: "", postal_code: "", address_detail: "", is_default: true });
            setCityQuery("");
            setCityResults([]);
            setShowCityDropdown(false);
            setNewCustErrors({});
        };
        try {
            const config = isExemptPhone ? { headers: { 'X-Manual-Order': '1' } } : undefined;
            const res = await api.post('/customers', basePayload, config);
            if (res.data.status === 'success') {
                handleSuccess(res.data.data);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Customer baru ditambahkan', timer: 1500, showConfirmButton: false });
            }
        } catch (error) {
            
            let msg = 'Gagal menambahkan customer';
            if (error.response?.data?.errors) {
                setNewCustErrors(error.response.data.errors);
                const firstKey = Object.keys(error.response.data.errors)[0];
                const firstMsg = error.response.data.errors[firstKey][0];
                if (firstKey === 'email' && /sudah.*terdaftar|has.*already.*been.*taken/i.test(firstMsg)) {
                    msg = 'Email sudah terdaftar, silakan gunakan email lain';
                } else if (firstKey === 'phone' && /sudah.*terdaftar/i.test(firstMsg)) {
                    msg = 'Nomor telepon sudah terdaftar, gunakan nomor lain';
                } else {
                    msg = firstMsg;
                }
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            } else {
                msg = 'Mohon periksa data yang dimasukkan';
            }
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
    };

    const debouncedCitySearch = async (query) => {
        if (query.length < 2) {
            setCityResults([]);
            setShowCityDropdown(false);
            return;
        }
        setSearchingCity(true);
        try {
            const response = await api.get('/wilayah/search-regencies', { params: { q: query } });
            if (response.data.status === 'success') {
                const onlyDistricts = (response.data.data || []).filter((item) => !!item.district_name);
                setCityResults(onlyDistricts);
                setShowCityDropdown(true);
            } else {
                setCityResults([]);
                setShowCityDropdown(false);
            }
        } catch (error) {
            setCityResults([]);
            setShowCityDropdown(false);
        } finally {
            setSearchingCity(false);
        }
    };

    const handleCitySearch = (value) => {
        setCityQuery(value);
        // Reset selected location until user picks from dropdown
        setNewAddress(prev => ({ ...prev, district: '', city: '', province: '' }));
        setNewCustErrors(prev => ({ ...prev, city: null, district: null, province: null }));

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            debouncedCitySearch(value);
        }, 300);
    };

    const selectCity = (c) => {
        setCityQuery(c.name);
        setNewAddress(prev => ({ ...prev, district: c.district_name || '', city: c.regency_name, province: c.province_name }));
        setShowCityDropdown(false);
        setCityResults([]);
        setNewCustErrors(prev => ({ ...prev, city: null, district: null, province: null }));
    };

    const normalizePhone = (p) => {
        const digits = (p || "").replace(/[^0-9]/g, "");
        return digits.replace(/^62/, "0");
    };

    const validateDropshipAddress = () => {
        const e = {};
        if (!dropship.recipient_name.trim()) e.recipient_name = "Wajib";
        if (!dropship.recipient_phone.trim()) e.recipient_phone = "Wajib";
        if (!dropship.district.trim() || !dropship.city.trim() || !dropship.province.trim()) {
            e.city = "Pilih kecamatan dari dropdown";
            e.district = "Pilih kecamatan dari dropdown";
            e.province = "Pilih kecamatan dari dropdown";
        }
        if (!dropship.address_detail.trim()) e.address_detail = "Wajib";
        if (dropship.postal_code.trim() && !/^\d{5}$/.test(dropship.postal_code.trim())) e.postal_code = "Kode pos harus 5 digit";
        setDropErrors(e);
        return Object.keys(e).length === 0;
    };

    const searchDropCity = async (query) => {
        if (query.length < 2) {
            setDropCityResults([]);
            setShowDropCityDropdown(false);
            return;
        }
        setSearchingDropCity(true);
        try {
            const response = await api.get('/wilayah/search-regencies', { params: { q: query } });
            if (response.data.status === 'success') {
                const onlyDistricts = (response.data.data || []).filter((item) => !!item.district_name);
                setDropCityResults(onlyDistricts);
                setShowDropCityDropdown(true);
            } else {
                setDropCityResults([]);
                setShowDropCityDropdown(false);
            }
        } catch (error) {
            setDropCityResults([]);
            setShowDropCityDropdown(false);
        } finally {
            setSearchingDropCity(false);
        }
    };

    const handleDropCitySearch = (value) => {
        setDropCityQuery(value);
        setDropship(prev => ({ ...prev, district: '', city: '', province: '' }));
        setDropErrors(prev => ({ ...prev, city: null, district: null, province: null }));
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            searchDropCity(value);
        }, 300);
    };

    const selectDropCity = (c) => {
        setDropCityQuery(c.name);
        setDropship(prev => ({ ...prev, district: c.district_name || '', city: c.regency_name, province: c.province_name }));
        setShowDropCityDropdown(false);
        setDropCityResults([]);
        setDropErrors(prev => ({ ...prev, city: null, district: null, province: null }));
    };

    const checkCustomerPhoneExists = async (phone) => {
        try {
            const res = await axios.get('/api/customers', { params: { search: phone, per_page: 5 } });
            const list = res.data?.data?.data || [];
            const n = normalizePhone(phone);
            return list.some(c => normalizePhone(c.phone) === n);
        } catch (e) {
            return false;
        }
    };

    const saveDropshipAddress = async () => {
        if (!selectedCustomer) return;
        if (!validateDropshipAddress()) return;
        const payload = {
            label: dropship.label || 'Dropship',
            recipient_name: dropship.recipient_name,
            recipient_phone: dropship.recipient_phone,
            address_detail: dropship.address_detail,
            province: dropship.province,
            city: dropship.city,
            district: dropship.district,
            postal_code: dropship.postal_code,
            is_default: false,
            is_dropship: true
        };
        let warnText = '';
        const exists = await checkCustomerPhoneExists(dropship.recipient_phone);
        if (exists) warnText = 'Nomor HP penerima terdaftar sebagai customer.';
        try {
            const response = await api.post(`/customers/${selectedCustomer.id}/addresses`, payload);
            if (response.data.status === 'success') {
                const addrs = response.data.data || [];
                setCustomerAddresses(addrs);
                const created = addrs[addrs.length - 1];
                if (created?.id) {
                    setFormData(prev => ({ ...prev, address_id: created.id }));
                }
                setDropship({
                    label: "Dropship",
                    recipient_name: "",
                    recipient_phone: "",
                    province: "",
                    city: "",
                    district: "",
                    postal_code: "",
                    address_detail: "",
                    is_dropship: true
                });
                setDropCityQuery("");
                setDropCityResults([]);
                setShowDropCityDropdown(false);
                setDropErrors({});
                Swal.fire({ icon: 'success', title: 'Alamat dropship disimpan', text: warnText || undefined, timer: 1500, showConfirmButton: false });
            }
        } catch (error) {
            let msg = error.response?.data?.message || 'Gagal menyimpan alamat';
            if (error.response?.data?.errors) {
                const errs = error.response.data.errors;
                const firstKey = Object.keys(errs)[0];
                const firstMsg = Array.isArray(errs[firstKey]) ? errs[firstKey][0] : (errs[firstKey] || msg);
                msg = firstMsg || msg;
            }
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.city-search-container')) {
                setShowCityDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch products dari API
    const fetchProducts = async (search = '') => {
        setLoading(prev => ({ ...prev, products: true }));
        try {
            const response = await axios.get('/api/products', {
                params: { search, per_page: 50 }
            });
            setProducts(response.data.data.data || []);

        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    };

    // Fetch sales channels dari API
    const fetchSalesChannels = async () => {
        setLoading(prev => ({ ...prev, salesChannels: true }));
        try {
            const response = await axios.get('/api/sales-channels');
            // Handle nested data structure with pagination
            if (response.data.status === 'success' && response.data.data && response.data.data.data) {
                setSalesChannels(response.data.data.data || []);
            } else {
                // Fallback for direct array response
                setSalesChannels(response.data || []);
            }

        } catch (error) {
            console.error('Error fetching sales channels:', error);
        } finally {
            setLoading(prev => ({ ...prev, salesChannels: false }));
        }
    };

    // Fetch payment banks dari API
    const fetchPaymentBanks = async () => {
        setLoading(prev => ({ ...prev, paymentBanks: true }));
        try {
            console.log('🏦 Fetching payment banks...');
            const response = await axios.get('/api/payment-banks');
            console.log('🏦 Payment banks response:', response.data);
            if (response.data.status === 'success' && response.data.data) {
                // Handle paginated response - access the actual data array
                const banksData = response.data.data.data || response.data.data;
                setPaymentBanks(Array.isArray(banksData) ? banksData : []);
                console.log('🏦 Payment banks set to state:', banksData);
            } else {
                setPaymentBanks(Array.isArray(response.data) ? response.data : []);
                console.log('🏦 Payment banks fallback set to state:', response.data);
            }
        } catch (error) {
            console.error('🏦 Error fetching payment banks:', error);
            setPaymentBanks([]);
        } finally {
            setLoading(prev => ({ ...prev, paymentBanks: false }));
        }
    };

    // Fetch couriers dari API
    const fetchCouriers = async () => {
        setLoading(prev => ({ ...prev, couriers: true }));
        try {
            const response = await axios.get('/api/couriers');
            if (response.data.status === 'success') {
                const couriersData = response.data.data?.data || response.data.data || [];
                const activeCouriers = Array.isArray(couriersData) ? couriersData.filter(courier => courier.is_active) : [];
                setCouriers(activeCouriers);
            } else {
                setCouriers([]);
            }
        } catch (error) {
            console.error('Error fetching couriers:', error);
            setCouriers([]);
        } finally {
            setLoading(prev => ({ ...prev, couriers: false }));
        }
    };

    // Fetch origins dari API
    const fetchOrigins = async () => {
        setLoading(prev => ({ ...prev, origins: true }));
        try {
            const response = await axios.get('/api/origin-settings');
            if (response.data.success) {
                const activeOrigins = response.data.data.filter(origin => origin.is_active);
                setOrigins(activeOrigins);
            } else {
                setOrigins([]);
            }
        } catch (error) {
            console.error('Error fetching origins:', error);
            setOrigins([]);
        } finally {
            setLoading(prev => ({ ...prev, origins: false }));
        }
    };

    // Handle customer selection
    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setFormData(prev => ({ ...prev, customer_id: customer.id }));
        setCustomerAddresses(customer.addresses || []);
        setSearchTerms(prev => ({ ...prev, customer: customer.name }));
        
        // Auto select first address if available
        if (customer.addresses && customer.addresses.length > 0) {
            setFormData(prev => ({ ...prev, address_id: customer.addresses[0].id }));
        }
    };

    // Handle courier selection and auto-fill shipping cost
    const handleCourierSelect = async (courierId) => {
        const selectedCourier = couriers.find(courier => courier.id == courierId);
        setFormData(prev => ({ ...prev, courier: courierId }));
        const courierName = (selectedCourier?.name || '').toLowerCase();
        if (courierName.includes('tiki')) {
            await fetchCourierRatesForManual();
        } else {
            setCourierRates([]);
            setSelectedRateIndex(null);
            setFormData(prev => ({ ...prev, service_type: '' }));
        }
    };

    // Handle manual shipping cost change
    const handleShippingCostChange = (value) => {
        setIsShippingCostManuallyEdited(true);
        setFormData(prev => ({ ...prev, shipping_cost: parseRibuan(value) }));
    };

    // Reset shipping cost to courier default
    const resetShippingCost = () => {
        const selectedCourier = couriers.find(courier => courier.id == formData.courier);
        if (selectedCourier?.cost) {
            setFormData(prev => ({ ...prev, shipping_cost: parseFloat(selectedCourier.cost) }));
            setIsShippingCostManuallyEdited(false);
        }
    };

    const validateVoucher = async () => {
        setVoucherError('');
        if (!voucherCode.trim()) return;
        setVoucherLoading(true);
        try {
            const response = await axios.post('/api/vouchers/validate', {
                code: voucherCode.trim(),
                order_amount: calculateSubtotal() + (parseFloat(formData.shipping_cost) || 0),
                shipping_cost: parseFloat(formData.shipping_cost) || 0
            });
            if (response.data.status === 'success') {
                const data = response.data.data || {};
                setVoucher(data.voucher || null);
                setDiscountAmount(data.discount_amount || 0);
                Swal.fire({ icon: 'success', title: 'Voucher diterapkan', timer: 1200, showConfirmButton: false });
            } else {
                setVoucher(null);
                setDiscountAmount(0);
                setVoucherError(response.data.message || 'Voucher tidak valid');
            }
        } catch (error) {
            setVoucher(null);
            setDiscountAmount(0);
            const msg = error.response?.data?.message || 'Voucher tidak valid';
            setVoucherError(msg);
            Swal.fire({ icon: 'error', title: 'Voucher gagal', text: msg });
        } finally {
            setVoucherLoading(false);
        }
    };

    const calculateTotalWeight = () => {
        if (!orderItems || orderItems.length === 0) return 0;
        return orderItems.reduce((sum, item) => {
            const w = item.variant_weight ?? item.weight ?? 1;
            const q = item.quantity || 1;
            return sum + ((typeof w === 'number' ? w : parseFloat(w) || 1) * q);
        }, 0);
    };

    const getRoundedWeight = (totalWeight, rate) => {
        const name = rate?.courier?.name?.toLowerCase() || rate?.courier_name?.toLowerCase() || '';
        if (name.includes('tiki')) {
            if (totalWeight <= 1.5) return 1;
            return Math.ceil(totalWeight);
        }
        return Math.ceil(totalWeight);
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

    const calculateShippingCostFromRate = (rates, district, indexOverride = null) => {
        if (!rates || rates.length === 0) {
            setFormData(prev => ({ ...prev, shipping_cost: 0 }));
            return;
        }
        const tw = calculateTotalWeight();
        const idx = typeof indexOverride === 'number' ? indexOverride : (typeof selectedRateIndex === 'number' ? selectedRateIndex : 0);
        const r = rates[idx];
        if (!r) {
            setFormData(prev => ({ ...prev, shipping_cost: 0 }));
            return;
        }
        const pricing = r.pricing || {};
        const availability = r.availability || {};
        const minW = typeof pricing.min_weight === 'number' && pricing.min_weight > 0 ? pricing.min_weight : 1;
        const maxW = typeof pricing.max_weight === 'number' && pricing.max_weight > 0 ? pricing.max_weight : null;
        const rounded = getRoundedWeight(tw, r);
        const effW = Math.max(rounded, minW);
        if (maxW && effW > maxW) {
            setFormData(prev => ({ ...prev, shipping_cost: 0 }));
            return;
        }
        if (availability.is_available === false) {
            setFormData(prev => ({ ...prev, shipping_cost: 0 }));
            return;
        }
        const ppk = pricing.price_per_kg ?? r.price_per_kg ?? 0;
        const bp = pricing.base_price ?? r.base_price ?? 0;
        const pricingType = pricing.pricing_type || r.pricing_type || 'per_kg';
        const extra = Math.max(0, effW - minW);
        const cost = pricingType === 'flat' ? bp : bp + (extra * ppk);
        setFormData(prev => ({ ...prev, shipping_cost: cost }));
    };

    const fetchCourierRatesForManual = async () => {
        if (!selectedCustomer) return;
        const addressId = parseInt(formData.address_id);
        const selectedAddress = addressId ? customerAddresses.find(a => a.id === addressId) : null;
        const dest = selectedAddress || selectedCustomer;
        const district = dest?.district || '';
        const city = dest?.city || '';
        const province = dest?.province || '';
        setLoadingShipping(true);
        try {
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('per_page', '50');
            params.append('sort_by', 'base_price');
            params.append('sort_order', 'asc');
            if (district) params.append('district', district);
            if (city) params.append('city', city);
            if (province) params.append('province', province);
            params.append('courier_name', 'TIKI');
            const res = await axios.get(`/api/courier-rates?${params.toString()}`);
            const rates = res.data?.data?.rates || [];
            const allowed = ['ECO','REG','ONS'];
            const filtered = (rates || []).filter(r => {
                const code = r?.service?.type || r?.service_type || r?.service?.name || '';
                const normalized = code.toString().toUpperCase();
                return allowed.some(k => normalized.includes(k));
            });
            setCourierRates(filtered);
            let defIdx = selectDefaultRateIndex(filtered);
            if (defIdx === null && filtered.length > 0) defIdx = 0;
            setSelectedRateIndex(defIdx);
            const svc = typeof defIdx === 'number' ? filtered[defIdx] : null;
            const svcName = svc?.service?.name || svc?.service_type || '';
            setFormData(prev => ({ ...prev, service_type: svcName }));
            calculateShippingCostFromRate(filtered, district, defIdx);
            setIsShippingCostManuallyEdited(false);
        } catch (e) {
            setCourierRates([]);
            setSelectedRateIndex(null);
        } finally {
            setLoadingShipping(false);
        }
    };

    const handleServiceSelect = (index) => {
        const idx = parseInt(index);
        setSelectedRateIndex(idx);
        const svc = courierRates[idx];
        setFormData(prev => ({ ...prev, service_type: (svc?.service?.name || svc?.service_type || '') }));
        const addressId = parseInt(formData.address_id);
        const selectedAddress = addressId ? customerAddresses.find(a => a.id === addressId) : null;
        const dest = selectedAddress || selectedCustomer;
        const district = dest?.district || '';
        calculateShippingCostFromRate(courierRates, district, idx);
        setIsShippingCostManuallyEdited(false);
    };

    useEffect(() => {
        if (!formData.courier) return;
        const c = couriers.find(x => String(x.id) === String(formData.courier));
        const name = c?.name?.toLowerCase() || '';
        if (name.includes('tiki')) {
            fetchCourierRatesForManual();
        } else {
            setCourierRates([]);
            setSelectedRateIndex(null);
            setFormData(prev => ({ ...prev, service_type: '' }));
        }
    }, [formData.courier, formData.address_id, formData.origin_setting_id, couriers]);

    useEffect(() => {
        const c = couriers.find(x => String(x.id) === String(formData.courier));
        const name = c?.name?.toLowerCase() || '';
        if (!name.includes('tiki')) return;
        if (typeof selectedRateIndex !== 'number' || !courierRates[selectedRateIndex]) return;
        const addressId = parseInt(formData.address_id);
        const selectedAddress = addressId ? customerAddresses.find(a => a.id === addressId) : null;
        const dest = selectedAddress || selectedCustomer;
        const district = dest?.district || '';
        calculateShippingCostFromRate(courierRates, district, selectedRateIndex);
        // do not reset service_type here; only adjust shipping cost based on weight
    }, [orderItems]);

    // Handle product selection and add to cart
    const handleAddProduct = (product, variant) => {
        const existingItemIndex = orderItems.findIndex(
            item => item.product_variant_id === variant.id
        );

        if (existingItemIndex >= 0) {
            // Check stock before updating quantity
            const currentItem = orderItems[existingItemIndex];
            if (currentItem.quantity >= variant.stock) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stok Tidak Mencukupi',
                    text: `Stok maksimal untuk ${variant.name || variant.variant_label} adalah ${variant.stock}`,
                    confirmButtonText: 'OK'
                });
                return;
            }
            
            // Update quantity if item already exists
            const updatedItems = [...orderItems];
            updatedItems[existingItemIndex].quantity += 1;
            setOrderItems(updatedItems);

        } else {
            // Check if variant has stock before adding
            if (variant.stock <= 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stok Habis',
                    text: `Produk ${variant.name || variant.variant_label} sedang habis`,
                    confirmButtonText: 'OK'
                });
                return;
            }
            
            // Add new item with complete variant details
            const newItem = {
                product_variant_id: variant.id,
                product_name: product.name,
                product_sku: product.sku,
                product_category: product.category,
                variant_name: variant.name || variant.variant_label,
                variant_sku: variant.sku,
                variant_weight: variant.weight,
                variant_stock: variant.stock,
                quantity: 1,
                price: variant.price
            };
            setOrderItems(prev => [...prev, newItem]);
        }
    };

    // Calculate totals
    const calculateSubtotal = () => {
        return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + (parseFloat(formData.shipping_cost) || 0) - (parseFloat(formData.manual_discount) || 0);
    };

    // Handle form submission
    const handleSubmit = async () => {
        setLoading(prev => ({ ...prev, submitting: true }));
        setErrors({});

        try {
            // Validation
            const newErrors = {};
            if (!formData.customer_id) newErrors.customer_id = 'Customer harus dipilih';
            if (!formData.address_id) newErrors.address_id = 'Alamat harus dipilih';
            if (!formData.sales_channel_id) newErrors.sales_channel_id = 'Sales channel harus dipilih';
            if (orderItems.length === 0) newErrors.items = 'Minimal satu produk harus ditambahkan';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            // Prepare data for API
                const orderData = {
                    customer_id: parseInt(formData.customer_id),
                    address_id: parseInt(formData.address_id),
                    sales_channel_id: parseInt(formData.sales_channel_id),
                    items: orderItems.map(item => ({
                        product_variant_id: item.product_variant_id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shipping_cost: formData.shipping_cost,
                    discount_amount: formData.manual_discount,
                    notes: formData.notes,
                    status: formData.status,
                    payment_status: formData.status === 'paid' ? 'paid' : 'pending',
                    payment_bank_id: formData.payment_bank_id || null,
                    courier_id: formData.courier || null,
                    courier_rate_id: typeof selectedRateIndex === 'number' && courierRates[selectedRateIndex]?.id ? courierRates[selectedRateIndex].id : null,
                    service_type: formData.service_type || null,
                    voucher_id: null
                };
            
            console.log('AddOrder - Sending data:', {
                courier_raw: formData.courier,
                courier_id: formData.courier || null,
                payment_bank_raw: formData.payment_bank_id,
                payment_bank_id: formData.payment_bank_id || null
            });

            const response = await axios.post('/api/orders', orderData);
            
            if (response.data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Berhasil Dibuat!',
                    text: `Nomor Order: ${response.data.data?.order_number || 'N/A'}`,
                    timer: 3000,
                    showConfirmButton: false
                });
                // Reset form or redirect
                setTimeout(() => {
                    window.history.back();
                }, 1500);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                
                // Check if it's a stock validation error
                const stockError = error.response.data.errors.items;
                if (stockError && Array.isArray(stockError)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Stok Tidak Mencukupi',
                        text: stockError[0],
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error Validasi',
                        text: error.response?.data?.message || 'Gagal membuat order'
                    });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Gagal membuat order'
                });
            }
        } finally {
            setLoading(prev => ({ ...prev, submitting: false }));
        }
    };

    // Load initial data
    useEffect(() => {
        fetchCustomers();
        fetchSalesChannels();
        fetchPaymentBanks();
        fetchCouriers();
        fetchOrigins();
    }, []);

    // Handle search debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerms.customer && !selectedCustomer) {
                fetchCustomers(searchTerms.customer);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerms.customer, selectedCustomer]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerms.product) {
                fetchProducts(searchTerms.product);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerms.product]);
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:arrow-left-outline" className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tambah Order</h1>
                        <p className="text-gray-600 mt-1">
                            Buat order baru untuk customer Anda
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Sidebar */}
                    <div className="space-y-4 xl:col-span-1">
                        {/* Customer */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Pemesan
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Cari customer"
                                        value={searchTerms.customer}
                                        onChange={(e) => {
                                            setSearchTerms(prev => ({ ...prev, customer: e.target.value }));
                                            if (!e.target.value) {
                                                setSelectedCustomer(null);
                                                setFormData(prev => ({ ...prev, customer_id: '', address_id: '' }));
                                                setCustomerAddresses([]);
                                            }
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            errors.customer_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {loading.customers && (
                                        <div className="absolute right-3 top-3">
                                            <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                                        </div>
                                    )}

                                    {/* Customer dropdown */}
                                    {searchTerms.customer && customers.length > 0 && !selectedCustomer && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {customers.map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => handleCustomerSelect(customer)}
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                                >
                                                    <div className="font-medium">{customer.name}</div>
                                                    <div className="text-sm text-gray-500">{customer.email}</div>
                                                    <div className="text-xs text-gray-400">{customer.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchTerms.customer && customers.length === 0 && !selectedCustomer && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                            <div className="p-3 text-sm text-gray-600">Tidak ada hasil</div>
                                            <div className="p-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setAddCustomerModalOpen(true)}
                                                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                                >
                                                    Tambah Customer Baru
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAddCustomerModalOpen(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Icon icon="solar:add-circle-outline" className="w-5 h-5" />
                                    <span className="hidden sm:inline">Tambah</span>
                                </button>
                            </div>
                            {errors.customer_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.customer_id}</p>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alamat Pengiriman
                            </label>
                            <div className="flex items-center gap-3 mb-3">
                                <label className="text-sm text-gray-700">Penerima sama dengan pemesan</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const v = !recipientSame;
                                        setRecipientSame(v);
                                        if (v) {
                                            const def = customerAddresses.find(a => a.is_default) || customerAddresses[0];
                                            setFormData(prev => ({ ...prev, address_id: def ? def.id : '' }));
                                        } else {
                                            setFormData(prev => ({ ...prev, address_id: '' }));
                                        }
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${recipientSame ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${recipientSame ? 'translate-x-5' : 'translate-x-1'}`}></span>
                                </button>
                            </div>
                            <select
                                value={formData.address_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, address_id: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    errors.address_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={!selectedCustomer || customerAddresses.length === 0}
                            >
                                <option value="">Pilih alamat pengiriman</option>
                                {customerAddresses.map((address) => (
                                    <option key={address.id} value={address.id}>
                                        {address.label} - {address.recipient_name} | {address.address_detail}, {address.district}, {address.city}, {address.province} {address.postal_code} | {address.phone}
                                    </option>
                                ))}
                            </select>
                            {!selectedCustomer && (
                                <p className="text-gray-500 text-xs mt-1">Pilih customer terlebih dahulu</p>
                            )}
                            {selectedCustomer && customerAddresses.length === 0 && (
                                <p className="text-yellow-600 text-xs mt-1">Customer belum memiliki alamat</p>
                            )}
                            {errors.address_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.address_id}</p>
                            )}
                            {!recipientSame && selectedCustomer && (
                                <div className="mt-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <input type="text" className={`w-full px-3 py-2 border rounded ${dropErrors.label ? 'border-red-500' : 'border-gray-300'}`} placeholder="Label Alamat" value={dropship.label} onChange={(e)=>setDropship(prev=>({...prev,label:e.target.value}))} />
                                        </div>
                                        <div>
                                            <input type="text" className={`w-full px-3 py-2 border rounded ${dropErrors.recipient_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Nama Penerima" value={dropship.recipient_name} onChange={(e)=>setDropship(prev=>({...prev,recipient_name:e.target.value}))} />
                                        </div>
                                        <div>
                                            <input type="text" className={`w-full px-3 py-2 border rounded ${dropErrors.recipient_phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="No. HP Penerima" value={dropship.recipient_phone} onChange={(e)=>setDropship(prev=>({...prev,recipient_phone:e.target.value}))} />
                                        </div>
                                        <div className="city-search-container relative">
                                            <input type="text" className={`w-full px-3 py-2 border rounded ${dropErrors.city || dropErrors.district || dropErrors.province ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ketik nama kecamatan" value={dropCityQuery} onChange={(e)=>handleDropCitySearch(e.target.value)} />
                                            {showDropCityDropdown && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {searchingDropCity ? (
                                                        <div className="p-2 text-sm text-gray-500">Mencari...</div>
                                                    ) : (
                                                        dropCityResults.map((c)=> (
                                                            <div key={`${c.district_code}-${c.regency_code}`} onClick={()=>selectDropCity(c)} className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                                                                <div className="text-sm font-medium">{c.district_name}</div>
                                                                <div className="text-xs text-gray-500">{c.regency_name}, {c.province_name}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input type="text" className={`w-full px-3 py-2 border rounded ${dropErrors.postal_code ? 'border-red-500' : 'border-gray-300'}`} placeholder="Kode Pos" value={dropship.postal_code} onChange={(e)=>setDropship(prev=>({...prev,postal_code:e.target.value}))} />
                                        </div>
                                    </div>
                                    <div>
                                        <textarea className={`w-full px-3 py-2 border rounded ${dropErrors.address_detail ? 'border-red-500' : 'border-gray-300'}`} rows={3} placeholder="Alamat Lengkap" value={dropship.address_detail} onChange={(e)=>setDropship(prev=>({...prev,address_detail:e.target.value}))}></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="button" onClick={saveDropshipAddress} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan alamat dropship</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Shipment */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pengiriman Dari
                                </label>
                                <select 
                                    value={formData.origin_setting_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, origin_setting_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                >
                                    <option value="">Pilih asal pengiriman...</option>
                                    {origins.map((origin) => (
                                        <option key={origin.id} value={origin.id}>
                                            {origin.store_name} | {origin.origin_address}
                                        </option>
                                    ))}
                                </select>
                                {loading.origins && (
                                    <p className="text-gray-500 text-xs mt-1">Memuat origins...</p>
                                )}
                                {errors.origin_setting_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.origin_setting_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Order
                                </label>
                                <input
                                    type="date"
                                    value={formData.order_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sales Channel
                                </label>
                                <select 
                                    value={formData.sales_channel_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sales_channel_id: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        errors.sales_channel_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Pilih sales channel</option>
                                    {salesChannels.map((channel) => (
                                        <option key={channel.id} value={channel.id}>
                                            {channel.name} ({channel.code})
                                        </option>
                                    ))}
                                </select>
                                {loading.salesChannels && (
                                    <p className="text-gray-500 text-xs mt-1">Memuat sales channels...</p>
                                )}
                                {errors.sales_channel_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.sales_channel_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kurir
                                </label>
                                <select
                                    value={formData.courier}
                                    onChange={(e) => handleCourierSelect(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Pilih kurir</option>
                                    {couriers.map((courier) => (
                                    <option key={courier.id} value={courier.id}>
                                        {courier.name} {courier.cost ? `(Rp ${Number(courier.cost).toLocaleString('id-ID')})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ongkos Kirim</label>
                                {formData.courier && (couriers.find(c => c.id == formData.courier)?.name || '').toLowerCase().includes('tiki') ? (
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Service</label>
                                      <select
                                        value={typeof selectedRateIndex === 'number' ? selectedRateIndex : ''}
                                        onChange={(e) => handleServiceSelect(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                      >
                                        <option value="">Pilih layanan</option>
                                        {courierRates.map((rate, idx) => (
                                          <option key={rate.id || idx} value={idx}>
                                            {(rate?.service?.name || rate?.service_type || 'Layanan')} - Rp {(function(){
                                              const p = rate.pricing || {};
                                              const minW = typeof p.min_weight === 'number' && p.min_weight > 0 ? p.min_weight : 1;
                                              const totalW = calculateTotalWeight();
                                              const effW = Math.max(getRoundedWeight(totalW, rate), minW);
                                              const pricePerKg = p.price_per_kg ?? rate.price_per_kg ?? 0;
                                              const basePrice = p.base_price ?? rate.base_price ?? 0;
                                              const pricingType = p.pricing_type || rate.pricing_type || 'per_kg';
                                              const extra = Math.max(0, effW - minW);
                                              const cost = pricingType === 'flat' ? basePrice : basePrice + (extra * pricePerKg);
                                              return Number(cost).toLocaleString('id-ID');
                                            })()}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={formatRibuan(formData.shipping_cost)}
                                        disabled
                                        className="flex-1 px-3 py-2 border rounded-lg border-gray-300 bg-gray-100"
                                      />
                                    </div>
                                    {typeof selectedRateIndex === 'number' && courierRates[selectedRateIndex]?.delivery?.estimated_days && (
                                      <p className="text-xs text-gray-500">ETA {courierRates[selectedRateIndex].delivery.estimated_days} hari</p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="0"
                                        value={formatRibuan(formData.shipping_cost)}
                                        onChange={(e) => handleShippingCostChange(e.target.value)}
                                        className={`flex-1 px-3 py-2 border rounded-lg ${
                                          isShippingCostManuallyEdited ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                                        }`}
                                      />
                                      {formData.courier && couriers.find(c => c.id == formData.courier)?.cost && (
                                        <button
                                          type="button"
                                          onClick={resetShippingCost}
                                          className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                          title="Reset ke biaya kurir default"
                                        >
                                          <Icon icon="solar:restart-outline" className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-gray-500 text-xs">
                                        {isShippingCostManuallyEdited ? 'Diedit manual' : 'Otomatis dari kurir yang dipilih'}
                                      </p>
                                      {formData.courier && couriers.find(c => c.id == formData.courier)?.cost && (
                                        <p className="text-xs text-gray-400">
                                          Default: Rp {Number(couriers.find(c => c.id == formData.courier).cost).toLocaleString('id-ID')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diskon Manual (opsional)</label>
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={formatRibuan(formData.manual_discount)}
                                    onChange={(e) => setFormData(prev => ({ ...prev, manual_discount: parseRibuan(e.target.value) }))}
                                    className={`w-full px-3 py-2 border rounded-lg ${errors.discount_amount ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.discount_amount && (
                                    <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.discount_amount) ? errors.discount_amount[0] : errors.discount_amount}</p>
                                )}
                            </div>


                        </div>
                    </div>

                    {/* Product & Summary */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Product Search */}
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari produk"
                                    value={searchTerms.product}
                                    onChange={(e) => setSearchTerms(prev => ({ ...prev, product: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                {loading.products && (
                                    <div className="absolute right-3 top-3">
                                        <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Product Results */}
                            {searchTerms.product && products.length > 0 && (
                                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                    {products.map((product) => (
                                        <div key={product.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{product.name}</h4>
                                                    <p className="text-sm text-gray-500">{product.sku}</p>
                                                    <p className="text-xs text-gray-400">{product.category}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Product Variants */}
                                            <div className="mt-2 space-y-1">
                                                {product.variants?.map((variant) => (
                                                    <div key={variant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">{variant.name || variant.variant_label}</span>
                                                                {variant.sku && (
                                                                    <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">{variant.sku}</span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-gray-500">Stok: {variant.stock}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">Rp {formatIDR(variant.price)}</span>
                                                            <button
                                                                onClick={() => handleAddProduct(product, variant)}
                                                                disabled={variant.stock <= 0}
                                                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-300"
                                                            >
                                                                {variant.stock <= 0 ? 'Habis' : 'Tambah'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {searchTerms.product && products.length === 0 && !loading.products && (
                                <p className="text-gray-500 text-sm mt-2">Produk tidak ditemukan</p>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-medium mb-4">Item Order</h3>
                            
                            {orderItems.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="flex flex-col items-center">
                                        <Icon icon="solar:box-outline" className="w-16 h-16 mb-2" />
                                        <p>Belum ada produk ditambahkan</p>
                                        <p className="text-sm">Cari dan tambahkan produk di atas</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => (
                                        <div key={`${item.product_variant_id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product_name}</h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{item.variant_name}</span>
                                                    {item.variant_sku && (
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{item.variant_sku}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                                    {item.product_category && <span>Kategori: {item.product_category}</span>}
                                                    {item.variant_stock !== undefined && (
                                                        <span className={item.variant_stock > 0 ? 'text-green-600' : 'text-red-500'}>
                                                            Stok: {item.variant_stock}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-blue-600 mt-1">Rp {formatIDR(item.price)}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            if (updatedItems[index].quantity > 1) {
                                                                updatedItems[index].quantity -= 1;
                                                                setOrderItems(updatedItems);
                                                            }
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                                                    >
                                                        <span className="text-lg font-bold">−</span>
                                                    </button>
                                                    
                                                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                    
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            const currentItem = updatedItems[index];
                                                            const maxStock = currentItem.variant_stock || 0;
                                                            
                                                            if (currentItem.quantity < maxStock) {
                                                                updatedItems[index].quantity += 1;
                                                                setOrderItems(updatedItems);
                                                            } else {
                                                                Swal.fire({
                                                                    icon: 'warning',
                                                                    title: 'Stok Tidak Mencukupi',
                                                                    text: `Stok maksimal untuk ${currentItem.variant_name} adalah ${maxStock}`,
                                                                    confirmButtonText: 'OK'
                                                                });
                                                            }
                                                        }}
                                                        disabled={item.quantity >= (item.variant_stock || 0)}
                                                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                                                    >
                                                        <span className="text-lg font-bold">+</span>
                                                    </button>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-medium">Rp {(item.quantity * item.price)?.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                                </div>
                                                
                                                <button
                                                    onClick={() => {
                                                        const updatedItems = orderItems.filter((_, i) => i !== index);
                                                        setOrderItems(updatedItems);
                                                        Swal.fire({
                                                            icon: 'success',
                                                            title: 'Item Dihapus',
                                                            text: `${item.variant_name} dihapus dari order`,
                                                            showConfirmButton: false,
                                                            timer: 1500
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Icon icon="solar:trash-bin-minimalistic-outline" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {errors.items && (
                                <p className="text-red-500 text-xs mt-2">{errors.items}</p>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <h3 className="font-medium mb-4">Ringkasan Order</h3>
                            
                            
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-700">Subtotal ({orderItems.length} item)</span>
                                <span className="text-sm font-medium">Rp {calculateSubtotal().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-700">Ongkos Kirim</span>
                                <span className="text-sm font-medium">Rp {formData.shipping_cost.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>

                            {(parseFloat(formData.manual_discount) || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-700">Diskon Manual</span>
                                    <span className="text-sm font-medium text-green-600">- Rp {formatIDR(formData.manual_discount)}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between pt-4 border-t font-semibold text-lg">
                                <span>TOTAL</span>
                                <span className="text-blue-600">Rp {calculateTotal().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        {/* Bank Pembayaran */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Pembayaran
                            </label>
                            <select 
                                value={formData.payment_bank_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, payment_bank_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">Pilih bank</option>
                                {(() => {
                                    const activeBanks = Array.isArray(paymentBanks) ? paymentBanks.filter(bank => bank.is_active) : [];
                                    return activeBanks.map((bank) => (
                                        <option key={bank.id} value={bank.id}>
                                            {bank.bank_name} - {bank.account_number} ({bank.account_name})
                                        </option>
                                    ));
                                })()}
                            </select>
                            {loading.paymentBanks && (
                                <p className="text-gray-500 text-xs mt-1">Memuat payment banks...</p>
                            )}
                        </div>

                        {/* Catatan */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catatan
                            </label>
                            <textarea
                                rows="3"
                                placeholder="Catatan untuk order ini..."
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        {/* Order Status */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Order
                            </label>
                            <select 
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="shipped">Shipped</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Error Display */}
                        {errors.items && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-500 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-800 font-medium mb-1">Error Validasi</h4>
                                        {Array.isArray(errors.items) ? (
                                            <ul className="text-red-700 text-sm space-y-1">
                                                {errors.items.map((error, index) => (
                                                    <li key={index}>• {error}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-red-700 text-sm">{errors.items}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex justify-end gap-4">
                            <button 
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
                                disabled={loading.submitting}
                            >
                                Batal
                            </button>
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading.submitting || orderItems.length === 0}
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading.submitting && (
                                    <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                                )}
                                {loading.submitting ? 'Menyimpan...' : 'Simpan Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {addCustomerModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="relative bg-white rounded-lg w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl shadow-xl">
                        <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Tambah Customer</h3>
                            <button onClick={() => setAddCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="material-symbols:close" className="text-xl" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Kategori</label>
                                <select className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.category ? 'border-red-500' : 'border-gray-300'}`} value={newCustomer.category} onChange={(e) => setNewCustomer({ ...newCustomer, category: e.target.value })}>
                                    <option value="Pelanggan">Pelanggan</option>
                                    <option value="Reseller">Reseller</option>
                                    <option value="Dropshipper">Dropshipper</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Nama Lengkap</label>
                                <input type="text" className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.full_name ? 'border-red-500' : 'border-gray-300'}`} value={newCustomer.full_name} onChange={(e) => { setNewCustomer({ ...newCustomer, full_name: e.target.value }); setNewAddress({ ...newAddress, recipient_name: e.target.value }); }} placeholder="Masukkan nama lengkap" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">No. HP / Telepon</label>
                                <input type="text" className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.phone ? 'border-red-500' : 'border-gray-300'}`} value={newCustomer.phone} onChange={(e) => { setNewCustomer({ ...newCustomer, phone: e.target.value }); setNewAddress({ ...newAddress, recipient_phone: e.target.value }); }} placeholder="081234567890" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <input type="email" className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.email ? 'border-red-500' : 'border-gray-300'}`} value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="opsional" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">ID Line</label>
                                <input type="text" className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={newCustomer.line_id} onChange={(e) => setNewCustomer({ ...newCustomer, line_id: e.target.value })} placeholder="ID Line" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Other Contact</label>
                                <input type="text" className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={newCustomer.other_contact} onChange={(e) => setNewCustomer({ ...newCustomer, other_contact: e.target.value })} placeholder="Kontak lainnya" />
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-md font-semibold text-gray-900">Kelola Alamat</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Label Alamat</label>
                                    <input type="text" className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="Label alamat (contoh: Rumah, Kantor)" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium">Nama Penerima</label>
                                    <input type="text" className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={newAddress.recipient_name} onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })} placeholder="Nama penerima" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">No. HP Penerima</label>
                                    <input type="tel" className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={newAddress.recipient_phone} onChange={(e) => setNewAddress({ ...newAddress, recipient_phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <input type="checkbox" className="h-4 w-4" checked={!!newAddress.is_dropship} onChange={(e) => setNewAddress({ ...newAddress, is_dropship: e.target.checked })} />
                                <span className="text-sm">Alamat Pesanan dropship</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative city-search-container">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        Cari Kecamatan <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">(Wajib pilih dari hasil pencarian)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                newCustErrors.city
                                                    ? 'border-red-500'
                                                    : (newAddress?.district && newAddress?.city)
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-300'
                                            }`}
                                            placeholder="Ketik nama kecamatan ..."
                                            value={cityQuery}
                                            onChange={(e) => handleCitySearch(e.target.value)}
                                            onFocus={() => setShowCityDropdown(true)}
                                            autoComplete="off"
                                        />
                                        {(newAddress?.district && newAddress?.city) && (
                                            <div className="absolute right-3 top-2.5 text-green-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                        {searchingCity && !(newAddress?.district && newAddress?.city) && (
                                            <div className="absolute right-3 top-2.5 text-gray-400">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>

                                    {showCityDropdown && cityResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {cityResults.map((city, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => selectCity(city)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 text-xs rounded ${city.district_name ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                            {city.district_name ? 'Kecamatan' : '-'}
                                                        </span>
                                                        <span className="font-medium">{city.name}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {city.district_name ? `${city.regency_name}, ${city.province_name}` : city.province_name}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {(newAddress?.district || newAddress?.city) && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                                            <div className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-green-900 mb-2">✓ Lokasi Berhasil Dipilih:</h4>
                                                    <div className="text-sm text-green-800 space-y-1">
                                                        {newAddress?.district && (
                                                            <div><strong>Kecamatan:</strong> {newAddress?.district}</div>
                                                        )}
                                                        {newAddress?.city && (
                                                            <div><strong>Kota/Kabupaten:</strong> {newAddress?.city}</div>
                                                        )}
                                                        {newAddress?.province && (
                                                            <div><strong>Provinsi:</strong> {newAddress?.province}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {newCustErrors.city && (
                                        <p className="text-red-500 text-xs mt-1">{newCustErrors.city}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Kode Pos (opsional)</label>
                                    <input
                                        type="text"
                                        className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.postal_code ? 'border-red-500' : 'border-gray-300'}`}
                                        value={newAddress.postal_code}
                                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: (e.target.value || '').replace(/\D/g, '').slice(0,5) })}
                                        placeholder="12345"
                                        maxLength={5}
                                    />
                                    {newCustErrors.postal_code && (
                                        <p className="text-red-500 text-xs mt-1">{newCustErrors.postal_code}</p>
                                    )}
                                </div>
                            </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Alamat Lengkap</label>
                                <textarea rows="3" className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.address_detail ? 'border-red-500' : 'border-gray-300'}`} value={newAddress.address_detail} onChange={(e) => setNewAddress({ ...newAddress, address_detail: e.target.value })} placeholder="Nama jalan, RT/RW, patokan" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Kode Pos</label>
                                <input type="text" className={`w-full mt-1 border rounded px-3 py-2 text-sm ${newCustErrors.postal_code ? 'border-red-500' : 'border-gray-300'}`} value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: (e.target.value || '').replace(/\D/g, '').slice(0,5) })} placeholder="opsional" />
                            </div>
                        </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setAddCustomerModalOpen(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Batal</button>
                            <button type="button" onClick={submitNewCustomer} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Simpan Customer</button>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
