// resources/js/Pages/Order/EditOrder.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";
import { getCurrentDateWIB } from "../../utils/helpers";
import { usePage, router } from '@inertiajs/react';

export default function EditOrder() {
    const { orderId } = usePage().props;

    // State management untuk form order
    const [formData, setFormData] = useState({
        customer_id: '',
        address_id: '',
        sales_channel_id: '',
        origin_setting_id: '',
        shipping_cost: 0,
        manual_discount: 0,
        notes: '',
        order_date: getCurrentDateWIB(),
        status: 'pending',
        payment_bank_id: '',
        courier: '',
        service_type: ''
    });

    const [orderItems, setOrderItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesChannels, setSalesChannels] = useState([]);
    const [paymentBanks, setPaymentBanks] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [origins, setOrigins] = useState([]);
    const [courierRates, setCourierRates] = useState([]);
    const [selectedRateIndex, setSelectedRateIndex] = useState(null);
    const [loadingShipping, setLoadingShipping] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [originalOrder, setOriginalOrder] = useState(null);
    const [isShippingCostManuallyEdited, setIsShippingCostManuallyEdited] = useState(false);
    
    // Loading states
    const [loading, setLoading] = useState({
        customers: false,
        products: false,
        salesChannels: false,
        paymentBanks: false,
        couriers: false,
        origins: false,
        submitting: false,
        order: true
    });
    
    // Search states
    const [searchTerms, setSearchTerms] = useState({
        customer: '',
        product: ''
    });
    
    // Error states
    const [errors, setErrors] = useState({});
    const [cancelling, setCancelling] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucher, setVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherError, setVoucherError] = useState('');

    const formatRupiah = (num) => {
        if (!num || num === 0) return '';
        return Math.floor(num).toLocaleString('id-ID');
    };

    const parseRupiah = (str) => {
        if (!str) return 0;
        return parseInt(str.toString().replace(/\./g, '')) || 0;
    };

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

    // Fetch existing order data
    const fetchOrder = async () => {
        setLoading(prev => ({ ...prev, order: true }));
        try {
            const response = await axios.get(`/api/orders/${orderId}`);
            const order = response.data.data;
            setOriginalOrder(order);
            
            // Set form data
            const paymentBankId = (order.payments && order.payments[0] && order.payments[0].payment_bank_id) ? order.payments[0].payment_bank_id.toString() : '';
            console.log('🏦 [EditOrder] Setting payment_bank_id from order:', paymentBankId, 'Order payments:', order.payments);
            console.log('📊 [EditOrder] Setting sales_channel_id from order:', order.sales_channel_id, 'Sales channel:', order.sales_channel);
            console.log('📊 [EditOrder] Sales channel code:', order.sales_channel?.code);
            
            setFormData({
                customer_id: order.customer_id,
                address_id: order.address_id,
                sales_channel_id: order.sales_channel_id ? order.sales_channel_id.toString() : '',
                shipping_cost: parseFloat(order.shipping_cost) || 0,
                manual_discount: parseFloat(order.discount_amount) || 0,
                notes: order.notes || '',
                order_date: order.order_date ? order.order_date.split(' ')[0] : getCurrentDateWIB(),
                status: order.status || 'pending',
                payment_bank_id: paymentBankId,
                courier: (order.shipping && order.shipping.courier_id) ? order.shipping.courier_id : '',
                service_type: (order.shipping && order.shipping.service_type) ? order.shipping.service_type : '',
                origin_setting_id: order.origin_setting_id ? String(order.origin_setting_id) : ''
            });

            setVoucher(null);
            setVoucherCode('');
            setDiscountAmount(0);
            
            // Set order items with complete variant details
            setOrderItems(order.items?.map(item => ({
                product_variant_id: item.product_variant_id,
                product_name: item.product_variant?.product?.name || item.product_name_snapshot || 'Unknown Product',
                product_sku: item.product_variant?.product?.sku || '',
                product_category: item.product_variant?.product?.category || '',
                variant_name: item.product_variant?.name || item.product_variant?.variant_label || item.variant_label || 'Default',
                variant_sku: item.product_variant?.sku || '',
                variant_weight: item.product_variant?.weight || 0,
                variant_stock: item.product_variant?.stock || 0,
                quantity: item.quantity,
                price: item.price
            })) || []);
            
            // Set selected customer and fetch fresh customer data with addresses
            if (order.customer) {
                setSelectedCustomer(order.customer);
                setSearchTerms(prev => ({ ...prev, customer: order.customer.name }));
                
                // Fetch fresh customer data to ensure addresses are loaded
                try {
                    const customerResponse = await axios.get(`/api/customers/${order.customer_id}`);
                    if (customerResponse.data.status === 'success') {
                        const customerData = customerResponse.data.data;
                        setCustomerAddresses(customerData.addresses || []);
                        setSelectedCustomer(customerData);
                    } else {
                        // Fallback to order customer data
                        setCustomerAddresses(order.customer.addresses || []);
                    }
                } catch (customerError) {
                    console.warn('Failed to fetch fresh customer data, using order data:', customerError);
                    setCustomerAddresses(order.customer.addresses || []);
                }
            }
            
        } catch (error) {
            console.error('Error fetching order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Gagal memuat data order'
            });
        } finally {
            setLoading(prev => ({ ...prev, order: false }));
        }
    };

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
            if (response.data.status === 'success' && response.data.data && response.data.data.data) {
                setSalesChannels(response.data.data.data || []);
            } else {
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
            console.log('🏦 [EditOrder] Fetching payment banks...');
            const response = await axios.get('/api/payment-banks');
            console.log('🏦 [EditOrder] Payment banks response:', response.data);
            if (response.data.status === 'success' && response.data.data) {
                // Handle paginated response - access the actual data array
                const banksData = response.data.data.data || response.data.data;
                setPaymentBanks(Array.isArray(banksData) ? banksData : []);
                console.log('🏦 [EditOrder] Payment banks set to state:', banksData);
            } else {
                setPaymentBanks(Array.isArray(response.data) ? response.data : []);
                console.log('🏦 [EditOrder] Payment banks fallback set to state:', response.data);
            }
        } catch (error) {
            console.error('🏦 [EditOrder] Error fetching payment banks:', error);
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

    // Handle product selection and add to cart
    const handleAddProduct = (product, variant) => {
        const existingItemIndex = orderItems.findIndex(
            item => item.product_variant_id === variant.id
        );

        if (existingItemIndex >= 0) {
            const currentItem = orderItems[existingItemIndex];
            const additionalAvailable = currentItem.variant_stock || 0;
            if (additionalAvailable <= 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stok Tidak Mencukupi',
                    text: `Tidak ada stok tambahan tersedia untuk ${variant.name || variant.variant_label}`,
                    confirmButtonText: 'OK'
                });
                return;
            }
            const updatedItems = [...orderItems];
            updatedItems[existingItemIndex].quantity += 1;
            updatedItems[existingItemIndex].variant_stock = additionalAvailable - 1;
            setOrderItems(updatedItems);
        } else {
            if (variant.stock <= 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stok Habis',
                    text: `Produk ${variant.name || variant.variant_label} sedang habis`,
                    confirmButtonText: 'OK'
                });
                return;
            }
            const newItem = {
                product_variant_id: variant.id,
                product_name: product.name,
                product_sku: product.sku,
                product_category: product.category,
                variant_name: variant.name || variant.variant_label,
                variant_sku: variant.sku,
                variant_weight: variant.weight,
                variant_stock: Math.max(0, (variant.stock || 0) - 1),
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

    const selectDefaultRateIndex = (rates, preferService = null) => {
        if (!rates || rates.length === 0) return null;
        const tw = calculateTotalWeight();
        if (preferService) {
            const idxPrefer = rates.findIndex(r => {
                const code = r?.service?.type || r?.service_type || '';
                const name = r?.service?.name || '';
                const target = (preferService || '').toString().toUpperCase();
                return code.toString().toUpperCase() === target || name.toString().toUpperCase() === target;
            });
            if (idxPrefer >= 0) return idxPrefer;
        }
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
        if (!selectedCustomer && !originalOrder?.customer && !originalOrder?.address) return;
        const addressId = parseInt(formData.address_id);
        const baseCustomer = selectedCustomer || originalOrder?.customer || null;
        const selectedAddress = addressId ? customerAddresses.find(a => a.id === addressId) : null;
        const dest = selectedAddress || originalOrder?.address || baseCustomer;
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
            const prefer = originalOrder?.shipping?.service_type || null;
            let defIdx = selectDefaultRateIndex(filtered, prefer);
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
        const dest = selectedAddress || selectedCustomer || originalOrder?.customer || null;
        const district = dest?.district || '';
        calculateShippingCostFromRate(courierRates, district, idx);
        setIsShippingCostManuallyEdited(false);
    };

    const validateVoucher = async () => {
        setVoucherError('');
        if (!voucherCode.trim()) return;
        if (isWebOrder()) return;
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

            // Calculate totals for debugging
            const subtotal = calculateSubtotal();
            const total = calculateTotal();
            console.log('=== EditOrder Debug ===');
            console.log('Subtotal:', subtotal);
            console.log('Shipping Cost:', formData.shipping_cost);
            console.log('Total:', total);
            console.log('Order Items:', orderItems);

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
                payment_bank_id: formData.payment_bank_id || null,
                courier_id: formData.courier || null,
                courier_rate_id: typeof selectedRateIndex === 'number' && courierRates[selectedRateIndex]?.id ? courierRates[selectedRateIndex].id : null,
                service_type: formData.service_type || null,
                voucher_id: null
            };
            
            console.log('EditOrder - Sending data:', {
                courier_raw: formData.courier,
                courier_id: formData.courier || null,
                payment_bank_raw: formData.payment_bank_id,
                payment_bank_id: formData.payment_bank_id || null
            });

            console.log('Order Data to be sent:', orderData);
            const response = await axios.put(`/api/orders/${orderId}`, orderData);
            
            if (response.data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Berhasil Diupdate!',
                    text: `Nomor Order: ${response.data.data?.order_number || 'N/A'}`,
                    timer: 3000,
                    showConfirmButton: false
                });
                // Redirect back to orders page with forced refresh
                router.visit('/cms/order/data', {
                    preserveState: false,
                    preserveScroll: false
                });
            }
        } catch (error) {
            console.error('Error updating order:', error);
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
                        text: error.response?.data?.message || 'Gagal mengupdate order'
                    });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Gagal mengupdate order'
                });
            }
        } finally {
            setLoading(prev => ({ ...prev, submitting: false }));
        }
    };

    // Load initial data
    useEffect(() => {
        if (orderId) {
            fetchOrder();
            fetchSalesChannels();
            fetchPaymentBanks();
            fetchCouriers();
            fetchOrigins();
        }
    }, [orderId]);

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
        const dest = selectedAddress || selectedCustomer || originalOrder?.customer || null;
        const district = dest?.district || '';
        calculateShippingCostFromRate(courierRates, district, selectedRateIndex);
    }, [orderItems]);

    useEffect(() => {
        if (origins && origins.length > 0 && !formData.origin_setting_id) {
            const defaultOrigin = origins[0];
            setFormData(prev => ({ ...prev, origin_setting_id: String(defaultOrigin.id) }));
        }
    }, [origins]);

    useEffect(() => {
        const name = originalOrder?.shipping?.courier?.name?.toLowerCase() || '';
        if (name.includes('tiki')) {
            fetchCourierRatesForManual();
        }
    }, [originalOrder]);

    const isWebOrder = () => {
        // Consider web order if sales_channel code is WEBSITE or order has payment_url
        return originalOrder?.sales_channel?.code === 'WEBSITE' || !!originalOrder?.payment_url;
    };

    const handleCancelWebOrder = async () => {
        if (!originalOrder) return;
        if (!isWebOrder()) return;
        if (originalOrder.payment_status === 'paid' || originalOrder.status === 'cancelled') return;

        const result = await Swal.fire({
            title: 'Batalkan Web Order?',
            text: 'Order web yang belum dibayar akan dibatalkan. Lanjutkan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, batalkan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#d33',
        });

        if (!result.isConfirmed) return;

        try {
            setCancelling(true);
            const response = await axios.post(`/api/orders/${orderId}/update-status`, {
                status: 'cancelled',
            });

            if (response.data?.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Web order berhasil dibatalkan.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                // Redirect back to orders list
                router.visit('/cms/order/data', {
                    preserveState: false,
                    preserveScroll: false,
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: response.data?.message || 'Gagal membatalkan web order.',
                });
            }
        } catch (error) {
            console.error('Error cancelling web order:', error);
            const message = error.response?.data?.message || 'Terjadi kesalahan saat membatalkan web order.';
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
            });
        } finally {
            setCancelling(false);
        }
    };

    if (loading.order) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Memuat data order...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }
console.log(formData)
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Icon icon="solar:arrow-left-outline" className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Order #{originalOrder?.order_number || orderId}</h1>
                            <p className="text-gray-600 mt-1">
                                Edit order yang sudah ada
                            </p>
                        </div>
                    </div>
                    
                    {/* Sales Channel & Source Badge + Web Order Actions */}
                    <div className="flex items-center gap-3">
                        {originalOrder?.sales_channel && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                <p className="text-sm font-semibold text-blue-900">{originalOrder.sales_channel.name}</p>
                                <p className="text-xs text-blue-500 mt-1">Code: {originalOrder.sales_channel.code}</p>
                            </div>
                        )}
                        
                        {originalOrder?.sales_channel?.code && originalOrder.sales_channel.code === 'WEBSITE' ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 max-w-xs">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                    <p className="text-xs text-red-600 font-medium">Website Resmi</p>
                                </div>
                                <p className="text-xs text-red-700">Hanya bisa update status order</p>
                            </div>
                        ) : originalOrder?.sales_channel ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                    <p className="text-xs text-green-600 font-medium">Dapat Diedit</p>
                                </div>
                            </div>
                        ) : null}

                        {/* Cancel Web Order button - only for web orders that are not paid and not cancelled */}
                        {isWebOrder() && originalOrder?.payment_status !== 'paid' && originalOrder?.status !== 'cancelled' && (
                            <button
                                onClick={handleCancelWebOrder}
                                disabled={cancelling}
                                className="ml-2 inline-flex items-center gap-2 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            >
                                <Icon icon="mdi:cancel" className="w-4 h-4" />
                                <span>{cancelling ? 'Membatalkan...' : 'Batalkan Web Order'}</span>
                            </button>
                        )}
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
                            <div className="relative">
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
                                    disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE'}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        errors.customer_id ? 'border-red-500' : 'border-gray-300'
                                    } ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                            </div>
                            {errors.customer_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.customer_id}</p>
                            )}
                        </div>

                        {/* Customer Address */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alamat Pengiriman
                            </label>
                            <select
                                value={formData.address_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, address_id: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    errors.address_id ? 'border-red-500' : 'border-gray-300'
                                } ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100' : ''}`}
                                disabled={!selectedCustomer || customerAddresses.length === 0 || (originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE')}
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
                        </div>

                        {/* Shipment */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pengiriman Dari
                                </label>
                                <select 
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100' : ''}`}
                                    value={formData.origin_setting_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, origin_setting_id: e.target.value }))}
                                    disabled={loading.origins || (originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE')}
                                >
                                    <option value="">Pilih Pengiriman Dari</option>
                                    {origins.map(origin => (
                                        <option key={origin.id} value={origin.id}>
                                            {origin.store_name} - {origin.origin_address}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Order
                                </label>
                                <input
                                    type="date"
                                    value={formData.order_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE'}
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
                                    } ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100' : ''}`}
                                    disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE'}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ongkos Kirim</label>
                                {formData.courier && (couriers.find(c => String(c.id) === String(formData.courier))?.name || '').toLowerCase().includes('tiki') ? (
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Service</label>
                                      <select
                                        value={typeof selectedRateIndex === 'number' ? selectedRateIndex : ''}
                                        onChange={(e) => handleServiceSelect(e.target.value)}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100' : ''}`}
                                        disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE'}
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
                                        value={formatRupiah(formData.shipping_cost)}
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
                                        value={formatRupiah(formData.shipping_cost)}
                                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_cost: parseRupiah(e.target.value) }))}
                                        className={`flex-1 px-3 py-2 border rounded-lg ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'border-gray-300 bg-gray-100' : (isShippingCostManuallyEdited ? 'border-blue-300 bg-blue-50' : 'border-gray-300')}`}
                                        disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE'}
                                      />
                                    </div>
                                    {originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' && (
                                      <p className="text-red-500 text-xs mt-1">Field ini tidak dapat diedit untuk order dari website resmi</p>
                                    )}
                                  </div>
                                )}
                            </div>

                            {!isWebOrder() && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diskon Manual (opsional)</label>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={formatRupiah(formData.manual_discount)}
                                  onChange={(e) => setFormData(prev => ({ ...prev, manual_discount: parseRupiah(e.target.value) }))}
                                  className={`w-full px-3 py-2 border rounded-lg ${errors.discount_amount ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.discount_amount && (
                                  <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.discount_amount) ? errors.discount_amount[0] : errors.discount_amount}</p>
                                )}
                              </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kurir
                                </label>
                                {/* Courier Select */}
                                <select
                                    value={formData.courier}
                                    onChange={(e) => setFormData(prev => ({ ...prev, courier: e.target.value }))}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE' ? 'bg-gray-100' : ''}`}
                                    disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE'}
                                >
                                    <option value="">Pilih kurir</option>
                                    {couriers.map((courier) => (
                                    <option key={courier.id} value={courier.id}>
                                        {courier.name}
                                        </option>
                                    ))}
                                </select>

                                {loading.couriers && (
                                    <p className="text-gray-500 text-xs mt-1">Memuat data kurir...</p>
                                )}
                                {originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website' && (
                                    <p className="text-red-500 text-xs mt-1">Field ini tidak dapat diedit untuk order dari website resmi</p>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Product & Summary */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Product Search */}
                        <div className="bg-white p-4 rounded-lg border">
                            {originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website' && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs text-red-700">Produk tidak dapat diubah untuk order dari website resmi</p>
                                </div>
                            )}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari produk untuk ditambahkan"
                                    value={searchTerms.product}
                                    onChange={(e) => setSearchTerms(prev => ({ ...prev, product: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website'}
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
                                                            <span className="text-sm font-medium">Rp {variant.price?.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                                                            <button
                                                                onClick={() => handleAddProduct(product, variant)}
                                                                disabled={variant.stock <= 0 || (originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website')}
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
                                                <p className="text-sm text-gray-500">{item.variant_name}</p>
                                                <p className="text-sm font-medium text-blue-600">Rp {item.price?.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            if (updatedItems[index].quantity > 1) {
                                                                updatedItems[index].quantity -= 1;
                                                                updatedItems[index].variant_stock = (updatedItems[index].variant_stock || 0) + 1;
                                                                setOrderItems(updatedItems);
                                                            }
                                                        }}
                                                        disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website'}
                                                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="text-lg font-bold">−</span>
                                                    </button>
                                                    
                                                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                    
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            const currentItem = updatedItems[index];
                                                            const additionalAvailable = currentItem.variant_stock || 0;
                                                            if (additionalAvailable > 0) {
                                                                updatedItems[index].quantity += 1;
                                                                updatedItems[index].variant_stock = additionalAvailable - 1;
                                                                setOrderItems(updatedItems);
                                                            } else {
                                                                Swal.fire({
                                                                    icon: 'warning',
                                                                    title: 'Stok Tidak Mencukupi',
                                                                    text: `Tidak ada stok tambahan tersedia untuk ${currentItem.variant_name}`,
                                                                    confirmButtonText: 'OK'
                                                                });
                                                            }
                                                        }}
                                                        disabled={(item.variant_stock || 0) <= 0 || (originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website')}
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
                                                    disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website'}
                                                    className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            {!isWebOrder() && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Kode Diskon</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value)}
                                            placeholder="Masukkan kode voucher (opsional) misal : DISKON100"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={validateVoucher}
                                            disabled={voucherLoading || !voucherCode.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
                                        >
                                            {voucherLoading ? 'Memeriksa...' : 'Gunakan'}
                                        </button>
                                        {voucher && (
                                            <button
                                                type="button"
                                                onClick={() => { setVoucher(null); setDiscountAmount(0); setVoucherCode(''); setVoucherError(''); }}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                    {voucherError && (
                                        <p className="text-red-500 text-xs mt-1">{voucherError}</p>
                                    )}
                                    {voucher && (
                                        <div className="mt-2 border rounded-lg p-3 bg-green-50 text-sm">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-green-700">{voucher.code}</p>
                                                    <p className="text-green-600">- {getVoucherLabel(voucher)}</p>
                                                    {voucher.type === 'shipping' && (
                                                        <p className="font-medium text-orange-600 flex items-center gap-1"><span>🚚</span> Potongan Ongkir</p>
                                                    )}
                                                    <p className="text-gray-700">{voucher.description || ''}</p>
                                                    <p className="text-green-700 font-semibold">Diskon: Rp {formatIDR(discountAmount)}</p>
                                                </div>
                                                <button type="button" onClick={() => { setVoucher(null); setDiscountAmount(0); setVoucherCode(''); setVoucherError(''); }} className="text-red-600">✕</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
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
                                    <span className="text-sm font-medium text-green-600">- Rp {Number(formData.manual_discount).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
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
                                disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website'}
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
                                disabled={originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website'}
                            />
                            {originalOrder?.sales_channel && originalOrder.sales_channel.code === 'website' && (
                                <p className="text-red-500 text-xs mt-1">Field ini tidak dapat diedit untuk order dari website resmi</p>
                            )}
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
                                disabled={loading.submitting || orderItems.length === 0 || (originalOrder?.sales_channel && originalOrder.sales_channel.code === 'WEBSITE')}
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading.submitting && (
                                    <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                                )}
                                {loading.submitting ? 'Menyimpan...' : 'Update Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
