// resources/js/Pages/Order/EditOrder.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";
import { usePage } from '@inertiajs/react';

export default function EditOrder() {
    const { orderId } = usePage().props;

    // State management untuk form order
    const [formData, setFormData] = useState({
        customer_id: '',
        address_id: '',
        sales_channel_id: '',
        shipping_cost: 0,
        notes: '',
        order_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending'
    });

    const [orderItems, setOrderItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesChannels, setSalesChannels] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [originalOrder, setOriginalOrder] = useState(null);
    
    // Loading states
    const [loading, setLoading] = useState({
        customers: false,
        products: false,
        salesChannels: false,
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

    // Fetch existing order data
    const fetchOrder = async () => {
        setLoading(prev => ({ ...prev, order: true }));
        try {
            const response = await axios.get(`/api/orders/${orderId}`);
            const order = response.data.data;
            setOriginalOrder(order);
            
            // Set form data
            setFormData({
                customer_id: order.customer_id,
                address_id: order.address_id,
                sales_channel_id: order.sales_channel_id,
                shipping_cost: order.shipping_cost || 0,
                notes: order.notes || '',
                order_date: order.order_date ? order.order_date.split(' ')[0] : new Date().toISOString().split('T')[0],
                payment_status: order.payment_status || 'pending'
            });
            
            // Set order items
            setOrderItems(order.items?.map(item => ({
                product_variant_id: item.product_variant_id,
                product_name: item.product_variant?.product?.name || 'Unknown Product',
                variant_name: item.product_variant?.name || 'Default',
                quantity: item.quantity,
                price: item.price
            })) || []);
            
            // Set selected customer
            if (order.customer) {
                setSelectedCustomer(order.customer);
                setSearchTerms(prev => ({ ...prev, customer: order.customer.name }));
                setCustomerAddresses(order.customer.addresses || []);
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
            // Update quantity if item already exists
            const updatedItems = [...orderItems];
            updatedItems[existingItemIndex].quantity += 1;
            setOrderItems(updatedItems);
        } else {
            // Add new item
            const newItem = {
                product_variant_id: variant.id,
                product_name: product.name,
                variant_name: variant.name,
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
        return calculateSubtotal() + formData.shipping_cost;
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
                payment_status: formData.payment_status
            };

            const response = await axios.put(`/api/orders/${orderId}`, orderData);
            
            if (response.data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Berhasil Diupdate!',
                    text: `Order ID: ${orderId}`,
                    timer: 3000,
                    showConfirmButton: false
                });
                // Redirect back
                setTimeout(() => {
                    window.history.back();
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating order:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Gagal mengupdate order'
            });
        } finally {
            setLoading(prev => ({ ...prev, submitting: false }));
        }
    };

    // Load initial data
    useEffect(() => {
        if (orderId) {
            fetchOrder();
            fetchSalesChannels();
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
                        <h1 className="text-2xl font-bold text-gray-900">Edit Order #{originalOrder?.order_number || orderId}</h1>
                        <p className="text-gray-600 mt-1">
                            Edit order yang sudah ada
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
                                        {address.label} - {address.address}, {address.city}
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
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option>SP | Kemayoran Kota Jakarta Pusat</option>
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
                                    Ongkos Kirim
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.shipping_cost}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_cost: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
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
                        </div>
                    </div>

                    {/* Product & Summary */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Product Search */}
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari produk untuk ditambahkan"
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
                                                        <div>
                                                            <span className="text-sm font-medium">{variant.name}</span>
                                                            <span className="text-sm text-gray-500 ml-2">Stok: {variant.stock}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">Rp {variant.price?.toLocaleString('id-ID')}</span>
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
                                                <p className="text-sm text-gray-500">{item.variant_name}</p>
                                                <p className="text-sm font-medium text-blue-600">Rp {item.price?.toLocaleString('id-ID')}</p>
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
                                                        <Icon icon="solar:minus-outline" className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                    
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            updatedItems[index].quantity += 1;
                                                            setOrderItems(updatedItems);
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                                                    >
                                                        <Icon icon="solar:add-outline" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-medium">Rp {(item.quantity * item.price)?.toLocaleString('id-ID')}</p>
                                                </div>
                                                
                                                <button
                                                    onClick={() => {
                                                        const updatedItems = orderItems.filter((_, i) => i !== index);
                                                        setOrderItems(updatedItems);
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
                                <span className="text-sm font-medium">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-700">Ongkos Kirim</span>
                                <span className="text-sm font-medium">Rp {formData.shipping_cost.toLocaleString('id-ID')}</span>
                            </div>
                            
                            <div className="flex justify-between pt-4 border-t font-semibold text-lg">
                                <span>TOTAL</span>
                                <span className="text-blue-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Pembayaran
                            </label>
                            <select 
                                value={formData.payment_status}
                                onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="pending">Menunggu Pembayaran</option>
                                <option value="paid">Sudah Dibayar</option>
                                <option value="shipped">Sudah Dikirim</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>

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
                                {loading.submitting ? 'Menyimpan...' : 'Update Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}