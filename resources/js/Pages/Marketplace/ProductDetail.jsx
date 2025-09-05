import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { 
    ShoppingCart,
    CheckCircle,
    X,
    User,
    MapPin,
    Store,
} from 'lucide-react';
import { productsAPI } from '@/api/products';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { checkoutSession } from '@/utils/checkoutSession';

export default function ProductDetail() {
    console.log('ProductDetail component loaded');
    alert('ProductDetail component loaded');
    const { id } = usePage().props;
    console.log('Product ID from props:', id);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedVariant, setSelectedVariant] = useState(null);
    
    // Order states
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderFormData, setOrderFormData] = useState({
        customer_id: '',
        address_id: '',
        sales_channel_id: '',
        shipping_cost: 0,
        notes: '',
        order_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending'
    });
    const [customers, setCustomers] = useState([]);
    const [salesChannels, setSalesChannels] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [orderLoading, setOrderLoading] = useState({
        customers: false,
        salesChannels: false,
        submitting: false
    });
    const [orderErrors, setOrderErrors] = useState({});

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getProduct(id);
            // Laravel API returns {status: 'success', data: product}
            setProduct(response.data || response);
        } catch (err) {
            setError('Failed to load product details');
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
        }
    };

    // Mock product data - nanti akan diambil dari API
    const mockProduct = {
        id: 1,
        name: "Smartphone Samsung Galaxy A54 5G",
        price: 3500000,
        originalPrice: 4200000,
        rating: 4.5,
        reviewCount: 128,
        soldCount: 2450,
        stock: 15,
        images: [
            "/assets/images/products/dash-prd-1.jpg",
            "/assets/images/products/dash-prd-2.jpg",
            "/assets/images/products/dash-prd-3.jpg",
            "/assets/images/products/dash-prd-4.jpg"
        ],
        description: "Samsung Galaxy A54 5G adalah smartphone terbaru dengan performa tinggi dan kamera berkualitas. Dilengkapi dengan layar AMOLED 6.4 inch, chipset Exynos 1380, dan kamera triple 50MP yang memukau.",
        specifications: {
            "Layar": "6.4 inch AMOLED, 1080 x 2400 pixels",
            "Processor": "Exynos 1380 Octa-core",
            "RAM": "8GB",
            "Storage": "128GB (expandable up to 1TB)",
            "Kamera Belakang": "50MP + 12MP + 5MP",
            "Kamera Depan": "32MP",
            "Baterai": "5000mAh, 25W Fast Charging",
            "OS": "Android 13, One UI 5.1",
            "Warna": "Awesome Black, Awesome White, Awesome Green"
        },
        features: [
            "5G Connectivity",
            "IP67 Water & Dust Resistance",
            "25W Fast Charging",
            "Wireless PowerShare",
            "Samsung Knox Security",
            "Dolby Atmos Sound"
        ],
        reviews: [
            {
                id: 1,
                user: "Ahmad Rizki",
                rating: 5,
                date: "2024-01-15",
                comment: "Produk sangat bagus, pengiriman cepat dan aman. Smartphone ini memiliki performa yang luar biasa untuk gaming dan fotografi.",
                helpful: 12
            },
            {
                id: 2,
                user: "Siti Nurhaliza",
                rating: 4,
                date: "2024-01-10",
                comment: "Kamera sangat jernih, baterai tahan lama. Hanya sedikit masalah dengan fingerprint sensor yang kadang tidak responsif.",
                helpful: 8
            },
            {
                id: 3,
                user: "Budi Santoso",
                rating: 5,
                date: "2024-01-08",
                comment: "Worth it banget untuk harga segini. Performa smooth, kamera bagus, dan design yang elegan.",
                helpful: 15
            }
        ]
    };

    // Use fetched product or fallback to mock data
    const currentProduct = product || mockProduct;

    // Set default variant when product loads
    useEffect(() => {
        if (currentProduct && currentProduct.variants && currentProduct.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(currentProduct.variants[0]);
        }
    }, [currentProduct, selectedVariant]);

    // Get current price and stock based on selected variant
    const getCurrentPrice = () => {
        if (selectedVariant) {
            return selectedVariant.price;
        }
        return currentProduct.base_price || currentProduct.price;
    };

    const getCurrentStock = () => {
        if (selectedVariant) {
            return selectedVariant.stock;
        }
        return currentProduct.stock;
    };

    const getMaxQuantity = () => {
        const stock = getCurrentStock();
        return stock ? parseInt(stock) : 999;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const discount = currentProduct.originalPrice ? Math.round(((currentProduct.originalPrice - (currentProduct.base_price || currentProduct.price)) / currentProduct.originalPrice) * 100) : 0;

    const addToCart = () => {
        if (currentProduct.is_active !== false && selectedVariant && getCurrentStock() > 0) {
            const variantInfo = selectedVariant ? ` (${selectedVariant.variant_label})` : '';
            alert(`${currentProduct.name}${variantInfo} sebanyak ${quantity} berhasil ditambahkan ke keranjang!`);
        }
    };

    const buyNow = () => {
        console.log('buyNow called');
        console.log('currentProduct:', currentProduct);
        console.log('selectedVariant:', selectedVariant);
        console.log('quantity:', quantity);
        
        if (currentProduct.is_active !== false && selectedVariant && getCurrentStock() > 0) {
            // Initialize checkout session with product data
            const checkoutData = {
                product: currentProduct,
                variant: selectedVariant,
                quantity: quantity,
                price: getCurrentPrice()
            };
            
            console.log('Initializing checkout session with:', checkoutData);
            checkoutSession.initWithProduct(checkoutData);
            
            // Verify data was saved
            const savedData = checkoutSession.get();
            console.log('Data saved to session storage:', savedData);
            
            // Navigate to checkout flow
            console.log('Navigating to checkout.product');
            router.visit(route('checkout.product'));
        } else {
            console.log('buyNow conditions not met:', {
                isActive: currentProduct.is_active,
                hasVariant: !!selectedVariant,
                stock: getCurrentStock()
            });
        }
    };

    // Fetch customers dari API
    const fetchCustomers = async (search = '') => {
        setOrderLoading(prev => ({ ...prev, customers: true }));
        try {
            const response = await axios.get('/api/customers', {
                params: { search, per_page: 50 }
            });
            setCustomers(response.data.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setOrderLoading(prev => ({ ...prev, customers: false }));
        }
    };

    // Fetch sales channels dari API
    const fetchSalesChannels = async () => {
        setOrderLoading(prev => ({ ...prev, salesChannels: true }));
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
            setOrderLoading(prev => ({ ...prev, salesChannels: false }));
        }
    };

    // Handle customer selection
    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setOrderFormData(prev => ({ ...prev, customer_id: customer.id }));
        setCustomerAddresses(customer.addresses || []);
        setSearchCustomer(customer.name);
        
        // Auto select first address if available
        if (customer.addresses && customer.addresses.length > 0) {
            setOrderFormData(prev => ({ ...prev, address_id: customer.addresses[0].id }));
        }
    };

    // Handle order submission
    const handleOrderSubmit = async () => {
        setOrderLoading(prev => ({ ...prev, submitting: true }));
        setOrderErrors({});

        try {
            // Validation
            const newErrors = {};
            if (!orderFormData.customer_id) newErrors.customer_id = 'Customer harus dipilih';
            if (!orderFormData.address_id) newErrors.address_id = 'Alamat harus dipilih';
            if (!orderFormData.sales_channel_id) newErrors.sales_channel_id = 'Sales channel harus dipilih';
            if (!selectedVariant) newErrors.variant = 'Variant harus dipilih';

            if (Object.keys(newErrors).length > 0) {
                setOrderErrors(newErrors);
                return;
            }

            // Prepare data for API
            const orderData = {
                customer_id: parseInt(orderFormData.customer_id),
                address_id: parseInt(orderFormData.address_id),
                sales_channel_id: parseInt(orderFormData.sales_channel_id),
                items: [{
                    product_variant_id: selectedVariant.id,
                    quantity: quantity,
                    price: selectedVariant.price
                }],
                shipping_cost: orderFormData.shipping_cost,
                notes: orderFormData.notes
            };

            const response = await axios.post('/api/orders', orderData);
            
            if (response.data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Berhasil Dibuat!',
                    text: `Order ID: ${response.data.data?.id || 'N/A'}`,
                    timer: 3000,
                    showConfirmButton: false
                });
                setShowOrderModal(false);
                // Reset form
                setOrderFormData({
                    customer_id: '',
                    address_id: '',
                    sales_channel_id: '',
                    shipping_cost: 0,
                    notes: '',
                    order_date: new Date().toISOString().split('T')[0],
                    payment_status: 'pending'
                });
                setSelectedCustomer(null);
                setCustomerAddresses([]);
                setSearchCustomer('');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            if (error.response?.data?.errors) {
                setOrderErrors(error.response.data.errors);
            }
            Swal.fire({
                icon: 'error',
                title: 'Gagal Membuat Order',
                text: error.response?.data?.message || 'Terjadi kesalahan saat membuat order'
            });
        } finally {
            setOrderLoading(prev => ({ ...prev, submitting: false }));
        }
    };

    // Handle search debouncing for customers
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchCustomer && showOrderModal) {
                fetchCustomers(searchCustomer);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchCustomer, showOrderModal]);

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </MarketplaceLayout>
        );
    }

    if (error || !currentProduct) {
        return (
            <MarketplaceLayout>
                <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 text-lg mb-4">{error || 'Product not found'}</p>
                        <Link 
                            href="/marketplace"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Back to Marketplace
                        </Link>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Product Image */}
                        <div className="space-y-4">
                            <div className="aspect-square w-full rounded-sm overflow-hidden bg-white border border-gray-100">
                                <img 
                                    src={currentProduct.image || 'https://via.placeholder.com/600x600?text=No+Image'} 
                                    alt={currentProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl font-normal text-gray-800 leading-tight">
                                    {currentProduct.name}
                                </h1>
                            </div>

                            {/* Price */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl font-medium text-gray-900">
                                        {formatPrice(getCurrentPrice())}
                                    </span>
                                </div>
                                <p className={`text-sm ${
                                    currentProduct.is_active !== false && getCurrentStock() > 0 ? 'text-green-600' : 'text-red-500'
                                }`}>
                                    {currentProduct.is_active !== false && getCurrentStock() > 0 ? `Stok: ${getCurrentStock()}` : 'Tidak Tersedia'}
                                </p>
                            </div>

                            {/* Variants */}
                            {currentProduct.variants && currentProduct.variants.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-sm font-normal text-gray-600">
                                        Pilih Variant
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentProduct.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setQuantity(1); // Reset quantity when variant changes
                                                }}
                                                disabled={!variant.is_active || variant.stock <= 0}
                                                className={`p-3 text-left border rounded-sm text-sm transition-all duration-200 ${
                                                    selectedVariant?.id === variant.id
                                                        ? 'border-gray-700 bg-gray-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                } ${
                                                    !variant.is_active || variant.stock <= 0
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'cursor-pointer'
                                                }`}
                                            >
                                                <div className="font-normal text-gray-800">
                                                    {variant.variant_label}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {variant.stock > 0 ? `Stok: ${variant.stock}` : 'Habis'}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {formatPrice(variant.price)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="space-y-3">
                                <label className="text-sm font-normal text-gray-600">
                                    Jumlah
                                </label>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center border border-gray-200 rounded-sm bg-white">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1 || currentProduct.is_active === false || getCurrentStock() <= 0}
                                            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                                        >
                                            <span className="text-sm">-</span>
                                        </button>
                                        <span className="px-4 py-2 text-sm font-normal min-w-[40px] text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(Math.min(getMaxQuantity(), quantity + 1))}
                                            disabled={currentProduct.is_active === false || getCurrentStock() <= 0 || quantity >= getMaxQuantity()}
                                            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                                        >
                                            <span className="text-sm">+</span>
                                        </button>
                                    </div>
                                    {getCurrentStock() > 0 && (
                                        <span className="text-xs text-gray-400">
                                            Maksimal {getCurrentStock()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={addToCart}
                                    disabled={currentProduct.is_active === false || getCurrentStock() <= 0 || !selectedVariant}
                                    className={`w-full py-2.5 px-4 border text-sm font-normal transition-all duration-200 flex items-center justify-center ${
                                        currentProduct.is_active !== false && getCurrentStock() > 0 && selectedVariant
                                            ? 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white' 
                                            : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                    }`}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Tambah ke Keranjang
                                </button>
                                <button
                                    onClick={buyNow}
                                    disabled={currentProduct.is_active === false || getCurrentStock() <= 0 || !selectedVariant}
                                    className={`w-full py-2.5 px-4 text-sm font-normal transition-all duration-200 ${
                                        currentProduct.is_active !== false && getCurrentStock() > 0 && selectedVariant
                                            ? 'bg-gray-800 text-white hover:bg-gray-900' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Beli Sekarang
                                </button>
                            </div>


                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="bg-white rounded-sm border border-gray-100">
                        <div className="border-b border-gray-100">
                            <nav className="flex space-x-6 px-4">
                                {[
                                    { id: 'description', label: 'Deskripsi' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-3 px-1 border-b-2 text-sm font-normal ${
                                            activeTab === tab.id
                                                ? 'border-gray-700 text-gray-800'
                                                : 'border-transparent text-gray-500 hover:text-gray-600'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-4">
                            {activeTab === 'description' && (
                                <div className="prose max-w-none">
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {currentProduct.description || 'Deskripsi produk tidak tersedia.'}
                                    </p>
                                    {currentProduct.features && currentProduct.features.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-normal text-gray-800 mb-3 text-base">Fitur Utama:</h4>
                                            <ul className="space-y-2">
                                                {currentProduct.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center space-x-2">
                                                        <CheckCircle className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-600 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Buat Order</h2>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Product Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">Produk yang Dipesan</h3>
                                <div className="flex items-center space-x-3">
                                    <img 
                                        src={currentProduct.image || 'https://via.placeholder.com/60x60?text=No+Image'} 
                                        alt={currentProduct.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{currentProduct.name}</p>
                                        {selectedVariant && (
                                            <p className="text-xs text-gray-500">{selectedVariant.variant_label}</p>
                                        )}
                                        <p className="text-xs text-gray-600">
                                            {formatPrice(getCurrentPrice())} x {quantity} = {formatPrice(getCurrentPrice() * quantity)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    <User className="inline h-4 w-4 mr-1" />
                                    Customer
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari customer..."
                                        value={searchCustomer}
                                        onChange={(e) => setSearchCustomer(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            orderErrors.customer_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {orderLoading.customers && (
                                        <div className="absolute right-3 top-3">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                    
                                    {/* Customer dropdown */}
                                    {searchCustomer && customers.length > 0 && !selectedCustomer && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {customers.map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => handleCustomerSelect(customer)}
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                                >
                                                    <div className="font-medium text-sm">{customer.name}</div>
                                                    <div className="text-xs text-gray-500">{customer.email}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {orderErrors.customer_id && (
                                    <p className="text-red-500 text-xs">{orderErrors.customer_id}</p>
                                )}
                            </div>

                            {/* Address Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    <MapPin className="inline h-4 w-4 mr-1" />
                                    Alamat Pengiriman
                                </label>
                                <select
                                    value={orderFormData.address_id}
                                    onChange={(e) => setOrderFormData(prev => ({ ...prev, address_id: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        orderErrors.address_id ? 'border-red-500' : 'border-gray-300'
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
                                    <p className="text-gray-500 text-xs">Pilih customer terlebih dahulu</p>
                                )}
                                {selectedCustomer && customerAddresses.length === 0 && (
                                    <p className="text-yellow-600 text-xs">Customer belum memiliki alamat</p>
                                )}
                                {orderErrors.address_id && (
                                    <p className="text-red-500 text-xs">{orderErrors.address_id}</p>
                                )}
                            </div>

                            {/* Sales Channel */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    <Store className="inline h-4 w-4 mr-1" />
                                    Sales Channel
                                </label>
                                <select 
                                    value={orderFormData.sales_channel_id}
                                    onChange={(e) => setOrderFormData(prev => ({ ...prev, sales_channel_id: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                        orderErrors.sales_channel_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Pilih sales channel</option>
                                    {salesChannels.map((channel) => (
                                        <option key={channel.id} value={channel.id}>
                                            {channel.name} ({channel.code})
                                        </option>
                                    ))}
                                </select>
                                {orderLoading.salesChannels && (
                                    <p className="text-gray-500 text-xs">Memuat sales channels...</p>
                                )}
                                {orderErrors.sales_channel_id && (
                                    <p className="text-red-500 text-xs">{orderErrors.sales_channel_id}</p>
                                )}
                            </div>

                            {/* Shipping Cost */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Ongkos Kirim
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={orderFormData.shipping_cost}
                                    onChange={(e) => setOrderFormData(prev => ({ ...prev, shipping_cost: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Catatan
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Catatan untuk order ini..."
                                    value={orderFormData.notes}
                                    onChange={(e) => setOrderFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">Ringkasan Order</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatPrice(getCurrentPrice() * quantity)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Ongkos Kirim:</span>
                                        <span>{formatPrice(orderFormData.shipping_cost)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-base border-t pt-1">
                                        <span>Total:</span>
                                        <span>{formatPrice((getCurrentPrice() * quantity) + orderFormData.shipping_cost)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleOrderSubmit}
                                disabled={orderLoading.submitting}
                                className={`px-6 py-2 rounded-lg transition-colors ${
                                    orderLoading.submitting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-800 text-white hover:bg-gray-900'
                                }`}
                            >
                                {orderLoading.submitting ? 'Memproses...' : 'Buat Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MarketplaceLayout>
    );
}