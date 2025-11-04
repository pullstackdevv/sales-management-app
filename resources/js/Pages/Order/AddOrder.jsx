// resources/js/Pages/Order/AddOrder.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

export default function AddOrder() {
    // State management untuk form order
    const [formData, setFormData] = useState({
        customer_id: '',
        address_id: '',
        sales_channel_id: '',
        origin_setting_id: '',
        shipping_cost: 0,
        notes: '',
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        payment_status: 'pending',
        payment_bank_id: '',
        courier: ''
    });

    const [orderItems, setOrderItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesChannels, setSalesChannels] = useState([]);
    const [paymentBanks, setPaymentBanks] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [origins, setOrigins] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [isShippingCostManuallyEdited, setIsShippingCostManuallyEdited] = useState(false);
    
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
    const handleCourierSelect = (courierId) => {
        const selectedCourier = couriers.find(courier => courier.id == courierId);
        
        setFormData(prev => ({ 
            ...prev, 
            courier: courierId,
            // Auto-fill shipping cost only if not manually edited and courier has cost
            shipping_cost: !isShippingCostManuallyEdited && selectedCourier?.cost 
                ? parseFloat(selectedCourier.cost) 
                : prev.shipping_cost
        }));
    };

    // Handle manual shipping cost change
    const handleShippingCostChange = (value) => {
        setIsShippingCostManuallyEdited(true);
        setFormData(prev => ({ ...prev, shipping_cost: parseInt(value) || 0 }));
    };

    // Reset shipping cost to courier default
    const resetShippingCost = () => {
        const selectedCourier = couriers.find(courier => courier.id == formData.courier);
        if (selectedCourier?.cost) {
            setFormData(prev => ({ ...prev, shipping_cost: parseFloat(selectedCourier.cost) }));
            setIsShippingCostManuallyEdited(false);
        }
    };

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
        return calculateSubtotal() + (parseFloat(formData.shipping_cost) || 0);
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
                notes: formData.notes,
                status: formData.status,
                payment_status: formData.payment_status,
                payment_bank_id: formData.payment_bank_id || null,
                courier_id: formData.courier || null
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ongkos Kirim
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.shipping_cost}
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
                                        {isShippingCostManuallyEdited 
                                            ? 'Diedit manual' 
                                            : 'Otomatis dari kurir yang dipilih'
                                        }
                                    </p>
                                    {formData.courier && couriers.find(c => c.id == formData.courier)?.cost && (
                                        <p className="text-xs text-gray-400">
                                            Default: Rp {Number(couriers.find(c => c.id == formData.courier).cost).toLocaleString('id-ID')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status Pembayaran
                                </label>
                                <select 
                                    value={formData.payment_status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value, payment_bank_id: e.target.value === 'pending' ? '' : prev.payment_bank_id }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Pembayaran
                                </label>
                                <select 
                                    value={formData.payment_bank_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, payment_bank_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    disabled={formData.payment_status !== 'paid'}
                                >
                                    <option value="">Pilih bank</option>
                                    {(() => {
                                        console.log('🏦 All payment banks:', paymentBanks);
                                        const activeBanks = Array.isArray(paymentBanks) ? paymentBanks.filter(bank => bank.is_active) : [];
                                        console.log('🏦 Active banks:', activeBanks);
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
                                {formData.payment_status !== 'paid' && (
                                    <p className="text-gray-500 text-xs mt-1">Bank pembayaran hanya diperlukan untuk status 'paid'</p>
                                )}
                            </div>

                            <div>
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

                            <div className="flex items-center gap-2">
                                <input type="checkbox" />
                                <label className="text-sm">Add To Print Label</label>
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
                                                            <span className="text-sm font-medium">Rp {variant.price?.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
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
                                                <p className="text-sm font-medium text-blue-600 mt-1">Rp {item.price?.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
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
                            
                            <div className="flex justify-between pt-4 border-t font-semibold text-lg">
                                <span>TOTAL</span>
                                <span className="text-blue-600">Rp {calculateTotal().toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>
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
        </DashboardLayout>
    );
}